import { test, expect } from "@playwright/test";

test.describe("transactions", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("main h2")).toHaveText("Transactions", { timeout: 30000 });
    await expect(page.locator("#transactions-error")).toHaveCount(0);
  });

  test("unbudgeted toggle present @smoke", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#unbudgeted-toggle")).toBeVisible();
    await expect(page.locator("#sankey-unbudgeted")).not.toBeChecked();
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

  test("sankey chart has node elements", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const nodes = page.locator("#category-sankey svg .sankey-node");
    await expect(nodes.first()).toBeVisible();
    expect(await nodes.count()).toBeGreaterThan(0);
  });

  test("unbudgeted toggle visible in spending mode", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#unbudgeted-toggle")).toBeVisible();
  });

  test("unbudgeted toggle hidden in income mode", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator('input[name="sankey-mode"][value="income"]').check();
    await expect(page.locator("#unbudgeted-toggle")).toBeHidden();
  });

  test("unbudgeted toggle filters table rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const countBefore = await visibleRows.count();
    expect(countBefore).toBeGreaterThan(0);
    await page.locator("#sankey-unbudgeted").check();
    const countAfter = await visibleRows.count();
    expect(countAfter).toBeLessThan(countBefore);
    expect(countAfter).toBeGreaterThan(0);
  });

  test("unbudgeted toggle filters chart", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const nodes = page.locator("#category-sankey svg .sankey-node");
    await expect(nodes.first()).toBeVisible();
    const nodesBefore = await nodes.count();
    await page.locator("#sankey-unbudgeted").check();
    await page.waitForTimeout(500);
    const nodesAfter = await page.locator("#category-sankey svg .sankey-node").count();
    expect(nodesAfter).not.toEqual(nodesBefore);
  });

  test("switching to income hides toggle and resets it", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator("#sankey-unbudgeted").check();
    await expect(page.locator("#sankey-unbudgeted")).toBeChecked();
    await page.locator('input[name="sankey-mode"][value="income"]').check();
    await expect(page.locator("#unbudgeted-toggle")).toBeHidden();
    await expect(page.locator("#sankey-unbudgeted")).not.toBeChecked();
    await page.locator('input[name="sankey-mode"][value="spending"]').check();
    await expect(page.locator("#unbudgeted-toggle")).toBeVisible();
    await expect(page.locator("#sankey-unbudgeted")).not.toBeChecked();
  });

  test("spending mode hides income rows in table", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const count = await visibleRows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const category = await visibleRows.nth(i).getAttribute("data-category");
      expect(category).not.toMatch(/^Income/);
    }
  });

  test("income mode shows only income rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator('input[name="sankey-mode"][value="income"]').check();
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    await expect(visibleRows.first()).toBeVisible();
    const count = await visibleRows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const category = await visibleRows.nth(i).getAttribute("data-category");
      expect(category).toMatch(/^Income/);
    }
  });
});
