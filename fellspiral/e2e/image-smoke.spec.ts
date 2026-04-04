import { test, expect } from "@playwright/test";

const IMAGE_PATHS = [
  "/woman-with-a-flower-head.webp",
  "/woman-with-a-flower-head-400w.webp",
  "/woman-with-a-flower-head-800w.webp",
  "/blog-map-color.webp",
  "/blog-map-color-400w.webp",
  "/blog-map-color-800w.webp",
  "/tile10-armadillo-crag.webp",
  "/tile10-armadillo-crag-400w.webp",
  "/alienurn.webp",
  "/alienurn-400w.webp",
  "/alienurn-800w.webp",
];

test.describe("image optimization smoke", () => {
  for (const path of IMAGE_PATHS) {
    test(`GET ${path} returns 200 with image/webp @smoke`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);
      const contentType = response!.headers()["content-type"] ?? "";
      expect(contentType).toContain("image/webp");
    });
  }

  test("no broken images on home page @smoke", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const images = page.locator("#posts img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect(img).not.toHaveJSProperty("naturalWidth", 0);
    }
  });
});
