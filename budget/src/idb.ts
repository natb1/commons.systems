import { createDbConnection } from "@commons-systems/idbutil/connection";
import type { IdbTransaction } from "./entities/transaction.js";
export type { IdbTransaction };
import type { IdbStatement } from "./entities/statement.js";
export type { IdbStatement };
import type { IdbStatementItem } from "./entities/statement-item.js";
export type { IdbStatementItem };
import type { IdbReconciliationNote } from "./entities/reconciliation-note.js";
export type { IdbReconciliationNote };
import type { IdbBudget } from "./entities/budget.js";
export type { IdbBudget };
import type { IdbBudgetPeriod } from "./entities/budget-period.js";
export type { IdbBudgetPeriod };
import type { IdbRule } from "./entities/rule.js";
export type { IdbRule };
import type { IdbNormalizationRule } from "./entities/normalization-rule.js";
export type { IdbNormalizationRule };
import type { IdbWeeklyAggregate } from "./entities/weekly-aggregate.js";
export type { IdbWeeklyAggregate };

const STORE_NAMES = [
  "transactions",
  "budgets",
  "budgetPeriods",
  "rules",
  "normalizationRules",
  "statements",
  "statementItems",
  "reconciliationNotes",
  "weeklyAggregates",
  "meta",
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

const { openDb, closeDb: closeDbConn } = createDbConnection({
  name: "budget",
  version: 4,
  onUpgrade(db) {
    for (const name of STORE_NAMES) {
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, { keyPath: name === "meta" ? "key" : "id" });
      }
    }
  },
});

/** Close the cached DB connection. Primarily for test cleanup. */
export const closeDb = closeDbConn;

export interface UploadMeta {
  key: "upload";
  groupName: string;
  version: number;
  exportedAt: string;
}

export interface ParsedData {
  transactions: IdbTransaction[];
  budgets: IdbBudget[];
  budgetPeriods: IdbBudgetPeriod[];
  rules: IdbRule[];
  normalizationRules: IdbNormalizationRule[];
  statements: IdbStatement[];
  statementItems: IdbStatementItem[];
  reconciliationNotes: IdbReconciliationNote[];
  weeklyAggregates: IdbWeeklyAggregate[];
  meta: UploadMeta;
}

export async function storeParsedData(data: ParsedData): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([...STORE_NAMES], "readwrite");
  const stores: Record<string, IDBObjectStore> = {};
  for (const name of STORE_NAMES) {
    stores[name] = tx.objectStore(name);
  }

  // Clear all stores first
  const clearPromises: Promise<void>[] = [];
  for (const name of STORE_NAMES) {
    clearPromises.push(
      new Promise((resolve, reject) => {
        const req = stores[name].clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
    );
  }
  await Promise.all(clearPromises);

  // Write all records
  for (const record of data.transactions) stores.transactions.put(record);
  for (const record of data.budgets) stores.budgets.put(record);
  for (const record of data.budgetPeriods) stores.budgetPeriods.put(record);
  for (const record of data.rules) stores.rules.put(record);
  for (const record of data.normalizationRules) stores.normalizationRules.put(record);
  for (const record of data.statements) stores.statements.put(record);
  for (const record of data.statementItems) stores.statementItems.put(record);
  for (const record of data.reconciliationNotes) stores.reconciliationNotes.put(record);
  for (const record of data.weeklyAggregates) stores.weeklyAggregates.put(record);
  stores.meta.put(data.meta);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function get<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function put(storeName: StoreName, record: Record<string, unknown>): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const request = tx.objectStore(storeName).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const request = tx.objectStore(storeName).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAll(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([...STORE_NAMES], "readwrite");
  for (const name of STORE_NAMES) {
    tx.objectStore(name).clear();
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMeta(): Promise<UploadMeta | undefined> {
  return get<UploadMeta>("meta", "upload");
}
