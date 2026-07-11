/**
 * The audio app's local-folder library source.
 *
 * A user picks a folder of their own audio files via the File System Access API;
 * its directory handle is persisted via `@commons-systems/local-first` (F1) so a
 * returning session restores it with zero clicks when permission is already
 * granted, or one click when permission is in the `prompt` state. The folder is
 * listed and resolved in place through the shared `createLocalFolderMediaSource`
 * (F2) — no upload, no Firestore round-trip for local items.
 *
 * This source is purely additive: it runs alongside the Firebase Storage cloud
 * path, which is unchanged. The library unions local and cloud tracks; this
 * module owns only the local side.
 */
import { createFsaHandleStore } from "@commons-systems/local-first/fsa-handle-store";
import { createLocalFolderMediaSource } from "@commons-systems/mediautil/local-folder";
import type { LocalDirectoryHandleLike } from "@commons-systems/mediautil/local-folder";
import { logError } from "@commons-systems/errorutil/log";
import {
  cacheMetadataBatch,
  clearLocalDirectory,
  getMetadata,
  setLocalDirectory,
} from "./sidecar.js";
import type { CachedMetadata } from "./sidecar.js";
import { extractAudioMetadata } from "./local-metadata.js";
import { mapWithConcurrency } from "./concurrency.js";
import { AUDIO_FORMATS, AUDIO_MIME_TYPES } from "./types.js";
import type { AudioFormat, AudioTags, LibraryItem } from "./types.js";

const PURPOSE = "library-folder";
/** Peak simultaneous file reads during enrichment. Each uncached file is
 * read fully into an ArrayBuffer before tag extraction; bounding this caps
 * peak memory so large folders don't OOM on low-RAM (≤2GB) devices. */
const ENRICH_READ_CONCURRENCY = 16;
const store = createFsaHandleStore({ app: "audio" });

type LocalFolderState = "unsupported" | "none" | "granted" | "prompt" | "denied";

let currentHandle: FileSystemDirectoryHandle | null = null;
let currentSource: ReturnType<typeof buildSource> | null = null;
let state: LocalFolderState = "none";
let restorePromise: Promise<void> | null = null;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

function formatFromName(name: string): AudioFormat | undefined {
  const ext = extensionOf(name);
  return (AUDIO_FORMATS as readonly string[]).includes(ext)
    ? (ext as AudioFormat)
    : undefined;
}

function mimeFromName(name: string): string {
  const fmt = formatFromName(name);
  if (!fmt) throw new Error(`Unsupported audio format for '${name}'`);
  return AUDIO_MIME_TYPES[fmt];
}

function titleFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? name : name.slice(0, dot);
}

/** Map a top-level file to a library record, or null to skip a non-audio file. */
function toItem(file: File, name: string): LibraryItem | null {
  const fmt = formatFromName(name);
  if (!fmt) return null;
  return {
    id: "local:" + name,
    title: titleFromName(name),
    artist: "Unknown artist",
    album: "Unknown album",
    trackNumber: null,
    genre: "",
    year: null,
    duration: 0,
    format: fmt,
    publicDomain: false,
    sourceNotes: "Local file",
    storagePath: "",
    groupId: null,
    memberEmails: [],
    addedAt: new Date(file.lastModified).toISOString(),
    origin: "local",
    localName: name,
  };
}

/**
 * Overlay cached/extracted `AudioTags` onto a listed item, cache-first. Only a
 * present tag field wins, so an empty `{}` extract keeps the synchronous
 * placeholders `toItem` emitted (filename-stem title, "Unknown artist", etc.).
 * Never mutates — LibraryItem fields are readonly, so this spreads a new object.
 * (For a wav: tags has no title → the filename-stem title is preserved; tags
 * carries a real duration → that real duration is shown.)
 */
function overlay(item: LibraryItem, tags: AudioTags): LibraryItem {
  return {
    ...item,
    title: tags.title ?? item.title,
    artist: tags.artist ?? item.artist,
    album: tags.album ?? item.album,
    trackNumber: tags.trackNumber ?? item.trackNumber,
    genre: tags.genre ?? item.genre,
    year: tags.year ?? item.year,
    duration: tags.duration ?? item.duration,
  };
}

