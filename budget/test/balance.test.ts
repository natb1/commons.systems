import { describe, it, expect } from "vitest";
import type { Timestamp } from "firebase/firestore";
import { weekStart, computeNetAmount, findPeriodForTimestamp, computeBudgetBalance, computeAllBudgetBalances, computePeriodBalances, computeAverageWeeklyCredits, computeRollingAverage, computeAggregateTrend, computePerBudgetTrend, computeAverageWeeklySpending, computeNetWorth, computeCashFlow, computeDerivedBalances, findLatestOverride, periodAllowance, weeklyEquivalent, periodEquivalent, computeBudgetDiffs, computePerBudgetCategoryVariance, MATERIALITY_THRESHOLD } from "../src/balance";
import type { BudgetDiff, PerBudgetStats } from "../src/balance";
import type { Budget, BudgetOverride, BudgetPeriod, Statement, Transaction, WeeklyAggregate } from "../src/firestore";

function ts(dateStr: string): Timestamp {
  const d = new Date(dateStr);
  return { toDate: () => d, toMillis: () => d.getTime() } as Timestamp;
}

function makePeriod(overrides: Partial<BudgetPeriod> & { id: string; budgetId: string }): BudgetPeriod {
  return {
    periodStart: ts("2025-01-13"),
    periodEnd: ts("2025-01-20"),
    total: 0,
    count: 0,
    categoryBreakdown: {},
    groupId: null,
    ...overrides,
  };
}

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food",
    name: "Food",
    allowance: 150,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
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
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    virtual: false,
    ...overrides,
  };
}

function makeAggregate(overrides: Partial<{id: string; weekStart: any; creditTotal: number; unbudgetedTotal: number; groupId: any}> = {}): any {
  return {
    id: "2025-01-06",
    weekStart: ts("2025-01-06"),
    creditTotal: 0,
    unbudgetedTotal: 0,
    groupId: null,
    ...overrides,
  };
}

describe("computeNetAmount", () => {
  it("returns full amount when reimbursement is 0", () => {
    expect(computeNetAmount(100, 0)).toBe(100);
  });

  it("returns zero when reimbursement is 100", () => {
    expect(computeNetAmount(389, 100)).toBe(0);
  });

  it("returns half when reimbursement is 50", () => {
    expect(computeNetAmount(200, 50)).toBe(100);
  });

  it("handles fractional reimbursement", () => {
    expect(computeNetAmount(100, 25)).toBe(75);
  });

  it("throws RangeError for reimbursement below 0", () => {
    expect(() => computeNetAmount(100, -1)).toThrow(RangeError);
  });

  it("throws RangeError for reimbursement above 100", () => {
    expect(() => computeNetAmount(100, 101)).toThrow(RangeError);
  });
});

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
    const budget = makeBudget({ allowance: 150 });
    const result = computeBudgetBalance(txn, [txn], budget, [period]);
    // allowance 150 - txn 50 = 100
    expect(result).toBe(100);
  });

  it("computes balance for single period with multiple transactions", () => {
    const txn1 = makeTxn({ id: "txn-1", amount: 30, timestamp: ts("2025-01-14") });
    const txn2 = makeTxn({ id: "txn-2", amount: 50, timestamp: ts("2025-01-16") });
    const period = makePeriod({ id: "food-w2", budgetId: "food", total: 80 });
    const budget = makeBudget({ allowance: 150 });

    // Balance at txn1: 150 - 30 = 120
    expect(computeBudgetBalance(txn1, [txn1, txn2], budget, [period])).toBe(120);
    // Balance at txn2: 150 - 30 - 50 = 70
    expect(computeBudgetBalance(txn2, [txn1, txn2], budget, [period])).toBe(70);
  });

  it("uses id as tiebreaker when timestamps are equal", () => {
    const txnA = makeTxn({ id: "aaa", amount: 30, timestamp: ts("2025-01-15") });
    const txnB = makeTxn({ id: "bbb", amount: 50, timestamp: ts("2025-01-15") });
    const period = makePeriod({ id: "food-w2", budgetId: "food", total: 80 });
    const budget = makeBudget({ allowance: 150 });

    // aaa comes first: 150 - 30 = 120
    expect(computeBudgetBalance(txnA, [txnA, txnB], budget, [period])).toBe(120);
    // bbb comes second: 150 - 30 - 50 = 70
    expect(computeBudgetBalance(txnB, [txnA, txnB], budget, [period])).toBe(70);
  });

  describe("rollover: none", () => {
    it("resets to weekly allowance each period", () => {
      const budget = makeBudget({ allowance: 150, rollover: "none" });
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
      const budget = makeBudget({ allowance: 100, rollover: "debt" });
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
      const budget = makeBudget({ allowance: 200, rollover: "debt" });
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
      const budget = makeBudget({ allowance: 100, rollover: "balance" });
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
      const budget = makeBudget({ allowance: 100, rollover: "balance" });
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
    const budget = makeBudget({ allowance: 100, rollover: "balance" });
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
    const budget = makeBudget({ id: "food", allowance: 150 });
    const period = makePeriod({ id: "food-w2", budgetId: "food" });
    const foodTxn = makeTxn({ id: "txn-food", amount: 50, budget: "food" });
    const housingTxn = makeTxn({ id: "txn-housing", amount: 200, budget: "housing" });
    const result = computeBudgetBalance(foodTxn, [foodTxn, housingTxn], budget, [period]);
    // Only food txn counted: 150 - 50 = 100
    expect(result).toBe(100);
  });

  it("returns null when txn not found in same-period transactions", () => {
    const txn = makeTxn({ id: "txn-missing", amount: 50, budget: "food" });
    const otherTxn = makeTxn({ id: "txn-other", amount: 30, budget: "food" });
    const period = makePeriod({ id: "food-w2", budgetId: "food", total: 30 });
    const budget = makeBudget();
    const result = computeBudgetBalance(txn, [otherTxn], budget, [period]);
    expect(result).toBeNull();
  });

  it("reimbursement reduces effective amount in balance", () => {
    const txn = makeTxn({ amount: 100, reimbursement: 50 });
    const period = makePeriod({ id: "food-w2", budgetId: "food", total: 50 });
    const budget = makeBudget({ allowance: 150 });
    // net = 100 * (1 - 50/100) = 50; balance = 150 - 50 = 100
    expect(computeBudgetBalance(txn, [txn], budget, [period])).toBe(100);
  });
});

describe("computeAllBudgetBalances", () => {
  it("returns empty map for no transactions", () => {
    const result = computeAllBudgetBalances([], [makeBudget()], [
      makePeriod({ id: "food-w2", budgetId: "food" }),
    ]);
    expect(result.size).toBe(0);
  });

  it("computes balance for single budget and period", () => {
    const txn = makeTxn({ id: "txn-1", amount: 50 });
    const period = makePeriod({ id: "food-w2", budgetId: "food", total: 50 });
    const budget = makeBudget({ allowance: 150 });
    const result = computeAllBudgetBalances([txn], [budget], [period]);
    expect(result.get("txn-1")).toBe(100);
  });

  it("computes balances for multi-budget with rollover", () => {
    const foodBudget = makeBudget({ id: "food", allowance: 100, rollover: "balance" });
    const vacBudget = makeBudget({ id: "vacation", allowance: 50, rollover: "none" });
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "food-w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 }),
      makePeriod({ id: "vac-w1", budgetId: "vacation", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 20 }),
    ];
    const txns = [
      makeTxn({ id: "f1", amount: 60, budget: "food", timestamp: ts("2025-01-07") }),
      makeTxn({ id: "f2", amount: 30, budget: "food", timestamp: ts("2025-01-15") }),
      makeTxn({ id: "v1", amount: 20, budget: "vacation", timestamp: ts("2025-01-08") }),
    ];
    const result = computeAllBudgetBalances(txns, [foodBudget, vacBudget], periods);
    // food-w1: 0+100=100, -60=40 → f1 balance=40
    // food-w2: 40+100=140, -30=110 → f2 balance=110
    // vac-w1: 0+50=50, -20=30 → v1 balance=30
    expect(result.get("f1")).toBe(40);
    expect(result.get("f2")).toBe(110);
    expect(result.get("v1")).toBe(30);
  });

  it("skips transactions in gaps between non-contiguous periods", () => {
    const budget = makeBudget({ allowance: 100, rollover: "balance" });
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
      makePeriod({ id: "w3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 30 }),
    ];
    const gapTxn = makeTxn({ id: "gap", amount: 25, timestamp: ts("2025-01-15") });
    const w3Txn = makeTxn({ id: "w3-txn", amount: 30, timestamp: ts("2025-01-22") });
    const result = computeAllBudgetBalances([gapTxn, w3Txn], [budget], periods);
    expect(result.has("gap")).toBe(false);
    // w1: 0+100=100, -50(total)=50; w3: 50+100=150, -30=120
    expect(result.get("w3-txn")).toBe(120);
  });

  it("uses period.total (not live transaction sums) for prior-period rollover", () => {
    const budget = makeBudget({ allowance: 100, rollover: "balance" });
    const periods = [
      // total says 60, but actual transaction sums to 40 — simulating drift
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 }),
    ];
    const txn1 = makeTxn({ id: "txn-1", amount: 40, timestamp: ts("2025-01-07") });
    const txn2 = makeTxn({ id: "txn-2", amount: 30, timestamp: ts("2025-01-15") });
    const result = computeAllBudgetBalances([txn1, txn2], [budget], periods);
    // w1: 100-40=60 (live balance for txn-1)
    expect(result.get("txn-1")).toBe(60);
    // w2 rollover uses period.total=60: 100-60=40, rollover 40+100=140, -30=110
    expect(result.get("txn-2")).toBe(110);
  });

  it("matches computeBudgetBalance cross-check", () => {
    const budget = makeBudget({ allowance: 100, rollover: "balance" });
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 25 }),
    ];
    const txn1 = makeTxn({ id: "txn-1", amount: 60, timestamp: ts("2025-01-07") });
    const txn2 = makeTxn({ id: "txn-2", amount: 25, timestamp: ts("2025-01-15") });
    const allTxns = [txn1, txn2];

    const batch = computeAllBudgetBalances(allTxns, [budget], periods);
    const single1 = computeBudgetBalance(txn1, allTxns, budget, periods);
    const single2 = computeBudgetBalance(txn2, allTxns, budget, periods);

    expect(batch.get("txn-1")).toBe(single1);
    expect(batch.get("txn-2")).toBe(single2);
  });

  describe("normalization filtering", () => {
    it("excludes non-primary normalized transactions from balances", () => {
      const budget = makeBudget({ allowance: 150 });
      const period = makePeriod({ id: "food-w2", budgetId: "food", total: 50 });
      const primary = makeTxn({
        id: "txn-primary",
        amount: 50,
        normalizedId: "doc-1",
        normalizedPrimary: true,
      });
      const nonPrimary = makeTxn({
        id: "txn-secondary",
        amount: 30,
        normalizedId: "doc-1",
        normalizedPrimary: false,
      });
      const result = computeAllBudgetBalances([primary, nonPrimary], [budget], [period]);
      expect(result.has("txn-primary")).toBe(true);
      expect(result.has("txn-secondary")).toBe(false);
    });

    it("includes primary normalized transaction with a normal balance", () => {
      const budget = makeBudget({ allowance: 150 });
      const period = makePeriod({ id: "food-w2", budgetId: "food", total: 50 });
      const primary = makeTxn({
        id: "txn-primary",
        amount: 50,
        normalizedId: "doc-1",
        normalizedPrimary: true,
      });
      const result = computeAllBudgetBalances([primary], [budget], [period]);
      // 150 - 50 = 100
      expect(result.get("txn-primary")).toBe(100);
    });

    it("includes unnormalized and primary, excludes non-primary", () => {
      const budget = makeBudget({ allowance: 200 });
      const period = makePeriod({ id: "food-w2", budgetId: "food", total: 110 });
      const unnormalized = makeTxn({
        id: "txn-unnorm",
        amount: 40,
        timestamp: ts("2025-01-14"),
        normalizedId: null,
        normalizedPrimary: true,
      });
      const primary = makeTxn({
        id: "txn-primary",
        amount: 70,
        timestamp: ts("2025-01-16"),
        normalizedId: "doc-1",
        normalizedPrimary: true,
      });
      const nonPrimary = makeTxn({
        id: "txn-secondary",
        amount: 25,
        timestamp: ts("2025-01-17"),
        normalizedId: "doc-1",
        normalizedPrimary: false,
      });
      const result = computeAllBudgetBalances(
        [unnormalized, primary, nonPrimary],
        [budget],
        [period],
      );
      // unnormalized: 200 - 40 = 160
      expect(result.get("txn-unnorm")).toBe(160);
      // primary: 160 - 70 = 90
      expect(result.get("txn-primary")).toBe(90);
      // non-primary excluded
      expect(result.has("txn-secondary")).toBe(false);
    });
  });
});

