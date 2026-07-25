// Office-hours queue selection — pure functions over an in-memory node set.
//
// No fs, no env, no network, no daemon: selection and ordering are computed
// entirely from the validated nodes handed in. The graph is the recovery
// artifact (a parked node is one whose `office_hours` frontmatter is non-null),
// so this module needs nothing beyond the nodes to decide what to launch.

import type { IntentionNode, SessionType } from "./schema.js";
import { resolveAttention } from "./attention.js";

/** Soft rank multiplier for penalized session types; author-tunable. */
export const SESSION_TYPE_PENALTY = 0.5;

/** One parked node as it appears in the ordered queue. */
export interface QueueMember {
  nodeId: string;
  /** Resolved attention rank; a node absent from the attention map ranks 0. */
  rank: number;
  sessionType: SessionType;
  since: string;
}

/**
 * The parked nodes (`office_hours !== null`) in selection order: resolved
 * attention rank descending, id ascending on ties.
 *
 * `resolveAttention` returns an unordered Map, so the ordering is imposed here.
 *
 * Rank is soft-penalized by session type: `requirement-discovery` and
 * `curriculum-review` nodes rank at `SESSION_TYPE_PENALTY` of their raw
 * attention rank; `other` nodes rank at their raw value. This is soft, not a
 * hard tier — a sufficiently boosted penalized node can still overtake an
 * `other` node in the sort below.
 *
 * When `sessionType` is provided, only parked nodes whose
 * `office_hours.session_type` matches are included.
 */
export function officeHoursQueue(nodes: IntentionNode[], sessionType?: SessionType): QueueMember[] {
  const attention = resolveAttention(nodes);
  const members: QueueMember[] = [];
  for (const n of nodes) {
    // A `continue` guard narrows office_hours to non-null for the body below —
    // no cast, and `.since` type-checks.
    if (n.office_hours === null) continue;
    const st = n.office_hours.session_type;
    if (sessionType !== undefined && st !== sessionType) continue;
    const penalty =
      st === "requirement-discovery" || st === "curriculum-review" ? SESSION_TYPE_PENALTY : 1;
    const rawRank = attention.get(n.id)?.value ?? 0;
    members.push({
      nodeId: n.id,
      rank: rawRank * penalty,
      sessionType: st,
      since: n.office_hours.since,
    });
  }
  return members.sort(
    (a, b) => b.rank - a.rank || (a.nodeId < b.nodeId ? -1 : a.nodeId > b.nodeId ? 1 : 0),
  );
}

/** An unresolved `blocked_by` edge of a parked node. */
export interface OpenBlocker {
  id: string;
  /** True when the blocker id resolves to no node in the set (fail-visible). */
  missing: boolean;
}

/**
 * The `blocked_by` targets of `nodeId` that are not yet cleared: a target
 * missing from the set (reported fail-visible) or one whose `phase !== "done"`.
 * A blocker already at `phase: "done"` is excluded. Advisory only — never a gate.
 */
export function openBlockers(nodes: IntentionNode[], nodeId: string): OpenBlocker[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const node = byId.get(nodeId);
  if (node === undefined) return [];
  const out: OpenBlocker[] = [];
  for (const b of node.blocked_by) {
    const target = byId.get(b);
    if (target === undefined) {
      out.push({ id: b, missing: true });
    } else if (target.phase !== "done") {
      out.push({ id: b, missing: false });
    }
  }
  return out;
}

/** The disposition of a selection: what the entry script must do next. */
export type OfficeHoursSelection =
  | { kind: "launch"; nodeId: string; blockers: OpenBlocker[] }
  | { kind: "empty" }
  | { kind: "not-parked"; nodeId: string };

/**
 * Select a parked node to launch.
 *
 * No `target`: the queue head (highest rank), or `empty` when nothing is parked.
 * With `target`: single-item mode — `launch` when that node is parked,
 * `not-parked` when it is absent or its `office_hours` is null.
 *
 * `sessionType` applies ONLY to the no-target (queue-head) branch, where it is
 * threaded into `officeHoursQueue` as a filter. Targeting is by id and session
 * type is a queue-ordering concern, so the two are mutually exclusive: passing
 * both throws. Silently ignoring one of two explicitly-supplied arguments would
 * hide a caller mistake behind a plausible-looking result, and this function is
 * exported from the package index — see `.claude/rules/code-style.md` on
 * validating input at public API boundaries.
 *
 * The CLI (`packages/intentionsutil/scripts/office-hours-select.ts`) already
 * rejects `--type` together with a positional node-id at the argument-parsing
 * stage, so the throw is reachable only from a non-CLI caller.
 */
export function selectOfficeHours(
  nodes: IntentionNode[],
  target?: string,
  sessionType?: SessionType,
): OfficeHoursSelection {
  if (target !== undefined && sessionType !== undefined) {
    throw new Error(
      `selectOfficeHours: target ("${target}") and sessionType ("${sessionType}") are mutually exclusive — ` +
        "targeting selects by id, session type filters the queue head",
    );
  }
  if (target !== undefined) {
    const node = nodes.find((n) => n.id === target);
    if (node === undefined || node.office_hours === null) {
      return { kind: "not-parked", nodeId: target };
    }
    return { kind: "launch", nodeId: target, blockers: openBlockers(nodes, target) };
  }
  const queue = officeHoursQueue(nodes, sessionType);
  if (queue.length === 0) return { kind: "empty" };
  const head = queue[0].nodeId;
  return { kind: "launch", nodeId: head, blockers: openBlockers(nodes, head) };
}
