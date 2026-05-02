/**
 * Single source of truth for the ReconciliationNote entity.
 * All per-entity representations (domain, IDB, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  optionalString,
  requireEnum,
  requireMs,
  requireSeedEnum,
  requireSeedString,
  requireString,
  requireTimestamp,
} from "./_helpers.js";
import type { ReconciliationNoteSeedData } from "../../seeds/firestore.js";
import {
  RECONCILIATION_CLASSIFICATIONS,
  RECONCILIATION_ENTITY_TYPES,
  type ReconciliationClassification,
  type ReconciliationEntityType,
} from "../schema/enums.js";

// No upload/Raw shape — upload pipeline doesn't ingest these yet.

// ── Domain interface ──────────────────────────────────────────────────────────

/** User annotation on an unmatched reconciliation entity. Document id = `{entityType}_{entityId}`. */
export interface ReconciliationNote {
  readonly id: string;
  readonly entityType: ReconciliationEntityType;
  readonly entityId: string;
  readonly classification: ReconciliationClassification;
  readonly note: string;
  readonly updatedAt: Timestamp;
  readonly updatedBy: string;
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbReconciliationNote {
  id: string;
  entityType: ReconciliationEntityType;
  entityId: string;
  classification: ReconciliationClassification;
  note: string;
  updatedAtMs: number;
  updatedBy: string;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { ReconciliationNoteSeedData };

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedReconciliationNote {
  readonly id: string;
  readonly entityType: ReconciliationEntityType;
  readonly entityId: string;
  readonly classification: ReconciliationClassification;
  readonly note: string;
  readonly updatedAtMs: number;
  readonly updatedBy: string;
}

// ── Firestore → ReconciliationNote ────────────────────────────────────────────

export function parseFirestoreReconciliationNote(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): ReconciliationNote {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    entityType: requireEnum(data.entityType, RECONCILIATION_ENTITY_TYPES, "entityType"),
    entityId: requireString(data.entityId, "entityId"),
    classification: requireEnum(data.classification, RECONCILIATION_CLASSIFICATIONS, "classification"),
    // Preserves existing tolerance for non-string note field (existing inconsistency in Firestore data).
    note: typeof data.note === "string" ? data.note : "",
    updatedAt: requireTimestamp(data.updatedAt, "updatedAt"),
    updatedBy: requireString(data.updatedBy, "updatedBy"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── ReconciliationNote → IdbReconciliationNote ────────────────────────────────

export function reconciliationNoteToIdbRecord(n: ReconciliationNote): IdbReconciliationNote {
  return {
    id: n.id,
    entityType: n.entityType,
    entityId: n.entityId,
    classification: n.classification,
    note: n.note,
    updatedAtMs: n.updatedAt.toMillis(),
    updatedBy: n.updatedBy,
  };
}

// ── IdbReconciliationNote → ReconciliationNote ────────────────────────────────

export function idbToReconciliationNote(row: IdbReconciliationNote): ReconciliationNote {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    classification: row.classification,
    note: row.note,
    updatedAt: Timestamp.fromMillis(row.updatedAtMs),
    updatedBy: row.updatedBy,
    groupId: null as GroupId | null,
  };
}

// ── IdbReconciliationNote → export JSON ───────────────────────────────────────

export function reconciliationNoteToRawJson(n: IdbReconciliationNote): object {
  return {
    id: n.id,
    entityType: n.entityType,
    entityId: n.entityId,
    classification: n.classification,
    note: n.note,
    updatedAt: new Date(n.updatedAtMs).toISOString(),
    updatedBy: n.updatedBy,
  };
}

// ── ReconciliationNoteSeedData → SeedReconciliationNote (build-time) ──────────

export function serializeSeedReconciliationNote(raw: ReconciliationNoteSeedData, id: string): SeedReconciliationNote {
  return {
    id,
    entityType: requireSeedEnum(raw.entityType, RECONCILIATION_ENTITY_TYPES, "entityType"),
    entityId: requireSeedString(raw.entityId, "entityId"),
    classification: requireSeedEnum(raw.classification, RECONCILIATION_CLASSIFICATIONS, "classification"),
    note: requireSeedString(raw.note, "note"),
    updatedAtMs: requireMs(raw.updatedAt, "updatedAt"),
    updatedBy: requireSeedString(raw.updatedBy, "updatedBy"),
  };
}
