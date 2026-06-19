// @vitest-environment happy-dom
//
// Behavior-parity lock for the /budgets table + overrides interactivity (Unit 3
// of #1876). Ported from the imperative hydrateBudgetTable / hydrateOverridesTable
// suite (budgets-hydrate.test.ts) to drive the React <Budgets> page directly.
//
// ALTITUDE: render <Budgets options> via RTL, drive real user interactions (type
// into a cell + dispatch a native blur; change a select; click add/delete), and
// assert against the MOCKED active data source (getActiveDataSource) + the
// rendered DOM. getActiveDataSource is mocked to a single mock object that is ALSO
// the options.dataSource used for the initial load, so loads and saves go through
// one observable surface (matching the home-hydrate.test.tsx idiom).
//
// The malformed-data variance error-path tests (corrupt data-window12 blobs,
// missing data-weekly-allowance, etc.) CANNOT be expressed through <Budgets> —
// those blobs come from the real computeBudgetStatsAndVariances, so corruption is
// not injectable. They remain in budgets-hydrate.test.ts as direct unit tests of
// the still-live legacy hydrateBudgetTable (which Unit 4 removes). This file
// covers the React save paths + a variance happy-path (expand → wrapper renders).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import type { DataSource } from "../../src/data-source";
import { createMockDataSource } from "../helpers";

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

// The chart island's d3 build is irrelevant to table interactivity; stub the
// three render fns to no-ops (à la Budgets.test.tsx).
vi.mock("../../src/pages/budgets-chart.js", () => ({ renderBudgetChart: vi.fn(() => () => {}) }));
vi.mock("../../src/pages/budgets-pie-chart.js", () => ({ renderBudgetPieChart: vi.fn(() => () => {}) }));
vi.mock("../../src/pages/budgets-area-chart.js", () => ({ renderPerBudgetAreaChart: vi.fn(() => () => {}) }));
vi.mock("../../src/pages/budgets-waterfall-chart.js", () => ({ renderVarianceWaterfall: vi.fn(() => () => {}) }));

// getActiveDataSource returns the SAME mock used for the initial load. The hook's
// blur-save / change-save / override-CRUD call getActiveDataSource(); the load
// uses options.dataSource. Pointing both at one mock gives a single assertion
// surface (matching home-hydrate.test.tsx).
let activeDS: DataSource;
vi.mock("../../src/active-data-source.js", () => ({
  getActiveDataSource: () => activeDS,
  setActiveDataSource: (ds: DataSource) => { activeDS = ds; },
}));

import { Budgets } from "../../src/pages/Budgets";
import type { Budget, BudgetPeriod } from "../../src/firestore";
import { Timestamp } from "firebase/firestore";

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "food" as Budget["id"],
    name: "Food",
    allowance: 150,
    allowancePeriod: "weekly",
    rollover: "none",
    overrides: [],
    groupId: null,
    ...overrides,
  };
}

function period(overrides: { id: string; budgetId: string } & Partial<Omit<BudgetPeriod, "id" | "budgetId">>): BudgetPeriod {
  return {
    periodStart: Timestamp.fromMillis(new Date("2025-01-13").getTime()),
    periodEnd: Timestamp.fromMillis(new Date("2025-01-20").getTime()),
    total: 50,
    count: 1,
    categoryBreakdown: { "Food:Groceries": 50 },
    groupId: null,
    ...overrides,
  } as unknown as BudgetPeriod;
}

