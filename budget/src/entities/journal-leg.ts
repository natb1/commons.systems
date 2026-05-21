/**
 * Single source of truth for the JournalLeg entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 * Flat collection — easier to query for all legs in account X in period Y.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  DataIntegrityError,
  msToTs,
  optionalString,
  optionalTimestamp,
  parseISOTimestamp,
  requireMs,
  requireNonNegativeNumber,
  requireSeedNonNegativeNumber,
  requireSeedString,
  requireString,
  requireTimestamp,
  requireUploadId,
  requireUploadNonNegativeNumber,
  requireUploadString,
  toMs,
  UploadValidationError,
} from "./_helpers.js";
import type { JournalLegSeedData } from "../../seeds/firestore.js";

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

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbJournalLeg {
  id: string;
  entryId: string;
  accountId: string;
  debit: number;
  credit: number;
  timestampMs: number;
  cleared: boolean;
  reconciledAtMs: number | null;
  reconciledEventId: string | null;
  statementItemId: string | null;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawJournalLeg {
  id: string;
  entryId: string;
  accountId: string;
  debit: number;
  credit: number;
  timestamp: string;
  cleared?: boolean;
  reconciledAt?: string | null;
  reconciledEventId?: string | null;
  statementItemId?: string | null;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { JournalLegSeedData };

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedJournalLeg {
  readonly id: string;
  readonly entryId: string;
  readonly accountId: string;
  readonly debit: number;
  readonly credit: number;
  readonly timestampMs: number;
  readonly cleared: boolean;
  readonly reconciledAtMs: number | null;
  readonly reconciledEventId: string | null;
  readonly statementItemId: string | null;
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

// ── Raw upload → JournalLeg ───────────────────────────────────────────────────

export function parseRawJournalLeg(s: RawJournalLeg, i: number): JournalLeg {
  const debit = requireUploadNonNegativeNumber(s.debit, "journal-leg", i, "debit");
  const credit = requireUploadNonNegativeNumber(s.credit, "journal-leg", i, "credit");
  if (debit > 0 && credit > 0) {
    throw new UploadValidationError(`Journal leg cannot have both a debit and a credit (debit=${debit}, credit=${credit})`);
  }
  return {
    id: requireUploadId(s.id, "journal-leg", i),
    entryId: requireUploadString(s.entryId, "journal-leg", i, "entryId"),
    accountId: requireUploadString(s.accountId, "journal-leg", i, "accountId"),
    debit,
    credit,
    timestamp: parseISOTimestamp(s.timestamp, `journal-leg[${i}].timestamp`),
    cleared: s.cleared === true,
    reconciledAt: s.reconciledAt
      ? parseISOTimestamp(s.reconciledAt, `journal-leg[${i}].reconciledAt`)
      : null,
    reconciledEventId: s.reconciledEventId ?? null,
    statementItemId: s.statementItemId ?? null,
    groupId: null as GroupId | null,
  };
}

// ── JournalLeg → IdbJournalLeg ────────────────────────────────────────────────

export function journalLegToIdbRecord(s: JournalLeg): IdbJournalLeg {
  return {
    id: s.id,
    entryId: s.entryId,
    accountId: s.accountId,
    debit: s.debit,
    credit: s.credit,
    timestampMs: s.timestamp.toMillis(),
    cleared: s.cleared,
    reconciledAtMs: s.reconciledAt?.toMillis() ?? null,
    reconciledEventId: s.reconciledEventId,
    statementItemId: s.statementItemId,
  };
}

// ── IdbJournalLeg → JournalLeg ────────────────────────────────────────────────

export function idbToJournalLeg(row: IdbJournalLeg): JournalLeg {
  return {
    id: row.id,
    entryId: row.entryId,
    accountId: row.accountId,
    debit: row.debit,
    credit: row.credit,
    timestamp: Timestamp.fromMillis(row.timestampMs),
    cleared: row.cleared,
    reconciledAt: msToTs(row.reconciledAtMs),
    reconciledEventId: row.reconciledEventId,
    statementItemId: row.statementItemId,
    groupId: null as GroupId | null,
  };
}

// ── IdbJournalLeg → RawJournalLeg (export) ────────────────────────────────────

export function journalLegToRawJson(s: IdbJournalLeg): object {
  return {
    id: s.id,
    entryId: s.entryId,
    accountId: s.accountId,
    debit: s.debit,
    credit: s.credit,
    timestamp: new Date(s.timestampMs).toISOString(),
    cleared: s.cleared,
    reconciledAt: s.reconciledAtMs != null
      ? new Date(s.reconciledAtMs).toISOString()
      : null,
    reconciledEventId: s.reconciledEventId ?? null,
    statementItemId: s.statementItemId ?? null,
  };
}

// ── JournalLegSeedData → SeedJournalLeg (build-time) ─────────────────────────

export function serializeSeedJournalLeg(raw: JournalLegSeedData, id: string): SeedJournalLeg {
  return {
    id,
    entryId: requireSeedString(raw.entryId, "entryId"),
    accountId: requireSeedString(raw.accountId, "accountId"),
    debit: requireSeedNonNegativeNumber(raw.debit, "debit"),
    credit: requireSeedNonNegativeNumber(raw.credit, "credit"),
    timestampMs: requireMs(raw.timestamp, "timestamp"),
    cleared: raw.cleared,
    reconciledAtMs: toMs(raw.reconciledAt),
    reconciledEventId: raw.reconciledEventId,
    statementItemId: raw.statementItemId,
  };
}
