import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockIncrement = vi.fn((n: number) => ({ _increment: n }));
const mockAddDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
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
import { getTransactions, updateTransaction, updateBudget, updateBudgetPeriod, adjustBudgetPeriodTotal, getBudgets, getBudgetPeriods, getRules, createRule, updateRule, deleteRule, getGroupMembers } from "../src/firestore";

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

  it("queries transactions with groupId and memberEmails filters when groupId is provided", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getTransactions("household", "user@example.com");

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/transactions",
    );
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", "household");
    expect(mockWhere).toHaveBeenCalledWith("memberEmails", "array-contains", "user@example.com");
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
        normalizedId: null,
        normalizedPrimary: true,
        normalizedDescription: null,
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

  it("throws when groupId provided without email", async () => {
    // Cast bypasses overload signatures to test the runtime guard
    await expect(getTransactions("household" as Parameters<typeof getTransactions>[0])).rejects.toThrow(
      "email is required",
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
          normalizedId: null,
          normalizedPrimary: true,
          normalizedDescription: null,
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

    await getBudgets("household", "user@example.com");

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/budgets",
    );
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", "household");
    expect(mockWhere).toHaveBeenCalledWith("memberEmails", "array-contains", "user@example.com");
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
        allowancePeriod: "weekly",
        rollover: "none",
        overrides: [],
        groupId: "household",
      },
    ]);
  });

  it("throws when groupId provided without email", async () => {
    await expect(getBudgets("household" as Parameters<typeof getBudgets>[0])).rejects.toThrow(
      "email is required",
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

    await getBudgetPeriods("household", "user@example.com");

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/budget-periods",
    );
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", "household");
    expect(mockWhere).toHaveBeenCalledWith("memberEmails", "array-contains", "user@example.com");
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
            count: 2,
            categoryBreakdown: { "Food:Groceries": 5.75 },
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
        count: 2,
        categoryBreakdown: { "Food:Groceries": 5.75 },
        groupId: "household",
      },
    ]);
  });

  it("throws when groupId provided without email", async () => {
    await expect(getBudgetPeriods("household" as Parameters<typeof getBudgetPeriods>[0])).rejects.toThrow(
      "email is required",
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
      total: 5.75, count: 0, categoryBreakdown: {}, groupId: null,
    })}]});
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected Timestamp for periodEnd/);
  });

  it("throws DataIntegrityError for non-string budgetId", async () => {
    mockGetDocs.mockResolvedValue({ docs: [{ id: "bad", data: () => ({
      budgetId: 123,
      periodStart: Timestamp.fromDate(new Date("2025-01-13")),
      periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
      total: 5.75, count: 0, categoryBreakdown: {}, groupId: null,
    })}]});
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected string for budgetId/);
  });

  it("throws DataIntegrityError when periodStart >= periodEnd", async () => {
    const sameDate = Timestamp.fromDate(new Date("2025-01-13"));
    mockGetDocs.mockResolvedValue({ docs: [{ id: "bad", data: () => ({
      budgetId: "food", periodStart: sameDate, periodEnd: sameDate,
      total: 5.75, count: 0, categoryBreakdown: {}, groupId: null,
    })}]});
    await expect(getBudgetPeriods(null)).rejects.toThrow(/periodStart must be before periodEnd/);
  });

  it("accepts negative total (credits exceeding debits)", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "food-2025-01-13",
        data: () => ({
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: -5,
          count: 1,
          categoryBreakdown: {},
          groupId: null,
        }),
      }],
    });
    const periods = await getBudgetPeriods(null);
    expect(periods[0].total).toBe(-5);
  });

  it("throws DataIntegrityError when categoryBreakdown is an array", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 5.75,
          count: 0,
          categoryBreakdown: [1, 2, 3],
          groupId: null,
        }),
      }],
    });
    await expect(getBudgetPeriods(null)).rejects.toThrow(/Expected object for categoryBreakdown/);
  });

  it("throws DataIntegrityError when categoryBreakdown contains non-finite number", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "bad",
        data: () => ({
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 5.75,
          count: 0,
          categoryBreakdown: { "Food": NaN },
          groupId: null,
        }),
      }],
    });
    await expect(getBudgetPeriods(null)).rejects.toThrow(/categoryBreakdown\[Food\] is not a finite number/);
  });

  it("returns empty object when categoryBreakdown is null", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "food-2025-01-13",
        data: () => ({
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 5.75,
          count: 0,
          categoryBreakdown: null,
          groupId: null,
        }),
      }],
    });
    const periods = await getBudgetPeriods(null);
    expect(periods[0].categoryBreakdown).toEqual({});
  });

  it("passes valid categoryBreakdown with multiple entries", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "food-2025-01-13",
        data: () => ({
          budgetId: "food",
          periodStart: Timestamp.fromDate(new Date("2025-01-13")),
          periodEnd: Timestamp.fromDate(new Date("2025-01-20")),
          total: 16.25,
          count: 3,
          categoryBreakdown: { "Food:Groceries": 5.75, "Food:Dining": 10.50 },
          groupId: null,
        }),
      }],
    });
    const periods = await getBudgetPeriods(null);
    expect(periods[0].categoryBreakdown).toEqual({ "Food:Groceries": 5.75, "Food:Dining": 10.50 });
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
          count: 0,
          categoryBreakdown: {},
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

  it("accepts negative total", async () => {
    await updateBudgetPeriod("food-2025-01-13", { total: -5 });
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { total: -5 });
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
            count: 0,
            categoryBreakdown: {},
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
            count: 0,
            categoryBreakdown: {},
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
            count: 0,
            categoryBreakdown: {},
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
            count: 0,
            categoryBreakdown: {},
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
            count: 0,
            categoryBreakdown: {},
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
            count: 0,
            categoryBreakdown: {},
            groupId: null,
          }),
        },
      ],
    });
    const periods = await getBudgetPeriods(null);
    expect(periods).toHaveLength(2);
  });
});

