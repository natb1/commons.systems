import { test, expect } from "@playwright/test";

test.describe("blog", () => {
  test("home page shows published posts", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Test\nPost content here." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const posts = page.locator("#posts article");
    expect(await posts.count()).toBeGreaterThanOrEqual(1);
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
      route.fulfill({ body: "# Underappreciated Advantages of Agentic Coding\nPost content here." }),
    );
    await page.goto("/#/post/underappreciated-advantages-of-agentic-coding");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#post-underappreciated-advantages-of-agentic-coding")).toBeVisible();
    await expect(
      page.locator("#post-content-underappreciated-advantages-of-agentic-coding"),
    ).toBeVisible();
  });

  test("post content renders markdown as HTML", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Underappreciated Advantages of Agentic Coding\nThis is the post." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator("#post-content-underappreciated-advantages-of-agentic-coding"),
    ).toContainText("This is the post.", { timeout: 30000 });
  });

  test("post content does not show error fallback", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Underappreciated Advantages of Agentic Coding\nThis is the post." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator("#post-content-underappreciated-advantages-of-agentic-coding"),
    ).not.toContainText("Could not load post content.", { timeout: 30000 });
  });

  test("post title has jump link to post URL", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Underappreciated Advantages of Agentic Coding\nThis is the post." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const link = page.locator('#post-underappreciated-advantages-of-agentic-coding h2 a.post-link');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "#/post/underappreciated-advantages-of-agentic-coding");
  });

  test("post shows publication date", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/**", (route) =>
      route.fulfill({ body: "# Underappreciated Advantages of Agentic Coding\nThis is the post." }),
    );
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(
      page.locator('#post-underappreciated-advantages-of-agentic-coding time[datetime="2026-03-10T00:00:00Z"]'),
    ).toBeVisible();
  });
});
