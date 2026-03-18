import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, ts, createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderAccounts } from "../../src/pages/accounts";

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

describe("accounts page smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders accounts page without errors", async () => {
    const html = await renderAccounts(seedOptions());
    expect(html).toContain("<h2>Accounts</h2>");
    expect(html).not.toContain('id="accounts-error"');
  });

  it("table container exists with mock data", async () => {
    const html = await renderAccounts(seedOptions({
      getTransactions: vi.fn().mockResolvedValue([
        {
          id: "t1" as any,
          institution: "Bank",
          account: "Checking",
          description: "Test",
          amount: 50,
          note: "",
          category: "Food",
          reimbursement: 0,
          budget: null,
          timestamp: ts("2025-02-15"),
          statementId: null,
          groupId: null,
          normalizedId: null,
          normalizedPrimary: true,
          normalizedDescription: null,
        },
      ]),
      getStatements: vi.fn().mockResolvedValue([
        {
          id: "s1",
          statementId: "Bank-Checking-2025-02" as any,
          institution: "Bank",
          account: "Checking",
          balance: 1000,
          period: "2025-02",
          groupId: null,
        },
      ]),
    }));
    expect(html).toContain('id="accounts-table"');
  });
});
