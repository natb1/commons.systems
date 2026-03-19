import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    _date: Date;
    constructor(d: Date) { this._date = d; }
    toDate() { return this._date; }
    toMillis() { return this._date.getTime(); }
    static fromDate(d: Date) { return new Timestamp(d); }
  },
}));

import type { SerializedChartTransaction, ChartMode } from "../../src/pages/home-chart";
import {
  buildCategoryTree,
  filterByWeeks,
  distinctWeeks,
  hydrateCategorySankey,
} from "../../src/pages/home-chart";

/** Monday 2025-01-06 00:00 UTC */
const MON_JAN_06 = new Date("2025-01-06T00:00:00Z").getTime();
/** Monday 2025-01-13 00:00 UTC */
const MON_JAN_13 = new Date("2025-01-13T00:00:00Z").getTime();
/** Monday 2025-01-20 00:00 UTC */
const MON_JAN_20 = new Date("2025-01-20T00:00:00Z").getTime();

function txn(overrides: Partial<SerializedChartTransaction> = {}): SerializedChartTransaction {
  return {
    category: "Food",
    amount: 50,
    reimbursement: 0,
    timestampMs: MON_JAN_06 + 86400000, // Tuesday Jan 7
    hasBudget: false,
    ...overrides,
  };
}

function makeContainer(txns?: SerializedChartTransaction[]): HTMLElement {
  const controlsDiv = document.createElement("div");
  controlsDiv.id = "sankey-controls";
  controlsDiv.innerHTML = `
    <fieldset id="sankey-mode">
      <label><input type="radio" name="sankey-mode" value="spending" checked> Spending</label>
      <label><input type="radio" name="sankey-mode" value="income"> Income</label>
    </fieldset>
    <label id="unbudgeted-toggle"><input type="checkbox" id="sankey-unbudgeted"> Unbudgeted only</label>
    <input id="sankey-weeks" type="number" value="12">
    <input id="sankey-end-week" type="range">
    <span id="sankey-end-label"></span>
  `;
  document.body.appendChild(controlsDiv);

  const container = document.createElement("div");
  container.style.setProperty("--fg", "#e0e0e0");
  if (txns !== undefined) {
    const script = document.createElement("script");
    script.type = "application/json";
    script.id = "sankey-data";
    script.textContent = JSON.stringify(txns);
    container.appendChild(script);
  }
  document.body.appendChild(container);
  Object.defineProperty(container, "clientWidth", { value: 640 });
  return container;
}

