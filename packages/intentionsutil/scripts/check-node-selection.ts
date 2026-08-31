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
//   node --import tsx/esm packages/intentionsutil/scripts/check-node-selection.ts \
//     <node-id> <selected-phase> --dir <intentions-dir> [--stamp <path>] \
//     [--snapshot-ref <ref>] [--snapshot-sha <sha>] \
//     [--snapshot-fetched-at <iso8601>] [--allow-stale]
//
// The snapshot's provenance (ref / sha / fetch instant) is an INPUT to this
// gate — the caller acquires it and passes it in; this file NEVER fetches,
// resolves a ref, or shells out to git for it. That is what keeps the predicate
// pure and pays one fetch per tick instead of one per node. Consequently
// `node:child_process` must NEVER be imported into this file.
//
// Checks, in order (each failing with one line on stderr):
//   0. freshness   — the caller's snapshot provenance proves the store was
//                    materialized from a recently-fetched ref
//                    (`classifySnapshot`). ENFORCED: an unprovable snapshot
//                    REFUSES the selection outright with one
//                    `unknown-freshness:` line and exit 15 — no other verdict
//                    is computed from a store whose currency cannot be
//                    proven. `--allow-stale` is the recorded operator escape
//                    hatch: it downgrades the refusal to one warning line and
//                    proceeds through the checks below, so the unverified read
//                    stays attributable after the fact. exit 15
//                    Consequence of running FIRST: a node parked on
//                    origin/main but read through an unprovable snapshot exits
//                    15, NOT 12 — check 3 is never reached. Both refuse the
//                    launch; 15 is the honest reason, because the gate cannot
//                    see whether the node is parked at all.
//   1. exists      — intentions/<node-id>.md present (a pruned node is a
//                    completed/removed selection).            exit 12
//   2. phase       — persisted phase equals <selected-phase>. exit 12
//                    EXCEPTION: an `align-tactics` selection on a kind
//                    "strategy" node that carries a non-null stored `phase`
//                    is a MALFORMED STORE, not a stale selection (schema rule
//                    12 makes `phase` tactic-only). It THROWS, which main()
//                    maps to the config-class                  exit 2
//   3. not parked  — office_hours null.                       exit 12
//   4. fingerprint — only when execution.strategy_fingerprint is non-null:
//                    each serving strategy's current substance hash matches its
//                    own entry in the per-strategy stamp map (mirrors the
//                    selector's soft-freeze rule; a legacy bare-string stamp
//                    still compares against every serving strategy).   exit 12
//   5. scope chain — only with --stamp and a fix/qa/review phase: the stamped
//                    scope fingerprint matches the current one.  exit 13
//
// The directive (phase / execution / office_hours) is read first-class only.
// It is never re-derived — the persisted value is authoritative.
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
import { listNodesStrict, readNode, readNodeBody } from "../src/store.js";
import {
  frozenTacticSelectable,
  servingStrategyIds,
  strategyAlignSelectable,
  strategyFingerprint,
  tacticScopeFingerprint,
} from "../src/router.js";
import { isFingerprintStale, REVIEWED_MARKER } from "../src/transitions.js";
import { checkKindTypedFields } from "../src/schema.js";
import type { IntentionNode } from "../src/schema.js";
import { IntentionSchemaError } from "../src/errors.js";

// --- Exit codes ------------------------------------------------------------
export const EXIT_STALE_SELECTION = 12; // node/phase/park/fingerprint no longer matches the selection
export const EXIT_SCOPE_STALE = 13; // the tactic's scope changed after the previous phase ran
export const EXIT_UNKNOWN_FRESHNESS = 15; // the snapshot's provenance could not be proven

const SCOPE_CHAINED_PHASES = new Set(["fix", "qa", "review"]);

// --- Snapshot provenance ---------------------------------------------------
// The caller's attestation of where the store directory came from and when it
// was last proven current. Mirrors `StrategyStampValue`'s "a value plus the sha
// it was computed against" shape (src/schema.ts), extended with the fetch
// instant so staleness is measurable rather than assumed.

