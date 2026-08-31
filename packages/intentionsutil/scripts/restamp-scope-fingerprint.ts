// restamp-scope-fingerprint — the single home of the scope-custody
// stamp-write recipe, with two content sources.
//
// The chain-of-custody gate demotes an in-flight tactic to phase `implement`
// whenever its worktree-local `.scope-fingerprint` stamp no longer matches
// the current `tacticScopeFingerprint(statement, body)`. This script
// re-stamps it, from either of two content sources:
//
//   - disk mode (`restampScope`): reads `intentionsDir`'s on-disk
//     `<id>.md` and the current `origin/main` sha — the original
//     author-present align-round use case (an align round classifies its own
//     tactic-body edit as scope-inert and needs to re-stamp so the next
//     freshness check does not demote the tactic for an edit a human already
//     classified as harmless).
//   - git-rev mode (`restampScopeFromRev`): reads the node's committed text
//     at a specific git rev via `git show <sha>:<path>`, not the working
//     tree — needed by callers that stamp AFTER a `git reset --hard` cycle
//     (e.g. `graph-commit`'s land-then-restore), where the worktree no
//     longer reflects what actually landed on `origin/main`.
//
// The fail-open vs fail-loud distinction belongs to CALLERS, not to this
// script: every function here always fails LOUD (every error propagates,
// nothing is swallowed). The align re-stamp caller lets that surface
// directly, since it follows an explicit human classification decision and a
// silent failure there would leave the align round believing the stamp was
// refreshed when it was not. `transition-node`'s `refresh_stamp()` caller
// instead wraps the call in its own best-effort contract: it captures this
// script's non-zero exit and its stderr, emits a
// `transition-node: refresh_stamp failed for <id> (best-effort, continuing):
// <message>` diagnostic, and returns 0 so the transition proceeds. Fail-open,
// but not fail-silent — the diagnostic is what makes a missing or stale stamp
// traceable in worker logs.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/restamp-scope-fingerprint.ts \
//     [--repo-root <dir>] [--main-root <dir>] [--from-rev <rev>] <id>
//
// Writes `<mainRoot>/.claude/worktrees/<id>.scope-fingerprint` with content
// `<fingerprint> <sha>\n` (matching `parseScopeStamp` in
// packages/intentionsutil/src/transitions.ts, which splits on whitespace and
// expects exactly two fields), and prints the same line to stdout — in both
// modes.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tacticScopeFingerprint } from "../src/router.js";
import { readNode, readNodeBody, parseNodeRaw, assertPathSafeId } from "../src/store.js";
import { extractBody } from "../src/frontmatter.js";

// --- Paths -------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd. (dump-node.ts and write-node.ts used to share this
// shape; clarification 194/242 converted them to a required --dir. This script
// keeps a script-relative DEFAULT, overridable by --repo-root, and is out of
// that clarification's scope.)
const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = dirname(dirname(dirname(scriptDir)));

const USAGE =
  "usage: restamp-scope-fingerprint.ts [--repo-root <dir>] [--main-root <dir>] [--from-rev <rev>] <id>\n" +
  "  Re-stamps <main-root>/.claude/worktrees/<id>.scope-fingerprint with the\n" +
  "  current tacticScopeFingerprint(statement, body) and a resolved sha.\n" +
  "  By default reads the node from disk (intentionsDir) and stamps against\n" +
  "  origin/main. With --from-rev <rev>, reads the node's committed text at\n" +
  "  <rev> via 'git show' instead, and stamps against <rev>'s resolved sha.\n" +
  "  Prints '<fingerprint> <sha>' to stdout on success.\n";

// --- Core helpers (exported for tests) -----------------------------------

/**
 * Compute `tacticScopeFingerprint(statement, body)` and write
 * `<mainRoot>/.claude/worktrees/<id>.scope-fingerprint` as
 * `<fingerprint> <sha>\n`. Shared by both content sources (`restampScope`
 * and `restampScopeFromRev`) — this is the write half of the recipe; the two
 * callers differ only in how they obtain `statement`/`body`/`sha`.
 *
 * `id` is validated here, at the single write seam, rather than in each
 * caller: `restampScope` inherits `assertPathSafeId` incidentally via
 * `readNode`, but `restampScopeFromRev` reads through `git show` and never
 * touches that path, so without this call an id containing a separator would
 * reach `join(mainRoot, ".claude", "worktrees", ...)` + `mkdirSync(...,
 * { recursive: true })` and write outside the worktrees directory.
 */
export function writeScopeStamp(
  mainRoot: string,
  id: string,
  statement: string,
  body: string,
  sha: string,
): { fingerprint: string; sha: string } {
  assertPathSafeId(id);
  const fingerprint = tacticScopeFingerprint(statement, body);

  const stampPath = join(mainRoot, ".claude", "worktrees", `${id}.scope-fingerprint`);
  mkdirSync(dirname(stampPath), { recursive: true });
  writeFileSync(stampPath, `${fingerprint} ${sha}\n`);

  return { fingerprint, sha };
}

/**
 * Re-stamp the worktree-local scope-custody stamp for tactic `id`.
 *
 * Reads the node's current statement/body from `intentionsDir`, resolves the
 * current `origin/main` sha from `repoRoot`, and writes the stamp via
 * `writeScopeStamp`.
 *
 * Unlike transition-node's `refresh_stamp()`, this function propagates every
 * failure (a nonexistent node id, a git failure, a write failure) as a
 * thrown error rather than swallowing it — the caller is expected to be an
 * explicit human-invoked re-stamp action, not a best-effort background step.
 */
