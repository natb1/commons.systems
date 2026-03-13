import { describe, it, expect, vi, beforeEach } from "vitest";
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
  getBudgets: vi.fn(),
  getBudgetPeriods: vi.fn(),
}));

vi.mock("../../src/balance.js", () => ({
  computeAllBudgetBalances: vi.fn(),
}));

import { renderHome } from "../../src/pages/home";
import { getTransactions, getBudgets, getBudgetPeriods, type Transaction, type BudgetPeriod } from "../../src/firestore";
import { computeAllBudgetBalances } from "../../src/balance";

const mockGetTransactions = vi.mocked(getTransactions);
const mockGetBudgets = vi.mocked(getBudgets);
const mockGetBudgetPeriods = vi.mocked(getBudgetPeriods);
const mockComputeAllBalances = vi.mocked(computeAllBudgetBalances);

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
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    ...overrides,
  };
}

const defaultBudgets = [
  { id: "food", name: "Food", weeklyAllowance: 150, rollover: "none" as const, groupId: null },
  { id: "vacation", name: "Vacation", weeklyAllowance: 100, rollover: "balance" as const, groupId: null },
];

const defaultPeriods: BudgetPeriod[] = [
  {
    id: "food-2025-01-13",
    budgetId: "food",
    periodStart: mockTimestamp("2025-01-13"),
    periodEnd: mockTimestamp("2025-01-20"),
    total: 5.75,
    count: 0,
    categoryBreakdown: {},
    groupId: null,
  },
];

describe("renderHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBudgets.mockResolvedValue(defaultBudgets);
    mockGetBudgetPeriods.mockResolvedValue(defaultPeriods);
    mockComputeAllBalances.mockReturnValue(new Map());
  });

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
    expect(html).toContain("Could not load data");
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
    expect(html).toContain('class="expand-row txn-row"');
    expect(html).toContain('class="txn-summary"');
    expect(html).toContain('class="txn-summary-content"');
    expect(html).toContain('class="expand-details txn-details"');
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
    mockGetBudgets.mockResolvedValue([
      { id: "food", name: "Food", weeklyAllowance: 150, rollover: "none", groupId: "household" },
      { id: "vacation", name: "Vacation", weeklyAllowance: 100, rollover: "balance", groupId: "household" },
    ]);
    mockGetTransactions.mockResolvedValue([
      txn({ category: "Food", budget: "food", groupId: "household" }),
      txn({
        id: "txn-2", institution: "Bank B", account: "Savings",
        description: "Hotel", amount: 215, category: "Travel",
        budget: "vacation", timestamp: mockTimestamp("2025-02-01"), groupId: "household",
      }),
    ]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain("data-budget-options");
    expect(html).toContain("Food");
    expect(html).toContain("Vacation");
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

  it("throws DataIntegrityError when transaction references unknown budget ID", async () => {
    mockGetBudgets.mockResolvedValue([
      { id: "food", name: "Food", weeklyAllowance: 150, rollover: "none", groupId: null },
    ]);
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "nonexistent-budget" }),
    ]);
    await expect(renderHome({ user: null, group: null, groupError: false }))
      .rejects.toThrow(DataIntegrityError);
  });

  it("throws DataIntegrityError for duplicate budget names", async () => {
    mockGetBudgets.mockResolvedValue([
      { id: "food-1", name: "Food", weeklyAllowance: 150, rollover: "none", groupId: "household" },
      { id: "food-2", name: "Food", weeklyAllowance: 200, rollover: "none", groupId: "household" },
    ]);
    mockGetTransactions.mockResolvedValue([txn()]);
    await expect(renderHome({ user: mockUser, group: mockGroup, groupError: false }))
      .rejects.toThrow("Duplicate budget name: Food");
  });

  it("renders budget name-to-ID map as data attribute for authorized users", async () => {
    mockGetBudgets.mockResolvedValue([
      { id: "budget-food", name: "Food", weeklyAllowance: 150, rollover: "none", groupId: "household" },
    ]);
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "budget-food", groupId: "household" }),
    ]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain("data-budget-map");
    expect(html).toContain("budget-food");
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

  it("renders Budget Balance dt/dd in expanded details", async () => {
    mockComputeAllBalances.mockReturnValue(new Map([["txn-1", 144.25]]));
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).toContain("<dt>Budget Balance</dt>");
    expect(html).toContain('<dd class="budget-balance">144.25</dd>');
  });

  it("omits budget balance row when computeBudgetBalance returns null", async () => {
    mockComputeAllBalances.mockReturnValue(new Map());
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).not.toContain("<dt>Budget Balance</dt>");
  });

  it("omits budget balance row when transaction has no budget", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ budget: null }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).not.toContain("<dt>Budget Balance</dt>");
    expect(mockComputeAllBalances).toHaveBeenCalled();
  });

  it("renders data-amount, data-budget-id, data-timestamp, data-reimbursement on rows for authorized users", async () => {
    const ts = mockTimestamp("2025-01-15");
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food", timestamp: ts, amount: 52.30, reimbursement: 25, groupId: "household" }),
    ]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain('data-amount="52.3"');
    expect(html).toContain('data-budget-id="food"');
    expect(html).toContain(`data-timestamp="${ts.toMillis()}"`);
    expect(html).toContain('data-reimbursement="25"');
  });

  it("does not render data-amount, data-budget-id, data-timestamp, data-reimbursement for unauthorized users", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).not.toContain("data-amount");
    expect(html).not.toContain("data-budget-id");
    expect(html).not.toContain("data-timestamp");
    expect(html).not.toContain("data-reimbursement");
  });

  it("renders data-budget-periods on container for authorized users", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food", groupId: "household" }),
    ]);
    const html = await renderHome({ user: mockUser, group: mockGroup, groupError: false });
    expect(html).toContain("data-budget-periods");
    expect(html).toContain("food-2025-01-13");
  });

  it("does not render data-budget-periods for unauthorized users", async () => {
    mockGetTransactions.mockResolvedValue([
      txn({ budget: "food" }),
    ]);
    const html = await renderHome({ user: null, group: null, groupError: false });
    expect(html).not.toContain("data-budget-periods");
  });
});
