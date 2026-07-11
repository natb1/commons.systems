// @vitest-environment happy-dom
//
// Markup + state tests for the React <Accounts> page (Unit 2). The data-loading
// pipeline (renderAccounts' Promise.all) runs in a useEffect, so each test awaits
// the load to settle. Compute helpers (buildAccountRows / computeIncomeStatement
// / computeNetWorth …) are the real reused implementations; only the three chart
// RENDERERS are stubbed to no-ops so the test never touches d3 / readThemeVar.
//
// Altitude: assert OBSERVABLE DOM (innerHTML substrings, DS cs-* classes), never
// React internals. The data source is the mocked DataSource passed via options
// (createMockDataSource), exactly as renderAccounts received it.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { DataSource } from "../../src/data-source";
import { createMockDataSource, ts } from "../helpers";

vi.mock("firebase/firestore", async () => (await import("../helpers")).timestampMockFactory());

// The three chart renderers build SVGs imperatively and read --fg/--chart-* via
// readThemeVar (throws on missing properties). Stub them to no-ops returning an
// empty ChartResult so the island effect runs harmlessly. The chart cores are
// covered by their own suites (accounts-net-worth-chart.test.ts, etc.).
vi.mock("../../src/pages/budgets-trend-chart.js", () => ({ renderAggregateTrendChart: vi.fn(() => ({ weeks: [] })) }));
vi.mock("../../src/pages/accounts-net-worth-chart.js", () => ({ renderNetWorthChart: vi.fn(() => ({ weeks: [] })) }));
vi.mock("../../src/pages/accounts-cash-flow-chart.js", () => ({ renderCashFlowChart: vi.fn(() => ({ weeks: [] })) }));

import { Accounts } from "../../src/pages/Accounts";
import type { Transaction, Statement } from "../../src/firestore";

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1" as never,
    institution: "Bank",
    account: "Checking",
    description: "Test",
    amount: 50,
    note: "",
    category: "Food",
    reimbursement: 0,
    budget: null,
    timestamp: ts("2025-02-15"),
    statementId: null,
    groupId: null,
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    virtual: false,
    ...overrides,
  };
}

function stmt(overrides: Partial<Statement> = {}): Statement {
  return {
    id: "stmt-1",
    statementId: "Bank-Checking-2025-02" as never,
    institution: "Bank",
    account: "Checking",
    balance: 1000,
    period: "2025-02",
    balanceDate: null,
    lastTransactionDate: null,
    groupId: null,
    virtual: false,
    ...overrides,
  };
}

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: true, groupName: "household", dataSource: createMockDataSource(dsOverrides) };
}

// Render <Accounts> and resolve once the async load effect has settled into the
// loaded body or the inline error region. Returns the container's innerHTML.
async function renderAccounts(options: Parameters<typeof Accounts>[0]["options"]): Promise<string> {
  const { container } = render(<Accounts options={options} />);
  await waitFor(() => {
    const settled =
      container.querySelector("#accounts-table") ||
      container.querySelector("#accounts-error") ||
      container.querySelector("p");
    if (!settled) throw new Error("not settled");
  });
  return container.innerHTML;
}

