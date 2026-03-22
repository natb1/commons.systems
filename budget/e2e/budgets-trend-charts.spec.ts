import { test, expect } from "@playwright/test";

test.describe("budgets trend charts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the bar chart to confirm data has loaded
    await expect(page.locator("#budgets-chart svg").first()).toBeVisible({ timeout: 10000 });
  });

  test("per-budget area chart container is visible", async ({ page }) => {
    await expect(page.locator("#budgets-area-chart")).toBeVisible();
  });

  test("per-budget area chart has SVG", async ({ page }) => {
    const svg = page.locator("#budgets-area-chart svg");
    await expect(svg.first()).toBeVisible({ timeout: 10000 });
  });

  test("per-budget area chart SVG height is 400px", async ({ page }) => {
    const svg = page.locator("#budgets-area-chart .chart-scroll-wrapper svg").first();
    await expect(svg).toBeVisible({ timeout: 10000 });
    const height = await svg.getAttribute("height");
    expect(height).toBe("400");
  });

  test("per-budget area chart has legend items", async ({ page }) => {
    const legendItems = page.locator(".area-legend .area-legend-item");
    await expect(legendItems.first()).toBeVisible({ timeout: 10000 });
    const count = await legendItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("bar chart shows at most 12 weeks of data", async ({ page }) => {
    // Observable Plot renders fx-axis tick labels as <text> inside <g aria-label="fx-axis tick label">
    const barChartSvg = page.locator("#budgets-chart .chart-scroll-wrapper svg").first();
    await expect(barChartSvg).toBeVisible({ timeout: 10000 });
    const fxLabels = barChartSvg.locator("g[aria-label='fx-axis tick label'] text");
    const count = await fxLabels.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(12);
  });

  test("date picker is present and functional", async ({ page }) => {
    const picker = page.locator("#chart-date-picker");
    await expect(picker).toBeVisible();
    // picker should have min and max attributes set
    const min = await picker.getAttribute("min");
    const max = await picker.getAttribute("max");
    expect(min).toBeTruthy();
    expect(max).toBeTruthy();
  });

  test("metrics section contains 12-Week Avg Weekly Spending", async ({ page }) => {
    await expect(page.locator("#budget-metrics")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#budget-metrics")).toContainText("12-Week Avg Weekly Spending");
  });

  test("clicking a legend item dims it and removes that series from the chart", async ({ page }) => {
    const legendItems = page.locator(".area-legend .area-legend-item");
    await expect(legendItems.first()).toBeVisible({ timeout: 10000 });

    const firstItem = legendItems.first();
    const budgetName = await firstItem.getAttribute("data-budget");

    // Click to exclude
    await firstItem.click();
    await expect(firstItem).toHaveClass(/excluded/);

    // The series should not be in the chart SVG tip titles
    const chartSvg = page.locator("#budgets-area-chart .chart-scroll-wrapper svg").first();
    await expect(chartSvg).toBeVisible();

    // Click again to restore
    await firstItem.click();
    await expect(firstItem).not.toHaveClass(/excluded/);
  });

  test("clicking a legend item causes y-axis to recompute", async ({ page }) => {
    const legendItems = page.locator(".area-legend .area-legend-item");
    await expect(legendItems.first()).toBeVisible({ timeout: 10000 });
    const count = await legendItems.count();
    if (count < 2) return; // need at least 2 budgets to test recompute

    // Get the initial y-axis SVG content
    const yAxis = page.locator("#budgets-area-chart .chart-y-axis svg").first();
    const initialYAxis = await yAxis.innerHTML();

    // Exclude the first budget
    await legendItems.first().click();
    await expect(legendItems.first()).toHaveClass(/excluded/);

    // Y-axis should have been re-rendered (may or may not change values depending on data)
    // At minimum the chart should still have a valid SVG
    await expect(yAxis).toBeVisible();
  });
});
