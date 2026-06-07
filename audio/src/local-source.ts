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
import { logError } from "@commons-systems/errorutil/log";
import { AUDIO_FORMATS } from "./types.js";
import type { AudioFormat, LibraryItem } from "./types.js";

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

function accept(name: string): boolean {
  return formatFromName(name) !== undefined;
}

function titleFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? name : name.slice(0, dot);
}

function toItem(entry: { name: string; lastModified: number }): LibraryItem {
  const fmt = formatFromName(entry.name);
  if (!fmt) throw new Error(`accept() admitted a non-audio file: ${entry.name}`);
  return {
    id: "local:" + entry.name,
    title: titleFromName(entry.name),
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
    addedAt: new Date(entry.lastModified).toISOString(),
    origin: "local",
    localName: entry.name,
  };
}

function buildSource(directoryHandle: FileSystemDirectoryHandle) {
  return createLocalFolderMediaSource<LibraryItem>({
    directoryHandle,
    accept,
    toItem,
    fileName: (i) => i.localName!,
  });
}

/** True when the browser can pick and persist an on-disk folder handle. */
export function isLocalFolderSupported(): boolean {
  return store.isSupported() && "showDirectoryPicker" in window;
}

/**
 * Prompt the user to pick a folder (read-only), persist its handle, and mark the
 * source connected. Must be called from within a user gesture.
 */
export async function connectLocalFolder(): Promise<void> {
  const picker = window as unknown as {
    showDirectoryPicker(o: { mode: "read" }): Promise<FileSystemDirectoryHandle>;
  };
  const handle = await picker.showDirectoryPicker({ mode: "read" });
  await store.put(PURPOSE, handle);
  currentHandle = handle;
  state = "granted";
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
  // Query only — never request permission at startup (no user gesture).
  const perm = await store.queryPermission(handle, "read");
  if (perm === "granted") {
    currentHandle = handle;
    state = "granted";
  } else {
    state = perm; // "prompt" | "denied"
  }
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
  const perm = await store.ensurePermission(handle, "read");
  if (perm === "granted") {
    currentHandle = handle;
    state = "granted";
    return true;
  }
  state = perm;
  return false;
}

/** Forget the persisted folder and disconnect the source. */
export async function disconnectLocalFolder(): Promise<void> {
  await store.remove(PURPOSE);
  currentHandle = null;
  state = "none";
}

/** True when a folder is connected and usable this session. */
export function hasLocalFolder(): boolean {
  return currentHandle !== null;
}

/** List the connected folder's audio tracks. Returns [] when none / on error. */
export async function listLocalTracks(): Promise<LibraryItem[]> {
  if (!currentHandle) return [];
  try {
    return await buildSource(currentHandle).list();
  } catch (err) {
    logError(err, { operation: "list-local-tracks" });
    return [];
  }
}

/**
 * Resolve a local track's bytes to a blob URL for playback. Throws if no folder
 * is connected; a `MediaItemMissingError` from a vanished file propagates so the
 * player can handle it.
 */
export async function resolveLocalAudioSource(localName: string): Promise<string> {
  if (!currentHandle) {
    throw new Error("resolveLocalAudioSource called with no connected local folder");
  }
  const type = mimeFromName(localName);
  const buf = await buildSource(currentHandle).resolveToBlob({ localName } as LibraryItem);
  return URL.createObjectURL(new Blob([buf], { type }));
}
