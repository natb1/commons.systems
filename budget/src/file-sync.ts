// Module-scoped debounced write-back coordinator for the on-disk `.benc`.
//
// When the app loads from a persisted FSA file handle (Chromium), each UI
// mutation arms a debounced write-back: serialize IDB to JSON, encrypt with the
// session-held password, and overwrite the on-disk file in place via the handle.
// The encryption password lives in memory for the session only — never persisted.
//
// State is module-scoped (a single on-disk file backs the session). Seed mode
// and the non-FSA upload path never call `configureFileSync`, so `scheduleWriteBack`
// is a no-op there.
import { exportToJson } from "./export.js";
import { encrypt } from "./crypto.js";
import { logError } from "@commons-systems/errorutil/log";
import {
  writeFileToHandle,
  readFileFromHandle,
  queryReadWritePermission,
  requestReadWritePermission,
} from "./local-file.js";

const DEBOUNCE_MS = 800;

let handle: FileSystemFileHandle | null = null;
let password: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
// Set by scheduleWriteBack when a mutation arrives. The writer loop re-runs while
// it is set, so edits made *during* an in-flight write are still persisted.
let dirty = false;
// Bumped whenever the session is disarmed or re-armed. A write captures it at
// start and bails before touching the disk if it changed — so a write already
// in flight when the user clears data cannot clobber the on-disk file with a
// post-clear snapshot.
let generation = 0;
// The on-disk file's lastModified as the app last loaded or wrote it. The focus
// watcher compares the live lastModified against this watermark to detect an
// external write; stamping it on our own write-back prevents a self-trigger.
let lastSyncedModified: number | null = null;

/** Arm write-back for an encrypted FSA-handle session. */
export function configureFileSync(h: FileSystemFileHandle, pw: string, modifiedMs: number): void {
  handle = h;
  password = pw;
  lastSyncedModified = modifiedMs;
  generation++;
}

/** Disarm write-back (clear-data / seed transition). Cancels any pending write. */
export function resetFileSync(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  handle = null;
  password = null;
  dirty = false;
  lastSyncedModified = null;
  generation++;
}

/** Debounced trigger; no-op when unconfigured (seed / non-FSA upload). */
export function scheduleWriteBack(): void {
  if (!handle || password === null) return;
  dirty = true;
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushWriteBack();
  }, DEBOUNCE_MS);
}

/** Force any pending write to run now (visibilitychange→hidden). Single-flight. */
export async function flushWriteBack(): Promise<void> {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  if (!handle || password === null) return;
  if (inFlight) {
    // A write is already running. Wait until the active writer has drained all
    // pending work — including any write our mutations queued via `dirty` — so a
    // caller like the visibilitychange handler does not return before the latest
    // state is on disk. The active writer owns the loop; we only wait. Re-reading
    // `inFlight` each iteration catches the next write the writer starts for a
    // mutation that landed mid-flight.
    while (inFlight) await inFlight;
    return;
  }
  // Force at least one write (flush semantics), then keep writing while new
  // mutations arrive mid-write.
  do {
    dirty = false;
    const h = handle;
    const pw = password;
    const gen = generation;
    inFlight = doWrite(h, pw, gen).catch((e) => logError(e, { operation: "file-sync" }));
    await inFlight;
    inFlight = null;
  } while (dirty && handle && password !== null);
}

async function doWrite(h: FileSystemFileHandle, pw: string, gen: number): Promise<void> {
  let perm = await queryReadWritePermission(h);
  if (perm !== "granted") perm = await requestReadWritePermission(h);
  if (perm !== "granted") {
    logError(new Error("write-back permission not granted"), { operation: "file-sync" });
    return;
  }
  const json = await exportToJson();
  const bytes = await encrypt(json, pw);
  // The session was disarmed or re-armed (clear-data, or a new file loaded) while
  // this write was in flight — abandon it rather than overwrite the on-disk file
  // with a now-stale snapshot.
  if (gen !== generation) return;
  await writeFileToHandle(h, bytes);
  // Stamp the watermark from the file as just written so the focus watcher does
  // not mistake our own write-back for an external change. Skip if the session was
  // re-armed/reset mid-write (gen changed) — that path set its own watermark.
  if (gen === generation) {
    lastSyncedModified = (await readFileFromHandle(h)).lastModified;
  }
}

/** Active FSA handle for this session, or null in seed / non-FSA upload mode. */
export function getSyncHandle(): FileSystemFileHandle | null { return handle; }
/** Watermark: lastModified of the on-disk file as the app last loaded/wrote it. */
export function getLastSyncedModified(): number | null { return lastSyncedModified; }
