#!/usr/bin/env node
// packages/clean-context-review/apply.mjs
//
// Applies what one clean-context reading found (the apply step of both
// skills, /align-review and /align-survey, and the
// disposition-graph nodes clean-context-review/frontier-consistency/
// recording/dialogue/viable-options/alignment-order) to node files: appends
// the reading's account to '## Account', records a proposed merge or split as
// an option on the answer fact of the node it would change, and writes the
// dialogue frontmatter (`stage`, `review`, `depends`) the verdict and the
// findings imply. The reviewer only recommends; this script is the mechanical
// half of "the session decides and answers for the record" -- replies and
// overrides are supplied by the caller, never invented here.
//
// Usage:
//   node apply.mjs <json file> --replies <file> \
//     [--overrides <file>] [--pins <file>] [--date YYYY-MM-DD] [--dry]
//
// The reading is read from the input's own `scope`, and nothing else:
//
//   {scope: "draft", id, date, verdict, kickback_stage, findings[],
//    probes: [{asks, why, discharges, fact}], facts_check, viability,
//    counter_argument, strength}
// the review of one draft. One node, at the review stage: '### Clean-context
// review, <date>' on its account, `stage: ruling` on a forward or the named
// stage on a kickback, and the four draft keys of `review` pinned to
// `deriveRecommendationHash` of the node as edited. A survey pin the node
// already carries is preserved: the `review:` block is merged, never replaced
// wholesale. `probes` beats the verdict on the stage: a node that will carry
// any open probe after this apply -- one this reading raises, or one the
// node already carried -- never lands at 'ruling', not even under an
// override that says so, and a node already at 'periagogic' stays there
// (author-questions). Each probe is written into `probes:` with an `id` this
// script derives and makes unique on the node, `source: review`, and
// `raised` at this apply's date.
//
//   {scope: "survey", commit, date, nodes: [{id, findings, ...}],
//    frontier: [finding],
//    probes: [{node, asks, why, discharges, fact}],
//    subtree_divergences: [divergence]}
// the survey of the frontier. Serialized by its pin and by no lock: the
// sidecar `survey.pins.json`, written beside the brief by brief.mjs, holds
// the graph commit the survey read, the ids it judged, and the recommendation
// hash of every node of the graph. A judged node whose recommendation still
// matches its pin receives `review.survey` and its findings; one that has
// moved receives nothing and is reported. A `frontier` finding is discarded
// per support and not per finding (`survey-selection`, "a finding one of
// whose supports moved is re-derived"): the ids that moved are dropped, the
// finding is applied to the ids that did not, and the run reports what was
// dropped and why, which the subsection written on each surviving node also
// names. A finding whose every id moved is discarded whole, and so is a
// `merge` or `decomposition` finding one of whose ids moved, since the object
// of a proposed merge or split is the set of nodes it spans and half of one
// is not a proposal. A `probes` entry naming a node that has moved is
// discarded, having one node and no part to keep. `probes` is top-level and
// not nested in `nodes`, since a probe reaches any node in the graph, judged
// or not, the same as a `frontier` finding; the same stage rule as the draft
// applies node by node.
//   { kind, nodes: [id], finding, proposal, stages: {id: stage},
//     options: [{node, name, text}] }
// A `subtree_divergences` entry names an ancestor whose pending answer
// options two unruled subtrees stand under (`alignment-order`), and is
// written on the leaves and never on the ancestor:
//   { ancestor: id, sides: { optionName: [id, ...] }, finding }
// each leaf named under a side gains `<ancestor>#<optionName>` in its
// `depends`.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

import { readGraph, parseNode, FACT_NAMES, REVIEW_SURVEY_KEYS } from "@commons.systems/disposition/read.mjs";
import { graphCommit, SECTION_HASH_KEYS, movedSections, sectionHashes } from "./brief.mjs";

const STAGE_ORDER = ["periagogic", "maieutic", "review", "ruling"];
// the two stages a reading may send a node back to: the ground, or the draft
// (frontier-consistency: "the periagogic stage when the ground or the
// author's words are in question, the maieutic when the answer must be
// redrafted").
const KICKBACK_STAGES = ["periagogic", "maieutic"];
const SCOPES = new Set(["draft", "delta", "survey"]);
const FRONTIER_KINDS = new Set([
  "contradiction", "supersession", "redundancy", "decomposition",
  "vocabulary", "cross-reference", "placement", "coverage",
  // added 2026-09-03 with the fifteenth validation and the staleness a pin
  // makes visible (frontier-consistency); under the encoding of 2026-09-04
  // that staleness is `reviewStale`, a review whose `of` no longer matches
  // what the node recommends.
  "merge", "stale-recommendation",
]);
// The kinds a partial apply cannot keep. Every other kind records itself on
// each node it names, one subsection per node, so dropping the nodes that
// moved leaves the finding standing on the rest (`survey-selection`: "a
// finding one of whose supports moved is re-derived", per support and not
// per finding). These two propose one edit spanning the nodes they name --
// `merge`, that two nodes become one, and `decomposition`, the split that
// divides one node's material across others -- so their object is the set
// itself, and a merge applied to one side of a pair proposes nothing. One
// moved id discards them whole.
const WHOLE_OR_NOTHING_KINDS = new Set(["merge", "decomposition"]);
// the reader's own rule for an option's name (read.mjs OPTION_NAME_RE),
// checked here so a bad name is refused before any file is touched rather
// than caught by the post-write parse.
const OPTION_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
// the sections a node file may carry, in order (read.mjs SECTION_ORDER): an
// inserted '## Facts' goes before the first of the sections that follow it.
const SECTIONS_AFTER_FACTS = ["Recommendation", "Account"];
// the sidecar brief.mjs writes beside the survey's brief, and the file this
// script compares every hash against -- never a hash the reviewer copied.
const PINS_BASENAME = "survey.pins.json";
// the second sidecar brief.mjs writes beside the survey's brief: the
// selection the survey took, including the pairs it actually read (the live
// pairs and the drift probe). What a survey leaves on a node includes "the
// pairs read that touch that node, each with the key it was drawn on"
// (survey-selection), and the next survey's cut is taken over exactly those,
// so a pair that was frozen and not probed is never recorded as read. The
// file is optional: a survey applied without it records no pairs and says so.
const SELECTION_BASENAME = "survey.selection.json";
// The default condition on which a register entry is discharged, where the
// reading states none. `tolerated-inconsistency` is read under
// survey-selection for the register and for this condition: an entry is
// carried openly with the condition that retires it written beside it.
const DEFAULT_DISCHARGE = "the option this finding proposes is ruled, or a later survey re-derives it over moved support and does not find it";

const USAGE = "usage: node apply.mjs <json file> --replies <file> [--overrides <file>] [--pins <file>] [--selection <file>] [--date YYYY-MM-DD] [--dry]";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function parseArgs(argv) {
  const files = [];
  const opts = { repliesFile: null, overridesFile: null, pinsFile: null, selectionFile: null, date: null, dry: false };
  const valueFlags = { "--replies": "repliesFile", "--overrides": "overridesFile", "--pins": "pinsFile", "--selection": "selectionFile", "--date": "date" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a in valueFlags) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      opts[valueFlags[a]] = v;
    } else if (a === "--dry") {
      opts.dry = true;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag ${a}`);
    } else {
      files.push(a);
    }
  }
  if (files.length !== 1) {
    throw new Error(`${USAGE}\none reading, one file: ${files.length === 0 ? "no input file was given" : `${files.length} were given`}`);
  }
  return { file: files[0], ...opts };
}

async function loadJsonMap(file) {
  if (!file) return {};
  return JSON.parse(await readFile(path.resolve(file), "utf8"));
}

/**
 * Resolve a node id to its file, using only the manifest (module + declared
 * graphs), never the full readGraph: the live graph does not always
 * validate (see the module notice below), and id-to-path resolution must
 * work regardless.
 */
async function loadManifest(rootDir) {
  const text = await readFile(path.join(rootDir, "disposition.yaml"), "utf8");
  const manifest = YAML.parse(text);
  if (!manifest || typeof manifest !== "object" || typeof manifest.module !== "string" || !manifest.graphs) {
    throw new Error(`${path.join(rootDir, "disposition.yaml")}: not a valid manifest`);
  }
  return manifest;
}

function resolveIdToFile(manifest, rootDir, id) {
  for (const graphName of Object.keys(manifest.graphs || {})) {
    const prefix = `${manifest.module}/${graphName}/`;
    if (id.startsWith(prefix)) {
      const slug = id.slice(prefix.length);
      return { graph: graphName, slug, file: path.join(rootDir, graphName, `${slug}.md`) };
    }
  }
  throw new Error(`cannot resolve id '${id}' against ${manifest.module}'s declared graphs`);
}

/** The names already on a node's answer fact, or an empty set where it has none. */
function listedOptionNames(node) {
  return new Set(((node.answerFact && node.answerFact.options) || []).map((o) => o.name));
}

// ------------------------------------------------------------ file surgery
//
// Every edit here is made on the raw text -- the frontmatter's own lines, the
// body's own `## ` blocks -- rather than by YAML.parse + re-serialize, so
// every line this run does not mean to change (key order, quoting style, the
// '## Recommendation' fence) survives byte for byte. The fence is why the
// block splitting below is fence-aware: a recommended node's own `## Answer`
// heading lives inside a ```markdown block and is not a section of this file.

function splitRaw(rawText) {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  if (lines[0].trim() !== "---") throw new Error("file must begin with a '---' frontmatter delimiter");
  let fmEnd = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      fmEnd = i;
      break;
    }
  }
  if (fmEnd === -1) throw new Error("frontmatter is never closed");
  return { fmLines: lines.slice(1, fmEnd), bodyLines: lines.slice(fmEnd + 1) };
}

function joinRaw(fmLines, bodyLines) {
  return ["---", ...fmLines, "---", ...bodyLines].join("\n");
}

/**
 * The heading boundaries of `lines[from..to)` at depths 2 to 4, skipping
 * fenced regions with the same toggling rule read.mjs's `parseBody` uses.
 *
 * @returns {Array<{depth: number, name: string, index: number}>}
 */
