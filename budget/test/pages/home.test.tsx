// @vitest-environment happy-dom
//
// Markup-parity tests for the React <Transactions> page (Unit 3). Ported from the
// pre-React renderHome string-renderer suite: every assertion that checked a
// substring of renderHome's HTML now renders <Transactions options={…}> via RTL
// and asserts the same class names, data-* attributes, and text against the
// rendered DOM (container.innerHTML). Unit 3 already produces this markup, so this
// whole suite is GREEN — it is the markup parity lock for Unit 4's table refactor.
//
// Altitude: assert OBSERVABLE DOM (innerHTML substrings + parsed JSON islands),
// never React internals. The data source is the mocked DataSource passed via
// options (createMockDataSource), exactly as renderHome received it.
//
// Two behavioral shifts from the string renderer, both intentional in Unit 3:
//  - renderHome's data-loading pipeline now runs in a useEffect, so each test
//    awaits the load to settle (waitForLoad) before asserting.
//  - The hard-error path that renderHome rethrew (programmer/data-integrity/range)
//    cannot escape an async effect into a React error boundary, so Transactions
//    reproduces it as inline error STATE (loadErrorMessage). The former
//    `rejects.toThrow` tests therefore assert the classified error message in
//    #transactions-error instead of a thrown exception.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Component, type ReactNode } from "react";
import { render, cleanup, waitFor } from "@testing-library/react";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
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

vi.mock("../../src/balance.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/balance")>();
  return {
    ...actual,
    computeAllBudgetBalances: vi.fn(),
    computeNetAmount: (amount: number, reimbursement: number) => amount * (1 - reimbursement / 100),
  };
});

// The chart island builds an SVG imperatively in an effect; its core is covered
// by home-chart.test.ts. Here we only assert the controls/container markup, so
// stub buildCategorySankey to a no-op teardown to keep this suite focused on the
// table/markup and free of d3 rendering noise.
vi.mock("../../src/pages/home-chart.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/pages/home-chart")>();
  return { ...actual, buildCategorySankey: vi.fn(() => () => {}) };
});

import { Transactions } from "../../src/pages/Transactions";
import { renderTransactionRows } from "../../src/pages/home";
import type { Transaction, BudgetPeriod } from "../../src/firestore";
import { computeAllBudgetBalances } from "../../src/balance";

const mockComputeAllBalances = vi.mocked(computeAllBudgetBalances);

function mockTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  return { toDate: () => d, toMillis: () => d.getTime() } as import("firebase/firestore").Timestamp;
}

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    institution: "Bank A",
    account: "Checking",
    description: "Grocery store",
    amount: 52.30,
    note: "",
    category: "Food:Groceries",
    reimbursement: 0,
    budget: null,
    timestamp: mockTimestamp("2025-01-15"),
    statementId: null,
    groupId: null,
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    virtual: false,
    ...overrides,
  } as Transaction;
}

const defaultBudgets = [
  { id: "food", name: "Food", allowance: 150, rollover: "none" as const, overrides: [], groupId: null },
  { id: "vacation", name: "Vacation", allowance: 100, rollover: "balance" as const, overrides: [], groupId: null },
];

const defaultPeriods: BudgetPeriod[] = [
  {
    id: "food-2025-01-13",
    budgetId: "food",
    periodStart: mockTimestamp("2025-01-13"),
    periodEnd: mockTimestamp("2025-01-20"),
    total: 5.75,
    count: 0,
    categoryBreakdown: {},
    groupId: null,
  } as unknown as BudgetPeriod,
];

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource({
    getBudgets: vi.fn().mockResolvedValue(defaultBudgets),
    getBudgetPeriods: vi.fn().mockResolvedValue(defaultPeriods),
    ...dsOverrides,
  }) };
}

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: true, groupName: "household", dataSource: createMockDataSource({
    getBudgets: vi.fn().mockResolvedValue(defaultBudgets),
    getBudgetPeriods: vi.fn().mockResolvedValue(defaultPeriods),
    ...dsOverrides,
  }) };
}

