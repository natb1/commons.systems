import { test, expect } from "@playwright/test";

test.describe("accounts charts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/accounts");
    // Wait for the accounts table to confirm data has loaded
    await expect(page.locator("#accounts-table")).toBeVisible({ timeout: 10000 });
  });

  test("aggregate trend chart container is visible", async ({ page }) => {
    await expect(page.locator("#accounts-trend-chart")).toBeVisible();
  });

  test("aggregate trend chart has SVG", async ({ page }) => {
    const svg = page.locator("#accounts-trend-chart svg");
    await expect(svg.first()).toBeVisible({ timeout: 10000 });
  });

  test("aggregate trend chart has legend items", async ({ page }) => {
    const legendItems = page.locator(".trend-legend .trend-legend-item");
    await expect(legendItems.first()).toBeVisible({ timeout: 10000 });
    const count = await legendItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("net worth chart container is visible", async ({ page }) => {
    await expect(page.locator("#accounts-net-worth-chart")).toBeVisible();
  });

  test("net worth chart has SVG", async ({ page }) => {
    const svg = page.locator("#accounts-net-worth-chart svg");
    await expect(svg.first()).toBeVisible({ timeout: 10000 });
  });

  test("scroll sync between trend chart and net worth chart", async ({ page }) => {
    const trendScroll = page.locator("#accounts-trend-chart .chart-scroll-wrapper");
    await expect(trendScroll).toBeVisible({ timeout: 10000 });

    const nwScroll = page.locator("#accounts-net-worth-chart .chart-scroll-wrapper");
    await expect(nwScroll).toBeVisible({ timeout: 10000 });

    // Wait for initial scroll position to stabilize (ResizeObserver restores scroll after render)
    await expect(async () => {
      const trendLeft = await trendScroll.evaluate((el) => el.scrollLeft);
      expect(trendLeft).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });

    // Scroll trend chart to the start and verify net worth chart syncs
    await expect(async () => {
      await trendScroll.evaluate((el) => { el.scrollLeft = 0; });
      // Allow a frame for the scroll event to propagate
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const nwLeft = await nwScroll.evaluate((el) => el.scrollLeft);
      expect(nwLeft).toBe(0);
    }).toPass({ timeout: 5000 });
  });
});