function headingBoundaries(lines, from = 0, to = lines.length) {
  const headingRe = /^(#{1,6})[ \t]+(.*?)\s*$/;
  const fenceRe = /^[ \t]*(`{3,}|~{3,})/;
  const out = [];
  let fenceChar = null;
  for (let i = from; i < to; i += 1) {
    const line = lines[i];
    const fence = line.match(fenceRe);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      continue;
    }
    if (fenceChar !== null) continue;
    const m = line.match(headingRe);
    if (m && m[1].length >= 2 && m[1].length <= 4) out.push({ depth: m[1].length, name: m[2], index: i });
  }
  return out;
}

/**
 * The body's `## ` blocks, in order, each with the index of its heading line
 * and the index one past its last line.
 *
 * @returns {Array<{name: string, start: number, end: number}>}
 */
function splitBodyBlocks(bodyLines) {
  const boundaries = headingBoundaries(bodyLines).filter((b) => b.depth === 2);
  return boundaries.map((b, i) => ({
    name: b.name,
    start: b.index,
    end: i + 1 < boundaries.length ? boundaries[i + 1].index : bodyLines.length,
  }));
}

/** Drop the trailing blank lines of `lines[start..end)`, returning the new end. */
function trimBlockEnd(lines, start, end) {
  let e = end;
  while (e > start && lines[e - 1].trim() === "") e -= 1;
  return e;
}

/**
 * Append one subsection to '## Account', creating the section when it is
 * absent -- at the end of the body, which is where it belongs: '## Account'
 * is the last section a node file may carry.
 */
function appendToAccount(text, subsection) {
  const { fmLines, bodyLines } = splitRaw(text);
  const blocks = splitBodyBlocks(bodyLines);
  const account = blocks.find((b) => b.name === "Account");
  const lines = [...bodyLines];
  if (account) {
    const end = trimBlockEnd(lines, account.start, account.end);
    lines.splice(end, account.end - end, "", subsection, "");
  } else {
    const end = trimBlockEnd(lines, 0, lines.length);
    lines.splice(end, lines.length - end, "", "## Account", "", subsection, "");
  }
  return joinRaw(fmLines, lines);
}

/**
 * Append `#### <name>` subsections under `### answer` in '## Facts' -- what
 * an option proposed by a finding says in prose: what it would answer and
 * why it is on the table. Every answer option but the one that stands owes
 * one (read.mjs `checkOptionHeadings`), and the headings must read in the
 * options' own order, which is why these go last, as the frontmatter entries
 * do.
 *
 * `### answer` is created at the top of '## Facts' when the section exists
 * without it (the answer fact is first among the facts), and '## Facts'
 * itself is created in SECTION_ORDER position -- before
 * '## Recommendation'/'## Account' if either is there, at the end of the
 * body otherwise.
 */
function appendAnswerOptionSubsections(text, entries) {
  if (entries.length === 0) return text;
  const { fmLines, bodyLines } = splitRaw(text);
  const blocks = splitBodyBlocks(bodyLines);
  const lines = [...bodyLines];
  const rendered = [];
  for (const e of entries) rendered.push("", `#### ${e.name}`, "", e.text.trim());

  const facts = blocks.find((b) => b.name === "Facts");
  if (!facts) {
    const following = blocks.find((b) => SECTIONS_AFTER_FACTS.includes(b.name));
    if (following) {
      lines.splice(following.start, 0, "## Facts", "", "### answer", ...rendered, "");
    } else {
      const end = trimBlockEnd(lines, 0, lines.length);
      lines.splice(end, lines.length - end, "", "## Facts", "", "### answer", ...rendered, "");
    }
    return joinRaw(fmLines, lines);
  }

  const subs = headingBoundaries(lines, facts.start + 1, facts.end).filter((b) => b.depth === 3);
  const answer = subs.find((b) => b.name === "answer");
  if (!answer) {
    const insertAt = facts.start + 1;
    const tail = lines[insertAt] !== undefined && lines[insertAt].trim() !== "" ? [""] : [];
    lines.splice(insertAt, 0, "", "### answer", ...rendered, ...tail);
    return joinRaw(fmLines, lines);
  }

  const nextSub = subs.find((b) => b.index > answer.index);
  const sectionEnd = nextSub ? nextSub.index : facts.end;
  const end = trimBlockEnd(lines, answer.index, sectionEnd);
  lines.splice(end, sectionEnd - end, ...rendered, "");
  return joinRaw(fmLines, lines);
}

// ------------------------------------------------------------- frontmatter
function findFrontmatterBlock(fmLines, key) {
  const start = fmLines.findIndex((l) => new RegExp(`^${key}:`).test(l));
  if (start === -1) return null;
  const end = indentedBlockEnd(fmLines, start + 1, fmLines.length, 0);
  return [start, end];
}

function indentOf(line) {
  return (line.match(/^[ \t]*/) || [""])[0];
}

/**
 * The end of a run of lines indented past `minIndentLen`, starting at
 * `start` and bounded by `limit`. YAML allows a blank line inside a block
 * scalar or list (`disposition/disposition-graph/quotes.md` has one in its
 * `options:` list), so a blank line does not end the block by itself: it is
 * skipped over when the next non-blank line before `limit` is still
 * indented past `minIndentLen`, and only ends the block when no such line
 * follows (the block is over, or what follows is a trailing blank run at
 * `limit`).
 */
function indentedBlockEnd(lines, start, limit, minIndentLen) {
  let end = start;
  while (end < limit) {
    if (lines[end].trim() === "") {
      let next = end + 1;
      while (next < limit && lines[next].trim() === "") next += 1;
      if (next < limit && indentOf(lines[next]).length > minIndentLen) {
        end = next;
        continue;
      }
      break;
    }
    if (indentOf(lines[end]).length <= minIndentLen) break;
    end += 1;
  }
  return end;
}

// an all-digit sha1 would parse as a YAML integer and fail the reader's
// `of: <sha1>` check, so it is quoted; every other hash is left bare, as
// the record already writes it.
function hashScalar(of) {
  return /^\d+$/.test(of) ? `"${of}"` : of;
}

/**
 * The `review:` block, in the two readings the review divides into: the four
 * draft keys plus the draft's own optional `commit` (the graph commit this
 * reading read, beside its `of`) and `against` (this reading's strongest
 * counter-argument, beside its `strength`), the survey's own `date` and
 * `of`, or either alone -- read.mjs accepts each half without the other.
 * Whichever half this run does not write is carried in from the node as it
 * stands, so a draft's forward never discards the survey's pin and the
 * survey never discards a verdict (or the commit and counter-argument
 * beside it).
 */
function renderReviewBlock({ verdict = null, strength = null, date = null, of = null, against = null, commit = null, survey = null }) {
  const lines = ["review:"];
  if (verdict !== null) {
    lines.push(`  verdict: ${verdict}`, `  strength: ${strength}`, `  date: ${date}`, `  of: ${hashScalar(of)}`);
    if (commit !== null) lines.push(`  commit: ${hashScalar(commit)}`);
    if (against !== null) lines.push(`  against: ${JSON.stringify(against)}`);
  }
  if (survey !== null) {
    lines.push("  survey:", ...renderSurveyLines(survey, "    "));
  }
  return lines;
}

/**
 * What one survey leaves on one judged node, whole: the six keys
 * `survey-selection` names. It is built whether or not the reader admits
 * every key yet -- `renderSurveyLines` writes the ones it does -- so that the
 * shape the record is owed is in one place and not scattered through the
 * write step.
 */
export function surveyBlock({ date, of, commit = null, text = null, findings = [], pairs = [] }) {
  return { date, of, commit, text, findings, pairs };
}

/**
 * The survey's own block, as `survey-selection` says what a survey leaves on
 * a node: `date`, the recommendation it pinned (`of`), `commit`, the graph
 * commit it read; `text`, the hashes of the five sections its validations
 * read; `findings`, the register of what it left open on the node, each with
 * the support it rests on and the condition that discharges it; and `pairs`,
 * the pairs it read that touch this node, each with the key it was drawn on.
 *
 * Only the keys the reader admits are written. `read.mjs`'s `surveyOk`
 * requires the survey block's key set to be exactly `REVIEW_SURVEY_KEYS`
 * (today `['date', 'of']`), so writing `commit:` now would make every node
 * this touched unreadable. The whole block is built regardless and filtered
 * here: when `REVIEW_SURVEY_KEYS` grows, the rest of the block lands with no
 * further change to this file. Extending that check is the reader's own
 * unit's, not this one's.
 */
export function renderSurveyLines(survey, indent) {
  const out = [];
  for (const key of REVIEW_SURVEY_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(survey, key)) continue;
    const value = survey[key];
    if (value === null || value === undefined) continue;
    if (key === "date") out.push(`${indent}date: ${value}`);
    else if (key === "of" || key === "commit") out.push(`${indent}${key}: ${hashScalar(value)}`);
    else out.push(...yamlBlock(key, value, indent));
  }
  return out;
}

// A plain-data YAML emitter for the survey block's nested keys (`text`,
// `findings`, `pairs`). Every string is double-quoted, which is valid YAML
// for any content and keeps a hash-shaped or date-shaped scalar a string.
function yamlScalar(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(String(value));
}

function yamlBlock(key, value, indent) {
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${indent}${key}: []`];
    return [`${indent}${key}:`, ...value.flatMap((item) => yamlItem(item, `${indent}  `))];
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return [`${indent}${key}: {}`];
    return [`${indent}${key}:`, ...keys.flatMap((k) => yamlBlock(k, value[k], `${indent}  `))];
  }
  return [`${indent}${key}: ${yamlScalar(value)}`];
}

function yamlItem(item, indent) {
  if (item !== null && typeof item === "object" && !Array.isArray(item)) {
    const keys = Object.keys(item);
    if (keys.length === 0) return [`${indent}- {}`];
    const [first, ...rest] = keys;
    const firstLines = yamlBlock(first, item[first], indent);
    return [
      `${indent}- ${firstLines[0].slice(indent.length)}`,
      ...firstLines.slice(1).map((l) => `  ${l}`),
      ...rest.flatMap((k) => yamlBlock(k, item[k], `${indent}  `)),
    ];
  }
  return [`${indent}- ${yamlScalar(item)}`];
}

/**
 * The register of findings one survey leaves open on one judged node, as
 * `survey-selection` describes it: each finding with the support it rests on
 * and the condition on which it is discharged, classified against the
 * register the last survey left there. "A finding whose support is unmoved is
 * carried forward and reported as standing rather than as new; a finding one
 * of whose supports moved is re-derived; a finding not in the register is
 * new."
 *
 * The register is taken over the frontier findings this survey records on the
 * node, which are what it leaves open: the node entry's own reading is the
 * survey's account of the node and is closed by being written, and any
 * proposal it makes reaches the record as a frontier finding or as an option.
 *
 * A finding's support is which of the five sections it rests on. A reading
 * may name them (`supports`, filtered to the five); where it names none the
 * support is all five, which is the conservative reading and the only sound
 * one -- a finding whose support is unstated must be re-derived on any
 * change, because the record cannot tell what it read.
 */
export function surveyRegister({ id, findings, before, text, date }) {
  const priorEntries = Array.isArray(before && before.findings) ? before.findings : [];
  const priorText = (before && before.text) || null;
  // Which of the five sections moved since the last survey read this node.
  // With no prior text every section counts as moved, which changes nothing:
  // with no prior register every finding is new anyway.
  const moved = new Set(priorText ? movedSections(priorText, text || {}) : SECTION_HASH_KEYS);
  return (findings || []).map((f) => {
    const named = Array.isArray(f.supports) ? f.supports.filter((s) => SECTION_HASH_KEYS.includes(s)) : [];
    const rests = named.length > 0 ? named : [...SECTION_HASH_KEYS];
    const prior = priorEntries.find((e) => e && e.finding === f.finding) || null;
    const status = prior === null
      ? "new"
      : rests.some((s) => moved.has(s)) ? "re-derived" : "standing";
    return {
      finding: f.finding,
      kind: f.kind,
      status,
      since: status === "new" ? date : (prior.since || prior.date || date),
      supports: rests,
      discharge: isNonEmptyString(f.discharges) ? f.discharges : DEFAULT_DISCHARGE,
      nodes: [id, ...(f.otherIds || [])],
    };
  });
}

/**
 * One option entry on the answer fact, at the indentation the node's own
 * list already uses (a YAML sequence cannot mix indentations), `source:
 * review` -- the option was raised by a reading -- and the review's date as
 * its `ref`, quoted so a date-shaped ref stays a string.
 */
function renderOptionEntry({ name, date }, indent) {
  return [`${indent}- name: ${name}`, `${indent}  source: review`, `${indent}  ref: "${date}"`];
}

/**
 * Append option entries to the answer fact's `options` list, creating the
 * `facts:` list and its answer fact when either is absent. The answer fact
 * is written first among the facts, which is where the reader requires it.
 *
 * Text-level, like every other edit here: the entries go at the end of the
 * list the file already writes, at its own indentation, and no other line
 * of the block is touched.
 */
function upsertAnswerOptions(fmLines, options, date) {
  if (options.length === 0) return fmLines;
  const lines = [...fmLines];
  const facts = findFrontmatterBlock(lines, "facts");

  if (!facts) {
    const order = findFrontmatterBlock(lines, "order");
    const stageIdx = lines.findIndex((l) => /^stage:/.test(l));
    const review = findFrontmatterBlock(lines, "review");
    const depends = findFrontmatterBlock(lines, "depends");
    const insertAt = order ? order[1] : stageIdx !== -1 ? stageIdx + 1 : review ? review[0] : depends ? depends[0] : lines.length;
    lines.splice(
      insertAt,
      0,
      "facts:",
      "  - name: answer",
      "    options:",
      ...options.flatMap((o) => renderOptionEntry({ ...o, date }, "      ")),
    );
    return lines;
  }

  const [start, end] = facts;
  const firstItem = lines.slice(start + 1, end).find((l) => /^\s*- /.test(l));
  const itemIndent = firstItem ? indentOf(firstItem) : "  ";
  const itemStarts = [];
  for (let i = start + 1; i < end; i += 1) {
    if (lines[i].startsWith(`${itemIndent}- `)) itemStarts.push(i);
  }
  const keyIndent = `${itemIndent}  `;
  const answerIdx = itemStarts.findIndex((s, k) => {
    const itemEnd = k + 1 < itemStarts.length ? itemStarts[k + 1] : end;
    if (lines[s] === `${itemIndent}- name: answer`) return true;
    for (let i = s + 1; i < itemEnd; i += 1) {
      if (lines[i] === `${keyIndent}name: answer`) return true;
    }
    return false;
  });

  if (answerIdx === -1) {
    const insertAt = itemStarts.length > 0 ? itemStarts[0] : start + 1;
    lines.splice(
      insertAt,
      0,
      `${itemIndent}- name: answer`,
      `${keyIndent}options:`,
      ...options.flatMap((o) => renderOptionEntry({ ...o, date }, `${keyIndent}  `)),
    );
    return lines;
  }

  const itemStart = itemStarts[answerIdx];
  const itemEnd = answerIdx + 1 < itemStarts.length ? itemStarts[answerIdx + 1] : end;
  let optionsIdx = -1;
  for (let i = itemStart; i < itemEnd; i += 1) {
    if (lines[i] === `${keyIndent}options:` || lines[i] === `${itemIndent}- options:`) {
      optionsIdx = i;
      break;
    }
  }
  if (optionsIdx === -1) {
    // The reader requires at least one option on every fact, so this is a
    // file the reader would already have refused; say so rather than
    // guessing where the list belongs.
    throw new Error("the answer fact carries no 'options' list to append to");
  }
  const listEnd = indentedBlockEnd(lines, optionsIdx + 1, itemEnd, keyIndent.length);
  const firstOption = lines.slice(optionsIdx + 1, listEnd).find((l) => /^\s*- /.test(l));
  const optionIndent = firstOption ? indentOf(firstOption) : `${keyIndent}  `;
  lines.splice(listEnd, 0, ...options.flatMap((o) => renderOptionEntry({ ...o, date }, optionIndent)));
  return lines;
}

// ------------------------------------------------------------------ probes
//
// author-questions: a probe carries `id`, `asks`, `why`, `discharges`,
// `source` and `raised` while it stands open. The reading supplies `asks`,
// `why`, `discharges` and an optional `fact`; this script supplies the rest
// -- `id`, a slug it derives and makes unique on the node, `source` (always
// `review`, from either reading), and `raised` (the apply's date).

/**
 * A slug for a newly raised probe's `id`, derived from `asks` and shaped to
 * the reader's OPTION_NAME_RE (`^[a-z0-9][a-z0-9-]*$`): lowercased, every run
 * of non-alphanumeric characters collapsed to one hyphen, trimmed, and capped
 * at 40 characters so a long question does not become an unreadable key.
 */
function slugifyProbeId(asks) {
  let slug = asks.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug.length > 40) slug = slug.slice(0, 40).replace(/-+$/, "");
  if (!/^[a-z0-9]/.test(slug)) slug = `probe-${slug}`;
  return slug || "probe";
}

/**
 * `slugifyProbeId`'s candidate, disambiguated against every id already in
 * `used` (the node's existing probes, and every id this same apply has
 * already assigned) by appending '-2', '-3', ...
 */
function uniqueProbeId(base, used) {
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * The reading's raw probes (`asks`, `why`, `discharges`, optional `fact`)
 * turned into full entries ready to splice into `probes:`: `id` derived from
 * `asks` and made unique among `existingProbes`' ids and each other, `source`
 * and `raised` supplied by the caller.
 */
function assignProbeIds(existingProbes, rawEntries, { source, raised }) {
  const used = new Set((existingProbes || []).map((p) => p.id));
  return (rawEntries || []).map((p) => {
    const id = uniqueProbeId(slugifyProbeId(p.asks), used);
    used.add(id);
    return { id, asks: p.asks, why: p.why, discharges: p.discharges, source, raised, fact: p.fact ?? null };
  });
}

/**
 * Whether a node will carry any open probe (one with no `status`) after this
 * apply -- one already on it, or one this reading raises now.
 */
function willCarryOpenProbe(existingProbes, addedCount) {
  return (existingProbes || []).some((p) => !p.status) || addedCount > 0;
}

/**
 * The stage a node carrying an open probe is forced to (author-questions: "a
 * probe recorded on a node at the review or the ruling stage returns that
 * node to the maieutic stage" and "a node already at the periagogic stage
 * stays there, because a movement only ever moves a node back"). Never
 * 'ruling', which is why this beats a 'ruling' override or a forward verdict
 * outright; `wantsPeriagogic` is whatever the verdict, kickback_stage, or
 * override would otherwise have put at 'periagogic', which this still
 * honours.
 */
function stageForOpenProbe(currentStage, wantsPeriagogic) {
  if (currentStage === "periagogic") return "periagogic";
  return wantsPeriagogic ? "periagogic" : "maieutic";
}

/**
 * One probe entry appended to `probes:`, in the order the reader's parse
 * block expects (`PROBE_KEYS`): `id`, `asks`, `why`, `discharges`, `source`,
 * `raised`, and `fact` when it names one. `id` and `source` are short
 * vocabulary words and need no quoting; the free-text fields are JSON-quoted,
 * which is a valid single-line YAML double-quoted scalar and round-trips
 * through any colon or quote mark the text carries; `raised` is a date,
 * quoted as `renderOptionEntry`'s `ref` already is so it stays a string.
 */
function renderProbeEntry({ id, asks, why, discharges, source, raised, fact }, indent) {
  const lines = [
    `${indent}- id: ${id}`,
    `${indent}  asks: ${JSON.stringify(asks)}`,
    `${indent}  why: ${JSON.stringify(why)}`,
    `${indent}  discharges: ${JSON.stringify(discharges)}`,
    `${indent}  source: ${source}`,
    `${indent}  raised: "${raised}"`,
  ];
  if (fact) lines.push(`${indent}  fact: ${fact}`);
  return lines;
}

/**
 * Update `stage:` (inserting the line when the node carries none, which is
 * how a finding opens a dialogue on settled doctrine), unless `stage` is
 * null; append `options` to the answer fact, creating `facts:` when absent;
 * replace the `review:` block, unless `reviewLines` is null; and append
 * `dependsAdd` entries (each already rendered `<id>` or `<id>#<option>`) to
 * `depends`, creating the list when absent.
 *
 * `reviewLines` is null for a node touched only by a finding (no reading of
 * its own to record): whatever `review:` block it already carries -- from an
 * earlier round, or none at all -- is left exactly as it stands. `stage` is
 * null for a node no entry names a stage for: the top-level `stage:` line, if
 * any, is left exactly as it stands.
 *
 * Each field is placed where the reader's own declared frontmatter-key order
 * (`FRONTMATTER_KEYS` in read.mjs) puts it: `stage`, `order`, `facts`,
 * `review`, `depends`, `probes`.
 *
 * `probesAdd` entries (each already carrying `id`, `asks`, `why`,
 * `discharges`, `source`, `raised`, and optional `fact` -- `assignProbeIds`'s
 * shape) are appended to `probes`, creating the list when absent, at the
 * frontmatter's very end (the reader's key order puts `probes` after
 * `depends`, last of all).
 */
function upsertDialogueFields(rawText, { stage, reviewLines, options = [], date = null, dependsAdd = [], probesAdd = [] }) {
  const { fmLines: originalFm, bodyLines } = splitRaw(rawText);
  let fmLines = [...originalFm];

  let stageIdx = fmLines.findIndex((l) => /^stage:/.test(l));
  if (stage !== null) {
    if (stageIdx === -1) {
      const questionIdx = fmLines.findIndex((l) => /^question:/.test(l));
      stageIdx = questionIdx === -1 ? 0 : questionIdx + 1;
      fmLines.splice(stageIdx, 0, `stage: ${stage}`);
    } else {
      fmLines[stageIdx] = `stage: ${stage}`;
    }
  }
  if (stageIdx === -1) stageIdx = fmLines.findIndex((l) => /^stage:/.test(l));

  if (options.length > 0) {
    fmLines = upsertAnswerOptions(fmLines, options, date);
  }

  if (reviewLines !== null) {
    const existingReview = findFrontmatterBlock(fmLines, "review");
    let insertAt;
    if (existingReview) {
      insertAt = existingReview[0];
      fmLines.splice(existingReview[0], existingReview[1] - existingReview[0]);
    } else {
      const facts = findFrontmatterBlock(fmLines, "facts");
      insertAt = facts ? facts[1] : stageIdx + 1;
    }
    fmLines.splice(insertAt, 0, ...reviewLines);
  }

  if (dependsAdd.length > 0) {
    const existing = findFrontmatterBlock(fmLines, "depends");
    if (existing) {
      const [start, end] = existing;
      const firstItem = fmLines.slice(start + 1, end).find((l) => /^\s*- /.test(l));
      const indent = firstItem ? indentOf(firstItem) : "  ";
      fmLines.splice(end, 0, ...dependsAdd.map((d) => `${indent}- ${d}`));
    } else {
      const review = findFrontmatterBlock(fmLines, "review");
      const facts = findFrontmatterBlock(fmLines, "facts");
      const insertAt = review ? review[1] : facts ? facts[1] : stageIdx + 1;
      fmLines.splice(insertAt, 0, "depends:", ...dependsAdd.map((d) => `  - ${d}`));
    }
  }

  if (probesAdd.length > 0) {
    const existing = findFrontmatterBlock(fmLines, "probes");
    if (existing) {
      const [start, end] = existing;
      const firstItem = fmLines.slice(start + 1, end).find((l) => /^\s*- /.test(l));
      const indent = firstItem ? indentOf(firstItem) : "  ";
      fmLines.splice(end, 0, ...probesAdd.flatMap((p) => renderProbeEntry(p, indent)));
    } else {
      const depends = findFrontmatterBlock(fmLines, "depends");
      const review = findFrontmatterBlock(fmLines, "review");
      const facts = findFrontmatterBlock(fmLines, "facts");
      const insertAt = depends ? depends[1] : review ? review[1] : facts ? facts[1] : stageIdx + 1;
      fmLines.splice(insertAt, 0, "probes:", ...probesAdd.flatMap((p) => renderProbeEntry(p, "  ")));
    }
  }

  return joinRaw(fmLines, bodyLines);
}

// ------------------------------------------------------------------ prose

/** The regex a recorded '### Clean-context ...' subsection's "Recommended at
 * this reading: `<option>`." line matches, capturing the option's name. */
const RECOMMENDED_AT_READING_RE = /^Recommended at this reading: `([^`]+)`\.$/m;

/**
 * How many '### Clean-context review,' / '### Clean-context re-reading,'
 * subsections stand at the end of '## Account' as readings of the answer
 * `currentRecommends` now names (`review-cost`: "a draft gets two readings of
 * one answer, a kickback being a new answer and not a third round"). Two
 * boundaries stop the backward walk, and a boundary section joins neither
 * side's count: a section whose body says the draft was kicked back, the
 * boundary that starts the next answer's readings and not an overrun of the
 * answer it closes; and a section that names, on its own "Recommended at
 * this reading" line, an option other than `currentRecommends` -- a moved
 * recommendation is a new answer exactly as a kickback is, per review-cost,
 * and the two are boundaries of the same kind. A third boundary is a
 * '### Frontier finding,' section: the survey wrote it to send the node back
 * to an earlier stage, so a reading after it answers that finding and is not
 * an overrun of the readings before it. A section with no recorded
 * "Recommended at this reading" line (every one written before this
 * recording existed) is unknown rather than assumed to match, and stops the
 * walk too, so the counter never over-counts a historical node it cannot
 * actually read. Every other subsection (a frontier survey's own note, a
 * subtree divergence) is transparent: neither counted nor a boundary.
 * Non-fatal by design -- this is read by the caller to warn on stderr and
 * never to refuse a write, since the cap binds the movement and not this
 * mechanical step.
 */
function readingSectionsSinceKickback(accountText, currentRecommends) {
  if (!accountText) return 0;
  const lines = accountText.split("\n");
  const all = headingBoundaries(lines).filter((h) => h.depth === 3);
  let count = 0;
  for (let i = all.length - 1; i >= 0; i -= 1) {
    const h = all[i];
    if (/^Frontier finding, /.test(h.name)) break;
    if (!/^Clean-context (review|re-reading), /.test(h.name)) continue;
    const end = i + 1 < all.length ? all[i + 1].index : lines.length;
    const body = lines.slice(h.index, end).join("\n");
    if (/kicked back to the/.test(body)) break;
    const recorded = body.match(RECOMMENDED_AT_READING_RE);
    if (recorded === null || recorded[1] !== currentRecommends) break;
    count += 1;
  }
  return count;
}

/**
 * What heads a reading's subsection, after the kind: the date, and the short
 * pin of the recommendation the reading read. The date alone is not an
 * address -- a redrawn answer read twice in one day gives two subsections
 * with the same heading, and a citation by heading then resolves to neither
 * (measured on `class-recommendation` and on `delegation-bounds-and-sizing`,
 * 2026-09-05). The pin is the record's own handle for what was read, so the
 * heading says which text the reading judged and no two readings of two
 * answers can collide. A collision that survives the pin is the same answer
 * read twice on one day, which the two-reading cap forbids and the caller
 * warns about; the roman suffix keeps the heading addressable even then.
 * A reading with no pin (nothing recommended yet) keeps the bare date.
 */
const ROMAN = ["", " (ii)", " (iii)", " (iv)", " (v)", " (vi)"];

function readingStamp(date, of, kind, accountText) {
  const base = of ? `${date}, of ${String(of).slice(0, 8)}` : `${date}`;
  const prefix = kind === "survey" ? "### Frontier survey, " : kind === "delta" ? "### Clean-context re-reading, " : "### Clean-context review, ";
  if (!accountText) return base;
  for (let i = 0; i < ROMAN.length; i += 1) {
    const candidate = `${base}${ROMAN[i]}`;
    if (!accountText.includes(`${prefix}${candidate}\n`)) return candidate;
  }
  return `${base} (${Date.now()})`;
}

/**
 * The subsection one reading appends to the node it read: the draft's review,
 * with its verdict, or the survey's reading of that node, which has none --
 * the survey forwards nothing, and only its findings move a stage. The fields
 * are the same in both, and each is omitted where the reading did not produce
 * it. A draft or delta reading also records, when the node carries an answer
 * fact with a `recommends`, which option that was at the time -- the "two
 * readings of one answer" cap (`review-cost`) reads this line back to tell a
 * kickback-less move to a new answer from an overrun of the old one
 * (`readingSectionsSinceKickback`); a node with no answer fact, or none
 * `recommends`, records nothing here rather than a placeholder.
 */
function renderSubsection({
  kind = "draft", date, verdict, kickback_stage: kickbackStage, findings,
  counter_argument: counterArgument, strength, facts_check: factsCheck, viability, reply, recommends,
  of = null, accountText = null,
}) {
  const stamp = readingStamp(date, of, kind, accountText);
  const parts = kind === "survey"
    ? [
      `### Frontier survey, ${stamp}`,
      "",
      "Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.",
    ]
    : kind === "delta"
      ? [
        `### Clean-context re-reading, ${stamp}`,
        "",
        `Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. ${verdict === "forward" ? "Verdict: the amendment stands, forwarded to the author's ruling." : `Verdict: kicked back to the ${kickbackStage} stage.`}`,
      ]
      : [
        `### Clean-context review, ${stamp}`,
        "",
        `Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. ${verdict === "forward" ? "Verdict: forward to the author's ruling." : `Verdict: kicked back to the ${kickbackStage} stage.`}`,
      ];

  if (recommends) {
    parts.push("", `Recommended at this reading: \`${recommends}\`.`);
  }
  parts.push("", "Findings:", "", ...(findings || []).map((f) => `- ${f}`));
  if (factsCheck) {
    parts.push("", `On the facts and what they recommend: ${factsCheck}`);
  }
  if (viability) {
    parts.push("", `On the viability of the options: ${viability}`);
  }
  parts.push("", counterArgument ? `Strongest counter-argument (${strength}): ${counterArgument}` : "The review found no strong counter-argument.");
  if (reply) {
    parts.push("", `The session's reply: ${reply}`);
  }
  return parts.join("\n");
}

