/**
 * Single source of truth for the StatementItem entity.
 * All per-entity representations (domain, IDB, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import { msToTs } from "./_helpers.js";
import type { StatementItemSeedData } from "../../seeds/firestore.js";
import type { SeedStatementItem } from "virtual:budget-seed-data";
import type { StatementId } from "./statement.js";

// No upload/Raw shape — upload pipeline doesn't ingest these yet.

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

export type StatementItemId = Brand<"StatementItemId">;

// ── Domain interface ──────────────────────────────────────────────────────────

/**
 * Immutable bank-record line item. One document per OFX transaction line.
 * Amount uses the raw bank sign convention: negative = debit, positive = credit.
 * Transactions invert this (positive = spending), so reconciliation must sign-flip when matching.
 */
export interface StatementItem {
  readonly id: string;
  readonly statementItemId: StatementItemId;
  readonly statementId: StatementId;
  readonly institution: string;
  readonly account: string;
  readonly period: string;
  readonly amount: number;
  readonly timestamp: Timestamp;
  readonly description: string;
  readonly fitid: string;
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbStatementItem {
  id: string;
  statementItemId: string;
  statementId: string;
  institution: string;
  account: string;
  period: string;
  amount: number;
  timestampMs: number;
  description: string;
  fitid: string;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { StatementItemSeedData };

// ── Internal helpers ──────────────────────────────────────────────────────────

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  return requireString(value, field);
}

function requireTimestamp(value: unknown, field: string): Timestamp {
  if (value == null || !(value instanceof Timestamp)) {
    throw new DataIntegrityError(`Expected Timestamp for ${field}, got ${value == null ? "null" : typeof value}`);
  }
  return value;
}

// ── Firestore → StatementItem ─────────────────────────────────────────────────

export function parseFirestoreStatementItem(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): StatementItem {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    statementItemId: requireString(data.statementItemId, "statementItemId") as StatementItemId,
    statementId: requireString(data.statementId, "statementId") as StatementId,
    institution: requireString(data.institution, "institution"),
    account: requireString(data.account, "account"),
    period: requireString(data.period, "period"),
    amount: requireNumber(data.amount, "amount"),
    timestamp: requireTimestamp(data.timestamp, "timestamp"),
    description: requireString(data.description, "description"),
    fitid: requireString(data.fitid, "fitid"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── StatementItem → IdbStatementItem ──────────────────────────────────────────

export function statementItemToIdbRecord(item: StatementItem): IdbStatementItem {
  return {
    id: item.id,
    statementItemId: item.statementItemId,
    statementId: item.statementId,
    institution: item.institution,
    account: item.account,
    period: item.period,
    amount: item.amount,
    timestampMs: item.timestamp.toMillis(),
    description: item.description,
    fitid: item.fitid,
  };
}

// ── IdbStatementItem → StatementItem ──────────────────────────────────────────

export function idbToStatementItem(row: IdbStatementItem): StatementItem {
  return {
    id: row.id,
    statementItemId: row.statementItemId as StatementItemId,
    statementId: row.statementId as StatementId,
    institution: row.institution,
    account: row.account,
    period: row.period,
    amount: row.amount,
    timestamp: msToTs(row.timestampMs) ?? Timestamp.fromMillis(row.timestampMs),
    description: row.description,
    fitid: row.fitid,
    groupId: null as GroupId | null,
  };
}

// ── IdbStatementItem → export JSON ────────────────────────────────────────────

export function statementItemToRawJson(i: IdbStatementItem): object {
  return {
    id: i.id,
    statementItemId: i.statementItemId,
    statementId: i.statementId,
    institution: i.institution,
    account: i.account,
    period: i.period,
    amount: i.amount,
    timestamp: new Date(i.timestampMs).toISOString(),
    description: i.description,
    fitid: i.fitid,
  };
}

// ── StatementItemSeedData → SeedStatementItem (build-time) ────────────────────

function toMs(d: unknown): number | null {
  if (d instanceof Date) return d.getTime();
  if (d != null && typeof d === "object" && "toMillis" in d) return (d as { toMillis(): number }).toMillis();
  return null;
}

function requireMs(d: unknown, field: string): number {
  const ms = toMs(d);
  if (ms === null) throw new Error(`Expected Date or Timestamp for ${field}, got ${d}`);
  return ms;
}

function requireSeedString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Expected string for ${field}, got ${typeof value}`);
  return value;
}

function requireSeedNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Expected finite number for ${field}, got ${value}`);
  return value;
}

export function serializeSeedStatementItem(raw: StatementItemSeedData, id: string): SeedStatementItem {
  return {
    id,
    statementItemId: requireSeedString(raw.statementItemId, "statementItemId"),
    statementId: requireSeedString(raw.statementId, "statementId"),
    institution: requireSeedString(raw.institution, "institution"),
    account: requireSeedString(raw.account, "account"),
    period: requireSeedString(raw.period, "period"),
    amount: requireSeedNumber(raw.amount, "amount"),
    timestampMs: requireMs(raw.timestamp, "timestamp"),
    description: requireSeedString(raw.description, "description"),
    fitid: requireSeedString(raw.fitid, "fitid"),
  };
}
