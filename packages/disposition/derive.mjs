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
 * A node's status: `answered` when the stamp's class is `ratified` or
 * `delegated` -- the two classes only the author's ruling confers -- and
 * `unanswered` otherwise, whatever the node carries: a stamp of class
 * `deferred`, no stamp at all, or no `## Answer` section. See
 * commons.systems/disposition-graph/unanswered. The values `proposal` and
 * `unaligned` this function used to return are gone: both were forms of
 * "not yet answered" that the two-value encoding now names directly.
 *
 * @param {{authority: Authority|null}} node
 * @returns {'answered'|'unanswered'}
 */
export function deriveStatus(node) {
  const cls = node.authority ? node.authority.class : null;
  return cls === 'ratified' || cls === 'delegated' ? 'answered' : 'unanswered';
}

/**
 * Strip the dialogue keys from a node file's raw frontmatter text, by line:
 * `stage`, `recommendation`, `review`, `alternatives`, and `depends`, each
 * together with every line nested under it (indented relative to it), so
 * that writing this hash into `review.of` or `recommendation.amends` -- or
 * removing either from the frontmatter afterward, or adding an alternative
 * to the list -- never changes it. Operates on the raw YAML source text,
 * not the parsed object, because it is the *lines* belonging to a key that
 * must go, not just the key's value.
 *
 * @param {string} fmText - the raw text between the frontmatter's `---`
 *   delimiters (as `read.mjs`'s `parseNode` extracts it, before YAML.parse).
 * @returns {string}
 */
function stripDialogueFrontmatterLines(fmText) {
  const removedKeyRe = /^(stage|recommendation|review|alternatives|depends):/;
  let skipping = false;
  return fmText
    .split('\n')
    .filter((line) => {
      const isTopLevel = /^\S/.test(line);
      if (isTopLevel) {
        skipping = removedKeyRe.test(line);
        return !skipping;
      }
      return !skipping;
    })
    .join('\n');
}

/**
 * The standing hash: the sha1 hex digest of the node *as it stands*, which
 * `recommendation.amends` pins and whose mismatch against a current
 * recomputation is what `node.recommendationStale` means. It covers the
 * frontmatter's raw text with every dialogue key removed (see
 * `stripDialogueFrontmatterLines`), then a newline, the raw `## Answer`
 * text (`''` when the node has none), a newline, and the raw
 * `## Rationale` text (`''` when the node has none) -- so the standing
 * answer and the fields that carry it are hashed, and the dialogue running
 * beside them is not.
 *
 * A plain sha1 over synthesized text, not `blobSha1`'s git-blob framing:
 * the git framing exists so a hash matches `git hash-object` on a real
 * file's exact bytes, and this splice was never a file of its own.
 *
 * @param {{fmText: string, answer: string|null, rationale: string|null}} parts
 * @returns {string} 40-hex sha1
 */
export function deriveStandingHash({ fmText, answer, rationale }) {
  const strippedFm = stripDialogueFrontmatterLines(fmText);
  const text = `${strippedFm}\n${answer ?? ''}\n${rationale ?? ''}`;
  return createHash('sha1').update(text, 'utf8').digest('hex');
}

/**
 * The draft hash: the sha1 hex digest that `review.of` pins, and whose
 * mismatch against a current recomputation is what `node.reviewStale`
 * means (see commons.systems/disposition-graph/dialogue). This is a plain
 * sha1 over synthesized text, not `blobSha1`'s git-blob framing (`"blob "
 * + length + "\0" + bytes`) used elsewhere in this module: the git framing
 * exists so a hash matches `git hash-object` on a real file's exact bytes,
 * and the text hashed here -- a fence's content, or a frontmatter-minus-
 * dialogue-keys/answer/rationale splice -- was never a file of its own.
 *
 * With a `## Recommendation` fence, the hash is of the fence's content,
 * exactly: the recommendation is a whole proposed node quoted verbatim, so
 * any change to it is a new draft. With no fence (the recommendation
 * adopts the node as it stands), the hash is the standing hash.
 *
 * `read.mjs`'s `parseNode` calls this, passing the raw frontmatter text and
 * raw section text it extracts while parsing a node file -- the parsed,
 * structured node object this module otherwise deals with does not retain
 * that raw text, only the fields YAML.parse and the section split resolve
 * it into.
 *
 * @param {{fmText: string, draftFence: string|null, answer: string|null, rationale: string|null}} parts
 * @returns {string} 40-hex sha1
 */
export function deriveDraftHash({ fmText, draftFence, answer, rationale }) {
  if (draftFence !== null && draftFence !== undefined) {
    return createHash('sha1').update(draftFence, 'utf8').digest('hex');
  }
  return deriveStandingHash({ fmText, answer, rationale });
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
 * The settling count for the alignment frontier: how many other open
 * decisions a ruling on this node settles, on top of the node itself. Three
 * components, named on the returned record:
 *
 * - `under`: the node's strict descendants (`deriveDescendants`, following
 *   `children` transitively) whose status (`deriveStatus`) is unanswered --
 *   a ruling on the ancestor can move the ceiling a descendant answers
 *   under, or free the descendant to be ruled on in its own turn.
 * - `depends`: every node whose `depends` names this one, in any entry
 *   (qualified by an alternative or not), except one already counted under
 *   `under` -- a dependant elsewhere in the graph is waiting on this
 *   node's ruling just as surely as a descendant is.
 * - `alternatives`: the node's own `alternatives` count -- an answer on the
 *   table is itself a decision this node's ruling settles, whether or not
 *   any other node stands under it yet.
 *
 * `settles` is the sum of the three. Computed for every node, pure and
 * deterministic: nothing here is randomized or depends on wall-clock time.
 *
 * @param {DeriveNode[]} nodes - each also carrying `alternatives`
 *   (`{name: string}[]`, or absent) and `depends`
 *   (`{id: string, alternative: string|null}[]`, or absent).
 * @param {Map<string, string[]>} childrenMap - as returned by
 *   `deriveChildren`.
 * @returns {Map<string, {settles: number, under: number, alternatives: number, depends: number}>}
 */
export function deriveSettles(nodes, childrenMap) {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const result = new Map();
  for (const node of nodes) {
    const descendants = deriveDescendants([node.id], childrenMap);
    const under = new Set(
      [...descendants].filter((id) => deriveStatus(nodesById.get(id)) === 'unanswered'),
    );
    const dependants = new Set();
    for (const other of nodes) {
      if (under.has(other.id)) continue;
      if ((other.depends ?? []).some((d) => d.id === node.id)) dependants.add(other.id);
    }
    const alternatives = (node.alternatives ?? []).length;
    result.set(node.id, {
      settles: under.size + dependants.size + alternatives,
      under: under.size,
      alternatives,
      depends: dependants.size,
    });
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
