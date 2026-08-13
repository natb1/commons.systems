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
//   npx tsx packages/intentionsutil/scripts/select-targets.ts [--dir <intentions-dir>] [--wip-limit <n>]
//
// --dir points at a store SNAPSHOT (the wrapper extracts `intentions/` from
// origin/main into a temp dir — selection never reads a branch's working
// tree). Without --dir it falls back to the repo-local `intentions/` for
// manual dry-runs, resolved relative to this file, never cwd.
//
// --wip-limit is environmental config (the work-in-progress ceiling), resolved
// by the shell wrapper `.claude/skills/dispatch-propagate/scripts/graph-select-target`
// from `dispatch.config/`. This script never reads `dispatch.config/` itself —
// that separation is what keeps `packages/intentionsutil` a standalone,
// dispatch-agnostic package, the same posture `--dir` establishes for the
// store location (see `packages/intentionsutil/SEPARABILITY.md` Gap 1, which
// names this script's `--dir` flag as the pattern the other CLI wrappers are
// missing).
//
// Determinism: `listNodesStrict` returns nodes in id-sorted order and
// `selectGraphTargets` orders with a unique `id` final tiebreak, so two runs
// on the same store emit byte-identical stdout.
//
// Enumeration is deliberately STRICT (`listNodesStrict`, not the tolerant
// `listNodes`): absence from the enumerated set is load-bearing "pass"
// semantics in the selector's gates — `blockersComplete` (../src/router.ts)
// treats a `blocked_by` id that is ABSENT from the store as COMPLETE, so a
// corrupt/truncated/0-byte blocker file read tolerantly would silently unblock
// its dependent and dispatch it. Refusing loudly is the only safe reading.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodesStrict } from "../src/store.js";
import { selectGraphTargets } from "../src/router.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/select-targets.ts`, so
// the repo root is three directories up.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

// --- Main ------------------------------------------------------------------

function main(argv: string[]): void {
  let intentionsDir = join(repoRoot, "intentions");
  let wipLimit: number | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        throw new Error("select-targets: --dir requires a directory argument");
      }
      intentionsDir = value;
      i++;
    } else if (argv[i] === "--wip-limit") {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        throw new Error("select-targets: --wip-limit requires a non-negative integer argument");
      }
      if (!/^\d+$/.test(value)) {
        throw new Error(`select-targets: --wip-limit must be a non-negative integer, got '${value}'`);
      }
      wipLimit = Number(value);
      i++;
    } else {
      throw new Error(`select-targets: unknown argument '${argv[i]}'`);
    }
  }

  const selection = selectGraphTargets(listNodesStrict(intentionsDir), { wipLimit });
  process.stdout.write(`${JSON.stringify(selection)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
