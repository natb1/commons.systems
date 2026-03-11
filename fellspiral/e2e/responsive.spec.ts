import { test, expect } from "@playwright/test";

test.describe("responsive layout", () => {
  test("main content is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main h2").first()).toBeVisible({ timeout: 30000 });
  });

  test("nav links are accessible", async ({ page }) => {
    await page.goto("/");
    const homeLink = page.locator('nav a[href="#/"]');

    await expect(homeLink).toBeVisible();

    await homeLink.click();
    await expect(page.locator("main h2").first()).toBeVisible({ timeout: 30000 });
  });
});
