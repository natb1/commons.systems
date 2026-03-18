import { escapeHtml } from "@commons-systems/htmlutil";
import { type RenderPageOptions, renderPageNotices, renderLoadError } from "./render-options.js";
import type { Transaction, Statement } from "../firestore.js";
import { formatCurrency } from "../format.js";

interface AccountRow {
  institution: string;
  account: string;
  mostRecentTimestamp: number;
  balance: number | null;
}

function buildAccountRows(transactions: Transaction[], statements: Statement[]): AccountRow[] {
  const accountMap = new Map<string, { institution: string; account: string; maxTs: number }>();
  for (const txn of transactions) {
    const key = `${txn.institution}\0${txn.account}`;
    const ts = txn.timestamp?.toMillis() ?? 0;
    const existing = accountMap.get(key);
    if (!existing) {
      accountMap.set(key, { institution: txn.institution, account: txn.account, maxTs: ts });
    } else if (ts > existing.maxTs) {
      existing.maxTs = ts;
    }
  }

  // Find latest statement per (institution, account) by period
  const latestStatements = new Map<string, Statement>();
  for (const stmt of statements) {
    const key = `${stmt.institution}\0${stmt.account}`;
    const existing = latestStatements.get(key);
    if (!existing || stmt.period > existing.period) {
      latestStatements.set(key, stmt);
    }
  }

  const rows: AccountRow[] = [];
  for (const [key, { institution, account, maxTs }] of accountMap) {
    const stmt = latestStatements.get(key);
    rows.push({
      institution,
      account,
      mostRecentTimestamp: maxTs,
      balance: stmt ? stmt.balance : null,
    });
  }

  rows.sort((a, b) => a.mostRecentTimestamp - b.mostRecentTimestamp);
  return rows;
}

function formatDate(ms: number): string {
  if (ms === 0) return "";
  return new Date(ms).toLocaleDateString();
}

function renderAccountsTable(rows: AccountRow[]): string {
  if (rows.length === 0) {
    return "<p>No accounts found.</p>";
  }

  const tableRows = rows.map((row) => {
    const balanceCell = row.balance !== null ? escapeHtml(formatCurrency(row.balance)) : "";
    return `<tr>
      <td>${escapeHtml(row.institution)}</td>
      <td>${escapeHtml(row.account)}</td>
      <td>${escapeHtml(formatDate(row.mostRecentTimestamp))}</td>
      <td>${balanceCell}</td>
    </tr>`;
  }).join("\n");

  return `<table id="accounts-table">
    <thead>
      <tr>
        <th>Institution</th>
        <th>Account</th>
        <th>Most recent transaction</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>`;
}

export async function renderAccounts(options: RenderPageOptions): Promise<string> {
  const { dataSource } = options;

  let tableHtml: string;
  try {
    const [transactions, statements] = await Promise.all([
      dataSource.getTransactions(),
      dataSource.getStatements(),
    ]);
    const rows = buildAccountRows(transactions, statements);
    tableHtml = renderAccountsTable(rows);
  } catch (error) {
    tableHtml = renderLoadError(error, "accounts-error");
  }

  return `
    <h2>Accounts</h2>
    ${renderPageNotices(options, "accounts")}
    ${tableHtml}
  `;
}
