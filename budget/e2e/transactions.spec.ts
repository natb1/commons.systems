import { test, expect } from "@playwright/test";

test.describe("transactions", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Transactions", { timeout: 30000 });
    await expect(page.locator("#transactions-error")).toHaveCount(0);
  });

  test("seed transactions visible for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const rows = page.locator("#transactions-table tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("Coffee Shop");
    await expect(rows.nth(1)).toContainText("Electric Company");
    await expect(rows.nth(2)).toContainText("Airline Ticket");
  });

  test("seed transactions are read-only", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const inputs = page.locator("#transactions-table input");
    await expect(inputs).toHaveCount(0);
  });
});
