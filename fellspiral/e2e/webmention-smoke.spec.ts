import { test, expect } from "@commons-systems/config/playwright-test";

test.describe("fellspiral webmention endpoint advertisement", () => {
  test("head advertises the webmention endpoint @smoke", async ({ page }) => {
    await page.goto("/");

    const hrefs = await page
      .locator('link[rel="webmention"]')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("href")).filter(Boolean),
      );

    expect(hrefs).toEqual(["https://fellspiral.commons.systems/api/webmention"]);
  });
});
