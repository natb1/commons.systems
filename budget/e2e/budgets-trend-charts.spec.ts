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

    const barScroll = page.locator("#budgets-chart .chart-scroll-wrapper");

    // Wait for initial scroll position to stabilize (ResizeObserver restores scroll after render)
    await expect(async () => {
      const barLeft = await barScroll.evaluate((el) => el.scrollLeft);
      expect(barLeft).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });

    // Scroll bar chart to the start and verify trend chart syncs.
    // Retry both scroll and check: ResizeObserver may restore old position between attempts.
    await expect(async () => {
      await barScroll.evaluate((el) => { el.scrollLeft = 0; });
      // Allow a frame for the scroll event to propagate
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const trendLeft = await trendScroll.evaluate((el) => el.scrollLeft);
      expect(trendLeft).toBe(0);
    }).toPass({ timeout: 5000 });
  });

  test("metrics section contains 12-Week Avg Weekly Spending", async ({ page }) => {
    await expect(page.locator("#budget-metrics")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#budget-metrics")).toContainText("12-Week Avg Weekly Spending");
  });
});
