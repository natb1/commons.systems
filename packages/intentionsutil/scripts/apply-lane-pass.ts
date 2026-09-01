// apply-lane-pass — the store-mutation primitive for `execution.lane_pass`, the
// durable "this lane's pass actually completed" stamp. Structural sibling of
// `apply-conflict-state.ts`: pure of git/gh, reads the node via `readNode`,
// mutates `execution.lane_pass` through the validated `writeNode`, and prints
// one JSON object on stdout for the shell caller to act on and to land via
// `graph-commit`.
//
// WHY THE STAMP EXISTS. The dispatch ladder driver (`dispatch-ladder-await`)
// decides whether a phase pass completed by reading `origin/main` graph state.
// Two lanes — the merge-conflict lane (`dispatch-conflict` Lane 3) and qa-fix's
// auto-fix "fixing pass" — complete their work by pushing to the node's branch
// and writing job-dir markers. Neither moves the node's `phase`. With nothing
// durable to read, a SUCCESSFUL pass by either lane is indistinguishable from a
// stall, so the driver can only ever report `stalled`. The completing lane
// writes this stamp; the driver compares its `at` against the launch window.
//
// WHY NOT `apply-fix-state` OR `apply-conflict-state`. Both were considered and
// rejected. `apply-fix-state --set-fix` ENTERS the CI-fix interrupt — live
// routing state the selector re-dispatches on, whose `--clear-fix` resets
// `phase` to `review` and strips `REVIEWED_MARKER`. And every
// `apply-conflict-state` mode but `--set-conflict` throws on a null interrupt
// (`requireConflict`), which is exactly the ladder's own entry state. This
// stamp is orthogonal to both interrupts: it records that a pass finished, and
// changes no routing state at all.
//
// THE STAMP IS OVERWRITTEN, NOT APPENDED. Each pass replaces the previous
// stamp — one object, not a list. It is bounded by construction and no consumer
// reads history, so it never needs clearing.
//
// THERE IS NO `--at` FLAG. The timestamp always comes from the clock (injected
// in tests). Backdating a completion stamp has no caller and is a footgun: it
// would let a pass qualify for a launch window it never ran in.
//
// Usage:
//   node --import tsx/esm apply-lane-pass.ts <node-id> --stamp \
//     --lane <lane> --phase <dispatch-phase-name> [--sha <sha>] [--dir <intentions-dir>]
//
// `--lane` and `--phase` are REQUIRED and validated against their closed sets
// (`LANE_PASS_LANES` / `DISPATCH_PHASE_NAMES`, `src/schema.ts`), so a wrong
// value is a loud usage error here rather than a stamp the ladder reader
// silently fails to match.
//
// PASS THE RUNG THE LADDER AWAITED AT, which is not always the node's persisted
// `phase`. `dispatch-ladder-await`'s probe is
// `.execution.lane_pass.phase == "$FROM_PHASE"`, and the selector emits `fix`
// and `conflict` as real rungs — so on the router's conflict interrupt the rung
// is `conflict`, while on the provision-exit-11 entry it is the node's own
// phase. Today dispatch-conflict passes the node's phase on both paths and
// qa-fix passes the literal `qa`; see the `DISPATCH_PHASE_NAMES` doc comment in
// `src/schema.ts` for why the first of those is currently unreachable rather
// than correct.
//
// Stdout: one JSON object —
//   { "mode": "stamp", "id", "at": <YYYY-MM-DDTHH:MM:SSZ>, "lane", "phase", "sha": <sha|null>, "wrote": true }

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode, writeNode } from "../src/store.js";
import type { Execution, LanePass } from "../src/schema.js";
import { DISPATCH_PHASE_NAMES, LANE_PASS_LANES } from "../src/schema.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

export interface Args {
  id: string;
  /** The completing lane; one of `LANE_PASS_LANES`. */
  lane: string;
  /** The dispatch phase the pass ran in; one of `DISPATCH_PHASE_NAMES`. */
  phase: string;
  /** The sha the lane pushed, when it pushed one. */
  sha?: string | null;
  dir: string;
}

/**
 * The instant `now` as `YYYY-MM-DDTHH:MM:SSZ` — `toISOString()` with its
 * milliseconds truncated.
 *
 * The truncation is load-bearing, not cosmetic. The ladder compares stamps
 * against a launch window with a plain string `>=`, which is only chronological
 * because the format is fixed-width and ends in a literal `Z`. Leaving the
 * milliseconds in breaks it within a single second: `"…:06.789Z" >= "…:06Z"` is
 * FALSE, because `.` (0x2E) sorts below `Z` (0x5A). `requireTimestampString`
 * (`src/schema.ts`) rejects the untruncated form, so this is enforced on write.
 */
