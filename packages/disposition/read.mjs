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

import { applyStrict } from './patch.mjs';
import { readWords, resolveReference, unreferencedEntries } from './words.mjs';

import {
  blobSha1,
  canonicalizeId,
  CLOSED_VOCABULARY_FACTS,
  CONFERRABLE_CLASSES,
  confirmedOption,
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
  isVocabularyOption,
  moved,
  nodeEncoding,
  onFrontier,
  proposal,
  RESERVED_FACT_OPTIONS,
  reviewStale,
  ruledOption,
  TOPOLOGY_VOCABULARY,
} from './derive.mjs';

// Which encoding a node is written in, which option its rulings confirm, and
// the reserved vocabulary a fact's options may draw on are derivations like
// any other and live in `derive.mjs`, where the hashes need them too; they
// are re-exported here so a consumer that reads the graph through this
// module has them under one import.
export {
  confirmedOption, nodeEncoding, CONFERRABLE_CLASSES, RESERVED_FACT_OPTIONS, TOPOLOGY_VOCABULARY, isVocabularyOption,
};

// ---------------------------------------------------------------------------
// vocabulary
// ---------------------------------------------------------------------------

export const FRONTMATTER_KEYS = [
  'question', 'form', 'under', 'tier', 'boost', 'cites', 'instrument', 'after',
  'source', 'bears', 'defines', 'shims', 'stage', 'order', 'facts', 'review',
  'depends', 'probes',
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
// ruling on the dialogue node. A topology fact is minted on a node when a
// second placement becomes viable; where one placement is viable there is
// no fact, and the node's place is a field of it.
export const FACT_NAMES = ['answer', 'authority', 'topology', 'persistence'];
// `against` is the AI's own case against the option the fact recommends,
// written when the recommendation is recorded, so a reader sees the argument
// the recommendation had to beat rather than only the argument for it.
export const FACT_KEYS = ['name', 'options', 'recommends', 'boldness', 'against', 'stands'];
// `supports` and `diverges` are the content encoding's: the addresses of the
// author's words, in the ledger under `<rootDir>/words/`, that support this
// option or diverge from it, so that one quotation is kept once and
// referenced rather than copied onto every option that carries it
// (commons.systems/disposition-graph/quotes, `words-in-a-ledger-on-the-ref`).
export const OPTION_KEYS = ['name', 'source', 'ref', 'status', 'reason', 'ruling', 'supports', 'diverges'];
// The two ledger-reference lists an option may carry, and the shape of an
// address in them.
export const OPTION_WORDS_KEYS = ['supports', 'diverges'];
export const WORDS_REFERENCE_RE = /^words\/\d{4}-\d{2}-\d{2}\/\d+$/;
// `reason` is the author's own reason for the ruling, in their words and
// optional, so that what they said when they chose has somewhere in the
// record to land (commons.systems/disposition-graph/dialogue,
// `ruling-carries-the-reason`); the other three are required as they always
// were.
export const RULING_KEYS = ['response', 'date', 'of', 'reason'];
export const RULING_REQUIRED_KEYS = ['response', 'date', 'of'];
// `deny` is never stored: a denial is a kickback with the author's words.
export const RULING_RESPONSES = ['confirm', 'edit'];
// The named sources of an option. Any other non-empty string is read as the
// id of the node, or the name of the instrument, that raised it.
export const OPTION_SOURCES = ['author', 'ai', 'review'];
// The one status an option may carry. Absent means viable; `passed` means the
// AI holds the option dominated on the record's criteria and keeps it on the
// list with the reason it was passed over, so that a candidate never silently
// leaves the list and the author may still rule for it
// (commons.systems/disposition-graph/prose-and-structure).
export const OPTION_STATUSES = ['passed'];
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
// `against` is the review's own counter-argument, optional and outside the
// all-or-nothing rule the other four share: a review may be complete without
// one, and a node with no draft review carries none.
// `commit` is the graph commit the draft reading read, optional beside `of`
// the way `against` is: it names the tree `of`'s pin was taken from, so a
// re-reading can diff the text the last reading pinned against the node as
// it now stands (commons.systems/disposition-graph/review-cost). A node
// with no draft review carries none, and one whose review predates this
// field carries none either.
export const REVIEW_DRAFT_KEYS = ['verdict', 'strength', 'date', 'of', 'against', 'commit'];
export const REVIEW_DRAFT_REQUIRED_KEYS = ['verdict', 'strength', 'date', 'of'];
// `survey`'s own six keys, per apply.mjs's `surveyBlock`/`renderSurveyLines`
// (commons.systems/disposition-graph/survey-selection): `date`, the graph
// commit the survey read (`commit`), the hashes of the five sections its
// validations read (`text`, keyed by `question`, `answer`, `options`,
// `rivals`, `words`), the register of what the survey left open on the node
// (`findings`), and the candidate pairs it actually read that touch this
// node (`pairs`). `REVIEW_SURVEY_KEYS` is the whole vocabulary a survey
// block may use; an unknown key still fails the same way a bad `date` or
// `of` does.
//
// The block is one of two pins. A **judged pin** carries `of`, the
// recommendation hash the survey judged the node against, and is what a
// review- or ruling-stage node needs to stand surveyed
// (`the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`: "a pin on a
// node the survey read by what it answers is a pin on a reading that judged
// the node against nothing, and the answer has to say... that such a pin
// freezes without satisfying the survey a ruling owes"). A **read pin**
// carries no `of`: it is written on any node the survey merely read --
// whatever stage it stands at -- so that node's text is frozen against a
// later delta without the node being counted as judged. `date` and `text`
// are required on a read pin; `date` and `of` are required on a judged one,
// and carrying `findings` or `pairs` (which name what a judgment left open)
// makes a block a judged one and requires `of` beside them. `REVIEW_SURVEY_
// REQUIRED_KEYS` is only what every survey block owes regardless of which
// pin it is; `surveyOk`, below, is where the two shapes are actually told
// apart.
export const REVIEW_SURVEY_KEYS = ['date', 'of', 'commit', 'text', 'findings', 'pairs'];
export const REVIEW_SURVEY_REQUIRED_KEYS = ['date'];
// The two stages the survey judges: a node is ruled from the ruling stage,
// and reaches it from the review stage, so those are where the frontier's
// consistency with itself is what the author is about to rule on.
export const SURVEY_STAGES = ['review', 'ruling'];
export const SECTION_ORDER = ['Disposition', 'Answer', 'Rationale', 'Facts', 'Recommendation', 'Account'];
// The two encodings a node file may be written in, and the four sections the
// content encoding struck: a node carrying none of them, and no `stands`, is
// in the content encoding, where the answer is the resolved content of the
// confirmed option and the sections above have moved onto the options
// (`nodeEncoding`). `SECTION_ORDER` is the legacy encoding's; what a content
// node may carry is `## Facts` and `## Account`, which is what is left of it.
export const ENCODINGS = ['legacy', 'content'];
export const STRUCK_SECTIONS = ['Answer', 'Rationale', 'Recommendation', 'Disposition'];
export const CONTENT_SECTIONS = ['Facts', 'Account'];
export const SHIM_KEYS = ['artifact', 'liquidation', 'declared', 'for'];
// A `probes` entry: a question the AI needs the author to answer before it
// can recommend, whose answer is not itself a disposition
// (commons.systems/disposition-graph/dialogue). `fact` names the decision it
// bears on where it bears on one, and is absent where it bears on the node's
// ground; `status` and `reason` are absent while it stands open and both
// present once it is discharged, in the shape an option's `passed`/`reason`
// pair already has.
export const PROBE_KEYS = ['id', 'asks', 'why', 'discharges', 'source', 'raised', 'fact', 'status', 'reason'];
// A `defines` entry is a bare term or a term with the gloss a projection
// shows wherever a vocabulary fact offers that term as an option: what
// confirming that choice would mean, written once, on the node that defines
// the term (commons.systems/disposition-graph/dialogue,
// `every-option-carries-its-sentence`).
export const DEFINES_KEYS = ['term', 'gloss'];
// The keys a '## Recommendation' fence may not carry: the fence holds the
// node as it would stand, and a stamp, the facts, and the dialogue's own
// state are not part of that.
export const FENCE_FORBIDDEN_KEYS = ['authority', 'facts', 'stage', 'review', 'depends', 'probes'];
// `authority` is closed: a ruling confers one of exactly three classes and
// nothing else is legal there. `topology` is open: `keep` and `prune` are
// the record's own vocabulary and carry no subsection, but a node may also
// offer a named placement option -- folding the node into another, or
// standing it under different questions -- which is this node's own and
// carries a `#### <option>` subsection like any answer option. `persistence`
// names its options freely and reserves none. `CONFERRABLE_CLASSES`,
// `RESERVED_FACT_OPTIONS`, `TOPOLOGY_VOCABULARY`, `CLOSED_VOCABULARY_FACTS`
// and `isVocabularyOption` live in `derive.mjs`, which needs them for the
// hashes; the first four are re-exported above.

const FRONTMATTER_KEY_SET = new Set(FRONTMATTER_KEYS);
const FORM_SET = new Set(FORMS);
const FACT_NAME_SET = new Set(FACT_NAMES);
const FACT_KEY_SET = new Set(FACT_KEYS);
const OPTION_KEY_SET = new Set(OPTION_KEYS);
const OPTION_STATUS_SET = new Set(OPTION_STATUSES);
const RULING_KEY_SET = new Set(RULING_KEYS);
const RULING_RESPONSE_SET = new Set(RULING_RESPONSES);
const CLOSED_VOCABULARY_FACT_SET = new Set(CLOSED_VOCABULARY_FACTS);
const DEFINES_KEY_SET = new Set(DEFINES_KEYS);
const BEARS_KEY_SET = new Set(BEARS_KEYS);
const RELATION_SET = new Set(RELATIONS);
const BOLDNESS_SET = new Set(BOLDNESS_VALUES);
const INSTRUMENT_KIND_SET = new Set(INSTRUMENT_KINDS);
const STAGE_SET = new Set(STAGES);
const REVIEW_VERDICT_SET = new Set(REVIEW_VERDICTS);
const REVIEW_STRENGTH_SET = new Set(REVIEW_STRENGTHS);
const REVIEW_KEY_SET = new Set([...REVIEW_DRAFT_KEYS, 'survey']);
const ANSWER_OWED_NOTE = 'every answer option but the one that stands says in prose what it would answer';
const PERSISTENCE_OWED_NOTE = 'every persistence option says in prose what keeping the node that shape would mean';
const TOPOLOGY_OWED_NOTE = 'every topology option but keep and prune says in prose what that placement would mean';
const SURVEY_STAGE_SET = new Set(SURVEY_STAGES);
const SHIM_KEY_SET = new Set(SHIM_KEYS);
const PROBE_KEY_SET = new Set(PROBE_KEYS);
// The one status a probe may carry: 'discharged' and nothing else, in the
// shape OPTION_STATUSES already has for an option's 'passed'.
const PROBE_STATUSES = ['discharged'];
const PROBE_STATUS_SET = new Set(PROBE_STATUSES);
const REVIEW_SURVEY_KEY_SET = new Set(REVIEW_SURVEY_KEYS);

// The five sections a survey's `text` pin names -- brief.mjs's own
// `SECTION_HASH_KEYS`, mirrored here rather than imported: clean-context-review
// depends on this package and not the reverse, so the vocabulary is held in
// both places, the way the survey's other closed vocabularies already are
// (STAGES, REVIEW_VERDICTS, and the rest).
const SURVEY_TEXT_SECTION_KEYS = ['question', 'answer', 'options', 'rivals', 'words'];
const SURVEY_TEXT_SECTION_SET = new Set(SURVEY_TEXT_SECTION_KEYS);
// The three states a finding's status may hold in the survey's register,
// mirrored from apply.mjs's `surveyRegister` the same way.
const SURVEY_FINDING_STATUSES = ['new', 're-derived', 'standing'];
const SURVEY_FINDING_STATUS_SET = new Set(SURVEY_FINDING_STATUSES);
const SURVEY_FINDING_KEYS = ['finding', 'kind', 'status', 'since', 'supports', 'discharge', 'nodes'];
const SURVEY_PAIR_KEYS = ['with', 'keys'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HASH_RE = /^[0-9a-f]{40}$/;
// The survey's `text` hashes are sha256 (brief.mjs's `sha256`, not the sha1
// `blobSha1` every other pin in this file uses), so they get their own,
// wider regex rather than sharing HASH_RE.
const SHA256_RE = /^[0-9a-f]{64}$/;
const OPTION_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const ANSWER_FACT = 'answer';

// `review.survey.text`: a plain object naming a subset of the five section
// keys, each a sha256 hex digest. Partial is accepted -- brief.mjs's
// `movedSections` already treats an absent key as unmoved rather than
// refusing it -- so this checks shape only, not completeness.
function surveyTextOk(t) {
  return isPlainObject(t)
    && Object.keys(t).every((k) => SURVEY_TEXT_SECTION_SET.has(k))
    && Object.values(t).every((v) => typeof v === 'string' && SHA256_RE.test(v));
}

// `review.survey.findings[]`: one entry of the register `surveyRegister`
// writes, whole -- all seven keys, none else.
function surveyFindingOk(f) {
  return isPlainObject(f)
    && Object.keys(f).length === SURVEY_FINDING_KEYS.length
    && SURVEY_FINDING_KEYS.every((k) => Object.prototype.hasOwnProperty.call(f, k))
    && isNonEmptyString(f.finding)
    && isNonEmptyString(f.kind)
    && SURVEY_FINDING_STATUS_SET.has(f.status)
    && typeof f.since === 'string' && isValidDate(f.since)
    && Array.isArray(f.supports) && f.supports.every((s) => SURVEY_TEXT_SECTION_SET.has(s))
    && isNonEmptyString(f.discharge)
    && Array.isArray(f.nodes) && f.nodes.length > 0 && f.nodes.every((n) => isNonEmptyString(n));
}

// `review.survey.pairs[]`: one candidate pair the survey actually read that
// touches this node, with the key it was drawn on.
function surveyPairOk(p) {
  return isPlainObject(p)
    && Object.keys(p).length === SURVEY_PAIR_KEYS.length
    && SURVEY_PAIR_KEYS.every((k) => Object.prototype.hasOwnProperty.call(p, k))
    && isNonEmptyString(p.with)
    && Array.isArray(p.keys) && p.keys.every((k) => isNonEmptyString(k));
}

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
 * `topology`, where the node's place in the graph is decided: `keep`,
 * `prune`, or a named placement; `persistence`, present or derived -- are the
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
    && Object.keys(r).every((k) => RULING_KEY_SET.has(k))
    && RULING_REQUIRED_KEYS.every((k) => Object.prototype.hasOwnProperty.call(r, k))
    && RULING_RESPONSE_SET.has(r.response)
    && typeof r.date === 'string' && isValidDate(r.date)
    && isNonEmptyString(r.of)
    && (isAbsent(r.reason) || isNonEmptyString(r.reason));
  // The answer fact's options are referenced by name (`stands`, `recommends`,
  // `depends`, `bears`), so their names are slugs; a reserved fact's options
  // are its vocabulary and may be free text, e.g. a persistence shape. Which
  // vocabulary a reserved fact may draw on is `RESERVED_FACT_OPTIONS`, below,
  // and persistence draws on none: it names its options per node.
  const optionOk = (o, factName) => isPlainObject(o)
    && Object.keys(o).every((k) => OPTION_KEY_SET.has(k))
    && typeof o.name === 'string'
    && (factName === ANSWER_FACT ? OPTION_NAME_RE.test(o.name) : isNonEmptyString(o.name) && !o.name.includes('\n'))
    && (isAbsent(o.source) || isNonEmptyString(o.source))
    && (isAbsent(o.ref) || isNonEmptyString(o.ref))
    && (isAbsent(o.status) || OPTION_STATUS_SET.has(o.status))
    && (isAbsent(o.reason) || isNonEmptyString(o.reason))
    && (isAbsent(o.ruling) || rulingOk(o.ruling));
  const entryOk = (entry) => isPlainObject(entry)
    && Object.keys(entry).every((k) => FACT_KEY_SET.has(k))
    && typeof entry.name === 'string' && FACT_NAME_SET.has(entry.name)
    && Array.isArray(entry.options) && entry.options.length > 0 && entry.options.every((o) => optionOk(o, entry.name))
    && (isAbsent(entry.recommends) || isNonEmptyString(entry.recommends))
    && (isAbsent(entry.boldness) || BOLDNESS_SET.has(entry.boldness))
    && (isAbsent(entry.against) || isNonEmptyString(entry.against))
    && (isAbsent(entry.stands) || isNonEmptyString(entry.stands));

  if (!Array.isArray(raw) || raw.length === 0 || !raw.every(entryOk)) {
    problems.push(
      `'facts' must be a non-empty list of {name: ${FACT_NAMES.join('|')}, `
      + "options: <one or more {name: <lowercase slug on the answer fact, non-empty on a reserved one>, source: <non-empty string>, "
      + `ref: <non-empty string>, status: <${OPTION_STATUSES.join('|')}>, reason: <non-empty string, with status>, ruling: <optional `
      + `{response: ${RULING_RESPONSES.join('|')}, date: YYYY-MM-DD, of: <hash>, reason: <optional non-empty string>}>}>, `
      + 'recommends: <optional option name>, '
      + `boldness: <${BOLDNESS_VALUES.join('|')}, required with recommends>, `
      + 'against: <optional non-empty string, with recommends>, '
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
      status: isAbsent(o.status) ? null : o.status,
      reason: isAbsent(o.reason) ? null : o.reason,
      ruling: isAbsent(o.ruling)
        ? null
        : {
          response: o.ruling.response,
          date: o.ruling.date,
          of: o.ruling.of,
          reason: isAbsent(o.ruling.reason) ? null : o.ruling.reason,
        },
      // The ledger addresses of the author's words on this option. Their own
      // shape is checked below, one message per malformed list, so that the
      // combined shape message above stays about the option's own fields;
      // whether an address resolves needs the ledger and is `readGraph`'s.
      supports: isAbsent(o.supports) ? [] : o.supports,
      diverges: isAbsent(o.diverges) ? [] : o.diverges,
      // filled in from '## Facts' once the body is parsed
      prose: '',
      // the content encoding's, parsed out of `prose` by
      // `parseOptionSubsection` once the encoding is known. `resolved` is
      // the whole text `content` resolves to, written here once so that
      // every reader of the option -- the hashes included -- shares one
      // resolution; null where there is no content, or where resolving it
      // failed, which is a problem reported on the node.
      sentence: '',
      aiSupport: null,
      aiDivergence: null,
      content: null,
      resolved: null,
      readings: [],
    })),
    recommends: isAbsent(entry.recommends) ? null : entry.recommends,
    boldness: isAbsent(entry.boldness) ? null : entry.boldness,
    against: isAbsent(entry.against) ? null : entry.against,
    stands: isAbsent(entry.stands) ? null : entry.stands,
    prose: '',
    // whether '## Facts' actually carries a '### <this fact>' heading --
    // distinct from `prose === ''`, which is also true when the heading is
    // simply omitted (owed nothing, nothing to say). Filled in once the
    // body is parsed, alongside `prose` itself.
    hasHeading: false,
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

    // `supports` and `diverges`: each a list of ledger addresses, checked
    // here for their own shape only. A reference that is well-formed but
    // names no entry needs the ledger and is checked by `readGraph`.
    for (const option of entry.options) {
      for (const key of OPTION_WORDS_KEYS) {
        const list = option[key];
        const listOk = Array.isArray(list) && list.every((r) => typeof r === 'string' && WORDS_REFERENCE_RE.test(r));
        if (!listOk) {
          problems.push(
            `fact '${entry.name}' option '${option.name}' has a malformed '${key}': `
            + 'it must be a list of ledger addresses of the form words/<YYYY-MM-DD>/<n>',
          );
          ok = false;
          option[key] = [];
        }
      }
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
    } else if (CLOSED_VOCABULARY_FACT_SET.has(entry.name)) {
      // `authority` is the only closed fact today: its entire option
      // namespace is the three conferrable classes, and any other name is
      // rejected outright. `topology` is not closed -- `keep`/`prune` are
      // reserved, but a node may also offer a freely-named placement option
      // beside them, so it never reaches this branch (see RESERVED_FACT_OPTIONS
      // above and CLOSED_VOCABULARY_FACTS in derive.mjs).
      const vocabulary = RESERVED_FACT_OPTIONS[entry.name];
      if (!optionNames.every((n) => vocabulary.includes(n))) {
        problems.push(`fact '${entry.name}' may only offer the classes a ruling confers: ${vocabulary.join(', ')}`);
        ok = false;
      }
    }

    // An option the AI holds dominated stays on the list with the reason it
    // was passed over: viability is a judgment shown on the option and never
    // the condition of its being listed, so the author may still rule for it
    // (commons.systems/disposition-graph/prose-and-structure). What the
    // judgment may not do is act -- it cannot be what the fact recommends or
    // what stands -- and it never survives the author's own ruling, which
    // supersedes it.
    for (const option of entry.options) {
      if (option.status !== null && option.reason === null) {
        problems.push(`fact '${entry.name}' option '${option.name}' is passed over and must say why ('reason')`);
        ok = false;
      }
      if (option.status === null && option.reason !== null) {
        problems.push(
          `fact '${entry.name}' option '${option.name}' carries a 'reason' with no 'status'; a reason is why an option was passed over`,
        );
        ok = false;
      }
      if (option.status === null) continue;
      if (entry.recommends === option.name) {
        problems.push(`fact '${entry.name}' recommends '${option.name}', which it has passed over`);
        ok = false;
      }
      if (entry.stands === option.name) {
        problems.push(`fact '${entry.name}' stands on '${option.name}', which it has passed over`);
        ok = false;
      }
      if (option.ruling !== null) {
        problems.push(
          `fact '${entry.name}' option '${option.name}' is passed over and carries a ruling; the author's ruling supersedes the AI's viability judgment`,
        );
        ok = false;
      }
    }

    if (entry.recommends === null && entry.against !== null) {
      problems.push(`fact '${entry.name}' states a case against a recommendation but recommends no option`);
      ok = false;
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

    // The confirmed option is the one carrying the most recent confirming
    // ruling, so two of them on one date leave nothing to read it off. The
    // one-ruling-per-fact rule above already forbids the case; this is here
    // so that `confirmedOption`'s contract holds by a check of its own and
    // not by another rule's side effect.
    const confirmed = ruledOptions.filter((o) => o.ruling.response === 'confirm');
    if (confirmed.length > 1) {
      const latest = confirmed.reduce((a, b) => (b.ruling.date > a.ruling.date ? b : a));
      const tied = confirmed.filter((o) => o.ruling.date === latest.ruling.date);
      if (tied.length > 1) {
        problems.push(
          `fact '${entry.name}' carries confirming rulings dated ${latest.ruling.date} on `
          + `${tied.map((o) => `'${o.name}'`).join(' and ')}; nothing says which option is confirmed`,
        );
        ok = false;
      }
    }

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
 * -- and is omitted where there is nothing to say and nothing owed, so the
 * `### ` headings must be a subsequence of the fact names rather than a
 * match: every one names a fact, none repeats, and they read in the facts'
 * order. What is owed is one `#### <option>` per option that is not itself
 * reserved vocabulary (`isVocabularyOption`, in derive.mjs), so such a fact's
 * `### ` heading is omitted only where it has no owed option at all.
 *
 * Under `### answer` and `### persistence`, one `#### <option>` subsection
 * per option says what that option would answer and why it is on the table:
 * every option of every fact carries in prose what it would answer
 * (commons.systems/disposition-graph/dialogue,
 * `every-option-carries-its-sentence`). The one exemption is the answer
 * option named by `stands`, whose text is the `## Answer` section itself, so
 * the option headings must match the option list exactly but for that one.
 * `authority` is a closed vocabulary fact and carries no `#### ` subsections
 * at all: its three option names mean the same on every node, so the
 * sentence is written once on the node that defines the term and projected
 * from there. `topology` is mixed: `keep` and `prune` are reserved the same
 * way, but a node may also offer a freely-named placement option beside
 * them, and that option owes a `#### ` subsection exactly like an answer
 * option, since its meaning is this node's own.
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

  // An option that owns its subsection states itself in prose, so a fact
  // with such an option needs its '### <fact>' subsection even where it has
  // nothing else to say.
  for (const fact of facts) {
    if (seen.has(fact.name)) continue;
    const owed = owedOptionSubsections(fact);
    if (owed.length === 0) continue;
    problems.push(
      `'## Facts' has no '### ${fact.name}' subsection, so ${owed.map((n) => `'#### ${n}'`).join(', ')} `
      + `${owed.length === 1 ? 'is' : 'are'} missing; `
      + (fact.name === ANSWER_FACT ? ANSWER_OWED_NOTE : fact.name === 'topology' ? TOPOLOGY_OWED_NOTE : PERSISTENCE_OWED_NOTE),
    );
  }

  return text;
}

/**
 * Whether one option of one fact owns a `#### <option>` subsection: every
 * option does, but for the answer option named by `stands`, whose text is
 * the `## Answer` section, and an option that is itself reserved vocabulary
 * (`isVocabularyOption`, in derive.mjs) -- the classes on `authority`, or
 * `keep`/`prune` on `topology` -- whose sentence is the gloss on the node
 * that defines the term.
 *
 * @param {object} fact
 * @param {string} optionName
 * @returns {boolean}
 */
function ownsSubsection(fact, optionName) {
  return optionName !== fact.stands && !isVocabularyOption(fact.name, optionName);
}

/**
 * The `#### <option>` subsections one fact owes under its `### <fact>`
 * heading: every option that owns one (`ownsSubsection`), in the fact's own
 * option order.
 *
 * @param {object} fact
 * @returns {string[]} the option names, in the fact's own option order.
 */
function owedOptionSubsections(fact) {
  return fact.options.filter((o) => ownsSubsection(fact, o.name)).map((o) => o.name);
}

/**
 * The `#### <option>` headings under one `### <fact>` subsection: an exact
 * match, in order, against the options that own one (`ownsSubsection`); none
 * at all for a closed vocabulary fact (`CLOSED_VOCABULARY_FACT_SET`), whose
 * every option name means the same on every node and whose sentence is the
 * gloss on the node that defines the term.
 *
 * @param {object} fact
 * @param {{name: string, options: string[]}} heading
 * @param {string[]} problems
 */
function checkOptionHeadings(fact, heading, problems) {
  if (CLOSED_VOCABULARY_FACT_SET.has(fact.name)) {
    for (const name of heading.options) {
      problems.push(
        `'### ${fact.name}' has '#### ${name}', which a vocabulary fact's options do not carry; `
        + `'${name}' means the same on every node, so its sentence is the gloss on the node that defines the term`,
      );
    }
    return;
  }

  // A mixed fact's own vocabulary members (`keep`/`prune` on `topology`) own
  // no subsection either, but unlike a closed fact this is not the whole of
  // its option namespace, so a stray one is called out on its own rather
  // than by rejecting every heading present.
  for (const name of heading.options) {
    if (isVocabularyOption(fact.name, name)) {
      problems.push(
        `'### ${fact.name}' has '#### ${name}', which a vocabulary fact's options do not carry; `
        + `'${name}' means the same on every node, so its sentence is the gloss on the node that defines the term`,
      );
    }
  }

  const expected = owedOptionSubsections(fact);
  const found = heading.options.filter((n) => ownsSubsection(fact, n));
  const span = Math.max(expected.length, found.length);
  for (let i = 0; i < span; i += 1) {
    if (expected[i] !== found[i]) {
      const want = expected[i] === undefined ? 'nothing' : `'#### ${expected[i]}'`;
      const got = found[i] === undefined ? 'nothing' : `'#### ${found[i]}'`;
      problems.push(
        `'### ${fact.name}' subsections must match the ${fact.name} fact's options in order: expected ${want} at position ${i + 1}, found ${got}`,
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
const FENCE_LABEL = { display: "'## Recommendation'", path: '## Recommendation' };

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
 * @param {{display: string, path: string}} [label] - what to call the fence
 *   in a message and in a nested parse error's path. The default names the
 *   `## Recommendation` section; the content encoding names the option whose
 *   content the fence holds, since a node there carries one such fence per
 *   option rather than one for the whole node.
 * @returns {{raw: string, question: string|null, frontmatter: object, sections: object}|null}
 */
function parseFence(fenceText, question, ctx, problems, label = FENCE_LABEL) {
  const fencePath = `${ctx.path} (${label.path})`;
  let fm;
  let bodyText;
  try {
    ({ fm, bodyText } = parseFrontmatter(fenceText, fencePath));
  } catch (err) {
    problems.push(`${label.display} does not parse as a node: ${err.message}`);
    return null;
  }
  const bodyProblems = [];
  const sections = parseBody(bodyText, bodyProblems);
  if (bodyProblems.length > 0) {
    problems.push(`${label.display} does not parse as a node: ${fail(fencePath, bodyProblems).message}`);
    return null;
  }
  if (fm.question !== question) {
    problems.push(`${label.display} answers a different question`);
  }
  for (const key of FENCE_FORBIDDEN_KEYS) {
    if (!isAbsent(fm[key])) {
      problems.push(`${label.display} carries '${key}', which belongs to the node and not to the text it would stand on`);
    }
  }
  if (sections.Facts !== null) {
    problems.push(`${label.display} carries a '## Facts' section, which belongs to the node and not to the text it would stand on`);
  }
  return {
    raw: fenceText,
    question: isAbsent(fm.question) ? null : fm.question,
    frontmatter: { ...fm },
    sections: { ...sections },
  };
}

// ---------------------------------------------------------------------------
// the content encoding: what one `#### <option>` subsection holds
// ---------------------------------------------------------------------------

const AI_SUPPORT_RE = /^\*\*AI support\.\*\*/;
const AI_DIVERGENCE_RE = /^\*\*AI divergence\.\*\*/;
const CONTENT_MARKER_RE = /^\*\*Content\.\*\*/;
const FROM_RE = /^From:[ \t]*(\S.*?)[ \t]*$/;
const CONTENT_FENCE_RE = /^```(markdown|diff)[ \t]*$/;
const CLOSING_FENCE_RE = /^```[ \t]*$/;

/**
 * The whole text one option's content resolves to: its own fence where it
 * carries the content whole, and otherwise the strict application of its
 * hunks to the resolved content of the option its `From:` line names.
 *
 * Throws, with the node, fact and option named, on a fact or an option that
 * is not there, an option carrying no content at all, a base that is not an
 * option of the same fact, a cycle in the `From:` chain, or a hunk that does
 * not apply -- `applyStrict`'s own message, which names the hunk and the
 * line it failed at. The validator turns each into a problem on the node.
 *
 * @param {object} node - a node as `parseNode` shapes it.
 * @param {string} factName
 * @param {string} optionName
 * @returns {string}
 */
export function resolveOptionContent(node, factName, optionName) {
  const where = `${node?.id ?? '(node)'}: fact '${factName}'`;
  const fact = factByName(node, factName);
  if (fact === null) throw new Error(`${where} is not a fact on this node`);

  const seen = [];
  const resolve = (name) => {
    if (seen.includes(name)) {
      throw new Error(`${where} option '${name}' resolves through a cycle: ${[...seen, name].join(' -> ')}`);
    }
    seen.push(name);
    const option = (fact.options ?? []).find((o) => o && o.name === name) ?? null;
    if (option === null) throw new Error(`${where} has no option '${name}'`);
    const content = option.content ?? null;
    if (content === null) throw new Error(`${where} option '${name}' carries no content`);
    if (content.form === 'whole') return content.text;
    const base = resolve(content.from);
    try {
      return applyStrict(base, content.diff);
    } catch (err) {
      throw new Error(`${where} option '${name}' does not apply to '${content.from}': ${err.message}`);
    }
  };
  return resolve(optionName);
}

/**
 * Split one `#### <option>` subsection of a node in the content encoding
 * into the four things it holds, in the order it holds them: the sentence
 * (all prose before the first marker), an optional `**AI support.**`
 * paragraph, an optional `**AI divergence.**` paragraph -- either may run
 * over several paragraphs, each ending where the next marker, the content,
 * or the subsection does -- and the content, whole or as a named change.
 *
 * The content may open with a `**Content.**` marker paragraph and reads the
 * same without one. Whole content is a ` ```markdown ` block holding the
 * node as it would stand under this option; a named change is a `From: <option
 * name>` line and a ` ```diff ` block of unified-diff hunks against that
 * option's resolved content. Nothing but blank lines may follow the block.
 *
 * Every problem is pushed with `label` naming the option, and the field it
 * could not read comes back null, so one malformed subsection does not stop
 * the rest of the node from being checked.
 *
 * @param {string} text - the subsection's text, as `parseFactsSection` cut it.
 * @param {string} label - `fact 'answer' option 'x'`, for the messages.
 * @param {string[]} problems
 * @returns {{sentence: string, aiSupport: string|null, aiDivergence: string|null,
 *   content: {form: 'whole', text: string}|{form: 'change', from: string, diff: string}|null}}
 */
export function parseOptionSubsection(text, label, problems) {
  const lines = String(text).split('\n');
  const empty = { sentence: '', aiSupport: null, aiDivergence: null, content: null };

  // The markers, each at its first occurrence outside a fenced block: the
  // content's own fence is the only fence a subsection has, and it comes
  // last, but the scan is fence-aware so that a sentence quoting a marker
  // inside a code block is not read as one.
  let support = -1;
  let divergence = -1;
  let content = -1;
  let fenceChar = null;
  for (let i = 0; i < lines.length; i += 1) {
    const fence = lines[i].match(/^[ \t]*(`{3,}|~{3,})/);
    if (fence) {
      if (fenceChar === null) {
        fenceChar = fence[1][0];
        if (content === -1 && CONTENT_FENCE_RE.test(lines[i])) content = i;
      } else if (fence[1][0] === fenceChar) {
        fenceChar = null;
      }
      continue;
    }
    if (fenceChar !== null) continue;
    if (support === -1 && AI_SUPPORT_RE.test(lines[i])) support = i;
    else if (divergence === -1 && AI_DIVERGENCE_RE.test(lines[i])) divergence = i;
    else if (content === -1 && (CONTENT_MARKER_RE.test(lines[i]) || FROM_RE.test(lines[i]))) content = i;
  }

  const marks = [support, divergence, content].filter((i) => i !== -1);
  const firstMark = marks.length > 0 ? Math.min(...marks) : lines.length;
  const ordered = [support, divergence, content].filter((i) => i !== -1);
  for (let i = 1; i < ordered.length; i += 1) {
    if (ordered[i] < ordered[i - 1]) {
      problems.push(
        `${label} states its parts out of order: the sentence, then '**AI support.**', `
        + "then '**AI divergence.**', then the content",
      );
      return empty;
    }
  }

  const until = (start) => {
    const after = [support, divergence, content].filter((i) => i > start);
    return after.length > 0 ? Math.min(...after) : lines.length;
  };
  const strip = (start, re) => lines.slice(start, until(start)).join('\n').replace(re, '').trim();

  const sentence = lines.slice(0, firstMark).join('\n').trim();
  const aiSupport = support === -1 ? null : strip(support, AI_SUPPORT_RE);
  const aiDivergence = divergence === -1 ? null : strip(divergence, AI_DIVERGENCE_RE);
  if (content === -1) return { sentence, aiSupport, aiDivergence, content: null };

  return {
    sentence,
    aiSupport,
    aiDivergence,
    content: parseOptionContent(lines.slice(content), label, problems),
  };
}

/**
 * The content half of one `#### <option>` subsection: the lines from its
 * first marker on. Returns null, with a message, on anything that is not one
 * of the two forms exactly.
 *
 * @param {string[]} lines
 * @param {string} label
 * @param {string[]} problems
 * @returns {{form: 'whole', text: string}|{form: 'change', from: string, diff: string}|null}
 */
function parseOptionContent(lines, label, problems) {
  const shapeFail = (why) => {
    problems.push(`${label} content ${why}`);
    return null;
  };
  let i = 0;
  const skipBlank = () => { while (i < lines.length && lines[i].trim() === '') i += 1; };
  skipBlank();
  if (i < lines.length && CONTENT_MARKER_RE.test(lines[i])) {
    // A '**Content.**' paragraph may head the content and says nothing the
    // fence does not; a line of prose beside it would, and is refused.
    if (lines[i].replace(CONTENT_MARKER_RE, '').trim() !== '') {
      return shapeFail("carries prose beside its '**Content.**' heading");
    }
    i += 1;
    skipBlank();
  }

  let from = null;
  const fromMatch = i < lines.length ? lines[i].match(FROM_RE) : null;
  if (fromMatch) {
    from = fromMatch[1];
    i += 1;
    skipBlank();
  }

  const opener = i < lines.length ? lines[i].match(CONTENT_FENCE_RE) : null;
  if (opener === null) {
    return shapeFail(
      from === null
        ? 'must be one fenced ```markdown block holding the node as it would stand, or a `From: <option>` line and one fenced ```diff block'
        : `names '${from}' as its base and must follow it with one fenced \`\`\`diff block`,
    );
  }
  const language = opener[1];
  if (from === null && language !== 'markdown') {
    return shapeFail('is held whole and must be fenced ```markdown, not ```diff');
  }
  if (from !== null && language !== 'diff') {
    return shapeFail(`is a named change against '${from}' and must be fenced \`\`\`diff, not \`\`\`markdown`);
  }

  i += 1;
  const body = [];
  while (i < lines.length && !CLOSING_FENCE_RE.test(lines[i])) {
    body.push(lines[i]);
    i += 1;
  }
  if (i >= lines.length) return shapeFail('opens a fenced block that is never closed');
  i += 1;
  for (; i < lines.length; i += 1) {
    if (lines[i].trim() !== '') return shapeFail('carries text beside its fenced block');
  }

  // Every content in this record ends in a newline: the hunks are line
  // oriented and `applyStrict` refuses a base that does not.
  const text = `${body.join('\n').replace(/\n+$/, '')}\n`;
  return from === null ? { form: 'whole', text } : { form: 'change', from, diff: text };
}

// ---------------------------------------------------------------------------
// the terms a node defines
// ---------------------------------------------------------------------------

/**
 * The terms one node defines, as plain strings. `defines` carries a gloss
 * beside the term where the node wrote one, so a consumer that wants the
 * terms alone -- a term index, a duplicate check -- asks here rather than
 * iterating the field and finding objects.
 *
 * Tolerates a bare-string entry so a node object built by hand, rather than
 * read from a file, still reads.
 *
 * @param {{defines?: ({term: string, gloss: string|null}|string)[]|null}} node
 * @returns {string[]}
 */
export function defineTerms(node) {
  return (node?.defines ?? []).map((d) => (typeof d === 'string' ? d : d?.term)).filter((t) => typeof t === 'string');
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
 * Read every `#### <option>` subsection of a node in the content encoding
 * and check what the encoding requires of it: every option of the answer
 * fact says its own sentence; from the review stage on, every one of them
 * carries its content; content held whole parses as a node answering the
 * same question, carrying none of the dialogue's own keys and no
 * `## Facts`; a named change names another option of the same fact; and the
 * whole resolution is acyclic with every hunk applying exactly.
 *
 * Mutates each option that is not itself reserved vocabulary
 * (`isVocabularyOption`) with what it read; pushes one message per problem.
 *
 * @param {Array<object>} facts - the parsed facts, prose already attached.
 * @param {{id: string, graph: string, slug: string, path: string}} ctx
 * @param {string|null} question - the node's own question.
 * @param {string|null} stage
 * @param {string[]} problems
 */
function parseContentOptions(facts, ctx, question, stage, problems) {
  for (const fact of facts) {
    for (const option of fact.options) {
      if (isVocabularyOption(fact.name, option.name)) continue;
      const label = `fact '${fact.name}' option '${option.name}'`;
      const parsed = parseOptionSubsection(option.prose, label, problems);
      option.sentence = parsed.sentence;
      option.aiSupport = parsed.aiSupport;
      option.aiDivergence = parsed.aiDivergence;
      option.content = parsed.content;
    }
  }

  const answerFact = facts.find((f) => f.name === ANSWER_FACT) ?? null;
  if (answerFact !== null) {
    for (const option of answerFact.options) {
      const label = `fact 'answer' option '${option.name}'`;
      if (option.sentence.trim() === '') {
        problems.push(`${label} states no sentence of its own in its '#### ${option.name}' subsection`);
      }
      // Content is owed from the review stage on, which is where a reading
      // reads what each option would make the node say; below it an option
      // may still be a name and a sentence.
      if ((stage === 'review' || stage === 'ruling') && option.content === null) {
        problems.push(
          `stage ${stage} requires every answer option to carry its content; ${label} carries none`,
        );
      }
    }
  }

  // Content held whole is a node, and is parsed as one -- structurally only,
  // exactly as a '## Recommendation' fence is, since a draft may be invalid
  // under the doctrine of the day. A named change names an option of the
  // same fact, and the resolution it opens is walked below.
  const unresolvable = new Set();
  for (const fact of facts) {
    for (const option of fact.options) {
      if (isVocabularyOption(fact.name, option.name)) continue;
      const content = option.content;
      if (content === null) continue;
      const label = `fact '${fact.name}' option '${option.name}'`;
      if (content.form === 'whole') {
        parseFence(content.text, question, ctx, problems, {
          display: `${label} content`,
          path: `${fact.name}/${option.name}`,
        });
      } else if (!fact.options.some((o) => o.name === content.from)) {
        problems.push(
          `${label} content is a change from '${content.from}', which is not an option of the '${fact.name}' fact`,
        );
        unresolvable.add(`${fact.name}\n${option.name}`);
      }
    }
  }

  // The resolution itself, walked once per option and written onto it: a
  // cycle, a base carrying no content of its own, or a hunk that does not
  // apply is a problem naming the option it was found on. An option whose
  // base is not an option at all is left alone -- the message above already
  // says so, and saying it twice is not a second defect.
  const resolvable = { id: ctx.id, facts };
  for (const fact of facts) {
    for (const option of fact.options) {
      if (isVocabularyOption(fact.name, option.name)) continue;
      if (option.content === null || unresolvable.has(`${fact.name}\n${option.name}`)) continue;
      try {
        option.resolved = resolveOptionContent(resolvable, fact.name, option.name);
      } catch (err) {
        problems.push(err.message.replace(`${ctx.id}: `, ''));
      }
    }
  }
}

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
    const drafted = REVIEW_DRAFT_REQUIRED_KEYS.some(has);
    const surveyed = has('survey');
    const hasSurvey = (s, k) => isPlainObject(s) && Object.prototype.hasOwnProperty.call(s, k) && !isAbsent(s[k]);
    // A survey block is a judged pin wherever it carries `of`, or carries
    // `findings` or `pairs` -- the register and the pair list are what a
    // judgment leaves open, so either one without `of` names a judgment the
    // block does not have. A judged pin requires `of`; a read pin, the
    // remaining shape, requires `text` and carries none of the three.
    const surveyOk = (s) => {
      if (!isPlainObject(s)) return false;
      const bearsJudgment = hasSurvey(s, 'of') || hasSurvey(s, 'findings') || hasSurvey(s, 'pairs');
      return Object.keys(s).every((k) => REVIEW_SURVEY_KEY_SET.has(k))
        && REVIEW_SURVEY_REQUIRED_KEYS.every((k) => Object.prototype.hasOwnProperty.call(s, k))
        && typeof s.date === 'string' && isValidDate(s.date)
        && (bearsJudgment
          ? (typeof s.of === 'string' && HASH_RE.test(s.of))
          : (hasSurvey(s, 'text') && surveyTextOk(s.text)))
        && (!hasSurvey(s, 'commit') || (typeof s.commit === 'string' && HASH_RE.test(s.commit)))
        && (!hasSurvey(s, 'text') || surveyTextOk(s.text))
        && (!hasSurvey(s, 'findings') || (Array.isArray(s.findings) && s.findings.every(surveyFindingOk)))
        && (!hasSurvey(s, 'pairs') || (Array.isArray(s.pairs) && s.pairs.every(surveyPairOk)));
    };
    const ok = isPlainObject(r)
      && Object.keys(r).every((k) => REVIEW_KEY_SET.has(k))
      && (drafted || surveyed)
      && (!drafted || (
        REVIEW_DRAFT_REQUIRED_KEYS.every(has)
        && REVIEW_VERDICT_SET.has(r.verdict)
        && REVIEW_STRENGTH_SET.has(r.strength)
        && typeof r.date === 'string' && isValidDate(r.date)
        && typeof r.of === 'string' && HASH_RE.test(r.of)))
      // The counter-argument argues about a verdict, so it needs one to
      // argue about; it is otherwise optional on a review that has one.
      && (!has('against') || (drafted && isNonEmptyString(r.against)))
      // `commit` names the tree `of`'s pin was taken from, so it needs a
      // drafted `of` to name the tree of, the same way `against` needs a
      // verdict to argue about; validated like `of` itself, a sha1 or absent.
      && (!has('commit') || (drafted && typeof r.commit === 'string' && HASH_RE.test(r.commit)))
      && (!surveyed || surveyOk(r.survey));
    if (!ok) {
      problems.push(
        `'review' must be {verdict: ${REVIEW_VERDICTS.join('|')}, strength: ${REVIEW_STRENGTHS.join('|')}, date: YYYY-MM-DD, of: <sha1>}`
        + ', with an optional against: <non-empty string> and an optional commit: <sha1> beside them'
        + ', and an optional survey, one of two shapes: a judged pin, '
        + '{date: YYYY-MM-DD, of: <sha1>}, or a read pin, {date: YYYY-MM-DD, text: {...}} with no `of`; '
        + 'either may carry an optional commit: <sha1> and text: {question|answer|options|rivals|words: <sha256>, ...}, '
        + `and a judged pin alone may carry findings: [{finding, kind, status: ${SURVEY_FINDING_STATUSES.join('|')}, since: YYYY-MM-DD, `
        + 'supports: [question|answer|options|rivals|words, ...], discharge, nodes: [<id>, ...]}] '
        + 'and pairs: [{with: <id>, keys: [<string>, ...]}] beside it, either of which requires `of`;'
        + ' the four draft-review keys are given together or not at all, and the survey may stand alone',
      );
    } else {
      review = {
        verdict: drafted ? r.verdict : null,
        strength: drafted ? r.strength : null,
        date: drafted ? r.date : null,
        of: drafted ? r.of : null,
        against: drafted && has('against') ? r.against : null,
        commit: drafted && has('commit') ? r.commit : null,
        survey: surveyed
          ? Object.fromEntries(
            REVIEW_SURVEY_KEYS.filter((k) => hasSurvey(r.survey, k)).map((k) => [k, r.survey[k]]),
          )
          : null,
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

  // defines: a term, or a term with the gloss a projection shows wherever a
  // vocabulary fact offers that term as an option. The gloss lives here, on
  // the node that defines the term, and nowhere else: a sentence a projection
  // kept in its own text would be a rule no node projects.
  let defines = null;
  if (!isAbsent(fm.defines)) {
    const entryOk = (d) => isNonEmptyString(d)
      || (isPlainObject(d)
        && Object.keys(d).length === DEFINES_KEY_SET.size
        && DEFINES_KEYS.every((k) => isNonEmptyString(d[k])));
    if (!Array.isArray(fm.defines) || fm.defines.length === 0 || !fm.defines.every(entryOk)) {
      problems.push("'defines' must be a non-empty list of terms, each a non-empty string or {term, gloss} with both non-empty");
    } else {
      defines = fm.defines.map((d) => (typeof d === 'string'
        ? { term: d, gloss: null }
        : { term: d.term, gloss: d.gloss }));
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

  // probes: a list of {id, asks, why, discharges, source, raised, and
  // optional fact, status, reason}, modelled on shims above. The reader
  // checks only the shape of a probe -- the cap of three open probes binds
  // the movement and is checked by the readings as a finding, never here, so
  // that an attention rule never turns into a parse error
  // (commons.systems/disposition-graph/dialogue).
  let probes = [];
  if (!isAbsent(fm.probes)) {
    if (!Array.isArray(fm.probes)) {
      problems.push("'probes' must be a list of {id, asks, why, discharges, source, raised, and optional fact, status, reason}");
    } else {
      const seenProbeIds = new Set();
      probes = fm.probes
        .map((entry, i) => {
          if (!isPlainObject(entry)) {
            problems.push(`'probes[${i}]' must be a mapping with id, asks, why, discharges, source, raised`);
            return null;
          }
          for (const k of Object.keys(entry)) {
            if (!PROBE_KEY_SET.has(k)) problems.push(`unknown key 'probes[${i}].${k}'`);
          }
          let entryOk = true;
          if (typeof entry.id !== 'string' || !OPTION_NAME_RE.test(entry.id)) {
            problems.push(`'probes[${i}].id' must be a slug matching ${OPTION_NAME_RE}`);
            entryOk = false;
          } else if (seenProbeIds.has(entry.id)) {
            problems.push(`'probes[${i}].id' duplicates another probe's id '${entry.id}' on this node`);
            entryOk = false;
          } else {
            seenProbeIds.add(entry.id);
          }
          if (!isNonEmptyString(entry.asks)) {
            problems.push(`'probes[${i}].asks' is required and must be a non-empty string`);
            entryOk = false;
          }
          if (!isNonEmptyString(entry.why)) {
            problems.push(`'probes[${i}].why' is required and must be a non-empty string`);
            entryOk = false;
          }
          if (!isNonEmptyString(entry.discharges)) {
            problems.push(`'probes[${i}].discharges' is required and must be a non-empty string`);
            entryOk = false;
          }
          if (!isNonEmptyString(entry.source)) {
            problems.push(`'probes[${i}].source' is required and must be a non-empty string`);
            entryOk = false;
          }
          if (typeof entry.raised !== 'string' || !isValidDate(entry.raised)) {
            problems.push(`'probes[${i}].raised' must be a YYYY-MM-DD date string`);
            entryOk = false;
          }
          if (!isAbsent(entry.fact) && !FACT_NAME_SET.has(entry.fact)) {
            problems.push(`'probes[${i}].fact' must be one of: ${FACT_NAMES.join(', ')}`);
            entryOk = false;
          }
          const hasStatus = !isAbsent(entry.status);
          const hasReason = !isAbsent(entry.reason);
          if (hasStatus && !PROBE_STATUS_SET.has(entry.status)) {
            problems.push(`'probes[${i}].status' must be 'discharged'`);
            entryOk = false;
          }
          if (hasStatus && !hasReason) {
            problems.push(`'probes[${i}].reason' is required when 'probes[${i}].status' is present`);
            entryOk = false;
          }
          if (!hasStatus && hasReason) {
            problems.push(`'probes[${i}].reason' is only allowed when 'probes[${i}].status' is present`);
            entryOk = false;
          }
          if (hasReason && !isNonEmptyString(entry.reason)) {
            problems.push(`'probes[${i}].reason' must be a non-empty string`);
            entryOk = false;
          }
          return entryOk
            ? {
              id: entry.id,
              asks: entry.asks,
              why: entry.why,
              discharges: entry.discharges,
              source: entry.source,
              raised: entry.raised,
              fact: isAbsent(entry.fact) ? null : entry.fact,
              status: isAbsent(entry.status) ? null : entry.status,
              reason: isAbsent(entry.reason) ? null : entry.reason,
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
  if (!hasFactsSection && factsShapeOk) {
    for (const fact of facts) {
      const owed = owedOptionSubsections(fact);
      if (owed.length === 0) continue;
      problems.push(
        `the ${fact.name} fact carries ${owed.map((n) => `'${n}'`).join(', ')}`
        + (fact.name === ANSWER_FACT ? ' beside the option that stands,' : ',')
        + " which requires a '## Facts' section stating each in prose",
      );
    }
  }
  for (const fact of facts) {
    const found = factsText[fact.name];
    if (found === undefined) continue;
    fact.prose = found.prose;
    fact.hasHeading = true;
    for (const option of fact.options) {
      if (found.options[option.name] !== undefined) option.prose = found.options[option.name];
    }
  }

  // Which encoding this node is written in, and -- in the content encoding
  // -- what each option's subsection holds. `nodeEncoding` reads the four
  // struck sections and `stands` off the node, so it is asked here, once the
  // body has been parsed and before anything is hashed.
  const encoding = nodeEncoding({
    answer: sections.Answer,
    rationale: sections.Rationale,
    disposition: sections.Disposition,
    fence: hasFenceSection ? {} : null,
    facts,
  });
  if (encoding === 'content') {
    parseContentOptions(facts, { id, graph, slug, path: relPath }, question, stage, problems);
  } else {
    // `stands` is the legacy encoding's, and a node with none of the four
    // struck sections is otherwise in the content encoding, so a `stands`
    // there is the one thing keeping it in an encoding it has left. It is
    // named as such rather than only reported as a `## Answer` that is
    // missing, which is what the legacy rule below sees.
    const struck = STRUCK_SECTIONS.every((name) => sections[name] === null);
    const standing = facts.find((f) => f.stands !== null) ?? null;
    if (struck && standing !== null) {
      problems.push(
        `fact '${standing.name}' carries 'stands', which the content encoding struck: this node carries none of `
        + `${STRUCK_SECTIONS.map((n) => `'## ${n}'`).join(', ')}, and there the confirmed option is read off the rulings`,
      );
    }
  }

  if (hasAnswer && form === null) {
    problems.push("'form' is required when the body has an '## Answer' section");
  }
  // `tier` and `order` ask for an '## Answer' section only in the legacy
  // encoding, where the answer is that section's text; in the content
  // encoding the answer is the resolved content of the confirmed or
  // recommended option, and a node may carry either key with no '## Answer'.
  if (tier !== null && !hasAnswer && encoding === 'legacy') {
    problems.push("'tier' requires an '## Answer' section");
  }
  if (order.length > 0 && !hasAnswer && encoding === 'legacy') {
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
  const carriesDialogue = !isAbsent(fm.review) || !isAbsent(fm.depends) || !isAbsent(fm.probes) || sections.Account !== null;
  if (carriesDialogue && stage === null) {
    problems.push(
      "'review', 'depends', 'probes', and '## Account' are parts of the dialogue and require stage",
    );
  }

  // What stands, what is recommended, and the fence between them. The
  // '## Answer' section holds the text of the option named by `stands`; a
  // fence holds the whole proposed node where the recommended option is not
  // that one.
  // `stands` and the '## Answer' section are legacy-encoding vocabulary: in
  // the content encoding no fact ever carries `stands` (the check above,
  // keyed on the struck sections, reports that directly), so these three
  // checks -- which read as a pair with '## Answer' -- apply only there.
  // `hasAnswer` alone already implies `encoding === 'legacy'` (a node with a
  // '## Answer' section cannot be content-encoded), so the guard changes
  // nothing for the two checks gated on `hasAnswer`; it matters for the
  // third, which is keyed on `!hasAnswer` and would otherwise also catch a
  // content-encoded node's `stands` -- already reported, with a better
  // message, above.
  if (encoding === 'legacy' && hasAnswer && answerFact === null && factsShapeOk) {
    problems.push("an '## Answer' section requires an answer fact, whose options are the candidate answers to this question");
  }
  if (encoding === 'legacy' && hasAnswer && answerFact !== null && answerFact.stands === null) {
    problems.push("an '## Answer' section requires the answer fact to name the option it stands on ('stands')");
  }
  if (encoding === 'legacy' && !hasAnswer && answerFact !== null && answerFact.stands !== null) {
    problems.push("'stands' names the option whose text '## Answer' holds, so it requires an '## Answer' section");
  }
  const recommends = answerFact === null ? null : answerFact.recommends;
  const stands = answerFact === null ? null : answerFact.stands;
  // The fence is the legacy encoding's: there, one section holds the whole
  // recommended node where the recommended option is not the standing one.
  // In the content encoding every option carries its own content and no
  // option's text has a privileged place, so a recommendation asks for no
  // section of its own -- which is what struck '## Recommendation'.
  const fenceExpected = encoding === 'legacy'
    && recommends !== null && (stands === null || stands !== recommends);
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

  // A node on the frontier carries the authority fact, because that is how a
  // ruling confers delegated or deferred: without it the only class a
  // confirmation can produce is ratified, and the author's third exit is
  // closed by an encoding accident rather than by a decision
  // (commons.systems/disposition-graph/dialogue,
  // `authority-fact-on-every-node`). A node whose facts did not parse is
  // told about its shape first and not about this.
  if (stage !== null && facts.length > 0 && factsShapeOk && !facts.some((f) => f.name === 'authority')) {
    problems.push("a staged node's facts must include authority");
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
    id,
    question,
    encoding,
    fmText,
    answer: sections.Answer,
    rationale: sections.Rationale,
    disposition: sections.Disposition,
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
    probes,
    review,
    encoding,
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
// the answer, in either encoding
// ---------------------------------------------------------------------------

/**
 * Strip whole top-level keys from a node file's raw frontmatter text, by
 * line: the named key and every line nested under it. Operates on the source
 * text rather than the parsed mapping so that what a node wrote -- its key
 * order, its quoting, its wrapping -- survives.
 *
 * @param {string} fmText
 * @param {string[]} keys
 * @returns {string}
 */
function stripFrontmatterKeys(fmText, keys) {
  const keyRe = new RegExp(`^(${keys.join('|')}):`);
  let skipping = false;
  return String(fmText)
    .split('\n')
    .filter((line) => {
      if (/^\S/.test(line)) {
        skipping = keyRe.test(line);
        return !skipping;
      }
      return !skipping;
    })
    .join('\n')
    .replace(/\n+$/, '');
}

/**
 * The node as its answer would have it stand, whole: frontmatter, its
 * `## Answer`, and, where it has one, its `## Rationale`.
 *
 * In the content encoding that is the resolved content of the confirmed
 * option -- the option carrying the most recent confirming ruling -- and,
 * where none is confirmed, of the option the answer fact recommends. In the
 * legacy encoding it is the `## Recommendation` fence's text where the
 * recommendation differs from what stands, and otherwise the standing node
 * as a fence would hold it: the frontmatter without the dialogue's own keys
 * (`FENCE_FORBIDDEN_KEYS`) and without the facts, then the two sections.
 *
 * Null where the node has no answer at all, which is the state of most of
 * this record: no confirmed and no recommended option in the content
 * encoding, and no `## Answer` in the legacy one.
 *
 * @param {object} node - a node as `parseNode`/`readGraph` returns it.
 * @returns {string|null}
 */
export function answerText(node) {
  if ((node?.encoding ?? nodeEncoding(node)) === 'content') {
    const fact = factByName(node, ANSWER_FACT);
    if (fact === null) return null;
    const name = confirmedOption(node, ANSWER_FACT) ?? fact.recommends;
    if (name === null || name === undefined) return null;
    const option = fact.options.find((o) => o.name === name) ?? null;
    if (option === null || option.content === null) return null;
    return resolveOptionContent(node, ANSWER_FACT, name);
  }

  if (node?.fence && typeof node.fence.raw === 'string') return node.fence.raw;
  if (node?.answer === null || node?.answer === undefined) return null;
  const fm = stripFrontmatterKeys(node.fmText ?? '', FENCE_FORBIDDEN_KEYS);
  const parts = [`---\n${fm}\n---`, `## Answer\n\n${node.answer}`];
  if (node.rationale !== null && node.rationale !== undefined) {
    parts.push(`## Rationale\n\n${node.rationale}`);
  }
  return `${parts.join('\n\n')}\n`;
}

// ---------------------------------------------------------------------------
// mechanical findings
//
// Soft, non-fatal signals a node's own shape can raise without a reading:
// never a parse error (a node carrying one still validates), printed by
// `validate.mjs` as `finding: <node id>: <text>` and exposed on the frontier
// by `project.mjs`. One implementation, called once per node from
// `readGraph` (or directly, on a hand-built node, for a unit test that a
// finding a real parse already forbids as fatal cannot otherwise exercise).
// ---------------------------------------------------------------------------

const COMMIT_HASH_RE = /^[0-9a-f]{40}$/i;

/* The author's words a '## Disposition' section holds, entry by entry: each
 * begins at the line naming the author and the date and runs to the next
 * such line, so a quotation stays with the sentence that introduces it.
 * Shared with `project.mjs` (the alignment page's per-option quotation) and
 * with `deriveMechanicalFindings` below (`authors-words-on-the-page`'s own
 * finding: an author-sourced option's `ref` naming no entry here), so there
 * is one implementation of what an "entry" is and not two that could drift
 * apart. */
export const AUTHOR_ENTRY_RE = /^\s*(?:\*\*)?the author\b[^\n]*?(\d{4}-\d{2}-\d{2})/i;

export function authorEntries(src) {
  const out = [];
  for (const block of String(src || '').split(/\n\s*\n/)) {
    if (block.trim() === '') continue;
    const m = AUTHOR_ENTRY_RE.exec(block);
    if (m || out.length === 0) out.push({ date: m ? m[1] : null, blocks: [block] });
    else out[out.length - 1].blocks.push(block);
  }
  return out;
}

/**
 * Every fence-aware level-3 (`### `) section of `text`: `{name, body}`, body
 * being everything between that heading and the next one at the same depth
 * (or the end of the text), not including the heading line itself. A
 * heading-looking line inside a fenced code block is not a heading, the same
 * guard `clean-context-review/brief.mjs`'s own account-section helpers use.
 */
function level3SectionBodies(text) {
  const lines = String(text).split('\n');
  const headingRe = /^(#{1,6})[ \t]+(.*?)\s*$/;
  const fenceRe = /^[ \t]*(`{3,}|~{3,})/;
  const headings = [];
  let fenceChar = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fence = line.match(fenceRe);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      continue;
    }
    if (fenceChar !== null) continue;
    const m = line.match(headingRe);
    if (m && m[1].length === 3) headings.push({ name: m[2], index: i });
  }
  return headings.map((h, idx) => {
    const end = idx + 1 < headings.length ? headings[idx + 1].index : lines.length;
    return { name: h.name, body: lines.slice(h.index + 1, end).join('\n') };
  });
}

/**
 * Every blockquote paragraph of `text` (consecutive `> ` lines, one
 * paragraph) that opens with `The author, <date>`, with the date captured.
 */
function authorBlockquotes(text) {
  const lines = String(text).split('\n');
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^>[ \t]?(.*)$/);
    if (m) {
      if (current === null) current = [];
      current.push(m[1]);
    } else if (current !== null) {
      blocks.push(current.join('\n'));
      current = null;
    }
  }
  if (current !== null) blocks.push(current.join('\n'));
  const out = [];
  for (const body of blocks) {
    const m = body.match(/^The author,\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\b/);
    if (m) out.push({ body, date: m[1] });
  }
  return out;
}

/**
 * The mechanical findings one node's own shape raises, each a string
 * (without the node id, which the caller prefixes): never a parse error, and
 * never turning a valid node invalid.
 *
 * 1. An option `status: passed` with no `reason` (`readFacts` already makes
 *    this fatal on the answer/reserved facts it governs; kept here too so a
 *    node built or amended outside that gate is still caught).
 * 2. An option whose `#### ` prose says "passed over" while its `status` is
 *    not `passed` -- the AI's own prose disagreeing with its own status.
 * 3. An option `source: author` whose `ref` is a graph commit hash rather
 *    than a date, or a date `## Disposition` carries no `The author, <ref>`
 *    entry for (`authors-words-on-the-page`).
 * 4. A `### answer` or `### authority` subsection that opens directly on a
 *    `#### ` heading, with no reason prose of its own.
 * 5. Two `### ` sections of `## Account` with byte-identical bodies.
 * 6. A `## Rationale` blockquote (or the fence's) opening `The author,
 *    <date>` whose quoted text `## Disposition` does not also carry.
 * 7. A `depends` entry naming `#<option>` on a node whose answer fact has no
 *    such option (`readGraph`'s own referential-integrity pass already makes
 *    this fatal; kept here for the same reason as (1)).
 *
 * @param {object} node - a node as `parseNode`/`readGraph` shapes it.
 * @param {Map<string, object>} [byId] - every node of the graph, keyed by
 *   id, needed only for (7); omitted, (7) is skipped rather than guessed.
 * @returns {string[]}
 */
export function deriveMechanicalFindings(node, byId = null) {
  const findings = [];

  // A node built by hand, rather than read from a file, carries no
  // `encoding` and is read as legacy, which is what it has always been.
  const encoding = node.encoding === 'content' ? 'content' : 'legacy';

  for (const fact of node.facts || []) {
    for (const option of fact.options || []) {
      if (option.status === 'passed' && !option.reason) {
        findings.push(`fact '${fact.name}' option '${option.name}' carries status: passed with no reason`);
      }
      // The option's own sentence, which in the content encoding is the
      // prose before the first marker and not the whole subsection: what
      // follows it there is the AI's support and divergence and the option's
      // content, where "passed over" may be quoted rather than claimed.
      const said = encoding === 'content' ? option.sentence : option.prose;
      if (said && /passed over/i.test(said) && option.status !== 'passed') {
        findings.push(`fact '${fact.name}' option '${option.name}' prose says "passed over", but the option carries no status: passed`);
      }
      if (option.source === 'author' && encoding === 'content') {
        // The content encoding's analogue of the '## Disposition' check
        // below: the author's words are in the ledger, and an option they
        // raised carries the address of the entry that raised it.
        if ((option.supports || []).length === 0 && (option.diverges || []).length === 0) {
          findings.push(`fact '${fact.name}' option '${option.name}' is source: author but carries neither 'supports' nor 'diverges', so no words of the author's reach it`);
        }
      } else if (option.source === 'author' && option.ref) {
        if (COMMIT_HASH_RE.test(option.ref)) {
          findings.push(`fact '${fact.name}' option '${option.name}' is source: author with ref ${option.ref}, a graph commit hash rather than the date '## Disposition' quotes the author under`);
        } else if (!authorEntries(node.disposition).some((e) => e.date === option.ref)) {
          findings.push(`fact '${fact.name}' option '${option.name}' is source: author, ref ${option.ref}, but '## Disposition' carries no 'The author, ${option.ref}' entry`);
        }
      }
    }
    if ((fact.name === 'answer' || fact.name === 'authority') && fact.hasHeading && (fact.prose || '').trim() === '') {
      findings.push(`'### ${fact.name}' opens directly on a '#### ' heading, with no reason prose of its own`);
    }
  }

  if (node.account) {
    const seen = new Map();
    for (const section of level3SectionBodies(node.account)) {
      const body = section.body.trim();
      if (body.length === 0) continue;
      const prior = seen.get(body);
      if (prior) {
        findings.push(`'## Account' sections '### ${prior}' and '### ${section.name}' have byte-identical bodies`);
      } else {
        seen.set(body, section.name);
      }
    }
  }

  const rationale = node.rationale
    ?? (node.fence && node.fence.sections ? node.fence.sections.Rationale : null);
  if (rationale) {
    const disposition = node.disposition || '';
    for (const quote of authorBlockquotes(rationale)) {
      if (!disposition.includes(quote.body)) {
        findings.push(`'## Rationale' quotes a blockquote beginning 'The author, ${quote.date}' that '## Disposition' does not also carry verbatim`);
      }
    }
  }

  if (byId) {
    for (const dep of node.depends || []) {
      if (!dep.option) continue;
      const target = byId.get(dep.id);
      if (!target) continue; // an unresolved 'depends' id is a separate, fatal check
      const answerFact = (target.facts || []).find((f) => f.name === 'answer');
      const names = answerFact ? answerFact.options.map((o) => o.name) : [];
      if (!names.includes(dep.option)) {
        findings.push(`'depends' names '${dep.id}#${dep.option}', but ${dep.id}'s answer fact has no option '${dep.option}'`);
      }
    }
  }

  return findings;
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

  // The ledger of the author's words: one entry per quotation, kept once
  // under `<rootDir>/words/` and referenced from the options it supports or
  // diverges from (commons.systems/disposition-graph/quotes). A graph whose
  // options reference no entry needs no ledger; one whose options do
  // reference entries needs every reference to resolve.
  // A ledger that does not parse leaves no entries at all, so every
  // reference in the graph would fail to resolve and the one message that
  // says why would be buried under hundreds that do not. The ledger's own
  // failure is reported alone and the per-reference check is skipped, since
  // a reference cannot be judged against a ledger that was never read.
  let words = new Map();
  let ledgerFailed = false;
  const ledgerDir = path.join(rootDir, 'words');
  const hasLedger = await pathIsDirectory(ledgerDir);
  if (hasLedger) {
    try {
      words = await readWords(rootDir);
    } catch (err) {
      ledgerFailed = true;
      problems.push(
        `words/: ${err.message}; the ledger did not parse, so no reference in `
        + 'this graph could be checked against it',
      );
    }
  }
  const referenced = new Set();
  for (const node of parsed) {
    for (const fact of node.facts) {
      for (const option of fact.options) {
        for (const key of OPTION_WORDS_KEYS) {
          for (const ref of option[key]) {
            referenced.add(ref);
            if (ledgerFailed) continue;
            if (!hasLedger) {
              problems.push(
                `${node.path}: fact '${fact.name}' option '${option.name}' ${key} names ${ref}, `
                + "but this graph has no 'words/' ledger",
              );
              continue;
            }
            try {
              resolveReference(words, ref);
            } catch (err) {
              problems.push(`${node.path}: fact '${fact.name}' option '${option.name}' ${key}: ${err.message}`);
            }
          }
        }
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
        findings: deriveMechanicalFindings(node, nodesById),
      };
    })
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // An entry no option anywhere references is a finding and not a problem:
  // the ledger is append-only and an entry waits in it, addressable, until a
  // sitting attaches it to an option (commons.systems/disposition-graph/quotes,
  // the retention rule). Reported on the graph rather than on a node, since
  // it is on no node that the entry is missing.
  const findings = unreferencedEntries(words, referenced)
    .map((entry) => `the ledger entry ${entry.address} is referenced by no option`);

  return {
    module: manifest.module,
    ref: isAbsent(manifest.ref) ? null : manifest.ref,
    graphs: manifest.graphs,
    nodes,
    words,
    findings,
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
