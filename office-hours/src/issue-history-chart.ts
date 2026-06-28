import * as Plot from "@observablehq/plot";
import { sampleTotal, type IssueSample } from "./issue-samples.js";
import { fitBacklogRunway, runwayVerdict } from "./backlog-runway.js";
import {
  getThemeFg,
  readChartPalette,
  assembleChartLayout,
  buildLegend,
  computeChartWidth,
  renderAxisSvg,
  mountResponsiveChart,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
  AXIS_WIDTH,
} from "./chart-util.js";

/** Per-sample chart width allocation along the time axis. */
const POINT_WIDTH = 60;
/** Readability ceiling on the chart's forward projection window (days). */
const MAX_PROJECTION_DAYS = 14;
const CHART_HEIGHT = 220;

interface Point {
  x: Date;
  openSecurity: number;
  openBug: number;
  openEnhancement: number;
  openOther: number;
}

/**
 * Renders the office-hours backlog-history panel: a stacked area chart of the
 * four mutually-exclusive work-type buckets — security (bottom), bug,
 * enhancement, other (top) — over sampledAt, the four summing to total backlog,
 * plus a dashed runway projection line (fitted on the total) extended to the
 * queue's zero-crossing when draining, plus a textContent-assertable runway
 * caption.
 *
 * Pure: does not mutate the input array. Returns the panel root element (which
 * receives panel-grid-full from the registry), or an empty-state element when
 * there are no samples.
 */
