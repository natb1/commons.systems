// Local snapshot persistence for the office-hours encrypted snapshot.
//
// Takes a serialized snapshot (plain JSON object or string) and a password,
// encrypts it to BENC bytes (byte-compatible with the #2659 reader and the
// budget-etl `.benc` format), and writes it to a configured directory with:
//   - a deny-loud mount check (mirrors budget-etl step-0),
//   - an immutable, append-only, timestamped history file,
//   - a stable `current` pointer produced by COPY (not a symlink — `ln -s`
//     fails on the /mnt/g Google Drive mount),
//   - atomic temp+rename for every write so a reader never sees a partial file.
//
// Pure module: no top-level side effects. The target dir, password, and clock
// are all parameters so tests can drive it against a tmp dir.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { encryptData } from "@commons-systems/crypto-core";

/** Stable filename the reader opens. */
export const CURRENT_FILENAME = "office-hours-current.benc";

/** Prefix for the immutable, timestamped history files. */
export const HISTORY_PREFIX = "office-hours-";
export const HISTORY_SUFFIX = ".benc";

export interface WriteSnapshotArgs {
  /** Directory the encrypted snapshot is written to. Must already exist. */
  snapshotDir: string;
  /** Serialized snapshot — a plain JSON-serializable object, or a JSON string. */
  json: unknown;
  /** Password used to derive the BENC AES-256-GCM key. */
  password: string;
  /** Clock for the history-file timestamp. Defaults to `new Date()`. */
  now?: Date;
}

export interface WriteSnapshotResult {
  /** Absolute path of the immutable timestamped history file just written. */
  historyPath: string;
  /** Absolute path of the stable `current` pointer (a real copy). */
  currentPath: string;
}

/**
 * Format a Date as `YYYY-MM-DDTHH-MM-SS` (budget's `%Y-%m-%dT%H-%M-%S`, colons
 * replaced by dashes so the value is filename-safe). Uses local-time fields to
 * match `date +%Y-%m-%dT%H-%M-%S`.
 */
export function formatTimestamp(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}` +
    `T${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`
  );
}

function tmpPathIn(dir: string): string {
  return path.join(
    dir,
    `.office-hours-snapshot-${process.pid}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.tmp`,
  );
}

/** Run `produce(tmp)` to populate a temp file in `dir`, then atomically rename it over `finalPath`. */
function atomicCommit(
  finalPath: string,
  produce: (tmp: string) => void,
): void {
  const tmp = tmpPathIn(path.dirname(finalPath));
  try {
    produce(tmp);
    fs.renameSync(tmp, finalPath);
  } catch (err) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      // best-effort cleanup; surface the original error below
    }
    throw err;
  }
}

/** Atomically write `bytes` to `finalPath` via a temp file in the same dir + rename. */
function atomicWrite(finalPath: string, bytes: Uint8Array): void {
  atomicCommit(finalPath, (tmp) => fs.writeFileSync(tmp, bytes));
}

/** Atomically copy `srcPath` to `finalPath` via a temp file in the same dir + rename. */
function atomicCopy(srcPath: string, finalPath: string): void {
  atomicCommit(finalPath, (tmp) => fs.copyFileSync(srcPath, tmp));
}

/**
 * Encrypt a serialized snapshot and write it to `snapshotDir` as an immutable
 * timestamped history file plus a stable `current` copy. Returns both paths.
 *
 * Fail-closed: throws a clear single-line Error if the mount/dir is missing.
 */
export async function writeSnapshot(
  args: WriteSnapshotArgs,
): Promise<WriteSnapshotResult> {
  const { snapshotDir, json, password } = args;
  const now = args.now ?? new Date();

  // 1. Deny-loud mount check — do NOT create the dir silently (guards against an
  //    unmounted /mnt/g Drive). See .claude/rules/code-style.md.
  let stat: fs.Stats;
  try {
    stat = fs.statSync(snapshotDir);
  } catch {
    throw new Error(`snapshot dir missing (Drive mount?): ${snapshotDir}`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`snapshot dir is not a directory: ${snapshotDir}`);
  }

  // 2. Encrypt the serialized snapshot to BENC bytes.
  const plaintext = typeof json === "string" ? json : JSON.stringify(json);
  const benc = await encryptData(
    crypto.webcrypto.subtle,
    (arr: Uint8Array): Uint8Array => { crypto.webcrypto.getRandomValues(arr as Uint8Array<ArrayBuffer>); return arr; }, // type-safety-ok: narrowing to typed array for the webcrypto API generic parameter
    plaintext,
    password,
  );
  const bytes = new Uint8Array(benc);

  // 3. Append-only history: immutable timestamped file, atomic write.
  const ts = formatTimestamp(now);
  const historyPath = path.join(
    snapshotDir,
    `${HISTORY_PREFIX}${ts}${HISTORY_SUFFIX}`,
  );
  atomicWrite(historyPath, bytes);

  // 4. Stable `current` pointer — a real COPY of the history file (not a
  //    symlink: `ln -s` fails on the /mnt/g Drive), atomic temp+rename.
  const currentPath = path.join(snapshotDir, CURRENT_FILENAME);
  atomicCopy(historyPath, currentPath);

  return { historyPath, currentPath };
}
