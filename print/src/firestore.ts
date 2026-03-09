import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "./errors.js";
import { MEDIA_TYPES } from "./types.js";
import type { MediaItem, MediaType } from "./types.js";

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new DataIntegrityError(`Expected boolean for ${field}, got ${typeof value}`);
  }
  return value;
}

function requireMediaType(value: unknown): MediaType {
  const s = requireString(value, "mediaType");
  if (!(MEDIA_TYPES as readonly string[]).includes(s)) {
    throw new DataIntegrityError(`Invalid mediaType: "${s}"`);
  }
  return s as MediaType;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new DataIntegrityError(`Expected array for ${field}, got ${typeof value}`);
  }
  return value.map((item, i) => {
    if (typeof item !== "string") {
      throw new DataIntegrityError(`Expected string at ${field}[${i}], got ${typeof item}`);
    }
    return item;
  });
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

function requireIso8601(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(s) || isNaN(Date.parse(s))) {
    throw new DataIntegrityError(`Invalid ISO 8601 date for ${field}: "${s}"`);
  }
  return s;
}

function optionalString(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new DataIntegrityError(`Expected string or null for ${field}, got ${typeof value}`);
  }
  return value;
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

export async function getPublicMedia(): Promise<MediaItem[]> {
  const path = nsCollectionPath(NAMESPACE, "media");
  const q = query(collection(db, path), where("publicDomain", "==", true));
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((docSnap) => toMediaItem(docSnap.id, docSnap.data()));
  items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return items;
}

export async function getUserMedia(email: string): Promise<MediaItem[]> {
  const path = nsCollectionPath(NAMESPACE, "media");
  const q = query(collection(db, path), where("memberEmails", "array-contains", email));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => toMediaItem(docSnap.id, docSnap.data()));
}

export async function getAllAccessibleMedia(email: string): Promise<MediaItem[]> {
  const [publicItems, userItems] = await Promise.all([
    getPublicMedia(),
    getUserMedia(email),
  ]);

  // Deduplicate by id (a public-domain item might also appear in user's memberEmails)
  const seen = new Set<string>();
  const merged: MediaItem[] = [];
  for (const item of [...publicItems, ...userItems]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  merged.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return merged;
}

export async function getMediaItem(id: string): Promise<MediaItem | null> {
  const path = nsCollectionPath(NAMESPACE, "media");
  const docSnap = await getDoc(doc(db, path, id));
  if (!docSnap.exists()) return null;
  return toMediaItem(docSnap.id, docSnap.data());
}
