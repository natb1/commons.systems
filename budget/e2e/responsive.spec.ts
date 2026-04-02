import { test, expect } from "@playwright/test";

test.describe("responsive layout", () => {
  test("main content is visible", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main > h2")).toHaveText("Transactions");
  });

  test("nav links are accessible", async ({ page }) => {
    await page.goto("/transactions");
    const budgetsLink = page.locator('nav a[href="/"]');
    const transactionsLink = page.locator('nav a[href="/transactions"]');

    await expect(budgetsLink).toBeVisible();
    await expect(transactionsLink).toBeVisible();

    await budgetsLink.click();
    await expect(page.locator("main > h2")).toHaveText("Budgets");

    await transactionsLink.click();
    await expect(page.locator("main > h2")).toHaveText("Transactions");
  });
});
