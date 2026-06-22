// Centralized on-disk JSON sidecar machinery shared by the audio and print apps.
//
// Both apps own a `<.commons-*>/index.json` sidecar for a local (on-disk)
// folder: one in-memory JSON model holding every local item's persisted data,
// written back into the user's own folder so the data rides their folder sync
// and works fully unauthenticated. This module factors out the byte-identical
// machinery — the parse/serialize tail, the FSA read/write, the retained
// directory handle, the lazily-loaded in-memory model, and the single-flight
// write chain — leaving each app to supply only its schema-specific bits
// (directory/file names, empty model, the per-field coercion, and the merge).

import { logError } from "@commons-systems/errorutil/log";

// ---------------------------------------------------------------------------
// A. Pure schema-independent helpers
// ---------------------------------------------------------------------------

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Serialize a model to JSON text (pretty-printed for sync-friendly diffs). */
export function serializeSidecar<TData>(data: TData): string {
  return JSON.stringify(data, null, 2);
}

// ---------------------------------------------------------------------------
// B. Factory options + return shape
// ---------------------------------------------------------------------------

/** The schema-specific bits each app supplies to `createSidecar`. */
export interface CreateSidecarOptions<TData, TPatch> {
  /** The sidecar directory name (e.g. `.commons-audio`). */
  sidecarDirName: string;
  /** The sidecar file name within that directory (e.g. `index.json`). */
  sidecarFileName: string;
  /** Produce a fresh, empty model. */
  emptyModel: () => TData;
  /**
   * Coerce a parsed plain-object root into the typed model. Runs after the
   * root has been narrowed to a plain object; reproduces the per-app
   * `parseSidecar` return tail (force `version: 1`, run the per-field coercers).
   */
  coerce: (parsed: Record<string, unknown>) => TData;
  /**
   * Return a NEW model where the patch's per-field entries win but untouched
   * data is preserved — the no-clobber guarantee.
   */
  mergeSidecar: (existing: TData, patch: TPatch) => TData;
}

/** The stateful sidecar handle returned by `createSidecar`. */
export interface SidecarHandle<TData, TPatch> {
  parseSidecar(text: string): TData | null;
  readSidecar(dir: FileSystemDirectoryHandle): Promise<TData | null>;
  writeSidecar(dir: FileSystemDirectoryHandle, data: TData): Promise<void>;
  setLocalDirectory(handle: FileSystemDirectoryHandle, isWritable: boolean): void;
  clearLocalDirectory(): void;
  ensureLoaded(): Promise<TData>;
  enqueueWrite(patch: TPatch): Promise<void>;
  flushWrites(): Promise<void>;
}

// ---------------------------------------------------------------------------
// C. Factory
// ---------------------------------------------------------------------------

/**
 * Build a sidecar handle owning its own private state. One `createSidecar` call
 * yields one singleton per app, preserving the original module-level-singleton
 * semantics: the retained directory handle, the lazily-loaded in-memory model,
 * and the single-flight write chain are all closed over here.
 */
