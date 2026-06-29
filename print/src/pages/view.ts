import type { User } from "../auth.js";
import { classifyError } from "@commons-systems/errorutil/classify";
import { getMediaItem } from "../firestore.js";
import { getMediaDownloadUrl } from "../storage.js";
import type { MediaItem } from "../types.js";
import type { ViewerProps } from "../viewer/Viewer.js";
import { createPdfRenderer } from "../viewer/pdf.js";
import { createEpubRenderer } from "../viewer/epub.js";
import { createImageArchiveRenderer } from "../viewer/image-archive.js";
import { getFile, putFile } from "../media-cache.js";
import { isLocalId, getLocalItem, resolveLocalBlob, whenLocalFolderReady } from "../library.js";
import type { PositionStore } from "../sidecar.js";
import { makeSidecarPositionStore } from "../sidecar.js";
import { makeFirestorePositionStore } from "../reading-position.js";

const BACK_LINK = '<a href="/" class="viewer-back">&larr; Back to Library</a>';

const NOT_FOUND_HTML = `
      <h2>Not Found</h2>
      <p id="view-not-found">Media item not found.</p>
      ${BACK_LINK}
    `;

const ERROR_HTML = `
      <h2>Error</h2>
      <p id="view-error">Could not load this media item. Try refreshing the page.</p>
      ${BACK_LINK}
    `;

function localStorageKey(mediaId: string): string {
  return `reading-position:${mediaId}`;
}

/**
 * A PositionStore backed by localStorage, keyed on `mediaId`. Used for anonymous
 * cloud items. Reproduces the exact key and read/write behavior the viewer used
 * to do inline.
 */
export function makeLocalStoragePositionStore(mediaId: string): PositionStore {
  return {
    async load(): Promise<string | null> {
      try {
        return localStorage.getItem(localStorageKey(mediaId));
      } catch (e) {
        reportError(new Error("Could not load reading position from localStorage", { cause: e }));
        return null;
      }
    },
    async save(pos: string): Promise<void> {
      try {
        localStorage.setItem(localStorageKey(mediaId), pos);
      } catch (e) {
        reportError(new Error("Could not save reading position to localStorage", { cause: e }));
      }
    },
  };
}

/**
 * Pick the reading-position store for the viewer. Routing keys on `isLocal`, NOT
 * on auth — a local item ALWAYS uses the sidecar (keyed on the bare filename),
 * even for a signed-in user, so a `local:` item never touches Firestore. Cloud
 * items use Firestore when signed in (keyed on mediaId) and localStorage when
 * anonymous.
 */
export function pickPositionStore(
  item: MediaItem,
  isLocal: boolean,
  userUid: string | null,
): PositionStore {
  if (isLocal) return makeSidecarPositionStore(item.storagePath);
  if (userUid) return makeFirestorePositionStore(userUid, item.id);
  return makeLocalStoragePositionStore(item.id);
}

export type ViewFrame =
  | { kind: "ready"; props: ViewerProps } // mount the <Viewer>
  | { kind: "noId" } // "No media item specified."
  | { kind: "notFound" } // "Media item not found."
  | { kind: "error" }; // "Could not load this media item. Try refreshing the page."

let viewFrame: ViewFrame = { kind: "noId" };
export function getViewFrame(): ViewFrame {
  return viewFrame;
}
// Used by the route's malformed-percent-encoding branch (which does NOT call renderView).
export function markViewNotFound(): void {
  viewFrame = { kind: "notFound" };
}

export async function renderView(id: string, user: User | null): Promise<string> {
  if (!id) {
    viewFrame = { kind: "noId" };
    return `
      <h2>Not Found</h2>
      <p id="view-not-found">No media item specified.</p>
      ${BACK_LINK}
    `;
  }

  if (isLocalId(id)) {
    // Wait for the initial local-folder init pass to settle before deciding
    // Not Found — a deep link / refresh navigates before the persisted handle
    // has bound `localSource`, which would otherwise read as a false miss.
    await whenLocalFolderReady();
    const item = await getLocalItem(id);
    if (!item) {
      viewFrame = { kind: "notFound" };
      return NOT_FOUND_HTML;
    }
    viewFrame = { kind: "ready", props: resolveViewerProps(item, true, null, user) };
    return '<div id="page-root"></div>';
  }

  try {
    const item = await getMediaItem(id);
    if (!item) {
      viewFrame = { kind: "notFound" };
      return `
        <h2>Not Found</h2>
        <p id="view-not-found">Media item not found.</p>
        ${BACK_LINK}
      `;
    }

    const url = await getMediaDownloadUrl(item.storagePath);
    viewFrame = { kind: "ready", props: resolveViewerProps(item, false, url, user) };
    return '<div id="page-root"></div>';
  } catch (error) {
    if (classifyError(error) === "data-integrity") throw error;
    reportError(new Error("Failed to load media item", { cause: error }));
    viewFrame = { kind: "error" };
    return ERROR_HTML;
  }
}

