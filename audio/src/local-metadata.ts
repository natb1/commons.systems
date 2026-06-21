import { parseBuffer } from "music-metadata";
import { logError } from "@commons-systems/errorutil/log";
import type { AudioFormat, AudioTags } from "./types.js";

/** Trim a string; treat empty-after-trim as absent. */
function cleanString(raw: string | null | undefined): string | undefined {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Extract `AudioTags` from in-memory bytes. Read-only: operates on bytes already
 * in memory, so extraction works even when the source folder is not writable.
 * Tolerant of untrusted/malformed file contents — any failure (corrupt or
 * unsupported file) is logged and reported as `{}` so the caller can fall back
 * to the filename stem.
 *
 * WAV files have no standard tag container, so they naturally yield no title;
 * the generic mapping below leaves `title` undefined, letting the caller keep
 * the filename-stem title while still surfacing the duration from the header.
 */
export async function extractAudioMetadata(
  buf: ArrayBuffer,
  format: AudioFormat,
): Promise<AudioTags> {
  try {
    const metadata = await parseBuffer(new Uint8Array(buf), undefined, {
      skipCovers: true,
    });
    const { common, format: fmt } = metadata;
    const tags: AudioTags = {};

    const title = cleanString(common.title);
    if (title !== undefined) tags.title = title;

    const artist = cleanString(common.artist);
    if (artist !== undefined) tags.artist = artist;

    const album = cleanString(common.album);
    if (album !== undefined) tags.album = album;

    const trackNo = common.track?.no;
    if (typeof trackNo === "number" && Number.isFinite(trackNo)) tags.trackNumber = trackNo;

    const genre = cleanString(common.genre?.[0]);
    if (genre !== undefined) tags.genre = genre;

    const year = common.year;
    if (typeof year === "number" && Number.isFinite(year)) tags.year = year;

    const duration = fmt.duration;
    if (typeof duration === "number" && Number.isFinite(duration)) tags.duration = duration;

    return tags;
  } catch (err) {
    logError(err, { operation: "extractAudioMetadata", format });
    return {};
  }
}
