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
// The six modes are mutually exclusive:
//
//   --set-conflict     Enter the interrupt. Writes
//                      `execution.conflict = { since: <today UTC>, attempt: <lifetime + 1>,
//                      head_sha: <--head-sha> }`
//                      when there is no interrupt yet. If one is already in
//                      flight (a defensive double-call) it bumps `attempt` and
//                      preserves `since` AND the already-recorded `head_sha`
//                      rather than clobbering the in-progress count or
//                      re-stamping the head the review verdict was taken
//                      against. Called by the selector on its first observation
//                      of `mergeable == CONFLICTING` on a reviewed
//                      awaiting-merge node, passing that PR's current
//                      `headRefOid` as `--head-sha`.
//
//   --spend-attempt    Spend one attempt against the in-flight interrupt:
//                      writes `execution.conflict.attempt + 1`, preserving
//                      `since`. Called by the selector each tick it re-observes
//                      CONFLICTING on an already-set interrupt. Errors if no
//                      interrupt is set.
//
//   --park-if-capped   Pure read of the retry cap (`CONFLICT_ATTEMPT_CAP`,
//                      `src/transitions.ts`). Makes NO write and does NOT park
//                      — it reports whether the node's LIFETIME conflict spend
//                      has reached the cap so the shell caller can run
//                      `park-node` itself (this script stays pure of git/gh).
//                      Errors if no interrupt is set.
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
//   --clear-conflict-guarded --head-sha <current-head>
//                      The REVIEW-BINDING clear: pick between the two clears
//                      above from evidence rather than from the caller's
//                      assertion. Mechanical (marker preserved) ONLY when the
//                      recorded `execution.conflict.head_sha` — the head the
//                      completed review examined, stamped at `--set-conflict` —
//                      is non-null and equals `<current-head>`; the PR became
//                      mergeable because MAIN moved, and the tree under review
//                      is byte-identical. Any other case clears BY INTENTION
//                      (marker stripped, `phase: review`): the head advanced,
//                      so the tree that would merge is NOT the tree the review
//                      approved — whether it was rewritten by the conflict lane
//                      or pushed by anyone else — and an unrecorded head
//                      (legacy interrupt) is unrecognized, which fails closed
//                      the same way. This is the ONLY clear an unattended
//                      caller (the selector's self-heal) may use; the two
//                      explicit modes above are for the trusted in-session
//                      resolver, which knows what it changed. The `guard` field
//                      in the result names the evidence
//                      (`head-match` / `head-advanced` / `head-unrecorded`).
//                      Errors if no interrupt is set, or without `--head-sha`.
//
// THE ATTEMPT BUDGET IS A LIFETIME BUDGET. `execution.conflict` is cleared
// whenever the interrupt resolves — including by the selector's self-heal on a
// single transient `mergeable == MERGEABLE` observation — so an in-flight
// `attempt` counter alone would bound retries within ONE uninterrupted
// CONFLICTING streak, not over the node's life. Mergeability flaps (a merge of
// main pushed to the head branch, then a re-conflicting push; or a contested
// file churning on main) would then re-enter at attempt 1 forever: the cap
// never fires, the node is never parked, and every re-entry spends a dispatch
// slot and spawns a fresh Opus `/dispatch-conflict` session — unbounded agent
// spawning driven purely by branch pushes. So the spend is ALSO persisted, as a
// monotonic lifetime counter on `execution.attempts.conflict` (the pre-existing
// per-phase attempt map; `conflict` is the router's emitted phase name for this
// interrupt). Neither clear mode zeroes it, `--set-conflict` seeds the fresh
// interrupt from it, and `--park-if-capped` evaluates the cap against it. The
// operator-visible reset lever is that field: zero `execution.attempts.conflict`
// on the node to hand a parked node a fresh automated budget.
//
// Usage:
//   node --import tsx/esm apply-conflict-state.ts <node-id> \
//     (--set-conflict | --spend-attempt | --park-if-capped | --clear-conflict-mechanical \
//      | --clear-conflict-intention | --clear-conflict-guarded) \
//     [--head-sha <sha>] [--dir <intentions-dir>]
//
// Stdout: one JSON object, shape per mode —
//   set-conflict:               { "mode": "set",     "id", "attempt": <n>, "since": <date>, "head_sha": <sha|null>, "wrote": true }
//   spend-attempt:              { "mode": "spend",   "id", "attempt": <n>, "wrote": true }
//   park-if-capped:             { "mode": "park-if-capped", "id", "capped": bool, "attempt": <lifetime n>, "wrote": false }
//   clear-conflict-mechanical:  { "mode": "clear",   "id", "reset": false, "phase": <unchanged>, "wrote": true }
//   clear-conflict-intention:   { "mode": "clear",   "id", "reset": true,  "phase": "review",    "wrote": true }
//   clear-conflict-guarded:     { "mode": "clear",   "id", "reset": bool,  "phase": <unchanged|"review">, "guard": <evidence>, "wrote": true }

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode, writeNode } from "../src/store.js";
import type { ConflictState, Execution } from "../src/schema.js";
import { CONFLICT_ATTEMPT_CAP, REVIEWED_MARKER } from "../src/transitions.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

