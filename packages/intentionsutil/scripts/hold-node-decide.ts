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
import { listNodesStrict } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";
import {
  HOLD_KINDS,
  holdIdFor,
  isHoldKind,
  RESERVED_KIND_SLUGS,
  RESOLUTION_SENTENCE,
  type HoldKind,
} from "../src/holds.js";

// The hold-kind vocabulary now lives in ../src/holds.ts so re-check consumers
// can import it without pulling in this producer CLI. Re-exported here under
// its original names, so this module's public surface is unchanged.
export {
  HOLD_KINDS,
  holdIdFor,
  RESERVED_KIND_SLUGS,
  RESOLUTION_SENTENCE,
  type HoldKind,
};

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
  // STRICT enumeration: the hold decision is a gate (find-or-create an existing
  // hold, then wire the source's blocked_by edge). A hold node dropped by the
  // tolerant reader would look absent, minting a duplicate hold and losing the
  // existing edge — so a corrupt file must refuse loudly instead of vanishing.
  const nodes = listNodesStrict(intentionsDir);
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