export function restampScope(
  intentionsDir: string,
  repoRoot: string,
  mainRoot: string,
  id: string,
): { fingerprint: string; sha: string } {
  const statement = readNode(intentionsDir, id).statement;
  const body = readNodeBody(intentionsDir, id);
  const sha = execFileSync("git", ["rev-parse", "origin/main"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  return writeScopeStamp(mainRoot, id, statement, body, sha);
}

/**
 * Re-stamp the worktree-local scope-custody stamp for tactic `id` from its
 * COMMITTED text at `rev`, not the working tree.
 *
 * Resolves `rev` to a sha once, then reads the node's text at that exact sha
 * via `git show <sha>:<path>` — avoiding a TOCTOU where the resolved sha and
 * the read content could diverge across a concurrent `origin/main` advance.
 * This is the content source `transition-node` needs after a `graph-commit`
 * land-then-restore cycle, where the worktree has already been reset back to
 * the pre-transition branch tip and so no longer reflects what actually
 * landed.
 *
 * Fails LOUD on every error (a path-unsafe id, nonexistent rev, nonexistent
 * path at that rev, parse failure, write failure) — same contract as
 * `restampScope`.
 */
export function restampScopeFromRev(
  repoRoot: string,
  mainRoot: string,
  id: string,
  rev: string,
  intentionsDir?: string,
): { fingerprint: string; sha: string } {
  // `id` becomes a path component of `gitPath` below. `restampScope` gets this
  // check for free via `readNode`; this path never touches `readNode`, so it
  // asks explicitly — and here rather than only at `writeScopeStamp`, so the
  // error names the real problem instead of surfacing as an opaque
  // `git show` "path does not exist".
  assertPathSafeId(id);

  const sha = execFileSync("git", ["rev-parse", rev], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  const relPath = relative(repoRoot, intentionsDir ?? join(repoRoot, "intentions"));
  const normalizedRelPath = relPath.split(sep).join("/");
  const gitPath = `${normalizedRelPath}/${id}.md`;

  const raw = execFileSync("git", ["show", `${sha}:${gitPath}`], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });

  const statement = parseNodeRaw(raw, id).statement;
  const body = extractBody(raw, id);

  return writeScopeStamp(mainRoot, id, statement, body, sha);
}

// --- Main ----------------------------------------------------------------

function resolveMainRoot(repoRoot: string): string {
  const gitCommonDir = execFileSync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { cwd: repoRoot, encoding: "utf8" },
  ).trim();
  return dirname(gitCommonDir);
}

function run(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE);
    return;
  }

  let repoRoot = defaultRepoRoot;
  const repoRootIdx = args.indexOf("--repo-root");
  if (repoRootIdx !== -1) {
    const v = args[repoRootIdx + 1];
    if (!v) {
      process.stderr.write("restamp-scope-fingerprint: --repo-root requires a directory argument\n" + USAGE);
      process.exit(1);
    }
    repoRoot = v;
  }

  // Capture the --main-root override but do NOT resolve the main root yet: when
  // it is supplied we must not shell out to git at all, and when it is absent
  // the resolution must run inside the try/catch below so a git failure surfaces
  // through the clean error path rather than as an uncaught throw.
  const mainRootIdx = args.indexOf("--main-root");
  let mainRootValue: string | null = null;
  if (mainRootIdx !== -1) {
    const v = args[mainRootIdx + 1];
    if (!v) {
      process.stderr.write("restamp-scope-fingerprint: --main-root requires a directory argument\n" + USAGE);
      process.exit(1);
    }
    mainRootValue = v;
  }

  const fromRevIdx = args.indexOf("--from-rev");
  let fromRevValue: string | null = null;
  if (fromRevIdx !== -1) {
    const v = args[fromRevIdx + 1];
    if (!v) {
      process.stderr.write("restamp-scope-fingerprint: --from-rev requires a rev argument\n" + USAGE);
      process.exit(1);
    }
    fromRevValue = v;
  }

  const intentionsDir = join(repoRoot, "intentions");

  // Indices consumed by recognized flags and their values. Anything left that
  // begins with `-` is an unrecognized flag: reject it (mirroring
  // compute-freshness.ts) rather than silently dropping it as a fallback.
  const consumed = new Set<number>();
  if (repoRootIdx !== -1) {
    consumed.add(repoRootIdx);
    consumed.add(repoRootIdx + 1);
  }
  if (mainRootIdx !== -1) {
    consumed.add(mainRootIdx);
    consumed.add(mainRootIdx + 1);
  }
  if (fromRevIdx !== -1) {
    consumed.add(fromRevIdx);
    consumed.add(fromRevIdx + 1);
  }
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (consumed.has(i)) continue;
    const a = args[i];
    if (a.startsWith("-")) {
      process.stderr.write(`restamp-scope-fingerprint: unknown flag '${a}'\n` + USAGE);
      process.exit(1);
    }
    positional.push(a);
  }
  if (positional.length !== 1) {
    process.stderr.write("restamp-scope-fingerprint: exactly one node id is required\n" + USAGE);
    process.exit(1);
  }
  const id = positional[0];

  try {
    const mainRoot = mainRootValue ?? resolveMainRoot(repoRoot);
    const { fingerprint, sha } = fromRevValue
      ? restampScopeFromRev(repoRoot, mainRoot, id, fromRevValue, intentionsDir)
      : restampScope(intentionsDir, repoRoot, mainRoot, id);
    process.stdout.write(`${fingerprint} ${sha}\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`restamp-scope-fingerprint: ${message}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
