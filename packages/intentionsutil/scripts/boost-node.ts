// Boost planner CLI + write path (tactic-attention-boost-scripts Unit 2).
//
// Thin wrapper around `planBoost` (../src/boost.ts, Unit 1): a preview mode
// that answers "what own attention.boost does <node-id> need?" without
// touching disk, and a `--write` mode that lands the answer (or an author's
// explicit override) through the normal readNode -> validateNode -> writeNode
// gate.
//
// Store-level only: no git, no `gh`, no graph-commit anywhere in this file.
// It reads/writes whatever `intentions/` directory `--dir` points at (the
// repo-local store by default, resolved from this file's own location, never
// cwd). Unit 3 wraps this CLI in the bash landing script that does the
// git/graph-commit dance.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/boost-node.ts <node-id> [--dir <intentions-dir>]
//       [--rank <n>] [--include-exempt] [--json] [--top <n>]
//   npx tsx packages/intentionsutil/scripts/boost-node.ts <node-id> --write --rationale <text>
//       [--dir <dir>] [--boost <n>] [--rank <n>] [--include-exempt] [--ack]
//
// Exit codes:
//   0  ok (including a successful preview that reports "unreachable")
//   1  schema/graph error (unknown id, non-goal-layer target, validateGraph violation, ...)
//   2  usage error (bad flags, missing node-id, missing/blank --rationale on --write)
//   4  no usable boost (unreachable and no explicit --boost given, or ACK required and not given)

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes, readNode, writeNode } from "../src/store.js";
import { MAIN_HEALTH_DOMINANCE_ACK, validateGraph, validateNode } from "../src/schema.js";
import type { IntentionNode } from "../src/schema.js";
import { planBoost } from "../src/boost.js";
import type { BoostMode, BoostPlan, RankRow } from "../src/boost.js";

// --- Exit codes --------------------------------------------------------------
export const EXIT_OK = 0;
export const EXIT_SCHEMA_ERROR = 1;
export const EXIT_USAGE = 2;
export const EXIT_UNREACHABLE = 4;

// --- Table rendering -----------------------------------------------------

function padRow(id: string, kind: string, phase: string, rank: string, ownBoost: string, marker: string): string {
  return [
    id.padEnd(40),
    kind.padEnd(9),
    phase.padEnd(14),
    rank.padStart(10),
    ownBoost.padStart(10),
    marker,
  ].join(" ");
}

function rowToLine(row: RankRow): string {
  return padRow(
    row.id,
    row.kind,
    row.phase,
    row.rank.toFixed(3),
    row.own_boost === null ? "-" : String(row.own_boost),
    row.exempt ? "*" : "",
  );
}

/** Human-readable rendering of a BoostPlan: a fixed-width table plus a summary. */
export function renderPlan(plan: BoostPlan, top: number): string {
  const rows = plan.ranking.slice(0, top);
  const lines: string[] = [
    padRow("id", "kind", "phase", "rank", "own_boost", ""),
    ...rows.map(rowToLine),
    "",
    `target: ${plan.target}`,
    `target current rank: ${plan.target_current_rank ?? "n/a (not goal-layer-ranked)"}`,
    plan.incumbent === null
      ? "incumbent: none (no contested candidate)"
      : `incumbent: ${plan.incumbent.id} (rank ${plan.incumbent.rank.toFixed(3)})`,
  ];

  if (plan.recommended_boost === null) {
    lines.push(`unreachable: ${plan.unreachable_reason}`);
  } else {
    lines.push(`recommended boost: ${plan.recommended_boost}`);
    lines.push(`resulting rank: ${plan.resulting_rank}`);
    if (plan.needs_ack) {
      lines.push(
        `NOTE: this boost would match or exceed strategy-main-health's dominant boost (${plan.ceiling}) — ` +
          `validateGraph rule 18 would refuse the write unless the rationale carries ` +
          `"${MAIN_HEALTH_DOMINANCE_ACK}". Pass --ack to a --write invocation to append that clause and opt in.`,
      );
    }
  }

  return lines.join("\n");
}

// --- Preview mode --------------------------------------------------------

export interface PreviewOpts {
  dir: string;
  nodeId: string;
  mode: BoostMode;
  includeExempt: boolean;
  json: boolean;
  top: number;
}

export interface PreviewResult {
  /** 0 = plan computed (even when unreachable), 1 = schema/graph error. */
  exitCode: 0 | 1;
  stdout: string | null;
  stderr: string[];
  plan: BoostPlan | null;
}

