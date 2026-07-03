// Intention-graph reconciler.
//
// The `intentions/` graph is the authoritative source of truth; GitHub is a
// derived projection. Backfill RECONCILES the gh-backed tactic leaves against
// that projection rather than wiping and regenerating them: it syncs the
// gh-derived fields IN and preserves every graph-owned field the dialectic (or
// a human) authored. It is STRICTLY READ-ONLY toward GitHub — the only GitHub
// calls are `gh api` GETs (open issues, an issue's /parent); it never writes to
// GitHub.
//
// Ownership is by frontmatter, never by filename. A tactic is BACKFILL-OWNED
// iff its `attributes.source` names a GitHub issue (`github:<owner>/<repo>#<N>`).
//   - gh-derived (synced from the issue each run): `statement` (title),
//     `parent` (issue hierarchy, nulled when the parent issue is closed),
//     `rationale` (body `## Scope`), and `attributes.source`.
//   - graph-owned (preserved untouched): everything else — `owner`, `status`,
//     `serves`, `recovers`, `attention`, `clarifications`, `tooling_goals`,
//     `success_signal`, `reading`, `gap`, and any other `attributes` keys.
//
// Each run:
//   1. PRUNE — delete a backfill-owned node whose source issue is no longer
//      open (transience: a completed tactic and its edges leave the graph).
//      Hand-authored tactics (no `attributes.source`) are NEVER touched; legacy
//      `issue-*.md` leaves are pruned unconditionally.
//   2. SKIP — an open issue a tracker maps to a hand-authored node id keeps
//      that node authoritative; no duplicate gh-shadow `tactic-<N>` is written.
//   3. RECONCILE — merge the gh-derived fields into an existing owned node, or
//      write a fresh leaf for a new open issue.
//
// Every other node — kind nodes, virtues, strategies, delegations, and
// hand-authored tactics — is authoritative and hand-maintained; backfill
// neither generates nor prunes those files. A terminal `validateGraph` gate
// fails loudly (rather than silently rewriting) when a hand-authored edge
// dangles a just-pruned tactic — a human fixes the authored node.
//
// Run from anywhere (the output dir is resolved relative to this file, not cwd):
//   npx tsx packages/intentionsutil/scripts/backfill.ts

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeNode, readNode, listNodes } from "../src/store.js";
import { issueToNodeId } from "../src/tracker.js";
import { ghErrorText } from "../src/errors.js";
import { paginateGhApi } from "./gh-utils.js";
import {
  validateGraph,
  type IntentionNode,
  type IntentionNodeInput,
} from "../src/schema.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/backfill.ts`, so the repo
// root is three directories up. Resolve from this file's own location, never
// from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");
const trackersDir = join(repoRoot, "trackers");

// --- Helpers ---------------------------------------------------------------

/**
 * Error from a `gh` invocation that carries the parsed HTTP status (when one
 * could be recovered from gh's output text). `gh api` exits 1 on an HTTP error
 * regardless of the status code, so the status is parsed from stderr/stdout, not
 * the exit code — see `parseHttpStatus`.
 */
export class GhError extends Error {
  readonly httpStatus: number | null;
  constructor(message: string, httpStatus: number | null, cause?: unknown) {
    super(message, { cause });
    this.name = "GhError";
    this.httpStatus = httpStatus;
  }
}

/** Extract an `HTTP <ddd>` status from gh's output text. Returns null if absent. */
export function parseHttpStatus(text: string): number | null {
  const m = /HTTP (\d{3})/.exec(text);
  return m ? Number(m[1]) : null;
}

/**
 * True when gh's output text indicates a transient failure worth retrying:
 * HTTP 429, any HTTP 5xx, or a rate-limit / availability phrase. Mirrors
 * `_gh_error_is_transient` in `.claude/skills/dispatch-propagate/scripts/lib.sh`.
 * A bare HTTP 403 is NOT treated as transient.
 */
export function isTransientGhError(text: string): boolean {
  return /HTTP 429|HTTP 5\d\d|secondary rate limit|abuse detection|retry your request|temporarily unavailable|Service Unavailable|Bad Gateway|timed out|i\/o timeout|deadline exceeded|connection reset|TLS handshake/i.test(
    text,
  );
}

