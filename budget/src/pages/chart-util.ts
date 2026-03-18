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
