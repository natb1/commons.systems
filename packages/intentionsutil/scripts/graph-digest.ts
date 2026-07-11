// Read-only, token-bounded digest of the whole intention graph to stdout.
//
// Gathers the digest module's pure inputs from the local `intentions/` store
// and git history, then renders the digest. Reads only the local store and
// `git log` (no gh, no network) and writes only stdout — no committed file.
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts
//   node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only
//
// Flags:
//   --tables-only   Emit Section 2 (the derived check tables) only, so an audit
//                   session can skip the per-node section entirely.
//
// Determinism: the digest module sorts every table and carries no
// wall-clock/environment data, so two runs on the same store emit
// byte-identical stdout. (The deleted-ids input is derived from committed git
// history, which is stable for a given commit.)

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes, readNodeBody } from "../src/store.js";
import { renderDigest, renderTables, type DigestInput } from "../src/digest.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/graph-digest.ts`, so the
// repo root is three directories up. Resolve from this file's own location,
// never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

/**
 * Ids whose `intentions/<id>.md` was deleted at any point in git history —
 * used to classify a DANGLING-REFS reference as `pruned` rather than `missing`.
 * Shelled here (the digest module stays pure); a git failure surfaces as a
 * clear error rather than a silent empty list (see .claude/rules/code-style.md).
 */
function deletedNodeIds(): string[] {
  const out = execFileSync(
    "git",
    ["-C", repoRoot, "log", "--diff-filter=D", "--name-only", "--pretty=format:", "--", "intentions/"],
    { encoding: "utf8" },
  );
  const ids = new Set<string>();
  for (const line of out.split("\n")) {
    const m = line.match(/^intentions\/(.+)\.md$/);
    if (m) ids.add(m[1]);
  }
  return [...ids];
}

function gatherInput(): DigestInput {
  const nodes = listNodes(intentionsDir);
  const bodies = new Map<string, string>();
  const rawTexts = new Map<string, string>();
  for (const node of nodes) {
    bodies.set(node.id, readNodeBody(intentionsDir, node.id));
    rawTexts.set(node.id, readFileSync(join(intentionsDir, `${node.id}.md`), "utf8"));
  }
  return { nodes, bodies, rawTexts, deletedIds: deletedNodeIds() };
}

function main(): void {
  const tablesOnly = process.argv.slice(2).includes("--tables-only");
  const input = gatherInput();
  process.stdout.write(tablesOnly ? renderTables(input) : renderDigest(input));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
