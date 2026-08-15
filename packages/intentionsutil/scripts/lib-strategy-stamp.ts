// lib-strategy-stamp — the single implementation of the
// `--strategy-fingerprint` / `--strategy-sha` flag pair and of the
// per-strategy stamp merge onto `execution.strategy_fingerprint`. Two writers
// share it, and the sharing is the point — the keyed-form requirement, the
// mandatory `--strategy-sha`, and the merge-preserving-other-keys semantics
// must be identical wherever a stamp is written:
//
//  - `apply-node-transition.ts` — the router's TRANSITION-time seed/refresh,
//    driven by `transition-node` on every non-held forward transition.
//  - `write-node.ts` — the MINT-time stamp. Transition-time seeding alone left
//    the mint-to-first-transition window open: a tactic minted with
//    `execution: null` carried no stamp until its first forward transition, so
//    a serving-strategy edit inside that window was laundered — the first
//    transition seeded a FRESH hash computed against the already-edited
//    strategy, and the soft-freeze never had a stale stamp to compare against.
//    Stamping at mint closes that window.
//
// No hashing logic lives here. The hash itself comes from
// `strategy-fingerprint.ts` / `compute-freshness.ts`; this module only parses,
// folds, and merges the values a caller hands in.

import type { Execution, StrategyStampValue } from "../src/schema.js";

/** A parsed, sha-folded stamp map: `{<strategy-id>: {hash, sha}}`. */
export type StrategyStampMap = Record<string, { hash: string; sha: string }>;

/**
 * Parse ONE `--strategy-fingerprint` value into its `{sid, hash}` halves.
 *
 * The KEYED `<strategy-id>=<hash>` form is required. The bare-hash form is
 * rejected: it cannot say which serving strategy the hash belongs to, and a
 * single top-level string is compared against EVERY serving strategy, so it
 * freezes a multi-serves tactic against all of them permanently.
 *
 * `prog` prefixes the error so the message names the actual CLI the operator
 * ran (`write-node` vs `apply-node-transition`).
 */
export function parseStrategyFingerprintEntry(
  prog: string,
  entry: string | undefined,
): { sid: string; hash: string } {
  const eq = entry === undefined ? -1 : entry.indexOf("=");
  if (entry === undefined || eq <= 0 || eq === entry.length - 1) {
    throw new Error(
      `${prog}: --strategy-fingerprint requires a '<strategy-id>=<hash>' value, got '${entry ?? ""}'` +
        " (the bare-hash form is rejected: it cannot name the serving strategy the hash belongs to)",
    );
  }
  return { sid: entry.slice(0, eq), hash: entry.slice(eq + 1) };
}

/**
 * Fold the collected `<sid> → <hash>` pairs with the single shared
 * `--strategy-sha` into the `{hash, sha}` map form. Returns null when no
 * `--strategy-fingerprint` was given at all (the no-stamp path).
 *
 * `--strategy-sha` is REQUIRED whenever any fingerprint is given: the stamp is
 * meaningless without the origin/main commit the hash was computed against —
 * that sha is what lets a stale child recover the exact delta via
 * `git diff <sha>..origin/main -- intentions/<strategy-id>.md`.
 */
export function foldStrategyStampMap(
  prog: string,
  hashes: Record<string, string> | null,
  sha: string | null,
): StrategyStampMap | null {
  if (hashes === null) return null;
  if (!sha) {
    throw new Error(
      `${prog}: --strategy-fingerprint requires --strategy-sha (the origin/main commit the hash was computed against)`,
    );
  }
  return Object.fromEntries(Object.entries(hashes).map(([sid, hash]) => [sid, { hash, sha }]));
}

/** A fresh execution record for a tactic that has none yet (pre-PR implement). */
export function defaultExecution(id: string): Execution {
  return { branch: id, pr: null, attempts: {}, markers: [], strategy_fingerprint: null };
}

/**
 * Merge the keyed entries into the per-strategy map, preserving keys this
 * invocation is not touching (opportunistic conversion, not bulk migration).
 *
 * An existing legacy top-level bare-string stamp carries no strategy id, so it
 * is dropped here — the re-stamp converts the field to map form (natural
 * churn).
 */
export function mergeStrategyStamp(execution: Execution, stamp: StrategyStampMap): Execution {
  const existing = execution.strategy_fingerprint;
  const base: Record<string, StrategyStampValue> =
    existing !== null && typeof existing === "object" ? { ...existing } : {};
  return { ...execution, strategy_fingerprint: { ...base, ...stamp } };
}
