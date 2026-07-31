// hold-node-decide — decide what a "tracked hold" looks like for a source node
// that hit a mechanical retry state (a merge-conflict retry against a moving
// main, or fix-attempt-cap exhaustion). This is the network-free, testable
// DECISION half; a bash caller owns the LANDING half (write-node.ts +
// graph-commit), mirroring the decision/land split of graph-census-debt.ts.
//
// Doctrine: a park (`office_hours`) means "no autonomous path exists, a human is
// required". A mechanical retry state is not that. So instead of parking the
// SOURCE node, the producer births a small born-parked HOLD TACTIC and adds a
// `blocked_by` edge from the source to it. The source's own `office_hours` is
// never written — it does not appear anywhere in this tool's output.
//
// The hold id is DETERMINISTIC:
//   tactic-hold-<kindSlug>-<source-id without its leading "tactic-">
// which makes find-or-create idempotent by mere existence. The find key is
// STRUCTURAL ("is there already an unresolved hold for this exact source"), not
// content-derived, so no fingerprint is involved.
//
// Usage:
//   node --import tsx/esm hold-node-decide.ts --source <id>
//     --kind <provision-conflict|fix-attempt-cap|worktree-residue|ci-pending-stalled>
//     --reason-file <f> --recommendation-file <f>
//     [--body-file <f>] [--now <YYYY-MM-DD>] [--intentions <dir>]
//
// Stdout: one JSON object:
//   { disposition, hold_id, node?, node_body?, node_body_append?,
//     source_blocked_by, source_edge_needed }

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";

/**
 * Hold-kind vocabulary: HOLD_KINDS is the source of truth for the producer
 * kinds this tool implements; KIND_SLUGS and HoldKind both derive from it.
 *
 * Reserved slugs (the id scheme is deliberately extensible; a slug reserved here
 * is documentation of the namespace, not an implemented producer):
 *
 *  - `conflict`    — provision-conflict: a merge-conflict retry against a
 *                    moving main. IMPLEMENTED.
 *  - `fix-cap`     — fix-attempt-cap: the CI-fix interrupt exhausted
 *                    FIX_ATTEMPT_CAP attempts (see src/transitions.ts).
 *                    IMPLEMENTED.
 *  - `residue`     — worktree-residue: provision-node-worktree refused to
 *                    provision the node's worktree because it carries
 *                    mechanical residue from a dead session (exit 14 — a dirty
 *                    tracked tree, or a detached HEAD / in-progress operation
 *                    that could not be auto-repaired). NOT a content conflict:
 *                    origin/main merges clean once the residue is cleared, so
 *                    it never reaches the /dispatch-conflict lane. It is a
 *                    steady state with no autonomous repair path, so the
 *                    producer escalates on the FIRST occurrence — there is no
 *                    strike ladder in front of it. IMPLEMENTED.
 *  - `no-progress` — RESERVED for a different tactic's future per-node
 *                    no-progress fuse. Deliberately NOT wired to a producer
 *                    kind or a CLI case here; the name is reserved so the id
 *                    scheme (`tactic-hold-no-progress-<source>`) is documented
 *                    and cannot be claimed for something else. `ci-stalled`
 *                    below was minted separately rather than claiming this
 *                    slug: `no-progress` is reserved for a general any-phase
 *                    no-progress fuse (a different future tactic), while
 *                    `ci-stalled` is a specific single-cause bound on one
 *                    sensor's verdict (the CI-pending observation). Claiming
 *                    the general slug for a specific cause would make the
 *                    eventual general fuse unnameable, and would make
 *                    `tactic-hold-no-progress-<source>` ambiguous between two
 *                    producers.
 *  - `ci-stalled`  — ci-pending-stalled: the autonomous tick observed the
 *                    node's draft-PR CI verdict as `pending` on the SAME head
 *                    SHA for DISPATCH_CI_PENDING_STRIKE_CAP consecutive
 *                    observations (checks never started, or a run that never
 *                    concluded). Unlike `worktree-residue` this DOES have a
 *                    plausible self-heal (checks may still start), so it sits
 *                    behind a strike ladder rather than escalating on first
 *                    occurrence. IMPLEMENTED.
 */
export const HOLD_KINDS = [
  "provision-conflict",
  "fix-attempt-cap",
  "worktree-residue",
  "ci-pending-stalled",
] as const;

export type HoldKind = (typeof HOLD_KINDS)[number];

const KIND_SLUGS: Record<HoldKind, string> = {
  "provision-conflict": "conflict",
  "fix-attempt-cap": "fix-cap",
  "worktree-residue": "residue",
  "ci-pending-stalled": "ci-stalled",
};

/**
 * Type guard narrowing a raw CLI string to `HoldKind`. Derived from HOLD_KINDS
 * (the single source of truth) rather than an enumerated `||` chain, so adding
 * a kind above cannot leave a stale second list behind here.
 */
