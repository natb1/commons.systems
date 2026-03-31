import { test, expect } from "@playwright/test";

test.describe("transactions", () => {
  test("Firestore connectivity @smoke", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("main > h2")).toHaveText("Transactions", { timeout: 30000 });
    await expect(page.locator("#transactions-error")).toHaveCount(0);
  });

  test("unbudgeted toggle present @smoke", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#unbudgeted-toggle")).toBeVisible();
    await expect(page.locator("#sankey-unbudgeted")).not.toBeChecked();
  });

  test("card payment toggle present @smoke", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#card-payment-toggle")).toBeVisible();
    await expect(page.locator("#sankey-card-payment")).not.toBeChecked();
  });

  test("seed transactions visible sorted by date descending", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#transactions-table")).toBeVisible();
    const rows = page.locator("#transactions-table .txn-row");
    await expect(rows).toHaveCount(115);
    await expect(rows.nth(0)).toContainText("Travel Bookshop");
    await expect(rows.nth(1)).toContainText("Electric Company");
    await expect(rows.nth(114)).toContainText("Restaurant");
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

  test("sankey chart renders credits mode with negative amounts", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey svg")).toHaveCount(1, { timeout: 30000 });
    await page.locator('#sankey-controls input[name="sankey-mode"][value="credits"]').check();
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

  test("unbudgeted toggle visible in spending mode", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#unbudgeted-toggle")).toBeVisible();
  });

  test("unbudgeted toggle hidden in credits mode", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator('input[name="sankey-mode"][value="credits"]').check();
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
    await expect(async () => {
      const count = await page.locator("#category-sankey svg .sankey-node").count();
      expect(count).not.toEqual(nodesBefore);
    }).toPass({ timeout: 5000 });
  });

  test("switching to credits hides toggle and resets it", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator("#sankey-unbudgeted").check();
    await expect(page.locator("#sankey-unbudgeted")).toBeChecked();
    await page.locator('input[name="sankey-mode"][value="credits"]').check();
    await expect(page.locator("#unbudgeted-toggle")).toBeHidden();
    await expect(page.locator("#sankey-unbudgeted")).not.toBeChecked();
    await page.locator('input[name="sankey-mode"][value="spending"]').check();
    await expect(page.locator("#unbudgeted-toggle")).toBeVisible();
    await expect(page.locator("#sankey-unbudgeted")).not.toBeChecked();
  });

  test("spending mode hides negative-amount rows in table", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const count = await visibleRows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const netAmount = await visibleRows.nth(i).getAttribute("data-net-amount");
      expect(parseFloat(netAmount ?? "0")).toBeGreaterThan(0);
    }
  });

  test("credits mode shows only negative-amount rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator('input[name="sankey-mode"][value="credits"]').check();
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    await expect(visibleRows.first()).toBeVisible();
    const count = await visibleRows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const netAmount = await visibleRows.nth(i).getAttribute("data-net-amount");
      expect(parseFloat(netAmount ?? "0")).toBeLessThan(0);
    }
  });

  test("card payment toggle visible in spending mode", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#card-payment-toggle")).toBeVisible();
  });

  test("card payment toggle hidden in credits mode", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator('input[name="sankey-mode"][value="credits"]').check();
    await expect(page.locator("#card-payment-toggle")).toBeHidden();
  });

  test("card payment toggle default hides Transfer:CardPayment rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const count = await visibleRows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const category = await visibleRows.nth(i).getAttribute("data-category");
      expect(category).not.toMatch(/^Transfer:CardPayment/);
    }
  });

  test("checking card payment toggle shows Transfer:CardPayment rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator("#sankey-card-payment").check();
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const count = await visibleRows.count();
    let cardPaymentCount = 0;
    for (let i = 0; i < count; i++) {
      const category = await visibleRows.nth(i).getAttribute("data-category");
      if (category?.startsWith("Transfer:CardPayment")) {
        cardPaymentCount++;
      }
    }
    expect(cardPaymentCount).toBeGreaterThan(0);
  });

  test("switching to credits hides and resets card payment toggle", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await page.locator("#sankey-card-payment").check();
    await expect(page.locator("#sankey-card-payment")).toBeChecked();
    await page.locator('input[name="sankey-mode"][value="credits"]').check();
    await expect(page.locator("#card-payment-toggle")).toBeHidden();
    await expect(page.locator("#sankey-card-payment")).not.toBeChecked();
    await page.locator('input[name="sankey-mode"][value="spending"]').check();
    await expect(page.locator("#card-payment-toggle")).toBeVisible();
    await expect(page.locator("#sankey-card-payment")).not.toBeChecked();
  });

  test("category filter input present @smoke", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#sankey-category-filter")).toBeVisible();
  });

  test("category filter input visible on transaction page", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#category-filter-label")).toBeVisible();
    await expect(page.locator("#sankey-category-filter")).toBeVisible();
  });

  test("typing a category in the filter and blurring filters table rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const countBefore = await visibleRows.count();
    expect(countBefore).toBeGreaterThan(0);
    const filterInput = page.locator("#sankey-category-filter");
    await filterInput.fill("Food");
    await filterInput.blur();
    const countAfter = await visibleRows.count();
    expect(countAfter).toBeGreaterThan(0);
    expect(countAfter).toBeLessThan(countBefore);
    for (let i = 0; i < countAfter; i++) {
      const category = await visibleRows.nth(i).getAttribute("data-category");
      expect(category).toMatch(/^Food/);
    }
  });

  test("clearing the filter input and blurring restores all rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const countBefore = await visibleRows.count();
    expect(countBefore).toBeGreaterThan(0);
    const filterInput = page.locator("#sankey-category-filter");
    await filterInput.fill("Food");
    await filterInput.blur();
    const countFiltered = await visibleRows.count();
    expect(countFiltered).toBeLessThan(countBefore);
    await filterInput.fill("");
    await filterInput.blur();
    const countRestored = await visibleRows.count();
    expect(countRestored).toEqual(countBefore);
  });

  test("clicking a Sankey node text label sets the category filter", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const countBefore = await visibleRows.count();
    expect(countBefore).toBeGreaterThan(0);
    const nodeText = page.locator("#category-sankey svg .sankey-node text").first();
    await expect(nodeText).toBeVisible();
    // dispatchEvent directly -- Playwright's click() on SVG <text> elements
    // has unreliable hit-testing.
    await nodeText.dispatchEvent("click");
    const filterInput = page.locator("#sankey-category-filter");
    await expect(filterInput).not.toHaveValue("");
    const filterValue = await filterInput.inputValue();
    const countAfter = await visibleRows.count();
    expect(countAfter).toBeGreaterThan(0);
    expect(countAfter).toBeLessThanOrEqual(countBefore);
    for (let i = 0; i < countAfter; i++) {
      const category = await visibleRows.nth(i).getAttribute("data-category");
      expect(category).toMatch(new RegExp(`^${filterValue}`));
    }
  });

  test("budget filter input present @smoke", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#budget-filter-label")).toBeVisible();
    await expect(page.locator("#sankey-budget-filter")).toBeVisible();
  });

  test("typing a budget name in the filter and blurring filters table rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const countBefore = await visibleRows.count();
    expect(countBefore).toBeGreaterThan(0);
    const filterInput = page.locator("#sankey-budget-filter");
    await filterInput.fill("Food");
    await filterInput.blur();
    const countAfter = await visibleRows.count();
    expect(countAfter).toBeGreaterThan(0);
    expect(countAfter).toBeLessThan(countBefore);
    for (let i = 0; i < countAfter; i++) {
      const budgetName = await visibleRows.nth(i).getAttribute("data-budget-name");
      expect(budgetName).toBe("Food");
    }
  });

  test("clearing the budget filter input and blurring restores all rows", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const countBefore = await visibleRows.count();
    expect(countBefore).toBeGreaterThan(0);
    const filterInput = page.locator("#sankey-budget-filter");
    await filterInput.fill("Food");
    await filterInput.blur();
    const countFiltered = await visibleRows.count();
    expect(countFiltered).toBeLessThan(countBefore);
    await filterInput.fill("");
    await filterInput.blur();
    const countRestored = await visibleRows.count();
    expect(countRestored).toEqual(countBefore);
  });

  test("budget filter composes with category filter", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
    const visibleRows = page.locator('.txn-row:not([style*="display: none"])');
    const categoryFilter = page.locator("#sankey-category-filter");
    await categoryFilter.fill("Food");
    await categoryFilter.blur();
    const countCategoryOnly = await visibleRows.count();
    expect(countCategoryOnly).toBeGreaterThan(0);
    const budgetFilter = page.locator("#sankey-budget-filter");
    await budgetFilter.fill("Food");
    await budgetFilter.blur();
    const countBoth = await visibleRows.count();
    expect(countBoth).toBeGreaterThan(0);
    expect(countBoth).toBeLessThanOrEqual(countCategoryOnly);
    for (let i = 0; i < countBoth; i++) {
      const category = await visibleRows.nth(i).getAttribute("data-category");
      expect(category).toMatch(/^Food/);
      const budgetName = await visibleRows.nth(i).getAttribute("data-budget-name");
      expect(budgetName).toBe("Food");
    }
  });
});
