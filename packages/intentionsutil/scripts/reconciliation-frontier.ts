// Reconciliation-frontier CLI — loads every node with listNodes, derives the
// frontier, and prints it. This is a SENSOR, not a gate: it always exits 0 (a
// reported frontier is the remaining migration, which is the expected state of
// tactic-migration-frontier-projection during the drain, not an error). Gating
// force lives in a separate runner, so reading the frontier can never fail a
// build.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/reconciliation-frontier.ts [intentionsDir] [--json]
//
// Never `npx tsx`: that spelling dies with `listen EPERM` under the sandbox
// before it parses its arguments (.claude/rules/sandbox.md).
//
// Defaults to `intentions` (relative to cwd) when no directory is given.
// `--json` emits the entry array as one JSON document for tooling.
//
// NO CHECKS RUN HERE. `checkRuns: []` is passed explicitly — this CLI reports
// the graph-only reading of the criterion/observe-failure arms; the tier-aware
// runner (`run-registered-checks.ts`, unit 7) is the one that runs checks and
// feeds their results through the same `deriveReconciliationFrontier` input.
//
// GAP NOTES ARE READ HERE, from `intentions/operational/gap-notes/` — the fs
// half of the `prose-gap` arm. `deriveReconciliationFrontier` itself stays
// pure; this CLI is the "CLI/digest layer" its header describes as owning the
// read.

import { listNodes } from "../src/store.js";
import { readGapNotes } from "../src/gap-note-store.js";
import {
  deriveReconciliationFrontier,
  renderReconciliationFrontier,
} from "../src/frontier-reconciliation.js";

function parseArgs(argv: string[]): { dir: string; json: boolean } {
  let dir: string | undefined;
  let json = false;
  for (const arg of argv) {
    if (arg === "--json") {
      json = true;
    } else if (dir === undefined) {
      dir = arg;
    }
  }
  return { dir: dir ?? "intentions", json };
}

function main(): void {
  const { dir, json } = parseArgs(process.argv.slice(2));
  const nodes = listNodes(dir);
  const gapNotes = readGapNotes(dir);
  const entries = deriveReconciliationFrontier({ nodes, checkRuns: [], gapNotes });
  process.stdout.write(
    json ? JSON.stringify(entries) + "\n" : renderReconciliationFrontier(entries),
  );
}

main();
