import { describe, it, expect, vi, beforeEach } from "vitest";
import { timestampMockFactory, ts } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

import { renderReconcileHtml, parseReconcileQuery } from "../../src/pages/accounts-reconcile";
import type {
  Account,
  JournalEntry,
  JournalLeg,
  ReconciliationEvent,
  Statement,
  StatementItem,
} from "../../src/firestore";

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "Bank_Checking",
    institution: "Bank",
    account: "Checking",
    accountType: "asset",
    openingBalance: null,
    openingBalanceDate: null,
    groupId: null,
    ...overrides,
  };
}

function entry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "entry-1",
    timestamp: ts("2025-02-10"),
    description: "Entry",
    note: null,
    legCount: 2,
    groupId: null,
    ...overrides,
  };
}

function leg(overrides: Partial<JournalLeg> = {}): JournalLeg {
  return {
    id: "leg-1",
    entryId: "entry-1",
    accountId: "Bank_Checking",
    debit: 0,
    credit: 0,
    timestamp: ts("2025-02-10"),
    cleared: false,
    reconciledAt: null,
    reconciledEventId: null,
    statementItemId: null,
    groupId: null,
    ...overrides,
  };
}

function stmt(overrides: Partial<Statement> = {}): Statement {
  return {
    id: "s-1",
    statementId: "stmt-1" as any,
    institution: "Bank",
    account: "Checking",
    balance: 1000,
    period: "2025-02",
    balanceDate: null,
    lastTransactionDate: null,
    groupId: null,
    virtual: false,
    ...overrides,
  };
}

function event(overrides: Partial<ReconciliationEvent> = {}): ReconciliationEvent {
  return {
    id: "Bank_Checking_2025-02-28",
    institution: "Bank",
    account: "Checking",
    reconciledThroughDate: ts("2025-02-28"),
    bankBalance: 500,
    clearedBalance: 500,
    adjustment: 0,
    reconciledBy: "user@example.com",
    reconciledAt: ts("2025-02-28"),
    legIds: ["leg-1"],
    adjustmentEntryId: null,
    groupId: null,
    ...overrides,
  };
}

function statementItem(overrides: Partial<StatementItem> = {}): StatementItem {
  return {
    id: "si-1",
    statementItemId: "si-1" as any,
    statementId: "stmt-1" as any,
    institution: "Bank",
    account: "Checking",
    period: "2025-02",
    amount: -50,
    timestamp: ts("2025-02-10"),
    description: "Purchase",
    fitid: "fitid-1",
    groupId: null,
    ...overrides,
  };
}

function ctx(overrides: Partial<Parameters<typeof renderReconcileHtml>[0]> = {}) {
  return {
    journalLegs: [] as JournalLeg[],
    journalEntries: [] as JournalEntry[],
    reconciliationEvents: [] as ReconciliationEvent[],
    accounts: [account()],
    statements: [] as Statement[],
    statementItems: [] as StatementItem[],
    query: { institution: "Bank", account: "Checking", period: "2025-02" },
    ...overrides,
  };
}

describe("parseReconcileQuery", () => {
  it("returns nulls for an empty query string", () => {
    const q = parseReconcileQuery("");
    expect(q.institution).toBeNull();
    expect(q.account).toBeNull();
    expect(q.period).toBeNull();
  });

  it("parses institution, account, and period", () => {
    const q = parseReconcileQuery("?institution=Bank&account=Checking&period=2025-02");
    expect(q.institution).toBe("Bank");
    expect(q.account).toBe("Checking");
    expect(q.period).toBe("2025-02");
  });

  it("does not expose a tolerance field", () => {
    const q = parseReconcileQuery("?tolerance=7");
    expect(q).not.toHaveProperty("toleranceDays");
  });
});

