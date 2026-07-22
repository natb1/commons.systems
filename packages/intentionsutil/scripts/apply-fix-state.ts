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
//   --park-if-capped   Enforce the retry cap (`FIX_ATTEMPT_CAP`,
//                      `src/transitions.ts`). If `execution.fix.attempt` exceeds
//                      the cap, writes a first-class `office_hours` park record
//                      (parity with the legacy `dispatch:fix-checks-attempt-<n>`
//                      escalation) AND resets `execution.fix.attempt` to 1 in
//                      the same write, giving a human-cleared node a fresh
//                      budget. If the cap is not exceeded, makes NO write.
//                      Called by `graph-select-target` before dispatching a
//                      node back into the fix interrupt. Errors if no
//                      interrupt is set.
//
// Usage:
//   node --import tsx/esm apply-fix-state.ts <node-id> \
//     (--set-fix | --clear-fix | --record-push <sha> | --spend-attempt | --park-if-capped) \
//     [--dir <intentions-dir>]
//
// Stdout: one JSON object, shape per mode —
//   set-fix:        { "mode": "set",        "id", "attempt": <n>, "since": <date>, "wrote": true }
//   clear-fix:      { "mode": "clear",      "id", "phase": <resolved>, "reset": bool, "wrote": true }
//   record-push:    { "mode": "record",     "id", "pushed_sha": <sha>, "wrote": true }
//   spend-attempt:  { "mode": "spend",      "id", "attempt": <n>, "wrote": true }
//   park-if-capped: { "mode": "park-check", "id", "parked": true, "attempt": <consumed>, "wrote": true }
//                or { "mode": "park-check", "id", "parked": false, "wrote": false }

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode, writeNode } from "../src/store.js";
import type { Execution, FixState } from "../src/schema.js";
import { FIX_ATTEMPT_CAP, REVIEWED_MARKER } from "../src/transitions.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

