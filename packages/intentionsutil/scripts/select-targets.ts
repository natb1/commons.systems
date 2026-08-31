// Graph-selection candidate computation to stdout (tactic-graph-router-selector).
//
// Reads an intentions store directory, runs the pure graph selector
// (`selectGraphTargets` in ../src/router.ts), and prints the resulting
// `GraphSelection` — the ordered candidate list plus freeze/cap/gate events —
// as one JSON object. The environmental gates (claimed set, phase sensor
// gates, pacing, the selection log) are applied by the shell wrapper
// `.claude/skills/dispatch-propagate/scripts/graph-select-target`, which is
// this script's only intended caller besides manual dry-runs.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts \
//     [--dir <intentions-dir>] [--emit-nodes <path>]
//   node --import tsx/esm packages/intentionsutil/scripts/select-targets.ts \
//     --nodes-json <path>
//
// --dir points at a store SNAPSHOT (the wrapper extracts `intentions/` from
// origin/main into a temp dir — selection never reads a branch's working
// tree). Without --dir it falls back to the repo-local `intentions/` for
// manual dry-runs, resolved relative to this file, never cwd.
//
// --nodes-json <path> selects over an already-materialized node array instead
// of enumerating a directory, and is mutually exclusive with --dir. It exists
// because the wrapper's store is a `git archive origin/main intentions` into a
// FRESH mktemp dir every tick, so a directory-keyed cache can never hit; the
// wrapper keys its entry on the `origin/main:intentions` TREE SHA instead and
// hands the file here, skipping ~75 ms of archive+tar plus ~300 ms of
// yaml.parse. --emit-nodes <path> is the other half: after a --dir enumeration
// it publishes the parsed array for a later run to pick up. It composes with
// --dir and is ignored under --nodes-json (nothing new was enumerated).
//
// Determinism: `listNodesStrict` returns nodes in id-sorted order and
// `selectGraphTargets` orders with a unique `id` final tiebreak, so two runs
// on the same store emit byte-identical stdout.
//
// Enumeration is deliberately STRICT (`listNodesStrict`, not the tolerant
// `listNodes`): absence from the enumerated set is load-bearing "pass"
// semantics in the selector's gates — `blockersComplete` (../src/router.ts)
// treats a `blocked_by` id that is ABSENT from the store as COMPLETE, so a
// corrupt/truncated/0-byte blocker file read tolerantly would silently unblock
// its dependent and dispatch it. Refusing loudly is the only safe reading.
//
// --nodes-json preserves that same guarantee by a different route. It cannot
// re-derive strictness from a directory it never reads, so it refuses instead:
// the payload must be an array, must be NON-EMPTY, and EVERY element must pass
// `validateNode`. Any failure throws — the caller owns the fallback decision,
// not this script (.claude/rules/code-style.md: clear errors, never a silent
// default). The empty-array refusal is the load-bearing one: an empty selection
// is indistinguishable from "no candidates today", so a truncated cache file
// would otherwise read as a quiet fleet stop. A partial array is refused for the
// blockersComplete reason above — a node missing from the set is a `blocked_by`
// id that SATISFIES that predicate.
//
// --emit-nodes never affects the answer. The write is best-effort and its
// failure is swallowed: whether it lands changes only the cost of a later run.
// It also declines to publish an EMPTY array, mirroring the refusal above — an
// entry the reader is guaranteed to reject is worse than no entry at all.

import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateNode, type IntentionNode } from "../src/schema.js";
import { listNodesStrict } from "../src/store.js";
import { selectGraphTargets } from "../src/router.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/select-targets.ts`, so
// the repo root is three directories up.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

// --- Materialized node sets -------------------------------------------------

/**
 * Read a materialized node array, or throw.
 *
 * Every rejection is loud on purpose. This function stands where
 * `listNodesStrict` stands on the --dir path, and it must be exactly as
 * unwilling to return a partial set: an id missing from what
 * `selectGraphTargets` receives is a `blocked_by` target that SATISFIES
 * `blockersComplete`. An EMPTY array is refused for a second
 * reason — it is a valid JSON array, so accepting it would turn a truncated
 * file into a silent "nothing is selectable" and stop the fleet without a word.
 *
 * The caller decides what to do about the throw. `graph-select-target` deletes
 * the offending entry and re-runs the full archive path exactly once.
 */
