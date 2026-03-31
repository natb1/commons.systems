import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";
import { requireString, requireBoolean, requireNonNegativeNumber, optionalString, optionalNumber } from "@commons-systems/firestoreutil/validate";

import { db, NAMESPACE } from "./firebase.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { AUDIO_FORMATS } from "./types.js";
import type { AudioItem, AudioFormat } from "./types.js";

function requireAudioFormat(value: unknown): AudioFormat {
  const s = requireString(value, "format");
  if (!(AUDIO_FORMATS as readonly string[]).includes(s)) {
    throw new DataIntegrityError(`Invalid audio format: "${s}"`);
  }
  return s as AudioFormat;
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

function requireIso8601(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(s) || isNaN(Date.parse(s))) {
    throw new DataIntegrityError(`Invalid ISO 8601 date for ${field}: "${s}"`);
  }
  return s;
}

function toAudioItem(id: string, data: Record<string, unknown>): AudioItem {
  return {
    id,
    title: requireString(data.title, "title"),
    artist: requireString(data.artist, "artist"),
    album: requireString(data.album, "album"),
    trackNumber: optionalNumber(data.trackNumber, "trackNumber"),
    genre: requireString(data.genre, "genre"),
    year: optionalNumber(data.year, "year"),
    duration: requireNonNegativeNumber(data.duration, "duration"),
    format: requireAudioFormat(data.format),
    publicDomain: requireBoolean(data.publicDomain, "publicDomain"),
    sourceNotes: requireString(data.sourceNotes, "sourceNotes"),
    storagePath: requireString(data.storagePath, "storagePath"),
    groupId: optionalString(data.groupId, "groupId"),
    memberEmails: requireStringArray(data.memberEmails, "memberEmails"),
    addedAt: requireIso8601(data.addedAt, "addedAt"),
  };
}

export async function getPublicMedia(): Promise<AudioItem[]> {
  const path = nsCollectionPath(NAMESPACE, "media");
  const q = query(collection(db, path), where("publicDomain", "==", true));
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((docSnap) => toAudioItem(docSnap.id, docSnap.data()));
  items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return items;
}

export async function getUserMedia(email: string): Promise<AudioItem[]> {
  const path = nsCollectionPath(NAMESPACE, "media");
  const q = query(collection(db, path), where("memberEmails", "array-contains", email));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => toAudioItem(docSnap.id, docSnap.data()));
}

export async function getAllAccessibleMedia(email: string): Promise<AudioItem[]> {
  const [publicItems, userItems] = await Promise.all([
    getPublicMedia(),
    getUserMedia(email),
  ]);

  const seen = new Set<string>();
  const merged: AudioItem[] = [];
  for (const item of [...publicItems, ...userItems]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  merged.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  return merged;
}

export async function getMediaItem(id: string): Promise<AudioItem | null> {
  const path = nsCollectionPath(NAMESPACE, "media");
  const docSnap = await getDoc(doc(db, path, id));
  if (!docSnap.exists()) return null;
  return toAudioItem(docSnap.id, docSnap.data());
}
