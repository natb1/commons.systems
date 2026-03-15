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

  test("home page shows Transactions heading @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Transactions");
  });

  test("clicking budgets nav link shows Budgets heading @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toHaveText("Transactions", { timeout: 10000 });
    await page.click('app-nav a[href="/budgets"]');
    await expect(page.locator("main h2")).toHaveText("Budgets");
  });

  test("clicking transactions nav link returns to Transactions heading", async ({ page }) => {
    await page.goto("/budgets");
    await expect(page.locator("main h2")).toHaveText("Budgets");
    await page.click('app-nav a[href="/"]');
    await expect(page.locator("main h2")).toHaveText("Transactions");
  });

  test("direct URL to /budgets loads budgets page", async ({ page }) => {
    await page.goto("/budgets");
    await expect(page.locator("main h2")).toHaveText("Budgets");
  });

  test("unknown path falls back to home page", async ({ page }) => {
    await page.goto("/nonexistent");
    await expect(page.locator("main h2")).toHaveText("Transactions");
  });
});
