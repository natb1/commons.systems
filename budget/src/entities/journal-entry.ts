/**
 * Single source of truth for the JournalEntry entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
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
  requireTimestamp,
} from "./_helpers.js";
import type { JournalEntrySeedData } from "../../seeds/firestore.js";

// ── Domain interface ──────────────────────────────────────────────────────────

/** A double-entry journal entry representing a single financial event. */
export interface JournalEntry {
  readonly id: string;
  readonly timestamp: Timestamp;
  readonly description: string;
  readonly note: string | null;
  readonly legCount: number;
  readonly groupId: GroupId | null;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbJournalEntry {
  id: string;
  timestampMs: number;
  description: string;
  note: string | null;
  legCount: number;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawJournalEntry {
  id: string;
  timestamp: string;
  description: string;
  note?: string | null;
  legCount: number;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { JournalEntrySeedData };

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedJournalEntry {
  readonly id: string;
  readonly timestampMs: number;
  readonly description: string;
  readonly note: string | null;
  readonly legCount: number;
}

// ── Firestore → JournalEntry ──────────────────────────────────────────────────

export function parseFirestoreJournalEntry(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): JournalEntry {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    timestamp: requireTimestamp(data.timestamp, "timestamp"),
    description: requireString(data.description, "description"),
    note: optionalString(data.note, "note"),
    legCount: requireNumber(data.legCount, "legCount"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → JournalEntry ─────────────────────────────────────────────────

export function parseRawJournalEntry(s: RawJournalEntry, i: number): JournalEntry {
  return {
    id: typeof s.id === "string" && s.id !== "" ? s.id : (() => { throw new Error(`journal-entry[${i}] is missing a valid id`); })(),
    timestamp: parseISOTimestamp(s.timestamp, `journal-entry[${i}].timestamp`),
    description: typeof s.description === "string" && s.description !== "" ? s.description : (() => { throw new Error(`journal-entry[${i}].description is missing or empty`); })(),
    note: s.note ?? null,
    legCount: typeof s.legCount === "number" && Number.isFinite(s.legCount) ? s.legCount : (() => { throw new Error(`journal-entry[${i}].legCount must be a finite number`); })(),
    groupId: null as GroupId | null,
  };
}

// ── JournalEntry → IdbJournalEntry ────────────────────────────────────────────

export function journalEntryToIdbRecord(s: JournalEntry): IdbJournalEntry {
  return {
    id: s.id,
    timestampMs: s.timestamp.toMillis(),
    description: s.description,
    note: s.note,
    legCount: s.legCount,
  };
}

// ── IdbJournalEntry → JournalEntry ────────────────────────────────────────────

export function idbToJournalEntry(row: IdbJournalEntry): JournalEntry {
  return {
    id: row.id,
    timestamp: Timestamp.fromMillis(row.timestampMs),
    description: row.description,
    note: row.note,
    legCount: row.legCount,
    groupId: null as GroupId | null,
  };
}

// ── IdbJournalEntry → RawJournalEntry (export) ────────────────────────────────

export function journalEntryToRawJson(s: IdbJournalEntry): object {
  return {
    id: s.id,
    timestamp: new Date(s.timestampMs).toISOString(),
    description: s.description,
    note: s.note ?? null,
    legCount: s.legCount,
  };
}

// ── JournalEntrySeedData → SeedJournalEntry (build-time) ─────────────────────

export function serializeSeedJournalEntry(raw: JournalEntrySeedData, id: string): SeedJournalEntry {
  return {
    id,
    timestampMs: requireMs(raw.timestamp, "timestamp"),
    description: requireSeedString(raw.description, "description"),
    note: raw.note,
    legCount: requireSeedNumber(raw.legCount, "legCount"),
  };
}
