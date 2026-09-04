#!/usr/bin/env node
// .claude/skills/align-review/apply.mjs
//
// Applies clean-context review verdicts (see brief.md, SKILL.md §4, and the
// disposition-graph nodes clean-context-review/recording/dialogue/
// frontier-consistency) to node files: appends the reviewer's account to
// '## Account', records a proposed merge or split as a pending alternative on
// the node it would change, and writes the dialogue frontmatter (`stage`,
// `review`, `alternatives`) the verdict and the findings imply. The reviewer
// only recommends; this script is the mechanical half of "the session decides
// and answers for the record" -- replies and overrides are supplied by the
// caller, never invented here.
//
// Usage:
//   node apply.mjs <json file> --replies <file> \
//     [--overrides <file>] [--date YYYY-MM-DD] [--dry] [--fields-only]
//
// The one <json file> is normally the batch frontier-consistency.md and
// clean-context-review.md describe -- the nodes at `stage: review`, judged
// against the full graph:
//   { date, read: [id], nodes: [entry], frontier: [finding],
//     subtree_divergences: [divergence] }
// detected by the presence of a `nodes` array. A `frontier` finding may name
// any node in the graph, in the batch or outside it, and may propose
// alternatives:
//   { kind, nodes: [id], finding, proposal, stages: {id: stage},
//     alternatives: [{node, name, text}] }
// A `subtree_divergences` entry names an ancestor whose pending alternatives
// two unanswered subtrees stand under (`alignment-order`), and is written on
// the leaves and never on the ancestor:
//   { ancestor: id, sides: { alternativeName: [id, ...] }, finding }
// each leaf named under a side gains `<ancestor>#<alternativeName>` in its
// `depends`.
//
// Absent a `nodes` array, the file (or files) are read the old way -- one
// entry or a JSON list of entries, each
//   {id, scope?, verdict, kickback_stage?, findings[], counter_argument,
//    strength, facts_check}
// `scope` defaults to "node"; the other shape is "amendment" -- so that
// --fields-only and the tests of the per-node model this superseded still
// work.

import { readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

import { readGraph, parseNode } from "../../../packages/disposition/read.mjs";
import { deriveDraftHash } from "../../../packages/disposition/derive.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STAGE_ORDER = ["periagogic", "maieutic", "review", "ruling"];
const FRONTIER_KINDS = new Set([
  "contradiction", "supersession", "redundancy", "decomposition",
  "vocabulary", "cross-reference", "placement", "coverage",
  // added 2026-09-03 with the fifteenth validation and the staleness the
  // recommendation's `amends` pin makes visible (frontier-consistency).
  "merge", "stale-recommendation",
]);
// the reader's own rule for an alternative's name (read.mjs
// ALTERNATIVE_NAME_RE), checked here so a bad name is refused before any
// file is touched rather than caught by the post-write parse.
const ALTERNATIVE_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
// the sections a node file may carry, in order: an inserted '## Alternatives'
// goes before the first of the sections that follow it.
const SECTIONS_AFTER_ALTERNATIVES = ["Recommendation", "Account"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function parseArgs(argv) {
  const files = [];
  const opts = { repliesFile: null, overridesFile: null, date: null, dry: false, fieldsOnly: false };
  const valueFlags = { "--replies": "repliesFile", "--overrides": "overridesFile", "--date": "date" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a in valueFlags) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      opts[valueFlags[a]] = v;
    } else if (a === "--dry") {
      opts.dry = true;
    } else if (a === "--fields-only") {
      opts.fieldsOnly = true;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag ${a}`);
    } else {
      files.push(a);
    }
  }
  if (files.length === 0) {
    throw new Error("usage: node apply.mjs <json file> [<json file> ...] --replies <file> [--overrides <file>] [--date YYYY-MM-DD] [--dry] [--fields-only]");
  }
  return { files, ...opts };
}

async function loadJsonMap(file) {
  if (!file) return {};
  return JSON.parse(await readFile(path.resolve(file), "utf8"));
}

/**
 * Load the positional `<json file>` arguments and decide which shape they
 * are: the batch (one file, a non-array object carrying a `nodes` array) or
 * the old shape (every file is one entry or a JSON list of entries,
 * flattened together).
 *
 * @returns {Promise<{batch: object|null, entries: object[]|null}>} exactly
 *   one of the two is non-null.
 */
async function loadInput(files) {
  const raws = [];
  for (const f of files) {
    raws.push(JSON.parse(await readFile(path.resolve(f), "utf8")));
  }
  if (raws.length === 1 && raws[0] && !Array.isArray(raws[0]) && Array.isArray(raws[0].nodes)) {
    return { batch: raws[0], entries: null };
  }
  const entries = [];
  for (const raw of raws) {
    const list = Array.isArray(raw) ? raw : [raw];
    entries.push(...list);
  }
  return { batch: null, entries };
}

// Applied uniformly whether entries came from `files` or were passed
// directly as `entries`/`batch.nodes` (the latter used by tests), so no
// path can forget a default.
function withDefaults(e) {
  return { scope: "node", kickback_stage: null, counter_argument: null, facts_check: null, ...e };
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

function extractScalar(text, key) {
  const m = text.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
  return m ? m[1].trim() : null;
}

function hasReviewSubsection(text) {
  return text.includes("### Clean-context review");
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
 * The body's `## ` blocks, in order, each with the index of its heading line
 * and the index one past its last line. Fenced regions are skipped, using the
 * same toggling rule read.mjs's `parseBody` uses.
 *
 * @returns {Array<{name: string, start: number, end: number}>}
 */
function splitBodyBlocks(bodyLines) {
  const headingRe = /^(#{1,6})[ \t]+(.*?)\s*$/;
  const fenceRe = /^[ \t]*(`{3,}|~{3,})/;
  const boundaries = [];
  let fenceChar = null;
  bodyLines.forEach((line, index) => {
    const fence = line.match(fenceRe);
    if (fence) {
      if (fenceChar === null) fenceChar = fence[1][0];
      else if (fence[1][0] === fenceChar) fenceChar = null;
      return;
    }
    if (fenceChar !== null) return;
    const m = line.match(headingRe);
    if (m && m[1].length === 2) boundaries.push({ name: m[2], index });
  });
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
 * Append `### <name>` subsections to '## Alternatives', creating the section
 * when it is absent -- before '## Recommendation'/'## Account' if either is
 * there, since the reader fixes the section order, and at the end of the body
 * otherwise.
 */
function appendAlternativeSubsections(text, entries) {
  if (entries.length === 0) return text;
  const { fmLines, bodyLines } = splitRaw(text);
  const blocks = splitBodyBlocks(bodyLines);
  const lines = [...bodyLines];
  const rendered = [];
  for (const e of entries) rendered.push("", `### ${e.name}`, "", e.text.trim());

  const alternatives = blocks.find((b) => b.name === "Alternatives");
  if (alternatives) {
    const end = trimBlockEnd(lines, alternatives.start, alternatives.end);
    lines.splice(end, alternatives.end - end, ...rendered, "");
    return joinRaw(fmLines, lines);
  }

  const following = blocks.find((b) => SECTIONS_AFTER_ALTERNATIVES.includes(b.name));
  if (following) {
    lines.splice(following.start, 0, "## Alternatives", ...rendered, "", "");
  } else {
    const end = trimBlockEnd(lines, 0, lines.length);
    lines.splice(end, lines.length - end, "", "## Alternatives", ...rendered, "");
  }
  return joinRaw(fmLines, lines);
}

// --------------------------------------------------------------- draft hash
//
// `--fields-only` targets nodes the live graph already carries at `stage:
// ruling` without ever having had a `review` field written (the two 2026-
// 09-03 batches, applied by hand before this script existed) -- so
// `parseNode` on the untouched file throws (dialogue.md/clean-context-
// review.md's own rule: "stage ruling requires a 'review' with verdict
// forward"), before ever returning the `draftHash` this script needs to
// write. `read.mjs` is off limits to edit here, so this mirrors just the two
// mechanical, non-validating slices `deriveDraftHash` needs -- the
// frontmatter's raw text and, when present, the exact '## Recommendation'
// fence content -- using the same fence-aware boundary rule `parseBody` and
// `extractDraftFence` use, but collecting no problems and never recursing
// into the fence's own content. `deriveDraftHash` itself (imported, not
// duplicated) does the actual hashing and dialogue-key stripping.
function extractFenceLoose(sectionText) {
  const lines = sectionText.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i += 1;
  if (i >= lines.length || lines[i].trim() !== "```markdown") return null;
  i += 1;
  const content = [];
  while (i < lines.length && lines[i].trim() !== "```") {
    content.push(lines[i]);
    i += 1;
  }
  if (i >= lines.length) return null;
  return content.join("\n");
}

function computeDraftHashUnvalidated(rawText) {
  const { fmLines, bodyLines } = splitRaw(rawText);
  const sections = {};
  for (const b of splitBodyBlocks(bodyLines)) {
    sections[b.name] = bodyLines.slice(b.start + 1, b.end).join("\n").trim();
  }
  const draftFence = sections.Recommendation !== undefined ? extractFenceLoose(sections.Recommendation) : null;
  return deriveDraftHash({
    fmText: fmLines.join("\n"),
    draftFence,
    answer: sections.Answer ?? null,
    rationale: sections.Rationale ?? null,
  });
}

// ------------------------------------------------------------- frontmatter
function findFrontmatterBlock(fmLines, key) {
  const start = fmLines.findIndex((l) => new RegExp(`^${key}:`).test(l));
  if (start === -1) return null;
  let end = start + 1;
  while (end < fmLines.length && /^[ \t]/.test(fmLines[end]) && fmLines[end].trim() !== "") end += 1;
  return [start, end];
}

function renderReviewBlock({ verdict, strength, date, of }) {
  // an all-digit sha1 would parse as a YAML integer and fail the reader's
  // `of: <sha1>` check, so it is quoted; every other hash is left bare, as
  // the record already writes it.
  const ofText = /^\d+$/.test(of) ? `"${of}"` : of;
  return ["review:", `  verdict: ${verdict}`, `  strength: ${strength}`, `  date: ${date}`, `  of: ${ofText}`];
}

/**
 * One `alternatives` list entry, at the indentation the node's own list
 * already uses (a YAML sequence cannot mix indentations), `source: review`
 * and the review's date as its `ref`, quoted so an all-digit or date-shaped
 * ref stays a string.
 */
function renderAlternativeEntry({ name, date }, indent) {
  return [`${indent}- name: ${name}`, `${indent}  source: review`, `${indent}  ref: "${date}"`];
}

/**
 * Update `stage:` (inserting the line when the node carries none, which is
 * how a finding opens a dialogue on settled doctrine), unless `stage` is
 * null; replace the `review:` block, unless `reviewLines` is null; append
 * `alternatives` entries, creating the list when absent; and append
 * `dependsAdd` entries (each already rendered `<id>` or `<id>#<alternative>`)
 * to `depends`, creating the list when absent.
 *
 * `reviewLines` is null for a node touched only by a finding (no verdict of
 * its own to record): whatever `review:` block it already carries -- from an
 * earlier round, or none at all -- is left exactly as it stands. `stage` is
 * null for a node no entry names a stage for: the top-level `stage:` line, if
 * any, is left exactly as it stands.
 *
 * A newly created `depends:` list is placed last among the dialogue keys
 * this function upserts -- after `alternatives`, `recommendation`, and
 * `review` when any of them is present, else right after `stage` -- which is
 * where the reader's own declared frontmatter-key order
 * (`FRONTMATTER_KEYS` in read.mjs) puts it: `stage`, `order`,
 * `alternatives`, `recommendation`, `review`, `depends`, in that order.
 */
function upsertDialogueFields(rawText, { stage, reviewLines, alternatives = [], dependsAdd = [] }) {
  const { fmLines: originalFm, bodyLines } = splitRaw(rawText);
  const fmLines = [...originalFm];

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

  if (reviewLines !== null) {
    const existingReview = findFrontmatterBlock(fmLines, "review");
    let insertAt;
    if (existingReview) {
      insertAt = existingReview[0];
      fmLines.splice(existingReview[0], existingReview[1] - existingReview[0]);
    } else {
      const rec = findFrontmatterBlock(fmLines, "recommendation");
      insertAt = rec ? rec[1] : stageIdx + 1;
    }
    fmLines.splice(insertAt, 0, ...reviewLines);
  }

  if (alternatives.length > 0) {
    const existing = findFrontmatterBlock(fmLines, "alternatives");
    if (existing) {
      const [start, end] = existing;
      const firstItem = fmLines.slice(start + 1, end).find((l) => /^\s*- /.test(l));
      const indent = firstItem ? firstItem.match(/^(\s*)- /)[1] : "  ";
      const rendered = alternatives.flatMap((a) => renderAlternativeEntry(a, indent));
      fmLines.splice(end, 0, ...rendered);
    } else {
      const review = findFrontmatterBlock(fmLines, "review");
      const rec = findFrontmatterBlock(fmLines, "recommendation");
      const insertAt = review ? review[1] : rec ? rec[1] : stageIdx + 1;
      const rendered = alternatives.flatMap((a) => renderAlternativeEntry(a, "  "));
      fmLines.splice(insertAt, 0, "alternatives:", ...rendered);
    }
  }

  if (dependsAdd.length > 0) {
    const existing = findFrontmatterBlock(fmLines, "depends");
    if (existing) {
      const [start, end] = existing;
      const firstItem = fmLines.slice(start + 1, end).find((l) => /^\s*- /.test(l));
      const indent = firstItem ? firstItem.match(/^(\s*)- /)[1] : "  ";
      fmLines.splice(end, 0, ...dependsAdd.map((d) => `${indent}- ${d}`));
    } else {
      const alt = findFrontmatterBlock(fmLines, "alternatives");
      const review = findFrontmatterBlock(fmLines, "review");
      const rec = findFrontmatterBlock(fmLines, "recommendation");
      const insertAt = alt ? alt[1] : review ? review[1] : rec ? rec[1] : stageIdx + 1;
      fmLines.splice(insertAt, 0, "depends:", ...dependsAdd.map((d) => `  - ${d}`));
    }
  }

  return joinRaw(fmLines, bodyLines);
}

// ------------------------------------------------------------------ prose
function renderSubsection({ scope, date, verdict, kickback_stage: kickbackStage, findings, counter_argument: counterArgument, strength, facts_check: factsCheck, reply }) {
  const heading = scope === "amendment" ? `### Clean-context review of the amendment, ${date}` : `### Clean-context review, ${date}`;
  const opening = scope === "amendment"
    ? "Read in clean context by a subagent given the node, its ancestry, the author's words, and the amendment named in the brief, and nothing of the sitting."
    : "Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting.";
  const verdictSentence = verdict === "forward" ? "Verdict: forward to the author's ruling." : `Verdict: kicked back to the ${kickbackStage} stage.`;

  const parts = [heading, "", `${opening} ${verdictSentence}`, "", "Findings:", "", ...(findings || []).map((f) => `- ${f}`)];
  if (factsCheck) {
    parts.push("", `On the three facts: ${factsCheck}`);
  }
  parts.push("", counterArgument ? `Strongest counter-argument (${strength}): ${counterArgument}` : "The review found no strong counter-argument.");
  if (reply) {
    parts.push("", `The session's reply: ${reply}`);
  }
  return parts.join("\n");
}

/**
 * The subsection a finding appends to every node it names -- in the batch or
 * outside it. An alternative the finding proposes is named here as well as
 * recorded in the frontmatter, so the node's own account says where the
 * merge or split it proposes went.
 */
function renderFrontierSubsection({ date, kind, finding, proposal, otherIds, alternatives, id }) {
  const namedLine = otherIds.length > 0 ? `Also named: ${otherIds.join(", ")}.` : "Names only this node.";
  const parts = [`### Frontier finding, ${date}`, "", `Kind: ${kind}.`, "", finding, "", namedLine, "", `Proposed: ${proposal}`];
  for (const a of alternatives || []) {
    parts.push(
      "",
      a.node === id
        ? `Recorded as a pending alternative on this node: \`${a.name}\` (source review, ${date}).`
        : `Recorded as a pending alternative on ${a.node}: \`${a.name}\` (source review, ${date}).`,
    );
  }
  return parts.join("\n");
}

/**
 * The subsection a subtree divergence appends to its *ancestor*: for each
 * alternative on the table, the nodes a ruling for it keeps (the side's own
 * nodes) and the nodes it discards (every node named under every other
 * side), so the author reads at the ancestor, on the alignment page, what a
 * ruling for each alternative keeps and what it discards
 * (`alignment-order`). Quotes the entry's finding.
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
 * and which alternative on it this node stands under (the same divergence
 * recorded as `depends` in the frontmatter). Quotes the entry's finding.
 */
function renderLeafDivergenceSubsection({ date, ancestor, alternative, finding }) {
  return [`### Subtree divergence, ${date}`, "", finding, "", `Stands under ${ancestor}, alternative \`${alternative}\`.`].join("\n");
}

// -------------------------------------------------------- old-shape plans
async function planEntry(entry, ctx) {
  const { id, scope, verdict, kickback_stage: kickbackStage, findings, counter_argument: counterArgument, strength, facts_check: factsCheck } = entry;
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

  const problems = [];
  const hasOverride = Object.prototype.hasOwnProperty.call(ctx.overrides, id);
  const currentStage = extractScalar(rawTextBefore, "stage");

  if (scope === "amendment") {
    if (currentStage !== "ruling") {
      problems.push(`${id}: amendment entry requires stage 'ruling', found '${currentStage}'`);
    }
  } else if (ctx.fieldsOnly) {
    if (!hasReviewSubsection(rawTextBefore)) {
      problems.push(`${id}: --fields-only requires an existing '### Clean-context review' subsection; none found`);
    }
  } else if (currentStage !== "review" && !hasOverride) {
    problems.push(`${id}: node entry requires stage 'review' (or an override), found '${currentStage}'`);
  }

  if (verdict !== "forward" && verdict !== "kickback") {
    problems.push(`${id}: verdict must be 'forward' or 'kickback', found '${JSON.stringify(verdict)}'`);
  }
  if (verdict === "kickback" && !kickbackStage) {
    problems.push(`${id}: kickback requires kickback_stage`);
  }
  if (scope === "node" && strength === "strong" && !Object.prototype.hasOwnProperty.call(ctx.replies, id)) {
    problems.push(`${id}: strength 'strong' requires a reply in --replies`);
  }

  if (problems.length > 0) return { id, problems };

  const reply = Object.prototype.hasOwnProperty.call(ctx.replies, id) ? ctx.replies[id] : null;
  const subsection = ctx.fieldsOnly ? null : renderSubsection({ scope, date: ctx.date, verdict, kickback_stage: kickbackStage, findings, counter_argument: counterArgument, strength, facts_check: factsCheck, reply });

  if (scope === "amendment") {
    const rawTextAfter = appendToAccount(rawTextBefore, subsection);
    return { id, file, scope, verdict, notes: [], oldStage: currentStage, newStage: currentStage, rawTextBefore, rawTextAfter };
  }

  const newStage = hasOverride ? ctx.overrides[id] : verdict === "forward" ? "ruling" : kickbackStage;

  let draftHashBefore;
  if (ctx.fieldsOnly) {
    try {
      draftHashBefore = computeDraftHashUnvalidated(rawTextBefore);
    } catch (err) {
      return { id, problems: [`${id}: cannot compute draft hash: ${err.message}`] };
    }
  } else {
    let parsedBefore;
    try {
      parsedBefore = parseNode(rawTextBefore, { id, graph: graphName, slug, path: file });
    } catch (err) {
      return { id, problems: [`${id}: does not parse before edit: ${err.message}`] };
    }
    draftHashBefore = parsedBefore.draftHash;
  }

  const reviewLines = renderReviewBlock({ verdict, strength, date: ctx.date, of: draftHashBefore });
  let text = rawTextBefore;
  if (subsection !== null) text = appendToAccount(text, subsection);
  try {
    text = upsertDialogueFields(text, { stage: newStage, reviewLines });
  } catch (err) {
    return { id, problems: [`${id}: ${err.message}`] };
  }

  if (!ctx.fieldsOnly) {
    let parsedAfter;
    try {
      parsedAfter = parseNode(text, { id, graph: graphName, slug, path: file });
    } catch (err) {
      return { id, problems: [`${id}: does not parse after edit: ${err.message}`] };
    }
    if (parsedAfter.draftHash !== draftHashBefore) {
      return { id, problems: [`${id}: internal error -- draftHash changed by the edit (${draftHashBefore} -> ${parsedAfter.draftHash}); the account-is-not-part-of-the-hash assumption is violated`] };
    }
  }

  return { id, file, scope, verdict, notes: [], oldStage: currentStage, newStage, rawTextBefore, rawTextAfter: text };
}

// ----------------------------------------------------------- batch checks
//
// frontier-consistency.md's and clean-context-review.md's own checks, run
// once over the whole batch before any file is touched: every batch node
// named in `read`; `nodes` exactly covering the review stage, no more and no
// fewer; every finding shaped and grounded, its named nodes real (in the
// batch or outside it); every proposed alternative shaped, named on a node
// the finding names, and not already listed there; a strong counter-argument
// answered.
function validateBatch(batch, graph, { replies, overrides }) {
  const problems = [];
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const readSet = new Set(Array.isArray(batch.read) ? batch.read : []);

  const expectedIds = graph.nodes.filter((n) => n.stage === "review").map((n) => n.id);
  const expectedSet = new Set(expectedIds);

  for (const id of expectedIds) {
    if (!readSet.has(id)) problems.push(`'read' is missing ${id}, which is in the batch (stage review)`);
  }
  for (const id of readSet) {
    if (!nodesById.has(id)) problems.push(`'read' names ${id}, which is not a node`);
  }

  const nodeEntries = Array.isArray(batch.nodes) ? batch.nodes : [];
  const gotIds = nodeEntries.map((e) => e && e.id);
  const seen = new Set();
  for (const id of gotIds) {
    if (seen.has(id)) problems.push(`'nodes' has more than one entry for ${id}`);
    seen.add(id);
  }
  for (const id of expectedIds) {
    if (!seen.has(id)) problems.push(`'nodes' is missing an entry for ${id} (stage review)`);
  }
  for (const id of gotIds) {
    if (expectedSet.has(id)) continue;
    if (Object.prototype.hasOwnProperty.call(overrides, id)) continue;
    const stage = nodesById.has(id) ? nodesById.get(id).stage || "none" : "not a node";
    problems.push(`'nodes' names ${id}, which is not in the batch (stage ${stage}); only the batch receives verdicts`);
  }

  for (const entry of nodeEntries) {
    if (!entry || !isNonEmptyString(entry.id)) {
      problems.push("'nodes' has an entry with no id");
      continue;
    }
    if (entry.verdict !== "forward" && entry.verdict !== "kickback") {
      problems.push(`${entry.id}: verdict must be 'forward' or 'kickback', found '${JSON.stringify(entry.verdict)}'`);
    }
    if (entry.verdict === "kickback" && !entry.kickback_stage) {
      problems.push(`${entry.id}: kickback requires kickback_stage`);
    }
    if (entry.strength === "strong" && !Object.prototype.hasOwnProperty.call(replies, entry.id)) {
      problems.push(`${entry.id}: strength 'strong' requires a reply in --replies`);
    }
  }

  const frontier = Array.isArray(batch.frontier) ? batch.frontier : [];
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

    const alts = f && f.alternatives;
    if (alts !== undefined && alts !== null && !Array.isArray(alts)) {
      problems.push(`${label}: 'alternatives' must be a list of {node, name, text}`);
    } else {
      for (const [j, a] of (Array.isArray(alts) ? alts : []).entries()) {
        const altLabel = `${label}.alternatives[${j}]`;
        if (!a || typeof a !== "object") {
          problems.push(`${altLabel}: must be {node, name, text}`);
          continue;
        }
        if (!isNonEmptyString(a.node) || !nodesById.has(a.node)) {
          problems.push(`${altLabel}: 'node' must name a node, found '${JSON.stringify(a.node)}'`);
        } else if (nodeIds && !nodeIds.includes(a.node)) {
          problems.push(`${altLabel}: proposes an alternative on ${a.node}, which this finding does not name in 'nodes'`);
        }
        if (!isNonEmptyString(a.name) || !ALTERNATIVE_NAME_RE.test(a.name) || a.name === "standing") {
          problems.push(`${altLabel}: 'name' must be a lowercase slug and never 'standing', found '${JSON.stringify(a.name)}'`);
        }
        if (!isNonEmptyString(a.text)) problems.push(`${altLabel}: 'text' is required`);
        if (isNonEmptyString(a.node) && isNonEmptyString(a.name)) {
          const key = `${a.node}\x00${a.name}`;
          if (proposedNames.has(key)) problems.push(`${altLabel}: '${a.name}' is proposed on ${a.node} more than once in this batch`);
          proposedNames.add(key);
        }
      }
    }
    if (f && f.kind === "merge" && !(Array.isArray(alts) && alts.length > 0)) {
      problems.push(`${label}: a 'merge' finding must propose at least one alternative (the node it goes on, its name, its prose)`);
    }
  });

  // subtree_divergences (frontier-consistency's placement validation,
  // alignment-order): a tangle between two unanswered subtrees standing
  // under different sides of one ancestor's pending alternatives, recorded
  // on the leaves and never on the ancestor. `proposedNames` (built above)
  // lets a side name an alternative this same run's own `frontier` proposes,
  // not only one the ancestor already lists.
  const divergences = Array.isArray(batch.subtree_divergences) ? batch.subtree_divergences : [];
  const seenAncestors = new Set();
  divergences.forEach((d, i) => {
    const label = d && isNonEmptyString(d.ancestor) ? `subtree_divergences[${i}] (${d.ancestor})` : `subtree_divergences[${i}]`;
    if (!d || !isNonEmptyString(d.ancestor)) problems.push(`${label}: 'ancestor' is required`);
    if (!d || !isNonEmptyString(d.finding)) problems.push(`${label}: 'finding' is required`);

    const sides = d && d.sides;
    const sideNames = sides && typeof sides === "object" && !Array.isArray(sides) ? Object.keys(sides) : null;
    if (!sideNames || sideNames.length === 0) {
      problems.push(`${label}: 'sides' must be a non-empty object of alternative name to a non-empty list of node ids`);
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
        problems.push(`${label}: ${ancestor} is answered; a subtree divergence stands on an ancestor's pending alternatives`);
      }
    }

    const idsSeen = new Map();
    for (const name of sideNames || []) {
      const sideLabel = `${label}.sides['${JSON.stringify(name)}']`;
      const ids = sides[name];
      if (!isNonEmptyString(name)) {
        problems.push(`${label}: an alternative name in 'sides' must be a non-empty string, found '${JSON.stringify(name)}'`);
      } else if (ancestor !== null) {
        const ancestorNode = nodesById.get(ancestor);
        const alreadyListed = ancestorNode && (ancestorNode.alternatives || []).some((a) => a.name === name);
        const addedThisRun = proposedNames.has(`${ancestor}\x00${name}`);
        if (!alreadyListed && !addedThisRun) {
          problems.push(`${label}: '${name}' is not an alternative on ${ancestor} (not listed, and not added to it by this run's 'frontier')`);
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
          problems.push(`${sideLabel}: names ${id}, which is answered; a subtree divergence stands on unanswered nodes`);
        }
        if (ancestor !== null && id === ancestor) {
          problems.push(`${sideLabel}: names ${id}, which is this entry's own ancestor`);
        }
        if (idsSeen.has(id)) {
          problems.push(`${label}: ${id} stands under two sides ('${idsSeen.get(id)}' and '${name}') of the same ancestor`);
        } else {
          idsSeen.set(id, name);
        }
        const conflict = (node.depends || []).find((dep) => dep.id === ancestor && dep.alternative !== name);
        if (conflict) {
          problems.push(`${sideLabel}: ${id} already depends on ${ancestor}#${conflict.alternative}, which conflicts with side '${name}'; not overwritten, refused`);
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
 * Every node the batch touches -- named in `nodes` (a verdict), named by a
 * `frontier` finding (findings only, in the batch or outside it), or both --
 * keyed by id, in the order first encountered (`nodes` first, then `frontier`
 * in array order). A finding's proposed alternatives are collected onto the
 * node each goes on, which the checks above have already required the finding
 * to name.
 */
function collectTouched(batch) {
  const touched = new Map();
  const ensure = (id) => {
    if (!touched.has(id)) touched.set(id, { nodeEntry: null, findings: [], alternatives: [] });
    return touched.get(id);
  };
  for (const rawEntry of batch.nodes || []) {
    const entry = withDefaults(rawEntry);
    ensure(entry.id).nodeEntry = entry;
  }
  for (const f of batch.frontier || []) {
    const alternatives = Array.isArray(f.alternatives) ? f.alternatives : [];
    for (const id of f.nodes) {
      ensure(id).findings.push({
        kind: f.kind,
        finding: f.finding,
        proposal: f.proposal,
        stage: f.stages ? f.stages[id] : undefined,
        otherIds: f.nodes.filter((x) => x !== id),
        alternatives,
      });
    }
    for (const a of alternatives) {
      ensure(a.node).alternatives.push({ name: a.name, text: a.text });
    }
  }
  return touched;
}

/**
 * Every node one or more `subtree_divergences` entries touch -- an ancestor
 * (an entry it is the `ancestor` of), a leaf (an entry that names it under
 * one of its `sides`), or both -- keyed by id, each occurrence tagged with
 * the index of the entry it came from (so a report line can be built per
 * entry, not per node) and, for a leaf, the alternative it stands under.
 * `validateBatch` has already checked every entry's shape and grounding; this
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
    for (const [altName, ids] of Object.entries(d.sides)) {
      for (const nodeId of ids) {
        ensure(nodeId).leafOf.push({ entryIndex, ancestor: d.ancestor, alternative: altName, finding: d.finding });
      }
    }
  });
  return perNode;
}

/**
 * Plan one touched node's edit: the final stage (an override, else the
 * earliest stage among every entry naming it -- periagogic < maieutic <
 * review < ruling -- ignoring a finding that names this node but assigns it
 * no stage; if no entry assigns it one at all, its stage is left exactly as
 * it stands), every subsection to append in input order (the node's own
 * verdict first, if it has one, then each finding in the order `frontier`
 * lists it), each proposed alternative not already listed on the node, and
 * the `review:` block, written only when the node has a verdict of its own.
 *
 * The node is parsed before the edit and again after it: a node that does not
 * parse after the write is reported and left unwritten, and so is a node the
 * edit would leave without the `stage` its new dialogue state requires.
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

  let parsedBefore;
  try {
    parsedBefore = parseNode(rawTextBefore, { id, graph: graphName, slug, path: file });
  } catch (err) {
    return { id, problems: [`${id}: does not parse before edit: ${err.message}`] };
  }
  const currentStage = parsedBefore.stage;
  const draftHashBefore = parsedBefore.draftHash;

  const candidates = [];
  if (t.nodeEntry) candidates.push(t.nodeEntry.verdict === "forward" ? "ruling" : t.nodeEntry.kickback_stage);
  for (const f of t.findings) {
    if (f.stage !== undefined) candidates.push(f.stage);
  }

  const hasOverride = Object.prototype.hasOwnProperty.call(ctx.overrides, id);
  // No candidate at all means nothing named for this node assigns it a
  // stage (only findings that omitted it from their `stages`): its stage is
  // left exactly as it stands, not forced to any value.
  const stageTouched = hasOverride || candidates.length > 0;
  const finalStage = hasOverride
    ? ctx.overrides[id]
    : candidates.length > 0
      ? candidates.reduce((best, s) => (stageRank(s) < stageRank(best) ? s : best))
      : currentStage;

  if (!stageTouched && currentStage === null) {
    return {
      id,
      problems: [`${id}: carries no stage, and nothing in this batch names one for it; a finding recorded on a node opens its dialogue, so name its stage in the finding's 'stages' (or in --overrides)`],
    };
  }

  // An alternative whose name is already on the node is skipped, not
  // refused: the record already carries that answer, and a second entry of
  // the same name would not validate.
  const listed = new Set((parsedBefore.alternatives || []).map((a) => a.name));
  const newAlternatives = [];
  const notes = [];
  for (const a of t.alternatives) {
    if (listed.has(a.name)) {
      notes.push(`${id}: alternative '${a.name}' is already listed on this node; skipped (the finding is still recorded)`);
      continue;
    }
    listed.add(a.name);
    newAlternatives.push(a);
  }

  const subsections = [];
  const labels = [];
  let reviewLines = null;

  if (t.nodeEntry) {
    const entry = t.nodeEntry;
    const reply = Object.prototype.hasOwnProperty.call(ctx.replies, id) ? ctx.replies[id] : null;
    subsections.push(renderSubsection({
      scope: "node",
      date: ctx.date,
      verdict: entry.verdict,
      kickback_stage: entry.kickback_stage,
      findings: entry.findings,
      counter_argument: entry.counter_argument,
      strength: entry.strength,
      facts_check: entry.facts_check,
      reply,
    }));
    labels.push("Clean-context review");
    reviewLines = renderReviewBlock({ verdict: entry.verdict, strength: entry.strength, date: ctx.date, of: draftHashBefore });
  }

  for (const f of t.findings) {
    subsections.push(renderFrontierSubsection({
      date: ctx.date,
      kind: f.kind,
      finding: f.finding,
      proposal: f.proposal,
      otherIds: f.otherIds,
      alternatives: f.alternatives,
      id,
    }));
    labels.push("Frontier finding");
  }
  if (newAlternatives.length > 0) {
    labels.push(`alternative${newAlternatives.length > 1 ? "s" : ""} ${newAlternatives.map((a) => `'${a.name}'`).join(", ")}`);
  }

  let text = rawTextBefore;
  try {
    text = appendAlternativeSubsections(text, newAlternatives);
    for (const s of subsections) text = appendToAccount(text, s);
    text = upsertDialogueFields(text, {
      stage: stageTouched ? finalStage : null,
      reviewLines,
      alternatives: newAlternatives.map((a) => ({ name: a.name, date: ctx.date })),
    });
  } catch (err) {
    return { id, problems: [`${id}: ${err.message}`] };
  }

  let parsedAfter;
  try {
    parsedAfter = parseNode(text, { id, graph: graphName, slug, path: file });
  } catch (err) {
    return { id, problems: [`${id}: does not parse after edit: ${err.message}`] };
  }
  if (parsedAfter.draftHash !== draftHashBefore) {
    return { id, problems: [`${id}: internal error -- draftHash changed by the edit (${draftHashBefore} -> ${parsedAfter.draftHash}); the account-is-not-part-of-the-hash assumption is violated`] };
  }

  return { id, file, labels, notes, oldStage: currentStage, newStage: finalStage, rawTextBefore, rawTextAfter: text };
}

/**
 * Plan one node's subtree-divergence edits, layered on top of whatever
 * `existingPlan` (from `planTouchedNode`, or null) already has for this node:
 * a '### Subtree divergence' subsection per entry it is the ancestor or a
 * leaf of, and, for a leaf, a `depends` entry, unless it already carries
 * exactly that entry (skipped, and reported via `skips`, not refused --
 * `validateBatch` has already refused the run outright over a genuine
 * conflict, a different alternative on the same ancestor). A subtree
 * divergence never touches `stage`, `recommendation`, or anything
 * hash-bearing (`stripDialogueFrontmatterLines` excludes `depends` from the
 * draft hash, same as `alternatives`), so `oldStage`/`newStage` are always
 * equal here, and layering these edits onto an existing plan cannot change
 * the stage that plan already settled on.
 *
 * Parsed before and after, like every other write in this file: a node that
 * does not parse after the edit, or whose draft hash the edit moved, is
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

  let parsedBefore;
  try {
    parsedBefore = parseNode(rawTextBefore, { id, graph: graphName, slug, path: file });
  } catch (err) {
    return { id, problems: [`${id}: does not parse before edit: ${err.message}`] };
  }
  const draftHashBefore = parsedBefore.draftHash;
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
    if (existingDepends.some((d) => d.id === l.ancestor && d.alternative === l.alternative)) {
      skips.push({ entryIndex: l.entryIndex, id });
    } else {
      dependsAdd.push(`${l.ancestor}#${l.alternative}`);
    }
    subsections.push(renderLeafDivergenceSubsection({ date: ctx.date, ancestor: l.ancestor, alternative: l.alternative, finding: l.finding }));
    labels.push("Subtree divergence");
  }

  let text = existingPlan ? existingPlan.rawTextAfter : rawTextBefore;
  try {
    for (const s of subsections) text = appendToAccount(text, s);
    text = upsertDialogueFields(text, { stage: null, reviewLines: null, alternatives: [], dependsAdd });
  } catch (err) {
    return { id, problems: [`${id}: ${err.message}`] };
  }

  let parsedAfter;
  try {
    parsedAfter = parseNode(text, { id, graph: graphName, slug, path: file });
  } catch (err) {
    return { id, problems: [`${id}: does not parse after edit: ${err.message}`] };
  }
  if (parsedAfter.draftHash !== draftHashBefore) {
    return { id, problems: [`${id}: internal error -- draftHash changed by the edit (${draftHashBefore} -> ${parsedAfter.draftHash}); the account-is-not-part-of-the-hash assumption is violated`] };
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
 * Apply the batch: `validateBatch` first, refusing (writing nothing) on any
 * problem; otherwise plan every touched node (verdicts and findings), then
 * layer every subtree divergence onto the same plans (or new ones, for a
 * node only a divergence touches), refusing (still writing nothing) on any
 * planning problem from either pass; otherwise write every plan, remove the
 * lock, and report -- the notes, then one summary line per divergence entry,
 * as its last lines.
 */
async function applyBatch({ rootDir, reviewDir, manifest, batch, replies, overrides, date, dry }) {
  const graph = await readGraph(rootDir);
  const checkProblems = validateBatch(batch, graph, { replies, overrides });
  if (checkProblems.length > 0) {
    throw new Error(checkProblems.join("\n"));
  }

  const effectiveDate = date ?? batch.date ?? todayIso();
  const ctx = { rootDir, manifest, replies, overrides, date: effectiveDate };

  const touched = collectTouched(batch);
  const plans = [];
  const planProblems = [];
  for (const [id, t] of touched) {
    const plan = await planTouchedNode(id, t, ctx);
    if (plan.problems) planProblems.push(...plan.problems);
    else plans.push(plan);
  }

  const divergences = Array.isArray(batch.subtree_divergences) ? batch.subtree_divergences : [];
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

  const report = plans.map((p) => `${p.id}: ${p.labels.join(" + ")}, ${p.oldStage ?? "no stage"} → ${p.newStage ?? "no stage"}`);
  const notes = plans.flatMap((p) => p.notes || []);
  const divergenceReport = divergences.map((d, i) => {
    const counts = Object.entries(d.sides).map(([name, ids]) => `${name} ${ids.length}`).join(", ");
    const skipped = divergenceSkips.get(i) || [];
    const skipText = skipped.length > 0 ? `; already present, skipped: ${skipped.join(", ")}` : "";
    return `subtree divergence on ${d.ancestor}: ${counts}${skipText}`;
  });

  if (dry) {
    return { plans, report: [...report, ...notes, ...divergenceReport], validation: null, notes };
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

  const lockPath = path.join(reviewDir, "frontier.lock");
  await rm(lockPath, { force: true });

  return { plans, report: [...report, ...notes, ...divergenceReport], validation, notes };
}

/**
 * Apply every entry across `files` (or a pre-loaded `entries`/`batch`,
 * for tests): verify every entry first and refuse the whole run, writing
 * nothing, if any check fails; otherwise write every node file and, unless
 * `dry`, run `readGraph` once afterward and report (without reverting)
 * whether it still has problems. `batch` (or a loaded file shaped like
 * one -- a `nodes` array) runs the batch flow; otherwise this is the old
 * per-entry flow, kept for `--fields-only` and its own tests.
 *
 * @returns {Promise<{plans: object[], report: string[], validation: {ok:boolean, message?:string}|null}>}
 */
export async function applyReviews({
  rootDir,
  reviewDir,
  files = [],
  entries: providedEntries = null,
  batch: providedBatch = null,
  replies = {},
  overrides = {},
  date = null,
  dry = false,
  fieldsOnly = false,
}) {
  const manifest = await loadManifest(rootDir);

  let batch = providedBatch;
  let rawEntries = providedEntries;
  if (batch === null && rawEntries === null) {
    ({ batch, entries: rawEntries } = await loadInput(files));
  }

  if (batch !== null) {
    return applyBatch({ rootDir, reviewDir, manifest, batch, replies, overrides, date, dry });
  }

  const entries = (rawEntries ?? []).map(withDefaults);
  const ctx = { rootDir, reviewDir, manifest, replies, overrides, date: date ?? todayIso(), fieldsOnly };

  const plans = [];
  const problems = [];
  for (const entry of entries) {
    const plan = await planEntry(entry, ctx);
    if (plan.problems) problems.push(...plan.problems);
    else plans.push(plan);
  }
  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }

  const report = plans.map((p) => `${p.id}: ${p.verdict}, ${p.oldStage} → ${p.newStage}`);

  if (dry) {
    return { plans, report, validation: null };
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

  return { plans, report, validation };
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
    const reviewDir = path.resolve(process.cwd(), "tmp/review");
    try {
      const [replies, overrides] = await Promise.all([
        loadJsonMap(opts.repliesFile),
        loadJsonMap(opts.overridesFile),
      ]);
      const result = await applyReviews({
        rootDir,
        reviewDir,
        files: opts.files,
        replies,
        overrides,
        date: opts.date,
        dry: opts.dry,
        fieldsOnly: opts.fieldsOnly,
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
