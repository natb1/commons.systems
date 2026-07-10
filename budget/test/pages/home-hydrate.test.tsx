// @vitest-environment happy-dom
//
// Behavior parity lock for the /transactions table interactivity — blur-save and
// infinite-scroll. Ported from the imperative hydrateTransactionTable suite to
// drive the React <Transactions> page directly.
//
// EXPECTED STATE AFTER UNIT 7a: RED. Unit 3 ported only the markup; the table's
// blur-save and IntersectionObserver infinite-scroll are NOT yet wired into React
// (they still live in the imperative home-hydrate.ts, which <Transactions> does
// not call). So these tests fail with clean "feature not wired yet" assertions —
// updateTransaction / adjustBudgetPeriodTotal are never called, appended rows
// never appear. Unit 4 wires the interactivity into React state/effects and turns
// every test here GREEN. This file is the contract Unit 4 must satisfy.
//
// ALTITUDE: render <Transactions options> via RTL, drive real user interactions
// (type into a cell + dispatch a native blur; trigger the IntersectionObserver
// sentinel), and assert against the MOCKED active data source
// (getActiveDataSource) + the rendered DOM. No React internals, no hook-call
// counts. getActiveDataSource is mocked to a single mock object that is ALSO the
// options.dataSource used for the initial load, so loads and saves go through one
// observable surface (matching Unit 4: load from options.dataSource at mount,
// save via getActiveDataSource()).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { createMockDataSource } from "../helpers";
import type { DataSource } from "../../src/data-source";
import type { Transaction, Budget, BudgetPeriod } from "../../src/firestore";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
    static fromMillis(ms: number) { return new Timestamp(new Date(ms)); }
  },
}));

// Real balance math (computeNetAmount) so period-total deltas are exact; stub the
// heavy balance aggregation to a constant map.
vi.mock("../../src/balance.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/balance")>();
  return { ...actual, computeAllBudgetBalances: vi.fn(() => new Map()) };
});

vi.mock("@commons-systems/components/autocomplete", () => ({
  showDropdown: vi.fn(),
  removeDropdown: vi.fn(),
  registerAutocompleteListeners: vi.fn(),
  _resetForTest: vi.fn(),
}));

// The chart island's d3 build is irrelevant to table-interactivity parity; stub it.
vi.mock("../../src/pages/home-chart.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/pages/home-chart")>();
  return { ...actual, buildCategorySankey: vi.fn(() => () => {}) };
});

// getActiveDataSource returns the SAME mock used for the initial load. Unit 4's
// blur-save and scroll-fetch both call getActiveDataSource(); the load uses
// options.dataSource. Pointing both at one mock gives a single assertion surface.
let activeDS: DataSource;
vi.mock("../../src/active-data-source.js", () => ({
  getActiveDataSource: () => activeDS,
  setActiveDataSource: (ds: DataSource) => { activeDS = ds; },
}));

import { Transactions } from "../../src/pages/Transactions";

function mockTimestamp(ms: number) {
  return { toDate: () => new Date(ms), toMillis: () => ms } as import("firebase/firestore").Timestamp;
}

const JAN_15 = new Date("2025-01-15").getTime();

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    institution: "Bank A",
    account: "Checking",
    description: "Grocery store",
    amount: 52.30,
    note: "original note",
    category: "Food",
    reimbursement: 0,
    budget: null,
    timestamp: mockTimestamp(JAN_15),
    statementId: null,
    groupId: "household",
    normalizedId: null,
    normalizedPrimary: true,
    normalizedDescription: null,
    virtual: false,
    ...overrides,
  } as Transaction;
}

// budget-food / budget-vacation / budget-housing with periods spanning Jan 13–20,
// mirroring the imperative suite's fixtures so the period-sync deltas match.
const budgets: Budget[] = [
  { id: "budget-food", name: "food", allowance: 150, rollover: "none", overrides: [], groupId: "household" } as unknown as Budget,
  { id: "budget-vacation", name: "vacation", allowance: 100, rollover: "none", overrides: [], groupId: "household" } as unknown as Budget,
  { id: "budget-housing", name: "housing", allowance: 200, rollover: "none", overrides: [], groupId: "household" } as unknown as Budget,
];

