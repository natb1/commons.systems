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

interface VarianceContainerOpts {
  readonly weeklyAllowance?: string;
  readonly window12?: string;
  readonly window52?: string;
  readonly omitVariance?: boolean;
}

function makeVarianceContainer(opts: VarianceContainerOpts = {}): { container: HTMLElement; details: HTMLDetailsElement; varianceEl: HTMLElement | null } {
  const container = document.createElement("div");
  container.id = "budgets-table";

  const details = document.createElement("details") as HTMLDetailsElement;
  details.classList.add("budget-row");
  details.setAttribute("data-budget-id", "food");

  const summary = document.createElement("summary");
  details.appendChild(summary);

  let varianceEl: HTMLElement | null = null;
  if (!opts.omitVariance) {
    varianceEl = document.createElement("div");
    varianceEl.classList.add("budget-variance");
    if (opts.weeklyAllowance !== undefined) {
      varianceEl.setAttribute("data-weekly-allowance", opts.weeklyAllowance);
    }
    if (opts.window12 !== undefined) {
      varianceEl.setAttribute("data-window12", opts.window12);
    }
    if (opts.window52 !== undefined) {
      varianceEl.setAttribute("data-window52", opts.window52);
    }
    details.appendChild(varianceEl);
  }

  container.appendChild(details);
  document.body.appendChild(container);
  if (varianceEl) {
    Object.defineProperty(varianceEl, "clientWidth", { value: 640, configurable: true });
  }
  return { container, details, varianceEl };
}

const POPULATED_W12 = JSON.stringify([
  { kind: "category", category: "Food:Groceries", avgWeekly: 60 },
  { kind: "category", category: "Food:Restaurants", avgWeekly: 30 },
]);
const POPULATED_W52 = JSON.stringify([
  { kind: "category", category: "Food:Groceries", avgWeekly: 55 },
  { kind: "category", category: "Food:Restaurants", avgWeekly: 25 },
]);

function openDetails(details: HTMLDetailsElement): void {
  details.open = true;
}

function clearBody(): void {
  while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
}

