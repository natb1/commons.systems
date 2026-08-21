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
// origin/main reads, the mergeability sensor, and the graph-commit landing.
// Splitting the decision+mutation here keeps it exercised by the pure
// `transitions` unit tests and store round-trip, not buried in bash. The
// forward decision is CI-blind (a CI-fix interrupt is the selector's job via
// `execution.fix`), so this script no longer takes a CI verdict.
//
// Usage:
//   node --import tsx/esm apply-node-transition.ts <node-id> \
//     [--scope-stale] [--strategy-stale] \
//     [--set-pr <n>] [--strategy-fingerprint <strategy-id>=<hash> ...] \
//     [--strategy-sha <sha>] [--dir <intentions-dir>]
//
// `--strategy-fingerprint` is repeatable and takes a KEYED `<strategy-id>=<hash>`
// value; each entry merges into the per-strategy stamp map, preserving other
// keys. The bare hash form (no `=`) is rejected — it cannot say which serving
// strategy the hash belongs to, and a single string freezes every other serving
// strategy of a multi-serves tactic.
//
// `--strategy-sha <sha>` is required whenever `--strategy-fingerprint` is given
// (an error is thrown otherwise): it is the origin/main commit the hash(es) were
// computed against, and is shared across every `--strategy-fingerprint` entry in
// the invocation. This script is pure of git/gh — the wrapper owns those reads
// and passes the sha in explicitly rather than this script shelling it out.
//
// Stdout: one JSON object
//   { "phase": "<new-phase>", "prevPhase": "<old>", "armMerge": bool,
//     "hold": bool, "demote": bool, "hasResidue": bool, "wrote": bool }

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode, readNodeBody, writeNode } from "../src/store.js";
import {
  PHASE_COMPLETION_MARKER,
  addMarker,
  decideTransition,
  hasNeedsMainResidue,
} from "../src/transitions.js";
import {
  type StrategyStampMap,
  defaultExecution,
  foldStrategyStampMap,
  mergeStrategyStamp,
  parseStrategyFingerprintEntry,
} from "./lib-strategy-stamp.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

interface Args {
  id: string;
  scopeStale: boolean;
  strategyStale: boolean;
  setPr: number | null;
  strategyFingerprint: StrategyStampMap | null;
  dir: string;
}

export function parseArgs(argv: string[]): Args {
  const out: Args = {
    id: "",
    scopeStale: false,
    strategyStale: false,
    setPr: null,
    strategyFingerprint: null,
    dir: join(repoRoot, "intentions"),
  };
  let fingerprintHashes: Record<string, string> | null = null;
  let strategySha: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
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
      case "--strategy-fingerprint": {
        const { sid, hash } = parseStrategyFingerprintEntry("apply-node-transition", argv[++i]);
        fingerprintHashes = { ...(fingerprintHashes ?? {}), [sid]: hash };
        break;
      }
      case "--strategy-sha":
        strategySha = argv[++i];
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
  out.strategyFingerprint = foldStrategyStampMap(
    "apply-node-transition",
    fingerprintHashes,
    strategySha,
  );
  return out;
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
    execution = mergeStrategyStamp(execution, args.strategyFingerprint);
  }

  const decision = decideTransition({
    phase: prevPhase,
    hasResidue,
    scopeStale: args.scopeStale,
    strategyStale: args.strategyStale,
  });

  // A ladder phase completes cleanly when the tactic advances off it (or, for
  // review, arms the merge). On a hold or a demotion the phase did not complete,
  // so no marker is written. The decision is CI-blind and never routes into
  // `fix`, so there is no fix-interrupt case to exclude here.
  const marker = PHASE_COMPLETION_MARKER[prevPhase];
  const advanced =
    decision.armMerge || (!decision.hold && !decision.demote && decision.phase !== prevPhase);
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
