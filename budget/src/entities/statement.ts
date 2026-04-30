/**
 * Single source of truth for the Statement entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import { msToTs } from "./_helpers.js";
import type { StatementSeedData } from "../../seeds/firestore.js";
import type { SeedStatement } from "virtual:budget-seed-data";

// ── Local validation helpers ──────────────────────────────────────────────────
// Inlined here to avoid importing @commons-systems/firestoreutil/validate and
// @commons-systems/firestoreutil/errors, which use .js extension imports that
// break Node.js ESM resolution when this module is loaded during vite config startup.

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

export type StatementId = Brand<"StatementId">;

// ── Domain interface ──────────────────────────────────────────────────────────

export interface Statement {
  readonly id: string;
  readonly statementId: StatementId;
  readonly institution: string;
  readonly account: string;
  readonly balance: number;
  readonly period: string;
  readonly balanceDate: string | null;
  readonly lastTransactionDate: Timestamp | null;
  readonly groupId: GroupId | null;
  readonly virtual: boolean;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbStatement {
  id: string;
  statementId: string;
  institution: string;
  account: string;
  balance: number;
  period: string;
  balanceDate: string | null;
  lastTransactionDateMs: number | null;
  virtual: boolean;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawStatement {
  id: string;
  statementId: string;
  institution: string;
  account: string;
  balance: number;
  period: string;
  balanceDate?: string;
  lastTransactionDate?: string | null;
  virtual?: boolean;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { StatementSeedData };

// ── Internal helpers ──────────────────────────────────────────────────────────

function optionalTimestamp(value: unknown, field: string): Timestamp | null {
  if (value == null) return null;
  if (!(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${typeof value}`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requireString(value, field);
}

// ── Firestore → Statement ─────────────────────────────────────────────────────

export function parseFirestoreStatement(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): Statement {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    statementId: requireString(data.statementId, "statementId") as StatementId,
    institution: requireString(data.institution, "institution"),
    account: requireString(data.account, "account"),
    balance: requireNumber(data.balance, "balance"),
    period: requireString(data.period, "period"),
    balanceDate: optionalString(data.balanceDate, "balanceDate"),
    lastTransactionDate: optionalTimestamp(data.lastTransactionDate, "lastTransactionDate"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
    virtual: data.virtual === true,
  };
}

// ── Raw upload → Statement ────────────────────────────────────────────────────

function parseUploadTimestamp(iso: string, field: string): Timestamp {
  const ms = Date.parse(iso);
  if (isNaN(ms)) throw new Error(`Invalid timestamp for ${field}: "${iso}"`);
  return Timestamp.fromMillis(ms);
}

function requireUploadId(value: unknown, entity: string, index: number): string {
  if (typeof value !== "string" || value === "") {
    throw new Error(`${entity}[${index}] is missing a valid id`);
  }
  return value;
}

function requireUploadString(value: unknown, entity: string, index: number, field: string): string {
  if (typeof value !== "string" || value === "") {
    throw new Error(`${entity}[${index}].${field} is missing or empty`);
  }
  return value;
}

function requireUploadFiniteNumber(value: unknown, entity: string, index: number, field: string): number {
  if (typeof value !== "number" || !isFinite(value)) {
    throw new Error(`${entity}[${index}].${field} must be a finite number`);
  }
  return value;
}

export function parseRawStatement(s: RawStatement, i: number): Statement {
  return {
    id: requireUploadId(s.id, "statement", i),
    statementId: requireUploadId(s.statementId, "statement.statementId", i) as StatementId,
    institution: requireUploadString(s.institution, "statement", i, "institution"),
    account: requireUploadString(s.account, "statement", i, "account"),
    balance: requireUploadFiniteNumber(s.balance, "statement", i, "balance"),
    period: requireUploadString(s.period, "statement", i, "period"),
    balanceDate: s.balanceDate || null,
    lastTransactionDate: s.lastTransactionDate
      ? parseUploadTimestamp(s.lastTransactionDate, `statement[${i}].lastTransactionDate`)
      : null,
    groupId: null as GroupId | null,
    virtual: s.virtual ?? false,
  };
}

// ── Statement → IdbStatement ──────────────────────────────────────────────────

export function statementToIdbRecord(s: Statement): IdbStatement {
  return {
    id: s.id,
    statementId: s.statementId,
    institution: s.institution,
    account: s.account,
    balance: s.balance,
    period: s.period,
    balanceDate: s.balanceDate,
    lastTransactionDateMs: s.lastTransactionDate?.toMillis() ?? null,
    virtual: s.virtual,
  };
}

// ── IdbStatement → Statement ──────────────────────────────────────────────────

export function idbToStatement(row: IdbStatement): Statement {
  return {
    id: row.id,
    statementId: row.statementId as StatementId,
    institution: row.institution,
    account: row.account,
    balance: row.balance,
    period: row.period,
    balanceDate: row.balanceDate ?? null,
    lastTransactionDate: msToTs(row.lastTransactionDateMs),
    groupId: null as GroupId | null,
    virtual: row.virtual ?? false,
  };
}

// ── IdbStatement → RawStatement (export) ──────────────────────────────────────

export function statementToRawJson(s: IdbStatement): object {
  return {
    id: s.id,
    statementId: s.statementId,
    institution: s.institution,
    account: s.account,
    balance: s.balance,
    period: s.period,
    balanceDate: s.balanceDate ?? "",
    lastTransactionDate: s.lastTransactionDateMs != null
      ? new Date(s.lastTransactionDateMs).toISOString()
      : null,
  };
}

// ── StatementSeedData → SeedStatement (build-time) ────────────────────────────

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

export function serializeSeedStatement(raw: StatementSeedData, id: string): SeedStatement {
  return {
    id,
    statementId: requireSeedString(raw.statementId, "statementId"),
    institution: requireSeedString(raw.institution, "institution"),
    account: requireSeedString(raw.account, "account"),
    balance: requireSeedNumber(raw.balance, "balance"),
    period: requireSeedString(raw.period, "period"),
    balanceDate: raw.balanceDate ?? null,
    lastTransactionDateMs: toMs(raw.lastTransactionDate),
    virtual: raw.virtual,
  };
}
