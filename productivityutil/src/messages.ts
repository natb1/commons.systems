import type { Timestamp } from "firebase/firestore";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  requireString,
  requireBoolean,
  requireOneOf,
} from "@commons-systems/firestoreutil/validate";
import {
  requireTimestamp,
  requireGroupId,
  requireMemberEmails,
} from "./validate.js";

export type MessageId = Brand<"MessageId">;

export const MESSAGE_SOURCES = ["discord", "email", "claude-session"] as const;
export type MessageSource = (typeof MESSAGE_SOURCES)[number];

export interface Message {
  readonly id: MessageId;
  readonly source: MessageSource;
  readonly sourceKey: string;
  readonly sender: string;
  readonly body: string;
  readonly sentAt: Timestamp;
  readonly read: boolean;
  readonly actioned: boolean;
  readonly groupId: GroupId;
  readonly memberEmails: readonly string[];
  readonly createdAt: Timestamp;
}

export function requireMessage(id: string, data: unknown): Message {
  if (data == null || typeof data !== "object") {
    throw new TypeError(`Expected object for message ${id}, got ${typeof data}`);
  }
  const d = data as Record<string, unknown>;
  return {
    id: id as MessageId,
    source: requireOneOf(d.source, MESSAGE_SOURCES, "source"),
    sourceKey: requireString(d.sourceKey, "sourceKey"),
    sender: requireString(d.sender, "sender"),
    body: requireString(d.body, "body"),
    sentAt: requireTimestamp(d.sentAt, "sentAt"),
    read: requireBoolean(d.read, "read"),
    actioned: requireBoolean(d.actioned, "actioned"),
    groupId: requireGroupId(d.groupId, "groupId"),
    memberEmails: requireMemberEmails(d.memberEmails),
    createdAt: requireTimestamp(d.createdAt, "createdAt"),
  };
}
