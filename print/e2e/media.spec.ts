import { test, expect } from "@playwright/test";

test.describe("media", () => {
  test("public items visible without authentication", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });
    const items = page.locator("#media-list article.media-item");
    await expect(items).toHaveCount(3);
  });

  test("public items display expected titles", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });
    await expect(page.locator("#media-list")).toContainText(
      "Confessions of St. Augustine",
    );
    await expect(page.locator("#media-list")).toContainText("Phaedrus");
    await expect(page.locator("#media-list")).toContainText("Republic");
  });

  test("each public item has a title, type badge, and action buttons", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });
    const items = page.locator("#media-list article.media-item");
    const count = await items.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      // Title present
      await expect(item.locator("h3")).toBeVisible();
      // Type badge present (epub or pdf)
      await expect(item.locator(".badge-type")).toBeVisible();
      // View and Download buttons present
      await expect(item.locator("a.btn-view")).toBeVisible();
      await expect(item.locator("button.btn-download")).toBeVisible();
    }
  });

  test("each public item shows public domain badge", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });
    const items = page.locator("#media-list article.media-item");
    const count = await items.count();
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      await expect(items.nth(i).locator(".badge-public")).toBeVisible();
    }
  });

  test("clicking View navigates to view page with metadata table", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });

    // Click View on the Phaedrus item
    const phaedrusItem = page.locator("#media-phaedrus");
    await expect(phaedrusItem).toBeVisible();
    await phaedrusItem.locator("a.btn-view").click();

    // View page shows title and metadata table
    await expect(page.locator("main h2")).toHaveText("Phaedrus", {
      timeout: 10000,
    });
    await expect(page.locator("#metadata-table")).toBeVisible();
  });

  test("metadata table has correct fields", async ({ page }) => {
    await page.goto("/#/view/phaedrus");
    await page.waitForSelector("#metadata-table", { timeout: 30000 });

    const table = page.locator("#metadata-table");
    await expect(table).toContainText("ID");
    await expect(table).toContainText("phaedrus");
    await expect(table).toContainText("Media Type");
    await expect(table).toContainText("pdf");
    await expect(table).toContainText("Public Domain");
    await expect(table).toContainText("Yes");
    await expect(table).toContainText("Size");
    await expect(table).toContainText("820.0 KB");
  });

  test("metadata table shows tag fields", async ({ page }) => {
    await page.goto("/#/view/phaedrus");
    await page.waitForSelector("#metadata-table", { timeout: 30000 });

    const table = page.locator("#metadata-table");
    await expect(table).toContainText("genre");
    await expect(table).toContainText("philosophy");
    await expect(table).toContainText("author");
    await expect(table).toContainText("Plato");
  });

  test("back to library link from view page works", async ({ page }) => {
    await page.goto("/#/view/phaedrus");
    await page.waitForSelector("#metadata-table", { timeout: 30000 });

    await page.getByRole("link", { name: "Back to library" }).click();
    await expect(page.locator("main h2")).toHaveText("Library");
    await expect(page.locator("#media-list")).toBeVisible({ timeout: 10000 });
  });

  test("view page for nonexistent item shows not found", async ({ page }) => {
    await page.goto("/#/view/does-not-exist");
    await expect(page.locator("#view-not-found")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator("#view-not-found")).toContainText(
      "Media item not found",
    );
  });

  test("download works for public domain item without auth", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });

    const downloadButton = page.locator(
      "#media-list article.media-item button.btn-download",
    ).first();
    await expect(downloadButton).toBeVisible();

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/v0/b/") && r.request().method() === "GET",
    );
    await downloadButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test("private items not visible without authentication", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#media-list", { timeout: 30000 });
    await expect(page.locator("#media-list")).not.toContainText(
      "Shadowdark RPG",
    );
    await expect(page.locator("#media-list")).not.toContainText(
      "The Name of the Rose",
    );
  });
});
