import type { JournalLeg } from "./entities/journal-leg.js";
import type { StatementItem } from "./entities/statement-item.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Default tolerance window for proximity matching between legs and statement items. */
export const SUGGESTION_TOLERANCE_DAYS = 3;

/**
 * Returns the set of JournalLeg ids that should be visually suggested as cleared.
 *
 * A leg is suggested if it is not already cleared and meets any of:
 * - Explicit signal: the leg has a non-null statementItemId (ETL linked it to a bank record).
 * - Proximity signal: any statement item matches by absolute amount (cent-tolerant) and
 *   date within toleranceDays.
 *
 * No greedy one-to-one assignment — statement items may match multiple legs.
 */
export function suggestClearedLegs(
  legs: JournalLeg[],
  statementItems: StatementItem[],
  toleranceDays: number,
): Set<string> {
  const suggested = new Set<string>();

  for (const leg of legs) {
    if (leg.cleared) continue;

    if (leg.statementItemId !== null) {
      suggested.add(leg.id);
      continue;
    }

    const legMagnitude = Math.max(leg.debit, leg.credit);
    const legMs = leg.timestamp.toMillis();
    const windowMs = toleranceDays * MS_PER_DAY;

    for (const item of statementItems) {
      const itemMagnitude = Math.abs(item.amount);
      const amountMatch = Math.round(legMagnitude * 100) === Math.round(itemMagnitude * 100);
      if (!amountMatch) continue;

      const dateMatch = Math.abs(legMs - item.timestamp.toMillis()) <= windowMs;
      if (!dateMatch) continue;

      suggested.add(leg.id);
      break;
    }
  }

  return suggested;
}
