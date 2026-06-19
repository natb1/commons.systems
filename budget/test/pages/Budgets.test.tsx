// @vitest-environment happy-dom
//
// Markup-parity tests for the React <Budgets> page (Unit 2 of #1876). Ported from
// the pre-React renderBudgets string-renderer suite (budgets.test.ts): every
// assertion that checked a substring of renderBudgets' HTML now renders
// <Budgets options={…}> via RTL and asserts the same class names, data-*
// attributes, and text against the rendered DOM (container.innerHTML).
//
// Two behavioral shifts from the string renderer, both intentional in Unit 2 and
// mirroring the Transactions migration:
//  - renderBudgets' data-loading pipeline now runs in a useEffect, so each test
//    awaits the load to settle (renderBudgetsHtml) before asserting.
//  - The hard-error path renderBudgets rethrew (programmer/data-integrity/range)
//    cannot escape an async effect into a React error boundary, so Budgets renders
//    the classified message inline (loadErrorMessage). The former
//    `rejects.toThrow` tests therefore assert the classified message in
//    #budgets-error instead of a thrown exception.
//
// The bar/pie/area chart island (hydrateBudgetChart) is wired by the page; its d3
// render fns are mocked to no-ops here (à la home.test.tsx's buildCategorySankey
// stub) so this suite stays focused on the table/overrides/metrics markup parity.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import type { DataSource } from "../../src/data-source";
import { createMockDataSource } from "../helpers";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
    static fromMillis(ms: number) { return new Timestamp(new Date(ms)); }
  },
}));

// The three chart render fns hydrateBudgetChart drives are imperative d3; stub them
// to no-ops so the island wires up without needing a real layout (clientWidth is 0
// in happy-dom). ChartResult-returning fns return a no-op teardown.
vi.mock("../../src/pages/budgets-chart.js", () => ({ renderBudgetChart: vi.fn(() => () => {}) }));
vi.mock("../../src/pages/budgets-pie-chart.js", () => ({ renderBudgetPieChart: vi.fn(() => () => {}) }));
vi.mock("../../src/pages/budgets-area-chart.js", () => ({ renderPerBudgetAreaChart: vi.fn(() => () => {}) }));

import { Budgets } from "../../src/pages/Budgets";
import type { Budget } from "../../src/firestore";
import { Timestamp } from "firebase/firestore";

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food" as Budget["id"],
    name: "Food",
    allowance: 150,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
    groupId: null,
    ...overrides,
  };
}

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: true, groupName: "household", dataSource: createMockDataSource(dsOverrides) };
}

// Render <Budgets> and resolve when the async load effect has settled into either
// the loaded surface or the inline error region. Returns the rendered container's
// innerHTML so the ported substring assertions read unchanged.
async function renderBudgetsHtml(options: Parameters<typeof Budgets>[0]["options"]): Promise<string> {
  const { container } = render(<Budgets options={options} />);
  await waitFor(() => {
    const settled =
      container.querySelector("#budgets-table") ||
      container.querySelector("#budgets-error") ||
      container.querySelector("p"); // "No budgets found." / notice
    if (!settled) throw new Error("not settled");
  });
  return container.innerHTML;
}

