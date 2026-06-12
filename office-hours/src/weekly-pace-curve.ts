/**
 * Weekly pace curve W(x) — the cumulative weekly-usage target the dispatch pace
 * controller spends against. Replicated exactly from the awk `W_of` function in
 * `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers` (Stage 1),
 * with the five tunables fixed at their baked-in defaults (the office-hours app
 * never exposes them). W is a weekly % in roughly [0, 100], directly comparable
 * to a sample's `weeklyUsedPct`, so the usage-history chart can overlay it on
 * the actual weekly series.
 *
 * The smooth power curve maxed with a terminal "you-can-still-make-it" envelope.
 * Monotonic increasing in t (the sample time). `end` is constant in t, so it is
 * computed once at module scope.
 */

/** Seconds in a weekly window. */
export const WEEK_SECONDS = 604800;
/** Seconds in a 5-hour window. */
export const WINDOW_SECONDS = 18000;
/** Five-hour windows per weekly window: round(604800 / 18000) = 34. */
export const T = Math.round(WEEK_SECONDS / WINDOW_SECONDS);

// Fixed tunables (defaults baked into dispatch-target-workers; the
// `target-workers` config schema in dispatch-config-load documents the same).
/** target_weekly_usage_pct — smooth-curve terminal W(1). */
export const TARGET_WEEKLY = 90;
/** weekly_terminal_pct — envelope terminal. */
export const WEEKLY_TERMINAL = 100;
/** weekly_increment_floor_pct — per-window floor. */
export const FLOOR = 1;
/** weekly_increment_cap_pct — per-window hard ceiling. */
export const CAP = 10;
/** weekly_curve_power ("p") — convexity; >1 back-loads. */
export const POWER = 1;

/**
 * `end` solves the cumulative curve so W(1) == TARGET_WEEKLY, then clamps the
 * per-window increment ceiling at CAP. Constant in t. With the defaults:
 *   end = 1 + (1+1) * (90/34 - 1) = 1 + 2 * 1.6470588... = 4.2941176...
 *   min(4.2941..., 10) = 4.2941176...
 */
export const END = Math.min(FLOOR + (POWER + 1) * (TARGET_WEEKLY / T - FLOOR), CAP);

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

/**
 * The elapsed fraction of the weekly window for a sample taken at `sampledAt`,
 * given its weekly window resets at `weeklyResetsAt`. Clamped to [0, 1]: 0 a
 * full week (or more) before the reset, 1 at (or past) the reset.
 *
 * This is the `x` of the pace curve W(x) — a pure function of where the sample
 * sits in its weekly window, independent of wall-clock time.
 */
export function elapsedWeekFraction(sampledAt: Date, weeklyResetsAt: Date): number {
  const remaining = (weeklyResetsAt.getTime() - sampledAt.getTime()) / 1000;
  return clamp((WEEK_SECONDS - remaining) / WEEK_SECONDS, 0, 1);
}

/**
 * The pace curve W(x) as a pure function of the elapsed-week fraction
 * `x ∈ [0, 1]`. Both terms reduce to functions of `x` alone, so the curve is
 * identical every week and can be drawn once as a fixed backdrop.
 *
 * The smooth cumulative power curve, maxed with a terminal
 * "you-can-still-make-it" envelope. The envelope's remaining-seconds term is
 * reconstructed from `x` as `(1 - x) * WEEK_SECONDS`, then divided by
 * `WINDOW_SECONDS` — i.e. `(1 - x) * 33.6`, NOT `(1 - x) * T` (T is the rounded
 * 34) — to match the original `remaining / WINDOW_SECONDS` exactly.
 */
export function paceCurveAtFraction(x: number): number {
  // Smooth cumulative power curve.
  let W = T * (FLOOR * x + (END - FLOOR) * x ** (POWER + 1) / (POWER + 1));

  // Terminal envelope: floor the cumulative curve from the end so spending at
  // most CAP per remaining window still reaches WEEKLY_TERMINAL. Mid-week the
  // remaining-windows term is large and the envelope is deeply negative, so the
  // smooth curve dominates; the envelope only lifts the final ~1.7 windows.
  const remaining = (1 - x) * WEEK_SECONDS;
  const envelope = WEEKLY_TERMINAL - CAP * (remaining / WINDOW_SECONDS);
  if (W < envelope) W = envelope;

  return W;
}

/**
 * The cumulative weekly pace curve value (weekly %) for a sample taken at
 * `sampledAt`, given its weekly window resets at `weeklyResetsAt`.
 *
 * Returns 0 when the weekly window has already reset (remaining <= 0), matching
 * the awk reference's early `print 0; exit`; otherwise composes
 * `paceCurveAtFraction(elapsedWeekFraction(...))`.
 */
export function weeklyPaceCurve(sampledAt: Date, weeklyResetsAt: Date): number {
  const remaining = (weeklyResetsAt.getTime() - sampledAt.getTime()) / 1000;
  if (remaining <= 0) return 0;
  return paceCurveAtFraction(elapsedWeekFraction(sampledAt, weeklyResetsAt));
}
