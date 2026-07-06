/**
 * The office-hours app's browser graph read layer (owner tier).
 *
 * The user picks the local repo clone's ROOT DIRECTORY via the File System
 * Access API; the directory handle is persisted via
 * `@commons-systems/local-first` so a returning session restores it with zero
 * clicks when read permission is already granted, or one click when the
 * permission is in the `prompt` state — the keyed-handle pattern of
 * `local-snapshot-source.ts`, under its own purpose key.
 *
 * Read-only: the browser never writes the clone. This module owns
 *  - the FSA directory-handle lifecycle (pick / restore / regrant),
 *  - reading `intentions/*.md` through the handle, parsing YAML frontmatter,
 *    and validating every file (per-file errors are collected and thrown as
 *    ONE loud aggregate — clear errors over fallbacks, no partial graph),
 *  - the client-side tree build (`buildTree`) and attention rank
 *    (`resolveAttention` via the fs-free `@commons-systems/intentionsutil/graph`
 *    subpath),
 *  - clone staleness (recorded strategy-attention-surface condition: the clone
 *    must stay fresh enough that rank tracks origin/main): `.git` FETCH_HEAD /
 *    HEAD file mtimes are read through the same handle. Past
 *    `STALE_CLONE_THRESHOLD_MS`, `loadGraphView` returns a `stale` result that
 *    structurally omits the ranked view — a consumer CANNOT render stale rank
 *    silently — and `renderStaleCloneBanner` supplies the blocking banner.
 *    Under the threshold `renderCloneAgeChrome` surfaces the clone's age in
 *    the page chrome.
 *
 * Tier boundary: the owner tier reads through this source; the demo tier
 * keeps the build-time seed (`vite-plugin-intention-tree-seed.ts`).
 */
import { createFsaHandleStore } from "@commons-systems/local-first/fsa-handle-store";
import { detectFsaCapabilities } from "@commons-systems/local-first/capabilities";
import {
  resolveAttention,
  validateNode,
  type IntentionNode,
  type ResolvedAttention,
} from "@commons-systems/intentionsutil/graph";
import { parse } from "yaml";
import { buildTree, type IntentionTreeNode, type SlimIntentionNode } from "./intention-tree.js";

/** Errors raised by the graph read layer (bad clone dir, invalid node files). */
export class GraphSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphSourceError";
  }
}

// --- Directory-handle lifecycle ----------------------------------------------

const PURPOSE = "graph-clone";
const store = createFsaHandleStore({ app: "office-hours" });

export type GraphSourceState = "unsupported" | "none" | "granted" | "prompt" | "denied";

let currentHandle: FileSystemDirectoryHandle | null = null;
let state: GraphSourceState = "none";
let restorePromise: Promise<GraphSourceState> | null = null;

/** True when the browser can pick and persist an on-disk directory handle. */
export function isGraphSourceSupported(): boolean {
  return store.isSupported() && detectFsaCapabilities().directoryPicker;
}

/**
 * The current graph-clone source state.
 *
 * @public directory-handle lifecycle API for the page chrome that grants and
 * shows clone access; the consumer is `tactic-attention-surface-goals-page`
 * (`blocked_by` this tactic), not wired yet.
 */
export function getGraphSourceState(): GraphSourceState {
  return isGraphSourceSupported() ? state : "unsupported";
}

/**
 * Prompt the user to pick the clone's root directory (read mode), persist its
 * handle, and bind it as current. Returns the handle, or null when the user
 * cancels the picker (AbortError). Must be called from within a user gesture.
 *
 * @public directory-handle lifecycle API for the page chrome that grants and
 * shows clone access; the consumer is `tactic-attention-surface-goals-page`
 * (`blocked_by` this tactic), not wired yet.
 */
