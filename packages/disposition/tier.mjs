#!/usr/bin/env node
// packages/disposition/tier.mjs
//
// The mechanical tier of commons.systems/disposition-graph/survey-selection,
// the option `the-mechanical-tier-gates-the-launch`: "the set of checks the
// validator holds and runs over the whole graph before a brief is written,
// and no reader is launched while one of them reports a finding".
//
// The checks are exactly the ones that answer's paragraph lists, and no
// others -- the tier's bound is part of the rule, "a check enters it only
// where it is obviously right when it fires, and anything merely probable
// enters the brief as a hint the reader may ignore and never as a gate". So
// nothing here is a heuristic: every check below is decidable from the schema
// or from text as bytes, which is also `frontier-consistency`'s line between
// what a validator may hold and what stays with the reader.
//
//   unresolved-reference        a `depends`, `bears` or `under` naming a node
//                               the graph does not carry, or an option that
//                               node does not carry
//   recommendation-past-its-pin a pin naming a recommendation the node has
//                               since moved past, where no reading is owed
//                               that would read it again
//   duplicate-option-name       two options of one name on one fact
//   option-content-unresolvable content resolving through a cycle, through a
//                               name no option carries, or through a hunk
//                               that does not apply exactly
//   term-without-a-path         a term used by a node with no path to the
//                               node whose `defines` carries it, off
//                               `concordance.mjs`
//   unresolved-words-reference  a reference to the author's words resolving
//                               to no ledger entry
//   duplicated-passage          a passage of 200 bytes or more byte-identical
//                               across two nodes
//   unfolded-account-section    an account section the accumulation's fold
//                               could have reached and has not
//
// Four of these -- the unresolved reference, the unresolved words reference,
// the option content, and (for `under`) the reference check -- are today
// refused by `read.mjs` at parse time, so a graph that reads at all carries
// none of them. They are in the tier all the same, because the tier is what
// the answer says the validator holds and not what the reader happens to
// refuse this week: a graph object built by hand, a reader whose refusal is
// relaxed to a finding, or a check moved off the parse path all leave the
// tier saying the same thing. A check that cannot fire still ran, and the
// run reports it as having run, which is the answer's own rule that "a clean
// tier is not a clean frontier and is never reported as one: the reading's
// own report says which checks ran".
//
// An entry of the author's words that no option references is not a tier
// finding: the answer puts it "beside the tier", where it "gates nothing,
// since it may be context the record has not yet attached". `tierNotes`
// returns those; `checkTier` never does.
import { resolveOptionContent } from './read.mjs';
import { concordance, nodeText } from './concordance.mjs';

/**
 * The checks the tier holds, in the order the answer lists them. Reported by
 * every run, clean or not.
 */
export const TIER_CHECKS = [
  'unresolved-reference',
  'recommendation-past-its-pin',
  'duplicate-option-name',
  'option-content-unresolvable',
  'term-without-a-path',
  'unresolved-words-reference',
  'duplicated-passage',
  'unfolded-account-section',
];

/** The byte length at which a passage shared by two nodes is a finding. */
export const PASSAGE_BYTES = 200;

const WORDS_REFERENCE_RE = /^words\/\d{4}-\d{2}-\d{2}\/\d+$/;
const READING_HEADING_RE = /^Clean-context (?:review|re-reading), /;

/**
 * Every fence-aware `### ` heading of a text, each `{name, index}` with
 * `index` the zero-based line it starts on. A heading-looking line inside a
 * fenced block is not a heading, which matters here because an account
 * quotes node text in fences.
 */
