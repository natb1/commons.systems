// packages/disposition/derive.mjs
//
// Pure derivation functions for the disposition graph: git blob sha1,
// target-prefix id canonicalization, children, rank, ceiling, and status.
// Nothing here touches the filesystem; read.mjs composes these over parsed
// node files.

import { createHash } from 'node:crypto';

/**
 * @typedef {Object} Authority
 * @property {'ratified'|'delegated'|'deferred'} class
 * @property {string} by
 * @property {string} date
 */

/**
 * @typedef {Object} DeriveNode
 * @property {string} id - full id, `<module>/<graph>/<slug>`.
 * @property {string[]} [under] - canonicalized (local-form) parent ids.
 * @property {number|null} [boost] - positive number; null/absent means the
 *   implicit default of 1.
 * @property {Authority|null} [authority]
 * @property {string|null} [answer] - raw trimmed markdown of the node's
 *   `## Answer` section, or null when it has none.
 */

/**
 * Git's blob object hash: sha1("blob " + byteLength + "\0" + bytes),
 * computed in-process against the exact bytes given. Callers must pass the
 * file's raw bytes (not a decoded/re-encoded string) for the result to match
 * `git hash-object`.
 *
 * @param {Buffer|Uint8Array} bytes
 * @returns {string} 40-hex sha1
 */
export function blobSha1(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const header = Buffer.from(`blob ${buf.length}\0`, 'utf8');
  return createHash('sha1').update(header).update(buf).digest('hex');
}

/**
 * Rewrite a reference id written against a graph's `target` prefix to its
 * local `<module>/<graph>/<slug>` form. An id that matches no declared
 * target is assumed already local and is returned unchanged. When an id
 * matches more than one target prefix, the longest (most specific) target
 * wins.
 *
 * @param {string} id
 * @param {{module: string, graphs: Record<string, {target?: string|null}|null>}} manifest
 * @returns {string}
 */
export function canonicalizeId(id, manifest) {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(`canonicalizeId: id must be a non-empty string, got ${JSON.stringify(id)}`);
  }
  let best = null;
  for (const [graphName, graphDef] of Object.entries(manifest.graphs ?? {})) {
    const target = graphDef && typeof graphDef === 'object' ? graphDef.target : null;
    if (!target) continue;
    const matches = id === target || id.startsWith(`${target}/`);
    if (matches && (!best || target.length > best.target.length)) {
      best = { graphName, target };
    }
  }
  if (!best) return id;
  const rest = id === best.target ? '' : id.slice(best.target.length + 1);
  return rest ? `${manifest.module}/${best.graphName}/${rest}` : `${manifest.module}/${best.graphName}`;
}

/**
 * Map each node id to the sorted ids of its children: the nodes whose
 * `under` contains it.
 *
 * @param {DeriveNode[]} nodes
 * @returns {Map<string, string[]>}
 * @throws {Error} when some node's `under` names an id outside `nodes`.
 */
export function deriveChildren(nodes) {
  const ids = new Set(nodes.map((n) => n.id));
  /** @type {Map<string, string[]>} */
  const children = new Map(nodes.map((n) => [n.id, []]));
  for (const node of nodes) {
    for (const parent of node.under ?? []) {
      if (!ids.has(parent)) {
        throw new Error(`deriveChildren: node '${node.id}' has unresolved 'under' reference '${parent}'`);
      }
      children.get(parent).push(node.id);
    }
  }
  for (const list of children.values()) list.sort();
  return children;
}

const boostOf = (node) => (node.boost == null ? 1 : node.boost);

/**
 * Compute every node's rank. Roots (no `under`) share the total 1.0 in
 * proportion to boost (default 1). A child's share from one parent is
 * `parent.rank * (child.boost or 1) / (sum over that parent's children of
 * (boost or 1))`; a multi-parent node sums its shares across parents.
 * Computed in topological order over `under`.
 *
 * @param {DeriveNode[]} nodes
 * @returns {Map<string, number>}
 * @throws {Error & {cycleIds?: string[]}} when `under` contains a cycle
 *   (the thrown error carries the involved ids as `cycleIds`), or when some
 *   node's `under` names an id outside `nodes`.
 */
