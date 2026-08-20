import type { PlanRow } from "./model.js";

/**
 * How many ancestors the panel names before folding the tail. A 9th categorical
 * hue is never generated (`/dataviz`), and beyond eight rows the panel stops
 * answering "what dominates" and starts being a second table.
 */
export const HOT_LINEAGE_LIMIT = 8;

export interface LineageHeat {
  id: string;
  /** Score contributed across descendants at `phase: null` — intent awaiting decomposition. */
  undecomposed: number;
  /** Score contributed across descendants with a phase set — work in flight. */
  inFlight: number;
  /** `(undecomposed + inFlight)` as a share of the window's total. */
  share: number;
  /** Descendant counts, for the progress readout. Global, not windowed. */
  done: number;
  total: number;
  /**
   * True for an ancestor reached by a `recovers` edge. Such an ancestor reads
   * ZERO, not low — see `zeroNote`.
   */
  delegation: boolean;
}

export interface HotLineage {
  entries: LineageHeat[];
  /** Ancestors folded out of `entries`, as one `+ N others` row. */
  others: LineageHeat | null;
  total: number;
}

/**
 * The honest note a delegation lane must carry.
 *
 * A `recovers` edge is a parent edge in the recorded rank relation, but the
 * resolver's authored term distributes along `parent`/`serves` ONLY — a
 * delegation feeds the separate `capture` term as a scalar and never appears as
 * a named source. So a delegation's decomposed share is not merely small today,
 * it is structurally unavailable, and will stay so until
 * `tactic-attention-delegation-scoring` lands.
 *
 * Rendering that as a bare `0` would actively mislead on exactly the "where
 * does capture concentrate" question this panel exists to answer.
 */
export const ZERO_NOTE = "0 (until delegation-scoring)";

/**
 * Each ancestor's exact contribution to the window's total score.
 *
 * This is a DECOMPOSITION of the ranking, not a proxy for it: a row's rank is
 * the deduplicated sum of its distinct ancestors' authored injections, so
 * summing each ancestor's injection across the rows it reaches partitions the
 * window's total score exactly.
 *
 * Row-count share was considered and declined — it scores a large unweighted
 * lineage and a small high-boost one as equally hot, which answers where the
 * VOLUME is rather than what dominates. Volume is not focus.
 *
 * Recomputes over whatever rows it is handed, which is how the panel follows
 * the active filter and scroll window. That is deliberately the OPPOSITE of the
 * ETA column, which is absolute and never recomputes: hiding rows must not make
 * the router arrive sooner, but it must change what the window says is hot.
 */
export function hotLineage(
  rows: PlanRow[],
  progress: Record<string, { done: number; total: number }>,
  delegationsFor: Record<string, string[]>,
  limit = HOT_LINEAGE_LIMIT,
): HotLineage {
  const undecomposed = new Map<string, number>();
  const inFlight = new Map<string, number>();
  const delegation = new Set<string>();

  const add = (map: Map<string, number>, id: string, amount: number): void => {
    map.set(id, (map.get(id) ?? 0) + amount);
  };

  for (const row of rows) {
    const bucket = row.draft ? undecomposed : inFlight;
    for (const source of row.sources) {
      add(bucket, source.id, source.amount);
    }
    for (const id of delegationsFor[row.id] ?? []) {
      delegation.add(id);
      // Contributes 0 by construction; recorded so the lane is NAMED rather
      // than silently absent, which would read as "no capture here".
      add(bucket, id, 0);
    }
  }

  const ids = new Set([...undecomposed.keys(), ...inFlight.keys()]);
  const all: LineageHeat[] = [...ids].map((id) => {
    const u = undecomposed.get(id) ?? 0;
    const f = inFlight.get(id) ?? 0;
    const counts = progress[id] ?? { done: 0, total: 0 };
    return {
      id,
      undecomposed: u,
      inFlight: f,
      share: 0,
      done: counts.done,
      total: counts.total,
      delegation: delegation.has(id),
    };
  });

  const total = all.reduce((sum, e) => sum + e.undecomposed + e.inFlight, 0);
  for (const entry of all) {
    entry.share = total > 0 ? (entry.undecomposed + entry.inFlight) / total : 0;
  }

  all.sort((a, b) => {
    const heat = b.undecomposed + b.inFlight - (a.undecomposed + a.inFlight);
    if (heat !== 0) return heat;
    return a.id.localeCompare(b.id);
  });

  const entries = all.slice(0, limit);
  const tail = all.slice(limit);
  const others =
    tail.length === 0
      ? null
      : {
          id: `+ ${tail.length} others`,
          undecomposed: tail.reduce((s, e) => s + e.undecomposed, 0),
          inFlight: tail.reduce((s, e) => s + e.inFlight, 0),
          share: tail.reduce((s, e) => s + e.share, 0),
          done: tail.reduce((s, e) => s + e.done, 0),
          total: tail.reduce((s, e) => s + e.total, 0),
          delegation: false,
        };

  return { entries, others, total };
}
