/**
 * The high-water ratchet: the concrete `HighWaterSource` over the append-only
 * operational store.
 *
 * A check is promoted onto the ratchet the first time it is observed passing
 * on main. `deriveTier` (`checks.ts`) reads that fact as the second conjunct
 * of the sanction gate, so a check can only ever gate work it has already been
 * observed to permit.
 *
 * MONOTONICITY IS STRUCTURAL, NOT ENFORCED HERE. `operational-store.ts` has
 * append and read primitives and deliberately no update and no delete. There
 * is therefore no demotion path to guard: once a promotion record exists it
 * stays, and `has` can only ever go false -> true. Nothing in this module
 * needs a monotonicity check because nothing in the store could violate one.
 *
 * ON-DISK PLACEMENT. Promotion records are ordinary `evidence.v1` entries
 * filed under the reserved `HIGH_WATER_STRATEGY` bucket — one file per record,
 * content-addressed, created and never edited, exactly as every other
 * operational record. This module invents no layout, no path helper and no
 * primitive of its own; it calls `appendEvidence` / `readEvidence` and nothing
 * else. See `checks.ts`'s `HIGH_WATER_STRATEGY` doc for why the bucket is a
 * synthetic key rather than a real strategy id.
 *
 * CONCURRENCY. One record is one file created with `wx`, so two sessions
 * promoting the same check at the same sha write identical bytes to one path
 * and the loser's `EEXIST` falls through to an idempotent no-op. Two sessions
 * promoting at DIFFERENT shas write two disjoint files, which git merges in
 * any order. Either way `has` is unchanged.
 */
import { appendEvidence, readEvidence } from "./operational-store.js";
import {
  HIGH_WATER_STRATEGY,
  isPromotionFor,
  promotionRecord,
  type CheckDeclaration,
  type HighWaterSource,
} from "./checks.js";
import type { EvidenceEntry } from "./operational-records.js";

/**
 * Every high-water promotion record in the store, in the store's own order
 * (file name: date, then content hash).
 *
 * Exported for the frontier deriver's audit view — "when was each check
 * promoted, and at what sha" — which needs the entries themselves, not just
 * the boolean.
 */
export function readPromotions(dir: string): EvidenceEntry[] {
  return readEvidence(dir, HIGH_WATER_STRATEGY);
}

/**
 * The store-backed `HighWaterSource`.
 *
 * READS ARE MEMOIZED. A frontier run resolves a tier for every registered
 * check, and re-reading and re-validating the whole promotion directory once
 * per check would be quadratic in the registry for a set that cannot change
 * under a single run. The snapshot is taken on the first `has` and refreshed
 * by `promote`; `reload()` is there for the caller that genuinely needs to see
 * another process's appends mid-run.
 */
export class StoreHighWater implements HighWaterSource {
  /** The promoted check ids, or `null` before the first read. */
  private promoted: Set<string> | null = null;

  /** @param dir the intentions store directory (the one holding `operational/`). */
  constructor(private readonly dir: string) {}

  /**
   * Has `checkId` ever been observed passing on main?
   *
   * An absent operational directory reads as "nothing promoted yet" rather
   * than an error — `readEvidence` treats a missing directory and an empty one
   * as the same state, since the directories are created lazily by the first
   * append.
   */
  has(checkId: string): boolean {
    return this.snapshot().has(checkId);
  }

  /**
   * Record that `check` passed on main at `sha`, promoting it onto the
   * ratchet.
   *
   * Idempotent: re-appending the same promotion resolves to the same
   * content-addressed path and is a no-op success. A promotion at a DIFFERENT
   * sha is a second, additive record — the ratchet is already latched, and the
   * extra record is the audit trail of a later observed pass.
   *
   * @param observedAt `YYYY-MM-DD`, injected — see `promotionRecord`'s note on
   *   why a clock-derived date would defeat append idempotence.
   * @returns the path of the promotion record file.
   */
  promote(check: CheckDeclaration, sha: string, observedAt: string): string {
    const entry = promotionRecord(check, sha, observedAt);
    const path = appendEvidence(this.dir, entry);
    // Keep the snapshot honest for this session's own write without paying a
    // full re-read; a foreign write still needs `reload()`.
    this.snapshot().add(check.id);
    return path;
  }

  /** Every check id currently on the ratchet — a read-only snapshot. */
  promotedCheckIds(): ReadonlySet<string> {
    return new Set(this.snapshot());
  }

  /** Drop the memoized snapshot so the next `has` re-reads the store. */
  reload(): void {
    this.promoted = null;
  }

  private snapshot(): Set<string> {
    if (this.promoted === null) {
      const promoted = new Set<string>();
      for (const entry of readPromotions(this.dir)) {
        // `isPromotionFor` is the read half of the write shape `promotionRecord`
        // builds; asking it per entry keeps the two from drifting apart.
        const checkId = entry.proof.check;
        if (checkId !== null && isPromotionFor(entry, checkId)) promoted.add(checkId);
      }
      this.promoted = promoted;
    }
    return this.promoted;
  }
}
