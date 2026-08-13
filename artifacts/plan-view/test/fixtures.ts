import { validateNode } from "@commons-systems/intentionsutil";
import type { IntentionNode } from "@commons-systems/intentionsutil";

/**
 * Build a node through `validateNode` rather than by casting a literal.
 *
 * The resolver keys eligibility off the `kind-<kind>` node's
 * `attributes.goal_layer`, so a fixture graph must carry real kind nodes too —
 * a hand-cast literal that skipped validation would drift from the schema the
 * production readers enforce and quietly make these tests test nothing.
 */
export function node(input: Record<string, unknown>): IntentionNode {
  return validateNode({
    owner: "ai",
    status: "raw",
    ...input,
  });
}

/** The two kind nodes the resolver needs to treat strategies and tactics as goal-layer. */
export function kindNodes(): IntentionNode[] {
  return [
    node({
      id: "kind-strategy",
      kind: "kind",
      statement: "strategy kind",
      attributes: { goal_layer: true },
    }),
    node({
      id: "kind-tactic",
      kind: "kind",
      statement: "tactic kind",
      attributes: { goal_layer: true },
    }),
    node({
      id: "kind-delegation",
      kind: "kind",
      statement: "delegation kind",
      attributes: {},
    }),
  ];
}

/** An authored boost, with the `rationale`/`tier` the schema requires. */
export function boost(amount: number): Record<string, unknown> {
  return { boost: amount, override: null, rationale: "fixture", tier: 1 };
}

export function strategy(id: string, extra: Record<string, unknown> = {}): IntentionNode {
  return node({ id, kind: "strategy", statement: `strategy ${id}`, ...extra });
}

export function tactic(id: string, extra: Record<string, unknown> = {}): IntentionNode {
  return node({ id, kind: "tactic", statement: `tactic ${id}`, ...extra });
}
