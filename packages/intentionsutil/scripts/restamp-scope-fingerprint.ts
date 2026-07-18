// restamp-scope-fingerprint — re-stamp a tactic's worktree-local
// scope-custody stamp after an author-present align round classifies its own
// tactic-body edit as scope-inert (tactic-scope-inert-restamp-primitive
// Unit 1).
//
// The chain-of-custody gate demotes an in-flight tactic to phase `implement`
// whenever its worktree-local `.scope-fingerprint` stamp no longer matches
// the current `tacticScopeFingerprint(statement, body)`. When an align round
// edits a tactic's body in a way that does NOT change its scope (a
// scope-inert edit — e.g. wording, formatting, a residue note that does not
// alter what the tactic commits to), it needs a way to re-stamp so the next
// freshness check does not demote the tactic for an edit a human already
// classified as harmless. This script performs exactly that mechanical
// re-stamp, once told to.
//
// This is a standalone TypeScript PORT of transition-node's `refresh_stamp()`
// bash recipe (`.claude/skills/dispatch-propagate/scripts/transition-node:85-98`),
// NOT a shared helper — the two have different failure-mode contracts:
// `refresh_stamp()` is a best-effort background refresh that fails OPEN (every
// step is guarded by `|| return 0`, so a failure silently no-ops); this script
// fails LOUD, because it IS the re-stamp action following a human
// classification decision — a silent failure here would leave the align round
// believing the stamp was refreshed when it was not. This unit does not
// modify `transition-node` or its `refresh_stamp()` function in any way; that
// script keeps working exactly as it does today.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/restamp-scope-fingerprint.ts \
//     [--repo-root <dir>] [--main-root <dir>] <id>
//
// Writes `<mainRoot>/.claude/worktrees/<id>.scope-fingerprint` with content
// `<fingerprint> <sha>\n` (matching `parseScopeStamp` in
// packages/intentionsutil/src/transitions.ts, which splits on whitespace and
// expects exactly two fields), and prints the same line to stdout.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tacticScopeFingerprint } from "../src/router.js";
import { readNode, readNodeBody } from "../src/store.js";

// --- Paths -------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/restamp-scope-fingerprint.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd — matching dump-node.ts.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = dirname(dirname(dirname(scriptDir)));

const USAGE =
  "usage: restamp-scope-fingerprint.ts [--repo-root <dir>] [--main-root <dir>] <id>\n" +
  "  Re-stamps <main-root>/.claude/worktrees/<id>.scope-fingerprint with the\n" +
  "  current tacticScopeFingerprint(statement, body) and the current\n" +
  "  origin/main sha. Prints '<fingerprint> <sha>' to stdout on success.\n";

// --- Core helper (exported for tests) -----------------------------------

/**
 * Re-stamp the worktree-local scope-custody stamp for tactic `id`.
 *
 * Reads the node's current statement/body from `intentionsDir`, recomputes
 * `tacticScopeFingerprint`, resolves the current `origin/main` sha from
 * `repoRoot`, and writes `<mainRoot>/.claude/worktrees/<id>.scope-fingerprint`
 * as `<fingerprint> <sha>\n`.
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
  const fingerprint = tacticScopeFingerprint(statement, body);
  const sha = execFileSync("git", ["rev-parse", "origin/main"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  const stampPath = join(mainRoot, ".claude", "worktrees", `${id}.scope-fingerprint`);
  mkdirSync(dirname(stampPath), { recursive: true });
  writeFileSync(stampPath, `${fingerprint} ${sha}\n`);

  return { fingerprint, sha };
}

// --- Main ----------------------------------------------------------------

function resolveMainRoot(): string {
  const gitCommonDir = execFileSync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { encoding: "utf8" },
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

  let mainRoot = resolveMainRoot();
  const mainRootIdx = args.indexOf("--main-root");
  if (mainRootIdx !== -1) {
    const v = args[mainRootIdx + 1];
    if (!v) {
      process.stderr.write("restamp-scope-fingerprint: --main-root requires a directory argument\n" + USAGE);
      process.exit(1);
    }
    mainRoot = v;
  }

  const intentionsDir = join(repoRoot, "intentions");

  const skipIdx = new Set<number>();
  if (repoRootIdx !== -1) {
    skipIdx.add(repoRootIdx);
    skipIdx.add(repoRootIdx + 1);
  }
  if (mainRootIdx !== -1) {
    skipIdx.add(mainRootIdx);
    skipIdx.add(mainRootIdx + 1);
  }
  const positional = args.filter((a, i) => !skipIdx.has(i) && !a.startsWith("-"));
  if (positional.length !== 1) {
    process.stderr.write("restamp-scope-fingerprint: exactly one node id is required\n" + USAGE);
    process.exit(1);
  }
  const id = positional[0];

  try {
    const { fingerprint, sha } = restampScope(intentionsDir, repoRoot, mainRoot, id);
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
