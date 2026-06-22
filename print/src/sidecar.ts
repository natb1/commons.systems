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

import { createSidecar, serializeSidecar, isPlainObject } from "@commons-systems/sidecar";

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

/**
 * Coerce a raw `metadata` value into the typed cache, keeping only entries whose
 * value is a plain object and whose leaf fields have the expected types
 * (`title` a string, `pageCount` a number). Wrong-typed leaves are dropped so a
 * malformed on-disk entry can never surface as a non-string title or
 * non-number pageCount downstream.
 */
function coerceMetadata(raw: unknown): SidecarData["metadata"] {
  if (!isPlainObject(raw)) return {};
  const out: SidecarData["metadata"] = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isPlainObject(value)) continue;
    const entry: { title?: string; pageCount?: number } = {};
    if (typeof value.title === "string") entry.title = value.title;
    if (typeof value.pageCount === "number") entry.pageCount = value.pageCount;
    out[key] = entry;
  }
  return out;
}

/**
 * Coerce a raw `positions` value into the typed map, keeping only entries whose
 * value is a string. A non-string position (e.g. a number or nested object)
 * would otherwise flow through `load()` into the renderer's `initialPosition`
 * and break navigation, so it is dropped here at the system edge.
 */
function coercePositions(raw: unknown): SidecarData["positions"] {
  if (!isPlainObject(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw).filter(([, v]) => typeof v === "string"),
  ) as SidecarData["positions"];
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
// B. Centralized machinery, wired with the print schema (Unit 2306)
// ---------------------------------------------------------------------------

// One singleton sidecar handle per app: the shared factory owns the parse/read/
// write tail, the retained directory handle, the lazily-loaded in-memory model,
// and the single-flight write chain. The print app supplies only its
// schema-specific bits below — directory/file names, the empty model, the
// per-field coercion assembled in `coerce`, and the no-clobber `mergeSidecar`.
const sidecar = createSidecar<SidecarData, Partial<Pick<SidecarData, "metadata" | "positions">>>({
  sidecarDirName: SIDECAR_DIR,
  sidecarFileName: SIDECAR_FILE,
  emptyModel,
  coerce: (parsed) => ({
    version: 1,
    metadata: coerceMetadata(parsed.metadata),
    positions: coercePositions(parsed.positions),
  }),
  mergeSidecar,
});

const { writeSidecar, setLocalDirectory, ensureLoaded, enqueueWrite, flushWrites } = sidecar;

// Restore the original non-nullable SidecarData contracts: the factory's parseSidecar
// returns TData | null on parse failure, but print's original parseSidecar always
// returned SidecarData (emptyModel() on all failure paths). Wrap both to preserve
// that contract so callers do not need to null-check.
function parseSidecar(text: string): SidecarData {
  return sidecar.parseSidecar(text) ?? emptyModel();
}

async function readSidecar(dir: FileSystemDirectoryHandle): Promise<SidecarData> {
  return (await sidecar.readSidecar(dir)) ?? emptyModel();
}

// Re-export the shared surface the rest of the app (and the Unit 7 tests)
// consume. `ensureLoaded` is also imported by local-folder-ui.ts, so it is
// re-exported. `enqueueWrite` stays private — it backs only the accessors and
// the position store below. (print never exported `clearLocalDirectory`, so it
// is not re-exported here — no behavior change.)
export { serializeSidecar };
export { parseSidecar, readSidecar, writeSidecar, setLocalDirectory, ensureLoaded, flushWrites };

// ---------------------------------------------------------------------------
// C. Accessors for Units 5 & 6
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

/**
 * Merge many metadata entries into the model in a SINGLE serialized write. This
 * is the batch form of `cacheMetadata`: the list-enrichment path accumulates
 * every newly-extracted entry for a render pass and persists them in one
 * index.json rewrite, instead of N sequential full-file rewrites (one per new
 * file). An empty `entries` is a no-op — it neither touches the chain nor writes
 * the file, preserving focus-rescan write suppression when nothing is new.
 */
export async function cacheMetadataBatch(
  entries: Record<string, { title?: string; pageCount?: number }>,
): Promise<void> {
  if (Object.keys(entries).length === 0) return;
  return enqueueWrite({ metadata: entries });
}

// ---------------------------------------------------------------------------
// D. PositionStore interface + sidecar-backed implementation
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
