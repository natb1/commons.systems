/**
 * Domain interface and read-path validator for the JournalLeg entity.
 * Flat collection — easier to query for all legs in account X in period Y.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  DataIntegrityError,
  optionalString,
  optionalTimestamp,
  requireNonNegativeNumber,
  requireString,
  requireTimestamp,
} from "./_helpers.js";

// ── Domain interface ──────────────────────────────────────────────────────────

/** A single leg of a double-entry journal entry. Flat collection for efficient account+period queries. */
export interface JournalLeg {
  readonly id: string;
  readonly entryId: string;
  readonly accountId: string;
  readonly debit: number;
  readonly credit: number;
  readonly timestamp: Timestamp;
  readonly cleared: boolean;
  readonly reconciledAt: Timestamp | null;
  readonly reconciledEventId: string | null;
  readonly statementItemId: string | null;
  readonly groupId: GroupId | null;
}

// ── Firestore → JournalLeg ────────────────────────────────────────────────────

export function parseFirestoreJournalLeg(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): JournalLeg {
  const data = docSnap.data();
  const debit = requireNonNegativeNumber(data.debit, "debit");
  const credit = requireNonNegativeNumber(data.credit, "credit");
  if (debit > 0 && credit > 0) {
    throw new DataIntegrityError(`Journal leg cannot have both a debit and a credit (debit=${debit}, credit=${credit})`);
  }
  return {
    id: docSnap.id,
    entryId: requireString(data.entryId, "entryId"),
    accountId: requireString(data.accountId, "accountId"),
    debit,
    credit,
    timestamp: requireTimestamp(data.timestamp, "timestamp"),
    cleared: data.cleared === true,
    reconciledAt: optionalTimestamp(data.reconciledAt, "reconciledAt"),
    reconciledEventId: optionalString(data.reconciledEventId, "reconciledEventId"),
    statementItemId: optionalString(data.statementItemId, "statementItemId"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}
