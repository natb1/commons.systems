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

vi.mock("virtual:budget-seed-data", async () => {
  const { SEED_DATA_MOCK } = await import("./fixtures/seed-data-mock");
  return { default: SEED_DATA_MOCK };
});

import { Timestamp } from "firebase/firestore";
import { storeParsedData, closeDb } from "../src/idb";
import { IdbDataSource, SeedDataSource } from "../src/data-source";
import type { TransactionId, BudgetPeriodId, RuleId } from "../src/firestore";
import { makeParsedData } from "./helpers";

beforeEach(async () => {
  await closeDb();
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

  it("reads weekly aggregates from IDB", async () => {
    await storeParsedData(makeParsedData({
      weeklyAggregates: [{
        id: "2025-01-06",
        weekStartMs: 1736121600000, // 2025-01-06T00:00:00Z
        creditTotal: 500,
        unbudgetedTotal: 75.50,
      }],
    }));
    const ds = new IdbDataSource();
    const aggs = await ds.getWeeklyAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0].id).toBe("2025-01-06");
    expect(aggs[0].weekStart.toMillis()).toBe(1736121600000);
    expect(aggs[0].creditTotal).toBe(500);
    expect(aggs[0].unbudgetedTotal).toBe(75.50);
  });

  it("deleteRule removes from IDB", async () => {
    await storeParsedData(makeParsedData());
    const ds = new IdbDataSource();
    await ds.deleteRule("r-1" as RuleId);
    const rules = await ds.getRules();
    expect(rules).toHaveLength(0);
  });

  describe("getTransactions with query params", () => {
    const T1 = 1000;
    const T2 = 2000;
    const T3 = 3000;

    function multiTxnData() {
      return makeParsedData({
        transactions: [
          {
            id: "t-early", institution: "bank", account: "1234",
            description: "Early", amount: 10, timestampMs: T1,
            statementId: null, category: "A", budget: null, note: "",
            reimbursement: 0, normalizedId: null, normalizedPrimary: true,
            normalizedDescription: null, virtual: false,
          },
          {
            id: "t-mid", institution: "bank", account: "1234",
            description: "Mid", amount: 20, timestampMs: T2,
            statementId: null, category: "B", budget: null, note: "",
            reimbursement: 0, normalizedId: null, normalizedPrimary: true,
            normalizedDescription: null, virtual: false,
          },
          {
            id: "t-late", institution: "bank", account: "1234",
            description: "Late", amount: 30, timestampMs: T3,
            statementId: null, category: "C", budget: null, note: "",
            reimbursement: 0, normalizedId: null, normalizedPrimary: true,
            normalizedDescription: null, virtual: false,
          },
          {
            id: "t-null", institution: "bank", account: "1234",
            description: "No date", amount: 40, timestampMs: null,
            statementId: null, category: "D", budget: null, note: "",
            reimbursement: 0, normalizedId: null, normalizedPrimary: true,
            normalizedDescription: null, virtual: false,
          },
        ],
      });
    }

    it("since — only returns transactions at or after sinceMs, excludes nulls", async () => {
      await storeParsedData(multiTxnData());
      const ds = new IdbDataSource();
      const txns = await ds.getTransactions({ since: Timestamp.fromMillis(T2) });
      const ids = txns.map(t => t.id);
      expect(ids).toContain("t-mid");
      expect(ids).toContain("t-late");
      expect(ids).not.toContain("t-early");
      expect(ids).not.toContain("t-null");
    });

    it("before — only returns transactions before beforeMs, includes null timestamps", async () => {
      await storeParsedData(multiTxnData());
      const ds = new IdbDataSource();
      const txns = await ds.getTransactions({ before: Timestamp.fromMillis(T2) });
      const ids = txns.map(t => t.id);
      expect(ids).toContain("t-early");
      expect(ids).toContain("t-null");
      expect(ids).not.toContain("t-mid");
      expect(ids).not.toContain("t-late");
    });

    it("since + before — returns transactions in range, excludes nulls", async () => {
      await storeParsedData(multiTxnData());
      const ds = new IdbDataSource();
      const txns = await ds.getTransactions({
        since: Timestamp.fromMillis(T2),
        before: Timestamp.fromMillis(T3),
      });
      const ids = txns.map(t => t.id);
      expect(ids).toEqual(["t-mid"]);
    });

    it("no args — returns all transactions (backward compatible)", async () => {
      await storeParsedData(multiTxnData());
      const ds = new IdbDataSource();
      const txns = await ds.getTransactions();
      expect(txns).toHaveLength(4);
    });

    it("null timestamps excluded with since, included with before only", async () => {
      await storeParsedData(multiTxnData());
      const ds = new IdbDataSource();

      const withSince = await ds.getTransactions({ since: Timestamp.fromMillis(T1) });
      expect(withSince.find(t => t.id === "t-null")).toBeUndefined();

      const withBefore = await ds.getTransactions({ before: Timestamp.fromMillis(T3) });
      expect(withBefore.find(t => t.id === "t-null")).toBeDefined();
    });
  });
});

