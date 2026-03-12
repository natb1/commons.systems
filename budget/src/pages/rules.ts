import { escapeHtml } from "@commons-systems/htmlutil";
import type { RenderPageOptions } from "./render-options.js";
import { getRules, getBudgets, type Rule } from "../firestore.js";
import { DataIntegrityError } from "../errors.js";

function renderRow(rule: Rule, editable: boolean): string {
  const idAttr = editable ? ` data-rule-id="${escapeHtml(rule.id)}"` : "";
  const dis = editable ? "" : " disabled";
  const patternCell = `<input type="text" class="edit-pattern" value="${escapeHtml(rule.pattern)}" aria-label="Pattern"${dis}>`;
  const targetCell = `<input type="text" class="edit-target" value="${escapeHtml(rule.target)}" aria-label="Target"${dis}>`;
  const priorityCell = `<input type="number" class="edit-priority" value="${escapeHtml(String(rule.priority))}" aria-label="Priority"${dis}>`;
  const institutionCell = `<input type="text" class="edit-institution" value="${escapeHtml(rule.institution ?? "")}" aria-label="Institution"${dis}>`;
  const accountCell = `<input type="text" class="edit-account" value="${escapeHtml(rule.account ?? "")}" aria-label="Account"${dis}>`;
  const deleteCell = editable
    ? `<button class="delete-rule" aria-label="Delete rule">Delete</button>`
    : `<span></span>`;

  return `<details class="expand-row rule-row" data-rule-type="${escapeHtml(rule.type)}"${idAttr}>
    <summary>
      <div class="rule-summary-content">
        <span>${patternCell}</span>
        <span>${targetCell}</span>
      </div>
    </summary>
    <div class="rule-details">
      <span>${priorityCell}</span>
      <span>${institutionCell}</span>
      <span>${accountCell}</span>
      <span>${deleteCell}</span>
    </div>
  </details>`;
}

interface RulesTableOptions {
  rules: Rule[];
  authorized: boolean;
  groupId: string;
  budgetNames: string[];
  categoryTargets: string[];
  uniqueInstitutions: string[];
  uniqueAccounts: string[];
}

function renderRulesTable(opts: RulesTableOptions): string {
  const { rules, authorized, groupId, budgetNames, categoryTargets, uniqueInstitutions, uniqueAccounts } = opts;
  const sorted = [...rules].sort((a, b) => a.priority - b.priority || a.pattern.localeCompare(b.pattern));
  const rows = sorted.map(r => renderRow(r, authorized)).join("\n");

  const addButton = authorized
    ? `<button id="add-rule" data-group-id="${escapeHtml(groupId)}">Add Rule</button>`
    : "";

  const dataAttrs = authorized
    ? ` data-budget-options='${escapeHtml(JSON.stringify(budgetNames))}'` +
      ` data-category-options='${escapeHtml(JSON.stringify(categoryTargets))}'` +
      ` data-institution-options='${escapeHtml(JSON.stringify(uniqueInstitutions))}'` +
      ` data-account-options='${escapeHtml(JSON.stringify(uniqueAccounts))}'`
    : "";

  const filterSelect = `<select id="rule-type-filter">
      <option value="categorization" selected>Categorization</option>
      <option value="budget_assignment">Budget Assignment</option>
    </select>`;

  return `${filterSelect}
    <div id="rules-table"${dataAttrs}>
      <div class="rule-header">
        <span>Pattern</span>
        <span>Target</span>
        <span>Priority</span>
        <span>Institution</span>
        <span>Account</span>
        <span></span>
      </div>
      ${rows}
      ${addButton}
    </div>`;
}

export async function renderRules(options: RenderPageOptions): Promise<string> {
  const { user, group, groupError } = options;
  const authorized = group !== null;

  let tableHtml: string;
  try {
    const rules = await (group && user?.email ? getRules(group.id, user.email) : getRules(null));
    const budgets = await (group && user?.email ? getBudgets(group.id, user.email) : getBudgets(null));
    const budgetNames = budgets.map(b => b.name);
    const categoryTargets = [...new Set(
      rules.filter(r => r.type === "categorization").map(r => r.target),
    )].sort();
    const uniqueInstitutions = [...new Set(rules.map(r => r.institution).filter((v): v is string => v !== null))];
    const uniqueAccounts = [...new Set(rules.map(r => r.account).filter((v): v is string => v !== null))];
    tableHtml = renderRulesTable({ rules, authorized, groupId: group?.id ?? "", budgetNames, categoryTargets, uniqueInstitutions, uniqueAccounts });
  } catch (error) {
    if (error instanceof RangeError || error instanceof DataIntegrityError
        || error instanceof TypeError || error instanceof ReferenceError) {
      throw error;
    }
    console.error("Failed to load rules:", error);
    const code = (error as { code?: string })?.code;
    const message = code === "permission-denied"
      ? "Access denied. Please contact support."
      : "Could not load data. Try refreshing the page.";
    tableHtml = `<p id="rules-error">${message}</p>`;
  }

  const groupErrorNotice = groupError && user
    ? '<p id="group-error" class="auth-error">Could not load group data. Showing example data. Try refreshing the page.</p>'
    : "";

  let seedNotice = "";
  if (!authorized && !groupError) {
    seedNotice = user
      ? '<p id="seed-data-notice">Viewing example data. You are not a member of any groups.</p>'
      : '<p id="seed-data-notice">Viewing example data. Sign in to see your rules.</p>';
  }

  return `
    <h2>Rules</h2>
    ${groupErrorNotice}
    ${seedNotice}
    ${tableHtml}
  `;
}
