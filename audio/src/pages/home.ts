import { escapeHtml } from "@commons-systems/htmlutil";
import { logError } from "@commons-systems/errorutil/log";
import type { User } from "../auth.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { getPublicMedia, getAllAccessibleMedia } from "../firestore.js";
import type { AudioItem } from "../types.js";
import { formatDuration } from "../player.js";
import type { PlayerHandle } from "../player.js";

function renderRow(item: AudioItem): string {
  const track =
    item.trackNumber !== null ? String(item.trackNumber) : "\u2014";
  const year = item.year !== null ? String(item.year) : "\u2014";

  return `<details class="expand-row audio-row" data-id="${escapeHtml(item.id)}" data-storage-path="${escapeHtml(item.storagePath)}" data-title="${escapeHtml(item.title)}" data-artist="${escapeHtml(item.artist)}" data-album="${escapeHtml(item.album)}">
    <summary>
      <div class="expand-summary">
        <span class="title">${escapeHtml(item.title)}</span>
        <span class="artist">${escapeHtml(item.artist)}</span>
        <span class="album">${escapeHtml(item.album)}</span>
      </div>
    </summary>
    <div class="expand-details">
      <dl>
        <dt>Track</dt><dd>${track}</dd>
        <dt>Genre</dt><dd>${escapeHtml(item.genre)}</dd>
        <dt>Year</dt><dd>${year}</dd>
        <dt>Duration</dt><dd>${formatDuration(item.duration)}</dd>
        <dt>Format</dt><dd>${escapeHtml(item.format)}</dd>
        <dt>Source</dt><dd>${escapeHtml(item.sourceNotes)}</dd>
      </dl>
    </div>
  </details>`;
}

function renderMediaList(items: AudioItem[]): string {
  if (items.length === 0) {
    return '<p id="media-empty">No audio items available.</p>';
  }
  return `<div id="media-list">${items.map(renderRow).join("\n")}</div>`;
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
    mediaHtml = '<p id="media-error">Could not load audio library.</p>';
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

export function afterRenderHome(
  outlet: HTMLElement,
  player: PlayerHandle,
): void {
  outlet.addEventListener("click", (e) => {
    const summary = (e.target as HTMLElement).closest(
      ".audio-row > summary",
    );
    if (!summary) return;

    const row = summary.closest(".audio-row") as HTMLElement | null;
    if (!row) return;

    const storagePath = row.dataset.storagePath;
    const title = row.dataset.title;
    const artist = row.dataset.artist;
    const album = row.dataset.album;
    if (!storagePath || !title || !artist || !album) return;

    player.play({ title, artist, album, storagePath });
  });
}
