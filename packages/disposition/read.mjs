#!/usr/bin/env node
// packages/disposition/read.mjs
//
// Parses and validates one disposition graph (a `disposition.yaml` manifest
// plus one markdown file per node) into a plain object tree.
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
  deriveDescendants,
  deriveDraftHash,
  deriveRank,
  deriveStatus,
} from './derive.mjs';

const FRONTMATTER_KEYS = new Set([
  'question', 'form', 'authority', 'under', 'tier', 'boost', 'cites',
  'instrument', 'after', 'source', 'relation', 'defines', 'shims', 'stage',
  'order', 'recommendation', 'review',
]);
const FORMS = new Set(['target', 'rule', 'assumption', 'arche', 'reading']);
const AUTHORITY_CLASSES = new Set(['ratified', 'delegated', 'deferred']);
const RELATIONS = new Set(['adopted', 'diverged', 'chosen-over']);
const INSTRUMENT_KINDS = new Set(['check', 'assessment']);
const STAGES = new Set(['periagogic', 'maieutic', 'ruling', 'review']);
const RECOMMENDATION_CLASSES = new Set(['ratified', 'delegated']);
const BOLDNESS_VALUES = new Set(['low', 'moderate', 'high']);
const REVIEW_VERDICTS = new Set(['forward', 'kickback']);
const REVIEW_STRENGTHS = new Set(['strong', 'moderate', 'weak', 'none']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HASH_RE = /^[0-9a-f]{40}$/;
const SHIM_KEYS = new Set(['artifact', 'liquidation', 'declared', 'for']);
const SECTION_ORDER = ['Disposition', 'Answer', 'Rationale', 'Draft', 'Proposal'];

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbsent(value) {
  return value === undefined || value === null;
}

function isValidDate(s) {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Split a body into its `## Disposition` / `## Answer` / `## Rationale` /
 * `## Draft` / `## Proposal` sections. `###`+ headings are content, not
 * section boundaries. Pushes one message per problem (without file-path
 * prefix) onto `problems`.
 *
 * @param {string} bodyText
 * @param {string[]} problems
 * @returns {{Disposition: string|null, Answer: string|null, Rationale: string|null, Draft: string|null, Proposal: string|null}}
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

  const sections = { Disposition: null, Answer: null, Rationale: null, Draft: null, Proposal: null };
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

/**
 * Extract the exact content of a `## Draft` section's one fenced markdown
 * block: a line that, trimmed, is exactly `` ```markdown `` opens it, a
 * line that trimmed is exactly `` ``` `` closes it, and nothing but blank
 * lines may sit outside the fence. Pushes the one shape-error message and
 * returns null on anything else -- more than one fence, text beside it,
 * or no fence at all.
 *
 * @param {string} sectionText - `sections.Draft`, already trimmed by `parseBody`.
 * @param {string[]} problems
 * @returns {string|null} the fence's inner lines, joined by '\n'.
 */
function extractDraftFence(sectionText, problems) {
  const fail1 = () => {
    problems.push("'## Draft' must hold exactly one fenced markdown block");
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
 * `## Draft` fence's nested one (`parseDraftFence`). Throws immediately
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
 * Parse a `## Draft` fence's content only structurally, per dialogue.md's
 * Answer: "A draft may be invalid under the doctrine of the day, as when
 * it presumes a ruling not yet given; the validator parses it and checks
 * only that it answers the same question." The fence must parse as a node
 * at all -- a frontmatter block that recovers as a YAML mapping
 * (`parseFrontmatter`), and a body whose sections are the reader's known
 * sections in the reader's order (`parseBody`), the same two structural
 * parses a top-level node file gets -- and its `question` must equal the
 * one it drafts (one combined check: absent, wrong-typed, and merely
 * different all fail it the same way, with the same message). No other
 * field rule, shape rule, vocabulary, or section-requirement rule applies:
 * a draft may carry a form outside today's vocabulary, an authority whose
 * date is still a placeholder, a tier or any other field with a value the
 * vocabulary of the day does not name, or an unknown frontmatter key
 * entirely -- none of it is checked here, and each field is returned as
 * written, not normalized.
 *
 * @param {string} fenceText
 * @param {string} question - the enclosing node's own (already-validated) question.
 * @param {{id: string, graph: string, slug: string, path: string}} ctx - the
 *   enclosing node's own location, for attributing a nested parse error.
 * @param {string[]} problems
 * @returns {{raw: string, question: string|null, frontmatter: object, sections: object}|null}
 */
function parseDraftFence(fenceText, question, ctx, problems) {
  const draftPath = `${ctx.path} (## Draft)`;
  let fm;
  let bodyText;
  try {
    ({ fm, bodyText } = parseFrontmatter(fenceText, draftPath));
  } catch (err) {
    problems.push(`'## Draft' does not parse as a node: ${err.message}`);
    return null;
  }
  const bodyProblems = [];
  const sections = parseBody(bodyText, bodyProblems);
  if (bodyProblems.length > 0) {
    problems.push(`'## Draft' does not parse as a node: ${fail(draftPath, bodyProblems).message}`);
    return null;
  }
  if (fm.question !== question) {
    problems.push("'## Draft' answers a different question");
  }
  const get = (key, absentValue) => (isAbsent(fm[key]) ? absentValue : fm[key]);
  return {
    raw: fenceText,
    question: get('question', null),
    frontmatter: {
      form: get('form', null),
      authority: get('authority', null),
      under: get('under', []),
      tier: get('tier', null),
      boost: get('boost', null),
      cites: get('cites', []),
      instrument: get('instrument', null),
      after: get('after', []),
      source: get('source', null),
      relation: get('relation', null),
      defines: get('defines', null),
      shims: get('shims', []),
      stage: get('stage', null),
      order: get('order', []),
      recommendation: get('recommendation', null),
      review: get('review', null),
    },
    sections: {
      Disposition: sections.Disposition,
      Answer: sections.Answer,
      Rationale: sections.Rationale,
      Proposal: sections.Proposal,
    },
  };
}

/**
 * Parse and validate a single node file's text (frontmatter + body).
 * Does not resolve `under`/`after`/`cites[].id` against a manifest or
 * against sibling nodes, and does not compute `children`/`rank`/`ceiling`/
 * `status`/`hash` -- those need the whole graph and the raw file bytes, and
 * are added by `readGraph`.
 *
 * @param {string} text - the file's decoded text.
 * @param {{id: string, graph: string, slug: string, path: string}} loc
 * @returns {object} a partial node (all deliverable-1 fields except
 *   `children`, `rank`, `ceiling`, `status`, `hash`), plus the dialogue
 *   fields this unit adds: `recommendation`, `review`, `reviewStale`,
 *   `draft`, `draftHash`.
 * @throws {Error} listing every problem found in this file, one per line,
 *   each prefixed with `loc.path`.
 */
export function parseNode(text, { id, graph, slug, path: relPath }) {
  const problems = [];
  const { fm, fmText, bodyText } = parseFrontmatter(text, relPath);

  for (const key of Object.keys(fm)) {
    if (!FRONTMATTER_KEYS.has(key)) {
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
    if (typeof fm.form !== 'string' || !FORMS.has(fm.form)) {
      problems.push(`'form' must be one of: ${[...FORMS].join(', ')}`);
    } else {
      form = fm.form;
    }
  }

  // authority
  let authority = null;
  if (!isAbsent(fm.authority)) {
    if (!isPlainObject(fm.authority)) {
      problems.push("'authority' must be a mapping with class, by, date");
    } else {
      const a = fm.authority;
      for (const k of Object.keys(a)) {
        if (!['class', 'by', 'date'].includes(k)) problems.push(`unknown key 'authority.${k}'`);
      }
      let ok = true;
      if (typeof a.class !== 'string' || !AUTHORITY_CLASSES.has(a.class)) {
        problems.push(`'authority.class' must be one of: ${[...AUTHORITY_CLASSES].join(', ')}`);
        ok = false;
      }
      if (typeof a.by !== 'string' || a.by.trim().length === 0) {
        problems.push("'authority.by' is required and must be a non-empty string");
        ok = false;
      }
      if (typeof a.date !== 'string' || !isValidDate(a.date)) {
        problems.push("'authority.date' must be a YYYY-MM-DD date string");
        ok = false;
      }
      if (ok) authority = { class: a.class, by: a.by, date: a.date };
    }
  }

  // under / after
  const under = readIdList(fm, 'under', problems);
  const after = readIdList(fm, 'after', problems);

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
    if (typeof fm.stage !== 'string' || !STAGES.has(fm.stage)) {
      problems.push(`'stage' must be one of: ${[...STAGES].join(', ')}`);
    } else {
      stage = fm.stage;
    }
  }

  // recommendation: the facts a recommendation must state, required from the
  // review stage on (checked below, once stage is known). One combined
  // message for any shape problem -- missing field, bad value, or an extra
  // key -- there is no per-field message for this one, unlike authority.
  let recommendation = null;
  if (!isAbsent(fm.recommendation)) {
    const r = fm.recommendation;
    const ok = isPlainObject(r)
      && Object.keys(r).length === 2
      && RECOMMENDATION_CLASSES.has(r.class)
      && BOLDNESS_VALUES.has(r.boldness);
    if (!ok) {
      problems.push("'recommendation' must be {class: ratified|delegated, boldness: low|moderate|high}");
    } else {
      recommendation = { class: r.class, boldness: r.boldness };
    }
  }

  // review: the state of the clean-context review of the draft. Same
  // single-message-on-any-shape-problem style as recommendation above.
  // Exactly four keys; an unknown key (the former `siblings`, the other
  // drafts a per-node reviewer was given -- gone now that every review is a
  // batch over the whole frontier and needs no such field) fails this check
  // like any other malformed shape.
  let review = null;
  if (!isAbsent(fm.review)) {
    const r = fm.review;
    const ok = isPlainObject(r)
      && Object.keys(r).length === 4
      && REVIEW_VERDICTS.has(r.verdict)
      && REVIEW_STRENGTHS.has(r.strength)
      && typeof r.date === 'string' && isValidDate(r.date)
      && typeof r.of === 'string' && HASH_RE.test(r.of);
    if (!ok) {
      problems.push("'review' must be {verdict: forward|kickback, strength: strong|moderate|weak|none, date: YYYY-MM-DD, of: <sha1>}");
    } else {
      review = { verdict: r.verdict, strength: r.strength, date: r.date, of: r.of };
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
      if (typeof inst.kind !== 'string' || !INSTRUMENT_KINDS.has(inst.kind)) {
        problems.push(`'instrument.kind' must be one of: ${[...INSTRUMENT_KINDS].join(', ')}`);
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

  // source / relation: required together under form:reading, forbidden otherwise
  let source = null;
  let relation = null;
  const hasSource = !isAbsent(fm.source);
  const hasRelation = !isAbsent(fm.relation);
  if (form === 'reading') {
    if (!hasSource || typeof fm.source !== 'string' || fm.source.trim().length === 0) {
      problems.push("'source' is required and must be a non-empty string when form: reading");
    } else {
      source = fm.source;
    }
    if (!hasRelation || typeof fm.relation !== 'string' || !RELATIONS.has(fm.relation)) {
      problems.push(`'relation' is required and must be one of: ${[...RELATIONS].join(', ')} when form: reading`);
    } else {
      relation = fm.relation;
    }
  } else {
    if (hasSource) problems.push("'source' is only allowed when form: reading");
    if (hasRelation) problems.push("'relation' is only allowed when form: reading");
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
            if (!SHIM_KEYS.has(k)) problems.push(`unknown key 'shims[${i}].${k}'`);
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
  // below, once hasAnswer is known, alongside authority/tier.
  const order = readOrder(fm.order, problems);

  // body
  const sections = parseBody(bodyText, problems);
  const hasAnswer = sections.Answer !== null;
  const hasDisposition = sections.Disposition !== null;
  const hasDraftSection = sections.Draft !== null;

  if (hasAnswer && form === null) {
    problems.push("'form' is required when the body has an '## Answer' section");
  }
  if (authority !== null && !hasAnswer) {
    problems.push("'authority' requires an '## Answer' section");
  }
  if (tier !== null && !hasAnswer) {
    problems.push("'tier' requires an '## Answer' section");
  }
  if (order.length > 0 && !hasAnswer) {
    problems.push("'order' requires an '## Answer' section");
  }
  if (stage !== null && !hasDisposition && !hasAnswer && sections.Proposal === null) {
    problems.push("stage requires a '## Disposition', '## Proposal', or '## Answer' section");
  }
  if (hasDisposition && stage === null) {
    problems.push("'## Disposition' requires 'stage'");
  }
  if ((recommendation !== null || review !== null || hasDraftSection) && stage === null) {
    problems.push("'recommendation', 'review', and '## Draft' are parts of the dialogue and require stage");
  }

  // status: answered when the stamp is ratified or delegated, unanswered
  // otherwise (a deferred stamp, no stamp, or -- below -- no answer at
  // all). Every unanswered node carries the dialogue and so must carry a
  // stage; the validator refuses one that does not.
  const status = deriveStatus({ authority });
  if (status === 'unanswered' && stage === null) {
    problems.push(`${id} is unanswered and must carry stage`);
  }
  if ((stage === 'review' || stage === 'ruling') && recommendation === null) {
    problems.push("stage review or ruling requires 'recommendation'");
  }
  if (stage === 'ruling' && (review === null || review.verdict !== 'forward')) {
    problems.push("stage ruling requires a 'review' with verdict forward");
  }

  // '## Draft': one fenced ```markdown block, parsed only structurally by
  // parseDraftFence (frontmatter and sections; no field rule beyond
  // parsing except that it answers the same question) and exposed reduced
  // to {raw, question, frontmatter, sections}. `draftFenceText` (the
  // fence's exact content, or null with no '## Draft') feeds the draft
  // hash below regardless of whether the draft is otherwise valid -- that
  // value is only ever read once this function has returned without
  // throwing.
  let draft = null;
  let draftFenceText = null;
  if (hasDraftSection) {
    draftFenceText = extractDraftFence(sections.Draft, problems);
    if (draftFenceText !== null) {
      draft = parseDraftFence(draftFenceText, question, { id, graph, slug, path: relPath }, problems);
    }
  }

  const draftHash = deriveDraftHash({
    fmText,
    draftFence: draftFenceText,
    answer: sections.Answer,
    rationale: sections.Rationale,
  });
  const reviewStale = review !== null && review.of !== draftHash;

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
    authority,
    under,
    tier,
    boost,
    cites,
    instrument,
    after,
    source,
    relation,
    defines,
    shims,
    stage,
    order,
    recommendation,
    review,
    reviewStale,
    draft,
    draftHash,
    answer: sections.Answer,
    rationale: sections.Rationale,
    proposal: sections.Proposal,
    disposition: sections.Disposition,
  };
}

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

  // canonicalize reference fields to local form now that we have the manifest
  for (const node of parsed) {
    node.under = node.under.map((refId) => canonicalizeId(refId, manifest));
    node.after = node.after.map((refId) => canonicalizeId(refId, manifest));
    node.cites = node.cites.map((c) => ({ ...c, id: canonicalizeId(c.id, manifest) }));
    node.order = node.order.map((step) => step.map((refId) => canonicalizeId(refId, manifest)));
  }

  // referential integrity: every 'under' entry must resolve within this
  // graph and must not repeat the same parent twice (a repeated id would
  // double that parent's rank contribution and duplicate the child in
  // `children`); a resolved 'under' parent must itself carry an
  // '## Answer' -- an un-aligned disposition has no children; every
  // 'after' entry must also resolve within this graph.
  const nodesById = new Map(parsed.map((n) => [n.id, n]));
  const idSet = new Set(nodesById.keys());
  for (const node of parsed) {
    const seenUnder = new Set();
    for (const u of node.under) {
      if (!idSet.has(u)) {
        problems.push(`${node.path}: unresolved 'under' reference: ${u}`);
      } else if (nodesById.get(u).answer === null) {
        problems.push(`${node.path}: 'under' names ${u}, which has no '## Answer'; an un-aligned disposition has no children`);
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

  const nodes = parsed
    .map((node) => ({
      ...node,
      children: childrenMap.get(node.id) ?? [],
      rank: rankMap.get(node.id) ?? 0,
      ceiling: deriveCeiling(node.id, nodesById),
      status: deriveStatus(node),
    }))
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
