import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test("page loads without JS errors @smoke", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(errors).toHaveLength(0);
  });

  test("HTML shell structure @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("renders print.commons.systems in title @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("print.commons.systems");
  });

  test("home route shows Library heading @smoke", async ({ page }) => {
    await page.goto("/#/");
    await expect(page.locator("main h2")).toHaveText("Library");
  });

  test("navigation between routes works @smoke", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });

    // Click first View link to navigate to a view page
    const viewLink = page.locator("a.btn-view").first();
    await viewLink.click();
    await expect(page.locator("#metadata-table")).toBeVisible({ timeout: 10000 });

    // Click "Back to library" to return home
    await page.getByRole("link", { name: "Back to library" }).click();
    await expect(page.locator("main h2")).toHaveText("Library");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
  });

  test("unknown hash falls back to home route @smoke", async ({ page }) => {
    await page.goto("/#/nonexistent-route");
    await expect(page.locator("main h2")).toHaveText("Library");
  });

  test("direct URL navigation to view page works @smoke", async ({ page }) => {
    await page.goto("/#/view/phaedrus");
    await expect(page.locator("main h2")).toHaveText("Phaedrus", {
      timeout: 30000,
    });
    await expect(page.locator("#metadata-table")).toBeVisible();
  });

  test("admin route accessible @smoke", async ({ page }) => {
    await page.goto("/#/admin");
    await expect(page.locator("main h2")).toHaveText("Admin");
  });

  test("Library nav link returns to home @smoke", async ({ page }) => {
    await page.goto("/#/admin");
    await page.click('nav a[href="#/"]');
    await expect(page.locator("main h2")).toHaveText("Library");
  });
});
