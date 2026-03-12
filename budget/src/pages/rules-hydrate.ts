import { updateRule, deleteRule, createRule, getGroupMembers, type RuleType, type Rule } from "../firestore.js";
import { renderRow } from "./rules.js";
import { showDropdown, removeDropdown, registerAutocompleteListeners } from "@commons-systems/style/components/autocomplete";
import { showInputError, handleSaveError, handleActionError, parseJsonArray } from "./hydrate-util.js";

function rowRuleId(el: HTMLElement): string | null {
  const row = el.closest(".rule-row");
  if (!(row instanceof HTMLElement)) return null;
  return row.dataset.ruleId ?? null;
}

export function hydrateRulesTable(container: HTMLElement): void {
  registerAutocompleteListeners();

  const budgetOptions = parseJsonArray(container.dataset.budgetOptions);
  const categoryOptions = parseJsonArray(container.dataset.categoryOptions);
  const institutionOptions = parseJsonArray(container.dataset.institutionOptions);
  const accountOptions = parseJsonArray(container.dataset.accountOptions);

  // Type filter
  const filterSelect = document.getElementById("rule-type-filter") as HTMLSelectElement | null;
  if (filterSelect) {
    container.dataset.activeFilter = filterSelect.value;
    filterSelect.addEventListener("change", () => {
      container.dataset.activeFilter = filterSelect.value;
      removeDropdown();
    });
  }

  function activeFilterType(): RuleType {
    const val = container.dataset.activeFilter;
    if (val === "budget_assignment") return "budget_assignment";
    return "categorization";
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

  // Show all options on focus; filter as user types
  container.addEventListener("focus", (e: Event) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    const options = getOptionsForInput(e.target);
    if (options.length > 0) showDropdown(e.target, options, "");
  }, true);

  container.addEventListener("input", (e: Event) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    const options = getOptionsForInput(e.target);
    if (options.length > 0) showDropdown(e.target, options);
  });

  // Blur handler for inline text/number edits
  container.addEventListener("blur", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    removeDropdown();
    const ruleId = rowRuleId(target);
    if (!ruleId) return;

    if (target.value === target.defaultValue) return;

    try {
      if (target.classList.contains("edit-pattern")) {
        await updateRule(ruleId, { pattern: target.value });
      } else if (target.classList.contains("edit-target")) {
        await updateRule(ruleId, { target: target.value });
      } else if (target.classList.contains("edit-priority")) {
        const priority = Number(target.value);
        if (!Number.isFinite(priority)) {
          showInputError(target, "Priority must be a number");
          return;
        }
        await updateRule(ruleId, { priority });
      } else if (target.classList.contains("edit-institution")) {
        await updateRule(ruleId, { institution: target.value || null });
      } else if (target.classList.contains("edit-account")) {
        await updateRule(ruleId, { account: target.value || null });
      } else {
        return;
      }
      target.defaultValue = target.value;
    } catch (error) {
      handleSaveError(target, error, "rule");
    }
  }, true);

  // Click handler for delete and add
  container.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) return;

    if (target.classList.contains("delete-rule")) {
      const ruleId = rowRuleId(target);
      if (!ruleId) return;
      try {
        await deleteRule(ruleId);
        const row = target.closest(".rule-row");
        if (row) row.remove();
      } catch (error) {
        handleActionError(target, error, "delete rule");
      }
    }

    if (target.id === "add-rule") {
      const groupId = target.dataset.groupId;
      if (!groupId) return;
      try {
        const ruleType = activeFilterType();
        const memberEmails = await getGroupMembers(groupId);
        const defaultFields = {
          type: ruleType,
          pattern: "new rule",
          target: ruleType === "budget_assignment" ? "Unassigned" : "Uncategorized",
          priority: 100,
          institution: null,
          account: null,
        };
        const newId = await createRule(groupId, memberEmails, defaultFields);

        const newRule: Rule = { id: newId, groupId, ...defaultFields };
        const wrapper = document.createElement("div");
        wrapper.innerHTML = renderRow(newRule, true);
        const newRow = wrapper.firstElementChild as HTMLElement;
        if (window.innerWidth >= 768) {
          newRow.setAttribute("open", "");
        }
        container.insertBefore(newRow, target);
      } catch (error) {
        handleActionError(target, error, "add rule");
      }
    }
  });
}
