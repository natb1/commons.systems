import { test, expect } from "@playwright/test";

test.describe("smoke tests @smoke", () => {
  test("page loads without JS errors", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });

  test("HTML shell structure", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header h1")).toHaveText("Hello");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("hash navigation works", async ({ page }) => {
    await page.goto("/");
    await page.click('nav a[href="#/about"]');
    await expect(page.locator("main h2")).toHaveText("About");
    await expect(page.locator("main p")).toContainText(
      "commons.systems app scaffolding",
    );
  });

  test("home page renders without crash", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Home");
    await expect(page.locator("main")).toContainText("Welcome");
  });

  test("Firestore connectivity", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#messages, p:has-text('No messages yet')", {
      timeout: 10000,
    });
    await expect(page.locator("#messages-error")).toHaveCount(0);
  });
});
