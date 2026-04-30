/**
 * Single source of truth for the ReconciliationNote entity.
 * All per-entity representations (domain, IDB, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import { msToTs } from "./_helpers.js";
import type { ReconciliationNoteSeedData } from "../../seeds/firestore.js";
import type { SeedReconciliationNote } from "virtual:budget-seed-data";
import {
  RECONCILIATION_CLASSIFICATIONS,
  RECONCILIATION_ENTITY_TYPES,
  type ReconciliationClassification,
  type ReconciliationEntityType,
} from "../schema/enums.js";

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

function requireReconciliationClassification(value: unknown): ReconciliationClassification {
  if (!(RECONCILIATION_CLASSIFICATIONS as readonly unknown[]).includes(value)) {
    throw new DataIntegrityError(`Expected classification to be one of ${RECONCILIATION_CLASSIFICATIONS.join(", ")}, got ${value}`);
  }
  return value as ReconciliationClassification;
}

function requireReconciliationEntityType(value: unknown): ReconciliationEntityType {
  if (!(RECONCILIATION_ENTITY_TYPES as readonly unknown[]).includes(value)) {
    throw new DataIntegrityError(`Expected entityType to be one of ${RECONCILIATION_ENTITY_TYPES.join(", ")}, got ${value}`);
  }
  return value as ReconciliationEntityType;
}

// ── Firestore → ReconciliationNote ────────────────────────────────────────────

export function parseFirestoreReconciliationNote(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): ReconciliationNote {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    entityType: requireReconciliationEntityType(data.entityType),
    entityId: requireString(data.entityId, "entityId"),
    classification: requireReconciliationClassification(data.classification),
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
    updatedAt: msToTs(row.updatedAtMs) ?? Timestamp.fromMillis(row.updatedAtMs),
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

export function serializeSeedReconciliationNote(raw: ReconciliationNoteSeedData, id: string): SeedReconciliationNote {
  if (!(RECONCILIATION_ENTITY_TYPES as readonly unknown[]).includes(raw.entityType)) {
    throw new Error(`Invalid reconciliation entityType: ${raw.entityType}`);
  }
  const entityType = raw.entityType as ReconciliationEntityType;
  if (!(RECONCILIATION_CLASSIFICATIONS as readonly unknown[]).includes(raw.classification)) {
    throw new Error(`Invalid reconciliation classification: ${raw.classification}`);
  }
  const classification = raw.classification as ReconciliationClassification;
  return {
    id,
    entityType,
    entityId: requireSeedString(raw.entityId, "entityId"),
    classification,
    note: requireSeedString(raw.note, "note"),
    updatedAtMs: requireMs(raw.updatedAt, "updatedAt"),
    updatedBy: requireSeedString(raw.updatedBy, "updatedBy"),
  };
}
