// packages/disposition/derive.mjs
//
// Pure derivation functions for the disposition graph: git blob sha1,
// target-prefix id canonicalization, children, rank, ceiling, the class a
// node's rulings confer, and the hashes a ruling and a review pin. Nothing
// here touches the filesystem; read.mjs composes these over parsed node
// files.
//
// Since 2026-09-04 a node's authority is not a stamp. Every decision on a
// node is a `facts` entry with a list of viable `options`; the AI marks the
// one it `recommends`; the author's ruling is recorded on the option they
// chose. The class -- ratified, delegated, deferred, unanswered -- is
// derived from those rulings here, and every reader shares this derivation
// (commons.systems/disposition-graph/viable-options).

import { createHash } from 'node:crypto';

/**
 * @typedef {Object} Ruling
 * @property {'confirm'|'edit'} response
 * @property {string} date
 * @property {string} of - the fact's recommendation hash at the time of the
 *   ruling, so that a recommendation moved since shows as `moved`.
 * @property {string|null} reason - the author's own reason for the ruling, in
 *   their words, optional (commons.systems/disposition-graph/dialogue,
 *   `ruling-carries-the-reason`).
 */

/**
 * @typedef {Object} Option
 * @property {string} name
 * @property {string|null} source
 * @property {string|null} ref
 * @property {Ruling|null} ruling
 * @property {'passed'|null} status - `passed` where the AI holds the option
 *   dominated on the record's criteria and keeps it on the list anyway;
 *   null means viable. Viability is a judgment shown on the option and never
 *   the condition of its being listed
 *   (commons.systems/disposition-graph/prose-and-structure).
 * @property {string|null} reason - why it was passed over; carried exactly
 *   where `status` is.
 * @property {string} prose - the option's `#### <name>` subsection text.
 */

/**
 * @typedef {Object} Fact
 * @property {'answer'|'authority'|'existence'|'persistence'} name
 * @property {Option[]} options
 * @property {string|null} recommends
 * @property {string|null} boldness
 * @property {string|null} against - the AI's own case against the option it
 *   recommends, written when the recommendation is recorded. Part of no
 *   hash: it argues about the recommendation and is not the recommendation.
 * @property {string|null} stands - answer fact only.
 * @property {string} prose - the fact's `### <name>` subsection text.
 */

/**
 * The facts whose options are a fixed vocabulary rather than text written per
 * node. `ratified` means the same on every node it appears on, so its
 * sentence is written once, on the node that defines the term, and projected
 * from there; the option itself carries no `#### <option>` subsection
 * (commons.systems/disposition-graph/dialogue,
 * `every-option-carries-its-sentence`).
 */
export const VOCABULARY_FACTS = ['authority', 'existence'];

/**
 * The facts whose options say in their own prose what they would answer: the
 * answer fact, whose options are this question's candidate answers, and
 * persistence, whose option names are written per node too. Every option of
 * these owes a `#### <option>` subsection, but for the one named by `stands`,
 * whose sentence is the `## Answer` section itself.
 */
export const PER_NODE_FACTS = ['answer', 'persistence'];

const PER_NODE_FACT_SET = new Set(PER_NODE_FACTS);

/**
 * @typedef {Object} DeriveNode
 * @property {string} id - full id, `<module>/<graph>/<slug>`.
 * @property {string[]} [under] - canonicalized (local-form) parent ids.
 * @property {number|null} [boost] - positive number; null/absent means the
 *   implicit default of 1.
 * @property {Fact[]} [facts]
 * @property {string} [fmText] - the node file's raw frontmatter text, which
 *   the standing hash covers with the dialogue keys stripped out.
 * @property {string|null} [answer] - raw trimmed markdown of the node's
 *   `## Answer` section, or null when it has none.
 * @property {string|null} [rationale]
 * @property {{raw: string}|null} [fence] - the `## Recommendation` fence.
 * @property {string|null} [stage]
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

function sha1(text) {
  return createHash('sha1').update(text, 'utf8').digest('hex');
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

// ---------------------------------------------------------------------------
// facts, options, rulings
// ---------------------------------------------------------------------------

/**
 * One named fact of a node, or null when it carries none by that name.
 *
 * @param {DeriveNode} node
 * @param {string} name
 * @returns {Fact|null}
 */
