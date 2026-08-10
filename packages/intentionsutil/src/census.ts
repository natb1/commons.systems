// Pure classification logic for the tactic census, extracted from
// align-tactics-census.ts so other consumers (e.g. the lifecycle sensor) can
// reuse the exact same rules without shelling out to the script.
//
// This module is fs-free and process-free by design: no `node:fs`, no
// `child_process`. Callers supply the already-loaded node list.

import type { IntentionNode } from "./schema.js";

export type TacticClassification = "draft" | "born-parked" | "open" | "done";

/** Verbatim semantics of align-tactics-census.ts's classify(). */
export function classifyTactic(node: IntentionNode): TacticClassification {
  if (node.phase === "done") return "done";
  if (node.phase !== null) return "open";
  // phase is null/absent here
  return node.office_hours === null ? "draft" : "born-parked";
}

export interface BacklogBand {
  backlog: number; // open + born-parked tactics serving the strategy
  total: number; // ALL tactics serving the strategy (draft+born-parked+open+done)
  pct: number | null; // null when total === 0 (no division by zero)
}

export function strategyBacklogBand(
  nodes: IntentionNode[],
  strategyId: string,
): BacklogBand {
  const tactics = nodes.filter(
    (n) => n.kind === "tactic" && n.serves.includes(strategyId),
  );
  const total = tactics.length;
  const backlog = tactics.filter((n) => {
    const classification = classifyTactic(n);
    return classification === "open" || classification === "born-parked";
  }).length;
  const pct = total === 0 ? null : backlog / total;
  return { backlog, total, pct };
}
