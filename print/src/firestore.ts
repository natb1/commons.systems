import { requireString, requireBoolean, optionalString, requireStringArray, requireIso8601 } from "@commons-systems/firestoreutil/validate";
import { createMediaQueries } from "@commons-systems/firestoreutil/media-queries";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { MEDIA_TYPES } from "./types.js";
import type { MediaItem, MediaType } from "./types.js";

function requireMediaType(value: unknown): MediaType {
  const s = requireString(value, "mediaType");
  if (!(MEDIA_TYPES as readonly string[]).includes(s)) {
    throw new DataIntegrityError(`Invalid mediaType: "${s}"`);
  }
  return s as MediaType;
}

function requireTags(value: unknown): Record<string, string> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new DataIntegrityError(`Expected object for tags, got ${typeof value}`);
  }
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v !== "string") {
      throw new DataIntegrityError(`Expected string for tags.${k}, got ${typeof v}`);
    }
    result[k] = v;
  }
  return result;
}

function toMediaItem(id: string, data: Record<string, unknown>): MediaItem {
  return {
    id,
    title: requireString(data.title, "title"),
    mediaType: requireMediaType(data.mediaType),
    tags: requireTags(data.tags),
    publicDomain: requireBoolean(data.publicDomain, "publicDomain"),
    sourceNotes: requireString(data.sourceNotes, "sourceNotes"),
    storagePath: requireString(data.storagePath, "storagePath"),
    groupId: optionalString(data.groupId, "groupId"),
    memberEmails: requireStringArray(data.memberEmails, "memberEmails"),
    addedAt: requireIso8601(data.addedAt, "addedAt"),
  };
}

export const { getPublicMedia, getUserMedia, getAllAccessibleMedia, getMediaItem } =
  createMediaQueries(db, NAMESPACE, "media", toMediaItem);
