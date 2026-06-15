/**
 * Single source of truth for the budget snapshot collections.
 *
 * Each entry pairs the three adaptors for one IndexedDB store — parse a raw
 * JSON record into the domain shape, convert the domain shape into the IDB
 * record, and serialize the IDB record back to raw JSON. `defineCollection`
 * forces those three to chain, so a mispaired adaptor is a compile error at
 * the offending entry rather than a silent data loss on round-trip.
 *
 * The export/upload/idb paths derive their collection lists from this registry,
 * so adding a store here is the single edit that wires it through every path.
 *
 * This module must NOT import from idb.ts — idb.ts imports the registry, and a
 * back-import would create a cycle. The Idb/Domain/Raw types are derived from
 * the adaptor signatures via ReturnType, not imported by name.
 */
import { parseRawTransaction, transactionToIdbRecord, transactionToRawJson } from "./entities/transaction.js";
import { parseRawBudget, budgetToIdbRecord, budgetToRawJson } from "./entities/budget.js";
import { parseRawBudgetPeriod, budgetPeriodToIdbRecord, budgetPeriodToRawJson } from "./entities/budget-period.js";
import { parseRawRule, ruleToIdbRecord, ruleToRawJson } from "./entities/rule.js";
import { parseRawNormalizationRule, normalizationRuleToIdbRecord, normalizationRuleToRawJson } from "./entities/normalization-rule.js";
import { parseRawStatement, statementToIdbRecord, statementToRawJson } from "./entities/statement.js";
import { parseRawStatementItem, statementItemToIdbRecord, statementItemToRawJson } from "./entities/statement-item.js";
import { parseRawReconciliationNote, reconciliationNoteToIdbRecord, reconciliationNoteToRawJson } from "./entities/reconciliation-note.js";
import { parseRawAccount, accountToIdbRecord, accountToRawJson } from "./entities/account.js";
import { parseRawJournalEntry, journalEntryToIdbRecord, journalEntryToRawJson } from "./entities/journal-entry.js";
import { parseRawJournalLeg, journalLegToIdbRecord, journalLegToRawJson } from "./entities/journal-leg.js";
import { parseRawReconciliationEvent, reconciliationEventToIdbRecord, reconciliationEventToRawJson } from "./entities/reconciliation-event.js";
import { parseRawWeeklyAggregate, weeklyAggregateToIdbRecord, weeklyAggregateToRawJson } from "./entities/weekly-aggregate.js";

/**
 * Identity helper that infers the domain (D), IDB (I), raw-in (RIn), and
 * raw-out (ROut) types from the three adaptor functions and forces them to
 * chain. The two links the registry guarantees:
 *   - parseRaw output type === toIdbRecord input type (both D)
 *   - toRawJson input type === toIdbRecord output type (both I)
 *
 * RIn and ROut are kept as separate type parameters on purpose. Several
 * `*ToRawJson` adaptors still return the wide `object` type mid-migration,
 * which cannot satisfy a single shared R that is both a supertype of `object`
 * (toRawJson's return) and a subtype of the specific `Raw*` parse input. Two
 * params let each side infer independently without widening any entry to `any`.
 */
function defineCollection<D, I, RIn, ROut>(a: {
  parseRaw: (raw: RIn, i: number) => D;
  toIdbRecord: (d: D) => I;
  toRawJson: (idb: I) => ROut;
}): typeof a {
  return a;
}

const collectionRegistry = {
  transactions: defineCollection({ parseRaw: parseRawTransaction, toIdbRecord: transactionToIdbRecord, toRawJson: transactionToRawJson }),
  budgets: defineCollection({ parseRaw: parseRawBudget, toIdbRecord: budgetToIdbRecord, toRawJson: budgetToRawJson }),
  budgetPeriods: defineCollection({ parseRaw: parseRawBudgetPeriod, toIdbRecord: budgetPeriodToIdbRecord, toRawJson: budgetPeriodToRawJson }),
  rules: defineCollection({ parseRaw: parseRawRule, toIdbRecord: ruleToIdbRecord, toRawJson: ruleToRawJson }),
  normalizationRules: defineCollection({ parseRaw: parseRawNormalizationRule, toIdbRecord: normalizationRuleToIdbRecord, toRawJson: normalizationRuleToRawJson }),
  statements: defineCollection({ parseRaw: parseRawStatement, toIdbRecord: statementToIdbRecord, toRawJson: statementToRawJson }),
  statementItems: defineCollection({ parseRaw: parseRawStatementItem, toIdbRecord: statementItemToIdbRecord, toRawJson: statementItemToRawJson }),
  reconciliationNotes: defineCollection({ parseRaw: parseRawReconciliationNote, toIdbRecord: reconciliationNoteToIdbRecord, toRawJson: reconciliationNoteToRawJson }),
  accounts: defineCollection({ parseRaw: parseRawAccount, toIdbRecord: accountToIdbRecord, toRawJson: accountToRawJson }),
  journalEntries: defineCollection({ parseRaw: parseRawJournalEntry, toIdbRecord: journalEntryToIdbRecord, toRawJson: journalEntryToRawJson }),
  journalLegs: defineCollection({ parseRaw: parseRawJournalLeg, toIdbRecord: journalLegToIdbRecord, toRawJson: journalLegToRawJson }),
  reconciliationEvents: defineCollection({ parseRaw: parseRawReconciliationEvent, toIdbRecord: reconciliationEventToIdbRecord, toRawJson: reconciliationEventToRawJson }),
  weeklyAggregates: defineCollection({ parseRaw: parseRawWeeklyAggregate, toIdbRecord: weeklyAggregateToIdbRecord, toRawJson: weeklyAggregateToRawJson }),
};

export type CollectionRegistry = typeof collectionRegistry;
export type DataStoreName = keyof CollectionRegistry;
export type IdbOf<K extends DataStoreName> = ReturnType<CollectionRegistry[K]["toIdbRecord"]>;
export type DomainOf<K extends DataStoreName> = ReturnType<CollectionRegistry[K]["parseRaw"]>;
export type RawOf<K extends DataStoreName> = ReturnType<CollectionRegistry[K]["toRawJson"]>;
export type CollectionIdbData = { [K in DataStoreName]: IdbOf<K>[] };
export type CollectionDomainData = { [K in DataStoreName]: DomainOf<K>[] };
export type CollectionRawData = { [K in DataStoreName]: RawOf<K>[] };

export { collectionRegistry };
