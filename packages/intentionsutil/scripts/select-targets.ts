// Graph-selection candidate computation to stdout (tactic-graph-router-selector).
//
// Reads an intentions store directory, runs the pure graph selector
// (`selectGraphTargets` in ../src/router.ts), and prints the resulting
// `GraphSelection` — the ordered candidate list plus freeze/cap/gate events —
// as one JSON object. The environmental gates (claimed set, phase sensor
// gates, pacing, the selection log) are applied by the shell wrapper
// `.claude/skills/dispatch-propagate/scripts/graph-select-target`, which is
// this script's only intended caller besides manual dry-runs.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/select-targets.ts [--dir <intentions-dir>]
//
// --dir points at a store SNAPSHOT (the wrapper extracts `intentions/` from
// origin/main into a temp dir — selection never reads a branch's working
// tree). Without --dir it falls back to the repo-local `intentions/` for
// manual dry-runs, resolved relative to this file, never cwd.
//
// Determinism: `listNodes` returns nodes in id-sorted order and
// `selectGraphTargets` orders with a unique `id` final tiebreak, so two runs
// on the same store emit byte-identical stdout.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { selectGraphTargets } from "../src/router.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/select-targets.ts`, so
// the repo root is three directories up.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

// --- Main ------------------------------------------------------------------

function main(argv: string[]): void {
  let intentionsDir = join(repoRoot, "intentions");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        throw new Error("select-targets: --dir requires a directory argument");
      }
      intentionsDir = value;
      i++;
    } else {
      throw new Error(`select-targets: unknown argument '${argv[i]}'`);
    }
  }

  const selection = selectGraphTargets(listNodes(intentionsDir));
  process.stdout.write(`${JSON.stringify(selection)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
