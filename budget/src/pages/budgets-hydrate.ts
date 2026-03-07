import { updateBudget } from "../firestore.js";
import { DataIntegrityError } from "../errors.js";

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
  // Programmer errors: rethrow asynchronously so they surface in devtools.
  if (error instanceof TypeError || error instanceof ReferenceError) {
    setTimeout(() => { throw error; }, 0);
    return;
  }
  if (error instanceof DataIntegrityError) {
    console.error("Data integrity error:", error);
    showInputError(el, "Data error \u2014 please reload");
    return;
  }
  console.error("Failed to save budget:", error);
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    showInputError(el, "Access denied. Please contact support.");
  } else if (error instanceof RangeError) {
    showInputError(el, "Value out of range");
  } else {
    showInputError(el);
  }
}

function rowBudgetId(el: HTMLElement): string | null {
  const row = el.closest(".budget-row");
  if (!(row instanceof HTMLElement)) return null;
  return row.dataset.budgetId ?? null;
}

export function hydrateBudgetTable(container: HTMLElement): void {
  container.addEventListener("blur", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const budgetId = rowBudgetId(target);
    if (!budgetId) return;

    if (target.value === target.defaultValue) return;

    try {
      if (target.classList.contains("edit-name")) {
        if (!target.value) {
          showInputError(target, "Budget name cannot be empty");
          return;
        }
        await updateBudget(budgetId, { name: target.value });
      } else if (target.classList.contains("edit-allowance")) {
        const allowance = Number(target.value);
        if (!Number.isFinite(allowance) || allowance < 0) {
          showInputError(target, "Weekly allowance must be a non-negative number");
          return;
        }
        await updateBudget(budgetId, { weeklyAllowance: allowance });
      } else {
        return;
      }
      target.defaultValue = target.value;
    } catch (error) {
      handleSaveError(target, error);
    }
  }, true);

  container.addEventListener("change", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!target.classList.contains("edit-rollover")) return;
    const budgetId = rowBudgetId(target);
    if (!budgetId) return;

    const saved = target.querySelector("option[selected]") as HTMLOptionElement | null;
    if (saved && target.value === saved.value) return;

    try {
      const value = target.value;
      if (value !== "none" && value !== "debt" && value !== "balance") {
        showInputError(target, "Invalid rollover value");
        return;
      }
      await updateBudget(budgetId, { rollover: value });
      // Update the selected attribute (not just .value) so showInputError can
      // revert to the last-saved value via option[selected].
      if (saved) saved.removeAttribute("selected");
      const newSelected = Array.from(target.options).find(o => o.value === value) ?? null;
      if (newSelected) newSelected.setAttribute("selected", "");
    } catch (error) {
      handleSaveError(target, error);
    }
  });
}
