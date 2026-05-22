import type { JournalEntry, JournalLeg } from "./firestore.js";
import type { AccountType } from "./schema/enums.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Legs uncleared for more than 30 days get an aging flag. */
export const AGING_THRESHOLD_DAYS = 30;

export function isAged(ageDays: number): boolean {
  return ageDays > AGING_THRESHOLD_DAYS;
}

// ── Balance-matching reconciliation ─────────────────────────────────────────────

/**
 * The leg's amount signed per its account's type.
 *
 * A journal leg carries `debit >= 0` and `credit >= 0` with exactly one non-zero.
 * Sign convention follows normal-balance:
 *   - asset, expense        → debit-positive → debit - credit
 *   - liability, equity, income → credit-positive → credit - debit
 */
export function signedLegAmount(leg: JournalLeg, accountType: AccountType): number {
  switch (accountType) {
    case "asset":
    case "expense":
      return leg.debit - leg.credit;
    case "liability":
    case "equity":
    case "income":
      return leg.credit - leg.debit;
  }
}

/** A journal leg projected for the balance-matching reconcile view. */
export interface ReconcileRow {
  readonly leg: JournalLeg;
  /** Description carried from the leg's journal entry. */
  readonly description: string;
  /** The leg's amount signed per its account type. */
  readonly signedAmount: number;
  /** Cumulative sum of signedAmount up to and including this row, in timestamp order. */
  readonly runningBalance: number;
  /** The leg's age in days (fractional). */
  readonly ageDays: number;
}

/**
 * Projects journal legs into reconcile rows for the balance-matching view.
 *
 * Legs are sorted by timestamp ascending; `runningBalance` accumulates `signedAmount`
 * in that order. `ageDays` is computed for every row regardless of cleared state.
 * `entriesById` maps entry id → entry; a leg whose entry is absent is a data-integrity
 * violation and throws.
 */
export function buildReconcileRows(
  legs: JournalLeg[],
  entriesById: Map<string, JournalEntry>,
  accountType: AccountType,
  nowMs: number = Date.now(),
): ReconcileRow[] {
  const sorted = [...legs].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
  const rows: ReconcileRow[] = [];
  let runningBalance = 0;
  for (const leg of sorted) {
    const entry = entriesById.get(leg.entryId);
    if (entry === undefined) {
      throw new Error(`Journal leg ${leg.id} references missing entry ${leg.entryId}`);
    }
    const signedAmount = signedLegAmount(leg, accountType);
    runningBalance += signedAmount;
    rows.push({
      leg,
      description: entry.description,
      signedAmount,
      runningBalance,
      ageDays: (nowMs - leg.timestamp.toMillis()) / MS_PER_DAY,
    });
  }
  return rows;
}

/** Sum of signed amounts over legs flagged cleared. */
export function clearedBalance(legs: JournalLeg[], accountType: AccountType): number {
  let total = 0;
  for (const leg of legs) {
    if (leg.cleared === true) total += signedLegAmount(leg, accountType);
  }
  return total;
}

/**
 * Cent-tolerant equality. Compares in integer cents to avoid floating-point drift
 * at the 1-cent boundary.
 */
export function balancesMatch(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}
