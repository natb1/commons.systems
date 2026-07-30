// Dumps one or more intention nodes as JSON into a target directory AND writes a
// base manifest recording, per id, the blob sha of the node file actually read
// (`git hash-object intentions/<id>.md`). The manifest is the compare-and-swap
// token `graph-commit --base <manifest>` checks against origin/main before it
// lands a write, so a stale read fails mechanically rather than by rebase luck
// (the 2026-07-06 near-miss: a stale dump of a live node avoided a textual
// conflict and nearly clobbered concurrent phase state).
//
// This replaces the ad-hoc per-session `readNode` dump one-liners the align
// skills used before capturing base state was uniform.
//
// The intentions/ directory is resolved from import.meta.url, not cwd, so the
// store read is always the repo-canonical one — matching write-node.ts.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir <dir> <id> [<id> ...]
//
// For each <id> it writes `<dir>/<id>.json` (the shape `readNode` returns, ready
// to pipe back into write-node.ts after reconciliation) and merges a
// `<id>=<blobsha>` line into `<dir>/base-manifest.txt`. It prints the manifest
// path on stdout so the caller can pass it straight to `graph-commit --base`.
//
// The manifest merge (see dumpNodes below) exists because a second dump into an
// out-dir used to truncate the manifest, silently dropping the earlier ids' base
// tokens — so `graph-commit --base` guarded one node while the rest landed with
// no compare-and-swap at all.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode } from "../src/store.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/dump-node.ts`, so the
// repo root is three directories up. Resolve from this file's own location,
// never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

const USAGE =
  "usage: dump-node.ts --out-dir <dir> <id> [<id> ...]\n" +
  "  Writes <dir>/<id>.json for each node and a <dir>/base-manifest.txt of\n" +
  "  <id>=<blobsha> lines; prints the manifest path for `graph-commit --base`.\n" +
  "  The manifest is merged by id, so a repeat dump into the same --out-dir\n" +
  "  keeps the earlier ids it can still verify. One --out-dir per graph-commit.\n";

// --- Core helper (exported for tests) --------------------------------------

/**
 * Blob sha of the on-disk node file. `git hash-object` is content-only (no side
 * effects, no index touch), so it is safe from any worktree.
 */
function hashNodeFile(repoRoot: string, id: string): string {
  return execFileSync("git", ["-C", repoRoot, "hash-object", `intentions/${id}.md`], {
    encoding: "utf8",
  }).trim();
}

/**
 * Same hash, but for re-checking a manifest line this call did not produce.
 * A node that has since been pruned cannot be hashed, and that is an expected
 * outcome here rather than a broken environment — report it as "absent" so the
 * caller can drop the entry and say why.
 */
function hashNodeFileIfPresent(repoRoot: string, id: string): string | null {
  try {
    return execFileSync("git", ["-C", repoRoot, "hash-object", `intentions/${id}.md`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
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
 *   id. It is NOT carried forward: `graph-commit`'s `add_base_pair` accepts a
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
      const current = hashNodeFileIfPresent(repoRoot, id);
      if (current === blob) {
        merged.set(id, blob);
        continue;
      }
      process.stderr.write(
        `dump-node: dropping stale manifest entry '${id}' from ${manifestPath} — ` +
          `intentions/${id}.md no longer matches the recorded base blob ${blob} ` +
          `(now ${current ?? "absent"}). Its compare-and-swap guard is NOT in this manifest. ` +
          "Capture every id a single graph-commit lands in one dump-node.ts call, " +
          "and give unrelated writes their own --out-dir.\n",
      );
    }
  }

  for (const id of ids) {
    const node = readNode(intentionsDir, id);
    writeFileSync(join(outDir, `${id}.json`), `${JSON.stringify(node, null, 2)}\n`);
    merged.set(id, hashNodeFile(repoRoot, id));
  }

  const lines = [...merged].map(([id, blob]) => `${id}=${blob}`);
  writeFileSync(manifestPath, `${lines.join("\n")}\n`);
  return manifestPath;
}

// --- Main ------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE);
    return;
  }

  const outIdx = args.indexOf("--out-dir");
  if (outIdx === -1 || !args[outIdx + 1]) {
    process.stderr.write("dump-node: --out-dir <dir> is required\n" + USAGE);
    process.exit(1);
  }
  const outDir = args[outIdx + 1];
  const ids = args.filter((a, i) => i !== outIdx && i !== outIdx + 1 && !a.startsWith("-"));
  if (ids.length === 0) {
    process.stderr.write("dump-node: at least one node id is required\n" + USAGE);
    process.exit(1);
  }

  const manifestPath = dumpNodes(intentionsDir, repoRoot, outDir, ids);
  process.stdout.write(`${manifestPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
