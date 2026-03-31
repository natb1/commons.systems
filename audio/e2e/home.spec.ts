import { test, expect } from "@playwright/test";

test.describe("home page content", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Home", { timeout: 30000 });
  });

  test("home page displays welcome text", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toContainText(
      "Welcome to the commons.systems audio app.",
    );
  });
});
