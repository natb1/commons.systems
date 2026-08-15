// strategy-stamp-census — measure the soft-freeze's actual blast radius:
// how many OPEN tactics carry an `execution.strategy_fingerprint` entry for
// each strategy they serve, and how many of those are currently stale.
//
// WHY THIS EXISTS
//
// `strategy_fingerprint` is the soft-freeze trigger of strategy clarification
// 10: when a strategy's substance changes, its open tactics whose stamped hash
// no longer matches are frozen out of their normal phase skill and re-surface
// as `/align-tactics` re-evaluation candidates. The predicate is
// `isStrategyStale` -> `isFingerprintStale` (`../src/transitions.ts`), which
// treats BOTH a null stamp and a map lacking the strategy's key as NOT stale,
// by design — so a tactic is never born frozen against a strategy it does not
// yet track. The consequence is that "unstamped" and "in sync" are
// indistinguishable to the gate: an unstamped subtree is silently exempt from
// the freeze, and the exemption is invisible unless someone counts.
//
// Three findings this census makes measurable and repeatable in code, instead
// of by ad-hoc grep over `intentions/`:
//
//   1. The flag-passing gap. `apply-node-transition.ts` is the only writer of
//      the field and accepts `--strategy-fingerprint <id>=<hash>` +
//      `--strategy-sha <sha>`. Neither production caller —
//      `.claude/skills/dispatch-propagate/scripts/transition-node` nor
//      `demote-node-to-implement` — ever passes them, so no router-driven
//      transition has ever stamped the field. `compute-freshness.ts` computes
//      each serving strategy's fingerprint internally to decide staleness and
//      then DISCARDS the hash, returning booleans only — the value the caller
//      would need to pass through is computed and thrown away one process
//      earlier.
//
//   2. The doctrine contradiction. `align-tactics/references/write-path.md`
//      says at mint time to "Leave `execution: null` — the execution object is
//      the router's live in-flight record" (~line 123), and its "Fingerprint
//      honesty" section (~line 296) says "At mint time this session stamps
//      only the decomposed ... strategy's entry". A node cannot both carry no
//      execution object and carry a stamp inside it. In practice the first
//      instruction wins, so nodes are minted unstamped.
//
//   3. Zero automated coverage. Every stamp present in the graph traces to a
//      hand-write or a session write, never to the router. The freeze's
//      automated blast radius graph-wide is 0.
//
// This tool is REPORT-ONLY and network-free. It writes nothing, and it never
// re-derives the hash recipe or the staleness rule — it calls
// `strategyFingerprint` (`../src/router.ts`) and `isStrategyStale`
// (`../src/transitions.ts`) directly, so a change to either is reflected here
// automatically.
//
// CLASSIFICATION — each open serving tactic lands in EXACTLY ONE bucket, on
// the value of `execution?.strategy_fingerprint`:
//
//   keyed       — a map carrying a key equal to this strategy's id. The only
//                 shape the freeze can act on for this strategy.
//   misKeyed    — a NON-EMPTY map with no key for this strategy. Covers the
//                 malformed flat `{hash, sha}` shape (a map keyed "hash"/"sha"
//                 rather than by strategy id) and maps stamped only for some
//                 OTHER serving strategy. Exempt from this strategy's freeze.
//   bareString  — the deprecated-legacy top-level string form. Compared against
//                 every serving strategy, so a multi-serves tactic wearing one
//                 is effectively permanently stale.
//   nullStamp   — no stamp at all: `execution` null/absent, or
//                 `strategy_fingerprint` null. An EMPTY map is counted here
//                 too — it stamps nothing for anyone, so it is semantically a
//                 null stamp, not a mis-key.
//
// `stale` is computed independently of the bucket, via
// `isStrategyStale(child.execution, strategy.id, strategyFingerprint(strategy))`
// — so it can only ever be true for a `keyed` (hash mismatch) or a
// `bareString` (any mismatch) tactic. A stale count far below the open count
// is the gap this tool exists to show.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/strategy-stamp-census.ts \
//     [--intentions <dir>] [--strategy <strategy-id>]
//
// `--strategy <id>` narrows BOTH sections — the per-strategy breakdown and the
// roll-up — to that one strategy, so the roll-up always summarizes exactly the
// strategies listed in `strategies`.
//
// Stdout: one JSON object:
//   { strategies: [ { id, openTactics, keyed: {count, ids}, misKeyed: {...},
//                     bareString: {...}, nullStamp: {...}, stale: {...} } ],
//     rollup: { strategies, openTactics, keyed, misKeyed, bareString,
//               nullStamp, anyStamp, mapForm, stale } }
//
// NOTE on counting: a tactic serving N strategies is counted once PER strategy
// it serves — `openTactics` is a (strategy, tactic) pair count, not a distinct
// node count. That is the right denominator here, because the freeze decision
// is made per serving strategy, not per node.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { isOpenTactic, servingStrategyIds, strategyFingerprint } from "../src/router.js";
import { isStrategyStale } from "../src/transitions.js";
import type { IntentionNode } from "../src/schema.js";

