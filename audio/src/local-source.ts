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
  getMetadata,
  setLocalDirectory,
} from "./sidecar.js";
import { extractAudioMetadata } from "./local-metadata.js";
import { AUDIO_FORMATS } from "./types.js";
import type { AudioFormat, AudioTags, LibraryItem } from "./types.js";

const PURPOSE = "library-folder";
const store = createFsaHandleStore({ app: "audio" });

const MIME_TYPES: Record<AudioFormat, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  flac: "audio/flac",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

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
  return MIME_TYPES[fmt];
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
 * Returns [] when none / on error.
 */
export async function listLocalTracks(): Promise<LibraryItem[]> {
  await ensureLocalFolderRestored();
  if (!currentHandle) return [];
  try {
    currentSource ??= buildSource(currentHandle);
    const items = await currentSource.list();
    return Promise.all(
      items.map(async (item) => {
        const cached = item.localName ? await getMetadata(item.localName) : undefined;
        return cached !== undefined ? overlay(item, cached) : item;
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
 * Resolve a listed local item's raw bytes for metadata enrichment, or null when
 * unavailable. Distinct from `resolveLocalAudioSource` (which wraps bytes in a
 * blob URL for `<audio>`) — enrichment needs the raw ArrayBuffer, not a URL.
 *
 * DESIGN NOTE — returns null on ANY failure ON PURPOSE; do not "correct" this to
 * throw. The repo code-style rule prefers clear errors over fallbacks, but this
 * is a deliberate, documented exception: enrichment is BEST-EFFORT and runs over
 * every listed file. A vanished file ("Local file no longer present"), a read
 * miss, or a permission error here is a skip-and-retry-later signal, not a
 * misconfiguration to surface. Unit 4 relies on the null return to AVOID caching
 * an empty `{}` (which would permanently suppress a retry). The error is still
 * logged for observability before returning null.
 */
export async function resolveLocalBytes(
  item: LibraryItem,
): Promise<ArrayBuffer | null> {
  if (!currentHandle) return null;
  currentSource ??= buildSource(currentHandle);
  try {
    return await currentSource.resolveToBlob(item);
  } catch (err) {
    logError(err, { operation: "resolve-local-bytes" });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Async metadata enrichment overlay (cache-first, single batched write).
//
// `listLocalTracks` overlays only ALREADY-cached tags (cheap, no IO). This pass
// extracts real tags for the UNCACHED files and populates the cache, so a later
// re-render's `listLocalTracks` overlays the fresh entries. Unit 5 invokes
// `enrichLocalTracks` AFTER the initial render.
//
// Write suppression: an entry is accumulated ONLY when the cache was `undefined`
// AND the bytes read OK. A focus-rescan with no new files finds every item
// already cached → `newEntries` is empty → `cacheMetadataBatch` no-ops (no disk
// write). A `null` (unreadable) buffer must NOT contribute an entry (do not
// cache `{}`), so a transient read failure retries on the next pass.
// ---------------------------------------------------------------------------

/** Result of enriching one item: the overlaid item plus an optional new cache
 * entry (`[localName, tags]`) to be persisted in the pass's single batched
 * write. `entry` is null when nothing new was extracted (cached hit, no
 * localName, or an unreadable file) so it contributes nothing to the batch. */
interface EnrichResult {
  item: LibraryItem;
  entry: [string, AudioTags] | null;
}

async function enrichLocalItem(item: LibraryItem): Promise<EnrichResult> {
  const localName = item.localName;
  // Cloud-shaped safety; local items always carry a localName.
  if (!localName) return { item, entry: null };
  const cached = await getMetadata(localName);
  // Present entry (even `{}`) means already extracted — overlay, no new entry.
  if (cached !== undefined) return { item: overlay(item, cached), entry: null };
  // No entry yet: read bytes and extract. `resolveLocalBytes` catches its own
  // errors (returns null) and `extractAudioMetadata` returns `{}` on any parse
  // failure, so no try/catch is needed here.
  const buf = await resolveLocalBytes(item);
  // Could not read this file — do NOT cache `{}` (that would permanently
  // suppress retry). A later pass retries.
  if (buf === null) return { item, entry: null };
  const tags = await extractAudioMetadata(buf, item.format);
  // Contribute this entry to the pass's single batched write (an empty `{}`
  // extract is still a present entry: it caches so we don't re-extract a tagless
  // file every pass, and `overlay` with `{}` keeps the placeholders).
  return { item: overlay(item, tags), entry: [localName, tags] };
}

async function enrichLocalItems(items: LibraryItem[]): Promise<LibraryItem[]> {
  const results = await Promise.all(items.map((item) => enrichLocalItem(item)));
  const newEntries = Object.fromEntries(
    results.filter((r) => r.entry !== null).map((r) => r.entry as [string, AudioTags]),
  );
  // Empty → no-op (write suppression on a focus-rescan with no new files).
  await cacheMetadataBatch(newEntries);
  return results.map((r) => r.item);
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
    // list() also populates the source index so resolveLocalBytes finds handles.
    const items = await currentSource.list();
    await enrichLocalItems(items);
  } catch (err) {
    logError(err, { operation: "enrich-local-tracks" });
  }
}
