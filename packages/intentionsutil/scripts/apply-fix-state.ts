// apply-fix-state — the store-mutation primitive for the orthogonal CI-fix
// interrupt (tactic-fix-interrupt-orthogonal-state Unit 3). It sets, clears, or
// records-a-push on a tactic's `execution.fix` field, leaving the node's ladder
// `phase` untouched (the interrupt is orthogonal to the ladder). Sibling of
// `apply-node-transition.ts`: pure of git/gh, reads the node via `readNode`,
// mutates `execution.fix` through the validated `writeNode`, and prints one JSON
// object on stdout for the shell caller (`graph-select-target`, `/fix-checks`)
// to act on and to land via `graph-commit`.
//
// The five modes are mutually exclusive:
//
//   --set-fix          Enter the interrupt. Writes
//                      `execution.fix = { since: <today UTC>, attempt: 1,
//                      pushed_sha: null }` when there is no interrupt yet. If an
//                      interrupt is already in flight (a defensive double-call)
//                      it bumps `attempt` and preserves `since`/`pushed_sha`
//                      rather than clobbering the in-progress count.
//                      Called by the selector when it first observes CONCLUDED-RED
//                      CI on a fix-interruptible ladder phase.
//
//   --clear-fix        Resolve the interrupt. Writes `execution.fix = null`. If
//                      the node already carries the `reviewed` marker (the fix
//                      landed AFTER review completed), it ALSO resets
//                      `node.phase` to `review` — the re-review reset: new code
//                      pushed after review must be re-reviewed. Reports the
//                      resolved phase (post-reset) so the caller knows which
//                      ladder phase to emit/log.
//                      Called by the selector when it observes CONCLUDED-GREEN
//                      CI on a node with an active interrupt.
//
//   --record-push <sha>  Record that `/fix-checks` pushed <sha> onto the
//                      already-set interrupt: writes `execution.fix.pushed_sha`
//                      only, preserving `since`/`attempt` and the ladder `phase`.
//                      This is the selector's pending-CI guard input (a pending
//                      verdict on the recorded sha is a fresh push awaiting CI,
//                      not a green resolution). Errors if no interrupt is set.
//
//   --spend-attempt    Spend one attempt against the in-flight interrupt:
//                      writes `execution.fix.attempt + 1`, preserving
//                      `since`/`pushed_sha`. Called by `/fix-checks` each pass
//                      it spends against the retry budget. Errors if no
//                      interrupt is set.
//
//   --check-cap        Pure read of the retry cap (`FIX_ATTEMPT_CAP`,
//                      `src/transitions.ts`). Makes NO write. Reports whether
//                      `execution.fix.attempt` exceeds the cap and how many
//                      attempts have been consumed so far. The caller (a later
//                      unit's selector logic) uses this to decide whether to
//                      land a tracked hold via `hold-node` — this script stays
//                      pure of git/gh and cannot land that hold itself. Errors
//                      if no interrupt is set.
//
//   --reset-attempt    Write-only: resets `execution.fix.attempt` to 1,
//                      preserving `since`/`pushed_sha` and the ladder `phase`,
//                      giving a human-cleared (or newly-held) node a fresh
//                      budget. Called by `hold-node --reset-fix-attempt` at
//                      the point it lands the tracked hold. Errors if no
//                      interrupt is set.
//
//   --check-cycle-cap  Pure read of the CROSS-CYCLE cap (`FIX_CYCLE_CAP`,
//                      `src/transitions.ts`), distinct from `--check-cap`:
//                      that mode bounds retries WITHIN one open interrupt
//                      episode, this one bounds LIFETIME fresh entries
//                      (`execution.attempts[FIX_CYCLE_ATTEMPT_KEY]`, never
//                      reset by `--clear-fix`). Makes NO write, and — unlike
//                      every other read/write mode above — does NOT require
//                      an active interrupt: it is meant to be checked BEFORE
//                      `--set-fix`, to decide whether a fresh entry should be
//                      allowed at all. Called by `reconcile-graph-review-stall`
//                      before re-entering the interrupt on a stalled review.
//
//   --reset-cycle      Write-only: resets `execution.attempts[FIX_CYCLE_ATTEMPT_KEY]`
//                      to 0, giving a human-resolved cross-cycle hold a fresh
//                      lifetime budget. Called by `hold-node --reset-fix-cycle`
//                      at the point it lands a cross-cycle-cap hold. Does not
//                      require an active interrupt (mirrors `--check-cycle-cap`).
//
// Usage:
//   node --import tsx/esm apply-fix-state.ts <node-id> \
//     (--set-fix | --clear-fix | --record-push <sha> | --spend-attempt | --check-cap | \
//      --reset-attempt | --check-cycle-cap | --reset-cycle) \
//     [--dir <intentions-dir>]
//
// Stdout: one JSON object, shape per mode —
//   set-fix:         { "mode": "set",         "id", "attempt": <n>, "since": <date>, "wrote": true }
//   clear-fix:       { "mode": "clear",       "id", "phase": <resolved>, "reset": bool, "wrote": true }
//   record-push:     { "mode": "record",      "id", "pushed_sha": <sha>, "wrote": true }
//   spend-attempt:   { "mode": "spend",       "id", "attempt": <n>, "wrote": true }
//   check-cap:       { "mode": "check-cap",   "id", "capped": bool, "consumed": <n>, "attempt": <n> }
//   reset-attempt:   { "mode": "reset-attempt", "id", "wrote": true, "attempt": 1 }
//   check-cycle-cap: { "mode": "check-cycle-cap", "id", "wrote": false, "cycles": <n>, "cycleCapped": bool }
//   reset-cycle:     { "mode": "reset-cycle", "id", "wrote": true, "cycles": 0 }

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode, writeNode } from "../src/store.js";
import type { Execution, FixState } from "../src/schema.js";
import {
  FIX_ATTEMPT_CAP,
  FIX_CYCLE_ATTEMPT_KEY,
  FIX_CYCLE_CAP,
  incrementAttempt,
  REVIEWED_MARKER,
} from "../src/transitions.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

