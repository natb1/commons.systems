import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  Timestamp: { fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }) },
}));

vi.mock("../../src/firestore.js", () => ({
  getTransactions: vi.fn(),
}));

vi.mock("../../src/is-authorized.js", () => ({
  isAuthorized: vi.fn(),
}));

import { renderHome } from "../../src/pages/home";
import { getTransactions } from "../../src/firestore";
import { isAuthorized } from "../../src/is-authorized";

const mockGetTransactions = vi.mocked(getTransactions);
const mockIsAuthorized = vi.mocked(isAuthorized);

function mockTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  return { toDate: () => d, toMillis: () => d.getTime() } as import("firebase/firestore").Timestamp;
}

describe("renderHome", () => {
  it("returns HTML containing a Transactions heading", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome();
    expect(html).toContain("<h2>Transactions</h2>");
  });

  it("shows seed data notice for unauthorized users", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome();
    expect(html).toContain('id="seed-data-notice"');
  });

  it("does not show seed data notice for authorized users", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome();
    expect(html).not.toContain('id="seed-data-notice"');
  });

  it("renders transaction list with data", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "weekly groceries",
        category: "Food:Groceries",
        reimbursement: 0,
        budget: null,
        timestamp: mockTimestamp("2025-01-15"),
        statementId: "stmt-2025-01",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('id="transactions-table"');
    expect(html).toContain("Grocery store");
    expect(html).toContain("52.30");
    expect(html).toContain("Food &gt; Groceries");
  });

  it("renders error fallback when Firestore fails", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockRejectedValue(new Error("connection failed"));
    const html = await renderHome();
    expect(html).toContain("Could not load transactions");
    expect(html).toContain('id="transactions-error"');
  });

  it("renders empty state when no transactions", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([]);
    const html = await renderHome();
    expect(html).toContain("No transactions found.");
  });

  it("renders inline edit inputs for authorized users", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "weekly groceries",
        category: "Food:Groceries",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: "stmt-2025-01",
        uid: "user-123",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('class="edit-note"');
    expect(html).toContain('class="edit-category"');
    expect(html).toContain('class="edit-reimbursement"');
    expect(html).toContain('class="edit-budget"');
    expect(html).toContain('data-txn-id="txn-1"');
  });

  it("renders read-only cells for unauthorized users", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "weekly groceries",
        category: "Food:Groceries",
        reimbursement: 0,
        budget: null,
        timestamp: mockTimestamp("2025-01-15"),
        statementId: null,
      },
    ]);
    const html = await renderHome();
    expect(html).not.toContain('class="edit-note"');
    expect(html).not.toContain('class="edit-category"');
    expect(html).toContain("weekly groceries");
  });

  it("renders accordion rows with details/summary elements", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food:Groceries",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: "stmt-2025-01",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('class="txn-row"');
    expect(html).toContain('class="txn-summary"');
    expect(html).toContain('class="txn-summary-content"');
    expect(html).toContain('class="txn-details"');
    expect(html).toContain("Bank A");
    expect(html).toContain("Checking");
  });

  it("renders date and statement link in expanded details", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food:Groceries",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: "stmt-2025-01",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain("<dt>Date</dt>");
    expect(html).toContain("<dt>Statement</dt>");
    expect(html).toContain('<a href="#">statement</a>');
  });

  it("renders empty statement dd when statementId is null", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([
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
        timestamp: null,
        statementId: null,
      },
    ]);
    const html = await renderHome();
    expect(html).toContain("<dt>Statement</dt><dd></dd>");
  });

  it("renders budget datalist with unique sorted options for authorized users", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: null,
        uid: "user-123",
      },
      {
        id: "txn-2",
        institution: "Bank B",
        account: "Savings",
        description: "Hotel",
        amount: 215,
        note: "",
        category: "Travel",
        reimbursement: 0,
        budget: "vacation",
        timestamp: mockTimestamp("2025-02-01"),
        statementId: null,
        uid: "user-123",
      },
      {
        id: "txn-3",
        institution: "Bank A",
        account: "Checking",
        description: "Coffee",
        amount: 5,
        note: "",
        category: "Food",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-20"),
        statementId: null,
        uid: "user-123",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('id="budget-options"');
    expect(html).toContain('<option value="food">');
    expect(html).toContain('<option value="vacation">');
    // "food" appears only once despite two transactions having it
    const foodCount = (html.match(/option value="food"/g) || []).length;
    expect(foodCount).toBe(1);
  });

  it("budget input has list attribute linking to datalist", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: null,
        uid: "user-123",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('list="budget-options"');
  });

  it("does not render budget datalist for unauthorized users", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: null,
      },
    ]);
    const html = await renderHome();
    expect(html).not.toContain('id="budget-options"');
  });

  it("renders category datalist with unique sorted options for authorized users", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food:Groceries",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: null,
        uid: "user-123",
      },
      {
        id: "txn-2",
        institution: "Bank B",
        account: "Savings",
        description: "Hotel",
        amount: 215,
        note: "",
        category: "Travel:Lodging",
        reimbursement: 0,
        budget: "vacation",
        timestamp: mockTimestamp("2025-02-01"),
        statementId: null,
        uid: "user-123",
      },
      {
        id: "txn-3",
        institution: "Bank A",
        account: "Checking",
        description: "Coffee",
        amount: 5,
        note: "",
        category: "Food:Groceries",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-20"),
        statementId: null,
        uid: "user-123",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('id="category-options"');
    expect(html).toContain('<option value="Food:Groceries">');
    expect(html).toContain('<option value="Travel:Lodging">');
    // "Food:Groceries" appears only once despite two transactions having it
    const catCount = (html.match(/option value="Food:Groceries"/g) || []).length;
    expect(catCount).toBe(1);
  });

  it("category input has list attribute linking to datalist", async () => {
    mockIsAuthorized.mockReturnValue(true);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: null,
        uid: "user-123",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('list="category-options"');
  });

  it("does not render category datalist for unauthorized users", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Grocery store",
        amount: 52.30,
        note: "",
        category: "Food",
        reimbursement: 0,
        budget: "food",
        timestamp: mockTimestamp("2025-01-15"),
        statementId: null,
      },
    ]);
    const html = await renderHome();
    expect(html).not.toContain('id="category-options"');
  });

  it("sorts transactions by timestamp descending with nulls last", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockGetTransactions.mockResolvedValue([
      {
        id: "txn-1",
        institution: "Bank A",
        account: "Checking",
        description: "Older",
        amount: 10,
        note: "",
        category: "A",
        reimbursement: 0,
        budget: null,
        timestamp: mockTimestamp("2025-01-01"),
        statementId: null,
      },
      {
        id: "txn-2",
        institution: "Bank B",
        account: "Savings",
        description: "Newer",
        amount: 20,
        note: "",
        category: "B",
        reimbursement: 0,
        budget: null,
        timestamp: mockTimestamp("2025-02-01"),
        statementId: null,
      },
      {
        id: "txn-3",
        institution: "Bank C",
        account: "Credit",
        description: "No date",
        amount: 30,
        note: "",
        category: "C",
        reimbursement: 0,
        budget: null,
        timestamp: null,
        statementId: null,
      },
    ]);
    const html = await renderHome();
    const newerIdx = html.indexOf("Newer");
    const olderIdx = html.indexOf("Older");
    const noDateIdx = html.indexOf("No date");
    expect(newerIdx).toBeLessThan(olderIdx);
    expect(olderIdx).toBeLessThan(noDateIdx);
  });
});
