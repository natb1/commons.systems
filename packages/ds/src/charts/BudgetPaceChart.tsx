// Domain-agnostic budget pace chart, generalized from the office-hours app's
// imperative Observable Plot pace panel. It takes PRE-COMPUTED series (a pacing
// backdrop, the current in-progress window, and prior completed windows) and
// renders them as a React "island": an effect appends an imperatively-built
// element into a ref'd <div>, and the teardown empties it so React removes the
// prior render before re-running on a data or color change.
//
// All DOM/Plot work happens inside the effect, which never runs during
// server-side rendering (renderToStaticMarkup, used in ds vitest's node env).
// The initial server-rendered output is just the empty host <div>, so importing
// this module and rendering it to a string does not require a DOM or Plot.
import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import {
  buildPaceLineSpecs,
  type PacePoint,
} from "./budget-pace-chart-core.ts";
import {
  mountResponsiveChart,
  getThemeFg,
  renderAxisSvg,
  assembleChartLayout,
  buildLegend,
  AXIS_WIDTH,
  MARGIN_RIGHT,
  MARGIN_BOTTOM,
  CHART_HEIGHT,
} from "./chart-util.ts";

export interface BudgetPaceChartProps {
  pace: PacePoint[];
  current: PacePoint[];
  previous: PacePoint[][];
  /** Stroke colors. Default to --chart-* token references so the chart tracks ds theme. */
  paceColor?: string; // default "var(--chart-5)"
  currentColor?: string; // default "var(--chart-6)"
  priorColor?: string; // default "var(--chart-6)"
  /** Optional legend labels. */
  currentLabel?: string; // default "current"
  paceLabel?: string; // default "pace"
}

export function BudgetPaceChart({
  pace,
  current,
  previous,
  paceColor = "var(--chart-5)",
  currentColor = "var(--chart-6)",
  priorColor = "var(--chart-6)",
  currentLabel = "current",
  paceLabel = "pace",
}: BudgetPaceChartProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const section = document.createElement("section");
    section.className = "budget-pace-chart";

    // Empty state — render a simple placeholder, no chart.
    if (current.length === 0 && previous.length === 0 && pace.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No pace data.";
      section.appendChild(empty);
      host.appendChild(section);
      return () => {
        host.replaceChildren();
      };
    }

    // Block-level slot occupying the content-box width; the ResizeObserver reads
    // its clientWidth. Keep it block so the .chart-scroll-wrapper inside clips.
    const slot = document.createElement("div");

    const disconnectObserver = mountResponsiveChart(slot, (width) => {
      const chartWidth = width - AXIS_WIDTH;
      const sharedStyle = { background: "transparent", color: getThemeFg(section) };

      const specs = buildPaceLineSpecs(
        { pace, current, previous },
        { pace: paceColor, current: currentColor, prior: priorColor },
      );

      const axisSvg = renderAxisSvg({
        height: CHART_HEIGHT,
        style: sharedStyle,
        yDomain: [0, 100],
        label: "%",
      });

      const marks: Plot.Markish[] = specs.map((spec) =>
        Plot.lineY(spec.points, {
          x: "x",
          y: "y",
          stroke: spec.stroke,
          strokeWidth: spec.strokeWidth,
          strokeOpacity: spec.strokeOpacity,
          strokeDasharray: spec.strokeDasharray,
          curve: "monotone-x",
        }),
      );
      // "Now" marker at the last point of the current window.
      if (current.length > 0) {
        const latest = current[current.length - 1];
        marks.push(Plot.dot([latest], { x: "x", y: "y", fill: currentColor, r: 4 }));
      }

      const chartSvg = Plot.plot({
        width: chartWidth,
        height: CHART_HEIGHT,
        marginBottom: MARGIN_BOTTOM,
        marginLeft: 0,
        marginRight: MARGIN_RIGHT,
        style: sharedStyle,
        x: { domain: [0, 1], label: null, ticks: [0, 0.25, 0.5, 0.75, 1] },
        y: { domain: [0, 100], label: null, axis: null, grid: true },
        marks,
      });

      chartSvg.style.width = `${chartWidth}px`;
      chartSvg.style.minWidth = `${chartWidth}px`;

      const { layout } = assembleChartLayout(axisSvg, chartSvg);
      return layout;
    });

    const legend = buildLegend([
      { label: currentLabel, color: currentColor },
      { label: paceLabel, color: paceColor, dashed: true },
    ]);

    section.append(slot, legend);
    host.appendChild(section);

    return () => {
      disconnectObserver();
      host.replaceChildren();
    };
  }, [pace, current, previous, paceColor, currentColor, priorColor, currentLabel, paceLabel]);

  return <div ref={ref} />;
}
