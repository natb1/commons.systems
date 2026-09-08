#!/usr/bin/env node
// migrate-pins.mjs -- rewrite the pins the record already carries into the
// narrowed recommendation hash.
//
//   node packages/disposition/migrate-pins.mjs <graph dir>
//     [--sidecar <path to survey.pins.json>] [--dry]
//
// `a-pin-moves-on-what-binds-the-node` narrows what the recommendation hash
// covers to what binds the node -- the question, which option the answer
// fact recommends, that option's sentence, its resolved content and the
// ledger addresses it references, and the status any option of the fact
// carries -- and says in the same breath what to do with the pins written in
// the old form: "The pins the record already carries are migrated once and in
// the same act: a pin whose recorded hash is the node's hash in the old form
// is rewritten to the new form, nothing the reader read having changed, and a
// pin already stale in the old form stays stale, so the node is judged
// exactly as it would have been."
//
// So this is the one act, and it is a rewrite of values and of nothing else.
// Three kinds of pin live in a node's frontmatter -- `review.of`,
// `review.survey.of` and each ruled option's `ruling.of` -- and one lives in
// the survey's sidecar, `pins[<node id>]`. Each is compared against the hash
// the same node would have had under the old encoding: equal, and it is
// rewritten to the new one, which is what "nothing the reader read having
// changed" means; anything else, and it is left exactly as it stands, which
// is what keeps an already-stale pin stale.
//
// The node file is edited surgically -- only the `of:` line's value moves,
// through `repinDialogue`, and the YAML is never re-serialized -- so every
// other byte of the file is the byte it was.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  deriveFactRecommendationHash,
  deriveLegacyFactRecommendationHash,
  deriveLegacyRecommendationHash,
  deriveRecommendationHash,
} from './derive.mjs';
import { repinDialogue } from './migrate.mjs';
import { readGraph } from './read.mjs';

const USAGE = 'usage: node migrate-pins.mjs <graph dir> [--sidecar <path to survey.pins.json>] [--dry]';

/**
 * Split a node file the way `read.mjs` does: the opening `---` line, the
 * frontmatter lines up to the next line that is `---`, and everything from
 * that closing delimiter on, kept verbatim.
 *
 * @param {string} text
 * @returns {{open: string, fmText: string, rest: string}|null} null where the
 *   file carries no closed frontmatter, which is a file this tool leaves
 *   alone (the reader has already refused it).
 */
export function splitFrontmatter(text) {
  const lines = String(text).split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') return null;
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) return null;
  return {
    open: lines[0],
    fmText: lines.slice(1, end).join('\n'),
    rest: lines.slice(end).join('\n'),
  };
}

/**
 * Put a node file back together from what `splitFrontmatter` returned, with
 * the frontmatter text replaced. Byte-identical to the input where the
 * frontmatter text is unchanged.
 *
 * @param {{open: string, rest: string}} split
 * @param {string} fmText
 * @returns {string}
 */
export function joinFrontmatter(split, fmText) {
  return `${split.open}\n${fmText}\n${split.rest}`;
}

/**
 * The two hashes of one node: what its pins say today, in the old encoding,
 * and what they must say to mean the same thing under the new one. Also the
 * same pair for every fact, which is what a ruling pins.
 *
 * @param {object} node - a node as `readGraph` returns it.
 * @returns {{oldNode: string, newNode: string,
 *   facts: Map<string, {old: string, new: string}>}}
 */
export function hashesOf(node) {
  const facts = new Map();
  for (const fact of node.facts ?? []) {
    facts.set(fact.name, {
      old: deriveLegacyFactRecommendationHash(node, fact),
      new: deriveFactRecommendationHash(node, fact),
    });
  }
  return {
    oldNode: deriveLegacyRecommendationHash(node),
    newNode: deriveRecommendationHash(node),
    facts,
  };
}

/**
 * What one pin's fate is: 'rewritten' where it holds the old-form hash and
 * the two forms differ, 'current' where it already holds the new-form hash
 * (a node whose two forms coincide, and every pin written after this
 * migration), 'stale' where it holds neither and is left alone, and null
 * where there is no such pin.
 *
 * @param {string|null|undefined} pin
 * @param {string} oldHash
 * @param {string} newHash
 * @returns {'rewritten'|'current'|'stale'|null}
 */
export function fateOf(pin, oldHash, newHash) {
  if (pin === null || pin === undefined || pin === '') return null;
  if (pin === newHash) return 'current';
  if (pin === oldHash) return 'rewritten';
  return 'stale';
}

