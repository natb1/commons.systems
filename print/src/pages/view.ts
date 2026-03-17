import type { User } from "../auth.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { getMediaItem } from "../firestore.js";
import { getMediaDownloadUrl } from "../storage.js";
import type { MediaItem } from "../types.js";
import { renderViewerShell, initViewer } from "../viewer/shell.js";
import { createPdfRenderer } from "../viewer/pdf.js";
import { createEpubRenderer } from "../viewer/epub.js";
import { createImageArchiveRenderer } from "../viewer/image-archive.js";

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
    if (error instanceof DataIntegrityError) throw error;
    reportError(new Error("Failed to load media item", { cause: error }));
    return `
      <h2>Error</h2>
      <p id="view-error">Could not load this media item. Try refreshing the page.</p>
      ${BACK_LINK}
    `;
  }
}

export function afterRenderView(outlet: HTMLElement, user: User | null): void {
  if (!pendingItem || !pendingUrl) return;

  const item = pendingItem;
  const url = pendingUrl;
  pendingItem = null;
  pendingUrl = null;

  const uid = user?.uid ?? null;

  switch (item.mediaType) {
    case "pdf":
      cleanupFn = initViewer(outlet, (onError) => createPdfRenderer(onError), url, item.id, uid);
      break;
    case "epub":
      cleanupFn = initViewer(outlet, (onError) => createEpubRenderer(onError), url, item.id, uid);
      break;
    case "image-archive":
      cleanupFn = initViewer(outlet, (onError) => createImageArchiveRenderer(onError), url, item.id, uid);
      break;
    default: {
      const _exhaustive: never = item.mediaType;
      reportError(new Error(`Unsupported mediaType in viewer: ${_exhaustive}`));
      const pos = outlet.querySelector(".viewer-position");
      if (pos) pos.textContent = `Unsupported media type: ${_exhaustive}`;
    }
  }
}
