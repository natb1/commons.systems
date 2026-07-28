// Office-hours queue selector — the offline disposition oracle for the
// `office-hours-graph` entry script and the `/office-hours` skill's readiness
// relay. Reads the `intentions/` store AT A GIT REF (default `origin/main`),
// not the local working tree, and writes a single machine-readable disposition
// line to stdout, with any blocker advisory on stderr.
//
// Why the ref: a selector that reads its own checkout answers from whatever
// that worktree last synced, so a stale worktree silently reports stale park
// state. Reading at `origin/main` makes the answer independent of the checkout
// the script happens to run in.
//
// No gh, no daemon, no network of its own: this reads an ALREADY-FETCHED ref
// via `git archive`. It never fetches. A caller that needs absolute freshness
// runs `git fetch origin main` first — as `office-hours-graph` already does.
//
// Consequence, by design (not a bug): a node parked in the local working tree
// but cleared on `origin/main` is reported `empty not-parked <node-id>`, and
// vice versa. The ref is the authority.
//
// The launch cwd is still resolved against the LOCAL checkout
// (`resolveSessionCwd` stats `<repoRoot>/.claude/worktrees/<node-id>`) — only
// the node *store* moved to the ref, not worktree-path resolution.
//
// Run from anywhere (the repo root is resolved relative to this file, not cwd):
//   npx tsx packages/intentionsutil/scripts/office-hours-select.ts            # queue head
//   npx tsx packages/intentionsutil/scripts/office-hours-select.ts <node-id>  # single item
//   npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list     # human view
//
// Flags:
//   --ref <git-ref>  read the store at this ref instead of `origin/main`.
//                    An adopter with no `origin` remote can pass `--ref HEAD`.
//
// stdout disposition contract (exactly one line, except --list):
//   launch <node-id> <cwd>     — launch here; cwd is the node's worktree if it
//                                exists, else the repo root. `office-hours-graph`
//                                consumes this value only for a NON-tactic node
//                                (a strategy/delegation/virtue/tradition park
//                                gets no worktree — engagement there is a graph
//                                edit); for a tactic node it provisions or reuses
//                                `.claude/worktrees/<node-id>` itself and
//                                overrides this value with that path. No other
//                                caller reads it: `--list` emits its own
//                                `rank\tnodeId\tsince` rows and never this line,
//                                and the `/office-hours` skill's single-item
//                                readiness relay reads only the stderr `NOTE —`
//                                advisory.
//   empty                      — nothing parked (queue-head mode)
//   empty not-parked <node-id> — the named node is absent or not parked
// stderr is advisory-only: a `NOTE — <node-id> is blocked by open tactic(s): …`
// line when the node has unresolved `blocked_by` edges. Signal, not gate — it
// never suppresses the stdout line.

import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodesAtRef } from "./lib-store-at-ref.js";
import type { IntentionNode } from "../src/schema.js";
import {
  selectOfficeHours,
  officeHoursQueue,
  type OfficeHoursSelection,
  type OpenBlocker,
} from "../src/officeHours.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/office-hours-select.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

/** The ref the store is read at when `--ref` is not passed. */
const DEFAULT_REF = "origin/main";

// --- Helpers (exported for tests) ------------------------------------------

/** The store's path-safe-id posture (mirrors store.ts `assertPathSafeId`). */
function isPathSafeId(id: string): boolean {
  return !(id.includes("/") || id.includes("\\") || id.includes(".."));
}

/**
 * The cwd a session for `nodeId` should launch in: its worktree directory
 * `<repoRoot>/.claude/worktrees/<nodeId>` when that exists and is a directory,
 * else `<repoRoot>`. Rejects a path-unsafe id before touching the fs.
 */
export function resolveSessionCwd(repoRoot: string, nodeId: string): string {
  if (!isPathSafeId(nodeId)) {
    throw new Error(`office-hours-select: unsafe node id: "${nodeId}"`);
  }
  const worktree = join(repoRoot, ".claude", "worktrees", nodeId);
  if (existsSync(worktree) && statSync(worktree).isDirectory()) {
    return worktree;
  }
  return repoRoot;
}

function formatBlockerNote(nodeId: string, blockers: OpenBlocker[]): string {
  const ids = blockers.map((b) => (b.missing ? `${b.id} (missing)` : b.id)).join(", ");
  return `NOTE — ${nodeId} is blocked by open tactic(s): ${ids}`;
}

/**
 * The stdout/stderr the selector emits for one disposition. `cwdResolver`
 * decouples the launch-cwd fs check from formatting so the full line contract
 * is unit-testable without a real worktree tree.
 */
export function formatDisposition(
  disposition: OfficeHoursSelection,
  cwdResolver: (nodeId: string) => string,
): { stdout: string; stderr: string } {
  switch (disposition.kind) {
    case "launch": {
      const cwd = cwdResolver(disposition.nodeId);
      const stderr =
        disposition.blockers.length > 0
          ? formatBlockerNote(disposition.nodeId, disposition.blockers)
          : "";
      return { stdout: `launch ${disposition.nodeId} ${cwd}`, stderr };
    }
    case "empty":
      return { stdout: "empty", stderr: "" };
    case "not-parked":
      return { stdout: `empty not-parked ${disposition.nodeId}`, stderr: "" };
  }
}

// --- Main ------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);

  // Explicit index loop, not a `filter(a => !a.startsWith("--"))`: `--ref`
  // consumes the argv slot after it, and a filter would mistake that value
  // (`origin/main`) for a positional node id.
  let wantList = false;
  let ref = DEFAULT_REF;
  const positionals: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--list") {
      wantList = true;
    } else if (arg === "--ref") {
      const value = args[i + 1];
      if (value === undefined || value === "") {
        process.stderr.write("office-hours-select: --ref requires a git-ref argument\n");
        process.exit(2);
      }
      ref = value;
      i++;
    } else if (arg.startsWith("--")) {
      process.stderr.write(`office-hours-select: unknown flag: "${arg}"\n`);
      process.exit(2);
    } else {
      positionals.push(arg);
    }
  }

  if (wantList && positionals.length > 0) {
    process.stderr.write("office-hours-select: --list is mutually exclusive with a node-id\n");
    process.exit(2);
  }
  if (positionals.length > 1) {
    process.stderr.write("office-hours-select: at most one node-id may be given\n");
    process.exit(2);
  }

  // Only the ref read is caught: a failed ref read is an environment problem
  // this script reports as its own exit-2 failure. A schema-invalid node
  // (`IntentionSchemaError`) is a repo-integrity failure and propagates uncaught.
  let nodes: IntentionNode[];
  try {
    nodes = listNodesAtRef(repoRoot, ref);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("listNodesAtRef:")) {
      process.stderr.write(`office-hours-select: ${err.message}\n`);
      process.exit(2);
    }
    throw err;
  }

  if (wantList) {
    for (const m of officeHoursQueue(nodes)) {
      process.stdout.write(`${m.rank}\t${m.nodeId}\t${m.since}\n`);
    }
    return;
  }

  const target = positionals[0];
  if (target !== undefined && !isPathSafeId(target)) {
    process.stderr.write(`office-hours-select: unsafe node id: "${target}"\n`);
    process.exit(2);
  }

  const disposition = selectOfficeHours(nodes, target);
  const { stdout, stderr } = formatDisposition(disposition, (id) =>
    resolveSessionCwd(repoRoot, id),
  );
  if (stderr) process.stderr.write(`${stderr}\n`);
  process.stdout.write(`${stdout}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
