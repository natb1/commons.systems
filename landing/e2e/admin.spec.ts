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

  test("after sign-in, admin group member sees admin page", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.goto("/#/admin");
    await expect(page.locator("#sign-in")).not.toBeVisible();
    await expect(page.locator("#not-authorized")).not.toBeAttached();
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  });

  // The seed user (seeds/auth.ts) is a member of the admin group
  // (seeds/firestore.ts), so draft posts should be visible after sign-in.

  test("[draft] badge visible for admin", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#posts")).toContainText("[draft]");
  });

  test("home page shows draft posts after sign-in as admin", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#posts")).toContainText("Draft Ideas");
  });

  test("info panel populates after sign-in on admin route", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/#/admin");
    await signIn(page);
    const panel = page.locator("#info-panel");
    await expect(panel.locator("h3", { hasText: "Top Posts" })).toBeVisible({
      timeout: 30000,
    });
    await expect(panel.locator("h3", { hasText: "Archive" })).toBeVisible();
  });
});
