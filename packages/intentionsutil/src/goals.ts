import type { RankKey, ResolvedAttention } from "./attention.js";
import { compareRankKeyDesc, resolveAttention } from "./attention.js";
import { ownTier } from "./schema.js";
import type { IntentionNode, Owner } from "./schema.js";
import { deriveGap } from "./sensors.js";

/**
 * How a goal is realized once it becomes actionable. A procedure node is
 * codified as a script with tests; a human/ai node is realized as an issue or
 * pull request.
 */
export type Realization = "issue-or-pr" | "script-and-tests";

/** An active-frontier node paired with how it should be realized. */
export interface Goal {
  node: IntentionNode;
  realization: Realization;
  /**
   * The node's derived attention, or null when the node is not goal-layer
   * eligible (no `resolveAttention` entry). Drives the primary sort key and the
   * rank marker in `renderFrontier`; when null, both fall back to the node's
   * own `ownTier` (never a flat tier 1) and a zero band/score/depth.
   */
  attention: ResolvedAttention | null;
}

/**
 * Map a node's owner to its realization. A `procedure` is owned by the machine
 * and codified as a script + tests; `human` and `ai` work surfaces as an
 * issue/PR.
 */
export function realizationForOwner(owner: Owner): Realization {
  return owner === "procedure" ? "script-and-tests" : "issue-or-pr";
}

/**
 * The active frontier: the leaf nodes that still have open work.
 *
 * A node is a leaf when no other node names it as a parent; childless nodes —
 * including childless virtue roots — are leaves. The predicate is
 * `status !== "codified" && phase !== "done" && <node is a leaf>`.
 *
 * The `!== "codified"` clause drops the childless nodes that are hand-maintained
 * at `codified` (virtue roots, and the kind, strategy and delegation nodes),
 * which leaf-ness alone would wrongly admit.
 *
 * The `phase !== "done"` clause drops finished tactic leaves. `status` is
 * write-once authoring provenance that the dispatch ladder never advances, so
 * without this clause a finished leaf whose author never codified it stays in
 * the frontier permanently, reported as work still needing attention. Measured
 * 2026-08-31 on the 783-node store: the frontier held 381 nodes of which 65 were
 * `phase: "done"` — 62 at `status: "raw"` and 3 at `status: "delegated"`, every
 * one a leaf — so the clause takes it to 316. Write the clause on `phase`; never
 * spell it `status !== "raw"`, because those 3 `delegated` nodes are the
 * standing proof that `status` is the wrong axis for this question. The nodes
 * are correct and the READER is what changes here (`kind-tactic`'s "Is
 * `status: raw` together with `phase: done` a node defect to sweep?"
 * clarification, landed 2026-08-30): no node's `status` is migrated.
 *
 * An earlier revision of this comment rationalized the predicate as "every
 * tactic leaf is currently `status: raw`, so gating on a `delegated`/`codified`
 * status would yield an empty frontier". That premise no longer describes a
 * graph holding ~200 done tactics, which is what the `phase` clause corrects.
 *
 * `serves` edges do not affect leaf-ness — only `parent` does. Input order is
 * preserved (filter only).
 *
 * Leaf-ness is resolved against a Set of all non-null parent ids built once up
 * front, so the whole pass is O(n) rather than O(n²) (a per-node scan over all
 * nodes).
 */
export function activeFrontier(nodes: IntentionNode[]): IntentionNode[] {
  const parentIds = new Set(
    nodes.map((n) => n.parent).filter((p): p is string => p !== null),
  );
  return nodes.filter(
    (node) => node.status !== "codified" && node.phase !== "done" && !parentIds.has(node.id),
  );
}

/**
 * Project the active frontier into an ordered list of goals.
 *
 * Attention is resolved over the FULL input node list (not just the frontier),
 * because a frontier leaf's flow may be inherited from a non-frontier ancestor
 * (a strategy the leaf serves/parents up to). A frontier node with no resolver
 * entry carries a zero band/score/depth.
 *
 * Sort is a TOTAL order, independent of input order:
 *   1. the shared `compareRankKeyDesc` order over the resolved rank key —
 *      `(tier, band, score, depth)` descending. A node with no resolver entry
 *      falls back to its OWN tier, `ownTier(node)`, NOT a flat 1: the frontier
 *      admits every non-codified leaf of any kind, while `resolveAttention`
 *      only maps goal-layer kinds, and nothing gates
 *      `attributes.tier`/`bug_fix`/`security` to goal-layer kinds — so a
 *      delegation/virtue/tradition leaf can genuinely carry tier 2 or 3 and a
 *      `?? 1` fallback would silently bury it at the bottom of the list. Same
 *      fallback as the selector's `tierOf` (`router.ts`), so the two consumers
 *      of this axis agree on the same node. Its other three components fall
 *      back to 0;
 *   2. then gap-present (non-null) before gap-absent;
 *   3. then success_signal-present (non-null) before absent;
 *   4. then `id` ascending (the unique tiebreak guaranteeing totality).
 *
 * When no node carries a boost or a tier mark anywhere, every rank key is
 * `(1, 0, 0, 0)`, so key 1 never discriminates and the order is EXACTLY the
 * pre-attention gap/signal/id order.
 *
 * The input array is not mutated (a copy is sorted).
 */