describe("renderReconcileHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a prompt when no account selected", () => {
    const html = renderReconcileHtml(ctx({
      query: { institution: null, account: null, period: null },
    }));
    expect(html).toContain("Select an account and period to reconcile");
    expect(html).toContain("reconcile-controls");
  });

  it("renders a single journal-leg list for the selected account and period", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [
        entry({ id: "e-1", description: "Grocery Store" }),
        entry({ id: "e-2", description: "Payroll" }),
      ],
      journalLegs: [
        leg({ id: "leg-a", entryId: "e-1", debit: 50, timestamp: ts("2025-02-05") }),
        leg({ id: "leg-b", entryId: "e-2", debit: 100, timestamp: ts("2025-02-14") }),
      ],
    }));
    expect(html).toContain('id="reconcile-leg-list"');
    expect(html).toContain("Grocery Store");
    expect(html).toContain("Payroll");
    expect(html).toContain('data-leg-id="leg-a"');
    expect(html).toContain('data-signed-amount="50"');
    expect(html).toContain("reconcile-cleared-checkbox");
  });

  it("excludes legs outside the selected period", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-old", description: "Old Leg" })],
      journalLegs: [leg({ id: "leg-old", entryId: "e-old", debit: 10, timestamp: ts("2025-01-15") })],
    }));
    expect(html).not.toContain("Old Leg");
    expect(html).toContain("No journal legs for this account and period");
  });

  it("renders header totals: cleared balance, statement balance, difference", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [
        leg({ id: "leg-a", entryId: "e-1", debit: 200, cleared: true, timestamp: ts("2025-02-05") }),
        leg({ id: "leg-b", entryId: "e-1", debit: 50, cleared: false, timestamp: ts("2025-02-06") }),
      ],
      statements: [stmt({ balance: 150 })],
    }));
    expect(html).toContain("Cleared balance:");
    expect(html).toContain("Statement-ending balance:");
    expect(html).toContain("Difference:");
    expect(html).toContain('id="reconcile-open-dialog"');
  });

  it("omits the statement balance and difference when no statement exists", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [leg({ id: "leg-a", entryId: "e-1", debit: 200, timestamp: ts("2025-02-05") })],
      statements: [],
    }));
    expect(html).toContain("Cleared balance:");
    expect(html).not.toContain("Statement-ending balance:");
    expect(html).not.toContain("Difference:");
  });

  it("disables the checkbox for a reconciled leg", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [
        leg({
          id: "leg-recon",
          entryId: "e-1",
          debit: 100,
          cleared: true,
          reconciledAt: ts("2025-02-28"),
          reconciledEventId: "Bank_Checking_2025-02-28",
          timestamp: ts("2025-02-05"),
        }),
      ],
    }));
    const legIdx = html.indexOf('data-leg-id="leg-recon"');
    const legMarkup = html.slice(legIdx, legIdx + 300);
    expect(legMarkup).toContain("disabled");
    expect(legMarkup).toContain("checked");
  });

  it("renders an aging badge for an uncleared leg older than 30 days", () => {
    const nowMs = ts("2025-03-20").toMillis();
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-old" })],
      journalLegs: [
        leg({ id: "leg-old", entryId: "e-old", debit: 10, cleared: false, timestamp: ts("2025-02-01") }),
      ],
      query: { institution: "Bank", account: "Checking", period: "2025-02" },
      nowMs,
    }));
    expect(html).toMatch(/reconcile-aging.*47d/);
  });

  it("does not render an aging badge on a cleared leg", () => {
    const nowMs = ts("2025-03-20").toMillis();
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-old" })],
      journalLegs: [
        leg({ id: "leg-old", entryId: "e-old", debit: 10, cleared: true, timestamp: ts("2025-02-01") }),
      ],
      nowMs,
    }));
    expect(html).not.toContain("reconcile-aging");
  });

  it("renders a reconcile dialog defaulting to the statement-ending balance", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [leg({ id: "leg-a", entryId: "e-1", debit: 200, timestamp: ts("2025-02-05") })],
      statements: [stmt({ balance: 321.5 })],
    }));
    expect(html).toContain('id="reconcile-dialog"');
    expect(html).toContain('id="reconcile-bank-balance-input"');
    expect(html).toContain('value="321.5"');
    expect(html).toContain('id="reconcile-difference-display"');
  });

  it("lists past reconciliations for the selected account", () => {
    const html = renderReconcileHtml(ctx({
      reconciliationEvents: [
        event({ id: "Bank_Checking_2025-02-28" }),
        event({ id: "Other_Savings_2025-02-28", institution: "Other", account: "Savings" }),
      ],
    }));
    expect(html).toContain('id="reconcile-past"');
    expect(html).toContain("Past reconciliations");
    expect(html).toContain('data-event-id="Bank_Checking_2025-02-28"');
    expect(html).not.toContain('data-event-id="Other_Savings_2025-02-28"');
  });

  it("throws when the selected account is missing", () => {
    expect(() => renderReconcileHtml(ctx({ accounts: [] }))).toThrow(/not found/);
  });

  it("does not render any three-column markup", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [leg({ id: "leg-a", entryId: "e-1", debit: 10, timestamp: ts("2025-02-05") })],
    }));
    expect(html).not.toContain("reconcile-columns");
    expect(html).not.toContain("reconcile-column-");
    expect(html).not.toContain("reconcile-match-");
  });

  it("renders reconcile-suggested class and Bank reported badge for a leg with a non-null statementItemId", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [
        leg({ id: "leg-a", entryId: "e-1", debit: 50, cleared: false, statementItemId: "si-1" as any, timestamp: ts("2025-02-10") }),
      ],
      statementItems: [],
    }));
    expect(html).toContain("reconcile-suggested");
    expect(html).toContain("Bank reported");
    expect(html).toContain("data-suggested");
  });

  it("does not render the suggested treatment for a leg with no statementItemId and no matching statement item", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [
        leg({ id: "leg-a", entryId: "e-1", debit: 75, cleared: false, statementItemId: null, timestamp: ts("2025-02-10") }),
      ],
      statementItems: [],
    }));
    expect(html).not.toContain("reconcile-suggested");
    expect(html).not.toContain("Bank reported");
  });

  it("renders the Confirm-all button when at least one leg is suggested", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [
        leg({ id: "leg-a", entryId: "e-1", debit: 50, cleared: false, statementItemId: "si-1" as any, timestamp: ts("2025-02-10") }),
      ],
      statementItems: [],
    }));
    expect(html).toContain('id="reconcile-confirm-all"');
  });

  it("does not render the Confirm-all button when no legs are suggested", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [
        leg({ id: "leg-a", entryId: "e-1", debit: 50, cleared: false, statementItemId: null, timestamp: ts("2025-02-10") }),
      ],
      statementItems: [],
    }));
    expect(html).not.toContain('id="reconcile-confirm-all"');
  });

  it("does not render the suggested treatment for a cleared leg even with a non-null statementItemId", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [
        leg({ id: "leg-a", entryId: "e-1", debit: 50, cleared: true, statementItemId: "si-1" as any, timestamp: ts("2025-02-10") }),
      ],
      statementItems: [],
    }));
    expect(html).not.toContain("reconcile-suggested");
    expect(html).not.toContain("Bank reported");
    expect(html).not.toContain('id="reconcile-confirm-all"');
  });

  it("does not render the suggested treatment for a reconciled leg even with a non-null statementItemId", () => {
    const html = renderReconcileHtml(ctx({
      journalEntries: [entry({ id: "e-1" })],
      journalLegs: [
        leg({
          id: "leg-a",
          entryId: "e-1",
          debit: 50,
          cleared: true,
          statementItemId: "si-1" as any,
          reconciledEventId: "Bank_Checking_2025-02-28",
          reconciledAt: ts("2025-02-28"),
          timestamp: ts("2025-02-10"),
        }),
      ],
      statementItems: [],
    }));
    expect(html).not.toContain("reconcile-suggested");
    expect(html).not.toContain("Bank reported");
    expect(html).not.toContain('id="reconcile-confirm-all"');
  });
});
