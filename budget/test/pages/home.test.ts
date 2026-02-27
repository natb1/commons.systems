import { describe, it, expect, vi } from "vitest";

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

  it("renders transaction table with data", async () => {
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
        vacation: false,
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('id="transactions-table"');
    expect(html).toContain("Bank A");
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
        vacation: false,
        uid: "user-123",
      },
    ]);
    const html = await renderHome();
    expect(html).toContain('class="edit-note"');
    expect(html).toContain('class="edit-category"');
    expect(html).toContain('class="edit-reimbursement"');
    expect(html).toContain('class="edit-vacation"');
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
        vacation: false,
      },
    ]);
    const html = await renderHome();
    expect(html).not.toContain('class="edit-note"');
    expect(html).not.toContain('class="edit-category"');
    expect(html).toContain("weekly groceries");
  });
});
