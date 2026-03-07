import { escapeHtml } from "@commons-systems/htmlutil";
import type { RenderPageOptions } from "./render-options.js";
import { getBudgets, type Budget, type Rollover } from "../firestore.js";
import { DataIntegrityError } from "../errors.js";

const rolloverOptions: { value: Rollover; label: string }[] = [
  { value: "none", label: "None" },
  { value: "debt", label: "Debt only" },
  { value: "balance", label: "Full balance" },
];

function renderRolloverCell(budget: Budget, editable: boolean): string {
  if (!editable) {
    const opt = rolloverOptions.find(o => o.value === budget.rollover);
    return opt ? escapeHtml(opt.label) : escapeHtml(budget.rollover);
  }
  const options = rolloverOptions.map(o => {
    const sel = o.value === budget.rollover ? " selected" : "";
    return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
  }).join("");
  return `<select class="edit-rollover" aria-label="Rollover">${options}</select>`;
}

function renderRow(budget: Budget, editable: boolean): string {
  const idAttr = editable ? ` data-budget-id="${escapeHtml(budget.id)}"` : "";
  const nameCell = editable
    ? `<input type="text" class="edit-name" value="${escapeHtml(budget.name)}" aria-label="Name">`
    : escapeHtml(budget.name);
  const allowanceCell = editable
    ? `<input type="number" class="edit-allowance" value="${escapeHtml(String(budget.weeklyAllowance))}" min="0" aria-label="Weekly allowance">`
    : escapeHtml(String(budget.weeklyAllowance));
  const rolloverCell = renderRolloverCell(budget, editable);

  return `<div class="budget-row"${idAttr}>
    <span>${nameCell}</span>
    <span>${allowanceCell}</span>
    <span>${rolloverCell}</span>
  </div>`;
}

function renderBudgetTable(budgets: Budget[], authorized: boolean): string {
  if (budgets.length === 0) {
    return "<p>No budgets found.</p>";
  }

  const sorted = [...budgets].sort((a, b) => a.name.localeCompare(b.name));
  const rows = sorted.map(b => renderRow(b, authorized)).join("\n");

  return `<div id="budgets-table">
      <div class="budget-header">
        <span>Name</span>
        <span>Weekly Allowance</span>
        <span>Rollover</span>
      </div>
      ${rows}
    </div>`;
}

export async function renderBudgets(options: RenderPageOptions): Promise<string> {
  const { user, group, groupError } = options;
  const authorized = group !== null;

  let tableHtml: string;
  try {
    const budgets = await (group && user ? getBudgets(group.id, user.uid) : getBudgets(null));
    tableHtml = renderBudgetTable(budgets, authorized);
  } catch (error) {
    if (error instanceof RangeError || error instanceof DataIntegrityError
        || error instanceof TypeError || error instanceof ReferenceError) {
      throw error;
    }
    console.error("Failed to load budgets:", error);
    const code = (error as { code?: string })?.code;
    const message = code === "permission-denied"
      ? "Access denied. Please contact support."
      : "Could not load data. Try refreshing the page.";
    tableHtml = `<p id="budgets-error">${message}</p>`;
  }

  const groupErrorNotice = groupError && user
    ? '<p id="group-error" class="auth-error">Could not load group data. Showing example data. Try refreshing the page.</p>'
    : "";

  let seedNotice = "";
  if (!authorized && !groupError) {
    seedNotice = user
      ? '<p id="seed-data-notice">Viewing example data. You are not a member of any groups.</p>'
      : '<p id="seed-data-notice">Viewing example data. Sign in to see your budgets.</p>';
  }

  return `
    <h2>Budgets</h2>
    ${groupErrorNotice}
    ${seedNotice}
    ${tableHtml}
  `;
}