describe("hydrateBudgetTable — variance", () => {
  const THEME_VARS: Record<string, string> = {
    "--fg": "#e0e0e0",
    "--favorable": "#4caf50",
    "--unfavorable": "#e45858",
  };
  let originalClientWidth: PropertyDescriptor | undefined;
  let originalGetComputedStyle: typeof window.getComputedStyle;
  beforeEach(() => {
    originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      get() { return 640; },
      configurable: true,
    });
    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
      const cs = originalGetComputedStyle.call(window, el, pseudo ?? null);
      const origGetPropertyValue = cs.getPropertyValue.bind(cs);
      cs.getPropertyValue = (prop: string) => {
        const direct = origGetPropertyValue(prop);
        if (direct) return direct;
        return THEME_VARS[prop] ?? "";
      };
      return cs;
    }) as typeof window.getComputedStyle;
  });
  afterEach(() => {
    if (originalClientWidth) {
      Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth);
    } else {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
    }
    window.getComputedStyle = originalGetComputedStyle;
    clearBody();
  });

  it("hydrates variance details when the row is first expanded", () => {
    const { container, details, varianceEl } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: POPULATED_W12,
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    openDetails(details);
    expect(varianceEl!.dataset.hydrated).toBe("true");
    expect(varianceEl!.querySelector(".variance-wrapper")).not.toBeNull();
  });

  it("does not re-hydrate when a row is re-opened", () => {
    const { container, details, varianceEl } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: POPULATED_W12,
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    openDetails(details);
    const firstWrapper = varianceEl!.querySelector(".variance-wrapper");
    details.open = false;
    openDetails(details);
    expect(varianceEl!.querySelector(".variance-wrapper")).toBe(firstWrapper);
  });

  it("does not hydrate while the row remains closed", () => {
    const { container, details, varianceEl } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: POPULATED_W12,
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    details.dispatchEvent(new Event("toggle"));
    expect(varianceEl!.dataset.hydrated).toBeUndefined();
  });

  it("throws when data-weekly-allowance is missing", () => {
    const { container, details } = makeVarianceContainer({
      window12: POPULATED_W12,
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when data-weekly-allowance is not finite", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "NaN",
      window12: POPULATED_W12,
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when data-window12 is not valid JSON", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: "not json",
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when data-window12 decodes to a non-array", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: "{}",
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when a row is missing avgWeekly", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([{ kind: "category", category: "X" }]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws on unknown row kind", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([{ kind: "zzz", avgWeekly: 0 }]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when Other row has a non-integer groupedCount", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([{ kind: "other", avgWeekly: 10, groupedCount: 0.5 }]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when Other row has groupedCount=0 (producer requires >=1)", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([{ kind: "other", avgWeekly: 10, groupedCount: 0 }]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when Other row has negative groupedCount", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([{ kind: "other", avgWeekly: 10, groupedCount: -1 }]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when a row is a non-object element", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([null]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when avgWeekly is not a finite number", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([{ kind: "category", category: "X", avgWeekly: null }]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("throws when category variant has a non-string category field", () => {
    const { container, details } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([{ kind: "category", category: 123, avgWeekly: 5 }]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("hydrates and shows an empty message when both windows are empty", () => {
    const { container, details, varianceEl } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: "[]",
      window52: "[]",
    });
    hydrateBudgetTable(container);
    openDetails(details);
    expect(varianceEl!.dataset.hydrated).toBe("true");
    expect(varianceEl!.querySelector(".variance-wrapper")).not.toBeNull();
    expect(varianceEl!.querySelector(".variance-empty")).not.toBeNull();
  });

  it("re-renders the chart when the window toggle changes to 52", () => {
    const { container, details, varianceEl } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: POPULATED_W12,
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    openDetails(details);
    const firstSvg = varianceEl!.querySelector(".variance-chart svg");
    expect(firstSvg).not.toBeNull();
    const firstAria = firstSvg!.getAttribute("aria-label");
    const radio52 = varianceEl!.querySelector('input[value="52"]') as HTMLInputElement;
    radio52.checked = true;
    radio52.dispatchEvent(new Event("change", { bubbles: true }));
    const nextSvg = varianceEl!.querySelector(".variance-chart svg");
    expect(nextSvg).not.toBeNull();
    expect(nextSvg!.getAttribute("aria-label")).not.toBe(firstAria);
    expect(nextSvg!.getAttribute("aria-label")).toContain("52");
  });

  it("leaves a single svg/dl after repeated window toggling", () => {
    const { container, details, varianceEl } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: POPULATED_W12,
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    openDetails(details);
    const radio12 = varianceEl!.querySelector('input[value="12"]') as HTMLInputElement;
    const radio52 = varianceEl!.querySelector('input[value="52"]') as HTMLInputElement;
    for (const radio of [radio52, radio12, radio52, radio12]) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
    expect(varianceEl!.querySelectorAll(".variance-chart svg")).toHaveLength(1);
    expect(varianceEl!.querySelectorAll(".variance-breakdown")).toHaveLength(1);
  });

  it("throws when the window toggle receives an unexpected value", () => {
    const { container, details, varianceEl } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: POPULATED_W12,
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    openDetails(details);
    const radio = varianceEl!.querySelector('input[value="12"]') as HTMLInputElement;
    radio.value = "99";
    expect(() => radio.dispatchEvent(new Event("change", { bubbles: true }))).toThrow();
  });

  it("throws when .budget-variance is missing from an expanded row", () => {
    const { container, details } = makeVarianceContainer({ omitVariance: true });
    hydrateBudgetTable(container);
    expect(() => openDetails(details)).toThrow();
  });

  it("renders a breakdown DL with an entry per category and 'Other' marked", () => {
    const { container, details, varianceEl } = makeVarianceContainer({
      weeklyAllowance: "100",
      window12: JSON.stringify([
        { kind: "category", category: "Food:Groceries", avgWeekly: 60 },
        { kind: "other", avgWeekly: 20, groupedCount: 3 },
      ]),
      window52: POPULATED_W52,
    });
    hydrateBudgetTable(container);
    openDetails(details);
    const dl = varianceEl!.querySelector(".variance-breakdown");
    expect(dl).not.toBeNull();
    const dts = dl!.querySelectorAll("dt");
    const dds = dl!.querySelectorAll("dd");
    expect(dts).toHaveLength(2);
    expect(dds).toHaveLength(2);
    expect(dts[0].textContent).toBe("Food:Groceries");
    expect(dts[0].classList.contains("variance-other")).toBe(false);
    expect(dts[1].textContent).toBe("Other");
    expect(dts[1].classList.contains("variance-other")).toBe(true);
    // absTotal = 60 + 20 = 80; shares are 75.0% and 25.0%
    expect(dds[0].textContent).toContain("75.0%");
    expect(dds[1].textContent).toContain("25.0%");
  });

  it("isolates radio groups across two simultaneously-expanded rows", () => {
    const container = document.createElement("div");
    container.id = "budgets-table";
    function addRow(budgetId: string): HTMLDetailsElement {
      const details = document.createElement("details") as HTMLDetailsElement;
      details.classList.add("budget-row");
      details.setAttribute("data-budget-id", budgetId);
      details.appendChild(document.createElement("summary"));
      const varianceEl = document.createElement("div");
      varianceEl.classList.add("budget-variance");
      varianceEl.setAttribute("data-weekly-allowance", "100");
      varianceEl.setAttribute("data-window12", POPULATED_W12);
      varianceEl.setAttribute("data-window52", POPULATED_W52);
      details.appendChild(varianceEl);
      container.appendChild(details);
      return details;
    }
    const food = addRow("food");
    const fun = addRow("fun");
    document.body.appendChild(container);
    hydrateBudgetTable(container);
    openDetails(food);
    openDetails(fun);

    const foodRadios = food.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    const funRadios = fun.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(foodRadios[0].name).not.toBe(funRadios[0].name);
    expect(foodRadios[0].name).toContain("food");
    expect(funRadios[0].name).toContain("fun");

    const foodRadio52 = food.querySelector<HTMLInputElement>('input[value="52"]')!;
    foodRadio52.checked = true;
    foodRadio52.dispatchEvent(new Event("change", { bubbles: true }));

    const funRadio12 = fun.querySelector<HTMLInputElement>('input[value="12"]')!;
    expect(funRadio12.checked).toBe(true);
  });
});
