import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockIncrement = vi.fn((n: number) => ({ _increment: n }));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  increment: (n: number) => mockIncrement(n),
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "app/test",
}));

import { Timestamp } from "firebase/firestore";
import { getTransactions, updateTransaction, updateBudget, updateBudgetPeriod, adjustBudgetPeriodTotal, getBudgets, getBudgetPeriods } from "../src/firestore";

describe("getTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("queries seed-transactions when groupId is null", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getTransactions(null);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/seed-transactions",
    );
    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("queries transactions with groupId and memberUids filters when groupId is provided", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getTransactions("household", "user-123");

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/transactions",
    );
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", "household");
    expect(mockWhere).toHaveBeenCalledWith("memberUids", "array-contains", "user-123");
  });

  it("maps Firestore documents to Transaction objects", async () => {
    const mockTimestamp = Timestamp.fromDate(new Date("2025-01-15"));
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "txn-1",
          data: () => ({
            institution: "Bank A",
            account: "Checking",
            description: "Grocery store",
            amount: 52.30,
            note: "",
            category: "Food:Groceries",
            reimbursement: 0,
            budget: null,
            timestamp: mockTimestamp,
            statementId: "stmt-2025-01",
          }),
        },
      ],
    });

    const transactions = await getTransactions(null);

    expect(transactions).toEqual([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food:Groceries",
        reimbursement: 0,
        budget: null,
        timestamp: mockTimestamp,
        statementId: "stmt-2025-01",
        groupId: null,
      },
    ]);
  });

  it("includes groupId when present in document data", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "txn-1",
          data: () => ({
            institution: "Bank A",
            account: "Checking",
            description: "Grocery store",
            amount: 52.30,
            note: "",
            category: "Food:Groceries",
            reimbursement: 0,
            budget: null,
            timestamp: null,
            statementId: null,
            groupId: "household",
          }),
        },
      ],
    });

    const transactions = await getTransactions("household", "user-123");

    expect(transactions[0].groupId).toBe("household");
  });
});

describe("updateTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it("updates the correct document in the transactions collection", async () => {
    await updateTransaction("txn-1", { note: "updated note" });

    expect(mockDoc).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/transactions",
      "txn-1",
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", {
      note: "updated note",
    });
  });

  it("skips empty updates without calling updateDoc", async () => {
    await updateTransaction("txn-1", {});
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws RangeError when reimbursement is below 0", async () => {
    await expect(updateTransaction("txn-1", { reimbursement: -5 })).rejects.toThrow(RangeError);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws RangeError when reimbursement is above 100", async () => {
    await expect(updateTransaction("txn-1", { reimbursement: 150 })).rejects.toThrow(RangeError);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("accepts reimbursement at boundary values", async () => {
    await updateTransaction("txn-1", { reimbursement: 0 });
    expect(mockUpdateDoc).toHaveBeenCalled();
    mockUpdateDoc.mockClear();
    await updateTransaction("txn-1", { reimbursement: 100 });
    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  it("passes multiple fields to updateDoc", async () => {
    await updateTransaction("txn-2", {
      category: "Food:Dining",
      budget: "food",
      reimbursement: 50,
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", {
      category: "Food:Dining",
      budget: "food",
      reimbursement: 50,
    });
  });

  it("throws for empty txnId", async () => {
    await expect(updateTransaction("", { note: "test" })).rejects.toThrow("Invalid transaction ID");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws for txnId containing slash", async () => {
    await expect(updateTransaction("a/b", { note: "test" })).rejects.toThrow("Invalid transaction ID");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe("getTransactions — input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("throws when groupId provided without uid", async () => {
    // Cast bypasses overload signatures to test the runtime guard
    await expect(getTransactions("household" as Parameters<typeof getTransactions>[0])).rejects.toThrow(
      "uid is required",
    );
  });
});

describe("data validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  function mockDocsWithData(data: Record<string, unknown>) {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "txn-bad",
        data: () => ({
          institution: "Bank",
          account: "Checking",
          description: "Test",
          amount: 10,
          note: "",
          category: "Test",
          reimbursement: 0,
          budget: null,
          timestamp: null,
          statementId: null,
          groupId: null,
          ...data,
        }),
      }],
    });
  }

  it("throws DataIntegrityError for non-string required fields", async () => {
    mockDocsWithData({ institution: 123 });
    await expect(getTransactions(null)).rejects.toThrow(/Expected string for institution/);
  });

  it("throws DataIntegrityError for non-finite number", async () => {
    mockDocsWithData({ amount: NaN });
    await expect(getTransactions(null)).rejects.toThrow(/Expected finite number for amount/);
  });

  it("throws RangeError for out-of-range reimbursement on read", async () => {
    mockDocsWithData({ reimbursement: 150 });
    await expect(getTransactions(null)).rejects.toThrow(RangeError);
  });

  it("throws DataIntegrityError for invalid timestamp", async () => {
    mockDocsWithData({ timestamp: "not-a-timestamp" });
    await expect(getTransactions(null)).rejects.toThrow(/Expected Timestamp/);
  });
});

