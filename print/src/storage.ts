import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase.js";
import type { MediaType } from "./firestore.js";

const EXT: Record<MediaType, string> = { epub: "epub", pdf: "pdf", cbz: "cbz" };

export function mediaStoragePath(mediaId: string, mediaType: MediaType): string {
  return `print/${mediaId}.${EXT[mediaType]}`;
}

export async function getMediaDownloadUrl(
  mediaId: string,
  mediaType: MediaType,
): Promise<string> {
  const path = mediaStoragePath(mediaId, mediaType);
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}
