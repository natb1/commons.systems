import { test, expect } from "@commons-systems/config/playwright-test";

test.describe("about page", () => {
  test("direct load of /about initializes the SPA", async ({ page }) => {
    await page.goto("/about");

    // data-route is set by updateNav(), which runs after the old crash point in
    // main.ts — if ensureHero() throws, data-route is never set.
    await page.waitForSelector("body[data-route='about']", { timeout: 30000 });
    await expect(page.locator("body")).toHaveAttribute("data-route", "about");
  });

  test("contact mailto link is present", async ({ page }) => {
    await page.goto("/about");

    const mailto = page.locator('a[href="mailto:nathan@natb1.com"]');
    await expect(mailto).toBeVisible();
  });

  test("navigating to Home from /about shows the showcase band", async ({ page }) => {
    await page.goto("/about");

    // Navigate to home via nav link — exercises the ensureHero() recreate path
    // because /about's prerendered HTML ships without .landing-hero.
    await page.locator('app-nav a[href="/"]').click();

    await expect(page.locator(".landing-hero-band")).toBeVisible();
  });
});
