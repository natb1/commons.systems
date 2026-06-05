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
  queryReadWritePermission,
  requestReadWritePermission,
} from "./local-file.js";

const DEBOUNCE_MS = 800;

let handle: FileSystemFileHandle | null = null;
let password: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
let queued = false;

/** Arm write-back for an encrypted FSA-handle session. */
export function configureFileSync(h: FileSystemFileHandle, pw: string): void {
  handle = h;
  password = pw;
}

/** Disarm write-back (clear-data / seed transition). Cancels any pending write. */
export function resetFileSync(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  handle = null;
  password = null;
}

/** Debounced trigger; no-op when unconfigured (seed / non-FSA upload). */
export function scheduleWriteBack(): void {
  if (!handle || password === null) return;
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
    queued = true;
    return;
  }
  do {
    queued = false;
    const h = handle;
    const pw = password;
    inFlight = doWrite(h, pw).catch((e) => logError(e, { operation: "file-sync" }));
    await inFlight;
    inFlight = null;
  } while (queued && handle && password !== null);
}

async function doWrite(h: FileSystemFileHandle, pw: string): Promise<void> {
  let perm = await queryReadWritePermission(h);
  if (perm !== "granted") perm = await requestReadWritePermission(h);
  if (perm !== "granted") {
    logError(new Error("write-back permission not granted"), { operation: "file-sync" });
    return;
  }
  const json = await exportToJson();
  const bytes = await encrypt(json, pw);
  await writeFileToHandle(h, bytes);
}
