// Intention-tree data module for the office-hours dashboard's intention-tree
// panel (issue #2374). It mirrors the queue-metrics data-module pattern
// (queue-metrics.ts): plain serializable types, a pure builder, and a demo
// getter that reads a vite virtual module.
//
// CRITICAL: every @commons-systems/intentionsutil symbol is imported with
// `import type` ONLY. The runtime values listNodes/listTrackers pull in
// node:fs + yaml, which break the browser bundle. This module must carry NO
// runtime dependency on intentionsutil and NO node: imports.

import type { Owner, Status, ExecutionTracker } from "@commons-systems/intentionsutil";

import seedIntentionTree from "virtual:office-hours-intention-tree-seed";

/**
 * The slim, fully JSON-safe node shape this module deals with. Deliberately
 * omits the IntentionNode fields that are deferred to sibling #2371
 * (rationale/reading/gap/clarifications/success_signal/tooling_goals).
 */
export interface SlimIntentionNode {
  id: string;
  statement: string;
  owner: Owner;
  status: Status;
  parent: string | null;
}

/**
 * A forest node: a SlimIntentionNode carrying its (recursively built) children.
 */
export interface IntentionTreeNode extends SlimIntentionNode {
  children: IntentionTreeNode[];
}

/**
 * The view object the demo getter returns: the built forest plus the frontier
 * id set and the per-node execution trackers.
 */
export interface IntentionTreeView {
  tree: IntentionTreeNode[];
  frontierIds: Set<string>;
  trackers: Record<string, ExecutionTracker>;
}

/**
 * Builds a forest from a flat node list and returns its roots. Pure — no side
 * effects, no I/O.
 *
 * Key behaviors:
 * - Multi-root: each node whose `parent` is null is a root. The charter
 *   principles are `parent: null` roots, so the forest legitimately has
 *   multiple roots.
 * - Orphan-as-root: a node whose `parent` id is non-null but names no node in
 *   the input set is treated as a root (never thrown, never dropped).
 * - Sibling and root order mirrors input order — nodes are appended as the
 *   input array is iterated.
 *
 * Implementation: a first pass builds an id→tree-node map (each with an empty
 * `children: []`); a second pass appends each node either to its parent's
 * children (when the parent id is present in the map) or to the roots list
 * (when `parent` is null OR the parent id is absent). This is O(n), avoids
 * deep recursion, and cannot infinite-loop. Cycles (a node as its own
 * ancestor) are not expected in real data and are not detected.
 */
export function buildTree(nodes: SlimIntentionNode[]): IntentionTreeNode[] {
  const byId = new Map<string, IntentionTreeNode>();
  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [] });
  }

  const roots: IntentionTreeNode[] = [];
  for (const node of nodes) {
    const treeNode = byId.get(node.id)!; // type-safety-ok: populated for every node in the first pass over the same nodes array
    const parent = node.parent === null ? undefined : byId.get(node.parent);
    if (parent === undefined) {
      // parent is null (real root) OR parent id is absent (orphan-as-root)
      roots.push(treeNode);
    } else {
      parent.children.push(treeNode);
    }
  }

  return roots;
}

/**
 * Demo getter, mirroring getDemoQueueMetrics in data.ts — reads the seed from
 * the vite virtual module and assembles the view.
 *
 * The serialized seed is fully JSON-safe: strings and enums only, no Date
 * fields (ExecutionTracker.refreshed_at is a string). So no Date-rehydration
 * shim is needed here (unlike queue-metrics' computedAt).
 */
export function getDemoIntentionTree(): IntentionTreeView {
  return {
    tree: buildTree(seedIntentionTree.nodes),
    frontierIds: new Set(seedIntentionTree.frontierIds),
    trackers: seedIntentionTree.trackers,
  };
}
