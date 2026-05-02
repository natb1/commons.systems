import { escapeHtml } from "@commons-systems/htmlutil";
import { logError } from "@commons-systems/errorutil/log";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import type { User } from "../auth.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import { getPublicMedia, getAllAccessibleMedia } from "../firestore.js";
import type { AudioItem } from "../types.js";
import { formatDuration } from "../player.js";
import type { PlayerHandle } from "../player.js";
import { getCacheStats, clearCache, CACHE_UPDATED_EVENT } from "../audio-cache.js";

function renderRow(item: AudioItem): string {
  const track =
    item.trackNumber !== null ? String(item.trackNumber) : "\u2014";
  const year = item.year !== null ? String(item.year) : "\u2014";

  return `<details class="expand-row audio-row" data-id="${escapeHtml(item.id)}" data-storage-path="${escapeHtml(item.storagePath)}" data-title="${escapeHtml(item.title)}" data-artist="${escapeHtml(item.artist)}" data-album="${escapeHtml(item.album)}">
    <summary>
      <div class="expand-summary">
        <label class="queue-checkbox"><input type="checkbox" data-queue-toggle aria-label="Add ${escapeHtml(item.title)} to queue" /></label>
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
    if (deferProgrammerError(error)) return '<h2>Library</h2><p id="media-error">Could not load audio library.</p>';
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
    <section id="cache-info">
      <p><span id="cache-stats"></span></p>
      <button id="clear-cache-btn" type="button">Clear audio cache</button>
    </section>
  `;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function refreshCacheStats(outlet: HTMLElement): void {
  const statsEl = outlet.querySelector<HTMLElement>("#cache-stats");
  if (!statsEl) {
    logError(new Error("#cache-stats element not found in outlet"), { operation: "cache-stats" });
    return;
  }
  getCacheStats()
    .then(({ trackCount, totalBytes }) => {
      statsEl.textContent = `${trackCount} track${trackCount !== 1 ? "s" : ""} cached (${formatBytes(totalBytes)})`;
    })
    .catch((err) => {
      logError(err, { operation: "cache-stats" });
      statsEl.textContent = "Cache stats unavailable";
    });
}

let clickAbort: AbortController | undefined;

export function afterRenderHome(
  outlet: HTMLElement,
  player: PlayerHandle,
): void {
  for (const row of outlet.querySelectorAll<HTMLElement>(".audio-row")) {
    const id = row.dataset.id;
    if (!id) continue;
    const checkbox = row.querySelector<HTMLInputElement>(
      "input[data-queue-toggle]",
    );
    if (checkbox) checkbox.checked = player.isQueued(id);
  }

  clickAbort?.abort();
  clickAbort = new AbortController();

  // stopPropagation prevents the click from toggling the parent <details> element
  outlet.addEventListener("click", (e) => {
    const checkbox = (e.target as HTMLElement).closest(
      "input[data-queue-toggle]",
    ) as HTMLInputElement | null;
    if (!checkbox) return;

    e.stopPropagation();

    const row = checkbox.closest(".audio-row") as HTMLElement | null;
    if (!row) return;

    const id = row.dataset.id;
    const storagePath = row.dataset.storagePath;
    const title = row.dataset.title;
    const artist = row.dataset.artist;
    const album = row.dataset.album;
    if (!id || !storagePath || !title || !artist || !album) {
      logError(new Error("Queue toggle: missing data attributes on audio row"), {
        operation: "queue-toggle",
      });
      checkbox.checked = !checkbox.checked;
      return;
    }

    if (checkbox.checked) {
      player.add({ id, title, artist, album, storagePath });
    } else {
      player.remove(id);
    }
  }, { signal: clickAbort.signal });

  refreshCacheStats(outlet);

  document.addEventListener(
    CACHE_UPDATED_EVENT,
    () => refreshCacheStats(outlet),
    { signal: clickAbort.signal },
  );

  const clearBtn = outlet.querySelector<HTMLButtonElement>("#clear-cache-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearCache()
        .then(() => refreshCacheStats(outlet))
        .catch((err) => {
          logError(err, { operation: "clear-cache" });
          const statsEl = outlet.querySelector<HTMLElement>("#cache-stats");
          if (statsEl) statsEl.textContent = "Failed to clear cache. Try again.";
        });
    }, { signal: clickAbort.signal });
  }
}
