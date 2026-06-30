// @vitest-environment happy-dom
//
// Smoke test for the React <AccountsReconcile> page. Ported from the legacy
// renderAccountsReconcile string-render smoke (deleted in Unit 4): the reconcile
// route is React now, so we render <AccountsReconcile options=…> with a deep-link
// URL query and assert the observable DOM. Mirrors AccountsReconcile.test.tsx.
//
// Note on header labels: the DS Metric splits label/value into separate nodes
// and drops the legacy trailing colon, so the legacy `Cleared balance:` /
// `Statement-ending balance:` substrings no longer apply. We assert the stable
// .reconcile-cleared-balance / .reconcile-statement-balance value spans the
// React page preserves (and the colon-less label text).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { timestampMockFactory, ts, createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { Account, JournalEntry, JournalLeg, ReconciliationEvent, Statement } from "../../src/firestore";

vi.mock("firebase/firestore", () => timestampMockFactory());

const activeDataSource = {
  updateJournalLegCleared: vi.fn(),
  createJournalEntry: vi.fn(),
  createReconciliationEvent: vi.fn(),
};
vi.mock("../../src/active-data-source.js", () => ({
  getActiveDataSource: () => activeDataSource,
  setActiveDataSource: vi.fn(),
}));

import { AccountsReconcile } from "../../src/pages/AccountsReconcile";

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
    statementId: "stmt-checking-2025-02" as never,
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

interface LoadData {
  accounts?: Account[];
  journalEntries?: JournalEntry[];
  journalLegs?: JournalLeg[];
  reconciliationEvents?: ReconciliationEvent[];
  statements?: Statement[];
}

function seedOptions(data: LoadData = {}) {
  const dsOverrides: Partial<DataSource> = {
    getAccounts: vi.fn().mockResolvedValue(data.accounts ?? [account()]),
    getJournalEntries: vi.fn().mockResolvedValue(data.journalEntries ?? [entry()]),
    getJournalLegs: vi.fn().mockResolvedValue(data.journalLegs ?? [leg()]),
    getReconciliationEvents: vi.fn().mockResolvedValue(data.reconciliationEvents ?? []),
    getStatements: vi.fn().mockResolvedValue(data.statements ?? [stmt()]),
    getStatementItems: vi.fn().mockResolvedValue([]),
  };
  return { authorized: false, groupName: "", dataSource: createMockDataSource(dsOverrides) };
}

// Render <AccountsReconcile> and resolve once the loaded container appears.
async function renderReconcile(data: LoadData = {}): Promise<HTMLElement> {
  const { container } = render(createElement(AccountsReconcile, { options: seedOptions(data) }));
  await waitFor(() => {
    const settled =
      container.querySelector("#reconcile-container") ||
      container.querySelector("#reconcile-error");
    if (!settled) throw new Error("not settled");
  });
  return container;
}

describe("accounts-reconcile page smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeDataSource.updateJournalLegCleared.mockResolvedValue(undefined);
    // location.search drives the deep-link query the page reads at mount.
    window.history.replaceState(
      null,
      "",
      "/accounts/reconcile?institution=Example%20Bank&account=Checking&period=2025-02",
    );
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/accounts/reconcile");
  });

  it("renders heading, controls, and the journal-leg list", async () => {
    const container = await renderReconcile();
    expect(container.textContent).toContain("Reconcile account");
    expect(container.querySelector("#reconcile-container")).not.toBeNull();
    expect(container.querySelector("#reconcile-controls")).not.toBeNull();
    expect(container.querySelector("#reconcile-leg-list")).not.toBeNull();
    expect(container.textContent).toContain("Grocery Store");
  });

  it("renders header totals and the reconcile dialog", async () => {
    const container = await renderReconcile();
    // DS Metric labels (colon-less) + the preserved value spans.
    expect(container.textContent).toContain("Cleared balance");
    expect(container.querySelector(".reconcile-cleared-balance")).not.toBeNull();
    expect(container.textContent).toContain("Statement-ending balance");
    expect(container.querySelector(".reconcile-statement-balance")).not.toBeNull();
    expect(container.querySelector("#reconcile-dialog")).not.toBeNull();
    expect(container.querySelector("#reconcile-open-dialog")).not.toBeNull();
  });

  it("renders the account selector from accounts", async () => {
    const container = await renderReconcile({
      accounts: [
        account(),
        account({ id: "Example Credit Union_Savings", institution: "Example Credit Union", account: "Savings" }),
      ],
    });
    expect(container.querySelector("#reconcile-account-select")).not.toBeNull();
    expect(container.querySelector("#reconcile-period-select")).not.toBeNull();
    expect(container.textContent).toContain("Example Bank — Checking");
    expect(container.textContent).toContain("Example Credit Union — Savings");
  });

  it("lists a past reconciliation when one exists", async () => {
    const container = await renderReconcile({ reconciliationEvents: [event()] });
    expect(container.textContent).toContain("Past reconciliations");
    expect(container.querySelector('[data-event-id="Example Bank_Checking_2025-02-28"]')).not.toBeNull();
  });

  it("renders the mismatch actions and the account type attribute", async () => {
    const container = await renderReconcile();
    expect(container.querySelector("#reconcile-mismatch-actions")).not.toBeNull();
    expect(container.querySelector('[data-account-type="asset"]')).not.toBeNull();
  });

  it("carries the suspense account id when a suspense account is present", async () => {
    const container = await renderReconcile({
      accounts: [
        account(),
        account({
          id: "Budget_Adjustment Suspense",
          institution: "Budget",
          account: "Adjustment Suspense",
          accountType: "equity",
        }),
      ],
    });
    expect(container.querySelector('[data-suspense-account-id="Budget_Adjustment Suspense"]')).not.toBeNull();
  });

  it("renders seed-data notice when not authorized", async () => {
    const container = await renderReconcile();
    expect(container.querySelector("#seed-data-notice")).not.toBeNull();
  });
});
