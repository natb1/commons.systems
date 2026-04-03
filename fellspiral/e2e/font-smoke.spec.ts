import { test, expect } from "@playwright/test";

test.describe("font smoke", () => {
  test("no external Google Fonts requests @smoke", async ({ page }) => {
    const blocked: string[] = [];
    page.on("request", (req) => {
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
