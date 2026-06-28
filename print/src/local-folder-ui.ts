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

import { createLimiter } from "./concurrency.js";
import {
  createLocalSource,
  listLocal,
  resolveLocalBlob,
} from "./library.js";
import { extractMetadata } from "./local-metadata.js";
import { mediaTypeBadge } from "./media-render.js";
import {
  cacheMetadata,
  ensureLoaded,
  getMetadata,
  setLocalDirectory,
} from "./sidecar.js";
import type { MediaItem } from "./types.js";

/**
 * Peak in-flight file reads during local-folder enrichment. Mirrors audio's
 * concurrency value. Unit tests derive `limit + 1` from this to assert the
 * bound. The limiter is created ONCE at module load (below) — never per render
 * pass — so a focus-rescan mid-enrichment cannot spawn a second limiter and
 * double the peak read count, regardless of how many rows are visible.
 */
export const ENRICH_READ_CONCURRENCY = 16;
const limiter = createLimiter(ENRICH_READ_CONCURRENCY);

const store = createFsaHandleStore({ app: "print" });
const PURPOSE = "library-folder";
export const FOCUS_RESCAN_DEBOUNCE_MS = 400;

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
    let rescanTimer: ReturnType<typeof setTimeout> | null = null;
    const onFocus = () => {
      if (rescanTimer) clearTimeout(rescanTimer);
      rescanTimer = setTimeout(() => {
        rescanTimer = null;
        renderLocalIntoList(mediaListContainer).catch((err) =>
          logError(err, { operation: "local-folder-rescan" }),
        );
      }, FOCUS_RESCAN_DEBOUNCE_MS);
    };
    window.addEventListener("focus", onFocus);
    focusCleanup = () => {
      window.removeEventListener("focus", onFocus);
      if (rescanTimer) clearTimeout(rescanTimer);
    };
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
 * The accumulated detached enrichment of the current render pass (or
 * `Promise.resolve()` when none). Reset at the START of each
 * `renderLocalIntoList` pass, then folded forward SYNCHRONOUSLY inside the
 * IntersectionObserver callback as each visible row is scheduled, so
 * `settleEnrichment` always awaits the most recent pass's scheduled reads. The
 * twin of sidecar's `flushWrites`.
 */
let pendingEnrichment: Promise<void> = Promise.resolve();

/**
 * Handle to the previous render pass's IntersectionObserver, so each new pass
 * can disconnect it before building a fresh one — avoiding leaked observers and
 * observation of now-detached rows on a focus-rescan.
 */
let prevObserver: IntersectionObserver | null = null;

/**
 * Settle seam: resolves when the scheduled enrichment of the latest render pass
 * has finished (every intersected row patched and its single cache write
 * enqueued). Tests do `triggerIntersection(); await settleEnrichment();`, which
 * works because the observer callback folds each scheduled read into
 * `pendingEnrichment` synchronously before it returns. `bindAndRender` does NOT
 * await it — first paint is already done.
 */
export function settleEnrichment(): Promise<void> {
  return pendingEnrichment;
}

/**
 * Remove any stale local-folder scan-error notice from the container. A no-op
 * when none is present, so it is safe to call on every successful render pass.
 */
function clearLocalScanError(container: HTMLElement): void {
  container.querySelector("#local-folder-error")?.remove();
}

/**
 * Render an in-list scan-error notice with a retry button, anchored to the media
 * list (or the empty-state placeholder) inside `container`. The folder
 * open/grant buttons live in a separate nav section, so the notice is placed
 * relative to the list the user is looking at. The anchor deliberately excludes
 * `#media-error`: when the cloud list itself failed the user already sees an
 * error, so suppressing the local notice then is intentional. A list-less route
 * (e.g. the viewer page) has no anchor and is a silent no-op, mirroring
 * `renderLocalIntoList`'s own early return.
 */
function renderLocalScanError(container: HTMLElement, onRetry: () => void): void {
  clearLocalScanError(container);
  const anchor =
    container.querySelector("#media-list") ??
    container.querySelector("#media-empty");
  if (!anchor) return;
  const p = document.createElement("p");
  p.id = "local-folder-error";
  p.className = "local-folder-error";
  p.textContent = "Couldn't read this folder. ";
  const button = document.createElement("button");
  button.id = "local-folder-retry";
  button.type = "button";
  button.className = "local-folder-button";
  button.textContent = "Try again";
  button.addEventListener("click", onRetry);
  p.appendChild(button);
  anchor.insertAdjacentElement("beforebegin", p);
}

