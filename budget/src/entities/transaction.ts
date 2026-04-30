/**
 * Single source of truth for the Transaction entity.
 * All five per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import { msToTs, parseISOTimestamp, msToISO, nullToEmpty, UploadValidationError } from "./_helpers.js";
import type { TransactionSeedData } from "../../seeds/firestore.js";
import type { SeedTransaction } from "virtual:budget-seed-data";
import type { BudgetId } from "../firestore.js";

// ── Local validation helpers ──────────────────────────────────────────────────
// Inlined here to avoid importing @commons-systems/firestoreutil/validate,
// which uses .js extension imports that break Node.js ESM resolution when
// this module is loaded during vite config startup (for the seed data plugin).

class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataIntegrityError";
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DataIntegrityError(`Expected finite number for ${field}, got ${value}`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requireString(value, field);
}

export type TransactionId = Brand<"TransactionId">;
export type StatementId = Brand<"StatementId">;
export type StatementItemId = Brand<"StatementItemId">;

// Re-export UploadValidationError so upload.ts can import it from here (or from _helpers.ts directly).
export { UploadValidationError };

// ── Domain interface ──────────────────────────────────────────────────────────

export interface Transaction {
  readonly id: TransactionId;
  readonly institution: string;
  readonly account: string;
  readonly description: string;
  /** Transaction amount. May be negative for credits/refunds. */
  readonly amount: number;
  readonly note: string;
  readonly category: string;
  /**
   * Percentage, range [0, 100]. Validated at read and write boundaries:
   * read via requireReimbursement (throws RangeError for out-of-range values),
   * write via validateReimbursementRange in updateTransaction.
   * Server-side enforcement via Firestore security rules ensures the type
   * and range constraints hold even if client validation is bypassed.
   */
  readonly reimbursement: number;
  readonly budget: BudgetId | null;
  readonly timestamp: Timestamp | null;
  readonly statementId: StatementId | null;
  /** Explicit link to the immutable statement line item this transaction was imported from. Null or undefined for manually entered transactions and older records written before the statement-items backfill. */
  readonly statementItemId?: StatementItemId | null;
  readonly groupId: GroupId | null;
  readonly normalizedId: string | null;
  readonly normalizedPrimary: boolean;
  readonly normalizedDescription: string | null;
  readonly virtual: boolean;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

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
  statementItemId: string | null;
  normalizedId: string | null;
  normalizedPrimary: boolean;
  normalizedDescription: string | null;
  virtual: boolean;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawTransaction {
  id: string;
  institution: string;
  account: string;
  description: string;
  amount: number;
  timestamp: string;
  statementId: string;
  statementItemId?: string | null;
  category: string;
  budget: string | null;
  note: string;
  reimbursement: number;
  normalizedId: string | null;
  normalizedPrimary: boolean;
  normalizedDescription: string | null;
  virtual?: boolean;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
// TransactionSeedData lives in seeds/firestore.ts (depends on the domain Transaction type above).
export type { TransactionSeedData };

// ── Internal helpers ──────────────────────────────────────────────────────────

export function validateReimbursementRange(n: number): void {
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new RangeError(`reimbursement must be between 0 and 100, got ${n}`);
  }
}

function requireReimbursement(value: unknown): number {
  const n = requireNumber(value, "reimbursement");
  validateReimbursementRange(n);
  return n;
}

