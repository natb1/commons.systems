import { test, expect, type Page } from "@commons-systems/config/playwright-test";
import { TRANSACTIONS_APPENDED_EVENT } from "../src/pages/home-chart.js";

// Food offsets are kept ≥ 1 week away from the 12-week initial-window boundary
// so weekStart() day-of-week rounding (up to ~7 days) cannot move a row across
// it and break the seed-derived initial-visible counts asserted by the filter
// tests below.
function buildScrollFixture(): Buffer {
  const now = Date.now();
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

  const FOOD = "Food:Groceries";
  const OTHER_CATEGORIES = ["Shopping", "Transport", "Utilities", "Entertainment"];
  const DESC_BY_CAT: Record<string, string> = {
    "Food:Groceries": "GROCERY STORE",
    "Shopping": "ONLINE SHOP",
    "Transport": "GAS STATION",
    "Utilities": "ELECTRIC CO",
    "Entertainment": "STREAMING SVC",
  };

  const foodOffsets = [1, 5, 9, 14, 18, 22, 25, 28];
  const initialOtherOffsets = [
    0.25, 0.75, 2.5, 3.5, 4.5, 6.5, 7.0, 7.5, 8.5, 9.5, 10.0, 10.5, 11.0,
  ];
  const pastOtherOffsets = [
    13.5, 14.5, 15.0, 15.5, 16.0, 16.5, 17.0, 17.5, 19.0, 19.5,
    20.5, 21.0, 21.5, 23.0, 23.5, 24.5, 26.5, 27.0, 29.0,
  ];

  interface FixtureTxn { offsetWeeks: number; category: string; }
  const all: FixtureTxn[] = [];
  for (const off of foodOffsets) all.push({ offsetWeeks: off, category: FOOD });
  let otherIdx = 0;
  for (const off of [...initialOtherOffsets, ...pastOtherOffsets]) {
    all.push({ offsetWeeks: off, category: OTHER_CATEGORIES[otherIdx % OTHER_CATEGORIES.length] });
    otherIdx++;
  }
  all.sort((a, b) => a.offsetWeeks - b.offsetWeeks);

  const budgets = [
    { id: "budget-food", name: "Groceries", weeklyAllowance: 100, rollover: "none", groupId: null },
    { id: "budget-transport", name: "Transport", weeklyAllowance: 50, rollover: "none", groupId: null },
  ];

  const transactions = all.map((t, i) => {
    const ts = new Date(now - t.offsetWeeks * MS_PER_WEEK);
    const budget = t.category === FOOD ? "budget-food"
      : t.category === "Transport" ? "budget-transport"
      : null;
    return {
      id: `txn-scroll-${String(i).padStart(3, "0")}`,
      institution: "bankone",
      account: "1234",
      description: `${DESC_BY_CAT[t.category]} ${i + 1}`,
      amount: 10 + i * 3.5,
      timestamp: ts.toISOString(),
      statementId: "stmt-1",
      category: t.category,
      budget,
      note: `note ${i + 1}`,
      reimbursement: 0,
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
    };
  });

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

// Total DOM row count grows independent of any active filter — a scroll-loaded
// batch whose rows are all filtered out of view still advances the count.
async function scrollUntilMoreRows(page: Page, baselineDomCount: number): Promise<void> {
  const allRows = page.locator('#transactions-table .txn-row');
  await expect(async () => {
    const sentinel = page.locator("#scroll-sentinel");
    if ((await sentinel.count()) > 0) {
      await sentinel.scrollIntoViewIfNeeded();
    }
    expect(await allRows.count()).toBeGreaterThan(baselineDomCount);
  }).toPass({ timeout: 30000 });
}

// Two-evaluate handshake: the awaited first evaluate guarantees the listener is
// attached in the browser before action() runs, so a fast dispatch cannot beat
// the listener registration. Falls back to a bounded DOM-growth poll if the
// event never fires — the final scroll batch in home-hydrate.ts skips the
// dispatch when the residual query returns no rows.
async function waitForScrollBatch(page: Page, action: () => Promise<void>): Promise<void> {
  const allRows = page.locator('#transactions-table .txn-row');
  const beforeCount = await allRows.count();

  await page.evaluate((eventName) => {
    (window as unknown as { __scrollBatchSignal?: Promise<void> }).__scrollBatchSignal =
      new Promise<void>((resolve) => {
        document.addEventListener(eventName, () => resolve(), { once: true });
      });
  }, TRANSACTIONS_APPENDED_EVENT);

  await action();

  try {
    await Promise.race([
      page.evaluate(
        () => (window as unknown as { __scrollBatchSignal: Promise<void> }).__scrollBatchSignal,
      ),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error(`${TRANSACTIONS_APPENDED_EVENT} event timeout`)), 5000),
      ),
    ]);
  } catch {
    await scrollUntilMoreRows(page, beforeCount);
  }
}

async function waitForFilterSettle(page: Page, expectedVisibleCount: number): Promise<void> {
  const visibleRows = page.locator('#transactions-table .txn-row:not([style*="display: none"])');
  await expect.poll(async () => visibleRows.count(), { timeout: 10000 }).toBe(expectedVisibleCount);
}

/**
 * Poll until every visible row's `dataset[key]` satisfies `predicate`.
 * Scroll-loaded rows are appended as raw HTML and only hidden once the
 * TRANSACTIONS_APPENDED_EVENT re-runs the table filter, so a single read can
 * catch the transient window before the new rows have been filtered.
 */
async function expectVisibleRowsSettle(
  page: Page,
  key: "category" | "budgetName",
  predicate: (value: string | undefined) => boolean,
): Promise<void> {
  const visibleRows = page.locator('#transactions-table .txn-row:not([style*="display: none"])');
  await expect.poll(
    async () => {
      const values = await visibleRows.evaluateAll(
        (rows, k) => rows.map((r) => (r as HTMLElement).dataset[k]),
        key,
      );
      return values.every(predicate);
    },
    { timeout: 10000 },
  ).toBe(true);
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

    const filterCases = [
      {
        name: "category filter applies to scroll-loaded rows",
        inputSelector: "#sankey-category-filter",
        value: "Food:Groceries",
        initialVisibleInWindow: 3,
        datasetKey: "category" as const,
        predicate: (v: string | undefined) => v?.startsWith("Food") ?? false,
      },
      {
        name: "budget filter applies to scroll-loaded rows",
        inputSelector: "#sankey-budget-filter",
        value: "Groceries",
        initialVisibleInWindow: 3,
        datasetKey: "budgetName" as const,
        predicate: (v: string | undefined) => v === "Groceries",
      },
    ];

    for (const c of filterCases) {
      test(c.name, async ({ page }) => {
        const input = page.locator(c.inputSelector);
        await input.fill(c.value);
        await input.blur();
        await waitForFilterSettle(page, c.initialVisibleInWindow);

        const allRows = page.locator('#transactions-table .txn-row');
        const initialDomCount = await allRows.count();

        await waitForScrollBatch(page, () =>
          page.locator("#scroll-sentinel").scrollIntoViewIfNeeded(),
        );

        expect(await allRows.count()).toBeGreaterThan(initialDomCount);

        await expectVisibleRowsSettle(page, c.datasetKey, c.predicate);
      });
    }
  });
});
