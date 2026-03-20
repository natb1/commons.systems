import { describe, it, expect } from "vitest";
import type { Timestamp } from "firebase/firestore";
import { computeNetAmount, findPeriodForTimestamp, computeBudgetBalance, computeAllBudgetBalances, computePeriodBalances, computeAverageWeeklyIncome, computeRollingAverage, computeAggregateTrend, computePerBudgetTrend, computeAverageWeeklySpending, computeNetWorth } from "../src/balance";
import type { Statement } from "../src/firestore";
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
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
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
    const budget = makeBudget({ weeklyAllowance: 150 });
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
    const budget = makeBudget({ weeklyAllowance: 150 });
    const result = computeAllBudgetBalances([txn], [budget], [period]);
    expect(result.get("txn-1")).toBe(100);
  });

  it("computes balances for multi-budget with rollover", () => {
    const foodBudget = makeBudget({ id: "food", weeklyAllowance: 100, rollover: "balance" });
    const vacBudget = makeBudget({ id: "vacation", weeklyAllowance: 50, rollover: "none" });
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
    const budget = makeBudget({ weeklyAllowance: 100, rollover: "balance" });
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
    const budget = makeBudget({ weeklyAllowance: 100, rollover: "balance" });
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
    const budget = makeBudget({ weeklyAllowance: 100, rollover: "balance" });
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
      const budget = makeBudget({ weeklyAllowance: 150 });
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
      const budget = makeBudget({ weeklyAllowance: 150 });
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
      const budget = makeBudget({ weeklyAllowance: 200 });
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
    const budget = makeBudget({ id: "food", weeklyAllowance: 150, rollover: "none" });
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
    const budget = makeBudget({ id: "food", weeklyAllowance: 100, rollover: "none" });
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
    const budget = makeBudget({ id: "food", weeklyAllowance: 100, rollover: "debt" });
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
    const budget = makeBudget({ id: "food", weeklyAllowance: 100, rollover: "balance" });
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
    const foodBudget = makeBudget({ id: "food", weeklyAllowance: 100, rollover: "none" });
    const vacBudget = makeBudget({ id: "vacation", name: "Vacation", weeklyAllowance: 50, rollover: "balance" });
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
    const budget = makeBudget({ id: "food", weeklyAllowance: 100 });
    const result = computePeriodBalances([budget], []);
    expect(result.get("food" as any)).toEqual([]);
  });

  it("budget with no matching periods: returns empty array", () => {
    const foodBudget = makeBudget({ id: "food", weeklyAllowance: 100 });
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

describe("computeAverageWeeklyIncome", () => {
  it("returns 0 for empty array", () => {
    expect(computeAverageWeeklyIncome([])).toBe(0);
  });

  it("returns 0 when no income transactions", () => {
    const txns = [
      makeTxn({ id: "t1", category: "Food", amount: 100, timestamp: ts("2025-03-10T12:00:00Z") }),
      makeTxn({ id: "t2", category: "Housing", amount: 200, timestamp: ts("2025-03-11T12:00:00Z") }),
    ];
    expect(computeAverageWeeklyIncome(txns)).toBe(0);
  });

  it("single income txn returns amount / 12", () => {
    const txns = [
      makeTxn({ id: "t1", category: "Income", amount: 1200, timestamp: ts("2025-03-10T12:00:00Z") }),
    ];
    expect(computeAverageWeeklyIncome(txns)).toBe(100);
  });

  it("negative income amounts (credit convention) produce positive result", () => {
    // Uploaded bank data uses negative amounts for credits (money received)
    const txns = [
      makeTxn({ id: "t1", category: "Income", amount: -1200, timestamp: ts("2025-03-10T12:00:00Z") }),
    ];
    expect(computeAverageWeeklyIncome(txns)).toBe(100);
  });

  it("multiple income txns within window are summed then divided by 12", () => {
    // Two txns in the same week
    const txns = [
      makeTxn({ id: "t1", category: "Income", amount: 600, timestamp: ts("2025-03-10T12:00:00Z") }),
      makeTxn({ id: "t2", category: "Income", amount: 600, timestamp: ts("2025-03-12T12:00:00Z") }),
    ];
    expect(computeAverageWeeklyIncome(txns)).toBe(100);
  });

  it("excludes txns outside 12-week window (before windowStart)", () => {
    // Latest txn is on Monday 2025-03-10 → week end = next Monday = 2025-03-17
    // windowStart = 2025-03-17 minus 12 weeks = 2024-12-23T00:00:00Z
    // A txn on 2024-12-22 is before windowStart and should be excluded
    const txns = [
      makeTxn({ id: "old", category: "Income", amount: 9999, timestamp: ts("2024-12-22T23:59:59Z") }),
      makeTxn({ id: "recent", category: "Income", amount: 1200, timestamp: ts("2025-03-10T12:00:00Z") }),
    ];
    // Only 1200 counts → 1200/12 = 100
    expect(computeAverageWeeklyIncome(txns)).toBe(100);
  });

  it("excludes non-primary normalized txns", () => {
    const txns = [
      makeTxn({
        id: "primary",
        category: "Income",
        amount: 1200,
        timestamp: ts("2025-03-10T12:00:00Z"),
        normalizedId: "norm-1",
        normalizedPrimary: true,
      }),
      makeTxn({
        id: "secondary",
        category: "Income",
        amount: 600,
        timestamp: ts("2025-03-10T12:00:00Z"),
        normalizedId: "norm-1",
        normalizedPrimary: false,
      }),
    ];
    // Only primary counts: 1200/12 = 100
    expect(computeAverageWeeklyIncome(txns)).toBe(100);
  });

  it("excludes null-timestamp txns", () => {
    const txns = [
      makeTxn({ id: "no-ts", category: "Income", amount: 9999, timestamp: null }),
      makeTxn({ id: "with-ts", category: "Income", amount: 1200, timestamp: ts("2025-03-10T12:00:00Z") }),
    ];
    expect(computeAverageWeeklyIncome(txns)).toBe(100);
  });

  it("handles subcategories like Income:Salary and Income:Freelance", () => {
    const txns = [
      makeTxn({ id: "t1", category: "Income:Salary", amount: 600, timestamp: ts("2025-03-10T12:00:00Z") }),
      makeTxn({ id: "t2", category: "Income:Freelance", amount: 600, timestamp: ts("2025-03-11T12:00:00Z") }),
    ];
    // Both match category.startsWith("Income"): (600+600)/12 = 100
    expect(computeAverageWeeklyIncome(txns)).toBe(100);
  });

  it("applies reimbursement via computeNetAmount", () => {
    // amount=1000, reimbursement=50 → net = 1000 * (1 - 50/100) = 500
    const txns = [
      makeTxn({ id: "t1", category: "Income", amount: 1000, reimbursement: 50, timestamp: ts("2025-03-10T12:00:00Z") }),
    ];
    // 500/12 ≈ 41.6667
    expect(computeAverageWeeklyIncome(txns)).toBeCloseTo(500 / 12, 10);
  });

  it("window is anchored to latest income txn week end (Wednesday → next Monday)", () => {
    // Wednesday 2025-03-12 → next Monday = 2025-03-17T00:00:00Z
    // windowStart = 2025-03-17 minus 12 weeks = 2024-12-23T00:00:00Z
    // A txn exactly at windowStart boundary should be included (>=)
    const txns = [
      makeTxn({ id: "boundary", category: "Income", amount: 240, timestamp: ts("2024-12-23T00:00:00Z") }),
      makeTxn({ id: "latest", category: "Income", amount: 1200, timestamp: ts("2025-03-12T12:00:00Z") }),
    ];
    // Both included: (240 + 1200) / 12 = 120
    expect(computeAverageWeeklyIncome(txns)).toBe(120);

    // A txn 1ms before windowStart should be excluded
    const txnsWithExcluded = [
      makeTxn({ id: "before", category: "Income", amount: 9999, timestamp: ts("2024-12-22T23:59:59.999Z") }),
      makeTxn({ id: "latest2", category: "Income", amount: 1200, timestamp: ts("2025-03-12T12:00:00Z") }),
    ];
    expect(computeAverageWeeklyIncome(txnsWithExcluded)).toBe(100);
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
    expect(result[0].avg12Income).toBe(0);
  });

  it("income averages computed correctly", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
      makePeriod({ id: "food-w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 60 }),
    ];
    const txns = [
      makeTxn({ id: "inc-1", category: "Income", amount: 1200, timestamp: ts("2025-01-07"), budget: null }),
      makeTxn({ id: "inc-2", category: "Income", amount: 600, timestamp: ts("2025-01-14"), budget: null }),
    ];
    const result = computeAggregateTrend(periods, txns);
    expect(result).toHaveLength(2);
    // Week 1 income: 1200, avg12=[1200] -> 1200
    expect(result[0].avg12Income).toBe(1200);
    // Week 2 income: 600, avg12=[1200,600] -> 900
    expect(result[1].avg12Income).toBe(900);
  });
});

describe("computePerBudgetTrend", () => {
  it("returns empty array for no periods", () => {
    const result = computePerBudgetTrend([], [], []);
    expect(result).toEqual([]);
  });

  it("each budget gets separate series", () => {
    const budgets = [
      makeBudget({ id: "food", name: "Food", weeklyAllowance: 100 }),
      makeBudget({ id: "fun", name: "Fun", weeklyAllowance: 50 }),
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
    expect(foodPoints[0].avg3Spending).toBe(80);
    expect(funPoints[0].avg3Spending).toBe(30);
  });

  it("'Other' series from null-budget transactions", () => {
    const budgets = [makeBudget({ id: "food", name: "Food", weeklyAllowance: 100 })];
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 50 }),
    ];
    const txns = [
      makeTxn({ id: "unbudgeted-1", amount: 25, budget: null, category: "Misc", timestamp: ts("2025-01-07") }),
    ];
    const result = computePerBudgetTrend(budgets, periods, txns);
    const otherPoints = result.filter(r => r.budget === "Other");
    expect(otherPoints.length).toBeGreaterThan(0);
    expect(otherPoints[0].avg3Spending).toBe(25);
  });
});

