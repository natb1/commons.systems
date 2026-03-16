import { test, expect } from "@playwright/test";

test.describe("budgets", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Budgets", { timeout: 30000 });
    await expect(page.locator("#budgets-error")).toHaveCount(0);
    // Chart renders without error
    await expect(page.locator("#budgets-chart")).toBeVisible();
    await expect(page.locator("#budgets-chart svg")).toBeVisible({ timeout: 10000 });
  });

  test("seed budgets visible and read-only", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budgets-table")).toBeVisible();
    const rows = page.locator("#budgets-table .budget-row");
    await expect(rows.first()).toBeVisible();
    // Seed data renders disabled inputs instead of plain text
    const inputs = page.locator("#budgets-table input");
    for (const input of await inputs.all()) {
      await expect(input).toBeDisabled();
    }
    const selects = page.locator("#budgets-table select");
    for (const select of await selects.all()) {
      await expect(select).toBeDisabled();
    }
  });

  test("chart container visible on budgets page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budgets-chart")).toBeVisible();
  });

  test("SVG element present inside chart container", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budgets-chart svg")).toBeVisible({ timeout: 10000 });
  });

  test("window selector changes chart content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budgets-chart svg")).toBeVisible({ timeout: 10000 });
    // Get initial SVG content
    const initialSvg = await page.locator("#budgets-chart svg").innerHTML();
    // Change window to 8 weeks
    await page.selectOption("#chart-window", "8");
    // Wait for re-render
    await page.waitForTimeout(500);
    const newSvg = await page.locator("#budgets-chart svg").innerHTML();
    // Content should differ (fewer data points)
    expect(newSvg).not.toBe(initialSvg);
  });

  test("chart has bars for budget periods", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budgets-chart svg")).toBeVisible({ timeout: 10000 });
    // Observable Plot renders rect elements for bars
    const rects = page.locator("#budgets-chart svg rect");
    const count = await rects.count();
    expect(count).toBeGreaterThan(0);
  });
});
