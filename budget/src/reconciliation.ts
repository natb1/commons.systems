import type { StatementItem, StatementItemId, Transaction, TransactionId } from "./firestore.js";

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