/**
 * Render the current local items into the shared media list, resolving at FIRST
 * PAINT: find (or create) the `#media-list` <ul>, do a single bounded sidecar
 * read, partition items into cached (overlaid with real metadata, zero file IO)
 * vs uncached (filename-stem rows), strip prior local rows, and insert all rows
 * immediately. Cold-folder metadata extraction for the uncached items is LAZY:
 * an IntersectionObserver schedules each row's bounded-concurrency read only as
 * it scrolls into view, so a folder of N files no longer kicks off N eager
 * reads — and a hung extract never blocks first paint or the focus listener. A
 * whole-scan failure surfaces an in-list error notice with a retry instead of
 * rejecting. No-ops when no media list or empty-state placeholder is present
 * (e.g. viewer page).
 */
export async function renderLocalIntoList(container: HTMLElement): Promise<void> {
  let items: MediaItem[];
  try {
    items = await listLocal();
  } catch (err) {
    // A whole-scan enumeration rejection leaves the user on cloud-only with no
    // signal. Surface it as an in-list notice with a retry rather than swallow
    // it. The retry re-invokes a fresh scan (scan() clears pendingScan in its
    // .finally), so it genuinely recovers.
    logError(err, { operation: "local-folder-scan" });
    renderLocalScanError(container, () =>
      renderLocalIntoList(container).catch((e) =>
        logError(e, { operation: "local-folder-rescan-retry" }),
      ),
    );
    return;
  }
  // A scan that previously failed but now succeeds must drop its stale notice.
  // Clear it as soon as recovery is confirmed — before the ul lookup and the
  // unrelated ensureLoaded() await — so the notice does not linger for the full
  // sidecar load.
  clearLocalScanError(container);
  let ul = container.querySelector<HTMLUListElement>("#media-list");
  if (!ul) {
    // Empty cloud library renders a `#media-empty` <p> instead of a <ul>.
    const empty = container.querySelector("#media-empty");
    if (!empty) return; // not on a page that has a media list — skip
    ul = document.createElement("ul");
    ul.id = "media-list";
    empty.replaceWith(ul);
  }
  // Single bounded sidecar read AFTER the early-return guard: a focus event on a
  // list-less route (e.g. the viewer) must not read the sidecar.
  await ensureLoaded();

  // Partition before insert. getMetadata is an in-memory lookup (zero file IO)
  // after ensureLoaded: a present entry overlays full title + pageCount now;
  // undefined keeps the filename-stem item and is queued for detached enrichment.
  const rows: MediaItem[] = [];
  const uncached: MediaItem[] = [];
  for (const item of items) {
    const cached = await getMetadata(item.storagePath);
    if (cached !== undefined) {
      rows.push(overlay(item, cached));
    } else {
      rows.push(item);
      uncached.push(item);
    }
  }

  for (const li of Array.from(ul.querySelectorAll(".media-item-local"))) {
    li.remove();
  }
  // Reset the accumulator at the START of the pass: first paint schedules no
  // enrichment yet — reads only begin as rows scroll into view (below).
  pendingEnrichment = Promise.resolve();

  ul.insertAdjacentHTML("afterbegin", renderLocalMediaItems(rows));
  // First paint is now done. Rows render filename-only; NO spinner yet.

  // Map each uncached row's NODE → item, looked up by id BY REFERENCE. item.id
  // is `local:<folderId>/<name>` (contains `:` and `/`) so the data-id selector
  // needs CSS.escape, not escapeHtml. Skip rows whose node lookup returns null.
  // Keying on the node lets the observer callback resolve an `entry.target`
  // back to its item. Patching the captured node (never a re-query at patch
  // time) means patching a now-detached node — removed by a later render pass —
  // succeeds silently but has no visible effect.
  const nodeItems = new Map<Element, MediaItem>();
  for (const item of uncached) {
    const node = ul.querySelector(`[data-id="${CSS.escape(item.id)}"]`);
    if (node === null) continue;
    nodeItems.set(node, item);
  }

  // Always tear down the previous pass's observer first: it observes rows this
  // pass has just removed (now detached), and a focus-rescan would otherwise
  // leak observers. A pass with zero uncached rows tears down and stops here —
  // no new observer.
  prevObserver?.disconnect();
  if (nodeItems.size === 0) {
    prevObserver = null;
    return;
  }

  // Lazy enrichment: read + extract a row's bytes only when it scrolls into
  // view. The callback is SYNCHRONOUS — all awaiting lives inside the scheduled
  // fn — so `pendingEnrichment` is folded forward before the callback yields,
  // making the `settleEnrichment` seam observable right after an intersection.
  //
  // Coherence under a mid-flight focus-rescan: the limiter is long-lived
  // (module-scoped), so a rescan reuses it rather than spawning a second one
  // that would double peak reads. In-flight tasks from the prior pass patch
  // now-detached nodes — a no-op via patchLocalRow's isConnected guard — and
  // their cacheMetadata write is idempotent for the same content, so the
  // long-lived limiter + per-pass observer combination stays coherent.
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      // One-shot: unobserve before scheduling so a re-fire can't double-read
      // (the per-row analog of budget's `loading` bool).
      observer.unobserve(entry.target);
      const item = nodeItems.get(entry.target);
      if (item === undefined) continue;
      const node = entry.target;
      markRowLoading(node);
      const p = limiter.schedule(() => enrichLocalItem({ item, node }));
      // Fold into the accumulator SYNCHRONOUSLY (before this callback yields).
      pendingEnrichment = Promise.allSettled([pendingEnrichment, p]).then(
        () => {},
      );
    }
  });
  prevObserver = observer;
  for (const node of nodeItems.keys()) {
    observer.observe(node);
  }
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

