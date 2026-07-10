import { getDownloadURL, ref } from "firebase/storage";
import { logError } from "@commons-systems/errorutil/log";
import { storage, STORAGE_NAMESPACE } from "./firebase.js";
import { getFile, putFile, removeFile, CACHE_UPDATED_EVENT } from "./audio-cache.js";
import { AUDIO_FORMATS, AUDIO_MIME_TYPES } from "./types.js";
import type { AudioFormat } from "./types.js";
export { removeFile };

function mimeTypeFromPath(path: string): string {
  const dotIndex = path.lastIndexOf(".");
  if (dotIndex < 0) throw new Error(`Cannot infer MIME type: no file extension in path '${path}'`);
  const ext = path.slice(dotIndex + 1).toLowerCase();
  if (!(AUDIO_FORMATS as readonly string[]).includes(ext)) {
    throw new Error(`Unsupported audio format '${ext}' in path '${path}'`);
  }
  return AUDIO_MIME_TYPES[ext as AudioFormat]; // type-safety-ok: the AUDIO_FORMATS.includes guard above narrows ext to an AudioFormat
}

export async function getMediaDownloadUrl(storagePath: string): Promise<string> {
  const fullPath = `${STORAGE_NAMESPACE}/${storagePath}`;
  const storageRef = ref(storage, fullPath);
  return getDownloadURL(storageRef);
}

export async function resolveAudioSource(storagePath: string): Promise<string> {
  const type = mimeTypeFromPath(storagePath);
  const cached = await getFile(storagePath);
  if (cached) return URL.createObjectURL(new Blob([cached], { type }));

  const url = await getMediaDownloadUrl(storagePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Audio fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();

  // Cache write is fire-and-forget so the caller gets the blob URL without
  // waiting for IndexedDB persistence.
  putFile(storagePath, buf)
    .then(() => document.dispatchEvent(new Event(CACHE_UPDATED_EVENT)))
    .catch((err) =>
      logError(err, { operation: "cache-write", storagePath }),
    );

  return URL.createObjectURL(new Blob([buf], { type }));
}