function isHoldKind(k: string): k is HoldKind {
  return (HOLD_KINDS as readonly string[]).includes(k);
}

/** Reserved-but-unimplemented kind slugs (see KIND_SLUGS' doc comment). */
export const RESERVED_KIND_SLUGS: readonly string[] = ["no-progress"];

/** The node-id slug shape provision-node-worktree:79 enforces. */
const NODE_ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The load-bearing closing sentence of every hold body's "How to resolve". */
export const RESOLUTION_SENTENCE =
  "resolve the hold tactic to `phase: done` (then prune) — clearing " +
  "`office_hours` alone does not unblock the source.";

export type Disposition = "NONE" | "EXISTING" | "REOPENED";

export interface HoldDecision {
  disposition: Disposition;
  hold_id: string;
  node?: Record<string, unknown>;
  node_body?: string;
  node_body_append?: string;
  source_blocked_by: string[];
  source_edge_needed: boolean;
}

export interface HoldInput {
  sourceId: string;
  kind: HoldKind;
  reason: string;
  recommendation: string;
  diagnosis: string | null;
  now: string;
}

/**
 * Derive the deterministic hold id and assert it matches the node-id slug shape
 * enforced at .claude/skills/dispatch-propagate/scripts/provision-node-worktree:79.
 * Throws (the CLI turns this into a non-zero exit + stderr) rather than emitting
 * an id the provisioner would later reject.
 */
export function holdIdFor(kind: HoldKind, sourceId: string): string {
  const slug = KIND_SLUGS[kind];
  if (slug === undefined) {
    throw new Error(`hold-node-decide: unknown kind "${kind}"`);
  }
  const id = `tactic-hold-${slug}-${sourceId.replace(/^tactic-/, "")}`;
  if (!NODE_ID_RE.test(id)) {
    throw new Error(
      `hold-node-decide: derived hold id "${id}" does not match the node-id slug ` +
        `shape ${NODE_ID_RE.source} (from source "${sourceId}") — ` +
        `provision-node-worktree would reject it`,
    );
  }
  return id;
}

/** The dated occurrence stanza appended on a re-entry (EXISTING/REOPENED). */
function occurrenceStanza(input: HoldInput, disposition: Disposition): string {
  const lines = [
    ``,
    `## Occurrence ${input.now}`,
    ``,
    `The ${input.kind} hold re-fired for \`${input.sourceId}\`` +
      (disposition === "REOPENED"
        ? ` after this hold had already been resolved — reopened (\`phase\` back to null).`
        : ` while this hold was still open.`),
    ``,
    input.reason.trim(),
    ``,
  ];
  if (input.diagnosis !== null && input.diagnosis.trim() !== "") {
    lines.push(input.diagnosis.trim(), ``);
  }
  return lines.join("\n");
}

/** Build the born-parked hold node object. */
function buildHoldNode(
  holdId: string,
  source: IntentionNode,
  input: HoldInput,
  reopened: boolean,
): Record<string, unknown> {
  const node: Record<string, unknown> = {
    id: holdId,
    kind: "tactic",
    statement:
      `hold: ${input.kind} on \`${input.sourceId}\` — a tracked hold blocking the ` +
      `source until the mechanical retry state is resolved`,
    owner: "ai",
    status: "codified",
    parent: null,
    // Copied verbatim from the source — a hold serves exactly what its source
    // serves; it is never forced onto some chosen strategy.
    serves: [...source.serves],
    execution: null,
    validates: [],
    blocked_by: [],
    office_hours: {
      reason: input.reason,
      since: input.now,
      recommendation: input.recommendation,
    },
    attributes: {
      hold_for: input.sourceId,
      hold_kind: input.kind,
    },
  };
  // A born-parked node carries no phase. On a REOPENED hold the field must be
  // written back to null explicitly, to clear the `done` it currently holds.
  if (reopened) node.phase = null;
  return node;
}

/** Build the markdown body for a freshly born hold node. */
function buildHoldBody(holdId: string, input: HoldInput): string {
  let body =
    `# hold: ${input.kind} on ${input.sourceId}\n\n` +
    `## Context\n\n` +
    `\`${input.sourceId}\` hit a mechanical retry state (\`${input.kind}\`) on ` +
    `${input.now}. A mechanical retry state is not "no autonomous path exists, ` +
    `human required", so the source is NOT parked. Instead this born-parked hold ` +
    `tactic (\`${holdId}\`) carries the park, and \`${input.sourceId}\` gains a ` +
    `\`blocked_by\` edge naming it. The source's own \`office_hours\` is never ` +
    `written.\n\n` +
    `## Reason\n\n` +
    `${input.reason.trim()}\n\n`;

  if (input.diagnosis !== null && input.diagnosis.trim() !== "") {
    body += `## Diagnosis\n\n${input.diagnosis.trim()}\n\n`;
  }

  body +=
    `## How to resolve\n\n` +
    `${input.recommendation.trim()}\n\n` +
    `The \`blocked_by\` edge on \`${input.sourceId}\` clears only when this node ` +
    `leaves the open set: ${RESOLUTION_SENTENCE}\n`;

  return body;
}

