// Dumps one or more intention nodes as JSON into a target directory AND writes a
// base manifest recording, per id, the blob sha of the node file actually read
// (`git hash-object <intentions-dir>/<id>.md`). The manifest is the compare-and-swap
// token `graph-commit --base <manifest>` checks against origin/main before it
// lands a write, so a stale read fails mechanically rather than by rebase luck
// (the 2026-07-06 near-miss: a stale dump of a live node avoided a textual
// conflict and nearly clobbered concurrent phase state).
//
// This replaces the ad-hoc per-session `readNode` dump one-liners the align
// skills used before capturing base state was uniform.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts \
//     --dir <intentions-dir> --out-dir <dir> <id> [<id> ...]
//
// Spell it `node --import tsx/esm`, NOT `npx tsx`. The tsx CLI wrapper opens an
// IPC socket at startup, which the sandbox denies — `listen EPERM: operation
// not permitted /tmp/.../N.pipe`, thrown in `createIpcServer` before the
// wrapper parses its arguments, so it fails whatever script you point it at.
// `node --import tsx/esm` loads the same loader in-process, opens no socket,
// and runs sandboxed and unsandboxed alike (.claude/rules/sandbox.md,
// "npx tsx").
//
// `--dir <intentions-dir>` is REQUIRED and has no default
// (strategy-graph-native-dispatch clarification 194, ADOPTED; clarification 242
// scopes the conversion to validate-graph.ts / write-node.ts / dump-node.ts /
// clear-park). It used to resolve `<repoRoot>/intentions` from
// `import.meta.url`, which made the tree READ a property of WHICH COPY of this
// script ran rather than of what the caller asked for — and a base manifest is
// worse than useless when it pins blobs from the wrong checkout: `graph-commit
// --base` would then compare-and-swap against content the session never read.
// The repo root the blob shas are taken in is derived from --dir with
// `git rev-parse --show-toplevel`, so it is the tree that actually holds the
// store, and a --dir outside any repository is a clear error rather than a
// silent mis-hash (.claude/rules/code-style.md).
//
// For each <id> it writes `<dir>/<id>.json` (the shape `readNode` returns,
// which write-node.ts accepts back after reconciliation) and merges a
// `<id>=<blobsha>` line into `<dir>/base-manifest.txt`. It prints the manifest
// path on stdout so the caller can pass it straight to `graph-commit --base`.
//
// WARNING — FEED THAT JSON BACK AS A FILE, NOT AS AN INLINE `echo '<json>' |`
// STRING. Shell metacharacters inside a node value are eaten by the shell
// before write-node.ts sees them, and nothing signals the damage: zsh deletes
// apostrophes and hands over still-valid JSON, so the write succeeds at exit 0
// with mangled content. Measured — the shell argument
//   '{"statement":"it's the author's call"}'
// arrives as `{"statement":"its the authors call"}`: valid JSON, two
// apostrophes gone, no warning anywhere. Found on PR #3146. Pass the dumped
// file straight through with `write-node.ts --file <path>`.
//
// The manifest merge (see dumpNodes below) exists because a second dump into an
// out-dir used to truncate the manifest, silently dropping the earlier ids' base
// tokens — so `graph-commit --base` guarded one node while the rest landed with
// no compare-and-swap at all.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readNode } from "../src/store.js";

const USAGE =
  "usage: dump-node.ts --dir <intentions-dir> --out-dir <dir> <id> [<id> ...]\n" +
  "  Writes <dir>/<id>.json for each node and a <dir>/base-manifest.txt of\n" +
  "  <id>=<blobsha> lines; prints the manifest path for `graph-commit --base`.\n" +
  "  The manifest is merged by id, so a repeat dump into the same --out-dir\n" +
  "  keeps the earlier ids it can still verify. One --out-dir per graph-commit.\n";

// --- Core helper (exported for tests) --------------------------------------

/**
 * The node file's path RELATIVE to `repoRoot` — the form `git hash-object`
 * wants, and the form the stale-entry warning quotes. Computed from the
 * caller-supplied `intentionsDir` rather than hard-coded as `intentions/<id>.md`
 * so a store passed under any name or nesting still hashes the file that was
 * actually read.
 */