// Render <Transactions> and resolve when the async load effect has settled into
// either the loaded table/chart or the inline error region. Returns the rendered
// container's innerHTML so the ported substring assertions read unchanged.
async function renderHome(options: Parameters<typeof Transactions>[0]["options"]): Promise<string> {
  const { container } = render(<Transactions options={options} />);
  await waitFor(() => {
    const settled =
      container.querySelector("#transactions-table") ||
      container.querySelector("#transactions-error") ||
      container.querySelector("p"); // "No transactions found." / chart-error
    if (!settled) throw new Error("not settled");
  });
  return container.innerHTML;
}

// A test-only boundary so a SYNCHRONOUS render-throw from TransactionTable
// (unknown budget id / duplicate name, which fire after the load effect settles)
// is caught instead of escaping as an uncaught exception that would fail the whole
// file. It records the caught error so we can assert the contract: a correct
// implementation should NEVER bubble a render-throw to this boundary — it should
// surface a #transactions-error region itself.
class CatchBoundary extends Component<{ children: ReactNode; onError: (e: unknown) => void }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(error: unknown) { this.props.onError(error); }
  render() { return this.state.crashed ? null : this.props.children; }
}

// Render <Transactions> under the catch boundary and report whether the render
// threw (boundary caught it) plus the rendered HTML. Used by the two parity-gap
// tests where Unit 3 currently crashes rather than surfacing a data-error region.
async function renderHomeOrThrow(
  options: Parameters<typeof Transactions>[0]["options"],
): Promise<{ html: string; threw: boolean }> {
  let caught: unknown = undefined;
  const { container } = render(
    <CatchBoundary onError={(e) => { caught = e; }}>
      <Transactions options={options} />
    </CatchBoundary>,
  );
  await waitFor(() => {
    const settled =
      caught !== undefined ||
      container.querySelector("#transactions-table") ||
      container.querySelector("#transactions-error") ||
      container.querySelector("p");
    if (!settled) throw new Error("not settled");
  });
  return { html: container.innerHTML, threw: caught !== undefined };
}

