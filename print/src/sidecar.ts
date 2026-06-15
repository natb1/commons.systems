// Owns the `.commons-print/index.json` sidecar for a local (on-disk) library
// folder: one in-memory JSON model holding ALL local items' metadata cache and
// reading positions, persisted back into the user's own folder so the data
// rides their folder sync and works fully unauthenticated.
//
// Cloud items are untouched (they use Firestore). This module is the single
// owner of the retained directory handle and the only writer of the sidecar —
// both the list-enrichment path (Unit 5) and the viewer position path (Unit 6)
// funnel their writes through here so saving one position never clobbers the
// metadata cache or a sibling position.
//
// Sidecar keys are the BARE FILENAME (`item.storagePath`, which for a local item
// equals the filename), NOT the device-local `local:<folderId>/<name>` id. The
// sidecar lives inside the folder and travels with it, so keying on the id
// (which embeds the folder name) would break portability and folder rename.

import { logError } from "@commons-systems/errorutil/log";

const SIDECAR_DIR = ".commons-print";
const SIDECAR_FILE = "index.json";

// ---------------------------------------------------------------------------
// A. Pure schema + helpers (exported for Unit 7 tests)
// ---------------------------------------------------------------------------

export interface SidecarData {
  version: 1;
  /** Metadata cache, keyed by bare filename. */
  metadata: Record<string, { title?: string; pageCount?: number }>;
  /** Reading positions, keyed by bare filename. */
  positions: Record<string, string>;
}

/** A fresh, empty model. */
function emptyModel(): SidecarData {
  return { version: 1, metadata: {}, positions: {} };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parse sidecar text into a model. Tolerant of untrusted/partial on-disk
 * contents (input validation at the system edge, not a banned fallback):
 * - JSON parse failure or a non-object top level → log + fresh empty model.
 * - A missing/wrong-typed `metadata` or `positions` field is coerced to `{}`
 *   independently, so malformed metadata does not discard good positions.
 * - `version` is forced to 1.
 * Never throws.
 */
export function parseSidecar(text: string): SidecarData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    logError(err, { operation: "parseSidecar" });
    return emptyModel();
  }
  if (!isPlainObject(parsed)) {
    logError(new Error("sidecar root is not an object"), { operation: "parseSidecar" });
    return emptyModel();
  }
  return {
    version: 1,
    metadata: isPlainObject(parsed.metadata)
      ? (parsed.metadata as SidecarData["metadata"])
      : {},
    positions: isPlainObject(parsed.positions)
      ? (parsed.positions as SidecarData["positions"])
      : {},
  };
}

/** Serialize a model to JSON text (pretty-printed for sync-friendly diffs). */
export function serializeSidecar(data: SidecarData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Return a NEW model where the patch's per-key entries win but untouched keys
 * are preserved. This is the no-clobber guarantee: merging one position never
 * drops the metadata cache or sibling positions.
 */
export function mergeSidecar(
  existing: SidecarData,
  patch: Partial<Pick<SidecarData, "metadata" | "positions">>,
): SidecarData {
  return {
    version: 1,
    metadata: { ...existing.metadata, ...patch.metadata },
    positions: { ...existing.positions, ...patch.positions },
  };
}

// ---------------------------------------------------------------------------
// B. FSA I/O over the directory handle (exported for tests)
// ---------------------------------------------------------------------------

/**
 * Read and parse the sidecar from `dir`. A missing `.commons-print` directory
 * or `index.json` file (NotFoundError) yields an empty model. Any other
 * unexpected error is logged and also yields an empty model, so a flaky read
 * never crashes the list render. Never throws.
 */
export async function readSidecar(dir: FileSystemDirectoryHandle): Promise<SidecarData> {
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
    return emptyModel();
  }
}

/**
 * Write `data` to the sidecar, creating `.commons-print/index.json` as needed.
 * Mirrors budget/src/local-file.ts: on a write/close failure, abort() the
 * writable (discarding the temp write rather than committing a truncated file,
 * since createWritable defaults to keepExistingData: false) then rethrow.
 */