/**
 * Plan one node's rewrite: which of its pins move, and to what. Writes
 * nothing.
 *
 * @param {object} node
 * @returns {{id: string, path: string,
 *   review: {from: string, to: string}|null,
 *   survey: {from: string, to: string}|null,
 *   rulings: Array<{fact: string, option: string, from: string, to: string}>,
 *   stale: Array<{kind: string, fact?: string, option?: string, pin: string}>,
 *   current: number}}
 */
export function planNode(node) {
  const hashes = hashesOf(node);
  const plan = {
    id: node.id,
    path: node.path,
    review: null,
    survey: null,
    rulings: [],
    stale: [],
    current: 0,
  };

  const record = (kind, fate, pin, extra = {}) => {
    if (fate === 'stale') plan.stale.push({ kind, pin, ...extra });
    else if (fate === 'current') plan.current += 1;
  };

  const reviewPin = node.review?.of ?? null;
  const reviewFate = fateOf(reviewPin, hashes.oldNode, hashes.newNode);
  if (reviewFate === 'rewritten') plan.review = { from: reviewPin, to: hashes.newNode };
  else record('review', reviewFate, reviewPin);

  const surveyPin = node.review?.survey?.of ?? null;
  const surveyFate = fateOf(surveyPin, hashes.oldNode, hashes.newNode);
  if (surveyFate === 'rewritten') plan.survey = { from: surveyPin, to: hashes.newNode };
  else record('survey', surveyFate, surveyPin);

  for (const fact of node.facts ?? []) {
    const pair = hashes.facts.get(fact.name) ?? { old: '', new: '' };
    for (const option of fact.options ?? []) {
      const pin = option?.ruling?.of ?? null;
      const fate = fateOf(pin, pair.old, pair.new);
      if (fate === 'rewritten') {
        plan.rulings.push({ fact: fact.name, option: option.name, from: pin, to: pair.new });
      } else {
        record('ruling', fate, pin, { fact: fact.name, option: option.name });
      }
    }
  }

  return plan;
}

/**
 * Apply one node's plan to its file text. Returns the text unchanged where
 * the plan moves nothing.
 *
 * @param {string} text - the node file's whole text.
 * @param {ReturnType<typeof planNode>} plan
 * @returns {string}
 */
export function applyPlan(text, plan) {
  if (plan.review === null && plan.survey === null && plan.rulings.length === 0) return text;
  const split = splitFrontmatter(text);
  if (split === null) return text;
  const rulings = new Map(plan.rulings.map((r) => [`${r.fact}\n${r.option}`, r.to]));
  const applied = repinDialogue(split.fmText, {
    review: plan.review === null ? null : plan.review.to,
    survey: plan.survey === null ? null : plan.survey.to,
    rulings,
  });
  return joinFrontmatter(split, applied.text);
}

/**
 * Rewrite the survey's sidecar in place: every `pins[<id>]` holding a node's
 * old-form hash becomes its new-form hash, and every `of` on a judged entry
 * -- wherever a sidecar carries one -- is read the same way. The `read`
 * list's five section hashes pin the *text* a reader read and are no part of
 * this narrowing, so they are not touched.
 *
 * @param {object} sidecar - the parsed sidecar, mutated in place.
 * @param {Map<string, {old: string, new: string}>} byId
 * @returns {{rewritten: number, stale: number, current: number,
 *   moves: Array<{id: string, from: string, to: string}>}}
 */
export function migrateSidecar(sidecar, byId) {
  const out = { rewritten: 0, stale: 0, current: 0, moves: [] };
  const step = (id, pin, set) => {
    if (pin === null || pin === undefined || pin === '') return;
    // A pin on an id the graph no longer carries is stale by definition:
    // there is no node whose old form it could be.
    const hashes = byId.get(id);
    if (!hashes) { out.stale += 1; return; }
    const fate = fateOf(pin, hashes.old, hashes.new);
    if (fate === null) return;
    if (fate === 'rewritten') {
      set(hashes.new);
      out.rewritten += 1;
      out.moves.push({ id, from: pin, to: hashes.new });
    } else if (fate === 'current') out.current += 1;
    else out.stale += 1;
  };

  const pins = sidecar?.pins;
  if (pins && typeof pins === 'object' && !Array.isArray(pins)) {
    for (const id of Object.keys(pins)) {
      step(id, pins[id], (next) => { pins[id] = next; });
    }
  }
  for (const entry of Array.isArray(sidecar?.read) ? sidecar.read : []) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.of === undefined || entry.of === null) continue;
    step(entry.id, entry.of, (next) => { entry.of = next; });
  }
  return out;
}

