// The imperative interactivity for the React /rules page — the blur-save /
// autocomplete / summary-guard port of `hydrateRulesTable` (rules-hydrate.ts),
// attached once per mount via event delegation. The add/delete mutators and the
// type filter are React-state-driven in Rules.tsx, not here.
import { useLayoutEffect, type RefObject } from "react";
import { type RuleId, type NormalizationRuleId } from "../firestore.js";
import { getActiveDataSource } from "../active-data-source.js";
import { removeDropdown, registerAutocompleteListeners } from "@commons-systems/components/autocomplete";
import { showInputError, handleSaveError, parseJsonArray, addAutocompleteListeners } from "./hydrate-util.js";

function rowRuleId(el: HTMLElement): RuleId | null {
  const row = el.closest(".rule-row");
  if (!(row instanceof HTMLElement)) return null;
  return (row.dataset.ruleId ?? null) as RuleId | null;
}

function rowNormalizationRuleId(el: HTMLElement): NormalizationRuleId | null {
  const row = el.closest(".rule-row");
  if (!(row instanceof HTMLElement)) return null;
  return (row.dataset.ruleId ?? null) as NormalizationRuleId | null;
}

export function useRulesTable(containerRef: RefObject<HTMLElement>): void {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    registerAutocompleteListeners();

    const budgetOptions = parseJsonArray(container.dataset.budgetOptions);
    const categoryOptions = parseJsonArray(container.dataset.categoryOptions);
    const institutionOptions = parseJsonArray(container.dataset.institutionOptions);
    const accountOptions = parseJsonArray(container.dataset.accountOptions);

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

    addAutocompleteListeners(container, getOptionsForInput);

    // On medium+ screens, prevent toggle on summary click (flat grid, no expand/collapse).
    // Bubble phase, matching the legacy hydrateRulesTable.
    const onClick = (e: Event): void => {
      if (window.innerWidth < 768) return;
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const summary = target.closest("summary");
      if (!summary) return;
      if (!summary.closest(".rule-row")) return;
      if (target instanceof HTMLInputElement || target instanceof HTMLButtonElement) return;
      e.preventDefault();
    };
    container.addEventListener("click", onClick);

    // Blur handler for inline text/number edits.
    const onBlur = async (e: Event): Promise<void> => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      removeDropdown();
      const ruleId = rowRuleId(target);
      if (!ruleId) return;

      if (target.value === target.defaultValue) return;

      try {
        const ds = getActiveDataSource();
        if (isNormalizationRow(target)) {
          const nruleId = rowNormalizationRuleId(target);
          if (!nruleId) return;
          if (target.classList.contains("edit-pattern")) {
            await ds.updateNormalizationRule(nruleId, { pattern: target.value });
          } else if (target.classList.contains("edit-canonical")) {
            await ds.updateNormalizationRule(nruleId, { canonicalDescription: target.value });
          } else if (target.classList.contains("edit-priority")) {
            // Number("") is 0 (top precedence), not NaN — guard the emptied
            // input explicitly so a cleared field is rejected, not saved as 0.
            const raw = target.value.trim();
            const priority = Number(raw);
            if (raw === "" || !Number.isFinite(priority)) { showInputError(target, "Priority must be a number"); return; }
            await ds.updateNormalizationRule(nruleId, { priority });
          } else if (target.classList.contains("edit-date-window")) {
            const days = Number(target.value);
            if (!Number.isFinite(days) || days < 0) { showInputError(target, "Date window must be a non-negative number"); return; }
            await ds.updateNormalizationRule(nruleId, { dateWindowDays: days });
          } else {
            return;
          }
        } else {
          if (target.classList.contains("edit-pattern")) {
            await ds.updateRule(ruleId, { pattern: target.value });
          } else if (target.classList.contains("edit-target")) {
            await ds.updateRule(ruleId, { target: target.value });
          } else if (target.classList.contains("edit-priority")) {
            // Number("") is 0 (top precedence), not NaN — guard the emptied
            // input explicitly so a cleared field is rejected, not saved as 0.
            const raw = target.value.trim();
            const priority = Number(raw);
            if (raw === "" || !Number.isFinite(priority)) { showInputError(target, "Priority must be a number"); return; }
            await ds.updateRule(ruleId, { priority });
          } else if (target.classList.contains("edit-institution")) {
            await ds.updateRule(ruleId, { institution: target.value || null });
          } else if (target.classList.contains("edit-account")) {
            await ds.updateRule(ruleId, { account: target.value || null });
          } else if (target.classList.contains("edit-min-amount")) {
            const val = target.value === "" ? null : Number(target.value);
            if (val !== null && !Number.isFinite(val)) { showInputError(target, "Min amount must be a number"); return; }
            await ds.updateRule(ruleId, { minAmount: val });
          } else if (target.classList.contains("edit-max-amount")) {
            const val = target.value === "" ? null : Number(target.value);
            if (val !== null && !Number.isFinite(val)) { showInputError(target, "Max amount must be a number"); return; }
            await ds.updateRule(ruleId, { maxAmount: val });
          } else if (target.classList.contains("edit-exclude-category")) {
            await ds.updateRule(ruleId, { excludeCategory: target.value || null });
          } else if (target.classList.contains("edit-match-category")) {
            await ds.updateRule(ruleId, { matchCategory: target.value || null });
          } else {
            return;
          }
        }
        target.defaultValue = target.value;
      } catch (error) {
        handleSaveError(target, error, "rule");
      }
    };
    container.addEventListener("blur", onBlur, true);

    return () => {
      container.removeEventListener("click", onClick);
      container.removeEventListener("blur", onBlur, true);
    };
  }, []);
}
