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
  divideTreeValues,
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
      <label><input type="radio" name="sankey-mode" value="credits"> Credits</label>
    </fieldset>
    <label id="unbudgeted-toggle"><input type="checkbox" id="sankey-unbudgeted"> Unbudgeted only</label>
    <label id="card-payment-toggle"><input type="checkbox" id="sankey-card-payment"> Show card payments</label>
    <label id="category-filter-label">Category: <input type="text" id="sankey-category-filter" data-autocomplete></label>
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

  it("credits mode includes negative-amount transactions", () => {
    const root = buildCategoryTree([
      txn({ category: "Income:Salary", amount: -2400 }),
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Travel:Reimbursement", amount: -22.99 }),
    ], "credits");
    expect(root.children).toHaveLength(2);
    const income = root.children.find(c => c.name === "Income");
    const travel = root.children.find(c => c.name === "Travel");
    expect(income).toBeDefined();
    expect(travel).toBeDefined();
    expect(root.value).toBeCloseTo(2422.99);
  });

  it("spending mode excludes negative-amount transactions", () => {
    const root = buildCategoryTree([
      txn({ category: "Income:Salary", amount: -2400 }),
      txn({ category: "Food", amount: 50 }),
    ], "spending");
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Food");
    expect(root.value).toBe(50);
  });

  it("credits mode excludes positive amounts; spending mode includes them", () => {
    const creditsRoot = buildCategoryTree([
      txn({ category: "Income:Salary", amount: 2400 }),
    ], "credits");
    expect(creditsRoot.value).toBe(0);
    expect(creditsRoot.children).toHaveLength(0);

    const spendingRoot = buildCategoryTree([
      txn({ category: "Income:Salary", amount: 2400 }),
    ], "spending");
    expect(spendingRoot.value).toBe(2400);
    expect(spendingRoot.children[0].name).toBe("Income");
  });

  it("credits mode with no negative-amount transactions returns empty tree", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
    ], "credits");
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

  it("showCardPayment=false excludes Transfer:CardPayment", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Transfer:CardPayment", amount: 200 }),
    ], "spending", false, false);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Food");
    expect(root.value).toBe(50);
  });

  it("showCardPayment=true includes Transfer:CardPayment", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Transfer:CardPayment", amount: 200 }),
    ], "spending", false, true);
    expect(root.children).toHaveLength(2);
    expect(root.value).toBe(250);
  });

  it("showCardPayment=false excludes Transfer:CardPayment subcategories", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Transfer:CardPayment:Amex", amount: 300 }),
    ], "spending", false, false);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Food");
    expect(root.value).toBe(50);
  });

  it("showCardPayment=false does not affect credits mode (CardPayment positive → excluded)", () => {
    const root = buildCategoryTree([
      txn({ category: "Income:Salary", amount: -2400 }),
      txn({ category: "Transfer:CardPayment", amount: 200 }),
    ], "credits", false, false);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Income");
    expect(root.value).toBe(2400);
  });

  it("credits mode: negative amounts produce positive tree values", () => {
    const root = buildCategoryTree([
      txn({ category: "Income:Salary", amount: -2400 }),
      txn({ category: "Income:Freelance", amount: -500 }),
    ], "credits");
    expect(root.value).toBe(2900);
    const income = root.children.find(c => c.name === "Income");
    expect(income).toBeDefined();
    expect(income!.value).toBe(2900);
    const salary = income!.children.find(c => c.name === "Salary");
    const freelance = income!.children.find(c => c.name === "Freelance");
    expect(salary!.value).toBe(2400);
    expect(freelance!.value).toBe(500);
  });

  it("spending mode excludes negative-amount transactions regardless of category", () => {
    const root = buildCategoryTree([
      txn({ category: "Income:Salary", amount: -2400 }),
      txn({ category: "Income:Freelance", amount: -500 }),
      txn({ category: "Food", amount: 50 }),
    ], "spending");
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Food");
    expect(root.children[0].value).toBe(50);
  });

  it("credits and spending split by sign: Income:Salary positive→spending, Income:Freelance negative→credits", () => {
    const creditsRoot = buildCategoryTree([
      txn({ category: "Income:Salary", amount: 2400 }),
      txn({ category: "Income:Freelance", amount: -500 }),
    ], "credits");
    expect(creditsRoot.value).toBe(500);

    const spendingRoot = buildCategoryTree([
      txn({ category: "Income:Salary", amount: 2400 }),
      txn({ category: "Income:Freelance", amount: -500 }),
    ], "spending");
    expect(spendingRoot.value).toBe(2400);
  });
});

