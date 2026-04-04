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
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
  });

  test("all blog post images have width and height attributes", async ({
    page,
  }) => {
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
    const firstImage = page.locator("#posts img").first();
    await expect(firstImage).toHaveAttribute("fetchpriority", "high");
  });

  test("below-fold images have loading lazy", async ({ page }) => {
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

    // Scroll each post image into view to trigger lazy loading. The settle
    // timeout below allows pending network requests to complete.
    const postImages = page.locator("#posts img");
    const imgCount = await postImages.count();
    for (let i = 0; i < imgCount; i++) {
      await postImages.nth(i).scrollIntoViewIfNeeded();
    }
    // Allow a short settle for any remaining network activity on post images
    await page.waitForTimeout(2000);

    expect(failedImages, "Some images failed to load").toHaveLength(0);
  });

  test("all image src paths use WebP format", async ({ page }) => {
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

  test("all post images have srcset with width descriptors", async ({
    page,
  }) => {
    const images = page.locator("#posts img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(EXPECTED_IMAGES.length);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute("src");
      const srcset = await img.getAttribute("srcset");
      expect(srcset, `image ${src} missing srcset`).toBeTruthy();
      expect(srcset, `image ${src} srcset missing width descriptors`).toMatch(
        /\d+w/,
      );
    }
  });

  test("all post images have sizes attribute", async ({ page }) => {
    const images = page.locator("#posts img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(EXPECTED_IMAGES.length);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute("src");
      await expect(img, `image ${src} missing sizes`).toHaveAttribute("sizes");
    }
  });

  test("all expected images are present", async ({ page }) => {
    const images = page.locator("#posts img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(EXPECTED_IMAGES.length);

    const srcs: string[] = [];
    for (let i = 0; i < count; i++) {
      srcs.push(await images.nth(i).getAttribute("src") ?? "");
    }
    for (const expected of EXPECTED_IMAGES) {
      expect(srcs.some((src) => src.includes(expected)),
        `expected image ${expected} not found`,
      ).toBe(true);
    }
  });
});
