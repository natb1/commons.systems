import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import { getBudgets, type Budget, type Rollover } from "../firestore.js";

const rolloverOptions: { value: Rollover; label: string }[] = [
  { value: "none", label: "None" },
  { value: "debt", label: "Debt only" },
  { value: "balance", label: "Full balance" },
];

function renderRolloverCell(budget: Budget, editable: boolean): string {
  const dis = editable ? "" : " disabled";
  const options = rolloverOptions.map(o => {
    const sel = o.value === budget.rollover ? " selected" : "";
    return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
  }).join("");
  return `<select class="edit-rollover" aria-label="Rollover"${dis}>${options}</select>`;
}

function renderRow(budget: Budget, editable: boolean): string {
  const idAttr = editable ? ` data-budget-id="${escapeHtml(budget.id)}"` : "";
  const dis = editable ? "" : " disabled";
  const nameCell = `<input type="text" class="edit-name" value="${escapeHtml(budget.name)}" aria-label="Name"${dis}>`;
  const allowanceCell = `<input type="number" class="edit-allowance" value="${escapeHtml(String(budget.weeklyAllowance))}" min="0" aria-label="Weekly allowance"${dis}>`;
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
  const { user, group } = options;
  const authorized = group !== null;

  let tableHtml: string;
  try {
    const budgets = await (group && user?.email ? getBudgets(group.id, user.email) : getBudgets(null));
    tableHtml = renderBudgetTable(budgets, authorized);
  } catch (error) {
    console.error("Failed to load budgets:", error);
    tableHtml = renderLoadError(error, "budgets-error");
  }

  return `
    <h2>Budgets</h2>
    ${renderPageNotices(options, "budgets")}
    ${tableHtml}
  `;
}
