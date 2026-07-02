import { escapeHtml } from "@commons-systems/htmlutil";
import { logError } from "@commons-systems/errorutil/log";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { listCloud } from "../library.js";
import { getMediaDownloadUrl } from "../storage.js";
import { renderLocalIntoList } from "../local-folder-ui.js";
import type { MediaItem } from "../types.js";
import { mediaTypeBadge } from "../media-render.js";

function renderMediaRows(items: MediaItem[]): string {
  return items
    .map((item) => {
      return `<li class="media-item" data-id="${escapeHtml(item.id)}">
        <div class="media-info">
          <span class="media-title">${escapeHtml(item.title)}</span>
          ${mediaTypeBadge(item.mediaType)}
        </div>
        <div class="media-actions">
          <a href="/view/${escapeHtml(item.id)}" class="media-view" title="View in Reader" aria-label="View ${escapeHtml(item.title)}">&#128196;</a>
          <button class="media-download" data-path="${escapeHtml(item.storagePath)}" title="Download" aria-label="Download ${escapeHtml(item.title)}">&#11015;</button>
          ${item.markdownPath ? `<button class="media-md-download" data-md-path="${escapeHtml(item.markdownPath)}" data-title="${escapeHtml(item.title)}" title="Download Markdown" aria-label="Download Markdown for ${escapeHtml(item.title)}">&#128220;</button>
          <button class="media-md-copy" data-md-path="${escapeHtml(item.markdownPath)}" title="Copy Markdown" aria-label="Copy Markdown for ${escapeHtml(item.title)}">&#128203;</button>` : ""}
        </div>
      </li>`;
    })
    .join("\n");
}

function renderMediaList(items: MediaItem[]): string {
  if (items.length === 0) {
    return '<p id="media-empty">No media items available.</p>';
  }

  return `<ul id="media-list">${renderMediaRows(items)}</ul>`;
}

async function handleDownload(button: HTMLButtonElement): Promise<void> {
  const storagePath = button.dataset.path;
  if (!storagePath) {
    logError(new Error("Download button missing data-path attribute"), { operation: "download-button" });
    return;
  }
  button.disabled = true;
  try {
    const url = await getMediaDownloadUrl(storagePath);
    // Anchor-click download: window.open is blocked by iOS Safari after an async gap
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    logError(error, { operation: "download-url" });
    const mediaItem = button.closest(".media-item");
    if (mediaItem) {
      const existing = mediaItem.querySelector(".download-error");
      if (!existing) {
        const msg = document.createElement("p");
        msg.className = "download-error";
        msg.textContent = "Download failed. Please try again.";
        mediaItem.appendChild(msg);
      }
    }
  } finally {
    button.disabled = false;
  }
}

export async function loadMediaHtml(): Promise<string> {
  try {
    const page = await listCloud();
    let html = renderMediaList(page.items);
    if (page.nextCursor !== null) {
      html += `<button id="load-more-btn" data-cursor="${escapeHtml(page.nextCursor)}">Load more</button>`;
    }
    return html;
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    logError(error, { operation: "load-media" });
    return '<p id="media-error">Could not load media library.</p>';
  }
}

/**
 * Delegated "Load more" wiring: attach ONE click listener to a stable element
 * (registered once on the persistent `#app` root in main.tsx, mirroring
 * `wireDownloadActions`). Fetches the next cloud page via the button's stored
 * cursor and APPENDS its rows to the END of `#media-list` — local items stay
 * prepended at the top, cloud pages grow downward. Re-rendered buttons are
 * handled by the same listener because it delegates rather than binding the
 * button directly.
 */
export function wireLoadMore(outlet: HTMLElement): void {
  outlet.addEventListener("click", (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    const btn = e.target.closest<HTMLButtonElement>("#load-more-btn");
    if (!btn) return;
    const cursor = btn.dataset.cursor;
    if (!cursor) return;
    // Guard against concurrent clicks while the fetch is in flight.
    btn.disabled = true;
    void (async () => {
      try {
        const page = await listCloud({ cursor });
        const ul = outlet.querySelector<HTMLUListElement>("#media-list");
        if (ul) ul.insertAdjacentHTML("beforeend", renderMediaRows(page.items));
        if (page.nextCursor !== null) {
          btn.dataset.cursor = page.nextCursor;
          btn.disabled = false;
        } else {
          btn.remove();
        }
      } catch (err) {
        logError(err, { operation: "load-more" });
        btn.disabled = false;
      }
    })();
  });
}

export function wireDownloadActions(outlet: HTMLElement): void {
  outlet.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const downloadBtn = target.closest(".media-download") as HTMLButtonElement | null;
    if (downloadBtn) {
      e.preventDefault();
      handleDownload(downloadBtn).catch((err) => logError(err, { operation: "download" }));
    }
  });
}

export function afterRenderHome(outlet: HTMLElement): void {
  // Repopulate local items into the freshly-rendered media list. The folder
  // button itself lives in the nav (initialized once at startup in main.ts).
  renderLocalIntoList(outlet).catch((err) =>
    logError(err, { operation: "local-folder-home-render" }),
  );
}
