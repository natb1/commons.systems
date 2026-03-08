import { describe, it, expect } from "vitest";
import type { Timestamp } from "firebase/firestore";
import { findPeriodForTimestamp, computeBudgetBalance } from "../src/balance";
import type { Budget, BudgetPeriod, Transaction } from "../src/firestore";

function ts(dateStr: string): Timestamp {
  const d = new Date(dateStr);
  return { toDate: () => d, toMillis: () => d.getTime() } as Timestamp;
}

function makePeriod(overrides: Partial<BudgetPeriod> & { id: string; budgetId: string }): BudgetPeriod {
  return {
    periodStart: ts("2025-01-13"),
    periodEnd: ts("2025-01-20"),
    total: 0,
    groupId: null,
    ...overrides,
  };
}

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food",
    name: "Food",
    weeklyAllowance: 150,
    rollover: "none",
    groupId: null,
    ...overrides,
  };
}

function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    institution: "Bank",
    account: "Checking",
    description: "Test",
    amount: 50,
    note: "",
    category: "Test",
    reimbursement: 0,
    budget: "food",
    timestamp: ts("2025-01-15"),
    statementId: null,
    groupId: null,
    ...overrides,
  };
}

describe("findPeriodForTimestamp", () => {
  const periods = [
    makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13") }),
    makePeriod({ id: "food-w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20") }),
    makePeriod({ id: "housing-w2", budgetId: "housing", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20") }),
  ];

  it("finds the period containing the timestamp", () => {
    const result = findPeriodForTimestamp(periods, "food", ts("2025-01-15"));
    expect(result?.id).toBe("food-w2");
  });

  it("matches at period start boundary (inclusive)", () => {
    const result = findPeriodForTimestamp(periods, "food", ts("2025-01-13"));
    expect(result?.id).toBe("food-w2");
  });

  it("does not match at period end boundary (exclusive)", () => {
    const result = findPeriodForTimestamp(periods, "food", ts("2025-01-20"));
    expect(result).toBeNull();
  });

  it("returns null when no period matches", () => {
    const result = findPeriodForTimestamp(periods, "food", ts("2025-02-01"));
    expect(result).toBeNull();
  });

  it("filters by budgetId", () => {
    const result = findPeriodForTimestamp(periods, "housing", ts("2025-01-15"));
    expect(result?.id).toBe("housing-w2");
  });

  it("returns null for non-existent budget", () => {
    const result = findPeriodForTimestamp(periods, "nonexistent", ts("2025-01-15"));
    expect(result).toBeNull();
  });
});

describe("computeBudgetBalance", () => {
  it("returns null when transaction has no budget", () => {
    const txn = makeTxn({ budget: null });
    const result = computeBudgetBalance(txn, [txn], makeBudget(), []);
    expect(result).toBeNull();
  });

  it("returns null when transaction has no timestamp", () => {
    const txn = makeTxn({ timestamp: null });
    const result = computeBudgetBalance(txn, [txn], makeBudget(), []);
    expect(result).toBeNull();
  });

  it("returns null when no matching period exists", () => {
    const txn = makeTxn({ timestamp: ts("2025-03-01") });
    const period = makePeriod({ id: "food-w2", budgetId: "food" });
    const result = computeBudgetBalance(txn, [txn], makeBudget(), [period]);
    expect(result).toBeNull();
  });

  it("computes balance for single period with single transaction", () => {
    const txn = makeTxn({ amount: 50 });
    const period = makePeriod({ id: "food-w2", budgetId: "food", total: 50 });
    const budget = makeBudget({ weeklyAllowance: 150 });
    const result = computeBudgetBalance(txn, [txn], budget, [period]);
    // allowance 150 - txn 50 = 100
    expect(result).toBe(100);
  });

  it("computes balance for single period with multiple transactions", () => {
    const txn1 = makeTxn({ id: "txn-1", amount: 30, timestamp: ts("2025-01-14") });
    const txn2 = makeTxn({ id: "txn-2", amount: 50, timestamp: ts("2025-01-16") });
    const period = makePeriod({ id: "food-w2", budgetId: "food", total: 80 });
    const budget = makeBudget({ weeklyAllowance: 150 });

    // Balance at txn1: 150 - 30 = 120
    expect(computeBudgetBalance(txn1, [txn1, txn2], budget, [period])).toBe(120);
    // Balance at txn2: 150 - 30 - 50 = 70
    expect(computeBudgetBalance(txn2, [txn1, txn2], budget, [period])).toBe(70);
  });

  it("uses id as tiebreaker when timestamps are equal", () => {
    const txnA = makeTxn({ id: "aaa", amount: 30, timestamp: ts("2025-01-15") });
    const txnB = makeTxn({ id: "bbb", amount: 50, timestamp: ts("2025-01-15") });
    const period = makePeriod({ id: "food-w2", budgetId: "food", total: 80 });
    const budget = makeBudget({ weeklyAllowance: 150 });

    // aaa comes first: 150 - 30 = 120
    expect(computeBudgetBalance(txnA, [txnA, txnB], budget, [period])).toBe(120);
    // bbb comes second: 150 - 30 - 50 = 70
    expect(computeBudgetBalance(txnB, [txnA, txnB], budget, [period])).toBe(70);
  });

  describe("rollover: none", () => {
    it("resets to weekly allowance each period", () => {
      const budget = makeBudget({ weeklyAllowance: 150, rollover: "none" });
      const periods = [
        makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 120 }),
        makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 50 }),
      ];
      const txn = makeTxn({ amount: 50, timestamp: ts("2025-01-15") });
      // Prior period: start=0, rollover=none → 150, minus total 120 = 30
      // Target period: rollover=none → 150 (resets), minus txn 50 = 100
      expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(100);
    });
  });

  describe("rollover: debt", () => {
    it("carries only negative balance to next period", () => {
      const budget = makeBudget({ weeklyAllowance: 100, rollover: "debt" });
      const periods = [
        makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 120 }),
        makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 10 }),
      ];
      const txn = makeTxn({ amount: 10, timestamp: ts("2025-01-15") });
      // Prior period: start=0, rollover=debt → min(0,0)+100=100, minus 120 = -20
      // Target period: rollover=debt → min(-20,0)+100 = 80, minus txn 10 = 70
      expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(70);
    });

    it("does not carry positive balance", () => {
      const budget = makeBudget({ weeklyAllowance: 200, rollover: "debt" });
      const periods = [
        makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
        makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 10 }),
      ];
      const txn = makeTxn({ amount: 10, timestamp: ts("2025-01-15") });
      // Prior period: start=0, rollover=debt → min(0,0)+200=200, minus 50 = 150
      // Target period: rollover=debt → min(150,0)+200 = 200 (positive, not carried), minus txn 10 = 190
      expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(190);
    });
  });

  describe("rollover: balance", () => {
    it("carries full balance forward", () => {
      const budget = makeBudget({ weeklyAllowance: 100, rollover: "balance" });
      const periods = [
        makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
        makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 }),
      ];
      const txn = makeTxn({ amount: 30, timestamp: ts("2025-01-15") });
      // Prior period: start=0, rollover=balance → 0+100=100, minus 50 = 50
      // Target period: rollover=balance → 50+100=150, minus txn 30 = 120
      expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(120);
    });

    it("carries negative balance forward", () => {
      const budget = makeBudget({ weeklyAllowance: 100, rollover: "balance" });
      const periods = [
        makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 120 }),
        makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 10 }),
      ];
      const txn = makeTxn({ amount: 10, timestamp: ts("2025-01-15") });
      // Prior period: start=0, rollover=balance → 0+100=100, minus 120 = -20
      // Target period: rollover=balance → -20+100=80, minus txn 10 = 70
      expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(70);
    });
  });

  it("handles multiple prior periods with rollover", () => {
    const budget = makeBudget({ weeklyAllowance: 100, rollover: "balance" });
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 80 }),
      makePeriod({ id: "w3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 25 }),
    ];
    const txn = makeTxn({ amount: 25, timestamp: ts("2025-01-22") });
    // w1: 0+100=100, -60=40
    // w2: 40+100=140, -80=60
    // w3: 60+100=160, -txn25=135
    expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(135);
  });

  it("only considers transactions for the same budget", () => {
    const budget = makeBudget({ id: "food", weeklyAllowance: 150 });
    const period = makePeriod({ id: "food-w2", budgetId: "food" });
    const foodTxn = makeTxn({ id: "txn-food", amount: 50, budget: "food" });
    const housingTxn = makeTxn({ id: "txn-housing", amount: 200, budget: "housing" });
    const result = computeBudgetBalance(foodTxn, [foodTxn, housingTxn], budget, [period]);
    // Only food txn counted: 150 - 50 = 100
    expect(result).toBe(100);
  });
});
