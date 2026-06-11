import { test, expect } from "@commons-systems/config/playwright-test";

// The demo (unauthenticated) page renders the bundled usage-samples seed, so the
// HISTORY band and both charts must appear without sign-in.
test.describe("office-hours capacity history charts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for a chart SVG to confirm the demo seed has rendered.
    await expect(
      page.locator(".capacity-history .chart-scroll-wrapper svg").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("history section is visible on the demo page", async ({ page }) => {
    await expect(page.locator("section.capacity-history")).toBeVisible();
  });

  test("HISTORY heading is present", async ({ page }) => {
    await expect(page.locator(".capacity-history-heading")).toHaveText("HISTORY");
  });

  test("both charts render SVGs", async ({ page }) => {
    const svgs = page.locator(".capacity-history .chart-scroll-wrapper svg");
    // beforeEach already waited for the first SVG to be visible, so the count
    // can proceed immediately.
    const count = await svgs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
