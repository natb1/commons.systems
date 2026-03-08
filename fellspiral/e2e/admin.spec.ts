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
});
