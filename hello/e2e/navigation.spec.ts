import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test("page loads without JS errors @smoke", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(errors).toHaveLength(0);
  });

  test("HTML shell structure @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header h1")).toHaveText("Hello");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("home page shows Home heading @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Home");
    await expect(page.locator("main")).toContainText("Welcome");
  });

  test("clicking About nav link shows About heading @smoke", async ({ page }) => {
    await page.goto("/");
    // Wait for initial async render (renderHome awaits Firestore) to complete
    // before clicking — otherwise the pending render overwrites the About page
    await expect(page.locator("main h2")).toHaveText("Home", { timeout: 30000 });
    await page.click('nav a[href="#/about"]');
    await expect(page.locator("main h2")).toHaveText("About");
    await expect(page.locator("main p")).toContainText(
      "commons.systems app scaffolding",
    );
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
