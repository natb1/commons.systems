/**
 * Library aggregation seam: routes the existing cloud queries through the shared
 * `MediaSource` abstraction and binds an optional local-folder source on equal
 * footing, so the print library can union local on-disk items with the cloud
 * library. Pure logic — no DOM, no UI. The cloud path stays behaviorally
 * identical; `listCloud()` just dispatches the existing public / accessible
 * queries through `createFirebaseMediaSource`.
 */
import { createFirebaseMediaSource } from "@commons-systems/mediautil/firebase";
import { createLocalFolderMediaSource } from "@commons-systems/mediautil/local-folder";
import type { LocalDirectoryHandleLike } from "@commons-systems/mediautil/local-folder";
import type { MediaSource } from "@commons-systems/mediautil/source";

import { getPublicMedia, getAllAccessibleMedia, getMediaItem } from "./firestore.js";
import { storage, STORAGE_NAMESPACE } from "./firebase.js";
import { blobCache } from "./media-cache.js";
import type { MediaItem, MediaType } from "./types.js";

/** Prefix that marks a local-folder item id, distinguishing it from cloud ids. */
export const LOCAL_ID_PREFIX = "local:";

export function isLocalId(id: string): boolean {
  return id.startsWith(LOCAL_ID_PREFIX);
}

let currentViewerEmail: string | null = null;

/** Set the current viewer's email (or null for the public library). */
export function setViewerEmail(email: string | null): void {
  currentViewerEmail = email;
}

const cloudSource = createFirebaseMediaSource<MediaItem>({
  queries: { getPublicMedia, getAllAccessibleMedia, getMediaItem },
  cache: blobCache,
  storage,
  storageNamespace: STORAGE_NAMESPACE,
  viewerEmail: () => currentViewerEmail,
});

export async function listCloud(): Promise<MediaItem[]> {
  return cloudSource.list();
}

/** Supported local-folder file extensions, mapped to their `MediaType`. */
export const LOCAL_EXT: Record<string, MediaType> = {
  ".pdf": "pdf",
  ".epub": "epub",
};

/**
 * Map a top-level local file to a `MediaItem`, or `null` for an unsupported
 * extension. The metadata is inert (real extraction lands in a later unit);
 * `storagePath` is never used to resolve a local item — the directory handle is.
 */
export function fileToLocalItem(file: File, name: string): MediaItem | null {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return null;

  const ext = name.slice(idx).toLowerCase();
  const mediaType = LOCAL_EXT[ext];
  if (mediaType === undefined) return null;

  return {
    id: LOCAL_ID_PREFIX + name,
    title: name.slice(0, idx),
    mediaType,
    tags: {},
    publicDomain: false,
    sourceNotes: "",
    storagePath: name,
    markdownPath: null,
    groupId: null,
    memberEmails: [],
    addedAt: new Date(file.lastModified).toISOString(),
    origin: "local",
  };
}

let localSource: MediaSource<MediaItem> | null = null;

/** Bind a local-folder source over a chosen directory handle. */
export function createLocalSource(directory: FileSystemDirectoryHandle): void {
  localSource = createLocalFolderMediaSource<MediaItem>({
    directory: directory as unknown as LocalDirectoryHandleLike,
    toItem: fileToLocalItem,
  });
}

export async function listLocal(): Promise<MediaItem[]> {
  return localSource ? localSource.list() : [];
}

export async function getLocalItem(id: string): Promise<MediaItem | null> {
  return localSource ? localSource.metadata(id) : null;
}

export async function resolveLocalBlob(item: MediaItem): Promise<ArrayBuffer | null> {
  if (!localSource) {
    throw new Error('No local source bound');
  }
  return localSource.resolveToBlob(item);
}

export function hasLocalSource(): boolean {
  return localSource !== null;
}
