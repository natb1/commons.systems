// wait-sweep — the pure enumeration half of the WAIT calendar-release sweep.
//
// A WAIT node is a `tactic` node carrying `attributes.wait_for` (the source
// node id it blocks) and `attributes.wait_until` (the ISO 8601 UTC release
// instant), NAMED by the canonical derivation `waitIdFor(wait_for)` (see
// `waits.ts`); the source names the WAIT in its `blocked_by` list. Releasing a
// WAIT means transitioning it to `phase: done` while the source's
// `blocked_by` edge survives BY DESIGN — that surviving edge is what lets a
// future re-arm put the WAIT back to work in place, without re-deriving a new
// id or re-wiring the edge from scratch.
//
// This module answers only "which WAIT nodes are there, and what should the
// sweep do with each?". It performs no filesystem, git, or network access:
// everything it decides on comes from the `nodes` array and `nowMs` it is
// handed.

import type { IntentionNode } from "./schema.js";
import { WAIT_ATTEMPT_CAP, isWaitNode, parseWaitUntil } from "./waits.js";

/**
 * What the sweep must do with a WAIT node:
 *
 *  - `due`       — `wait_until` has passed and the attempt cap has not been
 *                  reached: the sweep should release (re-arm in place).
 *  - `waiting`   — `wait_until` has not yet passed: leave it alone.
 *  - `capped`    — `wait_until` has passed but `wait_attempts` has already
 *                  reached `WAIT_ATTEMPT_CAP`: escalate to the author instead
 *                  of releasing again.
 *  - `malformed` — the node's shape does not fit the WAIT vocabulary (a
 *                  non-done, non-null `phase`; an unparseable `wait_until`;
 *                  or a corrupted `wait_attempts`). Reported for visibility
 *                  only; the sweep must never guess a value to make a
 *                  malformed node actionable.
 */
export type WaitClass = "due" | "waiting" | "capped" | "malformed";

/** One classified WAIT: the WAIT node, the source it blocks, and its bucket. */
export interface WaitCandidate {
  waitId: string;
  sourceId: string;
  attempts: number;
  waitUntil: number;
  cls: WaitClass;
}

/**
 * Enumerate and classify every WAIT node in `nodes`.
 *
 * Pure: no filesystem, git, or network access — the whole decision is made
 * from the passed-in node array and `nowMs`, so it is offline-testable with
 * in-memory fixtures.
 *
 * For each node, in order:
 *
 *  1. Skip unless `isWaitNode(node)` — see `waits.ts` for why that check is a
 *     security property (canonical-id binding), not a tidiness check.
 *  2. Look up `attributes.wait_for` in `nodes`. Source absent → emit nothing;
 *     an orphan WAIT has nothing to hold, and a census sweep elsewhere is
 *     responsible for collecting it.
 *  3. Source present but its `blocked_by` does not contain the WAIT's own id
 *     → emit nothing; the edge is already detached.
 *  4. `node.phase === "done"` → emit nothing. This is the normal, quiescent
 *     post-release state: the surviving `blocked_by` edge is BY DESIGN here
 *     (it is what makes re-arm-in-place work), unlike a hold's edge-residue —
 *     a released-but-not-yet-rearmed WAIT must NOT be reported as debt.
 *  5. `node.phase !== null` (any other, non-done phase) → `malformed`. A
 *     future validate-graph rule makes this state unlandable via normal
 *     writes, so it can only appear in a hand-edited tree; report it for
 *     visibility, never act on it.
 *  6. `parseWaitUntil(node.attributes.wait_until)` is `null` → `malformed`.
 *     NEVER default a missing or garbled `wait_until` to "now" — that would
 *     be a silent-pass failure that releases a WAIT nobody set a deadline
 *     for.
 *  7. `node.attributes.wait_attempts` becomes `attempts` only when it is an
 *     integer `>= 1`; otherwise `malformed`. NEVER default a missing or
 *     non-integer counter to `1` — that would silently reset the attempt cap
 *     for a node whose counter was corrupted.
 *  8. `node.office_hours !== null` → emit nothing. The cap-park already fired
 *     for this node; the author owns it now, and the sweep must not re-park
 *     or release it out from under them.
 *  9. `nowMs >= waitUntil` AND `attempts >= WAIT_ATTEMPT_CAP` → `capped`.
 * 10. `nowMs >= waitUntil` → `due`.
 * 11. Otherwise → `waiting`.
 *
 * @param nodes The loaded graph nodes (as from `listNodes`).
 * @param nowMs The current instant, in epoch milliseconds.
 * @returns One candidate per classified WAIT, sorted by `waitId` ascending.
 */
export function listWaitCandidates(nodes: IntentionNode[], nowMs: number): WaitCandidate[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const candidates: WaitCandidate[] = [];

  for (const node of nodes) {
    if (!isWaitNode(node)) continue;

    const sourceId = node.attributes.wait_for as string;
    const source = byId.get(sourceId);
    if (source === undefined) continue; // orphan WAIT: nothing to hold

    if (!source.blocked_by.includes(node.id)) continue; // edge already detached

    if (node.phase === "done") continue; // quiescent post-release state, BY DESIGN

    let cls: WaitClass | undefined;
    let attempts = 0;
    let waitUntil = 0;

    if (node.phase !== null) {
      cls = "malformed";
    } else {
      const parsed = parseWaitUntil(node.attributes.wait_until);
      if (parsed === null) {
        // NEVER default a missing/garbled wait_until to "now" — that would be
        // a silent-pass failure.
        cls = "malformed";
      } else {
        waitUntil = parsed;
        const rawAttempts = node.attributes.wait_attempts;
        if (typeof rawAttempts !== "number" || !Number.isInteger(rawAttempts) || rawAttempts < 1) {
          // NEVER default a missing/non-integer counter to 1 — a corrupted
          // counter must not silently reset the cap.
          cls = "malformed";
        } else {
          attempts = rawAttempts;
        }
      }
    }

    if (cls === undefined) {
      if (node.office_hours !== null) continue; // cap-park already fired; author owns it

      const due = nowMs >= waitUntil;
      cls = due && attempts >= WAIT_ATTEMPT_CAP ? "capped" : due ? "due" : "waiting";
    }

    candidates.push({ waitId: node.id, sourceId, attempts, waitUntil, cls });
  }

  candidates.sort((a, b) => (a.waitId < b.waitId ? -1 : a.waitId > b.waitId ? 1 : 0));
  return candidates;
}
