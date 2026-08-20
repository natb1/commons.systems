// wait-node-decide — decide what a "tracked wait" looks like for a source
// node that is waiting on a calendar-release predicate (a not-yet-observed
// verdict that only becomes checkable after some `wait_until` instant
// passes). This is the network-free, testable DECISION half; a bash caller
// owns the LANDING half (write-node.ts + graph-commit), mirroring the
// decision/land split of hold-node-decide.ts and graph-census-debt.ts.
//
// Doctrine: a WAIT is a mechanical retry state, not a park — the source's own
// `office_hours` is never written by this tool. Instead the producer
// births (or re-arms) a small WAIT tactic at the deterministic id
// `waitIdFor(source)` and adds a `blocked_by` edge from the source to it. A
// WAIT node is born unparked (`office_hours: null`) and only gains a park
// after the finite re-arm attempt cap (`WAIT_ATTEMPT_CAP`, see
// `../src/waits.ts`) is exhausted — that cap-park write is out of scope for
// this tool too (a later unit's tick sweep owns it); this tool refuses to
// re-arm a node that already carries one.
//
// The wait id is DETERMINISTIC: `waitIdFor(source)` (see `../src/waits.ts`),
// which makes find-or-create idempotent by mere existence.
//
// Bounded horizon: `--until` is refused when it is more than
// `WAIT_MAX_HORIZON_DAYS` (../src/waits.ts) beyond `--now`, and an EXTEND is
// refused when it would keep the wait continuously armed past that horizon
// (measured from `attributes.wait_armed_since`, which this tool stamps on NONE
// and REARM and never rewrites on EXTEND). Both refusals close the same hole:
// the attempt cap counts release/re-arm cycles, so it can never fire on a wait
// that is never due — the source would stay blocked, unobserved, forever.
//
// Usage:
//   node --import tsx/esm wait-node-decide.ts --source <id> --until <iso>
//     --reason-file <f> --recommendation-file <f> [--body-file <f>]
//     [--now <iso>] [--intentions <dir>]
//
// Stdout: one JSON object:
//   { disposition, wait_id, node?, node_body?, node_body_append?,
//     source_blocked_by, source_edge_needed }

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodesStrict } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";
import {
  WAIT_MAX_HORIZON_DAYS,
  WAIT_MAX_HORIZON_MS,
  WAIT_RELEASE_SENTENCE,
  waitIdFor,
  parseWaitUntil,
} from "../src/waits.js";

export type Disposition = "NONE" | "REARM" | "EXTEND";

export interface WaitDecision {
  disposition: Disposition;
  wait_id: string;
  node?: Record<string, unknown>;
  node_body?: string;
  node_body_append?: string;
  source_blocked_by: string[];
  source_edge_needed: boolean;
}

export interface WaitInput {
  sourceId: string;
  until: string; // ISO 8601 UTC instant, the new attributes.wait_until
  reason: string;
  recommendation: string;
  diagnosis: string | null;
  now: string; // full ISO instant (unlike hold-node-decide.ts's date-only `now`)
}

/** The dated re-arm stanza appended when a done WAIT re-arms in place. */
function rearmStanza(input: WaitInput, attempts: number): string {
  const lines = [
    ``,
    `## Arm ${input.now}`,
    ``,
    `\`${input.sourceId}\`'s wait re-armed after a not-yet-observed verdict. ` +
      `New \`wait_until\`: \`${input.until}\`. Attempt ${attempts}.`,
    ``,
    input.reason.trim(),
    ``,
  ];
  if (input.diagnosis !== null && input.diagnosis.trim() !== "") {
    lines.push(input.diagnosis.trim(), ``);
  }
  return lines.join("\n");
}

/** The dated extension stanza appended when a still-armed WAIT is extended. */
function extendStanza(input: WaitInput): string {
  const lines = [
    ``,
    `## Extend ${input.now}`,
    ``,
    `\`${input.sourceId}\`'s wait was extended while still armed (not a new ` +
      `attempt). New \`wait_until\`: \`${input.until}\`.`,
    ``,
    input.reason.trim(),
    ``,
  ];
  if (input.diagnosis !== null && input.diagnosis.trim() !== "") {
    lines.push(input.diagnosis.trim(), ``);
  }
  return lines.join("\n");
}

