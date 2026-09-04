#!/usr/bin/env node
// packages/clean-context-review/brief.mjs
//
// Writes one reviewer's brief for one clean-context reading, in the two
// readings the review divides into by their object (clean-context-review.md,
// "running two reviews divided by their object"; frontier-consistency.md,
// which divides the fifteen validations between them; review-skills.md, which
// makes the two readings two skills over this one package).
//
//   --node <id>  the review of one draft. Its object is that node's
//                recommendation, and it runs the moment the recommendation is
//                recorded, which is the node's transition to the review
//                stage. The reader is given the node whole -- the '## Account'
//                included, since a draft's dialogue is its own history -- its
//                ancestry and the rules that bind everywhere, its siblings
//                under the same parent, the nodes it names, and the index of
//                every other question the record asks. Validations 1 to 6 and
//                15. Writes tmp/review/draft-<slug>.brief.md and names
//                tmp/review/draft-<slug>.json. It computes no model: the
//                model and the effort both readings run on are the
//                review-model node's, fixed there and stated by the skill at
//                the launch.
//
//   --survey     the survey of the frontier. Its object is the frontier's
//                consistency with itself: the whole graph in one context,
//                judging every node at the review or ruling stage whose
//                recommendation has moved since the survey last pinned it
//                (`surveyJudges`), in the ruling order. Validations 7 to 15.
//                No '## Account' goes into this brief -- the accounts are the
//                dialogue's history and not its text. Writes
//                tmp/review/survey.brief.md, names tmp/review/survey.json,
//                and writes tmp/review/survey.pins.json, the sidecar the
//                apply step compares against: the graph commit read and the
//                recommendation hash of every node of the graph, judged and
//                context alike, so that a finding whose subject has moved
//                since is discarded rather than applied to text no reading
//                attests to.
//
// Nothing is locked (clean-context-review: "a lock at launch, which is
// advisory, per checkout, and unneeded once the pin serializes"). Reviews of
// drafts never wait on each other, and the survey is serialized by the pin
// its findings carry.
//
// Usage:
//   node brief.mjs --node <id> [rootDir] [--date YYYY-MM-DD] [--dry]
//   node brief.mjs --survey    [rootDir] [--date YYYY-MM-DD] [--dry]

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readGraph, surveyJudges } from "@commons.systems/disposition/read.mjs";
import { renderFrontier } from "@commons.systems/disposition/project.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRAFT_TEMPLATE_PATH = path.join(HERE, "brief-draft.md");
const SURVEY_TEMPLATE_PATH = path.join(HERE, "brief-survey.md");

// The two fragments the templates share, filled into both at `{{bounds}}` and
// `{{record}}` so that the text common to the two briefs exists in one file
// (`review-skills`): the reader's bounds, which state the model and the
// effort `review-model` fixes for both readings, and the primer on the
// record's encoding. Only the essential common text is factored; what merely
// looks the same in the two templates stays in each of them.
const BOUNDS_FRAGMENT_PATH = path.join(HERE, "brief-bounds.md");
const RECORD_FRAGMENT_PATH = path.join(HERE, "brief-record.md");

// The paths the brief names to its reader, repo-relative and literal: the
// reviewer works in the repository, whatever scratch directory this run
// happens to write into (a test's copy, say).
const SURVEY_OUT_FILE = "tmp/review/survey.json";
const SURVEY_PINS_FILE = "tmp/review/survey.pins.json";
const draftOutFile = (slug) => `tmp/review/draft-${slug}.json`;

export const USAGE = [
  "usage: node brief.mjs --node <id> [rootDir] [--date YYYY-MM-DD] [--dry]",
  "       node brief.mjs --survey    [rootDir] [--date YYYY-MM-DD] [--dry]",
  "exactly one of --node <id> and --survey is given: the review of one draft,",
  "or the survey of the frontier.",
].join("\n");

function todayIsoUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The two modes are exclusive and one is required: neither, both, an unknown
 * flag, or a second positional is a usage error, which the CLI reports on
 * stderr and exits 2 on.
 */
