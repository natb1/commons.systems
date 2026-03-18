export function getThemeFg(container: HTMLElement): string {
  const fg = getComputedStyle(container).getPropertyValue("--fg").trim();
  if (!fg) throw new Error("Missing required CSS custom property --fg");
  return fg;
}

export function computePanelWidth(budgetCount: number): number {
  return Math.max(budgetCount * 60 + 40, 120);
}