type Mode = "set" | "clear" | "record" | "spend" | "park-check";

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
        "apply-fix-state: --set-fix, --clear-fix, --record-push, --spend-attempt, and --park-if-capped are mutually exclusive",
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
      case "--park-if-capped":
        setMode("park-check");
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
      "apply-fix-state: one of --set-fix | --clear-fix | --record-push <sha> | --spend-attempt | --park-if-capped is required",
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
  /** set/spend: the attempt counter written. park-check (parked): the count of attempts consumed before the park. */
  attempt?: number;
  /** set: the `since` date written. */
  since?: string;
  /** clear: the resolved ladder phase to emit (post re-review reset). */
  phase?: string;
  /** clear: whether the re-review reset moved the phase to `review`. */
  reset?: boolean;
  /** record: the pushed sha written to `execution.fix.pushed_sha`. */
  pushed_sha?: string;
  /** park-check: whether the retry cap was exceeded and office_hours was written. */
  parked?: boolean;
}

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

  if (args.mode === "set") {
    // Enter the interrupt. Fresh when none is set; a defensive double-call bumps
    // `attempt` and preserves `since`/`pushed_sha` so an in-flight count is not
    // clobbered.
    const fix: FixState =
      currentFix === null
        ? { since: todayUtc(), attempt: 1, pushed_sha: null }
        : { ...currentFix, attempt: currentFix.attempt + 1 };
    node.execution = { ...execution, fix };
    writeNode(args.dir, node);
    return { mode: "set", id: args.id, wrote: true, attempt: fix.attempt, since: fix.since };
  }

  if (args.mode === "clear") {
    // Null-interrupt guard, mirroring `--record-push`: clearing a node that
    // carries no active interrupt is meaningless, and — worse — would spuriously
    // trip the re-review reset below on a `reviewed` node (resetting `phase` to
    // `review` and stripping the marker, forcing a needless re-review and
    // disarming a valid merge). Refuse rather than proceed unconditionally.
    if (currentFix === null) {
      throw new Error(
        `apply-fix-state: --clear-fix on ${args.id} but execution.fix is null (no interrupt in flight to clear)`,
      );
    }
    // Resolve the interrupt. Re-review reset: a fix landed after review must be
    // re-reviewed, so return the node to `review` when it carries the reviewed
    // marker — AND strip that marker, so the review pass actually re-runs (both
    // the selector's phase:review+reviewed emit-guard and check-node-selection's
    // reviewed-marker guard would otherwise treat the node as already-reviewed
    // and skip/exit-12 it). `qa-done`/`planned` are kept: only review re-runs,
    // not qa. When not past review, `phase` is preserved at its ladder position.
    const reset = execution.markers.includes(REVIEWED_MARKER);
    if (reset) node.phase = "review";
    const markers = reset ? execution.markers.filter((m) => m !== REVIEWED_MARKER) : execution.markers;
    node.execution = { ...execution, markers, fix: null };
    writeNode(args.dir, node);
    return { mode: "clear", id: args.id, wrote: true, phase: node.phase ?? "implement", reset };
  }

  if (args.mode === "spend") {
    // Spend one attempt against the in-flight interrupt (the fix-checks SKILL.md
    // caller consumes this per pass). Null-interrupt guard, mirroring
    // `--record-push`: spending against no interrupt is meaningless.
    if (currentFix === null) {
      throw new Error(
        `apply-fix-state: --spend-attempt on ${args.id} but execution.fix is null (no interrupt in flight to spend against)`,
      );
    }
    const fix: FixState = { ...currentFix, attempt: currentFix.attempt + 1 };
    node.execution = { ...execution, fix };
    writeNode(args.dir, node);
    return { mode: "spend", id: args.id, wrote: true, attempt: fix.attempt };
  }

  if (args.mode === "park-check") {
    // Enforce the retry cap (graph-select-target's enforcement point). Null-
    // interrupt guard, mirroring `--record-push`: checking a cap against no
    // interrupt is meaningless.
    if (currentFix === null) {
      throw new Error(
        `apply-fix-state: --park-if-capped on ${args.id} but execution.fix is null (no interrupt in flight to check a cap against)`,
      );
    }
    if (currentFix.attempt > FIX_ATTEMPT_CAP) {
      const consumed = currentFix.attempt - 1;
      node.office_hours = {
        reason:
          `/fix-checks retry budget exhausted: ${consumed} attempts concluded with PR #${execution.pr ?? "?"} ` +
          `still red (execution.fix.attempt=${currentFix.attempt}, since ${currentFix.since}) — restoring the legacy ` +
          `dispatch:fix-checks-attempt-<n> escalation.`,
        since: todayUtc(),
        recommendation:
          `Review the fix-checks accumulator (tmp/fix-checks-summary.md in the node's worktree, also posted as PR ` +
          `comments) to diagnose why ${FIX_ATTEMPT_CAP} automated attempts did not resolve CI. Clear office_hours to ` +
          `resume automated fix-checks with a fresh retry budget (attempt was reset to 1), or abandon/redesign the ` +
          `tactic if the current approach cannot work.`,
      };
      node.execution = { ...execution, fix: { ...currentFix, attempt: 1 } };
      writeNode(args.dir, node);
      return { mode: "park-check", id: args.id, wrote: true, parked: true, attempt: consumed };
    }
    return { mode: "park-check", id: args.id, wrote: false, parked: false };
  }

  // record: stamp the pushed sha onto an already-set interrupt.
  if (currentFix === null) {
    throw new Error(
      `apply-fix-state: --record-push on ${args.id} but execution.fix is null (no interrupt in flight to record a push against)`,
    );
  }
  if (args.pushedSha === null) {
    throw new Error("apply-fix-state: --record-push requires a sha (mode is 'record' but pushedSha is null)");
  }
  const sha = args.pushedSha;
  node.execution = { ...execution, fix: { ...currentFix, pushed_sha: sha } };
  writeNode(args.dir, node);
  return { mode: "record", id: args.id, wrote: true, pushed_sha: sha };
}

function main(argv: string[]): void {
  const result = applyFixState(parseArgs(argv));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
