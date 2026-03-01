import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("auth", () => {
  test("sign-in link visible on home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#sign-in")).toBeVisible();
    await expect(page.locator("#sign-out")).not.toBeVisible();
  });

  test("sign-in link visible on view routes", async ({ page }) => {
    await page.goto("/#/view/nonexistent");
    await expect(page.locator("#sign-in")).toBeVisible();
  });

  test("nav shows user display and sign-out after sign-in", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#sign-out")).toBeVisible();
    await expect(page.locator("#user-display")).toBeVisible();
  });

  test("all 16 items visible after sign-in", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.waitForSelector("#media-list", { timeout: 30000 });
    const items = page.locator("#media-list article.media-item");
    await expect(items).toHaveCount(16);
  });

  test("after sign-out only 3 public items visible", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.waitForSelector("#media-list", { timeout: 30000 });

    // Sign out from home page
    await page.locator("#sign-out").click();
    await page.waitForSelector("#sign-in");

    await page.waitForSelector("#media-list", { timeout: 30000 });
    const items = page.locator("#media-list article.media-item");
    await expect(items).toHaveCount(3);
  });

  test("private items hidden when not authenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });
    await expect(page.locator("#media-list")).not.toContainText(
      "Shadowdark RPG",
    );
    await expect(page.locator("#media-list")).not.toContainText(
      "Crown and Skull Digital",
    );
    await expect(page.locator("#media-list")).not.toContainText(
      "The Name of the Rose",
    );
  });

  test("public domain items visible without auth", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });
    const items = page.locator("#media-list article.media-item");
    await expect(items).toHaveCount(3);
    await expect(page.locator("#media-list")).toContainText(
      "Confessions of St. Augustine",
    );
    await expect(page.locator("#media-list")).toContainText("Phaedrus");
    await expect(page.locator("#media-list")).toContainText("Republic");
  });

  test("sign-out returns to unauthenticated state", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.locator("#sign-out").click();
    await page.waitForSelector("#sign-in");
    await expect(page.locator("#sign-in")).toBeVisible();
  });
});
