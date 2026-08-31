// list-scope-stale-tactics — thin CLI over the pre-selection scope-staleness
// enumerator (tactic-tick-scriptable-then-spawn Unit 2).
//
// The scope-of-custody gate that today trips only at worker-launch time
// (dispatch-graph-execute's exit-13, mirrored by check-node-selection.ts's
// check 5) is a metadata-only disposition: a scope-stale tactic is demoted back
// to `implement`, no worker runs. Detecting it at launch means the demote
// silently consumes a SPAWN_N launch slot. This entry point prints every such
// tactic id BEFORE selection, so a pre-selection sweep (dispatch-graph-scope-
// sweep) can dispatch the demote as a scriptable non-worker disposition instead.
//
// It is a pure read-only enumeration + printing wrapper over
// `listScopeStaleTactics` (Unit 1). No graph writes, no git, no gh.
//
// Usage:
//   node --import tsx/esm list-scope-stale-tactics.ts \
//     --dir <intentions-dir> --stamp-dir <stamp-dir> \
//     [--live <id> ...] [--live <id,id,...>]
//
//   --dir       (required) the intentions store directory the nodes load from.
//   --stamp-dir (required) the phase-start stamp directory,
//               `<repo>/.claude/worktrees/` — each node's stamp is
//               `<stamp-dir>/<id>.scope-fingerprint`.
//   --live      (repeatable) a live node-id whose in-flight worker owns its own
//               scope and must NOT be swept. Each --live value may be a single
//               id or a comma/space-separated list of ids, so the caller can
//               pass a bash array either element-by-element or as one joined
//               argument. Omit entirely for an empty live set.
//
// Stdout: each stale tactic id on its own line (nothing when none are stale).
// Exit 0 on success; exit 2 on a usage error or a malformed store.
//
// Enumeration is TOLERANT and stays tolerant. A demote is a metadata-only
// disposition, so one damaged node file must cost that node its sweep, never
// abort the sweep for every other tactic — `listNodes`, not `listNodesStrict`.
//
// This runs once per dispatch tick over the whole store, so the enumeration is
// read back through `listNodesCached` (../src/store-cache.ts) when
// DISPATCH_GRAPH_NODE_CACHE names the tick-scoped cache directory: the same node
// set the tick's earlier sweeps are MEANT to have already YAML-parsed,
// deserialized from JSON instead.
//
// NO WRITER IS WIRED YET, so that read cannot hit: the reconcile band
// (`graph-auto-merge`, `reconcile-graph-merged`, `reconcile-graph-review-stall`)
// still imports `listNodesStrict` from ../src/store.js rather than
// `listNodesStrictCached`, and nothing else publishes an entry. Until they are
// wired, setting the var makes this sweep SLOWER — a guaranteed-miss
// `storeFingerprint` on top of the same `listNodes`.
//
// That path READS cache entries and never WRITES one, because a
// tolerant enumeration legitimately omits a corrupt node and publishing that
// shorter set under the shared content key would later hand a STRICT gate caller
// a store with a `blocked_by` target missing, which SATISFIES
// `blockersComplete` (../src/router.ts). The full argument is in
// store-cache.ts's header. An unset or empty var is byte-for-byte today's
// `listNodes` call, and the emitted id list is identical either way.

import { pathToFileURL } from "node:url";
import { listNodesCached } from "../src/store-cache.js";
import { listScopeStaleTactics } from "../src/scope-sweep.js";

export interface SweepOpts {
  dir: string;
  stampDir: string;
  liveIds: Set<string>;
}

function parseArgs(argv: string[]): SweepOpts {
  let dir: string | null = null;
  let stampDir: string | null = null;
  const liveIds = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      const v = argv[++i];
      if (v === undefined || v === "") throw new Error("list-scope-stale-tactics: --dir requires a directory argument");
      dir = v;
    } else if (arg === "--stamp-dir") {
      const v = argv[++i];
      if (v === undefined || v === "") throw new Error("list-scope-stale-tactics: --stamp-dir requires a directory argument");
      stampDir = v;
    } else if (arg === "--live") {
      const v = argv[++i];
      if (v === undefined) throw new Error("list-scope-stale-tactics: --live requires an id argument");
      // Split on comma or whitespace so a single --live may carry a whole set.
      for (const id of v.split(/[\s,]+/)) {
        if (id !== "") liveIds.add(id);
      }
    } else {
      throw new Error(`list-scope-stale-tactics: unknown argument '${arg}'`);
    }
  }
  if (dir === null || stampDir === null) {
    throw new Error(
      "usage: list-scope-stale-tactics.ts --dir <intentions-dir> --stamp-dir <stamp-dir> [--live <id> ...]",
    );
  }
  return { dir, stampDir, liveIds };
}

function main(argv: string[]): void {
  const { dir, stampDir, liveIds } = parseArgs(argv);
  const nodes = listNodesCached(dir, process.env.DISPATCH_GRAPH_NODE_CACHE || "");
  for (const id of listScopeStaleTactics(nodes, dir, stampDir, liveIds)) {
    process.stdout.write(`${id}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(2);
  }
}
