import * as Plot from "@observablehq/plot";
import { type AuditAggregate } from "./audit-aggregates.js";
import {
  getThemeFg,
  assembleChartLayout,
  buildLegend,
  computeChartWidth,
  renderAxisSvg,
  type LegendEntry,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
  POINT_WIDTH,
  CONTAINER_WIDTH,
  CHART_HEIGHT,
} from "./chart-util.js";

const SERIES_HIT_RATE = "cache hit %";
const COLOR_HIT_RATE = "#26a69a";

// Fixed palette cycled by phase index, so each phase line's color is known and
// can be reused verbatim in the legend (vs. Plot's auto categorical scale,
// whose assignment we'd have to reverse-engineer).
const PHASE_PALETTE = [
  "#42a5f5",
  "#ab47bc",
  "#ffa726",
  "#66bb6a",
  "#ec407a",
  "#29b6f6",
  "#d4e157",
  "#8d6e63",
];

interface SpendPoint {
  x: Date;
  spend: number | undefined;
}

interface HitRatePoint {
  x: Date;
  hitPct: number;
}

/**
 * Renders the audit-aggregate dashboard panel: two stacked sub-charts sharing a
 * time axis. The top sub-chart plots per-phase spend ($-proxy dollars), one
 * line per phase across the union of phase keys. The bottom sub-chart plots the
 * derived cache hit-rate trend (cacheRead / (cacheRead + cacheCreation)) as a
 * percentage. The two y-scales are incompatible, so they get separate plots and
 * separate fixed y-axes rather than a single dual-axis Plot.
 *
 * Pure: does not mutate the input array. Returns the composed panel element, or
 * an empty-state element when there are no aggregates.
 */
export function renderAuditAggregateChart(aggregates: AuditAggregate[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "audit-aggregate-chart";

  if (aggregates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No audit history to chart.";
    container.appendChild(empty);
    return container;
  }

  // Sort a copy ascending by computedAt — input order is not guaranteed.
  const sorted = [...aggregates].sort((a, b) => a.computedAt.getTime() - b.computedAt.getTime());

  // A single aggregate, or multiple aggregates sharing one timestamp, yields a
  // zero-width time domain that Plot renders as a degenerate single-x chart.
  if (sorted.length < 2 || sorted[0].computedAt.getTime() === sorted[sorted.length - 1].computedAt.getTime()) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Not enough audit history to chart — waiting for a second window.";
    container.appendChild(empty);
    return container;
  }

  // Union of phase keys across all windows, sorted for stable line/legend order.
  const phaseSet = new Set<string>();
  for (const a of sorted) {
    for (const key of Object.keys(a.phaseSpend)) phaseSet.add(key);
  }
  const phases = [...phaseSet].sort();

  const phaseEntries: LegendEntry[] = phases.map((phase, i) => ({
    label: phase,
    color: PHASE_PALETTE[i % PHASE_PALETTE.length],
  }));

  // Per-phase point series. A phase missing from a given window yields an
  // undefined y, which Plot gaps (does not draw a segment through).
  const phaseSeries: Record<string, SpendPoint[]> = {};
  for (const phase of phases) {
    phaseSeries[phase] = sorted.map((a) => ({
      x: a.computedAt,
      spend: phase in a.phaseSpend ? a.phaseSpend[phase] : undefined,
    }));
  }

  // Derived hit-rate trend, as a percentage. Guard the zero denominator by
  // omitting the point (no read + no creation = no meaningful rate).
  const hitRatePoints: HitRatePoint[] = [];
  for (const a of sorted) {
    const denom = a.cacheRead + a.cacheCreation;
    if (denom > 0) {
      hitRatePoints.push({ x: a.computedAt, hitPct: (a.cacheRead / denom) * 100 });
    }
  }

  // Shared x domain so the two stacked charts line up vertically regardless of
  // which windows a series happens to be defined in.
  const xDomain: [Date, Date] = [
    sorted[0].computedAt,
    sorted[sorted.length - 1].computedAt,
  ];

  const chartWidth = computeChartWidth(sorted.length, POINT_WIDTH, CONTAINER_WIDTH);

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  // --- Top sub-chart: per-phase spend ($). ---
  // Compute the spend domain across all phases×windows; the axis SVG and the
  // chart body are separate Plot instances, so both must share this exact array
  // (and CHART_HEIGHT / MARGIN_BOTTOM) for ticks to line up with the lines.
  let maxSpend = 0;
  for (const phase of phases) {
    for (const p of phaseSeries[phase]) {
      if (p.spend !== undefined && p.spend > maxSpend) maxSpend = p.spend;
    }
  }
  const spendDomain: [number, number] = [0, maxSpend > 0 ? maxSpend : 1];

  const spendAxisSvg = renderAxisSvg({
    height: CHART_HEIGHT,
    style: sharedStyle,
    yDomain: spendDomain,
    label: "$",
  });

  const spendChartSvg = Plot.plot({
    width: chartWidth,
    height: CHART_HEIGHT,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: 0,
    marginRight: MARGIN_RIGHT,
    style: sharedStyle,
    x: { type: "time", label: null, domain: xDomain },
    y: { label: null, axis: null, grid: true, domain: spendDomain },
    marks: phases.map((phase, i) =>
      Plot.lineY(phaseSeries[phase], {
        x: "x",
        y: "spend",
        stroke: PHASE_PALETTE[i % PHASE_PALETTE.length],
        strokeWidth: 2,
        curve: "monotone-x",
      }),
    ),
  });

  spendChartSvg.style.width = `${chartWidth}px`;
  spendChartSvg.style.minWidth = `${chartWidth}px`;

  const { layout: spendLayout, wrapper: spendWrapper } = assembleChartLayout(
    spendAxisSvg,
    spendChartSvg,
  );

  // --- Bottom sub-chart: derived hit-rate trend (%). ---
  const hitDomain: [number, number] = [0, 100];

  const hitAxisSvg = renderAxisSvg({
    height: CHART_HEIGHT,
    style: sharedStyle,
    yDomain: hitDomain,
    label: "%",
  });

  const hitChartSvg = Plot.plot({
    width: chartWidth,
    height: CHART_HEIGHT,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: 0,
    marginRight: MARGIN_RIGHT,
    style: sharedStyle,
    x: { type: "time", label: null, domain: xDomain },
    y: { label: null, axis: null, grid: true, domain: hitDomain },
    marks: [
      Plot.lineY(hitRatePoints, {
        x: "x",
        y: "hitPct",
        stroke: COLOR_HIT_RATE,
        strokeWidth: 2,
        curve: "monotone-x",
      }),
    ],
  });

  hitChartSvg.style.width = `${chartWidth}px`;
  hitChartSvg.style.minWidth = `${chartWidth}px`;

  const { layout: hitLayout, wrapper: hitWrapper } = assembleChartLayout(hitAxisSvg, hitChartSvg);

  const legend = buildLegend([...phaseEntries, { label: SERIES_HIT_RATE, color: COLOR_HIT_RATE }]);

  container.replaceChildren(spendLayout, hitLayout, legend);

  // Scroll both bodies to the newest data (rightmost) on first paint. The
  // container is still detached here (the view appends it after this returns),
  // so scrollWidth is 0 until a layout pass — defer to the next frame.
  requestAnimationFrame(() => {
    spendWrapper.scrollLeft = spendWrapper.scrollWidth;
    hitWrapper.scrollLeft = hitWrapper.scrollWidth;
  });

  return container;
}