describe("computePeriodBalances", () => {
  it("single budget, single period: returns correct spent and runningBalance", () => {
    const budget = makeBudget({ id: "food", allowance: 150, rollover: "none" });
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
    ];
    const result = computePeriodBalances([budget], periods);
    const balances = result.get("food" as any)!;
    expect(balances).toHaveLength(1);
    expect(balances[0].spent).toBe(80);
    // rollover=none: applyRollover(0, 150, "none") = 150; 150 - 80 = 70
    expect(balances[0].runningBalance).toBe(70);
    expect(balances[0].periodStart.toMillis()).toBe(ts("2025-01-06").toMillis());
  });

  it("multi-period with rollover none: balance resets each period", () => {
    const budget = makeBudget({ id: "food", allowance: 100, rollover: "none" });
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 }),
    ];
    const result = computePeriodBalances([budget], periods);
    const balances = result.get("food" as any)!;
    expect(balances).toHaveLength(2);
    // w1: applyRollover(0, 100, "none") = 100; 100 - 60 = 40
    expect(balances[0].spent).toBe(60);
    expect(balances[0].runningBalance).toBe(40);
    // w2: applyRollover(40, 100, "none") = 100 (resets); 100 - 30 = 70
    expect(balances[1].spent).toBe(30);
    expect(balances[1].runningBalance).toBe(70);
  });

  it("multi-period with rollover debt: only negative carries", () => {
    const budget = makeBudget({ id: "food", allowance: 100, rollover: "debt" });
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 120 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 50 }),
    ];
    const result = computePeriodBalances([budget], periods);
    const balances = result.get("food" as any)!;
    expect(balances).toHaveLength(2);
    // w1: applyRollover(0, 100, "debt") = min(0,0)+100 = 100; 100 - 120 = -20
    expect(balances[0].spent).toBe(120);
    expect(balances[0].runningBalance).toBe(-20);
    // w2: applyRollover(-20, 100, "debt") = min(-20,0)+100 = 80; 80 - 50 = 30
    expect(balances[1].spent).toBe(50);
    expect(balances[1].runningBalance).toBe(30);
  });

  it("multi-period with rollover balance: full balance carries", () => {
    const budget = makeBudget({ id: "food", allowance: 100, rollover: "balance" });
    const periods = [
      makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
      makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 }),
    ];
    const result = computePeriodBalances([budget], periods);
    const balances = result.get("food" as any)!;
    expect(balances).toHaveLength(2);
    // w1: applyRollover(0, 100, "balance") = 0+100 = 100; 100 - 50 = 50
    expect(balances[0].spent).toBe(50);
    expect(balances[0].runningBalance).toBe(50);
    // w2: applyRollover(50, 100, "balance") = 50+100 = 150; 150 - 30 = 120
    expect(balances[1].spent).toBe(30);
    expect(balances[1].runningBalance).toBe(120);
  });

  it("multi-budget: returns separate entries per budget", () => {
    const foodBudget = makeBudget({ id: "food", allowance: 100, rollover: "none" });
    const vacBudget = makeBudget({ id: "vacation", name: "Vacation", allowance: 50, rollover: "balance" });
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "vac-w1", budgetId: "vacation", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 20 }),
    ];
    const result = computePeriodBalances([foodBudget, vacBudget], periods);
    expect(result.size).toBe(2);

    const foodBalances = result.get("food" as any)!;
    expect(foodBalances).toHaveLength(1);
    expect(foodBalances[0].spent).toBe(60);
    expect(foodBalances[0].runningBalance).toBe(40); // 100 - 60

    const vacBalances = result.get("vacation" as any)!;
    expect(vacBalances).toHaveLength(1);
    expect(vacBalances[0].spent).toBe(20);
    expect(vacBalances[0].runningBalance).toBe(30); // 50 - 20
  });

  it("empty periods: returns empty array for each budget", () => {
    const budget = makeBudget({ id: "food", allowance: 100 });
    const result = computePeriodBalances([budget], []);
    expect(result.get("food" as any)).toEqual([]);
  });

  it("budget with no matching periods: returns empty array", () => {
    const foodBudget = makeBudget({ id: "food", allowance: 100 });
    const periods = [
      makePeriod({ id: "vac-w1", budgetId: "vacation", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 20 }),
    ];
    const result = computePeriodBalances([foodBudget], periods);
    expect(result.get("food" as any)).toEqual([]);
  });
});

describe("seed data consistency", () => {
  // Verify budget period totals against a curated subset of seed transactions.
  // This subset excludes all normalized transactions (both primary and secondary)
  // to isolate standalone transaction sums. The actual seed includes
  // seed-norm-primary (amount: 25) and seed-norm-secondary (amount: 25); the
  // primary counts toward food-2025-01-20's total (70 = 25+20+25) but is omitted
  // here, so this test shows total=45 (25+20) for that period.

  interface SeedTxn { amount: number; reimbursement: number; budget: string | null; timestamp: Date }
  interface SeedPeriod { id: string; budgetId: string; periodStart: Date; periodEnd: Date; total: number }

  const seedTxns: SeedTxn[] = [
    { amount: 80, reimbursement: 0, budget: "food", timestamp: new Date("2025-01-07") },
    { amount: 40, reimbursement: 0, budget: "food", timestamp: new Date("2025-01-09") },
    { amount: 5.75, reimbursement: 0, budget: "food", timestamp: new Date("2025-01-15") },
    { amount: 142.50, reimbursement: 0, budget: "housing", timestamp: new Date("2025-01-20") },
    { amount: 25, reimbursement: 0, budget: "food", timestamp: new Date("2025-01-21") },
    { amount: 20, reimbursement: 0, budget: "food", timestamp: new Date("2025-01-23") },
    { amount: 50, reimbursement: 0, budget: "vacation", timestamp: new Date("2025-01-30") },
    { amount: 389, reimbursement: 100, budget: "vacation", timestamp: new Date("2025-02-05") },
  ];

  const seedPeriods: SeedPeriod[] = [
    { id: "food-2025-01-06", budgetId: "food", periodStart: new Date("2025-01-06"), periodEnd: new Date("2025-01-13"), total: 120 },
    { id: "food-2025-01-13", budgetId: "food", periodStart: new Date("2025-01-13"), periodEnd: new Date("2025-01-20"), total: 5.75 },
    { id: "food-2025-01-20", budgetId: "food", periodStart: new Date("2025-01-20"), periodEnd: new Date("2025-01-27"), total: 45 },
    { id: "housing-2025-01-20", budgetId: "housing", periodStart: new Date("2025-01-20"), periodEnd: new Date("2025-01-27"), total: 142.50 },
    { id: "vacation-2025-01-27", budgetId: "vacation", periodStart: new Date("2025-01-27"), periodEnd: new Date("2025-02-03"), total: 50 },
    { id: "vacation-2025-02-03", budgetId: "vacation", periodStart: new Date("2025-02-03"), periodEnd: new Date("2025-02-10"), total: 0 },
  ];

  for (const period of seedPeriods) {
    it(`${period.id}: total matches sum of net transaction amounts`, () => {
      const txnsInPeriod = seedTxns.filter(
        (t) =>
          t.budget === period.budgetId &&
          t.timestamp.getTime() >= period.periodStart.getTime() &&
          t.timestamp.getTime() < period.periodEnd.getTime(),
      );
      const expectedTotal = txnsInPeriod.reduce(
        (sum, t) => sum + computeNetAmount(t.amount, t.reimbursement),
        0,
      );
      expect(period.total).toBeCloseTo(expectedTotal, 10);
    });
  }
});

