import { test, expect } from "@playwright/test";

test.describe("budgets", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/budgets");
    await expect(page.locator("main h2")).toHaveText("Budgets", { timeout: 30000 });
    await expect(page.locator("#budgets-error")).toHaveCount(0);
  });

  test("seed budgets visible and read-only", async ({ page }) => {
    await page.goto("/budgets");
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
});
