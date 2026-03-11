import { test, expect } from "@playwright/test";

// Posts are fetched as raw markdown from GitHub at runtime.
// Intercept those requests with deterministic stub content so tests
// do not depend on network access or repository state.
test.beforeEach(async ({ page }) => {
  await page.route("https://raw.githubusercontent.com/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/fellspiral/post/scenes-from-a-hat.md")) {
      return route.fulfill({ body: "# Scenes from a Hat\nThis is the post." });
    }
    return route.abort("connectionfailed");
  });
});

test.describe("blog", () => {
  test("home page shows published posts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const posts = page.locator("#posts article");
    expect(await posts.count()).toBeGreaterThanOrEqual(1);
    await expect(posts.first()).toContainText("Scenes from a Hat");
  });

  test("post URL scrolls to post in home page", async ({ page }) => {
    await page.goto("/#/post/scenes-from-a-hat");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#post-scenes-from-a-hat")).toBeVisible();
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toBeVisible();
  });

  test("post content renders markdown as HTML", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator("#post-content-scenes-from-a-hat"),
    ).toContainText("This is the post.", { timeout: 30000 });
  });

  // datetime must match publishedAt in fellspiral/seeds/firestore.ts
  test("post shows publication date", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator('#post-scenes-from-a-hat time[datetime="2026-03-11T00:00:00Z"]'),
    ).toBeVisible();
  });

  test("post title has jump link", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const link = page.locator('#post-scenes-from-a-hat h2 a.post-link');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "#/post/scenes-from-a-hat");
  });
});