describe("Transactions (renderHome markup parity)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComputeAllBalances.mockReturnValue(new Map());
  });

  afterEach(() => {
    cleanup();
  });

  it("returns HTML containing a Transactions heading", async () => {
    const html = await renderHome(seedOptions());
    expect(html).toContain("<h2>Transactions</h2>");
  });

  it("shows seed data notice for unauthorized users", async () => {
    const html = await renderHome(seedOptions());
    expect(html).toContain('id="seed-data-notice"');
  });

  it("does not show seed data notice for authorized users", async () => {
    const html = await renderHome(localOptions());
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("renders transaction list with data", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ note: "weekly groceries", statementId: "stmt-2025-01" }),
      ]),
    }));
    expect(html).toContain('id="transactions-table"');
    expect(html).toContain("Grocery store");
    expect(html).toContain("52.30");
    // JSX renders the category " > " separator as a literal " &gt; " in serialized
    // HTML (React escapes the > of the text node), matching the legacy entity.
    expect(html).toContain("Food &gt; Groceries");
  });

  it("renders error fallback when data source fails", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).toContain("Could not load data");
    expect(html).toContain('id="transactions-error"');
  });

  // renderHome rethrew RangeError/DataIntegrityError for the router to map. The
  // async effect can't rethrow into a boundary, so Transactions renders the
  // classified message inline (loadErrorMessage maps range + data-integrity to the
  // "data error" support message). These assert that observable error state.
  it("shows the data-error support message for a RangeError instead of the soft fallback", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new RangeError("reimbursement must be between 0 and 100")),
    }));
    expect(html).toContain('id="transactions-error"');
    expect(html).toContain("A data error occurred");
    expect(html).not.toContain("Could not load data");
  });

  it("shows the data-error support message for a DataIntegrityError instead of the soft fallback", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new DataIntegrityError("Expected string for description, got undefined")),
    }));
    expect(html).toContain('id="transactions-error"');
    expect(html).toContain("A data error occurred");
    expect(html).not.toContain("Could not load data");
  });

  it("renders empty state when no transactions", async () => {
    const html = await renderHome(seedOptions());
    expect(html).toContain("No transactions found.");
  });

  it("renders inline edit inputs for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ note: "weekly groceries", budget: "food", statementId: "stmt-2025-01", groupId: "household" }),
      ]),
    }));
    expect(html).toContain('class="edit-note"');
    expect(html).toContain('class="edit-category"');
    expect(html).toContain('class="edit-reimbursement"');
    expect(html).toContain('class="edit-budget"');
    expect(html).toContain('data-txn-id="txn-1"');
    expect(html).toContain('aria-label="Note"');
    expect(html).toContain('aria-label="Category"');
    expect(html).toContain('aria-label="Reimbursement"');
    expect(html).toContain('aria-label="Budget"');
  });

  it("renders read-only cells for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ note: "weekly groceries" }),
      ]),
    }));
    expect(html).not.toContain('class="edit-note"');
    expect(html).not.toContain('class="edit-category"');
    expect(html).toContain("weekly groceries");
  });

  it("renders accordion rows with details/summary elements", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", statementId: "stmt-2025-01" }),
      ]),
    }));
    expect(html).toContain('class="expand-row txn-row"');
    expect(html).toContain('class="txn-summary"');
    expect(html).toContain('class="expand-summary txn-summary-content"');
    expect(html).toContain('class="expand-details txn-details"');
    expect(html).toContain("Bank A");
    expect(html).toContain("Checking");
  });

  it("renders date and statement link in expanded details", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", statementId: "stmt-2025-01" }),
      ]),
    }));
    expect(html).toContain("<dt>Date</dt>");
    expect(html).toContain("<dt>Statement</dt>");
    expect(html).toContain('class="statement-source-link"');
    expect(html).toContain('data-statement-id="stmt-2025-01"');
    expect(html).toContain("view source");
  });

  it("renders empty statement dd when statementId is null", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ timestamp: null }),
      ]),
    }));
    expect(html).toContain("<dt>Statement</dt><dd></dd>");
  });

  it("renders budget options as data attribute for authorized users", async () => {
    const html = await renderHome(localOptions({
      getBudgets: vi.fn().mockResolvedValue([
        { id: "food", name: "Food", allowance: 150, rollover: "none", overrides: [], groupId: "household" },
        { id: "vacation", name: "Vacation", allowance: 100, rollover: "balance", overrides: [], groupId: "household" },
      ]),
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food", budget: "food", groupId: "household" }),
        txn({
          id: "txn-2", institution: "Bank B", account: "Savings",
          description: "Hotel", amount: 215, category: "Travel",
          budget: "vacation", timestamp: mockTimestamp("2025-02-01"), groupId: "household",
        }),
      ]),
    }));
    expect(html).toContain("data-budget-options");
    expect(html).toContain("Food");
    expect(html).toContain("Vacation");
  });

  it("does not render autocomplete options on transactions table for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food", budget: "food" }),
      ]),
    }));
    // data-budget-options and data-category-options appear on sankey-controls for all users,
    // but must not appear on the transactions table for unauthorized users
    const tableMatch = html.match(/<div id="transactions-table"([^>]*)>/);
    expect(tableMatch).not.toBeNull();
    expect(tableMatch![1]).not.toContain("data-budget-options");
    expect(tableMatch![1]).not.toContain("data-category-options");
  });

  it("renders category options as data attribute for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", groupId: "household" }),
        txn({
          id: "txn-2", institution: "Bank B", account: "Savings",
          description: "Hotel", amount: 215, category: "Travel:Lodging",
          budget: "vacation", timestamp: mockTimestamp("2025-02-01"), groupId: "household",
        }),
      ]),
    }));
    expect(html).toContain("data-category-options");
    expect(html).toContain("Food:Groceries");
    expect(html).toContain("Travel:Lodging");
  });

  it("renders group name in expanded details", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food", budget: "food", groupId: "household" }),
      ]),
    }));
    expect(html).toContain("<dt>Group</dt>");
    expect(html).toContain("<dd>household</dd>");
  });

  // PARITY GAP (Unit 3, real-bug — NOT Unit-4-pending): legacy renderHome threw
  // DataIntegrityError for an unknown budget id / duplicate budget name and the
  // legacy router (LegacyRoute/formatRouteError) mapped it to a user-facing data-
  // error region. Unit 3 reproduced the ASYNC-load error path inline
  // (loadErrorMessage) but the unknown-id throw (resolveBudgetNameStrict in
  // TxnRow) and the duplicate-name throw both fire SYNCHRONOUSLY during
  // TransactionTable's JSX render — after the load effect succeeds. The budget app
  // has NO React error boundary, so these escape uncaught and crash the tree
  // instead of surfacing a #transactions-error region. The contract below is what
  // Unit 4 (or an App error boundary) must satisfy. renderHomeOrThrow captures the
  // sync render throw so the failure is a clean assertion, not an uncaught error.
  it("surfaces a data-error region (does not crash) when a transaction references an unknown budget ID", async () => {
    const result = await renderHomeOrThrow(seedOptions({
      getBudgets: vi.fn().mockResolvedValue([
        { id: "food", name: "Food", allowance: 150, rollover: "none", overrides: [], groupId: null },
      ]),
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "nonexistent-budget" }),
      ]),
    }));
    expect(result.threw, "render threw uncaught instead of surfacing a data-error region (Unit 3 parity gap: no error boundary)").toBe(false);
    expect(result.html).toContain('id="transactions-error"');
    expect(result.html).toContain("A data error occurred");
  });

  it("surfaces a data-error region (does not crash) for duplicate budget names", async () => {
    const result = await renderHomeOrThrow(localOptions({
      getBudgets: vi.fn().mockResolvedValue([
        { id: "food-1", name: "Food", allowance: 150, rollover: "none", overrides: [], groupId: "household" },
        { id: "food-2", name: "Food", allowance: 200, rollover: "none", overrides: [], groupId: "household" },
      ]),
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(result.threw, "render threw uncaught instead of surfacing a data-error region (Unit 3 parity gap: no error boundary)").toBe(false);
    expect(result.html).toContain('id="transactions-error"');
    expect(result.html).toContain("A data error occurred");
  });

  it("renders budget name-to-ID map as data attribute for authorized users", async () => {
    const html = await renderHome(localOptions({
      getBudgets: vi.fn().mockResolvedValue([
        { id: "budget-food", name: "Food", allowance: 150, rollover: "none", overrides: [], groupId: "household" },
      ]),
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "budget-food", groupId: "household" }),
      ]),
    }));
    expect(html).toContain("data-budget-map");
    expect(html).toContain("budget-food");
  });

  it("shows access denied message for permission-denied error", async () => {
    const error = new Error("permission denied");
    (error as Error & { code?: string }).code = "permission-denied";
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockRejectedValue(error),
    }));
    expect(html).toContain("Access denied");
  });

  it("sorts transactions by timestamp descending with nulls last", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({
          description: "Older", amount: 10, category: "A",
          timestamp: mockTimestamp("2025-01-01"),
        }),
        txn({
          id: "txn-2", institution: "Bank B", account: "Savings",
          description: "Newer", amount: 20, category: "B",
          timestamp: mockTimestamp("2025-02-01"),
        }),
        txn({
          id: "txn-3", institution: "Bank C", account: "Credit",
          description: "No date", amount: 30, category: "C", timestamp: null,
        }),
      ]),
    }));
    const newerIdx = html.indexOf("Newer");
    const olderIdx = html.indexOf("Older");
    const noDateIdx = html.indexOf("No date");
    expect(newerIdx).toBeLessThan(olderIdx);
    expect(olderIdx).toBeLessThan(noDateIdx);
  });

  it("renders Budget Balance dt/dd in expanded details", async () => {
    mockComputeAllBalances.mockReturnValue(new Map([["txn-1", 144.25]]));
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).toContain("<dt>Budget Balance</dt>");
    expect(html).toContain('<dd class="budget-balance">144.25</dd>');
  });

  it("omits budget balance row when computeBudgetBalance returns null", async () => {
    mockComputeAllBalances.mockReturnValue(new Map());
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).not.toContain("<dt>Budget Balance</dt>");
  });

  it("omits budget balance row when transaction has no budget", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: null }),
      ]),
    }));
    expect(html).not.toContain("<dt>Budget Balance</dt>");
    expect(mockComputeAllBalances).toHaveBeenCalled();
  });

  it("renders data-amount, data-budget-id, data-timestamp, data-reimbursement on rows for authorized users", async () => {
    const ts = mockTimestamp("2025-01-15");
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", timestamp: ts, amount: 52.30, reimbursement: 25, groupId: "household" }),
      ]),
    }));
    expect(html).toContain('data-amount="52.3"');
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain(`data-timestamp="${ts.toMillis()}"`);
    expect(html).toContain('data-reimbursement="25"');
  });

  it("does not render data-amount, data-budget-id, data-timestamp, data-reimbursement for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).not.toContain("data-amount");
    expect(html).not.toContain("data-budget-id");
    expect(html).not.toContain("data-timestamp");
    expect(html).not.toContain("data-reimbursement");
  });

  it("renders data-budget-periods on container for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food", groupId: "household" }),
      ]),
    }));
    expect(html).toContain("data-budget-periods");
    expect(html).toContain("food-2025-01-13");
  });

  it("does not render data-budget-periods for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).not.toContain("data-budget-periods");
  });

  it("renders #category-sankey container and sankey controls", async () => {
    // The chart is a React island now; the legacy inline <script id="sankey-data">
    // JSON blob is gone (chart data flows as a prop). Assert the island's container
    // and controls render.
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food:Groceries", amount: 52.30, reimbursement: 0 }),
      ]),
    }));
    expect(html).toContain('id="category-sankey"');
    expect(html).toContain('id="sankey-controls"');
  });

  it("renders sankey controls above chart container", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(html).toContain('id="sankey-controls"');
    expect(html).toContain('id="sankey-weeks"');
    expect(html).toContain('id="sankey-end-week"');
    expect(html).toContain('id="sankey-end-label"');
    expect(html.indexOf('id="sankey-controls"')).toBeLessThan(html.indexOf('id="category-sankey"'));
  });

  it("renders data-category on rows for unauthorized users", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food:Groceries" }),
      ]),
    }));
    expect(html).toContain('data-category="Food:Groceries"');
  });

  it("renders data-category on rows for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ category: "Food:Groceries", budget: "food", groupId: "household" }),
      ]),
    }));
    expect(html).toContain('data-category="Food:Groceries"');
  });

  it("renders unbudgeted toggle in sankey controls", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(html).toContain('id="unbudgeted-toggle"');
    expect(html).toContain('id="sankey-unbudgeted"');
  });

  it("renders category filter input in sankey controls", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(html).toContain('id="sankey-category-filter"');
    expect(html).toContain('id="category-filter-label"');
  });

  it("renders budget filter input in sankey controls", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(html).toContain('id="sankey-budget-filter"');
    expect(html).toContain('id="budget-filter-label"');
  });

  it("renders data-budget-name on rows for budgeted transactions", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: "food" }),
      ]),
    }));
    expect(html).toContain('data-budget-name="Food"');
  });

  it("renders empty data-budget-name on rows for unbudgeted transactions", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ budget: null }),
      ]),
    }));
    expect(html).toContain('data-budget-name=""');
  });

  it("calls getTransactions with a since query param for authorized users", async () => {
    const mockGetTxns = vi.fn().mockResolvedValue([txn()]);
    await renderHome(localOptions({ getTransactions: mockGetTxns }));
    expect(mockGetTxns).toHaveBeenCalledWith(
      expect.objectContaining({ since: expect.anything() }),
    );
  });

  it("calls getTransactions without since for seed data", async () => {
    const mockGetTxns = vi.fn().mockResolvedValue([txn()]);
    await renderHome(seedOptions({ getTransactions: mockGetTxns }));
    expect(mockGetTxns).toHaveBeenCalledWith({});
  });

  it("renders scroll sentinel with data-next-before attribute for authorized users", async () => {
    const html = await renderHome(localOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(html).toContain('id="scroll-sentinel"');
    expect(html).toMatch(/data-next-before="\d+"/);
  });

  it("does not render scroll sentinel for seed data", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(html).not.toContain('id="scroll-sentinel"');
  });

  it("renders data-group-name and data-editable on transactions table", async () => {
    const html = await renderHome(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
    }));
    expect(html).toMatch(/id="transactions-table"[^>]*data-group-name="/);
    expect(html).toMatch(/id="transactions-table"[^>]*data-editable="/);
  });

  describe("normalized transaction groups", () => {
    it("renders normalized group as single row", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({
            id: "txn-a",
            description: "Store A",
            amount: 50,
            normalizedId: "norm-1",
            normalizedPrimary: true,
            timestamp: mockTimestamp("2025-01-15"),
          }),
          txn({
            id: "txn-b",
            description: "Store B",
            amount: 30,
            normalizedId: "norm-1",
            normalizedPrimary: false,
            timestamp: mockTimestamp("2025-01-14"),
          }),
        ]),
      }));
      expect(html).toContain('class="expand-row txn-row normalized-group"');
      const summaryMatches = html.match(/class="txn-summary"/g);
      expect(summaryMatches).toHaveLength(1);
    });

    it("renders originals section with all member descriptions", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({
            id: "txn-a",
            description: "Store Alpha",
            amount: 50,
            normalizedId: "norm-1",
            normalizedPrimary: true,
            timestamp: mockTimestamp("2025-01-15"),
          }),
          txn({
            id: "txn-b",
            description: "Store Beta",
            amount: 30,
            normalizedId: "norm-1",
            normalizedPrimary: false,
            timestamp: mockTimestamp("2025-01-14"),
          }),
        ]),
      }));
      expect(html).toContain('class="normalized-originals"');
      expect(html).toContain("Original Transactions");
      expect(html).toContain("Store Alpha");
      expect(html).toContain("Store Beta");
    });

    it("uses normalizedDescription in summary", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({
            id: "txn-a",
            description: "Raw Desc",
            amount: 50,
            normalizedId: "norm-1",
            normalizedPrimary: true,
            normalizedDescription: "Canonical Desc",
            timestamp: mockTimestamp("2025-01-15"),
          }),
        ]),
      }));
      expect(html).toContain("Canonical Desc");
      const summaryStart = html.indexOf('class="expand-summary txn-summary-content"');
      const summaryEnd = html.indexOf("</summary>");
      const summarySlice = html.slice(summaryStart, summaryEnd);
      expect(summarySlice).toContain("Canonical Desc");
      expect(summarySlice).not.toContain("Raw Desc");
    });

    it("renders ungrouped transaction without normalized-group class", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({
            id: "txn-plain",
            description: "Plain purchase",
            normalizedId: null,
            normalizedPrimary: true,
          }),
        ]),
      }));
      expect(html).toContain('class="expand-row txn-row"');
      expect(html).not.toContain("normalized-group");
    });

    it("renders the table (no data error) when a batch contains only a non-primary member", async () => {
      // #1266: an orphan non-primary member (its primary fell into a different
      // scroll batch) is suppressed rather than throwing a data-integrity error
      // that kills the table.
      const html = await renderHome(localOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({ id: "txn-b", description: "Store B", amount: 50, normalizedId: "norm-1", normalizedPrimary: false, timestamp: mockTimestamp("2025-01-04") }),
        ]),
      }));
      expect(html).toContain('id="transactions-table"');
      expect(html).not.toContain("transactions-error");
    });
  });

  describe("virtual transaction badges", () => {
    it("renders virtual badge and virtual-txn class on virtual transaction", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({ id: "vt1", description: "Amex Credit", virtual: true }),
        ]),
      }));
      expect(html).toContain('class="virtual-badge"');
      expect(html).toContain("virtual-txn");
      expect(html).toContain("virtual");
    });

    it("does not render virtual badge on non-virtual transaction", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({ id: "t1", description: "Regular purchase", virtual: false }),
        ]),
      }));
      expect(html).not.toContain('class="virtual-badge"');
      expect(html).not.toContain("virtual-txn");
    });

    it("virtual transaction has reduced opacity class", async () => {
      const html = await renderHome(seedOptions({
        getTransactions: vi.fn().mockResolvedValue([
          txn({ id: "vt1", description: "Virtual payment", virtual: true }),
        ]),
      }));
      expect(html).toContain('class="expand-row txn-row virtual-txn"');
    });
  });
});

