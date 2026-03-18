import * as Plot from "@observablehq/plot";

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
  const fg = getComputedStyle(container).getPropertyValue("--fg").trim();
  if (!fg) throw new Error("Missing required CSS custom property --fg");
  return fg;
}

export function computePanelWidth(budgetCount: number): number {
  return Math.max(budgetCount * 60 + 40, 120);
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