function optionalTimestamp(value: unknown, field: string): Timestamp | null {
  if (value == null) return null;
  if (!(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${typeof value}`);
  }
  return value;
}

// ── Firestore → Transaction ───────────────────────────────────────────────────

export function parseFirestoreTransaction(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): Transaction {
  const data = docSnap.data();
  return {
    id: docSnap.id as TransactionId,
    institution: requireString(data.institution, "institution"),
    account: requireString(data.account, "account"),
    description: requireString(data.description, "description"),
    amount: requireNumber(data.amount, "amount"),
    note: requireString(data.note, "note"),
    category: requireString(data.category, "category"),
    reimbursement: requireReimbursement(data.reimbursement),
    budget: optionalString(data.budget, "budget") as BudgetId | null,
    timestamp: optionalTimestamp(data.timestamp, "timestamp"),
    statementId: optionalString(data.statementId, "statementId") as StatementId | null,
    statementItemId: optionalString(data.statementItemId, "statementItemId") as StatementItemId | null,
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    normalizedId: optionalString(data.normalizedId, "normalizedId"),
    // Defaults to true for un-normalized transactions (field may be missing or null)
    normalizedPrimary: data.normalizedPrimary !== false,
    normalizedDescription: optionalString(data.normalizedDescription, "normalizedDescription"),
    virtual: data.virtual === true,
  };
}

// ── Raw upload → Transaction ──────────────────────────────────────────────────

function requireUploadId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new UploadValidationError(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

export function parseRawTransaction(t: RawTransaction, i: number): Transaction {
  return {
    id: requireUploadId(t.id, "transaction", i) as TransactionId,
    institution: t.institution ?? "",
    account: t.account ?? "",
    description: t.description ?? "",
    amount: t.amount ?? 0,
    note: t.note ?? "",
    category: t.category ?? "",
    reimbursement: t.reimbursement ?? 0,
    budget: (t.budget || null) as BudgetId | null,
    timestamp: t.timestamp ? parseISOTimestamp(t.timestamp, "transaction.timestamp") : null,
    statementId: (t.statementId || null) as StatementId | null,
    statementItemId: (t.statementItemId || null) as StatementItemId | null,
    groupId: null as GroupId | null,
    normalizedId: t.normalizedId || null,
    normalizedPrimary: t.normalizedPrimary !== false,
    normalizedDescription: t.normalizedDescription || null,
    virtual: t.virtual ?? false,
  };
}

// ── Transaction → IdbTransaction ─────────────────────────────────────────────

export function transactionToIdbRecord(t: Transaction): IdbTransaction {
  return {
    id: t.id,
    institution: t.institution,
    account: t.account,
    description: t.description,
    amount: t.amount,
    note: t.note,
    category: t.category,
    reimbursement: t.reimbursement,
    budget: t.budget,
    timestampMs: t.timestamp?.toMillis() ?? null,
    statementId: t.statementId,
    statementItemId: t.statementItemId ?? null,
    normalizedId: t.normalizedId,
    normalizedPrimary: t.normalizedPrimary,
    normalizedDescription: t.normalizedDescription,
    virtual: t.virtual,
  };
}

// ── IdbTransaction → Transaction ─────────────────────────────────────────────

export function idbToTransaction(row: IdbTransaction): Transaction {
  return {
    id: row.id as TransactionId,
    institution: row.institution,
    account: row.account,
    description: row.description,
    amount: row.amount,
    note: row.note,
    category: row.category,
    reimbursement: row.reimbursement,
    budget: (row.budget ?? null) as BudgetId | null,
    timestamp: msToTs(row.timestampMs),
    statementId: (row.statementId ?? null) as StatementId | null,
    statementItemId: (row.statementItemId ?? null) as StatementItemId | null,
    groupId: null as GroupId | null,
    normalizedId: row.normalizedId,
    normalizedPrimary: row.normalizedPrimary,
    normalizedDescription: row.normalizedDescription,
    virtual: row.virtual ?? false,
  };
}

// ── IdbTransaction → RawTransaction (export) ─────────────────────────────────

export function transactionToRawJson(t: IdbTransaction): RawTransaction {
  return {
    id: t.id,
    institution: nullToEmpty(t.institution),
    account: nullToEmpty(t.account),
    description: t.description,
    amount: t.amount,
    timestamp: msToISO(t.timestampMs),
    statementId: nullToEmpty(t.statementId),
    statementItemId: t.statementItemId ?? null,
    category: t.category,
    budget: t.budget,
    note: t.note,
    reimbursement: t.reimbursement,
    normalizedId: t.normalizedId,
    normalizedPrimary: t.normalizedPrimary,
    normalizedDescription: t.normalizedDescription,
  };
}

// ── TransactionSeedData → SeedTransaction (build-time) ───────────────────────

function toMs(d: unknown): number | null {
  if (d instanceof Date) return d.getTime();
  if (d != null && typeof d === "object" && "toMillis" in d) return (d as { toMillis(): number }).toMillis();
  return null;
}

function requireSeedString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

function requireSeedNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Expected finite number for ${field}, got ${value}`);
  return value;
}

function requireSeedReimbursement(value: unknown): number {
  const n = requireSeedNumber(value, "reimbursement");
  if (n < 0 || n > 100) throw new RangeError(`reimbursement must be between 0 and 100, got ${n}`);
  return n;
}

export function serializeSeedTransaction(raw: TransactionSeedData, id: string): SeedTransaction {
  return {
    id,
    institution: requireSeedString(raw.institution, "institution"),
    account: requireSeedString(raw.account, "account"),
    description: requireSeedString(raw.description, "description"),
    amount: requireSeedNumber(raw.amount, "amount"),
    note: requireSeedString(raw.note, "note"),
    category: requireSeedString(raw.category, "category"),
    reimbursement: requireSeedReimbursement(raw.reimbursement),
    budget: raw.budget ?? null,
    timestampMs: toMs(raw.timestamp),
    statementId: raw.statementId ?? null,
    statementItemId: raw.statementItemId ?? null,
    normalizedId: raw.normalizedId,
    normalizedPrimary: raw.normalizedPrimary,
    normalizedDescription: raw.normalizedDescription,
    virtual: raw.virtual,
  };
}
