// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { timestampMockFactory, ts } from "../helpers";

vi.mock("firebase/firestore", () => timestampMockFactory());

const mockDataSource = {
  updateJournalLegCleared: vi.fn(),
};
vi.mock("../../src/active-data-source.js", () => ({
  getActiveDataSource: () => mockDataSource,
}));
vi.mock("@commons-systems/errorutil/log", () => ({
  logError: vi.fn(),
  registerErrorSink: vi.fn(),
}));
vi.mock("@commons-systems/errorutil/defer", () => ({
  deferProgrammerError: vi.fn().mockReturnValue(false),
}));

import { renderReconcileHtml } from "../../src/pages/accounts-reconcile";
import { hydrateAccountsReconcile } from "../../src/pages/accounts-reconcile-hydrate";
import type {
  Account,
  JournalEntry,
  JournalLeg,
  ReconciliationEvent,
  Statement,
  StatementItem,
} from "../../src/firestore";

/** Wait for all pending microtasks and one macrotask cycle. */
function flush(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

// ---- Builder helpers (mirrors accounts-reconcile.test.ts) ----

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

/** Render a full reconcile page into the DOM and hydrate it. Returns the container element. */
function renderAndHydrate(ctxOverrides: Partial<Parameters<typeof renderReconcileHtml>[0]> = {}): HTMLElement {
  const html = renderReconcileHtml(ctx(ctxOverrides));
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
  const container = wrapper.querySelector<HTMLElement>("#reconcile-container")!;
  // hydrateAccountsReconcile expects to find selects/buttons inside the passed
  // element; pass wrapper so #reconcile-confirm-all (inside the container) is
  // findable as well.
  hydrateAccountsReconcile(wrapper);
  return wrapper;
}

describe("hydrateAccountsReconcile — confirm-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataSource.updateJournalLegCleared.mockResolvedValue(undefined);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("confirm-all click persists each suggested leg, removes badges, and updates header", async () => {
    // Two suggested legs (one via statementItemId, one via proximity) and one non-suggested leg.
    const wrapper = renderAndHydrate({
      journalEntries: [
        entry({ id: "e-1", description: "Purchase A" }),
        entry({ id: "e-2", description: "Purchase B" }),
        entry({ id: "e-3", description: "Purchase C" }),
      ],
      journalLegs: [
        // Explicit signal: non-null statementItemId → suggested
        leg({ id: "leg-a", entryId: "e-1", debit: 50, cleared: false, statementItemId: "si-1" as any, timestamp: ts("2025-02-10") }),
        // Proximity signal: amount+date match → suggested
        leg({ id: "leg-b", entryId: "e-2", debit: 30, cleared: false, statementItemId: null, timestamp: ts("2025-02-12") }),
        // No signal → not suggested
        leg({ id: "leg-c", entryId: "e-3", debit: 20, cleared: false, statementItemId: null, timestamp: ts("2025-02-15") }),
      ],
      statementItems: [
        statementItem({ id: "si-1", amount: -50, timestamp: ts("2025-02-10") }),
        // proximity match for leg-b: same amount, date within tolerance
        statementItem({ id: "si-2", statementItemId: "si-2" as any, amount: -30, timestamp: ts("2025-02-13") }),
      ],
    });

    const confirmAllBtn = wrapper.querySelector<HTMLButtonElement>("#reconcile-confirm-all");
    expect(confirmAllBtn).not.toBeNull();

    confirmAllBtn!.click();
    await flush();

    // Both suggested legs should have been persisted as cleared=true.
    expect(mockDataSource.updateJournalLegCleared).toHaveBeenCalledWith("leg-a", true);
    expect(mockDataSource.updateJournalLegCleared).toHaveBeenCalledWith("leg-b", true);
    expect(mockDataSource.updateJournalLegCleared).toHaveBeenCalledTimes(2);

    // Both suggested rows should now have their checkbox checked.
    const rowA = wrapper.querySelector<HTMLElement>('[data-leg-id="leg-a"]')!;
    const rowB = wrapper.querySelector<HTMLElement>('[data-leg-id="leg-b"]')!;
    const rowC = wrapper.querySelector<HTMLElement>('[data-leg-id="leg-c"]')!;

    const checkboxA = rowA.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!;
    const checkboxB = rowB.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!;
    const checkboxC = rowC.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!;

    expect(checkboxA.checked).toBe(true);
    expect(checkboxB.checked).toBe(true);

    // Suggested class and badge removed from confirmed rows.
    expect(rowA.classList.contains("reconcile-suggested")).toBe(false);
    expect(rowB.classList.contains("reconcile-suggested")).toBe(false);
    expect(rowA.querySelector(".reconcile-suggested-badge")).toBeNull();
    expect(rowB.querySelector(".reconcile-suggested-badge")).toBeNull();

    // Non-suggested row untouched.
    expect(checkboxC.checked).toBe(false);
    expect(rowC.classList.contains("reconcile-suggested")).toBe(false);

    // Header cleared-balance reflects the newly-cleared legs (leg-a=50, leg-b=30).
    const clearedEl = wrapper.querySelector<HTMLElement>(".reconcile-cleared-balance");
    expect(clearedEl?.textContent).toContain("$80.00");
  });

  it("single suggested-checkbox toggle to true removes the suggestion styling", async () => {
    const wrapper = renderAndHydrate({
      journalEntries: [entry({ id: "e-1", description: "Coffee" })],
      journalLegs: [
        leg({ id: "leg-x", entryId: "e-1", debit: 5, cleared: false, statementItemId: "si-x" as any, timestamp: ts("2025-02-10") }),
      ],
      statementItems: [
        statementItem({ id: "si-x", statementItemId: "si-x" as any, amount: -5, timestamp: ts("2025-02-10") }),
      ],
    });

    const row = wrapper.querySelector<HTMLElement>('[data-leg-id="leg-x"]')!;
    expect(row.classList.contains("reconcile-suggested")).toBe(true);
    expect(row.querySelector(".reconcile-suggested-badge")).not.toBeNull();

    const checkbox = row.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!;
    // Simulate the user clicking the checkbox — set checked then fire change.
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();

    expect(mockDataSource.updateJournalLegCleared).toHaveBeenCalledWith("leg-x", true);

    expect(row.classList.contains("reconcile-suggested")).toBe(false);
    expect(row.querySelector(".reconcile-suggested-badge")).toBeNull();
  });

  it("unchecking a suggested checkbox dismisses the suggestion styling", async () => {
    const wrapper = renderAndHydrate({
      journalEntries: [entry({ id: "e-1", description: "Coffee" })],
      journalLegs: [
        leg({ id: "leg-x", entryId: "e-1", debit: 5, cleared: false, statementItemId: "si-x" as any, timestamp: ts("2025-02-10") }),
      ],
      statementItems: [
        statementItem({ id: "si-x", statementItemId: "si-x" as any, amount: -5, timestamp: ts("2025-02-10") }),
      ],
    });

    const row = wrapper.querySelector<HTMLElement>('[data-leg-id="leg-x"]')!;
    expect(row.classList.contains("reconcile-suggested")).toBe(true);
    expect(row.querySelector(".reconcile-suggested-badge")).not.toBeNull();

    const checkbox = row.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!;
    // Reject the suggestion: uncheck and fire change.
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();

    expect(mockDataSource.updateJournalLegCleared).toHaveBeenCalledWith("leg-x", false);

    // Rejection dismisses the badge so Confirm-all cannot re-clear the row.
    expect(row.classList.contains("reconcile-suggested")).toBe(false);
    expect(row.querySelector(".reconcile-suggested-badge")).toBeNull();
  });

  it("toggling a confirmed cleared row back to false uses the existing path without errors", async () => {
    // Render a leg that is already cleared (confirmed, not suggested).
    const wrapper = renderAndHydrate({
      journalEntries: [entry({ id: "e-1", description: "Already cleared" })],
      journalLegs: [
        leg({ id: "leg-y", entryId: "e-1", debit: 100, cleared: true, statementItemId: null, timestamp: ts("2025-02-10") }),
      ],
      statementItems: [],
    });

    const row = wrapper.querySelector<HTMLElement>('[data-leg-id="leg-y"]')!;
    expect(row.classList.contains("reconcile-suggested")).toBe(false);

    const checkbox = row.querySelector<HTMLInputElement>(".reconcile-cleared-checkbox")!;
    expect(checkbox.checked).toBe(true);

    // Simulate unchecking.
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();

    expect(mockDataSource.updateJournalLegCleared).toHaveBeenCalledWith("leg-y", false);
    // Row should remain without the suggested class (it was never suggested).
    expect(row.classList.contains("reconcile-suggested")).toBe(false);
    // No badge either.
    expect(row.querySelector(".reconcile-suggested-badge")).toBeNull();
  });
});
