import { resolveAttention, selectGraphTargets } from "@commons-systems/intentionsutil";
import type { IntentionNode } from "@commons-systems/intentionsutil";
import { bandSpine, laneEdges, reverseBlockerIndex, sourceContributions } from "./lineage.js";
import { LABELS, PHASE_LADDER } from "./model.js";
import type { PlanRow, UnavailableReason, Velocity } from "./model.js";

/** A tactic is OPEN — in the row set — while its phase is anything but done. */
export function isOpenTactic(node: IntentionNode): boolean {
  return node.kind === "tactic" && node.phase !== "done";
}

/**
 * The router's selection order, restricted to tactics and 1-indexed.
 *
 * Restricted to tactics because the ETA divides by a TACTIC closure rate, and
 * mixing strategy align rounds into the numerator would divide counts of one
 * thing by a rate of another. Unit consistency was verified rather than
 * assumed: `selectGraphTargets`' two candidate loops are disjoint, so each
 * tactic emits at most one candidate per tick and a position counts distinct
 * tactics.
 *
 * Parked rows never appear here — the selector gates candidacy on
 * `office_hours` being null — so they are excluded from the counter that feeds
 * every other row's ETA by construction, not by being blanked afterwards.
 */
export function tacticPositions(nodes: IntentionNode[]): Map<string, number> {
  const { candidates } = selectGraphTargets(nodes);
  const positions = new Map<string, number>();
  let position = 0;
  for (const candidate of candidates) {
    if (candidate.kind !== "tactic") continue;
    position += 1;
    if (!positions.has(candidate.id)) positions.set(candidate.id, position);
  }
  return positions;
}

/**
 * Why an open tactic has no position, as a TYPED reason — never a blank cell.
 *
 * Order matters: parked is reported first because a parked node is withheld
 * deliberately, and reporting it as "blocked" would read as a graph problem
 * rather than an author decision.
 */
export function unavailableReason(
  node: IntentionNode,
  byId: Map<string, IntentionNode>,
  subtreeParentIds: Set<string>,
): UnavailableReason {
  if (node.office_hours !== null) return { kind: "parked" };
  const openBlockers = node.blocked_by.filter((id) => {
    const blocker = byId.get(id);
    return blocker !== undefined && blocker.phase !== "done";
  });
  if (openBlockers.length > 0) return { kind: "blocked", by: openBlockers };
  if (subtreeParentIds.has(node.id)) return { kind: "container" };
  // Everything else that the selector declined to emit: a stale
  // strategy_fingerprint froze it, or a rounds cap / stale reading gated its
  // serving strategy. Reported as `frozen` rather than guessed at more finely.
  return { kind: "frozen" };
}

/** Tactic ids named as another tactic's `parent` — permanent containers. */
export function subtreeParents(nodes: IntentionNode[]): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (node.kind === "tactic" && node.parent !== null) ids.add(node.parent);
  }
  return ids;
}

/**
 * `today + position / velocity`, as an ISO date.
 *
 * A zero closure rate — a paused queue — has no finite answer, so it renders
 * `unavailable` and never a date. Returning a date from a stalled queue would
 * be the single most misleading thing this column could do.
 */
export function etaFor(position: number, velocity: Velocity, today: Date): string | null {
  if (velocity.perDay <= 0) return null;
  const days = Math.ceil(position / velocity.perDay);
  const eta = new Date(today.getTime());
  eta.setUTCDate(eta.getUTCDate() + days);
  return eta.toISOString().slice(0, 10);
}

/**
 * The six label chips for a row.
 *
 * `delegated` (`owner: ai`) and `parked` (`office_hours` non-null) are
 * INDEPENDENT facts and both render when both hold — 53 nodes in the live store
 * carry both. The overlap between the tier column and `bug`/`security` is
 * deliberate too: tier 2 is DERIVED from those marks, so the chip says why a
 * row is lifted rather than repeating the tier.
 */
export function labelsFor(node: IntentionNode, blocked: boolean): string[] {
  const attributes = node.attributes;
  const marks: Record<string, boolean> = {
    bug: attributes.bug_fix === true,
    security: attributes.security === true,
    outage: attributes.outage === true,
    parked: node.office_hours !== null,
    delegated: node.owner === "ai",
    blocked,
  };
  return LABELS.filter((label) => marks[label]);
}

export interface BuildRowsInput {
  nodes: IntentionNode[];
  velocity: Velocity;
  today: Date;
}

export function buildRows(input: BuildRowsInput): PlanRow[] {
  const { nodes, velocity, today } = input;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const attention = resolveAttention(nodes);
  const positions = tacticPositions(nodes);
  const reverseBlockers = reverseBlockerIndex(nodes);
  const containers = subtreeParents(nodes);

  const rows: PlanRow[] = [];
  for (const node of nodes) {
    if (!isOpenTactic(node)) continue;

    const resolved = attention.get(node.id);
    const sources = resolved === undefined ? [] : sourceContributions(resolved, byId);
    const spine = bandSpine(node.id, sources);
    const position = positions.get(node.id) ?? null;
    const reason = position === null ? unavailableReason(node, byId, containers) : null;

    rows.push({
      id: node.id,
      statement: node.statement,
      tier: resolved?.tier ?? 1,
      rank: resolved?.value ?? 0,
      phase: node.phase,
      phaseIndex: node.phase === null ? -1 : PHASE_LADDER.indexOf(node.phase as never),
      spine,
      lanes: laneEdges(node, byId, reverseBlockers, spine),
      sources,
      labels: labelsFor(node, reason?.kind === "blocked"),
      position,
      eta: position === null ? null : etaFor(position, velocity, today),
      reason,
      draft: node.phase === null,
    });
  }

  // Selection order first, then everything with no position, ranked. Rows
  // without a position still carry a real rank and are ordered by it so the
  // lineage columns stay meaningful below the scheduled block.
  rows.sort((a, b) => {
    if (a.position !== null && b.position !== null) return a.position - b.position;
    if (a.position !== null) return -1;
    if (b.position !== null) return 1;
    if (a.tier !== b.tier) return b.tier - a.tier;
    if (a.rank !== b.rank) return b.rank - a.rank;
    return a.id.localeCompare(b.id);
  });

  return rows;
}