describe("Accounts (renderAccounts markup parity)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // happy-dom lacks ResizeObserver; the chart island constructs one.
    class FakeRO { observe() {} unobserve() {} disconnect() {} }
    vi.stubGlobal("ResizeObserver", FakeRO as unknown as typeof ResizeObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders an Accounts heading", async () => {
    const html = await renderAccounts(seedOptions());
    expect(html).toContain("<h2>Accounts</h2>");
  });

  it("renders neither the table nor an error while loading", () => {
    // Assert synchronously, before the async load effect flushes: the heading is
    // present but the load body (table / error) is not yet rendered. Use
    // localOptions so no seed-notice <p> is present to confuse a settle check.
    const { container } = render(<Accounts options={localOptions()} />);
    expect(container.querySelector("#accounts-table")).toBeNull();
    expect(container.querySelector("#accounts-error")).toBeNull();
    expect(container.querySelector("h2")?.textContent).toBe("Accounts");
  });

  it("shows the seed data notice for unauthorized users", async () => {
    const html = await renderAccounts(seedOptions());
    expect(html).toContain('id="seed-data-notice"');
    expect(html).toContain("Load a data file to see your accounts");
  });

  it("does not show the seed data notice for authorized users", async () => {
    const html = await renderAccounts(localOptions());
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("shows the empty state when there are no accounts", async () => {
    const html = await renderAccounts(seedOptions());
    expect(html).toContain("No accounts found.");
  });

  it("renders account rows with balance and institution", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ institution: "BankOne", account: "1234" })]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "BankOne", account: "1234", balance: 3825.5, lastTransactionDate: ts("2025-02-15") }),
      ]),
    }));
    expect(html).toContain('id="accounts-table"');
    expect(html).toContain("<th>Derived</th>");
    expect(html).toContain("BankOne");
    expect(html).toContain("1234");
    expect(html).toContain("$3,825.50");
  });

  it("renders a reconcile link when the account has a latest period", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
      getStatements: vi.fn().mockResolvedValue([stmt({ period: "2025-02", lastTransactionDate: ts("2025-02-15") })]),
    }));
    expect(html).toContain('class="reconcile-link"');
    // React escapes the & in serialized HTML, matching the legacy escapeHtml output.
    expect(html).toContain("/accounts/reconcile?institution=Bank&amp;account=Checking&amp;period=2025-02");
  });

  it("renders a neutral DS badge (not the legacy span) for an all-virtual account", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "Synchrony", account: "Card", period: "2025-02", virtual: true, lastTransactionDate: ts("2025-02-15") }),
        stmt({ id: "s2", statementId: "Synchrony-Card-2025-01" as never, institution: "Synchrony", account: "Card", period: "2025-01", virtual: true, lastTransactionDate: ts("2025-01-15") }),
      ]),
    }));
    expect(html).toContain("cs-badge");
    expect(html).toContain("virtual");
  });

  it("does not render a badge for an account with non-virtual statements", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ institution: "Bank", account: "Checking", virtual: false, lastTransactionDate: ts("2025-02-15") }),
      ]),
    }));
    expect(html).not.toContain("cs-badge");
  });

  it("applies the discrepancy class to a row whose derived balance diverges", async () => {
    // Anchor 2025-01 balance=500, no Feb transactions → derived Feb 500; statement says 1000.
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ timestamp: ts("2025-02-15") })]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ id: "s1", period: "2025-01", balance: 500 }),
        stmt({ id: "s2", statementId: "Bank-Checking-2025-02" as never, period: "2025-02", balance: 1000 }),
      ]),
    }));
    expect(html).toContain('class="discrepancy"');
  });

  it("renders the divergence warning when balances diverge", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "t1" as never, amount: 100, timestamp: ts("2025-01-15"), budget: "food" as never }),
      ]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ id: "s1", period: "2025-01", balance: 500, lastTransactionDate: ts("2025-01-15") }),
        stmt({ id: "s2", period: "2025-02", balance: 1000, lastTransactionDate: ts("2025-01-15") }),
      ]),
    }));
    expect(html).toContain('id="balance-divergence-warning"');
    expect(html).toContain("divergence-warning");
  });

  it("does not render the divergence warning when balances are consistent", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([txn()]),
      getStatements: vi.fn().mockResolvedValue([
        stmt({ period: "2025-02", balance: 1000, lastTransactionDate: ts("2025-02-15") }),
      ]),
    }));
    expect(html).not.toContain('id="balance-divergence-warning"');
  });

  it("renders the income statement, cash-flow tables, and headline Metric cards when a report exists", async () => {
    // Two months of data so mostRecentMonthWithData (vs. today 2026) is non-null.
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "i1" as never, category: "Salary", amount: -3000, timestamp: ts("2025-02-10") }),
        txn({ id: "e1" as never, category: "Food", amount: 500, timestamp: ts("2025-02-12") }),
        txn({ id: "i0" as never, category: "Salary", amount: -2800, timestamp: ts("2025-01-10") }),
      ]),
      getStatements: vi.fn().mockResolvedValue([stmt({ period: "2025-02", lastTransactionDate: ts("2025-02-12") })]),
    }));
    expect(html).toContain('id="accounts-income-statement"');
    expect(html).toContain('class="income-statement-table"');
    expect(html).toContain('id="accounts-cash-flow-summary"');
    expect(html).toContain('class="cash-flow-summary-table"');
    // DS Metric cards for the headline figures.
    expect(html).toContain("cs-metric");
    expect(html).toContain("Net income");
    expect(html).toContain("Savings rate");
    expect(html).toContain("Net change");
  });

  it("renders the Projected runway metric when net worth and trailing spend both exist", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "i1" as never, category: "Salary", amount: -3000, timestamp: ts("2025-02-10") }),
        txn({ id: "e1" as never, category: "Food", amount: 500, timestamp: ts("2025-02-12") }),
        txn({ id: "i0" as never, category: "Salary", amount: -2800, timestamp: ts("2025-01-10") }),
      ]),
      getStatements: vi.fn().mockResolvedValue([stmt({ period: "2025-02", lastTransactionDate: ts("2025-02-12") })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1", budgetId: "food",
          periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"),
          total: 200, count: 2, categoryBreakdown: {}, groupId: null,
        },
        {
          id: "food-w2", budgetId: "food",
          periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"),
          total: 300, count: 3, categoryBreakdown: {}, groupId: null,
        },
      ]),
    }));
    expect(html).toContain("Projected runway");
    expect(html).toMatch(/[\d.]+ months/);
  });

  it("omits the Projected runway metric when there are no statements (no net-worth points)", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "i1" as never, category: "Salary", amount: -3000, timestamp: ts("2025-02-10") }),
        txn({ id: "e1" as never, category: "Food", amount: 500, timestamp: ts("2025-02-12") }),
        txn({ id: "i0" as never, category: "Salary", amount: -2800, timestamp: ts("2025-01-10") }),
      ]),
      getStatements: vi.fn().mockResolvedValue([]),
      getBudgetPeriods: vi.fn().mockResolvedValue([]),
    }));
    // The headline card still renders (report is non-null) but no runway metric.
    expect(html).toContain("Net income");
    expect(html).not.toContain("Projected runway");
  });

  it("keeps the three period labels word-bounded in the income-table header text", async () => {
    // Regression guard for the React port: the legacy string renderer separated
    // header <th> cells with whitespace, so accounts-income-statement.spec.ts can
    // count three "Mon YYYY" labels in thead.textContent via /\b[A-Z][a-z]{2} \d{4}\b/g.
    // Adjacent JSX <th> emit no separating whitespace, collapsing the labels into
    // one bounded token; the {" "} text nodes restore the boundaries.
    const { container } = render(<Accounts options={localOptions({
      getTransactions: vi.fn().mockResolvedValue([
        txn({ id: "i1" as never, category: "Salary", amount: -3000, timestamp: ts("2025-02-10") }),
        txn({ id: "e1" as never, category: "Food", amount: 500, timestamp: ts("2025-02-12") }),
        txn({ id: "i0" as never, category: "Salary", amount: -2800, timestamp: ts("2025-01-10") }),
      ]),
      getStatements: vi.fn().mockResolvedValue([stmt({ period: "2025-02", lastTransactionDate: ts("2025-02-12") })]),
    })} />);
    await waitFor(() => {
      if (!container.querySelector("#accounts-income-table thead")) throw new Error("not settled");
    });
    const headerText = container.querySelector("#accounts-income-table thead")?.textContent ?? "";
    const matches = headerText.match(/\b[A-Z][a-z]{2} \d{4}\b/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("renders the chart island containers and date picker when chart data computes", async () => {
    const html = await renderAccounts(localOptions({
      getTransactions: vi.fn().mockResolvedValue([txn({ budget: "food" as never })]),
      getStatements: vi.fn().mockResolvedValue([stmt({ lastTransactionDate: ts("2025-02-15") })]),
      getBudgetPeriods: vi.fn().mockResolvedValue([
        {
          id: "food-w1", budgetId: "food",
          periodStart: ts("2025-02-10"), periodEnd: ts("2025-02-17"),
          total: 50, count: 1, categoryBreakdown: {}, groupId: null,
        },
      ]),
    }));
    expect(html).toContain('id="accounts-trend-chart"');
    expect(html).toContain('id="accounts-net-worth-chart"');
    expect(html).toContain('id="accounts-cash-flow-chart"');
    expect(html).toContain('id="accounts-date-picker"');
  });

  it("renders the soft error fallback when a data source fails", async () => {
    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    expect(html).toContain('id="accounts-error"');
    expect(html).toContain("Could not load data");
  });

  it("shows the data-error support message for a DataIntegrityError instead of throwing", async () => {
    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockRejectedValue(new DataIntegrityError("bad data")),
    }));
    expect(html).toContain('id="accounts-error"');
    expect(html).toContain("A data error occurred");
    expect(html).not.toContain("Could not load data");
  });

  it("shows the access-denied message for a permission-denied error", async () => {
    const error = new Error("permission denied") as Error & { code?: string };
    error.code = "permission-denied";
    const html = await renderAccounts(localOptions({
      getStatements: vi.fn().mockRejectedValue(error),
    }));
    expect(html).toContain('id="accounts-error"');
    expect(html).toContain("Access denied");
  });
});
