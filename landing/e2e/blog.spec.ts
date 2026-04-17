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

  // Asserts the CSS rule shipped, not that the woff2 rendered. With
  // font-display: optional the browser may not swap to Plex Serif on a
  // cold visit, but getComputedStyle still returns the declared family.
  test("post body renders in IBM Plex Serif", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(
      "#post-content-recovering-autonomy-with-coding-agents p",
      { timeout: 30000 },
    );
    const family = await page.evaluate(() => {
      const p = document.querySelector(
        "#post-content-recovering-autonomy-with-coding-agents p",
      );
      return p ? getComputedStyle(p).fontFamily : null;
    });
    expect(family).toContain("IBM Plex Serif");
  });

  test("post title and metadata remain in IBM Plex Mono", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const fonts = await page.evaluate(() => {
      const article = document.querySelector(
        "#post-recovering-autonomy-with-coding-agents",
      );
      const title = article?.querySelector("h2");
      const time = article?.querySelector("time");
      return {
        title: title ? getComputedStyle(title).fontFamily : null,
        time: time ? getComputedStyle(time).fontFamily : null,
      };
    });
    expect(fonts.title).toContain("IBM Plex Mono");
    expect(fonts.time).toContain("IBM Plex Mono");
  });

  test("post body code descendants stay in IBM Plex Mono", async ({ page }) => {
    // Seeded posts contain no code, so inject a synthetic <code> element to
    // verify the cascade override rule applies to code descendants.
    await page.goto("/");
    await page.waitForSelector(
      "#post-content-recovering-autonomy-with-coding-agents",
      { timeout: 30000 },
    );
    const family = await page.evaluate(() => {
      const host = document.querySelector(
        "#post-content-recovering-autonomy-with-coding-agents",
      );
      if (!host) return null;
      const code = document.createElement("code");
      code.textContent = "example";
      host.appendChild(code);
      const computed = getComputedStyle(code).fontFamily;
      code.remove();
      return computed;
    });
    expect(family).toContain("IBM Plex Mono");
  });
});
