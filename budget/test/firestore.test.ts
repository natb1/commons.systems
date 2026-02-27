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
}));

vi.mock("../src/firebase.js", () => ({
  db: { type: "mock-firestore" },
  NAMESPACE: "app/test",
}));

vi.mock("../src/is-authorized.js", () => ({
  isAuthorized: vi.fn(),
}));

import { getTransactions, updateTransaction } from "../src/firestore";
import { isAuthorized } from "../src/is-authorized";

const mockIsAuthorized = vi.mocked(isAuthorized);

describe("getTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue("mock-collection-ref");
    mockQuery.mockReturnValue("mock-query");
    mockWhere.mockReturnValue("mock-where");
  });

  it("queries seed-transactions for unauthorized users", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetDocs.mockResolvedValue({ docs: [] });

    await getTransactions(null);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/seed-transactions",
    );
    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("queries transactions with uid filter for authorized users", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockGetDocs.mockResolvedValue({ docs: [] });

    const user = { uid: "user-123" } as import("firebase/auth").User;
    await getTransactions(user);

    expect(mockCollection).toHaveBeenCalledWith(
      { type: "mock-firestore" },
      "app/test/transactions",
    );
    expect(mockWhere).toHaveBeenCalledWith("uid", "==", "user-123");
  });

  it("maps Firestore documents to Transaction objects", async () => {
    mockIsAuthorized.mockReturnValue(false);
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
            vacation: false,
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
        vacation: false,
      },
    ]);
  });

  it("includes uid when present in document data", async () => {
    mockIsAuthorized.mockReturnValue(true);
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
            vacation: false,
            uid: "user-123",
          }),
        },
      ],
    });

    const user = { uid: "user-123" } as import("firebase/auth").User;
    const transactions = await getTransactions(user);

    expect(transactions[0].uid).toBe("user-123");
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
      vacation: true,
      reimbursement: 50,
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith("mock-doc-ref", {
      category: "Food:Dining",
      vacation: true,
      reimbursement: 50,
    });
  });
});
