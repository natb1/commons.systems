// @vitest-environment happy-dom
//
// Markup-parity unit suite for the React <Rules> page (Unit 5). Covers every
// selector the e2e (budget/e2e/rules.spec.ts) uses, asserting the rendered DOM
// contract using RTL + container.querySelector rather than innerHTML substrings —
// because ds Input/Button/Select components append a cs-* base class, making a
// literal class="edit-pattern" substring check fail.
//
// Altitude: observable DOM only (DOM queries, attribute values, disabled
// properties, innerHTML substrings for pure text). No React internals.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { DataSource } from "../../src/data-source";
import type { Rule, RuleId } from "../../src/entities/rule";
import type { NormalizationRule, NormalizationRuleId } from "../../src/entities/normalization-rule";
import { createMockDataSource } from "../helpers";

// The page and hook import registerAutocompleteListeners/removeDropdown from
// @commons-systems/components/autocomplete. Keep the suite hermetic and free of
// autocomplete side effects in happy-dom by mocking the whole module.
vi.mock("@commons-systems/components/autocomplete", () => ({
  registerAutocompleteListeners: vi.fn(),
  removeDropdown: vi.fn(),
  showDropdown: vi.fn(),
}));

import { Rules } from "../../src/pages/Rules";

// ── Mock data factories ──────────────────────────────────────────────────────

function rule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "r-cat-1" as RuleId,
    type: "categorization",
    pattern: "coffee",
    target: "Food:Coffee",
    priority: 10,
    institution: null,
    account: null,
    minAmount: null,
    maxAmount: null,
    excludeCategory: null,
    matchCategory: null,
    groupId: null,
    ...overrides,
  } as Rule;
}

function normRule(overrides: Partial<NormalizationRule> = {}): NormalizationRule {
  return {
    id: "n-1" as NormalizationRuleId,
    pattern: "amzn",
    patternType: null,
    canonicalDescription: "Amazon",
    dateWindowDays: 7,
    institution: null,
    account: null,
    priority: 100,
    groupId: null,
    ...overrides,
  } as NormalizationRule;
}

const defaultBudgets = [
  { id: "food", name: "Food", allowance: 150, rollover: "none" as const, overrides: [], groupId: null },
  { id: "vacation", name: "Vacation", allowance: 100, rollover: "balance" as const, overrides: [], groupId: null },
];

// ── Options builders ─────────────────────────────────────────────────────────

function seedOptions(dsOverrides: Partial<DataSource> = {}) {
  return {
    authorized: false,
    groupName: "",
    dataSource: createMockDataSource({
      getBudgets: vi.fn().mockResolvedValue(defaultBudgets),
      getRules: vi.fn().mockResolvedValue([]),
      getNormalizationRules: vi.fn().mockResolvedValue([]),
      ...dsOverrides,
    }),
  };
}

function localOptions(dsOverrides: Partial<DataSource> = {}) {
  return {
    authorized: true,
    groupName: "household",
    dataSource: createMockDataSource({
      getBudgets: vi.fn().mockResolvedValue(defaultBudgets),
      getRules: vi.fn().mockResolvedValue([]),
      getNormalizationRules: vi.fn().mockResolvedValue([]),
      ...dsOverrides,
    }),
  };
}

// ── Render helper ────────────────────────────────────────────────────────────