/**
 * The subsection a finding appends to every node it names -- judged or not.
 * An option the finding proposes is named here as well as recorded on the
 * answer fact, so the node's own account says where the merge or split it
 * proposes went.
 *
 * `otherIds` names every other node the finding named, the ones dropped for
 * having moved included, so the account still says what the finding was
 * about; `droppedIds` says which of them the finding was not written on and
 * why, so the reader of this node is not left to infer it from a missing
 * subsection elsewhere.
 */
function renderFrontierSubsection({ date, kind, finding, proposal, otherIds, droppedIds = [], options, id }) {
  const namedLine = otherIds.length > 0 ? `Also named: ${otherIds.join(", ")}.` : "Names only this node.";
  const parts = [`### Frontier finding, ${date}`, "", `Kind: ${kind}.`, "", finding, "", namedLine, "", `Proposed: ${proposal}`];
  if (droppedIds.length > 0) {
    parts.push(
      "",
      `Not written on ${droppedIds.join(", ")}: ${droppedIds.length > 1 ? "those nodes" : "that node"} moved since the survey read ${droppedIds.length > 1 ? "them" : "it"}, so this finding is re-derived there by the next survey.`,
    );
  }
  for (const a of options || []) {
    parts.push(
      "",
      a.node === id
        ? `Recorded as an option on this node's answer fact: \`${a.name}\` (source review, ${date}).`
        : `Recorded as an option on ${a.node}'s answer fact: \`${a.name}\` (source review, ${date}).`,
    );
  }
  return parts.join("\n");
}