/**
 * Compute and render a BoostPlan. Never writes to disk. Exit 0 whenever the
 * plan computes successfully — an "unreachable" plan is still a successful
 * preview, it answered the question. Exit 1 on any thrown Error (unknown id,
 * non-goal-layer target, ...).
 */
export function previewBoost(opts: PreviewOpts): PreviewResult {
  try {
    const nodes = listNodes(opts.dir);
    const plan = planBoost(nodes, opts.nodeId, opts.mode, { includeExempt: opts.includeExempt });
    const stdout = opts.json ? JSON.stringify(plan) : renderPlan(plan, opts.top);
    return { exitCode: 0, stdout, stderr: [], plan };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { exitCode: 1, stdout: null, stderr: [message], plan: null };
  }
}

// --- Write mode ------------------------------------------------------------

export interface WriteOpts {
  dir: string;
  nodeId: string;
  mode: BoostMode;
  includeExempt: boolean;
  /** Mandatory in spirit; null/blank is rejected inside writeBoost with exit 2. */
  rationale: string | null;
  /** Author's explicit boost value, verbatim; null means "use the planner's recommendation". */
  explicitBoost: number | null;
  ack: boolean;
}

export interface WriteResult {
  exitCode: 0 | 1 | 2 | 4;
  stdout: string | null;
  stderr: string[];
}

/**
 * Compute the plan, resolve the boost to write (explicit or recommended),
 * enforce rule 18's ACK gate, then land it through readNode -> validateNode ->
 * writeNode — the same single validation gate write-node.ts uses, mirrored
 * here for a narrower attention-only mutation. A pre-write validateGraph call
 * is a defense-in-depth backstop so a rule 5/18 violation surfaces here with a
 * clear message rather than only at land time.
 */
