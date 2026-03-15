import { test, expect } from "@playwright/test";

test.describe("info panel — desktop", () => {
  test("aside is visible with core sections", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    const panel = page.locator("#info-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator("h3", { hasText: "Archive" })).toBeVisible();
  });

  test("panel toggle button is hidden on desktop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await expect(page.locator("#panel-toggle")).toBeHidden();
  });

  test("shows itch.io and No Land Beyond links without Find Me heading @smoke", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    const panel = page.locator("#info-panel");
    await expect(panel.locator("h3", { hasText: "Find Me" })).toHaveCount(0);
    await expect(panel.locator('a[href="https://natethenoob.itch.io"]')).toBeVisible();
    const nlbLink = panel.locator('a[href="https://discord.gg/MxXHfyY3"]');
    await expect(nlbLink).toBeVisible();
    await expect(nlbLink.locator(".link-subtitle")).toHaveText("Find a Local Game in Baltimore");
  });

  test("shows Games I'm Playing section with links", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    const panel = page.locator("#info-panel");
    await expect(panel.locator("h3", { hasText: "Games I'm Playing" })).toBeVisible();
    await expect(panel.locator('a[href="https://chrismcdee.itch.io/mythic-bastionland"]')).toBeVisible();
    await expect(panel.locator('a[href="https://freeleaguepublishing.com/games/alien/"]')).toBeVisible();
    await expect(panel.locator('a[href="https://cairnrpg.com/"]')).toBeVisible();
  });

  test("shows blogroll with two entries", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    const panel = page.locator("#info-panel");
    await expect(panel.locator("h3", { hasText: "Blogroll" })).toBeVisible();
    const blogrollItems = panel.locator(".blogroll-entry");
    await expect(blogrollItems).toHaveCount(2);
  });

  test("blogroll entries have populated latest post content @smoke", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    test.setTimeout(120_000);
    // Hydration fetches feeds once on page load. If the feed proxy isn't ready
    // yet (e.g., functions emulator still starting), the spans stay empty and
    // won't retry. Reload the page on each poll attempt so a fresh hydration
    // cycle runs against a proxy that has had more time to start.
    await expect(async () => {
      await page.goto("/");
      await page.waitForSelector("main h2", { timeout: 30000 });
      const panel = page.locator("#info-panel");
      await expect(panel.locator(".blogroll-entry .blogroll-latest").first())
        .not.toHaveText("", { timeout: 15000 });
    }).toPass({ timeout: 90000, intervals: [5000] });
  });
});

test.describe("info panel — mobile", () => {
  test("aside is hidden by default", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    await expect(page.locator("#info-panel")).toBeHidden();
  });

  test("toggle button is visible", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    await expect(page.locator("#panel-toggle")).toBeVisible();
  });

  test("clicking toggle shows and hides panel", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });
    const toggle = page.locator("#panel-toggle");
    const panel = page.locator("#info-panel");

    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await toggle.click();
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("info panel — header alignment", () => {
  test("header left edge aligns with main content left edge", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("main h2", { timeout: 30000 });

    const headerBox = await page.locator("header").boundingBox();
    const mainBox = await page.locator("main").boundingBox();

    expect(headerBox).not.toBeNull();
    expect(mainBox).not.toBeNull();
    expect(Math.abs(headerBox!.x - mainBox!.x)).toBeLessThanOrEqual(2);
  });
});