interface Args {
  intentionsDir: string;
  strategyId: string | null;
}

function parseArgs(argv: string[]): Args {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = dirname(dirname(dirname(scriptDir)));
  let intentionsDir = join(repoRoot, "intentions");
  let strategyId: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intentions") intentionsDir = argv[++i];
    else if (a === "--strategy") strategyId = argv[++i];
    else {
      process.stderr.write(`strategy-stamp-census: unknown argument "${a}"\n`);
      process.exit(2);
    }
  }
  return { intentionsDir, strategyId };
}

/** One classification bucket: how many, and which ids. */
export interface Bucket {
  count: number;
  ids: string[];
}

export interface StrategyBreakdown {
  id: string;
  /** Open tactics serving this strategy — the sum of the four buckets. */
  openTactics: number;
  keyed: Bucket;
  misKeyed: Bucket;
  bareString: Bucket;
  nullStamp: Bucket;
  /** Subset (cutting across buckets) the soft-freeze would currently freeze. */
  stale: Bucket;
}

export interface Rollup {
  /** How many strategies the breakdown covers. */
  strategies: number;
  /** (strategy, open serving tactic) pairs — see the NOTE on counting above. */
  openTactics: number;
  keyed: number;
  misKeyed: number;
  bareString: number;
  nullStamp: number;
  /** keyed + misKeyed + bareString — any stamp of any shape. */
  anyStamp: number;
  /** keyed + misKeyed — the non-deprecated map form. */
  mapForm: number;
  stale: number;
}

export interface CensusResult {
  strategies: StrategyBreakdown[];
  rollup: Rollup;
}

type BucketName = "keyed" | "misKeyed" | "bareString" | "nullStamp";

/**
 * Classify one tactic's stamp relative to one strategy. Reads only the raw
 * field shape — staleness is a separate question answered by `isStrategyStale`.
 */
export function classifyStamp(tactic: IntentionNode, strategyId: string): BucketName {
  const stamp = tactic.execution?.strategy_fingerprint ?? null;
  if (stamp === null) return "nullStamp";
  if (typeof stamp === "string") return "bareString";
  if (Object.hasOwn(stamp, strategyId)) return "keyed";
  // An empty map stamps nothing for anyone — a null stamp in map clothing.
  return Object.keys(stamp).length === 0 ? "nullStamp" : "misKeyed";
}

function emptyBucket(): Bucket {
  return { count: 0, ids: [] };
}

function push(bucket: Bucket, id: string): void {
  bucket.ids.push(id);
  bucket.count += 1;
}

/**
 * Census the store at `dir`. For every strategy node (optionally narrowed to
 * `strategyId`), find the OPEN tactics serving it — `isOpenTactic` for "open",
 * `servingStrategyIds`'s parent-chain walk for "serves" — bucket each one's
 * stamp shape, and flag the ones the soft-freeze would currently freeze.
 */
export function strategyStampCensus(dir: string, strategyId: string | null = null): CensusResult {
  const nodes = listNodes(dir);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const strategies = nodes.filter(
    (n) => n.kind === "strategy" && (strategyId === null || n.id === strategyId),
  );
  const openTactics = nodes.filter((n) => n.kind === "tactic" && isOpenTactic(n));

  const breakdowns: StrategyBreakdown[] = [];

  for (const strategy of strategies) {
    const fingerprint = strategyFingerprint(strategy);
    const breakdown: StrategyBreakdown = {
      id: strategy.id,
      openTactics: 0,
      keyed: emptyBucket(),
      misKeyed: emptyBucket(),
      bareString: emptyBucket(),
      nullStamp: emptyBucket(),
      stale: emptyBucket(),
    };

    for (const tactic of openTactics) {
      if (!servingStrategyIds(tactic, byId).has(strategy.id)) continue;
      breakdown.openTactics += 1;
      push(breakdown[classifyStamp(tactic, strategy.id)], tactic.id);
      if (isStrategyStale(tactic.execution, strategy.id, fingerprint)) {
        push(breakdown.stale, tactic.id);
      }
    }

    breakdowns.push(breakdown);
  }

  const rollup: Rollup = {
    strategies: breakdowns.length,
    openTactics: 0,
    keyed: 0,
    misKeyed: 0,
    bareString: 0,
    nullStamp: 0,
    anyStamp: 0,
    mapForm: 0,
    stale: 0,
  };
  for (const b of breakdowns) {
    rollup.openTactics += b.openTactics;
    rollup.keyed += b.keyed.count;
    rollup.misKeyed += b.misKeyed.count;
    rollup.bareString += b.bareString.count;
    rollup.nullStamp += b.nullStamp.count;
    rollup.stale += b.stale.count;
  }
  rollup.anyStamp = rollup.keyed + rollup.misKeyed + rollup.bareString;
  rollup.mapForm = rollup.keyed + rollup.misKeyed;

  return { strategies: breakdowns, rollup };
}

function main(): void {
  const { intentionsDir, strategyId } = parseArgs(process.argv.slice(2));
  console.log(JSON.stringify(strategyStampCensus(intentionsDir, strategyId)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
