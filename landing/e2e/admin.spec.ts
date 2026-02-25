import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("admin", () => {
  test("admin page shows login button when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/#/admin");
    await expect(page.locator("#sign-in")).toBeVisible();
    await expect(page.locator("#sign-out")).not.toBeVisible();
  });

  test("home page does NOT show login button", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#sign-in")).not.toBeAttached();
    await expect(page.locator("#sign-out")).not.toBeAttached();
  });

  test("nav shows login button on admin route only", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#sign-in")).not.toBeAttached();
    await page.goto("/#/admin");
    await expect(page.locator("#sign-in")).toBeVisible();
  });

  test("after sign-in, admin page shows user info", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.goto("/#/admin");
    await expect(page.locator("#sign-in")).not.toBeVisible();
    await expect(
      page.locator("#user-display, #sign-out").first(),
    ).toBeVisible();
    await expect(page.locator("main")).not.toContainText("not authorized");
  });

  // The emulator creates a test user that is NOT natb1, so the following tests
  // require natb1-specific identity and cannot be verified in the emulator environment.

  test.skip("[draft] badge visible for admin (aspirational - requires natb1 emulator user)", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#posts")).toContainText("[draft]");
  });

  test.skip("home page shows draft posts after sign-in as natb1 (aspirational - requires natb1 emulator user)", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#posts")).toContainText("Draft Ideas");
  });
});
