// apply-conflict-state — the store-mutation primitive for the orthogonal
// merge-conflict interrupt (tactic-graph-router-conflict-routing Unit 2). It
// sets, spends against, reports the cap of, or clears a tactic's
// `execution.conflict` field. Structural sibling of `apply-fix-state.ts`: pure
// of git/gh, reads the node via `readNode`, mutates `execution.conflict`
// through the validated `writeNode`, and prints one JSON object on stdout for
// the shell caller (`graph-select-target`, the conflict-resolution worker) to
// act on and to land via `graph-commit`.
//
// The interrupt is orthogonal to the ladder: no new value is added to `PHASES`.
// A conflicting PR keeps its ladder `phase` (typically `review` with the
// `reviewed` marker, awaiting merge) while `execution.conflict` is set.
//
// The five modes are mutually exclusive:
//
//   --set-conflict     Enter the interrupt. Writes
//                      `execution.conflict = { since: <today UTC>, attempt: 1 }`
//                      when there is no interrupt yet. If one is already in
//                      flight (a defensive double-call) it bumps `attempt` and
//                      preserves `since` rather than clobbering the in-progress
//                      count. Called by the selector on its first observation
//                      of `mergeable == CONFLICTING` on a reviewed
//                      awaiting-merge node.
//
//   --spend-attempt    Spend one attempt against the in-flight interrupt:
//                      writes `execution.conflict.attempt + 1`, preserving
//                      `since`. Called by the selector each tick it re-observes
//                      CONFLICTING on an already-set interrupt. Errors if no
//                      interrupt is set.
//
//   --park-if-capped   Pure read of the retry cap (`CONFLICT_ATTEMPT_CAP`,
//                      `src/transitions.ts`). Makes NO write and does NOT park
//                      — it reports whether `execution.conflict.attempt` has
//                      reached the cap so the shell caller can run `park-node`
//                      itself (this script stays pure of git/gh). Errors if no
//                      interrupt is set.
//
//   --clear-conflict-mechanical
//                      Resolve the interrupt mechanically (the conflict was a
//                      textual rebase/merge resolution with no intention
//                      change). Writes `execution.conflict = null` and
//                      PRESERVES both the ladder `phase` and the `reviewed`
//                      marker: the node returns to the pending-merge state and
//                      `dispatch-auto-merge` lands it once GitHub reports
//                      MERGEABLE. Errors if no interrupt is set.
//
//   --clear-conflict-intention
//                      Resolve the interrupt with a re-review. Writes
//                      `execution.conflict = null`, keeps `phase` at `review`,
//                      and STRIPS the `reviewed` marker so the review pass
//                      actually re-runs — the resolution changed intent, not
//                      just text. Other markers (`qa-done`, `planned`) survive:
//                      only review re-runs. Errors if no interrupt is set.
//                      (The shell caller additionally runs `gh pr ready --undo`
//                      to disarm the live auto-merge; that disarm is a shell
//                      concern, not this script's.)
//
// Usage:
//   node --import tsx/esm apply-conflict-state.ts <node-id> \
//     (--set-conflict | --spend-attempt | --park-if-capped | --clear-conflict-mechanical | --clear-conflict-intention) \
//     [--dir <intentions-dir>]
//
// Stdout: one JSON object, shape per mode —
//   set-conflict:               { "mode": "set",     "id", "attempt": <n>, "since": <date>, "wrote": true }
//   spend-attempt:              { "mode": "spend",   "id", "attempt": <n>, "wrote": true }
//   park-if-capped:             { "mode": "park-if-capped", "id", "capped": bool, "attempt": <n>, "wrote": false }
//   clear-conflict-mechanical:  { "mode": "clear",   "id", "reset": false, "phase": <unchanged>, "wrote": true }
//   clear-conflict-intention:   { "mode": "clear",   "id", "reset": true,  "phase": "review",    "wrote": true }

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode, writeNode } from "../src/store.js";
import type { ConflictState, Execution } from "../src/schema.js";
import { CONFLICT_ATTEMPT_CAP, REVIEWED_MARKER } from "../src/transitions.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

