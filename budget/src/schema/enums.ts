/**
 * Canonical enum arrays for budget domain entities.
 * Each array is the single source of truth for its literal union set.
 * Derived types are exported below each array.
 */

export const ROLLOVERS = ["none", "debt", "balance"] as const;
export type Rollover = (typeof ROLLOVERS)[number];

export const ALLOWANCE_PERIODS = ["weekly", "monthly", "quarterly"] as const;
export type AllowancePeriod = (typeof ALLOWANCE_PERIODS)[number];

export const RECONCILIATION_CLASSIFICATIONS = ["timing", "missing_entry", "discrepancy"] as const;
export type ReconciliationClassification = (typeof RECONCILIATION_CLASSIFICATIONS)[number];

export const RECONCILIATION_ENTITY_TYPES = ["transaction", "statementItem"] as const;
export type ReconciliationEntityType = (typeof RECONCILIATION_ENTITY_TYPES)[number];

export const RULE_TYPES = ["categorization", "budget_assignment"] as const;
export type RuleType = (typeof RULE_TYPES)[number];
