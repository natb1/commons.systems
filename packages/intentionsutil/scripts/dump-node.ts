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
// to pipe back into write-node.ts after reconciliation) and appends a
// `<id>=<blobsha>` line to `<dir>/base-manifest.txt`. It prints the manifest
// path on stdout so the caller can pass it straight to `graph-commit --base`.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
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
  "  <id>=<blobsha> lines; prints the manifest path for `graph-commit --base`.\n";

// --- Core helper (exported for tests) --------------------------------------

/**
 * Dump each node in `ids` to JSON in `outDir` and write a base manifest of
 * `<id>=<blobsha>` lines. `blobsha` is `git hash-object` of the on-disk node
 * file — i.e. the exact content that was read — so `graph-commit --base` can
 * refuse the write if origin/main's blob has since moved.
 *
 * Returns the absolute manifest path.
 */
export function dumpNodes(intentionsDir: string, repoRoot: string, outDir: string, ids: string[]): string {
  mkdirSync(outDir, { recursive: true });
  const manifestLines: string[] = [];
  for (const id of ids) {
    const node = readNode(intentionsDir, id);
    writeFileSync(join(outDir, `${id}.json`), `${JSON.stringify(node, null, 2)}\n`);
    // Blob sha of the file actually read. `git hash-object` is content-only
    // (no side effects, no index touch), so it is safe from any worktree.
    const blob = execFileSync("git", ["-C", repoRoot, "hash-object", `intentions/${id}.md`], {
      encoding: "utf8",
    }).trim();
    manifestLines.push(`${id}=${blob}`);
  }
  const manifestPath = join(outDir, "base-manifest.txt");
  writeFileSync(manifestPath, `${manifestLines.join("\n")}\n`);
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
