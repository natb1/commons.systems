/**
 * Domain interface and read-path validator for the ReconciliationEvent entity.
 * Document id = `{institution}_{account}_{reconciledThroughYYYY-MM-DD}`.
 */
import { Timestamp } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  DataIntegrityError,
  optionalString,
  requireNumber,
  requireString,
  requireTimestamp,
} from "./_helpers.js";

// ── Domain interface ──────────────────────────────────────────────────────────

/** A completed account reconciliation event. Document id = `{institution}_{account}_{reconciledThroughYYYY-MM-DD}`. */
export interface ReconciliationEvent {
  readonly id: string;
  readonly institution: string;
  readonly account: string;
  readonly reconciledThroughDate: Timestamp;
  readonly bankBalance: number;
  readonly clearedBalance: number;
  readonly adjustment: number;
  readonly reconciledBy: string;
  readonly reconciledAt: Timestamp;
  readonly legIds: readonly string[];
  readonly adjustmentEntryId: string | null;
  readonly groupId: GroupId | null;
}

// ── Firestore → ReconciliationEvent ──────────────────────────────────────────

export function parseFirestoreReconciliationEvent(docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>): ReconciliationEvent {
  const data = docSnap.data();
  if (!Array.isArray(data.legIds) || data.legIds.some((x: unknown) => typeof x !== "string")) {
    throw new DataIntegrityError("Expected string[] for legIds");
  }
  return {
    id: docSnap.id,
    institution: requireString(data.institution, "institution"),
    account: requireString(data.account, "account"),
    reconciledThroughDate: requireTimestamp(data.reconciledThroughDate, "reconciledThroughDate"),
    bankBalance: requireNumber(data.bankBalance, "bankBalance"),
    clearedBalance: requireNumber(data.clearedBalance, "clearedBalance"),
    adjustment: requireNumber(data.adjustment, "adjustment"),
    reconciledBy: requireString(data.reconciledBy, "reconciledBy"),
    reconciledAt: requireTimestamp(data.reconciledAt, "reconciledAt"),
    legIds: data.legIds as string[],
    adjustmentEntryId: optionalString(data.adjustmentEntryId, "adjustmentEntryId"),
    groupId: optionalString(data.groupId, "groupId") as GroupId | null,
  };
}
