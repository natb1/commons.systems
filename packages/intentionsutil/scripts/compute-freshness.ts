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
//     "nodeOnMain": bool, "strategyFingerprints": { "<strategy-id>": "<hash>" } }
//
// `strategyFingerprints` carries the CURRENT substance hash of EVERY serving
// strategy that resolves in the snapshot — the same `strategyFingerprint(...)`
// values the staleness comparison above consumes, surfaced rather than
// discarded so the `transition-node` wrapper can seed/refresh the tactic's
// per-strategy `execution.strategy_fingerprint` stamp map on a forward
// transition. It is a pure report of current state: it says nothing about
// whether the node's stamp matches (that is `strategyStale`), and it is `{}`
// when the node is absent from the snapshot.

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
  /** Serving-strategy id → that strategy's CURRENT substance hash. */
  strategyFingerprints: Record<string, string>;
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
      strategyFingerprints: {},
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
  //
  // The loop does NOT break on the first stale strategy: `strategyStale` keeps
  // its exact meaning (true iff ANY serving strategy is stale), but the current
  // hash of EVERY resolvable serving strategy is collected so the wrapper can
  // seed/refresh the whole per-strategy stamp map, not just the prefix examined
  // before the first mismatch.
  let strategyStale = false;
  const strategyFingerprints: Record<string, string> = {};
  for (const sid of servingStrategyIds(tactic, byId)) {
    const strategy = byId.get(sid);
    if (strategy === undefined) continue;
    const current = strategyFingerprint(strategy);
    strategyFingerprints[sid] = current;
    if (isStrategyStale(tactic.execution, sid, current)) strategyStale = true;
  }

  return {
    scopeStale,
    strategyStale,
    stampMissing: stamp === null,
    nodeOnMain: true,
    strategyFingerprints,
  };
}

function main(argv: string[]): void {
  process.stdout.write(`${JSON.stringify(computeFreshness(parseArgs(argv)))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