// The #1266 orphan-suppression and seenGroups de-dup guards live in the surviving
// pure renderTransactionRows string helper (home.ts), which Unit 3/4 do not
// remove. These exercise that function directly — no React render needed — so they
// stay as plain unit tests, GREEN throughout.
describe("renderTransactionRows orphan + de-dup guards (#1266)", () => {
  function rowTxn(overrides: Partial<Transaction> = {}): Transaction {
    return txn(overrides);
  }

  it("tolerates a normalized group whose primary is outside the current batch", () => {
    const budgetIdToName = new Map<string, string>();
    const orphanBatch = [
      rowTxn({ id: "txn-b", description: "Store B", amount: 50, normalizedId: "norm-1", normalizedPrimary: false, timestamp: mockTimestamp("2025-01-04") }),
    ];
    const orphanHtml = renderTransactionRows(orphanBatch, "household", true, budgetIdToName);
    expect(orphanHtml).not.toContain("normalized-group");
    expect(orphanHtml).not.toContain("Store B");

    const primaryBatch = [
      rowTxn({ id: "txn-a", description: "Store A", amount: 50, normalizedId: "norm-1", normalizedPrimary: true, timestamp: mockTimestamp("2025-01-11") }),
    ];
    const primaryHtml = renderTransactionRows(primaryBatch, "household", true, budgetIdToName);
    expect(primaryHtml).toContain("normalized-group");
  });

  it("suppresses every non-primary member via the !primary guard when two share a normalizedId in a primary-less orphan batch", () => {
    const budgetIdToName = new Map<string, string>();
    const batch = [
      rowTxn({ id: "txn-b", description: "Store B", amount: 50, normalizedId: "norm-1", normalizedPrimary: false, timestamp: mockTimestamp("2025-01-04") }),
      rowTxn({ id: "txn-c", description: "Store C", amount: 50, normalizedId: "norm-1", normalizedPrimary: false, timestamp: mockTimestamp("2025-01-03") }),
    ];
    const html = renderTransactionRows(batch, "household", true, budgetIdToName);
    expect(html).not.toContain("Store B");
    expect(html).not.toContain("Store C");
    expect(html).not.toContain("normalized-group");
    expect(html.trim()).toBe("");
  });

  it("renders a normalized group exactly once when a second non-primary member shares its normalizedId (seenGroups de-dup)", () => {
    const budgetIdToName = new Map<string, string>();
    const batch = [
      rowTxn({ id: "txn-a", description: "Store A", amount: 50, normalizedId: "norm-1", normalizedPrimary: true, timestamp: mockTimestamp("2025-01-11") }),
      rowTxn({ id: "txn-b", description: "Store B", amount: 50, normalizedId: "norm-1", normalizedPrimary: false, timestamp: mockTimestamp("2025-01-04") }),
    ];
    const html = renderTransactionRows(batch, "household", true, budgetIdToName);
    const groupRowCount = html.split("normalized-group").length - 1;
    expect(groupRowCount).toBe(1);
  });
});
