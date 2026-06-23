// Read-only GitHub→tree execution-state refresh.
//
// Populates the separate execution-state store `trackers/<id>.json` from GitHub.
// It is STRICTLY READ-ONLY toward GitHub: the only GitHub calls are `gh api`
// GETs (an issue's state/labels, the repo's pulls list) plus a single
// `gh issue view` read; it issues NO GitHub writes (no --method POST/PATCH/PUT).
//
// Split-authority invariant: this module does NOT import `writeNode` (nor
// anything from ../src/store.js except `listNodes`, which is read-only). The
// intention tree owns intention and is never touched here; GitHub owns
// execution, mirrored one-way into the tracker store. The non-import of
// `writeNode` is the diff-checkable expression of that split.
//
// Run from anywhere (paths resolve relative to this file, not cwd):
//   npx tsx intentionsutil/scripts/refresh.ts <node-id>   # refresh one node
//   npx tsx intentionsutil/scripts/refresh.ts             # refresh all

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  writeTracker,
  nodeIdToIssue,
  listTrackers,
  type ExecutionTracker,
} from "../src/tracker.js";
import { listNodes } from "../src/store.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `intentionsutil/scripts/refresh.ts`, so the repo root is
// two directories up. Resolve from this file's own location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(scriptDir));
const intentionsDir = join(repoRoot, "intentions");
const trackersDir = join(repoRoot, "trackers");

// --- Helpers ---------------------------------------------------------------

/** Run a `gh` subcommand and return stdout. Throws on non-zero exit. */
function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 });
}

// --- GitHub JSON shapes ----------------------------------------------------

interface RawLabel {
  name: string;
}

interface RawIssue {
  state: "open" | "closed";
  labels: RawLabel[];
}

interface RawPull {
  number: number;
  state: "open" | "closed";
  merged_at: string | null;
  head: { ref: string };
}

interface ClosingPrRef {
  number: number;
}

interface IssueView {
  closedByPullRequestsReferences: ClosingPrRef[];
}

export type LinkedPr = { number: number; state: "open" | "closed" | "merged" };

// --- Linked-PR resolution (two-stage) --------------------------------------

/**
 * Fetch the full repo pulls list once. Returns a flat `RawPull[]` across all
 * paginated pages. Callers should fetch this once and pass it to
 * `resolveLinkedPrs` — do NOT call inside a per-node loop.
 */
export function fetchAllPulls(): RawPull[] {
  const pullsOut = gh([
    "api",
    "--paginate",
    "--slurp",
    "/repos/{owner}/{repo}/pulls?state=all&per_page=100",
  ]);
  const pages: RawPull[][] = JSON.parse(pullsOut);
  return pages.flat();
}

/**
 * Resolve the PRs linked to an issue, combining two authorities:
 *
 *   Stage 1 (REST branch-prefix): every PR whose head branch starts with
 *     `<N>-` — the dispatch branch-naming convention. Catches an open
 *     in-progress PR that is not yet recorded as a closing reference.
 *
 *   Stage 2 (GraphQL closingReferences): the issue's own
 *     `closedByPullRequestsReferences` supplies WHICH extra PR numbers to
 *     include (the branch-renamed / closing-ref case stage 1 misses). The
 *     porcelain returns only each reference's number — not its state — so the
 *     state for each such PR is read from the stage-1 pulls list, which already
 *     holds every repo PR (`--paginate&state=all`) with `merged_at` and
 *     `state`. No second GitHub call.
 *
 * The two lists are merged and deduped by PR number. Stage 1 wins on a number
 * conflict; either way the `LinkedPr` (with its `merged_at`-derived state) comes
 * from the same already-fetched pulls list.
 */
