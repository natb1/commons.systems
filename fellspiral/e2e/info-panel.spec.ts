import { test, expect } from "@playwright/test";

test.describe("info panel — desktop", () => {
  test("aside is visible with core sections", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop");
    await page.goto("/");
    await page.waitForSelector("#posts", { timeout: 30000 });
    const panel = page.locator("#info-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator("h3", { hasText: "Archive" })).toBeVisible();
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
