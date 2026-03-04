import { test, expect } from "@playwright/test";

test.describe("transactions", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Transactions", { timeout: 30000 });
    await expect(page.locator("#transactions-error")).toHaveCount(0);
  });

  test("seed transactions visible sorted by date descending", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const rows = page.locator("#transactions-table .txn-row");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("Airline Ticket");
    await expect(rows.nth(1)).toContainText("Electric Company");
    await expect(rows.nth(2)).toContainText("Coffee Shop");
  });

  test("seed transactions are read-only", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const inputs = page.locator("#transactions-table .txn-summary-content input");
    await expect(inputs).toHaveCount(0);
  });

  test("expanded row shows date and statement link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const firstRow = page.locator("#transactions-table .txn-row").first();
    await firstRow.locator("summary").click();
    const details = firstRow.locator(".txn-details");
    await expect(details).toBeVisible();
    await expect(details.locator("dt", { hasText: "Date" })).toBeVisible();
    await expect(details.locator("dt", { hasText: "Statement" })).toBeVisible();
    await expect(details.locator("a", { hasText: "statement" })).toBeVisible();
  });
});