export function resolveLinkedPrs(issueNumber: number, allPulls: RawPull[]): LinkedPr[] {
  const byNumber = new Map<number, LinkedPr>();

  // Stage 1: REST pulls list, branch-prefix filtered.
  // Single pass over allPulls: record every fetched pull (by number, state
  // derived once) in `pullsByNumber` so both stages can source their `LinkedPr`
  // from here, and in the same iteration populate stage 1's branch-prefix
  // matches in `byNumber`.
  const pullsByNumber = new Map<number, LinkedPr>();
  const prefix = `${issueNumber}-`;
  for (const pr of allPulls) {
    const entry: LinkedPr = {
      number: pr.number,
      state: pr.merged_at !== null ? "merged" : pr.state,
    };
    pullsByNumber.set(pr.number, entry);
    if (pr.head.ref.startsWith(prefix)) {
      byNumber.set(pr.number, entry);
    }
  }

  // Stage 2: closing references (branch-renamed / closing-ref case). Each
  // reference supplies only a PR number; its state is read from the stage-1
  // pulls list (`pullsByNumber`).
  // `gh issue view` exits non-zero if the issue was deleted or transferred;
  // that is the one documented expected error, caught here so a missing issue
  // yields an empty stage-2 list rather than aborting (mirrors backfill.ts's
  // /parent 404 discipline).
  let viewOut: string | null = null;
  try {
    // lint-allow: gh-rest-porcelain GraphQL-only closedByPullRequestsReferences (no REST equivalent)
    viewOut = gh(["issue", "view", String(issueNumber), "--json", "closedByPullRequestsReferences"]);
  } catch {
    // Expected: issue deleted/transferred → treat as no closing references.
    viewOut = null;
  }
  if (viewOut !== null) {
    const view: IssueView = JSON.parse(viewOut);
    for (const ref of view.closedByPullRequestsReferences) {
      // Stage 1 wins on conflict: only add a number stage 1 did not already see.
      if (!byNumber.has(ref.number)) {
        const linked = pullsByNumber.get(ref.number);
        if (linked === undefined) {
          throw new Error(
            `refresh: closing-reference PR #${ref.number} for issue #${issueNumber} ` +
              `is absent from the repo pulls list; cannot resolve its state ` +
              `(a same-repo PR should always be present given --paginate)`,
          );
        }
        byNumber.set(ref.number, linked);
      }
    }
  }

  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}

// --- Per-node refresh ------------------------------------------------------

/**
 * Refresh one node's execution tracker from GitHub. Returns the written record,
 * or null when the node does not resolve to an issue number (an un-emitted node
 * such as a principle root or a `goal-foo` with no tracker) — that case is
 * logged and skipped.
 */
function refreshNode(nodeId: string, allPulls: RawPull[]): ExecutionTracker | null {
  const issueNumber = nodeIdToIssue(nodeId, trackersDir);
  if (issueNumber === null) {
    console.warn(`refresh: node "${nodeId}" does not resolve to an issue number; skipping`);
    return null;
  }

  // Issue state + dispatch labels.
  const issueOut = gh(["api", `/repos/{owner}/{repo}/issues/${issueNumber}`]);
  const issue: RawIssue = JSON.parse(issueOut);
  const dispatchLabels = issue.labels
    .map((l) => l.name)
    .filter((n) => n.startsWith("dispatch:"))
    .sort();

  const linkedPrs = resolveLinkedPrs(issueNumber, allPulls);

  const record: ExecutionTracker = {
    node_id: nodeId,
    issue_number: issueNumber,
    state: issue.state,
    linked_prs: linkedPrs,
    dispatch_labels: dispatchLabels,
    refreshed_at: new Date().toISOString(),
  };
  writeTracker(trackersDir, record);
  return record;
}

// --- Main ------------------------------------------------------------------

/**
 * Collect the union of node ids to refresh in no-arg mode: every intention node
 * id plus every existing tracker's node id, deduped. Either directory may be
 * absent on a fresh checkout (trackers/ especially), so a missing dir is
 * treated as an empty list rather than thrown.
 */
function allNodeIds(): string[] {
  const ids = new Set<string>();
  if (existsSync(intentionsDir)) {
    for (const n of listNodes(intentionsDir)) ids.add(n.id);
  }
  if (existsSync(trackersDir)) {
    for (const t of listTrackers(trackersDir)) ids.add(t.node_id);
  }
  return [...ids].sort();
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    const nodeId = args[0];
    // Resolve the node to an issue BEFORE the expensive O(N) pulls fetch: a
    // principle root or unresolvable node id would make fetchAllPulls() wasted
    // work, since refreshNode() returns null without consuming the pulls list.
    if (nodeIdToIssue(nodeId, trackersDir) === null) {
      console.warn(`refresh: node "${nodeId}" does not resolve to an issue number; skipping`);
      return;
    }
    const allPulls = fetchAllPulls();
    const record = refreshNode(nodeId, allPulls);
    if (record !== null) {
      console.log(`Refreshed ${record.node_id} (issue #${record.issue_number}) → ${trackersDir}`);
    }
    return;
  }

  const nodeIds = allNodeIds();
  const allPulls = fetchAllPulls();
  let refreshed = 0;
  for (const nodeId of nodeIds) {
    if (refreshNode(nodeId, allPulls) !== null) refreshed++;
  }
  console.log(
    `Refresh complete: ${refreshed} of ${nodeIds.length} nodes resolved to issues → ${trackersDir}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