export async function pickCloneDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (window.showDirectoryPicker === undefined) {
    throw new GraphSourceError(
      "This browser cannot pick a directory (no window.showDirectoryPicker)",
    );
  }
  let handle: FileSystemDirectoryHandle;
  try {
    handle = await window.showDirectoryPicker({ id: "office-hours-graph-clone", mode: "read" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
  await store.put(PURPOSE, handle);
  currentHandle = handle;
  state = "granted";
  return handle;
}

/** Assert a persisted handle really is a directory handle before binding it. */
function requireDirectoryHandle(loaded: FileSystemHandle): FileSystemDirectoryHandle {
  if (loaded.kind !== "directory") {
    throw new GraphSourceError(
      `Persisted graph-clone handle has kind "${loaded.kind}", expected "directory" — the IndexedDB store may be corrupted`,
    );
  }
  return loaded as FileSystemDirectoryHandle; // type-safety-ok: kind === "directory" identifies a FileSystemDirectoryHandle
}

async function restore(): Promise<GraphSourceState> {
  if (!isGraphSourceSupported()) {
    state = "unsupported";
    return state;
  }
  const loaded = await store.get(PURPOSE);
  if (!loaded) {
    state = "none";
    return state;
  }
  const handle = requireDirectoryHandle(loaded);
  // Query only — never request permission at startup (no user gesture).
  const r = await store.queryPermission(handle, "read");
  if (r === "granted") {
    currentHandle = handle;
    state = "granted";
    return state;
  }
  state = r; // "prompt" | "denied"
  return state;
}

/**
 * Restore the persisted clone handle once per session (memoized).
 *
 * @public directory-handle lifecycle API for the page chrome that grants and
 * shows clone access; the consumer is `tactic-attention-surface-goals-page`
 * (`blocked_by` this tactic), not wired yet.
 */
export function restoreCloneHandle(): Promise<GraphSourceState> {
  if (!restorePromise) restorePromise = restore();
  return restorePromise;
}

/**
 * Re-grant read permission on the persisted handle (one click). Must be called
 * from within a user gesture. Returns true iff permission ends up granted.
 *
 * @public directory-handle lifecycle API for the page chrome that grants and
 * shows clone access; the consumer is `tactic-attention-surface-goals-page`
 * (`blocked_by` this tactic), not wired yet.
 */
export async function regrantClone(): Promise<boolean> {
  const loaded = await store.get(PURPOSE);
  if (!loaded) {
    state = "none";
    return false;
  }
  const handle = requireDirectoryHandle(loaded);
  // Request within the gesture — ensurePermission only prompts on "prompt".
  const r = await store.ensurePermission(handle, "read");
  if (r === "granted") {
    currentHandle = handle;
    state = "granted";
    return true;
  }
  state = r; // "prompt" | "denied"
  return false;
}

/**
 * The currently bound clone handle, or null when none is connected.
 *
 * @public directory-handle lifecycle API for the page chrome that grants and
 * shows clone access; the consumer is `tactic-attention-surface-goals-page`
 * (`blocked_by` this tactic), not wired yet.
 */
export function getCurrentCloneHandle(): FileSystemDirectoryHandle | null {
  return currentHandle;
}

// --- FSA lookup helpers --------------------------------------------------------

/** "The entry is absent or the wrong kind" — the two lookup misses probing treats as data. */
function isBenignLookupError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "NotFoundError" || error.name === "TypeMismatchError")
  );
}

async function getChildDirectory(
  dir: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await dir.getDirectoryHandle(name);
  } catch (error) {
    if (isBenignLookupError(error)) return null;
    throw error;
  }
}