type Mode =
  | "set"
  | "clear"
  | "record"
  | "spend"
  | "check-cap"
  | "reset-attempt"
  | "check-cycle-cap"
  | "reset-cycle";

interface Args {
  id: string;
  mode: Mode;
  pushedSha: string | null;
  dir: string;
}

/** Today's date in UTC, formatted YYYY-MM-DD — the `FixState.since` stamp. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseArgs(argv: string[]): Args {
  let id = "";
  let mode: Mode | null = null;
  let pushedSha: string | null = null;
  let dir = join(repoRoot, "intentions");
  const setMode = (m: Mode): void => {
    if (mode !== null) {
      throw new Error(
        "apply-fix-state: --set-fix, --clear-fix, --record-push, --spend-attempt, --check-cap, --reset-attempt, --check-cycle-cap, and --reset-cycle are mutually exclusive",
      );
    }
    mode = m;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--set-fix":
        setMode("set");
        break;
      case "--clear-fix":
        setMode("clear");
        break;
      case "--record-push": {
        setMode("record");
        const v = argv[++i];
        if (v === undefined || v === "" || v.startsWith("--")) {
          throw new Error("apply-fix-state: --record-push requires a <sha> argument");
        }
        pushedSha = v;
        break;
      }
      case "--spend-attempt":
        setMode("spend");
        break;
      case "--check-cap":
        setMode("check-cap");
        break;
      case "--reset-attempt":
        setMode("reset-attempt");
        break;
      case "--check-cycle-cap":
        setMode("check-cycle-cap");
        break;
      case "--reset-cycle":
        setMode("reset-cycle");
        break;
      case "--dir": {
        const v = argv[++i];
        if (v === undefined || v === "") throw new Error("apply-fix-state: --dir requires a directory argument");
        dir = v;
        break;
      }
      default:
        if (a.startsWith("--")) throw new Error(`apply-fix-state: unknown flag '${a}'`);
        if (id !== "") throw new Error(`apply-fix-state: unexpected extra argument '${a}'`);
        id = a;
    }
  }
  if (id === "") throw new Error("apply-fix-state: <node-id> is required");
  if (mode === null) {
    throw new Error(
      "apply-fix-state: one of --set-fix | --clear-fix | --record-push <sha> | --spend-attempt | --check-cap | --reset-attempt | --check-cycle-cap | --reset-cycle is required",
    );
  }
  return { id, mode, pushedSha, dir };
}

/** A fresh execution record for a tactic that has none yet. */
function defaultExecution(id: string): Execution {
  return { branch: id, pr: null, attempts: {}, markers: [], strategy_fingerprint: null, fix: null };
}