export function factByName(node, name) {
  return (node?.facts ?? []).find((f) => f && f.name === name) ?? null;
}

const glossaryCache = new WeakMap();

/**
 * Every term the graph defines with a gloss, mapped to that gloss and to the
 * node that wrote it. A term is defined once across the graph, so the first
 * definition wins and a second is a duplicate the projector already warns
 * about. Terms defined without a gloss are absent: there is no sentence to
 * project for them.
 *
 * This is the one home for the sentence a vocabulary fact's option carries.
 * "What confirming that choice would mean" is the same sentence wherever
 * `ratified` or `prune` appears, so it is written once on the node that
 * defines the term and read from here -- never a sentence table in a
 * projection, which would be a rule no node projects
 * (commons.systems/disposition-graph/dialogue,
 * `every-option-carries-its-sentence`).
 *
 * Memoized on the graph object's identity: a projection asks for one option's
 * text hundreds of times and the glossary is a pure function of the nodes.
 *
 * @param {Map<string, DeriveNode>|DeriveNode[]|{nodes: DeriveNode[]}} graph
 * @returns {Map<string, {gloss: string, node: string}>} term -> the gloss and
 *   the id of the node that defines it.
 */
export function glossary(graph) {
  const cacheKey = graph !== null && typeof graph === 'object' ? graph : null;
  if (cacheKey !== null && glossaryCache.has(cacheKey)) return glossaryCache.get(cacheKey);
  /** @type {Map<string, {gloss: string, node: string}>} */
  const result = new Map();
  for (const node of nodesByIdOf(graph).values()) {
    for (const entry of node?.defines ?? []) {
      const term = typeof entry === 'string' ? entry : entry?.term;
      const gloss = typeof entry === 'string' ? null : (entry?.gloss ?? null);
      if (typeof term !== 'string' || term.length === 0) continue;
      if (typeof gloss !== 'string' || gloss.length === 0) continue;
      if (result.has(term)) continue;
      result.set(term, { gloss, node: node.id });
    }
  }
  if (cacheKey !== null) glossaryCache.set(cacheKey, result);
  return result;
}

/**
 * The one place a projection reads an option's own sentence from -- what that
 * option would answer, or what confirming it would mean. Every option of
 * every fact has one and none is hardcoded
 * (commons.systems/disposition-graph/dialogue,
 * `every-option-carries-its-sentence`):
 *
 * - the answer option named by `stands` yields the node's `## Answer`, which
 *   is its text; a projection reads its first sentences exactly as it reads
 *   every other option's from its subsection, so the row is no longer bare;
 * - any other answer option, and every persistence option, yields its
 *   `#### <option>` prose;
 * - an authority or existence option yields the gloss of the term its name
 *   is, from the node that defines it, since those names are the graph's own
 *   vocabulary.
 *
 * Null where nothing is recorded -- an option whose subsection is empty, or a
 * term no node has glossed. A caller that wants to say something in that case
 * says it as a projection's own absence marker, never as a sentence for the
 * option.
 *
 * @param {Map<string, DeriveNode>|DeriveNode[]|{nodes: DeriveNode[]}} graph
 * @param {DeriveNode} node - the node the fact is on.
 * @param {Fact} fact
 * @param {Option} option
 * @returns {{text: string, from: string}|null} `from` is the id of the node
 *   holding the text.
 */
export function optionText(graph, node, fact, option) {
  if (!fact || !option) return null;
  if (fact.name === 'answer' && fact.stands != null && fact.stands === option.name) {
    const answer = node?.answer ?? '';
    return answer.trim().length > 0 ? { text: answer, from: node.id } : null;
  }
  if (PER_NODE_FACT_SET.has(fact.name)) {
    const prose = option.prose ?? '';
    return prose.trim().length > 0 ? { text: prose, from: node.id } : null;
  }
  const defined = glossary(graph).get(option.name) ?? null;
  return defined === null ? null : { text: defined.gloss, from: defined.node };
}

/**
 * The name of the one option of a fact the author has ruled on, or null when
 * none carries a ruling. At most one option per fact may (the validator
 * refuses more), so the first is the only one.
 *
 * @param {Fact|null} fact
 * @returns {string|null}
 */