describe("SeedDataSource", () => {
  it("rejects with 'Seed data is read-only' for write methods", async () => {
    const ds = new SeedDataSource();
    await expect(ds.updateTransaction()).rejects.toThrow("Seed data is read-only");
    await expect(ds.updateBudget()).rejects.toThrow("Seed data is read-only");
    await expect(ds.updateBudgetOverrides()).rejects.toThrow("Seed data is read-only");
    await expect(ds.adjustBudgetPeriodTotal()).rejects.toThrow("Seed data is read-only");
    await expect(ds.createRule()).rejects.toThrow("Seed data is read-only");
    await expect(ds.updateRule()).rejects.toThrow("Seed data is read-only");
    await expect(ds.deleteRule()).rejects.toThrow("Seed data is read-only");
    await expect(ds.createNormalizationRule()).rejects.toThrow("Seed data is read-only");
    await expect(ds.updateNormalizationRule()).rejects.toThrow("Seed data is read-only");
    await expect(ds.deleteNormalizationRule()).rejects.toThrow("Seed data is read-only");
  });

  it("getTransactions returns all seed transactions with Timestamp objects", async () => {
    const ds = new SeedDataSource();
    const txns = await ds.getTransactions();
    expect(txns).toHaveLength(3);
    expect(txns[0].id).toBe("seed-txn-1");
    expect(txns[0].description).toBe("GROCERY STORE");
    expect(txns[0].timestamp).not.toBeNull();
    expect(txns[0].timestamp!.toMillis()).toBe(1700000000000);
    expect(txns[0].groupId).toBeNull();
  });

  it("getTransactions with since filter excludes earlier and null timestamps", async () => {
    const ds = new SeedDataSource();
    const txns = await ds.getTransactions({ since: Timestamp.fromMillis(1700050000000) });
    const ids = txns.map(t => t.id);
    expect(ids).toContain("seed-txn-2");
    expect(ids).not.toContain("seed-txn-1");
    expect(ids).not.toContain("seed-txn-null-ts");
  });

  it("getTransactions with before filter excludes later timestamps, includes nulls", async () => {
    const ds = new SeedDataSource();
    const txns = await ds.getTransactions({ before: Timestamp.fromMillis(1700050000000) });
    const ids = txns.map(t => t.id);
    expect(ids).toContain("seed-txn-1");
    expect(ids).toContain("seed-txn-null-ts");
    expect(ids).not.toContain("seed-txn-2");
  });

  it("getTransactions with since + before returns range, excludes nulls", async () => {
    const ds = new SeedDataSource();
    const txns = await ds.getTransactions({
      since: Timestamp.fromMillis(1700000000000),
      before: Timestamp.fromMillis(1700100000000),
    });
    const ids = txns.map(t => t.id);
    expect(ids).toEqual(["seed-txn-1"]);
  });

  it("getBudgets returns seed budgets with Timestamp overrides", async () => {
    const ds = new SeedDataSource();
    const budgets = await ds.getBudgets();
    expect(budgets).toHaveLength(1);
    expect(budgets[0].id).toBe("food");
    expect(budgets[0].name).toBe("Food");
    expect(budgets[0].allowance).toBe(150);
    expect(budgets[0].overrides).toHaveLength(1);
    expect(budgets[0].overrides[0].date.toMillis()).toBe(1699900000000);
    expect(budgets[0].overrides[0].balance).toBe(200);
    expect(budgets[0].groupId).toBeNull();
  });

  it("getBudgetPeriods returns seed periods with Timestamp objects", async () => {
    const ds = new SeedDataSource();
    const periods = await ds.getBudgetPeriods();
    expect(periods).toHaveLength(1);
    expect(periods[0].id).toBe("bp-seed-1");
    expect(periods[0].periodStart.toMillis()).toBe(1699900000000);
    expect(periods[0].periodEnd.toMillis()).toBe(1700504800000);
    expect(periods[0].total).toBe(45.67);
    expect(periods[0].groupId).toBeNull();
  });

  it("getRules returns seed rules", async () => {
    const ds = new SeedDataSource();
    const rules = await ds.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe("rule-1");
    expect(rules[0].pattern).toBe("GROCERY");
    expect(rules[0].groupId).toBeNull();
  });

  it("getNormalizationRules returns seed normalization rules", async () => {
    const ds = new SeedDataSource();
    const rules = await ds.getNormalizationRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe("nrule-1");
    expect(rules[0].canonicalDescription).toBe("GROCERY STORE");
    expect(rules[0].groupId).toBeNull();
  });

  it("getStatements returns seed statements with Timestamp objects", async () => {
    const ds = new SeedDataSource();
    const stmts = await ds.getStatements();
    expect(stmts).toHaveLength(1);
    expect(stmts[0].statementId).toBe("stmt-1");
    expect(stmts[0].lastTransactionDate).not.toBeNull();
    expect(stmts[0].lastTransactionDate!.toMillis()).toBe(1700000000000);
    expect(stmts[0].groupId).toBeNull();
  });

  it("getWeeklyAggregates returns seed aggregates with Timestamp objects", async () => {
    const ds = new SeedDataSource();
    const aggs = await ds.getWeeklyAggregates();
    expect(aggs).toHaveLength(1);
    expect(aggs[0].id).toBe("2023-11-13");
    expect(aggs[0].weekStart.toMillis()).toBe(1699833600000);
    expect(aggs[0].creditTotal).toBe(500);
    expect(aggs[0].unbudgetedTotal).toBe(75);
    expect(aggs[0].groupId).toBeNull();
  });
});
