// Resolved-rank map of the intention graph to stdout, keyed by issue number.
//
// Reads the local `intentions/` store, runs `resolveAttention`, and prints a
// single JSON object mapping GitHub issue numbers to their NONZERO derived
// ranks. The dispatch router consumes this to order the queue directly from the
// tree (the priority label is retired). Missing keys default to rank 0 in the
// consumer, so zero ranks are omitted here.
//
// Issue-number resolution per resolved node id:
//   - `tactic-<N>`         → key <N>            (the emitted-leaf convention);
//   - any other node id    → `nodeIdToIssue(id, trackers/)` when it resolves
//                            (a hand-authored node with a recorded tracker).
// `nodeIdToIssue` handles both cases, so it is the single lookup.
//
// Run from anywhere (paths resolve relative to this file, not cwd):
//   npx tsx packages/intentionsutil/scripts/rank-map.ts
//
// Errors are loud (clear-errors rule): a missing intentions/ dir or any
// validation/resolution failure exits non-zero — there is no empty-map fallback.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { resolveAttention } from "../src/attention.js";
import { nodeIdToIssue } from "../src/tracker.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/rank-map.ts`, so the
// repo root is three directories up. Resolve from this file's own location.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");
const trackersDir = join(repoRoot, "trackers");

// --- Main ------------------------------------------------------------------

function main(): void {
  const resolved = resolveAttention(listNodes(intentionsDir));
  const rankByIssue: Record<number, number> = {};
  for (const [nodeId, { value }] of resolved) {
    if (value === 0) continue;
    const issue = nodeIdToIssue(nodeId, trackersDir);
    if (issue !== null) rankByIssue[issue] = value;
  }
  process.stdout.write(JSON.stringify(rankByIssue) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
