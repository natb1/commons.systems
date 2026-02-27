import { test, expect } from "@playwright/test";

test.describe("responsive layout", () => {
  test("main content is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main h2")).toHaveText("Library");
  });

  test("nav links are accessible", async ({ page }) => {
    await page.goto("/");
    const libraryLink = page.locator('nav a[href="#/"]');

    await expect(libraryLink).toBeVisible();

    // Navigate to admin and back to library
    await page.goto("/#/admin");
    await expect(page.locator("main h2")).toHaveText("Admin");

    await libraryLink.click();
    await expect(page.locator("main h2")).toHaveText("Library");
  });
});
