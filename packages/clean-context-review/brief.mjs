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
// Which brief a `--node` review writes is read off the record and not off
// the verdict: a delta (re-reading) brief is written whenever the node's
// `review.commit` is set and the node's file has changed since that commit,
// whatever the last verdict was, forward or kickback, and whatever moved it
// -- a kickback repaired in a few sentences, or a survey's frontier finding
// landed on the node's own account. `review-cost`'s rule is that the
// re-reading's object is the amendment and not the node, and the amendment
// is the diff since the pin whichever reading or finding provoked it. A
// draft brief is written when no commit is pinned yet (no reading has run,
// or the graph was dirty when the last one did), or when the caller passes
// `--draft` to force it regardless of what the record would otherwise
// choose (`--fresh` remains as a deprecated alias). No `--delta` flag is
// needed to force the other way: wherever a commit is pinned and the file
// has moved, the delta is what the record already owes.
//
// Usage:
//   node brief.mjs --node <id> [rootDir] [--date YYYY-MM-DD] [--dry] [--draft]
//   node brief.mjs --survey    [rootDir] [--date YYYY-MM-DD] [--dry]

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  readGraph, surveyJudges, answerText, confirmedOption, resolveOptionContent,
} from "@commons.systems/disposition/read.mjs";
import { renderFrontier } from "@commons.systems/disposition/project.mjs";
import { concordance, nodeText } from "@commons.systems/disposition/concordance.mjs";
import { checkTier, tierNotes, loadFoldable, TIER_CHECKS } from "@commons.systems/disposition/tier.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRAFT_TEMPLATE_PATH = path.join(HERE, "brief-draft.md");
const DELTA_TEMPLATE_PATH = path.join(HERE, "brief-delta.md");
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
const deltaOutFile = (slug) => `tmp/review/delta-${slug}.json`;

