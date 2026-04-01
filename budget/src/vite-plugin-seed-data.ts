import type { Plugin } from "vite";
import { findCollection } from "../seeds/find-collection.js";

const VIRTUAL_MODULE_ID = "virtual:budget-seed-data";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

function toMs(d: unknown): number | null {
  if (d instanceof Date) return d.getTime();
  if (d != null && typeof d === "object" && "toMillis" in d) return (d as { toMillis(): number }).toMillis();
  return null;
}

function stripFields(data: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  const copy = { ...data };
  for (const key of keys) delete copy[key];
  return copy;
}

function serializeSeedData(): string {
  const transactions = findCollection("seed-transactions").map(({ id, data }) => {
    const d = stripFields(data, "memberEmails", "groupId");
    return { ...d, id, timestampMs: toMs(d.timestamp), timestamp: undefined };
  });

  const budgets = findCollection("seed-budgets").map(({ id, data }) => {
    const d = stripFields(data, "memberEmails", "groupId");
    const overrides = Array.isArray(d.overrides)
      ? (d.overrides as { date: unknown; balance: number }[]).map((o) => ({
          dateMs: toMs(o.date),
          balance: o.balance,
        }))
      : [];
    return { ...d, id, overrides };
  });

  const budgetPeriods = findCollection("seed-budget-periods").map(({ id, data }) => {
    const d = stripFields(data, "memberEmails", "groupId");
    return {
      ...d,
      id,
      periodStartMs: toMs(d.periodStart),
      periodEndMs: toMs(d.periodEnd),
      periodStart: undefined,
      periodEnd: undefined,
    };
  });

  const rules = findCollection("seed-rules").map(({ id, data }) => {
    const d = stripFields(data, "memberEmails", "groupId");
    return { ...d, id };
  });

  const normalizationRules = findCollection("seed-normalization-rules").map(({ id, data }) => {
    const d = stripFields(data, "memberEmails", "groupId");
    return { ...d, id };
  });

  const statements = findCollection("seed-statements").map(({ id, data }) => {
    const d = stripFields(data, "memberEmails", "groupId");
    return {
      ...d,
      id,
      lastTransactionDateMs: toMs(d.lastTransactionDate),
      lastTransactionDate: undefined,
    };
  });

  const weeklyAggregates = findCollection("seed-weekly-aggregates").map(({ id, data }) => {
    const d = stripFields(data, "memberEmails", "groupId");
    return {
      ...d,
      id,
      weekStartMs: toMs(d.weekStart),
      weekStart: undefined,
    };
  });

  return JSON.stringify({
    transactions,
    budgets,
    budgetPeriods,
    rules,
    normalizationRules,
    statements,
    weeklyAggregates,
  });
}

export function budgetSeedDataPlugin(): Plugin {
  let moduleCode: string;

  return {
    name: "budget-seed-data",
    buildStart() {
      const data = serializeSeedData();
      moduleCode = `export default ${data};`;
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) return moduleCode;
    },
  };
}
