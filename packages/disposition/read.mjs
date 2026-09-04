#!/usr/bin/env node
// packages/disposition/read.mjs
//
// Parses and validates one disposition graph (a `disposition.yaml` manifest
// plus one markdown file per node) into a plain object tree.
//
// The encoding changed on 2026-09-04
// (commons.systems/disposition-graph/viable-options): a node's authority is
// no longer a stamp. Every decision on a node is a `facts` entry with a list
// of viable `options`; the AI marks the one it `recommends` with a
// `boldness`; the author's ruling is recorded on the option they chose; and
// the class -- ratified, delegated, deferred, unanswered -- is derived from
// those rulings by `derive.mjs`, never stored. The node-level `authority`,
// `alternatives` and `recommendation` keys are gone, `## Alternatives` with
// them, and a reading says what it `bears` on rather than carrying one
// `relation` for the whole node.
//
// `yaml` resolves from this repo's ancestor node_modules (there is none
// inside this worktree) -- the bootstrap shim declared on materialization.
import YAML from 'yaml';

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  blobSha1,
  canonicalizeId,
  deriveAncestors,
  deriveCeiling,
  deriveChildren,
  deriveClass,
  deriveClassSource,
  deriveDescendants,
  deriveFactRecommendationHash,
  deriveRank,
  deriveReadings,
  deriveRecommendationHash,
  deriveSettles,
  deriveStandingHash,
  deriveStatus,
  divergesFromRecommendation,
  factByName,
  factMoved,
  moved,
  onFrontier,
  proposal,
  reviewStale,
  ruledOption,
} from './derive.mjs';

// ---------------------------------------------------------------------------
// vocabulary
// ---------------------------------------------------------------------------

export const FRONTMATTER_KEYS = [
  'question', 'form', 'under', 'tier', 'boost', 'cites', 'instrument', 'after',
  'source', 'bears', 'defines', 'shims', 'stage', 'order', 'facts', 'review',
  'depends',
];
// Keys the encoding of 2026-09-04 removed. A node still carrying one is
// rejected by name, since the fix is a migration and not a typo.
export const REMOVED_KEYS = {
  authority: "a node's class is derived from the rulings on its facts",
  alternatives: "the answer fact's options replace it",
  recommendation: "each fact's 'recommends' and 'boldness' replace it",
  relation: "a reading's 'bears' entries carry the relation now",
};
export const FORMS = ['target', 'rule', 'assumption', 'arche', 'reading'];
// The four fact names, in the order '## Facts' presents them when a node
// carries them all: the answer, whose options are the candidate answers to
// the node's question, and the reserved three. No fifth is minted without a
// ruling on the dialogue node.
export const FACT_NAMES = ['answer', 'authority', 'existence', 'persistence'];
export const FACT_KEYS = ['name', 'options', 'recommends', 'boldness', 'stands'];
export const OPTION_KEYS = ['name', 'source', 'ref', 'ruling'];
export const RULING_KEYS = ['response', 'date', 'of'];
// `deny` is never stored: a denial is a kickback with the author's words.
export const RULING_RESPONSES = ['confirm', 'edit'];
// The classes a ruling on the `authority` fact confers. `deferred` is one of
// them since 2026-09-04: it is a class the author confers, not one the AI
// writes for itself.
export const CONFERRABLE_CLASSES = ['ratified', 'delegated', 'deferred'];
// The named sources of an option. Any other non-empty string is read as the
// id of the node, or the name of the instrument, that raised it.
export const OPTION_SOURCES = ['author', 'ai', 'review'];
export const BEARS_KEYS = ['node', 'fact', 'option', 'relation'];
// "chosen over" is derived and not stored: it is a tradition adopted on an
// option that was not chosen.
export const RELATIONS = ['adopted', 'diverged'];
export const BOLDNESS_VALUES = ['low', 'moderate', 'high'];
export const INSTRUMENT_KINDS = ['check', 'assessment'];
export const STAGES = ['periagogic', 'maieutic', 'ruling', 'review'];
export const REVIEW_VERDICTS = ['forward', 'kickback'];
export const REVIEW_STRENGTHS = ['strong', 'moderate', 'weak', 'none'];
// The `review` field carries the two readings the clean-context review
// divides into (commons.systems/disposition-graph/clean-context-review, the
// option `per-draft-and-survey`; the field's shape is
// commons.systems/disposition-graph/dialogue's `survey-pin-in-review`).
// `REVIEW_DRAFT_KEYS` are the review of one draft, written together or not
// at all; `survey` is the survey of the whole frontier, its date and the
// hash of the recommendation it read, and it may stand alone on a node the
// survey judged before that node's draft review ran.
export const REVIEW_DRAFT_KEYS = ['verdict', 'strength', 'date', 'of'];
export const REVIEW_SURVEY_KEYS = ['date', 'of'];
// The two stages the survey judges: a node is ruled from the ruling stage,
// and reaches it from the review stage, so those are where the frontier's
// consistency with itself is what the author is about to rule on.
export const SURVEY_STAGES = ['review', 'ruling'];
export const SECTION_ORDER = ['Disposition', 'Answer', 'Rationale', 'Facts', 'Recommendation', 'Account'];
export const SHIM_KEYS = ['artifact', 'liquidation', 'declared', 'for'];
// The keys a '## Recommendation' fence may not carry: the fence holds the
// node as it would stand, and a stamp, the facts, and the dialogue's own
// state are not part of that.
export const FENCE_FORBIDDEN_KEYS = ['authority', 'facts', 'stage', 'review', 'depends'];
// The reserved facts whose option names come from a fixed vocabulary. Only
// `authority` has one: `existence` and `persistence` name their options
// freely, as they did before this encoding.
export const RESERVED_FACT_OPTIONS = { authority: CONFERRABLE_CLASSES };

