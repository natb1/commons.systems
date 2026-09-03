#!/usr/bin/env node
// .claude/skills/align-review/apply.mjs
//
// Applies clean-context review verdicts (see brief.md, SKILL.md §4, and the
// disposition-graph nodes clean-context-review/recording/dialogue/
// frontier-consistency) to node files: appends the reviewer's account to
// '## Proposal' and writes the dialogue frontmatter (`stage`, `review`) the
// verdict and the frontier's findings imply. The reviewer only recommends;
// this script is the mechanical half of "the session decides and answers
// for the record" -- replies and overrides are supplied by the caller,
// never invented here.
//
// Usage:
//   node apply.mjs <json file> --replies <file> \
//     [--overrides <file>] [--date YYYY-MM-DD] [--dry] [--fields-only]
//
// The one <json file> is normally the whole-frontier batch
// frontier-consistency.md and dialogue.md describe:
//   { date, read: [id], nodes: [entry], frontier: [finding], ruling_order: [id] }
// detected by the presence of a `nodes` array. Absent that, the file (or
// files) are read the old way -- one entry or a JSON list of entries, each
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
]);

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

// --------------------------------------------------------------- draft hash
//
// `--fields-only` targets nodes the live graph already carries at `stage:
// ruling` without ever having had a `review` field written (the two 2026-
// 09-03 batches, applied by hand before this script existed) -- so
// `parseNode` on the untouched file throws (dialogue.md/clean-context-
// review.md's own rule: "stage ruling requires a 'review' with verdict
// forward"), before ever returning the `draftHash` this script needs to
// write. `read.mjs` is off limits to edit here (another unit is changing
// its draft validation concurrently), so this mirrors just the two
// mechanical, non-validating slices `deriveDraftHash` needs -- the
// frontmatter's raw text and, when present, the exact '## Draft' fence
// content -- using the same fence-aware boundary rule `parseBody` and
// `extractDraftFence` use, but collecting no problems and never recursing
// into the fence's own content. `deriveDraftHash` itself (imported, not
// duplicated) does the actual hashing and dialogue-key stripping.
function splitSectionsLoose(bodyText) {
  const lines = bodyText.split("\n");
  const headingRe = /^(#{1,6})[ \t]+(.*?)\s*$/;
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
    if (m && m[1].length === 2) boundaries.push({ name: m[2], index });
  });
  const sections = {};
  boundaries.forEach((b, idx) => {
    const end = idx + 1 < boundaries.length ? boundaries[idx + 1].index : lines.length;
    sections[b.name] = lines.slice(b.index + 1, end).join("\n").trim();
  });
  return sections;
}

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
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  let fmEnd = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      fmEnd = i;
      break;
    }
  }
  if (fmEnd === -1) throw new Error("frontmatter is never closed");
  const fmText = lines.slice(1, fmEnd).join("\n");
  const bodyText = lines.slice(fmEnd + 1).join("\n");
  const sections = splitSectionsLoose(bodyText);
  const draftFence = sections.Draft !== undefined ? extractFenceLoose(sections.Draft) : null;
  return deriveDraftHash({
    fmText,
    draftFence,
    answer: sections.Answer ?? null,
    rationale: sections.Rationale ?? null,
  });
}

// ------------------------------------------------------------- frontmatter
//
// Edits the raw frontmatter text directly (find the `stage:` scalar line
// and the `review:` block by their line boundaries) rather than
// YAML.parse + re-serialize, so every other frontmatter line -- key order,
// comments if any, quoting style -- survives byte for byte.
function findFrontmatterBlock(fmLines, key) {
  const start = fmLines.findIndex((l) => new RegExp(`^${key}:`).test(l));
  if (start === -1) return null;
  let end = start + 1;
  while (end < fmLines.length && /^[ \t]/.test(fmLines[end]) && fmLines[end].trim() !== "") end += 1;
  return [start, end];
}

function renderReviewBlock({ verdict, strength, date, of }) {
  return ["review:", `  verdict: ${verdict}`, `  strength: ${strength}`, `  date: ${date}`, `  of: ${of}`];
}

/**
 * Update `stage:` and, unless `reviewLines` is null, the `review:` block.
 * `reviewLines` is null for a node touched only by a frontier finding (no
 * verdict of its own to record): its stage moves, but whatever `review:`
 * block it already carries -- from an earlier round, or none at all -- is
 * left exactly as it stands.
 */