describe("computeAverageWeeklySpending", () => {
  it("returns 0 for no periods", () => {
    expect(computeAverageWeeklySpending([])).toBe(0);
  });

  it("averages weekly totals over trailing 12 weeks", () => {
    // Create 14 weeks of periods; only trailing 12 should be used
    const periods: ReturnType<typeof makePeriod>[] = [];
    for (let i = 0; i < 14; i++) {
      const start = new Date("2025-01-06");
      start.setDate(start.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      periods.push(
        makePeriod({
          id: `food-w${i}`,
          budgetId: "food",
          periodStart: ts(start.toISOString()),
          periodEnd: ts(end.toISOString()),
          total: i < 2 ? 999 : 100, // first 2 weeks have large totals that should be excluded
        }),
      );
    }
    const result = computeAverageWeeklySpending(periods);
    // Trailing 12 weeks (indices 2-13) all have total=100
    expect(result).toBe(100);
  });

  it("fewer than 12 weeks averages over available weeks", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
      makePeriod({ id: "food-w2", budgetId: "food", periodStart: ts("2025-01-13"), periodEnd: ts("2025-01-20"), total: 120 }),
    ];
    const result = computeAverageWeeklySpending(periods);
    // 2 weeks: (80 + 120) / 2 = 100
    expect(result).toBe(100);
  });
});