/** Build the freshly-minted WAIT node object. */
function buildWaitNode(
  waitId: string,
  source: IntentionNode,
  input: WaitInput,
): Record<string, unknown> {
  return {
    id: waitId,
    kind: "tactic",
    statement:
      `wait: \`${input.sourceId}\` is waiting on a calendar-release predicate — ` +
      `the tick sweep releases this node once \`attributes.wait_until\` passes`,
    owner: "ai",
    status: "codified",
    parent: null,
    // Copied verbatim from the source — a wait serves exactly what its source
    // serves; it is never forced onto some chosen strategy.
    serves: [...source.serves],
    execution: null,
    validates: [],
    blocked_by: [],
    // A WAIT is born unparked — unlike a hold, which is born-parked. It only
    // gains office_hours after the re-arm attempt cap is exhausted.
    office_hours: null,
    phase: null,
    attributes: {
      wait_for: input.sourceId,
      wait_until: input.until,
      // The instant this arming CYCLE began. `wait_attempts` counts
      // release/re-arm rounds and deliberately does not move on an EXTEND, so
      // it cannot bound a wait that is extended forever without ever coming
      // due. `wait_armed_since` is what does: it survives every extension
      // untouched, so the sweep can escalate on cumulative armed AGE rather
      // than only on repeated release/re-arm cycles. Reset on a REARM (a
      // released wait that re-arms is a genuinely new cycle), never on an
      // EXTEND.
      wait_armed_since: input.now,
      wait_attempts: 1,
      wait_reason: input.reason,
      wait_recommendation: input.recommendation,
    },
  };
}

/** Build the markdown body for a freshly minted WAIT node. */
function buildWaitBody(waitId: string, input: WaitInput): string {
  let body =
    `# wait: ${input.sourceId}\n\n` +
    `## Context\n\n` +
    `\`${input.sourceId}\` is waiting on a calendar-release predicate as of ` +
    `${input.now}. This is a mechanical retry state, not "no autonomous path ` +
    `exists, human required", so the source is NOT parked. Instead this ` +
    `born-unparked wait tactic (\`${waitId}\`) carries the wait, and ` +
    `\`${input.sourceId}\` gains a \`blocked_by\` edge naming it. The source's ` +
    `own \`office_hours\` is never written.\n\n` +
    `## Reason\n\n` +
    `${input.reason.trim()}\n\n`;

  if (input.diagnosis !== null && input.diagnosis.trim() !== "") {
    body += `## Diagnosis\n\n${input.diagnosis.trim()}\n\n`;
  }

  body +=
    `## How to recheck\n\n` +
    `${input.recommendation.trim()}\n\n` +
    `Currently waiting until \`${input.until}\` (attempt 1). ${WAIT_RELEASE_SENTENCE}\n`;

  return body;
}

/**
 * Decide the wait disposition for `input.sourceId` over the in-memory node
 * set. Pure: reads nothing, writes nothing.
 *
 *  - NONE   — no node at the derived wait id. Emit a fully-constructed,
 *             born-unparked node + its body.
 *  - REARM  — a wait node exists with `phase === "done"`. Emit only the
 *             fields that change: `phase: null` and refreshed attributes
 *             (`wait_until`, incremented `wait_attempts`, refreshed
 *             `wait_reason`/`wait_recommendation`), plus a dated `## Arm`
 *             stanza to append.
 *  - EXTEND — a wait node exists with `phase === null` and `office_hours ===
 *             null` (still armed). Emit only `attributes.wait_until`
 *             changed — `wait_attempts` is NOT incremented, since extending
 *             a live wait is not a new attempt — plus a backfilled
 *             `wait_armed_since` when the existing node carries none. Emit a
 *             dated `## Extend` stanza to append.
 *
 * Throws when: the source is absent from the store; `until` fails
 * `parseWaitUntil` validation; `until`'s parsed instant is not strictly
 * after `now`'s parsed instant; `until` is more than `WAIT_MAX_HORIZON_DAYS`
 * beyond `now` (an over-horizon wait never comes due, so it never reaches the
 * attempt cap and never escalates); an EXTEND would push `until` more than
 * `WAIT_MAX_HORIZON_DAYS` past the existing node's `wait_armed_since` (the
 * unbounded-extension loop the attempt cap cannot see); or the existing node
 * at the derived wait id carries a non-null `office_hours` (the cap-park
 * already fired — re-arming would erase the escalation; the caller must
 * `clear-park` first).
 */
