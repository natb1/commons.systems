import * as Plot from "@observablehq/plot";

/**
 * The sanctioned DS categorical palette (`@commons-systems/ds`
 * tokens/colors.css `--chart-1` … `--chart-6`), as runtime CSS-var reads with
 * the DS hex values baked in as fallbacks. This is the single source of truth
 * for series hues across the office-hours charts.
 *
 * Why read at runtime rather than freeze hexes: when a stylesheet defines the
 * `--chart-*` tokens (a future DS-tokens import on the shell), the live values
 * win automatically and the charts track theme changes. Until then the DS-hex
 * fallbacks below — copied verbatim from tokens/colors.css — make the live read
 * resolve to the exact sanctioned palette, so vanilla and React render paths
 * are identical today.
 *
 * The palette is read INSIDE each chart's build function (where a `container`
 * element exists) via `readChartPalette` — `getComputedStyle` needs an element,
 * so this cannot be a module-top-level constant.
 *
 * The reset/danger color is intentionally NOT in this palette — it is a runtime
 * read of the `--danger` theme token (see `readThemeVar`), out of scope here.
 */
export const CHART_PALETTE_FALLBACKS = [
  "#4d6f8f", // --chart-1 slate-blue
  "#c98a3c", // --chart-2 amber
  "#a35d5d", // --chart-3 terracotta
  "#7a8c5a", // --chart-4 olive
  "#b08a4f", // --chart-5 tan
  "#5f8a8a", // --chart-6 teal
] as const;

/** The DS categorical palette read from the container at runtime, indexed 0..5 (--chart-1 .. --chart-6). */
export type ChartPalette = readonly [string, string, string, string, string, string];

/**
 * Read the DS categorical palette (`--chart-1` … `--chart-6`) from the
 * container's computed style, each falling back to its DS hex when the token is
 * absent (e.g. no stylesheet defines it, or a happy-dom test without a mock).
 * Must be called where `container` exists — the values are element-scoped reads.
 */
export function readChartPalette(container: HTMLElement): ChartPalette {
  const style = getComputedStyle(container);
  return CHART_PALETTE_FALLBACKS.map(
    (fallback, i) => readThemeVar(container, `--chart-${i + 1}`, style) || fallback,
  ) as unknown as ChartPalette;
}

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
