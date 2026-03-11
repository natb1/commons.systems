import { escapeHtml } from "@commons-systems/htmlutil";
import type { RenderPageOptions } from "./render-options.js";
import { getRules, type Rule, type RuleType } from "../firestore.js";
import { DataIntegrityError } from "../errors.js";

const typeOptions: { value: RuleType; label: string }[] = [
  { value: "categorization", label: "Categorization" },
  { value: "budget_assignment", label: "Budget Assignment" },
];

function renderTypeCell(rule: Rule, editable: boolean): string {
  if (!editable) {
    const opt = typeOptions.find(o => o.value === rule.type);
    return opt ? escapeHtml(opt.label) : escapeHtml(rule.type);
  }
  const options = typeOptions.map(o => {
    const sel = o.value === rule.type ? " selected" : "";
    return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
  }).join("");
  return `<select class="edit-type" aria-label="Type">${options}</select>`;
}

function renderRow(rule: Rule, editable: boolean): string {
  const idAttr = editable ? ` data-rule-id="${escapeHtml(rule.id)}"` : "";
  const typeCell = renderTypeCell(rule, editable);
  const patternCell = editable
    ? `<input type="text" class="edit-pattern" value="${escapeHtml(rule.pattern)}" aria-label="Pattern">`
    : escapeHtml(rule.pattern);
  const targetCell = editable
    ? `<input type="text" class="edit-target" value="${escapeHtml(rule.target)}" aria-label="Target">`
    : escapeHtml(rule.target);
  const priorityCell = editable
    ? `<input type="number" class="edit-priority" value="${escapeHtml(String(rule.priority))}" aria-label="Priority">`
    : escapeHtml(String(rule.priority));
  const institutionCell = editable
    ? `<input type="text" class="edit-institution" value="${escapeHtml(rule.institution ?? "")}" aria-label="Institution">`
    : escapeHtml(rule.institution ?? "");
  const accountCell = editable
    ? `<input type="text" class="edit-account" value="${escapeHtml(rule.account ?? "")}" aria-label="Account">`
    : escapeHtml(rule.account ?? "");
  const deleteCell = editable
    ? `<button class="delete-rule" aria-label="Delete rule">Delete</button>`
    : "";

  return `<div class="rule-row"${idAttr}>
    <span>${typeCell}</span>
    <span>${patternCell}</span>
    <span>${targetCell}</span>
    <span>${priorityCell}</span>
    <span>${institutionCell}</span>
    <span>${accountCell}</span>
    <span>${deleteCell}</span>
  </div>`;
}

function renderRulesTable(rules: Rule[], authorized: boolean, groupId: string): string {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority || a.pattern.localeCompare(b.pattern));
  const rows = sorted.map(r => renderRow(r, authorized)).join("\n");

  const addButton = authorized
    ? `<button id="add-rule" data-group-id="${escapeHtml(groupId)}">Add Rule</button>`
    : "";

  return `<div id="rules-table">
      <div class="rule-header">
        <span>Type</span>
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
    tableHtml = renderRulesTable(rules, authorized, group?.id ?? "");
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