/**
 * Append a CSS-only loading spinner into the row's `.media-info`. Guards
 * against double-insert. No-op on a null or detached node.
 */
function markRowLoading(node: Element | null): void {
  if (node === null || !node.isConnected) return;
  const info = node.querySelector(".media-info");
  if (!info || info.querySelector(".media-loading")) return;
  const spinner = document.createElement("span");
  spinner.className = "media-loading";
  spinner.setAttribute("aria-hidden", "true");
  info.appendChild(spinner);
}

/**
 * Remove any `.media-loading` spinner from the row. No-op on a null or
 * detached node.
 */
function clearRowLoading(node: Element | null): void {
  if (node === null || !node.isConnected) return;
  node.querySelector(".media-loading")?.remove();
}

/**
 * Patch a captured local row in place with extracted metadata, building DOM via
 * textContent so no manual escaping is needed. A null or detached node is a
 * no-op. Clears the loading spinner (if present) before patching.
 */
function patchLocalRow(
  node: Element | null,
  meta: { title?: string; pageCount?: number },
): void {
  if (node === null || !node.isConnected) return;
  clearRowLoading(node);
  if (meta.title !== undefined) {
    const titleLink = node.querySelector(".media-title a");
    if (titleLink) titleLink.textContent = meta.title;
  }
  if (meta.pageCount !== undefined && !node.querySelector(".media-pagecount")) {
    const info = node.querySelector(".media-info");
    if (info) {
      const span = document.createElement("span");
      span.className = "media-pagecount";
      span.textContent = `${meta.pageCount} pages`;
      info.appendChild(span);
    }
  }
}

/**
 * Extract one uncached item's metadata, patch its captured row, and persist the
 * entry with a single incremental `cacheMetadata` write. Writes even when `meta`
 * is `{}` — that empty entry is what suppresses re-extraction on the next render
 * pass. Only an unreadable file (null blob) skips caching, leaving the
 * null-retry path open so a later focus re-extracts it rather than being
 * permanently suppressed by a cached `{}`.
 *
 * The loading spinner is cleared in a `finally`, REGARDLESS of outcome — so even
 * a null-blob fallback row (which never reaches `patchLocalRow`) never keeps a
 * stuck spinner. The inner try/catch swallows extract errors (logged); the
 * finally runs in addition.
 */
async function enrichLocalItem(
  target: { item: MediaItem; node: Element | null },
): Promise<void> {
  const { item, node } = target;
  try {
    try {
      const buf = await resolveLocalBlob(item);
      if (buf === null) {
        // Could not read this file — do NOT cache `{}` (that would permanently
        // suppress retry). A later focus retries.
        return;
      }
      const meta = await extractMetadata(buf, item.mediaType);
      patchLocalRow(node, meta);
      // Persist incrementally: a single entry, written even when `meta` is `{}`.
      await cacheMetadata(item.storagePath, meta);
    } catch (err) {
      logError(err, { operation: "local-folder-enrich", id: item.id });
    }
  } finally {
    clearRowLoading(node);
  }
}