function buildSource(directoryHandle: FileSystemDirectoryHandle) {
  return createLocalFolderMediaSource<LibraryItem>({
    directory: directoryHandle as unknown as LocalDirectoryHandleLike,
    toItem,
  });
}

/**
 * Bind a granted handle as the live local folder and hand it to the sidecar
 * owner. `isWritable` flows to `setLocalDirectory` so the sidecar knows whether
 * disk writes are allowed (read-only binds make sidecar writes no-op). This is
 * the SINGLE handoff point — every grant path (connect / restore / regrant)
 * funnels through here so the sidecar is bound before `listLocalTracks` runs.
 */
function bindFolder(handle: FileSystemDirectoryHandle, isWritable: boolean): void {
  currentHandle = handle;
  currentSource = null;
  state = "granted";
  setLocalDirectory(handle, isWritable);
}

/** True when the browser can pick and persist an on-disk folder handle. */
export function isLocalFolderSupported(): boolean {
  return store.isSupported() && "showDirectoryPicker" in window;
}

/**
 * Prompt the user to pick a folder (readwrite), persist its handle, and mark the
 * source connected. A successful pick grants readwrite, so the sidecar binds
 * writable. Must be called from within a user gesture.
 */
export async function connectLocalFolder(): Promise<void> {
  const picker = window as unknown as {
    showDirectoryPicker(o: {
      mode: "readwrite";
    }): Promise<FileSystemDirectoryHandle>;
  };
  const handle = await picker.showDirectoryPicker({ mode: "readwrite" });
  await store.put(PURPOSE, handle);
  bindFolder(handle, true);
}

async function restore(): Promise<void> {
  if (!isLocalFolderSupported()) {
    state = "unsupported";
    return;
  }
  const loaded = await store.get(PURPOSE);
  if (!loaded) {
    state = "none";
    return;
  }
  const handle = loaded as FileSystemDirectoryHandle;
  // Query only — never request permission at startup (no user gesture). Prefer
  // readwrite (needed to write the sidecar); fall back to a read-only bind when
  // only read is granted (extraction still works in-memory; sidecar writes
  // no-op).
  const rw = await store.queryPermission(handle, "readwrite");
  if (rw === "granted") {
    bindFolder(handle, true);
    return;
  }
  const r = await store.queryPermission(handle, "read");
  if (r === "granted") {
    bindFolder(handle, false);
    return;
  }
  state = r; // "prompt" | "denied"
}

/** Restore the persisted folder once per session (memoized). */
export function ensureLocalFolderRestored(): Promise<void> {
  if (!restorePromise) restorePromise = restore();
  return restorePromise;
}

/** The current local-folder state. */
export function getLocalFolderState(): LocalFolderState {
  return isLocalFolderSupported() ? state : "unsupported";
}

/**
 * Re-grant permission on the persisted handle (one click). Must be called from
 * within a user gesture. Returns true iff permission ends up granted.
 */
export async function regrantLocalFolder(): Promise<boolean> {
  const loaded = await store.get(PURPOSE);
  if (!loaded) {
    state = "none";
    return false;
  }
  const handle = loaded as FileSystemDirectoryHandle;
  // Request within the gesture — ensurePermission only prompts on "prompt".
  // Prefer readwrite; fall back to a read-only bind when only read is granted.
  const rw = await store.ensurePermission(handle, "readwrite");
  if (rw === "granted") {
    bindFolder(handle, true);
    return true;
  }
  const r = await store.ensurePermission(handle, "read");
  if (r === "granted") {
    bindFolder(handle, false);
    return true;
  }
  state = r;
  return false;
}

/** Forget the persisted folder and disconnect the source. */
export async function disconnectLocalFolder(): Promise<void> {
  await store.remove(PURPOSE);
  clearLocalDirectory();
  currentHandle = null;
  currentSource = null;
  state = "none";
}

