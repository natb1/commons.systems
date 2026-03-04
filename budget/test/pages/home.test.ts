import { describe, it, expect, vi } from "vitest";
import { DataIntegrityError } from "../../src/errors";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

vi.mock("../../src/firestore.js", () => ({
  getTransactions: vi.fn(),
}));

import { renderHome } from "../../src/pages/home";
import { getTransactions, type Transaction } from "../../src/firestore";

const mockGetTransactions = vi.mocked(getTransactions);

function mockTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  return { toDate: () => d, toMillis: () => d.getTime() } as import("firebase/firestore").Timestamp;
}

const mockUser = { uid: "user-123" } as import("firebase/auth").User;
const mockGroup = { id: "household", name: "household" };

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    institution: "Bank A",
    account: "Checking",
    description: "Grocery store",
    amount: 52.30,
    note: "",
    category: "Food:Groceries",
    reimbursement: 0,
    budget: null,
    timestamp: mockTimestamp("2025-01-15"),
    statementId: null,
    groupId: null,
    ...overrides,
  };
}

describe("renderHome", () => {
  it("returns HTML containing a Transactions heading", async () => {
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain("<h2>Transactions</h2>");
  });

  it("shows seed data notice for unauthorized users", async () => {
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain('id="seed-data-notice"');
  });

  it("does not show seed data notice for authorized users", async () => {
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("shows 'not a member' notice for signed-in user without groups", async () => {
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome({ user: mockUser, group: null, groupError: false });
    expect(html).toContain("not a member of any groups");
    expect(html).not.toContain("Sign in");
  });

  it("renders transaction list with data", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ note: "weekly groceries", statementId: "stmt-2025-01" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain('id="transactions-table"');
    expect(html).toContain("Grocery store");
    expect(html).toContain("52.30");
    expect(html).toContain("Food &gt; Groceries");
  });

  it("renders error fallback when Firestore fails", async () => {
    mockGetTransactions.mockRejectedValue(new Error("connection failed"));
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain("Could not load transactions");
    expect(html).toContain('id="transactions-error"');
  });

  it("re-throws RangeError instead of showing fallback", async () => {
    mockGetTransactions.mockRejectedValue(new RangeError("reimbursement must be between 0 and 100"));
    await expect(renderHome({ user: null, group: null, groupError: false })).rejects.toThrow(RangeError);
  });

  it("re-throws DataIntegrityError instead of showing fallback", async () => {
    mockGetTransactions.mockRejectedValue(new DataIntegrityError("Expected string for description, got undefined"));
    await expect(renderHome({ user: null, group: null, groupError: false })).rejects.toThrow(DataIntegrityError);
  });

  it("shows group error when groupError is true for signed-in user", async () => {
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome({ user: mockUser, group: null, groupError: true });
    expect(html).toContain('id="group-error"');
    expect(html).toContain("Could not load group data");
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("renders empty state when no transactions", async () => {
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain("No transactions found.");
  });

  it("renders inline edit inputs for authorized users", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ note: "weekly groceries", budget: "food", statementId: "stmt-2025-01", groupId: "household" }),
    ]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain('class="edit-note"');
    expect(html).toContain('class="edit-category"');
    expect(html).toContain('class="edit-reimbursement"');
    expect(html).toContain('class="edit-budget"');
    expect(html).toContain('data-txn-id="txn-1"');
    expect(html).toContain('aria-label="Note"');
    expect(html).toContain('aria-label="Category"');
    expect(html).toContain('aria-label="Reimbursement"');
    expect(html).toContain('aria-label="Budget"');
  });

  it("renders read-only cells for unauthorized users", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ note: "weekly groceries" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).not.toContain('class="edit-note"');
    expect(html).not.toContain('class="edit-category"');
    expect(html).toContain("weekly groceries");
  });

  it("renders accordion rows with details/summary elements", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food", statementId: "stmt-2025-01" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain('class="txn-row"');
    expect(html).toContain('class="txn-summary"');
    expect(html).toContain('class="txn-summary-content"');
    expect(html).toContain('class="txn-details"');
    expect(html).toContain("Bank A");
    expect(html).toContain("Checking");
  });

  it("renders date and statement link in expanded details", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food", statementId: "stmt-2025-01" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain("<dt>Date</dt>");
    expect(html).toContain("<dt>Statement</dt>");
    expect(html).toContain('<a href="#">statement</a>');
  });

  it("renders empty statement dd when statementId is null", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ timestamp: null }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain("<dt>Statement</dt><dd></dd>");
  });

  it("renders budget options as data attribute for authorized users", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ category: "Food", budget: "food", groupId: "household" }),
      txn({
        id: "txn-2", institution: "Bank B", account: "Savings",
        description: "Hotel", amount: 215, category: "Travel",
        budget: "vacation", timestamp: mockTimestamp("2025-02-01"), groupId: "household",
      }),
      txn({
        id: "txn-3", description: "Coffee", amount: 5, category: "Food",
        budget: "food", timestamp: mockTimestamp("2025-01-20"), groupId: "household",
      }),
    ]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain("data-budget-options");
    expect(html).toContain("food");
    expect(html).toContain("vacation");
  });

  it("does not render autocomplete options for unauthorized users", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ category: "Food", budget: "food" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).not.toContain("data-budget-options");
    expect(html).not.toContain("data-category-options");
  });

  it("renders category options as data attribute for authorized users", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food", groupId: "household" }),
      txn({
        id: "txn-2", institution: "Bank B", account: "Savings",
        description: "Hotel", amount: 215, category: "Travel:Lodging",
        budget: "vacation", timestamp: mockTimestamp("2025-02-01"), groupId: "household",
      }),
    ]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain("data-category-options");
    expect(html).toContain("Food:Groceries");
    expect(html).toContain("Travel:Lodging");
  });

  it("renders group name in expanded details", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ category: "Food", budget: "food", groupId: "household" }),
    ]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain("<dt>Group</dt>");
    expect(html).toContain("<dd>household</dd>");
  });

  it("shows access denied message for permission-denied error", async () => {
    const error = new Error("permission denied");
    (error as any).code = "permission-denied";
    mockGetTransactions.mockRejectedValue(error);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain("Access denied");
  });

  it("sorts transactions by timestamp descending with nulls last", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({
        description: "Older", amount: 10, category: "A",
        timestamp: mockTimestamp("2025-01-01"),
      }),
      txn({
        id: "txn-2", institution: "Bank B", account: "Savings",
        description: "Newer", amount: 20, category: "B",
        timestamp: mockTimestamp("2025-02-01"),
      }),
      txn({
        id: "txn-3", institution: "Bank C", account: "Credit",
        description: "No date", amount: 30, category: "C", timestamp: null,
      }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    const newerIdx = html.indexOf("Newer");
    const olderIdx = html.indexOf("Older");
    const noDateIdx = html.indexOf("No date");
    expect(newerIdx).toBeLessThan(olderIdx);
    expect(olderIdx).toBeLessThan(noDateIdx);
  });
});