export function writeBoost(opts: WriteOpts): WriteResult {
  const rationale = (opts.rationale ?? "").trim();
  if (rationale === "") {
    return {
      exitCode: EXIT_USAGE,
      stdout: null,
      stderr: [
        "boost-node: --rationale is mandatory for --write — the attention field requires an " +
          "author rationale, and this script never synthesizes one",
      ],
    };
  }

  let nodes: IntentionNode[];
  let plan: BoostPlan;
  try {
    nodes = listNodes(opts.dir);
    plan = planBoost(nodes, opts.nodeId, opts.mode, { includeExempt: opts.includeExempt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { exitCode: EXIT_SCHEMA_ERROR, stdout: null, stderr: [message] };
  }

  const preview = renderPlan(plan, 10);

  let chosenBoost: number;
  if (opts.explicitBoost !== null) {
    chosenBoost = opts.explicitBoost;
  } else if (plan.recommended_boost !== null) {
    chosenBoost = plan.recommended_boost;
  } else {
    return {
      exitCode: EXIT_UNREACHABLE,
      stdout: preview,
      stderr: [plan.unreachable_reason ?? "boost-node: no boost reachable and none explicitly given"],
    };
  }

  const needsAck = plan.ceiling !== null && chosenBoost >= plan.ceiling;
  if (needsAck && !opts.ack) {
    return {
      exitCode: EXIT_UNREACHABLE,
      stdout: preview,
      stderr: [
        `boost-node: boost ${chosenBoost} would match or exceed strategy-main-health's dominant boost ` +
          `(${plan.ceiling}) — validateGraph rule 18 would refuse this write. Pass --ack to append the ` +
          `acknowledgement clause and opt in.`,
      ],
    };
  }

  const finalRationale = needsAck && opts.ack ? `${rationale} (${MAIN_HEALTH_DOMINANCE_ACK})` : rationale;

  let node: IntentionNode;
  try {
    node = readNode(opts.dir, opts.nodeId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { exitCode: EXIT_SCHEMA_ERROR, stdout: null, stderr: [message] };
  }

  const mutated: IntentionNode = {
    ...node,
    attention: { boost: chosenBoost, override: null, rationale: finalRationale },
  };

  let validated: IntentionNode;
  try {
    validated = validateNode(mutated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { exitCode: EXIT_SCHEMA_ERROR, stdout: null, stderr: [message] };
  }

  // Defense-in-depth: catch a rule 5/18 violation here rather than only at
  // land time. On any throw, exit 1 — the explicit ACK gate above is the
  // primary path for rule 18; this is a backstop, not a second decision point.
  try {
    const mutatedNodes = nodes.map((n) => (n.id === opts.nodeId ? validated : n));
    validateGraph(mutatedNodes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { exitCode: EXIT_SCHEMA_ERROR, stdout: null, stderr: [message] };
  }

  writeNode(opts.dir, validated);

  const rankLine =
    opts.explicitBoost === null
      ? `predicted resulting rank: ${plan.resulting_rank}`
      : "(rank not predicted for an explicit --boost value; re-run without --write to preview)";

  const stdout = [
    `wrote ${opts.nodeId}: attention.boost = ${chosenBoost}`,
    `rationale: ${finalRationale}`,
    rankLine,
  ].join("\n");

  return { exitCode: EXIT_OK, stdout, stderr: [] };
}

// --- Arg parsing -------------------------------------------------------------

interface CliArgs {
  nodeId: string;
  dir: string;
  mode: BoostMode;
  includeExempt: boolean;
  json: boolean;
  top: number;
  write: boolean;
  rationale: string | null;
  explicitBoost: number | null;
  ack: boolean;
}

function requireNumberArg(argv: string[], i: number, flag: string): number {
  const v = argv[i];
  const n = v === undefined ? NaN : Number(v);
  if (v === undefined || v === "" || !Number.isFinite(n)) {
    throw new Error(`boost-node: ${flag} requires a numeric argument`);
  }
  return n;
}

function parseArgs(argv: string[], defaultDir: string): CliArgs {
  const positional: string[] = [];
  let dir = defaultDir;
  let rankValue: number | null = null;
  let includeExempt = false;
  let json = false;
  let top = 10;
  let write = false;
  let rationale: string | null = null;
  let explicitBoost: number | null = null;
  let ack = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      const v = argv[++i];
      if (v === undefined || v === "") throw new Error("boost-node: --dir requires a directory argument");
      dir = v;
    } else if (arg === "--rank") {
      rankValue = requireNumberArg(argv, ++i, "--rank");
    } else if (arg === "--include-exempt") {
      includeExempt = true;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--top") {
      const n = requireNumberArg(argv, ++i, "--top");
      if (!Number.isInteger(n) || n <= 0) throw new Error("boost-node: --top requires a positive integer argument");
      top = n;
    } else if (arg === "--write") {
      write = true;
    } else if (arg === "--rationale") {
      const v = argv[++i];
      if (v === undefined) throw new Error("boost-node: --rationale requires a text argument");
      rationale = v;
    } else if (arg === "--boost") {
      explicitBoost = requireNumberArg(argv, ++i, "--boost");
    } else if (arg === "--ack") {
      ack = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`boost-node: unknown argument '${arg}'`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    throw new Error(
      "usage:\n" +
        "  boost-node.ts <node-id> [--dir <intentions-dir>] [--rank <n>] [--include-exempt] [--json] [--top <n>]\n" +
        "  boost-node.ts <node-id> --write --rationale <text> [--dir <dir>] [--boost <n>] " +
        "[--rank <n>] [--include-exempt] [--ack]",
    );
  }

  const mode: BoostMode = rankValue !== null ? { kind: "rank", value: rankValue } : { kind: "top-candidate" };

  return {
    nodeId: positional[0],
    dir,
    mode,
    includeExempt,
    json,
    top,
    write,
    rationale,
    explicitBoost,
    ack,
  };
}

// --- Main --------------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/boost-node.ts`, so the
// repo root is three directories up. Resolved from this file's own location,
// never cwd — mirrors select-targets.ts.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

function main(argv: string[]): void {
  const defaultDir = join(repoRoot, "intentions");
  const args = parseArgs(argv, defaultDir);

  if (args.write) {
    const result = writeBoost({
      dir: args.dir,
      nodeId: args.nodeId,
      mode: args.mode,
      includeExempt: args.includeExempt,
      rationale: args.rationale,
      explicitBoost: args.explicitBoost,
      ack: args.ack,
    });
    for (const line of result.stderr) process.stderr.write(`${line}\n`);
    if (result.stdout !== null) process.stdout.write(`${result.stdout}\n`);
    process.exit(result.exitCode);
  } else {
    const result = previewBoost({
      dir: args.dir,
      nodeId: args.nodeId,
      mode: args.mode,
      includeExempt: args.includeExempt,
      json: args.json,
      top: args.top,
    });
    for (const line of result.stderr) process.stderr.write(`${line}\n`);
    if (result.stdout !== null) process.stdout.write(`${result.stdout}\n`);
    process.exit(result.exitCode);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    // Usage/argument errors from parseArgs are config-class (exit 2).
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(EXIT_USAGE);
  }
}
