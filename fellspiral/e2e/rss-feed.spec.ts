import { test, expect } from "@playwright/test";

test.describe("rss feed", () => {
  test("GET /feed.xml returns valid RSS 2.0", async ({ page }) => {
    const response = await page.goto("/feed.xml");
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()["content-type"] ?? "";
    expect(contentType).toContain("rss+xml");

    const xml = await response!.text();
    expect(xml).toContain('<?xml');
    expect(xml).toContain('<rss');
    expect(xml).toContain('xmlns:atom');
    expect(xml).toContain('atom:link');
    expect(xml).toContain('<lastBuildDate>');
    expect(xml).toContain('<docs>');
    expect(xml).toContain('<generator>commons.systems</generator>');
    expect(xml).toContain('isPermaLink="true"');
  });

  test("home page has RSS autodiscovery tag", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('head link[rel="alternate"][type="application/rss+xml"]');
    await expect(link).toHaveAttribute("href", "/feed.xml");
  });

  test("RSS icon links to /feed.xml", async ({ page }) => {
    await page.goto("/");
    // Wait for posts to load (Archive section needs published posts)
    await page.waitForSelector("#app a[href]", { timeout: 30000 });
    // On narrow viewports the sidebar is hidden until the panel toggle is clicked
    const toggle = page.locator("#panel-toggle");
    if (await toggle.isVisible()) {
      await toggle.click();
    }
    await page.waitForSelector("#info-panel .feed-icon", { timeout: 30000 });
    const rssLink = page.locator('#info-panel a[title="RSS"]');
    await expect(rssLink).toHaveAttribute("href", "/feed.xml");
    const href = await rssLink.getAttribute("href");
    expect(href).not.toContain("blob:");
  });
});