/** True when a folder is connected and usable this session. */
export function hasLocalFolder(): boolean {
  return currentHandle !== null;
}

/**
 * List the connected folder's audio tracks, overlaying any ALREADY-cached
 * metadata from the in-memory sidecar model so an already-enriched folder shows
 * real tags immediately on first render. This is cheap and does NO disk IO:
 * `getMetadata` calls `ensureLoaded` internally, which is a no-op once the model
 * is cached. Uncached items keep their synchronous placeholders until the async
 * `enrichLocalTracks` pass (Unit 5) extracts and caches their real tags.
 *
 * This path overlays whatever is cached and does NOT validate the fingerprint
 * (no `getFile()`): it is the cheap first-render overlay. The post-render
 * `enrichLocalTracks` pass detects a stale entry (fingerprint mismatch),
 * re-extracts, and re-caches; a later re-render then overlays the fresh cache.
 * This keeps the cheap-list / IO-enrichment split.
 * Returns [] when none / on error.
 */
export async function listLocalTracks(): Promise<LibraryItem[]> {
  await ensureLocalFolderRestored();
  if (!currentHandle) return [];
  try {
    currentSource ??= buildSource(currentHandle);
    const { items } = await currentSource.list();
    return Promise.all(
      items.map(async (item) => {
        const cached = item.localName ? await getMetadata(item.localName) : undefined;
        return cached !== undefined ? overlay(item, cached.tags) : item;
      }),
    );
  } catch (err) {
    logError(err, { operation: "list-local-tracks" });
    return [];
  }
}

/**
 * Resolve a local track's bytes to a blob URL for playback. Throws if no folder
 * is connected; a vanished file surfaces as a thrown error from the shared source
 * (a fresh source rescans the folder on a cache miss), which the player catches
 * to skip the track.
 */
export async function resolveLocalAudioSource(localName: string): Promise<string> {
  if (!currentHandle) {
    throw new Error("resolveLocalAudioSource called with no connected local folder");
  }
  const type = mimeFromName(localName);
  currentSource ??= buildSource(currentHandle);
  const buf = await currentSource.resolveToBlob({
    id: "local:" + localName,
  } as LibraryItem);
  return URL.createObjectURL(new Blob([buf], { type }));
}

/**
 * Resolve a listed local item to its `File` for metadata enrichment, or null
 * when unavailable. Distinct from `resolveLocalAudioSource` (which wraps bytes in
 * a blob URL for `<audio>`) — enrichment needs the File so it can read both the
 * content fingerprint (`size`/`lastModified`) and, on a cache miss, the bytes.
 *
 * DESIGN NOTE — returns null on ANY failure ON PURPOSE; do not "correct" this to
 * throw. The repo code-style rule prefers clear errors over fallbacks, but this
 * is a deliberate, documented exception: enrichment is BEST-EFFORT and runs over
 * every listed file. A vanished file ("Local file no longer present"), a read
 * miss, or a permission error here is a skip-and-retry-later signal, not a
 * misconfiguration to surface. The enrichment path relies on the null return to
 * AVOID caching an empty `{}` (which would permanently suppress a retry). The
 * error is still logged for observability before returning null.
 */