export function createSidecar<TData, TPatch>(
  options: CreateSidecarOptions<TData, TPatch>,
): SidecarHandle<TData, TPatch> {
  const { sidecarDirName, sidecarFileName, emptyModel, coerce, mergeSidecar } = options;

  let dirHandle: FileSystemDirectoryHandle | null = null;
  let writable = false;

  // The single in-memory model. `cachedModel` is the loaded model; `loadPromise`
  // dedupes a concurrent first-load. Both are reset by setLocalDirectory so the
  // next access re-reads from the new handle.
  let cachedModel: TData | null = null;
  let loadPromise: Promise<TData> | null = null;

  // True when the bound folder has a sidecar file on disk that exists but
  // could not be parsed (corrupt). While set, disk writes are suppressed so a
  // routine save cannot overwrite the user's still-recoverable bytes; the
  // in-memory model proceeds from an empty model so the session stays usable.
  let corruptOnDisk = false;

  // Single-flight write chain: every mutation appends to this promise so
  // concurrent saves cannot race or interleave on the file. Each link merges its
  // patch against the result of the prior link, then persists (disk write gated
  // by `writable`).
  let writeChain: Promise<void> = Promise.resolve();

  /**
   * Parse sidecar text into a model. Tolerant of untrusted/partial on-disk
   * contents (input validation at the system edge, not a banned fallback):
   * - JSON parse failure or a non-object top level → log + `null` (signals
   *   corruption; the caller must not overwrite the file).
   * - The per-app `coerce` callback coerces each field independently and forces
   *   `version`.
   * Never throws.
   */
  function parseSidecar(text: string): TData | null {
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
    return coerce(parsed);
  }

  /**
   * Read and parse the sidecar from `dir`. A missing sidecar directory or file
   * (NotFoundError) yields an empty model (a missing file is safe to start fresh
   * from). Any other unexpected error is logged and yields `null` (corrupt or
   * unknown → the caller must not overwrite the file). Never throws.
   */
  async function readSidecar(dir: FileSystemDirectoryHandle): Promise<TData | null> {
    try {
      const sidecarDir = await dir.getDirectoryHandle(sidecarDirName);
      const fileHandle = await sidecarDir.getFileHandle(sidecarFileName);
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
   * Write `data` to the sidecar, creating the sidecar directory/file as needed.
   * On a write/close failure, abort() the writable (discarding the temp write
   * rather than committing a truncated file, since createWritable defaults to
   * keepExistingData: false) then rethrow.
   */
  async function writeSidecar(dir: FileSystemDirectoryHandle, data: TData): Promise<void> {
    const sidecarDir = await dir.getDirectoryHandle(sidecarDirName, { create: true });
    const fileHandle = await sidecarDir.getFileHandle(sidecarFileName, { create: true });
    const writableStream = await fileHandle.createWritable();
    try {
      await writableStream.write(serializeSidecar(data));
      await writableStream.close();
    } catch (e) {
      await writableStream.abort();
      throw e;
    }
  }

  /**
   * Store the retained directory handle and writable flag (called after the
   * folder is picked / permission resolved). Invalidates the cached model so the
   * next access re-reads lazily from the new handle.
   */
  function setLocalDirectory(handle: FileSystemDirectoryHandle, isWritable: boolean): void {
    dirHandle = handle;
    writable = isWritable;
    cachedModel = null;
    loadPromise = null;
    corruptOnDisk = false;
    writeChain = Promise.resolve();
  }

  /**
   * Unbind the directory (called when the folder is disconnected). Drops the
   * handle, marks not-writable, and resets the cache + write chain so an
   * in-flight write enqueued before disconnect cannot target the now-stale folder
   * and the next access re-loads an empty model.
   */
  function clearLocalDirectory(): void {
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
  async function ensureLoaded(): Promise<TData> {
    if (cachedModel !== null) return cachedModel;
    if (loadPromise === null) {
      const handle = dirHandle;
      loadPromise = (
        handle === null ? Promise.resolve<TData | null>(emptyModel()) : readSidecar(handle)
      ).then((model) => {
        // The handle may have been rebound (setLocalDirectory) while readSidecar
        // was in flight. A stale result must not mutate the freshly-reset state —
        // discard it so the next ensureLoaded re-reads the current handle.
        if (dirHandle !== handle) {
          return cachedModel ?? emptyModel();
        }
        if (model === null) {
          corruptOnDisk = true;
          cachedModel = emptyModel();
          logError(
            new Error("sidecar corrupt on disk; suppressing writes to preserve recoverable user data"),
            { operation: "ensureLoaded" },
          );
        } else {
          corruptOnDisk = false;
          cachedModel = model;
        }
        return cachedModel as TData;
      });
    }
    return loadPromise;
  }

  /**
   * Queue a merge-and-persist onto the single-flight write chain. The merge runs
   * inside the task (after ensureLoaded) so each link merges against the prior
   * link's result — the no-clobber serialization guarantee. The in-memory model
   * is ALWAYS updated so the current session stays consistent; the disk write is
   * gated by `writable` (work happens in-memory even when the folder is not
   * writable, and the disk save silently no-ops). The per-link catch keeps one
   * failed write from poisoning the chain.
   */
  function enqueueWrite(patch: TPatch): Promise<void> {
    const snapshotHandle = dirHandle;
    const snapshotWritable = writable;
    writeChain = writeChain
      .then(async () => {
        // TOCTOU guard: if the bound directory changed between enqueue and
        // execution (rapid disconnect/reconnect), this patch was issued for the
        // previous folder — skip it entirely so it neither persists to the new
        // folder nor contaminates the new folder's in-memory model.
        if (dirHandle !== snapshotHandle) return;
        const model = await ensureLoaded();
        const merged = mergeSidecar(model, patch);
        cachedModel = merged;
        // Corruption was logged once at load time; return silently here so
        // repeated saves don't spam the error log.
        if (corruptOnDisk) return;
        // Persist to the SNAPSHOT handle (not the live global), so a switch that
        // races in after the guard still writes to the folder this patch was for.
        if (snapshotWritable && snapshotHandle !== null) {
          await writeSidecar(snapshotHandle, merged);
        }
      })
      .catch((err) => {
        logError(err, { operation: "sidecarWrite" });
      });
    return writeChain;
  }

  /** Drain the pending write chain. Tests await this to assert persistence. */
  function flushWrites(): Promise<void> {
    return writeChain;
  }

  return {
    parseSidecar,
    readSidecar,
    writeSidecar,
    setLocalDirectory,
    clearLocalDirectory,
    ensureLoaded,
    enqueueWrite,
    flushWrites,
  };
}