export interface SnapshotProvenance {
  /** The git ref the snapshot dir was materialized from, e.g. "origin/main". */
  ref: string;
  /** The 40-hex commit that ref resolved to at materialization time. */
  sha: string;
  /** ISO-8601 instant the caller's `git fetch` of that ref SUCCEEDED. */
  fetchedAt: string;
}

/** How old a fetch attestation may be before the snapshot is unprovable. */
export const MAX_SNAPSHOT_AGE_MS = 10 * 60 * 1000;
/** How far into the future a fetch attestation may sit before it is rejected. */
export const MAX_SNAPSHOT_CLOCK_SKEW_MS = 60 * 1000;

export type FreshnessVerdict = { kind: "proven" } | { kind: "unknown"; detail: string };

const SHA_RE = /^[0-9a-f]{40}$/;

/**
 * Classify a caller-supplied snapshot attestation. Pure: `now` is a parameter,
 * never `new Date()` inside, so the age boundaries are testable deterministically
 * and the function performs no I/O of any kind.
 *
 * Deliberately does NOT constrain the VALUE of `ref` (e.g. to "origin/main"):
 * this predicate records provenance, it does not dictate policy on which ref is
 * canonical. That policy belongs to the caller that chose the ref.
 */
export function classifySnapshot(s: SnapshotProvenance | null, now: Date): FreshnessVerdict {
  if (s === null) {
    return { kind: "unknown", detail: "no snapshot provenance was supplied by the caller" };
  }
  if (s.ref === "") {
    return { kind: "unknown", detail: "snapshot provenance carries an empty ref" };
  }
  if (!SHA_RE.test(s.sha)) {
    return { kind: "unknown", detail: `snapshot sha '${s.sha}' is not a 40-hex commit id` };
  }
  const fetchedAtMs = Date.parse(s.fetchedAt);
  if (Number.isNaN(fetchedAtMs)) {
    return { kind: "unknown", detail: `snapshot fetchedAt '${s.fetchedAt}' is not a parseable date` };
  }
  const ageMs = now.getTime() - fetchedAtMs;
  if (ageMs > MAX_SNAPSHOT_AGE_MS) {
    return {
      kind: "unknown",
      detail:
        `snapshot of ${s.ref} was fetched ${Math.round(ageMs / 1000)}s ago, ` +
        `over the ${Math.round(MAX_SNAPSHOT_AGE_MS / 1000)}s limit`,
    };
  }
  if (-ageMs > MAX_SNAPSHOT_CLOCK_SKEW_MS) {
    return {
      kind: "unknown",
      detail:
        `snapshot of ${s.ref} is future-dated by ${Math.round(-ageMs / 1000)}s, ` +
        `over the ${Math.round(MAX_SNAPSHOT_CLOCK_SKEW_MS / 1000)}s clock-skew allowance`,
    };
  }
  return { kind: "proven" };
}

export interface SelectionOpts {
  nodeId: string;
  selectedPhase: string;
  dir: string;
  stamp: string | null;
  /**
   * The caller's attestation for `dir`, or null when it cannot supply one.
   * REQUIRED (not optional) by design: encoding the obligation in the type is
   * what stops a future caller from silently skipping the freshness question.
   */
  snapshot: SnapshotProvenance | null;
  /**
   * Operator override for an unprovable snapshot: downgrades the exit-15
   * refusal to one recorded warning line and proceeds. Load-bearing.
   */
  allowStale?: boolean;
  /** Injectable clock for the freshness classifier; `main` passes `new Date()`. */
  now?: Date;
}

export interface SelectionResult {
  /** 0 = pass, 12 = stale-selection, 13 = scope-stale, 15 = unknown-freshness. */
  exitCode: 0 | 12 | 13 | 15;
  /** The node's scope fingerprint on a pass, else null. */
  stdout: string | null;
  /** Failure line and/or warnings, in emission order. */
  stderr: string[];
}

