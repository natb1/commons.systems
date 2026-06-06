import { test, expect } from "./playwright-test";
import { getEntryAsset } from "./hosting-smoke-helpers";

export function describeCacheHeadersSmoke(
  appName: string,
  options?: { imagePath?: string },
): void {
  test.describe(`${appName} cache headers smoke`, () => {
    test("hashed assets have immutable cache-control @hosting", async ({
      request,
    }) => {
      const { entryAssetUrl } = await getEntryAsset(request);

      const assetResponse = await request.head(entryAssetUrl);
      expect(assetResponse.status()).toBe(200);
      const cacheControl = assetResponse.headers()["cache-control"];
      expect(
        cacheControl,
        "cache-control header missing from asset response",
      ).toBeDefined();
      expect(cacheControl).toContain("public, max-age=31536000, immutable");
    });

    if (options?.imagePath) {
      const imagePath = options.imagePath;
      test("images have yearly cache-control @hosting", async ({ request }) => {
        const imageResponse = await request.head(imagePath);
        expect(imageResponse.status()).toBe(200);
        const imgCacheControl = imageResponse.headers()["cache-control"];
        expect(
          imgCacheControl,
          "cache-control header missing from image response",
        ).toBeDefined();
        expect(imgCacheControl).toContain("public, max-age=31536000");
      });
    }
  });
}
