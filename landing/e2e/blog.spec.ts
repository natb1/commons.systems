import { test, expect } from "@playwright/test";

test.describe("blog", () => {
  test("home page shows published posts", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nPost content here." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const posts = page.locator("#posts article");
    expect(await posts.count()).toBeGreaterThanOrEqual(2);
    // h1 extraction replaces Firestore titles with the markdown heading
    await expect(posts.first()).toContainText("Test");
  });

  test("home page does not show draft posts to unauthenticated user", async ({
    page,
  }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nPost content here." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#posts")).not.toContainText("Draft Ideas");
  });

  test("post URL scrolls to post in home page", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Hello World\nPost content here." }),
    );
    await page.goto("/#/post/hello-world");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#post-hello-world")).toBeVisible();
    await expect(
      page.locator("#post-content-hello-world"),
    ).toBeVisible();
  });

  test("post content renders markdown as HTML", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Hello World\nThis is the post." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator("#post-content-hello-world"),
    ).toContainText("This is the post.", { timeout: 30000 });
  });

  test("post content does not show error fallback", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Hello World\nThis is the post." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator("#post-content-hello-world"),
    ).not.toContainText("Could not load post content.", { timeout: 30000 });
  });

  test("post title has jump link to post URL", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Hello World\nThis is the post." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const link = page.locator('#post-hello-world h2 a.post-link');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "#/post/hello-world");
  });

  test("post shows publication date", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Hello World\nThis is the post." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator('#post-hello-world time[datetime="2026-02-01T00:00:00Z"]'),
    ).toBeVisible();
  });
});