describe("getBudgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("queries seed-budgets when groupId is null", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getBudgets(null);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/seed-budgets",
    );
    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("queries budgets with filters when groupId provided", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getBudgets("household", "user-123");

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/budgets",
    );
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", "household");
    expect(mockWhere).toHaveBeenCalledWith("memberUids", "array-contains", "user-123");
  });

  it("maps Firestore documents to Budget objects", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "food",
          data: () => ({
            name: "Food",
            weeklyAllowance: 150,
            rollover: "none",
            groupId: "household",
          }),
        },
      ],
    });

    const budgets = await getBudgets(null);

    expect(budgets).toEqual([
      {
        id: "food",
        name: "Food",
        weeklyAllowance: 150,
        rollover: "none",
        groupId: "household",
      },
    ]);
  });

  it("throws when groupId provided without uid", async () => {
    await expect(getBudgets("household" as Parameters<typeof getBudgets>[0])).rejects.toThrow(
      "uid is required",
    );
  });

  it("throws DataIntegrityError for invalid rollover", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          name: "Bad",
          weeklyAllowance: 100,
          rollover: "invalid",
          groupId: null,
        }),
      }],
    });
    await expect(getBudgets(null)).rejects.toThrow(/Expected rollover to be one of/);
  });

  it("throws DataIntegrityError for non-string name", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          name: 123,
          weeklyAllowance: 100,
          rollover: "none",
          groupId: null,
        }),
      }],
    });
    await expect(getBudgets(null)).rejects.toThrow(/Expected string for name/);
  });

  it("throws DataIntegrityError for non-finite weeklyAllowance", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          name: "Bad",
          weeklyAllowance: NaN,
          rollover: "none",
          groupId: null,
        }),
      }],
    });
    await expect(getBudgets(null)).rejects.toThrow(/Expected finite number for weeklyAllowance/);
  });

  it("throws DataIntegrityError for empty budget name", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          name: "",
          weeklyAllowance: 100,
          rollover: "none",
          groupId: null,
        }),
      }],
    });
    await expect(getBudgets(null)).rejects.toThrow("Budget name must be non-empty");
  });

  it("throws DataIntegrityError for negative weeklyAllowance", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          name: "Bad",
          weeklyAllowance: -10,
          rollover: "none",
          groupId: null,
        }),
      }],
    });
    await expect(getBudgets(null)).rejects.toThrow(/Expected non-negative number for weeklyAllowance/);
  });
});

