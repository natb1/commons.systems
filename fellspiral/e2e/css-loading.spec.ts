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
    // Evaluate background before full load to catch FOUC
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-color"),
    );

    // Parchment background — all RGB channels should be high (light theme)
    const match = bg.match(/\d+/g)?.map(Number);
    expect(
      match,
      `background-color returned unexpected format: "${bg}"`,
    ).not.toBeNull();
    expect(match!.length).toBeGreaterThanOrEqual(3);
    expect(match![0]).toBeGreaterThan(180);
    expect(match![1]).toBeGreaterThan(180);
    expect(match![2]).toBeGreaterThan(180);
  });

  test("full stylesheet loads after page load", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");

    // Critters defers the full stylesheet by setting media="print" with an
    // onload handler that switches it back. After load, at least one
    // <link rel="stylesheet"> should have reverted to a non-print media type.
    const hasFullStylesheet = await page.evaluate(() => {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      return Array.from(links).some(
        (link) => link.getAttribute("media") !== "print",
      );
    });

    expect(hasFullStylesheet).toBe(true);
  });
});