describe("computeAverageWeeklyCredits", () => {
  it("returns 0 for empty array", () => {
    expect(computeAverageWeeklyCredits([])).toBe(0);
  });

  it("returns 0 when no aggregates have credits", () => {
    const aggs = [
      makeAggregate({ id: "2025-03-10", weekStart: ts("2025-03-10"), creditTotal: 0 }),
      makeAggregate({ id: "2025-03-03", weekStart: ts("2025-03-03"), creditTotal: 0 }),
    ];
    expect(computeAverageWeeklyCredits(aggs)).toBe(0);
  });

  it("excludes latest incomplete week from window", () => {
    // Only 1 aggregate — it's the latest, so it's excluded → sum = 0
    const aggs = [
      makeAggregate({ id: "2025-03-10", weekStart: ts("2025-03-10"), creditTotal: 1200 }),
    ];
    expect(computeAverageWeeklyCredits(aggs)).toBe(0);
  });

  it("includes completed weeks but not the latest", () => {
    // Latest is 2025-03-10 (excluded), earlier week 2025-03-03 is included
    const aggs = [
      makeAggregate({ id: "2025-03-03", weekStart: ts("2025-03-03"), creditTotal: 1200 }),
      makeAggregate({ id: "2025-03-10", weekStart: ts("2025-03-10"), creditTotal: 600 }),
    ];
    // windowEnd = 2025-03-10, windowStart = 2025-03-10 - 12 weeks = 2024-12-16
    // Only 2025-03-03 is in window → 1200 / 12 = 100
    expect(computeAverageWeeklyCredits(aggs)).toBe(100);
  });

  it("excludes aggregates outside 12-week window (before windowStart)", () => {
    // Latest weekStart is 2025-03-10 → windowEnd = 2025-03-10, windowStart = 2024-12-15
    // An aggregate at 2024-12-08 is before windowStart, excluded
    const aggs = [
      makeAggregate({ id: "2024-12-08", weekStart: ts("2024-12-08"), creditTotal: 9999 }),
      makeAggregate({ id: "2025-03-03", weekStart: ts("2025-03-03"), creditTotal: 1200 }),
      makeAggregate({ id: "2025-03-10", weekStart: ts("2025-03-10"), creditTotal: 600 }),
    ];
    expect(computeAverageWeeklyCredits(aggs)).toBe(100);
  });

  it("window is anchored to latest weekStart (exclusive end)", () => {
    // Latest weekStart: 2025-03-10 → windowEnd = 2025-03-10
    // windowStart = 2025-03-10 - 12 weeks = 2024-12-16
    // Aggregate at 2024-12-16 is exactly at windowStart (inclusive)
    const aggs = [
      makeAggregate({ id: "2024-12-16", weekStart: ts("2024-12-16T00:00:00Z"), creditTotal: 240 }),
      makeAggregate({ id: "2025-03-03", weekStart: ts("2025-03-03"), creditTotal: 1200 }),
      makeAggregate({ id: "2025-03-10", weekStart: ts("2025-03-10"), creditTotal: 600 }),
    ];
    // Window: [2024-12-16, 2025-03-10) → includes 2024-12-16 (240) and 2025-03-03 (1200)
    expect(computeAverageWeeklyCredits(aggs)).toBe(120);

    // Aggregate at 2024-12-15 is just before windowStart (excluded)
    const aggsExcluded = [
      makeAggregate({ id: "2024-12-15", weekStart: ts("2024-12-15T23:59:59.999Z"), creditTotal: 9999 }),
      makeAggregate({ id: "2025-03-03", weekStart: ts("2025-03-03"), creditTotal: 1200 }),
      makeAggregate({ id: "2025-03-10", weekStart: ts("2025-03-10"), creditTotal: 600 }),
    ];
    expect(computeAverageWeeklyCredits(aggsExcluded)).toBe(100);
  });

  it("fractional creditTotal is handled correctly", () => {
    // Need at least 2 aggregates; latest is excluded
    const aggs = [
      makeAggregate({ id: "2025-03-03", weekStart: ts("2025-03-03"), creditTotal: 500 }),
      makeAggregate({ id: "2025-03-10", weekStart: ts("2025-03-10"), creditTotal: 100 }),
    ];
    expect(computeAverageWeeklyCredits(aggs)).toBeCloseTo(500 / 12, 10);
  });
});

describe("computeRollingAverage", () => {
  it("window=3 with enough data returns correct averages", () => {
    const values = [10, 20, 30, 40, 50];
    const result = computeRollingAverage(values, 3);
    // i=0: avg([10]) = 10
    // i=1: avg([10,20]) = 15
    // i=2: avg([10,20,30]) = 20
    // i=3: avg([20,30,40]) = 30
    // i=4: avg([30,40,50]) = 40
    expect(result).toEqual([10, 15, 20, 30, 40]);
  });

  it("short data (fewer points than window) averages available data", () => {
    const values = [6, 12];
    const result = computeRollingAverage(values, 5);
    // i=0: avg([6]) = 6
    // i=1: avg([6,12]) = 9
    expect(result).toEqual([6, 9]);
  });

  it("single value returns that value", () => {
    const result = computeRollingAverage([42], 3);
    expect(result).toEqual([42]);
  });
});

describe("computeAggregateTrend", () => {
  it("returns empty array for no periods", () => {
    const result = computeAggregateTrend([], []);
    expect(result).toEqual([]);
  });

  it("correct aggregation across multiple budgets per week", () => {
    // Both periods start on the same Monday -> same Sunday week
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
      makePeriod({ id: "fun-w1", budgetId: "fun", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 30 }),
    ];
    const result = computeAggregateTrend(periods, []);
    expect(result).toHaveLength(1);
    // Spending = 80 + 30 = 110, single point so avg12 and avg3 are both 110
    expect(result[0].avg12Spending).toBe(110);
    expect(result[0].avg3Spending).toBe(110);
    expect(result[0].avg12Credits).toBe(0);
  });

  it("negative-amount credit transactions produce positive avg12Credits values", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
    ];
    const txns = [
      makeTxn({ id: "credit-1", category: "Travel:Reimbursement", amount: -1200, timestamp: ts("2025-01-07"), budget: null }),
    ];
    const result = computeAggregateTrend(periods, txns);
    expect(result).toHaveLength(1);
    expect(result[0].avg12Credits).toBe(1200);
  });

  it("positive-amount transactions are excluded from avg12Credits", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
    ];
    const txns = [
      makeTxn({ id: "spend-1", category: "Income:Salary", amount: 1200, timestamp: ts("2025-01-07"), budget: null }),
    ];
    const result = computeAggregateTrend(periods, txns);
    expect(result).toHaveLength(1);
    expect(result[0].avg12Credits).toBe(0);
  });

  it("credits averages computed correctly across weeks", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
      makePeriod({ id: "food-w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 60 }),
    ];
    const txns = [
      makeTxn({ id: "credit-1", category: "Travel:Reimbursement", amount: -1200, timestamp: ts("2025-01-07"), budget: null }),
      makeTxn({ id: "credit-2", category: "Travel:Reimbursement", amount: -600, timestamp: ts("2025-01-14"), budget: null }),
    ];
    const result = computeAggregateTrend(periods, txns);
    expect(result).toHaveLength(2);
    // Week 1 credits: 1200, avg12=[1200] -> 1200
    expect(result[0].avg12Credits).toBe(1200);
    // Week 2 credits: 600, avg12=[1200,600] -> 900
    expect(result[1].avg12Credits).toBe(900);
  });

  it("excludes Transfer:CardPayment from avg12Credits", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
    ];
    const txns = [
      makeTxn({ id: "credit-1", category: "Travel:Reimbursement", amount: -1200, timestamp: ts("2025-01-07"), budget: null }),
      makeTxn({ id: "card-1", category: "Transfer:CardPayment", amount: -500, timestamp: ts("2025-01-07"), budget: null }),
    ];
    const result = computeAggregateTrend(periods, txns);
    expect(result[0].avg12Credits).toBe(1200);
  });

  it("excludes Transfer:CardPayment subcategories (e.g. :Amex) from avg12Credits", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
    ];
    const txns = [
      makeTxn({ id: "credit-1", category: "Travel:Reimbursement", amount: -1200, timestamp: ts("2025-01-07"), budget: null }),
      makeTxn({ id: "card-amex", category: "Transfer:CardPayment:Amex", amount: -150, timestamp: ts("2025-01-07"), budget: null }),
    ];
    const result = computeAggregateTrend(periods, txns);
    expect(result[0].avg12Credits).toBe(1200);
  });
});

describe("computePerBudgetTrend", () => {
  it("returns empty array for no periods", () => {
    const result = computePerBudgetTrend([], [], []);
    expect(result).toEqual([]);
  });

  it("each budget gets separate series", () => {
    const budgets = [
      makeBudget({ id: "food", name: "Food", allowance: 100 }),
      makeBudget({ id: "fun", name: "Fun", allowance: 50 }),
    ];
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
      makePeriod({ id: "fun-w1", budgetId: "fun", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 30 }),
    ];
    const result = computePerBudgetTrend(budgets, periods, []);
    const budgetNames = [...new Set(result.map(r => r.budget))];
    expect(budgetNames).toContain("Food");
    expect(budgetNames).toContain("Fun");
    // Each budget has 1 week point
    const foodPoints = result.filter(r => r.budget === "Food");
    const funPoints = result.filter(r => r.budget === "Fun");
    expect(foodPoints).toHaveLength(1);
    expect(funPoints).toHaveLength(1);
    expect(foodPoints[0].spending).toBe(80);
    expect(funPoints[0].spending).toBe(30);
  });

  it("'Other' series from aggregates with unbudgetedTotal", () => {
    const budgets = [makeBudget({ id: "food", name: "Food", allowance: 100 })];
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
    ];
    const aggs = [
      makeAggregate({ id: "2025-01-06", weekStart: ts("2025-01-06"), unbudgetedTotal: 25 }),
    ];
    const result = computePerBudgetTrend(budgets, periods, aggs);
    const otherPoints = result.filter(r => r.budget === "Other");
    expect(otherPoints.length).toBeGreaterThan(0);
    expect(otherPoints[0].spending).toBe(25);
  });

  it("no 'Other' series when unbudgetedTotal is zero", () => {
    const budgets = [makeBudget({ id: "food", name: "Food", allowance: 100 })];
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
    ];
    const aggs = [
      makeAggregate({ id: "2025-01-06", weekStart: ts("2025-01-06"), unbudgetedTotal: 0 }),
    ];
    const result = computePerBudgetTrend(budgets, periods, aggs);
    const otherPoints = result.filter(r => r.budget === "Other");
    expect(otherPoints).toHaveLength(0);
  });
});

describe("computeAverageWeeklySpending", () => {
  it("returns 0 for no periods", () => {
    expect(computeAverageWeeklySpending([])).toBe(0);
  });

  it("returns 0 for single week (only the incomplete current week)", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 100 }),
    ];
    expect(computeAverageWeeklySpending(periods)).toBe(0);
  });

  it("excludes latest incomplete week from trailing 12", () => {
    // Create 15 weeks of periods; latest excluded, calendar 12w window from week 14
    const periods: ReturnType<typeof makePeriod>[] = [];
    for (let i = 0; i < 15; i++) {
      const start = new Date(Date.UTC(2025, 0, 6 + i * 7));
      const end = new Date(Date.UTC(2025, 0, 13 + i * 7));
      periods.push(
        makePeriod({
          id: `food-w${i}`,
          budgetId: "food",
          periodStart: ts(start.toISOString()),
          periodEnd: ts(end.toISOString()),
          total: i < 2 ? 999 : 100, // first 2 weeks have large totals outside 12w window
        }),
      );
    }
    const result = computeAverageWeeklySpending(periods);
    // Completed = weeks 0-13 (latest week 14 excluded)
    // Calendar 12w window from week 14: weeks 2-13 (week 2 is exactly 12 weeks before, included with <=)
    // Weeks 2-13: 12 data weeks, all 100. Sum = 1200, avg = 1200 / 12
    expect(result).toBeCloseTo(1200 / 12);
  });

  it("fewer than 12 completed weeks divides by 12 (fixed window)", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
      makePeriod({ id: "food-w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 120 }),
      makePeriod({ id: "food-w3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 200 }),
    ];
    const result = computeAverageWeeklySpending(periods);
    // Latest week (w3) excluded, completed = w1 + w2, both within 12w of w3
    // Sum = 80 + 120 = 200, avg = 200 / 12
    expect(result).toBeCloseTo(200 / 12);
  });
});