/**
 * Run check 0 (snapshot freshness) and the five re-validation checks against a
 * store the caller guarantees is at fresh origin/main — an obligation the caller
 * now attests to explicitly via `opts.snapshot` rather than by convention.
 * Pure: reads files, returns a result — no process exit, no
 * direct stdio. Throws only on a genuinely malformed store (a node file that
 * cannot be read or fails schema validation), which is a config-class error the
 * caller maps to exit 2, distinct from the staleness verdicts.
 *
 * Store enumeration is deliberately STRICT (`listNodesStrict`, not the tolerant
 * `listNodes`): this is a fail-closed integrity gate, so one unreadable node
 * file must abort it loudly rather than silently shrink the graph the
 * align-eligibility and fingerprint-staleness checks reason over — a corrupt
 * strategy file under tolerant enumeration would turn the gate into a pass for
 * every tactic serving it.
 */
export function evaluateSelection(opts: SelectionOpts): SelectionResult {
  const { nodeId, selectedPhase, dir, stamp, snapshot, allowStale = false, now = new Date() } = opts;
  const warnings: string[] = [];
  const fail = (exitCode: 12 | 13, check: string, detail: string): SelectionResult => {
    const prefix = exitCode === EXIT_SCOPE_STALE ? "scope-stale" : "stale-selection";
    return { exitCode, stdout: null, stderr: [...warnings, `${prefix}: ${check}: ${detail}`] };
  };

  // 0. freshness — no other verdict may be computed from an unproven store, so
  //    this runs FIRST and REFUSES BY DEFAULT: an unprovable snapshot returns
  //    exit 15 immediately, before checks 1-5 read a single node file. That
  //    ordering is the point — a verdict derived from a store whose currency
  //    cannot be proven is not a verdict. `--allow-stale` is the recorded
  //    operator override: it downgrades the refusal to one warning line and
  //    falls through, so the unverified read stays attributable afterwards.
  //    Consequence: a PARKED node read through an unprovable snapshot exits 15,
  //    not the 12 check 3 would have produced — check 3 never runs. Both refuse
  //    the launch; 15 is the honest reason, since the gate cannot see the park.
  const freshness = classifySnapshot(snapshot, now);
  if (freshness.kind === "unknown") {
    if (!allowStale) {
      return {
        exitCode: EXIT_UNKNOWN_FRESHNESS,
        stdout: null,
        stderr: [...warnings, `unknown-freshness: ${freshness.detail}`],
      };
    }
    warnings.push(
      `unknown-freshness: ${freshness.detail} (--allow-stale: the operator accepted an unverified snapshot)`,
    );
  }

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

  // 2. phase — the selected phase must still match the node.
  //
  // A strategy is selected at the derived `align-tactics` rung, a string the
  // selector emits on the candidate but never stores on the node (strategies
  // carry `phase: null` natively). A literal `node.phase === selectedPhase`
  // computes `null !== "align-tactics"` and exit-12s every strategy, blocking
  // the whole align lane. For `align-tactics` the equality is replaced by a
  // strategy-aware gate: the node must be a strategy still at its native null
  // phase (an advance to any non-null phase is a stale selection). The
  // align-eligibility re-check is deferred to below the not-parked check so a
  // parked strategy fails with the clearer not-parked
  // message. All other phases keep the literal stored-phase equality (tactic
  // phases are first-class and persisted, so equality is correct there).
  //
  // `fix` is likewise a directive the selector emits but never stores on the
  // node: a CI-fix interrupt lives on `execution.fix` while `phase` stays at its
  // real ladder position (implement/qa/review), so `phase` is never literally
  // `"fix"`. A literal `node.phase === "fix"` would exit-12 every fix candidate.
  // For `fix` the equality is replaced by an interrupt-presence gate: the
  // interrupt must still be set (a null `execution.fix` means it was resolved
  // between selection and execute-time — a stale selection).
  const phase = node.phase;
  if (selectedPhase === "fix") {
    if (node.execution?.fix == null) {
      return fail(
        EXIT_STALE_SELECTION,
        "phase",
        `selected fix but ${nodeId} carries no execution.fix interrupt (resolved since selection)`,
      );
    }
  } else if (selectedPhase === "conflict") {
    // `conflict` is likewise a directive the selector emits but never stores:
    // the merge-conflict interrupt lives on `execution.conflict` while `phase`
    // stays at its real ladder position (typically `review` with the reviewed
    // marker, awaiting merge). Same interrupt-presence gate as `fix` — a null
    // `execution.conflict` means the conflict resolved between selection and
    // execute-time, a stale selection. (`pending-merge`, the other new signal
    // string, is never a dispatched selectedPhase: the shell sensor gate turns
    // it into `conflict` or a skip before any worker starts.)
    if (node.execution?.conflict == null) {
      return fail(
        EXIT_STALE_SELECTION,
        "phase",
        `selected conflict but ${nodeId} carries no execution.conflict interrupt (resolved since selection)`,
      );
    }
  } else if (selectedPhase === "align-tactics") {
    if (node.kind === "strategy") {
      // A strategy is align-selected at its native null phase. A non-null
      // stored phase is NOT a stale advance — it is a MALFORMED NODE, so this
      // raises rather than returning a staleness verdict.
      //
      // Why: schema rule 12 makes `phase` tactic-only, so a strategy can never
      // legitimately carry one. There is no benign path that produces this
      // node; a stale advance would have to have written a field the kind does
      // not have. Reporting exit 12 told the caller "the selection went stale,
      // nothing is wrong" and sent a re-evaluation worker at a corrupt node.
      //
      // This IS reachable in production, which is why the check is not
      // redundant: rule 12 is enforced only in validateGraph, graph-commit
      // never runs validateGraph, and validateNode accepts the node — so a
      // strategy carrying a phase lands and reaches here. Measured: with this
      // branch removed, the gate exits 0 on such a node and would provision a
      // worktree and launch an /align-tactics worker against it.
      //
      // Rule 12 stays SINGLE-HOMED: the schema's own checkKindTypedFields
      // decides, rather than this file restating the rule and drifting from it.
      if (phase !== null) {
        const problems: string[] = [];
        checkKindTypedFields(node, problems);
        throw new Error(
          problems.length > 0
            ? `malformed store: ${problems.join("; ")}`
            : `malformed store: ${nodeId} is kind "strategy" but carries phase "${phase}"`,
        );
      }
    } else {
      // A frozen tactic is align-selected either at draft (phase null) OR while
      // carrying an in-flight phase if it is soft-frozen. That distinction is
      // not cheaply recomputable here, so the phase-literal check is skipped for
      // a tactic target: eligibility is decided wholesale by the 3b re-check
      // below (frozenTacticSelectable, the single source of truth).
    }
  } else if (phase !== selectedPhase) {
    return fail(EXIT_STALE_SELECTION, "phase", `selected ${selectedPhase} but node is now ${phase ?? "draft/null"}`);
  } else if (selectedPhase === "review" && (node.execution?.markers ?? []).includes(REVIEWED_MARKER)) {
    // The pure selector (selectGraphTargets) already skips emitting a
    // phase:review tactic once it carries the reviewed marker — the marker
    // means the review pass already ran and the node is awaiting tick
    // merge/fix, not a fresh review candidate. This is the execute-side
    // mirror of that guard, catching a directive selected just before the
    // marker landed (or a hand-run/explicit-dispatch invocation that bypassed
    // the selector entirely).
    return fail(
      EXIT_STALE_SELECTION,
      "phase",
      `${nodeId} already carries the reviewed marker — awaiting tick merge/fix, not a review candidate`,
    );
  }

  // 3. not parked — an author park landing after selection yields the worker.
  if (node.office_hours !== null) {
    return fail(EXIT_STALE_SELECTION, "not-parked", `${nodeId} was parked to office_hours after selection`);
  }

  // 3b. align-eligibility — for an align-tactics selection, the selector must
  //     still emit the strategy as an align candidate (signal still unvalidated,
  //     under the rounds cap, no non-draft on-path child, not soft-frozen out).
  //     Deferred to here so the not-parked check above owns the parked verdict;
  //     defers wholesale to the pure selector (single source of truth).
  if (selectedPhase === "align-tactics") {
    if (node.kind === "strategy") {
      if (!strategyAlignSelectable(node, listNodesStrict(dir))) {
        return fail(
          EXIT_STALE_SELECTION,
          "phase",
          `selected align-tactics but strategy ${nodeId} is no longer align-eligible ` +
            `(signal validated, rounds cap, on-path child, or soft-frozen out)`,
        );
      }
    } else if (!frozenTacticSelectable(node, listNodesStrict(dir))) {
      return fail(
        EXIT_STALE_SELECTION,
        "phase",
        `selected align-tactics but tactic ${nodeId} is no longer frozen-eligible ` +
          `(advanced past draft and not soft-frozen, parked, or resolved)`,
      );
    }
  }

  // 4. fingerprint — a strategy substance edit after selection yields the
  //    worker. Only meaningful once stamping has started (null is never stale).
  //
  //    Skipped entirely for an align-tactics selection. A strategy's stamp is
  //    null anyway (nothing to compare). For a soft-frozen tactic — the exact
  //    re-evaluation target an align-tactics session exists to handle — the
  //    stale execution.strategy_fingerprint IS the selection reason, not a yield
  //    reason: 3b (frozenTacticSelectable) already admitted it, so re-testing the
  //    same staleness here would reject the node 3b just admitted and strand the
  //    re-evaluation worker at exit 12.
  const stampedFp =
    selectedPhase === "align-tactics" ? null : (node.execution?.strategy_fingerprint ?? null);
  if (stampedFp !== null) {
    const byId = new Map(listNodesStrict(dir).map((n) => [n.id, n]));
    for (const sid of servingStrategyIds(node, byId)) {
      const strategy = byId.get(sid);
      // Strict enumeration above guarantees an absent id means the node is
      // genuinely not in the store — a dangling serves edge, which is
      // validateGraph's failure, not this gate's. (Under the tolerant
      // `listNodes` a corrupt strategy file would also land here, silently
      // turning this required staleness gate into a pass for the whole
      // subtree serving it.)
      if (strategy === undefined) continue;
      if (isFingerprintStale(stampedFp, sid, strategyFingerprint(strategy))) {
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
  const stderr: string[] = [...warnings];

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
  let snapshotRef: string | null = null;
  let snapshotSha: string | null = null;
  let snapshotFetchedAt: string | null = null;
  let allowStale = false;
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
    } else if (arg === "--snapshot-ref") {
      const v = argv[++i];
      if (v === undefined || v === "") throw new Error("check-node-selection: --snapshot-ref requires a ref argument");
      snapshotRef = v;
    } else if (arg === "--snapshot-sha") {
      const v = argv[++i];
      if (v === undefined || v === "") throw new Error("check-node-selection: --snapshot-sha requires a sha argument");
      snapshotSha = v;
    } else if (arg === "--snapshot-fetched-at") {
      const v = argv[++i];
      if (v === undefined || v === "")
        throw new Error("check-node-selection: --snapshot-fetched-at requires an ISO-8601 argument");
      snapshotFetchedAt = v;
    } else if (arg === "--allow-stale") {
      allowStale = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`check-node-selection: unknown argument '${arg}'`);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length !== 2 || dir === null) {
    throw new Error(
      "usage: check-node-selection.ts <node-id> <selected-phase> --dir <intentions-dir> [--stamp <path>] " +
        "[--snapshot-ref <ref>] [--snapshot-sha <sha>] [--snapshot-fetched-at <iso8601>] [--allow-stale]",
    );
  }
  // PARTIAL provenance (one or two of the three flags) is `null`, NOT a usage
  // error: a caller that half-plumbs the flags must be refused through the
  // freshness path — where the refusal is attributable and overridable — rather
  // than crashed into the config-class exit 2.
  const snapshot: SnapshotProvenance | null =
    snapshotRef !== null && snapshotSha !== null && snapshotFetchedAt !== null
      ? { ref: snapshotRef, sha: snapshotSha, fetchedAt: snapshotFetchedAt }
      : null;
  return { nodeId: positional[0], selectedPhase: positional[1], dir, stamp, snapshot, allowStale };
}

// --- Main ------------------------------------------------------------------
function main(argv: string[]): void {
  const result = evaluateSelection({ ...parseArgs(argv), now: new Date() });
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
