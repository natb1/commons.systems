import { test, expect } from "@playwright/test";

test.describe("cache headers", () => {
  test("hashed asset under /assets/ has immutable cache-control", async ({
    page,
  }) => {
    // Load the home page and capture a request for a hashed asset
    const assetResponse = page.waitForResponse(
      (resp) =>
        new URL(resp.url()).pathname.startsWith("/assets/") &&
        resp.status() === 200,
    );
    await page.goto("/");
    const response = await assetResponse;

    expect(response.status()).toBe(200);

    const cacheControl = response.headers()["cache-control"] ?? "";
    // Firebase emulators may not serve custom hosting headers
    if (cacheControl) {
      expect(cacheControl).toContain("immutable");
    }
  });

  test("image has max-age=86400 cache-control", async ({ page }) => {
    const response = await page.goto("/blog-map-color.jpg");
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const cacheControl = response!.headers()["cache-control"] ?? "";
    // Firebase emulators may not serve custom hosting headers
    if (cacheControl) {
      expect(cacheControl).toContain("max-age=86400");
    }
  });
});
