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

  test("per-budget area chart has legend items", async ({ page }) => {
    const legendItems = page.locator(".area-legend .area-legend-item");
    await expect(legendItems.first()).toBeVisible({ timeout: 10000 });
    const count = await legendItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("metrics section contains 12-Week Avg Weekly Spending", async ({ page }) => {
    await expect(page.locator("#budget-metrics")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#budget-metrics")).toContainText("12-Week Avg Weekly Spending");
  });
});