export function parseArgs(argv) {
  const opts = { node: null, survey: false, rootDir: null, date: null, dry: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--node") {
      const v = argv[++i];
      if (v === undefined) throw new Error("--node needs a node id");
      if (opts.node !== null) throw new Error("--node is given more than once");
      opts.node = v;
    } else if (a === "--survey") {
      opts.survey = true;
    } else if (a === "--date") {
      const v = argv[++i];
      if (v === undefined) throw new Error("--date needs a value");
      opts.date = v;
    } else if (a === "--dry") {
      opts.dry = true;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag ${a}`);
    } else if (opts.rootDir === null) {
      opts.rootDir = a;
    } else {
      throw new Error(`unexpected argument ${a}`);
    }
  }
  if (opts.node !== null && opts.survey) {
    throw new Error("--node and --survey are the two readings, and one invocation runs one of them");
  }
  if (opts.node === null && !opts.survey) {
    throw new Error("no reading named: give --node <id> for the review of a draft, or --survey for the survey of the frontier");
  }
  return opts;
}

/**
 * The node's class and where it comes from -- read off the rulings recorded
 * on its facts, never off a stamp (`viable-options`: "A node's authority is
 * read off the rulings recorded on its facts, and no stamp is written beside
 * them"). `classSource` is the reader's own derivation: a ruling on this
 * node, a ruling on the nearest ancestor whose scope covers it, or nothing.
 */
function classText(node) {
  const source = node.classSource;
  if (!source) {
    return `${node.class} (no ruling on this node or on any ancestor: nothing on it acts)`;
  }
  if (source.kind === "ancestor") return `${node.class} (conferred by ${source.id})`;
  return `${node.class} (ruled here)`;
}

function nodeFile(node) {
  return `disposition/${node.graph}/${node.slug}.md`;
}

// `node.settles` (deriveSettles) is a number for every node the reader
// returns; the fallback here is only for a shape the reader is not
// contracted to produce, so this never guesses a count -- it prints the
// dash instead.
function settlesText(node) {
  return typeof node.settles === "number" ? String(node.settles) : "—";
}

function indexLine(node) {
  return `- ${node.id} | stage ${node.stage} | rank ${node.rank.toFixed(4)} | settles ${settlesText(node)} | ${classText(node)} | ${nodeFile(node)}`;
}

function contextIndexLine(node) {
  return `- ${node.id} | ${node.status} | stage ${node.stage || "none"} | rank ${node.rank.toFixed(4)} | settles ${settlesText(node)} | ${classText(node)} | ${nodeFile(node)}`;
}

/**
 * The frontier's own order, exactly as `renderFrontier` (descending rank, id
 * tiebreak) lists it -- recovered from its own rendered listing rather than
 * re-implementing the comparator, since `renderFrontier` does not expose
 * the sorted id list on its own. Every node's own line starts with `- `
 * followed immediately by its id (ids never contain a space); every other
 * line renderFrontier emits is indented, so this cannot mistake one for
 * the other.
 *
 * The projector is a separate artifact on its own schedule, and this brief
 * must be writable whether or not it currently renders: a listing that
 * throws, or that does not name every node exactly once, falls back to the
 * comparator the frontier is defined by (rank descending, id ascending).
 * The fallback is the same order, computed here rather than read off there.
 *
 * This is the order the survey's context is read in, and it is not the order
 * the judged set is presented in: that is separately re-sorted into the
 * *ruling order* (`rulingOrderCompare`), settling count first, since that is
 * the order the author rules in (`alignment-order`), and a node's rank alone
 * does not say how much of the graph a ruling on it would settle.
 *
 * @param {{nodes: object[]}} graph
 * @returns {string[]} every node id, in the frontier's order
 */
export function frontierOrderIds(graph) {
  const byRank = () => [...graph.nodes]
    .sort((a, b) => (b.rank - a.rank) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((n) => n.id);

  let listing;
  try {
    listing = renderFrontier(graph);
  } catch {
    return byRank();
  }
  const ids = [];
  for (const line of String(listing).split("\n")) {
    const m = line.match(/^- (\S+)/);
    if (m) ids.push(m[1]);
  }
  const named = new Set(ids);
  if (ids.length !== graph.nodes.length || graph.nodes.some((n) => !named.has(n.id))) {
    return byRank();
  }
  return ids;
}

/**
 * The *ruling order* (`alignment-order`): settling count descending -- a node
 * whose ruling would settle more of the graph (more of it standing under the
 * node itself, or depending on it; `deriveSettles`) is ruled on first -- then
 * rank descending, then id ascending to break what settling count alone does
 * not. A node's own options are its own ruling's content, not reach
 * elsewhere, and do not count toward this. This is deliberately not the
 * frontier's own order (`frontierOrderIds`): rank alone ranks by boost and
 * shape, not by how much of the graph a ruling settles, so the two orders can
 * and do differ.
 *
 * `settles` is a number for every node the reader returns (`node.settles`);
 * a node for which it is not is sorted last, as though it settled nothing,
 * rather than thrown on.
 */
function rulingOrderCompare(a, b) {
  const aSettles = typeof a.settles === "number" ? a.settles : -Infinity;
  const bSettles = typeof b.settles === "number" ? b.settles : -Infinity;
  if (aSettles !== bSettles) return bSettles - aSettles;
  if (a.rank !== b.rank) return b.rank - a.rank;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * A node's review state, in the two readings it divides into: the review of
 * this draft (verdict, strength, date, and the pin), the survey of the
 * frontier (its date and its pin), or either alone -- the survey may pin a
 * node before its draft review has run, and a draft review is recorded before
 * any survey has read it (read.mjs: "Either reading may stand without the
 * other"). Each half is flagged where its own pin has gone stale.
 */
export function reviewLine(node) {
  const review = node.review;
  if (!review) return "none (neither reading has run)";
  const parts = [];
  if (review.verdict !== null) {
    const stale = node.reviewStale
      ? " — STALE: what the node recommends has moved since that review was written (`reviewStale`), so its verdict answers a recommendation the node no longer carries"
      : "";
    parts.push(`draft review: ${review.verdict} (${review.strength}, ${review.date}, of ${review.of})${stale}`);
  } else {
    parts.push("draft review: none (this draft has not been reviewed)");
  }
  if (review.survey !== null) {
    const stale = node.surveyStale
      ? " — STALE: what the node recommends has moved since that survey read it (`surveyStale`), so the survey is owed again"
      : "";
    parts.push(`survey: surveyed ${review.survey.date}, of ${review.survey.of}${stale}`);
  } else {
    parts.push("survey: none (no survey has pinned this node)");
  }
  return parts.join("; ");
}

function dependsText(node) {
  const entries = node.depends || [];
  if (entries.length === 0) return "none";
  return entries.map((d) => (d.option ? `${d.id}#${d.option}` : d.id)).join(", ");
}

/**
 * The terms one node defines, each with the gloss it wrote for it -- the
 * one sentence a vocabulary fact's option (`authority`/`existence`) shows
 * wherever that term is offered, so a passed-over or missing gloss here is
 * a gap this brief should catch. `(no gloss yet)` where the node named the
 * term but wrote no sentence for it.
 */
function definesText(node) {
  const entries = node.defines || [];
  if (entries.length === 0) return null;
  return entries.map((d) => {
    const term = typeof d === "string" ? d : d.term;
    const gloss = typeof d === "string" ? null : d.gloss;
    return gloss ? `\`${term}\` — ${gloss}` : `\`${term}\` (no gloss yet)`;
  }).join("; ");
}

/** A reading's `bears`: the options of other nodes the tradition bears on. */
function bearsText(node) {
  const entries = node.bears || [];
  if (entries.length === 0) return null;
  return entries.map((b) => `${b.node ?? "(unresolved)"}#${b.fact}#${b.option} (${b.relation})`).join(", ");
}

/** The readings that bear on one option, as the reader's inverse derives them. */
function readingsText(option) {
  const readings = option.readings || [];
  if (readings.length === 0) return null;
  return readings.map((r) => `${r.id} (${r.relation})`).join(", ");
}

function ruledOptionName(fact) {
  const ruled = (fact.options || []).find((o) => o.ruling);
  return ruled ? ruled.name : null;
}

/**
 * One fact in one line, for an index or a context node: what it recommends,
 * out of which options, with what boldness, the AI's own case against that
 * recommendation where one is on record, what stands, and what was ruled.
 */
function factDetail(fact) {
  const options = (fact.options || []).map((o) => o.name).join("|");
  const bits = [fact.recommends ? `recommends ${fact.recommends} (${fact.boldness})` : "recommends nothing yet"];
  bits.push(` of ${options}`);
  if (fact.against) bits.push(`; against: ${fact.against}`);
  if (fact.stands) bits.push(`, stands ${fact.stands}`);
  const ruled = ruledOptionName(fact);
  if (ruled) {
    const ruling = fact.options.find((o) => o.name === ruled).ruling;
    const reason = ruling.reason ? `, reason: ${ruling.reason}` : "";
    bits.push(`, ruled ${ruling.response} on ${ruled} (${ruling.date})${fact.moved ? " — MOVED since that ruling" : ""}${reason}`);
  }
  return bits.join("");
}

function factSummary(fact) {
  return `${fact.name}: ${factDetail(fact)}`;
}

/** What an option with no `#### <option>` prose says instead, and why. */
function missingProseText(fact, option) {
  if (fact.name !== "answer") return "(no prose recorded; a reserved fact's option needs none)";
  if (fact.stands === option.name) return "(no prose: the option that stands says itself in the '## Answer' above)";
  return "(no prose recorded, though every answer option but the one that stands owes one)";
}

function factsSummary(node) {
  const facts = node.facts || [];
  if (facts.length === 0) return "none (no decision is recorded on this node yet)";
  return facts.map(factSummary).join("; ");
}

/**
 * Every fact of one node, whole: the reason the recommendation gives, then
 * each option with its source and reference, whether it is the recommended
 * one, the one that stands, or the ruled one, the readings that bear on it,
 * and the prose that says what it would answer.
 */
function renderFacts(node, headingPrefix) {
  const facts = node.facts || [];
  if (facts.length === 0) return ["(no facts: no decision is recorded on this node yet)", ""];
  const out = [];
  for (const fact of facts) {
    out.push(`${headingPrefix} ${fact.name} — ${factDetail(fact)}`, "");
    out.push(fact.prose && fact.prose.length > 0
      ? fact.prose
      : "(no prose in '## Facts' for this fact: no reason is recorded for what it recommends)", "");
    for (const option of fact.options || []) {
      const marks = [];
      if (fact.recommends === option.name) marks.push(`recommended, boldness ${fact.boldness}`);
      if (option.status === "passed") marks.push(`passed over${option.reason ? ` — ${option.reason}` : ""}`);
      if (fact.stands === option.name) marks.push("stands (its text is the '## Answer' above)");
      if (option.ruling) {
        const reason = option.ruling.reason ? `, reason: ${option.ruling.reason}` : "";
        marks.push(`ruled ${option.ruling.response} on ${option.ruling.date}, pinning ${option.ruling.of}${reason}`);
      }
      const origin = [option.source ? `source ${option.source}` : null, option.ref ? `ref ${option.ref}` : null]
        .filter(Boolean).join(", ") || "no source recorded (a reserved fact's option needs none)";
      out.push(`- \`${option.name}\` — ${origin}${marks.length > 0 ? ` — ${marks.join("; ")}` : ""}`);
      const readings = readingsText(option);
      if (readings) out.push(`  - Readings bearing on it: ${readings}`);
      const prose = option.prose && option.prose.length > 0 ? option.prose : missingProseText(fact, option);
      for (const line of prose.split("\n")) out.push(`  ${line}`);
      out.push("");
    }
  }
  return out;
}

/**
 * One node in full: question, the author's words, the text that stands, the
 * rationale, every fact with every option it holds viable, the
 * '## Recommendation' fence when there is one, and the account.
 *
 * `account: false` leaves the '## Account' out. The survey's brief never
 * carries an account (`clean-context-review`: the accounts "are the
 * dialogue's history and not its text"), and neither do the neighbourhood
 * nodes of a draft's brief; the draft under review carries its own, since a
 * verdict on it answers the dialogue that produced it.
 */
function renderWholeNode(node, { account = true } = {}) {
  const parts = [
    `### ${node.id}`,
    "",
    `- File: ${nodeFile(node)}`,
    `- Question: ${node.question}`,
    `- Stage: ${node.stage} | rank ${node.rank.toFixed(4)} | settles ${settlesText(node)} | status ${node.status} | class: ${classText(node)}`,
    `- Facts: ${factsSummary(node)}`,
    `- Review state: ${reviewLine(node)}`,
    `- Depends: ${dependsText(node)} | under: ${(node.under || []).join(", ") || "none"}`,
  ];
  const defines = definesText(node);
  if (defines) parts.push(`- Defines: ${defines}`);
  const bears = bearsText(node);
  if (bears) parts.push(`- Bears on (this node is a reading): ${bears}`);
  parts.push(
    "",
    "#### Disposition (the author's words)",
    "",
    node.disposition || "(no '## Disposition' section)",
    "",
    "#### Answer (the text that stands)",
    "",
    node.answer || "(no '## Answer' section: nothing stands on this node yet)",
    "",
    "#### Rationale",
    "",
    node.rationale || "(no '## Rationale' section)",
    "",
    "#### Facts (every decision on this node, and every option it holds viable)",
    "",
  );
  parts.push(...renderFacts(node, "#####"));

  parts.push("#### Recommendation (the recommended node in full, when the recommended option is not the one that stands)", "");
  if (node.fence && typeof node.fence.raw === "string") {
    parts.push("```markdown", node.fence.raw, "```", "");
  } else {
    parts.push("(no '## Recommendation' fence: the answer fact recommends the option that stands, or recommends nothing)", "");
  }

  if (account) {
    parts.push("#### Account (the AI's account, with the subsections of earlier readings)", "");
    parts.push(node.account || "(no '## Account' section)", "");
  }

  return parts.join("\n");
}

/** One context node: class, stage, question, standing answer, other options. */
function renderContextNode(node) {
  const head = [`### ${node.id}`, "", `- File: ${nodeFile(node)}`, `- Question: ${node.question}`];
  head.push(`- Status: ${node.status} | class: ${classText(node)} | rank ${node.rank.toFixed(4)} | settles ${settlesText(node)} | stage: ${node.stage || "none (no dialogue open)"}`);
  head.push(`- Facts: ${factsSummary(node)}`);
  if (node.review) head.push(`- Review: ${reviewLine(node)}`);
  const bears = bearsText(node);
  if (bears) head.push(`- Bears on (this node is a reading): ${bears}`);
  head.push("", "#### Answer", "", node.answer || "(no '## Answer' section: nothing stands on this node yet)", "");
  const others = (node.answerFact ? node.answerFact.options : []).filter((o) => o.name !== node.answerFact.stands);
  if (others.length > 0) {
    head.push("#### Other options on its answer", "");
    for (const option of others) {
      const origin = [option.source ? `source ${option.source}` : null, option.ref ? `ref ${option.ref}` : null].filter(Boolean).join(", ");
      head.push(`- \`${option.name}\` — ${origin || "no source recorded"}${node.answerFact.recommends === option.name ? " — recommended" : ""}`);
      const prose = option.prose && option.prose.length > 0 ? option.prose : "(no prose recorded for this option)";
      for (const line of prose.split("\n")) head.push(`  ${line}`);
      head.push("");
    }
  }
  return head.join("\n");
}

/**
 * Fill `{{nav}}` last, from the filled text itself: a brief is long, and a
 * reader that must read it whole is told how long it is and where each of its
 * parts begins. The replacement is one line, as the placeholder's own line
 * is, so the line numbers it names stay true.
 */
function fillNav(text) {
  const lines = text.split("\n");
  const headings = [];
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^[ \t]*(`{3,}|~{3,})/.test(line)) fenced = !fenced;
    else if (!fenced && /^## /.test(line)) headings.push({ name: line.slice(3).trim(), line: i + 1 });
  });
  const where = headings.map((h) => `"## ${h.name}" at line ${h.line}`).join(", ");
  const nav = `This brief is ${lines.length} lines. Read it whole before writing anything: ${where}.`;
  return { text: lines.map((l) => (l === "{{nav}}" ? nav : l)).join("\n"), lines: lines.length };
}

function fill(template, values) {
  let out = template;
  for (const [key, value] of Object.entries(values)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

/**
 * Read a template and fill the two shared fragments into it, before anything
 * else is filled: the fragments carry placeholders of their own (`{{repo}}`),
 * and a fragment substituted after them would leave them standing. A template
 * that names neither fragment is filled unchanged, and a fragment is trimmed
 * of its trailing newline so that the blank line around the placeholder is
 * the template's and not the fragment's.
 *
 * @param {string} templatePath
 * @returns {Promise<string>}
 */
async function readTemplate(templatePath) {
  const [template, bounds, record] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(BOUNDS_FRAGMENT_PATH, "utf8"),
    readFile(RECORD_FRAGMENT_PATH, "utf8"),
  ]);
  return fill(template, { bounds: bounds.trimEnd(), record: record.trimEnd() });
}

// --------------------------------------------------------- the graph commit
//
// The survey's findings name the graph commit they read
// (`frontier-consistency`, `clean-context-review`), and the pins sidecar
// carries it beside the hashes. Read-only, and never fatal: a graph that is
// not a git checkout at all (a fixture copy under a scratch directory) still
// gets a brief, with the commit reported as unknown.

export function graphCommit(rootDir) {
  const run = (args) => execFileSync("git", ["-C", rootDir, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  try {
    const commit = run(["rev-parse", "HEAD"]).trim();
    const dirty = run(["status", "--porcelain"]).trim().length > 0;
    return { commit, dirty };
  } catch {
    return { commit: null, dirty: false };
  }
}

function commitText({ commit, dirty }) {
  if (commit === null) return "(unknown: this graph is not a git checkout)";
  return dirty ? `${commit} (dirty)` : commit;
}

// -------------------------------------------------- the review of one draft

/**
 * The neighbourhood a draft is judged against, from the record and never from
 * a set the session names (`clean-context-review`): the chain above it, its
 * siblings under the same parent, the nodes it names, and every other
 * question the record asks.
 *
 * - ancestry: every node above it by `under`, nearest first, plus every
 *   `tier: global` node not already in the chain (the rules that bind
 *   everywhere).
 * - siblings: every other node sharing one of its `under` parents.
 * - cited: every node whose id appears in the node's own rendered text, or in
 *   its `depends`, and that no earlier part already carries.
 * - index: every remaining node.
 */
export function draftNeighbourhood(graph, node) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const taken = new Set([node.id]);
  const take = (list) => {
    const out = [];
    for (const n of list) {
      if (!n || taken.has(n.id)) continue;
      taken.add(n.id);
      out.push(n);
    }
    return out;
  };

  const chain = [];
  let frontier = [...(node.under || [])];
  const seenInChain = new Set();
  while (frontier.length > 0) {
    const next = [];
    for (const id of frontier) {
      if (seenInChain.has(id)) continue;
      seenInChain.add(id);
      const parent = byId.get(id);
      if (!parent) continue;
      chain.push(parent);
      next.push(...(parent.under || []));
    }
    frontier = next;
  }
  const globals = graph.nodes.filter((n) => n.tier === "global");
  const ancestry = take([...chain, ...globals]);

  const parents = new Set(node.under || []);
  const siblings = take(graph.nodes.filter((n) => (n.under || []).some((p) => parents.has(p))));

  // The node's own text, as this brief renders it, is what "the nodes it
  // names" is read from: every section, every fact, every option's prose and
  // the fence, so a citation anywhere in the node is caught.
  const ownText = renderWholeNode(node);
  const cited = take(graph.nodes.filter((n) => (
    ownText.includes(n.id) || (node.depends || []).some((d) => d.id === n.id)
  )));

  const index = graph.nodes.filter((n) => !taken.has(n.id));
  return { ancestry, siblings, cited, index };
}

function renderNodeList(nodes, empty, options) {
  if (nodes.length === 0) return empty;
  return nodes.map((n) => renderWholeNode(n, options)).join("\n");
}

/**
 * Write the brief for the review of one draft. Refuses (letting the reader's
 * own message through) on a graph that does not validate, and refuses with an
 * exit-2 error on a node that does not exist or does not stand at the review
 * stage.
 *
 * @returns {Promise<{briefPath: string, outFile: string,
 *   ancestryCount: number, siblingCount: number, citedCount: number,
 *   indexCount: number, lines: number}>}
 */
export async function writeDraftBrief({ rootDir, reviewDir, id, date = null, dry = false }) {
  const graph = await readGraph(rootDir);
  const node = graph.nodes.find((n) => n.id === id);
  if (!node) {
    const err = new Error(`no node '${id}' in ${rootDir}: the review of a draft is invoked on a node the record carries`);
    err.exitCode = 2;
    throw err;
  }
  if (node.stage !== "review") {
    const err = new Error(`${id} is at stage ${node.stage ?? "none"}, and the review of a draft runs on a node at stage review (its recommendation has just been recorded)`);
    err.exitCode = 2;
    throw err;
  }

  const effectiveDate = date ?? todayIsoUtc();
  const { ancestry, siblings, cited, index } = draftNeighbourhood(graph, node);
  const outFile = draftOutFile(node.slug);
  const briefPath = path.join(reviewDir, `draft-${node.slug}.brief.md`);

  const template = await readTemplate(DRAFT_TEMPLATE_PATH);
  const withoutNav = fill(template, {
    date: effectiveDate,
    repo: path.resolve(rootDir, ".."),
    id: node.id,
    node: renderWholeNode(node),
    ancestry: renderNodeList(ancestry, "(no node above it and no rule that binds everywhere: this node is a root)", { account: false }),
    siblings: renderNodeList(siblings, "(no sibling: no other node stands under the same parent)", { account: false }),
    cited: renderNodeList(cited, "(this node names no other node the parts above do not already carry)", { account: false }),
    index: index.length > 0
      ? index.map(renderContextNode).join("\n")
      : "(no other question: the parts above carry the whole record)",
    out: outFile,
  });
  const { text: filled, lines } = fillNav(withoutNav);

  const result = {
    briefPath,
    outFile,
    ancestryCount: ancestry.length,
    siblingCount: siblings.length,
    citedCount: cited.length,
    indexCount: index.length,
    lines,
  };
  if (dry) return result;

  await mkdir(reviewDir, { recursive: true });
  await writeFile(briefPath, filled);
  return result;
}

// ------------------------------------------------------ the frontier survey

/**
 * The sidecar the apply step compares against, written the moment the survey
 * is briefed: the graph commit the survey reads, the ids it judges, and the
 * recommendation hash of every node of the graph -- judged and context alike,
 * since a finding may name any node at any stage and a finding whose subject
 * has moved since is stale on its face (`clean-context-review`: "a review
 * attests to the text it read"). The apply step compares against this file
 * and never against a hash the reviewer copied.
 *
 * @returns {{commit: string|null, dirty: boolean, date: string,
 *   judged: string[], pins: Record<string, string>}}
 */
export function surveyPins({ graph, judged, date, commit, dirty }) {
  const pins = {};
  for (const n of graph.nodes) pins[n.id] = n.recommendationHash;
  return { commit, dirty, date, judged: judged.map((n) => n.id), pins };
}

/**
 * Write the survey's brief and its pins sidecar. The judged set is
 * `surveyJudges` -- every node at the review or ruling stage whose
 * recommendation has moved since the survey last pinned it, and every such
 * node no survey has read -- in the ruling order; the context is every other
 * node, in the frontier's order. No account goes into either.
 *
 * @returns {Promise<{briefPath: string, pinsPath: string, outFile: string,
 *   batchCount: number, contextCount: number, lines: number,
 *   commit: string|null, dirty: boolean}>}
 */
export async function writeSurveyBrief({ rootDir, reviewDir, date = null, dry = false }) {
  const graph = await readGraph(rootDir);
  const effectiveDate = date ?? todayIsoUtc();
  const { commit, dirty } = graphCommit(rootDir);

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const ordered = frontierOrderIds(graph).map((id) => byId.get(id)).filter(Boolean);

  const judged = [...surveyJudges(graph)].sort(rulingOrderCompare);
  const judgedIds = new Set(judged.map((n) => n.id));
  const contextNodes = ordered.filter((n) => !judgedIds.has(n.id));

  const briefPath = path.join(reviewDir, "survey.brief.md");
  const pinsPath = path.join(reviewDir, "survey.pins.json");

  const template = await readTemplate(SURVEY_TEMPLATE_PATH);
  const withoutNav = fill(template, {
    date: effectiveDate,
    repo: path.resolve(rootDir, ".."),
    commit: commitText({ commit, dirty }),
    batch_count: String(judged.length),
    context_count: String(contextNodes.length),
    batch_index: judged.length > 0
      ? judged.map(indexLine).join("\n")
      : "(nothing is judged: every node at the review or ruling stage carries a survey pin on the recommendation it now stands on)",
    context_index: contextNodes.length > 0
      ? contextNodes.map(contextIndexLine).join("\n")
      : "(no other node: the judged set is the whole graph)",
    batch: judged.length > 0
      ? judged.map((n) => renderWholeNode(n, { account: false })).join("\n")
      : "(nothing is judged: there is no entry to write in `nodes`)",
    context: contextNodes.length > 0
      ? contextNodes.map(renderContextNode).join("\n")
      : "(no other node: the judged set is the whole graph)",
    out: SURVEY_OUT_FILE,
    pins: SURVEY_PINS_FILE,
  });
  const { text: filled, lines } = fillNav(withoutNav);

  const result = {
    briefPath,
    pinsPath,
    outFile: SURVEY_OUT_FILE,
    batchCount: judged.length,
    contextCount: contextNodes.length,
    lines,
    commit,
    dirty,
  };
  if (dry) return result;

  await mkdir(reviewDir, { recursive: true });
  await writeFile(briefPath, filled);
  await writeFile(
    pinsPath,
    `${JSON.stringify(surveyPins({ graph, judged, date: effectiveDate, commit, dirty }), null, 2)}\n`,
  );
  return result;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  (async () => {
    let opts;
    try {
      opts = parseArgs(process.argv.slice(2));
    } catch (err) {
      process.stderr.write(`${err.message}\n${USAGE}\n`);
      process.exitCode = 2;
      return;
    }
    const rootDir = path.resolve(process.cwd(), opts.rootDir ?? "disposition");
    const reviewDir = path.resolve(process.cwd(), "tmp/review");
    try {
      if (opts.node !== null) {
        const r = await writeDraftBrief({ rootDir, reviewDir, id: opts.node, date: opts.date, dry: opts.dry });
        console.log(opts.dry ? `${r.briefPath} (dry run: nothing written)` : r.briefPath);
        console.log(`draft: ${opts.node}; ancestry ${r.ancestryCount}, siblings ${r.siblingCount}, cited ${r.citedCount}, index ${r.indexCount}; ${r.lines} lines`);
        console.log(`the reviewer's output file: ${r.outFile}`);
        if (r.lines > 4000) {
          process.stderr.write(`note: this brief is ${r.lines} lines; one reviewer may not hold it whole. Say so in the report if the reviewer could not read it all.\n`);
        }
      } else {
        const r = await writeSurveyBrief({ rootDir, reviewDir, date: opts.date, dry: opts.dry });
        console.log(opts.dry ? `${r.briefPath} (dry run: nothing written)` : r.briefPath);
        console.log(`survey: ${r.batchCount} node(s) judged; context: ${r.contextCount} node(s); ${r.lines} lines; graph commit ${commitText({ commit: r.commit, dirty: r.dirty })}`);
        console.log(opts.dry ? `the pins sidecar: ${r.pinsPath} (dry run: nothing written)` : `the pins sidecar: ${r.pinsPath}`);
        console.log(`the reviewer's output file: ${r.outFile}`);
        if (r.lines > 4000) {
          process.stderr.write(`note: this brief is ${r.lines} lines; one reviewer may not hold it whole. Say so in the report if the reviewer could not read it all.\n`);
        }
      }
    } catch (err) {
      process.stderr.write(`${err.message}\n`);
      process.exitCode = err.exitCode ?? 1;
    }
  })();
}