describe("buildCategoryTree with categoryFilter", () => {
  it('filter "Food" includes "Food" and "Food:Groceries" but excludes "Travel"', () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Food:Groceries", amount: 30 }),
      txn({ category: "Travel", amount: 20 }),
    ], "spending", false, false, "Food");
    expect(root.value).toBe(80);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Food");
  });

  it('filter "Food:Groceries" includes only "Food:Groceries" not "Food" or "Food:Dining"', () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Food:Groceries", amount: 30 }),
      txn({ category: "Food:Dining", amount: 20 }),
    ], "spending", false, false, "Food:Groceries");
    expect(root.value).toBe(30);
    expect(root.children).toHaveLength(1);
    const food = root.children[0];
    expect(food.name).toBe("Food");
    expect(food.children).toHaveLength(1);
    expect(food.children[0].name).toBe("Groceries");
  });

  it("empty filter includes all transactions", () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Travel", amount: 20 }),
    ], "spending", false, false, "");
    expect(root.value).toBe(70);
    expect(root.children).toHaveLength(2);
  });

  it('exact match works: category "Food" with filter "Food"', () => {
    const root = buildCategoryTree([
      txn({ category: "Food", amount: 50 }),
    ], "spending", false, false, "Food");
    expect(root.value).toBe(50);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].name).toBe("Food");
  });
});

