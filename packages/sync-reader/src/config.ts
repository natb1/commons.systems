// Loader for the non-version-controlled sync-reader config file.
//
// The config lives at `<project-root>/dispatch.config/sync-reader.json` —
// outside every git worktree, shared across them. The project root is resolved
// as `dirname(git --git-common-dir)` (the same rule as resolve_project_root in
// `.claude/skills/dispatch-propagate/scripts/lib.sh`, correct across worktrees).
// A `SYNC_READER_CONFIG_DIR` env override points the loader at an explicit
// directory (used by tests and analogous to DISPATCH_CONFIG_DIR); when set, no
// git repo is required.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Normalized result of loading `sync-reader.json`. */
export type SyncReaderConfig =
  | { kind: "config"; reader_dir: string; share_dir: string }
  | { kind: "no-config" };

const CONFIG_FILENAME = "sync-reader.json";

/**
 * Resolve the shared project root: `dirname(git --git-common-dir)`. The common
 * dir is shared by every worktree, so this is stable regardless of which
 * worktree the process runs in. Throws a clear error (no fallback) when not in
 * a git repo — the config dir cannot be located otherwise.
 */
function resolveProjectRoot(): string {
  let commonDir: string;
  try {
    commonDir = execFileSync(
      "git",
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      { encoding: "utf8" },
    ).trim();
  } catch {
    throw new Error(
      "sync-reader: not in a git repository and SYNC_READER_CONFIG_DIR is unset — " +
        "cannot locate the dispatch.config directory",
    );
  }
  return dirname(commonDir);
}

/** The directory that holds `sync-reader.json`. Honors the env override. */
function configDir(): string {
  const override = process.env.SYNC_READER_CONFIG_DIR;
  if (override !== undefined && override.length > 0) return override;
  return join(resolveProjectRoot(), "dispatch.config");
}

/**
 * Load and normalize the sync-reader config.
 *
 * - file absent            → `{kind: "no-config"}` (the CLI prints setup help).
 * - present, valid         → `{kind: "config", reader_dir, share_dir}`.
 * - present, invalid       → throws a clear error naming the file and the bad
 *                            field (clear errors over defensive fallbacks).
 */
export function loadConfig(): SyncReaderConfig {
  const path = join(configDir(), CONFIG_FILENAME);
  if (!existsSync(path)) return { kind: "no-config" };

  const raw = readFileSync(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`${path}: invalid JSON — ${detail}`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${path}: expected a JSON object`);
  }

  const obj = parsed as Record<string, unknown>; // type-safety-ok: parsed-JSON narrow after the object/array guard above
  const reader_dir = obj.reader_dir;
  const share_dir = obj.share_dir;
  if (typeof reader_dir !== "string" || reader_dir.length === 0) {
    throw new Error(`${path}: "reader_dir" must be a non-empty string`);
  }
  if (typeof share_dir !== "string" || share_dir.length === 0) {
    throw new Error(`${path}: "share_dir" must be a non-empty string`);
  }
  return { kind: "config", reader_dir, share_dir };
}
