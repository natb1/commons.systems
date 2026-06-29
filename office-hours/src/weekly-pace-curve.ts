/**
 * Weekly pace curve W(x) — the cumulative weekly-usage target the dispatch pace
 * controller spends against. Replicated exactly from the awk `W_of` function in
 * `.claude/skills/dispatch-propagate/scripts/dispatch-target-workers` (Stage 1),
 * with the five tunables fixed at their baked-in defaults (the office-hours app
 * never exposes them). W is a weekly % in roughly [0, 100], directly comparable
 * to a sample's `weeklyUsedPct`, so the usage-history chart can overlay it on
 * the actual weekly series.
 *
 * Anchored floor→shoulder→terminal max curve: W = max(floor, rise, terminal_seg),
 * where rise tracks a power curve from floor to shoulder and terminal_seg is a
 * linear ramp from WEEKLY_TERMINAL at r=0 to shoulder at r=TERMINAL_WINDOWS.
 * Monotone increasing in x by construction.
 */

/** Seconds in a weekly window. */
export const WEEK_SECONDS = 604800;
/** Seconds in a 5-hour window. */
export const WINDOW_SECONDS = 18000;
/** Five-hour windows per weekly window: 604800 / 18000 = 33.6 (exact, not rounded). */
export const T = WEEK_SECONDS / WINDOW_SECONDS;

// Fixed tunables (defaults baked into dispatch-target-workers; the
// `target-workers` config schema in dispatch-config-load documents the same).
/** weekly_terminal_pct — terminal W at the reset. */
export const WEEKLY_TERMINAL = 100;
/** weekly_pace_floor_pct — early-week floor. */
export const FLOOR = 50;
/** weekly_increment_cap_pct — per-window hard ceiling. */
export const CAP = 10;
/** weekly_curve_power ("p") — convexity; >1 back-loads. */
export const POWER = 1;
/** weekly_terminal_windows — count of trailing 5-hour windows the terminal segment spans. */
export const TERMINAL_WINDOWS = 2;

/**
 * Derived shoulder anchor (= terminal − cap·windows = 80 with defaults);
 * not a config knob.
 */
export const SHOULDER = WEEKLY_TERMINAL - CAP * TERMINAL_WINDOWS;

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
 * The wall-clock date a fraction `f ∈ [0, 1]` of the weekly window maps to,
 * given the window resets at `weeklyResetsAt`. The conceptual inverse of
 * `elapsedWeekFraction`: `f = 0` is one full week before the reset
 * (`weeklyResetsAt − 7d`), `f = 1` is the reset itself. Pure — no `Date.now()`.
 */
export function fractionToWindowDate(fraction: number, weeklyResetsAt: Date): Date {
  return new Date(weeklyResetsAt.getTime() - (1 - fraction) * WEEK_SECONDS * 1000);
}

/**
 * A compact tick label for a date within the current weekly window: weekday +
 * hour, e.g. "Thu 9 AM". The single exported producer of x-axis tick labels —
 * the PACE panel wires it into `tickFormat` and the panel test compares against
 * it, so the test stays deterministic without pinning `TZ`.
 */
export function formatWindowTick(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric" }).format(date);
}

/**
 * The pace curve W(x) as a pure function of the elapsed-week fraction
 * `x ∈ [0, 1]`. Mirrors the awk `W_of` anchored floor→shoulder→terminal curve:
 *   r = (1 - x) * T  (remaining 5-hour windows)
 *   s = clamp((T - r) / (T - TERMINAL_WINDOWS), 0, 1)
 *   rise = FLOOR + (SHOULDER - FLOOR) * s^POWER
 *   terminal_seg = WEEKLY_TERMINAL - CAP * r
 *   W = max(FLOOR, rise, terminal_seg)
 */
export function paceCurveAtFraction(x: number): number {
  const r = (1 - x) * T;
  const s = clamp((T - r) / (T - TERMINAL_WINDOWS), 0, 1);
  const rise = FLOOR + (SHOULDER - FLOOR) * s ** POWER;
  const terminalSeg = WEEKLY_TERMINAL - CAP * r;
  let W = FLOOR;
  if (terminalSeg > W) W = terminalSeg;
  if (rise > W) W = rise;
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
