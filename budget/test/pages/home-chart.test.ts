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

import type { SerializedChartTransaction } from "../../src/pages/home-chart";
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
    ...overrides,
  };
}

function makeContainer(txns?: SerializedChartTransaction[]): HTMLElement {
  const controlsDiv = document.createElement("div");
  controlsDiv.innerHTML = `
    <input id="sankey-weeks" type="number" value="12">
    <input id="sankey-end-week" type="range">
    <span id="sankey-end-label"></span>
  `;
  document.body.appendChild(controlsDiv);

  const container = document.createElement("div");
  container.style.setProperty("--fg", "#e0e0e0");
  if (txns !== undefined) {
    container.dataset.transactions = JSON.stringify(txns);
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

  it("SVG element is created inside container when data-transactions attr present", () => {
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

  it("no data-transactions attr — function returns without modifying container", () => {
    const container = makeContainer();
    const originalHTML = container.innerHTML;
    hydrateCategorySankey(container);
    expect(container.innerHTML).toBe(originalHTML);
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
