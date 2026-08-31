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
//   node --import tsx/esm packages/intentionsutil/scripts/office-hours-select.ts            # queue head
//   node --import tsx/esm packages/intentionsutil/scripts/office-hours-select.ts <node-id>  # single item
//   node --import tsx/esm packages/intentionsutil/scripts/office-hours-select.ts --list     # human view
//   node --import tsx/esm packages/intentionsutil/scripts/office-hours-select.ts --type <t> # queue head of type <t>
//   node --import tsx/esm packages/intentionsutil/scripts/office-hours-select.ts --type <t> --list  # list restricted to type <t>
//
// `--type <t>` (or `--type=<t>`) takes one of the SessionType values (see
// `../src/schema.ts` SESSION_TYPES): requirement-discovery,
// curriculum-review, other. It is mutually exclusive with a node-id
// positional (an unknown --type value or that combination is a stderr error
// + exit 2, same as the existing --list-vs-positional check). An unrecognized
// `--`-prefixed token is likewise a stderr error + exit 2 — never silently
// ignored, which would emit an unfiltered queue head as if the flag had applied.
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
//                                caller reads it: `--list` emits its own rows
//                                (columns pinned below) and never this line,
//                                and the `/office-hours` skill's single-item
//                                readiness relay reads only the stderr `NOTE —`
//                                advisory.
//   empty                      — nothing parked (queue-head mode)
//   empty not-parked <node-id> — the named node is absent or not parked
// stderr is advisory-only: a `NOTE — <node-id> is blocked by open tactic(s): …`
// line when the node has unresolved `blocked_by` edges. Signal, not gate — it
// never suppresses the stdout line.
//
// --list output columns (the single canonical statement of this contract; the
// `office-hours-graph` read loop and `dispatch-terminal-gap-audit` both cite
// this block): `<score>\t<sessionType>\t<nodeId>\t<since>` per line, rendered by
// the exported `formatQueueRow` below and pinned by its unit test. `score` is
// the soft-penalty-adjusted score of the resolved rank key, not raw attention.
// These four columns are UNCHANGED by band advisories: when a member's band came
// from a parent (`bandSource !== null`), the "why" goes to stderr as a `NOTE —`
// line (`formatBandNote`), never as a fifth stdout column — see the stderr
// contract above.
//
// LOAD-BEARING for a second consumer, outside this package:
// `.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit` runs
// `npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list --ref
// <ref>` and parses each row POSITIONALLY with
// `IFS=$'\t' read -r _rank _stype nid _since`. A column reorder shifts `$nid`
// onto the wrong field: the audit's parked-node enumeration then misparses
// SILENTLY — every id lookup misses and the audit reports a false-empty parked
// population instead of failing. Renaming `--list` or `--ref` is louder but
// still fatal: the selector exits 2 on an unknown flag and the audit exits 4.
// `.claude/skills/dispatch-propagate/scripts/test-dispatch-terminal-gap-audit.sh`
// ratchets both halves — it reads THIS file and asserts `formatQueueRow` still
// returns the four columns in this order, and that `--list` and `--ref` are
// still registered flags.

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
  type QueueMember,
} from "../src/officeHours.js";
import { SESSION_TYPES, type SessionType } from "../src/schema.js";

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

/**
 * One `--list` row (no trailing newline). This function IS the `--list` column
 * contract the `office-hours-graph` read loop parses with
 * `IFS=$'\t' read -r score sessiontype nid date` — a reorder on either side
 * shifts `$nid` onto the wrong field, every park lookup fails, and the queue
 * reports a false `empty`. Extracted and exported so the column order is
 * pinned by a unit test rather than by comment alone.
 *
 * Exactly FOUR columns, in this order. The first column now carries the
 * penalized `score` of the resolved rank key (it used to carry the lifted
 * `rank`); the column COUNT and the position of every other column are
 * unchanged, so every positional reader keeps working.
 *
 * A SECOND positional parser lives outside this package:
 * `.claude/skills/dispatch-propagate/scripts/dispatch-terminal-gap-audit` reads
 * these rows with `IFS=$'\t' read -r _rank _stype nid _since` to enumerate the
 * parked population, and misparses silently on a reorder — see the
 * LOAD-BEARING note in this file's header block.
 * `.claude/skills/dispatch-propagate/scripts/test-dispatch-terminal-gap-audit.sh`
 * ratchets the template literal below: it extracts the returned string from
 * this source file and fails if the four columns move.
 */
