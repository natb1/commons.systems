import type { IntentionNode } from "./schema.js";
import { activeFrontier } from "./goals.js";

/**
 * The detected rung for a repo's intention graph.
 *
 * There are deliberately THREE rungs and NO "automate" rung.
 *
 * "automate" is a per-intention delegability push-down performed inside the
 * rung-5 engine — it is NOT a detected global rung. Detecting an automate rung
 * from repo state is unsound: the honest automate / full-loop signals (running
 * agent sessions, live sensor readings, delegability evaluations) are not in
 * the version-controlled intention tree. A global "automate" rung would also
 * violate the per-intention-delegation-continuum constraint from epic #2100,
 * which requires delegability to be assessed per intention node, not globally.
 *
 * This comment exists so a future reader does NOT "restore" a fourth rung.
 */
export type Rung = "rung-0" | "refine-workflow" | "rung-5";

/**
 * Classify the intention graph into its current rung.
 *
 * The ladder — deepest satisfied entry-rung wins, evaluated in order:
 *   1. No principle root (no node with id starting with "principle-" and
 *      parent === null) → "rung-0": the charter has not been codified yet.
 *   2. activeFrontier(nodes) is empty (roots exist but no actionable goal
 *      leaves) → "refine-workflow": the charter is present but the workflow
 *      has not been decomposed into actionable goals.
 *   3. Otherwise → "rung-5": roots exist and there is an active goal frontier.
 *
 * Pure function: no IO, no filesystem access, no side effects.
 */
export function detectRung(nodes: IntentionNode[]): Rung {
  const hasPrincipleRoot = nodes.some(
    (n) => n.id.startsWith("principle-") && n.parent === null,
  );
  if (!hasPrincipleRoot) {
    return "rung-0";
  }

  const frontier = activeFrontier(nodes);
  if (frontier.length === 0) {
    return "refine-workflow";
  }

  return "rung-5";
}
