import { test, expect, type Page } from "@playwright/test";

/**
 * Build a fixture JSON buffer with transactions spread over 30 weeks from today.
 * The initial 12-week window captures only the most recent ~16 transactions,
 * leaving ~24 for subsequent scroll batches.
 */
function buildScrollFixture(): Buffer {
  const now = Date.now();
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const TOTAL = 40;
  const categories = ["Food:Groceries", "Shopping", "Transport", "Utilities", "Entertainment"];
  const descriptions = ["GROCERY STORE", "ONLINE SHOP", "GAS STATION", "ELECTRIC CO", "STREAMING SVC"];
  const budgets = [
    { id: "budget-food", name: "Groceries", weeklyAllowance: 100, rollover: "none", groupId: null },
    { id: "budget-transport", name: "Transport", weeklyAllowance: 50, rollover: "none", groupId: null },
  ];
  const transactions = [];
  for (let i = 0; i < TOTAL; i++) {
    // Spread over 30 weeks — roughly one transaction every 5.25 days
    const offsetMs = Math.floor((i / TOTAL) * 30 * MS_PER_WEEK);
    const ts = new Date(now - offsetMs);
    const cat = categories[i % 5];
    const budget = cat === "Food:Groceries" ? "budget-food"
      : cat === "Transport" ? "budget-transport"
      : null;
    transactions.push({
      id: `txn-scroll-${String(i).padStart(3, "0")}`,
      institution: "bankone",
      account: "1234",
      description: `${descriptions[i % 5]} ${i + 1}`,
      amount: 10 + i * 3.5,
      timestamp: ts.toISOString(),
      statementId: "stmt-1",
      category: cat,
      budget,
      note: `note ${i + 1}`,
      reimbursement: 0,
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
    });
  }
  const fixture = {
    version: 1,
    exportedAt: new Date().toISOString(),
    groupId: "scroll-test-group",
    groupName: "Scroll Test",
    transactions,
    budgets,
    budgetPeriods: [],
    rules: [],
    normalizationRules: [],
    statements: [],
  };
  return Buffer.from(JSON.stringify(fixture));
}

async function uploadScrollFixture(page: Page): Promise<void> {
  const fileInput = page.locator(".upload-input");
  await fileInput.setInputFiles({
    name: "scroll-test.json",
    mimeType: "application/json",
    buffer: buildScrollFixture(),
  });
}

async function waitForTable(page: Page): Promise<void> {
  await expect(page.locator("#transactions-table")).toBeVisible({ timeout: 15000 });
}

