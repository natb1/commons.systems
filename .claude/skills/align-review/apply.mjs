#!/usr/bin/env node
// .claude/skills/align-review/apply.mjs
//
// Applies what one clean-context reading found (SKILL.md §4, and the
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
//    facts_check, viability, counter_argument, strength}
// the review of one draft. One node, at the review stage: '### Clean-context
// review, <date>' on its account, `stage: ruling` on a forward or the named
// stage on a kickback, and the four draft keys of `review` pinned to
// `deriveRecommendationHash` of the node as edited. A survey pin the node
// already carries is preserved: the `review:` block is merged, never replaced
// wholesale.
//
//   {scope: "survey", commit, date, nodes: [{id, findings, ...}],
//    frontier: [finding], subtree_divergences: [divergence]}
// the survey of the frontier. Serialized by its pin and by no lock: the
// sidecar `survey.pins.json`, written beside the brief by brief.mjs, holds
// the graph commit the survey read, the ids it judged, and the recommendation
// hash of every node of the graph. A judged node whose recommendation still
// matches its pin receives `review.survey` and its findings; one that has
// moved receives nothing and is reported. A `frontier` finding naming any
// node that has moved is discarded with a note and applied to none of its
// nodes, for the same reason: a review attests to the text it read.
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

import { readGraph, parseNode } from "../../../packages/disposition/read.mjs";

const STAGE_ORDER = ["periagogic", "maieutic", "review", "ruling"];
// the two stages a reading may send a node back to: the ground, or the draft
// (frontier-consistency: "the periagogic stage when the ground or the
// author's words are in question, the maieutic when the answer must be
// redrafted").
const KICKBACK_STAGES = ["periagogic", "maieutic"];
const SCOPES = new Set(["draft", "survey"]);
const FRONTIER_KINDS = new Set([
  "contradiction", "supersession", "redundancy", "decomposition",
  "vocabulary", "cross-reference", "placement", "coverage",
  // added 2026-09-03 with the fifteenth validation and the staleness a pin
  // makes visible (frontier-consistency); under the encoding of 2026-09-04
  // that staleness is `reviewStale`, a review whose `of` no longer matches
  // what the node recommends.
  "merge", "stale-recommendation",
]);
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

const USAGE = "usage: node apply.mjs <json file> --replies <file> [--overrides <file>] [--pins <file>] [--date YYYY-MM-DD] [--dry]";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function parseArgs(argv) {
  const files = [];
  const opts = { repliesFile: null, overridesFile: null, pinsFile: null, date: null, dry: false };
  const valueFlags = { "--replies": "repliesFile", "--overrides": "overridesFile", "--pins": "pinsFile", "--date": "date" };
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
  let end = start + 1;
  while (end < fmLines.length && /^[ \t]/.test(fmLines[end]) && fmLines[end].trim() !== "") end += 1;
  return [start, end];
}

function indentOf(line) {
  return (line.match(/^[ \t]*/) || [""])[0];
}

// an all-digit sha1 would parse as a YAML integer and fail the reader's
// `of: <sha1>` check, so it is quoted; every other hash is left bare, as
// the record already writes it.
function hashScalar(of) {
  return /^\d+$/.test(of) ? `"${of}"` : of;
}

/**
 * The `review:` block, in the two readings the review divides into: the four
 * draft keys plus the draft's own optional `against` (this reading's
 * strongest counter-argument, beside its `strength`), the survey's own
 * `date` and `of`, or either alone -- read.mjs accepts each half without the
 * other. Whichever half this run does not write is carried in from the node
 * as it stands, so a draft's forward never discards the survey's pin and the
 * survey never discards a verdict (or the counter-argument beside it).
 */
