import { createDbConnection } from "@commons-systems/idbutil/connection";
import type { Rollover, RuleType } from "./firestore.js";

const STORE_NAMES = [
  "transactions",
  "budgets",
  "budgetPeriods",
  "rules",
  "normalizationRules",
  "statements",
  "meta",
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

const { openDb, closeDb: closeDbConn } = createDbConnection({
  name: "budget",
  version: 2,
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

export interface IdbTransaction {
  id: string;
  institution: string;
  account: string;
  description: string;
  amount: number;
  note: string;
  category: string;
  reimbursement: number;
  budget: string | null;
  timestampMs: number | null;
  statementId: string | null;
  normalizedId: string | null;
  normalizedPrimary: boolean;
  normalizedDescription: string | null;
}

export interface IdbBudget {
  id: string;
  name: string;
  weeklyAllowance: number;
  allowancePeriod?: string;
  rollover: Rollover;
  overrides?: Array<{ dateMs: number; balance: number }>;
}

export interface IdbBudgetPeriod {
  id: string;
  budgetId: string;
  periodStartMs: number;
  periodEndMs: number;
  total: number;
  count: number;
  categoryBreakdown: Record<string, number>;
}

export interface IdbRule {
  id: string;
  type: RuleType;
  pattern: string;
  target: string;
  priority: number;
  institution: string | null;
  account: string | null;
}

export interface IdbNormalizationRule {
  id: string;
  pattern: string;
  patternType: string | null;
  canonicalDescription: string;
  dateWindowDays: number;
  institution: string | null;
  account: string | null;
  priority: number;
}

export interface IdbStatement {
  id: string;
  statementId: string;
  institution: string;
  account: string;
  balance: number;
  period: string;
  lastTransactionDateMs: number | null;
}

export interface ParsedData {
  transactions: IdbTransaction[];
  budgets: IdbBudget[];
  budgetPeriods: IdbBudgetPeriod[];
  rules: IdbRule[];
  normalizationRules: IdbNormalizationRule[];
  statements: IdbStatement[];
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