export function stampTime(now: Date): string {
  return now.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function parseArgs(argv: string[]): Args {
  let id = "";
  let stamp = false;
  let lane: string | null = null;
  let phase: string | null = null;
  let sha: string | null = null;
  let dir = join(repoRoot, "intentions");
  const takeValue = (i: number, flag: string): string => {
    const v = argv[i];
    if (v === undefined || v === "") {
      throw new Error(`apply-lane-pass: ${flag} requires an argument`);
    }
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--stamp":
        stamp = true;
        break;
      case "--lane":
        lane = takeValue(++i, "--lane");
        break;
      case "--phase":
        phase = takeValue(++i, "--phase");
        break;
      case "--sha":
        sha = takeValue(++i, "--sha");
        break;
      case "--dir":
        dir = takeValue(++i, "--dir");
        break;
      default:
        if (a.startsWith("--")) throw new Error(`apply-lane-pass: unknown flag '${a}'`);
        if (id !== "") throw new Error(`apply-lane-pass: unexpected extra argument '${a}'`);
        id = a;
    }
  }
  if (id === "") throw new Error("apply-lane-pass: <node-id> is required");
  if (!stamp) throw new Error("apply-lane-pass: --stamp is required");
  if (lane === null) {
    throw new Error(
      `apply-lane-pass: --lane is required, one of ${LANE_PASS_LANES.join(" | ")}`,
    );
  }
  if (phase === null) {
    throw new Error(
      `apply-lane-pass: --phase is required, one of ${DISPATCH_PHASE_NAMES.join(" | ")}`,
    );
  }
  assertLane(lane);
  assertPhase(phase);
  return { id, lane, phase, sha, dir };
}

/**
 * Reject a lane the reader would not recognize. Validated at the CLI edge, not
 * only in `writeNode`, so the caller sees the accepted set in the error.
 */
function assertLane(lane: string): void {
  if (!LANE_PASS_LANES.some((known) => known === lane)) {
    throw new Error(
      `apply-lane-pass: unknown --lane '${lane}', expected one of ${LANE_PASS_LANES.join(" | ")}`,
    );
  }
}

/** Reject a phase outside the wider dispatch vocabulary. See `assertLane`. */
function assertPhase(phase: string): void {
  if (!DISPATCH_PHASE_NAMES.includes(phase)) {
    throw new Error(
      `apply-lane-pass: unknown --phase '${phase}', expected one of ${DISPATCH_PHASE_NAMES.join(" | ")}`,
    );
  }
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
    lane_pass: null,
  };
}

export interface LanePassResult {
  mode: "stamp";
  id: string;
  at: string;
  lane: string;
  phase: string;
  sha: string | null;
  wrote: boolean;
}

/**
 * Read the tactic, overwrite `execution.lane_pass` with a stamp for `now`,
 * write it back through the validating `writeNode`, and return the result.
 * Exported so the store round-trip is unit-tested without spawning a process,
 * with the clock injected. Pure of git/gh — the caller owns landing the write
 * on main via `graph-commit`.
 */
export function applyLanePass(args: Args, now: Date = new Date()): LanePassResult {
  const node = readNode(args.dir, args.id);
  if (node.kind !== "tactic") {
    throw new Error(`apply-lane-pass: ${args.id} is kind '${node.kind}', not a tactic`);
  }
  assertLane(args.lane);
  assertPhase(args.phase);
  const execution: Execution = node.execution ?? defaultExecution(args.id);
  const lanePass: LanePass = {
    at: stampTime(now),
    lane: args.lane,
    phase: args.phase,
    sha: args.sha ?? null,
  };
  node.execution = { ...execution, lane_pass: lanePass };
  // Orchestration-class writer: `execution.lane_pass` only.
  writeNode(args.dir, node, { writes: "orchestration" });
  return {
    mode: "stamp",
    id: args.id,
    at: lanePass.at,
    lane: lanePass.lane,
    phase: lanePass.phase,
    sha: lanePass.sha ?? null,
    wrote: true,
  };
}

function main(argv: string[]): void {
  const result = applyLanePass(parseArgs(argv));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
