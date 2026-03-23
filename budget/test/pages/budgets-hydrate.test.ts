// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockDataSource = {
  updateBudget: vi.fn(),
};
vi.mock("../../src/active-data-source.js", () => ({
  getActiveDataSource: () => mockDataSource,
}));

import { hydrateBudgetTable } from "../../src/pages/budgets-hydrate";

function flush(): Promise<void> {
  return new Promise(r => setTimeout(r, 0));
}

function createContainer(budgetId: string): HTMLElement {
  const container = document.createElement("div");
  container.id = "budgets-table";
  container.innerHTML = `
    <div class="budget-header">
      <span>Name</span>
      <span>Allowance</span>
      <span>Period</span>
      <span>Rollover</span>
    </div>
    <div class="budget-row" data-budget-id="${budgetId}">
      <span><input type="text" class="edit-name" value="Food" aria-label="Name"></span>
      <span><input type="number" class="edit-allowance" value="150" min="0" aria-label="Allowance"></span>
      <span><select class="edit-period" aria-label="Period">
        <option value="weekly" selected>Weekly</option>
        <option value="monthly">Monthly</option>
      </select></span>
      <span><select class="edit-rollover" aria-label="Rollover">
        <option value="none" selected>None</option>
        <option value="debt">Debt only</option>
        <option value="balance">Full balance</option>
      </select></span>
    </div>
  `;
  document.body.appendChild(container);
  return container;
}

describe("hydrateBudgetTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockDataSource.updateBudget.mockResolvedValue(undefined);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("saves name field on blur", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-name") as HTMLInputElement;
    input.value = "Food & Dining";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateBudget).toHaveBeenCalledWith("food", { name: "Food & Dining" });
  });

  it("saves allowance field on blur", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-allowance") as HTMLInputElement;
    input.value = "200";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateBudget).toHaveBeenCalledWith("food", { allowance: 200 });
  });

  it("saves rollover on change", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const select = container.querySelector(".edit-rollover") as HTMLSelectElement;
    select.value = "debt";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateBudget).toHaveBeenCalledWith("food", { rollover: "debt" });
  });

  it("updates selected attribute on rollover save", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const select = container.querySelector(".edit-rollover") as HTMLSelectElement;
    select.value = "balance";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    const noneOpt = select.querySelector('option[value="none"]') as HTMLOptionElement;
    const balanceOpt = select.querySelector('option[value="balance"]') as HTMLOptionElement;
    expect(noneOpt.hasAttribute("selected")).toBe(false);
    expect(balanceOpt.hasAttribute("selected")).toBe(true);
  });

  it("rejects empty name and shows error", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-name") as HTMLInputElement;
    input.value = "";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateBudget).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
    expect(input.title).toContain("Budget name cannot be empty");
  });

  it("rejects negative allowance and shows error", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-allowance") as HTMLInputElement;
    input.value = "-5";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateBudget).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
    expect(input.title).toContain("non-negative");
  });

  it("skips save when name value unchanged", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-name") as HTMLInputElement;
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateBudget).not.toHaveBeenCalled();
  });

  it("skips save when rollover value unchanged", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const select = container.querySelector(".edit-rollover") as HTMLSelectElement;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateBudget).not.toHaveBeenCalled();
  });

  it("reverts input on save failure and shows error", async () => {
    mockDataSource.updateBudget.mockRejectedValue(new Error("network error"));
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-name") as HTMLInputElement;
    input.value = "New Name";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.value).toBe("Food");
    expect(input.classList.contains("save-error")).toBe(true);
    expect(input.title).toContain("Save failed");
  });

  it("reverts select on save failure", async () => {
    mockDataSource.updateBudget.mockRejectedValue(new Error("network error"));
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const select = container.querySelector(".edit-rollover") as HTMLSelectElement;
    select.value = "debt";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(select.value).toBe("none");
    expect(select.classList.contains("save-error")).toBe(true);
  });

  it("updates defaultValue after successful name save", async () => {
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-name") as HTMLInputElement;
    input.value = "New Food";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.defaultValue).toBe("New Food");
  });

  it("does not save for elements outside a budget-row", async () => {
    const container = document.createElement("div");
    container.innerHTML = '<input type="text" class="edit-name" value="test">';
    document.body.appendChild(container);
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-name") as HTMLInputElement;
    input.value = "changed";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(mockDataSource.updateBudget).not.toHaveBeenCalled();
  });

  it("shows permission-denied error on save failure", async () => {
    const error = new Error("permission denied");
    (error as any).code = "permission-denied";
    mockDataSource.updateBudget.mockRejectedValue(error);
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-name") as HTMLInputElement;
    input.value = "New";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.title).toContain("Access denied");
  });

  it("shows range error on save failure", async () => {
    mockDataSource.updateBudget.mockRejectedValue(new RangeError("out of range"));
    const container = createContainer("food");
    hydrateBudgetTable(container);
    const input = container.querySelector(".edit-allowance") as HTMLInputElement;
    input.value = "999";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await flush();
    expect(input.title).toContain("Value out of range");
  });
});
