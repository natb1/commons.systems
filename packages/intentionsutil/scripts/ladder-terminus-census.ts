// ladder-terminus-census — report the ladder-terminus predicate
// (tactic-ladder-terminus-owns-main-qa) over the live intentions store: how
// many merged-but-not-done nodes exist, how many are legitimately excused
// (parked or blocked), and how many are violations — plus, with `--lint`, the
// unstructured-wait report (main-qa nodes carrying a prose "awaited event:"
// line instead of a structural excuse).
//
// DEFAULT IS REPORT-ONLY: this script always exits 0 regardless of the
// counts it finds. `--strict` opts into a non-zero exit when there are
// violations or unstructured waits, for a future gate to use — but nothing
// wires `--strict` into CI, an npm script, or any lint runner YET. At the
// time this script was written, two live nodes (`tactic-attention-namespaced-
// rank`, `tactic-pause-disables-merge-lane`) carry exactly the unstructured-
// wait gap this reports; they are fixed by a POST-MERGE graph update, not by
// this PR. Landing a CI gate on `--strict` in the same PR that adds the
// predicate would red main in the window between this merging and that
// follow-up landing. Wire `--strict` into CI only after both nodes are
// resolved (either the waits gain real `blocked_by` edges or the nodes
// themselves resolve).
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/ladder-terminus-census.ts \
//     [<intentions-dir>] [--intentions <dir>] [--lint] [--strict]
//
// The intentions dir may be given positionally, via `--intentions`, or
// omitted entirely (defaults to `<repoRoot>/intentions`) — the plan's
// verification command invokes this with a bare positional dir
// (`npx tsx packages/intentionsutil/scripts/ladder-terminus-census.ts
// intentions`), so the positional form must work standalone.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodesStrict, readNodeBody } from "../src/store.js";
import { ladderTerminusCensus, findUnstructuredWaits } from "../src/terminus.js";

interface Args {
  intentionsDir: string;
  lint: boolean;
  strict: boolean;
}

function parseArgs(argv: string[]): Args {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = dirname(dirname(dirname(scriptDir)));
  let intentionsDir = join(repoRoot, "intentions");
  let lint = false;
  let strict = false;
  let positionalSet = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intentions") {
      // A missing value must be the same cheap exit 2 an unknown flag gets —
      // `argv[++i]` would otherwise hand `undefined` straight to
      // listNodesStrict and surface as an ERR_INVALID_ARG_TYPE stack trace.
      const value = argv[++i];
      if (value === undefined) {
        process.stderr.write("ladder-terminus-census: --intentions requires a directory\n");
        process.exit(2);
      }
      intentionsDir = value;
    } else if (a === "--lint") {
      lint = true;
    } else if (a === "--strict") {
      strict = true;
    } else if (!a.startsWith("--") && !positionalSet) {
      intentionsDir = a;
      positionalSet = true;
    } else {
      process.stderr.write(`ladder-terminus-census: unknown argument "${a}"\n`);
      process.exit(2);
    }
  }

  return { intentionsDir, lint, strict };
}

function main(): void {
  const { intentionsDir, lint, strict } = parseArgs(process.argv.slice(2));

  // STRICT enumeration, not the tolerant listNodes: the same fail-open
  // reasoning router.ts's blockersComplete doc comment records
  // (packages/intentionsutil/src/router.ts:214-226; PRECONDITION section). A
  // node file the tolerant reader silently drops (0-byte, truncated,
  // conflict-markered, schema-invalid) must not read as "no violation" — a
  // dropped merged-not-done node would silently vanish from the census
  // instead of surfacing as a violation. This is a report/reconciliation
  // gate over merged (i.e. already-landed) work, so a corrupt file here is
  // itself worth knowing about loudly, exactly as validate-graph's strict
  // enumeration is.
  const nodes = listNodesStrict(intentionsDir);
  const census = ladderTerminusCensus(nodes);

  for (const row of census.rows) {
    process.stdout.write(`${row.id}\t${row.phase}\t${row.pr ?? ""}\t${row.classification}\n`);
  }
  process.stdout.write(
    `\nmerged-not-done=${census.mergedNotDone} excused=${census.excused} violations=${census.violations}\n`,
  );

  // Computed for `--strict` as well as `--lint`: `--strict` is documented above
  // as failing on violations OR unstructured waits, and leaving `waits` empty
  // unless `--lint` was also passed would silently drop half of that. The two
  // sets are NOT the same — a main-qa node carrying a prose "awaited event:"
  // line but no merged completion classifies `not-merged` (no violation) while
  // still being an unstructured wait — so a `--strict`-only gate would pass on
  // exactly the gap the wait detector exists to catch. `--lint` controls only
  // whether the list is PRINTED.
  let waits: ReturnType<typeof findUnstructuredWaits> = [];
  if (lint || strict) {
    waits = findUnstructuredWaits(nodes, (id) => readNodeBody(intentionsDir, id));
  }
  if (lint) {
    process.stdout.write(`\nunstructured waits (${waits.length}):\n`);
    for (const w of waits) {
      process.stdout.write(`${w.id}\t${w.awaited}\n`);
    }
  }

  if (strict && (census.violations > 0 || waits.length > 0)) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
