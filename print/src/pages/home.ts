import { escapeHtml } from "@commons-systems/htmlutil";
import { logError } from "@commons-systems/errorutil/log";
import type { User } from "../auth.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { getPublicMedia, getAllAccessibleMedia } from "../firestore.js";
import { getMediaDownloadUrl } from "../storage.js";
import type { MediaItem, MediaType } from "../types.js";

function mediaTypeBadge(mediaType: MediaType): string {
  return `<span class="media-badge">${escapeHtml(mediaType)}</span>`;
}

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

export async function renderHome(user: User | null): Promise<string> {
  let mediaHtml: string;
  try {
    const items = user?.email
      ? await getAllAccessibleMedia(user.email)
      : await getPublicMedia();

    mediaHtml = renderMediaList(items);
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    logError(error, { operation: "load-media" });
    mediaHtml = '<p id="media-error">Could not load media library.</p>';
  }

  const publicNotice = !user
    ? '<p id="public-notice">Showing public domain items. Sign in to see your full library.</p>'
    : "";

  return `
    <h2>Library</h2>
    ${publicNotice}
    ${mediaHtml}
  `;
}

export function afterRenderHome(outlet: HTMLElement): void {
  outlet.addEventListener("click", (e) => {
    const button = (e.target as HTMLElement).closest(".media-download") as HTMLButtonElement | null;
    if (button) {
      e.preventDefault();
      handleDownload(button).catch((err) => logError(err, { operation: "download" }));
    }
  });
}
