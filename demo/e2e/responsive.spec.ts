import { test, expect } from "@playwright/test";

test.describe("responsive layout", () => {
  test("main content is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main h2")).toHaveText("Home");
  });

  test("nav links are accessible", async ({ page }) => {
    await page.goto("/");
    const homeLink = page.locator('nav a[href="#/"]');
    const aboutLink = page.locator('nav a[href="#/about"]');

    await expect(homeLink).toBeVisible();
    await expect(aboutLink).toBeVisible();

    await aboutLink.click();
    await expect(page.locator("main h2")).toHaveText("About");

    await homeLink.click();
    await expect(page.locator("main h2")).toHaveText("Home");
  });
});