function upsertDialogueFields(rawText, { stage, reviewLines }) {
  const lines = rawText.split("\n");
  if (lines[0].trim() !== "---") throw new Error("file must begin with a '---' frontmatter delimiter");
  let fmEnd = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      fmEnd = i;
      break;
    }
  }
  if (fmEnd === -1) throw new Error("frontmatter is never closed");
  const fmLines = lines.slice(1, fmEnd);
  const bodyLines = lines.slice(fmEnd + 1);

  const stageIdx = fmLines.findIndex((l) => /^stage:/.test(l));
  if (stageIdx === -1) throw new Error("no top-level 'stage:' line found to update");
  fmLines[stageIdx] = `stage: ${stage}`;

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

  return ["---", ...fmLines, "---", ...bodyLines].join("\n");
}

// ------------------------------------------------------------------ prose
function renderSubsection({ scope, date, verdict, kickback_stage: kickbackStage, findings, counter_argument: counterArgument, strength, facts_check: factsCheck, reply }) {
  const heading = scope === "amendment" ? `### Clean-context review of the amendment, ${date}` : `### Clean-context review, ${date}`;
  const opening = scope === "amendment"
    ? "Read in clean context by a subagent given the node, its ancestry, the author's words, and the amendment named in the brief, and nothing of the sitting."
    : "Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting.";
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

/** The subsection a frontier finding appends to every node it names. */
function renderFrontierSubsection({ date, kind, finding, proposal, otherIds }) {
  const namedLine = otherIds.length > 0 ? `Also named: ${otherIds.join(", ")}.` : "Names only this node.";
  return [`### Frontier finding, ${date}`, "", `Kind: ${kind}.`, "", finding, "", namedLine, "", `Proposed: ${proposal}`].join("\n");
}

function appendToProposal(text, subsection) {
  const trimmed = text.replace(/\s+$/, "");
  const hasProposal = /^## Proposal[ \t]*$/m.test(text);
  if (hasProposal) {
    return `${trimmed}\n\n${subsection}\n`;
  }
  return `${trimmed}\n\n## Proposal\n\n${subsection}\n`;
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
    const rawTextAfter = appendToProposal(rawTextBefore, subsection);
    return { id, file, scope, verdict, oldStage: currentStage, newStage: currentStage, rawTextBefore, rawTextAfter };
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
  if (subsection !== null) text = appendToProposal(text, subsection);
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
      return { id, problems: [`${id}: internal error -- draftHash changed by the edit (${draftHashBefore} -> ${parsedAfter.draftHash}); the proposal-is-not-part-of-the-hash assumption is violated`] };
    }
  }

  return { id, file, scope, verdict, oldStage: currentStage, newStage, rawTextBefore, rawTextAfter: text };
}

