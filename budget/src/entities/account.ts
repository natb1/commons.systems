/**
 * Single source of truth for the Account entity.
 * All per-entity representations (domain, IDB, raw/upload, seed declaration, seed data)
 * are defined or imported here; adaptor functions live alongside them.
 * Document id = percent-escape `%`→`%25` then `_`→`%5F` in each component, join with `_`.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  msToTs,
  optionalNumber,
  optionalString,
  optionalTimestamp,
  parseISOTimestamp,
  requireEnum,
  requireSeedEnum,
  requireSeedString,
  requireString,
  requireUploadEnum,
  requireUploadFiniteNumber,
  requireUploadId,
  requireUploadString,
  toMs,
} from "./_helpers.js";
import { ACCOUNT_TYPES, type AccountType } from "../schema/enums.js";
import type { AccountSeedData } from "../../seeds/firestore.js";

// ── Domain interface ──────────────────────────────────────────────────────────

/** A financial account (checking, credit card, savings, etc.). Document id = percent-escaped components joined with `_`. */
export interface Account {
  readonly id: string;
  readonly institution: string;
  readonly account: string;
  readonly accountType: AccountType;
  readonly openingBalance: number | null;
  readonly openingBalanceDate: Timestamp | null;
  readonly groupId: GroupId | null;
}

// ── Document id ───────────────────────────────────────────────────────────────

/**
 * The Firestore document id for an account.
 *
 * Each component is percent-escaped: `%` → `%25` first, then `_` → `%5F`.
 * The two escaped components are then joined with a literal `_`.
 *
 * This matches the Go `journal.AccountID` encoder byte-for-byte, ensuring
 * the etl↔app join is injective even when a component contains `_` or `%`.
 * Backwards-compatible: no existing component contains `_` or `%`, so all
 * existing ids are unchanged.
 */
export function accountDocId(institution: string, account: string): string {
  const esc = (s: string) => s.replace(/%/g, "%25").replace(/_/g, "%5F");
  return `${esc(institution)}_${esc(account)}`;
}

// ── IDB storage interface ─────────────────────────────────────────────────────

export interface IdbAccount {
  id: string;
  institution: string;
  account: string;
  accountType: AccountType;
  openingBalance: number | null;
  openingBalanceDateMs: number | null;
}

// ── Raw upload interface ──────────────────────────────────────────────────────

export interface RawAccount {
  id: string;
  institution: string;
  account: string;
  accountType: string;
  openingBalance?: number | null;
  openingBalanceDate?: string | null;
}

// ── Seed data type alias ──────────────────────────────────────────────────────
export type { AccountSeedData };

// ── Seed output type ──────────────────────────────────────────────────────────
// Defined here so budget-seed-data.d.ts can re-export it without circular refs.
export interface SeedAccount {
  readonly id: string;
  readonly institution: string;
  readonly account: string;
  readonly accountType: AccountType;
  readonly openingBalance: number | null;
  readonly openingBalanceDateMs: number | null;
}

// ── Firestore → Account ───────────────────────────────────────────────────────

/**
 * @public knip baseline (#2066): residual unused export, not deleted per the
 * no-bulk-delete line — part of the symmetric per-entity parseFirestore* set.
 * Deletion candidate; see PR notes.
 */
export function parseFirestoreAccount(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): Account {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    institution: requireString(data.institution, "institution"),
    account: requireString(data.account, "account"),
    accountType: requireEnum(data.accountType, ACCOUNT_TYPES, "accountType"),
    openingBalance: optionalNumber(data.openingBalance, "openingBalance"),
    openingBalanceDate: optionalTimestamp(data.openingBalanceDate, "openingBalanceDate"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}

// ── Raw upload → Account ──────────────────────────────────────────────────────

export function parseRawAccount(s: RawAccount, i: number): Account {
  return {
    id: requireUploadId(s.id, "account", i),
    institution: requireUploadString(s.institution, "account", i, "institution"),
    account: requireUploadString(s.account, "account", i, "account"),
    accountType: requireUploadEnum(s.accountType, ACCOUNT_TYPES, `account[${i}].accountType`),
    openingBalance: s.openingBalance != null
      ? requireUploadFiniteNumber(s.openingBalance, "account", i, "openingBalance")
      : null,
    openingBalanceDate: s.openingBalanceDate
      ? parseISOTimestamp(s.openingBalanceDate, `account[${i}].openingBalanceDate`)
      : null,
    groupId: null as GroupId | null,
  };
}

// ── Account → IdbAccount ──────────────────────────────────────────────────────

export function accountToIdbRecord(s: Account): IdbAccount {
  return {
    id: s.id,
    institution: s.institution,
    account: s.account,
    accountType: s.accountType,
    openingBalance: s.openingBalance,
    openingBalanceDateMs: s.openingBalanceDate?.toMillis() ?? null,
  };
}

// ── IdbAccount → Account ──────────────────────────────────────────────────────

export function idbToAccount(row: IdbAccount): Account {
  return {
    id: row.id,
    institution: row.institution,
    account: row.account,
    accountType: row.accountType,
    openingBalance: row.openingBalance,
    openingBalanceDate: msToTs(row.openingBalanceDateMs),
    groupId: null as GroupId | null,
  };
}

// ── IdbAccount → RawAccount (export) ─────────────────────────────────────────

export function accountToRawJson(s: IdbAccount): object {
  return {
    id: s.id,
    institution: s.institution,
    account: s.account,
    accountType: s.accountType,
    openingBalance: s.openingBalance,
    openingBalanceDate: s.openingBalanceDateMs != null
      ? new Date(s.openingBalanceDateMs).toISOString()
      : null,
  };
}

// ── AccountSeedData → SeedAccount (build-time) ────────────────────────────────

export function serializeSeedAccount(raw: AccountSeedData, id: string): SeedAccount {
  return {
    id,
    institution: requireSeedString(raw.institution, "institution"),
    account: requireSeedString(raw.account, "account"),
    accountType: requireSeedEnum(raw.accountType, ACCOUNT_TYPES, "accountType"),
    openingBalance: raw.openingBalance,
    openingBalanceDateMs: toMs(raw.openingBalanceDate),
  };
}