describe("computeAggregateTrend avg12NetCredits", () => {
  it("avg12NetCredits equals avg12Credits minus avg12Spending", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
    ];
    const txns = [
      makeTxn({ id: "inc-1", category: "Income", amount: -1200, timestamp: ts("2025-01-07"), budget: null }),
    ];
    const result = computeAggregateTrend(periods, txns);
    expect(result).toHaveLength(1);
    expect(result[0].avg12NetCredits).toBeCloseTo(result[0].avg12Credits - result[0].avg12Spending, 10);
  });
});

function makeStmt(overrides: Partial<Statement> = {}): Statement {
  return {
    id: "stmt-1",
    statementId: "Bank-Checking-2025-01" as any,
    institution: "Bank",
    account: "Checking",
    balance: 1000,
    period: "2025-01",
    balanceDate: null,
    lastTransactionDate: null,
    groupId: null,
    virtual: false,
    ...overrides,
  };
}

describe("computeNetWorth", () => {
  const weeks = [
    { label: "1/5", ms: new Date("2025-01-05").getTime() },
    { label: "1/12", ms: new Date("2025-01-12").getTime() },
    { label: "1/19", ms: new Date("2025-01-19").getTime() },
  ];

  it("returns empty when no weeks", () => {
    const result = computeNetWorth([], [makeStmt()], []);
    expect(result.points).toEqual([]);
    expect(result.divergences).toEqual([]);
  });

  it("returns empty when no statements", () => {
    const result = computeNetWorth([], [], weeks);
    expect(result.points).toEqual([]);
    expect(result.divergences).toEqual([]);
  });

  it("single account with no transactions: constant balance at all weeks", () => {
    const result = computeNetWorth([], [makeStmt({ balance: 500, period: "2025-01" })], weeks);
    expect(result.points).toHaveLength(3);
    for (const p of result.points) {
      expect(p.netWorth).toBe(500);
    }
    expect(result.divergences).toEqual([]);
  });

  it("spending transaction reduces balance at later weeks", () => {
    // Anchor: 2025-01 → anchorMs=2025-02-01, balance=1000, anchorCum=200
    // Jan 5: cumSumBefore=0, balance = 1000 - (0-200) = 1200
    // Jan 12: cumSumBefore=200, balance = 1000 - (200-200) = 1000
    // Jan 19: cumSumBefore=200, balance = 1000 - (200-200) = 1000
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 200, timestamp: ts("2025-01-10"), budget: null }),
    ];
    const result = computeNetWorth(txns, [makeStmt({ balance: 1000, period: "2025-01" })], weeks);
    expect(result.points[0].netWorth).toBe(1200); // Jan 5: before spending
    expect(result.points[1].netWorth).toBe(1000); // Jan 12: after spending
    expect(result.points[2].netWorth).toBe(1000); // Jan 19: no more txns
  });

  it("sums multiple account balances for net worth", () => {
    const stmts = [
      makeStmt({ id: "s1", institution: "Bank", account: "Checking", balance: 5000, period: "2025-01" }),
      makeStmt({ id: "s2", institution: "CC", account: "Visa", balance: -1500, period: "2025-01" }),
    ];
    const result = computeNetWorth([], stmts, weeks);
    for (const p of result.points) {
      expect(p.netWorth).toBe(3500); // 5000 - 1500
    }
  });

  it("detects divergence when derived balance differs from statement", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "2024-12", balance: 800 }),
    ];
    // Multi-anchor: sorted chronologically, Dec (800) → Jan (1000).
    // Derived from Dec with no transactions = 800, but Jan says 1000 → divergence.
    const result = computeNetWorth([], stmts, weeks);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].period).toBe("2025-01");
    expect(result.divergences[0].statementBalance).toBe(1000);
    expect(result.divergences[0].derivedBalance).toBe(800);
  });

  it("no divergence when transaction accounts for balance change", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 900 }),
      makeStmt({ id: "s2", period: "2024-12", balance: 1000 }),
    ];
    // Spending of 100 between Dec and Jan statements explains the 100 drop.
    // Txn must be after Dec anchor (Jan 1) and before Jan anchor (Feb 1).
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2025-01-15"), budget: null }),
    ];
    const result = computeNetWorth(txns, stmts, weeks);
    expect(result.divergences).toHaveLength(0);
  });

  it("excludes non-primary normalized transactions", () => {
    const txns = [
      makeTxn({ id: "t-primary", institution: "Bank", account: "Checking", amount: 50,
        timestamp: ts("2025-01-10"), budget: null, normalizedId: "norm-1", normalizedPrimary: true }),
      makeTxn({ id: "t-secondary", institution: "Bank", account: "Checking", amount: 50,
        timestamp: ts("2025-01-10"), budget: null, normalizedId: "norm-1", normalizedPrimary: false }),
    ];
    const result = computeNetWorth(txns, [makeStmt({ balance: 1000, period: "2025-01" })], weeks);
    // Only primary counted: balance at Jan 5 = 1000 + 50 = 1050
    expect(result.points[0].netWorth).toBe(1050);
  });

  it("skips statements with non-YYYY-MM periods", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "accountActivityExport(3)", balance: 500, institution: "Bank2", account: "Other" }),
    ];
    const result = computeNetWorth([], stmts, weeks);
    // Bank2/Other statement is skipped — only Bank/Checking contributes
    expect(result.points).toHaveLength(3);
    for (const p of result.points) {
      expect(p.netWorth).toBe(1000);
    }
    expect(result.divergences).toEqual([]);
  });

  it("returns empty when all statements have invalid periods", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "activity(1)", balance: 500 }),
      makeStmt({ id: "s2", period: "2026-03-19_transaction_download", balance: 300 }),
    ];
    const result = computeNetWorth([], stmts, weeks);
    expect(result.points).toEqual([]);
    expect(result.divergences).toEqual([]);
  });

  it("uses balanceDate for anchor when present", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2024-12", balance: 1000, balanceDate: "2024-12-15" }),
      makeStmt({ id: "s2", period: "2025-01", balance: 900, balanceDate: "2025-01-20" }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 100,
        timestamp: ts("2025-01-10"), budget: null }),
    ];
    const result = computeNetWorth(txns, stmts, weeks);
    expect(result.divergences).toHaveLength(0);
    expect(result.points[0].netWorth).toBe(1000);
    expect(result.points[1].netWorth).toBe(900);
  });

  it("marks weeks at statement boundaries as anchored", () => {
    // Statement for 2025-01 has effectiveMs = Feb 1 (first of next month).
    // A week starting on Feb 1 should be anchored.
    const febWeeks = [
      { label: "1/19", ms: new Date("2025-01-19").getTime() },
      { label: "2/1", ms: Date.UTC(2025, 1, 1) },  // Feb 1 = anchor boundary for 2025-01 stmt
      { label: "2/9", ms: new Date("2025-02-09").getTime() },
    ];
    const result = computeNetWorth([], [makeStmt({ balance: 500, period: "2025-01" })], febWeeks);
    expect(result.points[0].isStatementAnchored).toBe(false);
    expect(result.points[1].isStatementAnchored).toBe(true);
    expect(result.points[2].isStatementAnchored).toBe(false);
  });

  it("two statements: both boundaries anchored, intermediate interpolated", () => {
    const twoStmtWeeks = [
      { label: "1/1", ms: Date.UTC(2025, 0, 1) },  // anchor for 2024-12
      { label: "1/15", ms: Date.UTC(2025, 0, 15) }, // interpolated
      { label: "2/1", ms: Date.UTC(2025, 1, 1) },   // anchor for 2025-01
    ];
    const stmts = [
      makeStmt({ id: "s1", period: "2024-12", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-01", balance: 900 }),
    ];
    const result = computeNetWorth([], stmts, twoStmtWeeks);
    expect(result.points[0].isStatementAnchored).toBe(true);
    expect(result.points[1].isStatementAnchored).toBe(false);
    expect(result.points[2].isStatementAnchored).toBe(true);
  });

  it("multi-account: anchored when any account has statement that week", () => {
    const multiWeeks = [
      { label: "1/1", ms: Date.UTC(2025, 0, 1) },  // anchor for Bank 2024-12
      { label: "2/1", ms: Date.UTC(2025, 1, 1) },   // anchor for both Bank 2025-01 and CC 2025-01
    ];
    const stmts = [
      makeStmt({ id: "s1", institution: "Bank", account: "Checking", period: "2024-12", balance: 1000 }),
      makeStmt({ id: "s2", institution: "Bank", account: "Checking", period: "2025-01", balance: 900 }),
      makeStmt({ id: "s3", institution: "CC", account: "Visa", period: "2025-01", balance: -500 }),
    ];
    const result = computeNetWorth([], stmts, multiWeeks);
    // Jan 1: anchored (Bank has 2024-12 anchor)
    expect(result.points[0].isStatementAnchored).toBe(true);
    // Feb 1: anchored (both Bank and CC have 2025-01 anchor)
    expect(result.points[1].isStatementAnchored).toBe(true);
  });

  it("multi-anchor re-anchoring eliminates drift", () => {
    // Two statements: Dec (balance=1000) and Jan (balance=800).
    // A "phantom" $50 spending between Dec and Jan would cause the old single-anchor
    // approach to show drift. With multi-anchor, the Jan boundary snaps to 800.
    const reanchorWeeks = [
      { label: "12/15", ms: Date.UTC(2024, 11, 15) },
      { label: "1/1", ms: Date.UTC(2025, 0, 1) },   // Dec anchor
      { label: "1/15", ms: Date.UTC(2025, 0, 15) },
      { label: "2/1", ms: Date.UTC(2025, 1, 1) },    // Jan anchor
      { label: "2/15", ms: Date.UTC(2025, 1, 15) },
    ];
    const stmts = [
      makeStmt({ id: "s1", period: "2024-12", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-01", balance: 800 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 150,
        timestamp: ts("2025-01-10"), budget: null }),
    ];
    const result = computeNetWorth(txns, stmts, reanchorWeeks);
    // At Feb 1 (Jan anchor), balance should snap to 800 (the actual statement balance)
    expect(result.points[3].netWorth).toBe(800);
    // At Feb 15 (after Jan anchor), no more txns, stays at 800
    expect(result.points[4].netWorth).toBe(800);
  });
});