export function formatQueueRow(m: QueueMember): string {
  return `${m.score}\t${m.sessionType}\t${m.nodeId}\t${m.since}`;
}

/**
 * The stderr advisory for a queue member that ranks in a band it got from a
 * parent (`bandSource !== null`) — surfaces WHY the park sorts where it does,
 * with its own score alongside for contrast. Follows the `formatBlockerNote`
 * `NOTE —` convention. Never called for a member with `bandSource === null`
 * (band 0: there is no source to name).
 *
 * `band` and `score` on a `QueueMember` carry the session-type penalty;
 * `ownScore` does NOT. Printing the two side by side unqualified would invite
 * the reader to conclude that a park whose band reads below its own score is
 * banded by a WEAKER parent, when the gap is only the penalty. So whenever the
 * penalty actually bites (`score !== ownScore`) the note says so and prints the
 * penalized score — the number that really sorts — next to it.
 */
export function formatBandNote(m: QueueMember): string {
  const penaltyNote = m.score !== m.ownScore ? `, un-penalized; penalized ${m.score}` : "";
  return (
    `NOTE — ${m.nodeId} ranks at tier ${m.tier} band ${m.band} via ${m.bandSource} ` +
    `(own score ${m.ownScore}${penaltyNote})`
  );
}

// --- Argv parsing (pure, exported for tests) --------------------------------

export type SelectorArgs =
  | { kind: "ok"; wantList: boolean; sessionType?: SessionType; target?: string; ref: string }
  | { kind: "error"; message: string };

/** Every `--`-prefixed token this CLI recognizes. */
const BOOLEAN_FLAGS: readonly string[] = ["--list"];
const VALUE_FLAGS: readonly string[] = ["--type", "--ref"];
const KNOWN_FLAGS: readonly string[] = [...BOOLEAN_FLAGS, ...VALUE_FLAGS];

/** A parse step that either produced a value of type `T` or failed with a message. */
type ParseStep<T> = { kind: "ok"; value: T } | { kind: "error"; message: string };

/**
 * Normalize `--flag=value` to the `--flag value` spelling so one lookup path
 * serves both, and reject any `--`-prefixed token that is not a known flag.
 * Without this, `--type=curriculum-review` (and any misspelling) is filtered
 * out as a non-positional, `sessionType` stays undefined, and the selector
 * silently emits the UNFILTERED queue head with exit 0 — the
 * fallback-over-clear-error anti-pattern `.claude/rules/code-style.md` forbids.
 */
