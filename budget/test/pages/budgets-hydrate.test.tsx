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
// not injectable. They live below in the "hydrateVarianceDetails — malformed-data
// error paths" describe block, driving the still-live exported hydrateVarianceDetails
// directly against hand-built rows (ported from the deleted budgets-hydrate.test.ts).
// This file also covers the React save paths + a variance happy-path (expand →
// wrapper renders).
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
import { hydrateVarianceDetails } from "../../src/pages/budgets-hydrate";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
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

  it("rejects a cleared allowance instead of persisting 0", async () => {
    const c = await renderBudgets([budget({ allowance: 150 })]);
    const input = c.querySelector(".edit-allowance") as HTMLInputElement; // type-safety-ok: test DOM query
    input.value = "";
    blur(input);
    await flush();
    expect(activeDS.updateBudget).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
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

// Malformed-data variance error paths, ported from the deleted budgets-hydrate.test.ts.
// These corruptions originate in the SSG-serialized .budget-variance data-* blobs and
// cannot be injected through <Budgets> (which builds those blobs from real, valid
// stats), so they drive the exported hydrateVarianceDetails directly against
// hand-built rows. The React toggle listener (use-budget-table.ts) wraps this same
// function in a try/catch that routes the thrown DataIntegrityError to
// handleActionError + dataset.hydrated="error"; here we assert the function's own
// throw contract, which is what that wrapper relies on.
describe("hydrateVarianceDetails — malformed-data error paths", () => {
  const POPULATED_W12 = JSON.stringify([
    { kind: "category", category: "Food:Groceries", avgWeekly: 60 },
    { kind: "category", category: "Food:Restaurants", avgWeekly: 30 },
  ]);
  const POPULATED_W52 = JSON.stringify([
    { kind: "category", category: "Food:Groceries", avgWeekly: 55 },
    { kind: "category", category: "Food:Restaurants", avgWeekly: 25 },
  ]);

  interface VarianceRowOpts {
    readonly weeklyAllowance?: string;
    readonly window12?: string;
    readonly window52?: string;
    readonly omitVariance?: boolean;
    readonly omitBudgetId?: boolean;
  }

  function makeRow(opts: VarianceRowOpts = {}): { details: HTMLDetailsElement; varianceEl: HTMLElement | null } {
    const details = document.createElement("details") as HTMLDetailsElement;
    details.classList.add("budget-row");
    if (!opts.omitBudgetId) details.setAttribute("data-budget-id", "food");
    details.appendChild(document.createElement("summary"));

    let varianceEl: HTMLElement | null = null;
    if (!opts.omitVariance) {
      varianceEl = document.createElement("div");
      varianceEl.classList.add("budget-variance");
      if (opts.weeklyAllowance !== undefined) varianceEl.setAttribute("data-weekly-allowance", opts.weeklyAllowance);
      if (opts.window12 !== undefined) varianceEl.setAttribute("data-window12", opts.window12);
      if (opts.window52 !== undefined) varianceEl.setAttribute("data-window52", opts.window52);
      details.appendChild(varianceEl);
    }
    document.body.appendChild(details);
    if (varianceEl) Object.defineProperty(varianceEl, "clientWidth", { value: 640, configurable: true });
    return { details, varianceEl };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  // Each of these throws DataIntegrityError directly out of hydrateVarianceDetails,
  // BEFORE the render step, so dataset.hydrated is never set.
  const directThrowCases: ReadonlyArray<[string, VarianceRowOpts]> = [
    [".budget-variance element is missing", { omitVariance: true }],
    ["data-budget-id is missing", { omitBudgetId: true, weeklyAllowance: "100", window12: POPULATED_W12, window52: POPULATED_W52 }],
    ["data-weekly-allowance is missing", { window12: POPULATED_W12, window52: POPULATED_W52 }],
    ["data-weekly-allowance is not finite", { weeklyAllowance: "NaN", window12: POPULATED_W12, window52: POPULATED_W52 }],
    ["data-window12 is not valid JSON", { weeklyAllowance: "100", window12: "not json", window52: POPULATED_W52 }],
    ["data-window12 decodes to a non-array", { weeklyAllowance: "100", window12: "{}", window52: POPULATED_W52 }],
    ["a row is a non-object element", { weeklyAllowance: "100", window12: JSON.stringify([null]), window52: POPULATED_W52 }],
    ["a row is missing avgWeekly", { weeklyAllowance: "100", window12: JSON.stringify([{ kind: "category", category: "X" }]), window52: POPULATED_W52 }],
    ["avgWeekly is not a finite number", { weeklyAllowance: "100", window12: JSON.stringify([{ kind: "category", category: "X", avgWeekly: null }]), window52: POPULATED_W52 }],
    ["category variant has a non-string category field", { weeklyAllowance: "100", window12: JSON.stringify([{ kind: "category", category: 123, avgWeekly: 5 }]), window52: POPULATED_W52 }],
    ["row kind is unknown", { weeklyAllowance: "100", window12: JSON.stringify([{ kind: "zzz", avgWeekly: 0 }]), window52: POPULATED_W52 }],
    ["Other row has a non-integer groupedCount", { weeklyAllowance: "100", window12: JSON.stringify([{ kind: "other", avgWeekly: 10, groupedCount: 0.5 }]), window52: POPULATED_W52 }],
    ["Other row has groupedCount=0 (producer requires >=1)", { weeklyAllowance: "100", window12: JSON.stringify([{ kind: "other", avgWeekly: 10, groupedCount: 0 }]), window52: POPULATED_W52 }],
    ["Other row has a negative groupedCount", { weeklyAllowance: "100", window12: JSON.stringify([{ kind: "other", avgWeekly: 10, groupedCount: -1 }]), window52: POPULATED_W52 }],
  ];

  for (const [label, opts] of directThrowCases) {
    it(`throws DataIntegrityError when ${label}`, () => {
      const { details, varianceEl } = makeRow(opts);
      expect(() => hydrateVarianceDetails(details)).toThrow(DataIntegrityError);
      // The throw happens before render, so it leaves no "hydrated" marker.
      if (varianceEl) expect(varianceEl.dataset.hydrated).toBeUndefined();
    });
  }

  it("throws and flags dataset.hydrated='error' when all categories sum to zero (draw-time)", () => {
    // absTotal===0 is detected inside renderVarianceDetails' draw(12), which sets
    // dataset.hydrated='error' before re-throwing — a different path than the
    // pre-render deserialize throws above.
    const zeroWindow = JSON.stringify([{ kind: "category", category: "X", avgWeekly: 0 }]);
    const { details, varianceEl } = makeRow({ weeklyAllowance: "100", window12: zeroWindow, window52: POPULATED_W52 });
    expect(() => hydrateVarianceDetails(details)).toThrow(DataIntegrityError);
    expect(varianceEl!.dataset.hydrated).toBe("error");
  });
});
