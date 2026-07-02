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
 * Sort is a TOTAL order, independent of input order:
 *   1. gap-present (non-null) before gap-absent;
 *   2. then success_signal-present (non-null) before absent;
 *   3. then `id` ascending (the unique tiebreak guaranteeing totality).
 *
 * The input array is not mutated (a copy is sorted).
 */
export function projectGoals(nodes: IntentionNode[]): Goal[] {
  const frontier = activeFrontier(nodes);
  const sorted = [...frontier].sort((a, b) => {
    const aGap = a.gap !== null ? 0 : 1;
    const bGap = b.gap !== null ? 0 : 1;
    if (aGap !== bGap) return aGap - bGap;

    const aSig = a.success_signal !== null ? 0 : 1;
    const bSig = b.success_signal !== null ? 0 : 1;
    if (aSig !== bSig) return aSig - bSig;

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return sorted.map((node) => ({ node, realization: realizationForOwner(node.owner) }));
}

function renderRealization(realization: Realization): string {
  return realization === "script-and-tests" ? "script + tests" : "issue/PR";
}

/**
 * Render the projected goals as deterministic markdown, one line per goal in
 * `projectGoals` order. The output is byte-stable across repeated calls with
 * the same input: no dates, no wall-clock, no environment data. Ends with a
 * trailing newline.
 */
export function renderFrontier(goals: Goal[]): string {
  if (goals.length === 0) {
    return "_No active frontier goals._\n";
  }
  const lines = goals.map(({ node, realization }) => {
    const base = `- **${node.id}** — ${node.statement} _(owner: ${node.owner} → ${renderRealization(realization)})_`;
    return node.gap !== null ? `${base} — gap: ${node.gap}` : base;
  });
  return `${lines.join("\n")}\n`;
}