function normalizeArgv(args: string[]): ParseStep<string[]> {
  const norm: string[] = [];
  for (const a of args) {
    if (!a.startsWith("--")) {
      norm.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    const name = eq === -1 ? a : a.slice(0, eq);
    if (!KNOWN_FLAGS.includes(name)) {
      return {
        kind: "error",
        message: `office-hours-select: unknown flag "${name}" (expected: ${KNOWN_FLAGS.join(", ")})`,
      };
    }
    if (eq !== -1 && BOOLEAN_FLAGS.includes(name)) {
      return { kind: "error", message: `office-hours-select: ${name} takes no value` };
    }
    norm.push(name);
    // An `--flag=` with an empty right-hand side pushes "", which the
    // missing-value check below reports as such.
    if (eq !== -1) norm.push(a.slice(eq + 1));
  }
  return { kind: "ok", value: norm };
}

/**
 * A value flag's position in the normalized argv and the token occupying the
 * slot it consumes. `idx === -1` means the flag was not passed at all, which is
 * distinct from a flag passed with a missing value (see `hasFlagValue`).
 */
function findValueFlag(norm: string[], name: string): { idx: number; value: string | undefined } {
  const idx = norm.indexOf(name);
  return { idx, value: idx === -1 ? undefined : norm[idx + 1] };
}

/**
 * Whether a value flag's consumed slot holds a usable value. A flag with
 * nothing after it, an empty `--flag=`, or the next flag after it is a MISSING
 * value — not a value literally named "undefined" or "--list". Callers report
 * that as its own error rather than interpolating the junk into an
 * unknown-value message as if the user had typed it.
 */
function hasFlagValue(value: string | undefined): value is string {
  return value !== undefined && value !== "" && !value.startsWith("--");
}

/**
 * The node-id positionals left once each value flag's consumed slot is
 * excluded, or the mutual-exclusion error they raise. A value flag consumes the
 * argv slot after it, so a bare `filter(a => !a.startsWith("--"))` would mistake
 * that value (`origin/main`, `curriculum-review`) for a positional node id. Only
 * exclude the slot when the flag was actually found; otherwise the index is -1
 * and -1 + 1 === 0 would wrongly drop argv[0].
 */
function collectPositionals(
  norm: string[],
  wantList: boolean,
  flagIdxs: number[],
): ParseStep<string[]> {
  const valueIdxs = new Set(flagIdxs.filter((i) => i !== -1).map((i) => i + 1));
  const positionals = norm.filter((a, i) => !a.startsWith("--") && !valueIdxs.has(i));

  if (wantList && positionals.length > 0) {
    return { kind: "error", message: "office-hours-select: --list is mutually exclusive with a node-id" };
  }
  if (positionals.length > 1) {
    return { kind: "error", message: "office-hours-select: at most one node-id may be given" };
  }
  return { kind: "ok", value: positionals };
}

/** Validate the value passed to `--type` against `SESSION_TYPES`. */
function resolveSessionType(value: string | undefined): ParseStep<SessionType> {
  if (!hasFlagValue(value)) {
    return {
      kind: "error",
      message: `office-hours-select: missing value for --type (expected: ${SESSION_TYPES.join(", ")})`,
    };
  }
  const found = SESSION_TYPES.find((t) => t === value);
  if (found === undefined) {
    return {
      kind: "error",
      message: `office-hours-select: unknown --type "${value}" (expected: ${SESSION_TYPES.join(", ")})`,
    };
  }
  return { kind: "ok", value: found };
}

/**
 * Parse CLI argv (already stripped of `node`/script path, i.e.
 * `process.argv.slice(2)`) into a structured result. Pure and side-effect-free
 * — no I/O, no `process.exit` — so `main()` remains the only place that
 * writes to stderr or exits.
 */
export function parseSelectorArgs(args: string[]): SelectorArgs {
  const normalized = normalizeArgv(args);
  if (normalized.kind === "error") return normalized;
  const norm = normalized.value;

  const wantList = norm.includes("--list");
  const typeFlag = findValueFlag(norm, "--type");
  const refFlag = findValueFlag(norm, "--ref");

  const collected = collectPositionals(norm, wantList, [typeFlag.idx, refFlag.idx]);
  if (collected.kind === "error") return collected;
  const positionals = collected.value;

  if (typeFlag.idx !== -1 && positionals.length > 0) {
    return { kind: "error", message: "office-hours-select: --type is mutually exclusive with a node-id" };
  }

  let sessionType: SessionType | undefined;
  if (typeFlag.idx !== -1) {
    const resolved = resolveSessionType(typeFlag.value);
    if (resolved.kind === "error") return resolved;
    sessionType = resolved.value;
  }

  let ref = DEFAULT_REF;
  if (refFlag.idx !== -1) {
    if (!hasFlagValue(refFlag.value)) {
      return { kind: "error", message: "office-hours-select: --ref requires a git-ref argument" };
    }
    ref = refFlag.value;
  }

  return { kind: "ok", wantList, sessionType, target: positionals[0], ref };
}

// --- Main ------------------------------------------------------------------

function main(): void {
  const parsed = parseSelectorArgs(process.argv.slice(2));
  if (parsed.kind === "error") {
    process.stderr.write(`${parsed.message}\n`);
    process.exit(2);
  }

  const { wantList, sessionType, target, ref } = parsed;

  if (target !== undefined && !isPathSafeId(target)) {
    process.stderr.write(`office-hours-select: unsafe node id: "${target}"\n`);
    process.exit(2);
  }

  // Read at the REF, with STRICT enumeration: `listNodesAtRef` enumerates the
  // extracted store with `listNodesStrict`, never the tolerant `listNodes`.
  // Selection gates on open blockers, and a blocker ABSENT from the enumerated
  // set reads as "not blocking" — a tolerant reader would turn a corrupt
  // blocker file into a dispatchable park. A corrupt file must refuse loudly.
  //
  // Only the ref read is caught: a failed ref read is an environment problem
  // this script reports as its own exit-2 failure. An unreadable or
  // schema-invalid node (`IntentionSchemaError`) is a repo-integrity failure
  // and propagates uncaught.
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
    for (const m of officeHoursQueue(nodes, sessionType)) {
      process.stdout.write(`${formatQueueRow(m)}\n`);
      if (m.bandSource !== null) {
        process.stderr.write(`${formatBandNote(m)}\n`);
      }
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
