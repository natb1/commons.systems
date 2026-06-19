// Unit tests for the pure view-model helpers extracted from accounts.ts into
// account-view-model.ts (Unit 2). These compute values (account rows, variance
// class, formatted strings) with no HTML emission, so they need no DOM.
import { describe, it, expect, vi } from "vitest";
import type { DerivedAccountBalance } from "../../src/balance";
import { ts } from "../helpers";

vi.mock("firebase/firestore", async () => (await import("../helpers")).timestampMockFactory());

import {
  buildAccountRows,
  formatDate,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  varianceClass,
} from "../../src/pages/account-view-model";
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

function derived(overrides: Partial<DerivedAccountBalance> = {}): DerivedAccountBalance {
  return {
    institution: "Bank",
    account: "Checking",
    earliestPeriod: "2025-01",
    latestPeriod: "2025-02",
    derivedBalance: 1000,
    statementBalance: 1000,
    discrepancy: 0,
    ...overrides,
  };
}

describe("buildAccountRows", () => {
  it("builds a row per (institution, account) from statements and transactions", () => {
    const rows = buildAccountRows(
      [txn({ institution: "BankOne", account: "1234" })],
      [stmt({ institution: "BankOne", account: "1234", balance: 3825.5, period: "2025-02" })],
      [],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].institution).toBe("BankOne");
    expect(rows[0].account).toBe("1234");
    expect(rows[0].balance).toBe(3825.5);
    expect(rows[0].latestPeriod).toBe("2025-02");
  });

  it("uses the latest statement period for the balance", () => {
    const rows = buildAccountRows(
      [],
      [
        stmt({ id: "s1", period: "2025-01", balance: 500, lastTransactionDate: ts("2025-01-15") }),
        stmt({ id: "s2", period: "2025-02", balance: 750, lastTransactionDate: ts("2025-02-15") }),
      ],
      [],
    );
    expect(rows[0].balance).toBe(750);
    expect(rows[0].latestPeriod).toBe("2025-02");
  });

  it("flags hasDiscrepancy and surfaces derivedBalance from derived balances", () => {
    const rows = buildAccountRows(
      [txn()],
      [stmt()],
      [derived({ derivedBalance: 450, statementBalance: 1000, discrepancy: 550 })],
    );
    expect(rows[0].derivedBalance).toBe(450);
    expect(rows[0].hasDiscrepancy).toBe(true);
  });

  it("does not flag a discrepancy within the 0.01 tolerance", () => {
    const rows = buildAccountRows([txn()], [stmt()], [derived({ discrepancy: 0.005 })]);
    expect(rows[0].hasDiscrepancy).toBe(false);
  });

  it("marks an account virtual only when all its statements are virtual", () => {
    const allVirtual = buildAccountRows([], [
      stmt({ id: "s1", period: "2025-02", virtual: true }),
      stmt({ id: "s2", period: "2025-01", virtual: true }),
    ], []);
    expect(allVirtual[0].virtual).toBe(true);

    const mixed = buildAccountRows([], [
      stmt({ id: "s1", period: "2025-02", virtual: true }),
      stmt({ id: "s2", period: "2025-01", virtual: false }),
    ], []);
    expect(mixed[0].virtual).toBe(false);
  });

  it("sorts rows ascending by most recent timestamp", () => {
    const rows = buildAccountRows([], [
      stmt({ institution: "ZBank", account: "Savings", period: "2025-03", lastTransactionDate: ts("2025-03-01") }),
      stmt({ institution: "ABank", account: "Checking", period: "2025-01", lastTransactionDate: ts("2025-01-01") }),
    ], []);
    expect(rows.map(r => r.institution)).toEqual(["ABank", "ZBank"]);
  });
});

describe("formatDate", () => {
  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });
  it("formats a timestamp via toLocaleDateString", () => {
    const ms = new Date("2025-02-15").getTime();
    expect(formatDate(ms)).toBe(new Date(ms).toLocaleDateString());
  });
});

describe("formatSignedCurrency", () => {
  it("prefixes a plus for positive, a minus sign for negative, none for zero", () => {
    expect(formatSignedCurrency(100)).toBe("+$100.00");
    expect(formatSignedCurrency(-100)).toBe("−$100.00");
    expect(formatSignedCurrency(0)).toBe("$0.00");
  });
});

describe("formatSignedPercent", () => {
  it("rounds to one decimal and signs the result", () => {
    expect(formatSignedPercent(12.34)).toBe("+12.3%");
    expect(formatSignedPercent(-12.34)).toBe("−12.3%");
    expect(formatSignedPercent(0)).toBe("0.0%");
  });
});

describe("formatPercent", () => {
  it("returns an em dash for null and a percentage otherwise", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(0.25)).toBe("25.0%");
  });
});

describe("varianceClass", () => {
  it("returns neutral for null or zero", () => {
    expect(varianceClass(null)).toBe("variance-neutral");
    expect(varianceClass(0)).toBe("variance-neutral");
  });
  it("treats positive income as favorable (positive class)", () => {
    expect(varianceClass(5, "income")).toBe("variance-positive");
    expect(varianceClass(-5, "income")).toBe("variance-negative");
  });
  it("inverts the sense for the expense side (less spending is favorable)", () => {
    expect(varianceClass(-5, "expense")).toBe("variance-positive");
    expect(varianceClass(5, "expense")).toBe("variance-negative");
  });
});
