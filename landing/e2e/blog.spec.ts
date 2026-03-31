import { test, expect } from "@playwright/test";

// Blog post content is inlined at build time by the vite blog-posts plugin.
// No route interception is needed -- content comes from the build output.

test.describe("blog", () => {
  test("home page shows published posts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const posts = page.locator("#posts article");
    expect(await posts.count()).toBeGreaterThanOrEqual(1);
    // h1 extraction replaces Firestore titles with the markdown heading
    await expect(posts.first()).toContainText("Recovering Autonomy with Coding Agents");
  });

  test("home page does not show draft posts to unauthenticated user", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#posts")).not.toContainText("Draft Ideas");
  });

  test("post URL scrolls to post in home page", async ({ page }) => {
    await page.goto("/post/recovering-autonomy-with-coding-agents");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#post-recovering-autonomy-with-coding-agents")).toBeVisible();
    await expect(
      page.locator("#post-content-recovering-autonomy-with-coding-agents"),
    ).toBeVisible();
  });

  test("post content renders markdown as HTML", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator("#post-content-recovering-autonomy-with-coding-agents"),
    ).toContainText("built to my own specification", { timeout: 30000 });
  });

  test("post content does not show error fallback", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator("#post-content-recovering-autonomy-with-coding-agents"),
    ).not.toContainText("Could not load post content.", { timeout: 30000 });
  });

  test("post title has jump link to post URL", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const link = page.locator('#post-recovering-autonomy-with-coding-agents h2 a.post-link');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/post/recovering-autonomy-with-coding-agents");
  });

  // datetime must match publishedAt in landing/seeds/firestore.ts
  test("post shows publication date", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator('#post-recovering-autonomy-with-coding-agents time[datetime="2026-03-10T00:00:00Z"]'),
    ).toBeVisible();
  });
});
