/**
 * Single source of truth for the Statement entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import type { Timestamp, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import {
  msToTs,
  optionalString,
  optionalTimestamp,
  parseISOTimestamp,
  requireNumber,
  requireSeedNumber,
  requireSeedString,
  requireString,
  requireUploadFiniteNumber,
  requireUploadId,
  requireUploadString,
  toMs,
} from "./_helpers.js";
import type { StatementSeedData } from "../../seeds/firestore.js";

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

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedStatement {
  readonly id: string;
  readonly statementId: string;
  readonly institution: string;
  readonly account: string;
  readonly balance: number;
  readonly period: string;
  readonly balanceDate: string | null;
  readonly lastTransactionDateMs: number | null;
  readonly virtual: boolean;
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
      ? parseISOTimestamp(s.lastTransactionDate, `statement[${i}].lastTransactionDate`)
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
