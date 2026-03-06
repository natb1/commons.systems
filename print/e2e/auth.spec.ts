import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("auth", () => {
  test("nav shows sign-in link when not signed in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#sign-in")).toBeVisible();
    await expect(page.locator("#sign-out")).not.toBeVisible();
  });

  test("nav shows user display and sign-out after sign-in", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#sign-out")).toBeVisible();
    await expect(page.locator("#user-display")).toContainText("Test User");
  });

  test("private items visible after login (4 total)", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#media-list .media-item")).toHaveCount(4, { timeout: 10000 });
  });

  test("public notice hidden after login", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#public-notice")).toBeVisible({ timeout: 10000 });
    await signIn(page);
    await expect(page.locator("#public-notice")).not.toBeVisible();
  });

  test("sign-out returns to unauthenticated state", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.locator("#sign-out").click();
    await page.waitForSelector("#sign-in");
    await expect(page.locator("#public-notice")).toBeVisible({ timeout: 10000 });
  });

  test("public media visible without auth", async ({ page }) => {
    await page.goto("/");
    const items = page.locator("#media-list .media-item");
    await expect(items).toHaveCount(3, { timeout: 10000 });
  });
});
