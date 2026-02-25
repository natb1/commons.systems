import { test, expect } from "@playwright/test";

test.describe("blog", () => {
  test("home page shows published posts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const posts = page.locator("#posts li");
    await expect(posts).toHaveCount(await posts.count());
    expect(await posts.count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator("#posts")).toContainText("Hello World");
    await expect(page.locator("#posts")).toContainText(
      "Agentic Coding Workflow",
    );
  });

  test("home page does not show draft posts to unauthenticated user", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#posts")).not.toContainText("Draft Ideas");
  });

  test("clicking post title navigates to post page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nPost content here." }),
    );
    await page.locator("#posts a", { hasText: "Hello World" }).click();
    await expect(page).toHaveURL(/#\/post\/hello-world/);
    await expect(page.locator("#post-content")).toBeVisible();
  });

  test("post page renders markdown content", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Hello World\nThis is the post." }),
    );
    await page.goto("/#/post/hello-world");
    await page.waitForSelector("#post-content", { timeout: 30000 });
    await expect(page.locator("#post-content")).toContainText("Hello World");
    await expect(page.locator("#post-content")).toContainText(
      "This is the post.",
    );
  });

  test("post page shows publication date", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Hello World\nThis is the post." }),
    );
    await page.goto("/#/post/hello-world");
    await page.waitForSelector("#post-content", { timeout: 30000 });
    await expect(
      page.locator('time[datetime="2026-02-01T00:00:00Z"]'),
    ).toBeVisible();
  });
});
