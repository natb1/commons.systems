// apply-node-transition — the store-mutation half of the graph-native phase
// transition writer (tactic-graph-router-transitions Unit 1). Reads a tactic
// node, computes the forward-transition decision from the PURE `transitions`
// module given the sensor inputs handed in as flags, applies the resulting
// phase / marker / attempt / pr writes through the validated `writeNode`, and
// prints the decision as one JSON object on stdout for the shell wrapper to act
// on (arm auto-merge, run graph-commit, refresh the stamp, post a demotion
// comment).
//
// This script authors NO markdown and makes NO git/gh calls — the wrapper
// (`.claude/skills/dispatch-propagate/scripts/transition-node`) owns the
// origin/main reads, the CI/mergeability sensors, and the graph-commit landing.
// Splitting the decision+mutation here keeps it exercised by the pure
// `transitions` unit tests and store round-trip, not buried in bash.
//
// Usage:
//   node --import tsx/esm apply-node-transition.ts <node-id> \
//     [--ci passing|failing|unknown] [--scope-stale] [--strategy-stale] \
//     [--set-pr <n>] [--strategy-fingerprint <fp>] [--dir <intentions-dir>]
//
// Stdout: one JSON object
//   { "phase": "<new-phase>", "prevPhase": "<old>", "armMerge": bool,
//     "hold": bool, "demote": bool, "hasResidue": bool, "wrote": bool }

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode, readNodeBody, writeNode } from "../src/store.js";
import type { Execution } from "../src/schema.js";
import {
  PHASE_COMPLETION_MARKER,
  addMarker,
  decideTransition,
  hasNeedsMainResidue,
  type CiVerdict,
} from "../src/transitions.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

interface Args {
  id: string;
  ci: CiVerdict;
  scopeStale: boolean;
  strategyStale: boolean;
  setPr: number | null;
  strategyFingerprint: string | null;
  dir: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    id: "",
    ci: "unknown",
    scopeStale: false,
    strategyStale: false,
    setPr: null,
    strategyFingerprint: null,
    dir: join(repoRoot, "intentions"),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--ci": {
        const v = argv[++i];
        if (v !== "passing" && v !== "failing" && v !== "unknown") {
          throw new Error(`apply-node-transition: --ci must be passing|failing|unknown, got '${v}'`);
        }
        out.ci = v;
        break;
      }
      case "--scope-stale":
        out.scopeStale = true;
        break;
      case "--strategy-stale":
        out.strategyStale = true;
        break;
      case "--set-pr": {
        const v = Number(argv[++i]);
        if (!Number.isInteger(v) || v < 0) {
          throw new Error(`apply-node-transition: --set-pr must be a non-negative integer, got '${argv[i]}'`);
        }
        out.setPr = v;
        break;
      }
      case "--strategy-fingerprint":
        out.strategyFingerprint = argv[++i];
        break;
      case "--dir":
        out.dir = argv[++i];
        break;
      default:
        if (a.startsWith("--")) throw new Error(`apply-node-transition: unknown flag '${a}'`);
        if (out.id !== "") throw new Error(`apply-node-transition: unexpected extra argument '${a}'`);
        out.id = a;
    }
  }
  if (out.id === "") throw new Error("apply-node-transition: <node-id> is required");
  return out;
}

/** A fresh execution record for a tactic that has none yet (pre-PR implement). */
function defaultExecution(id: string): Execution {
  return { branch: id, pr: null, attempts: {}, markers: [], strategy_fingerprint: null };
}

/** The result object the CLI prints and tests assert on. */
export interface ApplyResult {
  phase: string;
  prevPhase: string;
  armMerge: boolean;
  hold: boolean;
  demote: boolean;
  hasResidue: boolean;
  wrote: boolean;
}

/**
 * Read the tactic, compute the transition decision, apply the phase / marker /
 * attempt / pr writes through `writeNode`, and return the result. Exported so
 * the store round-trip is unit-tested rather than exercised only through the
 * CLI. Pure of git/gh — the wrapper owns those.
 */
export function applyNodeTransition(args: Args): ApplyResult {
  const node = readNode(args.dir, args.id);
  if (node.kind !== "tactic") {
    throw new Error(`apply-node-transition: ${args.id} is kind '${node.kind}', not a tactic`);
  }
  const prevPhase = node.phase ?? "implement";
  const body = readNodeBody(args.dir, args.id);
  const hasResidue = hasNeedsMainResidue(body);

  let execution = node.execution ?? defaultExecution(args.id);
  if (args.setPr !== null) execution = { ...execution, pr: args.setPr };
  if (args.strategyFingerprint !== null) {
    execution = { ...execution, strategy_fingerprint: args.strategyFingerprint };
  }

  const decision = decideTransition({
    phase: prevPhase,
    markers: execution.markers,
    ci: args.ci,
    hasResidue,
    scopeStale: args.scopeStale,
    strategyStale: args.strategyStale,
  });

  // A ladder phase completes cleanly when the tactic advances off it (or, for
  // review, arms the merge). On a fix interrupt, a hold, or a demotion the
  // phase did not complete, so no marker is written.
  const marker = PHASE_COMPLETION_MARKER[prevPhase];
  const advanced =
    decision.armMerge ||
    (!decision.hold && !decision.demote && decision.phase !== "fix" && decision.phase !== prevPhase);
  if (marker !== undefined && advanced) execution = addMarker(execution, marker);

  // Apply the phase write. A demotion clears the completion markers so the
  // re-selected implement worker re-runs the ladder against the new scope.
  if (decision.demote) {
    execution = { ...execution, markers: [] };
    node.phase = "implement";
  } else if (!decision.hold) {
    node.phase = decision.phase as typeof node.phase;
  }

  node.execution = execution;
  writeNode(args.dir, node);

  return {
    phase: node.phase ?? "implement",
    prevPhase,
    armMerge: decision.armMerge,
    hold: decision.hold,
    demote: decision.demote,
    hasResidue,
    wrote: true,
  };
}

function main(argv: string[]): void {
  const result = applyNodeTransition(parseArgs(argv));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