describe("buildCategoryTree", () => {
  it("single-level categories accumulate correctly", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 30 }),
      txn({ category: "Transport", amount: 20 }),
    ]);
    expect(root.children).toHaveLength(2);
    const food = root.children.find(c => c.name === "Food");
    const transport = root.children.find(c => c.name === "Transport");
    expect(food?.value).toBe(30);
    expect(transport?.value).toBe(20);
    expect(root.value).toBe(50);
  });

  it("multi-level categories create nested tree", () => {
    const root = buildCategoryTree([
      txn({ category: "Food:Groceries", amount: 40 }),
    ]);
    expect(root.children).toHaveLength(1);
    const food = root.children[0];
    expect(food.name).toBe("Food");
    expect(food.fullPath).toBe("Food");
    expect(food.children).toHaveLength(1);
    const groceries = food.children[0];
    expect(groceries.name).toBe("Groceries");
    expect(groceries.fullPath).toBe("Food:Groceries");
    expect(groceries.value).toBe(40);
  });

  it("net amount calculation: amount * (1 - reimbursement/100)", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 100, reimbursement: 25 }),
    ]);
    expect(root.value).toBe(75);
    expect(root.children[0].value).toBe(75);
  });

  it("merging same categories sums values and counts", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 30 }),
      txn({ category: "Food", amount: 20 }),
    ]);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].value).toBe(50);
    expect(root.children[0].count).toBe(2);
  });

  it("empty input returns root with value=0, count=0", () => {
    const root = buildCategoryTree([]);
    expect(root.value).toBe(0);
    expect(root.count).toBe(0);
    expect(root.children).toHaveLength(0);
  });

  it("negative net amounts (credits) are excluded", () => {
    const root = buildCategoryTree([
      txn({ category: "Refund", amount: -50, reimbursement: 0 }),
      txn({ category: "Food", amount: 30 }),
    ]);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Food");
    expect(root.value).toBe(30);
  });

  it("parent values roll up as sum of children", () => {
    const root = buildCategoryTree([
      txn({ category: "Food:Groceries", amount: 40 }),
      txn({ category: "Food:Restaurants", amount: 60 }),
    ]);
    const food = root.children[0];
    expect(food.value).toBe(100);
    expect(food.count).toBe(2);
    expect(root.value).toBe(100);
    expect(root.count).toBe(2);
  });

  it("mixed direct and subcategory transactions are both counted", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Food:Groceries", amount: 30 }),
    ]);
    expect(root.children).toHaveLength(1);
    const food = root.children[0];
    expect(food.value).toBe(80);
    expect(food.count).toBe(2);
    expect(food.children).toHaveLength(1);
    expect(food.children[0].name).toBe("Groceries");
    expect(food.children[0].value).toBe(30);
  });

  it("children are sorted by value descending, then name ascending", () => {
    const root = buildCategoryTree([
      txn({ category: "Alpha", amount: 10 }),
      txn({ category: "Beta", amount: 30 }),
      txn({ category: "Gamma", amount: 30 }),
      txn({ category: "Delta", amount: 20 }),
    ]);
    const names = root.children.map(c => c.name);
    expect(names).toEqual(["Beta", "Gamma", "Delta", "Alpha"]);
  });

  it("sort order is deterministic across multiple calls", () => {
    const txns = [
      txn({ category: "Z", amount: 50 }),
      txn({ category: "A", amount: 50 }),
      txn({ category: "M", amount: 50 }),
    ];
    const names1 = buildCategoryTree(txns).children.map(c => c.name);
    const names2 = buildCategoryTree(txns).children.map(c => c.name);
    expect(names1).toEqual(names2);
    expect(names1).toEqual(["A", "M", "Z"]); // equal values → alphabetical
  });

  it("income mode includes only Income-prefixed categories", () => {
    const root = buildCategoryTree([
      txn({ category: "Income:Salary", amount: 2400 }),
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Income:Freelance", amount: 500 }),
    ], "income");
    expect(root.children).toHaveLength(1);
    const income = root.children[0];
    expect(income.name).toBe("Income");
    expect(income.children).toHaveLength(2);
    expect(income.value).toBe(2900);
  });

  it("spending mode excludes Income-prefixed categories", () => {
    const root = buildCategoryTree([
      txn({ category: "Income:Salary", amount: 2400 }),
      txn({ category: "Food", amount: 50 }),
    ], "spending");
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Food");
    expect(root.value).toBe(50);
  });

  it("income mode with no income returns empty tree", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
    ], "income");
    expect(root.value).toBe(0);
    expect(root.children).toHaveLength(0);
  });

  it("unbudgetedOnly=true excludes budgeted transactions", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50, hasBudget: true }),
      txn({ category: "Transport", amount: 30, hasBudget: false }),
    ], "spending", true);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Transport");
    expect(root.value).toBe(30);
  });

  it("unbudgetedOnly=false includes all transactions", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50, hasBudget: true }),
      txn({ category: "Transport", amount: 30, hasBudget: false }),
    ], "spending", false);
    expect(root.children).toHaveLength(2);
    expect(root.value).toBe(80);
  });

  it("unbudgetedOnly=true with all budgeted transactions returns empty tree", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50, hasBudget: true }),
      txn({ category: "Transport", amount: 30, hasBudget: true }),
    ], "spending", true);
    expect(root.value).toBe(0);
    expect(root.count).toBe(0);
    expect(root.children).toHaveLength(0);
  });
});

