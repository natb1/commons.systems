import { test, expect } from "@playwright/test";

test.describe("theme", () => {
  test("light-only theme applies parchment background", async ({ page }) => {
    await page.goto("/");

    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-color"),
    );

    // Parchment --bg is #f5eed6 which is rgb(245, 238, 214)
    const match = bg.match(/\d+/g)?.map(Number) ?? [];
    expect(match.length).toBeGreaterThanOrEqual(3);
    // All RGB channels should be high (light parchment background)
    expect(match[0]).toBeGreaterThan(180);
    expect(match[1]).toBeGreaterThan(180);
    expect(match[2]).toBeGreaterThan(180);
  });

  test("dark color scheme preference has no effect", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-color"),
    );

    // Even with dark preference, background stays light (parchment)
    const match = bg.match(/\d+/g)?.map(Number) ?? [];
    expect(match.length).toBeGreaterThanOrEqual(3);
    expect(match[0]).toBeGreaterThan(180);
    expect(match[1]).toBeGreaterThan(180);
    expect(match[2]).toBeGreaterThan(180);
  });

  test("uses serif body font", async ({ page }) => {
    await page.goto("/");

    const fontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("font-family"),
    );

    expect(fontFamily).toContain("EB Garamond");
  });

  test("headings use manuscript titling font", async ({ page }) => {
    await page.goto("/");

    const h1Font = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return h1 ? getComputedStyle(h1).getPropertyValue("font-family") : "";
    });

    expect(h1Font).toContain("Uncial Antiqua");
  });
});