test.describe("home page infinite scroll", () => {
  test.describe("seed data — all transactions loaded without scroll", () => {
    test("seed data loads all transactions without scroll sentinel", async ({ page }) => {
      await page.goto("/transactions");
      await waitForTable(page);
      await expect(page.locator("#scroll-sentinel")).toHaveCount(0);
    });

    test("sankey chart renders with seed data", async ({ page }) => {
      await page.goto("/transactions");
      await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
      await expect(page.locator("#category-sankey svg")).toHaveCount(1);
    });
  });

  test.describe("IDB data — infinite scroll pagination", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/transactions");
      await expect(page.locator("#seed-data-notice")).toBeVisible({ timeout: 15000 });
      await uploadScrollFixture(page);
      // Wait for upload to process: seed notice disappears and new table renders
      await expect(page.locator("#seed-data-notice")).toHaveCount(0, { timeout: 15000 });
      await waitForTable(page);
    });

    test("initial load shows fewer than all 40 transactions", async ({ page }) => {
      const rows = page.locator("#transactions-table .txn-row");
      const initialCount = await rows.count();
      expect(initialCount).toBeGreaterThan(0);
      expect(initialCount).toBeLessThan(40);
      await expect(page.locator("#scroll-sentinel")).toBeAttached();
    });

    test("scrolling to bottom loads more transactions", async ({ page }) => {
      const rows = page.locator("#transactions-table .txn-row");
      const initialCount = await rows.count();
      expect(initialCount).toBeLessThan(40);

      // Scroll sentinel into view to trigger IntersectionObserver
      await page.locator("#scroll-sentinel").scrollIntoViewIfNeeded();

      // Wait for new rows to appear
      await expect(async () => {
        const count = await rows.count();
        expect(count).toBeGreaterThan(initialCount);
      }).toPass({ timeout: 10000 });
    });

    test("all transactions reachable by repeated scrolling", async ({ page }) => {
      const rows = page.locator("#transactions-table .txn-row");

      // Scroll until sentinel is removed (all data loaded)
      await expect(async () => {
        const sentinel = page.locator("#scroll-sentinel");
        const isAttached = await sentinel.count() > 0;
        if (isAttached) {
          await sentinel.scrollIntoViewIfNeeded();
        }
        expect(isAttached).toBe(false);
      }).toPass({ timeout: 30000 });

      // All 40 transactions should now be rendered
      await expect(rows).toHaveCount(40);
    });

    test("editing a note on an appended row persists", async ({ page }) => {
      const rows = page.locator("#transactions-table .txn-row");
      const initialCount = await rows.count();

      // Scroll to load more
      await page.locator("#scroll-sentinel").scrollIntoViewIfNeeded();
      await expect(async () => {
        const count = await rows.count();
        expect(count).toBeGreaterThan(initialCount);
      }).toPass({ timeout: 10000 });

      // Find a row that was appended (beyond initial count).
      // The note input is in the always-visible summary, no expand needed.
      const appendedRow = rows.nth(initialCount);
      const noteInput = appendedRow.locator(".edit-note");
      await expect(noteInput).toBeVisible();
      await noteInput.fill("scroll-edited");
      await noteInput.blur();

      // Wait for IDB save (defaultValue updates after successful write)
      await expect.poll(
        async () => noteInput.evaluate((el: HTMLInputElement) => el.defaultValue),
        { timeout: 5000 },
      ).toBe("scroll-edited");
    });

    test("sankey chart renders with initial load", async ({ page }) => {
      await expect(page.locator("#category-sankey")).toBeVisible({ timeout: 30000 });
      await expect(page.locator("#category-sankey svg")).toHaveCount(1);
    });

    test("category filter applies to scroll-loaded rows", async ({ page }) => {
      // Set category filter to "Food:Groceries"
      const categoryInput = page.locator("#sankey-category-filter");
      await categoryInput.fill("Food:Groceries");
      await categoryInput.blur();

      // Verify initial rows are filtered
      const visibleRows = page.locator("#transactions-table .txn-row:visible");
      const hiddenRows = page.locator('#transactions-table .txn-row[style*="display: none"]');
      const initialVisible = await visibleRows.count();
      expect(initialVisible).toBeGreaterThan(0);

      // Scroll to load more
      await page.locator("#scroll-sentinel").scrollIntoViewIfNeeded();
      await expect(async () => {
        const totalRows = await page.locator("#transactions-table .txn-row").count();
        expect(totalRows).toBeGreaterThan(initialVisible + await hiddenRows.count());
      }).toPass({ timeout: 10000 });

      // Verify ALL visible rows match the category filter
      const allVisible = page.locator('#transactions-table .txn-row:not([style*="display: none"])');
      const categories = await allVisible.evaluateAll(rows =>
        rows.map(r => (r as HTMLElement).dataset.category)
      );
      for (const cat of categories) {
        expect(cat).toMatch(/^Food/);
      }
    });

    test("budget filter applies to scroll-loaded rows", async ({ page }) => {
      // Set budget filter to "Groceries"
      const budgetInput = page.locator("#sankey-budget-filter");
      await budgetInput.fill("Groceries");
      await budgetInput.blur();

      // Verify initial rows are filtered
      const allVisible = page.locator('#transactions-table .txn-row:not([style*="display: none"])');
      const initialVisible = await allVisible.count();
      expect(initialVisible).toBeGreaterThan(0);

      // Scroll to load more
      await page.locator("#scroll-sentinel").scrollIntoViewIfNeeded();
      const hiddenRows = page.locator('#transactions-table .txn-row[style*="display: none"]');
      await expect(async () => {
        const totalRows = await page.locator("#transactions-table .txn-row").count();
        expect(totalRows).toBeGreaterThan(initialVisible + await hiddenRows.count());
      }).toPass({ timeout: 10000 });

      // Verify ALL visible rows match the budget filter
      const budgets = await allVisible.evaluateAll(rows =>
        rows.map(r => (r as HTMLElement).dataset.budgetName)
      );
      for (const b of budgets) {
        expect(b).toBe("Groceries");
      }
    });
  });
});