export function ruledOption(fact) {
  const option = (fact?.options ?? []).find((o) => o && o.ruling);
  return option ? option.name : null;
}

/**
 * Ratified is the one class no ancestor confers: it means the author ruled
 * on this node's own answer, so it is read off this node alone and needs no
 * graph. `deriveClass` step 1 and every caller below share this test.
 *
 * @param {DeriveNode} node
 * @returns {boolean}
 */
function isRatified(node) {
  return ruledOption(factByName(node, 'answer')) !== null;
}

/**
 * Accept a graph in any of the shapes a caller has to hand -- a
 * `Map<id, node>`, a plain array of nodes, or the `{nodes}` object
 * `readGraph` returns -- and index it by id.
 *
 * @param {Map<string, DeriveNode>|DeriveNode[]|{nodes: DeriveNode[]}|null|undefined} graph
 * @returns {Map<string, DeriveNode>}
 */
function nodesByIdOf(graph) {
  if (graph instanceof Map) return graph;
  const list = Array.isArray(graph) ? graph : (Array.isArray(graph?.nodes) ? graph.nodes : []);
  return new Map(list.map((n) => [n.id, n]));
}

/**
 * The class a node's rulings confer, and where that class came from, in one
 * walk (`deriveClass` and `deriveClassSource` are its two projections).
 *
 * 1. The answer fact carries a ruled option -> ratified: the author decided
 *    the answer itself, and the confirmed choice acts.
 * 2. Else the authority fact carries a ruled option: `delegated` -> delegated,
 *    `deferred` -> deferred, `ratified` -> unanswered. The third is not a
 *    fallthrough: the author has said this node's answer must be ratified
 *    and has not ratified it, so nothing on it acts and no ancestor's
 *    delegation reaches it.
 * 3. Else the nearest ancestor by `under`, breadth first, whose authority
 *    fact carries a ruled option `delegated` or `deferred` confers that
 *    class; at equal depth deferred wins, since authority only narrows on
 *    the way down, and ties within a class break on the smallest id so that
 *    the source is deterministic. An ancestor whose authority fact is ruled
 *    `ratified` confers nothing and does not stop the walk.
 * 4. Else unanswered.
 *
 * @param {DeriveNode} node
 * @param {Map<string, DeriveNode>|DeriveNode[]|{nodes: DeriveNode[]}} graph
 * @returns {{class: 'ratified'|'delegated'|'deferred'|'unanswered',
 *   source: {kind: 'ruling'}|{kind: 'ancestor', id: string}|null}}
 */
function classAndSource(node, graph) {
  if (isRatified(node)) return { class: 'ratified', source: { kind: 'ruling' } };

  const ruled = ruledOption(factByName(node, 'authority'));
  if (ruled === 'delegated') return { class: 'delegated', source: { kind: 'ruling' } };
  if (ruled === 'deferred') return { class: 'deferred', source: { kind: 'ruling' } };
  if (ruled !== null) return { class: 'unanswered', source: { kind: 'ruling' } };

  const nodesById = nodesByIdOf(graph);
  const visited = new Set([node.id]);
  let frontier = [...new Set(node.under ?? [])];
  while (frontier.length > 0) {
    let best = null;
    for (const id of [...frontier].sort()) {
      const ancestor = nodesById.get(id);
      if (!ancestor) continue;
      const conferred = ruledOption(factByName(ancestor, 'authority'));
      if (conferred !== 'delegated' && conferred !== 'deferred') continue;
      if (best === null || (conferred === 'deferred' && best.class !== 'deferred')) {
        best = { class: conferred, id };
      }
    }
    if (best !== null) return { class: best.class, source: { kind: 'ancestor', id: best.id } };
    const next = new Set();
    for (const id of frontier) {
      visited.add(id);
      for (const parent of nodesById.get(id)?.under ?? []) {
        if (!visited.has(parent)) next.add(parent);
      }
    }
    frontier = [...next];
  }
  return { class: 'unanswered', source: null };
}

