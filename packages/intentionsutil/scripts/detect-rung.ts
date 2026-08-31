// Rung detection for the local intention graph, written to stdout.
//
// Reads the local `intentions/` store, detects the current rung, and writes
// exactly one rung token (e.g. "rung-0", "rung-5") to stdout with a trailing
// newline. It reads only the local store (no gh, no network) and writes only
// stdout — no committed file, no side effects.
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   node --import tsx/esm intentionsutil/scripts/detect-rung.ts
//
// An empty or absent `intentions/` directory is the bare-repo case and yields
// `rung-0` (empty node list → no principle roots → rung-0).

import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { detectRung } from "../src/rungs.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `intentionsutil/scripts/detect-rung.ts`, so the repo
// root is three directories up. Resolve from this file's own location, never
// from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

// --- Main ------------------------------------------------------------------

function main(): void {
  const nodes = existsSync(intentionsDir) ? listNodes(intentionsDir) : [];
  process.stdout.write(detectRung(nodes) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
