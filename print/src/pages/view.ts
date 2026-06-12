import type { User } from "../auth.js";
import { classifyError } from "@commons-systems/errorutil/classify";
import { getMediaItem } from "../firestore.js";
import { getMediaDownloadUrl } from "../storage.js";
import type { MediaItem } from "../types.js";
import { renderViewerShell, initViewer } from "../viewer/shell.js";
import { createPdfRenderer } from "../viewer/pdf.js";
import { createEpubRenderer } from "../viewer/epub.js";
import { createImageArchiveRenderer } from "../viewer/image-archive.js";
import { getFile, putFile } from "../media-cache.js";
import { isLocalId, getLocalItem, resolveLocalBlob } from "../library.js";

const BACK_LINK = '<a href="/" class="viewer-back">&larr; Back to Library</a>';

export const NOT_FOUND_HTML = `
      <h2>Not Found</h2>
      <p id="view-not-found">Media item not found.</p>
      ${BACK_LINK}
    `;

const ERROR_HTML = `
      <h2>Error</h2>
      <p id="view-error">Could not load this media item. Try refreshing the page.</p>
      ${BACK_LINK}
    `;

/**
 * Reading-position uid for the viewer. Local-folder items are read
 * unauthenticated and must never write a `local:` id to Firestore, so they
 * force the localStorage path (uid=null). Cloud items use the signed-in uid.
 */
export function readingPositionUid(isLocal: boolean, userUid: string | null): string | null {
  return isLocal ? null : userUid;
}

let pendingItem: MediaItem | null = null;
let pendingUrl: string | null = null;
let pendingLocal = false;
let cleanupFn: (() => void) | null = null;

export function cleanupView(): void {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
  pendingItem = null;
  pendingUrl = null;
  pendingLocal = false;
}

export async function renderView(id: string, _user: User | null): Promise<string> {
  if (!id) {
    return `
      <h2>Not Found</h2>
      <p id="view-not-found">No media item specified.</p>
      ${BACK_LINK}
    `;
  }

  if (isLocalId(id)) {
    const item = await getLocalItem(id);
    if (!item) return NOT_FOUND_HTML;
    pendingItem = item;
    pendingUrl = null;
    pendingLocal = true;
    return renderViewerShell(item);
  }

  try {
    const item = await getMediaItem(id);
    if (!item) {
      return `
        <h2>Not Found</h2>
        <p id="view-not-found">Media item not found.</p>
        ${BACK_LINK}
      `;
    }

    const url = await getMediaDownloadUrl(item.storagePath);
    pendingItem = item;
    pendingUrl = url;
    return renderViewerShell(item);
  } catch (error) {
    if (classifyError(error) === "data-integrity") throw error;
    reportError(new Error("Failed to load media item", { cause: error }));
    return ERROR_HTML;
  }
}

async function resolveFileSource(url: string, storagePath: string): Promise<string | ArrayBuffer> {
  try {
    const cached = await getFile(storagePath);
    if (cached) return cached;
  } catch (err) {
    reportError(new Error("Cache lookup failed, fetching from network", { cause: err }));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
  const buf = await res.arrayBuffer();
  // Cache write is best-effort; failure does not affect the current view
  putFile(storagePath, buf).catch((err) => {
    reportError(new Error("Failed to cache media file", { cause: err }));
  });
  return buf;
}

export function afterRenderView(outlet: HTMLElement, user: User | null): void {
  if (!pendingItem) return;

  const item = pendingItem;
  const local = pendingLocal;
  const url = pendingUrl;
  const spath = item.storagePath;
  pendingItem = null;
  pendingUrl = null;
  pendingLocal = false;

  const uid = readingPositionUid(local, user?.uid ?? null);

  if (local) {
    const resolveLocal = (): Promise<ArrayBuffer> => {
      return resolveLocalBlob(item)
        .then((buf) => {
          if (!buf) throw new Error("Local file no longer present");
          return buf;
        })
        .catch((error) => {
          // Graceful: surface the existing #view-error UI instead of crashing.
          // The error is fully handled here (reportError + ERROR_HTML), so do
          // NOT re-throw: re-throwing would propagate into initViewer's own
          // .catch(), which would call reportError a second time for the same
          // failure. Returning a never-settling promise stops initViewer from
          // proceeding to render and from entering its catch block.
          reportError(new Error("Failed to resolve local media file", { cause: error }));
          outlet.innerHTML = ERROR_HTML;
          return new Promise<ArrayBuffer>(() => {});
        });
    };
    switch (item.mediaType) {
      case "pdf":
        cleanupFn = initViewer(outlet, (onError) => createPdfRenderer(onError), resolveLocal, item.id, uid);
        break;
      case "epub":
        cleanupFn = initViewer(outlet, (onError) => createEpubRenderer(onError), resolveLocal, item.id, uid);
        break;
      default:
        reportError(new Error(`Unsupported local mediaType in viewer: ${item.mediaType}`));
    }
    return;
  }

  if (!url) return;

  switch (item.mediaType) {
    case "pdf":
      cleanupFn = initViewer(outlet, (onError) => createPdfRenderer(onError), () => resolveFileSource(url, spath), item.id, uid);
      break;
    case "epub":
      cleanupFn = initViewer(outlet, (onError) => createEpubRenderer(onError), () => resolveFileSource(url, spath), item.id, uid);
      break;
    case "image-archive":
      cleanupFn = initViewer(outlet, (onError) => createImageArchiveRenderer(onError, spath), () => Promise.resolve(url), item.id, uid);
      break;
    default: {
      const _exhaustive: never = item.mediaType;
      reportError(new Error(`Unsupported mediaType in viewer: ${_exhaustive}`));
      const pos = outlet.querySelector(".viewer-position");
      if (pos) pos.textContent = `Unsupported media type: ${_exhaustive}`;
    }
  }
}
