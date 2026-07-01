// Imperative chart layout helpers ported (self-contained copy) from the
// office-hours app's chart-util.ts, trimmed to only what the ds BudgetPaceChart
// island needs. These touch the DOM and Observable Plot, so they run only in
// the browser (inside the island's useEffect), never at module import time.
import * as Plot from "@observablehq/plot";

export const AXIS_WIDTH = 50;
export const MARGIN_RIGHT = 20;
export const MARGIN_BOTTOM = 50;
const FALLBACK_CONTAINER_WIDTH = 640;
export const CHART_HEIGHT = 220;

/**
 * Mounts a chart into `slot` at its current width, then re-renders on resize.
 * Falls back to a fixed width when the slot has no measured width or when
 * ResizeObserver is unavailable. Returns a cleanup function that disconnects
 * the ResizeObserver; callers should invoke it when the slot is removed.
 */
export function mountResponsiveChart(slot: HTMLElement, render: (width: number) => Node): () => void {
  const w = slot.clientWidth || FALLBACK_CONTAINER_WIDTH;
  slot.replaceChildren(render(w));
  let last = w;
  if (typeof ResizeObserver === "undefined") return () => {};
  const obs = new ResizeObserver((entries) => {
    if (!slot.isConnected) {
      obs.disconnect();
      return;
    }
    const entry = entries[entries.length - 1];
    const next = entry.contentRect.width > 0 ? Math.round(entry.contentRect.width) : FALLBACK_CONTAINER_WIDTH;
    if (Math.abs(next - last) >= 1) {
      last = next;
      slot.replaceChildren(render(next));
    }
  });
  obs.observe(slot);
  return () => obs.disconnect();
}

/** Reads a trimmed CSS custom property off `container` (or a provided computed style). */
export function readThemeVar(container: HTMLElement, name: string, style?: CSSStyleDeclaration): string {
  const value = (style ?? getComputedStyle(container)).getPropertyValue(name).trim();
  return value || "";
}

/** The theme foreground color, falling back to a light gray. */
export function getThemeFg(container: HTMLElement): string {
  return readThemeVar(container, "--fg") || "#ddd";
}

/**
 * Renders the standalone y-axis SVG that sits to the left of the scrolling
 * chart body, so the axis stays pinned while the chart scrolls horizontally.
 */
export function renderAxisSvg(options: {
  height: number;
  style: Record<string, string>;
  yDomain: [number, number];
  label?: string;
}): SVGSVGElement | HTMLElement {
  return Plot.plot({
    width: AXIS_WIDTH,
    height: options.height,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: AXIS_WIDTH - 1,
    marginRight: 0,
    style: options.style,
    x: { axis: null, domain: [0, 1] },
    y: { label: options.label ?? "%", grid: false, domain: options.yDomain },
    marks: [Plot.ruleY([0])],
  });
}

/** Assembles the pinned-axis + scrolling-chart two-column layout. */
export function assembleChartLayout(
  axisSvg: Element,
  chartSvg: Element,
): { layout: HTMLDivElement; wrapper: HTMLDivElement } {
  const layout = document.createElement("div");
  layout.className = "chart-layout";
  const axisDiv = document.createElement("div");
  axisDiv.className = "chart-y-axis";
  axisDiv.appendChild(axisSvg);
  const wrapper = document.createElement("div");
  wrapper.className = "chart-scroll-wrapper";
  wrapper.appendChild(chartSvg);
  layout.appendChild(axisDiv);
  layout.appendChild(wrapper);
  return { layout, wrapper };
}

/** One legend entry: a label, its swatch color, and whether the swatch is dashed. */
export interface LegendEntry {
  label: string;
  color: string;
  dashed?: boolean;
}

/** Builds a horizontal legend from a list of entries. */
export function buildLegend(entries: LegendEntry[]): HTMLElement {
  const legend = document.createElement("div");
  legend.className = "trend-legend";
  for (const entry of entries) {
    const item = document.createElement("div");
    item.className = "trend-legend-item";
    const line = document.createElement("span");
    line.className = "legend-line";
    if (entry.dashed) {
      line.style.backgroundImage = `repeating-linear-gradient(90deg, ${entry.color} 0 4px, transparent 4px 7px)`;
      line.style.backgroundColor = "transparent";
    } else {
      line.style.backgroundColor = entry.color;
    }
    const label = document.createElement("span");
    label.textContent = entry.label;
    item.appendChild(line);
    item.appendChild(label);
    legend.appendChild(item);
  }
  return legend;
}