export async function resolveLocalFile(item: LibraryItem): Promise<File | null> {
  if (!currentHandle) return null;
  currentSource ??= buildSource(currentHandle);
  try {
    return await currentSource.resolveToFile(item);
  } catch (err) {
    logError(err, { operation: "resolve-local-file" });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Async metadata enrichment overlay (cache-first w/ fingerprint re-validation,
// single batched write).
//
// `listLocalTracks` overlays whatever is cached (cheap, no IO, no fingerprint
// check). This pass reads each file's content fingerprint (`size` +
// `lastModified`) and:
//   - FRESH cache hit (fingerprint matches): overlay the cached tags, no
//     extraction, no `arrayBuffer()` read — cheap.
//   - MISS or MISMATCH (no cache, fingerprint differs, or a legacy v1 entry
//     already dropped at parse): re-extract from the bytes and cache the new
//     tags WITH the new fingerprint, so the next render overlays fresh data.
// Unit 5 invokes `enrichLocalTracks` AFTER the initial render.
//
// Write suppression: an entry is accumulated ONLY when extraction actually ran
// (a real miss/mismatch with a readable file). A focus-rescan where every
// fingerprint matches finds every item fresh → `newEntries` is empty →
// `cacheMetadataBatch` no-ops (no disk write). An unreadable file (resolve null
// or a TOCTOU `arrayBuffer()` failure) must NOT contribute an entry (do not
// cache `{}`), so a transient read failure retries on the next pass.
// ---------------------------------------------------------------------------

/** Result of enriching one item: an optional new cache entry (`[localName,
 * CachedMetadata]`) to be persisted in the pass's single batched write. `entry`
 * is null when nothing new was extracted (fresh cache hit, no localName, or an
 * unreadable file) so it contributes nothing to the batch.
 *
 * This pass does NOT overlay the listed item: enrichment exists only to populate
 * the sidecar cache. The user-visible tags (fresh or stale-but-cached) come from
 * `listLocalTracks`'s own cache overlay on the next render, so there is nothing
 * to return for display. */
interface EnrichResult {
  entry: [string, CachedMetadata] | null;
}

async function enrichLocalItem(item: LibraryItem): Promise<EnrichResult> {
  const localName = item.localName;
  // Cloud-shaped safety; local items always carry a localName.
  if (!localName) return { entry: null };
  const cached = await getMetadata(localName);
  const file = await resolveLocalFile(item);
  // Could not read this file: contribute no entry (do NOT cache `{}` — that
  // would permanently suppress a retry). A later pass retries. The cached
  // (stale-but-present) tags stay user-visible via `listLocalTracks`'s overlay.
  if (file === null) {
    return { entry: null };
  }
  const fp = { size: file.size, lastModified: file.lastModified };
  // Fresh cache hit: the file's content is unchanged since extraction. Skip
  // extraction — no `arrayBuffer()` read — and contribute no new entry.
  if (cached !== undefined && cached.size === fp.size && cached.lastModified === fp.lastModified) {
    return { entry: null };
  }
  // Miss or mismatch: read the bytes and re-extract. Guard `arrayBuffer()` in a
  // try/catch — TOCTOU: the file can vanish between `getFile()` and the byte
  // read. On failure, contribute no entry so a later pass retries (the cached
  // tags, if any, remain visible through `listLocalTracks`).
  let buf: ArrayBuffer;
  try {
    buf = await file.arrayBuffer();
  } catch (err) {
    logError(err, { operation: "enrich-local-item" });
    return { entry: null };
  }
  const tags = await extractAudioMetadata(buf, item.format);
  // Contribute this entry to the pass's single batched write, fingerprinted with
  // the file's current size/lastModified (an empty `{}` extract is still a
  // present entry: it caches so we don't re-extract a tagless file every pass).
  return { entry: [localName, { tags, ...fp }] };
}

async function enrichLocalItems(items: LibraryItem[]): Promise<void> {
  const results = await mapWithConcurrency(
    items,
    ENRICH_READ_CONCURRENCY,
    enrichLocalItem,
  );
  const newEntries = Object.fromEntries(
    results.filter((r) => r.entry !== null).map((r) => r.entry as [string, CachedMetadata]),
  );
  // Empty → no-op (write suppression on a focus-rescan with no changed files).
  await cacheMetadataBatch(newEntries);
}

/**
 * Extract real tags for any uncached local files and populate the sidecar cache
 * (a later re-render's `listLocalTracks` then overlays the fresh cache). Unit 5
 * calls this AFTER the initial render. Best-effort: a scan error is logged and
 * swallowed.
 */
export async function enrichLocalTracks(): Promise<void> {
  await ensureLocalFolderRestored();
  if (!currentHandle) return;
  try {
    currentSource ??= buildSource(currentHandle);
    // list() also populates the source index so resolveLocalFile finds handles.
    const { items } = await currentSource.list();
    await enrichLocalItems(items);
  } catch (err) {
    logError(err, { operation: "enrich-local-tracks" });
  }
}
