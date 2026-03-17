import { test, expect } from "@playwright/test";

test.describe("media", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Library", { timeout: 30000 });
    await expect(page.locator("#media-error")).toHaveCount(0);
  });

  test("public media listing shows 4 items", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list .media-item")).toHaveCount(4, { timeout: 10000 });
  });

  test("titles are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#media-list")).toContainText("The Confessions of St. Augustine");
    await expect(page.locator("#media-list")).toContainText("Phaedrus");
    await expect(page.locator("#media-list")).toContainText("Republic");
  });

  test("view and download buttons exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    const items = page.locator("#media-list .media-item");
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i).locator(".media-view")).toBeVisible();
      await expect(items.nth(i).locator(".media-download")).toBeVisible();
    }
  });

  test("view navigation works", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    await page.locator("#media-list .media-view").first().click();
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
  });

  test("metadata display on view page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    await page.locator("#media-list .media-view").first().click();
    await expect(page.locator(".viewer-panel")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".viewer-back")).toBeVisible();
  });

  test("back link returns to library", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
    await page.locator("#media-list .media-view").first().click();
    await expect(page.locator(".viewer")).toBeVisible({ timeout: 15000 });
    await page.locator(".viewer-back").click();
    await expect(page.locator("main h2")).toHaveText("Library");
  });
});
