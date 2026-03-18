import { test, expect } from "@playwright/test";

test.describe("budgets", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Budgets", { timeout: 30000 });
    await expect(page.locator("#budgets-error")).toHaveCount(0);
    await expect(page.locator("#budgets-chart")).toBeVisible();
    await expect(page.locator("#budgets-chart svg").first()).toBeVisible({ timeout: 10000 });
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
    await expect(page.locator("#budgets-chart svg").first()).toBeVisible({ timeout: 10000 });
  });

  test("date picker and chart layout with fixed axis", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budgets-chart svg").first()).toBeVisible({ timeout: 10000 });
    const datePicker = page.locator("#chart-date-picker");
    await expect(datePicker).toBeVisible();
    await expect(page.locator("#budgets-chart .chart-layout")).toBeVisible();
    await expect(page.locator("#budgets-chart .chart-y-axis")).toBeVisible();
    await expect(page.locator("#budgets-chart .chart-scroll-wrapper")).toBeVisible();
  });

  test("chart has bars for budget periods", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budgets-chart svg").first()).toBeVisible({ timeout: 10000 });
    const rects = page.locator("#budgets-chart .chart-scroll-wrapper svg rect");
    const count = await rects.count();
    expect(count).toBeGreaterThan(0);
  });

  test("budget metrics section visible @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budget-metrics")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#budget-metrics")).toContainText(/\$/);
  });

  test("metrics section contains income and budget labels", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#budget-metrics")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#budget-metrics")).toContainText("12-Week Avg Weekly Income");
    await expect(page.locator("#budget-metrics")).toContainText("Total Weekly Budget");
  });
});
