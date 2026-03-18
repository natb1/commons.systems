import { test, expect } from "@playwright/test";

test.describe("budgets trend charts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the bar chart to confirm data has loaded
    await expect(page.locator("#budgets-chart svg").first()).toBeVisible({ timeout: 10000 });
  });

  test("aggregate trend chart container is visible", async ({ page }) => {
    await expect(page.locator("#budgets-trend-chart")).toBeVisible();
  });

  test("aggregate trend chart has SVG", async ({ page }) => {
    const svg = page.locator("#budgets-trend-chart svg");
    await expect(svg.first()).toBeVisible({ timeout: 10000 });
  });

  test("aggregate trend chart has legend items", async ({ page }) => {
    const legendItems = page.locator(".trend-legend .trend-legend-item");
    await expect(legendItems.first()).toBeVisible({ timeout: 10000 });
    const count = await legendItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("per-budget area chart container is visible", async ({ page }) => {
    await expect(page.locator("#budgets-area-chart")).toBeVisible();
  });

  test("per-budget area chart has SVG", async ({ page }) => {
    const svg = page.locator("#budgets-area-chart svg");
    await expect(svg.first()).toBeVisible({ timeout: 10000 });
  });

  test("per-budget area chart has legend items", async ({ page }) => {
    const legendItems = page.locator(".area-legend .area-legend-item");
    await expect(legendItems.first()).toBeVisible({ timeout: 10000 });
    const count = await legendItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("scroll sync between bar chart and trend chart", async ({ page }) => {
    const trendScroll = page.locator("#budgets-trend-chart .chart-scroll-wrapper");
    await expect(trendScroll).toBeVisible({ timeout: 10000 });

    const initialScrollLeft = await trendScroll.evaluate((el) => el.scrollLeft);

    const barScroll = page.locator("#budgets-chart .chart-scroll-wrapper");
    await barScroll.evaluate((el) => el.scrollTo({ left: 0 }));

    // Allow scroll sync event to propagate
    await page.waitForTimeout(300);

    const newScrollLeft = await trendScroll.evaluate((el) => el.scrollLeft);
    expect(newScrollLeft).not.toBe(initialScrollLeft);
  });

  test("metrics section contains 12-Week Avg Weekly Spending", async ({ page }) => {
    await expect(page.locator("#budget-metrics")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#budget-metrics")).toContainText("12-Week Avg Weekly Spending");
  });
});