describe("getBudgetPeriods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("queries seed-budget-periods when groupId is null", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getBudgetPeriods(null);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/seed-budget-periods",
    );
    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("queries budget-periods with filters when groupId provided", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getBudgetPeriods("household", "user-123");

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/budget-periods",
    );
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", "household");
    expect(mockWhere).toHaveBeenCalledWith("memberUids", "array-contains", "user-123");
  });

  it("maps Firestore documents to BudgetPeriod objects", async () => {
    const mockStart = Timestamp.fromDate(new Date("2025-01-13"));
    const mockEnd = Timestamp.fromDate(new Date("2025-01-20"));
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "food-2025-01-13",
          data: () => ({
            budgetId: "food",
            periodStart: mockStart,
            periodEnd: mockEnd,
            total: 5.75,
            groupId: "household",
          }),
        },
      ],
    });

    const periods = await getBudgetPeriods(null);

    expect(periods).toEqual([
      {
        id: "food-2025-01-13",
        budgetId: "food",
        periodStart: mockStart,
        periodEnd: mockEnd,
        total: 5.75,
        groupId: "household",
      },
    ]);
  });

  it("throws when groupId provided without uid", async () => {
    await expect(getBudgetPeriods("household" as Parameters<typeof getBudgetPeriods>[0])).rejects.toThrow(
      "uid is required",
    );
  });

  it("throws DataIntegrityError for non-Timestamp periodStart", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          budgetId: "food",
          periodStart: "not-a-timestamp",
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 5.75,
          groupId: null,
        }),
      }],
    });
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected Timestamp for periodStart/);
  });

  it("throws DataIntegrityError for null periodStart", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          budgetId: "food",
          periodStart: null,
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 5.75,
          groupId: null,
        }),
      }],
    });
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected Timestamp for periodStart, got null/);
  });

  it("throws DataIntegrityError for non-Timestamp periodEnd", async () => {
    mockGetDocs.mockResolvedValue({ docs: [{ id: "bad", data: () => ({
      budgetId: "food",
      periodStart: Timestamp.fromDate(new Date("2025-01-13")),
      periodEnd: "not-a-timestamp",
      total: 5.75, groupId: null,
    })}]});
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected Timestamp for periodEnd/);
  });

  it("throws DataIntegrityError for non-string budgetId", async () => {
    mockGetDocs.mockResolvedValue({ docs: [{ id: "bad", data: () => ({
      budgetId: 123,
      periodStart: Timestamp.fromDate(new Date("2025-01-13")),
      periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
      total: 5.75, groupId: null,
    })}]});
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected string for budgetId/);
  });

  it("throws DataIntegrityError when periodStart >= periodEnd", async () => {
    const sameDate = Timestamp.fromDate(new Date("2025-01-13"));
    mockGetDocs.mockResolvedValue({ docs: [{ id: "bad", data: () => ({
      budgetId: "food", periodStart: sameDate, periodEnd: sameDate,
      total: 5.75, groupId: null,
    })}]});
    await expect(getBudgetPeriods(null)).rejects.toThrow(/periodStart must be before periodEnd/);
  });

  it("throws DataIntegrityError for negative total", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: -5,
          groupId: null,
        }),
      }],
    });
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected non-negative number for total/);
  });

  it("throws DataIntegrityError for non-finite total", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: Infinity,
          groupId: null,
        }),
      }],
    });
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected finite number for total/);
  });
});

describe("updateBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it("updates the correct document in the budgets collection", async () => {
    await updateBudget("food", { name: "Food & Dining" });
    expect(mockDoc).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/budgets",
      "food",
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { name: "Food & Dining" });
  });

  it("skips empty updates without calling updateDoc", async () => {
    await updateBudget("food", {});
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws for empty budgetId", async () => {
    await expect(updateBudget("", { name: "test" })).rejects.toThrow("Invalid budget ID");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws for budgetId containing slash", async () => {
    await expect(updateBudget("a/b", { name: "test" })).rejects.toThrow("Invalid budget ID");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws for empty name", async () => {
    await expect(updateBudget("food", { name: "" })).rejects.toThrow("Budget name cannot be empty");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws RangeError for negative weeklyAllowance", async () => {
    await expect(updateBudget("food", { weeklyAllowance: -5 })).rejects.toThrow(RangeError);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws RangeError for non-finite weeklyAllowance", async () => {
    await expect(updateBudget("food", { weeklyAllowance: NaN })).rejects.toThrow(RangeError);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("accepts weeklyAllowance of zero", async () => {
    await updateBudget("food", { weeklyAllowance: 0 });
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { weeklyAllowance: 0 });
  });

  it("throws DataIntegrityError for invalid rollover", async () => {
    await expect(updateBudget("food", { rollover: "invalid" as any })).rejects.toThrow(/Expected rollover to be one of/);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("accepts valid rollover values", async () => {
    await updateBudget("food", { rollover: "none" });
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { rollover: "none" });
    mockUpdateDoc.mockClear();
    await updateBudget("food", { rollover: "debt" });
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { rollover: "debt" });
    mockUpdateDoc.mockClear();
    await updateBudget("food", { rollover: "balance" });
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { rollover: "balance" });
  });

  it("passes multiple fields to updateDoc", async () => {
    await updateBudget("food", { name: "Food", weeklyAllowance: 200, rollover: "debt" });
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", {
      name: "Food",
      weeklyAllowance: 200,
      rollover: "debt",
    });
  });
});

