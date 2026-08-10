// waits — the tracked-wait vocabulary: the WAIT node id-slug mapping, the
// deterministic wait-id derivation, the `wait_until` instant parse, and the
// finite re-arm attempt cap.
//
// This module is the single source of truth for that vocabulary. A future
// pure enumerator (the sweep predicate half) and a future shell sweep (the
// tick-driven release/re-arm half) both import from here rather than
// re-deriving it.

import type { IntentionNode } from "./schema.js";

/**
 * The finite re-arm attempt cap: a WAIT node re-arms in place on repeat
 * not-yet-observed verdicts, but only up to this many attempts before it
 * escalates to the author instead of re-arming again. Imported by both the
 * pure enumerator and the shell sweep, so the cap has one home here.
 */
export const WAIT_ATTEMPT_CAP = 4;

/**
 * The maximum wait HORIZON, in days: no WAIT may be armed for an instant more
 * than this far in the future, and no WAIT may stay continuously armed for
 * longer than this without escalating.
 *
 * Why a horizon exists at all. `WAIT_ATTEMPT_CAP` bounds only the
 * release/re-arm CYCLE — it counts arm→due→release→re-arm rounds. It does not
 * bound a wait that is never due: an `--until` far enough in the future (the
 * degenerate case, `9999-12-31T23:59:59Z`) is armed once, classified `waiting`
 * on every sweep forever, never reaches `capped`, and never escalates — while
 * its `blocked_by` edge keeps the SOURCE permanently unselectable. The same
 * hole opens one day at a time when a caller EXTENDS a still-armed wait before
 * each deadline arrives: an extension is deliberately not a new attempt, so the
 * attempt counter never moves. Either way the result is an indefinite,
 * unmonitored denial of work on an arbitrary node, arm-able with one command.
 *
 * The horizon closes both: `decideWait` refuses an `--until` beyond it (and
 * refuses an EXTEND that pushes `wait_until` beyond `wait_armed_since` + the
 * horizon), validate-graph rule 21 refuses a hand-landed node that exceeds it,
 * and `listWaitCandidates` classifies an over-horizon or too-long-armed WAIT
 * `capped` — which the tick sweep escalates to office-hours — so a hold that
 * outlives the horizon becomes VISIBLE rather than silent.
 *
 * 30 days is deliberately generous: the design's own default wait is 24h, so a
 * legitimate calendar-release predicate lands far inside it. A genuinely longer
 * wait is not forbidden, it is merely not SILENT — it re-arms, or it escalates
 * to the author who can extend it deliberately.
 */
export const WAIT_MAX_HORIZON_DAYS = 30;

/** `WAIT_MAX_HORIZON_DAYS` in milliseconds, the unit every comparison uses. */
export const WAIT_MAX_HORIZON_MS = WAIT_MAX_HORIZON_DAYS * 24 * 60 * 60 * 1000;

/** The id prefix every WAIT node carries. */
export const WAIT_ID_PREFIX = "tactic-wait-";

/** The node-id slug shape provision-node-worktree:79 enforces. */
const NODE_ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The load-bearing closing sentence every WAIT node body ends with. */
export const WAIT_RELEASE_SENTENCE =
  "the tick sweep releases this node to `phase: done` when `attributes.wait_until` " +
  "passes — do not clear the source's `blocked_by` by hand, and do not park this " +
  "node while it is armed.";

/**
 * Derive the deterministic wait id and assert it matches the node-id slug shape
 * enforced at .claude/skills/dispatch-propagate/scripts/provision-node-worktree:79.
 * Throws (rather than emitting an id the provisioner would later reject) because
 * an id that doesn't fit the slug shape is doomed regardless of what calls it —
 * failing fast at derivation time is better than failing later, further from the
 * cause, inside the provisioner.
 */
export function waitIdFor(sourceId: string): string {
  const id = `${WAIT_ID_PREFIX}${sourceId.replace(/^tactic-/, "")}`;
  if (!NODE_ID_RE.test(id)) {
    throw new Error(
      `waits: derived wait id "${id}" does not match the node-id slug shape ` +
        `${NODE_ID_RE.source} (from source "${sourceId}") — provision-node-worktree ` +
        `would reject it`,
    );
  }
  return id;
}

/**
 * The `attributes.wait_until` shape: an ISO 8601 UTC instant, e.g.
 * `2026-08-06T00:00:00Z`.
 *
 * Deliberately NOT date-only (`YYYY-MM-DD`) validation like other date fields
 * in this codebase (e.g. `office_hours.since`) use. A WAIT node's default wait
 * duration is 24h and the tick sweep re-checks at tick granularity, so the
 * release predicate needs sub-day precision — the design specifies an ISO 8601
 * UTC instant, not a calendar date.
 */
export const WAIT_UNTIL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/**
 * Parse a WAIT instant — `attributes.wait_until` or `attributes.
 * wait_armed_since`, which share one shape — into epoch milliseconds, or
 * `null` when `value` is not a string, does not match `WAIT_UNTIL_RE`, or
 * fails to parse (`Date.parse` yields `NaN`).
 */
export function parseWaitUntil(value: unknown): number | null {
  if (typeof value !== "string" || !WAIT_UNTIL_RE.test(value)) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Whether `node` is a real, canonically-identified WAIT node.
 *
 * Load-bearing, not cosmetic — the security property mirrors
 * `hold-sweep.ts`'s `isCanonicalHoldId`. A future sweep enumerates nodes BY
 * THEIR OWN ID, while a downstream writer derives the wait id FROM the
 * source id (`waitIdFor(wait_for)`) — so a decoy `kind: tactic` node that
 * happens to carry `attributes.wait_for` under a non-canonical id must NOT be
 * classified as a real WAIT node, or that classification (release, re-arm,
 * escalate) would misapply to the wrong node identity: the decoy, not the
 * genuine wait it impersonates.
 *
 * `waitIdFor` throws when the derivation does not fit the node-id slug shape
 * (e.g. a `wait_for` carrying characters the slug regex rejects); that throw
 * is caught here and treated as a non-match, since this is a boolean
 * predicate, not a validator — a malformed `wait_for` just means "not a wait
 * node", not a sweep-wide failure.
 */
export function isWaitNode(node: IntentionNode): boolean {
  if (node.kind !== "tactic") return false;
  const sourceId = node.attributes?.wait_for;
  if (typeof sourceId !== "string" || sourceId === "") return false;
  try {
    return node.id === waitIdFor(sourceId);
  } catch {
    return false;
  }
}
