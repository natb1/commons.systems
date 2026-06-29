/**
 * Library aggregation seam: routes the existing cloud queries through the shared
 * `MediaSource` abstraction and binds an optional local-folder source on equal
 * footing, so the print library can union local on-disk items with the cloud
 * library. Pure logic — no DOM, no UI. The cloud path stays behaviorally
 * identical; `listCloud()` just dispatches the existing public / accessible
 * queries through `createFirebaseMediaSource`.
 */
import { logError } from "@commons-systems/errorutil/log";

import { createFirebaseMediaSource } from "@commons-systems/mediautil/firebase";
import { createLocalFolderMediaSource } from "@commons-systems/mediautil/local-folder";
import type { LocalDirectoryHandleLike, LocalFolderMediaSource } from "@commons-systems/mediautil/local-folder";

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
 * or title-less filename. The metadata is inert (real extraction lands in a later unit);
 * `storagePath` is never used to resolve a local item — the directory handle is.
 *
 * `folderId` is the chosen folder's `FileSystemDirectoryHandle.name`. It scopes
 * the item id so same-named files in differently-named folders get distinct ids
 * and thus distinct localStorage keys.
 */
export function fileToLocalItem(file: File, name: string, folderId: string): MediaItem | null {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return null; // no dot, or a pure-extension name like ".pdf" with no title

  const ext = name.slice(idx).toLowerCase();
  const mediaType = LOCAL_EXT[ext];
  if (mediaType === undefined) return null;

  return {
    id: LOCAL_ID_PREFIX + folderId + "/" + name,
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

let localSource: LocalFolderMediaSource<MediaItem> | null = null;

let resolveLocalFolderReady!: () => void;
const localFolderReadyPromise = new Promise<void>((resolve) => {
  resolveLocalFolderReady = resolve;
});

/** Resolves once the initial local-folder init pass has settled (source bound or not). */
export function whenLocalFolderReady(): Promise<void> {
  return localFolderReadyPromise;
}

/** Mark the initial local-folder init pass settled. Idempotent (Promise resolve no-ops after first). */
export function markLocalFolderReady(): void {
  resolveLocalFolderReady();
}

/** Bind a local-folder source over a chosen directory handle. */
export function createLocalSource(directory: FileSystemDirectoryHandle): void {
  const folderId = directory.name;
  localSource = createLocalFolderMediaSource<MediaItem>({
    directory: directory as unknown as LocalDirectoryHandleLike,
    toItem: (file, name) => fileToLocalItem(file, name, folderId),
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

/**
 * Resolve a local item to a live `File`, or `null` when it can no longer be
 * read. A vanished file, an index miss, or a permission error here is a
 * skip-and-retry-later signal, not a misconfiguration to surface: the
 * enrichment path relies on the `null` return to avoid caching an empty `{}`
 * (which would permanently suppress a retry). The error is still logged for
 * observability before returning null. Mirrors the audio app's
 * `resolveLocalFile`.
 */
export async function resolveLocalFile(item: MediaItem): Promise<File | null> {
  if (!localSource) {
    throw new Error('No local source bound');
  }
  try {
    return await localSource.resolveToFile(item);
  } catch (err) {
    logError(err, { operation: "resolve-local-file", id: item.id });
    return null;
  }
}

export function hasLocalSource(): boolean {
  return localSource !== null;
}

/** Reset the bound local source back to the no-source-bound state.
 *  Production use: the local-folder "forget" handler calls this to clear the
 *  in-memory local source when the user revokes a granted folder. Also used by
 *  order-independent tests to assert the no-source-bound state regardless of
 *  suite execution order. */
export function resetLocalSource(): void {
  localSource = null;
}
