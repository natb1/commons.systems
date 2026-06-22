import { escapeHtml } from "@commons-systems/htmlutil";
import { logError } from "@commons-systems/errorutil/log";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { listCloud } from "../library.js";
import { getMediaDownloadUrl } from "../storage.js";
import { renderLocalIntoList } from "../local-folder-ui.js";
import type { MediaItem } from "../types.js";
import { mediaTypeBadge } from "../media-render.js";

function renderMediaList(items: MediaItem[]): string {
  if (items.length === 0) {
    return '<p id="media-empty">No media items available.</p>';
  }

  const rows = items
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

  return `<ul id="media-list">${rows}</ul>`;
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
    const items = await listCloud();
    return renderMediaList(items);
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    logError(error, { operation: "load-media" });
    return '<p id="media-error">Could not load media library.</p>';
  }
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