export async function resolveFileSource(url: string, storagePath: string): Promise<string | ArrayBuffer> {
  try {
    const cached = await getFile(storagePath);
    if (cached) return cached;
  } catch (err) {
    reportError(new Error("Cache lookup failed, fetching from network", { cause: err }));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
  const buf = await res.arrayBuffer();
  // Cache write is best-effort; failure does not affect the current view.
  // Hand the cache its own copy: pdf.js transfers (detaches) the returned
  // buffer to its worker, and that detach can win the race against putFile's
  // deferred store.put. buf.slice(0) is evaluated synchronously here, while
  // buf is still intact, so the cached bytes are decoupled from the transfer.
  putFile(storagePath, buf.slice(0)).catch((err) => {
    reportError(new Error("Failed to cache media file", { cause: err }));
  });
  return buf;
}

/**
 * Build the `<Viewer>` props for a resolved media item: pick the position
 * store, dispatch the mediaType to a renderer factory, and build the
 * `resolveSource` closure. Pure — no DOM, no module globals. The viewer's
 * own teardown is owned by {@link useViewerController}'s effect-cleanup when
 * React unmounts the page root, so there is nothing to clean up here.
 *
 * Routing keys on `local`, NOT on auth: a local item ALWAYS uses the sidecar
 * (uid forced to null), even for a signed-in user, so a `local:` item never
 * touches Firestore.
 */
export function resolveViewerProps(
  item: MediaItem,
  local: boolean,
  url: string | null,
  user: User | null,
): ViewerProps {
  const spath = item.storagePath;
  const uid = local ? null : user?.uid ?? null;
  const store = pickPositionStore(item, local, uid);

  if (local) {
    // The resolveSource closure rejects when the file is gone. It reports the
    // failure once; the hook's init-catch then surfaces the error state in the
    // viewer chrome (loadError) without crashing the app. (The hook also
    // reports its own "init failed" wrapper, so a returned reject would double-
    // report — instead we report here and reject with a sentinel the hook's
    // catch wraps; one extra report is acceptable and keeps the user-facing
    // outcome correct.)
    const resolveLocal = (): Promise<ArrayBuffer> =>
      resolveLocalBlob(item).then((buf) => {
        if (!buf) {
          reportError(new Error("Failed to resolve local media file: file no longer present"));
          throw new Error("Local file no longer present");
        }
        return buf;
      });
    switch (item.mediaType) {
      case "pdf":
        return { item, createRenderer: (onError) => createPdfRenderer(onError), resolveSource: resolveLocal, store, uid };
      case "epub":
        return { item, createRenderer: (onError) => createEpubRenderer(onError), resolveSource: resolveLocal, store, uid };
      default:
        throw new Error(`Unsupported local mediaType in viewer: ${item.mediaType}`);
    }
  }

  if (!url) throw new Error("Cloud media item resolved without a download URL");

  switch (item.mediaType) {
    case "pdf":
      return { item, createRenderer: (onError) => createPdfRenderer(onError), resolveSource: () => resolveFileSource(url, spath), store, uid };
    case "epub":
      return { item, createRenderer: (onError) => createEpubRenderer(onError), resolveSource: () => resolveFileSource(url, spath), store, uid };
    case "image-archive":
      return { item, createRenderer: (onError) => createImageArchiveRenderer(onError), resolveSource: () => resolveFileSource(url, spath), store, uid };
    default: {
      const _exhaustive: never = item.mediaType;
      throw new Error(`Unsupported mediaType in viewer: ${_exhaustive}`);
    }
  }
}
