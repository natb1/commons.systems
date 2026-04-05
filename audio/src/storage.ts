import { getDownloadURL, ref } from "firebase/storage";
import { storage, STORAGE_NAMESPACE } from "./firebase.js";
import { getFile, putFile, CACHE_UPDATED_EVENT } from "./audio-cache.js";

const MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};

function mimeTypeFromPath(path: string): string {
  const dotIndex = path.lastIndexOf(".");
  if (dotIndex < 0) throw new Error(`Cannot infer MIME type: no file extension in path '${path}'`);
  const ext = path.slice(dotIndex).toLowerCase();
  const mime = MIME_TYPES[ext];
  if (!mime) throw new Error(`Unsupported audio format '${ext}' in path '${path}'`);
  return mime;
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
      reportError(new Error("Failed to cache audio file", { cause: err })),
    );

  return URL.createObjectURL(new Blob([buf], { type }));
}
