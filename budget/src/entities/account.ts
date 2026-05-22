/**
 * Single source of truth for the Account entity.
 * Account is a read-only entity: it has Firestore read, IDB storage, upload parse,
 * and seed declaration layers, but no export path (not in exportToJson).
 * All per-entity representations are defined or imported here; adaptor functions live alongside them.
 * Document id = `{institution}_{account}`.
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

/** A financial account (checking, credit card, savings, etc.). Document id = `{institution}_{account}`. */
export interface Account {
  readonly id: string;
  readonly institution: string;
  readonly account: string;
  readonly accountType: AccountType;
  readonly openingBalance: number | null;
  readonly openingBalanceDate: Timestamp | null;
  readonly groupId: GroupId | null;
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
  openingBalance: number | null;
  openingBalanceDate: string | null;
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

export function parseRawAccount(a: RawAccount, i: number): Account {
  return {
    id: requireUploadId(a.id, "account", i),
    institution: requireUploadString(a.institution, "account", i, "institution"),
    account: requireUploadString(a.account, "account", i, "account"),
    accountType: requireUploadEnum(a.accountType, ACCOUNT_TYPES, "account.accountType"),
    openingBalance:
      a.openingBalance == null
        ? null
        : requireUploadFiniteNumber(a.openingBalance, "account", i, "openingBalance"),
    openingBalanceDate: a.openingBalanceDate
      ? parseISOTimestamp(a.openingBalanceDate, "account.openingBalanceDate")
      : null,
    groupId: null as GroupId | null,
  };
}

// ── Account → IdbAccount ─────────────────────────────────────────────────────

export function accountToIdbRecord(a: Account): IdbAccount {
  return {
    id: a.id,
    institution: a.institution,
    account: a.account,
    accountType: a.accountType,
    openingBalance: a.openingBalance,
    openingBalanceDateMs: a.openingBalanceDate?.toMillis() ?? null,
  };
}

// ── IdbAccount → Account ─────────────────────────────────────────────────────

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

// ── AccountSeedData → SeedAccount (build-time) ───────────────────────────────

export function serializeSeedAccount(raw: AccountSeedData, id: string): SeedAccount {
  return {
    id,
    institution: requireSeedString(raw.institution, "institution"),
    account: requireSeedString(raw.account, "account"),
    accountType: raw.accountType,
    openingBalance: raw.openingBalance,
    openingBalanceDateMs: toMs(raw.openingBalanceDate),
  };
}
