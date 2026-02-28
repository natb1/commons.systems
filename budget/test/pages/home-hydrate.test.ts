import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/firestore.js", () => ({
  updateTransaction: vi.fn(),
}));

import { hydrateTransactionTable } from "../../src/pages/home-hydrate";
import { updateTransaction } from "../../src/firestore";

const mockUpdateTransaction = vi.mocked(updateTransaction);

function flush(): Promise<void> {
  return new Promise(r => setTimeout(r, 0));
}

function createContainer(txnId: string): HTMLElement {
  const container = document.createElement("div");
  container.id = "transactions-table";
  container.dataset.budgetOptions = JSON.stringify(["food", "housing", "vacation"]);
  container.dataset.categoryOptions = JSON.stringify(["Food", "Travel"]);
  container.innerHTML = `
    <details class="txn-row" data-txn-id="${txnId}">
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
    expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", { budget: "vacation" });
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

  it("reverts input value on save failure", async () => {
    mockUpdateTransaction.mockRejectedValue(new Error("permission denied"));
    const container = createContainer("txn-1");
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-note") as HTMLInputElement;
    input.value = "updated";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.value).toBe("original note");
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

  it("handles malformed JSON in data attributes gracefully", () => {
    const container = createContainer("txn-1");
    container.dataset.budgetOptions = "not-json";
    hydrateTransactionTable(container);
    const input = container.querySelector(".edit-budget") as HTMLInputElement;
    input.dispatchEvent(new Event("focus", { bubbles: true }));
    expect(document.querySelector(".autocomplete-dropdown")).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Failed to parse autocomplete options:", "not-json", expect.any(SyntaxError));
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
});