// ----------------------------------------------------------- batch checks
//
// frontier-consistency.md's own checks, run once over the whole batch
// before any file is touched: every staged node named in `read`; `nodes`
// exactly covering the review/ruling stage, no more and no fewer; every
// frontier finding shaped and grounded; a strong counter-argument answered.
function validateBatch(batch, graph, { replies, overrides }) {
  const problems = [];
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const readSet = new Set(Array.isArray(batch.read) ? batch.read : []);

  for (const node of graph.nodes) {
    if (node.stage && !readSet.has(node.id)) {
      problems.push(`'read' is missing ${node.id}, which carries stage '${node.stage}'`);
    }
  }

  const expectedIds = graph.nodes.filter((n) => n.stage === "review" || n.stage === "ruling").map((n) => n.id);
  const expectedSet = new Set(expectedIds);
  const nodeEntries = Array.isArray(batch.nodes) ? batch.nodes : [];
  const gotIds = nodeEntries.map((e) => e && e.id);
  const seen = new Set();
  for (const id of gotIds) {
    if (seen.has(id)) problems.push(`'nodes' has more than one entry for ${id}`);
    seen.add(id);
  }
  for (const id of expectedIds) {
    if (!seen.has(id)) problems.push(`'nodes' is missing an entry for ${id} (stage ${nodesById.get(id).stage})`);
  }
  for (const id of gotIds) {
    if (!expectedSet.has(id)) problems.push(`'nodes' names ${id}, which is not at stage review or ruling`);
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
      if (s !== "periagogic" && s !== "maieutic") {
        problems.push(`${label}: 'stages' for ${id} must be 'periagogic' or 'maieutic', found '${JSON.stringify(s)}'`);
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
 * `frontier` finding (findings only), or both -- keyed by id, in the order
 * first encountered (`nodes` first, then `frontier` in array order).
 */
function collectTouched(batch) {
  const touched = new Map();
  for (const rawEntry of batch.nodes || []) {
    const entry = withDefaults(rawEntry);
    touched.set(entry.id, { nodeEntry: entry, findings: [] });
  }
  for (const f of batch.frontier || []) {
    for (const id of f.nodes) {
      if (!touched.has(id)) touched.set(id, { nodeEntry: null, findings: [] });
      touched.get(id).findings.push({
        kind: f.kind,
        finding: f.finding,
        proposal: f.proposal,
        stage: f.stages ? f.stages[id] : undefined,
        otherIds: f.nodes.filter((x) => x !== id),
      });
    }
  }
  return touched;
}

/**
 * Plan one touched node's edit: the final stage (an override, else the
 * earliest stage among every entry naming it -- periagogic < maieutic <
 * review < ruling), every subsection to append in input order (the node's
 * own verdict first, if it has one, then each frontier finding in the
 * order `frontier` lists it), and the `review:` block, written only when
 * the node has a verdict of its own.
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
  const currentStage = extractScalar(rawTextBefore, "stage");

  const candidates = [];
  if (t.nodeEntry) candidates.push(t.nodeEntry.verdict === "forward" ? "ruling" : t.nodeEntry.kickback_stage);
  for (const f of t.findings) candidates.push(f.stage);

  const hasOverride = Object.prototype.hasOwnProperty.call(ctx.overrides, id);
  const finalStage = hasOverride
    ? ctx.overrides[id]
    : candidates.reduce((best, s) => (stageRank(s) < stageRank(best) ? s : best));

  const subsections = [];
  const labels = [];
  let reviewLines = null;
  let draftHashBefore = null;

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

    let parsedBefore;
    try {
      parsedBefore = parseNode(rawTextBefore, { id, graph: graphName, slug, path: file });
    } catch (err) {
      return { id, problems: [`${id}: does not parse before edit: ${err.message}`] };
    }
    draftHashBefore = parsedBefore.draftHash;
    reviewLines = renderReviewBlock({ verdict: entry.verdict, strength: entry.strength, date: ctx.date, of: draftHashBefore });
  }

  for (const f of t.findings) {
    subsections.push(renderFrontierSubsection({ date: ctx.date, kind: f.kind, finding: f.finding, proposal: f.proposal, otherIds: f.otherIds }));
    labels.push("Frontier finding");
  }

  let text = rawTextBefore;
  for (const s of subsections) text = appendToProposal(text, s);
  try {
    text = upsertDialogueFields(text, { stage: finalStage, reviewLines });
  } catch (err) {
    return { id, problems: [`${id}: ${err.message}`] };
  }

  if (t.nodeEntry) {
    let parsedAfter;
    try {
      parsedAfter = parseNode(text, { id, graph: graphName, slug, path: file });
    } catch (err) {
      return { id, problems: [`${id}: does not parse after edit: ${err.message}`] };
    }
    if (parsedAfter.draftHash !== draftHashBefore) {
      return { id, problems: [`${id}: internal error -- draftHash changed by the edit (${draftHashBefore} -> ${parsedAfter.draftHash}); the proposal-is-not-part-of-the-hash assumption is violated`] };
    }
  }

  return { id, file, labels, oldStage: currentStage, newStage: finalStage, rawTextBefore, rawTextAfter: text };
}

/**
 * Apply the whole-frontier batch: `validateBatch` first, refusing (writing
 * nothing) on any problem; otherwise plan every touched node, refusing
 * (still writing nothing) on any planning problem; otherwise write every
 * plan, remove the lock, and report, the `ruling_order` as its last lines.
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
  if (planProblems.length > 0) {
    throw new Error(planProblems.join("\n"));
  }

  const report = plans.map((p) => `${p.id}: ${p.labels.join(" + ")}, ${p.oldStage} → ${p.newStage}`);
  const rulingOrder = Array.isArray(batch.ruling_order) ? batch.ruling_order : [];

  if (dry) {
    return { plans, report, validation: null, rulingOrder };
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

  return { plans, report: [...report, ...rulingOrder], validation, rulingOrder };
}

/**
 * Apply every entry across `files` (or a pre-loaded `entries`/`batch`,
 * for tests): verify every entry first and refuse the whole run, writing
 * nothing, if any check fails; otherwise write every node file and, unless
 * `dry`, run `readGraph` once afterward and report (without reverting)
 * whether it still has problems. `batch` (or a loaded file shaped like
 * one -- a `nodes` array) runs the whole-frontier flow; otherwise this is
 * the old per-entry flow, kept for `--fields-only` and its own tests.
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