describe("getRules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("queries seed-rules when groupId is null", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    await getRules(null);
    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/seed-rules",
    );
  });

  it("queries rules with groupId filter when groupId is provided", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    await getRules("household", "user@example.com");
    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/rules",
    );
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", "household");
  });

  it("maps rule document fields correctly", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "rule-1",
        data: () => ({
          type: "categorization",
          pattern: "coffee",
          target: "Food:Coffee",
          priority: 10,
          institution: "Bank",
          account: "Checking",
          groupId: "household",
        }),
      }],
    });
    const rules = await getRules(null);
    expect(rules).toEqual([{
      id: "rule-1",
      type: "categorization",
      pattern: "coffee",
      target: "Food:Coffee",
      priority: 10,
      institution: "Bank",
      account: "Checking",
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
      groupId: "household",
    }]);
  });

  it("throws on invalid rule type", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "rule-bad",
        data: () => ({ type: "invalid", pattern: "x", target: "y", priority: 1 }),
      }],
    });
    await expect(getRules(null)).rejects.toThrow("rule type");
  });

  it("throws on missing required string field", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "rule-bad",
        data: () => ({ type: "categorization", pattern: 123, target: "y", priority: 1 }),
      }],
    });
    await expect(getRules(null)).rejects.toThrow("pattern");
  });

  it("throws on missing required number field", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{
        id: "rule-bad",
        data: () => ({ type: "categorization", pattern: "x", target: "y", priority: "not a number" }),
      }],
    });
    await expect(getRules(null)).rejects.toThrow("priority");
  });
});

describe("createRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
  });

  it("creates a rule with valid fields", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-rule-id" });
    const id = await createRule("household", ["a@b.com"], {
      type: "categorization",
      pattern: "coffee",
      target: "Food",
      priority: 10,
      institution: null,
      account: null,
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
    });
    expect(id).toBe("new-rule-id");
    expect(mockAddDoc).toHaveBeenCalledWith("mock-collection-ref", {
      type: "categorization",
      pattern: "coffee",
      target: "Food",
      priority: 10,
      institution: null,
      account: null,
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
      groupId: "household",
      memberEmails: ["a@b.com"],
    });
  });

  it("rejects empty pattern when matchCategory is also empty", async () => {
    await expect(createRule("g", ["a@b.com"], {
      type: "categorization",
      pattern: "",
      target: "Food",
      priority: 10,
      institution: null,
      account: null,
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
    })).rejects.toThrow("pattern or matchCategory is required");
  });

  it("rejects empty target", async () => {
    await expect(createRule("g", ["a@b.com"], {
      type: "categorization",
      pattern: "x",
      target: "",
      priority: 10,
      institution: null,
      account: null,
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
    })).rejects.toThrow("target cannot be empty");
  });
});

describe("updateRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it("updates a rule with partial fields", async () => {
    await updateRule("rule-1", { pattern: "new pattern" });
    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", { pattern: "new pattern" });
  });

  it("skips update when fields are empty", async () => {
    await updateRule("rule-1", {});
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("rejects empty pattern", async () => {
    await expect(updateRule("rule-1", { pattern: "" })).rejects.toThrow("pattern cannot be empty");
  });

  it("rejects empty target", async () => {
    await expect(updateRule("rule-1", { target: "" })).rejects.toThrow("target cannot be empty");
  });

  it("rejects invalid rule type", async () => {
    await expect(updateRule("rule-1", { type: "bad" as "categorization" })).rejects.toThrow("rule type");
  });
});

describe("deleteRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  it("deletes a rule by ID", async () => {
    await deleteRule("rule-1");
    expect(mockDeleteDoc).toHaveBeenCalledWith("mock-doc-ref");
  });

  it("rejects empty rule ID", async () => {
    await expect(deleteRule("")).rejects.toThrow("Invalid rule ID");
  });

  it("rejects rule ID with slash", async () => {
    await expect(deleteRule("a/b")).rejects.toThrow("Invalid rule ID");
  });
});

describe("getGroupMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
  });

  it("returns members for an existing group", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ members: ["a@b.com", "c@d.com"] }),
    });
    const members = await getGroupMembers("group-1");
    expect(members).toEqual(["a@b.com", "c@d.com"]);
  });

  it("throws when group does not exist", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });
    await expect(getGroupMembers("missing")).rejects.toThrow("not found");
  });

  it("throws DataIntegrityError when members is not an array", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ members: "not-an-array" }),
    });
    await expect(getGroupMembers("group-1")).rejects.toThrow(/members is not an array/);
  });

  it("throws DataIntegrityError when members contains non-string", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ members: ["valid", 123] }),
    });
    await expect(getGroupMembers("group-1")).rejects.toThrow(/non-string/);
  });
});