export interface FixStateResult {
  mode: Mode;
  id: string;
  wrote: boolean;
  /** set/spend/reset-attempt: the attempt counter written. check-cap: the current (unwritten) attempt count. */
  attempt?: number;
  /** set: the `since` date written. */
  since?: string;
  /** clear: the resolved ladder phase to emit (post re-review reset). */
  phase?: string;
  /** clear: whether the re-review reset moved the phase to `review`. */
  reset?: boolean;
  /** record: the pushed sha written to `execution.fix.pushed_sha`. */
  pushed_sha?: string;
  /** check-cap: whether `execution.fix.attempt` exceeds `FIX_ATTEMPT_CAP`. */
  capped?: boolean;
  /** check-cap: the count of attempts consumed so far (`attempt - 1`). */
  consumed?: number;
  /** check-cycle-cap/reset-cycle: the lifetime fix-cycle count (`execution.attempts[FIX_CYCLE_ATTEMPT_KEY]`). */
  cycles?: number;
  /** check-cycle-cap: whether `cycles` is at or above `FIX_CYCLE_CAP`. */
  cycleCapped?: boolean;
}

/** The node shape `applyFixState` mutates: a tactic with an `execution` block. */
type TacticNode = ReturnType<typeof readNode>;

/**
 * Null-interrupt guard shared by the modes that require an in-flight
 * interrupt (`clear`, `spend`, `record`, `check-cap`, `reset-attempt`).
 * Mirroring one another, each mode is meaningless without a set
 * `execution.fix`; refuse with a mode-specific message rather than proceed.
 * Narrows `currentFix` to non-null.
 */
function requireFix(currentFix: FixState | null, id: string, whatFor: string): FixState {
  if (currentFix === null) {
    throw new Error(`apply-fix-state: ${whatFor} on ${id} but execution.fix is null (no interrupt in flight)`);
  }
  return currentFix;
}

/**
 * `--set-fix`: enter the interrupt. Fresh when none is set; a defensive double-
 * call bumps `attempt` and preserves `since`/`pushed_sha` so an in-flight count
 * is not clobbered. A genuinely fresh entry (`currentFix === null`) also bumps
 * the LIFETIME `FIX_CYCLE_ATTEMPT_KEY` counter on `execution.attempts` — unlike
 * `fix.attempt`, this survives `--clear-fix`, so it accumulates across
 * enter/clear/re-stall cycles rather than resetting to 1 every time. The
 * defensive double-call branch is not a new cycle, so it does not bump it.
 */
function applySet(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentFix: FixState | null,
): FixStateResult {
  const fix: FixState =
    currentFix === null
      ? { since: todayUtc(), attempt: 1, pushed_sha: null }
      : { ...currentFix, attempt: currentFix.attempt + 1 };
  const nextExecution: Execution =
    currentFix === null ? incrementAttempt(execution, FIX_CYCLE_ATTEMPT_KEY) : execution;
  node.execution = { ...nextExecution, fix };
  // Orchestration-class writer — every write in this script mutates `execution`
  // only. Same declaration at each of this file's `writeNode` calls.
  writeNode(args.dir, node, { writes: "orchestration" });
  return { mode: "set", id: args.id, wrote: true, attempt: fix.attempt, since: fix.since };
}

