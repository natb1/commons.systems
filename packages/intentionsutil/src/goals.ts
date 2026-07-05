import type { ResolvedAttention, TermContribution } from "./attention.js";
import { resolveAttention } from "./attention.js";
import type { IntentionNode, Owner } from "./schema.js";

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
   * band marker in `renderFrontier`.
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
 * `status !== "codified" && <node is a leaf>`. Rationale: every tactic leaf is
 * currently `status: "raw"`, so gating on a `delegated`/`codified` status would
 * yield an empty frontier. Leaf-ness alone would wrongly include the childless
 * `codified` virtue roots (and the kind, strategy, and delegation nodes, all
 * hand-maintained at `codified`); the `!== "codified"` clause drops those.
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
  return nodes.filter((node) => node.status !== "codified" && !parentIds.has(node.id));
}

/**
 * Project the active frontier into an ordered list of goals.
 *
 * Attention is resolved over the FULL input node list (not just the frontier),
 * because a frontier leaf's flow may be inherited from a non-frontier ancestor
 * (a strategy the leaf serves/parents up to). A frontier node with no resolver
 * entry carries value 0.
 *
 * Sort is a TOTAL order, independent of input order:
 *   1. resolved attention value DESCENDING (the primary key — the derived
 *      attention flow; a node with no resolver entry has value 0);
 *   2. then gap-present (non-null) before gap-absent;
 *   3. then success_signal-present (non-null) before absent;
 *   4. then `id` ascending (the unique tiebreak guaranteeing totality).
 *
 * When no node carries an injection anywhere, every value is 0, so key 1 never
 * discriminates and the order is EXACTLY the pre-attention gap/signal/id order.
 *
 * The input array is not mutated (a copy is sorted).
 */
export function projectGoals(nodes: IntentionNode[]): Goal[] {
  const attention = resolveAttention(nodes);
  const frontier = activeFrontier(nodes);
  const sorted = [...frontier].sort((a, b) => {
    const aVal = attention.get(a.id)?.value ?? 0;
    const bVal = attention.get(b.id)?.value ?? 0;
    if (aVal !== bVal) return bVal - aVal;

    const aGap = a.gap !== null ? 0 : 1;
    const bGap = b.gap !== null ? 0 : 1;
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
 * Render a per-term breakdown suffix (e.g. ` {authored 6, signal 1}`) — the
 * explainability detail behind a composed rank (strategy clarification 11).
 * Absent `terms` (hand-built `ResolvedAttention` literals) renders nothing.
 *
 * A single nonzero `authored` term is suppressed because a nonzero authored
 * contribution always populates `sources`, which `renderFrontier` already
 * surfaces as `[rank N via X]` — the breakdown would be redundant. But
 * `signal` and `capture` never populate `sources`, so a single nonzero
 * `signal`/`capture` term is the value's only explanation and must be shown;
 * otherwise it renders as a bare `[rank N]` indistinguishable from a legacy
 * anonymous boost. So render whenever more than one term is nonzero, OR the
 * sole nonzero term is not `authored`.
 */
function formatTermBreakdown(terms: TermContribution[] | undefined): string {
  if (terms === undefined) return "";
  const nonZero = terms.filter((t) => t.value !== 0);
  if (nonZero.length === 0) return "";
  if (nonZero.length === 1 && nonZero[0].term === "authored") return "";
  return ` {${nonZero.map((t) => `${t.term} ${formatRank(t.value)}`).join(", ")}}`;
}

/**
 * Render the projected goals as deterministic markdown, one line per goal in
 * `projectGoals` order. The output is byte-stable across repeated calls with
 * the same input: no dates, no wall-clock, no environment data. Ends with a
 * trailing newline.
 *
 * Goals with `value > 0` get a rank marker appended after the
 * `_(owner: … → …)_` segment and before the gap suffix:
 * ` [rank <value> via <sources[0]>]` naming the top contributing source, or
 * ` [rank <value>]` when `sources` is empty. Value 0 / null renders unmarked,
 * so a store with no injection anywhere is byte-identical to the pre-attention
 * render. When more than one term contributes, a ` {term v, term v}`
 * breakdown follows the rank marker for explainability.
 */
export function renderFrontier(goals: Goal[]): string {
  if (goals.length === 0) {
    return "_No active frontier goals._\n";
  }
  const lines = goals.map(({ node, realization, attention }) => {
    let line = `- **${node.id}** — ${node.statement} _(owner: ${node.owner} → ${renderRealization(realization)})_`;
    if (attention !== null && attention.value > 0) {
      const rank = formatRank(attention.value);
      line +=
        attention.sources.length > 0
          ? ` [rank ${rank} via ${attention.sources[0]}]`
          : ` [rank ${rank}]`;
      line += formatTermBreakdown(attention.terms);
    }
    if (node.gap !== null) line += ` — gap: ${node.gap}`;
    return line;
  });
  return `${lines.join("\n")}\n`;
}
