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

const BACK_LINK = '<a href="/" class="viewer-back">&larr; Back to Library</a>';

let pendingItem: MediaItem | null = null;
let pendingUrl: string | null = null;
let cleanupFn: (() => void) | null = null;

export function cleanupView(): void {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
  pendingItem = null;
  pendingUrl = null;
}

export async function renderView(id: string, _user: User | null): Promise<string> {
  if (!id) {
    return `
      <h2>Not Found</h2>
      <p id="view-not-found">No media item specified.</p>
      ${BACK_LINK}
    `;
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
    return `
      <h2>Error</h2>
      <p id="view-error">Could not load this media item. Try refreshing the page.</p>
      ${BACK_LINK}
    `;
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
  if (!pendingItem || !pendingUrl) return;

  const item = pendingItem;
  const url = pendingUrl;
  const spath = item.storagePath;
  pendingItem = null;
  pendingUrl = null;

  const uid = user?.uid ?? null;

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