type Mode =
  | "set"
  | "spend"
  | "park-if-capped"
  | "clear-mechanical"
  | "clear-intention"
  | "clear-guarded";

interface Args {
  id: string;
  mode: Mode;
  dir: string;
  /**
   * `--head-sha`: the PR's current `headRefOid`. Recorded by `--set-conflict`
   * (the head the review verdict was taken against) and compared against that
   * record by `--clear-conflict-guarded`. Null/absent when the flag was not
   * passed — optional at the type level so the modes that ignore it keep their
   * existing call shape; `--clear-conflict-guarded` refuses without it.
   */
  headSha?: string | null;
}

/** Today's date in UTC, formatted YYYY-MM-DD — the `ConflictState.since` stamp. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * `execution.attempts` key holding the node's LIFETIME conflict-resolution
 * spend — the counter the cap is actually evaluated against. `conflict` is the
 * phase name the router emits for this interrupt, so the key follows the
 * existing per-phase `attempts` convention exactly.
 */
export const CONFLICT_ATTEMPTS_KEY = "conflict";

/**
 * The node's lifetime conflict spend: the persisted `attempts.conflict` counter,
 * floored by any in-flight `conflict.attempt` (so a hand-edited or
 * pre-lifetime-counter node is never credited attempts it already spent).
 */
function lifetimeSpend(execution: Execution, currentConflict: ConflictState | null): number {
  return Math.max(execution.attempts[CONFLICT_ATTEMPTS_KEY] ?? 0, currentConflict?.attempt ?? 0);
}

/**
 * Record `spend` as the lifetime counter on a copy of `attempts`. Monotonic:
 * never lowers an existing count.
 */
function withLifetimeSpend(execution: Execution, spend: number): Record<string, number> {
  return {
    ...execution.attempts,
    [CONFLICT_ATTEMPTS_KEY]: Math.max(execution.attempts[CONFLICT_ATTEMPTS_KEY] ?? 0, spend),
  };
}

