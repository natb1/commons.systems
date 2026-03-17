import { test, expect } from "@playwright/test";

test.describe("auth", () => {
  test("Load data button visible on page load", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator(".upload-label")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".upload-label")).toHaveText("Load data");
  });

  test("no sign-in UI is present", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#sign-in")).toHaveCount(0);
    await expect(page.locator("#sign-out")).toHaveCount(0);
  });
});
