import { test, expect } from "@playwright/test";

test.describe("theme", () => {
  test("dark color scheme applies dark background", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-color"),
    );

    // Dark theme should produce a dark background (low RGB channel values)
    const match = bg.match(/\d+/g)?.map(Number) ?? [];
    expect(match.length).toBeGreaterThanOrEqual(3);
    expect(match[0]).toBeLessThan(80);
    expect(match[1]).toBeLessThan(80);
    expect(match[2]).toBeLessThan(80);
  });

  test("light color scheme applies light background", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-color"),
    );

    // Light theme should produce a light background (high RGB channel values)
    const match = bg.match(/\d+/g)?.map(Number) ?? [];
    expect(match.length).toBeGreaterThanOrEqual(3);
    expect(match[0]).toBeGreaterThan(180);
    expect(match[1]).toBeGreaterThan(180);
    expect(match[2]).toBeGreaterThan(180);
  });
});