/**
 * A node's class, derived from the rulings on its facts and on its
 * ancestors' (see `classAndSource`). Never stored: a stamp beside the
 * rulings is a copy, and a copy drifts.
 *
 * @param {DeriveNode} node
 * @param {Map<string, DeriveNode>|DeriveNode[]|{nodes: DeriveNode[]}} graph
 * @returns {'ratified'|'delegated'|'deferred'|'unanswered'}
 */
export function deriveClass(node, graph) {
  return classAndSource(node, graph).class;
}

/**
 * Where a node's class came from: a ruling on the node itself, an ancestor
 * whose ruling confers it, or nothing at all (an unanswered node no ruling
 * reaches).
 *
 * @param {DeriveNode} node
 * @param {Map<string, DeriveNode>|DeriveNode[]|{nodes: DeriveNode[]}} graph
 * @returns {{kind: 'ruling'}|{kind: 'ancestor', id: string}|null}
 */
export function deriveClassSource(node, graph) {
  return classAndSource(node, graph).source;
}

/**
 * A node's status: `answered` when some ruling confers a class on it,
 * `unanswered` when none does -- in which state nothing on the node acts and
 * reconciling anything under it takes an explicit grant from the author
 * (commons.systems/disposition-graph/unanswered).
 *
 * @param {DeriveNode} node
 * @param {Map<string, DeriveNode>|DeriveNode[]|{nodes: DeriveNode[]}} graph
 * @returns {'answered'|'unanswered'}
 */
export function deriveStatus(node, graph) {
  return deriveClass(node, graph) === 'unanswered' ? 'unanswered' : 'answered';
}

/**
 * Find the nearest ratified ancestor of a node, walking `under` breadth
 * first (nearest depth first; ties among ratified ancestors at the same
 * depth broken by smallest id). Returns null when no ancestor is ratified,
 * including for a root. A node's own ruling never counts as its ceiling --
 * only strict ancestors are considered.
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
      if (isRatified(node)) ratifiedHere.push(id);
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

// ---------------------------------------------------------------------------
// the hashes: what stands, and what is recommended
// ---------------------------------------------------------------------------

/**
 * Strip the dialogue keys from a node file's raw frontmatter text, by line:
 * `stage`, `review`, `depends`, and `facts`, each together with every line
 * nested under it (indented relative to it), so that writing a hash into
 * `review.of` or a ruling's `of` -- or removing either afterward, or adding
 * an option to a fact -- never changes the standing hash. Operates on the
 * raw YAML source text, not the parsed object, because it is the *lines*
 * belonging to a key that must go, not just the key's value.
 *
 * `facts` is stripped although it is no longer dialogue state (the options
 * and their rulings persist after the ruling): what the standing hash is for
 * is the text that stands, and adding an option must not stale every pin.
 *
 * @param {string} fmText - the raw text between the frontmatter's `---`
 *   delimiters (as `read.mjs`'s `parseNode` extracts it, before YAML.parse).
 * @returns {string}
 */
