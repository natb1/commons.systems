import { describe, it, expect } from "vitest";
import {
  topLevelCategory,
  isTransferCategory,
  mostRecentCompleteMonth,
  mostRecentMonthWithData,
  priorMonth,
  yearAgoMonth,
  monthRange,
  formatMonthLabel,
  computeMonthlyIncomeStatement,
  computeCashFlowSummary,
  computeIncomeStatementReport,
} from "../src/income-statement";
import type { Transaction } from "../src/firestore";
import { ts } from "./helpers";

function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1" as any,
    institution: "Bank",
    account: "Checking",
    description: "Test",
    amount: 50,
    note: "",
    category: "Food:Groceries",
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe("topLevelCategory", () => {
  it("returns a flat category unchanged", () => {
    expect(topLevelCategory("Food")).toBe("Food");
  });

  it("returns the segment before the first colon", () => {
    expect(topLevelCategory("Food:Groceries")).toBe("Food");
  });

  it("returns only the first segment for deeply nested categories", () => {
    expect(topLevelCategory("Food:Groceries:Organic")).toBe("Food");
  });

  it("returns empty string for empty input", () => {
    expect(topLevelCategory("")).toBe("");
  });

  it("returns empty string when the string starts with a colon", () => {
    expect(topLevelCategory(":Leading")).toBe("");
  });
});

describe("isTransferCategory", () => {
  it("returns true for exact 'Transfer'", () => {
    expect(isTransferCategory("Transfer")).toBe(true);
  });

  it("returns true for 'Transfer:CardPayment'", () => {
    expect(isTransferCategory("Transfer:CardPayment")).toBe(true);
  });

  it("returns true for 'Transfer:Savings'", () => {
    expect(isTransferCategory("Transfer:Savings")).toBe(true);
  });

  it("returns true for nested Transfer subcategory", () => {
    expect(isTransferCategory("Transfer:CardPayment:Chase")).toBe(true);
  });

  it("returns false for unrelated categories", () => {
    expect(isTransferCategory("Food")).toBe(false);
  });

  it("returns false for categories with 'Transfer' as a prefix substring only", () => {
    expect(isTransferCategory("Transferrable")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isTransferCategory("")).toBe(false);
  });
});

describe("mostRecentCompleteMonth", () => {
  it("returns the prior month for a mid-month timestamp", () => {
    expect(mostRecentCompleteMonth(Date.UTC(2025, 1, 15))).toEqual({ year: 2025, monthIdx0: 0 });
  });

  it("returns the prior month for a timestamp at the first of the month", () => {
    expect(mostRecentCompleteMonth(Date.UTC(2025, 1, 1))).toEqual({ year: 2025, monthIdx0: 0 });
  });

  it("rolls back to December of the prior year from January", () => {
    expect(mostRecentCompleteMonth(Date.UTC(2025, 0, 10))).toEqual({ year: 2024, monthIdx0: 11 });
  });
});

