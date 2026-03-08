import { escapeHtml } from "@commons-systems/htmlutil";
import type { User } from "../auth.js";
import { getPublicMedia, getAllAccessibleMedia } from "../firestore.js";
import { getMediaDownloadUrl } from "../storage.js";
import type { MediaItem } from "../types.js";

function mediaTypeBadge(mediaType: string): string {
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
          <a href="#/view/${escapeHtml(item.id)}" class="media-view" title="View metadata" aria-label="View ${escapeHtml(item.title)}">&#128196;</a>
          <button class="media-download" data-path="${escapeHtml(item.storagePath)}" title="Download" aria-label="Download ${escapeHtml(item.title)}">&#11015;</button>
        </div>
      </li>`;
    })
    .join("\n");

  return `<ul id="media-list">${rows}</ul>`;
}

async function handleDownload(button: HTMLButtonElement): Promise<void> {
  const storagePath = button.dataset.path;
  if (!storagePath) return;
  button.disabled = true;
  try {
    const url = await getMediaDownloadUrl(storagePath);
    window.open(url, "_blank");
  } catch (error) {
    console.error("Failed to get download URL:", error);
  } finally {
    button.disabled = false;
  }
}

export async function renderHome(user: User | null): Promise<string> {
  let mediaHtml: string;
  try {
    const items = user
      ? await getAllAccessibleMedia(user.uid)
      : await getPublicMedia();

    // Sort client-side by addedAt descending (getPublicMedia doesn't sort)
    items.sort((a, b) => b.addedAt.localeCompare(a.addedAt));

    mediaHtml = renderMediaList(items);
  } catch (error) {
    console.error("Failed to load media:", error);
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
      handleDownload(button).catch(console.error);
    }
  });
}