function renderReviewBlock({ verdict = null, strength = null, date = null, of = null, against = null, survey = null }) {
  const lines = ["review:"];
  if (verdict !== null) {
    lines.push(`  verdict: ${verdict}`, `  strength: ${strength}`, `  date: ${date}`, `  of: ${hashScalar(of)}`);
    if (against !== null) lines.push(`  against: ${against}`);
  }
  if (survey !== null) {
    lines.push("  survey:", `    date: ${survey.date}`, `    of: ${hashScalar(survey.of)}`);
  }
  return lines;
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
  let listEnd = optionsIdx + 1;
  while (listEnd < itemEnd && indentOf(lines[listEnd]).length > keyIndent.length) listEnd += 1;
  const firstOption = lines.slice(optionsIdx + 1, listEnd).find((l) => /^\s*- /.test(l));
  const optionIndent = firstOption ? indentOf(firstOption) : `${keyIndent}  `;
  lines.splice(listEnd, 0, ...options.flatMap((o) => renderOptionEntry({ ...o, date }, optionIndent)));
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
 * `review`, `depends`.
 */
function upsertDialogueFields(rawText, { stage, reviewLines, options = [], date = null, dependsAdd = [] }) {
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

  return joinRaw(fmLines, bodyLines);
}

// ------------------------------------------------------------------ prose

/**
 * The subsection one reading appends to the node it read: the draft's review,
 * with its verdict, or the survey's reading of that node, which has none --
 * the survey forwards nothing, and only its findings move a stage. The fields
 * are the same in both, and each is omitted where the reading did not produce
 * it.
 */
function renderSubsection({
  kind = "draft", date, verdict, kickback_stage: kickbackStage, findings,
  counter_argument: counterArgument, strength, facts_check: factsCheck, viability, reply,
}) {
  const parts = kind === "survey"
    ? [
      `### Frontier survey, ${date}`,
      "",
      "Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.",
    ]
    : [
      `### Clean-context review, ${date}`,
      "",
      `Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. ${verdict === "forward" ? "Verdict: forward to the author's ruling." : `Verdict: kicked back to the ${kickbackStage} stage.`}`,
    ];

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
 */
function renderFrontierSubsection({ date, kind, finding, proposal, otherIds, options, id }) {
  const namedLine = otherIds.length > 0 ? `Also named: ${otherIds.join(", ")}.` : "Names only this node.";
  const parts = [`### Frontier finding, ${date}`, "", `Kind: ${kind}.`, "", finding, "", namedLine, "", `Proposed: ${proposal}`];
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
  if (input.strength === "strong" && !Object.prototype.hasOwnProperty.call(replies, input.id)) {
    problems.push(`${input.id}: strength 'strong' requires a reply in --replies`);
  }
  if (Array.isArray(input.nodes) || Array.isArray(input.frontier)) {
    problems.push("a draft review reads one node: 'nodes' and 'frontier' belong to the survey, and this file names scope 'draft'");
  }
  return problems;
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

  const newStage = hasOverride ? ctx.overrides[id] : input.verdict === "forward" ? "ruling" : input.kickback_stage;
  const reply = Object.prototype.hasOwnProperty.call(ctx.replies, id) ? ctx.replies[id] : null;
  const subsection = renderSubsection({
    kind: "draft",
    date: ctx.date,
    verdict: input.verdict,
    kickback_stage: input.kickback_stage ?? null,
    findings: input.findings,
    counter_argument: input.counter_argument ?? null,
    strength: input.strength,
    facts_check: input.facts_check ?? null,
    viability: input.viability ?? null,
    reply,
  });

  const survey = (parsedBefore.review && parsedBefore.review.survey) || null;
  const against = input.counter_argument ?? null;
  const build = (of) => upsertDialogueFields(appendToAccount(rawTextBefore, subsection), {
    stage: newStage,
    reviewLines: renderReviewBlock({ verdict: input.verdict, strength: input.strength, date: ctx.date, of, against, survey }),
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

  const labels = [`Clean-context review (${input.verdict})`];
  if (survey) labels.push("survey pin kept");
  return { id, file, labels, notes: [], oldStage: currentStage, newStage, rawTextBefore, rawTextAfter: settled.text };
}

async function applyDraft({ rootDir, manifest, input, replies, overrides, date, dry }) {
  const checkProblems = validateDraft(input, { replies });
  if (checkProblems.length > 0) throw new Error(checkProblems.join("\n"));

  const ctx = { rootDir, manifest, replies, overrides, date: date ?? input.date ?? todayIso() };
  const plan = await planDraft(input, ctx);
  if (plan.problems) throw new Error(plan.problems.join("\n"));

  const plans = [plan];
  const report = [`${plan.id}: ${plan.labels.join(" + ")}, ${plan.oldStage ?? "no stage"} → ${plan.newStage ?? "no stage"}`];

  if (dry) return { plans, report, validation: null, notes: [] };

  await writeFile(plan.file, plan.rawTextAfter);
  let validation;
  try {
    await readGraph(rootDir);
    validation = { ok: true };
  } catch (err) {
    validation = { ok: false, message: err.message };
  }
  return { plans, report, validation, notes: [] };
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
  return pins;
}

// ----------------------------------------------------------- survey checks
//
// frontier-consistency's and clean-context-review's own checks, run once over
// the whole reading before any file is touched: every entry naming a node the
// survey judged, no node twice; every finding shaped and grounded, its named
// nodes real; every proposed option shaped, named on a node the finding
// names, and not already on that node's answer fact; a strong
// counter-argument answered.
function validateSurvey(input, graph, { replies, overrides, pins }) {
  const problems = [];
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const judged = new Set(pins.judged);

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
    if (entry.strength === "strong" && !Object.prototype.hasOwnProperty.call(replies, entry.id)) {
      problems.push(`${entry.id}: strength 'strong' requires a reply in --replies`);
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

  return problems;
}

function stageRank(stage) {
  const i = STAGE_ORDER.indexOf(stage);
  if (i === -1) throw new Error(`not a dialogue stage: ${JSON.stringify(stage)}`);
  return i;
}

/**
 * Every node the survey touches -- named in `nodes` (a judged node's reading),
 * named by a `frontier` finding (findings only, at any stage), or both --
 * keyed by id, in the order first encountered. A finding's proposed options
 * are collected onto the node each goes on, which the checks above have
 * already required the finding to name.
 */
function collectTouched({ nodes, frontier }) {
  const touched = new Map();
  const ensure = (id) => {
    if (!touched.has(id)) touched.set(id, { nodeEntry: null, findings: [], options: [] });
    return touched.get(id);
  };
  for (const entry of nodes || []) {
    ensure(entry.id).nodeEntry = entry;
  }
  for (const f of frontier || []) {
    const options = Array.isArray(f.options) ? f.options : [];
    for (const id of f.nodes) {
      ensure(id).findings.push({
        kind: f.kind,
        finding: f.finding,
        proposal: f.proposal,
        stage: f.stages ? f.stages[id] : undefined,
        otherIds: f.nodes.filter((x) => x !== id),
        options,
      });
    }
    for (const a of options) {
      ensure(a.node).options.push({ name: a.name, text: a.text });
    }
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
  // No candidate at all means nothing naming this node assigns it a stage
  // (only findings that omitted it from their `stages`): its stage is left
  // exactly as it stands, not forced to any value.
  const stageTouched = hasOverride || candidates.length > 0;
  const finalStage = hasOverride
    ? ctx.overrides[id]
    : candidates.length > 0
      ? candidates.reduce((best, s) => (stageRank(s) < stageRank(best) ? s : best))
      : currentStage;

  if (!stageTouched && currentStage === null) {
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
    }));
    labels.push("Frontier survey");
    surveyPin = { date: ctx.date, of: ctx.pinOf(id) };
  }

  for (const f of t.findings) {
    subsections.push(renderFrontierSubsection({
      date: ctx.date,
      kind: f.kind,
      finding: f.finding,
      proposal: f.proposal,
      otherIds: f.otherIds,
      options: f.options,
      id,
    }));
    labels.push("Frontier finding");
  }
  if (newOptions.length > 0) {
    labels.push(`option${newOptions.length > 1 ? "s" : ""} ${newOptions.map((a) => `'${a.name}'`).join(", ")}`);
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
  if (surveyPin !== null && parsedAfter.recommendationHash !== surveyPin.of) {
    return { id, problems: [`${id}: internal error -- the edit moved the recommendation hash (${surveyPin.of} -> ${parsedAfter.recommendationHash}); the survey's pin must name the recommendation as it stands`] };
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
 * naming any node that has moved is discarded and applied to none of its
 * nodes. Then plan every surviving touched node, layer every subtree
 * divergence onto the same plans, refuse (still writing nothing) on any
 * planning problem, and otherwise write every plan and report.
 */
async function applySurvey({ rootDir, manifest, input, pins, replies, overrides, date, dry }) {
  const graph = await readGraph(rootDir);
  const checkProblems = validateSurvey(input, graph, { replies, overrides, pins });
  if (checkProblems.length > 0) {
    throw new Error(checkProblems.join("\n"));
  }

  const effectiveDate = date ?? input.date ?? todayIso();
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const pinOf = (id) => pins.pins[id];
  const moved = (id) => {
    const node = nodesById.get(id);
    const pin = pins.pins[id];
    if (node === undefined) return { moved: true, pin: pin ?? null, now: null };
    if (pin === undefined) return { moved: true, pin: null, now: node.recommendationHash };
    return { moved: pin !== node.recommendationHash, pin, now: node.recommendationHash };
  };

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

  const discardedReport = [];
  const keptFrontier = [];
  (Array.isArray(input.frontier) ? input.frontier : []).forEach((f, i) => {
    const stale = f.nodes.map((id) => ({ id, ...moved(id) })).filter((m) => m.moved);
    if (stale.length > 0) {
      const which = stale.map((m) => `${m.id} (pinned ${m.pin ?? "nothing"}, now ${m.now ?? "gone"})`).join(", ");
      discardedReport.push(`frontier[${i}] (${f.kind}): discarded — names ${which}, moved since the survey read it; applied to none of its nodes`);
      return;
    }
    keptFrontier.push(f);
  });

  const notes = [];
  if (isNonEmptyString(input.commit) && isNonEmptyString(pins.commit) && input.commit !== pins.commit) {
    notes.push(`note: the survey names graph commit ${input.commit}, the pins sidecar ${pins.commit}; the sidecar's hashes decide, as they are what this run compared against`);
  }

  const ctx = { rootDir, manifest, replies, overrides, date: effectiveDate, pinOf };

  const touched = collectTouched({ nodes: keptNodes, frontier: keptFrontier });
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
    throw new Error(`the input names no reading: 'scope' must be 'draft' (the review of one draft) or 'survey' (the survey of the frontier), found '${JSON.stringify(input && input.scope)}'`);
  }

  if (input.scope === "draft") {
    return applyDraft({ rootDir, manifest, input, replies, overrides, date, dry });
  }

  let pins = providedPins;
  if (pins === null) {
    const from = pinsFile ?? (file === null ? null : path.join(path.dirname(path.resolve(file)), PINS_BASENAME));
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

  return applySurvey({ rootDir, manifest, input, pins, replies, overrides, date, dry });
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
