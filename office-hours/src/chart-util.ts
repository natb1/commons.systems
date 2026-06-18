import * as Plot from "@observablehq/plot";

/**
 * Shared warm chart palette — the single source of truth for series hues across
 * the office-hours charts, tuned to read on the warm-dark shell (`--bg` #1a1714,
 * `--surface` #252017). Roles map to each chart's series semantics:
 *
 * - `primary`   — amber/orange, the leading line/area series (help-wanted,
 *   5-hour %, active workers).
 * - `secondary` — warm gold, the second series (other, weekly %, weekly).
 * - `tertiary`  — warm tan/terracotta for dashed overlays (projection, pace W,
 *   target, backdrop), distinct from `primary` in both hue and lightness.
 *
 * The reset/danger color is intentionally NOT a palette constant — it is a
 * runtime read of the `--danger` theme token (see `readThemeVar`), so it tracks
 * theme changes rather than freezing a hex here.
 */
export const CHART_PALETTE = {
  primary: "#e8943a",
  secondary: "#d4a017",
  tertiary: "#c98a5e",
} as const;

export const AXIS_WIDTH = 50;
export const MARGIN_RIGHT = 20;
export const MARGIN_BOTTOM = 50;
/** Per-sample chart width allocation along the time axis. */
export const POINT_WIDTH = 60;
/** Approximate visible width before horizontal scrolling kicks in. */
export const CONTAINER_WIDTH = 640;
export const CHART_HEIGHT = 220;

/** Compute scrollable chart body width from point count and point width, filling at least the visible area. */
export function computeChartWidth(pointCount: number, pointWidth: number, containerWidth: number): number {
  return Math.max(pointCount * pointWidth + MARGIN_RIGHT, containerWidth - AXIS_WIDTH);
}

/** Read a CSS custom property from the container's computed style; returns fallback if empty or missing. */
export function readThemeVar(container: HTMLElement, name: string, style?: CSSStyleDeclaration): string {
  const value = (style ?? getComputedStyle(container)).getPropertyValue(name).trim();
  return value || "";
}

/** Return the foreground color from --fg, falling back to "#ddd" when absent (e.g. in happy-dom tests). */
export function getThemeFg(container: HTMLElement): string {
  return readThemeVar(container, "--fg") || "#ddd";
}

/** Render a fixed y-axis SVG column that stays visible during horizontal scrolling. */
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

export interface LegendEntry {
  label: string;
  color: string;
  dashed?: boolean;
}

/** Build a .trend-legend element from an array of entries. Dashed entries use a repeating-linear-gradient swatch. */
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
