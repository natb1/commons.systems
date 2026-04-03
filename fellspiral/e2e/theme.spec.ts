import { test, expect, Page } from "@playwright/test";

async function expectLightBackground(page: Page) {
  const bg = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue("background-color"),
  );

  // Parchment background — all RGB channels should be high
  const match = bg.match(/\d+/g)?.map(Number);
  expect(match, `background-color returned unexpected format: "${bg}"`).not.toBeNull();
  expect(match!.length).toBeGreaterThanOrEqual(3);
  expect(match[0]).toBeGreaterThan(180);
  expect(match[1]).toBeGreaterThan(180);
  expect(match[2]).toBeGreaterThan(180);
}

test.describe("theme", () => {
  test("light-only theme applies parchment background", async ({ page }) => {
    await page.goto("/");
    await expectLightBackground(page);
  });

  test("dark color scheme preference has no effect", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expectLightBackground(page);
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
      if (!h1) throw new Error("No <h1> element found on page");
      return getComputedStyle(h1).getPropertyValue("font-family");
    });

    expect(h1Font).toContain("Uncial Antiqua");
  });

  test("does not make external font requests", async ({ page }) => {
    const externalFontRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("fonts.googleapis.com") ||
        url.includes("fonts.gstatic.com")
      ) {
        externalFontRequests.push(url);
      }
    });
    await page.goto("/");
    expect(externalFontRequests).toEqual([]);
  });

  test("self-hosted fonts are loaded", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const fontsLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        ebGaramond: document.fonts.check('16px "EB Garamond"'),
        uncialAntiqua: document.fonts.check('16px "Uncial Antiqua"'),
      };
    });

    expect(fontsLoaded.ebGaramond).toBe(true);
    expect(fontsLoaded.uncialAntiqua).toBe(true);
  });
});
