import { describe, it, expect } from "vitest";
import type { Timestamp } from "firebase/firestore";
import { computeNetAmount, findPeriodForTimestamp, computeBudgetBalance, computeAllBudgetBalances } from "../src/balance";
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

describe("seed data consistency", () => {
  // Verify budget period totals against a curated subset of seed transactions
  // that excludes normalized duplicates. The actual seed file includes
  // seed-norm-primary (amount: 25) and seed-norm-secondary (amount: 25), but
  // only the primary counts toward the period total. This test uses standalone
  // transactions only, so food-2025-01-20 shows total=45 (25+20) here versus
  // total=70 (25+20+25 primary) in the actual seed which includes the
  // normalized primary.

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
