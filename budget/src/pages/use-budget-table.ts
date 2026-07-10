// Table-interactivity effects for the React <Budgets> page (Unit 3 of #1876).
// This is the imperative hydrateBudgetTable / hydrateOverridesTable blur-save /
// change-save / variance-hydrate / override-CRUD logic converted into effect
// hooks that attach event-delegation listeners onto the table / overrides
// container refs. The save logic is preserved EXACTLY — it reads the same
// per-row data-* attributes that <Budgets> renders (data-budget-id,
// .budget-variance data-* blobs, #add-override data-budgets) and calls the same
// data-source methods (updateBudget / updateBudgetOverrides) in the same order.
//
// One behavior changes shape (not effect): the <select> save guard and revert.
// The legacy renderer emitted `<option ... selected>` (an HTML attribute) and
// read it back via `option[selected]`. React-rendered selects (Budgets.tsx uses
// `defaultValue`) set only the option's `.selected` PROPERTY and the select's
// `.value`; `option[selected]` returns null. So this hook tracks each select's
// last-saved value in a WeakMap (seeded from `.value` at attach), guards on it,
// updates it on a successful save, and reverts `.value` to it on a failed save —
// then calls handleSaveError (whose showInputError select branch no-ops against a
// React select, leaving this manual revert intact). The legacy
// hydrateBudgetTable keeps its untouched `option[selected]` mechanism for the
// legacy route until Unit 4 removes it.
import { useLayoutEffect, type RefObject } from "react";
import { getActiveDataSource } from "../active-data-source.js";
import { showInputError, handleSaveError } from "./hydrate-util.js";
import { hydrateVarianceDetails, rowBudgetId, collectOverridesForBudget, deserializeBudgets } from "./budgets-hydrate.js";
import { handleActionError, toISODate } from "./hydrate-util.js";
import { escapeHtml } from "@commons-systems/htmlutil";
import { type BudgetId } from "../firestore.js";

/**
 * Wire the budget-table interactivity onto the #budgets-table container: the
 * capture-phase `toggle` listener (variance hydration on expand), the
 * blur-save for name/allowance inputs, and the change-save for period/rollover
 * selects. Attaches once per mount (event delegation), so React reconciling
 * individual rows does not detach the listeners. Returns nothing for
 * unauthorized renders the toggle/variance listener still attaches (variance
 * details are read-only and hydrate on expand for everyone), but the editable
 * save listeners are gated on `authorized`.
 */