export async function writeSidecar(
  dir: FileSystemDirectoryHandle,
  data: SidecarData,
): Promise<void> {
  const sidecarDir = await dir.getDirectoryHandle(SIDECAR_DIR, { create: true });
  const fileHandle = await sidecarDir.getFileHandle(SIDECAR_FILE, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    await writable.write(serializeSidecar(data));
    await writable.close();
  } catch (e) {
    await writable.abort();
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

// Single-flight write chain: every mutation appends to this promise so the
// debounced position save (Unit 6) and the enrichment batch (Unit 5) cannot
// race or interleave on the file. Each link merges its patch against the result
// of the prior link, then persists (disk write gated by `writable`).
let writeChain: Promise<void> = Promise.resolve();

/**
 * Store the retained directory handle and writable flag (called by Unit 4 after
 * the folder is picked / permission resolved). Invalidates the cached model so
 * the next access re-reads lazily from the new handle.
 */
export function setLocalDirectory(handle: FileSystemDirectoryHandle, isWritable: boolean): void {
  dirHandle = handle;
  writable = isWritable;
  cachedModel = null;
  loadPromise = null;
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
    loadPromise = (handle === null ? Promise.resolve(emptyModel()) : readSidecar(handle)).then(
      (model) => {
        cachedModel = model;
        return model;
      },
    );
  }
  return loadPromise;
}

/**
 * Queue a merge-and-persist onto the single-flight write chain. The merge runs
 * inside the task (after ensureLoaded) so each link merges against the prior
 * link's result — the no-clobber serialization guarantee. The in-memory model
 * is ALWAYS updated so the current session stays consistent; the disk write is
 * gated by `writable` (constraint 4: extraction/positions work in-memory even
 * when the folder is not writable, and save silently no-ops on disk). The
 * per-link catch keeps one failed write from poisoning the chain.
 */
function enqueueWrite(patch: Partial<Pick<SidecarData, "metadata" | "positions">>): Promise<void> {
  writeChain = writeChain
    .then(async () => {
      const model = await ensureLoaded();
      const merged = mergeSidecar(model, patch);
      cachedModel = merged;
      if (writable && dirHandle !== null) {
        await writeSidecar(dirHandle, merged);
      }
    })
    .catch((err) => {
      logError(err, { operation: "sidecarWrite" });
    });
  return writeChain;
}

/** Drain the pending write chain. Unit 7 tests await this to assert persistence. */
export function flushWrites(): Promise<void> {
  return writeChain;
}

// ---------------------------------------------------------------------------
// D. Accessors for Units 5 & 6
// ---------------------------------------------------------------------------

/**
 * Read a cached metadata entry by bare filename, ensuring the model is loaded.
 * Returns undefined when no entry is cached.
 */
export async function getMetadata(
  filename: string,
): Promise<{ title?: string; pageCount?: number } | undefined> {
  const model = await ensureLoaded();
  return model.metadata[filename];
}

/**
 * Merge one metadata entry into the model and persist via the serialized write
 * chain. The in-memory model updates even when not writable, so this session
 * shows enriched data; the disk persist no-ops when not writable. Returns the
 * chain promise so callers can await persistence.
 */
export async function cacheMetadata(
  filename: string,
  meta: { title?: string; pageCount?: number },
): Promise<void> {
  return enqueueWrite({ metadata: { [filename]: meta } });
}

// ---------------------------------------------------------------------------
// E. PositionStore interface + sidecar-backed implementation
// ---------------------------------------------------------------------------

export interface PositionStore {
  load(): Promise<string | null>;
  save(pos: string): Promise<void>;
}

/**
 * A PositionStore backed by the sidecar, keyed on the bare filename. `load`
 * reads the in-memory model; `save` merges through the serialized write chain.
 * `save` silently no-ops on disk when the folder is not writable — the model is
 * still updated for session consistency, but no file write is attempted.
 */
export function makeSidecarPositionStore(filename: string): PositionStore {
  return {
    async load(): Promise<string | null> {
      const model = await ensureLoaded();
      return model.positions[filename] ?? null;
    },
    async save(pos: string): Promise<void> {
      return enqueueWrite({ positions: { [filename]: pos } });
    },
  };
}
