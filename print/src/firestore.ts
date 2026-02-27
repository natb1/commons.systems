import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";
import { isAuthorized } from "./is-authorized.js";

export type MediaType = "epub" | "pdf" | "cbz";

export interface MediaMeta {
  id: string;
  title: string;
  mediaType: MediaType;
  tags: Record<string, string>;
  publicDomain: boolean;
  sizeBytes: number;
}

export interface GetMediaResult {
  items: MediaMeta[];
  skippedCount: number;
}

const VALID_MEDIA_TYPES: ReadonlySet<string> = new Set(["epub", "pdf", "cbz"]);

function toMediaMeta(id: string, data: Record<string, unknown>): MediaMeta | null {
  const title = typeof data.title === "string" ? data.title : "";
  const mediaType = typeof data.mediaType === "string" ? data.mediaType : "";
  const publicDomain = data.publicDomain === true;
  const sizeBytes = typeof data.sizeBytes === "number" ? data.sizeBytes : 0;
  const tags =
    data.tags && typeof data.tags === "object" && !Array.isArray(data.tags)
      ? (data.tags as Record<string, string>)
      : {};

  if (!title || !VALID_MEDIA_TYPES.has(mediaType)) {
    console.error(`Media "${id}" has missing or invalid required fields:`, data);
    return null;
  }

  return {
    id,
    title,
    mediaType: mediaType as MediaType,
    tags,
    publicDomain,
    sizeBytes,
  };
}

export async function getMedia(user: User | null): Promise<GetMediaResult> {
  const path = nsCollectionPath(NAMESPACE, "media");
  const admin = isAuthorized(user);
  const q = admin
    ? query(collection(db, path), orderBy("title"))
    : query(collection(db, path), where("publicDomain", "==", true));
  const snapshot = await getDocs(q);
  const items: MediaMeta[] = [];
  let skippedCount = 0;
  for (const d of snapshot.docs) {
    const item = toMediaMeta(d.id, d.data());
    if (item) {
      items.push(item);
    } else {
      skippedCount++;
    }
  }
  if (!admin) {
    items.sort((a, b) => a.title.localeCompare(b.title));
  }
  return { items, skippedCount };
}
