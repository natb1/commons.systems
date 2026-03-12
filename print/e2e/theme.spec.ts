import { test, expect } from "@playwright/test";

test.describe("theme", () => {
  test("dark color scheme applies dark background", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-color"),
    );

    // Dark theme --bg is #1a1714 which is rgb(26, 23, 20)
    const match = bg.match(/\d+/g)?.map(Number) ?? [];
    expect(match.length).toBeGreaterThanOrEqual(3);
    // All RGB channels should be low (dark background)
    expect(match[0]).toBeLessThan(80);
    expect(match[1]).toBeLessThan(80);
    expect(match[2]).toBeLessThan(80);
  });

  test("forced dark mode ignores light preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-color"),
    );

    // color-scheme: dark in theme.css forces dark values even with light preference
    const match = bg.match(/\d+/g)?.map(Number) ?? [];
    expect(match.length).toBeGreaterThanOrEqual(3);
    expect(match[0]).toBeLessThan(80);
    expect(match[1]).toBeLessThan(80);
    expect(match[2]).toBeLessThan(80);
  });

  test("body has grid texture background", async ({ page }) => {
    await page.goto("/");

    const bgImage = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-image"),
    );

    expect(bgImage).toContain("repeating-linear-gradient");
  });
});
