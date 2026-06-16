/**
 * This module unions the cloud library (listed via `createFirebaseMediaSource`)
 * with the local-folder source at the LIST level only. Cloud byte-resolution
 * deliberately stays on the legacy `resolveAudioSource` path in `storage.ts`
 * for prod migration safety.
 */
import { createFirebaseMediaSource } from "@commons-systems/mediautil/firebase";
import { getPublicMedia, getAllAccessibleMedia, getMediaItem } from "./firestore.js";
import { storage, STORAGE_NAMESPACE } from "./firebase.js";
import { mediaCache } from "./audio-cache.js";
import { listLocalTracks } from "./local-source.js";
import type { AudioItem, LibraryItem } from "./types.js";
import type { User } from "./auth.js";

export async function listLibrary(user: User | null): Promise<LibraryItem[]> {
  const cloudSource = createFirebaseMediaSource<AudioItem>({
    queries: { getPublicMedia, getAllAccessibleMedia, getMediaItem },
    cache: mediaCache,
    storage,
    storageNamespace: STORAGE_NAMESPACE,
    viewerEmail: () => user?.email ?? null,
  });

  const cloudItems = await cloudSource.list();
  const cloud: LibraryItem[] = cloudItems.map((item) => ({ ...item, origin: "cloud" as const }));

  const local = await listLocalTracks();

  return [...cloud, ...local].sort((a, b) =>
    a.addedAt < b.addedAt ? 1 : a.addedAt > b.addedAt ? -1 : 0,
  );
}
