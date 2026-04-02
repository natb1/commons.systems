import { test, expect } from "@playwright/test";

test.describe("hero", () => {
  test("hero section visible on landing page @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero")).toBeVisible();
  });

  test("hero visible on all pages", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#hero")).toBeVisible();
  });

  test("displays headline and subtext", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero h2")).toHaveText("This is Not an App.");
    await expect(page.locator("#hero .hero-subtext")).toBeVisible();
  });

  test("clicking a chip shows its panel below", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hero-chip").first().click();
    await expect(page.locator("#panel-analyze")).toBeVisible();
  });

  test("clicking a second chip hides the first panel", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hero-chip").first().click();
    await expect(page.locator("#panel-analyze")).toBeVisible();

    await page.locator(".hero-chip").nth(1).click();
    await expect(page.locator("#panel-analyze")).toBeHidden();
    await expect(page.locator("#panel-parser")).toBeVisible();
  });

  test("clicking an active chip hides its panel", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hero-chip").first().click();
    await expect(page.locator("#panel-analyze")).toBeVisible();

    await page.locator(".hero-chip").first().click();
    await expect(page.locator("#panel-analyze")).toBeHidden();
  });

  test("inline chip opens parser panel", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hero-chip").first().click();
    await page.locator(".inline-chip").click();
    await expect(page.locator("#panel-parser")).toBeVisible();
    await expect(page.locator("#panel-analyze")).toBeHidden();
  });

  test("FAQ expands and collapses", async ({ page }) => {
    await page.goto("/");
    const faq = page.locator(".hero-faq");
    await faq.locator("summary").click();
    await expect(faq).toHaveAttribute("open");

    await faq.locator("summary").click();
    await expect(faq).not.toHaveAttribute("open");
  });

  test("FAQ contains questions", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hero-faq summary").click();
    await expect(page.locator(".hero-faq-body dt")).toHaveCount(2);
  });
});
