// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockDataSource = {
  updateTransaction: vi.fn(),
  adjustBudgetPeriodTotal: vi.fn(),
};
vi.mock("../../src/active-data-source.js", () => ({
  getActiveDataSource: () => mockDataSource,
}));

vi.mock("@commons-systems/components/autocomplete", () => ({
  showDropdown: vi.fn(),
  removeDropdown: vi.fn(),
  registerAutocompleteListeners: vi.fn(),
  _resetForTest: vi.fn(),
}));

import { hydrateTransactionTable, _resetForTest } from "../../src/pages/home-hydrate";

function flush(): Promise<void> {
  return new Promise(r => setTimeout(r, 0));
}

const defaultPeriods = [
  { id: "food-w1", budgetId: "budget-food", periodStartMs: new Date("2025-01-06").getTime(), periodEndMs: new Date("2025-01-13").getTime(), total: 80, count: 0, categoryBreakdown: {} },
  { id: "food-w2", budgetId: "budget-food", periodStartMs: new Date("2025-01-13").getTime(), periodEndMs: new Date("2025-01-20").getTime(), total: 50, count: 0, categoryBreakdown: {} },
  { id: "vacation-w1", budgetId: "budget-vacation", periodStartMs: new Date("2025-01-13").getTime(), periodEndMs: new Date("2025-01-20").getTime(), total: 30, count: 0, categoryBreakdown: {} },
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
    <details class="expand-row txn-row" data-txn-id="${txnId}"${budgetIdAttr}${amountAttr}${timestampAttr}${reimbursementAttr}>
      <summary class="txn-summary">
        <div class="txn-summary-content">
          <span>Description</span>
          <span><input type="text" class="edit-note" value="original note"></span>
          <span><input type="text" class="edit-category" value="Food"></span>
          <span class="amount">$52.30</span>
        </div>
      </summary>
      <div class="expand-details txn-details">
        <dl>
          <dt>Reimbursement</dt><dd><input type="number" class="edit-reimbursement" value="${overrides.reimbursement ?? 50}" min="0" max="100"></dd>
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
    mockDataSource.updateTransaction.mockResolvedValue(undefined);
    mockDataSource.adjustBudgetPeriodTotal.mockResolvedValue(undefined);
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
    expect(mockDataSource.updateTransaction).toHaveBeenCalledWith("txn-1", { note: "updated note" });
  });

  it("saves category field on blur", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-category") as HTMLInputElement;
    input.value = "Travel";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateTransaction).toHaveBeenCalledWith("txn-1", { category: "Travel" });
  });

  it("saves reimbursement as number on blur", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-reimbursement") as HTMLInputElement;
    input.value = "75";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateTransaction).toHaveBeenCalledWith("txn-1", { reimbursement: 75 });
  });

  it("saves budget field on blur", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-budget") as HTMLInputElement;
    input.value = "vacation";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateTransaction).toHaveBeenCalledWith("txn-1", { budget: "budget-vacation" });
  });

  it("saves budget as null when empty", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-budget") as HTMLInputElement;
    input.value = "";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateTransaction).toHaveBeenCalledWith("txn-1", { budget: null });
  });

  it("rejects non-finite reimbursement values and shows error", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-reimbursement") as HTMLInputElement;
    let currentValue = "abc";
    Object.defineProperty(input, "value", {
      get: () => currentValue,
      set: (v: string) => { currentValue = v; },
      configurable: true,
    });
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateTransaction).not.toHaveBeenCalled();
    expect(currentValue).toBe("50");
    expect(input.classList.contains("save-error")).toBe(true);
  });

  it("skips save when value has not changed", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateTransaction).not.toHaveBeenCalled();
  });

  it("reverts input value on save failure and sets title", async () => {
    mockDataSource.updateTransaction.mockRejectedValue(new Error("permission denied"));
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.value = "updated";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.value).toBe("original note");
    expect(input.title).toContain("Save failed");
    expect(console.error).toHaveBeenCalledWith("[save-transaction]", expect.any(Error));
  });

  it("adds save-error class on failure", async () => {
    mockDataSource.updateTransaction.mockRejectedValue(new Error("network error"));
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
    expect(() => hydrateTransactionTable(container)).toThrow("Failed to parse JSON string array: not-json");
  });

  it("shows error for unknown budget name and does not save", async () => {
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-budget") as HTMLInputElement;
    input.value = "nonexistent";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateTransaction).not.toHaveBeenCalled();
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
    expect(mockDataSource.updateTransaction).not.toHaveBeenCalled();
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

      expect(mockDataSource.updateTransaction).toHaveBeenCalledWith("txn-1", { budget: "budget-vacation" });
      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -30);
      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 30);
    });

    it("only decrements old period when no matching new period exists", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 30,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "housing";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledTimes(1);
      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -30);
    });

    it("only increments new period when old budget was null", async () => {
      const container = createContainer("txn-1", {
        amount: 30,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledTimes(1);
      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 30);
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

    it("shows data integrity error when amount or timestamp data attributes are missing", async () => {
      const container = createContainer("txn-1", { budgetId: "budget-food" });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockDataSource.updateTransaction).toHaveBeenCalled();
      expect(mockDataSource.adjustBudgetPeriodTotal).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "[save-data-integrity]",
        expect.objectContaining({ message: expect.stringContaining("Cannot update period totals") }),
      );
      expect(input.classList.contains("save-error")).toBe(true);
    });

    it("sends raw negative delta to server without local clamping", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 100,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -100);
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

      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -50);
      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledWith("vacation-w1", 50);
    });

    it("clears balance display after budget change", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 30,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const balanceDd = container.querySelector(".budget-balance") as HTMLElement;
      expect(balanceDd.textContent).toBe("100.00");

      const input = container.querySelector(".edit-budget") as HTMLInputElement;
      input.value = "vacation";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(balanceDd.textContent).toBe("--");
    });

    it("logs error but preserves transaction save when period adjustment fails", async () => {
      mockDataSource.adjustBudgetPeriodTotal.mockRejectedValue(new Error("firestore unavailable"));
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

      expect(mockDataSource.updateTransaction).toHaveBeenCalledWith("txn-1", { budget: "budget-vacation" });
      expect(console.error).toHaveBeenCalledWith("[update-period-totals]", expect.any(Error));
      const row = container.querySelector(".txn-row") as HTMLElement;
      expect(row.dataset.budgetId).toBe("budget-vacation");
    });
  });

  describe("period updates on reimbursement edit", () => {
    it("adjusts period total when reimbursement changes", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 100,
        reimbursement: 0,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-reimbursement") as HTMLInputElement;
      input.value = "50";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockDataSource.updateTransaction).toHaveBeenCalledWith("txn-1", { reimbursement: 50 });
      expect(mockDataSource.adjustBudgetPeriodTotal).toHaveBeenCalledWith("food-w2", -50);
    });

    it("does not adjust period when transaction has no budget", async () => {
      const container = createContainer("txn-1", {
        amount: 100,
        reimbursement: 0,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const input = container.querySelector(".edit-reimbursement") as HTMLInputElement;
      input.value = "50";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(mockDataSource.updateTransaction).toHaveBeenCalled();
      expect(mockDataSource.adjustBudgetPeriodTotal).not.toHaveBeenCalled();
    });

    it("updates data-reimbursement attribute after save", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 100,
        reimbursement: 0,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const row = container.querySelector(".txn-row") as HTMLElement;
      const input = container.querySelector(".edit-reimbursement") as HTMLInputElement;
      input.value = "50";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(row.dataset.reimbursement).toBe("50");
    });

    it("clears balance display after reimbursement change", async () => {
      const container = createContainer("txn-1", {
        budgetId: "budget-food",
        amount: 100,
        reimbursement: 0,
        timestamp: new Date("2025-01-15").getTime(),
      });
      hydrateTransactionTable(container);
      const balanceDd = container.querySelector(".budget-balance") as HTMLElement;

      const input = container.querySelector(".edit-reimbursement") as HTMLInputElement;
      input.value = "50";
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      await flush();

      expect(balanceDd.textContent).toBe("--");
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
      container.dataset.budgetPeriods = JSON.stringify([{ id: "p1", budgetId: "food", periodStartMs: "not-a-number", periodEndMs: 1, total: 0, count: 0, categoryBreakdown: {} }]);
      expect(() => hydrateTransactionTable(container)).toThrow("Budget period missing numeric periodStartMs, periodEndMs, total, or count");
    });

    it("throws DataIntegrityError for null elements", () => {
      const container = createContainer("txn-1");
      container.dataset.budgetPeriods = JSON.stringify([null]);
      expect(() => hydrateTransactionTable(container)).toThrow("Budget period element is not an object");
    });

    it("throws DataIntegrityError for non-array budget periods", () => {
      const container = createContainer("txn-1");
      container.dataset.budgetPeriods = JSON.stringify({ id: "p1" });
      expect(() => hydrateTransactionTable(container)).toThrow("Budget periods is not an array");
    });

    it("throws DataIntegrityError when periodStartMs >= periodEndMs", () => {
      const container = createContainer("txn-1");
      container.dataset.budgetPeriods = JSON.stringify([
        { id: "p1", budgetId: "food", periodStartMs: 1000, periodEndMs: 1000, total: 0, count: 0, categoryBreakdown: {} },
      ]);
      expect(() => hydrateTransactionTable(container)).toThrow("Budget period has periodStartMs >= periodEndMs");
    });
  });
});
