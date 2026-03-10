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
    await expect(page.locator("header h1")).toHaveText("fellspiral");
    await expect(page.locator("app-nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("home page loads @smoke", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
  });

  test("admin route accessible @smoke", async ({ page }) => {
    await page.goto("/#/admin");
    await expect(page.locator("#sign-in")).toBeVisible();
  });

  test("unknown hash falls back to home page", async ({ page }) => {
    await page.goto("/#/nonexistent");
    await expect(page.locator("main h2")).toBeVisible({ timeout: 30000 });
  });

  test("clicking Home nav link shows home", async ({ page }) => {
    await page.goto("/#/admin");
    await page.click('app-nav a[href="#/"]');
    await expect(page.locator("main h2").first()).toBeVisible();
  });

  test("#info-panel element exists in DOM @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#info-panel")).toBeAttached();
  });

  test("desktop: #info-panel is visible @smoke", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    await expect(page.locator("#info-panel")).toBeVisible();
  });

  test("home page shows both post titles", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    await expect(page.locator("main")).toContainText("Running Mythic Bastionland");
    await expect(page.locator("main")).toContainText("What Cairn Taught Me About Combat");
  });
});
