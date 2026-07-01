// Pure, DOM-free core for BudgetPaceChart. This module is deliberately free of
// any `@observablehq/plot` import and any reference to `document`/`window`/DOM,
// so the data-transform logic can be unit-tested in a plain node environment.
// It shapes pre-computed pace series into per-line render specs; the React
// island (BudgetPaceChart.tsx) consumes those specs to draw the chart.

/** A single point on a pace curve. x ∈ [0,1] (window fraction); y is a percentage in [0,100]. */
export interface PacePoint {
  x: number;
  y: number;
}

/** The pre-computed input series for a budget pace chart. */
export interface BudgetPaceSeries {
  /** The pacing/target backdrop curve (drawn dotted). */
  pace: PacePoint[];
  /** The current in-progress window (full opacity, gets a "now" dot at its last point). */
  current: PacePoint[];
  /** Prior completed windows, ordered oldest -> newest. Age-graduated opacity; clamped to the most recent 3. */
  previous: PacePoint[][];
}

/** The most recent N prior windows are kept; older ones are dropped. */
export const MAX_PRIOR_WINDOWS = 3;

/**
 * Returns the most recent `MAX_PRIOR_WINDOWS` prior windows, preserving
 * oldest->newest order. Passing more than 3 keeps only the 3 most recent
 * (drops the oldest).
 */
export function selectPriorWindows(previous: PacePoint[][]): PacePoint[][] {
  return previous.slice(-MAX_PRIOR_WINDOWS);
}

/**
 * Returns `count` stroke opacities, oldest->newest, strictly increasing by
 * recency (oldest lowest, newest highest), all strictly between 0 and 1. This
 * is the age-graduated opacity ramp for prior windows. `count === 0` -> `[]`.
 */
export function priorWindowOpacities(count: number): number[] {
  if (count <= 0) return [];
  // Ramp from ~0.2 (oldest) to ~0.5 (newest), strictly increasing, in (0,1).
  const lowest = 0.2;
  const highest = 0.5;
  if (count === 1) return [highest];
  const step = (highest - lowest) / (count - 1);
  return Array.from({ length: count }, (_, i) => lowest + step * i);
}

/** One renderable line/segment spec derived from a pace series. */
export interface PaceLineSpec {
  role: "pace" | "current" | "previous";
  points: PacePoint[];
  stroke: string; // a CSS color string (may be a var(--chart-*) reference)
  strokeOpacity: number;
  strokeWidth: number;
  strokeDasharray?: string;
}

/** Stroke colors for the three roles. */
export interface BudgetPaceColors {
  pace: string; // pacing/backdrop stroke
  current: string; // current-window stroke
  prior: string; // prior-window stroke
}

/**
 * Shapes a pace series into ordered per-line render specs:
 *   1. the dotted `pace` backdrop,
 *   2. one `previous` spec per selected prior window (age-graduated opacity,
 *      oldest spec gets the lowest opacity),
 *   3. the full-opacity `current` window.
 * The "now" dot is added by the island from the last `current` point, not here.
 */
export function buildPaceLineSpecs(series: BudgetPaceSeries, colors: BudgetPaceColors): PaceLineSpec[] {
  const specs: PaceLineSpec[] = [];

  // 1. Pace backdrop — dotted pacing line, styled separately from the windows.
  specs.push({
    role: "pace",
    points: series.pace,
    stroke: colors.pace,
    strokeOpacity: 1,
    strokeWidth: 1.5,
    strokeDasharray: "3,3",
  });

  // 2. Prior windows — clamped to the most recent 3, age-graduated opacity.
  const selected = selectPriorWindows(series.previous);
  const opacities = priorWindowOpacities(selected.length);
  selected.forEach((points, i) => {
    specs.push({
      role: "previous",
      points,
      stroke: colors.prior,
      strokeOpacity: opacities[i],
      strokeWidth: 1.5,
    });
  });

  // 3. Current window — full opacity, thicker stroke.
  specs.push({
    role: "current",
    points: series.current,
    stroke: colors.current,
    strokeOpacity: 1,
    strokeWidth: 2,
  });

  return specs;
}