describe("mostRecentMonthWithData", () => {
  it("returns the month of the latest transaction before the ceiling", () => {
    // nowMs = mid-March 2025; ceiling exclusive = start of March 2025.
    const txns = [
      makeTxn({ id: "a" as any, timestamp: ts("2025-01-10") }),
      makeTxn({ id: "b" as any, timestamp: ts("2025-02-05") }),
    ];
    expect(mostRecentMonthWithData(txns, Date.UTC(2025, 2, 15))).toEqual({ year: 2025, monthIdx0: 1 });
  });

  it("returns null for an empty transaction list", () => {
    expect(mostRecentMonthWithData([], Date.UTC(2025, 2, 15))).toBeNull();
  });

  it("returns null when all transactions are in the current partial month", () => {
    const txns = [makeTxn({ timestamp: ts("2025-03-10") })];
    expect(mostRecentMonthWithData(txns, Date.UTC(2025, 2, 15))).toBeNull();
  });

  it("excludes a transaction on day 1 of the nowMs month (partial-month boundary)", () => {
    const monthStartMs = Date.UTC(2025, 2, 1);
    const txns = [
      makeTxn({
        id: "a" as any,
        timestamp: { toDate: () => new Date(monthStartMs), toMillis: () => monthStartMs } as any,
      }),
      makeTxn({ id: "b" as any, timestamp: ts("2025-02-20") }),
    ];
    expect(mostRecentMonthWithData(txns, Date.UTC(2025, 2, 15))).toEqual({ year: 2025, monthIdx0: 1 });
  });

  it("picks the latest month even when older months carry more volume", () => {
    const txns = [
      makeTxn({ id: "big1" as any, amount: 9999, timestamp: ts("2024-12-01") }),
      makeTxn({ id: "big2" as any, amount: 9999, timestamp: ts("2024-12-15") }),
      makeTxn({ id: "small" as any, amount: 1, timestamp: ts("2025-02-28") }),
    ];
    expect(mostRecentMonthWithData(txns, Date.UTC(2025, 2, 15))).toEqual({ year: 2025, monthIdx0: 1 });
  });

  it("returns a December latest month when nowMs is in early January", () => {
    const txns = [makeTxn({ timestamp: ts("2024-12-20") })];
    expect(mostRecentMonthWithData(txns, Date.UTC(2025, 0, 10))).toEqual({ year: 2024, monthIdx0: 11 });
  });

  it("counts transfer-only months as having data", () => {
    const txns = [makeTxn({ category: "Transfer:CardPayment", amount: 200, timestamp: ts("2025-02-05") })];
    expect(mostRecentMonthWithData(txns, Date.UTC(2025, 2, 15))).toEqual({ year: 2025, monthIdx0: 1 });
  });

  it("skips non-primary normalized duplicates", () => {
    const txns = [
      makeTxn({
        id: "dup" as any,
        timestamp: ts("2025-02-10"),
        normalizedId: "n1",
        normalizedPrimary: false,
      }),
    ];
    expect(mostRecentMonthWithData(txns, Date.UTC(2025, 2, 15))).toBeNull();
  });
});

describe("monthRange", () => {
  it("returns UTC start and end for February 2025", () => {
    const { startMs, endMs } = monthRange({ year: 2025, monthIdx0: 1 });
    expect(startMs).toBe(Date.UTC(2025, 1, 1));
    expect(endMs).toBe(Date.UTC(2025, 2, 1));
  });

  it("produces a 29-day span for leap February 2024", () => {
    const { startMs, endMs } = monthRange({ year: 2024, monthIdx0: 1 });
    expect((endMs - startMs) / MS_PER_DAY).toBe(29);
  });

  it("rolls endMs to the next January for December", () => {
    const { endMs } = monthRange({ year: 2024, monthIdx0: 11 });
    expect(endMs).toBe(Date.UTC(2025, 0, 1));
  });
});

describe("priorMonth", () => {
  it("shifts March 2025 back to February 2025", () => {
    expect(priorMonth({ year: 2025, monthIdx0: 2 })).toEqual({ year: 2025, monthIdx0: 1 });
  });

  it("shifts January 2025 back to December 2024", () => {
    expect(priorMonth({ year: 2025, monthIdx0: 0 })).toEqual({ year: 2024, monthIdx0: 11 });
  });
});

describe("yearAgoMonth", () => {
  it("shifts February 2025 back to February 2024", () => {
    expect(yearAgoMonth({ year: 2025, monthIdx0: 1 })).toEqual({ year: 2024, monthIdx0: 1 });
  });
});

describe("formatMonthLabel", () => {
  it("formats February 2025", () => {
    expect(formatMonthLabel({ year: 2025, monthIdx0: 1 })).toBe("Feb 2025");
  });

  it("formats December 2024", () => {
    expect(formatMonthLabel({ year: 2024, monthIdx0: 11 })).toBe("Dec 2024");
  });
});

