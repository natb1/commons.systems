import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test("home page shows Home heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Home");
  });

  test("clicking About nav link shows About heading", async ({ page }) => {
    await page.goto("/");
    await page.click('nav a[href="#/about"]');
    await expect(page.locator("main h2")).toHaveText("About");
  });

  test("clicking Home nav link returns to Home heading", async ({ page }) => {
    await page.goto("/#/about");
    await expect(page.locator("main h2")).toHaveText("About");
    await page.click('nav a[href="#/"]');
    await expect(page.locator("main h2")).toHaveText("Home");
  });

  test("direct URL to #/about loads about page", async ({ page }) => {
    await page.goto("/#/about");
    await expect(page.locator("main h2")).toHaveText("About");
    await expect(page.locator("main p")).toContainText(
      "commons.systems app scaffolding",
    );
  });

  test("unknown hash falls back to home page", async ({ page }) => {
    await page.goto("/#/nonexistent");
    await expect(page.locator("main h2")).toHaveText("Home");
  });
});
