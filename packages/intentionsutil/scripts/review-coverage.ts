// Review-coverage projection of the intention graph to stdout.
//
// Renders the review-coverage table by reading the local `intentions/` store,
// computing the per-durable-node review mode / path / last-reviewed row, and
// writing the rendered table to stdout. It reads only the local store (no gh,
// no network) and writes only stdout — no committed report file. This is the
// interim mechanical sensor for strategy-graph-review-curriculum's coverage
// signal; the graph digest and /align-audit report absorb its output when
// those host tactics land.
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   node --import tsx/esm packages/intentionsutil/scripts/review-coverage.ts
//
// Determinism: `listNodes` returns nodes in id-sorted order, the render sorts
// by id, and the output carries no wall-clock/environment data — two runs on
// the same store emit byte-identical stdout.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { computeReviewCoverage, renderCoverageTable } from "../src/coverage.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/review-coverage.ts`, so
// the repo root is three directories up. Resolve from this file's own
// location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

// --- Main ------------------------------------------------------------------

function main(): void {
  const nodes = listNodes(intentionsDir);
  const bodyById = new Map<string, string>();
  for (const node of nodes) {
    bodyById.set(node.id, readFileSync(join(intentionsDir, `${node.id}.md`), "utf8"));
  }
  process.stdout.write(renderCoverageTable(computeReviewCoverage(nodes, bodyById)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