describe("updateBudgetPeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it("updates the correct document in the budget-periods collection", async () => {
    await updateBudgetPeriod("food-2025-01-13", { total: 50 });
    expect(mockDoc).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/budget-periods",
      "food-2025-01-13",
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { total: 50 });
  });

  it("skips empty updates without calling updateDoc", async () => {
    await updateBudgetPeriod("food-2025-01-13", {});
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws for empty periodId", async () => {
    await expect(updateBudgetPeriod("", { total: 10 })).rejects.toThrow("Invalid period ID");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws for periodId containing slash", async () => {
    await expect(updateBudgetPeriod("a/b", { total: 10 })).rejects.toThrow("Invalid period ID");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws RangeError for negative total", async () => {
    await expect(updateBudgetPeriod("food-2025-01-13", { total: -5 })).rejects.toThrow(RangeError);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws RangeError for non-finite total", async () => {
    await expect(updateBudgetPeriod("food-2025-01-13", { total: NaN })).rejects.toThrow(RangeError);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("accepts zero total", async () => {
    await updateBudgetPeriod("food-2025-01-13", { total: 0 });
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { total: 0 });
  });
});

describe("adjustBudgetPeriodTotal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it("calls updateDoc with increment for positive delta", async () => {
    await adjustBudgetPeriodTotal("food-2025-01-13", 50);
    expect(mockDoc).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/budget-periods",
      "food-2025-01-13",
    );
    expect(mockIncrement).toHaveBeenCalledWith(50);
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { total: { _increment: 50 } });
  });

  it("calls updateDoc with increment for negative delta", async () => {
    await adjustBudgetPeriodTotal("food-2025-01-13", -30);
    expect(mockIncrement).toHaveBeenCalledWith(-30);
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { total: { _increment: -30 } });
  });

  it("skips write when delta is zero", async () => {
    await adjustBudgetPeriodTotal("food-2025-01-13", 0);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws for empty periodId", async () => {
    await expect(adjustBudgetPeriodTotal("", 10)).rejects.toThrow("Invalid period ID");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws for periodId containing slash", async () => {
    await expect(adjustBudgetPeriodTotal("a/b", 10)).rejects.toThrow("Invalid period ID");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws RangeError for non-finite delta", async () => {
    await expect(adjustBudgetPeriodTotal("food-2025-01-13", NaN)).rejects.toThrow(RangeError);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("throws RangeError for Infinity delta", async () => {
    await expect(adjustBudgetPeriodTotal("food-2025-01-13", Infinity)).rejects.toThrow(RangeError);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

describe("getBudgetPeriods — overlap detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("throws DataIntegrityError for overlapping periods within same budget", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "food-w1",
          data: () => ({
            budgetId: "food",
            periodStart: Timestamp.fromDate(new Date("2025-01-06")),
            periodEnd: Timestamp.fromDate(new Date("2025-01-15")),
            total: 50,
            groupId: null,
          }),
        },
        {
          id: "food-w2",
          data: () => ({
            budgetId: "food",
            periodStart: Timestamp.fromDate(new Date("2025-01-13")),
            periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
            total: 30,
            groupId: null,
          }),
        },
      ],
    });
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Overlapping budget periods for budget food/);
  });

  it("allows non-overlapping periods for same budget", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "food-w1",
          data: () => ({
            budgetId: "food",
            periodStart: Timestamp.fromDate(new Date("2025-01-06")),
            periodEnd: Timestamp.fromDate(new Date("2025-01-13")),
            total: 50,
            groupId: null,
          }),
        },
        {
          id: "food-w2",
          data: () => ({
            budgetId: "food",
            periodStart: Timestamp.fromDate(new Date("2025-01-13")),
            periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
            total: 30,
            groupId: null,
          }),
        },
      ],
    });
    const periods = await getBudgetPeriods(null);
    expect(periods).toHaveLength(2);
  });

  it("allows overlapping periods for different budgets", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "food-w1",
          data: () => ({
            budgetId: "food",
            periodStart: Timestamp.fromDate(new Date("2025-01-06")),
            periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
            total: 50,
            groupId: null,
          }),
        },
        {
          id: "housing-w1",
          data: () => ({
            budgetId: "housing",
            periodStart: Timestamp.fromDate(new Date("2025-01-06")),
            periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
            total: 100,
            groupId: null,
          }),
        },
      ],
    });
    const periods = await getBudgetPeriods(null);
    expect(periods).toHaveLength(2);
  });
});
