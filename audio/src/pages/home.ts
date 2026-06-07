import { escapeHtml } from "@commons-systems/htmlutil";
import { logError } from "@commons-systems/errorutil/log";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import type { User } from "../auth.js";
import { DataIntegrityError } from "@commons-systems/firestoreutil/errors";
import type { AudioOrigin, LibraryItem } from "../types.js";
import { listLibrary } from "../library.js";
import {
  ensureLocalFolderRestored,
  getLocalFolderState,
  connectLocalFolder,
  regrantLocalFolder,
} from "../local-source.js";
import { formatDuration } from "../player.js";
import type { PlayerHandle } from "../player.js";
import { getCacheStats, clearCache, CACHE_UPDATED_EVENT } from "../audio-cache.js";

type LocalFolderState = ReturnType<typeof getLocalFolderState>;

function renderRow(item: LibraryItem): string {
  const track =
    item.trackNumber !== null ? String(item.trackNumber) : "—";
  const year = item.year !== null ? String(item.year) : "—";

  return `<details class="expand-row audio-row" data-id="${escapeHtml(item.id)}" data-origin="${escapeHtml(item.origin)}" data-storage-path="${escapeHtml(item.storagePath)}" data-local-name="${escapeHtml(item.localName ?? "")}" data-title="${escapeHtml(item.title)}" data-artist="${escapeHtml(item.artist)}" data-album="${escapeHtml(item.album)}">
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

function renderMediaList(items: LibraryItem[]): string {
  if (items.length === 0) {
    return '<p id="media-empty">No audio items available.</p>';
  }
  return `<div id="media-list">${items.map(renderRow).join("\n")}</div>`;
}

function renderFolderControls(state: LocalFolderState): string {
  let body: string;
  switch (state) {
    case "unsupported":
      body = '<p id="folder-note">Local folder library needs a Chromium browser.</p>';
      break;
    case "prompt":
      body = '<button id="reconnect-folder-btn" type="button">Reconnect folder</button>';
      break;
    case "granted":
      body =
        '<p id="folder-connected">Local folder connected.</p><button id="choose-folder-btn" type="button">Change folder</button>';
      break;
    case "none":
    case "denied":
    default:
      body = '<button id="choose-folder-btn" type="button">Choose folder</button>';
      break;
  }
  return `<section id="folder-controls">${body}</section>`;
}

export async function renderHome(user: User | null): Promise<string> {
  await ensureLocalFolderRestored();

  const state = getLocalFolderState();
  let regionHtml: string;
  try {
    const items = await listLibrary(user);
    regionHtml = `<div id="library-region">${renderFolderControls(state)}${renderMediaList(items)}</div>`;
  } catch (error) {
    if (error instanceof DataIntegrityError) throw error;
    if (!deferProgrammerError(error)) logError(error, { operation: "load-media" });
    regionHtml = `<div id="library-region">${renderFolderControls(state)}<p id="media-error">Could not load audio library.</p></div>`;
  }

  const publicNotice = !user
    ? '<p id="public-notice">Showing public domain items. Sign in to see your full library.</p>'
    : "";

  return `
    <h2>Library</h2>
    ${publicNotice}
    ${regionHtml}
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
let rescanning = false;

export function afterRenderHome(
  outlet: HTMLElement,
  player: PlayerHandle,
  user: User | null,
): void {
  function applyCheckboxState(): void {
    for (const row of outlet.querySelectorAll<HTMLElement>(".audio-row")) {
      const id = row.dataset.id;
      if (!id) continue;
      const checkbox = row.querySelector<HTMLInputElement>(
        "input[data-queue-toggle]",
      );
      if (checkbox) checkbox.checked = player.isQueued(id);
    }
  }

  applyCheckboxState();

  clickAbort?.abort();
  clickAbort = new AbortController();

  async function rerenderLibraryRegion(): Promise<void> {
    const regionEl = outlet.querySelector<HTMLElement>("#library-region");
    if (!regionEl) return;
    const state = getLocalFolderState();
    try {
      const items = await listLibrary(user);
      regionEl.innerHTML = `${renderFolderControls(state)}${renderMediaList(items)}`;
    } catch (err) {
      logError(err, { operation: "library-rescan" });
      return; // leave the current region intact
    }
    applyCheckboxState();
  }

  async function onFocus(): Promise<void> {
    if (rescanning) return;
    rescanning = true;
    try {
      await rerenderLibraryRegion();
    } finally {
      rescanning = false;
    }
  }
  window.addEventListener("focus", () => { void onFocus(); }, { signal: clickAbort.signal });

  // A single delegated click handler so replacing #library-region's innerHTML on
  // rerender never loses wiring. Button cases return early before the checkbox case.
  outlet.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.closest("#choose-folder-btn")) {
      e.preventDefault();
      connectLocalFolder()
        .then(() => rerenderLibraryRegion())
        .catch((err) => logError(err, { operation: "choose-folder" }));
      return;
    }

    if (target.closest("#reconnect-folder-btn")) {
      e.preventDefault();
      regrantLocalFolder()
        .then(() => rerenderLibraryRegion())
        .catch((err) => logError(err, { operation: "reconnect-folder" }));
      return;
    }

    const checkbox = target.closest(
      "input[data-queue-toggle]",
    ) as HTMLInputElement | null;
    if (!checkbox) return;

    // stopPropagation prevents the click from toggling the parent <details> element
    e.stopPropagation();

    const row = checkbox.closest(".audio-row") as HTMLElement | null;
    if (!row) return;

    const { id, title, artist, album, origin, storagePath, localName } = row.dataset;
    const locatorOk = origin === "local" ? !!localName : !!storagePath;
    if (!id || !title || !artist || !album || !origin || !locatorOk) {
      logError(new Error("Queue toggle: missing data attributes on audio row"), {
        operation: "queue-toggle",
      });
      checkbox.checked = !checkbox.checked;
      return;
    }

    if (checkbox.checked) {
      player.add({
        id,
        title,
        artist,
        album,
        origin: origin as AudioOrigin,
        ...(origin === "local" ? { localName } : { storagePath }),
      });
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
