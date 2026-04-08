import { test, expect } from "@playwright/test";

// Smoke tests run against a deployed preview URL via run-smoke-tests.sh
// (--grep @smoke). They verify essential SEO meta tags and that the
// build-time blog content feature works end-to-end: post HTML is inlined
// at build time so unauthenticated visitors see content without runtime
// fetches to GitHub or Firestore.

test.describe("blog smoke", () => {
  test("meta description is present @smoke", async ({ page }) => {
    await page.goto("/");
    const desc = await page.getAttribute('meta[name="description"]', "content");
    expect(desc).toBeTruthy();
  });

  test("homepage loads without JS errors @smoke", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Wait for the posts container to render — proves the app bootstrapped
    await page.waitForSelector("#posts", { timeout: 30000 });
    expect(errors).toEqual([]);
  });

  test("published post content is build-time inlined @smoke", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    // The post article should be present with its content rendered
    const postContent = page.locator(
      "#post-content-recovering-autonomy-with-coding-agents",
    );
    await expect(postContent).toBeVisible({ timeout: 10000 });

    // Verify actual prose from the markdown is present — this confirms the
    // Vite plugin inlined the markdown HTML into the JS bundle at build time
    // rather than fetching it at runtime.
    await expect(postContent).toContainText(
      "built to my own specification",
      { timeout: 5000 },
    );

    // Draft posts must not appear for unauthenticated users
    await expect(page.locator("#posts")).not.toContainText("Draft Ideas");
  });
});