describe("computeMonthlyIncomeStatement", () => {
  const febStart = Date.UTC(2025, 1, 1);
  const febEnd = Date.UTC(2025, 2, 1);

  it("returns zeroed results for an empty transaction list", () => {
    const stmt = computeMonthlyIncomeStatement([], febStart, febEnd);
    expect(stmt.totalIncome).toBe(0);
    expect(stmt.totalExpenses).toBe(0);
    expect(stmt.netIncome).toBe(0);
    expect(stmt.savingsRate).toBeNull();
    expect(stmt.income).toEqual([]);
    expect(stmt.expenses).toEqual([]);
  });

  it("records a single expense under its top-level category", () => {
    const txns = [makeTxn({ amount: 50, category: "Food:Groceries", timestamp: ts("2025-02-10") })];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.expenses).toEqual([{ category: "Food", amount: 50 }]);
    expect(stmt.totalExpenses).toBe(50);
    expect(stmt.totalIncome).toBe(0);
    expect(stmt.netIncome).toBe(-50);
    expect(stmt.savingsRate).toBeNull();
  });

  it("records a single income (negative amount) as a positive category line", () => {
    const txns = [makeTxn({ amount: -2000, category: "Income:Salary", timestamp: ts("2025-02-05") })];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.income).toEqual([{ category: "Income", amount: 2000 }]);
    expect(stmt.totalIncome).toBe(2000);
  });

  it("excludes Transfer categories", () => {
    const txns = [
      makeTxn({ id: "txn-1" as any, amount: 300, category: "Transfer:CardPayment", timestamp: ts("2025-02-05") }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.expenses).toEqual([]);
    expect(stmt.income).toEqual([]);
    expect(stmt.totalExpenses).toBe(0);
    expect(stmt.totalIncome).toBe(0);
  });

  it("excludes transactions before the start of the window", () => {
    const txns = [makeTxn({ amount: 50, category: "Food:Groceries", timestamp: ts("2025-01-31") })];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.totalExpenses).toBe(0);
  });

  it("excludes transactions at or after the end of the window", () => {
    const txns = [makeTxn({ amount: 50, category: "Food:Groceries", timestamp: ts("2025-03-01") })];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.totalExpenses).toBe(0);
  });

  it("includes a transaction at exactly startMs (half-open lower bound)", () => {
    const txns = [
      makeTxn({
        amount: 50,
        category: "Food:Groceries",
        timestamp: { toDate: () => new Date(febStart), toMillis: () => febStart } as any,
      }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.totalExpenses).toBe(50);
  });

  it("excludes a transaction at exactly endMs (half-open upper bound)", () => {
    const txns = [
      makeTxn({
        amount: 50,
        category: "Food:Groceries",
        timestamp: { toDate: () => new Date(febEnd), toMillis: () => febEnd } as any,
      }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.totalExpenses).toBe(0);
  });

  it("drops transactions with null timestamp", () => {
    const txns = [makeTxn({ amount: 50, category: "Food:Groceries", timestamp: null })];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.totalExpenses).toBe(0);
  });

  it("drops non-primary normalized duplicates", () => {
    const txns = [
      makeTxn({
        amount: 50,
        category: "Food:Groceries",
        normalizedId: "norm-1",
        normalizedPrimary: false,
      }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.totalExpenses).toBe(0);
  });

  it("includes normalized primary duplicates", () => {
    const txns = [
      makeTxn({
        amount: 50,
        category: "Food:Groceries",
        normalizedId: "norm-1",
        normalizedPrimary: true,
      }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.totalExpenses).toBe(50);
  });

  it("applies reimbursement to the recorded amount", () => {
    const txns = [
      makeTxn({ amount: 100, reimbursement: 50, category: "Food:Groceries", timestamp: ts("2025-02-10") }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.expenses).toEqual([{ category: "Food", amount: 50 }]);
    expect(stmt.totalExpenses).toBe(50);
  });

  it("groups subcategories by their top-level parent", () => {
    const txns = [
      makeTxn({ id: "t1" as any, amount: 30, category: "Food:Groceries", timestamp: ts("2025-02-05") }),
      makeTxn({ id: "t2" as any, amount: 20, category: "Food:Dining", timestamp: ts("2025-02-06") }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.expenses).toEqual([{ category: "Food", amount: 50 }]);
    expect(stmt.totalExpenses).toBe(50);
  });

  it("sorts expense rows by amount descending", () => {
    const txns = [
      makeTxn({ id: "t1" as any, amount: 30, category: "Food:Groceries", timestamp: ts("2025-02-05") }),
      makeTxn({ id: "t2" as any, amount: 1500, category: "Housing:Rent", timestamp: ts("2025-02-06") }),
      makeTxn({ id: "t3" as any, amount: 100, category: "Transport:Gas", timestamp: ts("2025-02-07") }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.expenses.map((l) => l.category)).toEqual(["Housing", "Transport", "Food"]);
  });

  it("sorts income rows by amount descending", () => {
    const txns = [
      makeTxn({ id: "t1" as any, amount: -500, category: "Income:Bonus", timestamp: ts("2025-02-05") }),
      makeTxn({ id: "t2" as any, amount: -5000, category: "Salary:Base", timestamp: ts("2025-02-06") }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.income.map((l) => l.category)).toEqual(["Salary", "Income"]);
  });

  it("computes savingsRate as netIncome / totalIncome when income is positive", () => {
    const txns = [
      makeTxn({ id: "t1" as any, amount: -1000, category: "Income:Salary", timestamp: ts("2025-02-01") }),
      makeTxn({ id: "t2" as any, amount: 400, category: "Food:Groceries", timestamp: ts("2025-02-10") }),
    ];
    const stmt = computeMonthlyIncomeStatement(txns, febStart, febEnd);
    expect(stmt.totalIncome).toBe(1000);
    expect(stmt.totalExpenses).toBe(400);
    expect(stmt.netIncome).toBe(600);
    expect(stmt.savingsRate).toBeCloseTo(0.6);
  });
});

describe("computeCashFlowSummary", () => {
  const febStart = Date.UTC(2025, 1, 1);
  const febEnd = Date.UTC(2025, 2, 1);

  it("returns zeroed results for an empty transaction list", () => {
    const cash = computeCashFlowSummary([], febStart, febEnd);
    expect(cash.operating).toBe(0);
    expect(cash.transfers).toBe(0);
    expect(cash.netChange).toBe(0);
  });

  it("computes operating from income and expenses only", () => {
    const txns = [
      makeTxn({ id: "t1" as any, amount: -1000, category: "Income:Salary", timestamp: ts("2025-02-01") }),
      makeTxn({ id: "t2" as any, amount: 400, category: "Food:Groceries", timestamp: ts("2025-02-10") }),
    ];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.operating).toBe(600);
    expect(cash.transfers).toBe(0);
    expect(cash.netChange).toBe(600);
  });

  it("treats a positive-amount Transfer as money leaving accounts", () => {
    const txns = [
      makeTxn({ amount: 500, category: "Transfer:CardPayment", timestamp: ts("2025-02-05") }),
    ];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.operating).toBe(0);
    expect(cash.transfers).toBe(-500);
    expect(cash.netChange).toBe(-500);
  });

  it("treats a negative-amount Transfer as money entering accounts", () => {
    const txns = [
      makeTxn({ amount: -500, category: "Transfer:Savings", timestamp: ts("2025-02-05") }),
    ];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.operating).toBe(0);
    expect(cash.transfers).toBe(500);
    expect(cash.netChange).toBe(500);
  });

  it("sums operating and transfers correctly in a mixed month", () => {
    const txns = [
      makeTxn({ id: "t1" as any, amount: -1000, category: "Income:Salary", timestamp: ts("2025-02-01") }),
      makeTxn({ id: "t2" as any, amount: 400, category: "Food:Groceries", timestamp: ts("2025-02-10") }),
      makeTxn({ id: "t3" as any, amount: 200, category: "Transfer:CardPayment", timestamp: ts("2025-02-12") }),
    ];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.operating).toBe(600);
    expect(cash.transfers).toBe(-200);
    expect(cash.netChange).toBe(400);
  });

  it("handles a transfer-only month with zero operating", () => {
    const txns = [
      makeTxn({ id: "t1" as any, amount: 200, category: "Transfer:CardPayment", timestamp: ts("2025-02-05") }),
      makeTxn({ id: "t2" as any, amount: -300, category: "Transfer:Savings", timestamp: ts("2025-02-06") }),
    ];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.operating).toBe(0);
    expect(cash.transfers).toBe(100);
    expect(cash.netChange).toBe(100);
  });

  it("applies reimbursement to transfer amounts", () => {
    const txns = [
      makeTxn({
        amount: 400,
        reimbursement: 50,
        category: "Transfer:CardPayment",
        timestamp: ts("2025-02-05"),
      }),
    ];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.transfers).toBe(-200);
  });

  it("excludes non-primary normalized duplicates", () => {
    const txns = [
      makeTxn({
        amount: 500,
        category: "Transfer:CardPayment",
        normalizedId: "norm-1",
        normalizedPrimary: false,
      }),
    ];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.transfers).toBe(0);
  });

  it("excludes transactions with null timestamps", () => {
    const txns = [makeTxn({ amount: 400, category: "Food:Groceries", timestamp: null })];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.operating).toBe(0);
  });

  it("excludes transactions outside the window", () => {
    const txns = [
      makeTxn({ amount: 400, category: "Food:Groceries", timestamp: ts("2025-01-31") }),
      makeTxn({ amount: 500, category: "Transfer:CardPayment", timestamp: ts("2025-03-01") }),
    ];
    const cash = computeCashFlowSummary(txns, febStart, febEnd);
    expect(cash.operating).toBe(0);
    expect(cash.transfers).toBe(0);
  });
});

