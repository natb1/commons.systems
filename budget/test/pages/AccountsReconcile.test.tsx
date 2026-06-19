// @vitest-environment happy-dom
//
// Markup + behavior tests for the React <AccountsReconcile> page (Unit 3). The
// data-loading pipeline (renderAccountsReconcile's Promise.all) runs in a
// useEffect, so each test awaits the load to settle. Compute helpers
// (buildReconcileRows / suggestClearedLegs / balancesMatch / buildAdjustmentEntry)
// are the real reused implementations; only the data source is mocked.
//
// Two data-source seams: the page LOADS via options.dataSource (passed in), and the
// interactive WRITE handlers (toggle / confirm-all / finalize / adjustment) call
// getActiveDataSource() — mocked at the module level, exactly as the legacy hydrate
// test did. We point both at the same mock so writes are observable.
//
// Altitude: assert OBSERVABLE DOM (rendered checkbox state, class/badge presence,
// location.search, button.disabled), never React internals. The legacy hydrate test
// waited on a `dataset.clearedSaved` settle signal; the React equivalent is the
// rendered checkbox state, which RTL's waitFor polls — so we assert that.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { ts } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type {
  Account,
  JournalEntry,
  JournalLeg,
  ReconciliationEvent,
  Statement,
  StatementItem,
} from "../../src/firestore";

vi.mock("firebase/firestore", async () => (await import("../helpers")).timestampMockFactory());

// The interactive handlers call getActiveDataSource().updateJournalLegCleared /
// createJournalEntry / createReconciliationEvent. Mock the module so those writes
// land on our spy.
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
import type { RenderPageOptions } from "../../src/pages/render-options";

// ---- Builders (mirror accounts-reconcile.test.ts) ----

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
    statementId: "stmt-1" as never,
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