/**
 * The subsection a subtree divergence appends to its *ancestor*: for each
 * option on the table, the nodes a ruling for it keeps (the side's own
 * nodes) and the nodes it discards (every node named under every other
 * side), so the author reads at the ancestor, on the alignment page, what a
 * ruling for each option keeps and what it discards (`alignment-order`).
 * Quotes the entry's finding.
 */
function renderAncestorDivergenceSubsection({ date, sides, finding }) {
  const names = Object.keys(sides);
  const lines = names.map((name) => {
    const keeps = sides[name];
    const discards = names.filter((n) => n !== name).flatMap((n) => sides[n]);
    const discardsText = discards.length > 0 ? `; discards ${discards.join(", ")}` : "; discards nothing else named here";
    return `- \`${name}\` keeps ${keeps.join(", ")}${discardsText}.`;
  });
  return [`### Subtree divergence, ${date}`, "", finding, "", ...lines].join("\n");
}

/**
 * The subsection a subtree divergence appends to one *leaf*: which ancestor
 * and which option on it this node stands under (the same divergence
 * recorded as `depends` in the frontmatter). Quotes the entry's finding.
 */
function renderLeafDivergenceSubsection({ date, ancestor, option, finding }) {
  return [`### Subtree divergence, ${date}`, "", finding, "", `Stands under ${ancestor}, option \`${option}\`.`].join("\n");
}

// ------------------------------------------------------------ the two pins
//
// Every edit this script makes is dialogue state or the account: the stage,
// the review, the depends, an option on the answer fact, and prose in
// '## Facts' and '## Account'. None of that is part of what stands
// (`deriveStandingHash` strips `stage`, `review`, `depends` and `facts` from
// the frontmatter and reads only '## Answer' and '## Rationale'), so the
// standing hash is invariant under this script and is checked as such after
// every write.
//
// `review.of` pins what the node recommends, `deriveRecommendationHash`, as
// the node stands *after* the edit. Writing the block cannot itself move
// that hash -- `review` is stripped from every hash input -- so at most one
// re-render is ever needed, and the result is asserted rather than assumed.
const MAX_PIN_PASSES = 2;

/**
 * Build the edited text, settling `review.of` on the recommendation hash of
 * the node as edited.
 *
 * @param {(of: string|null) => string} build - renders the whole edited text
 *   with `of` in its `review:` block (`of` null when no block is written).
 * @param {(text: string) => object} parse - parseNode for this node.
 * @param {string|null} seed - the hash to try first (the node's own, before
 *   the edit).
 * @returns {{text: string, parsed: object, of: string|null}}
 */
function settlePin(build, parse, seed) {
  // A parse failure after the edit is the caller's own message ("does not
  // parse after edit"), and is told from a build failure and from the pin
  // failing to settle by this tag.
  const parseTagged = (text) => {
    try {
      return parse(text);
    } catch (err) {
      err.parseError = true;
      throw err;
    }
  };
  let of = seed;
  for (let pass = 0; pass < MAX_PIN_PASSES; pass += 1) {
    const text = build(of);
    const parsed = parseTagged(text);
    if (of === null || parsed.recommendationHash === of) return { text, parsed, of };
    of = parsed.recommendationHash;
  }
  const text = build(of);
  const parsed = parseTagged(text);
  if (parsed.recommendationHash !== of) {
    throw new Error(`internal error -- 'review.of' will not settle (${of} vs ${parsed.recommendationHash}); writing the review block must not move the recommendation hash`);
  }
  return { text, parsed, of };
}

/** The message one of `settlePin`'s three failures reads as. */
function pinFailureMessage(err) {
  return err.parseError ? `does not parse after edit: ${err.message}` : err.message;
}

// -------------------------------------------------- the review of one draft

/**
 * Shape-check one raw probe entry from a reading (`asks`, `why`,
 * `discharges`, optional `fact`) -- the shape both `brief-draft.md` and
 * `brief-survey.md` ask the reading for, before `assignProbeIds` supplies
 * `id`, `source` and `raised`. No count of open probes is checked here, and
 * since `words/2026-09-08/32` struck the cap of three there is no count left
 * to check anywhere (author-questions).
 */
function pushProbeProblems(problems, p, label) {
  if (!p || typeof p !== "object" || Array.isArray(p)) {
    problems.push(`${label} must be a mapping with asks, why, discharges, and optional fact`);
    return;
  }
  if (!isNonEmptyString(p.asks)) problems.push(`${label}.asks is required and must be a non-empty string`);
  if (!isNonEmptyString(p.why)) problems.push(`${label}.why is required and must be a non-empty string`);
  if (!isNonEmptyString(p.discharges)) problems.push(`${label}.discharges is required and must be a non-empty string`);
  if (p.fact !== undefined && p.fact !== null && !FACT_NAMES.includes(p.fact)) {
    problems.push(`${label}.fact must be one of: ${FACT_NAMES.join(", ")}`);
  }
}

function validateDraft(input, { replies }) {
  const problems = [];
  if (!isNonEmptyString(input.id)) {
    problems.push("a draft review names the node it read: 'id' is required");
  }
  if (input.verdict !== "forward" && input.verdict !== "kickback") {
    problems.push(`${input.id}: verdict must be 'forward' or 'kickback', found '${JSON.stringify(input.verdict)}'`);
  }
  if (input.verdict === "kickback" && !input.kickback_stage) {
    problems.push(`${input.id}: kickback requires kickback_stage`);
  }
  if (input.kickback_stage && !KICKBACK_STAGES.includes(input.kickback_stage)) {
    problems.push(`${input.id}: kickback_stage must be 'periagogic' (the ground or the author's words are in question) or 'maieutic' (the answer must be redrafted), found '${JSON.stringify(input.kickback_stage)}'`);
  }
  if (!isNonEmptyString(replies[input.id])) {
    problems.push(
      input.strength === "strong"
        ? `${input.id}: strength 'strong' requires a reply in --replies`
        : `${input.id}: the node under review requires a reply in --replies`,
    );
  }
  if (Array.isArray(input.nodes) || Array.isArray(input.frontier)) {
    problems.push(`a draft or a re-reading reads one node: 'nodes' and 'frontier' belong to the survey, and this file names scope '${input.scope}'`);
  }
  if (input.probes !== undefined && input.probes !== null) {
    if (!Array.isArray(input.probes)) {
      problems.push(`${input.id}: 'probes' must be a list of {asks, why, discharges, and optional fact}`);
    } else {
      input.probes.forEach((p, i) => pushProbeProblems(problems, p, `${input.id}: probes[${i}]`));
    }
  }
  return problems;
}

/**
 * The soft contradiction the answer names but does not let block the file:
 * "a draft review that returns a probe and a forward verdict is a
 * contradiction". Not a `validateDraft` problem -- that would refuse the
 * file -- so it is surfaced through the same `notes` channel every other
 * soft finding in this script uses (an already-listed option skipped, a
 * commit mismatch noted); the applying step still keeps the node off
 * 'ruling' regardless, since the open probe controls the stage either way.
 */
function draftForwardProbeContradiction(input) {
  if (input.verdict === "forward" && Array.isArray(input.probes) && input.probes.length > 0) {
    return [`${input.id}: contradiction -- this reading returns an open probe alongside a 'forward' verdict; the applying step does not forward this node to ruling while a probe is open`];
  }
  return [];
}

/**
 * Plan the one node a draft review read: '### Clean-context review, <date>'
 * on its account, the stage the verdict or an override sets, and the four
 * draft keys of `review` pinned to the recommendation hash of the node as
 * edited. A survey pin already on the node is carried into the new block --
 * the two readings are recorded side by side and neither discards the other.
 */
async function planDraft(input, ctx) {
  const id = input.id;
  let graphName, slug, file;
  try {
    ({ graph: graphName, slug, file } = resolveIdToFile(ctx.manifest, ctx.rootDir, id));
  } catch (err) {
    return { id, problems: [err.message] };
  }

  let rawTextBefore;
  try {
    rawTextBefore = await readFile(file, "utf8");
  } catch (err) {
    return { id, problems: [`${id}: cannot read ${file}: ${err.message}`] };
  }

  const parse = (text) => parseNode(text, { id, graph: graphName, slug, path: file });
  let parsedBefore;
  try {
    parsedBefore = parse(rawTextBefore);
  } catch (err) {
    return { id, problems: [`${id}: does not parse before edit: ${err.message}`] };
  }

  const hasOverride = Object.prototype.hasOwnProperty.call(ctx.overrides, id);
  const currentStage = parsedBefore.stage;
  if (currentStage !== "review" && !hasOverride) {
    return { id, problems: [`${id}: the review of a draft runs on a node at stage 'review' (or an override), found '${currentStage}'`] };
  }

  // A node that will carry any open probe after this apply -- one the
  // reading raises now, or one it already carried -- never lands at
  // 'ruling', and a node already at 'periagogic' stays there (a movement
  // only ever moves a node back). This is derived before the verdict is read
  // and beats it, and beats an override of 'ruling' too: any other override
  // is respected (author-questions).
  const existingProbes = parsedBefore.probes || [];
  const probesToAdd = assignProbeIds(existingProbes, input.probes, { source: "review", raised: ctx.date });
  const openProbe = willCarryOpenProbe(existingProbes, probesToAdd.length);

  const baseStage = hasOverride ? ctx.overrides[id] : input.verdict === "forward" ? "ruling" : input.kickback_stage;
  const newStage = openProbe ? stageForOpenProbe(currentStage, baseStage === "periagogic") : baseStage;
  const reply = Object.prototype.hasOwnProperty.call(ctx.replies, id) ? ctx.replies[id] : null;
  const recommends = (parsedBefore.answerFact && parsedBefore.answerFact.recommends) || null;

  // Non-fatal: the cap binds the movement (a session should not have asked
  // for a third reading of the same answer), not this mechanical step, so
  // this only warns and never refuses the write (review-cost).
  if (readingSectionsSinceKickback(parsedBefore.account, recommends) >= 2) {
    process.stderr.write(
      `${id}: the record caps a single answer at two readings, and this write records a third (or later) with no kickback in between; `
      + "a finding that survives from here belongs on the facts as an option, not as a further amendment.\n",
    );
  }

  const kind = input.scope === "delta" ? "delta" : "draft";
  const subsection = renderSubsection({
    kind,
    date: ctx.date,
    verdict: input.verdict,
    kickback_stage: input.kickback_stage ?? null,
    findings: input.findings,
    counter_argument: input.counter_argument ?? null,
    strength: input.strength,
    facts_check: input.facts_check ?? null,
    viability: input.viability ?? null,
    reply,
    recommends,
    of: parsedBefore.recommendationHash,
    accountText: parsedBefore.account,
  });

  const survey = (parsedBefore.review && parsedBefore.review.survey) || null;
  const against = input.counter_argument ?? null;
  // The commit this reading read, the same way the survey's sidecar records
  // one (`graphCommit`, `writeSurveyBrief`): the graph's HEAD, whether or not
  // the tree was clean when the reading ran.
  //
  // It used to be written only over a clean tree, on the ground that a bare
  // sha1 with no `dirty` flag beside it would claim to describe text it does
  // not. That reasoning gets the cost backwards. A reading is nearly always
  // taken over a working tree with the amendment in it, so the condition
  // dropped the commit exactly when a reading happened, and a review with no
  // commit is not a review that says "the tree was dirty" -- it is a review
  // that says nothing, and the record cannot tell the two apart. HEAD is a
  // true and useful fact either way: it is the last committed state the
  // reading read from, so it dates the reading and bounds what could have
  // moved. Whether the tree was clean is a separate fact, and the record
  // that wants it should carry it as one rather than encode it as an
  // absence. What the `of` pin attests to is unaffected: the pin, not the
  // commit, is what says which text was read.
  const { commit: graphCommitSha } = graphCommit(ctx.rootDir);
  const commit = graphCommitSha;
  const build = (of) => upsertDialogueFields(appendToAccount(rawTextBefore, subsection), {
    stage: newStage,
    reviewLines: renderReviewBlock({ verdict: input.verdict, strength: input.strength, date: ctx.date, of, against, commit, survey }),
    probesAdd: probesToAdd,
  });

  let settled;
  try {
    settled = settlePin(build, parse, parsedBefore.recommendationHash);
  } catch (err) {
    return { id, problems: [`${id}: ${pinFailureMessage(err)}`] };
  }
  if (settled.parsed.standingHash !== parsedBefore.standingHash) {
    return { id, problems: [`${id}: internal error -- the standing hash changed by the edit (${parsedBefore.standingHash} -> ${settled.parsed.standingHash}); this script writes dialogue state and the account only`] };
  }

  const labels = [kind === "delta" ? `Clean-context re-reading (${input.verdict})` : `Clean-context review (${input.verdict})`];
  if (survey) labels.push("survey pin kept");
  if (probesToAdd.length > 0) {
    labels.push(`probe${probesToAdd.length > 1 ? "s" : ""} ${probesToAdd.map((p) => `'${p.id}'`).join(", ")}`);
  }
  return { id, file, labels, notes: [], oldStage: currentStage, newStage, rawTextBefore, rawTextAfter: settled.text };
}

