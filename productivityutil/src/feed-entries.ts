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

export type FeedEntryId = Brand<"FeedEntryId">;

export const FEED_SOURCES = ["rss", "hackernews", "reddit"] as const;
export type FeedSource = (typeof FEED_SOURCES)[number];

export interface FeedEntry {
  readonly id: FeedEntryId;
  readonly source: FeedSource;
  readonly sourceKey: string;
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
  readonly publishedAt: Timestamp;
  readonly read: boolean;
  readonly saved: boolean;
  readonly groupId: GroupId;
  readonly memberEmails: readonly string[];
  readonly createdAt: Timestamp;
}

export function requireFeedEntry(id: string, data: unknown): FeedEntry {
  if (data == null || typeof data !== "object") {
    throw new TypeError(`Expected object for feed entry ${id}, got ${typeof data}`);
  }
  const d = data as Record<string, unknown>;
  return {
    id: id as FeedEntryId,
    source: requireOneOf(d.source, FEED_SOURCES, "source"),
    sourceKey: requireString(d.sourceKey, "sourceKey"),
    title: requireString(d.title, "title"),
    url: requireString(d.url, "url"),
    snippet: requireString(d.snippet, "snippet"),
    publishedAt: requireTimestamp(d.publishedAt, "publishedAt"),
    read: requireBoolean(d.read, "read"),
    saved: requireBoolean(d.saved, "saved"),
    groupId: requireGroupId(d.groupId, "groupId"),
    memberEmails: requireMemberEmails(d.memberEmails),
    createdAt: requireTimestamp(d.createdAt, "createdAt"),
  };
}
