import { test, expect } from "@playwright/test";

// Blog post content is inlined at build time by the vite blog-posts plugin.
// No route interception is needed -- content comes from the build output.

test.describe("blog", () => {
  test("post slug route renders posts container @smoke", async ({ page }) => {
    const response = await page.goto("/post/disciplinary-review-operations");
    expect(response?.status()).toBe(200);
    await page.waitForSelector("#posts", { timeout: 30000 });
  });

  test("home page shows published posts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const posts = page.locator("#posts article");
    expect(await posts.count()).toBeGreaterThanOrEqual(1);
    await expect(posts.first()).toContainText("The Surreal");
  });

  test("post URL scrolls to post in home page", async ({ page }) => {
    await page.goto("/post/scenes-from-a-hat");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#post-scenes-from-a-hat")).toBeVisible();
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toBeVisible();

    // Wait for content to load and scroll to complete, then verify the article is near the viewport top.
    const article = page.locator("#post-scenes-from-a-hat");
    await expect
      .poll(
        async () => {
          const box = await article.boundingBox();
          return box?.y ?? Infinity;
        },
        { timeout: 5000 },
      )
      .toBeLessThanOrEqual(250);
  });

  test("trailing-slash post URL scrolls to post", async ({ page }) => {
    await page.goto("/post/scenes-from-a-hat/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#post-scenes-from-a-hat")).toBeVisible();

    const article = page.locator("#post-scenes-from-a-hat");
    await expect
      .poll(
        async () => {
          const box = await article.boundingBox();
          return box?.y ?? Infinity;
        },
        { timeout: 5000 },
      )
      .toBeLessThanOrEqual(250);
  });

  test("post content renders markdown as HTML", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toContainText("Like many American millennials", { timeout: 30000 });
  });

  // datetime must match publishedAt in fellspiral/seeds/firestore.ts
  test("post shows publication date", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator('#post-scenes-from-a-hat time[datetime="2026-03-15T00:00:00Z"]'),
    ).toBeVisible();
  });

  test("post title has jump link", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const link = page.locator('#post-scenes-from-a-hat h2 a.post-link');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/post/scenes-from-a-hat");
  });
});