export function decideWait(nodes: IntentionNode[], input: WaitInput): WaitDecision {
  const waitId = waitIdFor(input.sourceId);

  const source = nodes.find((n) => n.id === input.sourceId);
  if (source === undefined) {
    throw new Error(
      `wait-node-decide: source node "${input.sourceId}" is not in the store`,
    );
  }

  const untilMs = parseWaitUntil(input.until);
  if (untilMs === null) {
    throw new Error(
      `wait-node-decide: --until "${input.until}" is not a valid ISO 8601 UTC ` +
        `instant of the form YYYY-MM-DDTHH:MM:SSZ`,
    );
  }
  const nowMs = parseWaitUntil(input.now);
  if (nowMs === null) {
    throw new Error(
      `wait-node-decide: --now "${input.now}" is not a valid ISO 8601 UTC instant ` +
        `of the form YYYY-MM-DDTHH:MM:SSZ`,
    );
  }
  if (untilMs <= nowMs) {
    throw new Error(
      `wait-node-decide: --until "${input.until}" must be strictly after --now ` +
        `"${input.now}"`,
    );
  }
  // The upper bound. Without it, an `--until` far enough out is armed once and
  // classified `waiting` on every sweep forever: never due, so never `capped`,
  // so never escalated — an indefinite, unmonitored block on the source. See
  // WAIT_MAX_HORIZON_DAYS in ../src/waits.ts.
  if (untilMs - nowMs > WAIT_MAX_HORIZON_MS) {
    throw new Error(
      `wait-node-decide: --until "${input.until}" is more than ` +
        `${WAIT_MAX_HORIZON_DAYS} days after --now "${input.now}" — a wait ` +
        `armed beyond that horizon would never come due, so it would never ` +
        `reach the attempt cap and never escalate; arm a nearer instant and ` +
        `let the wait re-arm, or park the source deliberately if it genuinely ` +
        `needs a human on a longer clock`,
    );
  }

  const existing = nodes.find((n) => n.id === waitId);
  if (existing !== undefined && existing.office_hours !== null) {
    throw new Error(
      `wait-node-decide: "${waitId}" already carries a non-null office_hours — ` +
        `the re-arm attempt cap already fired, so re-arming here would erase ` +
        `that escalation; clear the park first`,
    );
  }

  const disposition: Disposition =
    existing === undefined ? "NONE" : existing.phase === "done" ? "REARM" : "EXTEND";

  const sourceEdgeNeeded = !source.blocked_by.includes(waitId);
  const decision: WaitDecision = {
    disposition,
    wait_id: waitId,
    source_blocked_by: sourceEdgeNeeded
      ? [...source.blocked_by, waitId]
      : [...source.blocked_by],
    source_edge_needed: sourceEdgeNeeded,
  };

  if (disposition === "NONE") {
    decision.node = buildWaitNode(waitId, source, input);
    decision.node_body = buildWaitBody(waitId, input);
  } else if (existing !== undefined && disposition === "REARM") {
    const priorAttempts = existing.attributes.wait_attempts;
    const attempts =
      typeof priorAttempts === "number" && Number.isInteger(priorAttempts) && priorAttempts >= 1
        ? priorAttempts + 1
        : 1;
    decision.node = {
      phase: null,
      attributes: {
        wait_until: input.until,
        // A REARM starts a genuinely new arming cycle — the previous one ended
        // when the sweep released the wait and the source became selectable
        // again — so the armed-age clock restarts here. The bound that governs
        // repeated re-arms is `wait_attempts`/WAIT_ATTEMPT_CAP, incremented
        // just above.
        wait_armed_since: input.now,
        wait_attempts: attempts,
        wait_reason: input.reason,
        wait_recommendation: input.recommendation,
      },
    };
    decision.node_body_append = rearmStanza(input, attempts);
  } else {
    // EXTEND. `wait_armed_since` is deliberately NOT refreshed: the whole point
    // of the field is that it survives extension, so cumulative suppression is
    // bounded even though `wait_attempts` never moves on this path. A wait that
    // predates the field (or carries a garbled one) gets it backfilled at
    // `now`, which starts the clock rather than leaving it unbounded.
    const armedSinceMs = parseWaitUntil(existing?.attributes.wait_armed_since);
    if (armedSinceMs !== null && untilMs - armedSinceMs > WAIT_MAX_HORIZON_MS) {
      throw new Error(
        `wait-node-decide: extending "${waitId}" to "${input.until}" would keep ` +
          `it continuously armed for more than ${WAIT_MAX_HORIZON_DAYS} days ` +
          `(armed since "${existing?.attributes.wait_armed_since}") — extension ` +
          `is not a new attempt, so an unbounded extension loop would suppress ` +
          `"${input.sourceId}" forever without ever reaching the attempt cap; ` +
          `let the wait come due and re-arm, or escalate it deliberately`,
      );
    }
    decision.node = {
      attributes:
        armedSinceMs === null
          ? { wait_until: input.until, wait_armed_since: input.now }
          : { wait_until: input.until },
    };
    decision.node_body_append = extendStanza(input);
  }

  return decision;
}

