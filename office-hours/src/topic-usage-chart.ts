import * as Plot from "@observablehq/plot";
import {
  type TopicUsageDoc,
  TOPIC_BUCKETS,
  TYPE_BUCKETS,
} from "./topic-usage.js";
import {
  getThemeFg,
  readChartPalette,
  assembleChartLayout,
  buildLegend,
  computeChartWidth,
  renderAxisSvg,
  mountResponsiveChart,
  type LegendEntry,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
  POINT_WIDTH,
  CHART_HEIGHT,
} from "./chart-util.js";

export type TopicUsageAxis = "topic" | "type";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Trailing window length, in calendar days, inclusive of the current day. */
const WINDOW_DAYS = 7;

interface MeanPoint {
  date: Date;
  mean: number;
}

/** Parse a "YYYY-MM-DD" date string into a UTC-midnight Date, timezone-stable. */
function parseDocDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/**
 * Build the trailing-7-calendar-day moving-average series for one bucket on the
 * given axis. `docs` are expected in ascending date order (Unit 1's reader
 * reverses them so), but the window is computed by date arithmetic, so the
 * result is robust to ordering and to gaps in the daily series.
 *
 * For each day `d` present in `docs`, `mean` is the average of that bucket's
 * `priceProxyUsd` over the docs whose date falls in `[d - 6 days, d]` inclusive.
 * Days with no doc are simply absent from the window — the mean is taken over
 * the present days only, never treating a missing day as a zero. A doc that
 * lacks the bucket contributes 0 for its own day's value.
 */
export function topicUsageSeries(
  docs: TopicUsageDoc[],
  bucket: string,
  axis: TopicUsageAxis,
): MeanPoint[] {
  const parsed = docs.map((doc) => ({ doc, time: parseDocDate(doc.date).getTime() }));

  return parsed.map(({ time }) => {
    const lo = time - (WINDOW_DAYS - 1) * DAY_MS;
    let sum = 0;
    let count = 0;
    for (const p of parsed) {
      if (p.time >= lo && p.time <= time) {
        const map = axis === "topic" ? p.doc.byTopic : p.doc.byType;
        sum += map[bucket]?.priceProxyUsd ?? 0;
        count += 1;
      }
    }
    return { date: new Date(time), mean: count > 0 ? sum / count : 0 };
  });
}

/**
 * Renders the topic-usage dashboard panel: a single time-axis chart plotting the
 * trailing-7-day moving average of price-proxy ($) spend, one line per bucket on
 * the chosen axis (the nine topics, or the three issue types). A bucket whose
 * windowed values are all zero draws no line. `other` is a regular visible line.
 *
 * Pure: does not mutate the input array. Returns the composed panel element, or
 * an empty-state element when there are no docs.
 */
export function renderTopicUsageChart(
  docs: TopicUsageDoc[],
  axis: TopicUsageAxis,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "topic-usage-chart";

  if (docs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No topic usage to chart.";
    container.appendChild(empty);
    return container;
  }

  const buckets = axis === "topic" ? TOPIC_BUCKETS : TYPE_BUCKETS;

  // Build each bucket's trailing-mean series, keeping only buckets that have any
  // non-zero windowed value — an all-zero (or absent) bucket draws no line.
  const drawn: { bucket: string; series: MeanPoint[] }[] = [];
  for (const bucket of buckets) {
    const series = topicUsageSeries(docs, bucket, axis);
    if (series.some((p) => p.mean > 0)) {
      drawn.push({ bucket, series });
    }
  }

  // DS categorical palette, read from the container at runtime. There are up to
  // 9 topic buckets but only 6 DS tokens, so the per-bucket color cycles the 6
  // tokens by index (i % 6) over the DRAWN buckets.
  const palette = readChartPalette(container);
  const bucketColor = (i: number): string => palette[i % palette.length];

  const legend = buildLegend(
    drawn.map(({ bucket }, i): LegendEntry => ({ label: bucket, color: bucketColor(i) })),
  );

  // The shared x domain spans the full date range so the chart frame is stable
  // regardless of which buckets are drawn.
  const allDates = docs.map((d) => parseDocDate(d.date));
  allDates.sort((a, b) => a.getTime() - b.getTime());
  const xDomain: [Date, Date] = [allDates[0], allDates[allDates.length - 1]];

  // y domain from the max mean across all drawn series.
  let maxMean = 0;
  for (const { series } of drawn) {
    for (const p of series) {
      if (p.mean > maxMean) maxMean = p.mean;
    }
  }
  const yDomain: [number, number] = [0, maxMean > 0 ? maxMean : 1];

  const fg = getThemeFg(container);
  const sharedStyle = { background: "transparent", color: fg };

  // Block-level slot the ResizeObserver measures; the .chart-scroll-wrapper
  // inside the layout clips horizontally so the slot stays at panel width.
  const slot = document.createElement("div");

  mountResponsiveChart(slot, (width) => {
    const chartWidth = computeChartWidth(docs.length, POINT_WIDTH, width);

    const axisSvg = renderAxisSvg({
      height: CHART_HEIGHT,
      style: sharedStyle,
      yDomain,
      label: "$",
    });

    const chartSvg = Plot.plot({
      width: chartWidth,
      height: CHART_HEIGHT,
      marginBottom: MARGIN_BOTTOM,
      marginLeft: 0,
      marginRight: MARGIN_RIGHT,
      style: sharedStyle,
      x: { type: "time", label: null, domain: xDomain },
      y: { label: null, axis: null, grid: true, domain: yDomain },
      marks: drawn.map(({ series }, i) =>
        Plot.lineY(series, {
          x: "date",
          y: "mean",
          stroke: bucketColor(i),
          strokeWidth: 2,
          curve: "monotone-x",
        }),
      ),
    });

    chartSvg.style.width = `${chartWidth}px`;
    chartSvg.style.minWidth = `${chartWidth}px`;

    const { layout, wrapper } = assembleChartLayout(axisSvg, chartSvg);

    // Scroll the body to the newest data (rightmost). The slot is detached on the
    // first paint, so scrollWidth is 0 until a layout pass — defer to next frame.
    requestAnimationFrame(() => {
      wrapper.scrollLeft = wrapper.scrollWidth;
    });

    return layout;
  });

  container.replaceChildren(slot, legend);

  return container;
}
