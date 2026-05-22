/**
 * Single source of truth for the JournalEntry entity.
 * JournalEntry is a read-only entity: it has Firestore read, IDB storage, upload parse,
 * and seed declaration layers, but no export path (not in exportToJson).
 * All per-entity representations are defined or imported here; adaptor functions live alongside them.
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
  requireUploadFiniteNumber,
  requireUploadId,
  requireUploadString,
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
  note: string | null;
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

export function parseRawJournalEntry(e: RawJournalEntry, i: number): JournalEntry {
  return {
    id: requireUploadId(e.id, "journalEntry", i),
    timestamp: parseISOTimestamp(e.timestamp, "journalEntry.timestamp"),
    description: requireUploadString(e.description, "journalEntry", i, "description"),
    note: e.note == null ? null : e.note,
    legCount: requireUploadFiniteNumber(e.legCount, "journalEntry", i, "legCount"),
    groupId: null as GroupId | null,
  };
}

// ── JournalEntry → IdbJournalEntry ───────────────────────────────────────────

export function journalEntryToIdbRecord(e: JournalEntry): IdbJournalEntry {
  return {
    id: e.id,
    timestampMs: e.timestamp.toMillis(),
    description: e.description,
    note: e.note,
    legCount: e.legCount,
  };
}

// ── IdbJournalEntry → JournalEntry ───────────────────────────────────────────

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