export function projectGoals(nodes: IntentionNode[]): Goal[] {
  const attention = resolveAttention(nodes);
  const frontier = activeFrontier(nodes);
  const keyOf = (n: IntentionNode): RankKey => {
    const resolved = attention.get(n.id);
    return {
      tier: resolved?.tier ?? ownTier(n),
      band: resolved?.band ?? 0,
      score: resolved?.score ?? 0,
      depth: resolved?.depth ?? 0,
    };
  };
  const sorted = [...frontier].sort((a, b) => {
    const byRank = compareRankKeyDesc(keyOf(a), keyOf(b));
    if (byRank !== 0) return byRank;

    const aGap = deriveGap(a) !== null ? 0 : 1;
    const bGap = deriveGap(b) !== null ? 0 : 1;
    if (aGap !== bGap) return aGap - bGap;

    const aSig = a.success_signal !== null ? 0 : 1;
    const bSig = b.success_signal !== null ? 0 : 1;
    if (aSig !== bSig) return aSig - bSig;

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return sorted.map((node) => ({
    node,
    realization: realizationForOwner(node.owner),
    attention: attention.get(node.id) ?? null,
  }));
}

function renderRealization(realization: Realization): string {
  return realization === "script-and-tests" ? "script + tests" : "issue/PR";
}

/**
 * Format a rank value with up to 2 decimal places, trailing zeros trimmed.
 * Examples: 20 → "20", 1.5 → "1.5", 0.25 → "0.25".
 */
function formatRank(value: number): string {
  return parseFloat(value.toFixed(2)).toString();
}

/**
 * Render the projected goals as deterministic markdown, one line per goal in
 * `projectGoals` order. The output is byte-stable across repeated calls with
 * the same input: no dates, no wall-clock, no environment data. Ends with a
 * trailing newline.
 *
 * Goals with `tier > 1` get a tier marker — ` [tier <tier>]` — prepended
 * immediately before the rank marker described below. A null `attention` (a
 * frontier leaf of a non-goal-layer kind, which `resolveAttention` does not
 * map) falls back to the node's OWN tier, `ownTier(node)` — matching
 * `projectGoals`' sort key, so a tier-2/3 leaf sorted near the top is also
 * MARKED as such instead of rendering as an unexplained tier-1 line. Tier 1
 * renders no tier marker.
 *
 * A goal whose band or score is nonzero gets a rank marker appended after the
 * `_(owner: … → …)_` segment (and after the tier marker, when present) and
 * before the gap suffix: ` [band <band> rank <score> via <sources[0]>]` naming
 * the top contributing source, or ` [band <band> rank <score>]` when `sources`
 * is empty. Band and score both 0 (or a null attention) renders unmarked, so a
 * store with no boost anywhere is byte-identical to the pre-attention render.
 */
export function renderFrontier(goals: Goal[]): string {
  if (goals.length === 0) {
    return "_No active frontier goals._\n";
  }
  const lines = goals.map(({ node, realization, attention }) => {
    let line = `- **${node.id}** — ${node.statement} _(owner: ${node.owner} → ${renderRealization(realization)})_`;
    const tier = attention !== null ? attention.tier : ownTier(node);
    if (tier > 1) {
      line += ` [tier ${tier}]`;
    }
    if (attention !== null && (attention.band > 0 || attention.score > 0)) {
      const marker = `band ${formatRank(attention.band)} rank ${formatRank(attention.score)}`;
      line +=
        attention.sources.length > 0
          ? ` [${marker} via ${attention.sources[0]}]`
          : ` [${marker}]`;
    }
    const gap = deriveGap(node);
    if (gap !== null) line += ` — gap: ${gap}`;
    return line;
  });
  return `${lines.join("\n")}\n`;
}
