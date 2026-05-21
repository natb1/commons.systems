import type {
  JournalEntry,
  JournalLeg,
  StatementItem,
  StatementItemId,
  Transaction,
  TransactionId,
} from "./firestore.js";
import type { AccountType } from "./schema/enums.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type MatchType = "explicit" | "suggested";

export interface ReconciliationMatch {
  readonly matchType: MatchType;
  readonly item: StatementItem;
  readonly txn: Transaction;
  /** Days between statement item timestamp and transaction timestamp. */
  readonly dateDeltaDays: number;
  /** Dollar difference between statement item amount (sign-flipped) and transaction amount; ~0 for matches. */
  readonly amountDelta: number;
}

export interface UnmatchedStatementItem {
  readonly item: StatementItem;
  readonly ageDays: number;
}

export interface UnmatchedTransaction {
  readonly txn: Transaction;
  readonly ageDays: number;
}

export interface ReconciliationResult {
  readonly matched: ReconciliationMatch[];
  readonly unmatchedItems: UnmatchedStatementItem[];
  readonly unmatchedTransactions: UnmatchedTransaction[];
}

function daysBetween(aMs: number, bMs: number): number {
  return Math.abs(aMs - bMs) / MS_PER_DAY;
}

function ageDaysFrom(nowMs: number, tsMs: number): number {
  return Math.max(0, Math.floor((nowMs - tsMs) / MS_PER_DAY));
}

/**
 * Matches statement items against transactions.
 *
 * Sign convention: statement items use bank convention (negative = debit). Transactions invert
 * that (positive = spending), so a match requires `item.amount + txn.amount ≈ 0`.
 *
 * Algorithm:
 *   1. Explicit matches — join on transaction.statementItemId === item.statementItemId.
 *   2. Suggested matches — greedy best-match by date delta (tiebreak amount delta) among remaining
 *      items/transactions where the amount difference is < 1 cent and the date difference is
 *      within `toleranceDays`.
 *   3. Residual items/transactions are returned with computed ageDays.
 */
export function reconcile(
  items: StatementItem[],
  txns: Transaction[],
  toleranceDays: number,
  nowMs: number = Date.now(),
): ReconciliationResult {
  if (!Number.isFinite(toleranceDays) || toleranceDays < 0) {
    throw new RangeError(`toleranceDays must be a non-negative finite number, got ${toleranceDays}`);
  }

  const matched: ReconciliationMatch[] = [];
  const usedItemIds = new Set<StatementItemId>();
  const usedTxnIds = new Set<TransactionId>();

  const txnByItemLink = new Map<StatementItemId, Transaction>();
  for (const txn of txns) {
    if (txn.statementItemId) txnByItemLink.set(txn.statementItemId, txn);
  }

  for (const item of items) {
    const linked = txnByItemLink.get(item.statementItemId);
    if (!linked) continue;
    const itemMs = item.timestamp.toMillis();
    const txnMs = linked.timestamp?.toMillis() ?? itemMs;
    matched.push({
      matchType: "explicit",
      item,
      txn: linked,
      dateDeltaDays: daysBetween(itemMs, txnMs) / 1,
      amountDelta: Math.round((item.amount + linked.amount) * 100) / 100,
    });
    usedItemIds.add(item.statementItemId);
    usedTxnIds.add(linked.id);
  }

  const unmatchedItems = items.filter((i) => !usedItemIds.has(i.statementItemId));
  const candidates = txns.filter((t) => !usedTxnIds.has(t.id) && t.timestamp !== null);

  for (const item of unmatchedItems) {
    const itemMs = item.timestamp.toMillis();
    const itemCents = Math.round(item.amount * 100);
    let best: { txn: Transaction; dateDelta: number; amountCentDelta: number } | null = null;
    for (const txn of candidates) {
      if (usedTxnIds.has(txn.id)) continue;
      const txnMs = txn.timestamp!.toMillis();
      const dateDelta = daysBetween(itemMs, txnMs);
      if (dateDelta > toleranceDays) continue;
      // Compare in integer cents to avoid floating-point drift at the 1-cent boundary.
      const amountCentDelta = Math.abs(itemCents + Math.round(txn.amount * 100));
      if (amountCentDelta >= 1) continue;
      if (
        best === null
        || dateDelta < best.dateDelta
        || (dateDelta === best.dateDelta && amountCentDelta < best.amountCentDelta)
      ) {
        best = { txn, dateDelta, amountCentDelta };
      }
    }
    if (best !== null) {
      matched.push({
        matchType: "suggested",
        item,
        txn: best.txn,
        dateDeltaDays: best.dateDelta,
        amountDelta: Math.round((item.amount + best.txn.amount) * 100) / 100,
      });
      usedItemIds.add(item.statementItemId);
      usedTxnIds.add(best.txn.id);
    }
  }

  const residualItems: UnmatchedStatementItem[] = items
    .filter((i) => !usedItemIds.has(i.statementItemId))
    .map((item) => ({
      item,
      ageDays: ageDaysFrom(nowMs, item.timestamp.toMillis()),
    }));

  const residualTxns: UnmatchedTransaction[] = txns
    .filter((t) => !usedTxnIds.has(t.id))
    .map((txn) => ({
      txn,
      ageDays: txn.timestamp ? ageDaysFrom(nowMs, txn.timestamp.toMillis()) : 0,
    }));

  return {
    matched,
    unmatchedItems: residualItems,
    unmatchedTransactions: residualTxns,
  };
}

/** Items (or transactions) unmatched for more than 30 days get an aging flag. */
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
 * Cent-tolerant equality. Compares in integer cents to avoid floating-point drift at
 * the 1-cent boundary — the same pattern `reconcile` uses for amount matching.
 */
export function balancesMatch(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}
