import * as Plot from "@observablehq/plot";
import { MS_PER_WEEK } from "../balance.js";

export const AXIS_WIDTH = 50;
export const MARGIN_RIGHT = 20;
export const MARGIN_BOTTOM = 50;

/** Compute scrollable chart body width from week count and panel width, filling at least the visible area. */
export function computeChartWidth(weekCount: number, panelWidth: number, containerWidth: number): number {
  return Math.max(weekCount * panelWidth + MARGIN_RIGHT, containerWidth - AXIS_WIDTH);
}

/** Render a fixed y-axis SVG column that stays visible during horizontal scrolling. */
export function renderAxisSvg(options: {
  height: number;
  style: Record<string, string>;
  yDomain: [number, number];
}): SVGSVGElement | HTMLElement {
  return Plot.plot({
    width: AXIS_WIDTH,
    height: options.height,
    marginBottom: MARGIN_BOTTOM,
    marginLeft: AXIS_WIDTH - 1,
    marginRight: 0,
    style: options.style,
    x: { axis: null, domain: [0, 1] },
    y: { label: "$", grid: false, domain: options.yDomain },
    marks: [Plot.ruleY([0])],
  });
}

export function getThemeFg(container: HTMLElement): string {
  return readThemeVar(container, "--fg");
}

export function readThemeVar(container: HTMLElement, name: string, style?: CSSStyleDeclaration): string {
  const value = (style ?? getComputedStyle(container)).getPropertyValue(name).trim();
  if (!value) throw new Error(`Missing required CSS custom property ${name}`);
  return value;
}

export function computePanelWidth(budgetCount: number): number {
  return Math.max(budgetCount * 30 + 30, 80);
}

const WINDOW_WEEKS = 12;

/** Return the subset of weekTimestamps in (anchorMs - WINDOW_WEEKS weeks, anchorMs]. */
export function filterToWindow(weekTimestamps: readonly number[], anchorMs: number): Set<number> {
  const cutoff = anchorMs - WINDOW_WEEKS * MS_PER_WEEK;
  const result = new Set<number>();
  for (const ms of weekTimestamps) {
    if (ms > cutoff && ms <= anchorMs) result.add(ms);
  }
  return result;
}

/** Assemble the standard chart-layout DOM: fixed y-axis + horizontally scrollable chart body. */
export function assembleChartLayout(axisSvg: Element, chartSvg: Element): { layout: HTMLDivElement; wrapper: HTMLDivElement } {
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
