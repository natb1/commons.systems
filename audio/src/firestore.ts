import { requireString, requireBoolean, requireNonNegativeNumber, optionalString, optionalNumber, requireStringArray, requireIso8601 } from "@commons-systems/firestoreutil/validate";
import { createMediaQueries } from "@commons-systems/firestoreutil/media-queries";

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

export const { getPublicMedia, getUserMedia, getAllAccessibleMedia, getMediaItem } =
  createMediaQueries(db, NAMESPACE, "media", toAudioItem);