describe("Budgets (renderBudgets markup parity)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("returns HTML containing a Budgets heading", async () => {
    const html = await renderBudgetsHtml(seedOptions());
    expect(html).toContain("<h2>Budgets</h2>");
  });

  it("shows seed data notice for unauthorized users", async () => {
    const html = await renderBudgetsHtml(seedOptions());
    expect(html).toContain('id="seed-data-notice"');
    expect(html).toContain("Load a data file to see your budgets");
  });

  it("does not show seed data notice for authorized users", async () => {
    const html = await renderBudgetsHtml(localOptions());
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("renders budget table with data", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('id="budgets-table"');
    expect(html).toContain("Food");
    expect(html).toContain("150");
  });

  it("renders error fallback when data source fails", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).toContain("Could not load data");
    expect(html).toContain('id="budgets-error"');
  });

  // renderBudgets rethrew RangeError/DataIntegrityError for the router to map. The
  // async effect can't rethrow into a boundary, so Budgets renders the classified
  // "data error" support message inline (loadErrorMessage).
  it("shows the data-error support message for a RangeError instead of the soft fallback", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new RangeError("out of range")),
    }));
    expect(html).toContain('id="budgets-error"');
    expect(html).toContain("A data error occurred");
    expect(html).not.toContain("Could not load data");
  });

  it("shows the data-error support message for a DataIntegrityError instead of the soft fallback", async () => {
    const { DataIntegrityError } = await import("@commons-systems/firestoreutil/errors");
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new DataIntegrityError("bad data")),
    }));
    expect(html).toContain('id="budgets-error"');
    expect(html).toContain("A data error occurred");
    expect(html).not.toContain("Could not load data");
  });

  it("renders empty state when no budgets", async () => {
    const html = await renderBudgetsHtml(seedOptions());
    expect(html).toContain("No budgets found.");
  });

  it("renders edit controls for authorized users", async () => {
    const html = await renderBudgetsHtml(localOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ groupId: "household" })]),
    }));
    expect(html).toContain('class="edit-name"');
    expect(html).toContain('class="edit-allowance"');
    expect(html).toContain('class="edit-rollover"');
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain('aria-label="Name"');
    expect(html).toContain('aria-label="Allowance"');
    expect(html).toContain('aria-label="Rollover"');
  });

  it("renders disabled inputs for unauthorized users", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('class="edit-name"');
    expect(html).toContain("disabled");
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain("Food");
    expect(html).toContain("150");
    expect(html).toContain("None");
  });

  it("sorts budgets alphabetically by name", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "vacation" as Budget["id"], name: "Vacation", allowance: 100, rollover: "balance" }),
        budget({ id: "food" as Budget["id"], name: "Food", allowance: 150, rollover: "none" }),
      ]),
    }));
    const tableStart = html.indexOf('id="budgets-table"');
    const tableHtml = html.slice(tableStart);
    const foodIdx = tableHtml.indexOf("Food");
    const vacationIdx = tableHtml.indexOf("Vacation");
    expect(foodIdx).toBeLessThan(vacationIdx);
  });

  // The period/rollover selects are uncontrolled with `selected` on the matching
  // <option>. React sets the option's `.selected` PROPERTY (and the select's
  // `.value`) but NOT the `selected` HTML attribute, so parity here is asserted on
  // the DOM property/value, not an innerHTML substring. (Unit 3's hydrateBudgetTable
  // currently reads `option[selected]` — an attribute selector that won't match a
  // React select — so it must switch to reading `.value`; see Budgets.tsx note.)
  it("selects the budget's period option (Quarterly)", async () => {
    const { container } = render(<Budgets options={localOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ allowancePeriod: "quarterly", groupId: "household" })]),
    })} />);
    let periodSelect: HTMLSelectElement | null = null;
    await waitFor(() => {
      periodSelect = container.querySelector<HTMLSelectElement>(".edit-period");
      if (!periodSelect) throw new Error("not settled");
    });
    expect(periodSelect!.value).toBe("quarterly");
    expect(container.innerHTML).toContain("Quarterly");
  });

  it("selects the budget's rollover option (debt)", async () => {
    const { container } = render(<Budgets options={localOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ rollover: "debt", groupId: "household" })]),
    })} />);
    let rolloverSelect: HTMLSelectElement | null = null;
    await waitFor(() => {
      rolloverSelect = container.querySelector<HTMLSelectElement>(".edit-rollover");
      if (!rolloverSelect) throw new Error("not settled");
    });
    expect(rolloverSelect!.value).toBe("debt");
  });

  it("renders rollover labels for unauthorized users", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "a" as Budget["id"], name: "A", rollover: "none" }),
        budget({ id: "b" as Budget["id"], name: "B", rollover: "debt" }),
        budget({ id: "c" as Budget["id"], name: "C", rollover: "balance" }),
      ]),
    }));
    expect(html).toContain("None");
    expect(html).toContain("Debt only");
    expect(html).toContain("Full balance");
  });

  it("shows access denied message for permission-denied error", async () => {
    const error = new Error("permission denied");
    (error as Error & { code?: string }).code = "permission-denied";
    const html = await renderBudgetsHtml(localOptions({
      getBudgets: vi.fn().mockRejectedValue(error),
    }));
    expect(html).toContain("Access denied");
  });

  it("renders chart container with data attributes", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('id="budgets-chart"');
    expect(html).toContain("data-budgets=");
    expect(html).toContain("data-periods=");
  });

  it("renders date picker for chart navigation", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain('id="chart-date-picker"');
    expect(html).toContain('type="date"');
    expect(html).not.toContain('id="chart-window"');
  });

  it("chart data-budgets attribute contains valid JSON", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    const budgetsMatch = html.match(/data-budgets="([^"]*)"/);
    expect(budgetsMatch).not.toBeNull();
    const unescaped = budgetsMatch![1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const budgetsJson = JSON.parse(unescaped);
    expect(budgetsJson).toHaveLength(1);
    expect(budgetsJson[0].name).toBe("Food");
  });

  it("renders metrics section with formatted currency", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "food" as Budget["id"], name: "Food", allowance: 100 }),
        budget({ id: "fun" as Budget["id"], name: "Fun", allowance: 50 }),
      ]),
      getWeeklyAggregates: vi.fn().mockResolvedValue([
        { id: "2026-02-16", weekStart: Timestamp.fromDate(new Date("2026-02-16")), creditTotal: 1200, unbudgetedTotal: 0, groupId: null },
        { id: "2026-02-23", weekStart: Timestamp.fromDate(new Date("2026-02-23")), creditTotal: 0, unbudgetedTotal: 0, groupId: null },
      ]),
    }));
    expect(html).toContain('id="budget-metrics"');
    expect(html).toContain("$100.00");
    expect(html).toContain("$150.00");
  });

  it("renders zero income when no credit aggregates", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "food" as Budget["id"], name: "Food", allowance: 75 }),
      ]),
      getWeeklyAggregates: vi.fn().mockResolvedValue([]),
    }));
    expect(html).toContain("$0.00");
    expect(html).toContain("$75.00");
  });

  it("computes correct total weekly budget sum", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "a" as Budget["id"], name: "A", allowance: 100 }),
        budget({ id: "b" as Budget["id"], name: "B", allowance: 200 }),
        budget({ id: "c" as Budget["id"], name: "C", allowance: 50 }),
      ]),
    }));
    expect(html).toContain("$350.00");
  });

  it("renders 12-Week Avg Weekly Spending metric label", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ id: "food" as Budget["id"], name: "Food", allowance: 100 }),
      ]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        { id: "food-w1", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-06")), periodEnd: Timestamp.fromDate(new Date("2025-01-13")), total: 80, count: 1, categoryBreakdown: {}, groupId: null },
      ]),
    }));
    expect(html).toContain("12-Week Avg Weekly Spending");
  });

  it("metrics section absent on fetch error", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).not.toContain('id="budget-metrics"');
  });

  it("header contains 12w Diff and 52w Diff columns", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).toContain("12w Diff");
    expect(html).toContain("52w Diff");
  });

  it("diff cells show formatted currency in spans not inputs", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        { id: "food-w1", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-06")), periodEnd: Timestamp.fromDate(new Date("2025-01-13")), total: 100, count: 1, categoryBreakdown: {}, groupId: null },
        { id: "food-w2", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-13")), periodEnd: Timestamp.fromDate(new Date("2025-01-20")), total: 50, count: 1, categoryBreakdown: {}, groupId: null },
      ]),
    }));
    expect(html).toContain("$141.67");
    expect(html).not.toMatch(/<input[^>]*\$141\.67/);
  });

  it("surplus diff renders with the favorable class and down arrow", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        { id: "food-w1", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-06")), periodEnd: Timestamp.fromDate(new Date("2025-01-13")), total: 100, count: 1, categoryBreakdown: {}, groupId: null },
      ]),
    }));
    expect(html).toContain('class="variance-favorable"');
    expect(html).toContain('aria-label="favorable"');
    expect(html).toContain("▼");
  });

  it("deficit diff renders with the unfavorable class and up arrow", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        { id: "food-w1", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-06")), periodEnd: Timestamp.fromDate(new Date("2025-01-13")), total: 2400, count: 1, categoryBreakdown: {}, groupId: null },
        { id: "food-w2", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-13")), periodEnd: Timestamp.fromDate(new Date("2025-01-20")), total: 50, count: 1, categoryBreakdown: {}, groupId: null },
      ]),
    }));
    expect(html).toContain('class="variance-unfavorable"');
    expect(html).toContain('aria-label="unfavorable"');
    expect(html).toContain("▲");
  });

  it("renders zero-period budget with data-budget-id and empty variance windows", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([]),
    }));
    expect(html).toContain('class="expand-row budget-row"');
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain('data-window12="[]"');
    expect(html).toContain('data-window52="[]"');
  });

  it("renders each budget row as an expand-row with variance data attributes", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        { id: "food-w1", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-06")), periodEnd: Timestamp.fromDate(new Date("2025-01-13")), total: 100, count: 1, categoryBreakdown: { "Food:Groceries": 100 }, groupId: null },
        { id: "food-w2", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-13")), periodEnd: Timestamp.fromDate(new Date("2025-01-20")), total: 50, count: 1, categoryBreakdown: { "Food:Groceries": 50 }, groupId: null },
      ]),
    }));
    expect(html).toContain('class="budget-variance"');
    expect(html).toContain("data-weekly-allowance=");
    expect(html).toContain("data-window12=");
    expect(html).toContain("data-window52=");
  });

  it("variance data-window12 contains serialized category rows", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ id: "food" as Budget["id"], allowance: 150 })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        { id: "food-w1", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-06")), periodEnd: Timestamp.fromDate(new Date("2025-01-13")), total: 100, count: 1, categoryBreakdown: { "Food:Groceries": 100 }, groupId: null },
        { id: "food-w2", budgetId: "food", periodStart: Timestamp.fromDate(new Date("2025-01-13")), periodEnd: Timestamp.fromDate(new Date("2025-01-20")), total: 0, count: 1, categoryBreakdown: {}, groupId: null },
      ]),
    }));
    const match = html.match(/data-window12="([^"]*)"/);
    expect(match).not.toBeNull();
    const unescaped = match![1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    const parsed = JSON.parse(unescaped);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].category).toBe("Food:Groceries");
    expect(parsed[0].kind).toBe("category");
  });

  it("renders overrides table when budgets have overrides", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ overrides: [{ date: Timestamp.fromDate(new Date("2025-06-15")), balance: 42.5 }] }),
      ]),
    }));
    expect(html).toContain('id="overrides-table"');
    expect(html).toContain("Balance Overrides");
    expect(html).toContain("Food");
    expect(html).toContain("2025-06-15");
    expect(html).toContain("42.5");
  });

  it("renders overrides table empty when budgets exist but have no overrides", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ overrides: [] })]),
    }));
    expect(html).toContain('id="overrides-table"');
    expect(html).not.toContain('class="override-row"');
  });

  it("hides overrides table when no budgets exist", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([]),
    }));
    expect(html).not.toContain('id="overrides-table"');
  });

  it("renders add override button for authorized users", async () => {
    const html = await renderBudgetsHtml(localOptions({
      getBudgets: vi.fn().mockResolvedValue([budget({ groupId: "household" })]),
    }));
    expect(html).toContain('id="add-override"');
  });

  it("does not render add override button for unauthorized users", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([budget()]),
    }));
    expect(html).not.toContain('id="add-override"');
  });

  it("renders delete button for authorized users", async () => {
    const html = await renderBudgetsHtml(localOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ groupId: "household", overrides: [{ date: Timestamp.fromDate(new Date("2025-06-15")), balance: 100 }] }),
      ]),
    }));
    expect(html).toContain('class="delete-override"');
  });

  it("disables override inputs for unauthorized users", async () => {
    const html = await renderBudgetsHtml(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        budget({ overrides: [{ date: Timestamp.fromDate(new Date("2025-06-15")), balance: 100 }] }),
      ]),
    }));
    expect(html).toContain("disabled");
  });
});
