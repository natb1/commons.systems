import { test, expect } from "@playwright/test";

test.describe("messages", () => {
  test("Firestore connectivity", async ({ page }) => {
    await page.goto("/");
    // renderHome() is async (awaits Firestore query) and returns heading +
    // messages atomically — heading appearing proves Firestore responded
    await expect(page.locator("main h2")).toHaveText("Home", { timeout: 30000 });
    await expect(page.locator("#messages-error")).toHaveCount(0);
  });

  test("home page displays seeded messages", async ({ page }) => {
    await page.goto("/");
    const messages = page.locator("#messages li");
    await expect(messages).toHaveCount(2);
    await expect(messages.nth(0)).toContainText("Welcome to commons.systems");
    await expect(messages.nth(1)).toContainText("Hello from the prototype");
  });

  test("messages appear in chronological order", async ({ page }) => {
    await page.goto("/");
    const messages = page.locator("#messages li");
    await expect(messages).toHaveCount(2);
    const texts = await messages.allTextContents();
    expect(texts[0]).toContain("Welcome to commons.systems");
    expect(texts[1]).toContain("Hello from the prototype");
  });

  test("messages display timestamps", async ({ page }) => {
    await page.goto("/");
    const timestamps = page.locator("#messages li time");
    await expect(timestamps).toHaveCount(2);
  });

  test("about page does not show messages", async ({ page }) => {
    await page.goto("/#/about");
    await expect(page.locator("main h2")).toHaveText("About");
    await expect(page.locator("#messages")).not.toBeVisible();
  });
});
