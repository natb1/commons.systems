import { test, expect } from "@playwright/test";

// Verify that blog post images are optimized: WebP format, explicit dimensions,
// fetchpriority on the LCP image, and lazy loading on below-fold images.

const EXPECTED_IMAGES = [
  "/woman-with-a-flower-head.webp",
  "/blog-map-color.webp",
  "/tile10-armadillo-crag.webp",
  "/alienurn.webp",
];

test.describe("image optimization", () => {
  test("all blog post images have width and height attributes", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    const images = page.locator("#posts img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(EXPECTED_IMAGES.length);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute("src");
      await expect(img, `image ${src} missing width`).toHaveAttribute("width");
      await expect(img, `image ${src} missing height`).toHaveAttribute(
        "height",
      );
    }
  });

  test("first image has fetchpriority high (LCP element)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    const firstImage = page.locator("#posts img").first();
    await expect(firstImage).toHaveAttribute("fetchpriority", "high");
  });

  test("below-fold images have loading lazy", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    const images = page.locator("#posts img");
    const count = await images.count();

    // Skip the first image (LCP) -- remaining images should be lazy-loaded
    for (let i = 1; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute("src");
      await expect(img, `image ${src} missing loading=lazy`).toHaveAttribute(
        "loading",
        "lazy",
      );
    }
  });

  test("all images load successfully (no 404s) @smoke", async ({ page }) => {
    const failedImages: string[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (
        response.request().resourceType() === "image" &&
        response.status() >= 400
      ) {
        failedImages.push(`${response.status()} ${url}`);
      }
    });

    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    // Scroll to the bottom to trigger lazy-loaded images
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState("networkidle");

    expect(failedImages, "Some images failed to load").toHaveLength(0);
  });

  test("all image src paths use WebP format", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    const images = page.locator("#posts img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(EXPECTED_IMAGES.length);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute("src");
      expect(src, `image src does not end with .webp: ${src}`).toMatch(
        /\.webp$/,
      );
    }
  });

  test("expected images are present in correct order", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    const images = page.locator("#posts img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(EXPECTED_IMAGES.length);

    for (let i = 0; i < EXPECTED_IMAGES.length; i++) {
      const src = await images.nth(i).getAttribute("src");
      expect(src, `image ${i} has unexpected src`).toContain(
        EXPECTED_IMAGES[i],
      );
    }
  });
});