export const USAGE = [
  "usage: node brief.mjs --node <id> [rootDir] [--date YYYY-MM-DD] [--dry] [--draft] [--out <file>]",
  "       node brief.mjs --survey    [rootDir] [--date YYYY-MM-DD] [--dry] [--whole]",
  "                                  [--validations-changed] [--force-tier] [--out <file>]",
  "                                  [--sidecar-dir <dir>]",
  "exactly one of --node <id> and --survey is given: the review of one draft,",
  "or the survey of the frontier. The choice between a draft brief and a",
  "delta (re-reading) brief is read off the record and not off a flag: a",
  "delta is written whenever the node's review.commit is set and its file",
  "has changed since, whatever the last verdict; --draft (--node only)",
  "forces the draft brief regardless (--fresh is a deprecated alias).",
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
  const opts = {
    node: null, survey: false, rootDir: null, date: null, dry: false, draft: false,
    whole: false, forceTier: false, validationsChanged: false, out: null,
    sidecarDir: null,
  };
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
    } else if (a === "--draft" || a === "--fresh") {
      // --fresh is a deprecated alias of --draft, kept so an existing
      // invocation (the align-review skill's own doc names it) still forces
      // the draft brief rather than failing on an unknown flag.
      opts.draft = true;
    } else if (a === "--whole") {
      // The whole survey, in which nothing is frozen (`survey-selection`:
      // "A whole survey, in which nothing is frozen, runs after every fourth
      // delta survey, at least once in any thirty days, and unconditionally
      // after any amendment to the validations").
      opts.whole = true;
    } else if (a === "--force-tier") {
      // For diagnosis only: the tier gates the launch, and a brief written
      // over a failing tier is stamped as one, in the brief itself.
      opts.forceTier = true;
    } else if (a === "--validations-changed") {
      opts.validationsChanged = true;
    } else if (a === "--out") {
      const v = argv[++i];
      if (v === undefined) throw new Error("--out needs a file");
      opts.out = v;
    } else if (a === "--sidecar-dir") {
      const v = argv[++i];
      if (v === undefined) throw new Error("--sidecar-dir needs a directory");
      opts.sidecarDir = v;
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
  if (opts.draft && opts.survey) {
    throw new Error("--draft forces the draft brief on a re-reading; the survey has no re-reading to force");
  }
  for (const [flag, on] of [["--whole", opts.whole], ["--validations-changed", opts.validationsChanged]]) {
    if (on && !opts.survey) {
      throw new Error(`${flag} is the survey's: a draft's reading selects nothing and freezes nothing`);
    }
  }
  if (opts.sidecarDir !== null && !opts.survey) {
    throw new Error("--sidecar-dir is the survey's: a draft or delta brief writes no sidecar");
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

/**
 * The readings that bear on one option, as the reader's inverse derives
 * them, each with the `source` its own node records -- the locus of the
 * tradition, which is what makes a reading citable and what
 * `frontier-consistency`'s reading of a tradition is checked against. A
 * reading listed by id alone tells the reader that a tradition was read and
 * not which one. `byId` is the graph's index where the caller holds one;
 * without it the source is simply not shown, since this must render for a
 * node object standing on its own.
 */
function readingsText(option, byId = null) {
  const readings = option.readings || [];
  if (readings.length === 0) return null;
  return readings.map((r) => {
    const source = byId ? (byId.get(r.id) || {}).source : null;
    return source ? `${r.id} (${r.relation}) — source: ${source}` : `${r.id} (${r.relation})`;
  }).join(", ");
}

/**
 * The readings that bear on one node, derived from the same data as the
 * per-option lines and not from a second scan: the reader writes every
 * reading's `bears` onto the option it bears on (`deriveReadings`), so the
 * node's own facts already carry the answer, and the two can no longer
 * disagree.
 *
 * They disagreed until 2026-09-07, and this is that fix. The neighbourhood
 * derivation asked which nodes' `bears` named this one and took that part
 * *after* `children`; but a reading is mounted `under` the node it bears on,
 * so every reading was claimed as a child first and the readings part came
 * out empty -- a brief saying "no reading bears on this node" directly above
 * option lines naming eight of them.
 *
 * @param {object} node
 * @returns {string[]} the reading ids, in the order the options list them,
 *   each once.
 */
export function readingIdsOn(node) {
  const ids = [];
  for (const fact of node.facts || []) {
    for (const option of fact.options || []) {
      for (const r of option.readings || []) {
        if (!ids.includes(r.id)) ids.push(r.id);
      }
    }
  }
  return ids;
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
function renderFacts(node, headingPrefix, byId = null) {
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
      const readings = readingsText(option, byId);
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
function renderWholeNode(node, { account = true, byId = null } = {}) {
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
  parts.push(...renderFacts(node, "#####", byId));

  parts.push("#### Recommendation (the recommended node in full, when the recommended option is not the one that stands)", "");
  if (node.fence && typeof node.fence.raw === "string") {
    parts.push("```markdown", node.fence.raw, "```", "");
  } else {
    parts.push("(no '## Recommendation' fence: the answer fact recommends the option that stands, or recommends nothing)", "");
  }

  if (account) {
    const { text: lastSection, omitted } = lastAccountSectionOnly(node.account);
    parts.push("#### Account (the AI's account: only the last '### ' section; the rest is on disk at the file above)", "");
    if (lastSection === null) {
      parts.push("(no '## Account' section)", "");
    } else {
      if (omitted > 0) {
        parts.push(`(${omitted} earlier '### ' section(s) of this account omitted; read them at ${nodeFile(node)} if the dialogue's history bears on your reading)`, "");
      }
      parts.push(lastSection, "");
    }
  }

  return parts.join("\n");
}

/**
 * One neighbour node, by what it answers and never by its whole file
 * (`review-cost`'s recommended answer: "A neighbour is carried by what it
 * answers and not by its whole file: its question, the answer that stands
 * on it, the answer it now recommends where those differ, and the names of
 * the options on its answer fact."): its id, its file, its question, its
 * status line, the answer that stands on it, the answer it now recommends
 * where that differs from what stands, and the names of the options on its
 * answer fact -- each with its source and whether it is recommended or
 * passed over -- one line apiece, no prose. Its rationale, its '## Facts'
 * prose, its `#### <option>` subsections and the rest of its
 * '## Recommendation' fence are that node's own dialogue and stay in the
 * file one read away, exactly as its '## Account' already does and for the
 * same reason (the same answer: "Its rationale, its facts prose, its
 * option subsections and the rest of its recommendation are its own
 * dialogue, and they stay in the file one read away, exactly as its
 * account does and for the same reason.").
 *
 * One exception, stated on `clean-context-review` and on `review-cost`: an
 * option on the neighbour's answer fact whose `source` is the draft under
 * review (`reviewedId`) is carried whole, its prose included, because it is
 * the draft's own text and not the neighbour's, and the validation asking
 * whether the draft contradicts a node above it turns on that prose. A
 * reader given only the option's name has been told that the draft wrote
 * something on its neighbour and not what it wrote. The prose is rendered
 * the same way `renderFacts` carries an option's prose for the node under
 * review itself -- indented under the option's own bullet, `option.prose`
 * already parsed from the neighbour's own `#### <option>` subsection at read
 * time -- so this invents no new markdown shape for it.
 *
 * Used for every part of a draft's neighbourhood -- ancestry, the rules of
 * the reading, children, siblings, cited, readings -- and never for the node
 * under review itself, which keeps `renderWholeNode`. Also used for the
 * survey's own neighbourhood (`surveyNeighbourhoodIds`), with `reviewedId`
 * given as `null` -- the survey judges a batch and not one draft, so no
 * option earns the "carried whole" exception there.
 *
 * @param {string|null} reviewedId - the id of the draft under review, whose
 *   own text is the source that earns an option this treatment; `null` where
 *   no single draft is under review (the survey).
 */
export function renderNeighbourNode(node, reviewedId) {
  const parts = [
    `### ${node.id}`,
    "",
    `- File: ${nodeFile(node)}`,
    `- Question: ${node.question}`,
    `- Stage: ${node.stage ?? "none"} | rank ${node.rank.toFixed(4)} | settles ${settlesText(node)} | status ${node.status} | class: ${classText(node)}`,
    "",
    "#### Answer (the text that stands)",
    "",
    node.answer || "(no '## Answer' section: nothing stands on this node yet)",
  ];

  const fact = node.answerFact;
  if (fact && fact.recommends && fact.recommends !== fact.stands) {
    const recommendedAnswer = node.fence && node.fence.sections ? node.fence.sections.Answer : null;
    parts.push(
      "",
      `#### Now recommends \`${fact.recommends}\` (differs from what stands)`,
      "",
      recommendedAnswer || "(no '## Answer' in the '## Recommendation' fence)",
    );
  }

  parts.push("", "#### The names of the options on its answer fact", "");
  if (fact && (fact.options || []).length > 0) {
    for (const option of fact.options) {
      const bits = [option.source ? `source ${option.source}` : "no source recorded"];
      if (fact.recommends === option.name) bits.push("recommended");
      if (option.status === "passed") bits.push("passed over");
      parts.push(`- \`${option.name}\` — ${bits.join(", ")}`);
      // The one exception: this option is the draft under review's own
      // text, so it is carried whole rather than by name alone.
      if (option.source === reviewedId) {
        const prose = option.prose && option.prose.length > 0 ? option.prose : missingProseText(fact, option);
        for (const line of prose.split("\n")) parts.push(`  ${line}`);
      }
    }
  } else {
    parts.push("(no answer fact: no decision is recorded on this node yet)");
  }

  return parts.join("\n");
}

function renderNeighbourNodeList(nodes, empty, reviewedId) {
  if (nodes.length === 0) return empty;
  return nodes.map((n) => renderNeighbourNode(n, reviewedId)).join("\n");
}

/**
 * One line for the index of every other question the record asks
 * (`review-cost`): the id, the question, and the file -- so a reader whose
 * question looks close to this one need not derive the path from the id --
 * and nothing else, since the answer behind the question is the survey's
 * object and not a draft reader's.
 */
function indexQuestionLine(node) {
  return `- ${node.id} | ${node.question} | ${nodeFile(node)}`;
}


/**
 * Fill `{{nav}}` last, from the filled text itself: a brief is long, and a
 * reader that must read it whole is told how long it is and where each of its
 * parts begins. The replacement is one line, as the placeholder's own line
 * is, so the line numbers it names stay true.
 */
function fillNav(text) {
  const rawLines = text.split("\n");
  // `text` ends in a newline (a filled template does), so splitting on "\n"
  // yields one trailing empty element that is not a line; drop it so the
  // count matches `wc -l` and the line numbers a reader pages by, and not
  // the one-too-many `split` gives a newline-terminated string.
  const lines = text.endsWith("\n") ? rawLines.slice(0, -1) : rawLines;
  const headings = [];
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^[ \t]*(`{3,}|~{3,})/.test(line)) fenced = !fenced;
    else if (!fenced && /^## /.test(line)) headings.push({ name: line.slice(3).trim(), line: i + 1 });
  });
  const where = headings.map((h) => `"## ${h.name}" at line ${h.line}`).join(", ");
  // `review-cost` fixes the measure: bytes and not lines, since this record
  // writes a paragraph as one unwrapped line and a line count flatters
  // whichever text has the shorter paragraphs. The line count stays beside it
  // because the reader pages by lines and the headings below name line
  // numbers.
  // The figure must be the size of the brief as written, and the sentence
  // stating it is part of that size, so the count is taken to a fixed point:
  // substituting a longer number lengthens the file by the digits it added,
  // and one or two rounds settle it. Line count is stable under the
  // substitution -- one line replaces one line -- and only bytes iterate.
  const fmt = (n) => n.toLocaleString("en-US");
  const navFor = (bytes) => `This brief is ${fmt(bytes)} bytes over ${fmt(lines.length)} lines. `
    + `Read it whole before writing anything: ${where}.`;
  let bytes = Buffer.byteLength(text, "utf8");
  let out = text;
  for (let round = 0; round < 8; round += 1) {
    out = rawLines.map((l) => (l === "{{nav}}" ? navFor(bytes) : l)).join("\n");
    const actual = Buffer.byteLength(out, "utf8");
    if (actual === bytes) break;
    bytes = actual;
  }
  return { text: out, lines: lines.length, bytes };
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

/**
 * The unified diff of one node's file between the commit a reading pinned
 * and the working tree, run in the graph's own checkout with `graphCommit`'s
 * pattern. `git show` first, to check the file resolves at that commit at
 * all -- a pin can name a commit the graph has since been rebased past, or a
 * node since moved to a different graph -- then `git diff` for the text
 * itself. Returns null, never throwing, on anything that keeps the diff from
 * being read: no git checkout, an unresolvable commit, a file git does not
 * find there. A re-reading falls back to the draft brief on null
 * (`review-cost`'s own fallback).
 */
export function nodeDiffSinceCommit(rootDir, commit, relPath) {
  const run = (args) => execFileSync("git", ["-C", rootDir, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  try {
    run(["show", `${commit}:${relPath}`]);
  } catch {
    return null;
  }
  try {
    return run(["diff", commit, "--", relPath]);
  } catch {
    return null;
  }
}

/**
 * Every fence-aware level-3 (`### `) heading in `text`, each `{name, index}`
 * (`index` the zero-based line the heading starts on) -- the scan
 * `lastCleanContextReviewSection` and `lastAccountSectionOnly` both build on,
 * factored once so a heading-looking line inside a fenced code block
 * (`apply.mjs`'s `headingBoundaries` guards the same case) is never mistaken
 * for a real one in either.
 */
function level3Headings(text) {
  const lines = text.split("\n");
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
  return { lines, headings };
}

/**
 * The node under review's `## Account` is its own dialogue's history, and a
 * node reviewed more than once accumulates one `### ` subsection per prior
 * reading -- so carrying it whole, as the account grows, is what pushes a
 * draft brief past the size a reader can hold (`review-cost`). Only the
 * **last** `### ` subsection bears on the reading now owed (the finding a
 * fresh reading must answer, or the record of the reading just before this
 * one); everything before it is history a session amending the draft has
 * already acted on. Returns `{text, omitted}`: `text` is the last section
 * verbatim, fence-aware, or the whole account where it carries no `### `
 * heading at all (untitled prose, nothing to cut); `omitted` is the count of
 * earlier sections left out, `0` when there is nothing to omit. `text` is
 * `null` only where there is no account at all.
 */
export function lastAccountSectionOnly(accountText) {
  if (!accountText) return { text: null, omitted: 0 };
  const { lines, headings } = level3Headings(accountText);
  if (headings.length === 0) return { text: accountText, omitted: 0 };
  const last = headings[headings.length - 1];
  return { text: lines.slice(last.index).join("\n").trimEnd(), omitted: headings.length - 1 };
}

/**
 * The last `### Clean-context review, <date>` or `### Clean-context
 * re-reading, <date>` subsection of a node's '## Account', verbatim,
 * fence-aware like `lastAccountSectionOnly` (built on the same
 * `level3Headings` scan). Matches whichever kind occurs last, and not only
 * a first reading's own heading: now that a kickback no longer forces a
 * fresh draft reading (`review-cost`'s re-reading is no longer capped at
 * one against the original draft), a re-reading can itself be repaired and
 * re-read, and the next delta's object is that re-reading, not the first
 * draft review buried beneath it -- "a re-reading is read against the
 * reading directly before it" now means whichever reading, of either kind,
 * came last. Returns null where the account carries neither heading, which
 * sends the caller back to the draft brief: there is nothing here to
 * re-read against.
 */
export function lastCleanContextReviewSection(accountText) {
  if (!accountText) return null;
  const { lines, headings } = level3Headings(accountText);
  let lastMatch = null;
  for (const h of headings) {
    if (/^Clean-context (?:review|re-reading), /.test(h.name)) lastMatch = h;
  }
  if (!lastMatch) return null;
  const at = headings.indexOf(lastMatch);
  const end = at + 1 < headings.length ? headings[at + 1].index : lines.length;
  return lines.slice(lastMatch.index, end).join("\n").trimEnd();
}

/**
 * Every `### Frontier finding, <date>` account section dated on or after
 * `sinceDate` (an ISO `YYYY-MM-DD`, comparable lexically), verbatim and
 * fence-aware like `lastAccountSectionOnly` -- the survey's own objections
 * raised against this node since the reading that pinned `review.commit`,
 * which a repair must answer alongside the previous reading's own findings
 * exactly as if a fresh draft review had raised them (`review-cost`: the
 * re-reading's object is the amendment, and the amendment answers whatever
 * the record has raised against the pinned text since, a survey's finding
 * included and not only the reading that pinned it). Matches only the bare
 * heading the survey's own apply step writes (`### Frontier finding,
 * <date>`) and not the titled variant a hand-authored finding may carry
 * (`### Frontier finding: <title>, <date>`), since only the former's date
 * sits where this function expects it; a titled finding is carried, if at
 * all, by the account subsection it stands beside. Returns `[]` on no
 * account, no `sinceDate`, or no matching section -- not an error, since
 * most re-readings answer no survey finding at all.
 */
export function frontierFindingSectionsSince(accountText, sinceDate) {
  if (!accountText || !sinceDate) return [];
  const { lines, headings } = level3Headings(accountText);
  const out = [];
  for (let i = 0; i < headings.length; i += 1) {
    const h = headings[i];
    const m = h.name.match(/^Frontier finding, (\d{4}-\d{2}-\d{2})$/);
    if (!m || m[1] < sinceDate) continue;
    const end = i + 1 < headings.length ? headings[i + 1].index : lines.length;
    out.push(lines.slice(h.index, end).join("\n").trimEnd());
  }
  return out;
}

/**
 * Which brief a `--node` review writes, decided from the record and never
 * from the verdict or a flag the session sets on its own account
 * (`review-cost`: "an amendment made for a reading's findings is read once
 * more, that re-reading's object being the amendment and not the node"). A
 * delta is owed whenever `review.commit` is set -- a reading has pinned a
 * commit -- and the node's file has changed since, whatever the last
 * verdict: a forward later amended, a kickback repaired in a few sentences,
 * or a node a survey's frontier finding sent back without ever touching
 * `review.verdict` at all. The verdict is not asked, because "whatever
 * moved it" includes cases the verdict cannot name: `apply.mjs` writes a
 * survey's finding onto a node's `## Account` and its answer fact and can
 * move its `stage` back to `maieutic` or `periagogic` without writing
 * `review.verdict: kickback`, and that amendment owes exactly the same
 * re-reading a kickback's does. `--draft` remains as an override that
 * always forces the draft brief regardless (`--fresh` is a deprecated
 * alias); no `--delta` flag is needed the other way, since wherever a
 * commit is pinned and the file has moved, the delta is what the record
 * already owes.
 *
 * Falls back to the draft brief, with `fallback: true` and a reason naming
 * it, wherever the re-reading has nothing to read against: no commit
 * pinned yet (no reading has run, or the review names no commit -- one
 * written before the `commit` key existed, or on a graph that was not a
 * git checkout at the time), a commit `git show` cannot resolve the node's
 * file at, or an account carrying no prior `### Clean-context review,` or
 * `### Clean-context re-reading,` subsection to re-read against.
 * `fallback: false` on a draft means there is nothing new to read at all
 * (no review yet, or the file matches the pinned commit exactly) and not
 * that a re-reading was owed and could not be produced.
 *
 * @returns {{mode: "draft"|"delta", reason: string, fallback: boolean,
 *   commit?: string, diff?: string, previous?: string,
 *   frontierFindings?: string[], kickback?: boolean}}
 */
export function chooseMode(node, { rootDir, draft }) {
  if (draft) {
    return { mode: "draft", reason: "--draft forces the draft brief regardless of what the record would otherwise choose", fallback: false };
  }
  if (!node.review || node.review.of === null) {
    return {
      mode: "draft",
      reason: "the node carries no draft review yet: this is its first reading",
      fallback: false,
    };
  }
  const commit = node.review.commit || null;
  if (!commit) {
    return {
      mode: "draft",
      reason: "the node's last review names no commit to diff against: nothing for a re-reading to read",
      fallback: true,
    };
  }
  const relPath = `${node.graph}/${node.slug}.md`;
  const diff = nodeDiffSinceCommit(rootDir, commit, relPath);
  if (diff === null) {
    return {
      mode: "draft",
      reason: `the review names commit ${commit}, but git could not resolve ${relPath} there`,
      fallback: true,
    };
  }
  if (diff.trim().length === 0) {
    return {
      mode: "draft",
      reason: "the node's file matches the commit its last review pinned: nothing for a re-reading to read",
      fallback: false,
    };
  }
  const previous = lastCleanContextReviewSection(node.account);
  if (!previous) {
    return {
      mode: "draft",
      reason: "the node's file has changed since its last review's pin, but its account carries no prior reading to re-read against",
      fallback: true,
    };
  }
  const kickback = node.review.verdict === "kickback";
  const frontierFindings = frontierFindingSectionsSince(node.account, node.review.date);
  return {
    mode: "delta",
    reason: kickback
      ? "the last reading kicked this answer back, and review.commit is set with the file since amended: the re-reading's object is the repair"
      : "review.commit is set and the node's file has changed since: a re-reading is owed on the difference, whatever moved it",
    fallback: false,
    commit,
    diff,
    previous,
    frontierFindings,
    kickback,
  };
}

// -------------------------------------------------- the review of one draft

/**
 * The twelve nodes that govern the reading itself and not the draft: what
 * the review is and what it judges, the validations, the two readings and
 * what each is given, the encoding's vocabulary (facts, options, rulings,
 * the derived class), and what a node is (`review-cost`: "the rules of the
 * reading itself in the same way rather than as a list of files for the
 * reader to open"). The same twelve for every draft, so this is one place to
 * edit them. Five are `tier: global` and so are already carried in
 * `ancestry` for every node; `draftNeighbourhood` takes `rules` after
 * `ancestry` so those five are not duplicated.
 */
export const READING_RULES = [
  "commons.systems/disposition-graph/recording",
  "commons.systems/disposition-graph/frontier-consistency",
  "commons.systems/disposition-graph/clean-context-review",
  "commons.systems/disposition-graph/viable-options",
  "commons.systems/disposition-graph/authority",
  "commons.systems/disposition-graph/unanswered",
  "commons.systems/disposition-graph/dialogue",
  "commons.systems/disposition-graph/node",
  "commons.systems/disposition-graph/evaluation",
  "commons.systems/disposition-graph/materialization",
  "commons.systems/disposition-graph/session-context",
  "commons.systems/disposition-graph/delegation",
];

/**
 * The neighbourhood a draft is judged against, from the record and never from
 * a set the session names (`clean-context-review`, `review-cost`): the chain
 * above it, the rules of the reading itself, the nodes under it, its siblings
 * under the same parent, the nodes it names, the readings that bear on it,
 * the round of other drafts that have moved since the survey last pinned
 * them, and every other question the record asks -- bounded to its id, its
 * question, and the file it is in, per `review-cost`'s answer, since the
 * answers behind those questions are the survey's object and not a draft
 * reader's.
 *
 * A node claimed by an earlier part is never repeated in a later one, the
 * parts taken in this order: the node itself, ancestry, rules, children,
 * siblings, readings, cited, round; whatever is left is the index.
 * `readings` is taken before `cited` -- and not the reverse, as an earlier
 * cut had it -- because a node whose `bears` names this one is always
 * already named in this node's own rendered text: every option's own
 * rendering quotes the readings that bear on it ("Readings bearing on it:
 * ..."), so `cited`'s plain substring search would claim a reading first on
 * every real node and leave `readings` permanently empty.
 *
 * - ancestry: every node above it by `under`, nearest first, plus every
 *   `tier: global` node not already in the chain (the rules that bind
 *   everywhere).
 * - rules: the `READING_RULES`, whole, so the reader is never told to go and
 *   open a file the brief could have carried.
 * - children: every node whose `under` names this node (`node.children`,
 *   already derived and sorted by the reader).
 * - siblings: every other node sharing one of its `under` parents.
 * - readings: every node whose `bears` names this node (the reader resolves
 *   `bears[].node` to a canonical id at parse time, defaulting it to a
 *   reading's sole parent, so a plain `n.bears[].node === node.id` check is
 *   enough).
 * - cited: every node whose id appears in the node's own rendered text, or in
 *   its `depends`, and that no earlier part already carries.
 * - round: every node `surveyJudges` owes a survey (on the review or ruling
 *   stage, with no survey pin or a stale one) other than this one -- the
 *   drafts written together with this one, so a contradiction between them
 *   is caught before the survey and not left to it. Given as pointers, not
 *   whole, since this part grows with the sitting and not with the draft.
 * - index: every remaining node.
 */
/**
 * Escape a string's regex metacharacters so it can be dropped into a
 * `RegExp` as a literal.
 */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whether `text` names node `n`: either its full id occurs and is not
 * immediately followed by an id-continuation character (so
 * `.../review` does not match inside `.../review-skills`), or its bare
 * slug occurs, bounded on the left against an id-continuation character
 * (so the slug is not matched inside a longer word or inside a full id
 * rule 1 already governs), immediately followed by whitespace and the
 * word "node" (the record's own way of naming a node by its slug, as in
 * "the checkpoint node requires").  A bare slug alone is deliberately not
 * a match: `under`, `node`, `growth` and `review` are all real slugs and
 * would otherwise match ordinary prose.
 */
function namesNode(text, n) {
  const idPattern = new RegExp(`${escapeRegExp(n.id)}(?![A-Za-z0-9-])`);
  if (idPattern.test(text)) return true;
  const slug = n.id.slice(n.id.lastIndexOf("/") + 1);
  const slugAsNode = new RegExp(`(?<![A-Za-z0-9-])${escapeRegExp(slug)}\\s+node\\b`);
  return slugAsNode.test(text);
}

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

  const rules = take(READING_RULES.map((id) => byId.get(id)));

  // Taken before 'children', 'siblings' and 'cited', and derived from the
  // node's own options first. A reading is mounted `under` the node it bears
  // on, so taking 'children' first claimed every reading as a child and left
  // this part empty: the brief then said "no reading bears on this node"
  // directly above option lines naming several of them. That was the state
  // until 2026-09-07, and this is the fix. `readingIdsOn` reads the ids off
  // the same `option.readings` the per-option lines render, so the two
  // cannot disagree; the `bears` scan stays beside it for a reading whose
  // `bears` names no option and which therefore reaches no option's list. A
  // 'bears' entry may omit 'node' -- it then means the node the reading is
  // mounted under -- and the reader canonicalizes that to the reading's sole
  // 'under' parent when there is exactly one, but this function trusts its
  // inputs and does not assume that resolution has already run, so the same
  // fallback is applied here.
  const readings = take([
    ...readingIdsOn(node).map((id) => byId.get(id)),
    ...graph.nodes.filter((n) => (n.bears || []).some(
      (b) => b.node === node.id || (!b.node && (n.under || []).includes(node.id)),
    )),
  ]);

  const children = take((node.children || []).map((id) => byId.get(id)));

  const parents = new Set(node.under || []);
  const siblings = take(graph.nodes.filter((n) => (n.under || []).some((p) => parents.has(p))));

  // The node's own text, as this brief renders it, is what "the nodes it
  // names" is read from: every section, every fact, every option's prose and
  // the fence, so a citation anywhere in the node is caught.
  const ownText = renderWholeNode(node);
  const cited = take(graph.nodes.filter((n) => (
    namesNode(ownText, n) || (node.depends || []).some((d) => d.id === n.id)
  )));

  const round = take([...surveyJudges(graph)].sort(rulingOrderCompare));

  const index = graph.nodes.filter((n) => !taken.has(n.id));
  return { ancestry, rules, children, siblings, readings, cited, round, index };
}

/**
 * The union, across every judged node, of the neighbourhood
 * `draftNeighbourhood` would carry whole for it -- ancestry, the reading
 * rules, children, siblings, cited nodes, and readings -- minus the judged
 * ids themselves. This is the survey's own neighbourhood (`review-cost`'s
 * "carried whole ... and their neighbourhoods by what they answer"): every
 * node connected to something the survey is judging this round is rendered
 * leanly (`renderNeighbourNode`), and every node connected to nothing judged
 * is left to the plain one-line index, since a contradiction between two
 * untouched nodes would already have been caught by an earlier survey.
 *
 * @param {object} graph
 * @param {object[]} judgedNodes
 * @returns {Set<string>}
 */
export function surveyNeighbourhoodIds(graph, judgedNodes) {
  const ids = new Set();
  for (const node of judgedNodes) {
    const { ancestry, rules, children, siblings, cited, readings } = draftNeighbourhood(graph, node);
    for (const list of [ancestry, rules, children, siblings, cited, readings]) {
      for (const n of list) ids.add(n.id);
    }
  }
  for (const node of judgedNodes) ids.delete(node.id);
  return ids;
}

/**
 * One line for the round: a sibling draft that has moved since the survey
 * last pinned it, given as a pointer and not whole (`review-cost`: "id,
 * question, and the recommendation each now makes, one line each, since
 * what the reader needs of a sibling draft is that it moved and what it
 * moved to, and the text that moved is one file away").
 */
function roundLine(node) {
  const recommends = node.answerFact ? node.answerFact.recommends : null;
  return `- ${node.id} | ${node.question} | now recommends: ${recommends ?? "(no answer fact recorded)"}`;
}

/**
 * Resolve the node a review is invoked on, or throw the exit-2 error the CLI
 * reports on stderr: no such node in the record, or a node at none of the
 * states a reading runs on. A reading runs the moment the recommendation is
 * recorded, which is the node's transition to the review stage; it runs
 * again on a node a forward left at the ruling stage whose recommendation
 * has since moved, which is the amendment a forward reading earns; and it
 * runs again wherever `review.commit` is set and the node's file has
 * changed since that commit, whatever the node's stage -- a kickback's
 * repair, or a node a survey's frontier finding sent back to `maieutic` or
 * `periagogic` without ever writing `review.verdict: kickback` at all
 * (`chooseMode` decides the same way and is the fuller account of why).
 * Without the second and third states the record deadlocks: the apply step
 * writes `ruling` on a forward or a kickback stage on a kickback, the
 * session or the survey then amends the node in answer, and the re-reading
 * that would re-pin the amended text could never be generated at all, so
 * the node would sit with a pin naming text nobody read. A ruling-stage
 * node whose pin still matches, and whose file matches the commit its
 * review pinned, is refused as before: it is ready to rule, and there is
 * nothing for a reading to read. Shared by the draft brief and the delta
 * brief, since both are invoked the same way, by `--node <id>`, and differ
 * only in which template the mode choice below sends them to.
 */
async function resolveReviewNode(rootDir, id) {
  const graph = await readGraph(rootDir);
  const node = graph.nodes.find((n) => n.id === id);
  if (!node) {
    const err = new Error(`no node '${id}' in ${rootDir}: the review of a draft is invoked on a node the record carries`);
    err.exitCode = 2;
    throw err;
  }
  const amendedAfterForward = node.stage === "ruling" && node.reviewStale;
  const commit = node.review && node.review.commit ? node.review.commit : null;
  const amendedSinceCommit = commit
    ? (() => {
      const diff = nodeDiffSinceCommit(rootDir, commit, `${node.graph}/${node.slug}.md`);
      return diff !== null && diff.trim().length > 0;
    })()
    : false;
  if (node.stage !== "review" && !amendedAfterForward && !amendedSinceCommit) {
    const at = node.stage === "ruling"
      ? `${id} is at stage ruling and its recommendation has not moved since its review's pin: it is ready for the author, and a reading has nothing to read`
      : `${id} is at stage ${node.stage ?? "none"}, and a reading runs on a node at stage review (its recommendation has just been recorded) or on one at stage ruling whose recommendation has moved since its review's pin (the amendment a forward earned), or on one whose review.commit is set and whose file has changed since (a kickback's repair, or a survey's finding)`;
    const err = new Error(at);
    err.exitCode = 2;
    throw err;
  }
  return { graph, node };
}

/**
 * Write the brief for the review of one draft. Refuses (letting the reader's
 * own message through) on a graph that does not validate, and refuses with an
 * exit-2 error on a node that does not exist or does not stand at the review
 * stage.
 *
 * @returns {Promise<{briefPath: string, outFile: string,
 *   ancestryCount: number, rulesCount: number, childrenCount: number,
 *   siblingCount: number, citedCount: number, readingsCount: number,
 *   roundCount: number, indexCount: number, lines: number, bytes: number}>}
 */
export async function writeDraftBrief({ rootDir, reviewDir, id, date = null, dry = false, out = null }) {
  const { graph, node } = await resolveReviewNode(rootDir, id);

  const effectiveDate = date ?? todayIsoUtc();
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const { ancestry, rules, children, siblings, cited, readings, round, index } = draftNeighbourhood(graph, node);
  const outFile = draftOutFile(node.slug);
  const briefPath = out ?? path.join(reviewDir, `draft-${node.slug}.brief.md`);

  const template = await readTemplate(DRAFT_TEMPLATE_PATH);
  const withoutNav = fill(template, {
    date: effectiveDate,
    repo: path.resolve(rootDir, ".."),
    id: node.id,
    node: renderWholeNode(node, { byId }),
    ancestry: renderNeighbourNodeList(ancestry, "(no node above it and no rule that binds everywhere: this node is a root)", node.id),
    rules: renderNeighbourNodeList(rules, "(none of the twelve rule nodes are in this graph: this is a fixture or test graph, not the record)", node.id),
    children: renderNeighbourNodeList(children, "(no node under it: nothing stands on this node)", node.id),
    siblings: renderNeighbourNodeList(siblings, "(no sibling: no other node stands under the same parent)", node.id),
    cited: renderNeighbourNodeList(cited, "(this node names no other node the parts above do not already carry)", node.id),
    readings: renderNeighbourNodeList(readings, "(no reading bears on this node)", node.id),
    round: round.length > 0
      ? round.map(roundLine).join("\n")
      : "(no other draft has moved since the survey last pinned it)",
    index: index.length > 0
      ? index.map(indexQuestionLine).join("\n")
      : "(no other question: the parts above carry the whole record)",
    out: outFile,
    graph_commit: commitText(graphCommit(rootDir)),
  });
  const { text: filled, lines, bytes } = fillNav(withoutNav);

  const result = {
    briefPath,
    outFile,
    ancestryCount: ancestry.length,
    rulesCount: rules.length,
    childrenCount: children.length,
    siblingCount: siblings.length,
    citedCount: cited.length,
    readingsCount: readings.length,
    roundCount: round.length,
    indexCount: index.length,
    lines,
    bytes,
  };
  if (dry) return result;

  await mkdir(reviewDir, { recursive: true });
  await mkdir(path.dirname(briefPath), { recursive: true });
  await writeFile(briefPath, filled);
  return result;
}

/**
 * Write the re-reading brief for one draft's amendment. Its object is the
 * amendment and not the node (`review-cost`): the node as it now stands, the
 * diff of its file since the commit the last reading pinned, and that
 * reading's own findings verbatim, and nothing of the neighbourhood a first
 * reading is given, since that question is already settled. Self-contained,
 * like `writeDraftBrief`: it resolves the node and re-derives the mode
 * itself with `chooseMode` rather than trusting a caller's prior call, and
 * refuses with the same exit-2 shape where the node cannot take a
 * re-reading -- the ordinary path calls `chooseMode` first and dispatches
 * here only on `mode: "delta"`, so this is a second guard against calling it
 * out of turn and not the first.
 *
 * @returns {Promise<{briefPath: string, outFile: string, lines: number,
 *   bytes: number}>}
 */
export async function writeDeltaBrief({ rootDir, reviewDir, id, date = null, dry = false, out = null }) {
  const { graph, node } = await resolveReviewNode(rootDir, id);
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const mode = chooseMode(node, { rootDir, draft: false });
  if (mode.mode !== "delta") {
    const err = new Error(`${id} cannot take a re-reading brief: ${mode.reason} -- write the draft brief instead`);
    err.exitCode = 2;
    throw err;
  }

  const effectiveDate = date ?? todayIsoUtc();
  const outFile = deltaOutFile(node.slug);
  const briefPath = out ?? path.join(reviewDir, `delta-${node.slug}.brief.md`);

  const template = await readTemplate(DELTA_TEMPLATE_PATH);
  const withoutNav = fill(template, {
    date: effectiveDate,
    repo: path.resolve(rootDir, ".."),
    id: node.id,
    node: renderWholeNode(node, { byId }),
    commit: mode.commit,
    diff: mode.diff.trim().length > 0
      ? mode.diff
      : "(no textual difference: the working tree matches the pinned commit at this file)",
    previous_reading: mode.previous,
    review_date: node.review.date,
    frontier_findings: mode.frontierFindings.length > 0
      ? mode.frontierFindings.join("\n\n")
      : "(no `### Frontier finding` section dated on or after the last review: the repair answers only the previous reading's findings above)",
    kickback_note: mode.kickback
      ? "**The last reading kicked this node back; the amendment below is the repair, and your object is whether each finding is answered.**\n\n"
      : "",
    graph_commit: commitText(graphCommit(rootDir)),
    out: outFile,
  });
  const { text: filled, lines, bytes } = fillNav(withoutNav);

  const result = { briefPath, outFile, lines, bytes };
  if (dry) return result;

  await mkdir(reviewDir, { recursive: true });
  await mkdir(path.dirname(briefPath), { recursive: true });
  await writeFile(briefPath, filled);
  return result;
}

// ------------------------------------------- the survey's own selection
//
// Everything below is `survey-selection`'s answer, made mechanical: the
// judged node carried once, the tier that gates the launch, the cuts that
// leave the frozen set behind with the evidence of what they cost, the two
// backstops, and the candidate pairs each handed to the reader with the key
// that nominated it.

/** The sidecar naming the cuts: what was frozen, what the probe drew, and
 * on what seed. `survey.pins.json` stays what the apply step compares
 * against; this is what a reader or a later survey audits the selection by,
 * since "what was not read is a fact of the run and not an inference from
 * the generator". */
const SURVEY_SELECTION_FILE = "tmp/review/survey.selection.json";
/** The record of which surveys ran whole and which ran as deltas. The two
 * backstops are counted over surveys and not over nodes, and no node
 * carries the count, so the generator keeps it itself. It lives under
 * `tmp/` with the briefs, so a lost history is read as "unknown", which
 * demands a whole survey rather than certifying a delta on no evidence. */
const SURVEY_HISTORY_FILE = "tmp/review/survey.history.json";

const ANSWER_FACT = "answer";
/** The backstops, in the answer's own numbers: a whole survey "runs after
 * every fourth delta survey, at least once in any thirty days", and the
 * probe is "one in twenty of the frozen pairs and never fewer than ten". */
const WHOLE_AFTER_DELTAS = 4;
const WHOLE_AFTER_DAYS = 30;
const PROBE_DENOMINATOR = 20;
const PROBE_FLOOR = 10;
/** "near-duplicate resemblance, a Jaccard similarity over word shingles of
 * a half or more". The shingle length is not fixed by the answer; three
 * words is the usual choice and is stated here rather than buried. */
const SHINGLE_WORDS = 3;
const JACCARD_THRESHOLD = 0.5;

function sha256(text) {
  return createHash("sha256").update(String(text), "utf8").digest("hex");
}

/**
 * The sentence saying what one option would answer -- "which is what the
 * fifteenth validation reads of an option".
 *
 * In the content encoding that is the option's own `sentence`, the prose
 * before its content. In the legacy encoding an option has no sentence and
 * carries `prose` instead, the whole `#### <name>` subsection, which is the
 * same text playing the same part; 152 of the record's 154 nodes are legacy
 * on 2026-09-07, so a survey that read only `sentence` would carry no
 * option text at all.
 */
export function optionSentence(option) {
  const sentence = option?.sentence;
  if (typeof sentence === "string" && sentence.trim().length > 0) return sentence.trim();
  const prose = option?.prose;
  if (typeof prose === "string" && prose.trim().length > 0) return prose.trim();
  return null;
}

/**
 * One option's resolved content, or null where the encoding carries none.
 * A resolution that throws is reported in place rather than thrown: the
 * tier's `option-content-unresolvable` check is what refuses the launch for
 * it, and a brief written over a forced tier must still say what it found.
 */
export function optionContentText(node, factName, option) {
  if (!option || !option.content) return null;
  try {
    return resolveOptionContent(node, factName, option.name);
  } catch (err) {
    return `(unresolvable: ${err.message})`;
  }
}

/** The option whose content is "the one answer that binds": the option last
 * confirmed, or, where none is confirmed, the one the answer fact
 * recommends. The other options of that fact are the rivals. */
export function carriedOptionName(node) {
  const fact = node?.answerFact ?? null;
  if (!fact) return null;
  return confirmedOption(node, ANSWER_FACT) ?? fact.recommends ?? null;
}

/**
 * The author's words one node's options carry, resolved from the ledger:
 * one entry per reference, in option order and, within an option, date
 * order, which is the order the fifth section hash is taken over. A
 * reference the ledger does not resolve is carried as an unresolved entry
 * rather than dropped -- the tier's `unresolved-words-reference` check is
 * what gates on it.
 */
export function nodeWords(node, words) {
  const ledger = words instanceof Map ? words : new Map();
  const out = [];
  for (const fact of node?.facts ?? []) {
    for (const option of fact.options ?? []) {
      const refs = [];
      for (const key of ["supports", "diverges"]) {
        for (const ref of option?.[key] ?? []) refs.push({ ref, relation: key });
      }
      refs.sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0));
      for (const { ref, relation } of refs) {
        const entry = ledger.get(ref) ?? null;
        out.push({
          fact: fact.name,
          option: option.name,
          relation,
          address: ref,
          date: entry ? entry.date : null,
          context: entry ? entry.context : null,
          text: entry ? entry.text : null,
        });
      }
    }
  }
  return out;
}

/**
 * The hashes of the five sections a survey's validations read, which is what
 * the survey leaves on the node and what the next survey's delta is taken
 * over: the question; the answer, being the resolved content of the option
 * last confirmed or, where none is, of the option the answer fact
 * recommends; the option names with their statuses and their sentences; the
 * resolved content of every other option on the answer fact; and the
 * author's words the options carry.
 *
 * The source of each option is in the third hash beside its status, since
 * the brief carries it and a source that moved is a different option; the
 * `ref` likewise. Nothing else is: "a change to the AI's accumulated support
 * or divergence on an option, to an account, or to a fact's reason
 * propagates nothing", which is what makes the accumulation's fold cost the
 * survey nothing.
 *
 * @returns {{question: string, answer: string, options: string, rivals: string, words: string}}
 */
export function sectionHashes(node, words = null) {
  const fact = node?.answerFact ?? null;
  const options = fact?.options ?? [];
  const carried = carriedOptionName(node);
  const optionLines = options
    .map((o) => [o.name, o.source ?? "", o.ref ?? "", o.status ?? "", optionSentence(o) ?? ""].join(" | "))
    .join("\n");
  const rivalLines = options
    .filter((o) => o.name !== carried)
    .map((o) => `${o.name} | ${optionContentText(node, ANSWER_FACT, o) ?? ""}`)
    .join("\n");
  const wordLines = nodeWords(node, words)
    .map((w) => `${w.address} | ${w.text ?? ""}`)
    .join("\n");
  return {
    question: sha256(node?.question ?? ""),
    answer: sha256(answerText(node) ?? ""),
    options: sha256(optionLines),
    rivals: sha256(rivalLines),
    words: sha256(wordLines),
  };
}

export const SECTION_HASH_KEYS = ["question", "answer", "options", "rivals", "words"];

/** Which of the five sections moved since a pin, in the pin's own terms. An
 * empty list is a node whose read text is what the survey read. */
export function movedSections(pinned, now) {
  if (!pinned || typeof pinned !== "object") return [];
  return SECTION_HASH_KEYS.filter((k) => typeof pinned[k] === "string" && pinned[k] !== now[k]);
}

/**
 * The judged set: "every node at the review or the ruling stage whose
 * recommendation has moved past its survey pin or that no survey has read"
 * -- which is `surveyJudges`, unchanged -- "together with every node whose
 * read text differs from the hash the last survey wrote on it".
 *
 * The second limb carries no stage: a node the survey read and whose text
 * has since moved is judged again wherever it stands, because the silence
 * of the earlier reading was about text that is no longer there. It can
 * only fire on a node carrying the five hashes, so it is inert until the
 * survey block records them.
 *
 * @returns {{judged: object[], reasons: Map<string, string>}}
 */
export function judgedSet(graph) {
  const words = graph?.words ?? null;
  const owed = new Set(surveyJudges(graph).map((n) => n.id));
  const judged = [];
  const reasons = new Map();
  for (const node of graph?.nodes ?? []) {
    if (owed.has(node.id)) {
      const pinned = node?.review?.survey ?? null;
      reasons.set(node.id, pinned === null
        ? "no survey has read it"
        : "its recommendation has moved past its survey pin");
      judged.push(node);
      continue;
    }
    const pinned = node?.review?.survey?.text ?? null;
    if (pinned === null || pinned === undefined) continue;
    const moved = movedSections(pinned, sectionHashes(node, words));
    if (moved.length === 0) continue;
    reasons.set(node.id, `its read text moved since the survey pinned it: ${moved.join(", ")}`);
    judged.push(node);
  }
  return { judged, reasons };
}

// ------------------------------------------------------- candidate pairs

const pairId = (a, b) => (a < b ? `${a}\t${b}` : `${b}\t${a}`);

function addPair(map, a, b, key) {
  if (a === b) return;
  const id = pairId(a, b);
  let entry = map.get(id);
  if (!entry) {
    entry = { a: a < b ? a : b, b: a < b ? b : a, keys: [] };
    map.set(id, entry);
  }
  if (!entry.keys.includes(key)) entry.keys.push(key);
}

function pairsAmong(map, ids, key) {
  const list = [...new Set(ids)];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) addPair(map, list[i], list[j], key);
  }
}

/** The word shingles of one node's text: `SHINGLE_WORDS` consecutive
 * lowercased words, as a set, which is what the Jaccard is taken over. */
export function shingles(text) {
  const words = String(text).toLowerCase().match(/[a-z0-9']+/g) ?? [];
  const out = new Set();
  for (let i = 0; i + SHINGLE_WORDS <= words.length; i += 1) {
    out.add(words.slice(i, i + SHINGLE_WORDS).join(" "));
  }
  return out;
}

export function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let shared = 0;
  for (const s of small) if (large.has(s)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/**
 * Every candidate pair the cheap keys nominate, each with the keys that
 * nominated it: a term one node defines and the other uses (never two users
 * of the same term with each other), an entry of the author's words
 * referenced by options on both, a citation either way in prose or in
 * `depends`, a shared parent, and near-duplicate resemblance.
 *
 * "A key narrows attention and never the corpus": this list orders the
 * reading and does not partition the brief, and every node the brief
 * carries stays readable whether a key reached it or not.
 *
 * @param {object} graph
 * @param {{concordance?: object}} [options] - a concordance already
 *   computed (the tier has one), to save the second walk.
 * @returns {Array<{a: string, b: string, keys: string[]}>}
 */
export function candidatePairs(graph, { concordance: conc = null } = {}) {
  const nodes = graph?.nodes ?? [];
  const ids = new Set(nodes.map((n) => n.id));
  const map = new Map();

  // a term where one node defines it and the other uses it -- never two
  // users of the same term with each other. Pairing every user with every
  // other user is what made this key select nothing on the record: 31 of
  // 120 terms are used by 100+ nodes, so one term turned into thousands of
  // user-user pairs nobody asked for. The definer-user edge is the one the
  // concordance relation actually distinguishes (`entry.users[].reachable`
  // is a path from a user to the definer, not between users), so that is
  // the only edge nominated here, and the pair's key names the term and the
  // node that defines it.
  const terms = (conc ?? concordance(graph)).terms;
  for (const entry of terms) {
    for (const user of entry.users) {
      addPair(map, entry.defines, user.node, `term:${entry.term} (defines: ${entry.defines})`);
    }
  }

  // an entry of the author's words referenced by options on both
  const byWord = new Map();
  for (const node of nodes) {
    for (const w of nodeWords(node, graph?.words ?? null)) {
      if (!byWord.has(w.address)) byWord.set(w.address, new Set());
      byWord.get(w.address).add(node.id);
    }
  }
  for (const [address, users] of byWord) pairsAmong(map, [...users], `words:${address}`);

  // a shared parent
  const byParent = new Map();
  for (const node of nodes) {
    for (const parent of node.under ?? []) {
      if (!byParent.has(parent)) byParent.set(parent, new Set());
      byParent.get(parent).add(node.id);
    }
  }
  for (const [parent, kin] of byParent) pairsAmong(map, [...kin], `parent:${parent}`);

  // a citation either way, in prose or in `depends`
  const texts = new Map(nodes.map((n) => [n.id, nodeText(n)]));
  for (const node of nodes) {
    for (const d of node.depends ?? []) {
      if (ids.has(d.id)) addPair(map, node.id, d.id, "depends");
    }
    const text = texts.get(node.id) ?? "";
    for (const other of nodes) {
      if (other.id === node.id) continue;
      if (namesNode(text, other)) addPair(map, node.id, other.id, "cites");
    }
  }

  // near-duplicate resemblance
  const shingled = nodes.map((n) => ({ id: n.id, set: shingles(texts.get(n.id) ?? "") }));
  for (let i = 0; i < shingled.length; i += 1) {
    for (let j = i + 1; j < shingled.length; j += 1) {
      const score = jaccard(shingled[i].set, shingled[j].set);
      if (score >= JACCARD_THRESHOLD) {
        addPair(map, shingled[i].id, shingled[j].id, `jaccard:${score.toFixed(2)}`);
      }
    }
  }

  const out = [...map.values()];
  out.sort((x, y) => (x.a < y.a ? -1 : x.a > y.a ? 1 : x.b < y.b ? -1 : x.b > y.b ? 1 : 0));
  return out;
}

// ------------------------------------------------- the cut, and the probe

/**
 * Whether one earlier survey read these two nodes together. The pairs a
 * survey read are what it leaves on each node it touched
 * (`review.survey.pairs`), so that is read first; where a node carries none
 * -- every node of the record on 2026-09-07, the survey block being `date`
 * and `of` alone -- two nodes pinned by the same survey date were in the
 * same survey's one context and were read together, which is the weaker
 * fact the record can still tell today.
 */
export function readTogether(a, b) {
  const pairsOf = (node) => node?.review?.survey?.pairs ?? null;
  const names = (list, id) => (list ?? []).some((p) => (
    typeof p === "string" ? p === id : (p?.node === id || p?.with === id)
  ));
  if (pairsOf(a) !== null || pairsOf(b) !== null) {
    return names(pairsOf(a), b.id) || names(pairsOf(b), a.id);
  }
  const da = a?.review?.survey?.date ?? null;
  const db = b?.review?.survey?.date ?? null;
  return da !== null && da === db;
}

/**
 * The cut: "a pair both of whose members are unchanged since a survey read
 * them together is not compared. The frozen set is everything so struck."
 * `whole` freezes nothing, which is what a whole survey is.
 */
export function cutPairs(pairs, { byId, judgedIds, whole = false }) {
  if (whole) return { live: pairs, frozen: [] };
  const live = [];
  const frozen = [];
  for (const pair of pairs) {
    const a = byId.get(pair.a);
    const b = byId.get(pair.b);
    const unchanged = a && b && !judgedIds.has(pair.a) && !judgedIds.has(pair.b);
    if (unchanged && readTogether(a, b)) frozen.push(pair);
    else live.push(pair);
  }
  return { live, frozen };
}

/** A 32-bit seed from the run's own two facts, the date and the graph
 * commit, so that the draw is reproducible from what the brief already
 * records and the seed is not a number out of nowhere. */
export function probeSeed(date, commit) {
  return parseInt(sha256(`${date} ${commit ?? "none"}`).slice(0, 8), 16) >>> 0;
}

/** mulberry32: a seeded generator small enough to read, which is what the
 * answer asks for -- "drawn by a seeded generator whose seed the run
 * records". */
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The drift probe: "a random sample of one in twenty of the frozen pairs
 * and never fewer than ten", drawn on the seed, and the whole frozen set
 * where it holds fewer than ten pairs.
 */
export function drawProbe(frozen, seed) {
  const want = Math.max(PROBE_FLOOR, Math.ceil(frozen.length / PROBE_DENOMINATOR));
  if (frozen.length <= want) return [...frozen];
  const random = seededRandom(seed);
  const pool = [...frozen];
  const out = [];
  for (let i = 0; i < want; i += 1) {
    const k = i + Math.floor(random() * (pool.length - i));
    const swap = pool[i];
    pool[i] = pool[k];
    pool[k] = swap;
    out.push(pool[i]);
  }
  out.sort((x, y) => (x.a < y.a ? -1 : x.a > y.a ? 1 : x.b < y.b ? -1 : x.b > y.b ? 1 : 0));
  return out;
}

// ------------------------------------------------------- the two backstops

function daysBetween(fromIso, toIso) {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return Infinity;
  return Math.round((to - from) / 86400000);
}

/**
 * Whether this survey must run whole, and why.
 *
 * Three conditions, all of them the answer's: a whole survey "runs after
 * every fourth delta survey, at least once in any thirty days, and
 * unconditionally after any amendment to the validations, to what a reading
 * is given, or to the tier".
 *
 * The third is a flag and not a derivation, and deliberately: the record
 * cannot detect a validations amendment mechanically. The validations are
 * prose in `frontier-consistency`'s answer, what a reading is given is
 * prose in `review-cost`'s, and the tier is code in this repository and a
 * paragraph in `survey-selection`'s -- three places in two refs, none of
 * which is marked as "the validations" in a way a generator could hash. A
 * derivation that hashed those three nodes whole would fire on any
 * amendment to any part of them, which is a different rule from the one the
 * answer states and would quietly make every survey whole. So the caller
 * says so, `--validations-changed`, and the fact that it was said is
 * recorded in the brief and in the history, where a later reader can check
 * it against the amendment.
 *
 * A history the generator cannot read is unknown and not clean: with no
 * record of when the last whole survey ran, neither backstop can be
 * certified, so the survey runs whole.
 */
export function wholeDemand(history, { date, validationsChanged = false, forced = false }) {
  const surveys = Array.isArray(history?.surveys) ? history.surveys : null;
  if (validationsChanged) {
    return {
      whole: true,
      demanded: true,
      why: "the caller passed --validations-changed: an amendment to the validations, to what a reading is given, or to the tier invalidates every earlier reading's silence",
    };
  }
  if (surveys === null) {
    return {
      whole: true,
      demanded: true,
      why: `no survey history at ${SURVEY_HISTORY_FILE}: neither backstop can be certified, so nothing is frozen`,
    };
  }
  const lastWhole = [...surveys].reverse().find((s) => s && s.whole === true) ?? null;
  if (lastWhole === null) {
    return {
      whole: true,
      demanded: true,
      why: "no whole survey in the history: the thirty-day backstop has never been met",
    };
  }
  const age = daysBetween(lastWhole.date, date);
  if (age > WHOLE_AFTER_DAYS) {
    return {
      whole: true,
      demanded: true,
      why: `the last whole survey was ${lastWhole.date}, ${age} days ago: a whole survey runs at least once in any thirty days`,
    };
  }
  const sinceWhole = surveys.slice(surveys.lastIndexOf(lastWhole) + 1).filter((s) => s && s.whole !== true);
  if (sinceWhole.length >= WHOLE_AFTER_DELTAS) {
    return {
      whole: true,
      demanded: true,
      why: `${sinceWhole.length} delta survey(s) have run since the last whole one on ${lastWhole.date}: a whole survey runs after every fourth`,
    };
  }
  return {
    whole: forced,
    demanded: false,
    why: forced
      ? "the caller passed --whole: nothing is frozen"
      : `the last whole survey was ${lastWhole.date} (${age} day(s) ago) with ${sinceWhole.length} delta(s) since: both backstops are met, so this survey is a delta`,
  };
}

/** The history, or null where there is none to read. A malformed file is
 * unknown for the same reason a missing one is, and demands a whole survey
 * rather than being repaired in silence. */
export async function readSurveyHistory(historyPath) {
  try {
    const parsed = JSON.parse(await readFile(historyPath, "utf8"));
    return Array.isArray(parsed?.surveys) ? parsed : null;
  } catch {
    return null;
  }
}

export async function appendSurveyHistory(historyPath, history, entry) {
  const surveys = Array.isArray(history?.surveys) ? [...history.surveys] : [];
  surveys.push(entry);
  await writeFile(historyPath, `${JSON.stringify({ surveys }, null, 2)}\n`);
}

// ------------------------------------------- rendering what the cut left

/**
 * One judged node, carried once (`survey-selection`: "The judged node is
 * carried once"): its question, the author's words its options carry, the
 * one answer that binds it, and, of its answer fact, each option's name,
 * source, ref and status with the sentence saying what it would answer,
 * then the resolved content of every other option on that fact.
 *
 * What is not here is the point of it. The prose of its facts and the AI's
 * accumulated support and divergence on its options are struck, because no
 * validation from the seventh to the sixteenth reads them and
 * `review-cost`'s rule is that a part no validation reaches is struck
 * rather than shortened. The account is struck for the reason
 * `clean-context-review` gives. And the answer appears once: the structured
 * render of the standing node that `renderWholeNode` puts beside it is the
 * same text twice, which is exactly the double carriage the answer forbids.
 *
 * The heading, the file and the stage line stay: a reading's heading is an
 * address, and a finding names the node it is written on.
 */
export function renderJudgedNode(node, words = null, byId = null) {
  const parts = [
    `### ${node.id}`,
    "",
    `- File: ${nodeFile(node)}`,
    `- Question: ${node.question}`,
    `- Stage: ${node.stage} | rank ${node.rank.toFixed(4)} | settles ${settlesText(node)} | status ${node.status} | class: ${classText(node)}`,
    `- Depends: ${dependsText(node)} | under: ${(node.under || []).join(", ") || "none"}`,
  ];
  const defines = definesText(node);
  if (defines) parts.push(`- Defines: ${defines}`);
  const bears = bearsText(node);
  if (bears) parts.push(`- Bears on (this node is a reading): ${bears}`);
  parts.push(`- Review state: ${reviewLine(node)}`);

  const carried = carriedOptionName(node);
  const fact = node.answerFact ?? null;
  const options = fact ? (fact.options || []) : [];

  parts.push("", "#### The author's words its options carry", "");
  const said = nodeWords(node, words);
  if (said.length === 0) {
    parts.push("(no option on this node references an entry of the ledger of the author's words)");
  } else {
    for (const w of said) {
      parts.push(`- \`${w.option}\` (${w.fact}) ${w.relation} ${w.address}${w.date ? `, ${w.date}` : ""}${w.context ? ` — ${w.context}` : ""}`);
      const text = w.text ?? "(unresolved: the ledger has no such entry)";
      for (const line of text.split("\n")) parts.push(`  > ${line}`);
    }
  }

  parts.push(
    "",
    `#### The one answer that binds${carried ? ` (the resolved content of \`${carried}\`)` : ""}`,
    "",
    answerText(node) || "(no answer stands and none is recommended: nothing binds on this node yet)",
    "",
    "#### The options on its answer fact",
    "",
  );
  if (options.length === 0) {
    parts.push("(no answer fact: no decision is recorded on this node yet)");
  } else {
    for (const option of options) {
      const bits = [
        option.source ? `source ${option.source}` : "no source recorded",
        option.ref ? `ref ${option.ref}` : "no ref",
        option.status ? `status ${option.status}` : "no status",
      ];
      if (fact.recommends === option.name) bits.push(`recommended, boldness ${fact.boldness}`);
      if (option.name === carried) bits.push("this is the answer above");
      if (option.ruling) bits.push(`ruled ${option.ruling.response} on ${option.ruling.date}, pinning ${option.ruling.of}`);
      parts.push(`- \`${option.name}\` — ${bits.join(", ")}`);
      const readings = readingsText(option, byId);
      if (readings) parts.push(`  - Readings bearing on it: ${readings}`);
      const sentence = optionSentence(option);
      for (const line of (sentence ?? "(no sentence: this option says nothing about what it would answer)").split("\n")) {
        parts.push(`  ${line}`);
      }
    }
  }

  parts.push("", "#### The content of every other option on the answer fact", "");
  const rivals = options.filter((o) => o.name !== carried);
  if (rivals.length === 0) {
    parts.push("(no rival: the answer fact carries one option, or none)");
  } else {
    for (const option of rivals) {
      const content = optionContentText(node, ANSWER_FACT, option);
      parts.push(`##### \`${option.name}\``, "");
      if (content === null) {
        parts.push("(this node is in the legacy encoding: the option carries no content of its own, and what it would answer is its sentence above)", "");
      } else {
        parts.push("```markdown", content, "```", "");
      }
    }
  }

  return `${parts.join("\n").replace(/\n+$/, "")}\n`;
}

/** One candidate pair, as the reader is handed it: the two nodes and the
 * keys that nominated it, "so the reader is told where to look and what to
 * look for". */
export function pairLine(pair) {
  return `- ${pair.a} + ${pair.b} — key(s): ${pair.keys.join("; ")}`;
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
  const text = {};
  for (const n of graph.nodes) {
    pins[n.id] = n.recommendationHash;
    // The five section hashes beside the recommendation hash, so the apply
    // step writes what the survey actually read rather than deriving it
    // again from a tree that may have moved between the brief and the apply
    // (`survey-selection`: "the hashes of the five sections its validations
    // read"). The next survey's delta is taken over these.
    text[n.id] = sectionHashes(n, graph.words);
  }
  return { commit, dirty, date, judged: judged.map((n) => n.id), pins, text };
}

/**
 * Write the survey's brief and its two sidecars.
 *
 * The judged set is `judgedSet` -- every node at the review or ruling stage
 * whose recommendation has moved past its survey pin or that no survey has
 * read, together with every node whose read text differs from the five
 * hashes the last survey wrote on it -- in the ruling order, each carried
 * once (`renderJudgedNode`).
 *
 * The **neighbourhood** of the judged set (`surveyNeighbourhoodIds`) --
 * everything their ancestry, the reading rules, children, siblings, cited
 * nodes and readings reach -- is carried leanly, by what it answers
 * (`renderNeighbourNode`), in the frontier's order, except for a neighbour
 * "whose read text has not changed since that survey", which is carried on
 * one line "because the pair has already been read once". Every other node
 * is one line, in the frontier's order. No account goes into any of them.
 *
 * Three things happen before any of that, and they are the answer's order:
 * the mechanical tier runs over the whole graph and refuses the launch on a
 * finding (`forceTier` bypasses it and stamps the brief); the two backstops
 * are checked and may demand a whole survey; and the candidate pairs are
 * nominated and cut, leaving the frozen set and the drift probe drawn from
 * it on the recorded seed.
 *
 * @returns {Promise<object>} the counts the CLI prints, the selection it
 *   took, and the paths it wrote.
 */
export async function writeSurveyBrief({
  rootDir, reviewDir, date = null, dry = false,
  whole = false, forceTier = false, validationsChanged = false, out = null,
  sidecarDir = null,
}) {
  // The three sidecars (`survey.history.json`, `survey.pins.json`,
  // `survey.selection.json`) default to `reviewDir`, same as ever; a caller
  // that wants the brief written to `--out` without disturbing the record's
  // own sidecars (a test run against the real graph, say) passes
  // `sidecarDir` to redirect them alone. The brief itself still falls under
  // `reviewDir` unless `out` overrides it.
  const sidecarBase = sidecarDir ?? reviewDir;
  const graph = await readGraph(rootDir);
  const effectiveDate = date ?? todayIsoUtc();
  const { commit, dirty } = graphCommit(rootDir);

  // The tier gates the launch: "no reader is launched while one of them
  // reports a finding". It runs over the whole graph and not over the judged
  // set, because a finding on a node the survey merely reads as context is
  // still a defect the reader would spend its context on.
  const conc = concordance(graph);
  const foldable = await loadFoldable();
  const tierFindings = checkTier(graph, { words: graph.words, foldable, concordance: conc });
  const notes = tierNotes(graph, { words: graph.words });
  if (tierFindings.length > 0 && !forceTier) {
    const shown = tierFindings.slice(0, 20)
      .map((f) => `  ${f.check}: ${f.node ?? "(graph)"}: ${f.detail}`);
    const err = new Error(
      `the mechanical tier reports ${tierFindings.length} finding(s) over ${TIER_CHECKS.length} checks, `
      + "so no reader is launched: repair the nodes or kick them back.\n"
      + `${shown.join("\n")}\n`
      + (tierFindings.length > shown.length ? `  ... and ${tierFindings.length - shown.length} more (node packages/disposition/validate.mjs ${rootDir} --tier)\n` : "")
      + "Pass --force-tier to write the brief anyway, for diagnosis; the brief then says it was launched over a failing tier.",
    );
    err.exitCode = 3;
    err.tierFindings = tierFindings;
    throw err;
  }

  // The two backstops. `--whole` forces a whole survey; the history may
  // demand one whether the caller asked or not, and the demand is recorded
  // with its reason so the run says why nothing was frozen.
  const historyPath = path.join(sidecarBase, "survey.history.json");
  const history = await readSurveyHistory(historyPath);
  const demand = wholeDemand(history, {
    date: effectiveDate, validationsChanged, forced: whole,
  });
  const isWhole = demand.whole;

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const ordered = frontierOrderIds(graph).map((id) => byId.get(id)).filter(Boolean);

  const { judged: judgedUnordered, reasons } = judgedSet(graph);
  const judged = [...judgedUnordered].sort(rulingOrderCompare);
  const judgedIds = new Set(judged.map((n) => n.id));
  const neighbourIds = surveyNeighbourhoodIds(graph, judged);

  // "a node the judged set reaches but whose read text has not changed since
  // that survey is carried on one line rather than by what it answers": a
  // neighbour a survey has already read and that is not judged this round.
  // A whole survey freezes nothing and carries every neighbour by what it
  // answers.
  const reached = ordered.filter((n) => neighbourIds.has(n.id));
  const unchangedReached = isWhole
    ? []
    : reached.filter((n) => (n.review?.survey ?? null) !== null);
  const unchangedIds = new Set(unchangedReached.map((n) => n.id));
  const neighbourNodes = reached.filter((n) => !unchangedIds.has(n.id));
  const contextNodes = ordered.filter((n) => !judgedIds.has(n.id) && !neighbourIds.has(n.id));

  // The pairs, and the cut that leaves the frozen set behind.
  const pairs = candidatePairs(graph, { concordance: conc });
  const { live, frozen } = cutPairs(pairs, { byId, judgedIds, whole: isWhole });
  const seed = probeSeed(effectiveDate, commit);
  const probe = isWhole ? [] : drawProbe(frozen, seed);
  const probeIds = new Set(probe.map((p) => `${p.a}\t${p.b}`));

  const briefPath = out ?? path.join(reviewDir, "survey.brief.md");
  const pinsPath = path.join(sidecarBase, "survey.pins.json");
  const selectionPath = path.join(sidecarBase, "survey.selection.json");

  // The six named blocks the template places where its reader needs them
  // (`brief-survey.md`): the tier stamp and the selection summary near the
  // top with the scope, the judged index right under "## The judged set",
  // the live pairs and the drift probe where the reader is told what to
  // compare, and the reached-but-unchanged lines with the neighbourhood.
  // Each fills its own named placeholder; none of them is folded into a
  // single `###`-headed blob the way `batch_index` used to carry all six.
  const tierStamp = [
    `- The mechanical tier ran ${TIER_CHECKS.length} checks (${TIER_CHECKS.join(", ")}) and reported `
      + `${tierFindings.length} finding(s)${notes.length > 0 ? `, with ${notes.length} note(s) beside it, gating nothing` : ""}.`
      + " A clean tier is not a clean frontier: these checks are what a machine can decide, and nothing else.",
    tierFindings.length > 0
      ? `- **This brief was launched over a failing tier (\`--force-tier\`), for diagnosis.** ${tierFindings.length} finding(s) stand unrepaired; treat what they name with suspicion.`
      : null,
  ].filter((line) => line !== null).join("\n");

  const selectionSummary = [
    "### The selection this survey took, and what it cost",
    "",
    `- **This survey is ${isWhole ? "whole" : "a delta"}.** ${demand.why}`,
    `- The judged set is ${judged.length} node(s); the neighbourhood carried by what it answers is ${neighbourNodes.length}; `
      + `${unchangedReached.length} node(s) the judged set reaches are carried on one line, their read text unchanged since a survey read them; `
      + `${contextNodes.length} node(s) are context.`,
    `- The keys nominated ${pairs.length} candidate pair(s): ${live.length} are live and listed below, `
      + `${frozen.length} are frozen (both members unchanged since a survey read them together) and named in \`${SURVEY_SELECTION_FILE}\`.`,
    isWhole
      ? "- Nothing is frozen and there is no drift probe: this survey is whole."
      : `- The drift probe draws ${probe.length} of the ${frozen.length} frozen pair(s), one in ${20} and never fewer than ${10}, on seed \`${seed}\` (mulberry32, seeded from the date and the graph commit). A finding anywhere in the probe forces a whole survey next time: say so in your report.`,
    "",
    "The frozen set is named so that what was not read is a fact of this run and not an inference from the generator. A finding on a pair no key nominated is a finding like any other, and is the one worth most: it measures what the keys miss.",
  ].join("\n");

  const judgedIndex = [
    "### The judged set, in the ruling order",
    "",
    judged.length > 0
      ? judged.map((n) => `${indexLine(n)} | judged because ${reasons.get(n.id) ?? "the survey owes it a reading"}`).join("\n")
      : "(nothing is judged: every node at the review or ruling stage carries a survey pin on the recommendation it now stands on)",
  ].join("\n");

  const livePairs = [
    `### The candidate pairs (${live.length} live${isWhole ? "" : `, ${probe.length} of them the drift probe`}), each with the key that nominated it`,
    "",
    "A key narrows attention and never the corpus: every node this brief carries stays readable, and this list orders your reading rather than partitioning it. Record the key with any finding it produced, so a key's yield is measurable across surveys.",
    "",
    live.length > 0 ? live.map(pairLine).join("\n") : "(no key nominated a live pair this round)",
  ].join("\n");

  const driftProbe = probe.length > 0
    ? [
      `#### The drift probe (${probe.length} frozen pair(s), drawn on seed \`${seed}\`; read them like any other pair)`,
      "",
      probe.map(pairLine).join("\n"),
    ].join("\n")
    : "(no drift probe this round: this survey is whole, or the frozen set holds nothing to draw from)";

  const reachedUnchanged = unchangedReached.length > 0
    ? [
      `#### Reached but unchanged (${unchangedReached.length} node(s), one line each: a survey has read each of them and its text has not moved since)`,
      "",
      unchangedReached.map(contextIndexLine).join("\n"),
    ].join("\n")
    : "(no node the judged set reaches is unchanged since a survey read it)";

  const template = await readTemplate(SURVEY_TEMPLATE_PATH);
  const withoutNav = fill(template, {
    date: effectiveDate,
    repo: path.resolve(rootDir, ".."),
    commit: commitText({ commit, dirty }),
    batch_count: String(judged.length),
    neighbourhood_count: String(neighbourNodes.length),
    context_count: String(contextNodes.length + unchangedReached.length),
    tier_stamp: tierStamp,
    selection_summary: selectionSummary,
    judged_index: judgedIndex,
    live_pairs: livePairs,
    drift_probe: driftProbe,
    reached_unchanged: reachedUnchanged,
    neighbourhood_index: neighbourNodes.length > 0
      ? neighbourNodes.map(contextIndexLine).join("\n")
      : "(nothing judged has a neighbour outside the judged set whose text has moved since a survey read it)",
    context_index: contextNodes.length > 0
      ? contextNodes.map(contextIndexLine).join("\n")
      : "(no other node: the judged set and its neighbourhood are the whole graph)",
    batch: judged.length > 0
      ? judged.map((n) => renderJudgedNode(n, graph.words, byId)).join("\n")
      : "(nothing is judged: there is no entry to write in `nodes`)",
    neighbourhood: neighbourNodes.length > 0
      ? neighbourNodes.map((n) => renderNeighbourNode(n, null)).join("\n")
      : "(nothing judged has a neighbour outside the judged set whose text has moved since a survey read it)",
    out: SURVEY_OUT_FILE,
    pins: SURVEY_PINS_FILE,
  });
  const { text: filled, lines, bytes } = fillNav(withoutNav);

  const selection = {
    date: effectiveDate,
    commit,
    dirty,
    whole: isWhole,
    demand,
    seed,
    tier: { checks: TIER_CHECKS, findings: tierFindings, notes, forced: forceTier && tierFindings.length > 0 },
    judged: judged.map((n) => ({ node: n.id, why: reasons.get(n.id) ?? null })),
    unchangedReached: unchangedReached.map((n) => n.id),
    pairs: {
      nominated: pairs.length,
      live: live.map((p) => ({ ...p, probe: false })),
      frozen: frozen.map((p) => ({ ...p, probe: probeIds.has(`${p.a}\t${p.b}`) })),
      probe,
    },
  };

  const result = {
    briefPath,
    pinsPath,
    selectionPath,
    historyPath,
    outFile: SURVEY_OUT_FILE,
    batchCount: judged.length,
    neighbourhoodCount: neighbourNodes.length,
    contextCount: contextNodes.length,
    unchangedReachedCount: unchangedReached.length,
    pairCount: pairs.length,
    livePairCount: live.length,
    frozenPairCount: frozen.length,
    probeCount: probe.length,
    seed,
    whole: isWhole,
    wholeDemanded: demand.demanded,
    wholeWhy: demand.why,
    tierFindingCount: tierFindings.length,
    tierNoteCount: notes.length,
    tierForced: forceTier && tierFindings.length > 0,
    lines,
    bytes,
    commit,
    dirty,
  };
  if (dry) return result;

  await mkdir(reviewDir, { recursive: true });
  await mkdir(sidecarBase, { recursive: true });
  await mkdir(path.dirname(briefPath), { recursive: true });
  await writeFile(briefPath, filled);
  await writeFile(
    pinsPath,
    `${JSON.stringify(surveyPins({ graph, judged, date: effectiveDate, commit, dirty }), null, 2)}\n`,
  );
  await writeFile(selectionPath, `${JSON.stringify(selection, null, 2)}\n`);
  await appendSurveyHistory(historyPath, history, {
    date: effectiveDate,
    whole: isWhole,
    commit,
    judged: judged.length,
    frozen: frozen.length,
    probe: probe.length,
    seed,
    validationsChanged,
  });
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
        // The mode is derived from the record and never told by the flag:
        // `--draft` only forces it, overriding whatever the record would
        // otherwise choose. Chosen once here, printed, and then handed to
        // the write function that matches it -- which re-derives the same
        // mode itself and refuses if the two disagree, so a mismatch is a
        // bug and not a silent divergence.
        const { node } = await resolveReviewNode(rootDir, opts.node);
        const mode = chooseMode(node, { rootDir, draft: opts.draft });
        console.log(`mode: ${mode.mode} (${mode.reason})`);
        if (mode.fallback) {
          process.stderr.write(`falling back to the draft brief: ${mode.reason}\n`);
        }
        if (mode.mode === "delta") {
          const r = await writeDeltaBrief({ rootDir, reviewDir, id: opts.node, date: opts.date, dry: opts.dry, out: opts.out });
          console.log(opts.dry ? `${r.briefPath} (dry run: nothing written)` : r.briefPath);
          console.log(`delta: ${opts.node}; ${r.bytes} bytes over ${r.lines} lines`);
          console.log(`the reviewer's output file: ${r.outFile}`);
          if (r.lines > 4000) {
            process.stderr.write(`note: this brief is ${r.bytes} bytes over ${r.lines} lines; one reviewer may not hold it whole. Say so in the report if the reviewer could not read it all.\n`);
          }
        } else {
          const r = await writeDraftBrief({ rootDir, reviewDir, id: opts.node, date: opts.date, dry: opts.dry, out: opts.out });
          console.log(opts.dry ? `${r.briefPath} (dry run: nothing written)` : r.briefPath);
          console.log(`draft: ${opts.node}; ancestry ${r.ancestryCount}, rules ${r.rulesCount}, children ${r.childrenCount}, siblings ${r.siblingCount}, cited ${r.citedCount}, readings ${r.readingsCount}, round ${r.roundCount}, index ${r.indexCount}; ${r.bytes} bytes over ${r.lines} lines`);
          console.log(`the reviewer's output file: ${r.outFile}`);
          if (r.lines > 4000) {
            process.stderr.write(`note: this brief is ${r.bytes} bytes over ${r.lines} lines; one reviewer may not hold it whole. Say so in the report if the reviewer could not read it all.\n`);
          }
        }
      } else {
        const r = await writeSurveyBrief({
          rootDir, reviewDir, date: opts.date, dry: opts.dry,
          whole: opts.whole, forceTier: opts.forceTier, validationsChanged: opts.validationsChanged,
          out: opts.out,
          sidecarDir: opts.sidecarDir ? path.resolve(process.cwd(), opts.sidecarDir) : null,
        });
        console.log(opts.dry ? `${r.briefPath} (dry run: nothing written)` : r.briefPath);
        console.log(`survey: ${r.batchCount} node(s) judged; neighbourhood ${r.neighbourhoodCount} node(s); reached but unchanged, one line each: ${r.unchangedReachedCount}; context: ${r.contextCount} node(s); ${r.bytes} bytes over ${r.lines} lines; graph commit ${commitText({ commit: r.commit, dirty: r.dirty })}`);
        console.log(`tier: ${r.tierFindingCount} finding(s) over ${TIER_CHECKS.length} checks, ${r.tierNoteCount} note(s)${r.tierForced ? " -- LAUNCHED OVER A FAILING TIER (--force-tier)" : ""}`);
        console.log(`survey: ${r.whole ? "whole" : "delta"}${r.wholeDemanded ? " (demanded)" : ""}: ${r.wholeWhy}`);
        console.log(`pairs: ${r.pairCount} nominated; ${r.livePairCount} live, ${r.frozenPairCount} frozen, ${r.probeCount} drawn as the drift probe on seed ${r.seed}`);
        console.log(opts.dry ? `the pins sidecar: ${r.pinsPath} (dry run: nothing written)` : `the pins sidecar: ${r.pinsPath}`);
        console.log(opts.dry ? `the selection sidecar: ${r.selectionPath} (dry run: nothing written)` : `the selection sidecar: ${r.selectionPath}`);
        console.log(`the reviewer's output file: ${r.outFile}`);
        if (r.lines > 4000) {
          process.stderr.write(`note: this brief is ${r.bytes} bytes over ${r.lines} lines; one reviewer may not hold it whole. Say so in the report if the reviewer could not read it all.\n`);
        }
      }
    } catch (err) {
      process.stderr.write(`${err.message}\n`);
      process.exitCode = err.exitCode ?? 1;
    }
  })();
}
