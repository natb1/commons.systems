/**
 * This module unions the cloud library (listed via `createFirebaseMediaSource`)
 * with the local-folder source at the LIST level only. Cloud byte-resolution
 * deliberately stays on the legacy `resolveAudioSource` path in `storage.ts`
 * for prod migration safety.
 */
import { createFirebaseMediaSource } from "@commons-systems/mediautil/firebase";
import {
  DEFAULT_MEDIA_PAGE_SIZE,
  decodeCursor,
  compareByAddedAtDescIdDesc,
  pagedMerge,
} from "@commons-systems/firestoreutil/paged-merge";
import type {
  MediaPage,
  MediaPageOptions,
} from "@commons-systems/firestoreutil/paged-merge";
import { getPublicMedia, getAllAccessibleMedia, getMediaItem } from "./firestore.js";
import { storage, STORAGE_NAMESPACE } from "./firebase.js";
import { mediaCache } from "./audio-cache.js";
import { listLocalTracks } from "./local-source.js";
import type { AudioItem, LibraryItem } from "./types.js";
import type { User } from "./auth.js";

export async function listLibrary(
  user: User | null,
  opts?: MediaPageOptions,
): Promise<MediaPage<LibraryItem>> {
  const pageSize = opts?.pageSize ?? DEFAULT_MEDIA_PAGE_SIZE;
  const cursor = opts?.cursor ?? null;

  const cloudSource = createFirebaseMediaSource<AudioItem>({
    queries: { getPublicMedia, getAllAccessibleMedia, getMediaItem },
    cache: mediaCache,
    storage,
    storageNamespace: STORAGE_NAMESPACE,
    viewerEmail: () => user?.email ?? null,
  });

  const cloudPage = await cloudSource.list({ pageSize, cursor });
  const cloud: LibraryItem[] = cloudPage.items.map((item) => ({
    ...item,
    origin: "cloud" as const,
  }));

  // Full local set (with sidecar overlay), sliced to items strictly AFTER the
  // cursor so it composes into the same paged coordinate space as cloud. Cloud
  // and local ids never collide (local ids carry a `local:` prefix), so
  // pagedMerge's dedup is a no-op here.
  const localAll = await listLocalTracks();
  const decoded = cursor ? decodeCursor(cursor) : null;
  const localAfter = decoded
    ? localAll.filter(
        (it) =>
          compareByAddedAtDescIdDesc({ addedAt: it.addedAt, id: it.id }, decoded) > 0,
      )
    : localAll;

  return pagedMerge<LibraryItem>(
    [
      { items: cloud, hasMore: cloudPage.nextCursor !== null },
      { items: localAfter, hasMore: localAfter.length > pageSize },
    ],
    pageSize,
    (it) => it.id,
    (it) => ({ addedAt: it.addedAt, id: it.id }),
  );
}
