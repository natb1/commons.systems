// Worker-start re-validation gate (tactic-worker-start-revalidation Unit 1).
//
// Selection freezes a node's directive at tick start, but its phase worker may
// start minutes later (runner spawn latency, daemon queue). Nothing re-checks
// between selection and execution today: an author park landing mid-tick still
// gets its worker; a strategy substance edit meant to make a selected worker
// yield is not enforced execute-side; an out-of-band phase advance leaves the
// worker on a stale phase. This is the execute-side gate — the provisioning
// prelude runs it against a checkout the caller guarantees is at fresh
// origin/main (provision-node-worktree fetches first, Unit 2) and maps its exit
// code.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/check-node-selection.ts \
//     <node-id> <selected-phase> --dir <intentions-dir> [--stamp <path>]
//
// Checks, in order (each failing with one line on stderr):
//   1. exists      — intentions/<node-id>.md present (a pruned node is a
//                    completed/removed selection).            exit 12
//   2. phase       — persisted phase equals <selected-phase>. exit 12
//   3. not parked  — office_hours null.                       exit 12
//   4. fingerprint — only when execution.strategy_fingerprint is non-null:
//                    every serving strategy's current substance hash matches
//                    the stamp (mirrors the selector's soft-freeze rule). exit 12
//   5. scope chain — only with --stamp and a fix/qa/review phase: the stamped
//                    scope fingerprint matches the current one.  exit 13
//
// The directive (phase / execution / office_hours) is read first-class, falling
// back to the `attributes.*` squatter convention (until tactic-schema-migration-
// backfill lands). It is never re-derived — the persisted value is authoritative.
//
// On pass the script is silent except for the node's scope fingerprint on
// stdout (the phase-start stamp the transition-time scope gate verifies) and
// exits 0. No graph writes, no git, no gh — pure read + exit code + stdout.
//
// The core is `evaluateSelection`, a pure function returning the exit code,
// stdout, and stderr lines so it is unit-testable without spawning a process;
// `main` maps its result onto the real stdio/exit.

import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { listNodes, readNode, readNodeBody } from "../src/store.js";
import { servingStrategyIds, strategyFingerprint, tacticScopeFingerprint } from "../src/router.js";
import type { IntentionNode } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";

// --- Exit codes ------------------------------------------------------------
export const EXIT_STALE_SELECTION = 12; // node/phase/park/fingerprint no longer matches the selection
export const EXIT_SCOPE_STALE = 13; // the tactic's scope changed after the previous phase ran

const SCOPE_CHAINED_PHASES = new Set(["fix", "qa", "review"]);

export interface SelectionOpts {
  nodeId: string;
  selectedPhase: string;
  dir: string;
  stamp: string | null;
}

export interface SelectionResult {
  /** 0 = pass, 12 = stale-selection, 13 = scope-stale. */
  exitCode: 0 | 12 | 13;
  /** The node's scope fingerprint on a pass, else null. */
  stdout: string | null;
  /** Failure line and/or warnings, in emission order. */
  stderr: string[];
}

// --- Squatter-aware directive reads ----------------------------------------
// The graph-native subtree carries phase/execution/office_hours first-class; the
// attention-surface and token-economy subtrees still squat them under
// `attributes.*`. Read first-class, fall back to the squatter copy.

function readPhase(node: IntentionNode): string | null {
  if (node.phase !== null) return node.phase;
  const squat = node.attributes.phase;
  return typeof squat === "string" ? squat : null;
}

function readParked(node: IntentionNode): boolean {
  if (node.office_hours !== null) return true;
  const squat = node.attributes.office_hours;
  return squat !== null && squat !== undefined;
}

/** The stamped serving-strategy fingerprint, first-class or squatter, or null. */
function readStrategyFingerprint(node: IntentionNode): string | null {
  const firstClass = node.execution?.strategy_fingerprint ?? null;
  if (firstClass !== null) return firstClass;
  const squatExec = node.attributes.execution;
  if (squatExec !== null && typeof squatExec === "object" && "strategy_fingerprint" in squatExec) {
    const fp = (squatExec as { strategy_fingerprint?: unknown }).strategy_fingerprint;
    return typeof fp === "string" ? fp : null;
  }
  return null;
}

/**
 * Run the five re-validation checks against a store the caller guarantees is at
 * fresh origin/main. Pure: reads files, returns a result — no process exit, no
 * direct stdio. Throws only on a genuinely malformed store (a node file that
 * fails schema validation), which is a config-class error the caller maps to
 * exit 2, distinct from the staleness verdicts.
 */