function level3Headings(text) {
  const lines = String(text).split('\n');
  const headings = [];
  let fenceChar = null;
  for (let i = 0; i < lines.length; i += 1) {
    const fence = lines[i].match(/^[ \t]*(`{3,}|~{3,})/);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      continue;
    }
    if (fenceChar !== null) continue;
    const m = lines[i].match(/^(#{1,6})[ \t]+(.*?)\s*$/);
    if (m && m[1].length === 3) headings.push({ name: m[2], index: i });
  }
  return { lines, headings };
}

/**
 * The default reading of "an account section the fold could have reached and
 * has not": on a node at the review or the ruling stage, every `### ` section
 * of `## Account` that precedes the section of the last clean-context reading
 * on it. That is the accumulation node's own list -- "every `## Account`
 * section before the last clean-context reading's section, since that
 * reading's findings and the session's replies to them are what a re-reading
 * is given" -- and the last reading is found the way `brief.mjs` finds it,
 * by the headings its own apply step writes.
 *
 * Overridden wherever `accumulate.mjs` supplies a `foldable(node)`: the fold
 * is that instrument's, and a tier that kept a second definition of it would
 * be checking its own guess and not the fold.
 *
 * @param {object} node
 * @returns {Array<{name: string, index: number}>} the sections that could
 *   have been folded and have not been, in file order.
 */
export function foldableSections(node) {
  if (node?.stage !== 'review' && node?.stage !== 'ruling') return [];
  const account = node?.account;
  if (!account) return [];
  const { headings } = level3Headings(account);
  let last = -1;
  headings.forEach((h, i) => {
    if (READING_HEADING_RE.test(h.name)) last = i;
  });
  if (last <= 0) return [];
  return headings.slice(0, last);
}

/**
 * The passages of one node: every paragraph (a maximal run of non-blank
 * lines) of its text, and every sentence of every paragraph. Two
 * granularities because the record writes a paragraph as one unwrapped line
 * and the duplication it has actually met has been of both kinds -- a whole
 * boilerplate paragraph, and "a byte-identical sentence on forty-six nodes"
 * (the survey of 2026-09-05, quoted on `survey-selection`) buried in
 * paragraphs that otherwise differ. Only trailing whitespace is stripped:
 * the check is byte identity, and any normalization beyond that would make
 * it a resemblance check, which the tier's bound excludes.
 */
function passagesOf(text) {
  const out = new Set();
  for (const para of String(text).split(/\n[ \t]*\n/)) {
    const block = para.replace(/\s+$/, '').replace(/^\s+/, '');
    if (block === '') continue;
    if (Buffer.byteLength(block, 'utf8') >= PASSAGE_BYTES) out.add(block);
    for (const raw of block.split(/(?<=[.?!])\s+/)) {
      const sentence = raw.replace(/\s+$/, '');
      if (Buffer.byteLength(sentence, 'utf8') >= PASSAGE_BYTES) out.add(sentence);
    }
  }
  return out;
}

/**
 * The tier's findings over one graph, in check order and then in node order.
 *
 * @param {{nodes: object[]}} graph - a graph as `readGraph` returns it.
 * @param {{words?: Map<string, object>, foldable?: (node: object) => unknown}} [options]
 *   `words` is the ledger (`graph.words`); `foldable`, where given, is
 *   `accumulate.mjs`'s own reading of what the fold could reach, used in
 *   place of `foldableSections`; `concordance`, where given, is one already
 *   derived over the same graph, so a caller that has both the tier and the
 *   concordance to render walks the terms once.
 * @returns {Array<{check: string, node: string|null, detail: string}>}
 */
export function checkTier(graph, { words = null, foldable = null, concordance: conc = null } = {}) {
  const nodes = Array.isArray(graph) ? graph : (graph?.nodes ?? []);
  const ledger = words ?? (Array.isArray(graph) ? null : graph?.words) ?? new Map();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const findings = [];
  const add = (check, node, detail) => findings.push({ check, node, detail });

  // unresolved-reference
  for (const node of nodes) {
    for (const id of node.under ?? []) {
      if (!byId.has(id)) add('unresolved-reference', node.id, `'under' names ${id}, which is not a node of this graph`);
    }
    for (const d of node.depends ?? []) {
      const target = byId.get(d.id) ?? null;
      if (target === null) {
        add('unresolved-reference', node.id, `'depends' names ${d.id}, which is not a node of this graph`);
        continue;
      }
      if (d.option && !(target.facts ?? []).some((f) => (f.options ?? []).some((o) => o.name === d.option))) {
        add('unresolved-reference', node.id, `'depends' names ${d.id}#${d.option}, and ${d.id} carries no option '${d.option}'`);
      }
    }
    for (const b of node.bears ?? []) {
      const targetId = b.node ?? ((node.under ?? []).length === 1 ? node.under[0] : null);
      if (targetId === null) {
        add('unresolved-reference', node.id, `'bears' entry on fact '${b.fact}' names no node and the reading has ${(node.under ?? []).length} parents`);
        continue;
      }
      const target = byId.get(targetId) ?? null;
      if (target === null) {
        add('unresolved-reference', node.id, `'bears' names ${targetId}, which is not a node of this graph`);
        continue;
      }
      const fact = (target.facts ?? []).find((f) => f.name === b.fact) ?? null;
      if (fact === null) {
        add('unresolved-reference', node.id, `'bears' names ${targetId}#${b.fact}, and ${targetId} carries no fact '${b.fact}'`);
      } else if (!(fact.options ?? []).some((o) => o.name === b.option)) {
        add('unresolved-reference', node.id, `'bears' names ${targetId}#${b.fact}#${b.option}, and that fact carries no option '${b.option}'`);
      }
    }
  }

  // recommendation-past-its-pin
  //
  // A pin naming a recommendation the node has moved past, where nothing in
  // the record will re-read it. The second clause is the whole of the check
  // and is not a softening of it.
  //
  // A stale pin on a node at the review or the ruling stage is the record's
  // ordinary business and never a finding: a stale survey pin is the
  // definition of the survey's judged set (`surveyOwed`), and a stale draft
  // pin is what `chooseMode` turns into the delta re-reading. A tier that
  // fired on those would fire on every node the survey was about to judge
  // and no survey could ever launch -- the gate would make the reading it
  // gates impossible, which is not a check that is "obviously right when it
  // fires" but the reading's own subject matter mistaken for a defect. It
  // was written that way on 2026-09-07 and reported 55 findings on the real
  // graph, every one of them a node the survey existed to read.
  //
  // Off those two stages nothing re-reads the node: `surveyOwed` is false,
  // `chooseMode` is never called, and the verdict or the pin stands over
  // text no reading has seen. That is the defect, and it is decidable from
  // the bytes. A ruling past its pin is a finding wherever the node carries
  // no stage at all, which is the state `read.mjs` already refuses to leave
  // implicit ("has a recommendation that has moved since its ruling and must
  // carry stage"); with a stage, the node is a proposal and is on the
  // alignment frontier, which `authority` makes a first-class state and not
  // a defect.
  for (const node of nodes) {
    const stage = node.stage ?? null;
    const reread = stage === 'review' || stage === 'ruling';
    const review = node.review ?? null;
    if (review !== null && !reread) {
      if (review.of !== null && review.of !== undefined && review.of !== node.recommendationHash) {
        add('recommendation-past-its-pin', node.id, `the draft review of ${review.date} pins ${review.of}, the recommendation now stands at ${node.recommendationHash}, and at stage ${stage ?? 'none'} no re-reading is owed`);
      }
      const survey = review.survey ?? null;
      // A read pin (no `of`) judged nothing, so it has no recommendation to
      // stand past: it is written at any stage, including off review and
      // ruling, precisely to freeze a node's text without counting it as
      // judged (commons.systems/disposition-graph/survey-selection,
      // `the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`).
      if (survey !== null && survey.of !== null && survey.of !== undefined && survey.of !== node.recommendationHash) {
        add('recommendation-past-its-pin', node.id, `the survey of ${survey.date} pins ${survey.of}, the recommendation now stands at ${node.recommendationHash}, and at stage ${stage ?? 'none'} no survey will judge it again`);
      }
    }
    if (stage !== null) continue;
    for (const fact of node.facts ?? []) {
      // `fact.moved` is the record's own test, and it is per fact: a ruling
      // pins the fact's recommendation hash and not the node's. `read.mjs`
      // refuses a node that has moved past a ruling and carries no stage, so
      // this limb cannot fire on a graph that parses -- it is here for the
      // reason the header gives, that the tier says what the validator holds
      // and not what the reader happens to refuse this week.
      if (!fact.moved) continue;
      const ruled = (fact.options ?? []).find((o) => o && o.ruling) ?? null;
      if (ruled === null) continue;
      add('recommendation-past-its-pin', node.id, `fact '${fact.name}' option '${ruled.name}' carries a ruling of ${ruled.ruling.date} pinning ${ruled.ruling.of}, the fact's recommendation has moved past it, and the node carries no stage`);
    }
  }

  // duplicate-option-name
  for (const node of nodes) {
    for (const fact of node.facts ?? []) {
      const seen = new Set();
      for (const option of fact.options ?? []) {
        if (seen.has(option.name)) {
          add('duplicate-option-name', node.id, `fact '${fact.name}' carries two options named '${option.name}'`);
        }
        seen.add(option.name);
      }
    }
  }

  // option-content-unresolvable
  for (const node of nodes) {
    for (const fact of node.facts ?? []) {
      for (const option of fact.options ?? []) {
        if (!option.content) continue;
        try {
          resolveOptionContent(node, fact.name, option.name);
        } catch (err) {
          add('option-content-unresolvable', node.id, err.message.replace(`${node.id}: `, ''));
        }
      }
    }
  }

  // term-without-a-path
  for (const entry of (conc ?? concordance({ nodes })).terms) {
    for (const user of entry.users) {
      if (user.reachable) continue;
      add('term-without-a-path', user.node, `uses the term '${entry.term}', which ${entry.defines} defines, with no path to it over 'under', 'depends' or 'cites'`);
    }
  }

  // unresolved-words-reference
  for (const node of nodes) {
    for (const fact of node.facts ?? []) {
      for (const option of fact.options ?? []) {
        for (const key of ['supports', 'diverges']) {
          for (const ref of option[key] ?? []) {
            if (!WORDS_REFERENCE_RE.test(String(ref))) {
              add('unresolved-words-reference', node.id, `fact '${fact.name}' option '${option.name}' ${key} names '${ref}', which is not the shape of a ledger address`);
            } else if (!ledger.has(ref)) {
              add('unresolved-words-reference', node.id, `fact '${fact.name}' option '${option.name}' ${key} names ${ref}, which resolves to no entry of the ledger`);
            }
          }
        }
      }
    }
  }

  // duplicated-passage
  const byPassage = new Map();
  for (const node of nodes) {
    for (const passage of passagesOf(nodeText(node))) {
      if (!byPassage.has(passage)) byPassage.set(passage, []);
      byPassage.get(passage).push(node.id);
    }
  }
  const shared = [...byPassage.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort((a, b) => b[0].length - a[0].length);
  // A sentence inside a paragraph this run already reports, on exactly the
  // same nodes, is the same defect said twice; the longest passage carrying
  // it is the one reported.
  const kept = [];
  for (const [passage, ids] of shared) {
    const key = ids.join('\n');
    if (kept.some((k) => k.key === key && k.passage.includes(passage))) continue;
    kept.push({ passage, ids, key });
  }
  kept.sort((a, b) => (a.ids[0] < b.ids[0] ? -1 : a.ids[0] > b.ids[0] ? 1 : 0));
  for (const { passage, ids } of kept) {
    const excerpt = passage.length > 120 ? `${passage.slice(0, 117)}...` : passage;
    add('duplicated-passage', ids[0], `${Buffer.byteLength(passage, 'utf8')} bytes byte-identical with ${ids.slice(1).join(', ')}: "${excerpt}"`);
  }

  // unfolded-account-section
  for (const node of nodes) {
    const sections = foldable ? foldable(node) : foldableSections(node);
    const list = Array.isArray(sections) ? sections : [];
    if (list.length === 0) continue;
    const names = list.map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
    add('unfolded-account-section', node.id, `${list.length} '### ' account section(s) stand before the last clean-context reading's and the fold has not reached them${names.length > 0 ? `: ${names.join('; ')}` : ''}`);
  }

  const order = new Map(TIER_CHECKS.map((c, i) => [c, i]));
  findings.sort((a, b) => (order.get(a.check) - order.get(b.check))
    || (a.node < b.node ? -1 : a.node > b.node ? 1 : 0));
  return findings;
}

/**
 * What is reported beside the tier and gates nothing: an entry of the
 * author's words that no option anywhere references, "since it may be
 * context the record has not yet attached" (`survey-selection`). The reader
 * already derives these onto `graph.findings`; they are re-derived here so
 * that a caller holding a graph object alone gets the same note, and so that
 * nothing in the gate's own return value has to be filtered out of it.
 *
 * @param {{nodes: object[], words?: Map<string, object>}} graph
 * @param {{words?: Map<string, object>}} [options]
 * @returns {Array<{note: string, detail: string}>}
 */
export function tierNotes(graph, { words = null } = {}) {
  const nodes = Array.isArray(graph) ? graph : (graph?.nodes ?? []);
  const ledger = words ?? (Array.isArray(graph) ? null : graph?.words) ?? new Map();
  const referenced = new Set();
  for (const node of nodes) {
    for (const fact of node.facts ?? []) {
      for (const option of fact.options ?? []) {
        for (const key of ['supports', 'diverges']) {
          for (const ref of option[key] ?? []) referenced.add(ref);
        }
      }
    }
  }
  const notes = [];
  for (const address of [...ledger.keys()].sort()) {
    if (referenced.has(address)) continue;
    notes.push({ note: 'unreferenced-ledger-entry', detail: `the ledger entry ${address} is referenced by no option` });
  }
  return notes;
}

/**
 * `accumulate.mjs`'s own `foldable(node)`, where that instrument exists and
 * exports one, and `null` otherwise. The accumulation is a separate unit on
 * its own schedule; the tier runs whether or not it has landed, and uses its
 * definition of the fold the moment it has.
 *
 * @returns {Promise<((node: object) => unknown)|null>}
 */
export async function loadFoldable() {
  try {
    const mod = await import('./accumulate.mjs');
    return typeof mod.foldable === 'function' ? mod.foldable : null;
  } catch {
    return null;
  }
}
