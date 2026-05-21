/**
 * Domain interface and read-path validator for the JournalEntry entity.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  optionalString,
  requireNumber,
  requireString,
  requireTimestamp,
} from "./_helpers.js";

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