const periods: BudgetPeriod[] = [
  { id: "food-w2", budgetId: "budget-food", periodStart: mockTimestamp(new Date("2025-01-13").getTime()), periodEnd: mockTimestamp(new Date("2025-01-20").getTime()), total: 50, count: 0, categoryBreakdown: {}, groupId: null } as unknown as BudgetPeriod,
  { id: "vacation-w1", budgetId: "budget-vacation", periodStart: mockTimestamp(new Date("2025-01-13").getTime()), periodEnd: mockTimestamp(new Date("2025-01-20").getTime()), total: 30, count: 0, categoryBreakdown: {}, groupId: null } as unknown as BudgetPeriod,
];

function flush(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

// Render an authorized <Transactions> and wait for the table to mount. Returns the
// container so tests can query the rendered rows.
async function renderTable(txns: Transaction[]): Promise<HTMLElement> {
  const ds = createMockDataSource({
    getTransactions: vi.fn().mockResolvedValue(txns),
    getBudgets: vi.fn().mockResolvedValue(budgets),
    getBudgetPeriods: vi.fn().mockResolvedValue(periods),
    updateTransaction: vi.fn().mockResolvedValue(undefined),
    adjustBudgetPeriodTotal: vi.fn().mockResolvedValue(undefined),
  });
  activeDS = ds;
  const { container } = render(
    <Transactions options={{ authorized: true, groupName: "household", dataSource: ds }} />,
  );
  await waitFor(() => {
    if (!container.querySelector("#transactions-table")) throw new Error("no table");
  });
  return container;
}

function blur(input: HTMLInputElement): void {
  input.dispatchEvent(new Event("blur", { bubbles: true }));
}

describe("Transactions table interactivity (blur-save + infinite-scroll) — Unit 4 contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  describe("blur-save", () => {
    it("saves note field on blur", async () => {
      const c = await renderTable([txn({ note: "original note" })]);
      const input = c.querySelector(".edit-note") as HTMLInputElement;
      input.value = "updated note";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalledWith("txn-1", { note: "updated note" });
    });

    it("saves category field on blur", async () => {
      const c = await renderTable([txn({ category: "Food" })]);
      const input = c.querySelector(".edit-category") as HTMLInputElement;
      input.value = "Travel";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalledWith("txn-1", { category: "Travel" });
    });

    it("saves reimbursement as a number on blur", async () => {
      const c = await renderTable([txn({ reimbursement: 0, budget: "budget-food" })]);
      const input = c.querySelector(".edit-reimbursement") as HTMLInputElement;
      input.value = "75";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalledWith("txn-1", { reimbursement: 75 });
    });

    it("rejects a cleared reimbursement instead of persisting 0%", async () => {
      const c = await renderTable([txn({ reimbursement: 50, budget: "budget-food" })]);
      const input = c.querySelector(".edit-reimbursement") as HTMLInputElement; // type-safety-ok: test DOM query
      input.value = "";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).not.toHaveBeenCalled();
    });

    it("saves budget field on blur (resolved to its id)", async () => {
      const c = await renderTable([txn({ budget: null })]);
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalledWith("txn-1", { budget: "budget-vacation" });
    });

    it("saves budget as null when cleared", async () => {
      const c = await renderTable([txn({ budget: "budget-food" })]);
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalledWith("txn-1", { budget: null });
    });

    it("skips save when the value has not changed", async () => {
      const c = await renderTable([txn({ note: "original note" })]);
      const input = c.querySelector(".edit-note") as HTMLInputElement;
      blur(input); // value unchanged from its rendered default
      await flush();
      expect(activeDS.updateTransaction).not.toHaveBeenCalled();
    });

    it("renders reimbursement input as type=number with min=0 and max=100 (parity with legacy markup)", async () => {
      const c = await renderTable([txn({ reimbursement: 50, budget: "budget-food" })]);
      const input = c.querySelector(".edit-reimbursement") as HTMLInputElement;
      expect(input.type).toBe("number");
      expect(input.min).toBe("0");
      expect(input.max).toBe("100");
    });

    it("shows an input error for an unknown budget name and does not save", async () => {
      const c = await renderTable([txn({ budget: "budget-food" })]);
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "nonexistent";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).not.toHaveBeenCalled();
      expect(input.classList.contains("save-error")).toBe(true);
    });

    it("reverts the input and flags save-error when the save fails (handleSaveError)", async () => {
      const c = await renderTable([txn({ note: "original note" })]);
      (activeDS.updateTransaction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("permission denied"));
      const input = c.querySelector(".edit-note") as HTMLInputElement;
      input.value = "updated";
      blur(input);
      await flush();
      expect(input.value).toBe("original note");
      expect(input.classList.contains("save-error")).toBe(true);
    });

    it("does not save when the focused input is outside a txn-row", async () => {
      const c = await renderTable([txn()]);
      const stray = document.createElement("input");
      stray.className = "edit-note";
      stray.value = "x";
      c.appendChild(stray);
      stray.value = "changed";
      blur(stray);
      await flush();
      expect(activeDS.updateTransaction).not.toHaveBeenCalled();
    });
  });

  describe("period-total sync (adjustBudgetPeriodTotal)", () => {
    it("decrements the old period and increments the new period on a budget change", async () => {
      const c = await renderTable([txn({ budget: "budget-food", amount: 30, reimbursement: 0, timestamp: mockTimestamp(JAN_15) })]);
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalledWith("txn-1", { budget: "budget-vacation" });
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -30);
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 30);
    });

    it("only decrements the old period when no matching new period exists", async () => {
      const c = await renderTable([txn({ budget: "budget-food", amount: 30, timestamp: mockTimestamp(JAN_15) })]);
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "housing"; // budget-housing has no period
      blur(input);
      await flush();
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledTimes(1);
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -30);
    });

    it("only increments the new period when the old budget was null", async () => {
      const c = await renderTable([txn({ budget: null, amount: 30, timestamp: mockTimestamp(JAN_15) })]);
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      blur(input);
      await flush();
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledTimes(1);
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 30);
    });

    it("uses the net amount (after reimbursement) for the period delta", async () => {
      const c = await renderTable([txn({ budget: "budget-food", amount: 100, reimbursement: 50, timestamp: mockTimestamp(JAN_15) })]);
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      blur(input);
      await flush();
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -50);
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 50);
    });

    it("adjusts the period total when reimbursement changes on a budgeted transaction", async () => {
      const c = await renderTable([txn({ budget: "budget-food", amount: 100, reimbursement: 0, timestamp: mockTimestamp(JAN_15) })]);
      const input = c.querySelector(".edit-reimbursement") as HTMLInputElement;
      input.value = "50";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalledWith("txn-1", { reimbursement: 50 });
      expect(activeDS.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -50);
    });

    it("does not adjust any period when the transaction has no budget", async () => {
      const c = await renderTable([txn({ budget: null, amount: 100, reimbursement: 0, timestamp: mockTimestamp(JAN_15) })]);
      const input = c.querySelector(".edit-reimbursement") as HTMLInputElement;
      input.value = "50";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalled();
      expect(activeDS.adjustBudgetPeriodTotal).not.toHaveBeenCalled();
    });

    it("clears the displayed balance to -- after a budget change", async () => {
      const c = await renderTable([txn({ budget: "budget-food", amount: 30, timestamp: mockTimestamp(JAN_15) })]);
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      blur(input);
      await flush();
      const balance = c.querySelector(".budget-balance");
      // After Unit 4: balance display is cleared on budget change. (No balance row
      // may render at all under the stubbed computeAllBudgetBalances, so guard.)
      if (balance) expect(balance.textContent).toBe("--");
      else expect.fail("expected a budget-balance element to clear after a budget change");
    });

    it("preserves the transaction save when the period adjustment fails", async () => {
      const c = await renderTable([txn({ budget: "budget-food", amount: 30, timestamp: mockTimestamp(JAN_15) })]);
      (activeDS.adjustBudgetPeriodTotal as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("firestore unavailable"));
      const input = c.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      blur(input);
      await flush();
      expect(activeDS.updateTransaction).toHaveBeenCalledWith("txn-1", { budget: "budget-vacation" });
    });
  });

  describe("accordion + statement source", () => {
    it("does not toggle the accordion when an input inside the summary is clicked", async () => {
      const c = await renderTable([txn({ budget: "budget-food" })]);
      const details = c.querySelector("details.txn-row") as HTMLDetailsElement;
      expect(details.open).toBe(false);
      const input = c.querySelector(".edit-note") as HTMLInputElement;
      input.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await flush();
      expect(details.open).toBe(false);
    });

    it("opens the statement source viewer when the source link is clicked", async () => {
      const view = await import("../../src/pages/statement-source-view.js");
      const spy = vi.spyOn(view, "openStatementSource").mockResolvedValue(undefined as never);
      const c = await renderTable([txn({ statementId: "stmt-2025-01" })]);
      const link = c.querySelector(".statement-source-link") as HTMLElement;
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await flush();
      expect(spy).toHaveBeenCalledWith("stmt-2025-01");
    });
  });

  describe("infinite scroll", () => {
    // The sentinel becomes an effect-driven IntersectionObserver in Unit 4. happy-dom
    // has no real IntersectionObserver; install a fake that lets a test fire the
    // intersection callback on demand.
    let observers: Array<{ cb: IntersectionObserverCallback; el: Element }>;
    beforeEach(() => {
      observers = [];
      class FakeIO {
        cb: IntersectionObserverCallback;
        constructor(cb: IntersectionObserverCallback) { this.cb = cb; }
        observe(el: Element) { observers.push({ cb: this.cb, el }); }
        unobserve() {}
        disconnect() {}
        takeRecords() { return []; }
      }
      vi.stubGlobal("IntersectionObserver", FakeIO as unknown as typeof IntersectionObserver);
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function triggerScroll(): void {
      const o = observers[observers.length - 1];
      if (!o) throw new Error("no IntersectionObserver was registered on the sentinel (infinite scroll not wired)");
      o.cb([{ isIntersecting: true, target: o.el } as IntersectionObserverEntry], o as unknown as IntersectionObserver);
    }

    it("fetches the next batch with {since, before} when the sentinel intersects", async () => {
      const c = await renderTable([txn({ id: "t1", timestamp: mockTimestamp(JAN_15) })]);
      (activeDS.getTransactions as ReturnType<typeof vi.fn>).mockClear();
      (activeDS.getTransactions as ReturnType<typeof vi.fn>).mockResolvedValue([
        txn({ id: "t2", description: "Older txn", timestamp: mockTimestamp(new Date("2024-12-01").getTime()) }),
      ]);
      triggerScroll();
      await flush();
      expect(activeDS.getTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ since: expect.anything(), before: expect.anything() }),
      );
    });

    it("appends the fetched older rows to the table", async () => {
      const c = await renderTable([txn({ id: "t1", timestamp: mockTimestamp(JAN_15) })]);
      (activeDS.getTransactions as ReturnType<typeof vi.fn>).mockResolvedValue([
        txn({ id: "t2", description: "Older txn", timestamp: mockTimestamp(new Date("2024-12-01").getTime()) }),
      ]);
      triggerScroll();
      await waitFor(() => {
        if (!c.textContent?.includes("Older txn")) throw new Error("not appended");
      });
      expect(c.textContent).toContain("Older txn");
    });

    it("runs a final unbounded {before} batch and removes the sentinel when a batch comes back empty", async () => {
      const c = await renderTable([txn({ id: "t1", timestamp: mockTimestamp(JAN_15) })]);
      const getTxns = activeDS.getTransactions as ReturnType<typeof vi.fn>;
      getTxns.mockResolvedValueOnce([]); // windowed batch empty → triggers final batch
      getTxns.mockResolvedValueOnce([
        txn({ id: "t3", description: "Final older", timestamp: mockTimestamp(new Date("2023-01-01").getTime()) }),
      ]);
      triggerScroll();
      await flush();
      await flush();
      // Final unbounded fetch: a {before} query WITHOUT since.
      const calledWithBeforeOnly = getTxns.mock.calls.some(
        ([q]: [Record<string, unknown>]) => q && "before" in q && !("since" in q),
      );
      expect(calledWithBeforeOnly, "expected a final unbounded {before} batch fetch").toBe(true);
      expect(c.querySelector("#scroll-sentinel")).toBeNull();
    });

    it("suppresses an orphan non-primary member appended without its primary (#1266)", async () => {
      const c = await renderTable([txn({ id: "t1", timestamp: mockTimestamp(JAN_15) })]);
      (activeDS.getTransactions as ReturnType<typeof vi.fn>).mockResolvedValue([
        txn({ id: "orphan-b", description: "OrphanMember", amount: 50, normalizedId: "norm-x", normalizedPrimary: false, timestamp: mockTimestamp(new Date("2024-12-01").getTime()) }),
      ]);
      triggerScroll();
      await flush();
      await flush();
      // The orphan member is suppressed and the table stays intact (no crash / no
      // data-error region replacing the table).
      expect(c.querySelector("#transactions-table")).not.toBeNull();
      expect(c.textContent).not.toContain("OrphanMember");
    });

    it("shows a transient scroll error (retryable, sentinel kept) on a generic fetch failure", async () => {
      const c = await renderTable([txn({ id: "t1", timestamp: mockTimestamp(JAN_15) })]);
      (activeDS.getTransactions as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));
      triggerScroll();
      await waitFor(() => {
        if (!c.querySelector(".scroll-error")) throw new Error("no error yet");
      });
      expect(c.querySelector(".scroll-error")?.textContent).toContain("Failed to load older transactions");
      // Transient error keeps the sentinel so the user can retry by scrolling.
      expect(c.querySelector("#scroll-sentinel")).not.toBeNull();
    });

    it("shows a data-integrity scroll error and removes the sentinel on a corrupt batch", async () => {
      const { DataIntegrityError } = await import("@commons-systems/firestoreutil/errors");
      const c = await renderTable([txn({ id: "t1", timestamp: mockTimestamp(JAN_15) })]);
      (activeDS.getTransactions as ReturnType<typeof vi.fn>).mockRejectedValue(new DataIntegrityError("corrupt"));
      triggerScroll();
      await waitFor(() => {
        if (!c.querySelector(".scroll-error")) throw new Error("no error yet");
      });
      expect(c.querySelector(".scroll-error")?.textContent).toContain("Data error");
      expect(c.querySelector("#scroll-sentinel")).toBeNull();
    });

    it("updates the chart when older transactions are appended (#578)", async () => {
      // The chart island re-renders from updated props (appended transactions) in
      // Unit 4; the observable proxy is that buildCategorySankey is re-invoked with
      // the appended data (or the props-driven re-render runs). We assert the
      // appended row is incorporated by the chart-update path: buildCategorySankey
      // mock is called again after the append with the larger transaction set.
      const chart = await import("../../src/pages/home-chart.js");
      const buildSpy = chart.buildCategorySankey as ReturnType<typeof vi.fn>;
      const c = await renderTable([txn({ id: "t1", category: "Food", timestamp: mockTimestamp(JAN_15) })]);
      const callsBefore = buildSpy.mock.calls.length;
      (activeDS.getTransactions as ReturnType<typeof vi.fn>).mockResolvedValue([
        txn({ id: "t2", category: "Travel", description: "Older travel", timestamp: mockTimestamp(new Date("2024-12-01").getTime()) }),
      ]);
      triggerScroll();
      await flush();
      await flush();
      expect(buildSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