function statementItem(overrides: Partial<StatementItem> = {}): StatementItem {
  return {
    id: "si-1",
    statementItemId: "si-1" as never,
    statementId: "stmt-1" as never,
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

function recEvent(overrides: Partial<ReconciliationEvent> = {}): ReconciliationEvent {
  return {
    id: "Bank_Checking_2025-02-28",
    institution: "Bank",
    account: "Checking",
    reconciledThroughDate: ts("2025-02-28"),
    bankBalance: 500,
    clearedBalance: 500,
    adjustment: 0,
    reconciledBy: "local",
    reconciledAt: ts("2025-02-28"),
    legIds: ["leg-1"],
    adjustmentEntryId: null,
    groupId: null,
    ...overrides,
  };
}

interface LoadData {
  journalLegs?: JournalLeg[];
  journalEntries?: JournalEntry[];
  reconciliationEvents?: ReconciliationEvent[];
  accounts?: Account[];
  statements?: Statement[];
  statementItems?: StatementItem[];
}

function makeOptions(data: LoadData = {}): RenderPageOptions {
  const dataSource: Partial<DataSource> = {
    getJournalLegs: vi.fn().mockResolvedValue(data.journalLegs ?? []),
    getJournalEntries: vi.fn().mockResolvedValue(data.journalEntries ?? []),
    getReconciliationEvents: vi.fn().mockResolvedValue(data.reconciliationEvents ?? []),
    getAccounts: vi.fn().mockResolvedValue(data.accounts ?? [account()]),
    getStatements: vi.fn().mockResolvedValue(data.statements ?? []),
    getStatementItems: vi.fn().mockResolvedValue(data.statementItems ?? []),
  };
  return { authorized: true, groupName: "Budget", dataSource: dataSource as DataSource };
}

/** Set the URL query so the page deep-links into a selection. */
function setQuery(search: string): void {
  history.replaceState(null, "", `/accounts/reconcile${search}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  activeDataSource.updateJournalLegCleared.mockResolvedValue(undefined);
  activeDataSource.createJournalEntry.mockResolvedValue({ entryId: "adj-entry-1", legIds: ["adj-leg-1", "adj-leg-2"] });
  activeDataSource.createReconciliationEvent.mockResolvedValue(recEvent());
  setQuery("");
});

afterEach(() => {
  cleanup();
  setQuery("");
});

describe("AccountsReconcile — deep link + leg list + suggestions", () => {
  it("renders the leg list for the deep-linked account/period with suggestion treatment", async () => {
    setQuery("?institution=Bank&account=Checking&period=2025-02");
    const { container } = render(
      <AccountsReconcile
        options={makeOptions({
          journalEntries: [
            entry({ id: "e-1", description: "Grocery Store" }),
            entry({ id: "e-2", description: "Payroll" }),
          ],
          journalLegs: [
            leg({ id: "leg-a", entryId: "e-1", debit: 50, cleared: false, statementItemId: "si-1" as never, timestamp: ts("2025-02-05") }),
            leg({ id: "leg-b", entryId: "e-2", debit: 100, cleared: false, timestamp: ts("2025-02-14") }),
          ],
          statementItems: [],
        })}
      />,
    );

    await waitFor(() => expect(container.querySelector("#reconcile-leg-list")).not.toBeNull());

    // Both legs rendered, in the deep-linked period.
    expect(container.textContent).toContain("Grocery Store");
    expect(container.textContent).toContain("Payroll");

    // leg-a has a non-null statementItemId → suggested treatment + badge.
    const rowA = container.querySelector('[data-leg-id="leg-a"]')!;
    expect(rowA.classList.contains("reconcile-suggested")).toBe(true);
    expect(rowA.querySelector(".reconcile-suggested-badge")).not.toBeNull();
    expect(rowA.textContent).toContain("Bank reported");

    // leg-b has no signal → not suggested.
    const rowB = container.querySelector('[data-leg-id="leg-b"]')!;
    expect(rowB.classList.contains("reconcile-suggested")).toBe(false);

    // Confirm-all button present (at least one suggestion).
    expect(container.querySelector("#reconcile-confirm-all")).not.toBeNull();
  });

  it("prompts to select an account when the URL has no query", async () => {
    setQuery("");
    const { container } = render(<AccountsReconcile options={makeOptions()} />);
    await waitFor(() => expect(container.textContent).toContain("Select an account and period to reconcile"));
    expect(container.querySelector("#reconcile-leg-list")).toBeNull();
  });
});

describe("AccountsReconcile — cleared-toggle optimistic persist + revert", () => {
  it("optimistically checks, persists, and dismisses suggestion on success", async () => {
    setQuery("?institution=Bank&account=Checking&period=2025-02");
    const { container } = render(
      <AccountsReconcile
        options={makeOptions({
          journalEntries: [entry({ id: "e-1", description: "Coffee" })],
          journalLegs: [leg({ id: "leg-x", entryId: "e-1", debit: 5, cleared: false, statementItemId: "si-x" as never, timestamp: ts("2025-02-10") })],
        })}
      />,
    );
    await waitFor(() => expect(container.querySelector('[data-leg-id="leg-x"]')).not.toBeNull());

    const row = container.querySelector('[data-leg-id="leg-x"]')!;
    expect(row.classList.contains("reconcile-suggested")).toBe(true);
    const checkbox = row.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!;

    fireEvent.click(checkbox);

    // Optimistic: checked immediately, before persistence settles.
    expect(checkbox.checked).toBe(true);
    expect(activeDataSource.updateJournalLegCleared).toHaveBeenCalledWith("leg-x", true);

    // After settle: suggestion styling dismissed; header reflects the cleared leg.
    await waitFor(() => expect(row.classList.contains("reconcile-suggested")).toBe(false));
    expect(row.querySelector(".reconcile-suggested-badge")).toBeNull();
    expect(container.querySelector(".reconcile-cleared-balance")?.textContent).toContain("$5.00");
  });

  it("reverts the checkbox when persistence fails", async () => {
    setQuery("?institution=Bank&account=Checking&period=2025-02");
    activeDataSource.updateJournalLegCleared.mockRejectedValue(new Error("offline"));
    const { container } = render(
      <AccountsReconcile
        options={makeOptions({
          journalEntries: [entry({ id: "e-1", description: "Coffee" })],
          journalLegs: [leg({ id: "leg-x", entryId: "e-1", debit: 5, cleared: false, timestamp: ts("2025-02-10") })],
        })}
      />,
    );
    await waitFor(() => expect(container.querySelector('[data-leg-id="leg-x"]')).not.toBeNull());

    const row = container.querySelector('[data-leg-id="leg-x"]')!;
    const checkbox = row.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!;

    fireEvent.click(checkbox);
    // Optimistic check first.
    expect(checkbox.checked).toBe(true);

    // Revert on error: checkbox returns to unchecked and header total back to $0.00.
    await waitFor(() => expect(checkbox.checked).toBe(false));
    expect(container.querySelector(".reconcile-cleared-balance")?.textContent).toContain("$0.00");
  });
});

describe("AccountsReconcile — confirm-all", () => {
  it("bulk-checks suggested rows, persists each, and removes badges", async () => {
    setQuery("?institution=Bank&account=Checking&period=2025-02");
    const { container } = render(
      <AccountsReconcile
        options={makeOptions({
          journalEntries: [
            entry({ id: "e-1", description: "Purchase A" }),
            entry({ id: "e-2", description: "Purchase B" }),
            entry({ id: "e-3", description: "Purchase C" }),
          ],
          journalLegs: [
            leg({ id: "leg-a", entryId: "e-1", debit: 50, cleared: false, statementItemId: "si-1" as never, timestamp: ts("2025-02-10") }),
            leg({ id: "leg-b", entryId: "e-2", debit: 30, cleared: false, timestamp: ts("2025-02-12") }),
            leg({ id: "leg-c", entryId: "e-3", debit: 20, cleared: false, timestamp: ts("2025-02-15") }),
          ],
          statementItems: [
            statementItem({ id: "si-1", amount: -50, timestamp: ts("2025-02-10") }),
            statementItem({ id: "si-2", statementItemId: "si-2" as never, amount: -30, timestamp: ts("2025-02-13") }),
          ],
        })}
      />,
    );
    await waitFor(() => expect(container.querySelector("#reconcile-confirm-all")).not.toBeNull());

    fireEvent.click(container.querySelector<HTMLButtonElement>("#reconcile-confirm-all")!);

    await waitFor(() => expect(activeDataSource.updateJournalLegCleared).toHaveBeenCalledTimes(2));
    expect(activeDataSource.updateJournalLegCleared).toHaveBeenCalledWith("leg-a", true);
    expect(activeDataSource.updateJournalLegCleared).toHaveBeenCalledWith("leg-b", true);

    const rowA = container.querySelector('[data-leg-id="leg-a"]')!;
    const rowB = container.querySelector('[data-leg-id="leg-b"]')!;
    const rowC = container.querySelector('[data-leg-id="leg-c"]')!;
    expect(rowA.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!.checked).toBe(true);
    expect(rowB.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!.checked).toBe(true);
    expect(rowC.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!.checked).toBe(false);

    await waitFor(() => expect(rowA.classList.contains("reconcile-suggested")).toBe(false));
    expect(rowB.classList.contains("reconcile-suggested")).toBe(false);
    expect(rowA.querySelector(".reconcile-suggested-badge")).toBeNull();

    // Header reflects leg-a (50) + leg-b (30).
    expect(container.querySelector(".reconcile-cleared-balance")?.textContent).toContain("$80.00");
  });
});

describe("AccountsReconcile — dialog finalize on balances-match", () => {
  it("submitting a matching bank balance finalizes and reloads", async () => {
    setQuery("?institution=Bank&account=Checking&period=2025-02");
    const { container } = render(
      <AccountsReconcile
        options={makeOptions({
          journalEntries: [entry({ id: "e-1", description: "Payroll" })],
          journalLegs: [leg({ id: "leg-a", entryId: "e-1", debit: 200, cleared: true, timestamp: ts("2025-02-05") })],
          statements: [stmt({ balance: 200 })],
        })}
      />,
    );
    await waitFor(() => expect(container.querySelector("#reconcile-open-dialog")).not.toBeNull());

    fireEvent.click(container.querySelector<HTMLButtonElement>("#reconcile-open-dialog")!);

    // Bank input defaults to the statement balance (200) — which matches cleared (200).
    const bankInput = container.querySelector<HTMLInputElement>("#reconcile-bank-balance-input")!;
    expect(bankInput.value).toBe("200");

    fireEvent.submit(container.querySelector<HTMLFormElement>("#reconcile-dialog-form")!);

    await waitFor(() => expect(activeDataSource.createReconciliationEvent).toHaveBeenCalledTimes(1));
    const [fields, legIds] = activeDataSource.createReconciliationEvent.mock.calls[0];
    expect(fields.institution).toBe("Bank");
    expect(fields.account).toBe("Checking");
    expect(fields.bankBalance).toBe(200);
    expect(fields.clearedBalance).toBe(200);
    expect(fields.adjustment).toBe(0);
    expect(legIds).toContain("leg-a");
  });

  it("a mismatched balance reveals the mismatch actions without finalizing", async () => {
    setQuery("?institution=Bank&account=Checking&period=2025-02");
    const { container } = render(
      <AccountsReconcile
        options={makeOptions({
          journalEntries: [entry({ id: "e-1" })],
          journalLegs: [leg({ id: "leg-a", entryId: "e-1", debit: 200, cleared: true, timestamp: ts("2025-02-05") })],
          statements: [stmt({ balance: 150 })],
        })}
      />,
    );
    await waitFor(() => expect(container.querySelector("#reconcile-open-dialog")).not.toBeNull());

    fireEvent.click(container.querySelector<HTMLButtonElement>("#reconcile-open-dialog")!);
    fireEvent.submit(container.querySelector<HTMLFormElement>("#reconcile-dialog-form")!);

    await waitFor(() => expect((container.querySelector<HTMLElement>("#reconcile-mismatch-actions")!).hidden).toBe(false));
    expect(container.querySelector("#reconcile-difference-display")?.textContent).toContain("Difference: $50.00");
    expect(activeDataSource.createReconciliationEvent).not.toHaveBeenCalled();
  });
});

describe("AccountsReconcile — adjustment entry + re-entrancy guard", () => {
  it("creates a balanced adjustment, finalizes, and disables the create button (no orphan retry)", async () => {
    setQuery("?institution=Bank&account=Checking&period=2025-02");
    // Slow the entry creation so we can observe the disabled state before settle.
    let resolveEntry!: (v: { entryId: string; legIds: string[] }) => void;
    activeDataSource.createJournalEntry.mockReturnValue(new Promise((r) => { resolveEntry = r; }));

    const { container } = render(
      <AccountsReconcile
        options={makeOptions({
          accounts: [
            account(),
            account({ id: "Budget_Adjustment Suspense", institution: "Budget", account: "Adjustment Suspense", accountType: "equity" }),
          ],
          journalEntries: [entry({ id: "e-1" })],
          journalLegs: [leg({ id: "leg-a", entryId: "e-1", debit: 200, cleared: true, timestamp: ts("2025-02-05") })],
          statements: [stmt({ balance: 150 })],
        })}
      />,
    );
    await waitFor(() => expect(container.querySelector("#reconcile-open-dialog")).not.toBeNull());

    // The container should carry the suspense account id (mismatch escape hatch enabled).
    expect(container.querySelector("#reconcile-container")?.getAttribute("data-suspense-account-id")).toBe("Budget_Adjustment Suspense");

    fireEvent.click(container.querySelector<HTMLButtonElement>("#reconcile-open-dialog")!);
    fireEvent.submit(container.querySelector<HTMLFormElement>("#reconcile-dialog-form")!);
    await waitFor(() => expect((container.querySelector<HTMLElement>("#reconcile-mismatch-actions")!).hidden).toBe(false));

    const createBtn = container.querySelector<HTMLButtonElement>("#reconcile-create-adjustment")!;
    fireEvent.click(createBtn);

    // Re-entrancy guard: button disabled while the entry is being written.
    await waitFor(() => expect(createBtn.disabled).toBe(true));
    expect(activeDataSource.createJournalEntry).toHaveBeenCalledTimes(1);

    // A second click while disabled must not start a second entry (no orphan).
    fireEvent.click(createBtn);
    expect(activeDataSource.createJournalEntry).toHaveBeenCalledTimes(1);

    // Finish the entry creation; finalize fires with the signed difference (200-150=50).
    resolveEntry({ entryId: "adj-entry-1", legIds: ["adj-leg-1", "adj-leg-2"] });
    await waitFor(() => expect(activeDataSource.createReconciliationEvent).toHaveBeenCalledTimes(1));
    const [fields, legIds] = activeDataSource.createReconciliationEvent.mock.calls[0];
    expect(fields.adjustment).toBe(50);
    expect(fields.adjustmentEntryId).toBe("adj-entry-1");
    expect(legIds).toEqual(expect.arrayContaining(["leg-a", "adj-leg-1", "adj-leg-2"]));
  });
});

describe("AccountsReconcile — account/period select updates the URL", () => {
  it("selecting an account writes institution/account to the URL and re-resolves", async () => {
    setQuery("");
    const { container } = render(
      <AccountsReconcile
        options={makeOptions({
          accounts: [account({ id: "Bank_Checking", institution: "Bank", account: "Checking" })],
          journalLegs: [leg({ id: "leg-a", accountId: "Bank_Checking", debit: 10, timestamp: ts("2025-02-10") })],
        })}
      />,
    );
    await waitFor(() => expect(container.querySelector("#reconcile-account-select")).not.toBeNull());

    const accountSelect = container.querySelector<HTMLSelectElement>("#reconcile-account-select")!;
    fireEvent.change(accountSelect, { target: { value: "Bank\tChecking" } });

    // The URL now carries the selected institution + account (the deep-link write).
    expect(location.search).toContain("institution=Bank");
    expect(location.search).toContain("account=Checking");

    // The period select becomes enabled (a period is available for the account).
    await waitFor(() => {
      const periodSelect = container.querySelector<HTMLSelectElement>("#reconcile-period-select")!;
      expect(periodSelect.disabled).toBe(false);
    });

    // Selecting a period writes it to the URL too.
    const periodSelect = container.querySelector<HTMLSelectElement>("#reconcile-period-select")!;
    fireEvent.change(periodSelect, { target: { value: "2025-02" } });
    expect(location.search).toContain("period=2025-02");
  });
});
