/**
 * Local-folder UI controller: lets the user pick a folder of PDFs / EPUBs and
 * shows its items in the library, unioned with the cloud list. The chosen
 * directory handle is persisted via the shared `FsaHandleStore`
 * (`@commons-systems/local-first`) so a returning session needs no picker when
 * permission is `granted`, or one click when in the `prompt` state.
 *
 * The folder button lives in the nav (next to Login), initialized once at app
 * startup. `renderLocalIntoList` is exported so the home page can repopulate
 * local items on each render. Non-Chromium browsers (no FSA) get nothing here
 * and stay on the cloud-only path.
 */
import { escapeHtml } from "@commons-systems/htmlutil";
import { createFsaHandleStore } from "@commons-systems/local-first/fsa-handle-store";
import { logError } from "@commons-systems/errorutil/log";

import {
  createLocalSource,
  listLocal,
  resolveLocalBlob,
} from "./library.js";
import { extractMetadata } from "./local-metadata.js";
import { mediaTypeBadge } from "./media-render.js";
import {
  cacheMetadataBatch,
  ensureLoaded,
  getMetadata,
  setLocalDirectory,
} from "./sidecar.js";
import type { MediaItem } from "./types.js";

const store = createFsaHandleStore({ app: "print" });
const PURPOSE = "library-folder";

export type FolderUiState = "open" | "grant" | "list";

/**
 * Decide which control to show, purely from the persisted handle and its
 * queried permission. No IO — unit-tested in isolation.
 */
export function decideFolderUiState(
  handle: unknown,
  permission: string,
): FolderUiState {
  if (handle === null || handle === undefined) return "open";
  if (permission === "granted") return "list";
  if (permission === "prompt") return "grant";
  return "open"; // denied / unknown
}

// Window-focus rescan listener cleanup — one at a time, replaced on rebind.
let focusCleanup: (() => void) | null = null;

export async function initLocalFolder(
  section: HTMLElement,
  mediaListContainer: HTMLElement,
  onSourceBound?: () => void,
): Promise<(() => void) | null> {
  if (!store.isSupported()) {
    // Non-Chromium: no FSA, stay on the cloud-only path. Render nothing.
    return null;
  }

  const handle = await store.get(PURPOSE);
  const permission = handle
    ? await store.queryPermission(handle, "readwrite")
    : "denied";
  const state = decideFolderUiState(handle, permission);

  async function bindAndRender(dir: FileSystemDirectoryHandle, isWritable: boolean): Promise<void> {
    setLocalDirectory(dir, isWritable);
    createLocalSource(dir);
    await renderLocalIntoList(mediaListContainer);
    if (focusCleanup) focusCleanup();
    const onFocus = () => {
      renderLocalIntoList(mediaListContainer).catch((err) =>
        logError(err, { operation: "local-folder-rescan" }),
      );
    };
    window.addEventListener("focus", onFocus);
    focusCleanup = () => window.removeEventListener("focus", onFocus);
    // Signal that localSource is now bound — lets the caller re-render a
    // viewer route that was stuck on Not Found before this bind (any path:
    // auto-bind, grant-click, or first-open picker).
    onSourceBound?.();
  }

  async function openFolder(): Promise<void> {
    try {
      const dir = await window.showDirectoryPicker!({ mode: "readwrite" });
      await store.put(PURPOSE, dir);
      await bindAndRender(dir, true);
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
      throw e;
    }
  }

  if (state === "open") {
    section.innerHTML =
      '<button id="local-folder-open" class="local-folder-button" type="button">Open folder…</button>';
    section
      .querySelector<HTMLButtonElement>("#local-folder-open")!
      .addEventListener("click", () => {
        openFolder().catch((err) =>
          logError(err, { operation: "local-folder-open" }),
        );
      });
  } else if (state === "grant") {
    section.innerHTML =
      '<button id="local-folder-grant" class="local-folder-button" type="button">Grant access to your folder</button>';
    section
      .querySelector<HTMLButtonElement>("#local-folder-grant")!
      .addEventListener("click", () => {
        void (async () => {
          const res = await store.requestPermission(handle!, "readwrite");
          if (res === "granted") {
            section.innerHTML = "";
            await bindAndRender(handle as FileSystemDirectoryHandle, true);
          }
        })().catch((err) =>
          logError(err, { operation: "local-folder-grant" }),
        );
      });
  } else {
    // "list" — permission already granted, bind and render.
    section.innerHTML = "";
    await bindAndRender(handle as FileSystemDirectoryHandle, true);
  }

  return () => {
    if (focusCleanup) {
      focusCleanup();
      focusCleanup = null;
    }
  };
}

/**
 * Render local-folder items as `<li>` rows for prepending into the shared media
 * list. Local items get a "local" badge and a view link, but no download /
 * markdown actions — their bytes live on the user's disk, not in cloud storage.
 */
