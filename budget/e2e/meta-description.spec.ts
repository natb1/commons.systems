import { test, expect } from "@playwright/test";

test.describe("meta description", () => {
  test("home page has meta description @smoke", async ({ page }) => {
    await page.goto("/");

    const description = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return meta?.getAttribute("content") ?? null;
    });
    expect(description, 'meta[name="description"] tag or content attribute missing').not.toBeNull();
    expect(description!.length, 'meta[name="description"] content is empty').toBeGreaterThan(0);
  });
});
