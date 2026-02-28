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

import { getTransactions, getUserGroup, updateTransaction } from "../src/firestore";

describe("getUserGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("queries groups with array-contains on user uid", async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const user = { uid: "user-123" } as import("firebase/auth").User;
    await getUserGroup(user);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/groups",
    );
    expect(mockWhere).toHaveBeenCalledWith("members", "array-contains", "user-123");
  });

  it("returns Group when user is a member", async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: "household",
          data: () => ({ name: "household", members: ["user-123"] }),
        },
      ],
    });

    const user = { uid: "user-123" } as import("firebase/auth").User;
    const group = await getUserGroup(user);

    expect(group).toEqual({ id: "household", name: "household" });
  });

  it("returns null when user is not a member of any group", async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });

    const user = { uid: "user-456" } as import("firebase/auth").User;
    const group = await getUserGroup(user);

    expect(group).toBeNull();
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

  it("queries transactions with groupId filter when groupId is provided", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getTransactions("household");

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/transactions",
    );
    expect(mockWhere).toHaveBeenCalledWith("groupId", "==", "household");
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
      },
    ]);
  });

  it("includes groupId and groupName when present in document data", async () => {
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
            groupName: "household",
          }),
        },
      ],
    });

    const transactions = await getTransactions("household");

    expect(transactions[0].groupId).toBe("household");
    expect(transactions[0].groupName).toBe("household");
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
});
