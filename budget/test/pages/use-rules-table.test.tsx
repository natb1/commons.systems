// @vitest-environment happy-dom
//
// Cleared-input guard lock for the /rules table priority blur-save. Renders the
// React <Rules> page (which mounts useRulesTable), drives a native blur on a
// priority input, and asserts against the MOCKED active data source. An emptied
// priority field must be rejected — never saved as Number("") === 0, which is
// top precedence. Mirrors the getActiveDataSource single-surface idiom of
// budgets-hydrate.test.tsx / home-hydrate.test.tsx.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import type { DataSource } from "../../src/data-source";
import type { Rule, RuleId } from "../../src/entities/rule";
import type { NormalizationRule, NormalizationRuleId } from "../../src/entities/normalization-rule";
import { createMockDataSource } from "../helpers";

vi.mock("@commons-systems/components/autocomplete", () => ({
  registerAutocompleteListeners: vi.fn(),
  removeDropdown: vi.fn(),
  showDropdown: vi.fn(),
}));

let activeDS: DataSource;
vi.mock("../../src/active-data-source.js", () => ({
  getActiveDataSource: () => activeDS,
  setActiveDataSource: (ds: DataSource) => { activeDS = ds; },
}));

import { Rules } from "../../src/pages/Rules";

function rule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "r-cat-1" as RuleId, // type-safety-ok: test fixture branded id
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
  } as Rule; // type-safety-ok: test fixture cast
}

function normRule(overrides: Partial<NormalizationRule> = {}): NormalizationRule {
  return {
    id: "n-1" as NormalizationRuleId, // type-safety-ok: test fixture branded id
    pattern: "amzn",
    patternType: null,
    canonicalDescription: "Amazon",
    dateWindowDays: 7,
    institution: null,
    account: null,
    priority: 100,
    groupId: null,
    ...overrides,
  } as NormalizationRule; // type-safety-ok: test fixture cast
}

const defaultBudgets = [
  { id: "food", name: "Food", allowance: 150, rollover: "none" as const, overrides: [], groupId: null },
];

function flush(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function blur(input: HTMLElement): void {
  input.dispatchEvent(new Event("blur", { bubbles: true }));
}

async function renderRules(rules: Rule[], normRules: NormalizationRule[]): Promise<HTMLElement> {
  const ds = createMockDataSource({
    getBudgets: vi.fn().mockResolvedValue(defaultBudgets),
    getRules: vi.fn().mockResolvedValue(rules),
    getNormalizationRules: vi.fn().mockResolvedValue(normRules),
    updateRule: vi.fn().mockResolvedValue(undefined),
    updateNormalizationRule: vi.fn().mockResolvedValue(undefined),
  });
  activeDS = ds;
  const { container } = render(
    <Rules options={{ authorized: true, groupName: "household", dataSource: ds }} />,
  );
  await waitFor(() => {
    if (!container.querySelector("#rules-table")) throw new Error("no table");
  });
  return container;
}

function priorityInput(container: HTMLElement, ruleType: string): HTMLInputElement {
  const input = container.querySelector(
    `.rule-row[data-rule-type="${ruleType}"] .edit-priority`,
  ) as HTMLInputElement | null; // type-safety-ok: test DOM query
  if (!input) throw new Error(`no edit-priority input for ${ruleType}`);
  return input;
}

describe("Rules table priority cleared-input guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it("saves a categorization rule priority on blur", async () => {
    const c = await renderRules([rule({ priority: 10 })], []);
    const input = priorityInput(c, "categorization");
    input.value = "5";
    blur(input);
    await flush();
    expect(activeDS.updateRule).toHaveBeenCalledWith("r-cat-1", { priority: 5 });
  });

  it("rejects a cleared categorization rule priority instead of persisting 0", async () => {
    const c = await renderRules([rule({ priority: 10 })], []);
    const input = priorityInput(c, "categorization");
    input.value = "";
    blur(input);
    await flush();
    expect(activeDS.updateRule).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
  });

  it("rejects a cleared normalization rule priority instead of persisting 0", async () => {
    const c = await renderRules([], [normRule({ priority: 100 })]);
    const input = priorityInput(c, "normalization");
    input.value = "";
    blur(input);
    await flush();
    expect(activeDS.updateNormalizationRule).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
  });

  it("rejects a cleared normalization rule date window instead of persisting 0", async () => {
    const c = await renderRules([], [normRule({ dateWindowDays: 7 })]);
    const input = c.querySelector(
      '.rule-row[data-rule-type="normalization"] .edit-date-window',
    ) as HTMLInputElement | null; // type-safety-ok: test DOM query
    if (!input) throw new Error("no edit-date-window input");
    input.value = "";
    blur(input);
    await flush();
    expect(activeDS.updateNormalizationRule).not.toHaveBeenCalled();
    expect(input.classList.contains("save-error")).toBe(true);
  });
});