async function renderRules(
  options: Parameters<typeof Rules>[0]["options"],
): Promise<{ container: HTMLElement }> {
  const result = render(<Rules options={options} />);
  await waitFor(() => {
    if (
      !result.container.querySelector("#rules-table") &&
      !result.container.querySelector("#rules-error")
    ) {
      throw new Error("not settled");
    }
  });
  return result;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Rules page markup-parity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // 1. Heading
  it("renders 'Rules' heading", async () => {
    const { container } = await renderRules(seedOptions());
    expect(container.querySelector("main > h2")?.textContent).toBe("Rules");
  });

  // 2. Unauthorized: seed-data-notice present with expected text
  it("shows seed-data-notice for unauthorized users", async () => {
    const { container } = await renderRules(seedOptions());
    const notice = container.querySelector("#seed-data-notice");
    expect(notice).not.toBeNull();
    expect(notice?.textContent).toContain("Load a data file");
  });

  // 3. Authorized: seed-data-notice absent
  it("does not show seed-data-notice for authorized users", async () => {
    const { container } = await renderRules(localOptions());
    expect(container.querySelector("#seed-data-notice")).toBeNull();
  });

  // 4. #rules-table and #rule-type-filter both present
  it("renders #rules-table and #rule-type-filter", async () => {
    const { container } = await renderRules(seedOptions());
    expect(container.querySelector("#rules-table")).not.toBeNull();
    expect(container.querySelector("#rule-type-filter")).not.toBeNull();
  });

  // 5. Both header rows present; default header spans include first five columns
  it("renders both header rows with correct column labels", async () => {
    const { container } = await renderRules(seedOptions());
    const defaultHeader = container.querySelector(".rule-header-default");
    expect(defaultHeader).not.toBeNull();
    expect(container.querySelector(".rule-header-normalization")).not.toBeNull();

    const spans = defaultHeader!.querySelectorAll("span");
    const texts = Array.from(spans).map(s => s.textContent);
    expect(texts[0]).toBe("Pattern");
    expect(texts[1]).toBe("Target");
    expect(texts[2]).toBe("Priority");
    expect(texts[3]).toBe("Institution");
    expect(texts[4]).toBe("Account");
  });

  // 6. One row of each type renders
  it("renders one row of each rule type", async () => {
    const { container } = await renderRules(localOptions({
      getRules: vi.fn().mockResolvedValue([
        rule({ id: "r-cat-1" as RuleId, type: "categorization" }),
        rule({ id: "r-bud-1" as RuleId, type: "budget_assignment", target: "Food" }),
      ]),
      getNormalizationRules: vi.fn().mockResolvedValue([
        normRule(),
      ]),
    }));
    expect(container.querySelector('.rule-row[data-rule-type="categorization"]')).not.toBeNull();
    expect(container.querySelector('.rule-row[data-rule-type="budget_assignment"]')).not.toBeNull();
    expect(container.querySelector('.rule-row[data-rule-type="normalization"]')).not.toBeNull();
  });

  // 7a. Standard rule row has .edit-pattern, .edit-target, .edit-institution, .edit-account inputs with aria-labels
  it("renders standard rule row inputs with aria-labels", async () => {
    const { container } = await renderRules(seedOptions({
      getRules: vi.fn().mockResolvedValue([rule()]),
    }));
    const catRow = container.querySelector('.rule-row[data-rule-type="categorization"]');
    expect(catRow).not.toBeNull();
    expect(catRow!.querySelector(".edit-pattern")).not.toBeNull();
    expect(catRow!.querySelector(".edit-target")).not.toBeNull();
    expect(catRow!.querySelector(".edit-institution")).not.toBeNull();
    expect(catRow!.querySelector(".edit-account")).not.toBeNull();
    expect(catRow!.querySelector('[aria-label="Pattern"]')).not.toBeNull();
    expect(catRow!.querySelector('[aria-label="Target"]')).not.toBeNull();
    expect(catRow!.querySelector('[aria-label="Institution"]')).not.toBeNull();
    expect(catRow!.querySelector('[aria-label="Account"]')).not.toBeNull();
  });

  // 7b. Normalization rule row has .edit-canonical and .edit-date-window inputs
  it("renders normalization rule row inputs with canonical and date-window", async () => {
    const { container } = await renderRules(seedOptions({
      getNormalizationRules: vi.fn().mockResolvedValue([normRule()]),
    }));
    const normRow = container.querySelector('.rule-row[data-rule-type="normalization"]');
    expect(normRow).not.toBeNull();
    expect(normRow!.querySelector(".edit-canonical")).not.toBeNull();
    expect(normRow!.querySelector(".edit-date-window")).not.toBeNull();
    expect(normRow!.querySelector('[aria-label="Canonical Description"]')).not.toBeNull();
    expect(normRow!.querySelector('[aria-label="Date Window"]')).not.toBeNull();
  });

  // 8. Unauthorized: all inputs in #rules-table are disabled; #add-rule absent; .delete-rule absent; no data-*-options attrs
  it("disables all inputs, hides add/delete, and omits data-options attrs for unauthorized users", async () => {
    const { container } = await renderRules(seedOptions({
      getRules: vi.fn().mockResolvedValue([rule()]),
      getNormalizationRules: vi.fn().mockResolvedValue([normRule()]),
    }));
    const table = container.querySelector("#rules-table")!;
    const inputs = table.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of Array.from(inputs)) {
      expect((input as HTMLInputElement).disabled).toBe(true);
    }
    expect(container.querySelector("#add-rule")).toBeNull();
    expect(container.querySelectorAll(".delete-rule").length).toBe(0);
    expect(table.hasAttribute("data-budget-options")).toBe(false);
    expect(table.hasAttribute("data-category-options")).toBe(false);
    expect(table.hasAttribute("data-institution-options")).toBe(false);
    expect(table.hasAttribute("data-account-options")).toBe(false);
  });

  // 9. Authorized: inputs not disabled; #add-rule present; .delete-rule present per row; data-*-options attrs present; rows have data-rule-id
  it("enables inputs, shows add/delete, and has data-options attrs for authorized users", async () => {
    const { container } = await renderRules(localOptions({
      getRules: vi.fn().mockResolvedValue([
        rule({ id: "r-cat-1" as RuleId }),
        rule({ id: "r-bud-1" as RuleId, type: "budget_assignment", target: "Food" }),
      ]),
      getNormalizationRules: vi.fn().mockResolvedValue([normRule()]),
    }));
    const table = container.querySelector("#rules-table")!;
    const inputs = table.querySelectorAll("input");
    expect(inputs.length).toBeGreaterThan(0);
    for (const input of Array.from(inputs)) {
      expect((input as HTMLInputElement).disabled).toBe(false);
    }
    expect(container.querySelector("#add-rule")).not.toBeNull();
    // one delete button per row (3 rows total)
    expect(container.querySelectorAll(".delete-rule").length).toBe(3);
    expect(table.hasAttribute("data-budget-options")).toBe(true);
    expect(table.hasAttribute("data-category-options")).toBe(true);
    expect(table.hasAttribute("data-institution-options")).toBe(true);
    expect(table.hasAttribute("data-account-options")).toBe(true);
    // rows carry data-rule-id for authorized users
    const rows = table.querySelectorAll(".rule-row");
    for (const row of Array.from(rows)) {
      expect((row as HTMLElement).hasAttribute("data-rule-id")).toBe(true);
    }
  });

  // 10a. Generic Error → "Could not load data"
  it("shows 'Could not load data' for a generic connection error", async () => {
    const { container } = await renderRules(seedOptions({
      getRules: vi.fn().mockRejectedValue(new Error("connection failed")),
    }));
    const errEl = container.querySelector("#rules-error");
    expect(errEl).not.toBeNull();
    expect(errEl?.textContent).toContain("Could not load data");
  });

  // 10b. RangeError → "A data error occurred"
  it("shows 'A data error occurred' for a RangeError", async () => {
    const { container } = await renderRules(seedOptions({
      getRules: vi.fn().mockRejectedValue(new RangeError("priority out of range")),
    }));
    const errEl = container.querySelector("#rules-error");
    expect(errEl).not.toBeNull();
    expect(errEl?.textContent).toContain("A data error occurred");
    expect(errEl?.textContent).not.toContain("Could not load data");
  });

  // 10c. DataIntegrityError → "A data error occurred"
  it("shows 'A data error occurred' for a DataIntegrityError", async () => {
    const { container } = await renderRules(seedOptions({
      getRules: vi.fn().mockRejectedValue(new DataIntegrityError("bad field")),
    }));
    const errEl = container.querySelector("#rules-error");
    expect(errEl).not.toBeNull();
    expect(errEl?.textContent).toContain("A data error occurred");
    expect(errEl?.textContent).not.toContain("Could not load data");
  });

  // 10d. permission-denied error → "Access denied"
  it("shows 'Access denied' for a permission-denied error", async () => {
    const e = new Error("denied");
    (e as Error & { code?: string }).code = "permission-denied";
    const { container } = await renderRules(seedOptions({
      getRules: vi.fn().mockRejectedValue(e),
    }));
    const errEl = container.querySelector("#rules-error");
    expect(errEl).not.toBeNull();
    expect(errEl?.textContent).toContain("Access denied");
  });

  // 10e. programmer error (TypeError) → "Something went wrong"
  it("shows 'Something went wrong' for a programmer error (TypeError)", async () => {
    // deferProgrammerError re-throws the TypeError via setTimeout(…, 0) so it
    // surfaces in devtools/an error boundary. This hermetic suite has no boundary,
    // so the deferred throw escapes as a Node uncaughtException that would fail the
    // run. Capture it with a one-shot listener while the test renders and settles.
    const captured: unknown[] = [];
    const onUncaught = (err: unknown) => { captured.push(err); };
    process.on("uncaughtException", onUncaught);
    try {
      const { container } = await renderRules(seedOptions({
        getRules: vi.fn().mockRejectedValue(new TypeError("unexpected null")),
      }));
      const errEl = container.querySelector("#rules-error");
      expect(errEl).not.toBeNull();
      expect(errEl?.textContent).toContain("Something went wrong");
      // Let the deferred setTimeout(…, 0) rethrow land in our listener.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(captured.some((e) => e instanceof TypeError)).toBe(true);
    } finally {
      process.off("uncaughtException", onUncaught);
    }
  });

  // 11. Default filter is "categorization"
  it("default data-active-filter is 'categorization'", async () => {
    const { container } = await renderRules(seedOptions());
    const table = container.querySelector("#rules-table");
    expect(table?.getAttribute("data-active-filter")).toBe("categorization");
  });
});