const FRONTMATTER_KEY_SET = new Set(FRONTMATTER_KEYS);
const FORM_SET = new Set(FORMS);
const FACT_NAME_SET = new Set(FACT_NAMES);
const FACT_KEY_SET = new Set(FACT_KEYS);
const OPTION_KEY_SET = new Set(OPTION_KEYS);
const RULING_KEY_SET = new Set(RULING_KEYS);
const RULING_RESPONSE_SET = new Set(RULING_RESPONSES);
const BEARS_KEY_SET = new Set(BEARS_KEYS);
const RELATION_SET = new Set(RELATIONS);
const BOLDNESS_SET = new Set(BOLDNESS_VALUES);
const INSTRUMENT_KIND_SET = new Set(INSTRUMENT_KINDS);
const STAGE_SET = new Set(STAGES);
const REVIEW_VERDICT_SET = new Set(REVIEW_VERDICTS);
const REVIEW_STRENGTH_SET = new Set(REVIEW_STRENGTHS);
const REVIEW_KEY_SET = new Set([...REVIEW_DRAFT_KEYS, 'survey']);
const SURVEY_STAGE_SET = new Set(SURVEY_STAGES);
const SHIM_KEY_SET = new Set(SHIM_KEYS);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HASH_RE = /^[0-9a-f]{40}$/;
const OPTION_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const ANSWER_FACT = 'answer';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbsent(value) {
  return value === undefined || value === null;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDate(s) {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// ---------------------------------------------------------------------------
// the body
// ---------------------------------------------------------------------------

/**
 * Split a body into its `## Disposition` / `## Answer` / `## Rationale` /
 * `## Facts` / `## Recommendation` / `## Account` sections. `###`+ headings
 * are content, not section boundaries -- including the `### <fact>` and
 * `#### <option>` subsections of `## Facts`, which a second pass
 * (`parseFactsSection`) splits out of that one section's text. `####`
 * headings anywhere else (an account's dated notes, say) are content this
 * parser never looks at.
 *
 * Pushes one message per problem (without file-path prefix) onto
 * `problems`.
 *
 * @param {string} bodyText
 * @param {string[]} problems
 * @returns {{Disposition: string|null, Answer: string|null, Rationale: string|null, Facts: string|null, Recommendation: string|null, Account: string|null}}
 */
function parseBody(bodyText, problems) {
  const lines = bodyText.split('\n');
  const headingRe = /^(#{1,6})[ \t]+(.*?)\s*$/;
  const fenceRe = /^[ \t]*(`{3,}|~{3,})/;
  const boundaries = [];
  // A '##' line inside a fenced code block is content, not a boundary: a node
  // that shows this very file format in an example must not be re-sliced by it.
  let fenceChar = null;
  lines.forEach((line, index) => {
    const fence = line.match(fenceRe);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      return;
    }
    if (fenceChar !== null) return;
    const m = line.match(headingRe);
    if (m && m[1].length === 2) {
      boundaries.push({ name: m[2], index });
    }
  });

  const firstIndex = boundaries.length > 0 ? boundaries[0].index : lines.length;
  const prefix = lines.slice(0, firstIndex).join('\n');
  if (prefix.trim().length > 0) {
    const snippet = JSON.stringify(prefix.trim().slice(0, 60));
    problems.push(`body has text before the first '##' heading: ${snippet}`);
  }

  const sections = {
    Disposition: null, Answer: null, Rationale: null, Facts: null, Recommendation: null, Account: null,
  };
  let lastOrder = -1;
  boundaries.forEach((boundary, idx) => {
    const end = idx + 1 < boundaries.length ? boundaries[idx + 1].index : lines.length;
    const raw = lines.slice(boundary.index + 1, end).join('\n').trim();

    if (!SECTION_ORDER.includes(boundary.name)) {
      problems.push(`unexpected '## ${boundary.name}' heading (only ${SECTION_ORDER.join(', ')} are allowed)`);
      return;
    }
    if (sections[boundary.name] !== null) {
      problems.push(`duplicate '## ${boundary.name}' heading`);
      return;
    }
    const order = SECTION_ORDER.indexOf(boundary.name);
    if (order < lastOrder) {
      problems.push(`'## ${boundary.name}' heading is out of order (must follow ${SECTION_ORDER.join(', ')} order)`);
    }
    lastOrder = Math.max(lastOrder, order);
    sections[boundary.name] = raw;
  });

  return sections;
}

// ---------------------------------------------------------------------------
// reference lists
// ---------------------------------------------------------------------------

function readIdList(fm, key, problems) {
  if (isAbsent(fm[key])) return [];
  const list = fm[key];
  if (!Array.isArray(list) || list.some((x) => typeof x !== 'string' || x.length === 0)) {
    problems.push(`'${key}' must be a list of full id strings`);
    return [];
  }
  return list;
}

/**
 * Parse and validate the `depends` frontmatter field: each entry is either a
 * bare node id -- an open question this node's ruling waits on, the
 * original and still the common form -- or an id qualified with
 * `#<option name>`, naming the option on that ancestor's answer fact this
 * node stands under: a divergence, recorded here on the leaf and inverted at
 * the ancestor by the alignment page. The list's own shape (a list of
 * non-empty strings) is the same check `readIdList` already makes for
 * `under` and `after`, so this reuses it; only the entry syntax is depends'
 * own. Two problems are structural enough to catch here, one entry at a
 * time, with no need of the whole graph: more than one `#` in an entry, and
 * a `#` with nothing (or only whitespace) after it. Whether the id resolves,
 * carries a stage, is repeated, or is the node's own id, and whether a named
 * option is actually on the ancestor's answer fact, all need the whole graph
 * and are checked by `readGraph`.
 *
 * @param {object} fm
 * @param {string[]} problems
 * @returns {{id: string, option: string|null}[]}
 */
function readDependsList(fm, problems) {
  const raw = readIdList(fm, 'depends', problems);
  return raw.map((entry) => {
    const parts = entry.split('#');
    if (parts.length > 2) {
      problems.push(`malformed 'depends' reference: ${entry}`);
      return { id: entry, option: null };
    }
    if (parts.length === 1) {
      return { id: entry, option: null };
    }
    const [id, optionRaw] = parts;
    const option = optionRaw.trim();
    if (option.length === 0) {
      problems.push(`'depends' names an empty option on ${id}`);
      return { id, option: null };
    }
    return { id, option };
  });
}

// ---------------------------------------------------------------------------
// facts and their options
// ---------------------------------------------------------------------------

/**
 * Parse and validate the `facts` frontmatter field: every decision on the
 * node, each with the list of options the AI holds viable, the one it
 * recommends, and the author's ruling on the option they chose. The `answer`
 * fact's options are the candidate answers to the node's own question; the
 * reserved three -- `authority`, the class a ruling would confer;
 * `existence`, keep or prune; `persistence`, present or derived -- are the
 * decisions about the answer that are not questions under it, since a
 * decision that *is* a question is a child node
 * (commons.systems/disposition-graph/dialogue).
 *
 * One combined message covers every shape problem, as `review` does; the
 * coherence problems -- a duplicated name, an `answer` fact that is not
 * first, a `recommends` or a `stands` outside the fact's own options, a
 * `boldness` without a `recommends`, two rulings on one fact -- each get
 * their own, since those are about one fact's coherence rather than its
 * shape.
 *
 * Order is presentation order, as written, except that `answer` comes first
 * when the node carries one.
 *
 * @param {*} raw - fm.facts, or undefined/null when absent.
 * @param {string[]} problems
 * @returns {{entries: Array<object>, shapeOk: boolean}}
 */
function readFacts(raw, problems) {
  if (isAbsent(raw)) return { entries: [], shapeOk: true };

  const rulingOk = (r) => isPlainObject(r)
    && Object.keys(r).length === RULING_KEY_SET.size
    && RULING_KEYS.every((k) => Object.prototype.hasOwnProperty.call(r, k))
    && RULING_RESPONSE_SET.has(r.response)
    && typeof r.date === 'string' && isValidDate(r.date)
    && isNonEmptyString(r.of);
  // The answer fact's options are referenced by name (`stands`, `recommends`,
  // `depends`, `bears`), so their names are slugs; a reserved fact's options
  // are its vocabulary and may be free text, e.g. a persistence shape.
  const optionOk = (o, factName) => isPlainObject(o)
    && Object.keys(o).every((k) => OPTION_KEY_SET.has(k))
    && typeof o.name === 'string'
    && (factName === ANSWER_FACT ? OPTION_NAME_RE.test(o.name) : isNonEmptyString(o.name) && !o.name.includes('\n'))
    && (isAbsent(o.source) || isNonEmptyString(o.source))
    && (isAbsent(o.ref) || isNonEmptyString(o.ref))
    && (isAbsent(o.ruling) || rulingOk(o.ruling));
  const entryOk = (entry) => isPlainObject(entry)
    && Object.keys(entry).every((k) => FACT_KEY_SET.has(k))
    && typeof entry.name === 'string' && FACT_NAME_SET.has(entry.name)
    && Array.isArray(entry.options) && entry.options.length > 0 && entry.options.every((o) => optionOk(o, entry.name))
    && (isAbsent(entry.recommends) || isNonEmptyString(entry.recommends))
    && (isAbsent(entry.boldness) || BOLDNESS_SET.has(entry.boldness))
    && (isAbsent(entry.stands) || isNonEmptyString(entry.stands));

  if (!Array.isArray(raw) || raw.length === 0 || !raw.every(entryOk)) {
    problems.push(
      `'facts' must be a non-empty list of {name: ${FACT_NAMES.join('|')}, `
      + "options: <one or more {name: <lowercase slug on the answer fact, non-empty on a reserved one>, source: <non-empty string>, "
      + "ref: <non-empty string>, ruling: <optional "
      + `{response: ${RULING_RESPONSES.join('|')}, date: YYYY-MM-DD, of: <hash>}>}>, `
      + 'recommends: <optional option name>, '
      + `boldness: <${BOLDNESS_VALUES.join('|')}, required with recommends>, `
      + 'stands: <optional option name, on the answer fact only>}',
    );
    return { entries: [], shapeOk: false };
  }

  const entries = raw.map((entry) => ({
    name: entry.name,
    options: entry.options.map((o) => ({
      name: o.name,
      source: isAbsent(o.source) ? null : o.source,
      ref: isAbsent(o.ref) ? null : o.ref,
      ruling: isAbsent(o.ruling)
        ? null
        : { response: o.ruling.response, date: o.ruling.date, of: o.ruling.of },
      // filled in from '## Facts' once the body is parsed
      prose: '',
      readings: [],
    })),
    recommends: isAbsent(entry.recommends) ? null : entry.recommends,
    boldness: isAbsent(entry.boldness) ? null : entry.boldness,
    stands: isAbsent(entry.stands) ? null : entry.stands,
    prose: '',
    recommendationHash: '',
    ruled: null,
    moved: false,
  }));

  let ok = true;
  const seen = new Set();
  entries.forEach((entry, index) => {
    if (seen.has(entry.name)) {
      problems.push(`duplicate fact '${entry.name}'`);
      ok = false;
    }
    seen.add(entry.name);
    if (entry.name === ANSWER_FACT && index !== 0) {
      problems.push(`'facts' lists the answer fact at position ${index + 1}; the answer fact comes first`);
      ok = false;
    }

    const optionNames = entry.options.map((o) => o.name);
    const seenOptions = new Set();
    for (const name of optionNames) {
      if (seenOptions.has(name)) {
        problems.push(`fact '${entry.name}' names option '${name}' twice`);
        ok = false;
      }
      seenOptions.add(name);
    }

    if (entry.name === ANSWER_FACT) {
      // An answer option is a candidate answer to the node's own question,
      // so it always says where it came from and what raised it.
      for (const option of entry.options) {
        if (option.source === null) {
          problems.push(`fact 'answer' option '${option.name}' requires 'source' (${OPTION_SOURCES.join(', ')}, or the node or instrument that raised it)`);
          ok = false;
        }
        if (option.ref === null) {
          problems.push(`fact 'answer' option '${option.name}' requires 'ref' (a date, a graph commit, or what raised it)`);
          ok = false;
        }
      }
    } else if (Object.prototype.hasOwnProperty.call(RESERVED_FACT_OPTIONS, entry.name)) {
      const vocabulary = RESERVED_FACT_OPTIONS[entry.name];
      if (!optionNames.every((n) => vocabulary.includes(n))) {
        problems.push(
          `fact '${entry.name}' may only offer the classes a ruling confers: ${vocabulary.join(', ')}`,
        );
        ok = false;
      }
    }

    if (entry.recommends !== null && !optionNames.includes(entry.recommends)) {
      problems.push(`fact '${entry.name}' recommends '${entry.recommends}', which is not one of its own options`);
      ok = false;
    }
    if (entry.recommends !== null && entry.boldness === null) {
      problems.push(`fact '${entry.name}' recommends '${entry.recommends}' and must state a boldness`);
      ok = false;
    }
    if (entry.recommends === null && entry.boldness !== null) {
      problems.push(`fact '${entry.name}' states a boldness but recommends no option`);
      ok = false;
    }

    const ruledOptions = entry.options.filter((o) => o.ruling !== null);
    if (ruledOptions.length > 1) {
      problems.push(
        `fact '${entry.name}' carries a ruling on ${ruledOptions.length} options (${ruledOptions.map((o) => o.name).join(', ')}); the author rules on one`,
      );
      ok = false;
    }
    entry.ruled = ruledOptions.length === 1 ? ruledOptions[0].name : null;

    if (entry.stands !== null) {
      if (entry.name !== ANSWER_FACT) {
        problems.push(`fact '${entry.name}' carries 'stands', which is the answer fact's alone`);
        ok = false;
      } else if (!optionNames.includes(entry.stands)) {
        problems.push(`fact 'answer' stands on '${entry.stands}', which is not one of its own options`);
        ok = false;
      } else if (entry.ruled !== null && entry.ruled !== entry.stands) {
        problems.push(
          `fact 'answer' is ruled on '${entry.ruled}' but stands on '${entry.stands}'; what stands is what the author confirmed`,
        );
        ok = false;
      }
    }
  });

  return { entries, shapeOk: ok };
}

/**
 * Split a '## Facts' section into its `### <fact>` subsections and their
 * `#### <option>` subsections, and check them against the `facts` list.
 *
 * A fact subsection may open with prose -- the reason for the recommendation
 * -- and is omitted where there is nothing to say, so the `### ` headings
 * must be a subsequence of the fact names rather than a match: every one
 * names a fact, none repeats, and they read in the facts' order.
 *
 * Under `### answer`, one `#### <option>` subsection per option says what
 * that option would answer and why it is on the table. It is required for
 * every option except the one named by `stands`, whose text is the
 * `## Answer` section itself, so the option headings must match the option
 * list exactly but for that one. A reserved fact's options may carry
 * `#### ` subsections too and need not, so theirs are a subsequence like the
 * facts themselves.
 *
 * @param {string} sectionText
 * @param {Array<object>|null} facts - the parsed facts in order, or null
 *   when the list did not parse and there is nothing to check against.
 * @param {string[]} problems
 * @returns {Record<string, {prose: string, options: Record<string, string>}>}
 */
function parseFactsSection(sectionText, facts, problems) {
  const lines = String(sectionText).split('\n');
  const headingRe = /^(#{3,4})[ \t]+(.+?)\s*$/;
  const fenceRe = /^[ \t]*(`{3,}|~{3,})/;
  const boundaries = [];
  let fenceChar = null;
  lines.forEach((line, index) => {
    const fence = line.match(fenceRe);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      return;
    }
    if (fenceChar !== null) return;
    const m = line.match(headingRe);
    if (m) boundaries.push({ depth: m[1].length, name: m[2].trim(), index });
  });

  const firstIndex = boundaries.length > 0 ? boundaries[0].index : lines.length;
  const prefix = lines.slice(0, firstIndex).join('\n');
  if (prefix.trim().length > 0) {
    const snippet = JSON.stringify(prefix.trim().slice(0, 60));
    problems.push(`'## Facts' has text before the first '### ' heading: ${snippet}`);
  }

  /** @type {Record<string, {prose: string, options: Record<string, string>}>} */
  const text = {};
  /** @type {{name: string, options: string[]}[]} */
  const found = [];
  let current = null;
  boundaries.forEach((boundary, idx) => {
    const end = idx + 1 < boundaries.length ? boundaries[idx + 1].index : lines.length;
    const prose = lines.slice(boundary.index + 1, end).join('\n').trim();
    if (boundary.depth === 3) {
      current = { name: boundary.name, options: [] };
      found.push(current);
      if (!Object.prototype.hasOwnProperty.call(text, boundary.name)) {
        text[boundary.name] = { prose, options: {} };
      }
      return;
    }
    if (current === null) {
      problems.push(`'## Facts' has '#### ${boundary.name}' with no '### ' heading above it`);
      return;
    }
    current.options.push(boundary.name);
    text[current.name].options[boundary.name] = prose;
  });

  if (facts === null) return text;

  const factNames = facts.map((f) => f.name);
  let cursor = 0;
  const seen = new Set();
  for (const heading of found) {
    if (seen.has(heading.name)) {
      problems.push(`'## Facts' repeats '### ${heading.name}'`);
      break;
    }
    seen.add(heading.name);
    const at = factNames.indexOf(heading.name, cursor);
    if (at === -1) {
      const why = factNames.includes(heading.name) ? "out of the facts' order" : 'not a fact on this node';
      problems.push(`'## Facts' has '### ${heading.name}', which is ${why} (facts: ${factNames.join(', ')})`);
      break;
    }
    cursor = at + 1;
    checkOptionHeadings(facts[at], heading, problems);
  }

  // Every answer option but the standing one states itself in prose, so an
  // answer fact with such an option needs its '### answer' subsection.
  const answerFact = facts.find((f) => f.name === ANSWER_FACT) ?? null;
  if (answerFact !== null && !seen.has(ANSWER_FACT)) {
    const owed = answerFact.options.filter((o) => o.name !== answerFact.stands).map((o) => o.name);
    if (owed.length > 0) {
      problems.push(
        `'## Facts' has no '### answer' subsection, so ${owed.map((n) => `'#### ${n}'`).join(', ')} `
        + `${owed.length === 1 ? 'is' : 'are'} missing; every answer option but the one that stands says in prose what it would answer`,
      );
    }
  }

  return text;
}

/**
 * The `#### <option>` headings under one `### <fact>` subsection: an exact
 * match against the answer fact's options in order, but for the option named
 * by `stands`, which may be omitted (its text is `## Answer`); a subsequence
 * for a reserved fact, whose options need no prose at all.
 *
 * @param {object} fact
 * @param {{name: string, options: string[]}} heading
 * @param {string[]} problems
 */
function checkOptionHeadings(fact, heading, problems) {
  const optionNames = fact.options.map((o) => o.name);
  if (fact.name !== ANSWER_FACT) {
    let cursor = 0;
    const seen = new Set();
    for (const name of heading.options) {
      if (seen.has(name)) {
        problems.push(`'### ${fact.name}' repeats '#### ${name}'`);
        return;
      }
      seen.add(name);
      const at = optionNames.indexOf(name, cursor);
      if (at === -1) {
        const why = optionNames.includes(name) ? "out of the fact's option order" : `not an option of '${fact.name}'`;
        problems.push(`'### ${fact.name}' has '#### ${name}', which is ${why} (options: ${optionNames.join(', ')})`);
        return;
      }
      cursor = at + 1;
    }
    return;
  }

  const expected = optionNames.filter((n) => n !== fact.stands);
  const found = heading.options.filter((n) => n !== fact.stands);
  const span = Math.max(expected.length, found.length);
  for (let i = 0; i < span; i += 1) {
    if (expected[i] !== found[i]) {
      const want = expected[i] === undefined ? 'nothing' : `'#### ${expected[i]}'`;
      const got = found[i] === undefined ? 'nothing' : `'#### ${found[i]}'`;
      problems.push(
        `'### answer' subsections must match the answer fact's options in order: expected ${want} at position ${i + 1}, found ${got}`,
      );
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// readings
// ---------------------------------------------------------------------------

/**
 * Parse and validate the `bears` frontmatter field, which a reading carries
 * in place of the one node-level `relation` it carried before 2026-09-04: a
 * tradition bears on the *options* of a fact, so that "chosen over" is
 * derived (a tradition adopted on an option that was not chosen) rather than
 * stored. `node` may be omitted when the reading has exactly one `under`
 * parent, which is then what it bears on; with more than one parent it must
 * be named on every entry, since nothing else says which.
 *
 * Whether the named node exists, carries the fact, and carries the option is
 * checked by `readGraph`.
 *
 * @param {*} raw - fm.bears, or undefined/null when absent.
 * @param {number} parentCount - the length of this node's `under`.
 * @param {string[]} problems
 * @returns {{node: string|null, fact: string, option: string, relation: string}[]}
 */
function readBears(raw, parentCount, problems) {
  if (isAbsent(raw)) return [];
  const entryOk = (entry) => isPlainObject(entry)
    && Object.keys(entry).every((k) => BEARS_KEY_SET.has(k))
    && (isAbsent(entry.node) || isNonEmptyString(entry.node))
    && typeof entry.fact === 'string' && FACT_NAME_SET.has(entry.fact)
    && isNonEmptyString(entry.option)
    && RELATION_SET.has(entry.relation);
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every(entryOk)) {
    problems.push(
      "'bears' must be a non-empty list of {node: <optional node id>, "
      + `fact: ${FACT_NAMES.join('|')}, option: <option name>, relation: ${RELATIONS.join('|')}}`,
    );
    return [];
  }
  const entries = raw.map((entry) => ({
    node: isAbsent(entry.node) ? null : entry.node,
    fact: entry.fact,
    option: entry.option,
    relation: entry.relation,
  }));
  for (const entry of entries) {
    if (entry.node === null && parentCount !== 1) {
      problems.push(
        `'bears' entry on fact '${entry.fact}' must name a 'node': the reading has ${parentCount} parents, so nothing says which one it bears on`,
      );
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// order
// ---------------------------------------------------------------------------

/**
 * Parse and validate the `order` frontmatter field's own shape: a list of
 * steps, each step one node id or a non-empty list of node ids (ids that
 * are equal in the order). This only knows about the one file, so it
 * catches a malformed step, an empty step, and an id repeated within this
 * field -- but not whether a named id exists or is in scope, which needs
 * the whole graph and is checked by readGraph.
 *
 * @param {*} raw - fm.order, or undefined/null when absent.
 * @param {string[]} problems
 * @returns {string[][]} each step normalized to an array of id strings
 *   (single ids wrapped in a one-element array); empty overall when `raw`
 *   is absent or malformed.
 */
function readOrder(raw, problems) {
  if (isAbsent(raw)) return [];
  const stepShapeOk = (step) =>
    (typeof step === 'string' && step.length > 0) ||
    (Array.isArray(step) && step.every((x) => typeof x === 'string' && x.length > 0));
  if (!Array.isArray(raw) || !raw.every(stepShapeOk)) {
    problems.push("'order' must be a list of steps, each a node id or a list of node ids");
    return [];
  }
  const steps = raw.map((step, i) => {
    const ids = typeof step === 'string' ? [step] : step;
    if (ids.length === 0) problems.push(`'order' step ${i + 1} is empty`);
    return ids;
  });
  const seen = new Set();
  for (const ids of steps) {
    for (const id of ids) {
      if (seen.has(id)) problems.push(`'order' names ${id} twice`);
      seen.add(id);
    }
  }
  return steps;
}

function fail(relPath, problemList) {
  return new Error(problemList.map((p) => `${relPath}: ${p}`).join('\n'));
}

// ---------------------------------------------------------------------------
// the '## Recommendation' fence
// ---------------------------------------------------------------------------

/**
 * Extract the exact content of a `## Recommendation` section's one fenced
 * markdown block: a line that, trimmed, is exactly `` ```markdown `` opens
 * it, a line that trimmed is exactly `` ``` `` closes it, and nothing but
 * blank lines may sit outside the fence. Pushes the one shape-error message
 * and returns null on anything else -- more than one fence, text beside it,
 * or no fence at all.
 *
 * @param {string} sectionText - `sections.Recommendation`, already trimmed
 *   by `parseBody`.
 * @param {string[]} problems
 * @returns {string|null} the fence's inner lines, joined by '\n'.
 */
function extractFence(sectionText, problems) {
  const fail1 = () => {
    problems.push("'## Recommendation' must hold exactly one fenced markdown block");
    return null;
  };
  const lines = sectionText.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i += 1;
  if (i >= lines.length || lines[i].trim() !== '```markdown') return fail1();
  i += 1;
  const content = [];
  while (i < lines.length && lines[i].trim() !== '```') {
    content.push(lines[i]);
    i += 1;
  }
  if (i >= lines.length) return fail1(); // opened but never closed
  i += 1;
  while (i < lines.length) {
    if (lines[i].trim() !== '') return fail1(); // text beside the fence
    i += 1;
  }
  return content.join('\n');
}

/**
 * Recover a node file's frontmatter and body text from its raw bytes: the
 * structural parse shared by a top-level node file (`parseNode`) and a
 * `## Recommendation` fence's nested one (`parseFence`). Throws immediately
 * (one message, as befits a file with nothing left worth checking) when
 * the frontmatter cannot be recovered at all: no opening or closing `---`
 * delimiter, invalid YAML, or a frontmatter that is not a mapping. Every
 * other rule -- the frontmatter's known keys, each field's own shape and
 * vocabulary, the body's sections -- is the caller's job.
 *
 * @param {string} text - the file's decoded text.
 * @param {string} relPath - for the thrown message's prefix.
 * @returns {{fm: object, fmText: string, bodyText: string}}
 */
function parseFrontmatter(text, relPath) {
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines[0].trim() !== '---') {
    throw fail(relPath, ["file must begin with a '---' frontmatter delimiter"]);
  }
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw fail(relPath, ["frontmatter is opened with '---' but never closed"]);
  }
  const fmText = lines.slice(1, end).join('\n');
  const bodyText = lines.slice(end + 1).join('\n');

  let fm;
  try {
    fm = YAML.parse(fmText);
  } catch (err) {
    throw fail(relPath, [`invalid YAML frontmatter: ${err.message}`]);
  }
  if (isAbsent(fm)) fm = {};
  if (!isPlainObject(fm)) {
    throw fail(relPath, ['frontmatter must be a YAML mapping']);
  }
  return { fm, fmText, bodyText };
}

/**
 * Parse a `## Recommendation` fence's content only structurally, per
 * dialogue.md's Answer: "A draft may be invalid under the doctrine of the
 * day, as when it presumes a ruling not yet given; the validator parses it
 * and checks only that it answers the same question." The fence must parse
 * as a node at all -- a frontmatter block that recovers as a YAML mapping
 * (`parseFrontmatter`), and a body whose sections are the reader's known
 * sections in the reader's order (`parseBody`) -- its `question` must equal
 * the one it drafts, and it must not carry the keys that are not part of
 * what stands (`FENCE_FORBIDDEN_KEYS`: the class is derived from the
 * rulings, and the facts and the dialogue's state belong to the node and
 * never to the text it would stand on).
 *
 * No other field rule, shape rule, vocabulary, or section-requirement rule
 * applies: a draft may carry a form outside today's vocabulary, a tier or
 * any other field with a value the vocabulary of the day does not name, or
 * an unknown frontmatter key entirely. The frontmatter is returned exactly
 * as written -- every key it carries, none normalized, none invented.
 *
 * @param {string} fenceText
 * @param {string} question - the enclosing node's own (already-validated) question.
 * @param {{id: string, graph: string, slug: string, path: string}} ctx - the
 *   enclosing node's own location, for attributing a nested parse error.
 * @param {string[]} problems
 * @returns {{raw: string, question: string|null, frontmatter: object, sections: object}|null}
 */
function parseFence(fenceText, question, ctx, problems) {
  const fencePath = `${ctx.path} (## Recommendation)`;
  let fm;
  let bodyText;
  try {
    ({ fm, bodyText } = parseFrontmatter(fenceText, fencePath));
  } catch (err) {
    problems.push(`'## Recommendation' does not parse as a node: ${err.message}`);
    return null;
  }
  const bodyProblems = [];
  const sections = parseBody(bodyText, bodyProblems);
  if (bodyProblems.length > 0) {
    problems.push(`'## Recommendation' does not parse as a node: ${fail(fencePath, bodyProblems).message}`);
    return null;
  }
  if (fm.question !== question) {
    problems.push("'## Recommendation' answers a different question");
  }
  for (const key of FENCE_FORBIDDEN_KEYS) {
    if (!isAbsent(fm[key])) {
      problems.push(`'## Recommendation' carries '${key}', which belongs to the node and not to the text it would stand on`);
    }
  }
  if (sections.Facts !== null) {
    problems.push("'## Recommendation' carries a '## Facts' section, which belongs to the node and not to the text it would stand on");
  }
  return {
    raw: fenceText,
    question: isAbsent(fm.question) ? null : fm.question,
    frontmatter: { ...fm },
    sections: { ...sections },
  };
}

// ---------------------------------------------------------------------------
// the survey's pin, and the readiness it decides
// ---------------------------------------------------------------------------

/**
 * Whether the survey's pin on a node reads a recommendation that has since
 * moved: the same test `reviewStale` makes of the draft review's pin, made
 * of the survey's. False with no survey pin at all -- nothing has been read
 * for a move to overtake -- which is what `surveyOwed` says instead.
 *
 * @param {{review?: object|null, facts?: object[]}} node
 * @returns {boolean}
 */
export function surveyStale(node) {
  const survey = node?.review?.survey ?? null;
  return survey !== null && survey.of !== deriveRecommendationHash(node);
}

/**
 * Whether the survey is owed on a node: it stands at a stage the survey
 * judges -- review or ruling, where the frontier is what the author is about
 * to rule on -- and carries no survey pin, or one its recommendation has
 * moved past. This is the per-node form of `surveyJudges`.
 *
 * @param {{stage?: string|null, review?: object|null, facts?: object[]}} node
 * @returns {boolean}
 */
export function surveyOwed(node) {
  if (!SURVEY_STAGE_SET.has(node?.stage)) return false;
  return (node?.review?.survey ?? null) === null || surveyStale(node);
}

/**
 * Whether a node is ready for the author's ruling: it stands at the ruling
 * stage with a forward verdict, and both readings -- the review of its draft
 * and the survey of the frontier -- pin the recommendation as it stands
 * (commons.systems/disposition-graph/clean-context-review: "A node is ready
 * for the author's ruling when it carries a forward verdict pinned to the
 * recommendation as it stands and a survey pin on the same").
 *
 * @param {{stage?: string|null, review?: object|null, facts?: object[]}} node
 * @returns {boolean}
 */
export function readyToRule(node) {
  if (node?.stage !== 'ruling') return false;
  const review = node?.review ?? null;
  if (review === null || review.verdict !== 'forward') return false;
  const survey = review.survey ?? null;
  if (survey === null) return false;
  const hash = deriveRecommendationHash(node);
  return review.of === hash && survey.of === hash;
}

/**
 * The nodes one survey judges: every node at the review or ruling stage
 * whose current recommendation differs from what the survey last pinned on
 * it, and every such node the survey has never pinned. Input order is kept,
 * so a caller that has already ordered the frontier keeps its order.
 *
 * @param {{nodes?: object[]}|object[]} graph - a graph as `readGraph`
 *   returns it, or the node list alone.
 * @returns {object[]}
 */
export function surveyJudges(graph) {
  const nodes = Array.isArray(graph) ? graph : (graph?.nodes ?? []);
  return nodes.filter((node) => surveyOwed(node));
}

// ---------------------------------------------------------------------------
// one node file
// ---------------------------------------------------------------------------

/**
 * Parse and validate a single node file's text (frontmatter + body).
 * Does not resolve `under`/`after`/`depends`/`cites[].id`/`bears[].node`
 * against a manifest or against sibling nodes, and does not compute
 * `children`/`rank`/`ceiling`/`class`/`status`/`hash` -- those need the
 * whole graph and the raw file bytes, and are added by `readGraph`.
 *
 * @param {string} text - the file's decoded text.
 * @param {{id: string, graph: string, slug: string, path: string}} loc
 * @returns {object} a partial node: everything the file itself decides.
 * @throws {Error} listing every problem found in this file, one per line,
 *   each prefixed with `loc.path`.
 */
export function parseNode(text, { id, graph, slug, path: relPath }) {
  const problems = [];
  const { fm, fmText, bodyText } = parseFrontmatter(text, relPath);

  for (const key of Object.keys(fm)) {
    if (Object.prototype.hasOwnProperty.call(REMOVED_KEYS, key)) {
      problems.push(
        `'${key}' is no longer a frontmatter key: the encoding changed on 2026-09-04, and ${REMOVED_KEYS[key]}`,
      );
    } else if (!FRONTMATTER_KEY_SET.has(key)) {
      problems.push(`unknown frontmatter key '${key}'`);
    }
  }

  // question
  let question = null;
  if (typeof fm.question !== 'string' || fm.question.trim().length === 0) {
    problems.push("'question' is required and must be a non-empty string");
  } else {
    question = fm.question;
  }

  // form
  let form = null;
  if (!isAbsent(fm.form)) {
    if (typeof fm.form !== 'string' || !FORM_SET.has(fm.form)) {
      problems.push(`'form' must be one of: ${FORMS.join(', ')}`);
    } else {
      form = fm.form;
    }
  }

  // under / after / depends
  const under = readIdList(fm, 'under', problems);
  const after = readIdList(fm, 'after', problems);
  const depends = readDependsList(fm, problems);

  // tier
  let tier = null;
  if (!isAbsent(fm.tier)) {
    if (fm.tier !== 'global') {
      problems.push("'tier' may only be 'global'");
    } else {
      tier = 'global';
    }
  }

  // stage: the next movement of the alignment dialogue owed on this node.
  let stage = null;
  if (!isAbsent(fm.stage)) {
    if (typeof fm.stage !== 'string' || !STAGE_SET.has(fm.stage)) {
      problems.push(`'stage' must be one of: ${STAGES.join(', ')}`);
    } else {
      stage = fm.stage;
    }
  }

  // facts: every decision on the node, with the options the AI holds
  // viable, the one it recommends, and the author's rulings. Its own shape
  // and coherence only; whether the '## Facts' subsections match is checked
  // below, once the body is parsed.
  const { entries: facts, shapeOk: factsShapeOk } = readFacts(fm.facts, problems);
  const answerFact = facts.find((f) => f.name === ANSWER_FACT) ?? null;

  // review: the state of the clean-context review of what the node
  // recommends, in the two readings that review divides into -- the review
  // of this one draft, which writes `verdict`, `strength`, `date` and `of`,
  // and the survey of the whole frontier, which writes `survey: {date, of}`
  // where `of` is the same recommendation hash the draft review pins. Either
  // reading may stand without the other: the survey pins a node it judged
  // before that node's draft review ran, and a draft review is recorded
  // before any survey has read it. One combined message on any shape
  // problem. The five keys are the whole vocabulary; an unknown key (the
  // former `siblings`, the other drafts a per-node reviewer was given --
  // gone now that the survey is what reads the whole frontier) fails this
  // check like any other malformed shape.
  let review = null;
  if (!isAbsent(fm.review)) {
    const r = fm.review;
    const has = (k) => isPlainObject(r) && Object.prototype.hasOwnProperty.call(r, k) && !isAbsent(r[k]);
    const drafted = REVIEW_DRAFT_KEYS.some(has);
    const surveyed = has('survey');
    const surveyOk = (s) => isPlainObject(s)
      && Object.keys(s).length === REVIEW_SURVEY_KEYS.length
      && REVIEW_SURVEY_KEYS.every((k) => Object.prototype.hasOwnProperty.call(s, k))
      && typeof s.date === 'string' && isValidDate(s.date)
      && typeof s.of === 'string' && HASH_RE.test(s.of);
    const ok = isPlainObject(r)
      && Object.keys(r).every((k) => REVIEW_KEY_SET.has(k))
      && (drafted || surveyed)
      && (!drafted || (
        REVIEW_DRAFT_KEYS.every(has)
        && REVIEW_VERDICT_SET.has(r.verdict)
        && REVIEW_STRENGTH_SET.has(r.strength)
        && typeof r.date === 'string' && isValidDate(r.date)
        && typeof r.of === 'string' && HASH_RE.test(r.of)))
      && (!surveyed || surveyOk(r.survey));
    if (!ok) {
      problems.push(
        `'review' must be {verdict: ${REVIEW_VERDICTS.join('|')}, strength: ${REVIEW_STRENGTHS.join('|')}, date: YYYY-MM-DD, of: <sha1>}`
        + ', with an optional survey: {date: YYYY-MM-DD, of: <sha1>};'
        + ' the four draft-review keys are given together or not at all, and the survey may stand alone',
      );
    } else {
      review = {
        verdict: drafted ? r.verdict : null,
        strength: drafted ? r.strength : null,
        date: drafted ? r.date : null,
        of: drafted ? r.of : null,
        survey: surveyed ? { date: r.survey.date, of: r.survey.of } : null,
      };
    }
  }

  // boost
  let boost = null;
  if (!isAbsent(fm.boost)) {
    if (typeof fm.boost !== 'number' || !(fm.boost > 0)) {
      problems.push("'boost' must be a positive number");
    } else {
      boost = fm.boost;
    }
  }

  // cites
  let cites = [];
  if (!isAbsent(fm.cites)) {
    if (!Array.isArray(fm.cites)) {
      problems.push("'cites' must be a list of {id, hash}");
    } else {
      cites = fm.cites
        .map((entry, i) => {
          if (!isPlainObject(entry)) {
            problems.push(`'cites[${i}]' must be a mapping with id and hash`);
            return null;
          }
          for (const k of Object.keys(entry)) {
            if (!['id', 'hash'].includes(k)) problems.push(`unknown key 'cites[${i}].${k}'`);
          }
          let entryOk = true;
          if (typeof entry.id !== 'string' || entry.id.length === 0) {
            problems.push(`'cites[${i}].id' is required and must be a non-empty string`);
            entryOk = false;
          }
          if (typeof entry.hash !== 'string' || !HASH_RE.test(entry.hash)) {
            problems.push(`'cites[${i}].hash' must be a 40-character hex git blob sha`);
            entryOk = false;
          }
          return entryOk ? { id: entry.id, hash: entry.hash } : null;
        })
        .filter((x) => x !== null);
    }
  }

  // instrument
  let instrument = null;
  if (!isAbsent(fm.instrument)) {
    if (!isPlainObject(fm.instrument)) {
      problems.push("'instrument' must be a mapping with kind, ref, and optional note");
    } else {
      const inst = fm.instrument;
      for (const k of Object.keys(inst)) {
        if (!['kind', 'ref', 'note'].includes(k)) problems.push(`unknown key 'instrument.${k}'`);
      }
      let ok = true;
      if (typeof inst.kind !== 'string' || !INSTRUMENT_KIND_SET.has(inst.kind)) {
        problems.push(`'instrument.kind' must be one of: ${INSTRUMENT_KINDS.join(', ')}`);
        ok = false;
      }
      if (typeof inst.ref !== 'string' || inst.ref.trim().length === 0) {
        problems.push("'instrument.ref' is required and must be a non-empty string");
        ok = false;
      }
      if (!isAbsent(inst.note) && typeof inst.note !== 'string') {
        problems.push("'instrument.note' must be a string");
        ok = false;
      }
      if (ok) instrument = { kind: inst.kind, ref: inst.ref, note: isAbsent(inst.note) ? null : inst.note };
    }
  }

  // source / bears: required together under form:reading, forbidden otherwise
  let source = null;
  let bears = [];
  const hasSource = !isAbsent(fm.source);
  const hasBears = !isAbsent(fm.bears);
  if (form === 'reading') {
    if (!hasSource || typeof fm.source !== 'string' || fm.source.trim().length === 0) {
      problems.push("'source' is required and must be a non-empty string when form: reading");
    } else {
      source = fm.source;
    }
    if (!hasBears) {
      problems.push("'bears' is required when form: reading: a reading says which options of which node the tradition bears on");
    } else {
      bears = readBears(fm.bears, under.length, problems);
    }
  } else {
    if (hasSource) problems.push("'source' is only allowed when form: reading");
    if (hasBears) problems.push("'bears' is only allowed when form: reading");
  }

  // defines
  let defines = null;
  if (!isAbsent(fm.defines)) {
    if (!Array.isArray(fm.defines) || fm.defines.some((d) => typeof d !== 'string')) {
      problems.push("'defines' must be a list of strings");
    } else {
      defines = fm.defines;
    }
  }

  // shims: a list of {artifact, liquidation, declared, and optional for}
  let shims = [];
  if (!isAbsent(fm.shims)) {
    if (!Array.isArray(fm.shims)) {
      problems.push("'shims' must be a list of {artifact, liquidation, declared, and optional for}");
    } else {
      shims = fm.shims
        .map((entry, i) => {
          if (!isPlainObject(entry)) {
            problems.push(`'shims[${i}]' must be a mapping with artifact, liquidation, declared`);
            return null;
          }
          for (const k of Object.keys(entry)) {
            if (!SHIM_KEY_SET.has(k)) problems.push(`unknown key 'shims[${i}].${k}'`);
          }
          let entryOk = true;
          if (typeof entry.artifact !== 'string' || entry.artifact.trim().length === 0) {
            problems.push(`'shims[${i}].artifact' is required and must be a non-empty string`);
            entryOk = false;
          }
          if (typeof entry.liquidation !== 'string' || entry.liquidation.trim().length === 0) {
            problems.push(`'shims[${i}].liquidation' is required and must be a non-empty string`);
            entryOk = false;
          }
          if (typeof entry.declared !== 'string' || !isValidDate(entry.declared)) {
            problems.push(`'shims[${i}].declared' must be a YYYY-MM-DD date string`);
            entryOk = false;
          }
          if (!isAbsent(entry.for) && (typeof entry.for !== 'string' || entry.for.trim().length === 0)) {
            problems.push(`'shims[${i}].for' must be a non-empty string`);
            entryOk = false;
          }
          return entryOk
            ? {
              artifact: entry.artifact,
              liquidation: entry.liquidation,
              declared: entry.declared,
              for: isAbsent(entry.for) ? null : entry.for,
            }
            : null;
        })
        .filter((x) => x !== null);
    }
  }

  // order: a high-level order recorded once, as data (see scope.md's
  // Answer/Rationale). Its own shape is checked regardless of whether this
  // node has an '## Answer'; the requirement that it have one is checked
  // below, once hasAnswer is known, alongside tier.
  const order = readOrder(fm.order, problems);

  // body
  const sections = parseBody(bodyText, problems);
  const hasAnswer = sections.Answer !== null;
  const hasDisposition = sections.Disposition !== null;
  const hasFenceSection = sections.Recommendation !== null;
  const hasFactsSection = sections.Facts !== null;

  // '## Facts' takes one subsection per fact whose recommendation needs
  // explaining and one per answer option that is not the standing one, so
  // it requires facts but facts do not always require it.
  if (hasFactsSection && facts.length === 0) {
    problems.push("'## Facts' requires a non-empty 'facts' list");
  }
  const factsText = hasFactsSection
    ? parseFactsSection(sections.Facts, factsShapeOk && facts.length > 0 ? facts : null, problems)
    : {};
  if (!hasFactsSection && answerFact !== null && factsShapeOk) {
    const owed = answerFact.options.filter((o) => o.name !== answerFact.stands).map((o) => o.name);
    if (owed.length > 0) {
      problems.push(
        `the answer fact carries ${owed.map((n) => `'${n}'`).join(', ')} beside the option that stands, `
        + "which requires a '## Facts' section stating each in prose",
      );
    }
  }
  for (const fact of facts) {
    const found = factsText[fact.name];
    if (found === undefined) continue;
    fact.prose = found.prose;
    for (const option of fact.options) {
      if (found.options[option.name] !== undefined) option.prose = found.options[option.name];
    }
  }

  if (hasAnswer && form === null) {
    problems.push("'form' is required when the body has an '## Answer' section");
  }
  if (tier !== null && !hasAnswer) {
    problems.push("'tier' requires an '## Answer' section");
  }
  if (order.length > 0 && !hasAnswer) {
    problems.push("'order' requires an '## Answer' section");
  }
  if (stage !== null && !hasDisposition && !hasAnswer && sections.Account === null) {
    problems.push("stage requires a '## Disposition', '## Account', or '## Answer' section");
  }
  if (hasDisposition && stage === null) {
    problems.push("'## Disposition' requires 'stage'");
  }
  // What the recording removes is the dialogue: the stage, the review, the
  // dependencies, and the account. The facts and the '## Recommendation'
  // fence are not dialogue state -- they persist after the ruling -- so
  // neither asks for a stage of its own.
  const carriesDialogue = !isAbsent(fm.review) || !isAbsent(fm.depends) || sections.Account !== null;
  if (carriesDialogue && stage === null) {
    problems.push(
      "'review', 'depends', and '## Account' are parts of the dialogue and require stage",
    );
  }

  // What stands, what is recommended, and the fence between them. The
  // '## Answer' section holds the text of the option named by `stands`; a
  // fence holds the whole proposed node where the recommended option is not
  // that one.
  if (hasAnswer && answerFact === null && factsShapeOk) {
    problems.push("an '## Answer' section requires an answer fact, whose options are the candidate answers to this question");
  }
  if (hasAnswer && answerFact !== null && answerFact.stands === null) {
    problems.push("an '## Answer' section requires the answer fact to name the option it stands on ('stands')");
  }
  if (!hasAnswer && answerFact !== null && answerFact.stands !== null) {
    problems.push("'stands' names the option whose text '## Answer' holds, so it requires an '## Answer' section");
  }
  const recommends = answerFact === null ? null : answerFact.recommends;
  const stands = answerFact === null ? null : answerFact.stands;
  const fenceExpected = recommends !== null && (stands === null || stands !== recommends);
  if (fenceExpected && !hasFenceSection) {
    problems.push(
      stands === null
        ? `the answer fact recommends '${recommends}' and nothing stands yet, which requires a '## Recommendation' section holding the recommended node whole`
        : `the answer fact recommends '${recommends}' rather than the standing '${stands}', which requires a '## Recommendation' section holding it whole`,
    );
  }
  if (!fenceExpected && hasFenceSection) {
    const why = recommends === null
      ? 'the answer fact recommends nothing'
      : `the answer fact recommends the standing option '${stands}'`;
    problems.push(`'## Recommendation' holds the recommended node where it differs from what stands, and ${why}`);
  }

  // From the review stage on, every fact carries the option it recommends:
  // that is what a review reads and what a ruling answers.
  if (stage === 'review' || stage === 'ruling') {
    for (const fact of facts) {
      if (fact.recommends === null) {
        problems.push(`stage ${stage} requires every fact to recommend one of its options; fact '${fact.name}' recommends none`);
      }
    }
    if (facts.length === 0) {
      problems.push(`stage ${stage} requires 'facts': there is nothing for a review or a ruling to read`);
    }
  }
  if (stage === 'ruling' && (review === null || review.verdict !== 'forward')) {
    problems.push("stage ruling requires a 'review' with verdict forward");
  }

  // '## Recommendation': one fenced ```markdown block, parsed only
  // structurally by parseFence. `fenceText` (the fence's exact content, or
  // null with no '## Recommendation') feeds the hashes below regardless of
  // whether the fence is otherwise valid -- that value is only ever read
  // once this function has returned without throwing.
  let fence = null;
  let fenceText = null;
  if (hasFenceSection) {
    fenceText = extractFence(sections.Recommendation, problems);
    if (fenceText !== null) {
      fence = parseFence(fenceText, question, { id, graph, slug, path: relPath }, problems);
    }
  }

  // The hashes: what stands, and what each fact recommends. A ruling pins
  // its fact's recommendation hash and a review pins the node's, so both
  // are computed from the same parts the node itself exposes.
  const hashParts = {
    fmText,
    answer: sections.Answer,
    rationale: sections.Rationale,
    fence: fenceText === null ? null : { raw: fenceText },
    facts,
    review,
    stage,
  };
  const standingHash = deriveStandingHash(hashParts);
  for (const fact of facts) {
    fact.recommendationHash = deriveFactRecommendationHash(hashParts, fact);
    fact.moved = factMoved(hashParts, fact);
  }
  const recommendationHash = deriveRecommendationHash(hashParts);
  const nodeMoved = moved(hashParts);

  if (nodeMoved && stage === null) {
    problems.push(`${id} has a recommendation that has moved since its ruling and must carry stage`);
  }

  if (problems.length > 0) {
    throw fail(relPath, problems);
  }

  return {
    id,
    graph,
    slug,
    path: relPath,
    hash: null, // set by readGraph from the file's raw bytes
    question,
    form,
    under,
    tier,
    boost,
    cites,
    instrument,
    after,
    depends,
    source,
    bears,
    defines,
    shims,
    stage,
    order,
    facts,
    answerFact,
    review,
    // A `review` carrying only the survey's pin has no draft verdict for a
    // move to overtake, so `reviewStale` is asked only where a draft review
    // was actually recorded; `surveyStale` is its counterpart on the other
    // pin, and `surveyOwed` and `readyToRule` are what the two decide
    // together.
    reviewStale: review !== null && review.of !== null && reviewStale(hashParts),
    surveyStale: surveyStale(hashParts),
    surveyOwed: surveyOwed(hashParts),
    readyToRule: readyToRule(hashParts),
    fence,
    fmText,
    standingHash,
    recommendationHash,
    moved: nodeMoved,
    proposal: proposal(hashParts),
    divergesFromRecommendation: divergesFromRecommendation(hashParts),
    onFrontier: onFrontier(hashParts),
    answer: sections.Answer,
    rationale: sections.Rationale,
    account: sections.Account,
    disposition: sections.Disposition,
  };
}

// ---------------------------------------------------------------------------
// the whole graph
// ---------------------------------------------------------------------------

async function pathIsDirectory(p) {
  try {
    const st = await stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

async function walkMarkdownFiles(dir) {
  const out = [];
  async function walk(current, relParts) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await walk(path.join(current, entry.name), [...relParts, entry.name]);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        out.push({
          absPath: path.join(current, entry.name),
          relSlashPath: [...relParts, entry.name].join('/'),
        });
      }
    }
  }
  await walk(dir, []);
  return out;
}

/**
 * Read and validate the whole disposition graph rooted at `rootDir`:
 * `disposition.yaml` plus every `<graph>/**\/*.md` node file it declares.
 *
 * @param {string} rootDir
 * @returns {Promise<{module: string, ref: string|null, graphs: object, nodes: object[]}>}
 * @throws {Error} whose message lists every validation problem found (one
 *   per line, each prefixed by the file's path relative to `rootDir`), not
 *   just the first.
 */
export async function readGraph(rootDir) {
  const manifestPath = path.join(rootDir, 'disposition.yaml');
  let manifestText;
  try {
    manifestText = await readFile(manifestPath, 'utf8');
  } catch (err) {
    throw new Error(`${path.relative(rootDir, manifestPath)}: cannot read manifest: ${err.message}`);
  }
  let manifest;
  try {
    manifest = YAML.parse(manifestText);
  } catch (err) {
    throw new Error(`disposition.yaml: invalid YAML: ${err.message}`);
  }
  if (!isPlainObject(manifest)) {
    throw new Error('disposition.yaml: must be a YAML mapping');
  }
  if (typeof manifest.module !== 'string' || manifest.module.length === 0) {
    throw new Error("disposition.yaml: 'module' is required and must be a non-empty string");
  }
  if (!isPlainObject(manifest.graphs)) {
    throw new Error("disposition.yaml: 'graphs' is required and must be a mapping");
  }

  const problems = [];

  // discover files declared by the manifest's graphs
  const fileEntries = [];
  for (const graphName of Object.keys(manifest.graphs)) {
    const graphDir = path.join(rootDir, graphName);
    if (!(await pathIsDirectory(graphDir))) continue; // not yet populated -- not an error
    const files = await walkMarkdownFiles(graphDir);
    for (const f of files) {
      fileEntries.push({
        graph: graphName,
        slug: f.relSlashPath.replace(/\.md$/, ''),
        absPath: f.absPath,
        relPath: path.relative(rootDir, f.absPath),
      });
    }
  }

  // parse each file, collecting every problem rather than stopping at the first
  const parsed = [];
  for (const entry of fileEntries) {
    const id = `${manifest.module}/${entry.graph}/${entry.slug}`;
    let bytes;
    try {
      bytes = await readFile(entry.absPath);
    } catch (err) {
      problems.push(`${entry.relPath}: cannot read file: ${err.message}`);
      continue;
    }
    try {
      const node = parseNode(bytes.toString('utf8'), {
        id,
        graph: entry.graph,
        slug: entry.slug,
        path: entry.relPath,
      });
      node.hash = blobSha1(bytes);
      parsed.push(node);
    } catch (err) {
      problems.push(err.message);
    }
  }

  // canonicalize reference fields to local form now that we have the
  // manifest. A `bears` entry with no `node` of its own bears on the
  // reading's one parent, which is what makes the common case say nothing.
  for (const node of parsed) {
    node.under = node.under.map((refId) => canonicalizeId(refId, manifest));
    node.after = node.after.map((refId) => canonicalizeId(refId, manifest));
    node.depends = node.depends.map((d) => ({ ...d, id: canonicalizeId(d.id, manifest) }));
    node.cites = node.cites.map((c) => ({ ...c, id: canonicalizeId(c.id, manifest) }));
    node.order = node.order.map((step) => step.map((refId) => canonicalizeId(refId, manifest)));
    node.bears = node.bears.map((b) => ({
      ...b,
      node: b.node === null
        ? (node.under.length === 1 ? node.under[0] : null)
        : canonicalizeId(b.node, manifest),
    }));
  }

  // referential integrity: every 'under' entry must resolve within this
  // graph and must not repeat the same parent twice (a repeated id would
  // double that parent's rank contribution and duplicate the child in
  // `children`); every 'after' entry must also resolve within this graph.
  // every 'depends' entry must resolve within this graph, must not repeat,
  // must not name the node itself, and must name a node that carries a
  // stage -- a dependency is on an open question, not a settled one --
  // keyed on the entry's 'id' part throughout, so the same ancestor named
  // twice under two different options is still a duplicate. A qualified
  // entry additionally requires the named option to actually be on the
  // ancestor's answer fact, once the ancestor itself resolves.
  const nodesById = new Map(parsed.map((n) => [n.id, n]));
  const idSet = new Set(nodesById.keys());
  for (const node of parsed) {
    const seenUnder = new Set();
    for (const u of node.under) {
      if (!idSet.has(u)) {
        problems.push(`${node.path}: unresolved 'under' reference: ${u}`);
      }
      if (seenUnder.has(u)) {
        problems.push(`${node.path}: duplicate under reference: ${u}`);
      }
      seenUnder.add(u);
    }
    for (const a of node.after) {
      if (!idSet.has(a)) {
        problems.push(`${node.path}: unresolved after reference: ${a}`);
      }
    }
    const seenDepends = new Set();
    for (const d of node.depends) {
      if (d.id === node.id) {
        problems.push(`${node.path}: 'depends' names itself`);
        continue;
      }
      if (!idSet.has(d.id)) {
        problems.push(`${node.path}: unresolved 'depends' reference: ${d.id}`);
      } else if (!onFrontier(nodesById.get(d.id))) {
        problems.push(`${node.path}: 'depends' names ${d.id}, which carries no stage; a dependency is on an open question`);
      } else if (d.option !== null) {
        const answerFact = factByName(nodesById.get(d.id), 'answer');
        if (answerFact === null || !answerFact.options.some((o) => o.name === d.option)) {
          problems.push(`${node.path}: 'depends' names option ${d.option} on ${d.id}, whose answer fact has no such option`);
        }
      }
      if (seenDepends.has(d.id)) {
        problems.push(`${node.path}: duplicate 'depends' reference: ${d.id}`);
      }
      seenDepends.add(d.id);
    }

    // bears: a reading names the node, the fact, and the option a tradition
    // bears on, each of which must exist for the inverse to be derivable.
    for (const b of node.bears) {
      if (b.node === null) continue; // already reported: no parent to default to
      const target = nodesById.get(b.node);
      if (target === undefined) {
        problems.push(`${node.path}: 'bears' names ${b.node}, which is not a node`);
        continue;
      }
      const fact = factByName(target, b.fact);
      if (fact === null) {
        problems.push(`${node.path}: 'bears' names the '${b.fact}' fact of ${b.node}, which has no such fact`);
        continue;
      }
      if (!fact.options.some((o) => o.name === b.option)) {
        problems.push(`${node.path}: 'bears' names option ${b.option} on the '${b.fact}' fact of ${b.node}, which has no such option`);
      }
    }
  }

  // The class a node's rulings confer decides whether it owes the dialogue a
  // stage: an unanswered node carries the whole dialogue, a deferred node
  // stays on the alignment frontier until the author returns to it, and a
  // delegated or ratified node is off it -- unless its recommendation has
  // moved since the ruling, which `parseNode` has already caught.
  for (const node of parsed) {
    const cls = deriveClass(node, nodesById);
    if ((cls === 'unanswered' || cls === 'deferred') && node.stage === null) {
      problems.push(`${node.path}: ${node.id} is ${cls} and must carry stage`);
    }
  }

  // order: every named id must exist, and -- unless this order node is a
  // root, which may name any node -- must be this node's own id or a
  // descendant of one of its parents. Built from a lenient children map
  // (an unresolved 'under' elsewhere is already reported above, and must
  // not throw here before every problem has been collected).
  const lenientChildren = new Map(parsed.map((n) => [n.id, []]));
  for (const node of parsed) {
    for (const u of node.under) {
      if (idSet.has(u)) lenientChildren.get(u).push(node.id);
    }
  }
  for (const node of parsed) {
    if (node.order.length === 0) continue;
    const isRoot = node.under.length === 0;
    const scope = isRoot ? null : deriveDescendants(node.under, lenientChildren);
    for (const step of node.order) {
      for (const id of step) {
        if (!idSet.has(id)) {
          problems.push(`${node.path}: 'order' names ${id}, which is not a node`);
        } else if (id !== node.id && !isRoot && !scope.has(id)) {
          problems.push(`${node.path}: 'order' names ${id}, which is neither this node nor a descendant of one of its parents`);
        }
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(problems.join('\n'));
  }

  // structural derivation: only reached once every file and every reference
  // is individually valid, so a thrown error here can only be a cycle.
  let rankMap;
  try {
    rankMap = deriveRank(parsed);
  } catch (err) {
    const byPath = (err.cycleIds ?? []).map((id) => `${nodesById.get(id).path}: ${err.message}`);
    throw new Error((byPath.length > 0 ? byPath : [err.message]).join('\n'));
  }
  const childrenMap = deriveChildren(parsed);
  const settlesMap = deriveSettles(parsed, childrenMap);

  // the order rule: only reached once every order-named id is confirmed to
  // exist and be in scope (above), so every rank lookup below resolves.
  // (i) every member of step k outranks every member of every later step.
  // (ii) every member of the first step is outranked by nothing in scope
  // except its own ancestors, its own descendants (a lone child shares its
  // parent's rank exactly), and the other members of the same step; a tie
  // (rank equal, not just greater) counts as outranking here, since the
  // walk would otherwise fall to the id sort.
  const orderProblems = [];
  for (const node of parsed) {
    if (node.order.length === 0) continue;
    const rankOf = (id) => rankMap.get(id);

    for (let k = 0; k < node.order.length; k += 1) {
      for (let k2 = k + 1; k2 < node.order.length; k2 += 1) {
        for (const id of node.order[k]) {
          for (const id2 of node.order[k2]) {
            if (!(rankOf(id) > rankOf(id2))) {
              orderProblems.push(
                `${node.path}: 'order' step ${k + 1} names ${id} (rank ${rankOf(id).toFixed(4)}), which does not outrank ${id2} (rank ${rankOf(id2).toFixed(4)}) of step ${k2 + 1}`,
              );
            }
          }
        }
      }
    }

    const isRoot = node.under.length === 0;
    const scope = isRoot ? new Set(nodesById.keys()) : deriveDescendants(node.under, childrenMap);
    const firstStep = new Set(node.order[0]);
    for (const id of firstStep) {
      const idAncestors = deriveAncestors(id, nodesById);
      const idDescendants = deriveDescendants([id], childrenMap);
      for (const x of scope) {
        if (x === id || firstStep.has(x) || idAncestors.has(x) || idDescendants.has(x)) continue;
        if (rankOf(x) >= rankOf(id)) {
          orderProblems.push(
            `${node.path}: 'order' puts ${id} in its first step, but ${x} (rank ${rankOf(x).toFixed(4)}) outranks it and is not its ancestor`,
          );
        }
      }
    }
  }
  if (orderProblems.length > 0) {
    throw new Error(orderProblems.join('\n'));
  }

  // The readings' inverse: every option carries the readings that bear on
  // it, derived from their `bears` and never stored twice.
  const readingsByOption = deriveReadings(parsed);
  for (const node of parsed) {
    for (const fact of node.facts) {
      for (const option of fact.options) {
        option.readings = readingsByOption.get(`${node.id}\n${fact.name}\n${option.name}`) ?? [];
      }
    }
  }

  const nodes = parsed
    .map((node) => {
      const settled = settlesMap.get(node.id);
      return {
        ...node,
        children: childrenMap.get(node.id) ?? [],
        rank: rankMap.get(node.id) ?? 0,
        ceiling: deriveCeiling(node.id, nodesById),
        class: deriveClass(node, nodesById),
        classSource: deriveClassSource(node, nodesById),
        status: deriveStatus(node, nodesById),
        settles: settled.settles,
        settledBy: { under: settled.under, options: settled.options, depends: settled.depends },
      };
    })
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return {
    module: manifest.module,
    ref: isAbsent(manifest.ref) ? null : manifest.ref,
    graphs: manifest.graphs,
    nodes,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const rootDir = path.resolve(process.argv[2] ?? process.cwd());
  readGraph(rootDir)
    .then((graph) => {
      console.log(JSON.stringify(graph, null, 2));
    })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    });
}
