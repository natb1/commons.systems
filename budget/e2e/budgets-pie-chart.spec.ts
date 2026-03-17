import { test, expect } from "@playwright/test";

test.describe("budgets pie chart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the bar chart to confirm data has loaded
    await expect(page.locator("#budgets-chart svg").first()).toBeVisible({ timeout: 10000 });
  });

  test("pie chart container is visible below bar chart", async ({ page }) => {
    await expect(page.locator("#budgets-pie")).toBeVisible();
  });

  test("pie chart has arc paths", async ({ page }) => {
    const paths = page.locator("#budgets-pie svg path");
    await expect(paths.first()).toBeVisible({ timeout: 10000 });
    const count = await paths.count();
    expect(count).toBeGreaterThan(0);
  });

  test("pie chart has legend items", async ({ page }) => {
    const legendItems = page.locator("#budgets-pie .pie-legend-item");
    await expect(legendItems.first()).toBeVisible({ timeout: 10000 });
    const count = await legendItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("arc tooltip shows budget name and amount", async ({ page }) => {
    const firstPath = page.locator("#budgets-pie svg path").first();
    await expect(firstPath).toBeVisible({ timeout: 10000 });
    const titleText = await firstPath.locator("title").textContent();
    expect(titleText).toBeTruthy();
    // Tooltip format: "BudgetName: $XX.XX (YY.Y%)"
    expect(titleText).toMatch(/^.+: \$[\d,]+\.\d{2} \(\d+\.\d%\)$/);
  });
});
