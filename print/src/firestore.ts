import { collection, getDocs, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath } from "@commons-systems/firestoreutil/namespace";

import { db, NAMESPACE } from "./firebase.js";

export type MediaType = "epub" | "pdf" | "cbz";

export interface MediaMeta {
  id: string;
  title: string;
  mediaType: MediaType;
  tags: Record<string, string>;
  publicDomain: boolean;
  sizeBytes: number;
  sourceNotes: string;
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
  const sourceNotes = typeof data.sourceNotes === "string" ? data.sourceNotes : "";
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
    sourceNotes,
  };
}

export async function getMedia(user: User | null): Promise<GetMediaResult> {
  const path = nsCollectionPath(NAMESPACE, "media");
  const col = collection(db, path);

  const publicQuery = query(col, where("publicDomain", "==", true));
  const queries = [getDocs(publicQuery)];

  if (user) {
    const memberQuery = query(col, where("memberUids", "array-contains", user.uid));
    queries.push(getDocs(memberQuery));
  }

  const snapshots = await Promise.all(queries);

  const seen = new Map<string, MediaMeta>();
  let skippedCount = 0;

  for (const snapshot of snapshots) {
    for (const d of snapshot.docs) {
      if (seen.has(d.id)) continue;
      const item = toMediaMeta(d.id, d.data());
      if (item) {
        seen.set(d.id, item);
      } else {
        skippedCount++;
      }
    }
  }

  const items = [...seen.values()].sort((a, b) => a.title.localeCompare(b.title));
  return { items, skippedCount };
}
