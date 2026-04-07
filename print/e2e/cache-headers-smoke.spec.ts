import { test, expect } from "@playwright/test";

test.describe("print cache headers smoke", () => {
  test("hashed assets have immutable cache-control @smoke", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const assetUrl = await page.evaluate(() => {
      const el =
        document.querySelector('script[src^="/assets/"]') ??
        document.querySelector('link[rel="stylesheet"][href^="/assets/"]');
      if (!el) return null;
      return el.getAttribute("src") ?? el.getAttribute("href");
    });
    expect(assetUrl, "No script[src^='/assets/'] or stylesheet[href^='/assets/'] found on page").not.toBeNull();

    const assetResponse = await page.goto(assetUrl!);
    expect(assetResponse).not.toBeNull();
    expect(assetResponse!.status()).toBe(200);
    const cacheControl = assetResponse!.headers()["cache-control"];
    expect(cacheControl, "cache-control header missing from asset response").toBeDefined();
    expect(cacheControl).toContain("public, max-age=31536000, immutable");
  });

  test("images have yearly cache-control @smoke", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const imageUrl = await page.evaluate(() => {
      const img = document.querySelector('img[src^="/"]');
      if (!img) return null;
      return img.getAttribute("src");
    });
    test.skip(!imageUrl, "No <img src='/...'> element on page -- nothing to verify");

    const imageResponse = await page.goto(imageUrl!);
    expect(imageResponse).not.toBeNull();
    expect(imageResponse!.status()).toBe(200);
    const imgCacheControl = imageResponse!.headers()["cache-control"];
    expect(imgCacheControl, "cache-control header missing from image response").toBeDefined();
    expect(imgCacheControl).toContain("public, max-age=31536000");
  });
});
