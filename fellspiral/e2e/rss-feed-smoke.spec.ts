import { test, expect } from "@playwright/test";

test.describe("rss feed smoke", () => {
  test("GET /feed.xml returns RSS XML @smoke", async ({ page }) => {
    const response = await page.goto("/feed.xml");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
    const contentType = response!.headers()["content-type"] ?? "";
    expect(contentType).toContain("rss+xml");

    const xml = await response!.text();
    expect(xml).toContain("<?xml");
    expect(xml).toContain("<rss");
    expect(xml).toContain("xmlns:atom");
    expect(xml).toContain("atom:link");
  });
});
