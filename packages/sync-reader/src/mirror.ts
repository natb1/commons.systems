// Mirror the desired excerpt set into the reader's managed subdirectory.
//
// Split into pure planning (`planMirror`) and execution (`applyMirror`). The
// managed subdir is `<reader_dir>/commons-curriculum/`; nothing outside it is
// ever touched. A file is a write when absent or byte-different, a delete when
// it is a `*.epub` in the managed dir that is no longer desired (a retired
// chunk), and a keep otherwise. `applyMirror` refuses to touch anything outside
// the managed dir or any non-`.epub` entry.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

export const MANAGED_SUBDIR = "commons-curriculum";

/** The managed subdirectory under a reader mount. */
export function managedDirFor(readerDir: string): string {
  return join(readerDir, MANAGED_SUBDIR);
}

/**
 * The excerpt filename for a chunk: zero-padded priority prefix + the chunk id
 * with its `tactic-` prefix dropped, e.g.
 * `04-reading-chunk-3-kant-humanity-servility.epub`.
 */
export function desiredFilename(chunkId: string, priority: number): string {
  const shortId = chunkId.replace(/^tactic-/, "");
  return `${String(priority).padStart(2, "0")}-${shortId}.epub`;
}

export interface MirrorPlan {
  writes: { filename: string; bytes: Uint8Array }[];
  deletes: string[];
  keeps: string[];
}

/**
 * Plan the mirror by comparing `desired` (filename → excerpt bytes) against the
 * `*.epub` files currently in `managedDir`. Pure: reads for comparison, writes
 * nothing.
 */
export function planMirror(
  desired: Map<string, Uint8Array>,
  managedDir: string,
): MirrorPlan {
  const writes: MirrorPlan["writes"] = [];
  const keeps: string[] = [];
  const deletes: string[] = [];

  const existing =
    existsSync(managedDir) && statSync(managedDir).isDirectory()
      ? readdirSync(managedDir).filter((f) => f.endsWith(".epub"))
      : [];

  for (const [filename, bytes] of desired) {
    const path = join(managedDir, filename);
    if (!existsSync(path)) {
      writes.push({ filename, bytes });
      continue;
    }
    const current = readFileSync(path);
    if (Buffer.from(bytes).equals(current)) keeps.push(filename);
    else writes.push({ filename, bytes });
  }

  for (const filename of existing) {
    if (!desired.has(filename)) deletes.push(filename);
  }

  return { writes, deletes, keeps };
}

/** Guard: a managed filename is a plain `*.epub` with no path traversal. */
function assertSafeManagedFilename(filename: string): void {
  if (
    !filename.endsWith(".epub") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename === "." ||
    filename === ".."
  ) {
    throw new Error(`sync-reader: refusing to touch unsafe managed filename "${filename}"`);
  }
}

/**
 * Execute a plan against `managedDir`. Creates the directory if absent. Refuses
 * to operate on a directory that is not named `commons-curriculum`, and refuses
 * any write/delete whose filename is not a plain `*.epub` — so nothing outside
 * the managed subdir is ever written or deleted.
 */
export function applyMirror(plan: MirrorPlan, managedDir: string): void {
  if (basename(managedDir) !== MANAGED_SUBDIR) {
    throw new Error(
      `sync-reader: managed dir must be named "${MANAGED_SUBDIR}", got "${managedDir}"`,
    );
  }
  mkdirSync(managedDir, { recursive: true });

  for (const filename of plan.deletes) {
    assertSafeManagedFilename(filename);
    rmSync(join(managedDir, filename));
  }
  for (const { filename, bytes } of plan.writes) {
    assertSafeManagedFilename(filename);
    writeFileSync(join(managedDir, filename), bytes);
  }
}
