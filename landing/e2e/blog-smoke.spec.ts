import { test, expect } from "@playwright/test";

// Smoke tests run against a deployed preview URL via run-smoke-tests.sh
// (--grep @smoke). They verify the meta description tag and that the
// build-time blog content feature works end-to-end: post HTML is inlined
// at build time so unauthenticated visitors see content without runtime
// fetches to GitHub or Firestore.

test.describe("blog smoke", () => {
  test("meta description is present @smoke", async ({ page }) => {
    await page.goto("/");
    const desc = await page.getAttribute('meta[name="description"]', "content");
    if (!desc) throw new Error("description meta tag missing content");
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  test("Open Graph tags present @smoke", async ({ page }) => {
    await page.goto("/");
    for (const property of ["og:title", "og:description", "og:image", "og:type", "og:url"]) {
      const content = await page.getAttribute(`meta[property="${property}"]`, "content");
      expect(content, `missing ${property}`).toBeTruthy();
    }
    const image = await page.getAttribute('meta[property="og:image"]', "content");
    expect(image).toMatch(/^https?:\/\//);
    const type = await page.getAttribute('meta[property="og:type"]', "content");
    expect(type).toBe("website");
  });

  test("Twitter Card tags present @smoke", async ({ page }) => {
    await page.goto("/");
    const card = await page.getAttribute('meta[name="twitter:card"]', "content");
    expect(card).toBe("summary_large_image");
    for (const name of ["twitter:title", "twitter:description", "twitter:image"]) {
      const content = await page.getAttribute(`meta[name="${name}"]`, "content");
      expect(content, `missing ${name}`).toBeTruthy();
    }
  });

  test("og:image resolves @smoke", async ({ page, request }) => {
    await page.goto("/");
    const imageUrl = await page.getAttribute('meta[property="og:image"]', "content");
    if (!imageUrl) throw new Error("og:image meta tag missing content");
    const response = await request.get(imageUrl);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
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

  // Asserts the CSS rule shipped, not that the woff2 rendered. With
  // font-display: optional the browser may not swap to Plex Serif on a
  // cold visit, but getComputedStyle still returns the declared family.
  test("post body declares IBM Plex Serif @smoke", async ({ page }) => {
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
});