describe("computeIncomeStatementReport", () => {
  it("returns null when given no transactions", () => {
    expect(computeIncomeStatementReport([], Date.UTC(2025, 2, 15))).toBeNull();
  });

  it("selects the latest month with data when the calendar-current month is empty", () => {
    // nowMs = mid-March 2025; only a January txn exists. Feb 2025 is empty, so
    // 'current' falls back to Jan 2025 (the latest complete month with data).
    const txns = [makeTxn({ amount: 100, category: "Food:Groceries", timestamp: ts("2025-01-15") })];
    const report = computeIncomeStatementReport(txns, Date.UTC(2025, 2, 15));
    expect(report).not.toBeNull();
    if (!report) return;
    expect(report.currentLabel).toBe("Jan 2025");
    expect(report.priorLabel).toBe("Dec 2024");
    expect(report.yoYLabel).toBe("Jan 2024");
  });

  it("returns null when all transactions are in the current partial month", () => {
    // nowMs = mid-March 2025; only a March txn exists (partial current month).
    const txns = [makeTxn({ amount: 100, category: "Food:Groceries", timestamp: ts("2025-03-05") })];
    expect(computeIncomeStatementReport(txns, Date.UTC(2025, 2, 15))).toBeNull();
  });

  it("builds a report across current/prior/YoY months with labels, totals, and variance", () => {
    const nowMs = Date.UTC(2025, 2, 15); // mid-March 2025
    const txns: Transaction[] = [
      // Feb 2025 (current)
      makeTxn({ id: "f-sal" as any, amount: -5000, category: "Income:Salary", timestamp: ts("2025-02-01") }),
      makeTxn({ id: "f-gro" as any, amount: 400, category: "Food:Groceries", timestamp: ts("2025-02-05") }),
      makeTxn({ id: "f-rent" as any, amount: 1500, category: "Housing:Rent", timestamp: ts("2025-02-03") }),
      makeTxn({ id: "f-xfer" as any, amount: 200, category: "Transfer:CardPayment", timestamp: ts("2025-02-10") }),
      // Jan 2025 (prior)
      makeTxn({ id: "j-sal" as any, amount: -5000, category: "Income:Salary", timestamp: ts("2025-01-01") }),
      makeTxn({ id: "j-gro" as any, amount: 500, category: "Food:Groceries", timestamp: ts("2025-01-05") }),
      makeTxn({ id: "j-rent" as any, amount: 1500, category: "Housing:Rent", timestamp: ts("2025-01-03") }),
      // Feb 2024 (YoY)
      makeTxn({ id: "y-sal" as any, amount: -4800, category: "Income:Salary", timestamp: ts("2024-02-01") }),
      makeTxn({ id: "y-gro" as any, amount: 350, category: "Food:Groceries", timestamp: ts("2024-02-05") }),
      makeTxn({ id: "y-rent" as any, amount: 1500, category: "Housing:Rent", timestamp: ts("2024-02-03") }),
    ];

    const report = computeIncomeStatementReport(txns, nowMs);
    expect(report).not.toBeNull();
    if (!report) return;

    expect(report.currentLabel).toBe("Feb 2025");
    expect(report.priorLabel).toBe("Jan 2025");
    expect(report.yoYLabel).toBe("Feb 2024");

    // totalIncome
    expect(report.totalIncome.current).toBe(5000);
    expect(report.totalIncome.prior).toBe(5000);
    expect(report.totalIncome.yoY).toBe(4800);
    expect(report.totalIncome.priorVarianceAbs).toBe(0);
    expect(report.totalIncome.priorVariancePct).toBe(0);
    expect(report.totalIncome.yoYVarianceAbs).toBe(200);
    expect(report.totalIncome.yoYVariancePct).toBeCloseTo(4.1666667, 4);

    // totalExpenses
    expect(report.totalExpenses.current).toBe(1900);
    expect(report.totalExpenses.prior).toBe(2000);
    expect(report.totalExpenses.yoY).toBe(1850);

    // netIncome
    expect(report.netIncome.current).toBe(3100);
    expect(report.netIncome.prior).toBe(3000);
    expect(report.netIncome.yoY).toBe(2950);

    // savingsRate
    expect(report.savingsRate.current).toBeCloseTo(0.62);
    expect(report.savingsRate.prior).toBeCloseTo(0.6);
    expect(report.savingsRate.yoY).toBeCloseTo(0.6145833, 4);

    // cashFlow.current
    expect(report.cashFlow.current.operating).toBe(3100);
    expect(report.cashFlow.current.transfers).toBe(-200);
    expect(report.cashFlow.current.netChange).toBe(2900);

    // income rows contain an Income row with expected current amount
    const incomeRow = report.incomeRows.find((r) => r.category === "Income");
    expect(incomeRow).toBeDefined();
    expect(incomeRow?.variance.current).toBe(5000);
    expect(incomeRow?.variance.prior).toBe(5000);
    expect(incomeRow?.variance.yoY).toBe(4800);

    // expense rows include both Food and Housing
    const expenseCats = report.expenseRows.map((r) => r.category);
    expect(expenseCats).toContain("Food");
    expect(expenseCats).toContain("Housing");
  });

  it("handles year rollover when nowMs is in February", () => {
    // nowMs = mid-Feb 2026 → current = Jan 2026, prior = Dec 2025, YoY = Jan 2025
    const nowMs = Date.UTC(2026, 1, 15);
    const txns = [
      makeTxn({ amount: 100, category: "Food:Groceries", timestamp: ts("2026-01-10") }),
    ];
    const report = computeIncomeStatementReport(txns, nowMs);
    expect(report).not.toBeNull();
    if (!report) return;
    expect(report.currentLabel).toBe("Jan 2026");
    expect(report.priorLabel).toBe("Dec 2025");
    expect(report.yoYLabel).toBe("Jan 2025");
  });

  it("leaves YoY fields null when there are no YoY transactions", () => {
    const nowMs = Date.UTC(2025, 2, 15); // current = Feb 2025, yoY = Feb 2024
    const txns = [
      // Feb 2025 only
      makeTxn({ id: "f-sal" as any, amount: -5000, category: "Income:Salary", timestamp: ts("2025-02-01") }),
      makeTxn({ id: "f-gro" as any, amount: 400, category: "Food:Groceries", timestamp: ts("2025-02-05") }),
      // Jan 2025 prior
      makeTxn({ id: "j-sal" as any, amount: -5000, category: "Income:Salary", timestamp: ts("2025-01-01") }),
      makeTxn({ id: "j-gro" as any, amount: 500, category: "Food:Groceries", timestamp: ts("2025-01-05") }),
    ];

    const report = computeIncomeStatementReport(txns, nowMs);
    expect(report).not.toBeNull();
    if (!report) return;

    expect(report.totalIncome.yoY).toBeNull();
    expect(report.totalIncome.yoYVarianceAbs).toBeNull();
    expect(report.totalIncome.yoYVariancePct).toBeNull();
    expect(report.totalIncome.prior).toBe(5000);
    expect(report.totalIncome.priorVarianceAbs).toBe(0);
    expect(report.savingsRate.yoY).toBeNull();
  });

  it("leaves priorVariancePct null when prior total is zero but keeps priorVarianceAbs as current", () => {
    const nowMs = Date.UTC(2025, 2, 15); // current = Feb 2025, prior = Jan 2025
    const txns = [
      // Feb 2025 — salary present (current income = 5000)
      makeTxn({ id: "f-sal" as any, amount: -5000, category: "Income:Salary", timestamp: ts("2025-02-01") }),
      // Jan 2025 — expenses only, no income (prior income = 0)
      makeTxn({ id: "j-gro" as any, amount: 500, category: "Food:Groceries", timestamp: ts("2025-01-05") }),
    ];

    const report = computeIncomeStatementReport(txns, nowMs);
    expect(report).not.toBeNull();
    if (!report) return;

    expect(report.totalIncome.current).toBe(5000);
    expect(report.totalIncome.prior).toBe(0);
    expect(report.totalIncome.priorVarianceAbs).toBe(5000);
    expect(report.totalIncome.priorVariancePct).toBeNull();
  });

  it("emits a row for each category seen in any period, zero-filling the missing periods", () => {
    const nowMs = Date.UTC(2025, 2, 15); // current = Feb 2025, prior = Jan 2025
    const txns = [
      // Current has Food (expense) only; seed Income so the report is non-null and well-formed
      makeTxn({ id: "f-sal" as any, amount: -1000, category: "Income:Salary", timestamp: ts("2025-02-01") }),
      makeTxn({ id: "f-gro" as any, amount: 200, category: "Food:Groceries", timestamp: ts("2025-02-05") }),
      // Prior has Entertainment only, plus some income so prior has at least one txn
      makeTxn({ id: "j-sal" as any, amount: -1000, category: "Income:Salary", timestamp: ts("2025-01-01") }),
      makeTxn({ id: "j-ent" as any, amount: 80, category: "Entertainment:Movies", timestamp: ts("2025-01-05") }),
    ];

    const report = computeIncomeStatementReport(txns, nowMs);
    expect(report).not.toBeNull();
    if (!report) return;

    const expenseCats = report.expenseRows.map((r) => r.category);
    expect(expenseCats).toContain("Food");
    expect(expenseCats).toContain("Entertainment");

    const foodRow = report.expenseRows.find((r) => r.category === "Food");
    const entRow = report.expenseRows.find((r) => r.category === "Entertainment");
    expect(foodRow?.variance.current).toBe(200);
    expect(foodRow?.variance.prior).toBe(0);
    expect(entRow?.variance.current).toBe(0);
    expect(entRow?.variance.prior).toBe(80);
  });

  it("sorts rows by current amount descending", () => {
    const nowMs = Date.UTC(2025, 2, 15); // current = Feb 2025
    const txns = [
      makeTxn({ id: "f-sal" as any, amount: -5000, category: "Income:Salary", timestamp: ts("2025-02-01") }),
      makeTxn({ id: "f-gro" as any, amount: 200, category: "Food:Groceries", timestamp: ts("2025-02-05") }),
      makeTxn({ id: "f-rent" as any, amount: 1500, category: "Housing:Rent", timestamp: ts("2025-02-03") }),
      makeTxn({ id: "f-gas" as any, amount: 600, category: "Transport:Gas", timestamp: ts("2025-02-07") }),
    ];

    const report = computeIncomeStatementReport(txns, nowMs);
    expect(report).not.toBeNull();
    if (!report) return;

    const orderedCurrent = report.expenseRows.map((r) => r.variance.current);
    const sorted = [...orderedCurrent].sort((a, b) => b - a);
    expect(orderedCurrent).toEqual(sorted);
    // And specifically in this fixture:
    expect(report.expenseRows.map((r) => r.category)).toEqual(["Housing", "Transport", "Food"]);
  });
});
