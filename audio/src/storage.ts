import { getDownloadURL, ref } from "firebase/storage";
import { storage, STORAGE_NAMESPACE } from "./firebase.js";
import { getFile, putFile } from "./audio-cache.js";

export async function getMediaDownloadUrl(storagePath: string): Promise<string> {
  const fullPath = `${STORAGE_NAMESPACE}/${storagePath}`;
  const storageRef = ref(storage, fullPath);
  return getDownloadURL(storageRef);
}

export async function resolveAudioSource(storagePath: string): Promise<string> {
  const cached = await getFile(storagePath);
  if (cached) return URL.createObjectURL(new Blob([cached]));

  const url = await getMediaDownloadUrl(storagePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Audio fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();

  putFile(storagePath, buf).catch((err) =>
    reportError(new Error("Failed to cache audio file", { cause: err })),
  );

  return URL.createObjectURL(new Blob([buf]));
}
