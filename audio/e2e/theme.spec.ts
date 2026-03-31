import { test, expect, Page } from "@playwright/test";

async function expectDarkBackground(page: Page) {
  const bg = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue("background-color"),
  );

  // All RGB channels should be low (dark background)
  const match = bg.match(/\d+/g)?.map(Number);
  expect(match, `background-color returned unexpected format: "${bg}"`).not.toBeNull();
  expect(match!.length).toBeGreaterThanOrEqual(3);
  expect(match![0]).toBeLessThan(80);
  expect(match![1]).toBeLessThan(80);
  expect(match![2]).toBeLessThan(80);
}

test.describe("theme", () => {
  test("dark color scheme applies dark background", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expectDarkBackground(page);
  });

  test("forced dark mode ignores light preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expectDarkBackground(page);
  });

  test("body has grid texture background", async ({ page }) => {
    await page.goto("/");

    const bgImage = await page.evaluate(() =>
      getComputedStyle(document.body).getPropertyValue("background-image"),
    );

    expect(bgImage).toContain("repeating-linear-gradient");
  });
});
