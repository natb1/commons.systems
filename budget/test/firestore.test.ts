import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  Timestamp: { fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }) },
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "app/test",
}));

import { getTransactions, getUserGroups, updateTransaction } from "../src/firestore";

describe("getUserGroups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("returns all groups sorted by name", async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        { id: "work", data: () => ({ name: "work", members: ["user-123"] }) },
        { id: "household", data: () => ({ name: "household", members: ["user-123"] }) },
      ],
    });

    const user = { uid: "user-123" } as import("firebase/auth").User;
    const groups = await getUserGroups(user);

    expect(groups).toEqual([
      { id: "household", name: "household" },
      { id: "work", name: "work" },
    ]);
  });

  it("returns empty array when user has no groups", async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const user = { uid: "user-456" } as import("firebase/auth").User;
    const groups = await getUserGroups(user);

    expect(groups).toEqual([]);
  });
});

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
    const mockTimestamp = { toDate: () => new Date("2025-01-15"), toMillis: () => new Date("2025-01-15").getTime() };
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
