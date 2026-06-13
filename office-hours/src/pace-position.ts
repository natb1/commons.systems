import { type UsageSample } from "./usage-samples.js";
import {
  elapsedWeekFraction,
  paceCurveAtFraction,
  weeklyPaceCurve,
} from "./weekly-pace-curve.js";

/** A usage sample projected onto its elapsed-week fraction x ∈ [0, 1]. */
export interface PacePoint {
  /** Elapsed-week fraction in [0, 1]. */
  x: number;
  weeklyUsedPct: number;
  sampledAt: Date;
}

/**
 * A group of samples sharing a weekly window (same weeklyResetsAt), projected
 * onto the elapsed-week fraction axis. Points are sorted ascending by x.
 */
export interface WeekSegment {
  weeklyResetsAt: Date;
  points: PacePoint[];
  /** True for the segment with the latest (maximum) weeklyResetsAt. */
  isCurrent: boolean;
}

/**
 * Group samples by their weekly window (keyed by `weeklyResetsAt.getTime()`),
 * project each sample onto its elapsed-week fraction `x`, sort points within
 * each segment ascending by `sampledAt`, and order segments by `weeklyResetsAt`
 * ascending.
 *
 * The segment with the latest `weeklyResetsAt` is flagged `isCurrent: true`.
 * Grouping by `weeklyResetsAt` (not by detecting an x decrease) guarantees no
 * segment connects x≈1 across a reset to the next week's x≈0.
 *
 * Does not mutate the input array.
 */
export function segmentByWeek(samples: UsageSample[]): WeekSegment[] {
  if (samples.length === 0) return [];

  // Group by weeklyResetsAt time value.
  const map = new Map<number, { weeklyResetsAt: Date; rawSamples: UsageSample[] }>();
  for (const s of samples) {
    const key = s.weeklyResetsAt.getTime();
    let entry = map.get(key);
    if (entry === undefined) {
      entry = { weeklyResetsAt: s.weeklyResetsAt, rawSamples: [] };
      map.set(key, entry);
    }
    entry.rawSamples.push(s);
  }

  // Build segments sorted by weeklyResetsAt ascending; the last key is the max.
  const sortedKeys = Array.from(map.keys()).sort((a, b) => a - b);
  const maxKey = sortedKeys[sortedKeys.length - 1];

  return sortedKeys.map((key) => {
    const { weeklyResetsAt, rawSamples } = map.get(key)!;

    // Sort points ascending by sampledAt (== ascending x within a window).
    const sorted = [...rawSamples].sort(
      (a, b) => a.sampledAt.getTime() - b.sampledAt.getTime(),
    );

    const points: PacePoint[] = sorted.map((s) => ({
      x: elapsedWeekFraction(s.sampledAt, s.weeklyResetsAt),
      weeklyUsedPct: s.weeklyUsedPct,
      sampledAt: s.sampledAt,
    }));

    return {
      weeklyResetsAt,
      points,
      isCurrent: key === maxKey,
    };
  });
}

/**
 * How far ahead or behind pace the sample is:
 * `weeklyUsedPct − W(x)` where W(x) is the pace curve value at this sample's
 * elapsed-week fraction. Positive = ahead of pace; negative = behind.
 */
export function aheadBehindDelta(sample: UsageSample): number {
  return sample.weeklyUsedPct - weeklyPaceCurve(sample.sampledAt, sample.weeklyResetsAt);
}

/**
 * The fixed W(x) backdrop — `steps + 1` points sampling the pace curve at
 * evenly-spaced fractions across x ∈ [0, 1]. Suitable as a reference line
 * drawn once regardless of which week is being viewed.
 */
export function paceBackdrop(steps = 100): { x: number; w: number }[] {
  const points: { x: number; w: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    points.push({ x, w: paceCurveAtFraction(x) });
  }
  return points;
}