export function parseArgs(argv: string[]): Args {
  let id = "";
  let mode: Mode | null = null;
  let dir = join(repoRoot, "intentions");
  let headSha: string | null = null;
  const setMode = (m: Mode): void => {
    if (mode !== null) {
      throw new Error(
        "apply-conflict-state: --set-conflict, --spend-attempt, --park-if-capped, --clear-conflict-mechanical, --clear-conflict-intention, and --clear-conflict-guarded are mutually exclusive",
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
      case "--clear-conflict-guarded":
        setMode("clear-guarded");
        break;
      case "--head-sha": {
        const v = argv[++i];
        if (v === undefined || v === "") {
          throw new Error("apply-conflict-state: --head-sha requires a sha argument");
        }
        headSha = v;
        break;
      }
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
      "apply-conflict-state: one of --set-conflict | --spend-attempt | --park-if-capped | --clear-conflict-mechanical | --clear-conflict-intention | --clear-conflict-guarded is required",
    );
  }
  // The guarded clear's whole contract is the comparison, so a missing
  // `--head-sha` is a usage error, never a silently-degraded clear: without it
  // there is no evidence to prefer the mechanical arm, and defaulting either
  // way would hide that from the caller.
  if (mode === "clear-guarded" && headSha === null) {
    throw new Error("apply-conflict-state: --clear-conflict-guarded requires --head-sha <sha>");
  }
  return { id, mode, dir, headSha };
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
  /** set/spend: the attempt counter written. park-if-capped: the node's (unwritten) LIFETIME conflict spend. */
  attempt?: number;
  /** set: the `since` date written. */
  since?: string;
  /** clear: the resolved ladder phase to emit. */
  phase?: string;
  /** clear: whether the resolution stripped the reviewed marker (re-review). */
  reset?: boolean;
  /** park-if-capped: whether the node's LIFETIME conflict spend has reached `CONFLICT_ATTEMPT_CAP`. */
  capped?: boolean;
  /** set: the `head_sha` recorded on the interrupt (null when none was passed). */
  head_sha?: string | null;
  /**
   * clear-guarded: the evidence the arm was chosen from — `head-match` (the
   * current head equals the recorded review head → mechanical), `head-advanced`
   * (the head moved since the review → by intention), or `head-unrecorded` (a
   * legacy interrupt with no recorded head → by intention, fail closed).
   */
  guard?: "head-match" | "head-advanced" | "head-unrecorded";
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
 * `--set-conflict`: enter the interrupt. The attempt counter is seeded from the
 * node's LIFETIME spend, not from 1 — a re-entry after a clear (the selector's
 * transient-MERGEABLE self-heal, or a worker disposition) continues the same
 * budget, so mergeability flapping cannot refund attempts. A defensive
 * double-call preserves `since` so an in-flight interrupt's start date is not
 * clobbered.
 *
 * `head_sha` (the review-binding guard) is stamped ONLY on a fresh entry, from
 * `--head-sha`. A double-call keeps whatever the first entry recorded: the
 * field must name the head the completed review examined, and re-stamping it
 * from a later observation would silently re-bind the review verdict to a tree
 * nobody reviewed — exactly what the guarded clear exists to prevent.
 */
function applySet(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  const attempt = lifetimeSpend(execution, currentConflict) + 1;
  const conflict: ConflictState =
    currentConflict === null
      ? { since: todayUtc(), attempt, head_sha: args.headSha ?? null }
      : { ...currentConflict, attempt };
  node.execution = { ...execution, attempts: withLifetimeSpend(execution, attempt), conflict };
  // Orchestration-class writer — every write in this script mutates `execution`
  // (and, on resolution, `phase`) only. Same declaration at each `writeNode` call.
  writeNode(args.dir, node, { writes: "orchestration" });
  return {
    mode: "set",
    id: args.id,
    wrote: true,
    attempt: conflict.attempt,
    since: conflict.since,
    head_sha: conflict.head_sha ?? null,
  };
}

/**
 * `--spend-attempt`: spend one attempt against the in-flight interrupt,
 * bumping both the in-flight `attempt` and the persisted lifetime counter, and
 * preserving `since`.
 */
function applySpend(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  const conflict = requireConflict(currentConflict, args.id, "--spend-attempt");
  const attempt = lifetimeSpend(execution, conflict) + 1;
  const next: ConflictState = { ...conflict, attempt };
  node.execution = {
    ...execution,
    attempts: withLifetimeSpend(execution, attempt),
    conflict: next,
  };
  writeNode(args.dir, node, { writes: "orchestration" });
  return { mode: "spend", id: args.id, wrote: true, attempt: next.attempt };
}

/**
 * `--park-if-capped`: pure read of the retry cap. Makes NO write and does not
 * itself park — it reports whether the node's LIFETIME conflict spend
 * (`execution.attempts.conflict`, floored by the in-flight
 * `execution.conflict.attempt`) has reached `CONFLICT_ATTEMPT_CAP` so the shell
 * caller can run `park-node`. Reading the lifetime counter rather than the
 * in-flight one is what makes the cap survive a clear-and-re-enter flap.
 */
function applyParkIfCapped(
  args: Args,
  _node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  const conflict = requireConflict(currentConflict, args.id, "--park-if-capped");
  const spent = lifetimeSpend(execution, conflict);
  return {
    mode: "park-if-capped",
    id: args.id,
    wrote: false,
    capped: spent >= CONFLICT_ATTEMPT_CAP,
    attempt: spent,
  };
}

/**
 * `--clear-conflict-mechanical`: resolve the interrupt with no intention
 * change. Clears `execution.conflict`, preserving the ladder `phase` and every
 * marker (including `reviewed`) — the node returns to the pending-merge state
 * for `dispatch-auto-merge` to land once GitHub reports MERGEABLE.
 *
 * `execution.attempts.conflict` (the lifetime spend) is deliberately NOT
 * zeroed: a later re-conflict continues the same budget rather than restarting
 * it. This is the only reason the cap binds at all — see the lifetime-budget
 * note in the file header.
 */
function applyClearMechanical(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  requireConflict(currentConflict, args.id, "--clear-conflict-mechanical");
  node.execution = { ...execution, conflict: null };
  writeNode(args.dir, node, { writes: "orchestration" });
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
 *
 * Like the mechanical clear, this preserves `execution.attempts.conflict` — the
 * lifetime spend is never refunded by a resolution.
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
  writeNode(args.dir, node, { writes: "orchestration" });
  return { mode: "clear", id: args.id, wrote: true, reset: true, phase: "review" };
}

/**
 * `--clear-conflict-guarded`: the review-binding clear. Delegates to one of the
 * two clears above based on whether the PR's CURRENT head (`--head-sha`) is
 * still the head recorded when the interrupt was entered — i.e. the head the
 * `reviewed` marker was earned on.
 *
 * Only `head-match` keeps that marker. It is the one case where mergeability
 * changed WITHOUT the branch changing: main moved out from under the conflict,
 * and the tree that will merge is byte-identical to the reviewed one. Every
 * other case means the head advanced (a conflict-lane rewrite, a force-push, a
 * fresh commit — this script cannot tell them apart, and MUST NOT try) or was
 * never recorded, so the reviewed marker is stripped and review re-runs. The
 * caller disarms auto-merge (`gh pr ready --undo`) on a `reset: true` result;
 * that disarm is a shell concern, as for `--clear-conflict-intention`.
 */
function applyClearGuarded(
  args: Args,
  node: TacticNode,
  execution: Execution,
  currentConflict: ConflictState | null,
): ConflictStateResult {
  const conflict = requireConflict(currentConflict, args.id, "--clear-conflict-guarded");
  const currentHead = args.headSha ?? null;
  if (currentHead === null) {
    throw new Error(
      `apply-conflict-state: --clear-conflict-guarded on ${args.id} requires --head-sha (the PR's current head); without it there is no evidence to clear against`,
    );
  }
  const recorded = conflict.head_sha ?? null;
  if (recorded === null) {
    return { ...applyClearIntention(args, node, execution, conflict), guard: "head-unrecorded" };
  }
  if (recorded !== currentHead) {
    return { ...applyClearIntention(args, node, execution, conflict), guard: "head-advanced" };
  }
  return { ...applyClearMechanical(args, node, execution, conflict), guard: "head-match" };
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
  "clear-guarded": applyClearGuarded,
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
