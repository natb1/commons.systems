import type { JournalEntry, JournalLeg } from "./firestore.js";
import type { AccountType } from "./schema/enums.js";
import type { JournalEntryFields, JournalLegFields } from "./data-source.js";

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

// ── Adjustment-entry generation ──────────────────────────────────────────────────

/**
 * Deterministic `{institution}_{account}` document id of the `Adjustment Suspense`
 * equity account seeded by #552. Adjustment-entry generation offsets against it.
 */
export const ADJUSTMENT_SUSPENSE_ACCOUNT_ID = "Budget_Adjustment Suspense";

export interface BuildAdjustmentEntryInput {
  /** Signed reconciliation difference: clearedBalance − bankBalance. Must be non-zero. */
  readonly difference: number;
  readonly reconcilingAccountId: string;
  readonly reconcilingAccountType: AccountType;
  readonly suspenseAccountId: string;
  /** Human-readable account label for the entry description. */
  readonly accountLabel: string;
  /** Reconciled-through date, ms since epoch — used as the entry timestamp. */
  readonly throughDateMs: number;
}

/**
 * Builds a balanced two-leg adjustment journal entry that closes the reconciliation
 * difference. The reconciling leg's signed amount (per `signedLegAmount`) equals
 * `−difference`, bringing the cleared balance exactly to the bank balance.
 *
 * Returns the entry fields and an ordered pair of legs: [reconcilingLeg, suspenseLeg].
 * Both legs are marked `cleared: true`.
 */
export function buildAdjustmentEntry(
  input: BuildAdjustmentEntryInput,
): { entry: JournalEntryFields; legs: [JournalLegFields, JournalLegFields] } {
  const amount = Math.abs(input.difference);
  // The reconciling leg's signed amount must equal -difference so that including
  // this leg in the cleared set moves clearedBalance exactly to bankBalance.
  const signedTarget = -input.difference;

  // asset/expense are debit-positive: signed = debit - credit, so debit when signedTarget > 0.
  // liability/equity/income are credit-positive: signed = credit - debit, so debit when signedTarget < 0.
  const debitPositive =
    input.reconcilingAccountType === "asset" || input.reconcilingAccountType === "expense";
  const reconcilingIsDebit = debitPositive ? signedTarget > 0 : signedTarget < 0;

  const reconcilingLeg: JournalLegFields = {
    accountId: input.reconcilingAccountId,
    debit: reconcilingIsDebit ? amount : 0,
    credit: reconcilingIsDebit ? 0 : amount,
    cleared: true,
  };

  const suspenseLeg: JournalLegFields = {
    accountId: input.suspenseAccountId,
    debit: reconcilingIsDebit ? 0 : amount,
    credit: reconcilingIsDebit ? amount : 0,
    cleared: true,
  };

  const dateStr = new Date(input.throughDateMs).toISOString().slice(0, 10);
  const description = `Reconciliation adjustment — ${input.accountLabel} through ${dateStr}`;

  const entry: JournalEntryFields = {
    timestampMs: input.throughDateMs,
    description,
    note: null,
  };

  return { entry, legs: [reconcilingLeg, suspenseLeg] };
}
