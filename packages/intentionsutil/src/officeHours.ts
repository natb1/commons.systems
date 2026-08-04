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
  /**
   * The queue's ordering rank: the session-type-penalized value of the
   * surfacing key — the lexicographic max of the node's own resolved
   * `(tier, value)` and that of every non-`done` node it blocks. A node absent
   * from the attention map ranks 0.
   */
  rank: number;
  /**
   * The queue's ordering tier: the tier of the surfacing key (see `rank`). A
   * node absent from the attention map defaults to tier 1, matching
   * `resolveAttention`'s default tier. The hard outer sort key — see
   * `officeHoursQueue`.
   */
  tier: number;
  /** The node's OWN resolved tier, before any blocked-source lift. */
  ownTier: number;
  /** The node's OWN penalized rank, before any blocked-source lift. */
  ownRank: number;
  /**
   * The id of the blocking source whose `(tier, value)` lifted this member's
   * key, or `null` when nothing it blocks outranks it.
   */
  liftedFrom: string | null;
  sessionType: SessionType;
  since: string;
}

/**
 * The parked nodes (`office_hours !== null`) in selection order: resolved
 * attention tier descending (a hard outer axis), then session-type-penalized
 * rank descending, then id ascending on ties.
 *
 * `resolveAttention` returns an unordered Map, so the ordering is imposed here.
 *
 * The attention tier is a hard outer axis: a higher-tier node always sorts
 * ahead of a lower-tier node, regardless of rank. Within a tier, rank is soft-
 * penalized by session type: `requirement-discovery` and `curriculum-review`
 * nodes rank at `SESSION_TYPE_PENALTY` of their raw attention rank; `other`
 * nodes rank at their raw value. This penalty is soft, not a hard tier, and it
 * scales rank ONLY — it never affects the tier comparison above — so a
 * sufficiently boosted penalized node can still overtake an `other` node
 * within the same tier, but it can never cross a tier boundary.
 *
 * A parked node's key is not its own attention alone: it is the lexicographic
 * max of its own resolved `(tier, value)` and the resolved `(tier, value)` of
 * every node it BLOCKS (every node whose `blocked_by` lists it), restricted to
 * sources not yet at `phase: "done"` — the same "a done blocker is cleared"
 * convention `openBlockers` uses. A park that is holding up high-attention live
 * work surfaces with that work's urgency rather than its own, and
 * `liftedFrom` names the source that supplied the key. The lift is monotone-up:
 * a member's key can only rise, never fall, so a park that blocks nothing keeps
 * exactly the key it had before. `ownTier`/`ownRank` always report the
 * un-lifted values.
 *
 * When `sessionType` is provided, only parked nodes whose
 * `office_hours.session_type` matches are included.
 */
export function officeHoursQueue(nodes: IntentionNode[], sessionType?: SessionType): QueueMember[] {
  const attention = resolveAttention(nodes);
  // reverse.get(id) = the nodes that list `id` in their own blocked_by — i.e.
  // the nodes `id` blocks. Same shape as `reverseBlockers` in
  // `computeSignalPath` (attention.ts), which is private to that module.
  const reverse = new Map<string, IntentionNode[]>();
  for (const n of nodes) {
    for (const b of n.blocked_by) {
      const list = reverse.get(b);
      if (list) list.push(n);
      else reverse.set(b, [n]);
    }
  }
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
    const ownTier = attention.get(n.id)?.tier ?? 1;
    // Lexicographic (tier, value) max over {own} ∪ blocked sources. The penalty
    // is applied AFTER the key is chosen: it is a property of this park's
    // session type, not of where the value came from, and it must never affect
    // the tier comparison.
    let keyTier = ownTier;
    let keyValue = rawRank;
    let liftedFrom: string | null = null;
    for (const src of reverse.get(n.id) ?? []) {
      if (src.phase === "done") continue;
      const srcValue = attention.get(src.id)?.value ?? 0;
      const srcTier = attention.get(src.id)?.tier ?? 1;
      const better =
        srcTier > keyTier ||
        (srcTier === keyTier &&
          (srcValue > keyValue ||
            // Ties among sources break by id ascending; a source can never tie
            // its way past the member's own key (liftedFrom stays null).
            (srcValue === keyValue && liftedFrom !== null && src.id < liftedFrom)));
      if (better) {
        keyTier = srcTier;
        keyValue = srcValue;
        liftedFrom = src.id;
      }
    }
    members.push({
      nodeId: n.id,
      rank: keyValue * penalty,
      tier: keyTier,
      ownTier,
      ownRank: rawRank * penalty,
      liftedFrom,
      sessionType: st,
      since: n.office_hours.since,
    });
  }
  return members.sort(
    (a, b) =>
      b.tier - a.tier ||
      b.rank - a.rank ||
      (a.nodeId < b.nodeId ? -1 : a.nodeId > b.nodeId ? 1 : 0),
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
