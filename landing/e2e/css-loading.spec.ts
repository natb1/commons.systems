import { test, expect } from "@playwright/test";

test.describe("CSS loading", () => {
  test("critical CSS is inlined in the head @smoke", async ({ page }) => {
    await page.goto("/");
    const inlineStyleCount = await page.locator("head > style").count();
    expect(inlineStyleCount).toBeGreaterThan(0);
  });

  test("body background color renders immediately without FOUC", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-color"),
    );
    const match = bg.match(/\d+/g)?.map(Number);
    expect(
      match,
      `background-color returned unexpected format: "${bg}"`,
    ).not.toBeNull();
    expect(match!.length).toBeGreaterThanOrEqual(3);
    // Landing uses color-scheme: dark. All RGB channels should be low
    // to confirm the dark background rendered before full stylesheets loaded.
    expect(match![0]).toBeLessThan(80);
    expect(match![1]).toBeLessThan(80);
    expect(match![2]).toBeLessThan(80);
  });

  test("full stylesheet loads after page load", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    const hasFullStylesheet = await page.evaluate(() => {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      return Array.from(links).some(
        (link) => link.getAttribute("media") !== "print",
      );
    });
    expect(hasFullStylesheet).toBe(true);
  });
});
