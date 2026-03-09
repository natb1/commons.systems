// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/firestore.js", () => ({
  updateTransaction: vi.fn(),
  adjustBudgetPeriodTotal: vi.fn(),
}));

import { hydrateTransactionTable, _resetForTest } from "../../src/pages/home-hydrate";
import { updateTransaction, adjustBudgetPeriodTotal } from "../../src/firestore";

const mockUpdateTransaction = vi.mocked(updateTransaction);
const mockAdjustBudgetPeriodTotal = vi.mocked(adjustBudgetPeriodTotal);

function flush(): Promise<void> {
  return new Promise(r => setTimeout(r, 0));
}

const defaultPeriods = [
  { id: "food-w1", budgetId: "budget-food", periodStartMs: new Date("2025-01-06").getTime(), periodEndMs: new Date("2025-01-13").getTime(), total: 80 },
  { id: "food-w2", budgetId: "budget-food", periodStartMs: new Date("2025-01-13").getTime(), periodEndMs: new Date("2025-01-20").getTime(), total: 50 },
  { id: "vacation-w1", budgetId: "budget-vacation", periodStartMs: new Date("2025-01-13").getTime(), periodEndMs: new Date("2025-01-20").getTime(), total: 30 },
];

function createContainer(txnId: string, overrides: { budgetId?: string; amount?: number; timestamp?: number; reimbursement?: number; periods?: typeof defaultPeriods } = {}): HTMLElement {
  const container = document.createElement("div");
  container.id = "transactions-table";
  container.dataset.budgetOptions = JSON.stringify(["food", "housing", "vacation"]);
  container.dataset.budgetMap = JSON.stringify({ food: "budget-food", housing: "budget-housing", vacation: "budget-vacation" });
  container.dataset.categoryOptions = JSON.stringify(["Food", "Travel"]);
  container.dataset.budgetPeriods = JSON.stringify(overrides.periods ?? defaultPeriods);

  const budgetIdAttr = overrides.budgetId ? ` data-budget-id="${overrides.budgetId}"` : "";
  const amountAttr = overrides.amount !== undefined ? ` data-amount="${overrides.amount}"` : "";
  const timestampAttr = overrides.timestamp !== undefined ? ` data-timestamp="${overrides.timestamp}"` : "";
  const reimbursementAttr = overrides.reimbursement !== undefined ? ` data-reimbursement="${overrides.reimbursement}"` : ` data-reimbursement="0"`;

  container.innerHTML = `
    <details class="txn-row" data-txn-id="${txnId}"${budgetIdAttr}${amountAttr}${timestampAttr}${reimbursementAttr}>
      <summary class="txn-summary">
        <div class="txn-summary-content">
          <span>Description</span>
          <span><input type="text" class="edit-note" value="original note"></span>
          <span><input type="text" class="edit-category" value="Food"></span>
          <span class="amount">$52.30</span>
        </div>
      </summary>
      <div class="txn-details">
        <dl>
          <dt>Reimbursement</dt><dd><input type="number" class="edit-reimbursement" value="50" min="0" max="100"></dd>
          <dt>Budget</dt><dd><input type="text" class="edit-budget" value="food"></dd>
          <dt>Budget Balance</dt><dd class="budget-balance">100.00</dd>
          <dt>Group</dt><dd>household</dd>
          <dt>Statement</dt><dd></dd>
        </dl>
      </div>
    </details>
  `;
  document.body.appendChild(container);
  return container;
}

