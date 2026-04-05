import { test, expect } from "@playwright/test";

test.describe("font smoke", () => {
  test("no external Google Fonts requests @smoke", async ({ page }) => {
    const blocked: string[] = [];
    page.on("request", (req) => {
      // Only track main-frame requests. Firebase Auth loads a hidden iframe
      // (__/auth/iframe) whose identity toolkit fetches Roboto from gstatic;
      // that is third-party infrastructure, not our site fonts.
      if (req.frame() !== page.mainFrame()) return;
      if (
        req.url().includes("fonts.googleapis.com") ||
        req.url().includes("fonts.gstatic.com")
      ) {
        blocked.push(req.url());
      }
    });
    await page.goto("/");
    expect(blocked).toEqual([]);
  });

  test("font preload links are present @smoke", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const preloads = page.locator('link[rel="preload"][as="font"]');
    const count = await preloads.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await preloads.nth(i).getAttribute("href");
      expect(href).not.toBeNull();
      hrefs.push(href!);
    }

    expect(hrefs.some((h) => h.includes("uncial-antiqua"))).toBe(true);
    expect(hrefs.some((h) => h.includes("eb-garamond"))).toBe(true);
  });
});
