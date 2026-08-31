// Grounding gap sensor CLI — loads every node with listNodes, runs
// analyzeGrounding, and prints the durable-layer census plus the unmarked
// nodes ranked by deference/capture exposure. This is a SENSOR, not a gate:
// it always exits 0 (a reported gap is the expected initial state of
// strategy-complete-grounding, not an error).
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/grounding-gap.ts [intentionsDir] [--json]
//
// Defaults to `intentions` (relative to cwd) when no directory is given.
// `--json` emits the whole GroundingReport as one JSON object for tooling
// (the worker consumes this ranking at tick).

import { listNodes } from "../src/store.js";
import { analyzeGrounding, type GroundingReport } from "../src/grounding.js";

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

function renderHuman(report: GroundingReport): string {
  const lines: string[] = [];
  lines.push(
    `durable-layer: ${report.durableTotal} nodes — ` +
      `marked-by-traditions ${report.markedByTraditions}, ` +
      `marked-by-grounding ${report.markedByGrounding}, ` +
      `unmarked ${report.unmarked}`,
  );
  for (const r of report.ranked) {
    lines.push(`${r.rank}. [${r.kind}] ${r.id} — exposure ${r.exposure} (${r.factors})`);
  }
  return lines.join("\n") + "\n";
}

function main(): void {
  const { dir, json } = parseArgs(process.argv.slice(2));
  const nodes = listNodes(dir);
  const report = analyzeGrounding(nodes);
  process.stdout.write(json ? JSON.stringify(report) + "\n" : renderHuman(report));
}

main();
