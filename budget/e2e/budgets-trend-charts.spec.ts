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

    // Scroll bar chart to middle so there is room to scroll in either direction
    await barScroll.evaluate((el) => el.scrollTo({ left: Math.floor(el.scrollWidth / 2) }));
    await page.waitForTimeout(300);

    // Now scroll bar chart to the start
    await barScroll.evaluate((el) => {
      el.scrollLeft = 0;
      el.dispatchEvent(new Event("scroll"));
    });

    // Allow scroll sync event to propagate
    await page.waitForTimeout(500);

    const trendScrollLeft = await trendScroll.evaluate((el) => el.scrollLeft);
    expect(trendScrollLeft).toBe(0);
  });

  test("metrics section contains 12-Week Avg Weekly Spending", async ({ page }) => {
    await expect(page.locator("#budget-metrics")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#budget-metrics")).toContainText("12-Week Avg Weekly Spending");
  });
});
