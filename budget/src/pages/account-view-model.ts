// Render-free view-model helpers for the accounts page. Extracted from
// accounts.ts (Unit 2) so the React <Accounts> page and the legacy string
// renderer share the same data logic. accounts.ts re-exports these so its
// existing test stays green; the legacy renderer is deleted in Unit 4.
//
// Everything here computes values (account rows, variance class, formatted
// strings). HTML-string emission stays in accounts.ts.
import type { Transaction, Statement } from "../firestore.js";
import { formatCurrency } from "../format.js";
import { accountKey, splitAccountKey, type DerivedAccountBalance } from "../balance.js";

export interface AccountRow {
  institution: string;
  account: string;
  mostRecentTimestamp: number | null;
  balance: number | null;
  derivedBalance: number | null;
  hasDiscrepancy: boolean;
  virtual: boolean;
  latestPeriod: string | null;
}

export function buildAccountRows(
  transactions: Transaction[],
  statements: Statement[],
  derivedBalances: DerivedAccountBalance[],
): AccountRow[] {
  // Compute max transaction timestamp per account from transactions
  const txnMaxTs = new Map<string, number>();
  for (const txn of transactions) {
    const k = accountKey(txn.institution, txn.account);
    const ts = txn.timestamp?.toMillis() ?? 0;
    const existing = txnMaxTs.get(k);
    if (existing === undefined || ts > existing) {
      txnMaxTs.set(k, ts);
    }
  }

  // Find latest statement per (institution, account) by comparing period strings (YYYY-MM format, zero-padded, so lexicographic order equals chronological order)
  const latestStatements = new Map<string, Statement>();
  for (const stmt of statements) {
    const k = accountKey(stmt.institution, stmt.account);
    const existing = latestStatements.get(k);
    if (!existing || stmt.period > existing.period) {
      latestStatements.set(k, stmt);
    }
  }

  // Index derived balances by account key
  const derivedByAccount = new Map<string, DerivedAccountBalance>();
  for (const db of derivedBalances) {
    derivedByAccount.set(accountKey(db.institution, db.account), db);
  }

  // Detect virtual accounts: all statements for the account are virtual
  const virtualAccounts = new Set<string>();
  const accountStmtCounts = new Map<string, { total: number; virtual: number }>();
  for (const stmt of statements) {
    const k = accountKey(stmt.institution, stmt.account);
    const counts = accountStmtCounts.get(k) ?? { total: 0, virtual: 0 };
    counts.total++;
    if (stmt.virtual) counts.virtual++;
    accountStmtCounts.set(k, counts);
  }
  for (const [k, counts] of accountStmtCounts) {
    if (counts.total > 0 && counts.total === counts.virtual) virtualAccounts.add(k);
  }

  // Collect all account keys from both transactions and statements
  const allKeys = new Set<string>([...txnMaxTs.keys(), ...latestStatements.keys()]);

  const rows: AccountRow[] = [];
  for (const k of allKeys) {
    const stmt = latestStatements.get(k);
    const derived = derivedByAccount.get(k);
    const [institution, account] = splitAccountKey(k);
    // Use transaction max timestamp if available, otherwise fall back to statement lastTransactionDate
    const maxTs = txnMaxTs.get(k) ?? stmt?.lastTransactionDate?.toMillis() ?? null;
    rows.push({
      institution,
      account,
      mostRecentTimestamp: maxTs,
      balance: stmt ? stmt.balance : null,
      derivedBalance: derived ? derived.derivedBalance : null,
      hasDiscrepancy: derived ? Math.abs(derived.discrepancy) > 0.01 : false,
      virtual: virtualAccounts.has(k),
      latestPeriod: stmt ? stmt.period : null,
    });
  }

  rows.sort((a, b) => (a.mostRecentTimestamp ?? 0) - (b.mostRecentTimestamp ?? 0));
  return rows;
}

export function formatDate(ms: number | null): string {
  if (ms === null) return "";
  return new Date(ms).toLocaleDateString();
}

export function formatSignedCurrency(n: number): string {
  if (n === 0) return formatCurrency(0);
  if (n > 0) return `+${formatCurrency(n)}`;
  return `−${formatCurrency(-n)}`;
}

export function formatSignedPercent(p: number): string {
  const rounded = Math.round(p * 10) / 10;
  if (rounded === 0) return "0.0%";
  if (rounded > 0) return `+${rounded.toFixed(1)}%`;
  return `−${Math.abs(rounded).toFixed(1)}%`;
}

export function formatPercent(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${(ratio * 100).toFixed(1)}%`;
}

export type VarianceSide = "income" | "expense";

/**
 * Map a variance value to its semantic class. For income a positive value is
 * favorable; for expenses a negative value (spending less) is favorable.
 */
export function varianceClass(value: number | null, side: VarianceSide = "income"): string {
  if (value === null || value === 0) return "variance-neutral";
  const isPositive = side === "expense" ? value < 0 : value > 0;
  return isPositive ? "variance-positive" : "variance-negative";
}
