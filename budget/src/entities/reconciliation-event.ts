/**
 * Single source of truth for the ReconciliationEvent entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 * Document id = `{institution}_{account}_{reconciledThroughYYYY-MM-DD}`.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  optionalString,
  parseISOTimestamp,
  requireMs,
  requireNumber,
  requireSeedNumber,
  requireSeedString,
  requireString,
  requireStringArray,
  requireTimestamp,
  requireUploadFiniteNumber,
  requireUploadId,
  requireUploadString,
  requireUploadStringArray,
} from "./_helpers.js";
import type { ReconciliationEventSeedData } from "../../seeds/firestore.js";

// ── Domain interface ──────────────────────────────────────────────────────────

/** A completed account reconciliation event. Document id = `{institution}_{account}_{reconciledThroughYYYY-MM-DD}`. */
export interface ReconciliationEvent {
  readonly id: string;
  readonly institution: string;
  readonly account: string;
  readonly reconciledThroughDate: Timestamp;
  readonly bankBalance: number;
  readonly clearedBalance: number;
  readonly adjustment: number;
  readonly reconciledBy: string;
  readonly reconciledAt: Timestamp;
  readonly legIds: readonly string[];
  readonly adjustmentEntryId: string | null;
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbReconciliationEvent {
  id: string;
  institution: string;
  account: string;
  reconciledThroughDateMs: number;
  bankBalance: number;
  clearedBalance: number;
  adjustment: number;
  reconciledBy: string;
  reconciledAtMs: number;
  legIds: string[];
  adjustmentEntryId: string | null;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawReconciliationEvent {
  id: string;
  institution: string;
  account: string;
  reconciledThroughDate: string;
  bankBalance: number;
  clearedBalance: number;
  adjustment: number;
  reconciledBy: string;
  reconciledAt: string;
  legIds: string[];
  adjustmentEntryId?: string | null;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { ReconciliationEventSeedData };

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedReconciliationEvent {
  readonly id: string;
  readonly institution: string;
  readonly account: string;
  readonly reconciledThroughDateMs: number;
  readonly bankBalance: number;
  readonly clearedBalance: number;
  readonly adjustment: number;
  readonly reconciledBy: string;
  readonly reconciledAtMs: number;
  readonly legIds: string[];
  readonly adjustmentEntryId: string | null;
}

// ── Firestore → ReconciliationEvent ──────────────────────────────────────────

export function parseFirestoreReconciliationEvent(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): ReconciliationEvent {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    institution: requireString(data.institution, "institution"),
    account: requireString(data.account, "account"),
    reconciledThroughDate: requireTimestamp(data.reconciledThroughDate, "reconciledThroughDate"),
    bankBalance: requireNumber(data.bankBalance, "bankBalance"),
    clearedBalance: requireNumber(data.clearedBalance, "clearedBalance"),
    adjustment: requireNumber(data.adjustment, "adjustment"),
    reconciledBy: requireString(data.reconciledBy, "reconciledBy"),
    reconciledAt: requireTimestamp(data.reconciledAt, "reconciledAt"),
    legIds: requireStringArray(data.legIds, "legIds"),
    adjustmentEntryId: optionalString(data.adjustmentEntryId, "adjustmentEntryId"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → ReconciliationEvent ─────────────────────────────────────────

export function parseRawReconciliationEvent(s: RawReconciliationEvent, i: number): ReconciliationEvent {
  return {
    id: requireUploadId(s.id, "reconciliation-event", i),
    institution: requireUploadString(s.institution, "reconciliation-event", i, "institution"),
    account: requireUploadString(s.account, "reconciliation-event", i, "account"),
    reconciledThroughDate: parseISOTimestamp(s.reconciledThroughDate, `reconciliation-event[${i}].reconciledThroughDate`),
    bankBalance: requireUploadFiniteNumber(s.bankBalance, "reconciliation-event", i, "bankBalance"),
    clearedBalance: requireUploadFiniteNumber(s.clearedBalance, "reconciliation-event", i, "clearedBalance"),
    adjustment: requireUploadFiniteNumber(s.adjustment, "reconciliation-event", i, "adjustment"),
    reconciledBy: requireUploadString(s.reconciledBy, "reconciliation-event", i, "reconciledBy"),
    reconciledAt: parseISOTimestamp(s.reconciledAt, `reconciliation-event[${i}].reconciledAt`),
    legIds: requireUploadStringArray(s.legIds, "reconciliation-event", i, "legIds"),
    adjustmentEntryId: s.adjustmentEntryId ?? null,
    groupId: null as GroupId | null,
  };
}

// ── ReconciliationEvent → IdbReconciliationEvent ──────────────────────────────

export function reconciliationEventToIdbRecord(s: ReconciliationEvent): IdbReconciliationEvent {
  return {
    id: s.id,
    institution: s.institution,
    account: s.account,
    reconciledThroughDateMs: s.reconciledThroughDate.toMillis(),
    bankBalance: s.bankBalance,
    clearedBalance: s.clearedBalance,
    adjustment: s.adjustment,
    reconciledBy: s.reconciledBy,
    reconciledAtMs: s.reconciledAt.toMillis(),
    legIds: [...s.legIds],
    adjustmentEntryId: s.adjustmentEntryId,
  };
}

// ── IdbReconciliationEvent → ReconciliationEvent ──────────────────────────────

export function idbToReconciliationEvent(row: IdbReconciliationEvent): ReconciliationEvent {
  return {
    id: row.id,
    institution: row.institution,
    account: row.account,
    reconciledThroughDate: Timestamp.fromMillis(row.reconciledThroughDateMs),
    bankBalance: row.bankBalance,
    clearedBalance: row.clearedBalance,
    adjustment: row.adjustment,
    reconciledBy: row.reconciledBy,
    reconciledAt: Timestamp.fromMillis(row.reconciledAtMs),
    legIds: row.legIds,
    adjustmentEntryId: row.adjustmentEntryId,
    groupId: null as GroupId | null,
  };
}

// ── IdbReconciliationEvent → RawReconciliationEvent (export) ──────────────────

export function reconciliationEventToRawJson(s: IdbReconciliationEvent): object {
  return {
    id: s.id,
    institution: s.institution,
    account: s.account,
    reconciledThroughDate: new Date(s.reconciledThroughDateMs).toISOString(),
    bankBalance: s.bankBalance,
    clearedBalance: s.clearedBalance,
    adjustment: s.adjustment,
    reconciledBy: s.reconciledBy,
    reconciledAt: new Date(s.reconciledAtMs).toISOString(),
    legIds: s.legIds,
    adjustmentEntryId: s.adjustmentEntryId ?? null,
  };
}

// ── ReconciliationEventSeedData → SeedReconciliationEvent (build-time) ────────

export function serializeSeedReconciliationEvent(raw: ReconciliationEventSeedData, id: string): SeedReconciliationEvent {
  return {
    id,
    institution: requireSeedString(raw.institution, "institution"),
    account: requireSeedString(raw.account, "account"),
    reconciledThroughDateMs: requireMs(raw.reconciledThroughDate, "reconciledThroughDate"),
    bankBalance: requireSeedNumber(raw.bankBalance, "bankBalance"),
    clearedBalance: requireSeedNumber(raw.clearedBalance, "clearedBalance"),
    adjustment: requireSeedNumber(raw.adjustment, "adjustment"),
    reconciledBy: requireSeedString(raw.reconciledBy, "reconciledBy"),
    reconciledAtMs: requireMs(raw.reconciledAt, "reconciledAt"),
    legIds: raw.legIds as string[],
    adjustmentEntryId: raw.adjustmentEntryId,
  };
}
