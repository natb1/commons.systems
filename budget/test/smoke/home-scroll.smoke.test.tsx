// @vitest-environment happy-dom
//
// Infinite-scroll smoke checks. Ported from the pre-React renderHome string
// renderer to the React <Transactions> surface (Unit 4): the DOM-shape checks
// (scroll sentinel + data-next-before, table data attributes, sankey controls,
// data-budget-name) now render <Transactions options={…}> via RTL and assert the
// rendered container's innerHTML, mirroring home.test.tsx's renderHome helper. The
// serializeChartTransactions checks stay as pure-function unit tests.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { Transaction } from "../../src/firestore";

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

vi.mock("../../src/balance.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/balance")>();
  return { ...actual, computeAllBudgetBalances: vi.fn(() => new Map()) };
});

// The chart island's d3 build is irrelevant to these DOM-shape checks; stub it.
vi.mock("../../src/pages/home-chart.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/pages/home-chart")>();
  return { ...actual, buildCategorySankey: vi.fn(() => () => {}) };
});

import { Transactions } from "../../src/pages/Transactions";

function mockTimestamp(ms: number) {
  return { toDate: () => new Date(ms), toMillis: () => ms } as import("firebase/firestore").Timestamp;
}

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    institution: "Bank",
    account: "Checking",
    description: "Test",
    amount: 50,
    note: "",
    category: "Food",
    reimbursement: 0,
    budget: null,
    timestamp: mockTimestamp(new Date("2025-02-15").getTime()),
    statementId: null,
    groupId: null,
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    virtual: false,
    ...overrides,
  } as Transaction;
}

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: true, groupName: "household", dataSource: createMockDataSource(dsOverrides) };
}

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

// Render <Transactions> and resolve when the async load effect has settled.
async function renderHome(options: Parameters<typeof Transactions>[0]["options"]): Promise<string> {
  const { container } = render(<Transactions options={options} />);
  await waitFor(() => {
    const settled =
      container.querySelector("#transactions-table") ||
      container.querySelector("#transactions-error") ||
      container.querySelector("p");
    if (!settled) throw new Error("not settled");
  });
  return container.innerHTML;
}

describe("home page infinite scroll smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("home page renders with scroll sentinel for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ id: "t1" })]),
    }));
    expect(html).toContain('id="scroll-sentinel"');
  });

  it("sentinel has data-next-before attribute with numeric value", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ id: "t1" })]),
    }));
    const match = html.match(/data-next-before="(\d+)"/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(0);
  });

  it("no console errors on initial load", async () => {
    const consoleSpy = vi.spyOn(console, "error");
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ id: "t1" })]),
    }));
    expect(html).toContain("<h2>Transactions</h2>");
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("transactions table has data-group-name and data-editable attributes", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ id: "t1" })]),
    }));
    expect(html).toContain('id="transactions-table"');
    expect(html).toContain('data-group-name="');
    expect(html).toContain('data-editable="');
  });

  it("budget filter input renders in sankey controls", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ id: "t1" })]),
      getBudgets: vi.fn().mockResolvedValue([
        { id: "groceries", name: "Groceries", allowance: 100, rollover: "none", overrides: [], groupId: null },
      ]),
    }));
    expect(html).toContain('id="sankey-budget-filter"');
  });

  it("data-budget-name attribute present on transaction rows", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ id: "t1", budget: "groceries" })]),
      getBudgets: vi.fn().mockResolvedValue([
        { id: "groceries", name: "Groceries", allowance: 100, rollover: "none", overrides: [], groupId: null },
      ]),
    }));
    expect(html).toContain('data-budget-name="Groceries"');
  });

  it("serializeChartTransactions produces valid SerializedChartTransaction objects", async () => {
    const { serializeChartTransactions } = await import("../../src/pages/home");
    const budgetIdToName = new Map([["b1", "Groceries"]]);
    const result = serializeChartTransactions(
      [txn({ id: "t1", budget: "b1", category: "Food", amount: 50, reimbursement: 0 })],
      budgetIdToName,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      category: "Food",
      amount: 50,
      reimbursement: 0,
      timestampMs: expect.any(Number),
      budgetName: "Groceries",
    });
  });

  it("serializeChartTransactions maps null budget to null budgetName", async () => {
    const { serializeChartTransactions } = await import("../../src/pages/home");
    const result = serializeChartTransactions(
      [txn({ id: "t2", budget: null })],
      new Map(),
    );
    expect(result).toHaveLength(1);
    expect(result[0].budgetName).toBeNull();
  });

  it("serializeChartTransactions degrades an unknown budget id to null budgetName without throwing", async () => {
    // A scroll-loaded transaction may reference a budget added after the
    // hydration-time map was built — the chart degrades it rather than throwing (#578).
    const { serializeChartTransactions } = await import("../../src/pages/home");
    const result = serializeChartTransactions(
      [txn({ id: "t3", budget: "missing-budget" })],
      new Map([["b1", "Groceries"]]),
    );
    expect(result).toHaveLength(1);
    expect(result[0].budgetName).toBeNull();
  });
});