function nodeRelPath(repoRoot: string, intentionsDir: string, id: string): string {
  return relative(resolve(repoRoot), resolve(intentionsDir, `${id}.md`));
}

/**
 * Blob sha of the on-disk node file. `git hash-object` is content-only (no side
 * effects, no index touch), so it is safe from any worktree.
 */
function hashNodeFile(repoRoot: string, intentionsDir: string, id: string): string {
  return execFileSync(
    "git",
    ["-C", repoRoot, "hash-object", "--", nodeRelPath(repoRoot, intentionsDir, id)],
    { encoding: "utf8" },
  ).trim();
}

/**
 * Same hash, but for re-checking a manifest line this call did not produce.
 * A node that has since been pruned cannot be hashed, and that is an expected
 * outcome here rather than a broken environment — report it as "absent" so the
 * caller can drop the entry and say why.
 */
function hashNodeFileIfPresent(
  repoRoot: string,
  intentionsDir: string,
  id: string,
): string | null {
  try {
    return execFileSync(
      "git",
      ["-C", repoRoot, "hash-object", "--", nodeRelPath(repoRoot, intentionsDir, id)],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    return null;
  }
}

/**
 * Read an existing `base-manifest.txt` into id -> blobsha pairs, preserving
 * line order. A line that is not `<id>=<blobsha>` is a corrupt manifest, not
 * something to skip past: throw rather than quietly produce a thinner guard.
 */
function readManifest(manifestPath: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const raw of readFileSync(manifestPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (line === "") continue;
    const eq = line.indexOf("=");
    if (eq <= 0 || eq === line.length - 1) {
      throw new Error(
        `dump-node: malformed line in existing manifest ${manifestPath}: ${JSON.stringify(line)} ` +
          "(expected <id>=<blobsha>)",
      );
    }
    entries.set(line.slice(0, eq), line.slice(eq + 1));
  }
  return entries;
}

/**
 * Dump each node in `ids` to JSON in `outDir` and write a base manifest of
 * `<id>=<blobsha>` lines. `blobsha` is `git hash-object` of the on-disk node
 * file — i.e. the exact content that was read — so `graph-commit --base` can
 * refuse the write if origin/main's blob has since moved.
 *
 * The manifest is merged by id, not truncated:
 *
 * - An id named in THIS call always gets this call's freshly-read blob; an
 *   existing line for that id is overwritten in place.
 * - An id left over from an EARLIER call into the same out-dir is preserved
 *   only if this call can still verify it — the node file on disk must still
 *   hash to the blob the earlier line recorded. That is the whole claim a
 *   manifest line makes ("this is the content that was read"), and it is the
 *   only claim a later call is in a position to re-assert.
 * - An unverifiable leftover is dropped with a loud stderr warning naming the
 *   id. It is NOT carried forward: `graph-commit`'s `add_blob_pair` accepts a
 *   `--base` entry for any id with no membership check against the ids being
 *   committed, and `check_base_freshness` iterates every entry independently —
 *   so a stale blob for an unrelated, already-landed node makes graph-commit
 *   attempt a three-way merge on that node and, on divergence, `park_and_exit`,
 *   parking the write that was actually in flight. Silently unioning leftovers
 *   would trade one silent failure for a worse one.
 *
 * The out-dir is therefore the dump scope: one out-dir holds the base tokens
 * for one `graph-commit`. Unrelated writes must use separate out-dirs, and the
 * ids for a single commit are best captured in a single call.
 *
 * Returns the absolute manifest path.
 */
export function dumpNodes(intentionsDir: string, repoRoot: string, outDir: string, ids: string[]): string {
  mkdirSync(outDir, { recursive: true });
  const manifestPath = join(outDir, "base-manifest.txt");
  const merged = new Map<string, string>();

  if (existsSync(manifestPath)) {
    const callIds = new Set(ids);
    for (const [id, blob] of readManifest(manifestPath)) {
      if (callIds.has(id)) {
        // This call re-reads the node; reserve its line position and let the
        // fresh read below supply the value.
        merged.set(id, "");
        continue;
      }
      const current = hashNodeFileIfPresent(repoRoot, intentionsDir, id);
      if (current === blob) {
        merged.set(id, blob);
        continue;
      }
      process.stderr.write(
        `dump-node: dropping stale manifest entry '${id}' from ${manifestPath} — ` +
          `${nodeRelPath(repoRoot, intentionsDir, id)} no longer matches the recorded base blob ${blob} ` +
          `(now ${current ?? "absent"}). Its compare-and-swap guard is NOT in this manifest. ` +
          "Capture every id a single graph-commit lands in one dump-node.ts call, " +
          "and give unrelated writes their own --out-dir.\n",
      );
    }
  }

  for (const id of ids) {
    const node = readNode(intentionsDir, id);
    writeFileSync(join(outDir, `${id}.json`), `${JSON.stringify(node, null, 2)}\n`);
    merged.set(id, hashNodeFile(repoRoot, intentionsDir, id));
  }

  const lines = [...merged].map(([id, blob]) => `${id}=${blob}`);
  writeFileSync(manifestPath, `${lines.join("\n")}\n`);
  return manifestPath;
}

// --- Main ------------------------------------------------------------------

/**
 * The git toplevel that owns `intentionsDir`. The base manifest's blob shas are
 * `git hash-object` output, so they are only meaningful inside the repository
 * that actually holds the store. Deriving the root from --dir (rather than from
 * this script's own location, or from cwd) is what keeps a manifest pinned to
 * the tree that was read. A --dir outside any repository is a clear error.
 */
function repoRootOf(intentionsDir: string): string {
  try {
    return execFileSync("git", ["-C", intentionsDir, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    process.stderr.write(
      `dump-node: could not resolve a git repository for --dir '${intentionsDir}' ` +
        `(resolved: ${resolve(intentionsDir)}). The base manifest records ` +
        "`git hash-object` blob shas, which are only meaningful inside the checkout that " +
        "holds the store, so there is nothing safe to fall back to.\n",
    );
    process.exit(1);
  }
}

/**
 * `--dir` / `--out-dir` are both required flags; everything else positional is a
 * node id. Parsed by scanning rather than by index arithmetic so a flag VALUE
 * can never be mistaken for an id (the old parser filtered on `startsWith("-")`,
 * which would have swallowed `--dir <path>`'s path as an id).
 */
function parseArgs(args: string[]): { intentionsDir: string; outDir: string; ids: string[] } {
  let intentionsDir: string | null = null;
  let outDir: string | null = null;
  const ids: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dir" || arg === "--out-dir") {
      const value = args[++i];
      if (value === undefined || value === "") {
        process.stderr.write(`dump-node: ${arg} requires a directory argument\n` + USAGE);
        process.exit(1);
      }
      if (arg === "--dir") intentionsDir = value;
      else outDir = value;
      continue;
    }
    if (arg.startsWith("-")) {
      process.stderr.write(`dump-node: unknown option '${arg}'\n` + USAGE);
      process.exit(1);
    }
    ids.push(arg);
  }

  if (intentionsDir === null) {
    process.stderr.write(
      "dump-node: --dir <intentions-dir> is required and has no default — name the store to " +
        "read (e.g. `intentions`, or an absolute path into the checkout whose base blobs you " +
        "want pinned). This script no longer infers the store from its own file location.\n" +
        USAGE,
    );
    process.exit(1);
  }
  if (outDir === null) {
    process.stderr.write("dump-node: --out-dir <dir> is required\n" + USAGE);
    process.exit(1);
  }
  if (ids.length === 0) {
    process.stderr.write("dump-node: at least one node id is required\n" + USAGE);
    process.exit(1);
  }
  return { intentionsDir, outDir, ids };
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE);
    return;
  }

  const { intentionsDir, outDir, ids } = parseArgs(args);
  const manifestPath = dumpNodes(intentionsDir, repoRootOf(intentionsDir), outDir, ids);
  process.stdout.write(`${manifestPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
