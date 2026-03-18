import { type RuleType, type Rule, type RuleId } from "../firestore.js";
import { getActiveDataSource } from "../active-data-source.js";
import { renderRow, renderNormalizationRow } from "./rules.js";
import { removeDropdown, registerAutocompleteListeners } from "@commons-systems/style/components/autocomplete";
import { showInputError, handleSaveError, handleActionError, parseJsonArray, addAutocompleteListeners } from "./hydrate-util.js";

function rowRuleId(el: HTMLElement): RuleId | null {
  const row = el.closest(".rule-row");
  if (!(row instanceof HTMLElement)) return null;
  return (row.dataset.ruleId ?? null) as RuleId | null;
}

export function hydrateRulesTable(container: HTMLElement): void {
  registerAutocompleteListeners();

  const budgetOptions = parseJsonArray(container.dataset.budgetOptions);
  const categoryOptions = parseJsonArray(container.dataset.categoryOptions);
  const institutionOptions = parseJsonArray(container.dataset.institutionOptions);
  const accountOptions = parseJsonArray(container.dataset.accountOptions);

  const filterSelect = document.getElementById("rule-type-filter") as HTMLSelectElement | null;
  if (!filterSelect) throw new Error("#rule-type-filter select not found");
  container.dataset.activeFilter = filterSelect.value;
  filterSelect.addEventListener("change", () => {
    container.dataset.activeFilter = filterSelect.value;
    removeDropdown();
  });

  type FilterType = RuleType | "normalization";

  function activeFilterType(): FilterType {
    const val = container.dataset.activeFilter;
    if (val === "budget_assignment") return "budget_assignment";
    if (val === "normalization") return "normalization";
    return "categorization";
  }

  function isNormalizationRow(el: HTMLElement): boolean {
    const row = el.closest(".rule-row");
    return row instanceof HTMLElement && row.dataset.ruleType === "normalization";
  }

  function getOptionsForInput(input: HTMLInputElement): string[] {
    if (input.classList.contains("edit-target")) {
      const row = input.closest(".rule-row");
      if (row instanceof HTMLElement && row.dataset.ruleType === "budget_assignment") {
        return budgetOptions;
      }
      return categoryOptions;
    }
    if (input.classList.contains("edit-institution")) return institutionOptions;
    if (input.classList.contains("edit-account")) return accountOptions;
    return [];
  }

  // Desktop: open all rows so details are visible in the flat grid.
  // Rows render closed by default (no `open` attr) for mobile.
  if (window.innerWidth >= 768) {
    for (const row of container.querySelectorAll(".rule-row")) {
      row.setAttribute("open", "");
    }
  }

  // On medium+ screens, prevent toggle on summary click (flat grid, no expand/collapse)
  container.addEventListener("click", (e: Event) => {
    if (window.innerWidth < 768) return;
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const summary = target.closest("summary");
    if (!summary) return;
    if (!summary.closest(".rule-row")) return;
    if (target instanceof HTMLInputElement || target instanceof HTMLButtonElement) return;
    e.preventDefault();
  });

  addAutocompleteListeners(container, getOptionsForInput);

  // Blur handler for inline text/number edits
  container.addEventListener("blur", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    removeDropdown();
    const ruleId = rowRuleId(target);
    if (!ruleId) return;

    if (target.value === target.defaultValue) return;

    try {
      const ds = getActiveDataSource();
      if (isNormalizationRow(target)) {
        if (target.classList.contains("edit-pattern")) {
          await ds.updateNormalizationRule(ruleId, { pattern: target.value });
        } else if (target.classList.contains("edit-canonical")) {
          await ds.updateNormalizationRule(ruleId, { canonicalDescription: target.value });
        } else if (target.classList.contains("edit-priority")) {
          const priority = Number(target.value);
          if (!Number.isFinite(priority)) { showInputError(target, "Priority must be a number"); return; }
          await ds.updateNormalizationRule(ruleId, { priority });
        } else if (target.classList.contains("edit-date-window")) {
          const days = Number(target.value);
          if (!Number.isFinite(days) || days < 0) { showInputError(target, "Date window must be a non-negative number"); return; }
          await ds.updateNormalizationRule(ruleId, { dateWindowDays: days });
        } else {
          return;
        }
      } else {
        if (target.classList.contains("edit-pattern")) {
          await ds.updateRule(ruleId, { pattern: target.value });
        } else if (target.classList.contains("edit-target")) {
          await ds.updateRule(ruleId, { target: target.value });
        } else if (target.classList.contains("edit-priority")) {
          const priority = Number(target.value);
          if (!Number.isFinite(priority)) { showInputError(target, "Priority must be a number"); return; }
          await ds.updateRule(ruleId, { priority });
        } else if (target.classList.contains("edit-institution")) {
          await ds.updateRule(ruleId, { institution: target.value || null });
        } else if (target.classList.contains("edit-account")) {
          await ds.updateRule(ruleId, { account: target.value || null });
        } else {
          return;
        }
      }
      target.defaultValue = target.value;
    } catch (error) {
      handleSaveError(target, error, "rule");
    }
  }, true);

  container.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) return;

    if (target.classList.contains("delete-rule")) {
      const ruleId = rowRuleId(target);
      if (!ruleId) return;
      try {
        const ds = getActiveDataSource();
        if (isNormalizationRow(target)) {
          await ds.deleteNormalizationRule(ruleId);
        } else {
          await ds.deleteRule(ruleId);
        }
        const row = target.closest(".rule-row");
        if (row) row.remove();
      } catch (error) {
        handleActionError(target, error, "delete rule");
      }
    }

    if (target.id === "add-rule") {
      try {
        const ds = getActiveDataSource();
        const filterType = activeFilterType();

        let rowHtml: string;
        if (filterType === "normalization") {
          const defaultFields = {
            pattern: "new rule",
            canonicalDescription: "New Description",
            patternType: null as string | null,
            dateWindowDays: 7,
            priority: 100,
            institution: null as string | null,
            account: null as string | null,
          };
          const newId = await ds.createNormalizationRule(defaultFields);
          rowHtml = renderNormalizationRow({ id: newId, groupId: null, ...defaultFields }, true);
        } else {
          const ruleType = filterType;
          const defaultFields = {
            type: ruleType,
            pattern: "new rule",
            target: ruleType === "budget_assignment" ? "Unassigned" : "Uncategorized",
            priority: 100,
            institution: null,
            account: null,
          };
          const newId = await ds.createRule(defaultFields);
          const newRule: Rule = { id: newId, groupId: null, ...defaultFields };
          rowHtml = renderRow(newRule, true);
        }
        const wrapper = document.createElement("div");
        wrapper.innerHTML = rowHtml;
        const newRow = wrapper.firstElementChild as HTMLElement;
        if (window.innerWidth >= 768) newRow.setAttribute("open", "");
        container.insertBefore(newRow, target);
      } catch (error) {
        handleActionError(target, error, "add rule");
      }
    }
  });
}