/**
 * Decide the hold disposition for `input.sourceId` over the in-memory node set.
 * Pure: reads nothing, writes nothing.
 *
 *  - NONE     — no node at the derived hold id. Emit a fully-constructed
 *               born-parked node + its body.
 *  - EXISTING — a hold node exists with `phase !== "done"`. Emit only a dated
 *               occurrence stanza to append; `office_hours.since` is NOT
 *               refreshed (its age is the signal) and `phase` is untouched.
 *  - REOPENED — a hold node exists at `phase === "done"` (resolved, not yet
 *               pruned). Emit a fresh office_hours record, `phase: null` (back
 *               to the born-parked latch state), and an occurrence stanza.
 */
export function decideHold(nodes: IntentionNode[], input: HoldInput): HoldDecision {
  const holdId = holdIdFor(input.kind, input.sourceId);

  const source = nodes.find((n) => n.id === input.sourceId);
  if (source === undefined) {
    throw new Error(
      `hold-node-decide: source node "${input.sourceId}" is not in the store`,
    );
  }

  const existing = nodes.find((n) => n.id === holdId);
  const disposition: Disposition =
    existing === undefined ? "NONE" : existing.phase === "done" ? "REOPENED" : "EXISTING";

  const sourceEdgeNeeded = !source.blocked_by.includes(holdId);
  const decision: HoldDecision = {
    disposition,
    hold_id: holdId,
    source_blocked_by: sourceEdgeNeeded
      ? [...source.blocked_by, holdId]
      : [...source.blocked_by],
    source_edge_needed: sourceEdgeNeeded,
  };

  if (disposition === "NONE") {
    decision.node = buildHoldNode(holdId, source, input, false);
    decision.node_body = buildHoldBody(holdId, input);
  } else if (disposition === "REOPENED") {
    decision.node = buildHoldNode(holdId, source, input, true);
    decision.node_body_append = occurrenceStanza(input, "REOPENED");
  } else {
    decision.node_body_append = occurrenceStanza(input, "EXISTING");
  }

  return decision;
}

// --- CLI ---------------------------------------------------------------------

interface Args extends HoldInput {
  intentionsDir: string;
}

function fail(message: string): never {
  process.stderr.write(`hold-node-decide: ${message}\n`);
  process.exit(2);
}

function parseArgs(argv: string[]): Args {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = dirname(dirname(dirname(scriptDir)));
  let intentionsDir = join(repoRoot, "intentions");
  let sourceId: string | null = null;
  let kind: string | null = null;
  let reasonFile: string | null = null;
  let recommendationFile: string | null = null;
  let bodyFile: string | null = null;
  let now: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intentions") intentionsDir = argv[++i];
    else if (a === "--source") sourceId = argv[++i];
    else if (a === "--kind") kind = argv[++i];
    else if (a === "--reason-file") reasonFile = argv[++i];
    else if (a === "--recommendation-file") recommendationFile = argv[++i];
    else if (a === "--body-file") bodyFile = argv[++i];
    else if (a === "--now") now = argv[++i];
    else fail(`unknown argument "${a}"`);
  }

  if (sourceId === null || sourceId === "") fail("--source <node-id> is required");
  if (kind === null) {
    fail(`--kind <${HOLD_KINDS.join("|")}> is required`);
  }
  if (!isHoldKind(kind)) {
    fail(`--kind must be one of ${HOLD_KINDS.join("|")}, got "${kind}"`);
  }
  if (reasonFile === null) fail("--reason-file <file> is required");
  if (recommendationFile === null) fail("--recommendation-file <file> is required");

  if (now === null) now = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(now)) {
    fail(`--now must be YYYY-MM-DD, got "${now}"`);
  }

  return {
    intentionsDir,
    sourceId,
    kind,
    // Trimmed: these are multi-line diagnostic files, and a trailing newline
    // would land verbatim in the node's YAML `office_hours.reason`.
    reason: readFileSync(reasonFile, "utf8").trim(),
    recommendation: readFileSync(recommendationFile, "utf8").trim(),
    diagnosis: bodyFile === null ? null : readFileSync(bodyFile, "utf8").trim(),
    now,
  };
}

function main(): void {
  const { intentionsDir, ...input } = parseArgs(process.argv.slice(2));
  const nodes = listNodes(intentionsDir);
  let decision: HoldDecision;
  try {
    decision = decideHold(nodes, input);
  } catch (err) {
    fail(err instanceof Error ? err.message.replace(/^hold-node-decide: /, "") : String(err));
  }
  process.stdout.write(JSON.stringify(decision) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
