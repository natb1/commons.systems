import type { User } from "../auth.js";
import { DataIntegrityError } from "../errors.js";
import { getMediaItem } from "../firestore.js";
import { getMediaDownloadUrl } from "../storage.js";
import type { MediaItem } from "../types.js";
import { renderViewerShell, initViewer } from "../viewer/shell.js";
import { createPdfRenderer } from "../viewer/pdf.js";

const BACK_LINK = '<a href="#/" class="viewer-back">&larr; Back to Library</a>';

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
  cleanupView();

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
    console.error("Failed to load media item:", error);
    return `
      <h2>Error</h2>
      <p id="view-error">Could not load this media item.</p>
      ${BACK_LINK}
    `;
  }
}

export function afterRenderView(outlet: HTMLElement): void {
  if (!pendingItem || !pendingUrl) return;

  const item = pendingItem;
  const url = pendingUrl;
  pendingItem = null;
  pendingUrl = null;

  if (item.mediaType !== "pdf") return;

  const renderer = createPdfRenderer();
  cleanupFn = initViewer(outlet, renderer, url);
}
