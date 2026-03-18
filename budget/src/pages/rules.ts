import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import { type Rule, type NormalizationRule } from "../firestore.js";
import { uniqueSorted } from "./hydrate-util.js";

export function renderRow(rule: Rule, editable: boolean): string {
  const idAttr = editable ? ` data-rule-id="${escapeHtml(rule.id)}"` : "";
  const dis = editable ? "" : " disabled";
  const patternCell = `<input type="text" class="edit-pattern" value="${escapeHtml(rule.pattern)}" aria-label="Pattern"${dis}>`;
  const targetCell = `<input type="text" class="edit-target" value="${escapeHtml(rule.target)}" aria-label="Target" data-autocomplete${dis}>`;
  const priorityCell = `<input type="number" class="edit-priority" value="${escapeHtml(String(rule.priority))}" aria-label="Priority"${dis}>`;
  const institutionCell = `<input type="text" class="edit-institution" value="${escapeHtml(rule.institution ?? "")}" aria-label="Institution" data-autocomplete${dis}>`;
  const accountCell = `<input type="text" class="edit-account" value="${escapeHtml(rule.account ?? "")}" aria-label="Account" data-autocomplete${dis}>`;
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

export function renderNormalizationRow(rule: NormalizationRule, editable: boolean): string {
  const idAttr = editable ? ` data-rule-id="${escapeHtml(rule.id)}"` : "";
  const dis = editable ? "" : " disabled";
  const patternCell = `<input type="text" class="edit-pattern" value="${escapeHtml(rule.pattern)}" aria-label="Pattern"${dis}>`;
  const canonicalCell = `<input type="text" class="edit-canonical" value="${escapeHtml(rule.canonicalDescription)}" aria-label="Canonical Description"${dis}>`;
  const priorityCell = `<input type="number" class="edit-priority" value="${escapeHtml(String(rule.priority))}" aria-label="Priority"${dis}>`;
  const dateWindowCell = `<input type="number" class="edit-date-window" value="${escapeHtml(String(rule.dateWindowDays))}" aria-label="Date Window"${dis}>`;
  const deleteCell = editable
    ? `<button class="delete-rule" aria-label="Delete rule">Delete</button>`
    : `<span></span>`;

  return `<details class="expand-row rule-row" data-rule-type="normalization"${idAttr}>
    <summary>
      <div class="rule-summary-content">
        <span>${patternCell}</span>
        <span>${canonicalCell}</span>
      </div>
    </summary>
    <div class="rule-details">
      <span>${priorityCell}</span>
      <span>${dateWindowCell}</span>
      <span></span>
      <span>${deleteCell}</span>
    </div>
  </details>`;
}

interface RulesTableOptions {
  rules: Rule[];
  normalizationRules: NormalizationRule[];
  authorized: boolean;
  budgetNames: string[];
  categoryTargets: string[];
  uniqueInstitutions: string[];
  uniqueAccounts: string[];
}

function renderRulesTable(opts: RulesTableOptions): string {
  const { rules, normalizationRules, authorized, budgetNames, categoryTargets, uniqueInstitutions, uniqueAccounts } = opts;
  const sorted = [...rules].sort((a, b) => a.priority - b.priority || a.pattern.localeCompare(b.pattern));
  const rows = sorted.map(r => renderRow(r, authorized)).join("\n");
  const sortedNorm = [...normalizationRules].sort((a, b) => a.priority - b.priority || a.pattern.localeCompare(b.pattern));
  const normRows = sortedNorm.map(r => renderNormalizationRow(r, authorized)).join("\n");

  const addButton = authorized
    ? `<button id="add-rule">Add Rule</button>`
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
      <option value="normalization">Normalization</option>
    </select>`;

  return `${filterSelect}
    <div id="rules-table"${dataAttrs}>
      <div class="rule-header rule-header-default">
        <span>Pattern</span>
        <span>Target</span>
        <span>Priority</span>
        <span>Institution</span>
        <span>Account</span>
        <span></span>
      </div>
      <div class="rule-header rule-header-normalization">
        <span>Pattern</span>
        <span>Canonical Desc</span>
        <span>Priority</span>
        <span>Date Window</span>
        <span></span>
      </div>
      ${rows}
      ${normRows}
      ${addButton}
    </div>`;
}

export async function renderRules(options: RenderPageOptions): Promise<string> {
  const { authorized, dataSource } = options;

  let tableHtml: string;
  try {
    const [rules, budgets, normalizationRules] = await Promise.all([
      dataSource.getRules()
        .catch((e) => { console.error("Failed to load rules:", e); throw e; }),
      dataSource.getBudgets()
        .catch((e) => { console.error("Failed to load budgets:", e); throw e; }),
      dataSource.getNormalizationRules()
        .catch((e) => { console.error("Failed to load normalization rules:", e); throw e; }),
    ]);
    const budgetNames = budgets.map(b => b.name);
    const categoryTargets = uniqueSorted(rules.filter(r => r.type === "categorization").map(r => r.target));
    const uniqueInstitutions = uniqueSorted(rules.map(r => r.institution));
    const uniqueAccounts = uniqueSorted(rules.map(r => r.account));
    tableHtml = renderRulesTable({ rules, normalizationRules, authorized, budgetNames, categoryTargets, uniqueInstitutions, uniqueAccounts });
  } catch (error) {
    tableHtml = renderLoadError(error, "rules-error");
  }

  return `
    <h2>Rules</h2>
    ${renderPageNotices(options, "rules")}
    ${tableHtml}
  `;
}
