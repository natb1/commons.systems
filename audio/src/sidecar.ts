// Owns the `.commons-audio/index.json` sidecar for a local (on-disk) audio
// folder: one in-memory JSON model holding ALL local items' metadata cache plus
// the player-state and playlists for local items, persisted back into the
// user's own folder so the data rides their folder sync and works fully
// unauthenticated.
//
// Cloud items are untouched (they use Firestore). This module is the single
// owner of the retained directory handle and the only writer of the sidecar —
// the metadata cache path (Unit 3) and the player-state path funnel their
// writes through here so saving the player position never clobbers the metadata
// cache or a sibling entry.
//
// The metadata map is keyed on the BARE FILENAME (`localName`), NOT
// `item.storagePath`: a local item's `storagePath` is the empty string (see
// types.ts / local-source.ts toItem), so keying on it would collide every local
// item on `""`. The persisted player-state queue is LOCAL-ONLY and identifies
// the current track by its `localName` (a filename), NOT a numeric queue index:
// the live in-memory queue interleaves cloud + local items, so a mixed-queue
// numeric index could not round-trip through a local-only persisted queue.

import { logError } from "@commons-systems/errorutil/log";
import type { AudioTags } from "./types.js";

const SIDECAR_DIR = ".commons-audio";
const SIDECAR_FILE = "index.json";

// ---------------------------------------------------------------------------
// A. Pure schema + helpers (exported for Unit 8 tests)
// ---------------------------------------------------------------------------

/**
 * Persisted player-state for the LOCAL queue. The live queue interleaves cloud +
 * local items, but only the local items survive a reload, so the queue is a list
 * of `localName`s and the current track is named (not indexed).
 */
export interface PlayerState {
  /** Ordered localNames of the local-only persisted queue. */
  queue: string[];
  /** localName of the current track, when that track is local. */
  currentLocalName?: string;
  /** Playback position (seconds) of the current track. */
  positionSeconds?: number;
}

export interface SidecarData {
  version: 1;
  /** Metadata cache, keyed by localName (bare filename). */
  metadata: Record<string, AudioTags>;
  /** Player-state for the local queue (absent until first saved). */
  playerState?: PlayerState;
  /** Playlists, keyed by name; each value is a list of localNames. */
  playlists?: Record<string, string[]>;
}

/** The shape a patch may carry — an arbitrary subset of fields, playerState partial. */
type SidecarPatch = Partial<{
  metadata: Record<string, AudioTags>;
  playerState: Partial<PlayerState>;
  playlists: Record<string, string[]>;
}>;

/** A fresh, empty model. playerState stays undefined; playlists stays `{}`. */
function emptyModel(): SidecarData {
  return { version: 1, metadata: {}, playlists: {} };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Coerce a raw `metadata` value into the typed cache, keeping only entries whose
 * value is a plain object and, within each, only the leaves whose type matches
 * `AudioTags` (`title`/`artist`/`album`/`genre` strings; `trackNumber`/`year`/
 * `duration` numbers). Wrong-typed leaves are dropped so a malformed on-disk
 * entry can never surface as a non-string title or non-number duration
 * downstream.
 */
function coerceMetadata(raw: unknown): Record<string, AudioTags> {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, AudioTags> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isPlainObject(value)) continue;
    const entry: AudioTags = {};
    if (typeof value.title === "string") entry.title = value.title;
    if (typeof value.artist === "string") entry.artist = value.artist;
    if (typeof value.album === "string") entry.album = value.album;
    if (typeof value.genre === "string") entry.genre = value.genre;
    if (typeof value.trackNumber === "number" && Number.isFinite(value.trackNumber))
      entry.trackNumber = value.trackNumber;
    if (typeof value.year === "number" && Number.isFinite(value.year)) entry.year = value.year;
    if (typeof value.duration === "number" && Number.isFinite(value.duration))
      entry.duration = value.duration;
    out[key] = entry;
  }
  return out;
}