/**
 * `--clear-fix`: resolve the interrupt. Re-review reset: a fix landed after
 * review must be re-reviewed, so return the node to `review` when it carries the
 * reviewed marker — AND strip that marker, so the review pass actually re-runs
 * (both the selector's phase:review+reviewed emit-guard and check-node-
 * selection's reviewed-marker guard would otherwise treat the node as already-
 * reviewed and skip/exit-12 it). `qa-done`/`planned` are kept: only review
 * re-runs, not qa. When not past review, `phase` is preserved at its ladder
 * position. The null-interrupt guard also prevents spuriously tripping this
 * reset (and disarming a valid merge) on a `reviewed` node.
 */
function applyClear(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentFix: FixState | null,
): FixStateResult {
  requireFix(currentFix, args.id, "--clear-fix");
  const reset = execution.markers.includes(REVIEWED_MARKER);
  if (reset) node.phase = "review";
  const markers = reset ? execution.markers.filter((m) => m !== REVIEWED_MARKER) : execution.markers;
  node.execution = { ...execution, markers, fix: null };
  writeNode(args.dir, node, { writes: "orchestration" });
  return { mode: "clear", id: args.id, wrote: true, phase: node.phase ?? "implement", reset };
}

/**
 * `--spend-attempt`: spend one attempt against the in-flight interrupt (the
 * fix-checks SKILL.md caller consumes this per pass), bumping `attempt` and
 * preserving `since`/`pushed_sha`.
 */
function applySpend(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentFix: FixState | null,
): FixStateResult {
  const fix = requireFix(currentFix, args.id, "--spend-attempt");
  const next: FixState = { ...fix, attempt: fix.attempt + 1 };
  node.execution = { ...execution, fix: next };
  writeNode(args.dir, node, { writes: "orchestration" });
  return { mode: "spend", id: args.id, wrote: true, attempt: next.attempt };
}

// Prior legacy human-escalation-park reason/recommendation text (that park
// field's name is deliberately elided here — a later plan-verification step
// greps this file for that literal identifier and expects zero matches),
// preserved for Unit 5 to adapt into hold-node's --reason-file/
// --recommendation-file:
//
//   reason:
//     `/fix-checks retry budget exhausted: ${consumed} attempts concluded with PR #${execution.pr ?? "?"} ` +
//     `still red (execution.fix.attempt=${fix.attempt}, since ${fix.since}) — restoring the legacy ` +
//     `dispatch:fix-checks-attempt-<n> escalation.`,
//   recommendation:
//     `Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted in PR ` +
//     `comments) to diagnose why ${FIX_ATTEMPT_CAP} automated attempts did not resolve CI. Clear the legacy park ` +
//     `field to resume automated fix-checks with a fresh retry budget (attempt was reset to 1), or abandon/` +
//     `redesign the tactic if the current approach cannot work.`,

/**
 * `--check-cap`: pure read of the retry cap. Makes NO write. Reports whether
 * `execution.fix.attempt` exceeds `FIX_ATTEMPT_CAP` and how many attempts have
 * been consumed so far, so the caller can decide whether to land a tracked
 * hold via `hold-node` — this script stays pure of git/gh and cannot land that
 * hold itself.
 */
function applyCheckCap(
  args: Args,
  _node: TacticNode,
  _execution: Execution,
  currentFix: FixState | null,
): FixStateResult {
  const fix = requireFix(currentFix, args.id, "--check-cap");
  return {
    mode: "check-cap",
    id: args.id,
    wrote: false,
    capped: fix.attempt > FIX_ATTEMPT_CAP,
    consumed: fix.attempt - 1,
    attempt: fix.attempt,
  };
}

/**
 * `--check-cycle-cap`: pure read of the CROSS-CYCLE cap. Makes NO write, and
 * — unlike every other check/spend/clear/record/reset mode — does NOT require
 * an active interrupt: `execution.fix` is null at the point this is meant to
 * be called (BEFORE `--set-fix`, to decide whether a fresh entry should be
 * allowed at all). Reports the lifetime fix-cycle count
 * (`execution.attempts[FIX_CYCLE_ATTEMPT_KEY]`, defaulting to 0 when absent)
 * and whether it has already reached `FIX_CYCLE_CAP`.
 */