describe("computeCashFlow", () => {
  it("returns empty for empty input", () => {
    expect(computeCashFlow([])).toEqual([]);
  });

  it("returns empty for single point (need 2 to diff)", () => {
    const points = [{ weekLabel: "1/5", weekMs: 1000, netWorth: 500, isStatementAnchored: false }];
    expect(computeCashFlow(points)).toEqual([]);
  });

  it("computes week-over-week diffs for three points", () => {
    const points = [
      { weekLabel: "1/5", weekMs: 1000, netWorth: 500, isStatementAnchored: false },
      { weekLabel: "1/12", weekMs: 2000, netWorth: 600, isStatementAnchored: true },
      { weekLabel: "1/19", weekMs: 3000, netWorth: 550, isStatementAnchored: false },
    ];
    const result = computeCashFlow(points);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ weekLabel: "1/12", weekMs: 2000, cashFlow: 100, isStatementAnchored: true });
    expect(result[1]).toEqual({ weekLabel: "1/19", weekMs: 3000, cashFlow: -50, isStatementAnchored: false });
  });

  it("carries isStatementAnchored through from source points", () => {
    const points = [
      { weekLabel: "1/5", weekMs: 1000, netWorth: 100, isStatementAnchored: true },
      { weekLabel: "1/12", weekMs: 2000, netWorth: 200, isStatementAnchored: false },
      { weekLabel: "1/19", weekMs: 3000, netWorth: 300, isStatementAnchored: true },
    ];
    const result = computeCashFlow(points);
    expect(result[0].isStatementAnchored).toBe(false);
    expect(result[1].isStatementAnchored).toBe(true);
  });

  it("produces negative cash flow when net worth decreases", () => {
    const points = [
      { weekLabel: "1/5", weekMs: 1000, netWorth: 1000, isStatementAnchored: false },
      { weekLabel: "1/12", weekMs: 2000, netWorth: 800, isStatementAnchored: false },
    ];
    const result = computeCashFlow(points);
    expect(result[0].cashFlow).toBe(-200);
  });
});

describe("computeDerivedBalances", () => {
  it("single account, consistent balances (no discrepancy)", () => {
    // Earliest: 2025-01 balance=1000. Latest: 2025-02 balance=800.
    // One transaction of 200 in the window → derived = 1000 - 200 = 800.
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-02", balance: 800 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 200, reimbursement: 0, timestamp: ts("2025-02-10"), budget: null, category: "Groceries" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    expect(result).toHaveLength(1);
    expect(result[0].institution).toBe("Bank");
    expect(result[0].account).toBe("Checking");
    expect(result[0].earliestPeriod).toBe("2025-01");
    expect(result[0].latestPeriod).toBe("2025-02");
    expect(result[0].derivedBalance).toBe(800);
    expect(result[0].statementBalance).toBe(800);
    expect(result[0].discrepancy).toBe(0);
  });

  it("single account, discrepancy between derived and statement", () => {
    // Earliest: 2025-01 balance=1000. No transactions.
    // derived = 1000, latest statement says 950 → discrepancy = 50.
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-02", balance: 950 }),
    ];
    const result = computeDerivedBalances([], stmts);
    expect(result).toHaveLength(1);
    expect(result[0].derivedBalance).toBe(1000);
    expect(result[0].statementBalance).toBe(950);
    expect(result[0].discrepancy).toBe(50);
  });

  it("multiple accounts", () => {
    const stmts = [
      makeStmt({ id: "s1", institution: "Bank", account: "Checking", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", institution: "Bank", account: "Checking", period: "2025-02", balance: 900 }),
      makeStmt({ id: "s3", institution: "CC", account: "Visa", period: "2025-01", balance: -500 }),
      makeStmt({ id: "s4", institution: "CC", account: "Visa", period: "2025-02", balance: -600 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2025-02-05"), budget: null, category: "Food" }),
      makeTxn({ id: "t2", institution: "CC", account: "Visa", amount: 100, timestamp: ts("2025-02-05"), budget: null, category: "Food" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    expect(result).toHaveLength(2);

    const checking = result.find(r => r.account === "Checking")!;
    expect(checking.derivedBalance).toBe(900); // 1000 - 100
    expect(checking.discrepancy).toBe(0);

    const visa = result.find(r => r.account === "Visa")!;
    expect(visa.derivedBalance).toBe(-600); // -500 - 100
    expect(visa.discrepancy).toBe(0);
  });

  it("non-primary normalized transactions excluded", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-02", balance: 950 }),
    ];
    const txns = [
      makeTxn({ id: "t-primary", institution: "Bank", account: "Checking", amount: 50, timestamp: ts("2025-02-10"), budget: null, category: "Food", normalizedId: "norm-1", normalizedPrimary: true }),
      makeTxn({ id: "t-secondary", institution: "Bank", account: "Checking", amount: 50, timestamp: ts("2025-02-10"), budget: null, category: "Food", normalizedId: "norm-1", normalizedPrimary: false }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    // Only primary counted: 1000 - 50 = 950
    expect(result[0].derivedBalance).toBe(950);
    expect(result[0].discrepancy).toBe(0);
  });

  it("CardPayment transactions included (they affect individual account balances)", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-02", balance: 200 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 500, timestamp: ts("2025-02-10"), budget: null, category: "Transfer:CardPayment" }),
      makeTxn({ id: "t2", institution: "Bank", account: "Checking", amount: 300, timestamp: ts("2025-02-10"), budget: null, category: "Transfer:CardPayment:Visa" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    // CardPayment included: 1000 - 500 - 300 = 200
    expect(result[0].derivedBalance).toBe(200);
    expect(result[0].discrepancy).toBe(0);
  });

  it("reimbursement applied correctly", () => {
    // Transaction of 100 with 50% reimbursement → net 50
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-02", balance: 950 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 100, reimbursement: 50, timestamp: ts("2025-02-10"), budget: null, category: "Medical" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    // net = 100 * (1 - 50/100) = 50; derived = 1000 - 50 = 950
    expect(result[0].derivedBalance).toBe(950);
    expect(result[0].discrepancy).toBe(0);
  });

  it("non-consecutive statement periods: transactions windowed across full span", () => {
    // Earliest: 2025-01, Latest: 2025-03 (no 2025-02 statement).
    // Transactions in both Feb and Mar are all in the window.
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-03", balance: 800 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2025-02-10"), budget: null, category: "Food" }),
      makeTxn({ id: "t2", institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2025-03-10"), budget: null, category: "Food" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    expect(result).toHaveLength(1);
    expect(result[0].earliestPeriod).toBe("2025-01");
    expect(result[0].latestPeriod).toBe("2025-03");
    expect(result[0].derivedBalance).toBe(800); // 1000 - 100 - 100
    expect(result[0].statementBalance).toBe(800);
    expect(result[0].discrepancy).toBe(0);
  });

  it("no valid statements returns empty result", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "accountActivityExport(3)", balance: 500 }),
      makeStmt({ id: "s2", period: "2026-03-19_transaction_download", balance: 300 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2025-02-10"), budget: null, category: "Food" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    expect(result).toEqual([]);
  });

  it("single statement per account returns empty (need at least two)", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 200, timestamp: ts("2025-02-10"), budget: null, category: "Food" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    expect(result).toEqual([]);
  });

  it("transactions with null timestamps excluded", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000 }),
      makeStmt({ id: "s2", period: "2025-02", balance: 1000 }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 200, timestamp: null, budget: null, category: "Food" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    // Null-timestamp txn excluded, so derived stays at 1000
    expect(result[0].derivedBalance).toBe(1000);
    expect(result[0].discrepancy).toBe(0);
  });

  it("mid-month balanceDate: transactions windowed correctly", () => {
    // Earliest: balanceDate 2025-01-15, Latest: balanceDate 2025-02-14.
    // Transaction on 2025-01-20 is in the window (Jan 15, Feb 14].
    // Transaction on 2025-01-10 is NOT in the window (at or before Jan 15).
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000, balanceDate: "2025-01-15" }),
      makeStmt({ id: "s2", period: "2025-02", balance: 800, balanceDate: "2025-02-14" }),
    ];
    const txns = [
      makeTxn({ id: "t-before", institution: "Bank", account: "Checking", amount: 50, timestamp: ts("2025-01-10"), budget: null, category: "Food" }),
      makeTxn({ id: "t-after", institution: "Bank", account: "Checking", amount: 200, timestamp: ts("2025-01-20"), budget: null, category: "Food" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    // Only t-after is in the window: derived = 1000 - 200 = 800
    expect(result[0].derivedBalance).toBe(800);
    expect(result[0].discrepancy).toBe(0);
  });

  it("transaction on exact boundary date is included in window", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000, balanceDate: "2025-01-15" }),
      makeStmt({ id: "s2", period: "2025-02", balance: 850, balanceDate: "2025-02-15" }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 150, timestamp: ts("2025-02-15"), budget: null, category: "Food" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    // Transaction at Feb 15 midnight UTC is at the boundary; included in (Jan 15, Feb 15] window
    expect(result[0].derivedBalance).toBe(850);
    expect(result[0].discrepancy).toBe(0);
  });

  it("fallback: statements without balanceDate use period-based boundaries", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 1000, balanceDate: null }),
      makeStmt({ id: "s2", period: "2025-02", balance: 800, balanceDate: null }),
    ];
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 200, reimbursement: 0, timestamp: ts("2025-02-10"), budget: null, category: "Groceries" }),
    ];
    const result = computeDerivedBalances(txns, stmts);
    // periodToAnchorMs("2025-01") = Feb 1, periodToAnchorMs("2025-02") = Mar 1
    // Window (Feb 1, Mar 1]: t1 at Feb 10 is included → derived = 1000 - 200 = 800
    expect(result[0].derivedBalance).toBe(800);
    expect(result[0].discrepancy).toBe(0);
  });
});

// Shared setup for override tests:
// Budget with allowance=100, rollover="balance"
// 3 consecutive weekly periods: w1 (Jan 6-13), w2 (Jan 13-20), w3 (Jan 20-27)
// Override date of Jan 13 with balance=50 (in w2)

function makeOverride(dateStr: string, balance: number): BudgetOverride {
  return { date: ts(dateStr), balance };
}

