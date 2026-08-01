// list-recheckable-holds — thin CLI over the pure hold-classification
// enumerator (tactic-stale-hold-auto-resolve Unit 3).
//
// Prints every hold node in the store that still holds its source, tagged with
// what the sweep must do about it: re-check an auto predicate, clear a residual
// `blocked_by` edge left behind by an already-completed hold, or just report a
// manual-policy hold for visibility.
//
// It is a pure read-only enumeration + printing wrapper over
// `listHoldCandidates` (src/hold-sweep.ts). No graph writes, no git, no gh.
//
// Usage:
//   node --import tsx/esm list-recheckable-holds.ts --dir <intentions-dir>
//
//   --dir (required) the intentions store directory the nodes load from.
//
// Stdout: one TSV line per candidate,
//   `<hold-id>\t<source-id>\t<kind>\t<class>`
// (nothing when there are no candidates).
// Exit 0 on success; exit 2 on a usage error or a malformed store.

import { pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { listHoldCandidates } from "../src/hold-sweep.js";

export interface HoldSweepOpts {
  dir: string;
}

function parseArgs(argv: string[]): HoldSweepOpts {
  let dir: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      const v = argv[++i];
      if (v === undefined || v === "")
        throw new Error("list-recheckable-holds: --dir requires a directory argument");
      dir = v;
    } else {
      throw new Error(`list-recheckable-holds: unknown argument '${arg}'`);
    }
  }
  if (dir === null) {
    throw new Error("usage: list-recheckable-holds.ts --dir <intentions-dir>");
  }
  return { dir };
}

function main(argv: string[]): void {
  const { dir } = parseArgs(argv);
  const nodes = listNodes(dir);
  for (const c of listHoldCandidates(nodes)) {
    process.stdout.write(`${c.holdId}\t${c.sourceId}\t${c.kind}\t${c.cls}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(2);
  }
}