function renderLocalMediaItems(items: MediaItem[]): string {
  return items
    .map((item) => {
      return `<li class="media-item media-item-local" data-id="${escapeHtml(item.id)}">
        <div class="media-info">
          <span class="media-title"><a href="/view/${encodeURIComponent(item.id)}">${escapeHtml(item.title)}</a></span>
          ${mediaTypeBadge(item.mediaType)}
          <span class="media-badge media-badge-local">local</span>
          ${item.pageCount !== undefined ? `<span class="media-pagecount">${escapeHtml(String(item.pageCount))} pages</span>` : ""}
        </div>
      </li>`;
    })
    .join("\n");
}

/**
 * Render the current local items into the shared media list, idempotently:
 * find (or create) the `#media-list` <ul>, strip prior local rows, and prepend
 * freshly-rendered ones before the cloud rows. No-ops when no media list or
 * empty-state placeholder is present (e.g. viewer page).
 */
export async function renderLocalIntoList(container: HTMLElement): Promise<void> {
  const items = await listLocal();
  let ul = container.querySelector<HTMLUListElement>("#media-list");
  if (!ul) {
    // Empty cloud library renders a `#media-empty` <p> instead of a <ul>.
    const empty = container.querySelector("#media-empty");
    if (!empty) return; // not on a page that has a media list — skip
    ul = document.createElement("ul");
    ul.id = "media-list";
    empty.replaceWith(ul);
  }
  // Enrich AFTER the early-return guard: a focus event on a list-less route
  // (e.g. the viewer) must not read bytes or write the sidecar.
  const enriched = await enrichLocalItems(items);
  for (const li of Array.from(ul.querySelectorAll(".media-item-local"))) {
    li.remove();
  }
  ul.insertAdjacentHTML("afterbegin", renderLocalMediaItems(enriched));
}

/**
 * Overlay real metadata (title + pageCount) onto each local `MediaItem`,
 * cache-first. Keys the sidecar on `item.storagePath` (the BARE FILENAME, never
 * the `local:<folderId>/<name>` id). Items with a cached entry are overlaid with
 * zero IO and zero writes; items with NO entry (`getMetadata` returns undefined)
 * are read via `resolveLocalBlob`, extracted, and accumulated for a single
 * batched cache write.
 *
 * Single batched write: each newly-extracted entry is collected and persisted in
 * ONE `cacheMetadataBatch` call after `Promise.all` resolves, rather than N
 * sequential full-file index.json rewrites (one per new file). At N new files
 * this is 1 disk write instead of N.
 *
 * Write suppression on focus-rescan: an entry is accumulated only for items whose
 * cache entry was `undefined` and whose bytes extracted successfully (even an
 * empty extract contributes a present `{}` entry, which is defined). A focus
 * event with no new files therefore finds every item already cached, so the
 * batch is empty and `cacheMetadataBatch` writes nothing.
 */
async function enrichLocalItems(items: MediaItem[]): Promise<MediaItem[]> {
  await ensureLoaded();
  const results = await Promise.all(items.map((item) => enrichLocalItem(item)));
  const newEntries = Object.fromEntries(
    results
      .filter((r) => r.entry !== null)
      .map((r) => r.entry as [string, { title?: string; pageCount?: number }]),
  );
  await cacheMetadataBatch(newEntries);
  return results.map((r) => r.item);
}

/** Result of enriching one item: the overlaid item plus an optional new cache
 * entry (`[storagePath, meta]`) to be persisted in the render pass's batched
 * write. `entry` is null when nothing new was extracted (cached hit, unreadable
 * file, or extract error) so it contributes nothing to the batch. */
interface EnrichResult {
  item: MediaItem;
  entry: [string, { title?: string; pageCount?: number }] | null;
}

function overlay(
  item: MediaItem,
  meta: { title?: string; pageCount?: number },
): MediaItem {
  // Never mutate — MediaItem fields are readonly. Only overlay a field when the
  // metadata value is present, so an empty extract keeps the filename-stem title.
  return {
    ...item,
    title: meta.title ?? item.title,
    pageCount: meta.pageCount ?? item.pageCount,
  };
}

async function enrichLocalItem(item: MediaItem): Promise<EnrichResult> {
  const cached = await getMetadata(item.storagePath);
  // Present entry (even `{}`) means already extracted — overlay, no new entry.
  if (cached !== undefined) return { item: overlay(item, cached), entry: null };

  // No entry yet: read bytes and extract, tolerating a bad file.
  try {
    const buf = await resolveLocalBlob(item);
    if (buf === null) {
      // Could not read this file — do NOT cache `{}` (that would permanently
      // suppress retry). Fall back to the existing item; a later focus retries.
      return { item, entry: null };
    }
    const meta = await extractMetadata(buf, item.mediaType);
    // Contribute this entry to the render pass's single batched write.
    return { item: overlay(item, meta), entry: [item.storagePath, meta] };
  } catch (err) {
    logError(err, { operation: "local-folder-enrich", id: item.id });
    return { item, entry: null };
  }
}