export function deriveRank(nodes) {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const children = deriveChildren(nodes); // throws on unresolved 'under'

  /** @type {Map<string, number>} */
  const rank = new Map(nodes.map((n) => [n.id, 0]));
  /** @type {Map<string, number>} */
  const indegree = new Map(nodes.map((n) => [n.id, (n.under ?? []).length]));

  const roots = nodes.filter((n) => (n.under ?? []).length === 0);
  const rootBoostSum = roots.reduce((sum, n) => sum + boostOf(n), 0);
  const queue = [];
  for (const root of roots) {
    rank.set(root.id, rootBoostSum > 0 ? boostOf(root) / rootBoostSum : 0);
    queue.push(root.id);
  }

  let processed = 0;
  while (queue.length > 0) {
    const parentId = queue.shift();
    processed += 1;
    const kids = children.get(parentId);
    if (kids.length > 0) {
      const childBoostSum = kids.reduce((sum, id) => sum + boostOf(nodesById.get(id)), 0);
      const parentRank = rank.get(parentId);
      for (const childId of kids) {
        const share = childBoostSum > 0 ? (parentRank * boostOf(nodesById.get(childId))) / childBoostSum : 0;
        rank.set(childId, rank.get(childId) + share);
        indegree.set(childId, indegree.get(childId) - 1);
        if (indegree.get(childId) === 0) queue.push(childId);
      }
    }
  }

  if (processed !== nodes.length) {
    const cycleIds = nodes.map((n) => n.id).filter((id) => indegree.get(id) > 0).sort();
    const err = new Error(`cycle in 'under' among: ${cycleIds.join(', ')}`);
    err.cycleIds = cycleIds;
    throw err;
  }

  return rank;
}

/**
 * Find the nearest ratified ancestor of a node, walking `under` breadth
 * first (nearest depth first; ties among ratified ancestors at the same
 * depth broken by smallest id). Returns null when no ancestor is ratified,
 * including for a root. A node's own authority never counts as its ceiling
 * — only strict ancestors are considered.
 *
 * @param {string} nodeId
 * @param {Map<string, DeriveNode>} nodesById
 * @returns {string|null}
 */
export function deriveCeiling(nodeId, nodesById) {
  const start = nodesById.get(nodeId);
  if (!start) {
    throw new Error(`deriveCeiling: unknown node id '${nodeId}'`);
  }
  const visited = new Set([nodeId]);
  let frontier = [...new Set(start.under ?? [])];

  while (frontier.length > 0) {
    const ratifiedHere = [];
    for (const id of frontier) {
      const node = nodesById.get(id);
      if (!node) {
        throw new Error(`deriveCeiling: node '${nodeId}' has unresolved 'under' reference '${id}'`);
      }
      if (node.authority && node.authority.class === 'ratified') {
        ratifiedHere.push(id);
      }
    }
    if (ratifiedHere.length > 0) {
      ratifiedHere.sort();
      return ratifiedHere[0];
    }
    const next = new Set();
    for (const id of frontier) {
      visited.add(id);
      const node = nodesById.get(id);
      for (const parent of node.under ?? []) {
        if (!visited.has(parent)) next.add(parent);
      }
    }
    frontier = [...next];
  }
  return null;
}

/**
 * A node's status: the stamp's class when it has one; `proposal` when it
 * has an `## Answer` but no stamp; `unaligned` when it has no `## Answer` --
 * an un-aligned disposition that has not yet survived the alignment
 * dialogue.
 *
 * @param {{authority: Authority|null, answer: string|null}} node
 * @returns {'ratified'|'delegated'|'deferred'|'proposal'|'unaligned'}
 */
export function deriveStatus(node) {
  if (node.authority) return node.authority.class;
  if (node.answer !== null && node.answer !== undefined) return 'proposal';
  return 'unaligned';
}

/**
 * Every strict descendant of the given parent ids: everything reachable by
 * following `children` downward from them any number of times. The parent
 * ids themselves are never included unless also reachable as a descendant
 * of another parent id in the list. Cycle-safe: an id already in the result
 * is not re-expanded.
 *
 * @param {string[]} parentIds
 * @param {Map<string, string[]>} childrenMap - as returned by deriveChildren
 *   (or any map with the same shape; a missing key is treated as childless).
 * @returns {Set<string>}
 */
export function deriveDescendants(parentIds, childrenMap) {
  const result = new Set();
  const queue = [...parentIds];
  while (queue.length > 0) {
    const id = queue.shift();
    for (const child of childrenMap.get(id) ?? []) {
      if (!result.has(child)) {
        result.add(child);
        queue.push(child);
      }
    }
  }
  return result;
}

/**
 * Every strict ancestor of one node: everything reachable by following
 * `under` upward from it any number of times. The node itself is never
 * included. Cycle-safe: an id already in the result is not re-expanded.
 *
 * @param {string} nodeId
 * @param {Map<string, DeriveNode>} nodesById
 * @returns {Set<string>}
 */
export function deriveAncestors(nodeId, nodesById) {
  const result = new Set();
  const queue = [...(nodesById.get(nodeId)?.under ?? [])];
  while (queue.length > 0) {
    const id = queue.shift();
    if (result.has(id)) continue;
    result.add(id);
    for (const parent of nodesById.get(id)?.under ?? []) {
      if (!result.has(parent)) queue.push(parent);
    }
  }
  return result;
}
