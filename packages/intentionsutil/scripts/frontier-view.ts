// Active-frontier projection of the intention graph to stdout.
//
// Renders the active-frontier view by reading the local `intentions/` store,
// computing the goal projection, and writing the rendered frontier to stdout.
// It reads only the local store (no gh, no network) and writes only stdout —
// no committed roadmap file.
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   node --import tsx/esm packages/intentionsutil/scripts/frontier-view.ts
//
// Determinism: `listNodes` returns nodes in id-sorted order, the projection
// sort has a unique `id` final tiebreak, and the output carries no
// wall-clock/environment data — two runs on the same store emit byte-identical
// stdout.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { projectGoals, renderFrontier } from "../src/goals.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/frontier-view.ts`, so
// the repo root is three directories up. Resolve from this file's own
// location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

// --- Main ------------------------------------------------------------------

function main(): void {
  process.stdout.write(renderFrontier(projectGoals(listNodes(intentionsDir))));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
