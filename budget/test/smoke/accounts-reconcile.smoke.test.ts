import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, ts, createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { Account, JournalEntry, JournalLeg, ReconciliationEvent, Statement } from "../../src/firestore";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderAccountsReconcile } from "../../src/pages/accounts-reconcile";

// Seed-shaped data for Example Bank / Checking, period 2025-02.
function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "Example Bank_Checking",
    institution: "Example Bank",
    account: "Checking",
    accountType: "asset",
    openingBalance: 1500,
    openingBalanceDate: ts("2024-10-01"),
    groupId: null,
    ...overrides,
  };
}

function entry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "je-grocery",
    timestamp: ts("2025-02-05"),
    description: "Grocery Store",
    note: null,
    legCount: 2,
    groupId: null,
    ...overrides,
  };
}

function leg(overrides: Partial<JournalLeg> = {}): JournalLeg {
  return {
    id: "jl-grocery-checking",
    entryId: "je-grocery",
    accountId: "Example Bank_Checking",
    debit: 0,
    credit: 84.5,
    timestamp: ts("2025-02-05"),
    cleared: true,
    reconciledAt: null,
    reconciledEventId: null,
    statementItemId: null,
    groupId: null,
    ...overrides,
  };
}

function stmt(overrides: Partial<Statement> = {}): Statement {
  return {
    id: "stmt-checking-2025-02",
    statementId: "stmt-checking-2025-02" as any,
    institution: "Example Bank",
    account: "Checking",
    balance: 2315.5,
    period: "2025-02",
    balanceDate: "2025-02-28",
    lastTransactionDate: null,
    groupId: null,
    virtual: false,
    ...overrides,
  };
}

function event(overrides: Partial<ReconciliationEvent> = {}): ReconciliationEvent {
  return {
    id: "Example Bank_Checking_2025-02-28",
    institution: "Example Bank",
    account: "Checking",
    reconciledThroughDate: ts("2025-02-28"),
    bankBalance: 2315.5,
    clearedBalance: 2315.5,
    adjustment: 0,
    reconciledBy: "user@example.com",
    reconciledAt: ts("2025-02-28"),
    legIds: ["jl-grocery-checking"],
    adjustmentEntryId: null,
    groupId: null,
    ...overrides,
  };
}

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

describe("accounts-reconcile page smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // location.search drives parseReconcileQuery
    window.history.replaceState(
      null,
      "",
      "/accounts/reconcile?institution=Example%20Bank&account=Checking&period=2025-02",
    );
  });

  it("renders heading, controls, and the journal-leg list", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getAccounts: vi.fn().mockResolvedValue([account()]),
      getJournalEntries: vi.fn().mockResolvedValue([entry()]),
      getJournalLegs: vi.fn().mockResolvedValue([leg()]),
      getReconciliationEvents: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([stmt()]),
    }));
    expect(html).toContain("<h2>Reconcile account</h2>");
    expect(html).toContain('id="reconcile-container"');
    expect(html).toContain('id="reconcile-controls"');
    expect(html).toContain('id="reconcile-leg-list"');
    expect(html).toContain("Grocery Store");
  });

  it("renders header totals and the reconcile dialog", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getAccounts: vi.fn().mockResolvedValue([account()]),
      getJournalEntries: vi.fn().mockResolvedValue([entry()]),
      getJournalLegs: vi.fn().mockResolvedValue([leg()]),
      getReconciliationEvents: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([stmt()]),
    }));
    expect(html).toContain("Cleared balance:");
    expect(html).toContain("Statement-ending balance:");
    expect(html).toContain('id="reconcile-dialog"');
    expect(html).toContain('id="reconcile-open-dialog"');
  });

  it("renders the account selector from accounts", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getAccounts: vi.fn().mockResolvedValue([
        account(),
        account({ id: "Example Credit Union_Savings", institution: "Example Credit Union", account: "Savings" }),
      ]),
      getJournalEntries: vi.fn().mockResolvedValue([entry()]),
      getJournalLegs: vi.fn().mockResolvedValue([leg()]),
      getReconciliationEvents: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([stmt()]),
    }));
    expect(html).toContain('id="reconcile-account-select"');
    expect(html).toContain('id="reconcile-period-select"');
    expect(html).toContain("Example Bank — Checking");
    expect(html).toContain("Example Credit Union — Savings");
  });

  it("lists a past reconciliation when one exists", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getAccounts: vi.fn().mockResolvedValue([account()]),
      getJournalEntries: vi.fn().mockResolvedValue([entry()]),
      getJournalLegs: vi.fn().mockResolvedValue([leg()]),
      getReconciliationEvents: vi.fn().mockResolvedValue([event()]),
      getStatements: vi.fn().mockResolvedValue([stmt()]),
    }));
    expect(html).toContain("Past reconciliations");
    expect(html).toContain('data-event-id="Example Bank_Checking_2025-02-28"');
  });

  it("renders the mismatch actions and the account type attribute", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getAccounts: vi.fn().mockResolvedValue([account()]),
      getJournalEntries: vi.fn().mockResolvedValue([entry()]),
      getJournalLegs: vi.fn().mockResolvedValue([leg()]),
      getReconciliationEvents: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([stmt()]),
    }));
    expect(html).toContain('id="reconcile-mismatch-actions"');
    expect(html).toContain('data-account-type="asset"');
  });

  it("carries the suspense account id when a suspense account is present", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getAccounts: vi.fn().mockResolvedValue([
        account(),
        account({
          id: "Budget_Adjustment Suspense",
          institution: "Budget",
          account: "Adjustment Suspense",
          accountType: "equity",
        }),
      ]),
      getJournalEntries: vi.fn().mockResolvedValue([entry()]),
      getJournalLegs: vi.fn().mockResolvedValue([leg()]),
      getReconciliationEvents: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([stmt()]),
    }));
    expect(html).toContain('data-suspense-account-id="Budget_Adjustment Suspense"');
  });

  it("renders seed-data notice when not authorized", async () => {
    const html = await renderAccountsReconcile(seedOptions({
      getAccounts: vi.fn().mockResolvedValue([account()]),
      getJournalEntries: vi.fn().mockResolvedValue([entry()]),
      getJournalLegs: vi.fn().mockResolvedValue([leg()]),
      getReconciliationEvents: vi.fn().mockResolvedValue([]),
      getStatements: vi.fn().mockResolvedValue([stmt()]),
    }));
    expect(html).toContain("seed-data-notice");
  });
});
