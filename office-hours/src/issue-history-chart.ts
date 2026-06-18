import * as Plot from "@observablehq/plot";
import { type IssueSample } from "./issue-samples.js";
import { fitBacklogRunway, runwayVerdict } from "./backlog-runway.js";
import {
  getThemeFg,
  assembleChartLayout,
  buildLegend,
  computeChartWidth,
  renderAxisSvg,
  CHART_PALETTE,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
  AXIS_WIDTH,
} from "./chart-util.js";

/** Per-sample chart width allocation along the time axis. */
const POINT_WIDTH = 60;
/** Approximate visible width before horizontal scrolling kicks in. */
const CONTAINER_WIDTH = 640;
const CHART_HEIGHT = 220;

const COLOR_HELP_WANTED = CHART_PALETTE.primary;
const COLOR_OTHER = CHART_PALETTE.secondary;
const COLOR_PROJECTION = CHART_PALETTE.tertiary;

interface Point {
  x: Date;
  openHelpWanted: number;
  openOther: number;
}

/**
 * Renders the office-hours backlog-history panel: a stacked area chart of
 * openHelpWanted (bottom) + openOther (top) over sampledAt — the two summing to
 * total backlog — plus a dashed runway projection line extended to the queue's
 * zero-crossing when draining, plus a textContent-assertable runway caption.
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
    openHelpWanted: s.openHelpWanted,
    openOther: s.openOther,
  }));

  const maxTotal = Math.max(...points.map((p) => p.openHelpWanted + p.openOther));
  const yDomain: [number, number] = [0, Math.max(1, Math.ceil(maxTotal * 1.1))];

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  const axisSvg = renderAxisSvg({ height: CHART_HEIGHT, style: sharedStyle, yDomain, label: "issues" });

  // Stacked areas: openHelpWanted on the bottom, openOther stacked on top.
  const marks: Plot.Markish[] = [
    Plot.areaY(points, {
      x: "x",
      y1: 0,
      y2: "openHelpWanted",
      fill: COLOR_HELP_WANTED,
      fillOpacity: 0.6,
      curve: "monotone-x",
    }),
    Plot.areaY(points, {
      x: "x",
      y1: "openHelpWanted",
      y2: (d: Point) => d.openHelpWanted + d.openOther,
      fill: COLOR_OTHER,
      fillOpacity: 0.6,
      curve: "monotone-x",
    }),
  ];

  const fit = fitBacklogRunway(samples);

  let width: number;
  let xDomain: [Date, Date];

  const first = sorted[0].sampledAt.getTime();
  const last = sorted[sorted.length - 1].sampledAt.getTime();
  const dataDays = (last - first) / 86_400_000;

  if (fit.state === "draining" && dataDays > 0) {
    xDomain = [sorted[0].sampledAt, fit.crossingAt];

    const pxPerDay = (points.length * POINT_WIDTH) / dataDays;
    width = Math.max(
      points.length * POINT_WIDTH + pxPerDay * fit.daysUntilEmpty + MARGIN_RIGHT,
      CONTAINER_WIDTH - AXIS_WIDTH,
    );

    // Dashed projection from the fitted value at the last actual point down to
    // the zero-crossing.
    const fittedLast = Math.max(0, fit.slope * dataDays + fit.intercept);
    marks.push(
      Plot.lineY(
        [
          { x: sorted[sorted.length - 1].sampledAt, y: fittedLast },
          { x: fit.crossingAt, y: 0 },
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
  } else {
    xDomain = [sorted[0].sampledAt, sorted[sorted.length - 1].sampledAt];
    width = computeChartWidth(points.length, POINT_WIDTH, CONTAINER_WIDTH);
  }

  const chartSvg = Plot.plot({
    width,
    height: CHART_HEIGHT,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: 0,
    marginRight: MARGIN_RIGHT,
    style: sharedStyle,
    x: { type: "time", label: null, domain: xDomain },
    y: { label: null, axis: null, grid: true, domain: yDomain },
    marks,
  });

  chartSvg.style.width = `${width}px`;
  chartSvg.style.minWidth = `${width}px`;

  const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);

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
    { label: "help wanted", color: COLOR_HELP_WANTED },
    { label: "other", color: COLOR_OTHER },
    { label: "projection", color: COLOR_PROJECTION, dashed: true },
  ]);

  container.replaceChildren(layout, caption, legend);

  // Scroll to the newest data (rightmost) on first paint. scrollWidth is 0 for a
  // detached element, and this container is still detached here, so defer the
  // assignment to the next frame — by then a layout pass has run.
  requestAnimationFrame(() => {
    wrapper.scrollLeft = wrapper.scrollWidth;
  });

  return container;
}
