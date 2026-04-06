import { test, expect } from "@playwright/test";

test.describe("og meta smoke", () => {
  test("home page has meta description @smoke", async ({ page }) => {
    await page.goto("/");

    const description = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return meta?.getAttribute("content") ?? null;
    });
    expect(description, 'meta[name="description"] missing or has no content').not.toBeNull();
    expect(description!.length, 'meta[name="description"] content is empty').toBeGreaterThan(0);
  });

  test("home page has og:image @smoke", async ({ page }) => {
    await page.goto("/");

    const ogImage = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:image"]');
      return meta?.getAttribute("content") ?? null;
    });
    expect(ogImage, 'meta[property="og:image"] missing or has no content').not.toBeNull();
    expect(ogImage!, 'og:image does not reference tile10-armadillo-crag.webp').toContain("tile10-armadillo-crag.webp");
  });
});
