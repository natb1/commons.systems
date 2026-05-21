/**
 * Domain interface and read-path validator for the Account entity.
 * Document id = `{institution}_{account}`.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  optionalNumber,
  optionalString,
  optionalTimestamp,
  requireEnum,
  requireString,
} from "./_helpers.js";
import { ACCOUNT_TYPES, type AccountType } from "../schema/enums.js";

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