async function applyDraft({ rootDir, manifest, input, replies, overrides, date, dry }) {
  const checkProblems = validateDraft(input, { replies });
  if (checkProblems.length > 0) throw new Error(checkProblems.join("\n"));

  const notes = draftForwardProbeContradiction(input);

  const ctx = { rootDir, manifest, replies, overrides, date: date ?? input.date ?? todayIso() };
  const plan = await planDraft(input, ctx);
  if (plan.problems) throw new Error(plan.problems.join("\n"));

  const plans = [plan];
  const report = [`${plan.id}: ${plan.labels.join(" + ")}, ${plan.oldStage ?? "no stage"} → ${plan.newStage ?? "no stage"}`, ...notes];

  if (dry) return { plans, report, validation: null, notes };

  await writeFile(plan.file, plan.rawTextAfter);
  let validation;
  try {
    await readGraph(rootDir);
    validation = { ok: true };
  } catch (err) {
    validation = { ok: false, message: err.message };
  }
  return { plans, report, validation, notes };
}

// ------------------------------------------------------- the survey's pins

/**
 * The sidecar brief.mjs wrote for this survey: the graph commit it read, the
 * ids it judged, and the recommendation hash of every node of the graph. The
 * apply step compares against this file and never against a hash the reviewer
 * copied, which is what serializes the survey in place of a lock.
 */
function checkPinsShape(pins, from) {
  if (!pins || typeof pins !== "object" || Array.isArray(pins)) {
    throw new Error(`${from}: not a pins sidecar (expected {commit, dirty, date, judged, pins})`);
  }
  if (!Array.isArray(pins.judged)) {
    throw new Error(`${from}: 'judged' must be the list of ids the survey judged`);
  }
  if (!pins.pins || typeof pins.pins !== "object" || Array.isArray(pins.pins)) {
    throw new Error(`${from}: 'pins' must be an object of node id to recommendation hash`);
  }
  // 'read' is optional and, until brief.mjs's own migration lands, absent:
  // the nodes the survey carried by what they answer, each with the five
  // section hashes it read (`the-whole-reading-is-a-backfill-and-the-delta-
  // is-the-norm`). Absent means exactly what it means today -- no read pin
  // is written on any node this run did not otherwise touch.
  if (pins.read !== undefined && pins.read !== null) {
    if (!Array.isArray(pins.read)) {
      throw new Error(`${from}: 'read' must be a list of {id, text} when given`);
    }
    for (const [i, entry] of pins.read.entries()) {
      if (!entry || typeof entry !== "object" || !isNonEmptyString(entry.id)) {
        throw new Error(`${from}: read[${i}] must be {id, text}`);
      }
      if (!entry.text || typeof entry.text !== "object" || Array.isArray(entry.text)) {
        throw new Error(`${from}: read[${i}] (${entry.id}) must carry 'text', the five section hashes`);
      }
    }
  }
  return pins;
}

/**
 * The pairs a survey actually read, from its selection sidecar: the live
 * pairs and the drift probe drawn from the frozen set. A frozen pair that
 * was not probed was not read, and is deliberately absent -- recording it
 * would freeze it again next time on a reading that never happened, which is
 * the one error the frozen set exists to make visible.
 */
function readPairs(selection) {
  const pairs = selection && selection.pairs;
  if (!pairs || typeof pairs !== "object") return [];
  const live = Array.isArray(pairs.live) ? pairs.live : [];
  const probe = Array.isArray(pairs.probe) ? pairs.probe : [];
  const seen = new Set();
  const out = [];
  for (const p of [...live, ...probe]) {
    if (!p || typeof p !== "object") continue;
    const key = `${p.a}\t${p.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

// ----------------------------------------------------------- survey checks
//
// frontier-consistency's and clean-context-review's own checks, run once over
// the whole reading before any file is touched: every entry naming a node the
// survey judged, no node twice; every finding shaped and grounded, its named
// nodes real; every proposed option shaped, named on a node the finding
// names, and not already on that node's answer fact; a strong
// counter-argument answered.
/**
 * Whether the node `id`'s recommendation has moved since the pins sidecar's
 * survey read it: gone from the graph, never pinned, or its recommendation
 * hash no longer matches the pin. Shared by `applySurvey`, which discards a
 * moved node's reading, a finding naming a moved node, or a probe on a moved
 * node rather than write it against text the reading never saw, and by
 * `validateSurvey`, which excludes a moved node from a frontier finding's
 * "kept" reply requirement on the same ground: a node a finding is not
 * written on owes no reply there.
 */
function pinMoved(id, nodesById, pins) {
  const node = nodesById.get(id);
  const pin = pins.pins ? pins.pins[id] : undefined;
  if (node === undefined) return { moved: true, pin: pin ?? null, now: null };
  if (pin === undefined) return { moved: true, pin: null, now: node.recommendationHash };
  return { moved: pin !== node.recommendationHash, pin, now: node.recommendationHash };
}

/**
 * How one frontier finding's named nodes divide against the pins: `stale`,
 * the entries whose node has moved since the survey read it, each with its
 * pin and the hash now; `survivors`, the nodes the finding is written on;
 * and `whole`, whether this finding is discarded whole rather than in part.
 * A finding is discarded per support and not per finding, so `survivors` is
 * the unmoved nodes -- except where nothing survived, or where the kind is
 * one whose object is the set it spans (WHOLE_OR_NOTHING_KINDS), in which
 * case `whole` is true and `survivors` is empty.
 *
 * `movedOf` is `pinMoved` bound to the run's graph and pins. Shared by
 * `applySurvey`, which writes the finding on the survivors and reports the
 * rest, and by `validateSurvey`, which owes a reply for exactly the nodes
 * the finding will be written on.
 */
function splitFindingNodes(f, movedOf) {
  const nodeIds = f && Array.isArray(f.nodes) ? f.nodes : [];
  const stale = nodeIds.map((id) => ({ id, ...movedOf(id) })).filter((m) => m.moved);
  if (stale.length === 0) return { stale, staleIds: new Set(), survivors: nodeIds, whole: false };
  const staleIds = new Set(stale.map((m) => m.id));
  const unmoved = nodeIds.filter((id) => !staleIds.has(id));
  const whole = unmoved.length === 0 || WHOLE_OR_NOTHING_KINDS.has(f && f.kind);
  return { stale, staleIds, survivors: whole ? [] : unmoved, whole };
}

function validateSurvey(input, graph, { replies, overrides, pins }) {
  const problems = [];
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const judged = new Set(pins.judged);
  const reportedMissingReply = new Set();

  const nodeEntries = Array.isArray(input.nodes) ? input.nodes : [];
  const seen = new Set();
  for (const entry of nodeEntries) {
    if (!entry || !isNonEmptyString(entry.id)) {
      problems.push("'nodes' has an entry with no id");
      continue;
    }
    if (seen.has(entry.id)) problems.push(`'nodes' has more than one entry for ${entry.id}`);
    seen.add(entry.id);
    if (!nodesById.has(entry.id)) {
      problems.push(`'nodes' names ${entry.id}, which is not a node`);
    } else if (!judged.has(entry.id)) {
      problems.push(`'nodes' names ${entry.id}, which this survey did not judge (it is not in the pins sidecar's 'judged'); only the judged set receives an entry`);
    }
    if (entry.strength === "strong" && !isNonEmptyString(replies[entry.id])) {
      problems.push(`${entry.id}: strength 'strong' requires a reply in --replies`);
      reportedMissingReply.add(entry.id);
    }
  }

  const frontier = Array.isArray(input.frontier) ? input.frontier : [];
  const proposedNames = new Set();
  frontier.forEach((f, i) => {
    const label = f && isNonEmptyString(f.kind) ? `frontier[${i}] (${f.kind})` : `frontier[${i}]`;
    if (!f || !FRONTIER_KINDS.has(f.kind)) {
      problems.push(`${label}: 'kind' must be one of ${[...FRONTIER_KINDS].join(", ")}, found '${JSON.stringify(f && f.kind)}'`);
    }
    const nodeIds = f && Array.isArray(f.nodes) ? f.nodes : null;
    if (!nodeIds || nodeIds.length === 0) {
      problems.push(`${label}: 'nodes' must be a non-empty list of ids`);
    } else {
      for (const id of nodeIds) {
        if (!nodesById.has(id)) problems.push(`${label}: names ${id}, which is not a node`);
      }
    }
    if (!f || !isNonEmptyString(f.finding)) problems.push(`${label}: 'finding' is required`);
    if (!f || !isNonEmptyString(f.proposal)) problems.push(`${label}: 'proposal' is required`);
    // A finding drawn from the drift probe (survey-selection: "a finding
    // anywhere in the sample is a finding on the freeze ... reported as the
    // freeze's failure") is applied exactly like any other finding; `probe`
    // only changes how this run's own summary names it, below.
    if (f && f.probe !== undefined && typeof f.probe !== "boolean") {
      problems.push(`${label}: 'probe' must be a boolean when given`);
    }
    for (const id of nodeIds || []) {
      if (Object.prototype.hasOwnProperty.call(overrides, id)) continue;
      const s = f.stages ? f.stages[id] : undefined;
      if (s === undefined) continue; // omitted: the finding still applies to this node, its stage just isn't moved by it
      if (s !== "periagogic" && s !== "maieutic") {
        problems.push(`${label}: 'stages' for ${id} must be 'periagogic' or 'maieutic', found '${JSON.stringify(s)}'`);
      }
    }

    const opts = f && f.options;
    if (opts !== undefined && opts !== null && !Array.isArray(opts)) {
      problems.push(`${label}: 'options' must be a list of {node, name, text}`);
    } else {
      for (const [j, a] of (Array.isArray(opts) ? opts : []).entries()) {
        const optLabel = `${label}.options[${j}]`;
        if (!a || typeof a !== "object") {
          problems.push(`${optLabel}: must be {node, name, text}`);
          continue;
        }
        if (!isNonEmptyString(a.node) || !nodesById.has(a.node)) {
          problems.push(`${optLabel}: 'node' must name a node, found '${JSON.stringify(a.node)}'`);
        } else if (nodeIds && !nodeIds.includes(a.node)) {
          problems.push(`${optLabel}: proposes an option on ${a.node}, which this finding does not name in 'nodes'`);
        }
        if (!isNonEmptyString(a.name) || !OPTION_NAME_RE.test(a.name) || a.name === "standing") {
          problems.push(`${optLabel}: 'name' must be a lowercase slug and never 'standing', the name the option that stands takes, found '${JSON.stringify(a.name)}'`);
        }
        if (!isNonEmptyString(a.text)) problems.push(`${optLabel}: 'text' is required`);
        if (isNonEmptyString(a.node) && isNonEmptyString(a.name)) {
          const key = `${a.node}\x00${a.name}`;
          if (proposedNames.has(key)) problems.push(`${optLabel}: '${a.name}' is proposed on ${a.node} more than once in this survey`);
          proposedNames.add(key);
        }
      }
    }
    if (f && f.kind === "merge" && !(Array.isArray(opts) && opts.length > 0)) {
      problems.push(`${label}: a 'merge' finding must propose at least one option (the node it goes on, its name, its prose)`);
    }
  });

  // Both review skills state the rule this survey works under: one reply in
  // '--replies' per judged node, and one per node a *kept* frontier finding
  // names -- which is the nodes `applySurvey` will actually write the finding
  // on (`splitFindingNodes`): a node that moved since the survey read it
  // receives nothing, and a finding discarded whole is written nowhere, so no
  // reply is owed in either case. The strong-finding check above already
  // reports some of these ids with a more specific message; this check does
  // not repeat one it already reported.
  const keptFrontierNodeIds = new Set();
  for (const f of frontier) {
    for (const id of splitFindingNodes(f, (id) => pinMoved(id, nodesById, pins)).survivors) {
      keptFrontierNodeIds.add(id);
    }
  }
  const requiresReply = new Set([...judged, ...keptFrontierNodeIds]);
  for (const id of requiresReply) {
    if (reportedMissingReply.has(id)) continue;
    if (!isNonEmptyString(replies[id])) {
      problems.push(`${id}: requires a reply in --replies (judged this run, or named by a kept frontier finding)`);
      reportedMissingReply.add(id);
    }
  }

  // subtree_divergences (frontier-consistency's placement validation,
  // alignment-order): a tangle between two unruled subtrees standing under
  // different options of one ancestor's answer fact, recorded on the leaves
  // and never on the ancestor. `proposedNames` (built above) lets a side
  // name an option this same run's own `frontier` proposes, not only one the
  // ancestor already lists.
  const divergences = Array.isArray(input.subtree_divergences) ? input.subtree_divergences : [];
  const seenAncestors = new Set();
  divergences.forEach((d, i) => {
    const label = d && isNonEmptyString(d.ancestor) ? `subtree_divergences[${i}] (${d.ancestor})` : `subtree_divergences[${i}]`;
    if (!d || !isNonEmptyString(d.ancestor)) problems.push(`${label}: 'ancestor' is required`);
    if (!d || !isNonEmptyString(d.finding)) problems.push(`${label}: 'finding' is required`);

    const sides = d && d.sides;
    const sideNames = sides && typeof sides === "object" && !Array.isArray(sides) ? Object.keys(sides) : null;
    if (!sideNames || sideNames.length === 0) {
      problems.push(`${label}: 'sides' must be a non-empty object of option name to a non-empty list of node ids`);
    }

    const ancestor = d && isNonEmptyString(d.ancestor) ? d.ancestor : null;
    if (ancestor !== null) {
      if (seenAncestors.has(ancestor)) {
        problems.push(`${label}: ${ancestor} is named as the ancestor of more than one entry`);
      }
      seenAncestors.add(ancestor);
      if (!nodesById.has(ancestor)) {
        problems.push(`${label}: names ${ancestor} as its ancestor, which is not a node`);
      } else if (nodesById.get(ancestor).status !== "unanswered") {
        problems.push(`${label}: ${ancestor} is answered; a subtree divergence stands on an ancestor's pending options`);
      }
    }

    const idsSeen = new Map();
    for (const name of sideNames || []) {
      const sideLabel = `${label}.sides['${JSON.stringify(name)}']`;
      const ids = sides[name];
      if (!isNonEmptyString(name)) {
        problems.push(`${label}: an option name in 'sides' must be a non-empty string, found '${JSON.stringify(name)}'`);
      } else if (ancestor !== null) {
        const ancestorNode = nodesById.get(ancestor);
        const alreadyListed = ancestorNode && listedOptionNames(ancestorNode).has(name);
        const addedThisRun = proposedNames.has(`${ancestor}\x00${name}`);
        if (!alreadyListed && !addedThisRun) {
          problems.push(`${label}: '${name}' is not an option on ${ancestor}'s answer fact (not listed, and not added to it by this run's 'frontier')`);
        }
      }
      if (!Array.isArray(ids) || ids.length === 0 || ids.some((x) => !isNonEmptyString(x))) {
        problems.push(`${sideLabel}: must be a non-empty list of node ids, found '${JSON.stringify(ids)}'`);
        continue;
      }
      for (const id of ids) {
        if (!nodesById.has(id)) {
          problems.push(`${sideLabel}: names ${id}, which is not a node`);
          continue;
        }
        const node = nodesById.get(id);
        if (node.status !== "unanswered") {
          problems.push(`${sideLabel}: names ${id}, which is answered; a subtree divergence stands on unruled nodes`);
        }
        if (ancestor !== null && id === ancestor) {
          problems.push(`${sideLabel}: names ${id}, which is this entry's own ancestor`);
        }
        if (idsSeen.has(id)) {
          problems.push(`${label}: ${id} stands under two options ('${idsSeen.get(id)}' and '${name}') of the same ancestor`);
        } else {
          idsSeen.set(id, name);
        }
        const conflict = (node.depends || []).find((dep) => dep.id === ancestor && dep.option !== name);
        if (conflict) {
          problems.push(`${sideLabel}: ${id} already depends on ${ancestor}#${conflict.option}, which conflicts with side '${name}'; not overwritten, refused`);
        }
      }
    }
  });

  // probes: a top-level array (not nested in 'nodes'), since a probe must be
  // able to reach a node the survey did not judge, the same way a 'frontier'
  // finding already can (author-questions, brief-survey.md's output schema).
  if (input.probes !== undefined && input.probes !== null && !Array.isArray(input.probes)) {
    problems.push("'probes' must be a list of {node, asks, why, discharges, and optional fact}");
  } else {
    (Array.isArray(input.probes) ? input.probes : []).forEach((p, i) => {
      const label = `probes[${i}]`;
      if (!p || typeof p !== "object" || Array.isArray(p)) {
        problems.push(`${label} must be a mapping with node, asks, why, discharges, and optional fact`);
        return;
      }
      if (!isNonEmptyString(p.node) || !nodesById.has(p.node)) {
        problems.push(`${label}: 'node' must name a node, found '${JSON.stringify(p.node)}'`);
      }
      pushProbeProblems(problems, p, label);
    });
  }

  return problems;
}

