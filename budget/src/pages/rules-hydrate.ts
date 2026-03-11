import { updateRule, deleteRule, createRule, getGroupMembers, type RuleType } from "../firestore.js";
import { DataIntegrityError } from "../errors.js";
import { showDropdown, removeDropdown, registerAutocompleteListeners } from "@commons-systems/style/components/autocomplete";

const errorTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

function showInputError(el: HTMLInputElement | HTMLSelectElement, title = "Save failed \u2014 value reverted"): void {
  const existing = errorTimers.get(el);
  if (existing) clearTimeout(existing);
  if (el instanceof HTMLSelectElement) {
    const saved = el.querySelector("option[selected]") as HTMLOptionElement | null;
    if (saved) el.value = saved.value;
  } else {
    el.value = el.defaultValue;
  }
  el.classList.add("save-error");
  el.title = title;
  errorTimers.set(el, setTimeout(() => {
    el.classList.remove("save-error");
    el.title = "";
    errorTimers.delete(el);
  }, 30000));
}

function handleSaveError(el: HTMLInputElement | HTMLSelectElement, error: unknown): void {
  if (error instanceof TypeError || error instanceof ReferenceError) {
    setTimeout(() => { throw error; }, 0);
    return;
  }
  if (error instanceof DataIntegrityError) {
    console.error("Data integrity error:", error);
    showInputError(el, "Data error \u2014 please reload");
    return;
  }
  console.error("Failed to save rule:", error);
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    showInputError(el, "Access denied. Please contact support.");
  } else if (error instanceof RangeError) {
    showInputError(el, "Value out of range");
  } else {
    showInputError(el);
  }
}

function rowRuleId(el: HTMLElement): string | null {
  const row = el.closest(".rule-row");
  if (!(row instanceof HTMLElement)) return null;
  return row.dataset.ruleId ?? null;
}

function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`Expected array, got ${typeof parsed}`);
  return parsed as string[];
}

export function hydrateRulesTable(container: HTMLElement): void {
  registerAutocompleteListeners();

  const budgetOptions = parseJsonArray(container.dataset.budgetOptions);
  const institutionOptions = parseJsonArray(container.dataset.institutionOptions);
  const accountOptions = parseJsonArray(container.dataset.accountOptions);

  function getOptionsForInput(input: HTMLInputElement): string[] {
    if (input.classList.contains("edit-target")) return budgetOptions;
    if (input.classList.contains("edit-institution")) return institutionOptions;
    if (input.classList.contains("edit-account")) return accountOptions;
    return [];
  }

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
      handleSaveError(target, error);
    }
  }, true);

  // Change handler for type select
  container.addEventListener("change", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains("edit-type")) return;
    const ruleId = rowRuleId(target);
    if (!ruleId) return;

    const saved = target.querySelector("option[selected]") as HTMLOptionElement | null;
    if (saved && target.value === saved.value) return;

    try {
      const value = target.value;
      if (value !== "categorization" && value !== "budget_assignment") {
        showInputError(target, "Invalid rule type");
        return;
      }
      await updateRule(ruleId, { type: value });
      if (saved) saved.removeAttribute("selected");
      const newSelected = Array.from(target.options).find(o => o.value === value) ?? null;
      if (newSelected) newSelected.setAttribute("selected", "");
    } catch (error) {
      handleSaveError(target, error);
    }
  });

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
        if (error instanceof TypeError || error instanceof ReferenceError) {
          setTimeout(() => { throw error; }, 0);
          return;
        }
        console.error("Failed to delete rule:", error);
      }
    }

    if (target.id === "add-rule") {
      const groupId = target.dataset.groupId;
      if (!groupId) return;
      try {
        const memberEmails = await getGroupMembers(groupId);
        const defaultFields = {
          type: "categorization" as RuleType,
          pattern: "",
          target: "",
          priority: 100,
          institution: null,
          account: null,
        };
        const newId = await createRule(groupId, memberEmails, defaultFields);

        // Insert new row before the add button
        const newRow = document.createElement("div");
        newRow.className = "rule-row";
        newRow.dataset.ruleId = newId;
        newRow.innerHTML = `
          <span><select class="edit-type" aria-label="Type">
            <option value="categorization" selected>Categorization</option>
            <option value="budget_assignment">Budget Assignment</option>
          </select></span>
          <span><input type="text" class="edit-pattern" value="" aria-label="Pattern"></span>
          <span><input type="text" class="edit-target" value="" aria-label="Target"></span>
          <span><input type="number" class="edit-priority" value="100" aria-label="Priority"></span>
          <span><input type="text" class="edit-institution" value="" aria-label="Institution"></span>
          <span><input type="text" class="edit-account" value="" aria-label="Account"></span>
          <span><button class="delete-rule" aria-label="Delete rule">Delete</button></span>
        `;
        container.insertBefore(newRow, target);
      } catch (error) {
        if (error instanceof TypeError || error instanceof ReferenceError) {
          setTimeout(() => { throw error; }, 0);
          return;
        }
        console.error("Failed to add rule:", error);
      }
    }
  });
}