describe("findLatestOverride", () => {
  it("returns null for empty overrides", () => {
    expect(findLatestOverride([], ts("2025-01-15").toMillis())).toBeNull();
  });

  it("returns null when all overrides are after beforeMs", () => {
    const overrides = [makeOverride("2025-01-20", 50), makeOverride("2025-01-27", 75)];
    expect(findLatestOverride(overrides, ts("2025-01-15").toMillis())).toBeNull();
  });

  it("returns the only override when it is before beforeMs", () => {
    const overrides = [makeOverride("2025-01-13", 50)];
    const result = findLatestOverride(overrides, ts("2025-01-15").toMillis());
    expect(result).not.toBeNull();
    expect(result!.balance).toBe(50);
  });

  it("returns the latest override before beforeMs when there are multiple", () => {
    const overrides = [
      makeOverride("2025-01-06", 30),
      makeOverride("2025-01-13", 50),
      makeOverride("2025-01-20", 80),
    ];
    // beforeMs is Jan 15 — Jan 6 and Jan 13 qualify, Jan 20 does not
    const result = findLatestOverride(overrides, ts("2025-01-15").toMillis());
    expect(result).not.toBeNull();
    expect(result!.balance).toBe(50);
    expect(result!.date.toMillis()).toBe(ts("2025-01-13").toMillis());
  });

  it("returns override exactly at the beforeMs boundary (inclusive)", () => {
    const overrides = [makeOverride("2025-01-13", 50)];
    const result = findLatestOverride(overrides, ts("2025-01-13").toMillis());
    expect(result).not.toBeNull();
    expect(result!.balance).toBe(50);
  });
});

describe("computeBudgetBalance with overrides", () => {
  const w1 = makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 40 });
  const w2 = makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 });
  const w3 = makePeriod({ id: "w3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 25 });
  const periods = [w1, w2, w3];

  it("no override: existing behavior unchanged", () => {
    const budget = makeBudget({ allowance: 100, rollover: "balance" });
    const txn = makeTxn({ id: "txn-1", amount: 30, timestamp: ts("2025-01-15") });
    // w1: 0+100=100, -40(total)=60; w2: 60+100=160, -txn30=130
    expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(130);
  });

  it("single override in a prior period: balance starts from override", () => {
    // Override at Jan 13 (start of w2) with balance=50 — override falls in w2
    // but target txn is in w3, so override is "prior" to w3
    const budget = makeBudget({ allowance: 100, rollover: "balance", overrides: [makeOverride("2025-01-13", 50)] });
    const txn = makeTxn({ id: "txn-1", amount: 25, timestamp: ts("2025-01-22") });
    // Override in w2: running = 50 - w2.total(30) = 20
    // w3: applyRollover(20, 100, "balance") = 120, -txn25 = 95
    expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(95);
  });

  it("override in the same period as the target transaction: replaces rollover", () => {
    // Override at Jan 13 (w2), target txn also in w2
    const budget = makeBudget({ allowance: 100, rollover: "balance", overrides: [makeOverride("2025-01-13", 50)] });
    const txn = makeTxn({ id: "txn-1", amount: 30, timestamp: ts("2025-01-15") });
    // Override is in w2 (target period): running starts at 50, -txn30 = 20
    expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(20);
  });

  it("multiple overrides: latest one before the target period start is used", () => {
    // Two overrides: Jan 6 (w1) and Jan 13 (w2). Target txn in w3.
    // Latest override at or before start of w3 (Jan 20) is Jan 13.
    const budget = makeBudget({
      allowance: 100,
      rollover: "balance",
      overrides: [makeOverride("2025-01-06", 20), makeOverride("2025-01-13", 50)],
    });
    const txn = makeTxn({ id: "txn-1", amount: 25, timestamp: ts("2025-01-22") });
    // Override at Jan 13 (w2) is used: running = 50 - w2.total(30) = 20
    // w3: 20+100=120, -txn25 = 95
    expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(95);
  });

  it("override after all transactions: no effect on earlier transactions", () => {
    // Override at Jan 27 (after w3) — target txn is in w2
    const budget = makeBudget({ allowance: 100, rollover: "balance", overrides: [makeOverride("2025-01-27", 999)] });
    const txn = makeTxn({ id: "txn-1", amount: 30, timestamp: ts("2025-01-15") });
    // No applicable override for w2 target period start (Jan 13): normal behavior
    // w1: 0+100=100, -40=60; w2: 60+100=160, -txn30=130
    expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(130);
  });

  it("override with rollover: none — next period resets to just allowance", () => {
    // Override at Jan 13 (w2) with balance=200. rollover=none means w3 discards accumulated balance.
    const budget = makeBudget({ allowance: 100, rollover: "none", overrides: [makeOverride("2025-01-13", 200)] });
    const txn = makeTxn({ id: "txn-1", amount: 10, timestamp: ts("2025-01-22") });
    // w2: override → running=200, -30(total)=170
    // w3: applyRollover(170, 100, "none") = 100 (discards surplus), -txn10 = 90
    expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(90);
  });

  it("override with rollover: debt — next period carries only negative balance", () => {
    // Override at Jan 13 (w2) with positive balance=200. rollover=debt carries min(running, 0).
    const budget = makeBudget({ allowance: 100, rollover: "debt", overrides: [makeOverride("2025-01-13", 200)] });
    const txn = makeTxn({ id: "txn-1", amount: 10, timestamp: ts("2025-01-22") });
    // w2: override → running=200, -30(total)=170
    // w3: applyRollover(170, 100, "debt") = min(170,0)+100 = 100 (positive balance discarded), -txn10 = 90
    expect(computeBudgetBalance(txn, [txn], budget, periods)).toBe(90);
  });

  it("override date in gap between non-contiguous periods: silently ignored", () => {
    // Periods w1 (Jan 6-13) and w3 (Jan 20-27) with a gap (no w2). Override at Jan 15 (in gap).
    const gapPeriods = [w1, w3];
    const budget = makeBudget({ allowance: 100, rollover: "balance", overrides: [makeOverride("2025-01-15", 999)] });
    const txn = makeTxn({ id: "txn-1", amount: 10, timestamp: ts("2025-01-22") });
    // Override at Jan 15 falls in no period (gap), so overridePeriodIdx = -1 → ignored.
    // Normal behavior: w1: 0+100-40=60; w3: 60+100=160, -txn10 = 150
    expect(computeBudgetBalance(txn, [txn], budget, gapPeriods)).toBe(150);
  });
});

describe("computePeriodBalances with overrides", () => {
  const w1 = makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 40 });
  const w2 = makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 });
  const w3 = makePeriod({ id: "w3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 25 });

  it("override in the first period: replaces initial balance", () => {
    // Override at Jan 6 (start of w1) with balance=50
    const budget = makeBudget({ id: "food", allowance: 100, rollover: "balance", overrides: [makeOverride("2025-01-06", 50)] });
    const result = computePeriodBalances([budget], [w1, w2, w3]);
    const balances = result.get("food" as any)!;
    expect(balances).toHaveLength(3);
    // w1: override in period → running=50; accumulated = 50-40=10
    expect(balances[0].runningBalance).toBe(10);
    // w2: applyRollover(10, 100, "balance") = 110; 110-30=80
    expect(balances[1].runningBalance).toBe(80);
    // w3: applyRollover(80, 100, "balance") = 180; 180-25=155
    expect(balances[2].runningBalance).toBe(155);
  });

  it("override in a middle period: resets accumulated balance", () => {
    // Override at Jan 13 (start of w2) with balance=50
    const budget = makeBudget({ id: "food", allowance: 100, rollover: "balance", overrides: [makeOverride("2025-01-13", 50)] });
    const result = computePeriodBalances([budget], [w1, w2, w3]);
    const balances = result.get("food" as any)!;
    expect(balances).toHaveLength(3);
    // w1: no override → applyRollover(0, 100, "balance") = 100; 100-40=60
    expect(balances[0].runningBalance).toBe(60);
    // w2: override in period (Jan 13 in [Jan13, Jan20)) → running=50; 50-30=20
    expect(balances[1].runningBalance).toBe(20);
    // w3: applyRollover(20, 100, "balance") = 120; 120-25=95
    expect(balances[2].runningBalance).toBe(95);
  });

  it("rollover resumes normally after the override period", () => {
    // Override only in w2; w3 should use normal rollover from w2's result
    const budget = makeBudget({ id: "food", allowance: 100, rollover: "balance", overrides: [makeOverride("2025-01-13", 50)] });
    const w4 = makePeriod({ id: "w4", budgetId: "food", periodStart: ts("2025-01-27"), periodEnd: ts("2025-02-03"), total: 10 });
    const result = computePeriodBalances([budget], [w1, w2, w3, w4]);
    const balances = result.get("food" as any)!;
    expect(balances).toHaveLength(4);
    // w2 ends at 20 (from test above); w3: 20+100=120, -25=95; w4: 95+100=195, -10=185
    expect(balances[3].runningBalance).toBe(185);
  });
});

