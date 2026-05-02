/**
 * Single source of truth for the StatementItem entity.
 * All per-entity representations (domain, IDB, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import {
  optionalString,
  requireMs,
  requireNumber,
  requireSeedNumber,
  requireSeedString,
  requireString,
  requireTimestamp,
} from "./_helpers.js";
import type { StatementItemSeedData } from "../../seeds/firestore.js";
import type { StatementId } from "./statement.js";

// No upload/Raw shape — upload pipeline doesn't ingest these yet.

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

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedStatementItem {
  readonly id: string;
  readonly statementItemId: string;
  readonly statementId: string;
  readonly institution: string;
  readonly account: string;
  readonly period: string;
  readonly amount: number;
  readonly timestampMs: number;
  readonly description: string;
  readonly fitid: string;
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
    timestamp: Timestamp.fromMillis(row.timestampMs),
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