function stageRank(stage) {
  const i = STAGE_ORDER.indexOf(stage);
  if (i === -1) throw new Error(`not a dialogue stage: ${JSON.stringify(stage)}`);
  return i;
}

/**
 * Every node the survey touches -- named in `nodes` (a judged node's reading),
 * named by a `frontier` finding (findings only, at any stage), named by a
 * `probes` entry (any node, judged or not, the same as a finding), listed in
 * `readIds` (a node the survey merely read, by what it answers), or any
 * combination of the four -- keyed by id, in the order first encountered. A
 * finding's proposed options are collected onto the node each goes on, which
 * the checks above have already required the finding to name.
 *
 * `readIds` alone never assigns a stage, adds an option, or raises a probe:
 * `ensure` only guarantees the id has an entry, so `planTouchedNode` reaches
 * it and can merge a read pin, and nothing else about the node moves.
 */
function collectTouched({ nodes, frontier, probes, readIds }) {
  const touched = new Map();
  const ensure = (id) => {
    if (!touched.has(id)) touched.set(id, { nodeEntry: null, findings: [], options: [], probes: [] });
    return touched.get(id);
  };
  for (const entry of nodes || []) {
    ensure(entry.id).nodeEntry = entry;
  }
  for (const id of readIds || []) {
    ensure(id);
  }
  for (const f of frontier || []) {
    const options = Array.isArray(f.options) ? f.options : [];
    // The ids this finding named that moved since the survey read them
    // (`applySurvey` dropped them from `nodes`): still named in the
    // subsection written on the survivors, never written on themselves.
    const droppedIds = Array.isArray(f.dropped) ? f.dropped : [];
    for (const id of f.nodes) {
      ensure(id).findings.push({
        kind: f.kind,
        finding: f.finding,
        proposal: f.proposal,
        stage: f.stages ? f.stages[id] : undefined,
        otherIds: [...f.nodes.filter((x) => x !== id), ...droppedIds],
        droppedIds,
        options,
        // Carried for the register a survey leaves on a judged node: which
        // of the five sections the finding rests on, and the condition that
        // discharges it. Both are optional; `surveyRegister` supplies the
        // conservative default where a reading names neither.
        supports: Array.isArray(f.supports) ? f.supports : null,
        discharges: isNonEmptyString(f.discharges) ? f.discharges : null,
        // Carried only to change this run's summary line for the node
        // (`the freeze failed on <pair>`, not `Frontier finding`); the
        // written subsection and register entry are the same either way.
        probe: f.probe === true,
      });
    }
    for (const a of options) {
      ensure(a.node).options.push({ name: a.name, text: a.text });
    }
  }
  for (const p of probes || []) {
    ensure(p.node).probes.push(p);
  }
  return touched;
}

/**
 * Every node one or more `subtree_divergences` entries touch -- an ancestor
 * (an entry it is the `ancestor` of), a leaf (an entry that names it under
 * one of its `sides`), or both -- keyed by id, each occurrence tagged with
 * the index of the entry it came from (so a report line can be built per
 * entry, not per node) and, for a leaf, the option it stands under.
 * `validateSurvey` has already checked every entry's shape and grounding; this
 * only regroups it by node, which is what the write step below needs.
 */
function collectDivergencePerNode(divergences) {
  const perNode = new Map();
  const ensure = (id) => {
    if (!perNode.has(id)) perNode.set(id, { ancestorOf: [], leafOf: [] });
    return perNode.get(id);
  };
  divergences.forEach((d, entryIndex) => {
    ensure(d.ancestor).ancestorOf.push({ entryIndex, sides: d.sides, finding: d.finding });
    for (const [optionName, ids] of Object.entries(d.sides)) {
      for (const nodeId of ids) {
        ensure(nodeId).leafOf.push({ entryIndex, ancestor: d.ancestor, option: optionName, finding: d.finding });
      }
    }
  });
  return perNode;
}

/**
 * Plan one touched node's edit: the final stage (an override, else the
 * earliest stage among every finding naming it -- periagogic < maieutic <
 * review < ruling -- ignoring a finding that names this node but assigns it
 * no stage; if nothing assigns it one at all, its stage is left exactly as
 * it stands), every subsection to append in input order (the node's own
 * survey reading first, if it has one, then each finding in the order
 * `frontier` lists it), each proposed option not already on the node's answer
 * fact, and, for a judged node, `review.survey` merged into whatever `review`
 * block the node already carries.
 *
 * The node is parsed before the edit and again after it: a node that does not
 * parse after the write is reported and left unwritten, and so is a node
 * whose standing text the edit would move.
 */
