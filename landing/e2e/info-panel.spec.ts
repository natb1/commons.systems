import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://raw.githubusercontent.com/**", (route) =>
    route.fulfill({ body: "# Test\nContent." }),
  );
});

test.describe("info panel — desktop", () => {
  test("aside is visible with all sections", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const panel = page.locator("#info-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator("h3", { hasText: "Links" })).toBeVisible();
    await expect(panel.locator("h3", { hasText: "Top Posts" })).toBeVisible();
    await expect(panel.locator("h3", { hasText: "Blogroll" })).toBeVisible();
    await expect(panel.locator("h3", { hasText: "Archive" })).toBeVisible();
  });

  test("Links section contains Source link", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const link = page.locator(
      '#info-panel a[href="https://github.com/natb1/commons.systems"]',
    );
    await expect(link).toBeVisible();
    await expect(link).toHaveText("Source");
  });

  test("Top Posts section contains article links", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const topPostsSection = page.locator(
      '.panel-section:has(h3:text("Top Posts"))',
    );
    const links = topPostsSection.locator(".panel-list a");
    expect(await links.count()).toBeGreaterThanOrEqual(1);
  });

  test("panel toggle button is hidden on desktop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await expect(page.locator("#panel-toggle")).toBeHidden();
  });
});

test.describe("info panel — mobile", () => {
  test("aside is hidden by default", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#info-panel")).toBeHidden();
  });

  test("toggle button is visible", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    await expect(page.locator("#panel-toggle")).toBeVisible();
  });

  test("clicking toggle shows and hides panel", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
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
  test("header h1 left edge aligns with main content left edge", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });

    const h1Box = await page.locator("header h1").boundingBox();
    const mainBox = await page.locator("main").boundingBox();

    expect(h1Box).not.toBeNull();
    expect(mainBox).not.toBeNull();
    expect(Math.abs(h1Box!.x - mainBox!.x)).toBeLessThanOrEqual(2);
  });
});

test.describe("info panel — archive", () => {
  test("current month is expanded by default", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const archiveSection = page.locator(
      '.panel-section:has(h3:text("Archive"))',
    );
    const openDetails = archiveSection.locator("details[open]");
    expect(await openDetails.count()).toBeGreaterThanOrEqual(1);
  });
});