function stripDialogueFrontmatterLines(fmText) {
  const removedKeyRe = /^(stage|review|depends|facts):/;
  let skipping = false;
  return String(fmText)
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
 * The exact text `deriveStandingHash` digests: the frontmatter with every
 * dialogue key removed, then a newline, the raw `## Answer` text ('' when
 * the node has none), a newline, and the raw `## Rationale` text ('' when it
 * has none). Exposed to `deriveFactRecommendationHash`, which folds it into
 * the answer fact's hash when no fence holds a newer text.
 *
 * @param {{fmText?: string, answer?: string|null, rationale?: string|null}} node
 * @returns {string}
 */
function standingText({ fmText, answer, rationale }) {
  return `${stripDialogueFrontmatterLines(fmText ?? '')}\n${answer ?? ''}\n${rationale ?? ''}`;
}

/**
 * The standing hash: the sha1 hex digest of the node *as it stands*, over
 * `standingText` above -- so the standing answer and the fields that carry
 * it are hashed, and the dialogue running beside them is not.
 *
 * A plain sha1 over synthesized text, not `blobSha1`'s git-blob framing:
 * the git framing exists so a hash matches `git hash-object` on a real
 * file's exact bytes, and this splice was never a file of its own.
 *
 * @param {{fmText: string, answer: string|null, rationale: string|null}} node
 * @returns {string} 40-hex sha1
 */
export function deriveStandingHash(node) {
  return sha1(standingText(node));
}

/**
 * The hash one fact's ruling pins: the recommendation as it stood when the
 * author ruled on it, by content and never by clock, so that a
 * recommendation re-affirmed is told from one changed
 * (commons.systems/disposition-graph/viable-options).
 *
 * It digests, in this order and newline-joined: the fact's name; the option
 * it `recommends`; its `boldness`; the `### <fact>` prose, which is why that
 * option is recommended; the recommended option's `#### <option>` prose, or
 * '' where it has none, as the option named by `stands` may; and, for the
 * answer fact alone, the recommended text in full -- the `## Recommendation`
 * fence's inner text where a fence holds it, and otherwise the standing
 * text, which is what the answer fact recommends when it recommends what
 * stands.
 *
 * The empty string, not a digest, when the fact recommends nothing: there is
 * no recommendation for a ruling to pin.
 *
 * @param {DeriveNode} node - the fact's own node, for the fence and the
 *   standing text.
 * @param {Fact} fact
 * @returns {string} 40-hex sha1, or '' when `recommends` is absent.
 */
export function deriveFactRecommendationHash(node, fact) {
  if (!fact || fact.recommends === null || fact.recommends === undefined) return '';
  const recommended = (fact.options ?? []).find((o) => o && o.name === fact.recommends) ?? null;
  const parts = [
    fact.name,
    fact.recommends,
    fact.boldness ?? '',
    fact.prose ?? '',
    recommended ? (recommended.prose ?? '') : '',
  ];
  if (fact.name === 'answer') {
    const fence = node?.fence ?? null;
    parts.push(fence && fence.raw !== undefined && fence.raw !== null ? fence.raw : standingText(node ?? {}));
  }
  return sha1(parts.join('\n'));
}

/**
 * The hash `review.of` pins: every fact's name and recommendation hash, in
 * `facts` order. A review reads the whole of what is recommended on a node,
 * so it goes stale when any fact's recommendation moves.
 *
 * @param {DeriveNode} node
 * @returns {string} 40-hex sha1
 */
export function deriveRecommendationHash(node) {
  const facts = node?.facts ?? [];
  return sha1(facts.map((f) => `${f.name}\n${deriveFactRecommendationHash(node, f)}`).join('\n'));
}

/**
 * Whether one fact's recommendation has moved since the author ruled on it:
 * the ruling's `of` no longer matches the fact's recommendation hash. False
 * for a fact with no ruling -- nothing has been answered for a move to
 * contradict.
 *
 * @param {DeriveNode} node
 * @param {Fact} fact
 * @returns {boolean}
 */
export function factMoved(node, fact) {
  const ruled = (fact?.options ?? []).find((o) => o && o.ruling);
  if (!ruled) return false;
  return ruled.ruling.of !== deriveFactRecommendationHash(node, fact);
}

/**
 * Whether any ruled fact's recommendation has moved since its ruling. On a
 * ratified node this is what `proposal` names; on a delegated node the
 * answer fact's recommendation may move freely without moving the ruling on
 * the authority fact, which is how a delegated node stays off the alignment
 * frontier.
 *
 * @param {DeriveNode} node
 * @returns {boolean}
 */
export function moved(node) {
  return (node?.facts ?? []).some((f) => factMoved(node, f));
}

/**
 * Whether the review recorded on a node reads a recommendation that has
 * since moved. False with no review at all.
 *
 * @param {DeriveNode} node
 * @returns {boolean}
 */
export function reviewStale(node) {
  return !!node?.review && node.review.of !== deriveRecommendationHash(node);
}

/**
 * Whether the node is on the alignment frontier: it carries a stage, the
 * next movement of the dialogue owed on it. The frontier is a projection of
 * this state and the record stores neither frontier.
 *
 * @param {DeriveNode} node
 * @returns {boolean}
 */
export function onFrontier(node) {
  return node?.stage !== null && node?.stage !== undefined;
}

/**
 * A proposal: a ratified node whose recommendation has moved from the
 * confirmed choice, wherever the move came from -- the origin being the
 * option's source. The confirmed choice keeps its full authority; what
 * changes is that the node returns to the alignment frontier for
 * re-confirmation.
 *
 * Needs no graph: ratified is the one class that is never conferred from
 * above (`isRatified`).
 *
 * @param {DeriveNode} node
 * @returns {boolean}
 */
export function proposal(node) {
  return isRatified(node) && moved(node);
}

/**
 * A ratified node whose ruled option is not the one the AI recommends: the
 * author overruled the recommendation at the ruling. Shown by the
 * projections beside the confirmed choice, and *not* on the frontier -- the
 * author has already answered this, and only a recommendation moved *since*
 * the ruling (`proposal`) asks them again.
 *
 * @param {DeriveNode} node
 * @returns {boolean}
 */
export function divergesFromRecommendation(node) {
  const answer = factByName(node, 'answer');
  const ruled = ruledOption(answer);
  if (ruled === null) return false;
  return answer.recommends !== null && answer.recommends !== undefined && answer.recommends !== ruled;
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
 * decisions a ruling on this node settles, on top of the node itself. Two
 * components go into `settles`, plus a third carried alongside it but not
 * summed in:
 *
 * - `under`: the node's strict descendants (`deriveDescendants`, following
 *   `children` transitively) that carry a stage -- a ruling on the ancestor
 *   can move the ceiling a descendant answers under, or free the descendant
 *   to be ruled on in its own turn. Carrying a stage is what the alignment
 *   frontier means now that the class is derived: a node with no stage,
 *   whatever its class, is not waiting on anything.
 * - `depends`: every node whose `depends` names this one, in any entry
 *   (qualified by an option or not), except one already counted under
 *   `under` -- a dependant elsewhere in the graph is waiting on this
 *   node's ruling just as surely as a descendant is.
 * - `options`: the node's own answer fact's option count. It is not summed
 *   into `settles`: an option pending on this node is this node's own
 *   ruling, not a separate decision elsewhere that ruling reaches, so it
 *   settles nothing beyond the node itself and orders nothing against it.
 *   It is carried on the record because it tells a reader how much a
 *   sitting on this node will cost -- how many options the dialogue has to
 *   work through -- even though it makes no other node decidable.
 *
 * `settles` is `under + depends`, reach only. Computed for every node,
 * pure and deterministic: nothing here is randomized or depends on
 * wall-clock time.
 *
 * @param {DeriveNode[]} nodes - each also carrying `stage`, `facts`, and
 *   `depends` (`{id: string, option: string|null}[]`, or absent).
 * @param {Map<string, string[]>} childrenMap - as returned by
 *   `deriveChildren`.
 * @returns {Map<string, {settles: number, under: number, options: number, depends: number}>}
 */
export function deriveSettles(nodes, childrenMap) {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const result = new Map();
  for (const node of nodes) {
    const descendants = deriveDescendants([node.id], childrenMap);
    const under = new Set(
      [...descendants].filter((id) => onFrontier(nodesById.get(id))),
    );
    const dependants = new Set();
    for (const other of nodes) {
      if (under.has(other.id)) continue;
      if ((other.depends ?? []).some((d) => d.id === node.id)) dependants.add(other.id);
    }
    const options = (factByName(node, 'answer')?.options ?? []).length;
    result.set(node.id, {
      settles: under.size + dependants.size,
      under: under.size,
      options,
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

/**
 * The derived inverse of the readings' `bears`: for every node, fact, and
 * option, the readings that bear on it, each with the relation it records.
 * A tradition "chosen over" is derived rather than stored -- it is a reading
 * `adopted` on an option that was not chosen.
 *
 * @param {DeriveNode[]} nodes - each optionally carrying `bears`
 *   (`{node: string, fact: string, option: string, relation: string}[]`).
 * @returns {Map<string, {id: string, relation: string}[]>} keyed
 *   `<node id>\n<fact>\n<option>`, each list in reading-id order.
 */
export function deriveReadings(nodes) {
  const result = new Map();
  for (const reading of [...nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    for (const bears of reading.bears ?? []) {
      if (!bears || typeof bears.node !== 'string') continue;
      const key = `${bears.node}\n${bears.fact}\n${bears.option}`;
      if (!result.has(key)) result.set(key, []);
      result.get(key).push({ id: reading.id, relation: bears.relation });
    }
  }
  return result;
}
