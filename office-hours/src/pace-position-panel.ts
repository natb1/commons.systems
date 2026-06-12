import * as Plot from "@observablehq/plot";
import { type UsageSample } from "./usage-samples.js";
import { segmentByWeek, aheadBehindDelta, paceBackdrop } from "./pace-position.js";
import { selectLatestSample } from "./capacity-band.js";
import { elapsedWeekFraction } from "./weekly-pace-curve.js";
import {
  getThemeFg,
  assembleChartLayout,
  buildLegend,
  renderAxisSvg,
  AXIS_WIDTH,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
} from "./chart-util.js";

const COLOR_WEEKLY = "#26a69a";
const COLOR_BACKDROP = "#ab47bc";

/** Approximate visible width; the x domain is bounded [0, 1] so no scrolling. */
const CONTAINER_WIDTH = 640;
const CHART_HEIGHT = 220;

/**
 * Renders the position-on-curve pace panel: the fixed weekly pace curve W(x)
 * drawn once across x ∈ [0, 1] as a muted backdrop, each weekly-usage sample
 * re-projected onto its own elapsed-week fraction, segmented per weekly window
 * (so no line crosses a reset boundary), the latest sample marked as "now",
 * and the ahead/behind-pace delta surfaced as text.
 *
 * Weekly-only — the 5-hour series stays in the capacity snapshot band.
 *
 * Pure: does not mutate the input array. `now` is not needed because each
 * sample carries its own reset time; the latest sample defines "now".
 */
export function renderPacePositionPanel(samples: UsageSample[], _now: Date): HTMLElement {
  const section = document.createElement("section");
  section.className = "capacity-pace";

  const heading = document.createElement("h2");
  heading.className = "capacity-pace-heading";
  heading.textContent = "PACE";
  section.appendChild(heading);

  if (samples.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No usage history to chart pace position.";
    section.appendChild(empty);
    return section;
  }

  const segments = segmentByWeek(samples);
  const latest = selectLatestSample(samples)!;
  const backdrop = paceBackdrop();
  const nowX = elapsedWeekFraction(latest.sampledAt, latest.weeklyResetsAt);

  const container = document.createElement("div");
  container.className = "capacity-pace-chart";

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  const chartWidth = CONTAINER_WIDTH - AXIS_WIDTH;
  const yDomain: [number, number] = [0, 100];

  const axisSvg = renderAxisSvg({ height: CHART_HEIGHT, style: sharedStyle, yDomain, label: "%" });

  const chartSvg = Plot.plot({
    width: chartWidth,
    height: CHART_HEIGHT,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: 0,
    marginRight: MARGIN_RIGHT,
    style: sharedStyle,
    x: { domain: [0, 1], label: null },
    y: { domain: yDomain, label: null, axis: null, grid: true },
    marks: [
      // 1. Backdrop — the fixed W(x) ramp drawn once across x∈[0,1], muted.
      Plot.lineY(backdrop, {
        x: "x",
        y: "w",
        stroke: COLOR_BACKDROP,
        strokeWidth: 1.5,
        strokeDasharray: "3,3",
        curve: "monotone-x",
      }),
      // 2. Per-week trails — one mark per segment so no line crosses a reset boundary.
      ...segments.map((seg) =>
        Plot.lineY(seg.points, {
          x: "x",
          y: "weeklyUsedPct",
          stroke: COLOR_WEEKLY,
          strokeWidth: seg.isCurrent ? 2 : 1.5,
          strokeOpacity: seg.isCurrent ? 1 : 0.35,
          curve: "monotone-x",
        }),
      ),
      // 3. Now marker — the latest sample's position on the curve.
      Plot.dot([{ x: nowX, weeklyUsedPct: latest.weeklyUsedPct }], {
        x: "x",
        y: "weeklyUsedPct",
        fill: COLOR_WEEKLY,
        r: 4,
      }),
    ],
  });

  chartSvg.style.width = `${chartWidth}px`;
  chartSvg.style.minWidth = `${chartWidth}px`;

  const { layout } = assembleChartLayout(axisSvg, chartSvg);

  const delta = aheadBehindDelta(latest);
  const n = Math.round(Math.abs(delta));
  const deltaEl = document.createElement("p");
  deltaEl.className = "capacity-pace-delta";
  deltaEl.textContent = delta >= 0 ? `${n} pts ahead of pace` : `${n} pts behind pace`;

  const legend = buildLegend([
    { label: "weekly %", color: COLOR_WEEKLY },
    { label: "pace W(x)", color: COLOR_BACKDROP, dashed: true },
  ]);

  section.append(deltaEl, layout, legend);

  return section;
}