export function evaluateSelection(opts: SelectionOpts): SelectionResult {
  const { nodeId, selectedPhase, dir, stamp } = opts;
  const fail = (exitCode: 12 | 13, check: string, detail: string): SelectionResult => {
    const prefix = exitCode === EXIT_SCOPE_STALE ? "scope-stale" : "stale-selection";
    return { exitCode, stdout: null, stderr: [`${prefix}: ${check}: ${detail}`] };
  };

  // 1. exists — a missing file is a pruned/removed selection.
  let node: IntentionNode;
  try {
    node = readNode(dir, nodeId);
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "ENOENT") {
      return fail(EXIT_STALE_SELECTION, "exists", `${nodeId} is no longer in the store (pruned or removed)`);
    }
    throw err;
  }

  // 2. phase — persisted phase must equal the selected phase (never re-derived).
  const phase = readPhase(node);
  if (phase !== selectedPhase) {
    return fail(EXIT_STALE_SELECTION, "phase", `selected ${selectedPhase} but node is now ${phase ?? "draft/null"}`);
  }

  // 3. not parked — an author park landing after selection yields the worker.
  if (readParked(node)) {
    return fail(EXIT_STALE_SELECTION, "not-parked", `${nodeId} was parked to office_hours after selection`);
  }

  // 4. fingerprint — a strategy substance edit after selection yields the
  //    worker. Only meaningful once stamping has started (null is never stale).
  const stampedFp = readStrategyFingerprint(node);
  if (stampedFp !== null) {
    const byId = new Map(listNodes(dir).map((n) => [n.id, n]));
    for (const sid of servingStrategyIds(node, byId)) {
      const strategy = byId.get(sid);
      if (strategy === undefined) continue; // a dangling serves edge is validateGraph's failure, not this gate's
      if (strategyFingerprint(strategy) !== stampedFp) {
        return fail(
          EXIT_STALE_SELECTION,
          "fingerprint",
          `serving strategy ${sid} substance changed since the stamp — subtree is soft-frozen`,
        );
      }
    }
  }

  // Passed the staleness checks: compute the scope fingerprint (statement + body).
  const scopeFp = tacticScopeFingerprint(node.statement, readNodeBody(dir, nodeId));
  const stderr: string[] = [];

  // 5. scope chain — chain-of-custody. Only for the phases that inherit a prior
  //    phase's scope (fix/qa/review); implement always re-establishes custody
  //    against the latest scope, and main-qa is post-merge by definition.
  if (stamp !== null && SCOPE_CHAINED_PHASES.has(selectedPhase)) {
    let stampLine: string | null = null;
    try {
      stampLine = readFileSync(stamp, "utf8").trim();
    } catch (err) {
      if (!(err instanceof Error && "code" in err && (err as { code?: string }).code === "ENOENT")) throw err;
      // Missing stamp fails OPEN during bootstrap (legacy launch, hand-run
      // phase, recreated worktree). It flips to a hard exit-13 once
      // tactic-graph-router-transitions Unit 1 refreshes the stamp at every
      // transition write; until then absence is not yet provably broken custody.
      stderr.push(
        `check-node-selection: warning: no scope stamp at ${stamp} — passing (bootstrap policy; ` +
          `will fail closed once transition-time stamp refresh lands)`,
      );
    }
    if (stampLine !== null && stampLine !== "") {
      const [stampedScope, stampedSha = "<unknown>"] = stampLine.split(/\s+/);
      if (stampedScope !== scopeFp) {
        return fail(
          EXIT_SCOPE_STALE,
          "scope-chain",
          `${stampedSha}..HEAD — the tactic's scope changed after the previous phase; demote to implement`,
        );
      }
    }
  }

  return { exitCode: 0, stdout: scopeFp, stderr };
}

// --- Arg parsing -----------------------------------------------------------
function parseArgs(argv: string[]): SelectionOpts {
  const positional: string[] = [];
  let dir: string | null = null;
  let stamp: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      const v = argv[++i];
      if (v === undefined || v === "") throw new Error("check-node-selection: --dir requires a directory argument");
      dir = v;
    } else if (arg === "--stamp") {
      const v = argv[++i];
      if (v === undefined || v === "") throw new Error("check-node-selection: --stamp requires a path argument");
      stamp = v;
    } else if (arg.startsWith("--")) {
      throw new Error(`check-node-selection: unknown argument '${arg}'`);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length !== 2 || dir === null) {
    throw new Error(
      "usage: check-node-selection.ts <node-id> <selected-phase> --dir <intentions-dir> [--stamp <path>]",
    );
  }
  return { nodeId: positional[0], selectedPhase: positional[1], dir, stamp };
}

// --- Main ------------------------------------------------------------------
function main(argv: string[]): void {
  const result = evaluateSelection(parseArgs(argv));
  for (const line of result.stderr) process.stderr.write(`${line}\n`);
  if (result.stdout !== null) process.stdout.write(`${result.stdout}\n`);
  process.exit(result.exitCode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    // Usage / argument / malformed-store errors are config-class (exit 2),
    // distinct from the staleness verdicts (12/13) the caller routes on.
    const message = err instanceof IntentionSchemaError || err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(2);
  }
}