/** Block the current thread for `ms` milliseconds (keeps the script synchronous). */
function sleepSync(ms: number): void {
  if (ms <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Run a `gh` subcommand and return stdout, retrying transient failures
 * (rate limits, 5xx) with exponential backoff. Throws a `GhError` on a
 * deterministic failure or once attempts are exhausted. Knobs are read per-call
 * from the environment so tests can tune them: GH_RETRY_ATTEMPTS (default 4),
 * GH_RETRY_BASE_DELAY_MS (default 1000).
 */
export function ghWithRetry(args: string[]): string {
  const attempts = Math.max(
    1,
    parseInt(process.env.GH_RETRY_ATTEMPTS ?? "4", 10) || 4,
  );
  const baseDelayMs = Number(process.env.GH_RETRY_BASE_DELAY_MS ?? "1000");
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return execFileSync("gh", args, { encoding: "utf8" });
    } catch (err) {
      const text = ghErrorText(err);
      if (attempt < attempts && isTransientGhError(text)) {
        sleepSync(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
      const status = parseHttpStatus(text);
      throw new GhError(
        `gh ${args.join(" ")} failed${status != null ? ` (HTTP ${status})` : ""}: ${text.trim()}`,
        status,
        err,
      );
    }
  }
  throw new Error("unreachable");
}

// --- Issue leaves from open GitHub issues ----------------------------------

interface RawIssueItem {
  number: number;
  title: string;
  body: string | null;
  pull_request?: unknown;
}

interface OpenIssue {
  number: number;
  title: string;
  body: string | null;
}

/**
 * Fetch all open issues (PRs excluded). The REST `/issues` endpoint includes
 * pull requests; any item carrying a `pull_request` key is a PR and is skipped.
 *
 * `--paginate --slurp` returns a single JSON array-of-arrays (one inner array
 * per page); we flatten it. This is robust regardless of page count.
 */
export function fetchOpenIssues(): OpenIssue[] {
  const items = paginateGhApi<RawIssueItem>(
    ["/repos/{owner}/{repo}/issues?state=open&per_page=100"],
    ghWithRetry,
  );
  return items
    .filter((it) => it.pull_request === undefined)
    .map((it) => ({
      number: it.number,
      title: it.title ?? "",
      body: it.body ?? null,
    }));
}

/**
 * Extract a `## Scope` section's text from an issue body: lines from `^## Scope`
 * to the next `^## ` or EOF, trimmed. Returns null when there is no such
 * section.
 */
export function extractScope(body: string | null): string | null {
  if (!body) return null;
  const lines = body.split("\n");
  const startIdx = lines.findIndex((l) => /^## Scope\s*$/.test(l));
  if (startIdx === -1) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  const text = lines.slice(startIdx + 1, endIdx).join("\n").trim();
  return text === "" ? null : text;
}

/**
 * Resolve an issue's GitHub parent number. The `/parent` endpoint 404s when
 * there is no parent — that, and only that, is the expected error: a real HTTP
 * 404 returns null. Any other failure (auth, or a rate limit already
 * retried+re-thrown by `ghWithRetry`) surfaces rather than being silently
 * nulled. Returns null when there is no parent.
 */
export function fetchParentNumber(issueNumber: number): number | null {
  let out: string;
  try {
    out = ghWithRetry([
      "api",
      `/repos/{owner}/{repo}/issues/${issueNumber}/parent`,
      "--jq",
      ".number",
    ]);
  } catch (err) {
    // Expected: no parent → /parent 404s. Only a real 404 means "no parent";
    // anything else (e.g. a rate limit already retried+re-thrown by
    // ghWithRetry) must surface rather than be silently nulled.
    if (err instanceof GhError && err.httpStatus === 404) return null;
    throw err;
  }
  const trimmed = out.trim();
  if (trimmed === "") return null;
  return Number(trimmed);
}

/**
 * Build the IntentionNodeInput for a tactic leaf node. Pure function — takes
 * the already-fetched issue and resolved parent string; does no network I/O.
 * `reading` is always null: it is sensor-populated, not backfill-populated.
 * `attributes.source` records the GitHub issue this tactic is generated from,
 * so the node file itself names its sync source.
 */
export function buildIssueNode(
  issue: OpenIssue,
  parent: string | null,
): IntentionNodeInput {
  return {
    id: `tactic-${issue.number}`,
    kind: "tactic",
    statement: issue.title.trim(),
    owner: "human",
    status: "raw", // not yet refined through the dialectic
    parent,
    rationale: extractScope(issue.body),
    reading: null, // sensor-populated measurement; null at backfill time
    attributes: { source: `github:natb1/commons.systems#${issue.number}` },
  };
}

// --- Main ------------------------------------------------------------------

/**
 * The GitHub issue number a node is backfill-owned by, or null when it is not
 * backfill-owned. Ownership is by frontmatter `attributes.source`
 * (`github:<owner>/<repo>#<N>`), NEVER by the `tactic-` filename prefix — a
 * hand-authored slug tactic (no `source`) returns null and is treated as
 * authoritative. Returns the parsed `<N>`.
 */
export function sourceIssueNumber(node: IntentionNode): number | null {
  const source = node.attributes.source;
  if (typeof source !== "string") return null;
  const m = /^github:[^/]+\/[^#]+#(\d+)$/.exec(source);
  return m ? Number(m[1]) : null;
}

/**
 * Prune the backfill-owned tactic leaves whose source issue is no longer open,
 * so completion removes a tactic and its edges from the graph. Ownership is
 * read from each node's `attributes.source` (see `sourceIssueNumber`), so
 * hand-authored tactics — which carry no `source` — are NEVER touched, and
 * neither are kind/virtue/strategy/delegation nodes or the `README.md`
 * companion doc. Legacy `issue-*.md` leaves (the pre-rename generated name) are
 * pruned unconditionally.
 */
export function pruneClosedOwned(dir: string, openNumbers: Set<number>): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md") || name === "README.md") continue;
    // Legacy generated leaves predate the frontmatter source contract; prune
    // them unconditionally before any readNode (they may not validate).
    if (name.startsWith("issue-")) {
      rmSync(join(dir, name));
      continue;
    }
    const node = readNode(dir, name.slice(0, -".md".length));
    const num = sourceIssueNumber(node);
    if (num !== null && !openNumbers.has(num)) {
      rmSync(join(dir, name));
    }
  }
}

/**
 * Reconcile one open issue into the graph.
 *
 * SKIP: when a tracker maps this issue to a non-`tactic-<N>` node id whose file
 * exists, that hand-authored node is authoritative — return without writing a
 * duplicate gh-shadow `tactic-<N>`.
 *
 * RECONCILE: resolve `parent` from the GitHub hierarchy (only linking a parent
 * that is itself open, so every non-null parent points to an existing node). If
 * `tactic-<N>.md` already exists, merge the gh-derived fields into the existing
 * node and preserve every graph-owned field. Otherwise write a fresh leaf.
 */
export function reconcileIssue(
  intentionsDir: string,
  trackersDir: string,
  issue: OpenIssue,
  openNumbers: Set<number>,
): void {
  const tacticId = `tactic-${issue.number}`;
  const mappedId = issueToNodeId(issue.number, trackersDir);
  if (mappedId !== tacticId && existsSync(join(intentionsDir, `${mappedId}.md`))) {
    return;
  }

  // Referential integrity: only link a parent that is itself an open issue (and
  // thus has a node file). A CLOSED GitHub parent has no node file, so its
  // dangling reference is nulled. gh hierarchy wins on gh-backed tactics during
  // the transition; the parent id stays `tactic-<P>` even when P is slug-mapped.
  const parentNum = fetchParentNumber(issue.number);
  const parent =
    parentNum !== null && openNumbers.has(parentNum) ? `tactic-${parentNum}` : null;

  const source = `github:natb1/commons.systems#${issue.number}`;
  if (existsSync(join(intentionsDir, `${tacticId}.md`))) {
    // Reconcile in place: sync gh-derived fields, preserve graph-owned fields.
    const existing = readNode(intentionsDir, tacticId);
    writeNode(intentionsDir, {
      ...existing,
      statement: issue.title.trim(),
      parent,
      rationale: extractScope(issue.body),
      attributes: { ...existing.attributes, source },
    });
  } else {
    // New open issue: write a fresh tactic leaf.
    writeNode(intentionsDir, buildIssueNode(issue, parent));
  }
}

function main(): void {
  mkdirSync(intentionsDir, { recursive: true });

  // Collect the full set of open issue numbers (PRs already excluded) so both
  // prune and parent-membership checks can see it.
  const openIssues = fetchOpenIssues();
  const openNumbers = new Set(openIssues.map((i) => i.number));

  // Prune backfill-owned leaves whose source issue closed; hand-authored
  // tactics are left untouched.
  pruneClosedOwned(intentionsDir, openNumbers);

  // Reconcile each remaining open issue: sync gh-derived fields, preserve
  // graph-owned fields, and skip issues a tracker maps to a hand-authored node.
  for (const issue of openIssues) {
    reconcileIssue(intentionsDir, trackersDir, issue, openNumbers);
  }

  // Whole-graph integrity gate: every kind resolves to a committed kind node,
  // every parent/serves/recovers edge resolves to a node file. A hand-authored
  // node whose edge points at a just-pruned tactic fails here with a clear
  // error — intended: a human fixes the authored node; backfill does not
  // silently rewrite hand-authored files.
  validateGraph(listNodes(intentionsDir));

  console.log(
    `Backfill complete: ${openIssues.length} open issues reconciled → ${intentionsDir}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
