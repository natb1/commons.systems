#!/usr/bin/env node
// .claude/skills/align-review/apply.mjs
//
// Applies clean-context review verdicts (see brief.md, SKILL.md §4, and the
// disposition-graph nodes clean-context-review/recording/dialogue) to node
// files: appends the reviewer's account to '## Proposal' and writes the
// dialogue frontmatter (`stage`, `review`) the verdict implies. The reviewer
// only recommends; this script is the mechanical half of "the session
// decides and answers for the record" -- replies and overrides are supplied
// by the caller, never invented here.
//
// Usage:
//   node apply.mjs <json file> [<json file> ...] --replies <file> \
//     [--overrides <file>] [--siblings <file>] [--date YYYY-MM-DD] \
//     [--dry] [--fields-only]
//
// Each <json file> is one entry or a JSON list of entries:
//   {id, scope?, verdict, kickback_stage?, findings[], counter_argument,
//    strength, facts_check}
// `scope` defaults to "node"; the other shape is "amendment".

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

import { readGraph, parseNode } from "../../../packages/disposition/read.mjs";
import { deriveDraftHash } from "../../../packages/disposition/derive.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const files = [];
  const opts = { repliesFile: null, overridesFile: null, siblingsFile: null, date: null, dry: false, fieldsOnly: false };
  const valueFlags = { "--replies": "repliesFile", "--overrides": "overridesFile", "--siblings": "siblingsFile", "--date": "date" };
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
    throw new Error("usage: node apply.mjs <json file> [<json file> ...] --replies <file> [--overrides <file>] [--siblings <file>] [--date YYYY-MM-DD] [--dry] [--fields-only]");
  }
  return { files, ...opts };
}

async function loadJsonMap(file) {
  if (!file) return {};
  return JSON.parse(await readFile(path.resolve(file), "utf8"));
}

async function loadEntries(files) {
  const entries = [];
  for (const f of files) {
    const raw = JSON.parse(await readFile(path.resolve(f), "utf8"));
    const list = Array.isArray(raw) ? raw : [raw];
    entries.push(...list);
  }
  return entries;
}

// Applied uniformly whether entries came from `files` or were passed
// directly as `entries` (the latter used by tests), so neither path can
// forget a default.
function withDefaults(e) {
  return { scope: "node", kickback_stage: null, counter_argument: null, facts_check: null, ...e };
}

async function readIfExists(file) {
  try {
    return await readFile(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
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

function renderReviewBlock({ verdict, strength, date, of, siblings }) {
  const lines = ["review:", `  verdict: ${verdict}`, `  strength: ${strength}`, `  date: ${date}`, `  of: ${of}`];
  if (!siblings || siblings.length === 0) {
    lines.push("  siblings: []");
  } else {
    lines.push("  siblings:");
    for (const s of siblings) lines.push(`    - ${s}`);
  }
  return lines;
}

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

function appendToProposal(text, subsection) {
  const trimmed = text.replace(/\s+$/, "");
  const hasProposal = /^## Proposal[ \t]*$/m.test(text);
  if (hasProposal) {
    return `${trimmed}\n\n${subsection}\n`;
  }
  return `${trimmed}\n\n## Proposal\n\n${subsection}\n`;
}

// ------------------------------------------------------------------- plan
async function resolveSiblingsForEntry(reviewDir, slug, id, siblingsFlagMap) {
  const perNodeFile = path.join(reviewDir, `${slug}.siblings.json`);
  const perNodeText = await readIfExists(perNodeFile);
  if (perNodeText !== null) return JSON.parse(perNodeText);
  if (siblingsFlagMap && Object.prototype.hasOwnProperty.call(siblingsFlagMap, id)) {
    return siblingsFlagMap[id];
  }
  return [];
}

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
  const siblings = await resolveSiblingsForEntry(ctx.reviewDir, slug, id, ctx.siblingsFlag);

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

  const reviewLines = renderReviewBlock({ verdict, strength, date: ctx.date, of: draftHashBefore, siblings });
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

/**
 * Apply every entry across `files` (or a pre-loaded `entries` array):
 * verify every entry first and refuse the whole run, writing nothing, if
 * any check fails; otherwise write every node file and, unless `dry`, run
 * `readGraph` once afterward and report (without reverting) whether it
 * still has problems.
 *
 * @returns {Promise<{plans: object[], report: string[], validation: {ok:boolean, message?:string}|null}>}
 */
export async function applyReviews({
  rootDir,
  reviewDir,
  files = [],
  entries: providedEntries = null,
  replies = {},
  overrides = {},
  siblings: siblingsFlag = {},
  date = todayIso(),
  dry = false,
  fieldsOnly = false,
}) {
  const manifest = await loadManifest(rootDir);
  const rawEntries = providedEntries ?? (await loadEntries(files));
  const entries = rawEntries.map(withDefaults);
  const ctx = { rootDir, reviewDir, manifest, replies, overrides, siblingsFlag, date, fieldsOnly };

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
      const [replies, overrides, siblingsFlag] = await Promise.all([
        loadJsonMap(opts.repliesFile),
        loadJsonMap(opts.overridesFile),
        loadJsonMap(opts.siblingsFile),
      ]);
      const result = await applyReviews({
        rootDir,
        reviewDir,
        files: opts.files,
        replies,
        overrides,
        siblings: siblingsFlag,
        date: opts.date ?? todayIso(),
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
