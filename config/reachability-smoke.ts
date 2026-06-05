import { test, expect } from "./playwright-test";
import { getEntryAsset } from "./hosting-smoke-helpers";

export function describeReachabilitySmoke(
  appName: string,
  options?: {
    staticAssetPath?: string;
    staticAssetContentType?: string;
    feedXml?: boolean;
  },
): void {
  test.describe(`${appName} reachability smoke`, () => {
    test("key paths are reachable @hosting", async ({ request }) => {
      const { indexResponse, entryAssetUrl } = await getEntryAsset(request);
      expect(indexResponse.status()).toBe(200);
      expect(indexResponse.headers()["content-type"]).toContain("text/html");

      const assetResponse = await request.head(entryAssetUrl);
      expect(assetResponse.status()).toBe(200);
      expect(assetResponse.headers()["content-type"]).toContain("javascript");

      if (options?.staticAssetPath) {
        const staticResponse = await request.head(options.staticAssetPath);
        expect(staticResponse.status()).toBe(200);
        expect(staticResponse.headers()["content-type"]).toContain(
          options.staticAssetContentType ?? "text/plain",
        );
      }

      if (options?.feedXml) {
        const feedResponse = await request.head("/feed.xml");
        expect(feedResponse.status()).toBe(200);
        expect(feedResponse.headers()["content-type"]).toContain("xml");
      }
    });
  });
}
