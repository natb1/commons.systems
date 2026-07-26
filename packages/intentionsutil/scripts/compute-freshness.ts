// compute-freshness — the freshness-gate computation for the graph transition
// writer (tactic-graph-router-transitions Unit 1). Given a node id, an
// origin/main store snapshot, and the worker-start gate's phase-start stamp
// file, it recomputes the two fingerprints the gate compares and prints the
// results as one JSON object for the `transition-node` wrapper to act on.
//
//   - strategy fingerprint: the serving strategy's current substance
//     (`strategyFingerprint`) vs `execution.strategy_fingerprint` on the tactic
//     — the soft-freeze trigger (strategy clarification 10).
//   - scope fingerprint: the tactic's current statement+body
//     (`tacticScopeFingerprint`) vs the fingerprint stamped at phase start
//     (chain-of-custody, 2026-07-06).
//
// The snapshot is origin/main (never a branch): the wrapper extracts
// `intentions/` from origin/main into a temp dir. This script reads only that
// snapshot and the stamp file — no git, no gh.
//
// Missing-stamp policy is REPORTED, not decided here: `stampMissing` is surfaced
// so the wrapper applies fail-open (ordinary forward transition) vs fail-closed
// (the review→merge arming point, which requires the stamp) itself.
//
// Usage:
//   node --import tsx/esm compute-freshness.ts <node-id> \
//     --snapshot <origin-main-intentions-dir> --stamp <stamp-file>
//
// Stdout: one JSON object
//   { "scopeStale": bool, "strategyStale": bool, "stampMissing": bool,
//     "nodeOnMain": bool, "stampedFingerprint": string|null,
//     "stampedSha": string|null, "currentFingerprint": string|null }
//
// The three added fields let the wrapper thread the phase-start scope
// fingerprint through to `apply-node-transition.ts`'s `--evidence-fingerprint`
// / `--evidence-sha` flags (tactic-phase-evidence-fingerprint-bound Unit 2), so
// a newly-written completion marker binds to the scope it was actually
// produced under:
//   - `stampedFingerprint` / `stampedSha` — the phase-start stamp's own
//     fingerprint+sha (`null` when the stamp is missing/malformed, i.e.
//     `stampMissing` is true).
//   - `currentFingerprint` — the tactic's current scope fingerprint
//     (`scopeFp`), `null` only when the node is not on origin/main
//     (`nodeOnMain` is false).

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes, readNode, readNodeBody } from "../src/store.js";
import { servingStrategyIds, strategyFingerprint, tacticScopeFingerprint } from "../src/router.js";
import { isScopeStale, isStrategyStale, parseScopeStamp } from "../src/transitions.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

interface Args {
  id: string;
  snapshot: string;
  stamp: string | null;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { id: "", snapshot: join(repoRoot, "intentions"), stamp: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--snapshot":
        out.snapshot = argv[++i];
        break;
      case "--stamp":
        out.stamp = argv[++i];
        break;
      default:
        if (a.startsWith("--")) throw new Error(`compute-freshness: unknown flag '${a}'`);
        if (out.id !== "") throw new Error(`compute-freshness: unexpected extra argument '${a}'`);
        out.id = a;
    }
  }
  if (out.id === "") throw new Error("compute-freshness: <node-id> is required");
  return out;
}

export interface FreshnessResult {
  scopeStale: boolean;
  strategyStale: boolean;
  stampMissing: boolean;
  nodeOnMain: boolean;
  stampedFingerprint: string | null;
  stampedSha: string | null;
  currentFingerprint: string | null;
}

export function computeFreshness(args: Args): FreshnessResult {
  // The tactic must exist on origin/main for the gate to apply. A tactic not
  // yet landed (fresh implement PR before its state-only landing) has nothing
  // to compare against — neither gate fires.
  if (!existsSync(join(args.snapshot, `${args.id}.md`))) {
    return {
      scopeStale: false,
      strategyStale: false,
      stampMissing: true,
      nodeOnMain: false,
      stampedFingerprint: null,
      stampedSha: null,
      currentFingerprint: null,
    };
  }

  const nodes = listNodes(args.snapshot);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const tactic = readNode(args.snapshot, args.id);
  const body = readNodeBody(args.snapshot, args.id);

  // Scope fingerprint gate.
  const scopeFp = tacticScopeFingerprint(tactic.statement, body);
  const stampContent = args.stamp !== null && existsSync(args.stamp) ? readFileSync(args.stamp, "utf8") : "";
  const stamp = parseScopeStamp(stampContent);
  const scopeStale = isScopeStale(stamp, scopeFp);

  // Strategy fingerprint gate: check each serving strategy against its OWN entry
  // in the per-strategy stamp map — a mismatch on any one freezes the subtree.
  // A serving strategy absent from the map is not stale (per-strategy null); a
  // legacy bare-string stamp still compares against every serving strategy.
  let strategyStale = false;
  for (const sid of servingStrategyIds(tactic, byId)) {
    const strategy = byId.get(sid);
    if (strategy === undefined) continue;
    if (isStrategyStale(tactic.execution, sid, strategyFingerprint(strategy))) {
      strategyStale = true;
      break;
    }
  }

  return {
    scopeStale,
    strategyStale,
    stampMissing: stamp === null,
    nodeOnMain: true,
    stampedFingerprint: stamp?.fingerprint ?? null,
    stampedSha: stamp?.sha ?? null,
    currentFingerprint: scopeFp,
  };
}

function main(argv: string[]): void {
  process.stdout.write(`${JSON.stringify(computeFreshness(parseArgs(argv)))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
