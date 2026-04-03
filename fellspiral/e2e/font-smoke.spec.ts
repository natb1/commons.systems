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
});