function flush(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function blur(input: HTMLElement): void {
  input.dispatchEvent(new Event("blur", { bubbles: true }));
}

function change(el: HTMLElement): void {
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// Render an authorized <Budgets> and wait for the table to mount. Returns the
// rendered container so tests can query rows.
async function renderBudgets(
  budgets: Budget[],
  periods: BudgetPeriod[] = [],
  dsOverrides: Partial<DataSource> = {},
): Promise<HTMLElement> {
  const ds = createMockDataSource({
    getBudgets: vi.fn().mockResolvedValue(budgets),
    getBudgetPeriods: vi.fn().mockResolvedValue(periods),
    getWeeklyAggregates: vi.fn().mockResolvedValue([]),
    updateBudget: vi.fn().mockResolvedValue(undefined),
    updateBudgetOverrides: vi.fn().mockResolvedValue(undefined),
    ...dsOverrides,
  });
  activeDS = ds;
  const { container } = render(
    <Budgets options={{ authorized: true, groupName: "household", dataSource: ds }} />,
  );
  await waitFor(() => {
    if (!container.querySelector("#budgets-table")) throw new Error("no table");
  });
  return container;
}

describe("Budgets table interactivity (blur/change save) — Unit 3 contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("saves name field on blur", async () => {
    const c = await renderBudgets([budget({ name: "Food" })]);
    const input = c.querySelector(".edit-name") as HTMLInputElement;
    input.value = "Food & Dining";
    blur(input);
    await flush();
    expect(activeDS.updateBudget).toHaveBeenCalledWith("food", { name: "Food & Dining" });
  });

  it("saves allowance field on blur (as a number)", async () => {
    const c = await renderBudgets([budget({ allowance: 150 })]);
    const input = c.querySelector(".edit-allowance") as HTMLInputElement;
    input.value = "200";
    blur(input);
    await flush();
    expect(activeDS.updateBudget).toHaveBeenCalledWith("food", { allowance: 200 });
  });

  it("saves rollover on change", async () => {
    const c = await renderBudgets([budget({ rollover: "none" })]);
    const select = c.querySelector(".edit-rollover") as HTMLSelectElement;
    select.value = "debt";
    change(select);
    await flush();
    expect(activeDS.updateBudget).toHaveBeenCalledWith("food", { rollover: "debt" });
  });

  it("saves period on change", async () => {
    const c = await renderBudgets([budget({ allowancePeriod: "weekly" })]);
    const select = c.querySelector(".edit-period") as HTMLSelectElement;
    select.value = "monthly";
    change(select);
    await flush();
    expect(activeDS.updateBudget).toHaveBeenCalledWith("food", { allowancePeriod: "monthly" });
  });

  it("rejects empty name and shows error", async () => {
    const c = await renderBudgets([budget({ name: "Food" })]);
    const input = c.querySelector(".edit-name") as HTMLInputElement;
    input.value = "";
    blur(input);
    await flush();
    expect(activeDS.updateBudget).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
    expect(input.title).toContain("Budget name cannot be empty");
  });

  it("rejects negative allowance and shows error", async () => {
    const c = await renderBudgets([budget({ allowance: 150 })]);
    const input = c.querySelector(".edit-allowance") as HTMLInputElement;
    input.value = "-5";
    blur(input);
    await flush();
    expect(activeDS.updateBudget).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
    expect(input.title).toContain("non-negative");
  });

  it("skips save when name value unchanged", async () => {
    const c = await renderBudgets([budget({ name: "Food" })]);
    const input = c.querySelector(".edit-name") as HTMLInputElement;
    blur(input);
    await flush();
    expect(activeDS.updateBudget).not.toHaveBeenCalled();
  });

  it("skips save when rollover value unchanged", async () => {
    const c = await renderBudgets([budget({ rollover: "none" })]);
    const select = c.querySelector(".edit-rollover") as HTMLSelectElement;
    change(select);
    await flush();
    expect(activeDS.updateBudget).not.toHaveBeenCalled();
  });

  it("updates defaultValue after a successful name save (so a re-blur is a no-op)", async () => {
    const c = await renderBudgets([budget({ name: "Food" })]);
    const input = c.querySelector(".edit-name") as HTMLInputElement;
    input.value = "New Food";
    blur(input);
    await flush();
    expect(input.defaultValue).toBe("New Food");
  });

  it("reverts input and flags save-error when the save fails", async () => {
    const c = await renderBudgets([budget({ name: "Food" })], [], {
      updateBudget: vi.fn().mockRejectedValue(new Error("network error")),
    });
    const input = c.querySelector(".edit-name") as HTMLInputElement;
    input.value = "New Name";
    blur(input);
    await flush();
    expect(input.value).toBe("Food");
    expect(input.classList.contains("save-error")).toBe(true);
    expect(input.title).toContain("Save failed");
  });

  it("reverts the select to its last-saved value on a save failure (option[selected] contract)", async () => {
    const c = await renderBudgets([budget({ rollover: "none" })], [], {
      updateBudget: vi.fn().mockRejectedValue(new Error("network error")),
    });
    const select = c.querySelector(".edit-rollover") as HTMLSelectElement;
    select.value = "debt";
    change(select);
    await flush();
    expect(select.value).toBe("none");
    expect(select.classList.contains("save-error")).toBe(true);
  });

  it("shows permission-denied error on save failure", async () => {
    const error = new Error("permission denied") as Error & { code?: string };
    error.code = "permission-denied";
    const c = await renderBudgets([budget({ name: "Food" })], [], {
      updateBudget: vi.fn().mockRejectedValue(error),
    });
    const input = c.querySelector(".edit-name") as HTMLInputElement;
    input.value = "New";
    blur(input);
    await flush();
    expect(input.title).toContain("Access denied");
  });
});

