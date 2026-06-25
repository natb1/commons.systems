// Read-only intention-tree backfill.
//
// Snapshots the current project state into intention nodes under the repo-root
// `intentions/` directory. It is STRICTLY READ-ONLY toward GitHub: the only
// GitHub calls are `gh api` GETs (open issues, an issue's /parent). It never
// writes to GitHub.
//
// It produces two internally-linked layers that share one id space:
//   (a) PRINCIPLE ROOTS — authoritative, hand-maintained, parent-less nodes
//       that this script no longer generates; backfill manages only the
//       issue-leaf layer, and
//   (b) ISSUE LEAVES from open GitHub issues, linked to one another by the
//       existing GitHub issue hierarchy (`/parent`).
// There is intentionally NO cross-layer principle<->issue link; that is
// deferred dialectic work in a later epic stage.
//
// Run from anywhere (the output dir is resolved relative to this file, not cwd):
//   npx tsx intentionsutil/scripts/backfill.ts

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeNode } from "../src/store.js";
import { ghErrorText } from "../src/errors.js";
import { paginateGhApi } from "./gh-utils.js";
import type { IntentionNodeInput } from "../src/schema.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `intentionsutil/scripts/backfill.ts`, so the repo root is
// two directories up. Resolve from this file's own location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(scriptDir));
const intentionsDir = join(repoRoot, "intentions");

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
 * Build the IntentionNodeInput for an issue leaf node. Pure function — takes
 * the already-fetched issue and resolved parent string; does no network I/O.
 * `reading` is always null: it is sensor-populated, not backfill-populated.
 */
export function buildIssueNode(
  issue: OpenIssue,
  parent: string | null,
): IntentionNodeInput {
  return {
    id: `issue-${issue.number}`,
    statement: issue.title.trim(),
    owner: "human",
    status: "raw", // not yet refined through the dialectic
    parent,
    rationale: extractScope(issue.body),
    reading: null, // sensor-populated measurement; null at backfill time
  };
}

// --- Main ------------------------------------------------------------------

/**
 * Remove the issue-leaf node files (`issue-*.md`) that main() regenerates, so
 * a rerun is a true point-in-time snapshot of the open issues — without this,
 * a leaf whose source disappeared (a closed issue) would linger as a stale
 * orphan. Pruning is deliberately scoped to exactly what backfill
 * regenerates: principle roots (`principle-*.md`) are authoritative and
 * hand-maintained, and `README.md` is a companion doc, so neither matches
 * `issue-*.md` and both survive.
 */
export function pruneStaleNodes(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name.startsWith("issue-") && name.endsWith(".md")) {
      rmSync(join(dir, name));
    }
  }
}

function main(): void {
  mkdirSync(intentionsDir, { recursive: true });
  pruneStaleNodes(intentionsDir);

  // Issue leaves — two passes.
  // Pass 1: collect the full set of open issue numbers (PRs already excluded)
  // so parent membership can be checked.
  const openIssues = fetchOpenIssues();
  const openNumbers = new Set(openIssues.map((i) => i.number));

  // Pass 2: build and write each node.
  for (const issue of openIssues) {
    const parentNum = fetchParentNumber(issue.number);
    // Referential integrity: only link a parent that is itself an open issue
    // (and thus has a node file). A GitHub parent that is CLOSED has no node
    // file, so its dangling reference is nulled rather than emitted. Every
    // non-null parent therefore points to an existing node file.
    const parent =
      parentNum !== null && openNumbers.has(parentNum) ? `issue-${parentNum}` : null;

    writeNode(intentionsDir, buildIssueNode(issue, parent));
  }

  console.log(
    `Backfill complete: ${openIssues.length} issue leaves → ${intentionsDir}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