async function planTouchedNode(id, t, ctx) {
  let graphName, slug, file;
  try {
    ({ graph: graphName, slug, file } = resolveIdToFile(ctx.manifest, ctx.rootDir, id));
  } catch (err) {
    return { id, problems: [err.message] };
  }

  let rawTextBefore;
  try {
    rawTextBefore = await readFile(file, "utf8");
  } catch (err) {
    return { id, problems: [`${id}: cannot read ${file}: ${err.message}`] };
  }

  const parse = (text) => parseNode(text, { id, graph: graphName, slug, path: file });
  let parsedBefore;
  try {
    parsedBefore = parse(rawTextBefore);
  } catch (err) {
    return { id, problems: [`${id}: does not parse before edit: ${err.message}`] };
  }
  const currentStage = parsedBefore.stage;

  // The survey forwards nothing: only a finding moves a stage.
  const candidates = [];
  for (const f of t.findings) {
    if (f.stage !== undefined) candidates.push(f.stage);
  }

  const hasOverride = Object.prototype.hasOwnProperty.call(ctx.overrides, id);

  // A probe raised on a node the survey is judging, or on one it is not,
  // sets that node to the maieutic the same way; a node already at
  // 'periagogic' stays there. Derived before the candidate reduction below,
  // and applied after it, so it beats whatever the candidates or an override
  // of 'ruling' would otherwise have set (author-questions).
  const existingProbes = parsedBefore.probes || [];
  const probesToAdd = assignProbeIds(existingProbes, t.probes, { source: "review", raised: ctx.date });
  const openProbe = willCarryOpenProbe(existingProbes, probesToAdd.length);

  // No candidate at all means nothing naming this node assigns it a stage
  // (only findings that omitted it from their `stages`): its stage is left
  // exactly as it stands, not forced to any value.
  const stageTouched = hasOverride || candidates.length > 0 || openProbe;
  let finalStage = hasOverride
    ? ctx.overrides[id]
    : candidates.length > 0
      ? candidates.reduce((best, s) => (stageRank(s) < stageRank(best) ? s : best))
      : currentStage;
  if (openProbe) {
    finalStage = stageForOpenProbe(currentStage, finalStage === "periagogic");
  }

  // A node this survey merely read -- no nodeEntry, no finding, no proposed
  // option, no probe -- opens no dialogue and is never asked to carry a
  // stage on that account; it is here only so a read pin can be merged onto
  // it below, and an unstaged settled node (most of what a survey reads by
  // what it answers) is the ordinary case, not a problem.
  const pureRead = !t.nodeEntry && t.findings.length === 0 && t.options.length === 0 && t.probes.length === 0;
  if (!stageTouched && currentStage === null && !pureRead) {
    return {
      id,
      problems: [`${id}: carries no stage, and nothing in this survey names one for it; a finding recorded on a node opens its dialogue, so name its stage in the finding's 'stages' (or in --overrides)`],
    };
  }

  // An option whose name is already on the node's answer fact is skipped,
  // not refused: the record already carries that answer, and a second entry
  // of the same name would not validate.
  const listed = listedOptionNames(parsedBefore);
  const newOptions = [];
  const notes = [];
  for (const a of t.options) {
    if (listed.has(a.name)) {
      notes.push(`${id}: option '${a.name}' is already on this node's answer fact; skipped (the finding is still recorded)`);
      continue;
    }
    listed.add(a.name);
    newOptions.push(a);
  }

  const subsections = [];
  const labels = [];
  let surveyPin = null;

  if (t.nodeEntry) {
    const entry = t.nodeEntry;
    const reply = Object.prototype.hasOwnProperty.call(ctx.replies, id) ? ctx.replies[id] : null;
    subsections.push(renderSubsection({
      kind: "survey",
      date: ctx.date,
      findings: entry.findings,
      counter_argument: entry.counter_argument ?? null,
      strength: entry.strength ?? null,
      facts_check: entry.facts_check ?? null,
      viability: entry.viability ?? null,
      reply,
      of: ctx.pinOf(id),
      accountText: parsedBefore.account,
    }));
    labels.push("Frontier survey");
    surveyPin = surveyBlock({
      date: ctx.date,
      of: ctx.pinOf(id),
      commit: ctx.surveyCommit,
      text: ctx.textOf(id),
      findings: surveyRegister({
        id,
        findings: t.findings,
        before: parsedBefore.review?.survey ?? null,
        text: ctx.textOf(id),
        date: ctx.date,
      }),
      pairs: ctx.pairsOf(id),
    });
    if (ctx.pairsOf(id).length === 0 && ctx.pairsKnown === false) {
      notes.push(`${id}: the survey's selection sidecar (${SELECTION_BASENAME}) was not beside its pins, so no pairs are recorded on this node; the next survey's cut falls back to the survey date, which freezes more than it should`);
    }
  } else {
    // A node this survey read but did not judge (`ctx.readTextOf`, from the
    // pins sidecar's 'read' list) is pinned on the hash of the text it read,
    // whether or not this run otherwise touches it: a read pin never carries
    // `of`, so it never satisfies the survey a review- or ruling-stage node's
    // own ruling owes, but it freezes the node so the next delta can tell it
    // apart from one that moved (`the-whole-reading-is-a-backfill-and-the-
    // delta-is-the-norm`). Any `of`, `findings` or `pairs` the node's block
    // already carries -- a judged pin from an earlier survey -- is kept
    // exactly as it stands beside the refreshed `date`, `commit` and `text`:
    // this never turns a judged pin into a read pin, and never invents a
    // register or a pair list the node was not actually judged to have.
    const readText = ctx.readTextOf(id);
    if (readText !== null) {
      const existing = parsedBefore.review?.survey ?? null;
      surveyPin = surveyBlock({
        date: ctx.date,
        of: existing?.of ?? null,
        commit: ctx.surveyCommit,
        text: readText,
        findings: existing?.findings ?? null,
        pairs: existing?.pairs ?? null,
      });
      labels.push(existing?.of ? "read pin (judged pin kept)" : "read pin");
    }
  }

  for (const f of t.findings) {
    subsections.push(renderFrontierSubsection({
      date: ctx.date,
      kind: f.kind,
      finding: f.finding,
      proposal: f.proposal,
      otherIds: f.otherIds,
      droppedIds: f.droppedIds || [],
      options: f.options,
      id,
    }));
    // A finding the drift probe drew (survey-selection: "a finding anywhere
    // in the sample ... reported as the freeze's failure") is applied like
    // any other finding above; only this run's own summary names it apart,
    // as the freeze's failure on the pair rather than a plain frontier
    // finding, and nothing here forces a whole survey or writes a flag.
    labels.push(f.probe ? `the freeze failed on ${[id, ...f.otherIds].join(" / ")}` : "Frontier finding");
  }
  if (newOptions.length > 0) {
    labels.push(`option${newOptions.length > 1 ? "s" : ""} ${newOptions.map((a) => `'${a.name}'`).join(", ")}`);
  }
  if (probesToAdd.length > 0) {
    labels.push(`probe${probesToAdd.length > 1 ? "s" : ""} ${probesToAdd.map((p) => `'${p.id}'`).join(", ")}`);
  }

  // The draft review's own keys are carried in unchanged: the survey writes
  // its pin beside them and never over them.
  const draft = parsedBefore.review && parsedBefore.review.verdict !== null
    ? {
      verdict: parsedBefore.review.verdict,
      strength: parsedBefore.review.strength,
      date: parsedBefore.review.date,
      of: parsedBefore.review.of,
      against: parsedBefore.review.against,
      commit: parsedBefore.review.commit,
    }
    : null;
  const reviewLines = surveyPin === null
    ? null
    : renderReviewBlock({ ...(draft ?? {}), survey: surveyPin });
  if (surveyPin !== null && draft !== null) labels.push("draft review kept");

  const build = () => {
    let text = appendAnswerOptionSubsections(rawTextBefore, newOptions);
    for (const s of subsections) text = appendToAccount(text, s);
    return upsertDialogueFields(text, {
      stage: stageTouched ? finalStage : null,
      reviewLines,
      options: newOptions.map((a) => ({ name: a.name })),
      date: ctx.date,
      probesAdd: probesToAdd,
    });
  };

  let text;
  let parsedAfter;
  try {
    text = build();
    parsedAfter = parse(text);
  } catch (err) {
    return { id, problems: [`${id}: does not parse after edit: ${err.message}`] };
  }
  if (parsedAfter.standingHash !== parsedBefore.standingHash) {
    return { id, problems: [`${id}: internal error -- the standing hash changed by the edit (${parsedBefore.standingHash} -> ${parsedAfter.standingHash}); this script writes dialogue state and the account only`] };
  }
  // This guard's job is "this edit must not move the recommendation hash",
  // and what it compares against depends on whether this node was judged
  // this run. For a node judged this run (`t.nodeEntry`), the pin's `of` is
  // this run's own stamp of the recommendation, so the freshly parsed hash
  // must still equal it. For a node this survey merely read, `surveyPin.of`
  // may be an already-judged pin's `of` kept from an earlier survey
  // (labelled "read pin (judged pin kept)" above) -- by design stale
  // against the node's current recommendation, since a read pin never
  // satisfies an owed survey and the frontier shows the node as moved past
  // it. Checking a read node's freshly parsed hash against that stale `of`
  // would fire on drift the survey never touched; what this edit itself
  // must not move is checked against `parsedBefore`'s hash instead. A plain
  // read pin (`surveyPin.of` null) pins no recommendation and has none to
  // check either way.
  //
  // Recording an option beside the recommendation does not move that hash:
  // under `survey-selection`'s `a-pin-moves-on-what-binds-the-node` the pin
  // is taken over what binds the node -- the question, which option the
  // answer fact recommends, that option's sentence, its resolved content and
  // its ledger addresses, and the status any option carries -- so a rival
  // recorded with no status contributes nothing to it (derive.mjs
  // `contentFactRecommendationHash`). This branch therefore fires only where
  // an option this run wrote carries a status or where what the fact
  // recommends moved, neither of which the survey's own write does today;
  // the note stands for that case, and any other movement is still refused.
  if (surveyPin !== null && surveyPin.of !== null && surveyPin.of !== undefined) {
    const judgedThisRun = Boolean(t.nodeEntry);
    const fromHash = judgedThisRun ? surveyPin.of : parsedBefore.recommendationHash;
    if (parsedAfter.recommendationHash !== fromHash) {
      if (newOptions.length > 0) {
        notes.push(`${id}: recording option${newOptions.length > 1 ? "s" : ""} ${newOptions.map((a) => `'${a.name}'`).join(", ")} moved the recommendation hash (${fromHash} -> ${parsedAfter.recommendationHash}); a pin moves on what binds the node, so an option recorded beside the recommendation moves it only where the option carries a status or changes what the fact recommends; the node stands as moved past its survey pin and is judged again by the next survey`);
      } else {
        return { id, problems: [`${id}: internal error -- the edit moved the recommendation hash (${fromHash} -> ${parsedAfter.recommendationHash}); the survey's pin must name the recommendation as it stands`] };
      }
    }
  }

  return { id, file, labels, notes, oldStage: currentStage, newStage: finalStage, rawTextBefore, rawTextAfter: text };
}

/**
 * Plan one node's subtree-divergence edits, layered on top of whatever
 * `existingPlan` (from `planTouchedNode`, or null) already has for this node:
 * a '### Subtree divergence' subsection per entry it is the ancestor or a
 * leaf of, and, for a leaf, a `depends` entry, unless it already carries
 * exactly that entry (skipped, and reported via `skips`, not refused --
 * `validateSurvey` has already refused the run outright over a genuine
 * conflict, a different option on the same ancestor). A subtree divergence
 * never touches `stage`, the facts, or anything hash-bearing, so
 * `oldStage`/`newStage` are always equal here, and layering these edits onto
 * an existing plan cannot change the stage that plan already settled on.
 *
 * Parsed before and after, like every other write in this file: a node that
 * does not parse after the edit, or whose standing hash the edit moved, is
 * reported and left unwritten.
 */
async function planDivergenceNode(id, entry, ctx, existingPlan) {
  let graphName, slug, file;
  try {
    ({ graph: graphName, slug, file } = resolveIdToFile(ctx.manifest, ctx.rootDir, id));
  } catch (err) {
    return { id, problems: [err.message] };
  }

  let rawTextBefore;
  try {
    rawTextBefore = existingPlan ? existingPlan.rawTextBefore : await readFile(file, "utf8");
  } catch (err) {
    return { id, problems: [`${id}: cannot read ${file}: ${err.message}`] };
  }

  const parse = (text) => parseNode(text, { id, graph: graphName, slug, path: file });
  let parsedBefore;
  try {
    parsedBefore = parse(rawTextBefore);
  } catch (err) {
    return { id, problems: [`${id}: does not parse before edit: ${err.message}`] };
  }
  const existingDepends = parsedBefore.depends || [];

  const subsections = [];
  const labels = existingPlan ? [...existingPlan.labels] : [];
  const dependsAdd = [];
  const skips = [];

  for (const a of entry.ancestorOf) {
    subsections.push(renderAncestorDivergenceSubsection({ date: ctx.date, sides: a.sides, finding: a.finding }));
    labels.push("Subtree divergence");
  }
  for (const l of entry.leafOf) {
    if (existingDepends.some((d) => d.id === l.ancestor && d.option === l.option)) {
      skips.push({ entryIndex: l.entryIndex, id });
    } else {
      dependsAdd.push(`${l.ancestor}#${l.option}`);
    }
    subsections.push(renderLeafDivergenceSubsection({ date: ctx.date, ancestor: l.ancestor, option: l.option, finding: l.finding }));
    labels.push("Subtree divergence");
  }

  let text = existingPlan ? existingPlan.rawTextAfter : rawTextBefore;
  try {
    for (const s of subsections) text = appendToAccount(text, s);
    text = upsertDialogueFields(text, { stage: null, reviewLines: null, options: [], dependsAdd });
  } catch (err) {
    return { id, problems: [`${id}: ${err.message}`] };
  }

  let parsedAfter;
  try {
    parsedAfter = parse(text);
  } catch (err) {
    return { id, problems: [`${id}: does not parse after edit: ${err.message}`] };
  }
  if (parsedAfter.standingHash !== parsedBefore.standingHash) {
    return { id, problems: [`${id}: internal error -- the standing hash changed by the edit (${parsedBefore.standingHash} -> ${parsedAfter.standingHash}); this script writes dialogue state and the account only`] };
  }

  return {
    id,
    file,
    labels,
    notes: existingPlan ? existingPlan.notes : [],
    oldStage: existingPlan ? existingPlan.oldStage : parsedBefore.stage,
    newStage: existingPlan ? existingPlan.newStage : parsedBefore.stage,
    rawTextBefore,
    rawTextAfter: text,
    skips,
  };
}

/**
 * Apply the survey: `validateSurvey` first, refusing (writing nothing) on any
 * problem; then the pin, which serializes this reading in place of a lock --
 * a judged node whose recommendation still matches what the survey read is
 * applied, one that has moved receives nothing and is reported, and a finding
 * naming a node that has moved keeps its entries on the nodes that did not,
 * losing the moved ones with a note that names them -- unless every id it
 * names moved, or it is a `merge` or `decomposition`, either of which is
 * discarded whole. Then plan every surviving touched node, layer every subtree
 * divergence onto the same plans, refuse (still writing nothing) on any
 * planning problem, and otherwise write every plan and report.
 */
