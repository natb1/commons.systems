// Read-only, token-bounded digest of the whole intention graph to stdout.
//
// Gathers the digest module's pure inputs from the local `intentions/` store
// and git history, then renders the digest. Reads only the local store and
// `git log` (no gh, no network) and writes only stdout — no committed file.
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts
//   node --import tsx/esm packages/intentionsutil/scripts/graph-digest.ts --tables-only
//
// Flags:
//   --tables-only   Emit Section 2 (the derived check tables) only, so an audit
//                   session can skip the per-node section entirely.
//
// Determinism: the digest module sorts every table and carries no
// wall-clock/environment data, so two runs on the same store emit
// byte-identical stdout. (The deleted-ids input is derived from committed git
// history, which is stable for a given commit.)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import { extractBody } from "../src/frontmatter.js";
import { renderDigest, renderTables, type DigestInput } from "../src/digest.js";
import { deletedNodeIds } from "./lib-deleted-node-ids.js";
import { readGapNotes } from "../src/gap-note-store.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/graph-digest.ts`, so the
// repo root is three directories up. Resolve from this file's own location,
// never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

// `deletedNodeIds` (git-shelled, was local here) now lives in the shared
// `./lib-deleted-node-ids.ts` so `validate-graph.ts` reuses the exact same
// implementation.

function gatherInput(): DigestInput {
  const nodes = listNodes(intentionsDir);
  const bodies = new Map<string, string>();
  const rawTexts = new Map<string, string>();
  for (const node of nodes) {
    // Read each file once and derive the body from that same raw text, rather
    // than re-opening it via readNodeBody.
    const raw = readFileSync(join(intentionsDir, `${node.id}.md`), "utf8");
    rawTexts.set(node.id, raw);
    bodies.set(node.id, extractBody(raw, node.id));
  }
  return { nodes, bodies, rawTexts, deletedIds: deletedNodeIds(), gapNotes: readGapNotes(intentionsDir) };
}

function main(): void {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a !== "--tables-only");
  if (unknown.length > 0) {
    // Reject an unrecognized/misspelled flag rather than silently falling back
    // to the full digest (which would defeat a --tables-only token budget).
    process.stderr.write(
      `graph-digest: unknown argument(s): ${unknown.join(" ")}\nusage: graph-digest [--tables-only]\n`,
    );
    process.exit(1);
  }
  const tablesOnly = args.includes("--tables-only");
  const input = gatherInput();
  process.stdout.write(tablesOnly ? renderTables(input) : renderDigest(input));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