/**
 * Coerce a raw `playerState` value. A non-plain-object yields undefined; any
 * plain object (even `{}`) yields at least `{ queue: [] }`. `queue` keeps only a
 * string-element array (defaulting to `[]`); `currentLocalName`/`positionSeconds`
 * are kept only when their type matches, so a malformed field is dropped at the
 * system edge.
 */
function coercePlayerState(raw: unknown): PlayerState | undefined {
  if (!isPlainObject(raw)) return undefined;
  const queue = Array.isArray(raw.queue)
    ? raw.queue.filter((v): v is string => typeof v === "string")
    : [];
  const out: PlayerState = { queue };
  if (typeof raw.currentLocalName === "string") out.currentLocalName = raw.currentLocalName;
  if (typeof raw.positionSeconds === "number" && Number.isFinite(raw.positionSeconds))
    out.positionSeconds = raw.positionSeconds;
  return out;
}

/**
 * Coerce a raw `playlists` value into the typed map, keeping only entries whose
 * value is an array and filtering that array to its string elements. A
 * non-plain-object yields `{}`.
 */
function coercePlaylists(raw: unknown): Record<string, string[]> {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, string[]> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    out[name] = value.filter((v): v is string => typeof v === "string");
  }
  return out;
}

/**
 * Parse sidecar text into a model. Tolerant of untrusted/partial on-disk
 * contents (input validation at the system edge, not a banned fallback):
 * - JSON parse failure or a non-object top level → log + `null` (signals
 *   corruption; the caller must not overwrite the file).
 * - `metadata`, `playerState`, and `playlists` are coerced INDEPENDENTLY, so
 *   malformed metadata never discards a good playerState and vice-versa.
 * - Within each field, wrong-typed leaves are dropped.
 * - `version` is forced to 1.
 * Never throws.
 */
export function parseSidecar(text: string): SidecarData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    logError(err, { operation: "parseSidecar" });
    return null;
  }
  if (!isPlainObject(parsed)) {
    logError(new Error("sidecar root is not an object"), { operation: "parseSidecar" });
    return null;
  }
  return {
    version: 1,
    metadata: coerceMetadata(parsed.metadata),
    playerState: coercePlayerState(parsed.playerState),
    playlists: coercePlaylists(parsed.playlists),
  };
}