export function renderIssueHistoryChart(samples: IssueSample[]): HTMLElement {
  const container = document.createElement("div");
  container.className = "backlog-history";

  if (samples.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No backlog history to chart.";
    container.appendChild(empty);
    return container;
  }

  // Sort a copy ascending by sample time — input order is not guaranteed.
  const sorted = [...samples].sort((a, b) => a.sampledAt.getTime() - b.sampledAt.getTime());

  // A single sample, or multiple samples sharing one timestamp, yields a
  // zero-width time domain that Plot renders as a degenerate single-x chart.
  // Treat it as the empty state — fitBacklogRunway returns 'insufficient' here.
  if (sorted.length < 2 || sorted[0].sampledAt.getTime() === sorted[sorted.length - 1].sampledAt.getTime()) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No backlog history to chart.";
    container.appendChild(empty);
    return container;
  }

  const points: Point[] = sorted.map((s) => ({
    x: s.sampledAt,
    openSecurity: s.openSecurity,
    openBug: s.openBug,
    openEnhancement: s.openEnhancement,
    openOther: s.openOther,
  }));

  const maxTotal = Math.max(...sorted.map((s) => sampleTotal(s)));
  const yDomain: [number, number] = [0, Math.max(1, Math.ceil(maxTotal * 1.1))];

  const fg = getThemeFg(container);
  // DS categorical palette, read from the container at runtime.
  const palette = readChartPalette(container);
  // Precedence buckets mapped onto the DS palette by hue (security warmest →
  // other coolest), with projection on the dashed-overlay slot.
  const COLOR_SECURITY = palette[2]; // --chart-3 terracotta
  const COLOR_BUG = palette[1]; // --chart-2 amber
  const COLOR_ENHANCEMENT = palette[0]; // --chart-1 slate-blue
  const COLOR_OTHER = palette[5]; // --chart-6 teal
  const COLOR_PROJECTION = palette[4]; // --chart-5 tan (dashed projection)
  const sharedStyle = { background: "transparent", color: fg };

  const axisSvg = renderAxisSvg({ height: CHART_HEIGHT, style: sharedStyle, yDomain, label: "issues" });

  // Stacked areas in precedence order: security (bottom), bug, enhancement,
  // other (top), each offset by the cumulative sum of the buckets beneath it.
  const marks: Plot.Markish[] = [
    Plot.areaY(points, {
      x: "x",
      y1: 0,
      y2: "openSecurity",
      fill: COLOR_SECURITY,
      fillOpacity: 0.6,
      curve: "monotone-x",
    }),
    Plot.areaY(points, {
      x: "x",
      y1: (d: Point) => d.openSecurity,
      y2: (d: Point) => d.openSecurity + d.openBug,
      fill: COLOR_BUG,
      fillOpacity: 0.6,
      curve: "monotone-x",
    }),
    Plot.areaY(points, {
      x: "x",
      y1: (d: Point) => d.openSecurity + d.openBug,
      y2: (d: Point) => d.openSecurity + d.openBug + d.openEnhancement,
      fill: COLOR_ENHANCEMENT,
      fillOpacity: 0.6,
      curve: "monotone-x",
    }),
    Plot.areaY(points, {
      x: "x",
      y1: (d: Point) => d.openSecurity + d.openBug + d.openEnhancement,
      y2: (d: Point) => d.openSecurity + d.openBug + d.openEnhancement + d.openOther,
      fill: COLOR_OTHER,
      fillOpacity: 0.6,
      curve: "monotone-x",
    }),
  ];

  const fit = fitBacklogRunway(samples);

  const first = sorted[0].sampledAt.getTime();
  const last = sorted[sorted.length - 1].sampledAt.getTime();
  const dataDays = (last - first) / 86_400_000;
  const isDraining = fit.state === "draining" && dataDays > 0;

  // Cap the forward projection to a bounded window so empty future space no
  // longer dominates the x-axis. The cap binds on whichever is smallest:
  //   - dataDays: the future window never exceeds the past (projection stays
  //     <= 50% of the chart even for a short history);
  //   - MAX_PROJECTION_DAYS: a hard ceiling for long histories;
  //   - daysUntilEmpty: end at the real crossing when the queue empties soon.
  const projectionDays =
    fit.state === "draining" && isDraining
      ? Math.min(fit.daysUntilEmpty, dataDays, MAX_PROJECTION_DAYS)
      : 0;
  const projectionEnd = new Date(last + projectionDays * 86_400_000);

  // x domain and the projection mark are width-independent — compute once.
  const xDomain: [Date, Date] = isDraining
    ? [sorted[0].sampledAt, projectionEnd]
    : [sorted[0].sampledAt, sorted[sorted.length - 1].sampledAt];

  if (isDraining) {
    // Dashed projection from the fitted value at the last actual point down to
    // the capped projection horizon (the real zero-crossing when the cap does
    // not bind; a positive fitted value at the window edge when it does).
    const fittedLast = Math.max(0, fit.slope * dataDays + fit.intercept);
    marks.push(
      Plot.lineY(
        [
          { x: sorted[sorted.length - 1].sampledAt, y: fittedLast },
          { x: projectionEnd, y: Math.max(0, fit.slope * (dataDays + projectionDays) + fit.intercept) },
        ],
        {
          x: "x",
          y: "y",
          stroke: COLOR_PROJECTION,
          strokeWidth: 2,
          strokeDasharray: "8,4",
          curve: "linear",
        },
      ),
    );
  }

  // Runway caption — textContent-assertable, mirroring queue-band's runway DOM.
  const caption = document.createElement("p");
  caption.className = "backlog-runway";
  const verdict = runwayVerdict(fit);
  const stateSpan = document.createElement("span");
  stateSpan.className = "backlog-runway-state";
  stateSpan.classList.add(verdict.state);
  stateSpan.textContent = verdict.text;
  caption.appendChild(stateSpan);

  const legend = buildLegend([
    { label: "security", color: COLOR_SECURITY },
    { label: "bug", color: COLOR_BUG },
    { label: "enhancement", color: COLOR_ENHANCEMENT },
    { label: "other", color: COLOR_OTHER },
    { label: "projection", color: COLOR_PROJECTION, dashed: true },
  ]);

  // Block-level slot the ResizeObserver measures; .chart-scroll-wrapper inside
  // clips horizontally so the slot stays at the panel content-box width.
  const slot = document.createElement("div");

  mountResponsiveChart(slot, (width) => {
    let chartWidth: number;
    if (isDraining) {
      const pxPerDay = (points.length * POINT_WIDTH) / dataDays;
      chartWidth = Math.max(
        points.length * POINT_WIDTH + pxPerDay * projectionDays + MARGIN_RIGHT,
        width - AXIS_WIDTH,
      );
    } else {
      chartWidth = computeChartWidth(points.length, POINT_WIDTH, width);
    }

    const chartSvg = Plot.plot({
      width: chartWidth,
      height: CHART_HEIGHT,
      marginBottom: MARGIN_BOTTOM,
      marginLeft: 0,
      marginRight: MARGIN_RIGHT,
      style: sharedStyle,
      x: { type: "time", label: null, domain: xDomain },
      y: { label: null, axis: null, grid: true, domain: yDomain },
      marks,
    });

    chartSvg.style.width = `${chartWidth}px`;
    chartSvg.style.minWidth = `${chartWidth}px`;

    const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);

    // Scroll to the newest data (rightmost). scrollWidth is 0 for a detached
    // element, and the slot is detached on the first paint, so defer to the next
    // frame — by then a layout pass has run.
    requestAnimationFrame(() => {
      wrapper.scrollLeft = wrapper.scrollWidth;
    });

    return layout;
  });

  container.replaceChildren(slot, caption, legend);

  return container;
}
