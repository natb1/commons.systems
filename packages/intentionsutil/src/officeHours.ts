// Office-hours queue selection — pure functions over an in-memory node set.
//
// No fs, no env, no network, no daemon: selection and ordering are computed
// entirely from the validated nodes handed in. The graph is the recovery
// artifact (a parked node is one whose `office_hours` frontmatter is non-null),
// so this module needs nothing beyond the nodes to decide what to launch.

import type { IntentionNode } from "./schema.js";
import { resolveAttention } from "./attention.js";

/** One parked node as it appears in the ordered queue. */
export interface QueueMember {
  nodeId: string;
  /** Resolved attention rank; a node absent from the attention map ranks 0. */
  rank: number;
  since: string;
}

/**
 * The parked nodes (`office_hours !== null`) in selection order: resolved
 * attention rank descending, id ascending on ties.
 *
 * `resolveAttention` returns an unordered Map, so the ordering is imposed here.
 */
export function officeHoursQueue(nodes: IntentionNode[]): QueueMember[] {
  const attention = resolveAttention(nodes);
  const members: QueueMember[] = [];
  for (const n of nodes) {
    // A `continue` guard narrows office_hours to non-null for the body below —
    // no cast, and `.since` type-checks.
    if (n.office_hours === null) continue;
    members.push({
      nodeId: n.id,
      rank: attention.get(n.id)?.value ?? 0,
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
 */
export function selectOfficeHours(
  nodes: IntentionNode[],
  target?: string,
): OfficeHoursSelection {
  if (target !== undefined) {
    const node = nodes.find((n) => n.id === target);
    if (node === undefined || node.office_hours === null) {
      return { kind: "not-parked", nodeId: target };
    }
    return { kind: "launch", nodeId: target, blockers: openBlockers(nodes, target) };
  }
  const queue = officeHoursQueue(nodes);
  if (queue.length === 0) return { kind: "empty" };
  const head = queue[0].nodeId;
  return { kind: "launch", nodeId: head, blockers: openBlockers(nodes, head) };
}
