import { test, expect } from "@playwright/test";

test.describe("transactions", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("main h2")).toHaveText("Transactions", { timeout: 30000 });
    await expect(page.locator("#transactions-error")).toHaveCount(0);
  });

  test("seed transactions visible sorted by date descending", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const rows = page.locator("#transactions-table .txn-row");
    await expect(rows).toHaveCount(109);
    await expect(rows.nth(0)).toContainText("Travel Bookshop");
    await expect(rows.nth(1)).toContainText("Electric Company");
    await expect(rows.nth(108)).toContainText("Restaurant");
  });

  test("seed transactions are read-only", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const inputs = page.locator("#transactions-table .txn-summary-content input");
    await expect(inputs).toHaveCount(0);
  });

  test("expanded row shows date and statement link", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const firstRow = page.locator("#transactions-table .txn-row").first();
    await firstRow.locator("summary").click();
    const details = firstRow.locator(".txn-details");
    await expect(details).toBeVisible();
    await expect(details.locator("dt", { hasText: "Date" })).toBeVisible();
    await expect(details.locator("dt", { hasText: "Statement" })).toBeVisible();
    await expect(details.locator("a", { hasText: "statement" })).toBeVisible();
  });

  test("expanded row shows budget balance for budgeted transaction", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#transactions-table")).toBeVisible();
    // Coffee Shop is a budgeted transaction in the food budget with a matching period
    const coffeeRow = page.locator("#transactions-table .txn-row", { hasText: "Coffee Shop" });
    await coffeeRow.locator("summary").click();
    const details = coffeeRow.locator(".txn-details");
    await expect(details).toBeVisible();
    await expect(details.locator("dt", { hasText: "Budget Balance" })).toBeVisible();
    const balanceDd = details.locator("dt:has-text('Budget Balance') + dd");
    const balanceText = await balanceDd.textContent();
    expect(balanceText).toBeTruthy();
    expect(Number(balanceText)).not.toBeNaN();
  });

  test("sankey chart renders SVG", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#category-sankey svg")).toHaveCount(1);
  });

  test("sankey controls present", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#sankey-weeks")).toBeVisible();
    await expect(page.locator("#sankey-end-week")).toBeVisible();
  });

  test("sankey chart renders income mode with negative amounts", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey svg")).toHaveCount(1, { timeout: 30000 });
    await page.locator('#sankey-controls input[name="sankey-mode"][value="income"]').check();
    await expect(page.locator("#category-sankey svg")).toHaveCount(1);
    await expect(page.locator("#category-sankey svg .sankey-node")).not.toHaveCount(0);
  });

  test("sankey chart has node elements", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const nodes = page.locator("#category-sankey svg .sankey-node");
    await expect(nodes.first()).toBeVisible();
    expect(await nodes.count()).toBeGreaterThan(0);
  });
});