describe("divideTreeValues", () => {
  it("divides all node values by divisor", () => {
    const root = buildCategoryTree([
      txn({ category: "Food:Groceries", amount: 120 }),
      txn({ category: "Food:Restaurants", amount: 60 }),
      txn({ category: "Transport", amount: 24 }),
    ]);
    divideTreeValues(root, 12);
    expect(root.value).toBe(204 / 12);
    const food = root.children.find(c => c.name === "Food")!;
    expect(food.value).toBe(180 / 12);
    expect(food.children.find(c => c.name === "Groceries")!.value).toBe(10);
    expect(food.children.find(c => c.name === "Restaurants")!.value).toBe(5);
    expect(root.children.find(c => c.name === "Transport")!.value).toBe(2);
  });

  it("divisor of 1 leaves values unchanged", () => {
    const root = buildCategoryTree([txn({ category: "Food", amount: 50 })]);
    divideTreeValues(root, 1);
    expect(root.value).toBe(50);
  });

  it("zero divisor throws RangeError", () => {
    const root = buildCategoryTree([txn({ category: "Food", amount: 50 })]);
    expect(() => divideTreeValues(root, 0)).toThrow(RangeError);
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

  it("filterTable hides rows based on unbudgeted and card payment toggles", () => {
    // Create transaction table before hydrating so filterTable finds rows
    const table = document.createElement("div");
    table.id = "transactions-table";
    const rows = [
      { category: "Food", hasBudget: "true", netAmount: "50" },
      { category: "Transport", hasBudget: "false", netAmount: "30" },
      { category: "Transfer:CardPayment", hasBudget: "false", netAmount: "200" },
      { category: "Income:Salary", hasBudget: "false", netAmount: "-2400" },
    ];
    for (const r of rows) {
      const row = document.createElement("div");
      row.className = "txn-row";
      row.dataset.category = r.category;
      row.dataset.hasBudget = r.hasBudget;
      row.dataset.netAmount = r.netAmount;
      table.appendChild(row);
    }
    document.body.appendChild(table);

    const container = makeContainer([
      txn({ category: "Food", amount: 50, hasBudget: true }),
      txn({ category: "Transport", amount: 30, hasBudget: false }),
      txn({ category: "Transfer:CardPayment", amount: 200, hasBudget: false }),
      txn({ category: "Income:Salary", amount: -2400, hasBudget: false }),
    ]);
    hydrateCategorySankey(container);

    const txnRows = table.querySelectorAll<HTMLElement>(".txn-row");

    // Default spending mode: negative-amount rows hidden, card payment hidden (default unchecked)
    expect(txnRows[0].style.display).toBe(""); // Food visible (positive)
    expect(txnRows[1].style.display).toBe(""); // Transport visible (positive)
    expect(txnRows[2].style.display).toBe("none"); // CardPayment hidden (card payment toggle off)
    expect(txnRows[3].style.display).toBe("none"); // Income:Salary hidden (negative amount → credit)

    // Check unbudgeted toggle — budgeted Food should hide
    const unbudgetedCheckbox = document.querySelector("#sankey-unbudgeted") as HTMLInputElement;
    unbudgetedCheckbox.checked = true;
    unbudgetedCheckbox.dispatchEvent(new Event("change"));
    expect(txnRows[0].style.display).toBe("none"); // Food budgeted, now hidden
    expect(txnRows[1].style.display).toBe(""); // Transport unbudgeted, visible

    // Uncheck unbudgeted, check card payment toggle
    unbudgetedCheckbox.checked = false;
    unbudgetedCheckbox.dispatchEvent(new Event("change"));
    const cardPaymentCheckbox = document.querySelector("#sankey-card-payment") as HTMLInputElement;
    cardPaymentCheckbox.checked = true;
    cardPaymentCheckbox.dispatchEvent(new Event("change"));
    expect(txnRows[2].style.display).toBe(""); // CardPayment now visible
  });

  it("Travel:Reimbursement (negative amount) hidden in spending, visible in credits mode", () => {
    const table = document.createElement("div");
    table.id = "transactions-table";
    const row = document.createElement("div");
    row.className = "txn-row";
    row.dataset.category = "Travel:Reimbursement";
    row.dataset.hasBudget = "false";
    row.dataset.netAmount = "-22.99";
    table.appendChild(row);
    document.body.appendChild(table);

    const container = makeContainer([
      txn({ category: "Travel:Reimbursement", amount: -22.99 }),
    ]);
    hydrateCategorySankey(container);

    const txnRows = table.querySelectorAll<HTMLElement>(".txn-row");
    // Default spending mode: Travel:Reimbursement is hidden (negative amount = credit)
    expect(txnRows[0].style.display).toBe("none");

    // Switch to credits mode — negative amount → visible
    const creditsRadio = document.querySelector<HTMLInputElement>('input[name="sankey-mode"][value="credits"]')!;
    creditsRadio.checked = true;
    creditsRadio.dispatchEvent(new Event("change"));
    expect(txnRows[0].style.display).toBe(""); // negative amount → visible in credits mode
  });

  it("credits mode shows negative-amount rows, hides positive-amount rows", () => {
    const table = document.createElement("div");
    table.id = "transactions-table";
    const rows = [
      { category: "Food", hasBudget: "false", netAmount: "50" },
      { category: "Income:Salary", hasBudget: "false", netAmount: "-2400" },
    ];
    for (const r of rows) {
      const row = document.createElement("div");
      row.className = "txn-row";
      row.dataset.category = r.category;
      row.dataset.hasBudget = r.hasBudget;
      row.dataset.netAmount = r.netAmount;
      table.appendChild(row);
    }
    document.body.appendChild(table);

    const container = makeContainer([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Income:Salary", amount: -2400 }),
    ]);
    hydrateCategorySankey(container);

    const txnRows = table.querySelectorAll<HTMLElement>(".txn-row");
    // Default spending mode: Food visible (positive), Income:Salary hidden (negative)
    expect(txnRows[0].style.display).toBe(""); // Food visible
    expect(txnRows[1].style.display).toBe("none"); // Income:Salary hidden (negative)

    // Switch to credits mode
    const creditsRadio = document.querySelector<HTMLInputElement>('input[name="sankey-mode"][value="credits"]')!;
    creditsRadio.checked = true;
    creditsRadio.dispatchEvent(new Event("change"));
    expect(txnRows[0].style.display).toBe("none"); // Food hidden (positive, not a credit)
    expect(txnRows[1].style.display).toBe(""); // Income:Salary visible (negative = credit)
  });

  it("filterTable hides rows not matching category filter", () => {
    const table = document.createElement("div");
    table.id = "transactions-table";
    const rows = [
      { category: "Food", hasBudget: "false" },
      { category: "Food:Groceries", hasBudget: "false" },
      { category: "Food:Dining", hasBudget: "false" },
      { category: "Travel", hasBudget: "false" },
    ];
    for (const r of rows) {
      const row = document.createElement("div");
      row.className = "txn-row";
      row.dataset.category = r.category;
      row.dataset.hasBudget = r.hasBudget;
      table.appendChild(row);
    }
    document.body.appendChild(table);

    const container = makeContainer([
      txn({ category: "Food", amount: 50 }),
      txn({ category: "Food:Groceries", amount: 30 }),
      txn({ category: "Food:Dining", amount: 20 }),
      txn({ category: "Travel", amount: 40 }),
    ]);
    hydrateCategorySankey(container);

    const txnRows = table.querySelectorAll<HTMLElement>(".txn-row");

    // All spending rows visible by default (no category filter)
    expect(txnRows[0].style.display).toBe(""); // Food
    expect(txnRows[1].style.display).toBe(""); // Food:Groceries
    expect(txnRows[2].style.display).toBe(""); // Food:Dining
    expect(txnRows[3].style.display).toBe(""); // Travel

    // Set category filter to "Food" and trigger blur
    const categoryInput = document.querySelector("#sankey-category-filter") as HTMLInputElement;
    categoryInput.value = "Food";
    categoryInput.dispatchEvent(new Event("blur"));

    // Food and Food:* visible, Travel hidden
    expect(txnRows[0].style.display).toBe(""); // Food matches
    expect(txnRows[1].style.display).toBe(""); // Food:Groceries matches prefix
    expect(txnRows[2].style.display).toBe(""); // Food:Dining matches prefix
    expect(txnRows[3].style.display).toBe("none"); // Travel hidden
  });
});
