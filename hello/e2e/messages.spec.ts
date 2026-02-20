import { test, expect } from "@playwright/test";

test.describe("messages", () => {
  test("home page displays seeded messages", async ({ page }) => {
    await page.goto("/");
    const messages = page.locator("#messages li");
    await expect(messages).toHaveCount(2);
    await expect(messages.nth(0)).toHaveText("Welcome to commons.systems");
    await expect(messages.nth(1)).toHaveText("Hello from the prototype");
  });

  test("messages appear in chronological order", async ({ page }) => {
    await page.goto("/");
    const messages = page.locator("#messages li");
    await expect(messages).toHaveCount(2);
    const texts = await messages.allTextContents();
    expect(texts).toEqual([
      "Welcome to commons.systems",
      "Hello from the prototype",
    ]);
  });

  test("about page does not show messages", async ({ page }) => {
    await page.goto("/#/about");
    await expect(page.locator("main h2")).toHaveText("About");
    await expect(page.locator("#messages")).not.toBeVisible();
  });
});
