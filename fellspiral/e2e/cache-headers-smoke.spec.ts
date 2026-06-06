import { test, expect } from "@commons-systems/config/playwright-test";
import { describeCacheHeadersSmoke } from "@commons-systems/config/cache-headers-smoke";

describeCacheHeadersSmoke("fellspiral", { imagePath: "/blog-map-color.webp" });

test.describe("fellspiral extra cache headers smoke", () => {
  test("fonts have yearly cache-control @hosting", async ({ request }) => {
    const fontResponse = await request.head(
      "/fonts/eb-garamond-latin-400-normal.woff2",
    );
    expect(
      fontResponse.status(),
      "font file /fonts/eb-garamond-latin-400-normal.woff2 not found -- verify the font path still exists in the build output",
    ).toBe(200);
    const fontCacheControl = fontResponse.headers()["cache-control"];
    expect(
      fontCacheControl,
      "cache-control header missing from font response",
    ).toBeDefined();
    expect(fontCacheControl).toContain("public, max-age=31536000");
  });
});
