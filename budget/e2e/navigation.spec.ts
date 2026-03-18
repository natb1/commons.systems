import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test("page loads without JS errors @smoke", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(errors).toHaveLength(0);
  });

  test("no analytics console errors", async ({ page }) => {
    const analyticsErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /analytics|gtag/i.test(msg.text())) {
        analyticsErrors.push(msg.text());
      }
    });
    await page.goto("/");
    await page.waitForLoadState("load");
    expect(analyticsErrors).toHaveLength(0);
  });

  test("HTML shell structure @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header h1")).toHaveText("Budget");
    await expect(page.locator("app-nav")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("home page shows Budgets heading @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Budgets");
  });

  test("clicking transactions nav link shows Transactions heading @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Budgets", { timeout: 10000 });
    await page.click('app-nav a[href="/transactions"]');
    await expect(page.locator("main h2")).toHaveText("Transactions");
  });

  test("clicking budgets nav link returns to Budgets heading", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("main h2")).toHaveText("Transactions");
    await page.click('app-nav a[href="/"]');
    await expect(page.locator("main h2")).toHaveText("Budgets");
  });

  test("direct URL to /transactions loads transactions page", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("main h2")).toHaveText("Transactions");
  });

  test("clicking accounts nav link shows Accounts heading @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Budgets", { timeout: 10000 });
    await page.click('app-nav a[href="/accounts"]');
    await expect(page.locator("main h2")).toHaveText("Accounts");
  });

  test("direct URL to /accounts loads accounts page", async ({ page }) => {
    await page.goto("/accounts");
    await expect(page.locator("main h2")).toHaveText("Accounts");
  });

  test("accounts table visible with seed data rows", async ({ page }) => {
    await page.goto("/accounts");
    const table = page.locator("#accounts-table");
    await expect(table).toBeVisible();
    await expect(table.locator("tbody tr").first()).toBeVisible();
  });

  test("unknown path falls back to home page", async ({ page }) => {
    await page.goto("/nonexistent");
    await expect(page.locator("main h2")).toHaveText("Budgets");
  });
});