describe("computeAllBudgetBalances with overrides", () => {
  it("override applies and cross-checks against computeBudgetBalance", () => {
    const w1 = makePeriod({ id: "w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 40 });
    const w2 = makePeriod({ id: "w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 });
    const w3 = makePeriod({ id: "w3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 25 });
    const periods = [w1, w2, w3];

    // Override at Jan 13 (w2) with balance=50
    const budget = makeBudget({ allowance: 100, rollover: "balance", overrides: [makeOverride("2025-01-13", 50)] });

    const txn1 = makeTxn({ id: "txn-w2", amount: 30, timestamp: ts("2025-01-15") });
    const txn2 = makeTxn({ id: "txn-w3", amount: 25, timestamp: ts("2025-01-22") });
    const allTxns = [txn1, txn2];

    const batch = computeAllBudgetBalances(allTxns, [budget], periods);
    const single1 = computeBudgetBalance(txn1, allTxns, budget, periods);
    const single2 = computeBudgetBalance(txn2, allTxns, budget, periods);

    expect(batch.get("txn-w2")).toBe(single1);
    expect(batch.get("txn-w3")).toBe(single2);

    // Verify concrete values:
    // txn-w2 (w2, override in period): running=50, -30=20
    expect(batch.get("txn-w2")).toBe(20);
    // txn-w3 (w3, override prior): running=50-30(w2.total)=20, w3: 20+100=120, -25=95
    expect(batch.get("txn-w3")).toBe(95);
  });
});

describe("periodAllowance", () => {
  it("weekly: always returns full allowance", () => {
    expect(periodAllowance(100, "weekly", null, Date.parse("2025-01-06"))).toBe(100);
    expect(periodAllowance(100, "weekly", Date.parse("2025-01-06"), Date.parse("2025-01-13"))).toBe(100);
  });

  it("monthly: first period always gets full allowance", () => {
    expect(periodAllowance(500, "monthly", null, Date.parse("2025-01-06"))).toBe(500);
  });

  it("monthly: returns full allowance at month boundary", () => {
    // Jan 27 → Feb 3: different months
    expect(periodAllowance(500, "monthly", Date.parse("2025-01-27"), Date.parse("2025-02-03"))).toBe(500);
  });

  it("monthly: returns 0 within same month", () => {
    // Jan 6 → Jan 13: same month
    expect(periodAllowance(500, "monthly", Date.parse("2025-01-06"), Date.parse("2025-01-13"))).toBe(0);
  });

  it("monthly: year boundary counts as month boundary", () => {
    // Dec 29 → Jan 5: different year
    expect(periodAllowance(500, "monthly", Date.parse("2024-12-29"), Date.parse("2025-01-05"))).toBe(500);
  });

  it("quarterly: first period gets full allowance", () => {
    expect(periodAllowance(1200, "quarterly", null, Date.parse("2025-01-06"))).toBe(1200);
  });

  it("quarterly: returns 0 within same quarter", () => {
    // Jan 6 → Feb 3: same Q1
    expect(periodAllowance(1200, "quarterly", Date.parse("2025-01-06"), Date.parse("2025-02-03"))).toBe(0);
  });

  it("quarterly: cross-quarter boundary", () => {
    // Mar 24 → Apr 7: Q1 → Q2
    expect(periodAllowance(1200, "quarterly", Date.parse("2025-03-24"), Date.parse("2025-04-07"))).toBe(1200);
  });

  it("quarterly: cross-year boundary", () => {
    // Dec 29 → Jan 5: Q4 → Q1
    expect(periodAllowance(1200, "quarterly", Date.parse("2024-12-29"), Date.parse("2025-01-05"))).toBe(1200);
  });
});

describe("weeklyEquivalent", () => {
  it("weekly: returns allowance unchanged", () => {
    expect(weeklyEquivalent(150, "weekly")).toBe(150);
  });

  it("monthly: converts to weekly equivalent", () => {
    expect(weeklyEquivalent(500, "monthly")).toBeCloseTo(500 * 12 / 52, 10);
  });

  it("quarterly: converts to weekly equivalent", () => {
    expect(weeklyEquivalent(1200, "quarterly")).toBeCloseTo(1200 * 4 / 52, 10);
  });
});

describe("monthly allowance in computePeriodBalances", () => {
  it("accumulates monthly allowance only at month boundaries", () => {
    const budget = makeBudget({
      allowance: 500,
      allowancePeriod: "monthly",
      rollover: "balance",
    });
    // 3 periods: Jan 6, Jan 13, Feb 3 — first gets 500, second gets 0, third gets 500 (new month)
    const periods = [
      makePeriod({ id: "p1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 100 }),
      makePeriod({ id: "p2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 50 }),
      makePeriod({ id: "p3", budgetId: "food", periodStart: ts("2025-02-03"), periodEnd: ts("2025-02-10"), total: 200 }),
    ];
    const result = computePeriodBalances([budget], periods);
    const balances = result.get("food")!;
    // p1: rollover(0, 500, balance) = 500; 500 - 100 = 400
    expect(balances[0].runningBalance).toBe(400);
    // p2: rollover(400, 0, balance) = 400; 400 - 50 = 350
    expect(balances[1].runningBalance).toBe(350);
    // p3: rollover(350, 500, balance) = 850; 850 - 200 = 650
    expect(balances[2].runningBalance).toBe(650);
  });

  it("weekly budget is unaffected by monthly logic", () => {
    const budget = makeBudget({
      allowance: 100,
      allowancePeriod: "weekly",
      rollover: "balance",
    });
    const periods = [
      makePeriod({ id: "p1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 60 }),
      makePeriod({ id: "p2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 30 }),
    ];
    const result = computePeriodBalances([budget], periods);
    const balances = result.get("food")!;
    // p1: 100 - 60 = 40
    expect(balances[0].runningBalance).toBe(40);
    // p2: 40 + 100 - 30 = 110
    expect(balances[1].runningBalance).toBe(110);
  });

  it("monthly allowance with override interaction", () => {
    const budget = makeBudget({
      allowance: 500,
      allowancePeriod: "monthly",
      rollover: "balance",
      overrides: [{ date: ts("2025-01-13"), balance: 200 }],
    });
    const periods = [
      makePeriod({ id: "p1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 100 }),
      makePeriod({ id: "p2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 50 }),
      makePeriod({ id: "p3", budgetId: "food", periodStart: ts("2025-02-03"), periodEnd: ts("2025-02-10"), total: 80 }),
    ];
    const result = computePeriodBalances([budget], periods);
    const balances = result.get("food")!;
    // p1: rollover(0, 500, balance) = 500; 500 - 100 = 400
    expect(balances[0].runningBalance).toBe(400);
    // p2: override at Jan 13 => running = 200; 200 - 50 = 150
    expect(balances[1].runningBalance).toBe(150);
    // p3: rollover(150, 500, balance) = 650; 650 - 80 = 570
    expect(balances[2].runningBalance).toBe(570);
  });
});

describe("weekStart", () => {
  it("a Monday returns the same Monday 00:00 UTC", () => {
    // 2025-01-13 is a Monday
    const monday = Date.UTC(2025, 0, 13, 10, 30, 0);
    const result = weekStart(monday);
    expect(result).toBe(Date.UTC(2025, 0, 13, 0, 0, 0, 0));
  });

  it("a Wednesday returns the previous Monday", () => {
    // 2025-01-15 is a Wednesday
    const wednesday = Date.UTC(2025, 0, 15, 14, 0, 0);
    const result = weekStart(wednesday);
    expect(result).toBe(Date.UTC(2025, 0, 13, 0, 0, 0, 0));
  });

  it("a Sunday returns the previous Monday", () => {
    // 2025-01-19 is a Sunday
    const sunday = Date.UTC(2025, 0, 19, 23, 59, 59);
    const result = weekStart(sunday);
    expect(result).toBe(Date.UTC(2025, 0, 13, 0, 0, 0, 0));
  });

  it("handles New Year's boundary", () => {
    // 2025-01-01 is a Wednesday; previous Monday is 2024-12-30
    const newYear = Date.UTC(2025, 0, 1, 12, 0, 0);
    const result = weekStart(newYear);
    expect(result).toBe(Date.UTC(2024, 11, 30, 0, 0, 0, 0));
  });
});

describe("computeBudgetDiffs", () => {
  it("returns full allowance as diff and zero averages when no periods exist", () => {
    const budgets = [
      makeBudget({ id: "food", allowance: 150 }),
      makeBudget({ id: "housing", name: "Housing", allowance: 400 }),
    ];
    const result = computeBudgetDiffs(budgets, []);
    expect(result.get("food")!.diff).toEqual({ diff12: 150, diff52: 150 } satisfies BudgetDiff);
    expect(result.get("food")!.avg).toEqual({ avg12: 0, avg52: 0 });
    expect(result.get("housing")!.diff).toEqual({ diff12: 400, diff52: 400 } satisfies BudgetDiff);
    expect(result.get("housing")!.avg).toEqual({ avg12: 0, avg52: 0 });
  });

  it("excludes latest week and divides by weekCount for multiple budgets", () => {
    const budgets = [
      makeBudget({ id: "food", allowance: 150 }),
      makeBudget({ id: "fun", name: "Fun", allowance: 100 }),
    ];

    // 15 weeks: latest (week 14) excluded -> 14 completed weeks (0-13)
    // Weeks 0-11: food=200/week, fun=50/week
    // Weeks 12-13: food=100/week, fun=150/week
    const periods: BudgetPeriod[] = [];
    for (let i = 0; i < 15; i++) {
      const weekSunday = new Date(Date.UTC(2025, 0, 5 + i * 7));
      const nextSunday = new Date(Date.UTC(2025, 0, 12 + i * 7));
      const foodTotal = i < 12 ? 200 : 100;
      const funTotal = i < 12 ? 50 : 150;
      periods.push(
        makePeriod({ id: `food-w${i}`, budgetId: "food", periodStart: ts(weekSunday.toISOString()), periodEnd: ts(nextSunday.toISOString()), total: foodTotal }),
        makePeriod({ id: `fun-w${i}`, budgetId: "fun", periodStart: ts(weekSunday.toISOString()), periodEnd: ts(nextSunday.toISOString()), total: funTotal }),
      );
    }

    const result = computeBudgetDiffs(budgets, periods);

    // food: 14 completed weeks. Last 12 = weeks 2-13 = 10*200 + 2*100 = 2200, avg = 2200/12
    // 52-week trailing: all 14 completed = 12*200+2*100 = 2600, avg = 2600/52
    const foodStats = result.get("food")!;
    expect(foodStats.diff.diff12).toBeCloseTo(150 - 2200 / 12, 5);
    expect(foodStats.diff.diff52).toBeCloseTo(150 - 2600 / 52, 5);
    expect(foodStats.avg.avg12).toBeCloseTo(2200 / 12, 5);
    expect(foodStats.avg.avg52).toBeCloseTo(2600 / 52, 5);

    // fun: Last 12 completed = weeks 2-13 = 10*50 + 2*150 = 800, avg = 800/12
    // 52-week trailing: all 14 completed = 12*50+2*150 = 900, avg = 900/52
    const funStats = result.get("fun")!;
    expect(funStats.diff.diff12).toBeCloseTo(100 - 800 / 12, 5);
    expect(funStats.diff.diff52).toBeCloseTo(100 - 900 / 52, 5);
    expect(funStats.avg.avg12).toBeCloseTo(800 / 12, 5);
    expect(funStats.avg.avg52).toBeCloseTo(900 / 52, 5);
  });

  it("returns avg12 and avg52 excluding the latest incomplete week", () => {
    const budget = makeBudget({ id: "food", name: "Food" });
    // 5 weekly periods: latest (Feb 3) is excluded as incomplete
    const periods = [
      makePeriod({ id: "p1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 100 }),
      makePeriod({ id: "p2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 200 }),
      makePeriod({ id: "p3", budgetId: "food", periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"), total: 150 }),
      makePeriod({ id: "p4", budgetId: "food", periodStart: ts("2025-01-27"), periodEnd: ts("2025-02-03"), total: 250 }),
      makePeriod({ id: "p5", budgetId: "food", periodStart: ts("2025-02-03"), periodEnd: ts("2025-02-10"), total: 999 }),
    ];
    const result = computeBudgetDiffs([budget], periods);
    const avg = result.get("food")!.avg;
    // Completed weeks: Jan 6-Jan 27 (4 weeks, all within 12w of latest Feb 3)
    // avg12 = (100+200+150+250) / 12 = 700/12
    expect(avg.avg12).toBeCloseTo(700 / 12);
    expect(avg.avg52).toBeCloseTo(700 / 52);
  });

  it("separates averages by budget, excluding the global latest week", () => {
    const budgets = [
      makeBudget({ id: "food", name: "Food" }),
      makeBudget({ id: "fun", name: "Fun" }),
    ];
    const periods = [
      makePeriod({ id: "f1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 100 }),
      makePeriod({ id: "f2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 200 }),
      makePeriod({ id: "n1", budgetId: "fun", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
      makePeriod({ id: "n2", budgetId: "fun", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 70 }),
    ];
    const result = computeBudgetDiffs(budgets, periods);
    // Global latest week is Jan 13; excluded from both budgets
    // Each has 1 completed week within 12w window, divided by 12
    expect(result.get("food")!.avg.avg12).toBeCloseTo(100 / 12);
    expect(result.get("fun")!.avg.avg12).toBeCloseTo(50 / 12);
  });

  it("sparse data: only includes weeks within calendar window", () => {
    const budget = makeBudget({ id: "transport", name: "Transport" });
    // 3 periods spanning a large gap; latest (Aug 11) excluded, leaving Jan 6 and Aug 4
    // Jan 6 is ~30 weeks before Aug 11, so outside the 12w window but inside 52w
    const periods = [
      makePeriod({ id: "p1", budgetId: "transport", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 200 }),
      makePeriod({ id: "p2", budgetId: "transport", periodStart: ts("2025-08-04"), periodEnd: ts("2025-08-11"), total: 100 }),
      makePeriod({ id: "p3", budgetId: "transport", periodStart: ts("2025-08-11"), periodEnd: ts("2025-08-18"), total: 50 }),
    ];
    const result = computeBudgetDiffs([budget], periods);
    const avg = result.get("transport")!.avg;
    // 12w: only Aug 4 (100) is within 12 calendar weeks of Aug 11 -> 100/12
    expect(avg.avg12).toBeCloseTo(100 / 12);
    // 52w: both Jan 6 (200) and Aug 4 (100) are within 52 weeks -> 300/52
    expect(avg.avg52).toBeCloseTo(300 / 52);
  });

  it("12-week calendar window excludes old data from avg12 but not avg52", () => {
    const budget = makeBudget({ id: "food", name: "Food" });
    // Create 15 weekly periods; latest (week 14) excluded -> 14 completed weeks (0-13)
    const periods: ReturnType<typeof makePeriod>[] = [];
    for (let i = 0; i < 15; i++) {
      const start = new Date(Date.UTC(2025, 0, 6 + i * 7));
      const end = new Date(Date.UTC(2025, 0, 13 + i * 7));
      periods.push(makePeriod({
        id: `p${i}`,
        budgetId: "food",
        periodStart: ts(start.toISOString()),
        periodEnd: ts(end.toISOString()),
        total: i < 2 ? 1000 : 100, // first 2 weeks high, rest low
      }));
    }
    const result = computeBudgetDiffs([budget], periods);
    const avg = result.get("food")!.avg;
    // 12w: weeks 2-13 (12 weeks x 100) / 12 = 1200/12
    expect(avg.avg12).toBeCloseTo(1200 / 12);
    // 52w: all 14 completed weeks -> (2*1000 + 12*100) / 52 = 3200/52
    expect(avg.avg52).toBeCloseTo(3200 / 52);
  });

  it("returns avg12=0 when all data is outside the 12-week window", () => {
    const budget = makeBudget({ id: "default", name: "Default" });
    // Data from Jan, but latest week is in Aug -- Jan data is >12 weeks old
    const periods = [
      makePeriod({ id: "p1", budgetId: "default", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 500 }),
      makePeriod({ id: "p2", budgetId: "other", periodStart: ts("2025-08-04"), periodEnd: ts("2025-08-11"), total: 10 }),
    ];
    const budgets = [budget, makeBudget({ id: "other", name: "Other" })];
    const result = computeBudgetDiffs(budgets, periods);
    const avg = result.get("default")!.avg;
    // Jan 6 is ~30 weeks before Aug 4 -> outside 12w window
    expect(avg.avg12).toBe(0);
    // But within 52w window -> 500/52
    expect(avg.avg52).toBeCloseTo(500 / 52);
  });
});

describe("computePerBudgetCategoryVariance", () => {
  it("returns empty windows when no periods exist", () => {
    const budgets = [makeBudget({ id: "food" })];
    const result = computePerBudgetCategoryVariance(budgets, []);
    expect(result.get("food")).toEqual({ window12: [], window52: [] });
  });

  it("produces a single category with 100% share when only one category is present", () => {
    const budget = makeBudget({ id: "food" });
    // Latest week (p3, Jan 20) is excluded; p1 is the only completed week within 12w window.
    const periods = [
      makePeriod({
        id: "p1", budgetId: "food",
        periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"),
        categoryBreakdown: { "Food:Groceries": 120 },
      }),
      makePeriod({
        id: "p3", budgetId: "food",
        periodStart: ts("2025-01-20"), periodEnd: ts("2025-01-27"),
        categoryBreakdown: { "Food:Groceries": 999 },
      }),
    ];
    const result = computePerBudgetCategoryVariance([budget], periods);
    const w12 = result.get("food")!.window12;
    expect(w12).toHaveLength(1);
    expect(w12[0].category).toBe("Food:Groceries");
    expect(w12[0].avgWeekly).toBeCloseTo(120 / 12);
    expect(w12[0].percentOfActual).toBeCloseTo(100);
    expect(w12[0].isOther).toBe(false);
  });

  it("groups sub-threshold categories into Other", () => {
    const budget = makeBudget({ id: "food" });
    // One completed week (Jan 6); latest week (Jan 13) excluded.
    // Restaurants: 95 = 95% share (material), Coffee: 4 = 4% (< 5%, grouped), Tip: 1 = 1% (grouped).
    const periods = [
      makePeriod({
        id: "p1", budgetId: "food",
        periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"),
        categoryBreakdown: {
          "Food:Restaurants": 95,
          "Food:Coffee": 4,
          "Food:Tip": 1,
        },
      }),
      makePeriod({
        id: "p2", budgetId: "food",
        periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"),
        categoryBreakdown: {},
      }),
    ];
    const result = computePerBudgetCategoryVariance([budget], periods);
    const w12 = result.get("food")!.window12;
    expect(w12).toHaveLength(2);
    expect(w12[0].category).toBe("Food:Restaurants");
    expect(w12[0].isOther).toBe(false);
    expect(w12[1].category).toBe("Other");
    expect(w12[1].isOther).toBe(true);
    expect(w12[1].avgWeekly).toBeCloseTo(5 / 12);
  });

  it("keeps both categories when each meets the materiality threshold", () => {
    const budget = makeBudget({ id: "food" });
    const periods = [
      makePeriod({
        id: "p1", budgetId: "food",
        periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"),
        categoryBreakdown: {
          "Food:Restaurants": 94,
          "Food:Coffee": 6,
        },
      }),
      makePeriod({
        id: "p2", budgetId: "food",
        periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"),
        categoryBreakdown: {},
      }),
    ];
    const result = computePerBudgetCategoryVariance([budget], periods);
    const w12 = result.get("food")!.window12;
    expect(w12.map(v => v.category)).toEqual(["Food:Restaurants", "Food:Coffee"]);
    expect(w12.every(v => !v.isOther)).toBe(true);
  });

  it("divides by the window weekCount, matching trailingAvg semantics", () => {
    const budget = makeBudget({ id: "food" });
    // Create 14 completed weeks with 120 spent in one category each week; latest week is incomplete.
    const periods: BudgetPeriod[] = [];
    for (let i = 0; i < 15; i++) {
      const start = new Date(Date.UTC(2025, 0, 6 + i * 7));
      const end = new Date(Date.UTC(2025, 0, 13 + i * 7));
      periods.push(makePeriod({
        id: `p${i}`, budgetId: "food",
        periodStart: ts(start.toISOString()), periodEnd: ts(end.toISOString()),
        categoryBreakdown: { "Food:Groceries": 120 },
      }));
    }
    const result = computePerBudgetCategoryVariance([budget], periods);
    const w12 = result.get("food")!.window12;
    const w52 = result.get("food")!.window52;
    // 12w: last 12 completed weeks (weeks 2-13) × 120 = 1440 ÷ 12 = 120
    expect(w12[0].avgWeekly).toBeCloseTo(1440 / 12);
    // 52w: all 14 completed weeks × 120 = 1680 ÷ 52
    expect(w52[0].avgWeekly).toBeCloseTo(1680 / 52);
  });

  it("excludes the global latest week", () => {
    const budgets = [
      makeBudget({ id: "food" }),
      makeBudget({ id: "fun" }),
    ];
    // Global latest = Jan 13. Food has Jan 6 + Jan 13; Fun has only Jan 13. Fun should have 0 completed weeks.
    const periods = [
      makePeriod({
        id: "f1", budgetId: "food",
        periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"),
        categoryBreakdown: { "Food:Groceries": 100 },
      }),
      makePeriod({
        id: "f2", budgetId: "food",
        periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"),
        categoryBreakdown: { "Food:Groceries": 999 },
      }),
      makePeriod({
        id: "n1", budgetId: "fun",
        periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"),
        categoryBreakdown: { "Fun:Games": 50 },
      }),
    ];
    const result = computePerBudgetCategoryVariance(budgets, periods);
    expect(result.get("food")!.window12[0].avgWeekly).toBeCloseTo(100 / 12);
    expect(result.get("fun")!.window12).toEqual([]);
  });

  it("returns empty when total actual is zero", () => {
    const budget = makeBudget({ id: "food" });
    const periods = [
      makePeriod({
        id: "p1", budgetId: "food",
        periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"),
        categoryBreakdown: { "Food:Groceries": 0 },
      }),
      makePeriod({
        id: "p2", budgetId: "food",
        periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"),
        categoryBreakdown: {},
      }),
    ];
    const result = computePerBudgetCategoryVariance([budget], periods);
    expect(result.get("food")!.window12).toEqual([]);
  });

  it("separates window12 and window52 when data only exists in the 52w window", () => {
    const budget = makeBudget({ id: "transport" });
    // Jan 6 is ~30 weeks before Aug 4 (latest week is Aug 11, excluded).
    const periods = [
      makePeriod({
        id: "p1", budgetId: "transport",
        periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"),
        categoryBreakdown: { "Transport:Gas": 200 },
      }),
      makePeriod({
        id: "p2", budgetId: "transport",
        periodStart: ts("2025-08-11"), periodEnd: ts("2025-08-18"),
        categoryBreakdown: { "Transport:Gas": 999 },
      }),
    ];
    const result = computePerBudgetCategoryVariance([budget], periods);
    expect(result.get("transport")!.window12).toEqual([]);
    const w52 = result.get("transport")!.window52;
    expect(w52).toHaveLength(1);
    expect(w52[0].avgWeekly).toBeCloseTo(200 / 52);
  });

  it("exposes MATERIALITY_THRESHOLD as 5%", () => {
    expect(MATERIALITY_THRESHOLD).toBe(0.05);
  });
});
