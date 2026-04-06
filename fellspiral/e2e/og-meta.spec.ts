import { test, expect } from "@playwright/test";

function getMeta(page: import("@playwright/test").Page, selector: string) {
  return page.evaluate(
    (sel) => document.querySelector(sel)?.getAttribute("content") ?? null,
    selector,
  );
}

const SITE_DESCRIPTION =
  "A TTRPG game blog by Nate. Nate likes games about social role play.";

test.describe("og meta tags", () => {
  test("home page meta description present after hydration", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    const description = await getMeta(page, 'meta[name="description"]');
    expect(description).toBe(SITE_DESCRIPTION);
  });

  test("home page og:description matches meta description", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    const ogDescription = await getMeta(
      page,
      'meta[property="og:description"]',
    );
    expect(ogDescription).toBe(SITE_DESCRIPTION);
  });

  test("home page og:image set to armadillo crag", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    const ogImage = await getMeta(page, 'meta[property="og:image"]');
    expect(ogImage).toContain("tile10-armadillo-crag.webp");
  });

  test("home page og:title set to fellspiral", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    const ogTitle = await getMeta(page, 'meta[property="og:title"]');
    expect(ogTitle).toBe("fellspiral");
  });

  test("post page sets post-specific meta description", async ({ page }) => {
    await page.goto("/post/scenes-from-a-hat");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const description = await getMeta(page, 'meta[name="description"]');
    expect(description).not.toBeNull();
    expect(description).not.toBe(SITE_DESCRIPTION);
  });

  test("navigation from post to home restores site-level OG tags", async ({
    page,
  }) => {
    await page.goto("/post/scenes-from-a-hat");
    await page.waitForSelector("#posts", { timeout: 30000 });

    // Verify post-specific description is active
    const postDescription = await getMeta(page, 'meta[name="description"]');
    expect(postDescription).not.toBe(SITE_DESCRIPTION);

    // Navigate home via nav link
    await page.click('app-nav a[href="/"]');
    await expect(page.locator("main h2").first()).toBeVisible();

    // Verify site-level description is restored
    const homeDescription = await getMeta(page, 'meta[name="description"]');
    expect(homeDescription).toBe(SITE_DESCRIPTION);
  });
});