export function useBudgetTableInteractivity(
  containerRef: RefObject<HTMLElement>,
  authorized: boolean,
): void {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Variance hydration on row expand — available to everyone (read-only),
    // matching the legacy hydrateBudgetTable toggle listener.
    const onToggle = (e: Event): void => {
      const target = e.target;
      if (!(target instanceof HTMLDetailsElement)) return;
      if (!target.classList.contains("budget-row")) return;
      if (!target.open) return;
      try {
        hydrateVarianceDetails(target);
      } catch (error) {
        const varianceEl = target.querySelector<HTMLElement>(".budget-variance");
        if (varianceEl) varianceEl.dataset.hydrated = "error";
        handleActionError(varianceEl ?? target, error, "variance-hydrate");
      }
    };
    container.addEventListener("toggle", onToggle, true);

    if (!authorized) {
      return () => {
        container.removeEventListener("toggle", onToggle, true);
      };
    }

    // Track each select's last-saved value. React selects expose no
    // `.defaultValue` and no `option[selected]`, so the legacy "unchanged?"
    // guard and the revert-on-error both read this map instead. Seed every
    // edit-period / edit-rollover select from its rendered value NOW (at attach,
    // before any user change), so the change-time guard compares against the
    // last-saved value rather than the just-changed value.
    const savedSelectValue = new WeakMap<HTMLSelectElement, string>();
    for (const select of container.querySelectorAll<HTMLSelectElement>("select.edit-period, select.edit-rollover")) {
      savedSelectValue.set(select, select.value);
    }
    function getSaved(select: HTMLSelectElement): string {
      const tracked = savedSelectValue.get(select);
      if (tracked !== undefined) return tracked;
      // Fallback for any select not present at attach: seed from current value.
      const initial = select.value;
      savedSelectValue.set(select, initial);
      return initial;
    }

    const onBlur = async (e: Event): Promise<void> => {
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
          await getActiveDataSource().updateBudget(budgetId, { name: target.value });
        } else if (target.classList.contains("edit-allowance")) {
          const allowance = Number(target.value);
          if (!Number.isFinite(allowance) || allowance < 0) {
            showInputError(target, "Allowance must be a non-negative number");
            return;
          }
          await getActiveDataSource().updateBudget(budgetId, { allowance: allowance });
        } else {
          return;
        }
        target.defaultValue = target.value;
      } catch (error) {
        handleSaveError(target, error, "budget");
      }
    };
    container.addEventListener("blur", onBlur, true);

    const onChange = async (e: Event): Promise<void> => {
      const target = e.target;
      if (!(target instanceof HTMLSelectElement)) return;
      const budgetId = rowBudgetId(target);
      if (!budgetId) return;

      const saved = getSaved(target);
      if (target.value === saved) return;

      try {
        if (target.classList.contains("edit-rollover")) {
          const value = target.value;
          if (value !== "none" && value !== "debt" && value !== "balance") {
            showInputError(target, "Invalid rollover value");
            return;
          }
          await getActiveDataSource().updateBudget(budgetId, { rollover: value });
        } else if (target.classList.contains("edit-period")) {
          const value = target.value;
          if (value !== "weekly" && value !== "monthly" && value !== "quarterly") {
            showInputError(target, "Invalid period value");
            return;
          }
          await getActiveDataSource().updateBudget(budgetId, { allowancePeriod: value });
        } else {
          return;
        }
        savedSelectValue.set(target, target.value);
      } catch (error) {
        // Revert to the last-saved value before delegating: showInputError's
        // select branch reads option[selected] (null on a React select) and
        // no-ops, so this manual revert is what restores the value.
        target.value = saved;
        handleSaveError(target, error, "budget");
      }
    };
    container.addEventListener("change", onChange);

    return () => {
      container.removeEventListener("toggle", onToggle, true);
      container.removeEventListener("blur", onBlur, true);
      container.removeEventListener("change", onChange);
    };
  }, [authorized]);
}

/**
 * Wire the overrides-table interactivity onto the #overrides-table container:
 * blur-save for date/balance inputs (re-collects every override row for the
 * budget and writes the normalized set), the delete-override button (optimistic
 * remove + re-write, restore on failure), and the add-override button
 * (imperative row insertion + immediate save + per-row budget-select change
 * wiring). Preserved verbatim from hydrateOverridesTable; gated on `authorized`
 * because only authorized renders emit the editable inputs / buttons.
 */