async function applySurvey({ rootDir, manifest, input, pins, selection = null, replies, overrides, date, dry }) {
  const graph = await readGraph(rootDir);
  const checkProblems = validateSurvey(input, graph, { replies, overrides, pins });
  if (checkProblems.length > 0) {
    throw new Error(checkProblems.join("\n"));
  }

  const effectiveDate = date ?? input.date ?? todayIso();
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const pinOf = (id) => pins.pins[id];
  const moved = (id) => pinMoved(id, nodesById, pins);

  const movedReport = [];
  const keptNodes = [];
  for (const entry of Array.isArray(input.nodes) ? input.nodes : []) {
    const m = moved(entry.id);
    if (m.moved) {
      movedReport.push(`${entry.id}: moved since the survey read it (pinned ${m.pin ?? "nothing"}, now ${m.now ?? "gone"}); nothing written, judged again by the next survey`);
      continue;
    }
    keptNodes.push(entry);
  }

  // A finding is discarded per support, not per finding (`survey-selection`:
  // "A finding whose support is unmoved is carried forward ...; a finding one
  // of whose supports moved is re-derived"). The supports of a finding
  // recorded per node are the nodes it names, so the ids that moved are
  // dropped, the finding is applied to the ids that did not, and both the
  // report and the subsection written on each survivor name what was dropped
  // and why. Two cases still discard whole: a finding every one of whose ids
  // moved, which has no survivor to stand on, and a `merge` or
  // `decomposition` finding, whose object is the set of nodes it spans
  // (WHOLE_OR_NOTHING_KINDS). An option proposed on a dropped id goes with
  // it, since the answer fact it would be recorded on is on text this
  // reading no longer attests to.
  const discardedReport = [];
  const keptFrontier = [];
  (Array.isArray(input.frontier) ? input.frontier : []).forEach((f, i) => {
    const { stale, staleIds, survivors, whole } = splitFindingNodes(f, moved);
    if (stale.length === 0) {
      keptFrontier.push(f);
      return;
    }
    const which = stale.map((m) => `${m.id} (pinned ${m.pin ?? "nothing"}, now ${m.now ?? "gone"})`).join(", ");
    if (whole) {
      const because = WHOLE_OR_NOTHING_KINDS.has(f.kind)
        ? `a ${f.kind} finding's object is the set of nodes it spans, so it is applied whole or not at all, and it is applied to none of its nodes`
        : "applied to none of its nodes";
      discardedReport.push(`frontier[${i}] (${f.kind}): discarded — names ${which}, moved since the survey read it; ${because}`);
      return;
    }
    const options = Array.isArray(f.options) ? f.options : [];
    const keptOptions = options.filter((a) => !staleIds.has(a.node));
    const droppedOptions = options.filter((a) => staleIds.has(a.node));
    const optionText = droppedOptions.length > 0
      ? `; the option${droppedOptions.length > 1 ? "s" : ""} it proposed there (${droppedOptions.map((a) => `'${a.name}' on ${a.node}`).join(", ")}) went with ${droppedOptions.length > 1 ? "them" : "it"}`
      : "";
    discardedReport.push(`frontier[${i}] (${f.kind}): applied to ${survivors.join(", ")}; not applied to ${which}, moved since the survey read it${optionText}; re-derived there by the next survey`);
    keptFrontier.push({ ...f, nodes: survivors, dropped: [...staleIds], options: keptOptions });
  });

  // A probe attests to the text it read, the same as a finding: one naming a
  // node that has moved since the survey read it is discarded rather than
  // written against text the reading never saw.
  const keptProbes = [];
  (Array.isArray(input.probes) ? input.probes : []).forEach((p, i) => {
    const m = moved(p.node);
    if (m.moved) {
      discardedReport.push(`probes[${i}] (${p.node}): discarded — moved since the survey read it (pinned ${m.pin ?? "nothing"}, now ${m.now ?? "gone"}); not written`);
      return;
    }
    keptProbes.push(p);
  });

  const notes = [];
  if (isNonEmptyString(input.commit) && isNonEmptyString(pins.commit) && input.commit !== pins.commit) {
    notes.push(`note: the survey names graph commit ${input.commit}, the pins sidecar ${pins.commit}; the sidecar's hashes decide, as they are what this run compared against`);
  }

  // What the survey leaves on each judged node beside its pin: the commit it
  // read, the five section hashes of the text it read (both from the pins
  // sidecar, which is what this run compared against, and never re-derived
  // from a tree that may have moved between the brief and the apply), and the
  // pairs it actually read that touch that node -- the live pairs and the
  // drift probe from the selection sidecar, never a frozen pair, since the
  // next survey's cut is taken over exactly what is recorded here.
  const surveyCommit = isNonEmptyString(pins.commit) ? pins.commit : null;
  const textOf = (id) => (pins.text && pins.text[id]) || null;
  const pairsKnown = selection !== null;
  const pairsByNode = new Map();
  for (const p of readPairs(selection)) {
    for (const [self, other] of [[p.a, p.b], [p.b, p.a]]) {
      if (!isNonEmptyString(self) || !isNonEmptyString(other)) continue;
      if (!pairsByNode.has(self)) pairsByNode.set(self, []);
      pairsByNode.get(self).push({ with: other, keys: Array.isArray(p.keys) ? p.keys : [] });
    }
  }
  const pairsOf = (id) => pairsByNode.get(id) || [];

  // The pins sidecar's 'read' list (brief.mjs's surveyPins): every node this
  // survey carried by what it answers, with the five section hashes as read.
  // A node whose current section hashes no longer match what was read is
  // moved, exactly as a judged node's recommendation hash moving discards
  // its entry above -- reported and left unpinned, read again by the next
  // survey. Absent 'read' (the sidecar before brief.mjs's own migration)
  // pins nothing here, same as an empty list.
  const readEntries = Array.isArray(pins.read) ? pins.read : [];
  const readTextById = new Map();
  for (const entry of readEntries) {
    const node = nodesById.get(entry.id);
    if (node === undefined) {
      movedReport.push(`${entry.id}: read pin skipped — not a node of this graph`);
      continue;
    }
    const now = sectionHashes(node, graph.words);
    const movedKeys = movedSections(entry.text || {}, now);
    if (movedKeys.length > 0) {
      movedReport.push(`${entry.id}: moved since the survey read it (${movedKeys.join(", ")} changed); not pinned, read again by the next survey`);
      continue;
    }
    readTextById.set(entry.id, entry.text);
  }
  const readTextOf = (id) => readTextById.get(id) ?? null;

  const ctx = {
    rootDir, manifest, replies, overrides, date: effectiveDate, pinOf,
    surveyCommit, textOf, pairsOf, pairsKnown, readTextOf,
  };

  const touched = collectTouched({
    nodes: keptNodes, frontier: keptFrontier, probes: keptProbes,
    readIds: [...readTextById.keys()],
  });
  const plans = [];
  const planProblems = [];
  for (const [id, t] of touched) {
    const plan = await planTouchedNode(id, t, ctx);
    if (plan.problems) planProblems.push(...plan.problems);
    else plans.push(plan);
  }

  const divergences = Array.isArray(input.subtree_divergences) ? input.subtree_divergences : [];
  const perNodeDivergence = collectDivergencePerNode(divergences);
  const plansById = new Map(plans.map((p) => [p.id, p]));
  const divergenceSkips = new Map(); // entryIndex -> id[]
  for (const [id, entry] of perNodeDivergence) {
    const existingPlan = plansById.get(id) ?? null;
    const result = await planDivergenceNode(id, entry, ctx, existingPlan);
    if (result.problems) {
      planProblems.push(...result.problems);
      continue;
    }
    for (const sk of result.skips) {
      if (!divergenceSkips.has(sk.entryIndex)) divergenceSkips.set(sk.entryIndex, []);
      divergenceSkips.get(sk.entryIndex).push(sk.id);
    }
    if (existingPlan) {
      Object.assign(existingPlan, result);
    } else {
      plans.push(result);
      plansById.set(id, result);
    }
  }

  if (planProblems.length > 0) {
    throw new Error(planProblems.join("\n"));
  }

  const planReport = plans.map((p) => `${p.id}: ${p.labels.join(" + ")}, ${p.oldStage ?? "no stage"} → ${p.newStage ?? "no stage"}`);
  const planNotes = plans.flatMap((p) => p.notes || []);
  const divergenceReport = divergences.map((d, i) => {
    const counts = Object.entries(d.sides).map(([name, ids]) => `${name} ${ids.length}`).join(", ");
    const skipped = divergenceSkips.get(i) || [];
    const skipText = skipped.length > 0 ? `; already present, skipped: ${skipped.join(", ")}` : "";
    return `subtree divergence on ${d.ancestor}: ${counts}${skipText}`;
  });
  const allNotes = [...notes, ...planNotes];
  const report = [...planReport, ...allNotes, ...divergenceReport, ...movedReport, ...discardedReport];

  if (dry) {
    return { plans, report, validation: null, notes: allNotes, moved: movedReport, discarded: discardedReport };
  }

  for (const p of plans) {
    await writeFile(p.file, p.rawTextAfter);
  }

  let validation;
  try {
    await readGraph(rootDir);
    validation = { ok: true };
  } catch (err) {
    validation = { ok: false, message: err.message };
  }

  return { plans, report, validation, notes: allNotes, moved: movedReport, discarded: discardedReport };
}

/**
 * Apply one reading, read from the input's own `scope`: the review of one
 * draft, or the survey of the frontier. Every check runs before any file is
 * touched, and a run with any problem writes nothing at all; unless `dry`,
 * `readGraph` runs once afterward and the result reports (without reverting)
 * whether the graph still validates.
 *
 * @returns {Promise<{plans: object[], report: string[],
 *   validation: {ok:boolean, message?:string}|null, notes: string[]}>}
 */
export async function applyReviews({
  rootDir,
  file = null,
  input: providedInput = null,
  pins: providedPins = null,
  pinsFile = null,
  selection: providedSelection = null,
  selectionFile = null,
  replies = {},
  overrides = {},
  date = null,
  dry = false,
}) {
  const manifest = await loadManifest(rootDir);

  let input = providedInput;
  if (input === null) {
    if (file === null) throw new Error(USAGE);
    input = JSON.parse(await readFile(path.resolve(file), "utf8"));
  }
  if (!input || typeof input !== "object" || Array.isArray(input) || !SCOPES.has(input.scope)) {
    throw new Error(`the input names no reading: 'scope' must be 'draft' (the review of one draft), 'delta' (the re-reading of an amendment), or 'survey' (the survey of the frontier), found '${JSON.stringify(input && input.scope)}'`);
  }

  if (input.scope === "draft" || input.scope === "delta") {
    return applyDraft({ rootDir, manifest, input, replies, overrides, date, dry });
  }

  let pins = providedPins;
  let pinsFrom = null;
  if (pins === null) {
    const from = pinsFile ?? (file === null ? null : path.join(path.dirname(path.resolve(file)), PINS_BASENAME));
    pinsFrom = from;
    if (from === null) {
      throw new Error(`the survey is serialized by its pins: give --pins <file>, or put ${PINS_BASENAME} beside the input`);
    }
    try {
      pins = JSON.parse(await readFile(path.resolve(from), "utf8"));
    } catch (err) {
      throw new Error(`cannot read the survey's pins at ${from}: ${err.message}\nbrief.mjs --survey writes it beside the brief; a survey applied without it is applied to text no reading attests to`);
    }
    checkPinsShape(pins, from);
  } else {
    checkPinsShape(pins, "the pins given");
  }

  // The selection sidecar is optional, and its absence is not an error: a
  // survey applied without it records no pairs on the nodes it judged, and
  // says so per node. It is looked for beside the pins, which is where
  // brief.mjs writes both.
  let selection = providedSelection;
  if (selection === null) {
    const beside = selectionFile
      ?? (pinsFrom !== null ? path.join(path.dirname(path.resolve(pinsFrom)), SELECTION_BASENAME) : null);
    if (beside !== null) {
      try {
        selection = JSON.parse(await readFile(path.resolve(beside), "utf8"));
      } catch {
        selection = null;
      }
    }
  }

  return applySurvey({ rootDir, manifest, input, pins, selection, replies, overrides, date, dry });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  (async () => {
    let opts;
    try {
      opts = parseArgs(process.argv.slice(2));
    } catch (err) {
      process.stderr.write(`${err.message}\n`);
      process.exitCode = 1;
      return;
    }
    const rootDir = path.resolve(process.cwd(), "disposition");
    try {
      const [replies, overrides] = await Promise.all([
        loadJsonMap(opts.repliesFile),
        loadJsonMap(opts.overridesFile),
      ]);
      const result = await applyReviews({
        rootDir,
        file: opts.file,
        pinsFile: opts.pinsFile,
        selectionFile: opts.selectionFile,
        replies,
        overrides,
        date: opts.date,
        dry: opts.dry,
      });
      for (const line of result.report) console.log(line);
      if (opts.dry) {
        console.log(`(dry run: ${result.plans.length} node(s) planned, nothing written)`);
      } else if (result.validation && !result.validation.ok) {
        console.error("readGraph reports problems after writing (not reverted):");
        console.error(result.validation.message);
        process.exitCode = 1;
      }
    } catch (err) {
      process.stderr.write(`${err.message}\n`);
      process.exitCode = 1;
    }
  })();
}