/**
 * Raised ONLY for "the --nodes-json payload is unusable". It exists so the
 * caller can tell that apart from every other way this script can fail: the
 * wrapper's response to an unusable payload is to DELETE the cache entry, and
 * doing that on an unrelated selector failure destroys a perfectly good entry
 * and misreports the cause. See the exit-3 mapping at the bottom of this file.
 */
class NodesJsonError extends Error {}

function readNodesJson(path: string): IntentionNode[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    // A truncated or unreadable entry is a payload problem, not a selector one.
    throw new NodesJsonError(
      `select-targets: --nodes-json ${path} could not be read as JSON: ${String(err)}`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new NodesJsonError(`select-targets: --nodes-json ${path} is not a JSON array`);
  }
  const items: unknown[] = parsed;
  if (items.length === 0) {
    throw new NodesJsonError(`select-targets: --nodes-json ${path} is an empty array`);
  }
  try {
    return items.map((item) => validateNode(item));
  } catch (err) {
    // validateNode's own message is preserved; only the CLASS changes, so the
    // wrapper can route it while the operator still reads the real reason.
    throw new NodesJsonError(
      `select-targets: --nodes-json ${path} holds an invalid node: ${String(err)}`,
    );
  }
}

/**
 * Publish `nodes` at `path`, best-effort.
 *
 * A temp file renamed into place keeps the entry atomic, so a concurrent reader
 * sees the whole array or no file at all — never a truncated one that a later
 * run would have to reject. The suffix carries a random component as well as the
 * pid because the pid alone is NOT unique across sandboxed processes sharing one
 * cache directory (measured 2026-08-30: three sandboxed `node` invocations
 * reported pids 4, 5 and 4 — see `writeCacheEntry` in ../src/store-cache.ts).
 *
 * Every failure is swallowed, and the temp is removed when it is. A full or
 * read-only cache directory must cost the next run a re-parse, never cost this
 * run its selection.
 *
 * An EMPTY node set is never published, because `readNodesJson` refuses an
 * empty array outright (a truncated entry must not read as "no candidates").
 * Writing one would file an entry this script has already guaranteed to
 * reject, so a store with no nodes would re-archive, re-parse and log a
 * spurious "cache entry unusable" warning on every single selection forever.
 * Not writing costs that store nothing: its enumeration is empty anyway.
 */
function emitNodesJson(path: string, nodes: IntentionNode[]): void {
  if (nodes.length === 0) return;
  const tmp = `${path}.tmp.${process.pid}.${Math.random().toString(36).slice(2)}`;
  try {
    writeFileSync(tmp, JSON.stringify(nodes));
    renameSync(tmp, path);
  } catch {
    try {
      rmSync(tmp, { force: true });
    } catch {
      // best-effort cleanup of a temp file that may never have been created
    }
  }
}

// --- Main ------------------------------------------------------------------

function main(argv: string[]): void {
  let intentionsDir = join(repoRoot, "intentions");
  let dirGiven = false;
  let nodesJson: string | null = null;
  let emitNodes: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        throw new Error("select-targets: --dir requires a directory argument");
      }
      intentionsDir = value;
      dirGiven = true;
      i++;
    } else if (argv[i] === "--nodes-json") {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        throw new Error("select-targets: --nodes-json requires a file argument");
      }
      nodesJson = value;
      i++;
    } else if (argv[i] === "--emit-nodes") {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        throw new Error("select-targets: --emit-nodes requires a file argument");
      }
      emitNodes = value;
      i++;
    } else {
      throw new Error(`select-targets: unknown argument '${argv[i]}'`);
    }
  }

  // The two are alternative sources for the same node set, so accepting both
  // would mean silently ignoring one of them.
  if (nodesJson !== null && dirGiven) {
    throw new Error("select-targets: --nodes-json is mutually exclusive with --dir");
  }

  let nodes: IntentionNode[];
  if (nodesJson !== null) {
    nodes = readNodesJson(nodesJson);
  } else {
    nodes = listNodesStrict(intentionsDir);
    if (emitNodes !== null) emitNodesJson(emitNodes, nodes);
  }

  const selection = selectGraphTargets(nodes);
  process.stdout.write(`${JSON.stringify(selection)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    // Exit 3 means EXACTLY "the --nodes-json payload was unusable" — the one
    // failure a caller may answer by discarding its cache entry. Every other
    // failure keeps the default non-zero exit, so a selectGraphTargets throw, a
    // missing node_modules, or a tsx startup failure is never reported to an
    // operator as a corrupt cache.
    if (err instanceof NodesJsonError) {
      process.stderr.write(`${err.message}\n`);
      process.exit(3);
    }
    throw err;
  }
}