describe("Budgets variance details (happy path) — Unit 3 contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    // clientWidth is 0 in happy-dom; the waterfall render is mocked, but
    // renderVarianceDetails reads clientWidth for sizing — give it a value.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { get() { return 640; }, configurable: true });
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
  });

  it("hydrates variance details when a budget row is first expanded", async () => {
    const c = await renderBudgets(
      [budget({ name: "Food" })],
      [period({ id: "food-w2", budgetId: "food" })],
    );
    const row = c.querySelector("details.budget-row") as HTMLDetailsElement;
    expect(row).not.toBeNull();
    const varianceEl = row.querySelector(".budget-variance") as HTMLElement;
    expect(varianceEl.dataset.hydrated).toBeUndefined();
    row.open = true;
    row.dispatchEvent(new Event("toggle"));
    await flush();
    expect(varianceEl.dataset.hydrated).toBe("true");
    expect(varianceEl.querySelector(".variance-wrapper")).not.toBeNull();
  });
});

describe("Budgets overrides table interactivity — Unit 3 contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  function overrideBudget(): Budget {
    return budget({
      overrides: [
        { date: Timestamp.fromMillis(new Date("2025-06-10").getTime()), balance: 100 },
      ],
    });
  }

  it("saves the override set on a balance blur", async () => {
    const c = await renderBudgets([overrideBudget()]);
    const input = c.querySelector("#overrides-table .edit-override-balance") as HTMLInputElement;
    input.value = "250";
    blur(input);
    await flush();
    expect(activeDS.updateBudgetOverrides).toHaveBeenCalledTimes(1);
    const [calledBudgetId, calledOverrides] = (activeDS.updateBudgetOverrides as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledBudgetId).toBe("food");
    expect(calledOverrides).toHaveLength(1);
    expect(calledOverrides[0].balance).toBe(250);
  });

  it("skips the override save when the value is unchanged", async () => {
    const c = await renderBudgets([overrideBudget()]);
    const input = c.querySelector("#overrides-table .edit-override-balance") as HTMLInputElement;
    blur(input);
    await flush();
    expect(activeDS.updateBudgetOverrides).not.toHaveBeenCalled();
  });

  it("deletes an override row and re-writes the remaining set", async () => {
    const c = await renderBudgets([overrideBudget()]);
    const delBtn = c.querySelector("#overrides-table .delete-override") as HTMLButtonElement;
    delBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();
    expect(activeDS.updateBudgetOverrides).toHaveBeenCalledWith("food", []);
    expect(c.querySelector("#overrides-table .override-row")).toBeNull();
  });

  it("adds an override row (imperative insertion) and saves immediately", async () => {
    const c = await renderBudgets([budget({ overrides: [] })]);
    const addBtn = c.querySelector("#add-override") as HTMLButtonElement;
    expect(addBtn).not.toBeNull();
    addBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();
    // A new override-row was inserted before the add button.
    const rows = c.querySelectorAll("#overrides-table .override-row");
    expect(rows.length).toBe(1);
    expect(activeDS.updateBudgetOverrides).toHaveBeenCalled();
    const [calledBudgetId, calledOverrides] = (activeDS.updateBudgetOverrides as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledBudgetId).toBe("food");
    expect(calledOverrides).toHaveLength(1);
  });

  it("reverts a deleted row and flags save-error when the delete re-write fails", async () => {
    const c = await renderBudgets([overrideBudget()], [], {
      updateBudgetOverrides: vi.fn().mockRejectedValue(new Error("network error")),
    });
    const delBtn = c.querySelector("#overrides-table .delete-override") as HTMLButtonElement;
    delBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flush();
    // Row restored after the failed write.
    expect(c.querySelector("#overrides-table .override-row")).not.toBeNull();
    expect(delBtn.classList.contains("save-error")).toBe(true);
  });
});