/**
 * @param {string[]} argv
 * @returns {{dir: string, sidecar: string|null, dry: boolean}}
 */
export function parseArgs(argv) {
  let dir = null;
  let sidecar = null;
  let dry = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry') { dry = true; continue; }
    if (arg === '--sidecar') {
      i += 1;
      if (i >= argv.length) throw new Error(`--sidecar needs a path\n${USAGE}`);
      sidecar = argv[i];
      continue;
    }
    if (arg.startsWith('--')) throw new Error(`unknown flag '${arg}'\n${USAGE}`);
    if (dir !== null) throw new Error(`unexpected argument '${arg}'\n${USAGE}`);
    dir = arg;
  }
  if (dir === null) throw new Error(USAGE);
  return { dir, sidecar, dry };
}

/**
 * The migration itself.
 *
 * @param {{dir: string, sidecar?: string|null, dry?: boolean}} opts
 * @returns {Promise<{lines: string[], counts: object}>}
 */
export async function migratePins({ dir, sidecar = null, dry = false }) {
  const graph = await readGraph(dir);
  const lines = [];
  const counts = {
    nodes: graph.nodes.length,
    review: 0,
    survey: 0,
    ruling: 0,
    sidecar: 0,
    stale: { review: 0, survey: 0, ruling: 0, sidecar: 0 },
    current: 0,
    files: 0,
  };
  const byId = new Map();

  for (const node of graph.nodes) {
    const hashes = hashesOf(node);
    byId.set(node.id, { old: hashes.oldNode, new: hashes.newNode });
    const plan = planNode(node);
    counts.current += plan.current;
    for (const stale of plan.stale) counts.stale[stale.kind] += 1;
    for (const stale of plan.stale) {
      lines.push(`stale  ${node.id}: ${stale.kind}${stale.fact ? ` ${stale.fact}/${stale.option}` : ''} pin ${stale.pin} is past the recommendation in both forms and is left as it stands`);
    }
    if (plan.review !== null) {
      counts.review += 1;
      lines.push(`repin  ${node.id}: review.of ${plan.review.from} -> ${plan.review.to}`);
    }
    if (plan.survey !== null) {
      counts.survey += 1;
      lines.push(`repin  ${node.id}: review.survey.of ${plan.survey.from} -> ${plan.survey.to}`);
    }
    for (const ruling of plan.rulings) {
      counts.ruling += 1;
      lines.push(`repin  ${node.id}: ${ruling.fact}/${ruling.option} ruling.of ${ruling.from} -> ${ruling.to}`);
    }
    if (plan.review === null && plan.survey === null && plan.rulings.length === 0) continue;

    const file = path.join(dir, node.path);
    const text = await readFile(file, 'utf8');
    const next = applyPlan(text, plan);
    if (next === text) continue;
    counts.files += 1;
    if (!dry) await writeFile(file, next);
  }

  if (sidecar !== null) {
    const raw = await readFile(sidecar, 'utf8');
    const parsed = JSON.parse(raw);
    const result = migrateSidecar(parsed, byId);
    counts.sidecar = result.rewritten;
    counts.stale.sidecar = result.stale;
    counts.current += result.current;
    for (const move of result.moves) {
      lines.push(`repin  ${move.id}: sidecar pin ${move.from} -> ${move.to}`);
    }
    if (!dry && result.rewritten > 0) {
      await writeFile(sidecar, `${JSON.stringify(parsed, null, 2)}\n`);
    }
  }

  return { lines, counts };
}

/** The one-screen summary the run ends on. */
export function summarize(counts, { dry }) {
  const staleTotal = counts.stale.review + counts.stale.survey + counts.stale.ruling + counts.stale.sidecar;
  return [
    `nodes scanned: ${counts.nodes}`,
    `pins rewritten: ${counts.review + counts.survey + counts.ruling + counts.sidecar}`
      + ` (review ${counts.review}, survey ${counts.survey}, ruling ${counts.ruling}, sidecar ${counts.sidecar})`,
    `pins left stale: ${staleTotal}`
      + ` (review ${counts.stale.review}, survey ${counts.stale.survey}, ruling ${counts.stale.ruling}, sidecar ${counts.stale.sidecar})`,
    `pins already in the new form: ${counts.current}`,
    `node files ${dry ? 'that would be rewritten' : 'rewritten'}: ${counts.files}`,
    dry ? 'dry run: nothing was written' : 'written',
  ];
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const { lines, counts } = await migratePins(opts);
    for (const line of lines) console.log(line);
    console.log('');
    for (const line of summarize(counts, { dry: opts.dry })) console.log(line);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
