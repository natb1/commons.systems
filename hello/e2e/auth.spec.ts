import { test, expect } from "@playwright/test";
import { signIn } from "@commons-systems/authutil/e2e/sign-in";

test.describe("auth", () => {
  test("notes page shows auth-required when not signed in", async ({
    page,
  }) => {
    await page.goto("/#/notes");
    await expect(page.locator("#notes-auth-required")).toBeVisible();
    await expect(page.locator("#notes-list")).not.toBeVisible();
  });

  test("nav shows sign-in link when not signed in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#sign-in")).toBeVisible();
    await expect(page.locator("#sign-out")).not.toBeVisible();
  });

  test("nav shows user display and sign-out after sign-in", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator("#sign-out")).toBeVisible();
    await expect(page.locator("#user-display")).toContainText("Test User");
  });

  test("notes page shows notes list after sign-in", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.goto("/#/notes");
    await page.waitForSelector("#notes-list");
    const notes = page.locator("#notes-list li");
    await expect(notes).toHaveCount(2);
    await expect(notes.nth(0)).toHaveText(
      "This note is only visible when signed in.",
    );
    await expect(notes.nth(1)).toHaveText("Auth-gated content works.");
  });

  test("sign-out returns to unauthenticated state", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await page.locator("#sign-out").click();
    await page.waitForSelector("#sign-in");
    // Wait for auth state change to finish re-rendering home page
    // before navigating, to avoid concurrent async navigate() calls
    await expect(page.locator("#messages li")).toHaveCount(2);
    await page.evaluate(() => { window.location.hash = '#/notes'; });
    await expect(page.locator("#notes-auth-required")).toBeVisible();
  });

  test("public messages visible without auth", async ({ page }) => {
    await page.goto("/");
    const messages = page.locator("#messages li");
    await expect(messages).toHaveCount(2);
  });
});