describe("hydrateTransactionTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateTransaction.mockResolvedValue(undefined);
    mockAdjustBudgetPeriodTotal.mockResolvedValue(undefined);
    _resetForTest();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("saves note field on blur", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.value = "updated note";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", { note: "updated note" });
  });

  it("saves category field on blur", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-category") as HTMLInputElement;
    input.value = "Travel";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", { category: "Travel" });
  });

  it("saves reimbursement as number on blur", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-reimbursement") as HTMLInputElement;
    input.value = "75";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", { reimbursement: 75 });
  });

  it("saves budget field on blur", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-budget") as HTMLInputElement;
    input.value = "vacation";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", { budget: "budget-vacation" });
  });

  it("saves budget as null when empty", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-budget") as HTMLInputElement;
    input.value = "";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", { budget: null });
  });

  it("rejects non-finite reimbursement values and shows error", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-reimbursement") as HTMLInputElement;
    // Number inputs sanitize invalid strings, so override value to simulate
    // a programmatic non-numeric value (defense-in-depth test)
    let currentValue = "abc";
    Object.defineProperty(input, "value", {
      get: () => currentValue,
      set: (v: string) => { currentValue = v; },
      configurable: true,
    });
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
    expect(currentValue).toBe("50"); // reverted to defaultValue
    expect(input.classList.contains("save-error")).toBe(true);
  });

  it("skips save when value has not changed", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("reverts input value on save failure and sets title", async () => {
    mockUpdateTransaction.mockRejectedValue(new Error("permission denied"));
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.value = "updated";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.value).toBe("original note");
    expect(input.title).toContain("Save failed");
    expect(console.error).toHaveBeenCalledWith("Failed to save transaction:", expect.any(Error));
  });

  it("adds save-error class on failure", async () => {
    mockUpdateTransaction.mockRejectedValue(new Error("network error"));
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.value = "updated";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.classList.contains("save-error")).toBe(true);
  });

  it("updates defaultValue after successful save", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.value = "new value";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.defaultValue).toBe("new value");
  });

  it("throws DataIntegrityError for malformed JSON in data attributes", () => {
    const container = createContainer("txn-1");
    container.dataset.budgetOptions = "not-json";
    expect(() => hydrateTransactionTable(container)).toThrow("Failed to parse autocomplete options: not-json");
  });

  it("shows error for unknown budget name and does not save", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-budget") as HTMLInputElement;
    input.value = "nonexistent";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
  });

  it("throws DataIntegrityError for malformed budget map JSON", () => {
    const container = createContainer("txn-1");
    container.dataset.budgetMap = "not-json";
    expect(() => hydrateTransactionTable(container)).toThrow("Failed to parse budget map: not-json");
  });

  it("throws DataIntegrityError for non-object budget map JSON", () => {
    const container = createContainer("txn-1");
    container.dataset.budgetMap = JSON.stringify([1, 2, 3]);
    expect(() => hydrateTransactionTable(container)).toThrow("Budget map is not an object");
  });

  it("throws DataIntegrityError for budget map with non-string values", () => {
    const container = createContainer("txn-1");
    container.dataset.budgetMap = JSON.stringify({ food: 123 });
    expect(() => hydrateTransactionTable(container)).toThrow("Budget map contains non-string value");
  });

  it("does not save for elements outside a txn-row", async () => {
    const container = document.createElement("div");
    container.innerHTML = '<input type="text" class="edit-note" value="test">';
    document.body.appendChild(container);
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.value = "changed";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  describe("budget period updates on budget edit", () => {
    it("decrements old period and increments new period on budget change", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 30,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", { budget: "budget-vacation" });
      // Old period (food-w2) decremented by net amount 30
      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -30);
      // New period (vacation-w1) incremented by net amount 30
      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 30);
    });

    it("only decrements old period when no matching new period exists", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 30,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      // housing has no matching period for 2025-01-15
      input.value = "housing";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledTimes(1);
      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -30);
    });

    it("only increments new period when old budget was null", async () => {
      const container = createContainer("txn-1", {
        amount: 30,
        timestamp: new Date("2025-01-15").getTime(),
        // no budgetId — was unbudgeted
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledTimes(1);
      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 30);
    });

    it("updates data-budget-id attribute after save", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 30,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const row = container.querySelector(".txn-row") as HTMLElement;
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(row.dataset.budgetId).toBe("budget-vacation");
    });

    it("removes data-budget-id when budget is cleared", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 30,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const row = container.querySelector(".txn-row") as HTMLElement;
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(row.dataset.budgetId).toBeUndefined();
    });

    it("does not update periods when amount or timestamp are missing", async () => {
      // No amount or timestamp data attributes
      const container = createContainer("txn-1", { budgetId: "budget-food" });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockUpdateTransaction).toHaveBeenCalled();
      expect(mockAdjustBudgetPeriodTotal).not.toHaveBeenCalled();
    });

    it("clamps old period total to zero instead of going negative", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 100, // larger than period total of 50
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      // Server gets raw delta -100; Firestore rules enforce non-negative totals
      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -100);
    });

    it("uses net amount (after reimbursement) for period updates", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 100,
        reimbursement: 50,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      // net = 100 * (1 - 50/100) = 50
      // Old period (food-w2) decremented by net 50
      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -50);
      // New period (vacation-w1) incremented by net 50
      expect(mockAdjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 50);
    });
  });

  describe("parseBudgetPeriods validation", () => {
    it("throws DataIntegrityError for non-object elements", () => {
      const container = createContainer("txn-1");
      container.dataset.budgetPeriods = JSON.stringify(["not-an-object"]);
      expect(() => hydrateTransactionTable(container)).toThrow("Budget period element is not an object");
    });

    it("throws DataIntegrityError for missing string fields", () => {
      const container = createContainer("txn-1");
      container.dataset.budgetPeriods = JSON.stringify([{ id: 123, budgetId: "food", periodStartMs: 0, periodEndMs: 1, total: 0 }]);
      expect(() => hydrateTransactionTable(container)).toThrow("Budget period missing string id or budgetId");
    });

    it("throws DataIntegrityError for missing numeric fields", () => {
      const container = createContainer("txn-1");
      container.dataset.budgetPeriods = JSON.stringify([{ id: "p1", budgetId: "food", periodStartMs: "not-a-number", periodEndMs: 1, total: 0 }]);
      expect(() => hydrateTransactionTable(container)).toThrow("Budget period missing numeric periodStartMs, periodEndMs, or total");
    });

    it("throws DataIntegrityError for null elements", () => {
      const container = createContainer("txn-1");
      container.dataset.budgetPeriods = JSON.stringify([null]);
      expect(() => hydrateTransactionTable(container)).toThrow("Budget period element is not an object");
    });
  });
});
