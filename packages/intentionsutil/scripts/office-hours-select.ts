// Office-hours queue selector — the offline disposition oracle for the
// `office-hours-graph` entry script and the `/office-hours` skill's readiness
// relay. Reads only the local `intentions/` store (no gh, no daemon, no
// network) and writes a single machine-readable disposition line to stdout,
// with any blocker advisory on stderr.
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   npx tsx packages/intentionsutil/scripts/office-hours-select.ts            # queue head
//   npx tsx packages/intentionsutil/scripts/office-hours-select.ts <node-id>  # single item
//   npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list     # human view
//   npx tsx packages/intentionsutil/scripts/office-hours-select.ts --type <t> # queue head of type <t>
//   npx tsx packages/intentionsutil/scripts/office-hours-select.ts --type <t> --list  # list restricted to type <t>
//
// `--type <t>` takes one of the SessionType values (see
// `../src/schema.ts` SESSION_TYPES): requirement-discovery,
// curriculum-review, other. It is mutually exclusive with a node-id
// positional (an unknown --type value or that combination is a stderr error
// + exit 2, same as the existing --list-vs-positional check).
//
// stdout disposition contract (exactly one line, except --list):
//   launch <node-id> <cwd>     — launch here; cwd is the node's worktree if it
//                                exists, else the repo root
//   empty                      — nothing parked (queue-head mode)
//   empty not-parked <node-id> — the named node is absent or not parked
// stderr is advisory-only: a `NOTE — <node-id> is blocked by open tactic(s): …`
// line when the node has unresolved `blocked_by` edges. Signal, not gate — it
// never suppresses the stdout line.
//
// --list output columns: `<rank>\t<sessionType>\t<nodeId>\t<since>` per line
// (rank is the soft-penalty-adjusted rank, not raw attention).

import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import {
  selectOfficeHours,
  officeHoursQueue,
  type OfficeHoursSelection,
  type OpenBlocker,
} from "../src/officeHours.js";
import { SESSION_TYPES, type SessionType } from "../src/schema.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/office-hours-select.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

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

// --- Argv parsing (pure, exported for tests) --------------------------------

export type SelectorArgs =
  | { kind: "ok"; wantList: boolean; sessionType?: SessionType; target?: string }
  | { kind: "error"; message: string };

/**
 * Parse CLI argv (already stripped of `node`/script path, i.e.
 * `process.argv.slice(2)`) into a structured result. Pure and side-effect-free
 * — no I/O, no `process.exit` — so `main()` remains the only place that
 * writes to stderr or exits.
 */
export function parseSelectorArgs(args: string[]): SelectorArgs {
  const wantList = args.includes("--list");

  const typeIdx = args.indexOf("--type");
  const typeValue = typeIdx !== -1 ? args[typeIdx + 1] : undefined;
  // Only exclude the token right after --type when --type was actually found;
  // otherwise typeIdx is -1 and typeIdx + 1 === 0 would wrongly drop argv[0].
  const typeValueIdx = typeIdx === -1 ? -1 : typeIdx + 1;

  const positionals = args.filter((a, i) => !a.startsWith("--") && i !== typeValueIdx);

  if (wantList && positionals.length > 0) {
    return { kind: "error", message: "office-hours-select: --list is mutually exclusive with a node-id" };
  }

  if (typeIdx !== -1 && positionals.length > 0) {
    return { kind: "error", message: "office-hours-select: --type is mutually exclusive with a node-id" };
  }

  let sessionType: SessionType | undefined;
  if (typeIdx !== -1) {
    const found = SESSION_TYPES.find((t) => t === typeValue);
    if (found === undefined) {
      return {
        kind: "error",
        message: `office-hours-select: unknown --type "${typeValue}" (expected: ${SESSION_TYPES.join(", ")})`,
      };
    }
    sessionType = found;
  }

  return { kind: "ok", wantList, sessionType, target: positionals[0] };
}

// --- Main ------------------------------------------------------------------

function main(): void {
  const parsed = parseSelectorArgs(process.argv.slice(2));
  if (parsed.kind === "error") {
    process.stderr.write(`${parsed.message}\n`);
    process.exit(2);
  }

  const { wantList, sessionType, target } = parsed;

  if (target !== undefined && !isPathSafeId(target)) {
    process.stderr.write(`office-hours-select: unsafe node id: "${target}"\n`);
    process.exit(2);
  }

  const nodes = listNodes(intentionsDir);

  if (wantList) {
    for (const m of officeHoursQueue(nodes, sessionType)) {
      process.stdout.write(`${m.rank}\t${m.sessionType}\t${m.nodeId}\t${m.since}\n`);
    }
    return;
  }

  const disposition = selectOfficeHours(nodes, target, sessionType);
  const { stdout, stderr } = formatDisposition(disposition, (id) =>
    resolveSessionCwd(repoRoot, id),
  );
  if (stderr) process.stderr.write(`${stderr}\n`);
  process.stdout.write(`${stdout}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
