import { getDownloadURL, ref } from "firebase/storage";
import { storage, STORAGE_NAMESPACE } from "./firebase.js";
import { getFile, putFile } from "./audio-cache.js";

const MIME_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};

function mimeTypeFromPath(path: string): string {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
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

  putFile(storagePath, buf)
    .then(() => document.dispatchEvent(new Event("audio-cache-updated")))
    .catch((err) =>
      reportError(new Error("Failed to cache audio file", { cause: err })),
    );

  return URL.createObjectURL(new Blob([buf], { type }));
}