describe("filterByWeeks", () => {
  const weeks = [MON_JAN_06, MON_JAN_13, MON_JAN_20];

  it("returns transactions within the window", () => {
    const txns = [
      txn({ timestampMs: MON_JAN_06 + 1000 }),
      txn({ timestampMs: MON_JAN_13 + 1000 }),
      txn({ timestampMs: MON_JAN_20 + 1000 }),
    ];
    // 1 week ending at week index 1 (Jan 13) — only Jan 13 week
    const result = filterByWeeks(txns, weeks, 1, 1);
    expect(result).toHaveLength(1);
    expect(result[0].timestampMs).toBe(MON_JAN_13 + 1000);
  });

  it("null timestamps are excluded", () => {
    const txns = [
      txn({ timestampMs: null }),
      txn({ timestampMs: MON_JAN_06 + 1000 }),
    ];
    const result = filterByWeeks(txns, weeks, 3, 2);
    expect(result).toHaveLength(1);
  });

  it("window larger than available weeks returns all dated transactions", () => {
    const txns = [
      txn({ timestampMs: MON_JAN_06 + 1000 }),
      txn({ timestampMs: MON_JAN_13 + 1000 }),
      txn({ timestampMs: MON_JAN_20 + 1000 }),
    ];
    const result = filterByWeeks(txns, weeks, 100, 2);
    expect(result).toHaveLength(3);
  });

  it("empty weeks array returns empty", () => {
    const result = filterByWeeks([txn()], [], 4, 0);
    expect(result).toEqual([]);
  });

  it("out-of-bounds endWeekIdx throws RangeError", () => {
    expect(() => filterByWeeks([txn()], weeks, 1, -1)).toThrow(RangeError);
    expect(() => filterByWeeks([txn()], weeks, 1, 3)).toThrow(RangeError);
  });
});

describe("distinctWeeks", () => {
  it("returns sorted unique Monday timestamps", () => {
    const txns = [
      txn({ timestampMs: MON_JAN_13 + 86400000 }), // Tuesday Jan 14 → week of Jan 13
      txn({ timestampMs: MON_JAN_06 + 3600000 }),   // early Jan 6 → week of Jan 6
    ];
    const result = distinctWeeks(txns);
    expect(result).toEqual([MON_JAN_06, MON_JAN_13]);
  });

  it("null timestamps skipped", () => {
    const txns = [
      txn({ timestampMs: null }),
      txn({ timestampMs: MON_JAN_06 }),
    ];
    const result = distinctWeeks(txns);
    expect(result).toEqual([MON_JAN_06]);
  });

  it("multiple transactions in same week produce single entry", () => {
    const txns = [
      txn({ timestampMs: MON_JAN_06 + 1000 }),
      txn({ timestampMs: MON_JAN_06 + 86400000 * 2 }), // Wednesday same week
    ];
    const result = distinctWeeks(txns);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(MON_JAN_06);
  });
});

describe("hydrateCategorySankey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("SVG element is created inside container when script tag present", () => {
    const container = makeContainer([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Transport", amount: 30 }),
    ]);
    hydrateCategorySankey(container);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("empty array shows 'No transaction data' message", () => {
    const container = makeContainer([]);
    hydrateCategorySankey(container);
    expect(container.textContent).toBe("No transaction data to chart.");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("missing script tag throws error", () => {
    const container = makeContainer();
    expect(() => hydrateCategorySankey(container)).toThrow("missing transaction data");
  });

  it("sankey nodes and links are rendered", () => {
    const container = makeContainer([
      txn({ category: "Food:Groceries", amount: 50 }),
      txn({ category: "Food:Restaurants", amount: 30 }),
      txn({ category: "Transport", amount: 20 }),
    ]);
    hydrateCategorySankey(container);
    const nodes = container.querySelectorAll(".sankey-node");
    const links = container.querySelectorAll(".sankey-link");
    expect(nodes.length).toBeGreaterThan(0);
    expect(links.length).toBeGreaterThan(0);
  });
});
