import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", () => {
  class MockTimestamp {
    constructor(
      public readonly seconds: number,
      public readonly nanoseconds: number,
    ) {}
    toMillis() {
      return this.seconds * 1000 + this.nanoseconds / 1e6;
    }
    static fromMillis(ms: number) {
      return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
    }
  }
  return { Timestamp: MockTimestamp };
});

vi.mock("../src/firestore.js", () => ({
  getTransactions: vi.fn(),
  getBudgets: vi.fn(),
  getBudgetPeriods: vi.fn(),
  getRules: vi.fn(),
  getNormalizationRules: vi.fn(),
}));

import { storeParsedData, type ParsedData } from "../src/idb";
import { IdbDataSource, FirestoreSeedDataSource } from "../src/data-source";
import type { TransactionId, BudgetPeriodId, RuleId } from "../src/firestore";

function makeParsedData(): ParsedData {
  return {
    transactions: [
      {
        id: "txn-1",
        institution: "pnc",
        account: "5111",
        description: "KROGER",
        amount: 52.3,
        timestampMs: 1718064000000,
        statementId: "stmt-1",
        category: "Food",
        budget: "groceries",
        note: "",
        reimbursement: 0,
        normalizedId: null,
        normalizedPrimary: true,
        normalizedDescription: null,
      },
    ],
    budgets: [
      { id: "groceries", name: "Groceries", weeklyAllowance: 100, rollover: "none" },
    ],
    budgetPeriods: [
      {
        id: "bp-1",
        budgetId: "groceries",
        periodStartMs: 1718064000000,
        periodEndMs: 1718668800000,
        total: 52.3,
        count: 1,
        categoryBreakdown: { Food: 52.3 },
      },
    ],
    rules: [
      {
        id: "r-1",
        type: "categorization",
        pattern: "KROGER",
        target: "Food",
        priority: 1,
        institution: null,
        account: null,
      },
    ],
    normalizationRules: [
      {
        id: "nr-1",
        pattern: "KROGER.*",
        patternType: null,
        canonicalDescription: "KROGER",
        dateWindowDays: 7,
        institution: null,
        account: null,
        priority: 1,
      },
    ],
    meta: {
      key: "upload",
      groupName: "household",
      version: 1,
      exportedAt: "2025-06-15T10:30:00Z",
    },
  };
}

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("budget");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
});

describe("IdbDataSource", () => {
  it("reads transactions from IDB after storing data", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    const txns = await ds.getTransactions();
    expect(txns).toHaveLength(1);
    expect(txns[0].id).toBe("txn-1");
    expect(txns[0].description).toBe("KROGER");
    // Timestamp should be reconstructed from millis
    expect(txns[0].timestamp).not.toBeNull();
    expect(txns[0].timestamp!.toMillis()).toBe(1718064000000);
  });

  it("reads budgets from IDB", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    const budgets = await ds.getBudgets();
    expect(budgets).toHaveLength(1);
    expect(budgets[0].name).toBe("Groceries");
  });

  it("reads budget periods from IDB", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    const periods = await ds.getBudgetPeriods();
    expect(periods).toHaveLength(1);
    expect(periods[0].periodStart.toMillis()).toBe(1718064000000);
  });

  it("reads rules from IDB", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    const rules = await ds.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].pattern).toBe("KROGER");
  });

  it("reads normalization rules from IDB", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    const rules = await ds.getNormalizationRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].canonicalDescription).toBe("KROGER");
  });

  it("updateTransaction does read-modify-write", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    await ds.updateTransaction("txn-1" as TransactionId, { note: "updated" });
    const txns = await ds.getTransactions();
    expect(txns[0].note).toBe("updated");
    // Other fields preserved
    expect(txns[0].description).toBe("KROGER");
    expect(txns[0].amount).toBe(52.3);
  });

  it("updateTransaction throws for missing transaction", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    await expect(
      ds.updateTransaction("nonexistent" as TransactionId, { note: "x" }),
    ).rejects.toThrow("Transaction nonexistent not found");
  });

  it("adjustBudgetPeriodTotal does read-modify-write correctly", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    await ds.adjustBudgetPeriodTotal("bp-1" as BudgetPeriodId, 10);
    const periods = await ds.getBudgetPeriods();
    expect(periods[0].total).toBeCloseTo(62.3);
  });

  it("adjustBudgetPeriodTotal skips for zero delta", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    await ds.adjustBudgetPeriodTotal("bp-1" as BudgetPeriodId, 0);
    const periods = await ds.getBudgetPeriods();
    expect(periods[0].total).toBeCloseTo(52.3);
  });

  it("adjustBudgetPeriodTotal throws for non-finite delta", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    await expect(
      ds.adjustBudgetPeriodTotal("bp-1" as BudgetPeriodId, Infinity),
    ).rejects.toThrow(RangeError);
  });

  it("createRule generates UUID and stores", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    const id = await ds.createRule({
      type: "categorization",
      pattern: "TARGET",
      target: "Shopping",
      priority: 2,
      institution: null,
      account: null,
    });
    expect(id).toBeTruthy();
    const rules = await ds.getRules();
    expect(rules).toHaveLength(2);
    const newRule = rules.find((r) => r.id === id);
    expect(newRule).toBeDefined();
    expect(newRule!.pattern).toBe("TARGET");
  });

  it("deleteRule removes from IDB", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    await ds.deleteRule("r-1" as RuleId);
    const rules = await ds.getRules();
    expect(rules).toHaveLength(0);
  });
});

describe("FirestoreSeedDataSource", () => {
  it("throws 'Seed data is read-only' for write methods", () => {
    const ds = new FirestoreSeedDataSource();
    expect(() => ds.updateTransaction()).toThrow("Seed data is read-only");
    expect(() => ds.updateBudget()).toThrow("Seed data is read-only");
    expect(() => ds.adjustBudgetPeriodTotal()).toThrow(
      "Seed data is read-only",
    );
    expect(() => ds.createRule()).toThrow("Seed data is read-only");
    expect(() => ds.updateRule()).toThrow("Seed data is read-only");
    expect(() => ds.deleteRule()).toThrow("Seed data is read-only");
    expect(() => ds.createNormalizationRule()).toThrow(
      "Seed data is read-only",
    );
    expect(() => ds.updateNormalizationRule()).toThrow(
      "Seed data is read-only",
    );
    expect(() => ds.deleteNormalizationRule()).toThrow(
      "Seed data is read-only",
    );
  });
});
