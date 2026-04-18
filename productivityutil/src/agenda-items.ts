import type { Timestamp } from "firebase/firestore";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import type { GroupId } from "@commons-systems/authutil/groups";
import { requireString, requireOneOf } from "@commons-systems/firestoreutil/validate";
import {
  optionalTimestamp,
  requireTimestamp,
  requireGroupId,
  requireMemberEmails,
} from "./validate.js";

export type AgendaItemId = Brand<"AgendaItemId">;

export const AGENDA_ITEM_STATUSES = ["todo", "done"] as const;
export type AgendaItemStatus = (typeof AGENDA_ITEM_STATUSES)[number];

export interface AgendaItem {
  readonly id: AgendaItemId;
  readonly title: string;
  readonly notes: string;
  readonly scheduledAt: Timestamp | null;
  readonly status: AgendaItemStatus;
  readonly groupId: GroupId;
  readonly memberEmails: readonly string[];
  readonly createdAt: Timestamp;
}

export function requireAgendaItem(id: string, data: unknown): AgendaItem {
  if (data == null || typeof data !== "object") {
    throw new TypeError(`Expected object for agenda item ${id}, got ${typeof data}`);
  }
  const d = data as Record<string, unknown>;
  return {
    id: id as AgendaItemId,
    title: requireString(d.title, "title"),
    notes: requireString(d.notes, "notes"),
    scheduledAt: optionalTimestamp(d.scheduledAt, "scheduledAt"),
    status: requireOneOf(d.status, AGENDA_ITEM_STATUSES, "status"),
    groupId: requireGroupId(d.groupId, "groupId"),
    memberEmails: requireMemberEmails(d.memberEmails),
    createdAt: requireTimestamp(d.createdAt, "createdAt"),
  };
}