type Mode = "set" | "spend" | "park-if-capped" | "clear-mechanical" | "clear-intention";

interface Args {
  id: string;
  mode: Mode;
  dir: string;
}

/** Today's date in UTC, formatted YYYY-MM-DD — the `ConflictState.since` stamp. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseArgs(argv: string[]): Args {
  let id = "";
  let mode: Mode | null = null;
  let dir = join(repoRoot, "intentions");
  const setMode = (m: Mode): void => {
    if (mode !== null) {
      throw new Error(
        "apply-conflict-state: --set-conflict, --spend-attempt, --park-if-capped, --clear-conflict-mechanical, and --clear-conflict-intention are mutually exclusive",
      );
    }
    mode = m;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--set-conflict":
        setMode("set");
        break;
      case "--spend-attempt":
        setMode("spend");
        break;
      case "--park-if-capped":
        setMode("park-if-capped");
        break;
      case "--clear-conflict-mechanical":
        setMode("clear-mechanical");
        break;
      case "--clear-conflict-intention":
        setMode("clear-intention");
        break;
      case "--dir": {
        const v = argv[++i];
        if (v === undefined || v === "") {
          throw new Error("apply-conflict-state: --dir requires a directory argument");
        }
        dir = v;
        break;
      }
      default:
        if (a.startsWith("--")) throw new Error(`apply-conflict-state: unknown flag '${a}'`);
        if (id !== "") throw new Error(`apply-conflict-state: unexpected extra argument '${a}'`);
        id = a;
    }
  }
  if (id === "") throw new Error("apply-conflict-state: <node-id> is required");
  if (mode === null) {
    throw new Error(
      "apply-conflict-state: one of --set-conflict | --spend-attempt | --park-if-capped | --clear-conflict-mechanical | --clear-conflict-intention is required",
    );
  }
  return { id, mode, dir };
}

/** A fresh execution record for a tactic that has none yet. */
function defaultExecution(id: string): Execution {
  return {
    branch: id,
    pr: null,
    attempts: {},
    markers: [],
    strategy_fingerprint: null,
    fix: null,
    conflict: null,
  };
}

export interface ConflictStateResult {
  mode: "set" | "spend" | "park-if-capped" | "clear";
  id: string;
  wrote: boolean;
  /** set/spend: the attempt counter written. park-if-capped: the current (unwritten) attempt count. */
  attempt?: number;
  /** set: the `since` date written. */
  since?: string;
  /** clear: the resolved ladder phase to emit. */
  phase?: string;
  /** clear: whether the resolution stripped the reviewed marker (re-review). */
  reset?: boolean;
  /** park-if-capped: whether `execution.conflict.attempt` has reached `CONFLICT_ATTEMPT_CAP`. */
  capped?: boolean;
}

/** The node shape `applyConflictState` mutates: a tactic with an `execution` block. */
type TacticNode = ReturnType<typeof readNode>;

/**
 * Null-interrupt guard shared by every mode but `--set-conflict`. Each is
 * meaningless without a set `execution.conflict`; refuse with a mode-specific
 * message rather than proceed. Narrows `currentConflict` to non-null.
 */
function requireConflict(
  currentConflict: ConflictState | null,
  id: string,
  whatFor: string,
): ConflictState {
  if (currentConflict === null) {
    throw new Error(
      `apply-conflict-state: ${whatFor} on ${id} but execution.conflict is null (no interrupt in flight)`,
    );
  }
  return currentConflict;
}

/**
 * `--set-conflict`: enter the interrupt. Fresh when none is set; a defensive
 * double-call bumps `attempt` and preserves `since` so an in-flight count is
 * not clobbered.
 */
function applySet(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  const conflict: ConflictState =
    currentConflict === null
      ? { since: todayUtc(), attempt: 1 }
      : { ...currentConflict, attempt: currentConflict.attempt + 1 };
  node.execution = { ...execution, conflict };
  writeNode(args.dir, node);
  return { mode: "set", id: args.id, wrote: true, attempt: conflict.attempt, since: conflict.since };
}