/** Serialize a model to JSON text (pretty-printed for sync-friendly diffs). */
export function serializeSidecar(data: SidecarData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Return a NEW model where the patch's per-field entries win but untouched data
 * is preserved. This is the no-clobber guarantee: merging the player position
 * never drops the metadata cache, a sibling metadata entry, or a playlist.
 * - `metadata` / `playlists`: per-key/per-name shallow merge.
 * - `playerState`: when the patch carries one, its fields merge over the
 *   existing state (so a `positionSeconds`-only patch keeps the existing queue),
 *   with `queue` re-guaranteed to an array. When the patch omits it, the
 *   existing player-state is preserved untouched.
 */
export function mergeSidecar(existing: SidecarData, patch: SidecarPatch): SidecarData {
  const playerState = patch.playerState
    ? (() => {
        const merged = { ...existing.playerState, ...patch.playerState };
        return { ...merged, queue: merged.queue ?? [] };
      })()
    : existing.playerState;
  return {
    version: 1,
    metadata: { ...existing.metadata, ...patch.metadata },
    playerState,
    playlists: { ...existing.playlists, ...patch.playlists },
  };
}

// ---------------------------------------------------------------------------
// B. FSA I/O over the directory handle (exported for tests)
// ---------------------------------------------------------------------------

/**
 * Read and parse the sidecar from `dir`. A missing `.commons-audio` directory or
 * `index.json` file (NotFoundError) yields an empty model (a missing file is
 * safe to start fresh from). Any other unexpected error is logged and yields
 * `null` (corrupt/unknown → the caller must not overwrite the file). Never
 * throws.
 */
export async function readSidecar(dir: FileSystemDirectoryHandle): Promise<SidecarData | null> {
  try {
    const sidecarDir = await dir.getDirectoryHandle(SIDECAR_DIR);
    const fileHandle = await sidecarDir.getFileHandle(SIDECAR_FILE);
    const file = await fileHandle.getFile();
    return parseSidecar(await file.text());
  } catch (err) {
    if (err instanceof DOMException && err.name === "NotFoundError") {
      return emptyModel();
    }
    logError(err, { operation: "readSidecar" });
    return null;
  }
}

/**
 * Write `data` to the sidecar, creating `.commons-audio/index.json` as needed.
 * On a write/close failure, abort() the writable (discarding the temp write
 * rather than committing a truncated file, since createWritable defaults to
 * keepExistingData: false) then rethrow.
 */
export async function writeSidecar(
  dir: FileSystemDirectoryHandle,
  data: SidecarData,
): Promise<void> {
  const sidecarDir = await dir.getDirectoryHandle(SIDECAR_DIR, { create: true });
  const fileHandle = await sidecarDir.getFileHandle(SIDECAR_FILE, { create: true });
  const writableStream = await fileHandle.createWritable();
  try {
    await writableStream.write(serializeSidecar(data));
    await writableStream.close();
  } catch (e) {
    await writableStream.abort();
    throw e;
  }
}

// ---------------------------------------------------------------------------
// C. Handle retention + in-memory model + serialized writes (stateful core)
// ---------------------------------------------------------------------------

let dirHandle: FileSystemDirectoryHandle | null = null;
let writable = false;

// The single in-memory model. `cachedModel` is the loaded model; `loadPromise`
// dedupes a concurrent first-load. Both are reset by setLocalDirectory so the
// next access re-reads from the new handle.
let cachedModel: SidecarData | null = null;
let loadPromise: Promise<SidecarData> | null = null;

// True when the bound folder has a sidecar file on disk that exists but
// could not be parsed (corrupt). While set, disk writes are suppressed so a
// routine save cannot overwrite the user's still-recoverable bytes; the
// in-memory model proceeds from an empty model so the session stays usable.
let corruptOnDisk = false;

// Single-flight write chain: every mutation appends to this promise so the
// player-state save and the metadata batch cannot race or interleave on the
// file. Each link merges its patch against the result of the prior link, then
// persists (disk write gated by `writable`).
let writeChain: Promise<void> = Promise.resolve();

/**
 * Store the retained directory handle and writable flag (called by Unit 3 after
 * the folder is picked / permission resolved). Invalidates the cached model so
 * the next access re-reads lazily from the new handle.
 */
export function setLocalDirectory(handle: FileSystemDirectoryHandle, isWritable: boolean): void {
  dirHandle = handle;
  writable = isWritable;
  cachedModel = null;
  loadPromise = null;
  corruptOnDisk = false;
  writeChain = Promise.resolve();
}

/**
 * Unbind the directory (called when the folder is disconnected). Drops the
 * handle, marks not-writable, and resets the cache + write chain so an in-flight
 * write enqueued before disconnect cannot target the now-stale folder and the
 * next access re-loads an empty model.
 */
export function clearLocalDirectory(): void {
  dirHandle = null;
  writable = false;
  cachedModel = null;
  loadPromise = null;
  corruptOnDisk = false;
  writeChain = Promise.resolve();
}

/**
 * Ensure the in-memory model is loaded (lazily, once) and return it. With no
 * directory bound, returns an empty model. readSidecar never throws.
 */
export async function ensureLoaded(): Promise<SidecarData> {
  if (cachedModel !== null) return cachedModel;
  if (loadPromise === null) {
    const handle = dirHandle;
    loadPromise = (
      handle === null ? Promise.resolve<SidecarData | null>(emptyModel()) : readSidecar(handle)
    ).then((model) => {
      if (model === null) {
        corruptOnDisk = true;
        cachedModel = emptyModel();
      } else {
        corruptOnDisk = false;
        cachedModel = model;
      }
      return cachedModel;
    });
  }
  return loadPromise;
}

/**
 * Queue a merge-and-persist onto the single-flight write chain. The merge runs
 * inside the task (after ensureLoaded) so each link merges against the prior
 * link's result — the no-clobber serialization guarantee. The in-memory model is
 * ALWAYS updated so the current session stays consistent; the disk write is
 * gated by `writable` (metadata extraction and player-state work in-memory even
 * when the folder is not writable, and the disk save silently no-ops). The
 * per-link catch keeps one failed write from poisoning the chain.
 */
function enqueueWrite(patch: SidecarPatch): Promise<void> {
  writeChain = writeChain
    .then(async () => {
      const model = await ensureLoaded();
      const merged = mergeSidecar(model, patch);
      cachedModel = merged;
      if (corruptOnDisk) {
        logError(
          new Error("sidecar corrupt on disk; skipping write to preserve recoverable user data"),
          { operation: "sidecarWrite" },
        );
        return;
      }
      if (writable && dirHandle !== null) {
        await writeSidecar(dirHandle, merged);
      }
    })
    .catch((err) => {
      logError(err, { operation: "sidecarWrite" });
    });
  return writeChain;
}

/** Drain the pending write chain. Unit 8 tests await this to assert persistence. */
export function flushWrites(): Promise<void> {
  return writeChain;
}

// ---------------------------------------------------------------------------
// D. Accessors
// ---------------------------------------------------------------------------

/**
 * Read a cached metadata entry by localName, ensuring the model is loaded.
 * Returns undefined when no entry is cached.
 */
export async function getMetadata(localName: string): Promise<AudioTags | undefined> {
  const model = await ensureLoaded();
  return model.metadata[localName];
}

/**
 * Merge one metadata entry into the model and persist via the serialized write
 * chain. The in-memory model updates even when not writable, so this session
 * shows enriched data; the disk persist no-ops when not writable. Returns the
 * chain promise so callers can await persistence.
 */
export async function cacheMetadata(localName: string, tags: AudioTags): Promise<void> {
  return enqueueWrite({ metadata: { [localName]: tags } });
}

/**
 * Merge many metadata entries into the model in a SINGLE serialized write. This
 * is the batch form of `cacheMetadata`: the enrichment path accumulates every
 * newly-extracted entry for a render pass and persists them in one index.json
 * rewrite, instead of N sequential full-file rewrites. An empty `entries` is a
 * no-op — it neither touches the chain nor writes the file, preserving
 * focus-rescan write suppression when nothing is new.
 */
export async function cacheMetadataBatch(entries: Record<string, AudioTags>): Promise<void> {
  if (Object.keys(entries).length === 0) return;
  return enqueueWrite({ metadata: entries });
}

/** Read the persisted player-state, ensuring the model is loaded. */
export async function getPlayerState(): Promise<PlayerState | undefined> {
  const model = await ensureLoaded();
  return model.playerState;
}

/**
 * Merge a player-state patch through the serialized write chain. A partial patch
 * (e.g. `positionSeconds` only) keeps the existing queue and current track — see
 * mergeSidecar's no-clobber player-state merge.
 */
export async function savePlayerState(patch: Partial<PlayerState>): Promise<void> {
  return enqueueWrite({ playerState: patch });
}

/** Read all playlists, ensuring the model is loaded. */
export async function getPlaylists(): Promise<Record<string, string[]>> {
  const model = await ensureLoaded();
  return model.playlists ?? {};
}

/** Merge one playlist (name → localNames) through the serialized write chain. */
export async function savePlaylist(name: string, localNames: string[]): Promise<void> {
  return enqueueWrite({ playlists: { [name]: localNames } });
}