async function getChildFile(
  dir: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemFileHandle | null> {
  try {
    return await dir.getFileHandle(name);
  } catch (error) {
    if (isBenignLookupError(error)) return null;
    throw error;
  }
}

/** Resolve a segment path below `root`, or null when any segment is missing. */
async function resolvePath(
  root: FileSystemDirectoryHandle,
  segments: string[],
): Promise<FileSystemDirectoryHandle | null> {
  let dir = root;
  for (const segment of segments) {
    const next = await getChildDirectory(dir, segment);
    if (next === null) return null;
    dir = next;
  }
  return dir;
}

// --- Node reading ---------------------------------------------------------------

/**
 * Extract the text between the opening `---\n` fence and the next line that is
 * exactly `---`. Browser-side twin of the private helper in
 * `@commons-systems/intentionsutil`'s Node-only store (`src/store.ts`), which
 * the fs-free `/graph` subpath deliberately does not export. Thrown messages
 * omit the file name — `readGraphNodes` prefixes it when aggregating errors.
 */
function extractFrontmatter(raw: string): string {
  if (!raw.startsWith("---\n")) {
    throw new GraphSourceError(`missing an opening "---" frontmatter fence`);
  }
  const rest = raw.slice("---\n".length);
  const closeIndex = rest.search(/^---$/m);
  if (closeIndex === -1) {
    throw new GraphSourceError(`missing a closing "---" frontmatter fence`);
  }
  return rest.slice(0, closeIndex);
}

/**
 * Read and validate every `intentions/*.md` node file under the clone root.
 *
 * Mirrors the store's `listNodes` contract: `README.md` (a non-node companion
 * doc with no frontmatter) is excluded, files are processed in name order for
 * a stable result. Per-file problems (bad fences, YAML errors, schema
 * violations) are collected across ALL files and thrown as one
 * `GraphSourceError` naming each offender — the graph is returned whole or
 * not at all, never partially.
 */
export async function readGraphNodes(
  root: FileSystemDirectoryHandle,
): Promise<IntentionNode[]> {
  const intentions = await getChildDirectory(root, "intentions");
  if (intentions === null) {
    throw new GraphSourceError(
      'the picked directory has no "intentions/" directory — pick the clone root',
    );
  }
  const files: Array<[string, FileSystemFileHandle]> = [];
  for await (const [name, handle] of intentions.entries()) {
    if (handle.kind !== "file" || !name.endsWith(".md") || name === "README.md") continue;
    files.push([name, handle as FileSystemFileHandle]); // type-safety-ok: kind === "file" identifies a FileSystemFileHandle
  }
  files.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const nodes: IntentionNode[] = [];
  const problems: string[] = [];
  for (const [name, handle] of files) {
    try {
      const raw = await (await handle.getFile()).text();
      nodes.push(validateNode(parse(extractFrontmatter(raw))));
    } catch (error) {
      problems.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (problems.length > 0) {
    throw new GraphSourceError(
      `intentions/ contains invalid node files:\n${problems.join("\n")}`,
    );
  }
  return nodes;
}

// --- Clone staleness --------------------------------------------------------------

/**
 * How old the clone's last git sync may be before rank is considered stale.
 * A code-owned tunable (like the attention term weights): changing it is an
 * ordinary reviewed PR. Six hours — the dispatch chain fetches the clone many
 * times a day, so a rank older than this no longer tracks origin/main.
 */
export const STALE_CLONE_THRESHOLD_MS = 6 * 60 * 60 * 1000;

export interface CloneFreshness {
  /** Epoch ms of the newest sync witness (`.git` FETCH_HEAD / HEAD mtime). */
  lastSyncedAt: number;
  /** Milliseconds between now and `lastSyncedAt`. Never negative. */
  ageMs: number;
  /** True when `ageMs` exceeds `STALE_CLONE_THRESHOLD_MS`. */
  stale: boolean;
}

interface GitDirs {
  /** The checkout's git dir — holds HEAD. */
  gitDir: FileSystemDirectoryHandle;
  /** The common dir — holds FETCH_HEAD. Same as `gitDir` for a standard clone. */
  commonDir: FileSystemDirectoryHandle;
}

/**
 * Locate the clone's git dir (and common dir) under the picked root.
 *
 * Two layouts:
 *  - standard clone: `.git` is a directory — it is both git dir and common dir
 *    (unless a `commondir` file says otherwise).
 *  - worktree checkout: `.git` is a one-line FILE, `gitdir: <path>`. FSA
 *    exposes no absolute paths, so an absolute gitdir is located by probing
 *    its path suffixes under the picked root — the layout this repo itself
 *    uses (`.git` → `<root>/.bare/worktrees/main`). The git dir's `commondir`
 *    file (typically `../..`) is then applied to the KNOWN segment path, since
 *    FSA handles cannot walk `..`.
 */
async function resolveGitDirs(root: FileSystemDirectoryHandle): Promise<GitDirs> {
  const dotGitDir = await getChildDirectory(root, ".git");
  if (dotGitDir !== null) {
    return { gitDir: dotGitDir, commonDir: await resolveCommonDir(root, dotGitDir, [".git"]) };
  }
  const dotGitFile = await getChildFile(root, ".git");
  if (dotGitFile === null) {
    throw new GraphSourceError(
      'the picked directory is not a git clone root: it contains no ".git" entry',
    );
  }
  const raw = await (await dotGitFile.getFile()).text();
  const match = /^gitdir: *(.+)$/m.exec(raw);
  if (match === null) {
    throw new GraphSourceError('the clone\'s ".git" file has no "gitdir:" line');
  }
  const gitdirPath = match[1].trim();
  const segments = gitdirPath.split(/[\\/]+/).filter((s) => s !== "" && s !== ".");
  for (let i = 0; i < segments.length; i++) {
    const candidate = segments.slice(i);
    const dir = await resolvePath(root, candidate);
    if (dir !== null) {
      return { gitDir: dir, commonDir: await resolveCommonDir(root, dir, candidate) };
    }
  }
  throw new GraphSourceError(
    `the clone's gitdir (${gitdirPath}) does not resolve inside the picked directory — pick the directory that contains the git dir`,
  );
}

/**
 * Follow the git dir's `commondir` file (a path relative to the git dir, e.g.
 * `../..` from a worktree registration to the shared common dir). Absent file
 * means the git dir IS the common dir (standard clone).
 */
async function resolveCommonDir(
  root: FileSystemDirectoryHandle,
  gitDir: FileSystemDirectoryHandle,
  gitDirSegments: string[],
): Promise<FileSystemDirectoryHandle> {
  const commondirFile = await getChildFile(gitDir, "commondir");
  if (commondirFile === null) return gitDir;
  const relative = (await (await commondirFile.getFile()).text()).trim();
  const segments = [...gitDirSegments];
  for (const part of relative.split(/[\\/]+/)) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (segments.length === 0) {
        throw new GraphSourceError(
          `the clone's commondir (${relative}) escapes the picked directory — pick the clone root that contains the shared git dir`,
        );
      }
      segments.pop();
      continue;
    }
    segments.push(part);
  }
  const dir = segments.length === 0 ? root : await resolvePath(root, segments);
  if (dir === null) {
    throw new GraphSourceError(
      `the clone's commondir (${relative}) does not resolve inside the picked directory`,
    );
  }
  return dir;
}

/**
 * Read the clone's freshness through the handle: the newest of the git dir's
 * HEAD mtime and the common dir's FETCH_HEAD mtime is the last-sync watermark.
 * FETCH_HEAD only exists once the clone has fetched at least once; a
 * never-fetched clone's freshness rests on HEAD alone (a legitimate state at
 * the system edge, not a buried error).
 */
export async function readCloneFreshness(
  root: FileSystemDirectoryHandle,
  now: number = Date.now(),
): Promise<CloneFreshness> {
  const { gitDir, commonDir } = await resolveGitDirs(root);
  const head = await getChildFile(gitDir, "HEAD");
  if (head === null) {
    throw new GraphSourceError(
      "the clone's git dir has no HEAD file — the picked directory does not look like a git clone root",
    );
  }
  const fetchHead = await getChildFile(commonDir, "FETCH_HEAD");
  let lastSyncedAt = 0;
  for (const witness of fetchHead === null ? [head] : [head, fetchHead]) {
    const file = await witness.getFile();
    if (file.lastModified > lastSyncedAt) lastSyncedAt = file.lastModified;
  }
  const ageMs = Math.max(0, now - lastSyncedAt);
  return { lastSyncedAt, ageMs, stale: ageMs > STALE_CLONE_THRESHOLD_MS };
}

// --- The graph view -----------------------------------------------------------------

export interface GraphView {
  /** Every validated node, in file-name order. */
  nodes: IntentionNode[];
  /** The built forest (multi-root, orphan-as-root — `buildTree`'s contract). */
  tree: IntentionTreeNode[];
  /** Derived rank per goal-layer node id (`resolveAttention`'s contract). */
  attention: Map<string, ResolvedAttention>;
  freshness: CloneFreshness;
}

/**
 * The load result. The `stale` variant deliberately carries NO view: past the
 * threshold a consumer structurally cannot render rank — it must show the
 * blocking banner (`renderStaleCloneBanner`) instead. Never render stale rank
 * silently (recorded strategy condition).
 */
export type GraphSourceResult =
  | { kind: "ready"; view: GraphView }
  | { kind: "stale"; freshness: CloneFreshness };

/**
 * Read the whole graph through the clone handle: freshness gate first, then
 * nodes → tree → attention. `now` is injectable for tests.
 */
export async function loadGraphView(
  root: FileSystemDirectoryHandle,
  now: number = Date.now(),
): Promise<GraphSourceResult> {
  const freshness = await readCloneFreshness(root, now);
  if (freshness.stale) {
    return { kind: "stale", freshness };
  }
  const nodes = await readGraphNodes(root);
  const slim: SlimIntentionNode[] = nodes.map(({ id, statement, owner, status, parent }) => ({
    id,
    statement,
    owner,
    status,
    parent,
  }));
  return {
    kind: "ready",
    view: { nodes, tree: buildTree(slim), attention: resolveAttention(nodes), freshness },
  };
}

// --- Staleness chrome ------------------------------------------------------------------

/** Human description of the clone's age, e.g. "synced 3h ago". */
export function describeCloneAge(freshness: CloneFreshness): string {
  const minutes = Math.floor(freshness.ageMs / 60_000);
  if (minutes < 1) return "synced under a minute ago";
  if (minutes < 60) return `synced ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `synced ${hours}h ago`;
  return `synced ${Math.floor(hours / 24)}d ago`;
}

/** Small page-chrome element surfacing the clone's age next to the view. */
export function renderCloneAgeChrome(freshness: CloneFreshness): HTMLElement {
  const span = document.createElement("span");
  span.className = "graph-clone-age";
  span.textContent = `clone ${describeCloneAge(freshness)}`;
  span.title = `local clone last synced ${new Date(freshness.lastSyncedAt).toISOString()}`;
  return span;
}

/**
 * The blocking loud banner a consumer must render for a `stale` result — the
 * only thing shown in place of the graph view.
 */
export function renderStaleCloneBanner(freshness: CloneFreshness): HTMLElement {
  const banner = document.createElement("div");
  banner.className = "graph-stale-banner";
  banner.setAttribute("role", "alert");
  const heading = document.createElement("strong");
  heading.textContent = "Stale clone — graph view blocked.";
  const detail = document.createElement("p");
  const thresholdHours = STALE_CLONE_THRESHOLD_MS / 3_600_000;
  detail.textContent =
    `The local clone ${describeCloneAge(freshness)}, past the ${thresholdHours}h freshness ` +
    "threshold, so attention rank no longer tracks origin/main. " +
    "Run git fetch in the clone, then reload.";
  banner.append(heading, detail);
  return banner;
}
