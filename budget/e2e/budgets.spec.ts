import { test, expect } from "@playwright/test";

test.describe("budgets", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/#/budgets");
    await expect(page.locator("main h2")).toHaveText("Budgets", { timeout: 30000 });
    await expect(page.locator("#budgets-error")).toHaveCount(0);
  });

  test("seed budgets visible and read-only", async ({ page }) => {
    await page.goto("/#/budgets");
    await expect(page.locator("#budgets-table")).toBeVisible();
    const rows = page.locator("#budgets-table .budget-row");
    await expect(rows.first()).toBeVisible();
    const inputs = page.locator("#budgets-table input");
    await expect(inputs).toHaveCount(0);
    const selects = page.locator("#budgets-table select");
    await expect(selects).toHaveCount(0);
  });
});
