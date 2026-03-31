import { test, expect } from "@playwright/test";

test.describe("hero", () => {
  test("hero section visible on landing page @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero")).toBeVisible();
  });

  test("hero not present on transactions page", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#hero")).toHaveCount(0);
  });

  test("displays headline and subtext", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero h2")).toHaveText("This is Not an App.");
    await expect(page.locator("#hero .hero-subtext")).toBeVisible();
  });

  test("chip accordion opens panel on click", async ({ page }) => {
    await page.goto("/");
    const firstChip = page.locator(".hero-chip").first();
    await firstChip.click();
    await expect(page.locator(".hero-chip-detail").first()).toHaveAttribute("open");
  });

  test("chip accordion closes other panels", async ({ page }) => {
    await page.goto("/");
    const chips = page.locator(".hero-chip");
    await chips.first().click();
    await expect(page.locator(".hero-chip-detail").first()).toHaveAttribute("open");

    await chips.nth(1).click();
    await expect(page.locator(".hero-chip-detail").first()).not.toHaveAttribute("open");
    await expect(page.locator(".hero-chip-detail").nth(1)).toHaveAttribute("open");
  });

  test("inline chip opens parser panel", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hero-chip").first().click();
    await expect(page.locator(".hero-chip-detail").first()).toHaveAttribute("open");

    await page.locator(".inline-chip").click();
    await expect(page.locator("#chip-parser")).toHaveAttribute("open");
  });

  test("FAQ entries expand independently", async ({ page }) => {
    await page.goto("/");
    const faqItems = page.locator(".hero-faq-item");
    await faqItems.first().locator("summary").click();
    await faqItems.nth(1).locator("summary").click();

    await expect(faqItems.first()).toHaveAttribute("open");
    await expect(faqItems.nth(1)).toHaveAttribute("open");
  });

  test("FAQ entry can be collapsed", async ({ page }) => {
    await page.goto("/");
    const firstFaq = page.locator(".hero-faq-item").first();
    await firstFaq.locator("summary").click();
    await expect(firstFaq).toHaveAttribute("open");

    await firstFaq.locator("summary").click();
    await expect(firstFaq).not.toHaveAttribute("open");
  });
});