describe("computeAggregateTrend avg12NetIncome", () => {
  it("avg12NetIncome equals avg12Income minus avg12Spending", () => {
    const periods = [
      makePeriod({ id: "food-w1", budgetId: "food", periodStart: ts("2025-01-06"), periodEnd: ts("2025-01-13"), total: 80 }),
    ];
    const txns = [
      makeTxn({ id: "inc-1", category: "Income", amount: 1200, timestamp: ts("2025-01-07"), budget: null }),
    ];
    const result = computeAggregateTrend(periods, txns);
    expect(result).toHaveLength(1);
    expect(result[0].avg12NetIncome).toBeCloseTo(result[0].avg12Income - result[0].avg12Spending, 10);
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
    groupId: null,
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
    // Anchor: end of Jan (2025-02-01), balance=1000
    // Transaction: Jan 10 (before anchor), amount=200 (spending)
    // Week Jan 5: before txn, balance = 1000 + 200 = 1200 (adding back the spending)
    // Week Jan 12: after txn, balance = 1000 + 0 = 1000 (spending is between week and anchor)
    // Wait, let me think again...
    // cumSumBefore(anchor=2025-02-01) = 200 (txn on Jan 10 is before Feb 1)
    // cumSumBefore(week Jan 5) = 0 (txn on Jan 10 is after Jan 5)
    // balance at Jan 5 = 1000 - (0 - 200) = 1200
    // cumSumBefore(week Jan 12) = 200 (txn on Jan 10 is before Jan 12)
    // balance at Jan 12 = 1000 - (200 - 200) = 1000
    // cumSumBefore(week Jan 19) = 200
    // balance at Jan 19 = 1000 - (200 - 200) = 1000
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
    // No transactions between Dec and Jan, so derived Dec balance = 1000
    // But statement says 800 → divergence of 200
    const result = computeNetWorth([], stmts, weeks);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0].period).toBe("2024-12");
    expect(result.divergences[0].expected).toBe(800);
    expect(result.divergences[0].derived).toBe(1000);
  });

  it("no divergence when transaction accounts for balance change", () => {
    const stmts = [
      makeStmt({ id: "s1", period: "2025-01", balance: 900 }),
      makeStmt({ id: "s2", period: "2024-12", balance: 1000 }),
    ];
    // Transaction of 100 (spending) on Dec 15 explains the 100 drop
    const txns = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2024-12-15"), budget: null }),
    ];
    // Anchor: 2025-01 (2025-02-01), balance=900
    // cumSumBefore(2025-02-01) = 100
    // cumSumBefore(2025-01-01 for 2024-12) = 100
    // derived = 900 - (100 - 100) = 900. Statement says 1000. Still divergent!
    // Wait, that's wrong. Let me recalculate:
    // anchorMs = periodToAnchorMs("2025-01") = 2025-02-01
    // stmtMs = periodToAnchorMs("2024-12") = 2025-01-01
    // cumSumBefore(2025-01-01) = 100 (txn on 2024-12-15 < 2025-01-01)
    // anchorCum = cumSumBefore(2025-02-01) = 100 (same txn, still < 2025-02-01)
    // derived = 900 - (100 - 100) = 900. But statement says 1000.
    // The issue is that the txn REDUCED balance by 100 between Dec and Jan.
    // If Dec balance was 1000 and spending of 100 happened, Jan balance should be 900. That checks out!
    // But derived balance AT Dec statement date = 900 - (cumBefore(Jan1) - cumBefore(Feb1))
    // = 900 - (100 - 100) = 900. The formula gives 900 at Jan 1, not 1000.
    // Hmm, let me re-think. The anchor is at Feb 1 with balance 900.
    // Going backward to Jan 1: balance = 900 + txns_between(Jan1, Feb1)
    // txns between Jan 1 and Feb 1: none (the txn is on Dec 15, before Jan 1)
    // So balance at Jan 1 = 900. But statement says 1000.
    // That means the txn on Dec 15 reduced balance from 1000 → 900 by Jan.
    // At Dec 31: balance_before_statement = 1000 - 100 = 900 (after spending)
    // Wait that doesn't work either. The statement at end of Dec shows 1000.
    // If spending of 100 happened on Dec 15, the Dec statement should be 900 not 1000.
    // Unless the spending happened AFTER the Dec statement date.
    // The Dec statement date is approx Jan 1 (periodToAnchorMs("2024-12") = 2025-01-01).
    // The txn is on Dec 15 which is BEFORE Jan 1.
    // So cumSumBefore(Jan1) includes the txn = 100.
    // derived balance at Dec stmt = 900 - (100 - 100) = 900 ≠ 1000.
    // So there IS a divergence. The scenario doesn't work for "no divergence".
    // Let me fix: put the txn AFTER the Dec statement but before the Jan statement.
    const txnsFixed = [
      makeTxn({ id: "t1", institution: "Bank", account: "Checking", amount: 100, timestamp: ts("2025-01-15"), budget: null }),
    ];
    // anchorMs = 2025-02-01, balance = 900
    // cumSumBefore(2025-02-01) = 100 (txn on Jan 15 < Feb 1)
    // cumSumBefore(2025-01-01 for Dec stmt) = 0 (txn on Jan 15 >= Jan 1)
    // derived at Dec = 900 - (0 - 100) = 900 + 100 = 1000. Matches!
    const result = computeNetWorth(txnsFixed, stmts, weeks);
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
});