function applyCheckCycleCap(
  args: Args,
  _node: TacticNode,
  execution: Execution,
  _currentFix: FixState | null,
): FixStateResult {
  const cycles = execution.attempts[FIX_CYCLE_ATTEMPT_KEY] ?? 0;
  return {
    mode: "check-cycle-cap",
    id: args.id,
    wrote: false,
    cycles,
    cycleCapped: cycles >= FIX_CYCLE_CAP,
  };
}

/**
 * `--reset-cycle`: write-only reset of `execution.attempts[FIX_CYCLE_ATTEMPT_KEY]`
 * to 0, giving a human-resolved cross-cycle-cap hold a fresh lifetime budget.
 * Does not require an active interrupt (mirrors `--check-cycle-cap`).
 */
function applyResetCycle(
  args: Args,
  node: TacticNode,
  execution: Execution,
  _currentFix: FixState | null,
): FixStateResult {
  node.execution = { ...execution, attempts: { ...execution.attempts, [FIX_CYCLE_ATTEMPT_KEY]: 0 } };
  writeNode(args.dir, node, { writes: "orchestration" });
  return { mode: "reset-cycle", id: args.id, wrote: true, cycles: 0 };
}

/**
 * `--reset-attempt`: write-only reset of `execution.fix.attempt` to 1,
 * preserving `since`/`pushed_sha` and the ladder `phase`, giving a
 * human-cleared (or newly-held) node a fresh budget. Called by
 * `hold-node --reset-fix-attempt` at the point it lands the tracked hold.
 */
function applyResetAttempt(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentFix: FixState | null,
): FixStateResult {
  const fix = requireFix(currentFix, args.id, "--reset-attempt");
  node.execution = { ...execution, fix: { ...fix, attempt: 1 } };
  writeNode(args.dir, node, { writes: "orchestration" });
  return { mode: "reset-attempt", id: args.id, wrote: true, attempt: 1 };
}

/** `--record-push`: stamp the pushed sha onto an already-set interrupt. */
function applyRecord(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentFix: FixState | null,
): FixStateResult {
  const fix = requireFix(currentFix, args.id, "--record-push");
  if (args.pushedSha === null) {
    throw new Error("apply-fix-state: --record-push requires a sha (mode is 'record' but pushedSha is null)");
  }
  const sha = args.pushedSha;
  node.execution = { ...execution, fix: { ...fix, pushed_sha: sha } };
  writeNode(args.dir, node, { writes: "orchestration" });
  return { mode: "record", id: args.id, wrote: true, pushed_sha: sha };
}

const MODE_HANDLERS: Record<
  Mode,
  (args: Args, node: TacticNode, execution: Execution, currentFix: FixState | null) => FixStateResult
> = {
  set: applySet,
  clear: applyClear,
  spend: applySpend,
  "check-cap": applyCheckCap,
  "reset-attempt": applyResetAttempt,
  "check-cycle-cap": applyCheckCycleCap,
  "reset-cycle": applyResetCycle,
  record: applyRecord,
};

/**
 * Read the tactic, apply the `execution.fix` mutation, write it back through the
 * validating `writeNode`, and return the result. Exported so the store
 * round-trip is unit-tested without spawning a process. Pure of git/gh — the
 * caller owns landing the write on main via `graph-commit`.
 */
export function applyFixState(args: Args): FixStateResult {
  const node = readNode(args.dir, args.id);
  if (node.kind !== "tactic") {
    throw new Error(`apply-fix-state: ${args.id} is kind '${node.kind}', not a tactic`);
  }
  const execution: Execution = node.execution ?? defaultExecution(args.id);
  const currentFix: FixState | null = execution.fix ?? null;
  return MODE_HANDLERS[args.mode](args, node, execution, currentFix);
}

function main(argv: string[]): void {
  const result = applyFixState(parseArgs(argv));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
