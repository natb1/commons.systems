import { test, expect } from "@playwright/test";

test.describe("landing preconnect links", () => {
  test("preconnect links are present for Google API domains", async ({
    page,
  }) => {
    await page.goto("/");

    const hrefs = await page
      .locator('link[rel="preconnect"]')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("href")).filter(Boolean),
      );

    expect(hrefs).toContain("https://www.googleapis.com");
    expect(hrefs).toContain(
      "https://firebaseinstallations.googleapis.com",
    );
    expect(hrefs).toContain("https://apis.google.com");
    expect(hrefs).toContain("https://firestore.googleapis.com");
  });
});