// --- CLI ---------------------------------------------------------------------

interface Args extends WaitInput {
  intentionsDir: string;
}

function fail(message: string): never {
  process.stderr.write(`wait-node-decide: ${message}\n`);
  process.exit(2);
}

function parseArgs(argv: string[]): Args {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = dirname(dirname(dirname(scriptDir)));
  let intentionsDir = join(repoRoot, "intentions");
  let sourceId: string | null = null;
  let until: string | null = null;
  let reasonFile: string | null = null;
  let recommendationFile: string | null = null;
  let bodyFile: string | null = null;
  let now: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intentions") intentionsDir = argv[++i];
    else if (a === "--source") sourceId = argv[++i];
    else if (a === "--until") until = argv[++i];
    else if (a === "--reason-file") reasonFile = argv[++i];
    else if (a === "--recommendation-file") recommendationFile = argv[++i];
    else if (a === "--body-file") bodyFile = argv[++i];
    else if (a === "--now") now = argv[++i];
    else fail(`unknown argument "${a}"`);
  }

  if (sourceId === null || sourceId === "") fail("--source <node-id> is required");
  if (until === null || until === "") fail("--until <iso-instant> is required");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(until)) {
    fail(`--until must be an ISO 8601 UTC instant (YYYY-MM-DDTHH:MM:SSZ), got "${until}"`);
  }
  if (reasonFile === null) fail("--reason-file <file> is required");
  if (recommendationFile === null) fail("--recommendation-file <file> is required");

  if (now === null) now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  return {
    intentionsDir,
    sourceId,
    until,
    // Trimmed: these are multi-line diagnostic files, and a trailing newline
    // would land verbatim in the node's YAML attributes.
    reason: readFileSync(reasonFile, "utf8").trim(),
    recommendation: readFileSync(recommendationFile, "utf8").trim(),
    diagnosis: bodyFile === null ? null : readFileSync(bodyFile, "utf8").trim(),
    now,
  };
}

function main(): void {
  const { intentionsDir, ...input } = parseArgs(process.argv.slice(2));
  // STRICT enumeration: the wait decision is a gate (find-or-create an
  // existing wait, then wire the source's blocked_by edge). A wait node
  // dropped by the tolerant reader would look absent, minting a duplicate
  // wait and losing the existing edge — so a corrupt file must refuse loudly
  // instead of vanishing.
  const nodes = listNodesStrict(intentionsDir);
  let decision: WaitDecision;
  try {
    decision = decideWait(nodes, input);
  } catch (err) {
    fail(err instanceof Error ? err.message.replace(/^wait-node-decide: /, "") : String(err));
  }
  process.stdout.write(JSON.stringify(decision) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
