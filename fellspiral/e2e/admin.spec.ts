import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("admin", () => {
  test("after sign-in, admin group member sees admin page", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.goto("/admin");
    await expect(page.locator("#sign-in")).not.toBeVisible();
    await expect(page.locator("#not-authorized")).not.toBeAttached();
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
  });
});
