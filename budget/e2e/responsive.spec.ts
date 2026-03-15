import { test, expect } from "@playwright/test";

test.describe("responsive layout", () => {
  test("main content is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main h2")).toHaveText("Transactions");
  });

  test("nav links are accessible", async ({ page }) => {
    await page.goto("/");
    const homeLink = page.locator('nav a[href="/"]');
    const budgetsLink = page.locator('nav a[href="/budgets"]');

    await expect(homeLink).toBeVisible();
    await expect(budgetsLink).toBeVisible();

    await budgetsLink.click();
    await expect(page.locator("main h2")).toHaveText("Budgets");

    await homeLink.click();
    await expect(page.locator("main h2")).toHaveText("Transactions");
  });
});