/**
 * `--spend-attempt`: spend one attempt against the in-flight interrupt,
 * bumping `attempt` and preserving `since`.
 */
function applySpend(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  const conflict = requireConflict(currentConflict, args.id, "--spend-attempt");
  const next: ConflictState = { ...conflict, attempt: conflict.attempt + 1 };
  node.execution = { ...execution, conflict: next };
  writeNode(args.dir, node);
  return { mode: "spend", id: args.id, wrote: true, attempt: next.attempt };
}

/**
 * `--park-if-capped`: pure read of the retry cap. Makes NO write and does not
 * itself park — it reports whether `execution.conflict.attempt` has reached
 * `CONFLICT_ATTEMPT_CAP` so the shell caller can run `park-node`.
 */
function applyParkIfCapped(
  args: Args,
  _node: TacticNode,
  _execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  const conflict = requireConflict(currentConflict, args.id, "--park-if-capped");
  return {
    mode: "park-if-capped",
    id: args.id,
    wrote: false,
    capped: conflict.attempt >= CONFLICT_ATTEMPT_CAP,
    attempt: conflict.attempt,
  };
}

/**
 * `--clear-conflict-mechanical`: resolve the interrupt with no intention
 * change. Clears `execution.conflict`, preserving the ladder `phase` and every
 * marker (including `reviewed`) — the node returns to the pending-merge state
 * for `dispatch-auto-merge` to land once GitHub reports MERGEABLE.
 */
function applyClearMechanical(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  requireConflict(currentConflict, args.id, "--clear-conflict-mechanical");
  node.execution = { ...execution, conflict: null };
  writeNode(args.dir, node);
  return {
    mode: "clear",
    id: args.id,
    wrote: true,
    reset: false,
    phase: node.phase ?? "implement",
  };
}

/**
 * `--clear-conflict-intention`: resolve the interrupt with a re-review. Clears
 * `execution.conflict`, holds `phase` at `review`, and strips the `reviewed`
 * marker so the review pass actually re-runs (the selector's
 * phase:review+reviewed emit-guard would otherwise treat the node as already
 * reviewed). `qa-done`/`planned` survive: only review re-runs, not qa.
 */
function applyClearIntention(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  requireConflict(currentConflict, args.id, "--clear-conflict-intention");
  node.phase = "review";
  const markers = execution.markers.filter((m) => m !== REVIEWED_MARKER);
  node.execution = { ...execution, markers, conflict: null };
  writeNode(args.dir, node);
  return { mode: "clear", id: args.id, wrote: true, reset: true, phase: "review" };
}

const MODE_HANDLERS: Record<
  Mode,
  (
    args: Args,
    node: TacticNode,
    execution: Execution,
    currentConflict: ConflictState | null,
  ) => ConflictStateResult
> = {
  set: applySet,
  spend: applySpend,
  "park-if-capped": applyParkIfCapped,
  "clear-mechanical": applyClearMechanical,
  "clear-intention": applyClearIntention,
};

/**
 * Read the tactic, apply the `execution.conflict` mutation, write it back
 * through the validating `writeNode`, and return the result. Exported so the
 * store round-trip is unit-tested without spawning a process. Pure of git/gh —
 * the caller owns landing the write on main via `graph-commit`.
 */
export function applyConflictState(args: Args): ConflictStateResult {
  const node = readNode(args.dir, args.id);
  if (node.kind !== "tactic") {
    throw new Error(`apply-conflict-state: ${args.id} is kind '${node.kind}', not a tactic`);
  }
  const execution: Execution = node.execution ?? defaultExecution(args.id);
  const currentConflict: ConflictState | null = execution.conflict ?? null;
  return MODE_HANDLERS[args.mode](args, node, execution, currentConflict);
}

function main(argv: string[]): void {
  const result = applyConflictState(parseArgs(argv));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