export function useOverridesTableInteractivity(
  containerRef: RefObject<HTMLElement>,
  authorized: boolean,
): void {
  useLayoutEffect(() => {
    if (!authorized) return;
    const container = containerRef.current;
    if (!container) return;

    const onBlur = async (e: Event): Promise<void> => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      const row = target.closest(".override-row");
      if (!(row instanceof HTMLElement)) return;
      const budgetId = row.dataset.budgetId as BudgetId | undefined;
      if (!budgetId) return;

      if (target.value === target.defaultValue) return;

      try {
        const overrides = collectOverridesForBudget(container, budgetId);
        if (overrides) {
          await getActiveDataSource().updateBudgetOverrides(budgetId, overrides);
          target.defaultValue = target.value;
        }
      } catch (error) {
        handleSaveError(target, error, "override");
      }
    };
    container.addEventListener("blur", onBlur, true);

    const onClick = async (e: Event): Promise<void> => {
      const target = e.target;

      // Delete override
      if (target instanceof HTMLButtonElement && target.classList.contains("delete-override")) {
        const row = target.closest(".override-row");
        if (!(row instanceof HTMLElement)) return;
        const budgetId = row.dataset.budgetId as BudgetId | undefined;
        if (!budgetId) return;
        const addBtn = container.querySelector("#add-override");
        row.style.opacity = "0.5";
        try {
          row.remove();
          const overrides = collectOverridesForBudget(container, budgetId);
          if (overrides) {
            await getActiveDataSource().updateBudgetOverrides(budgetId, overrides);
          } else {
            if (!row.parentElement && addBtn) addBtn.before(row);
            row.style.opacity = "";
          }
        } catch (error) {
          if (!row.parentElement && addBtn) addBtn.before(row);
          row.style.opacity = "";
          handleSaveError(target, error, "override");
        }
        return;
      }

      // Add override
      if (target instanceof HTMLButtonElement && target.id === "add-override") {
        const budgetsRaw = target.dataset.budgets;
        if (!budgetsRaw) return;
        const budgets = deserializeBudgets(budgetsRaw);
        if (budgets.length === 0) return;

        const firstBudget = budgets[0];
        const dateStr = toISODate(Date.now());

        // Overrides are deduped by date (collectOverridesForBudget keys a Map by
        // dateMs). Inserting a today-dated $0 row when one already exists for
        // today would silently clobber it on the immediate save. Instead, edit
        // the existing same-date override in place: focus its balance input so
        // the user updates the real value rather than zeroing it.
        const existingRow = [
          ...container.querySelectorAll<HTMLElement>(`.override-row[data-budget-id="${firstBudget.id}"]`),
        ].find(
          (r) => r.querySelector<HTMLInputElement>(".edit-override-date")?.value === dateStr,
        );
        if (existingRow) {
          const balanceInput = existingRow.querySelector<HTMLInputElement>(".edit-override-balance");
          if (balanceInput) {
            balanceInput.focus();
            balanceInput.select();
            // Bring the row into view where the environment supports it.
            if (typeof balanceInput.scrollIntoView === "function") {
              balanceInput.scrollIntoView({ block: "nearest" });
            }
          }
          return;
        }

        const newRow = document.createElement("div");
        newRow.className = "override-row";
        newRow.dataset.budgetId = firstBudget.id;
        newRow.dataset.overrideIndex = "new";

        const budgetOptions = budgets.map(b =>
          `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`
        ).join("");

        newRow.innerHTML = `
          <span><select class="edit-override-budget" aria-label="Budget">${budgetOptions}</select></span>
          <span><input type="date" class="edit-override-date" value="${dateStr}" aria-label="Override date"></span>
          <span><input type="number" class="edit-override-balance" value="0" step="0.01" aria-label="Override balance"></span>
          <span><button class="delete-override" aria-label="Delete override">Delete</button></span>
        `;

        target.before(newRow);

        // Wire budget select change
        const select = newRow.querySelector<HTMLSelectElement>(".edit-override-budget");
        if (select) {
          select.addEventListener("change", async () => {
            const oldBudgetId = newRow.dataset.budgetId as BudgetId | undefined;
            newRow.dataset.budgetId = select.value;
            try {
              const newBudgetId = select.value as BudgetId;
              const newOverrides = collectOverridesForBudget(container, newBudgetId);
              if (newOverrides) await getActiveDataSource().updateBudgetOverrides(newBudgetId, newOverrides);
              if (oldBudgetId && oldBudgetId !== newBudgetId) {
                const oldOverrides = collectOverridesForBudget(container, oldBudgetId);
                if (oldOverrides) await getActiveDataSource().updateBudgetOverrides(oldBudgetId, oldOverrides);
              }
            } catch (error) {
              handleSaveError(select, error, "override");
            }
          });
        }

        // Save immediately
        try {
          const overrides = collectOverridesForBudget(container, firstBudget.id);
          if (overrides) await getActiveDataSource().updateBudgetOverrides(firstBudget.id as BudgetId, overrides);
        } catch (error) {
          handleSaveError(target, error, "override");
        }
      }
    };
    container.addEventListener("click", onClick);

    return () => {
      container.removeEventListener("blur", onBlur, true);
      container.removeEventListener("click", onClick);
    };
  }, [authorized]);
}
