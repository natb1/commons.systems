#!/usr/bin/env node
// packages/clean-context-review/brief.mjs
//
// Writes one reviewer's brief for one clean-context reading, in the two
// readings the review divides into by their object (clean-context-review.md,
// "running two reviews divided by their object"; frontier-consistency.md,
// which divides the sixteen validations between them; review-skills.md, which
// makes the two readings two skills over this one package).
//
//   --node <id>  the review of one draft. Its object is that node's
//                recommendation, and it runs the moment the recommendation is
//                recorded, which is the node's transition to the review
//                stage. The reader is given the node whole in the sense
//                `review-cost` fixes and not file by file: its question, the
//                resolved content of every option on its answer fact -- the
//                recommended one once, under '#### Answer', and each rival as
//                its difference from it -- its facts with every option's
//                sentence and the AI's accumulated support and divergence,
//                the probes standing on it, and the last '### ' section of
//                its '## Account' with a line counting the earlier sections
//                it omits and naming the file they are in, since an account
//                grows with every reading applied while the draft it records
//                does not. Beside it: its ancestry and the rules that bind
//                everywhere, its siblings under the same parent, the nodes it
//                names, and the index of every other question the record
//                asks. Validations 1 to 6 and
//                15. Writes tmp/review/draft-<slug>.brief.md and names
//                tmp/review/draft-<slug>.json. It computes no model: the
//                model and the effort both readings run on are the
//                review-model node's, fixed there and stated by the skill at
//                the launch.
//
//   --survey     the survey of the frontier. Its object is the frontier's
//                consistency with itself, and it grows with what moved and
//                its partners and never with the graph: it judges every
//                node at the review or ruling stage whose recommendation
//                has moved since the survey last pinned it
//                (`surveyJudges`), in the ruling order, carries their
//                neighbourhood by what it answers, and freezes on one line
//                every node whose pin still matches the text it holds.
//                Validations 7 to 15 of `frontier-consistency`, and the
//                sixteenth, `probe-or-node`'s independence test, which only
//                a reading holding the whole graph can run -- the sixteen
//                as the survey's own template states them. The whole
//                reading, in which nothing
//                is frozen, is the backfill and not the norm: --whole or
//                --validations-changed, and no cadence.
//                No '## Account' goes into this brief -- the accounts are the
//                dialogue's history and not its text. Writes
//                tmp/review/survey.brief.md, names tmp/review/survey.json,
//                and writes tmp/review/survey.pins.json, the sidecar the
//                apply step compares against: the graph commit read, the
//                recommendation hash of every node of the graph, judged and
//                context alike, so that a finding whose subject has moved
//                since is discarded rather than applied to text no reading
//                attests to, and the `read` list of every node the brief
//                carried by what it answers, which the apply step pins so
//                the next delta can freeze it.
//
// Nothing is locked (clean-context-review: "a lock at launch, which is
// advisory, per checkout, and unneeded once the pin serializes"). Reviews of
// drafts never wait on each other, and the survey is serialized by the pin
// its findings carry.
//
// Which brief a `--node` review writes is read off the record and never off
// a flag: a delta (re-reading) brief is written whenever the node's
// `review.commit` is set, its last verdict was a forward, and the node's
// file has changed since that commit -- whatever moved it, an amendment the
// session wrote or a survey's frontier finding landed on the node's own
// account. `review-cost`'s rule is that the re-reading's object is the
// amendment and not the node, and the amendment is the diff since the pin
// whichever reading or finding provoked it. A draft brief is written where a
// fresh reading is what the record owes: after a kickback, since "a fresh
// reading is owed only where the answer itself was redrawn, which is what a
// kickback is" (`review-cost`), when no commit is pinned yet (no reading has
// run, or the graph was dirty when the last one did), or when the caller
// passes `--draft` to force it regardless of what the record would otherwise
// choose (`--fresh` remains as a deprecated alias). No `--delta` flag is
// needed to force the other way: wherever a forward is pinned and the file
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
  readGraph, surveyJudges, carriedText, confirmedOption, resolveOptionContent,
} from "@commons.systems/disposition/read.mjs";
import { diffText } from "@commons.systems/disposition/patch.mjs";
import { renderFrontier } from "@commons.systems/disposition/project.mjs";
import { concordance, nodeText, TERM_KEY_MAX_SHARE } from "@commons.systems/disposition/concordance.mjs";
import {
  checkTier, tierNotes, loadFoldable, partitionTier,
  TIER_CHECKS, TIER_GATE_CHECKS, TIER_REPORT_CHECKS,
} from "@commons.systems/disposition/tier.mjs";

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
  "delta is written whenever the node's review.commit is set, its last",
  "verdict was a forward, and its file has changed since; a kickback owes a",
  "fresh reading and takes the draft brief; --draft (--node only) forces the",
  "draft brief regardless (--fresh is a deprecated alias).",
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
      // The whole reading, in which nothing is frozen: a backfill, run on
      // the author's word and on no cadence (`survey-selection`,
      // `the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`: "The
      // whole survey, in which nothing is frozen, is a backfill and never
      // the norm: it runs on the author's word, and after any amendment to
      // the validations ... and it runs on no cadence and after no count of
      // deltas").
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
 * one sentence a vocabulary fact's option (`authority`/`topology`) shows
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
 * The text a node's answer fact presently carries, or an honest line about
 * why there is none, encoding-aware.
 *
 * The legacy encoding takes the old path, unchanged: `node.answer`, the
 * '## Answer' section's own text, or "nothing stands on this node yet"
 * where the node carries none. That section is legacy vocabulary the
 * content encoding struck (`materialization`, `session-context`'s
 * `disposition/read.mjs` comment on `carriedText`), so a content node never
 * has one to read -- which is the defect this function and
 * `recommendedOptionText` below repair: every content node's neighbour
 * rendered blank, "(no '## Answer' section...)", whatever it answered,
 * because the render read a section only the legacy encoding ever wrote.
 *
 * In the content encoding the text carried is the resolved content of
 * `carriedOptionName`'s option -- confirmed if a ruling names one,
 * recommended otherwise, which is exactly how `carriedText` (imported above)
 * answers the same question for the node under review itself. Carried and
 * not the doctrinal reading, deliberately: this is a neighbour's draft being
 * shown to a reviewer, and on this record no option anywhere is confirmed,
 * so the doctrinal reading would blank every neighbour on the page. Where
 * that option carries no content yet (the record has not written a case for
 * it), or the fact recommends and confirms nothing at all, an honest line
 * says so instead of silently reusing the legacy wording for a different
 * reason.
 *
 * There was a second, identical implementation of the carried option's name
 * here (`contentAnswerOptionName`); it is gone, and this reads
 * `carriedOptionName` below, so the two cannot drift apart.
 */
function renderedAnswerText(node) {
  if ((node.encoding ?? "legacy") !== "content") {
    return node.answer || "(no '## Answer' section: nothing stands on this node yet)";
  }
  const name = carriedOptionName(node);
  if (!name) return "(no '## Answer' section: nothing stands on this node yet)";
  const fact = node.answerFact;
  const option = (fact.options || []).find((o) => o.name === name) ?? null;
  const text = optionContentText(node, ANSWER_FACT, option);
  return text || `(the recommended option \`${name}\` carries no content yet: nothing resolves to render)`;
}

/**
 * Whether the answer fact's recommendation differs from what actually
 * stands on it, encoding-aware: the legacy encoding compares against
 * `fact.stands`, unchanged, so a node with nothing standing but something
 * recommended still counts as differing there, as it always has. The
 * content encoding struck `stands`; there nothing differs unless something
 * is genuinely confirmed (`confirmedOption`) and the recommendation names a
 * different option, since `renderedAnswerText` above already carries the
 * recommendation itself wherever nothing is confirmed, and showing it twice
 * would be the double carriage the record's own account of `renderJudgedNode`
 * forbids.
 */
function recommendationDiffersFromStanding(node) {
  const fact = node.answerFact ?? null;
  if (!fact || !fact.recommends) return false;
  if ((node.encoding ?? "legacy") !== "content") return fact.recommends !== fact.stands;
  const standing = confirmedOption(node, ANSWER_FACT);
  return standing !== null && fact.recommends !== standing;
}

/**
 * The recommended option's own resolved content, content encoding only, for
 * the one call site that renders it once `recommendationDiffersFromStanding`
 * says it differs from what stands: `renderNeighbourNode`'s "Now recommends",
 * where the legacy encoding reads the '## Recommendation' fence instead and
 * never calls this. The node under review has no such section: there the
 * recommended content is the '#### Answer' itself and every rival is a
 * difference from it (`renderWholeNode`).
 */
function recommendedOptionText(node) {
  const fact = node.answerFact;
  const option = (fact.options || []).find((o) => o.name === fact.recommends) ?? null;
  return optionContentText(node, ANSWER_FACT, option)
    || `(the recommended option \`${fact.recommends}\` carries no content yet: nothing resolves to render)`;
}

/** Two spaces under the option's own bullet, blank lines left blank rather
 * than turned into trailing whitespace. */
function indentUnder(lines) {
  return lines.map((line) => (line === "" ? "" : `  ${line}`));
}

/**
 * What one option says for itself, under its own bullet: its sentence, the
 * AI's accumulated support and divergence, and -- on the answer fact of a
 * content-encoded node -- its content, compacted against the answer that
 * already stands above.
 *
 * The sentence is read from `option.sentence` in the content encoding and
 * never through `optionSentence`'s fallback to `option.prose`, which is the
 * whole `#### <option>` subsection and so carries the content fence with it:
 * that fallback exists for legacy options, which have no content, and taking
 * it on a content option would put the option's whole node back in the brief
 * -- the double carriage this compaction exists to strike. Where the
 * sentence is empty, `missingProseText` says which kind of silence it is.
 *
 * The support and the divergence are kept, unlike `renderJudgedNode`, which
 * strikes them: the draft's reader judges the AI's case for what it
 * recommends, and that case is exactly this pair; the survey judges the
 * frontier's consistency and no validation from the seventh to the sixteenth
 * reads them (`review-cost`: "a part no validation reaches is struck rather
 * than shortened").
 *
 * The content is `optionContentAgainstAnswer`'s, the same rule the survey
 * applies: the recommended option's content is the '#### Answer' above and
 * is named rather than repeated, and every rival is its sectionwise
 * difference from it. Only the answer fact carries content on this record,
 * and only a content-encoded node has any at all.
 */
function renderOptionCase(node, fact, option) {
  const content = (node.encoding ?? "legacy") === "content";
  const sentence = content
    ? ((option.sentence || "").trim() || missingProseText(fact, option))
    : (optionSentence(option) ?? missingProseText(fact, option));
  const out = [...sentence.split("\n")];
  if (option.aiSupport) out.push("", ...`**AI support.** ${option.aiSupport}`.split("\n"));
  if (option.aiDivergence) out.push("", ...`**AI divergence.** ${option.aiDivergence}`.split("\n"));
  if (content && fact.name === ANSWER_FACT) {
    out.push("", ...optionContentAgainstAnswer(node, option, carriedOptionName(node), "#### Answer (the text that stands)"));
  }
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out;
}

/**
 * The probes standing on one node: the questions the record needs the author
 * to answer before a recommendation on it can be grounded. There is no cap on
 * how many stand open: the author struck it at `words/2026-09-08/32`, an
 * arbitrary cutoff buying nothing and costing variance in encoding, the same
 * content standing in the `probes` field below the number and in prose above
 * it. The list is bounded without one, because a probe blocks on the author
 * rather than recursing, and the remedy for a long list is to refine the
 * disposition until it can be confirmed, never to stop asking.
 *
 * Every brief carries this block, and the reason it does outlives the cap that
 * was once its occasion: a reader shown no probe re-raises the questions the
 * record has already asked. The discharged ones are carried for the same
 * reason and with their reasons, since a discharged probe is precisely the
 * question a fresh context is likeliest to ask again.
 *
 * One line each, which is what a count needs: the id, because a finding
 * naming a probe names it by id; what it asks; the fact it bears on where it
 * bears on one; and, for a discharged probe, what discharged it.
 */
function renderProbes(node, headingPrefix = "####") {
  const probes = node.probes || [];
  const open = probes.filter((p) => p.status !== "discharged");
  const discharged = probes.filter((p) => p.status === "discharged");
  const out = [
    `${headingPrefix} Probes (the questions this node stands open on for the author)`,
    "",
    `${open.length} open, and ${discharged.length} discharged. `
    + "A compound probe counts as the probes it compounds. There is no cap: a probe blocks on the author rather than recursing, so the list is bounded without one, and the remedy for a long list is to refine the disposition until it can be confirmed, never to stop asking. They are listed so that this reading does not re-raise what the record has already asked.",
    "",
  ];
  if (probes.length === 0) {
    out.push("(no probe has been raised on this node)", "");
    return out;
  }
  // Open probes list in rank order once every open probe on the node
  // carries one (commons.systems/disposition-graph/author-questions,
  // `probes-are-integrated-and-carry-a-rank`); otherwise the existing,
  // declaration order holds. Discharged probes are never reordered: a
  // stale rank kept past discharge says where the probe stood, not where
  // it stands.
  const orderedOpen = open.length > 0 && open.every((p) => p.rank != null)
    ? [...open].sort((a, b) => a.rank - b.rank)
    : open;
  for (const p of orderedOpen) {
    out.push(`- \`${p.id}\` — open${p.rank != null ? `, rank ${p.rank}` : ""}${p.fact ? `, on its \`${p.fact}\` fact` : ""}, raised ${p.raised} by ${p.source}: ${p.asks}`);
  }
  for (const p of discharged) {
    out.push(`- \`${p.id}\` — discharged${p.rank != null ? `, rank ${p.rank}` : ""}${p.fact ? `, on its \`${p.fact}\` fact` : ""}, raised ${p.raised} by ${p.source}: ${p.asks} — discharged: ${p.reason}`);
  }
  out.push("");
  return out;
}

/**
 * Every fact of one node, whole: the reason the recommendation gives, then
 * each option with its source and reference, whether it is the recommended
 * one, the one that stands, or the ruled one, the readings that bear on it,
 * and, under its bullet, what it says for itself (`renderOptionCase`).
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
      out.push(...indentUnder(renderOptionCase(node, fact, option)));
      out.push("");
    }
  }
  return out;
}

/**
 * One node in full, in the sense `review-cost` fixes for the one node a
 * reading is judging: question, the author's words, the text that stands,
 * the rationale, the probes standing on it, and every fact with every option
 * it holds viable -- each option's sentence, the AI's support and divergence
 * on it, and its content -- together with the last section of its account.
 *
 * Whole is not the same as twice. The answer that stands is the recommended
 * option's own resolved content, so a render that prints that content under
 * '#### Answer' and then prints every option's `#### <option>` subsection
 * raw prints the recommendation's whole node twice and carries every rival's
 * whole node beside it: 437,719 bytes for `review-cost` on 2026-09-08,
 * against the 2,000-line bound the reading's own launch prompt promises. So
 * the option content goes through `optionContentAgainstAnswer`, the survey's
 * own compaction (`renderJudgedNode`): the recommended content stands once,
 * under '#### Answer', and every rival is its sectionwise difference from
 * it. What the draft's reader keeps that the survey's does not is the
 * option's sentence and the AI's accumulated support and divergence, which
 * are the case the draft's reader is judging (`renderOptionCase`).
 *
 * There is no '#### Recommendation' section: in the content encoding
 * '## Recommendation' is a struck section and `renderedAnswerText` above
 * already resolves the recommended option's content, so the block said
 * "(no '## Recommendation' fence...)" on all 154 nodes of the record and
 * repeated the answer on any node it ever fired for.
 *
 * `account: false` leaves the '## Account' out. The survey's brief never
 * carries an account (`clean-context-review`: the accounts "are the
 * dialogue's history and not its text"), and neither do the neighbourhood
 * nodes of a draft's brief; the draft under review carries its own last
 * section, since a verdict on it answers the dialogue that produced it.
 */
export function renderWholeNode(node, { account = true, byId = null } = {}) {
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
    renderedAnswerText(node),
    "",
    "#### Rationale",
    "",
    node.rationale || "(no '## Rationale' section)",
    "",
  );
  parts.push(...renderProbes(node));
  parts.push(
    "#### Facts (every decision on this node, and every option it holds viable)",
    "",
    "The recommended option's content is the '#### Answer' above and is not carried again; every other option's content is the difference from it, section by section, and the node's file is one read away at the path in the heading above.",
    "",
  );
  parts.push(...renderFacts(node, "#####", byId));

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
    renderedAnswerText(node),
  ];

  const fact = node.answerFact;
  if (recommendationDiffersFromStanding(node)) {
    const recommendedAnswer = (node.encoding ?? "legacy") === "content"
      ? recommendedOptionText(node)
      : (node.fence && node.fence.sections ? node.fence.sections.Answer : null)
        || "(no '## Answer' in the '## Recommendation' fence)";
    parts.push(
      "",
      `#### Now recommends \`${fact.recommends}\` (differs from what stands)`,
      "",
      recommendedAnswer,
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
 * Every fence-aware heading of `text` at exactly `level` `#`s, each `{name,
 * index}` (`index` the zero-based line the heading starts on) -- a
 * heading-looking line inside a fenced code block (`apply.mjs`'s
 * `headingBoundaries` guards the same case) is never mistaken for a real
 * one.
 */
function fenceAwareHeadings(text, level) {
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
    if (m && m[1].length === level) headings.push({ name: m[2], index: i });
  }
  return { lines, headings };
}

/**
 * Every fence-aware level-3 (`### `) heading in `text`, each `{name, index}`
 * -- the scan `lastCleanContextReviewSection` and `lastAccountSectionOnly`
 * both build on, factored once so the guard above is never written twice.
 */
function level3Headings(text) {
  return fenceAwareHeadings(text, 3);
}

/**
 * Every fence-aware level-2 (`## `) heading in `text` -- what
 * `splitWholeNodeText` needs to cut a whole node's rendered text into its
 * `## ` sections, the same guard applied one level up.
 */
function level2Headings(text) {
  return fenceAwareHeadings(text, 2);
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
 * from a flag the session sets on its own account (`review-cost`: "an
 * amendment made for a reading's findings is read once more, that
 * re-reading's object being the amendment and not the node"). A delta is
 * owed where the last reading forwarded the draft, `review.commit` is set --
 * that reading pinned a commit -- and the node's file has changed since:
 * a forward later amended, or a node a survey's frontier finding sent back
 * without ever touching `review.verdict` at all. The verdict is asked, and
 * asked for one thing only: the same node's answer says "a fresh reading is
 * owed only where the answer itself was redrawn, which is what a kickback
 * is", so a `review.verdict: kickback` takes the draft brief and not the
 * delta. A kickback is not an amendment answering findings, it is a new
 * answer, and reading it as a difference against the answer it replaced
 * both under-reads the redraw and mis-counts it against the two-reading cap,
 * whose own clause is that "a kickback is a new answer, which owes a reading
 * of its own". What the verdict is not asked to decide is the case it cannot
 * name: `apply.mjs` writes a survey's finding onto a node's `## Account` and
 * its answer fact and can move its `stage` back to `maieutic` or
 * `periagogic` while leaving `review.verdict` exactly as the last reading
 * wrote it, and that amendment owes the delta, which is why the test is the
 * verdict and never the stage. `--draft` remains as an override that always
 * forces the draft brief regardless (`--fresh` is a deprecated alias); no
 * `--delta` flag is needed the other way, since wherever a forward is
 * pinned and the file has moved, the delta is what the record already owes.
 *
 * Falls back to the draft brief, with `fallback: true` and a reason naming
 * it, wherever the re-reading has nothing to read against: no commit
 * pinned yet (no reading has run, or the review names no commit -- one
 * written before the `commit` key existed, or on a graph that was not a
 * git checkout at the time), a commit `git show` cannot resolve the node's
 * file at, or an account carrying no prior `### Clean-context review,` or
 * `### Clean-context re-reading,` subsection to re-read against.
 * The fallback checks that name a defect of the record are asked before
 * the verdict is, so a kickback whose review pinned no commit is reported
 * as the missing pin it is and not as the kickback it also is.
 *
 * `fallback: false` on a draft means there is nothing new to read at all
 * (no review yet, or the file matches the pinned commit exactly) and not
 * that a re-reading was owed and could not be produced.
 *
 * @returns {{mode: "draft"|"delta", reason: string, fallback: boolean,
 *   commit?: string, diff?: string, previous?: string,
 *   frontierFindings?: string[]}}
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
  if (node.review.verdict === "kickback") {
    return {
      mode: "draft",
      reason: "the last reading kicked this answer back, and a kickback redraws the answer: a fresh reading is owed and not a re-reading of an amendment",
      fallback: false,
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
  const frontierFindings = frontierFindingSectionsSince(node.account, node.review.date);
  return {
    mode: "delta",
    reason: "the last reading forwarded this answer, review.commit is set, and the node's file has changed since: a re-reading is owed on the difference, whatever moved it",
    fallback: false,
    commit,
    diff,
    previous,
    frontierFindings,
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
// leave the frozen set behind with the evidence of what they cost, the
// whole reading held to the author's word, and the candidate pairs each
// handed to the reader with the key that nominated it.

/** The sidecar naming the cuts: what was frozen, what the probe drew, and
 * on what seed. `survey.pins.json` stays what the apply step compares
 * against; this is what a reader or a later survey audits the selection by,
 * since "what was not read is a fact of the run and not an inference from
 * the generator". */
const SURVEY_SELECTION_FILE = "tmp/review/survey.selection.json";
/** The log of the runs: which surveys ran whole and which as deltas, and
 * what each cost. Nothing reads it to demand a run
 * (`the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`: the whole
 * reading "runs on no cadence and after no count of deltas"); it is kept
 * because the account cites it and because a later reader measures the
 * bound against it. It lives under `tmp/` with the briefs, and a lost
 * history costs a delta nothing. */
const SURVEY_HISTORY_FILE = "tmp/review/survey.history.json";

const ANSWER_FACT = "answer";
/** The probe is "one in twenty of the frozen pairs and never fewer than
 * ten". There is no cadence beside it: the drift probe is the delta's only
 * standing check. */
const PROBE_DENOMINATOR = 20;
const PROBE_FLOOR = 10;
// TERM_KEY_MAX_SHARE: "a defined term outside the record's commonest ...
// where a term used by more than a tenth of the record's nodes nominates
// nothing, since a key that pairs a hub with everything orders nothing and
// grows with the graph". Measured at graph commit 11191654 the two
// commonest terms, `readings` and `growth`, were used by 153 and 140 of 154
// nodes and nominated the whole graph. Defined once, in concordance.mjs,
// and imported here so the tier's own use of the same bound
// (`term-without-a-path`) cannot drift from this one.
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
 * recommends. The other options of that fact are the rivals.
 *
 * Carried and not doctrinal, and the name says so. A node's *answer* is the
 * content of a confirmed option alone
 * (commons.systems/disposition-graph/authority), and this record confirms
 * none, so a brief written on the doctrinal reading would be a brief with no
 * text in it. What a reviewer reads is what binds the node today, which is
 * the draft; every call of this name is that declaration, and the brief's
 * own headings say the same thing in words. `disposition/read.mjs` keeps the
 * pair this belongs to: `answerText` doctrinal, `carriedText` carried. */
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
 * The second hash is `carriedText` and never the doctrinal `answerText`, and
 * that is a decision and not a rename. A pin's object is what *binds* the
 * node, because what the pin guards against is a reading attesting to text
 * that has since moved, and the text a reading read is the carried one. On a
 * record that confirms nothing, hashing the doctrinal answer would collapse
 * every node's second hash to `sha256("")`: identical everywhere, never
 * moving, and so a staleness guard that passes vacuously exactly when a
 * draft is redrawn under it. `rivals` is taken against `carried` for the
 * same reason, and the two must name the same option or a rival would be
 * hashed twice and the option that binds not at all.
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
    answer: sha256(carriedText(node) ?? ""),
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
 * Whether a node carries a survey pin at all, of either kind.
 *
 * There are two kinds, and the difference is one key.
 *
 * A **judged pin** carries `of`, the recommendation hash the survey read,
 * and is what a survey leaves on a node it judged: it is the reading the
 * node's own ruling is owed (`readyToRule`, `surveyOwed`).
 *
 * A **read pin** carries no `of`, and is what the apply step leaves on
 * every node the survey read as neighbourhood
 * (`the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`: "the survey
 * therefore pins every node it read with the hash of the text it read, and
 * a pin on a node that was not judged freezes it and detects its movement
 * without standing as the survey the node's own ruling owes"). It freezes
 * and it never satisfies.
 */
export function surveyPinOf(node) {
  return node?.review?.survey ?? null;
}

/** Whether the pin on a node is a judged pin: one that names the
 * recommendation the survey read. A read pin names no recommendation. */
export function isJudgedPin(pin) {
  return typeof pin?.of === "string" && pin.of.length > 0;
}

/**
 * Whether a node is frozen: it carries a pin of either kind, and all five
 * of the sections that pin recorded hash to what they hash now.
 *
 * This is the freeze the answer states -- "a reached node is frozen on the
 * hash the survey's pins hold for it, whether or not the node was judged"
 * -- and it is why the delta is bounded: keyed on the judged nodes' pins
 * alone it would leave every settled node unfrozen and read the whole graph
 * forever.
 *
 * All five keys must be present and equal. A pin carrying fewer than five
 * is a pin from before the text hashes were recorded, and it says nothing
 * about the sections it does not name, so it freezes nothing.
 */
export function frozenOnPin(node, words = null) {
  const pinned = surveyPinOf(node)?.text ?? null;
  if (pinned === null || typeof pinned !== "object") return false;
  const now = sectionHashes(node, words);
  return SECTION_HASH_KEYS.every((k) => typeof pinned[k] === "string" && pinned[k] === now[k]);
}

/**
 * The frozen set over nodes: every node not judged this round whose five
 * hashes match the pin it carries, of either kind.
 *
 * @returns {Set<string>}
 */
export function frozenNodeIds(graph, judgedIds = new Set()) {
  const words = graph?.words ?? null;
  const out = new Set();
  for (const node of graph?.nodes ?? []) {
    if (judgedIds.has(node.id)) continue;
    if (frozenOnPin(node, words)) out.add(node.id);
  }
  return out;
}

/**
 * The judged set: "every node at the review or the ruling stage whose
 * recommendation has moved past its survey pin or that no survey has read"
 * -- which is `surveyJudges`, unchanged -- "together with every node whose
 * read text differs from the hash the last survey wrote on it".
 *
 * The second limb carries no stage: a node the survey read and whose text
 * has since moved is judged again wherever it stands, because the silence
 * of the earlier reading was about text that is no longer there. It fires
 * on a **judged** pin alone. A read pin whose text moved does not make its
 * node judged -- nothing was judged there for a move to overtake -- it only
 * unfreezes it, so the node is carried by what it answers where the judged
 * set reaches it. Judging on a read pin's movement would put every node the
 * last survey merely read back into the judged set the moment it was
 * amended, which is the whole graph again by another road.
 *
 * `surveyJudges` needs no change for the read pin: `surveyOwed` reads
 * `survey.of` against the recommendation hash, and a read pin carries none,
 * so a node at the review or ruling stage with a read pin alone is owed a
 * survey and is judged here.
 *
 * @returns {{judged: object[], reasons: Map<string, string>}}
 */
export function judgedSet(graph) {
  const words = graph?.words ?? null;
  const owed = new Set(surveyJudges(graph).map((n) => n.id));
  const judged = [];
  const reasons = new Map();
  for (const node of graph?.nodes ?? []) {
    const pin = surveyPinOf(node);
    if (owed.has(node.id)) {
      reasons.set(node.id, pin === null
        ? "no survey has read it"
        : (isJudgedPin(pin)
          ? "its recommendation has moved past its survey pin"
          : "the only pin on it is a read pin: a survey has read it, and none has judged it"));
      judged.push(node);
      continue;
    }
    if (!isJudgedPin(pin)) continue;
    const pinned = pin?.text ?? null;
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
 * **The hub bound holds for every key, and not for one of them.** Whatever
 * relation a key runs on, what stands at more than `TERM_KEY_MAX_SHARE` of
 * the record's nodes nominates nothing on that key: a term more than a
 * tenth of the nodes use pairs with none of them, and a node whose prose
 * names more than a tenth of the record names none of them here. A key that
 * pairs a hub with everything orders nothing and grows with the graph,
 * which is the author's bound of 2026-09-07 (`words/2026-09-07/23`) --
 * "no process of this record grows with the record's size without bound" --
 * applied to the generator. It is a share and not a count, so that it holds
 * at any size of record, and it silences a key and never an edge the record
 * declared: a hub's `depends` entries are written on purpose and are
 * nominated by their own key (`depends`, never folded into `cites`), which
 * is what stands where the scraped citation falls away. Stating it once is
 * what stops the next key from arriving unbounded, which is how the
 * citation key arrived (`survey-selection`, the option
 * `the-hub-bound-holds-for-every-key`).
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

  // The one bound, measured once for every key that runs on a relation a
  // node can stand at the hub of: more than this many nodes on the far side
  // and the key nominates nothing from that side. See the docblock.
  const hubCeiling = nodes.length * TERM_KEY_MAX_SHARE;

  // a term where one node defines it and the other uses it -- never two
  // users of the same term with each other. Pairing every user with every
  // other user is what made this key select nothing on the record: 31 of
  // 120 terms are used by 100+ nodes, so one term turned into thousands of
  // user-user pairs nobody asked for. The definer-user edge is the one the
  // concordance relation actually distinguishes (`entry.users[].reachable`
  // is a path from a user to the definer, not between users), so that is
  // the only edge nominated here, and the pair's key names the term and the
  // node that defines it.
  //
  // And outside the record's commonest: a term used by more than a tenth of
  // the nodes nominates nothing at all. The definer-user edge cut the
  // user-user explosion but left the hub, which is the part that grows with
  // the graph: `readings` and `growth` were used by 153 and 140 of the
  // record's 154 nodes at 11191654, so those two keys alone paired their
  // definers with almost every node there is, and the pair list they made
  // ordered nothing. The bound is the option's own
  // (`the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`), and it is
  // a share and not a count so that it holds at any size of record.
  const terms = (conc ?? concordance(graph)).terms;
  for (const entry of terms) {
    const users = new Set(entry.users.map((u) => u.node));
    if (users.size > hubCeiling) continue;
    for (const user of users) {
      addPair(map, entry.defines, user, `term:${entry.term} (defines: ${entry.defines})`);
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

  // a citation either way, in prose or in `depends` -- two keys and not one,
  // so that the bound below silences the scrape and leaves the declaration
  // standing.
  //
  // The scrape is where the hub bound bites hardest: `namesNode` counts a
  // slug followed by the word "node" in prose, and the nodes whose whole
  // business is to name their neighbours -- the readings, `dialogue`,
  // `authority` -- pair with almost everything there is. Measured at graph
  // deb24ce4, `cites` nominated 2,525 of the generator's 2,991 pairs and was
  // the sole key on 2,010 of them, with 86 of the record's 154 nodes naming
  // more than a tenth of it; the median node named 19 others against a
  // ceiling of 15.4. So the out-degree is measured once per node and the key
  // is silenced from that node's side where it exceeds the ceiling. What
  // that node declared in `depends` is untouched: those pairs are nominated
  // on their own key above, which is the point of keeping the two apart.
  const texts = new Map(nodes.map((n) => [n.id, nodeText(n)]));
  const namedBy = new Map();
  for (const node of nodes) {
    const text = texts.get(node.id) ?? "";
    const named = [];
    for (const other of nodes) {
      if (other.id === node.id) continue;
      if (namesNode(text, other)) named.push(other.id);
    }
    namedBy.set(node.id, named);
  }
  for (const node of nodes) {
    for (const d of node.depends ?? []) {
      if (ids.has(d.id)) addPair(map, node.id, d.id, "depends");
    }
    const named = namedBy.get(node.id) ?? [];
    if (named.length > hubCeiling) continue;
    for (const other of named) addPair(map, node.id, other, "cites");
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
 *
 * Unchanged is `frozenNodeIds`: a node carrying a pin of either kind whose
 * five hashes still match it. It is not "not judged": a node no survey has
 * ever read is not judged either, and it has no earlier reading whose
 * silence could stand in for this one.
 *
 * @param {Array<{a: string, b: string, keys: string[]}>} pairs
 * @param {{byId: Map<string, object>, frozenIds: Set<string>,
 *   whole?: boolean}} options
 */
export function cutPairs(pairs, { byId, frozenIds, whole = false }) {
  if (whole) return { live: pairs, frozen: [] };
  const live = [];
  const frozen = [];
  for (const pair of pairs) {
    const a = byId.get(pair.a);
    const b = byId.get(pair.b);
    const unchanged = a && b && frozenIds.has(pair.a) && frozenIds.has(pair.b);
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

// -------------------------------------------- when the whole reading runs

/**
 * Whether this survey runs whole, and why.
 *
 * Two conditions, and no cadence
 * (`the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`: "The whole
 * survey, in which nothing is frozen, is a backfill and never the norm: it
 * runs on the author's word, and after any amendment to the validations, to
 * what a reading is given, or to the tier ... and it runs on no cadence and
 * after no count of deltas").
 *
 * `--whole` is the author's word, said by the session that carries it.
 * `--validations-changed` is the amendment. Nothing else: the fourth-delta
 * count and the thirty-day clock are struck, because a reading priced at
 * the graph's size on a timer is a process that grows with the record,
 * which is the bound the author gave (words/2026-09-07/23: "no process can
 * grow in complexity/context size with graph size unbounded"). The history
 * is still written and is still passed here, so that a reader can see what
 * it did not decide; this function does not read it.
 *
 * The second is a flag and not a derivation, and deliberately: the record
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
 * A record in which no node carries a pin is not a special case: it is a
 * delta in which nothing is frozen, which is exactly what the first delta
 * after a backfill would be if the backfill had never run. The remedy is
 * the backfill, run once on the author's word, and not a rule that makes
 * every survey whole until one has.
 *
 * @param {object|null} history - written by every run, read by none.
 */
export function wholeDemand(history, { date, validationsChanged = false, whole = false }) {
  if (validationsChanged) {
    return {
      whole: true,
      demanded: true,
      why: "the caller passed --validations-changed: an amendment to the validations, to what a reading is given, or to the tier invalidates every earlier reading's silence",
    };
  }
  if (whole) {
    return {
      whole: true,
      demanded: false,
      why: "the caller passed --whole: this reading is a backfill, and nothing is frozen",
    };
  }
  return {
    whole: false,
    demanded: false,
    why: "the delta is the survey's only recurring form: the whole reading is a backfill and runs on the author's word (--whole) or after an amendment to the validations (--validations-changed), on no cadence and after no count of deltas",
  };
}

/** The history, or null where there is none to read. A malformed file is
 * unknown, and a run reads nothing from it, so an unreadable history costs
 * this run nothing and is replaced by what this run appends. */
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
 * one answer that binds it, and, of its answer fact, each option's name and
 * status with the sentence saying what it would answer, then what every
 * other option on that fact would make of it -- as the difference from the
 * answer above and not as a second copy of the node, which is the same rule
 * ("its content never rendered twice") applied to the rivals: on
 * `survey-selection` itself ten options each carry the whole answer, so the
 * second render is nine tenths of the block.
 *
 * What is not here is the point of it. An option's source, its ref, the
 * reason it was passed over and the readings recorded under it are not
 * carried (`options-by-sentence-and-status-and-words-by-address`: "no
 * validation reads them, and a reader that wants one has the node's id").
 * The prose of its facts and the AI's accumulated support and divergence on
 * its options are struck too, because no validation from the seventh to the
 * sixteenth reads them and `review-cost`'s rule is that a part no validation
 * reaches is struck rather than shortened. The account is struck for the
 * reason `clean-context-review` gives. And the answer appears once: the
 * structured render of the standing node that `renderWholeNode` puts beside
 * it is the same text twice, which is exactly the double carriage the
 * answer forbids.
 *
 * The author's words are carried by address and not repeated: "the
 * quotation itself is carried only where the recommended option references
 * it, since the sixteenth validation reads the words against the answer
 * that binds the node, and a rival option's words are evidence for that
 * rival's content and not for the answer." Where an entry is referenced by
 * more than one option, the quotation stands once, under the carried
 * option's own line; every other option's line for that entry carries the
 * address alone. This does not touch `sectionHashes`: the `options` hash
 * still hashes each option's source and ref, and the `words` hash still
 * hashes every referenced entry's text whole, so a changed entry or a moved
 * source still moves the node for the next delta even though this render
 * shows less of it.
 *
 * The probes stay, open and discharged alike (`renderProbes`), for the one
 * reason a part earns its place in a brief: a validation reads it. There is no
 * cap left for this reading to count against, `words/2026-09-08/32` having
 * struck it, but a reader shown no probe re-raises what the record has already
 * asked, and that is what the block is against.
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
    `- Facts: ${factsSummary(node)}`,
    `- Depends: ${dependsText(node)} | under: ${(node.under || []).join(", ") || "none"}`,
  ];
  const defines = definesText(node);
  if (defines) parts.push(`- Defines: ${defines}`);
  const bears = bearsText(node);
  if (bears) parts.push(`- Bears on (this node is a reading): ${bears}`);
  parts.push(`- Review state: ${reviewLine(node)}`);

  parts.push("", ...renderProbes(node));
  // `renderProbes` closes on a blank line, and the next section opens with
  // one of its own below.
  while (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();

  const carried = carriedOptionName(node);
  const fact = node.answerFact ?? null;
  const options = fact ? (fact.options || []) : [];

  parts.push("", "#### The author's words its options carry", "");
  const said = nodeWords(node, words);
  if (said.length === 0) {
    parts.push("(no option on this node references an entry of the ledger of the author's words)");
  } else {
    parts.push(
      "An address `words/<date>/<n>` is entry `## <n>` of `disposition/words/<date>.md` (`words/2026-09-07/21` is entry `## 21` of `disposition/words/2026-09-07.md`). The quotation stands once, under the line of the option carried above; every other option's line for the same entry carries the address alone.",
      "",
    );
    // The `words` section hash keeps every referenced entry's text whole
    // (`sectionHashes`), so a changed entry still moves the node for the
    // next delta even though this render quotes it, at most, once.
    const quoted = new Set();
    for (const w of said) {
      parts.push(`- \`${w.option}\` (${w.fact}) ${w.relation} ${w.address}${w.date ? `, ${w.date}` : ""}${w.context ? ` — ${w.context}` : ""}`);
      if (w.option === carried && !quoted.has(w.address)) {
        quoted.add(w.address);
        const text = w.text ?? "(unresolved: the ledger has no such entry)";
        for (const line of text.split("\n")) parts.push(`  > ${line}`);
      }
    }
  }

  // `carriedText` and not `answerText`: the heading names `carried` as the
  // option whose content this is, so the text under it must be that option's
  // and not a doctrinal reading that would be empty beneath a heading naming
  // a draft. The heading is where the reader is told what it is.
  parts.push(
    "",
    `#### The one answer that binds${carried ? ` (the resolved content of \`${carried}\`)` : ""}`,
    "",
    carriedText(node) || "(no answer stands and none is recommended: nothing binds on this node yet)",
    "",
    "#### The options on its answer fact",
    "",
  );
  if (options.length === 0) {
    parts.push("(no answer fact: no decision is recorded on this node yet)");
  } else {
    for (const option of options) {
      // Name, status, and sentence only: source, ref and the readings
      // recorded under an option are not carried here (nothing from the
      // seventh to the sixteenth validation reads them, and a reader that
      // wants one has the node's id). What is kept -- recommended, "this is
      // the answer above", ruled -- is the reader's status of the option,
      // together with `option.status` itself.
      const bits = [];
      if (option.status) bits.push(`status ${option.status}`);
      if (fact.recommends === option.name) bits.push(`recommended, boldness ${fact.boldness}`);
      if (option.name === carried) bits.push("this is the answer above");
      if (option.ruling) bits.push(`ruled ${option.ruling.response} on ${option.ruling.date}, pinning ${option.ruling.of}`);
      parts.push(`- \`${option.name}\`${bits.length > 0 ? ` — ${bits.join(", ")}` : ""}`);
      const sentence = optionSentence(option);
      for (const line of (sentence ?? "(no sentence: this option says nothing about what it would answer)").split("\n")) {
        parts.push(`  ${line}`);
      }
    }
  }

  parts.push(
    "",
    "#### The content of every option on the answer fact",
    "",
    `Each option's content is the node as it would stand under it. The answer above is one of them and is never repeated; a named change and a near-copy of the answer are given as the difference, which is the answer above with it applied, and everything else whole. The file is one read away at ${nodeFile(node)}.`,
    "",
  );
  if (options.length === 0) {
    parts.push("(no answer fact: there is no option whose content to carry)");
  } else {
    for (const option of options) {
      parts.push(`##### \`${option.name}\``, "");
      parts.push(...optionContentAgainstAnswer(node, option, carried));
    }
  }

  return `${parts.join("\n").replace(/\n+$/, "")}\n`;
}

/** The cap on a rendered difference, in lines: past it the reader is told how
 * much was cut and where the option stands whole. It fires rarely, since a
 * difference is only ever rendered where it is shorter than the content it
 * stands for, but a difference is not the record and is capped where the
 * content is not. */
const DIFF_LINE_CAP = 80;
/** The context a rendered difference carries: one line, not the usual three.
 * A node's lines are whole paragraphs, so every context line is a paragraph,
 * and three of them cost more than most of the contents this stands in for. */
const DIFF_CONTEXT = 1;

/**
 * A whole node's rendered text -- what `carriedText` returns and what a
 * whole option's resolved content is -- cut into its frontmatter block and
 * its `## ` sections, fence-aware, in the order they appear. Returns `null`
 * where the text does not open on a `---` frontmatter delimiter or never
 * closes one: `optionContentAgainstAnswer` reads that as text this rule
 * cannot compare section by section, and falls back to comparing it whole,
 * as it did before this function existed.
 *
 * @param {string} text
 * @returns {{frontmatter: string, sections: Map<string, string>, order: string[]}|null}
 */
function splitWholeNodeText(text) {
  const raw = String(text ?? "");
  const lines = raw.split("\n");
  if ((lines[0] ?? "").trim() !== "---") return null;
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return null;
  const frontmatter = lines.slice(1, end).join("\n").trim();
  const bodyText = lines.slice(end + 1).join("\n");
  const { lines: bodyLines, headings } = level2Headings(bodyText);
  const sections = new Map();
  const order = [];
  for (let i = 0; i < headings.length; i += 1) {
    const h = headings[i];
    const stop = i + 1 < headings.length ? headings[i + 1].index : bodyLines.length;
    sections.set(h.name, bodyLines.slice(h.index + 1, stop).join("\n").trim());
    order.push(h.name);
  }
  return { frontmatter, sections, order };
}

/** Whether every `## ` section of `a` and `b` but `except` is byte-equal,
 * presence included -- a section only one of the two carries counts as a
 * difference and not as a match. This is rule 1's "every other section
 * equals the judged node's". */
function sectionsEqualExcept(a, b, except) {
  const names = new Set([...a.order, ...b.order]);
  for (const name of names) {
    if (name === except) continue;
    if ((a.sections.get(name) ?? null) !== (b.sections.get(name) ?? null)) return false;
  }
  return true;
}

/** One `## ` section's rendering where it differs from the judged node's own:
 * the shorter of its diff against the judged node's section or its body
 * whole, the same measured rule `optionContentAgainstAnswer` states, applied
 * to one section instead of to the whole document. */
function renderSectionDifference(node, name, baseBody, targetBody) {
  const label = `${name}:`;
  const diff = diffText(baseBody, targetBody, DIFF_CONTEXT);
  if (Buffer.byteLength(diff) >= Buffer.byteLength(targetBody)) {
    return [label, "", "```markdown", targetBody, "```", ""];
  }
  const lines = diff.replace(/\n+$/, "").split("\n");
  const shown = lines.slice(0, DIFF_LINE_CAP);
  const out = [label, "", "```diff", ...shown, "```"];
  if (lines.length > shown.length) {
    out.push(`… ${lines.length - shown.length} more line(s) of this diff; open ${nodeFile(node)} for the option whole.`);
  }
  out.push("");
  return out;
}

/** The frontmatter's own difference: always a diff, never the shorter-wins
 * whole -- the judged node's own frontmatter is already rendered once, above
 * every option, and an option's is never rendered whole beside it. */
function renderFrontmatterDifference(node, baseFrontmatter, targetFrontmatter) {
  const diff = diffText(baseFrontmatter, targetFrontmatter, DIFF_CONTEXT);
  const lines = diff.replace(/\n+$/, "").split("\n");
  const shown = lines.slice(0, DIFF_LINE_CAP);
  const out = ["Frontmatter differs:", "", "```diff", ...shown, "```"];
  if (lines.length > shown.length) {
    out.push(`… ${lines.length - shown.length} more line(s) of this diff; open ${nodeFile(node)} for the option whole.`);
  }
  out.push("");
  return out;
}

/**
 * Rule 2: every `## ` section (and the frontmatter) of a whole option's
 * content that differs from the judged node's own resolved answer, each
 * under its own label, with the sections that match named on one line so
 * the reader knows they were checked and not merely omitted.
 */
function renderSectionwiseDifference(node, base, target) {
  const unchanged = [];
  const blocks = [];

  if (base.frontmatter === target.frontmatter) {
    unchanged.push("frontmatter");
  } else {
    blocks.push(renderFrontmatterDifference(node, base.frontmatter, target.frontmatter));
  }

  const names = [...new Set([...base.order, ...target.order])];
  for (const name of names) {
    const same = base.sections.has(name) === target.sections.has(name)
      && (base.sections.get(name) ?? "") === (target.sections.get(name) ?? "");
    if (same) {
      unchanged.push(name.toLowerCase());
    } else {
      blocks.push(renderSectionDifference(node, name, base.sections.get(name) ?? "", target.sections.get(name) ?? ""));
    }
  }

  const out = [];
  if (unchanged.length > 0) out.push(`unchanged: ${unchanged.join(", ")}`, "");
  for (const block of blocks) out.push(...block);
  return out;
}

/**
 * What one option's content says, given that the answer above is already the
 * content of `carried`: nothing for the carried option itself, the named
 * change verbatim where the record writes one (it is a difference already,
 * and a short one), one line where the two resolve to byte-identical text,
 * and otherwise the difference from the judged node's own resolved answer,
 * section by section -- frontmatter, `## Answer`, `## Rationale`, and any
 * other `## ` section either carries.
 *
 * Most options on this record were migrated on 2026-09-07 by
 * `migrate.mjs`, which "wrote no text of its own" for most of them: the
 * option's content is the whole node with its own sentence standing in the
 * `## Answer`'s place, and every other section carried over unchanged. That
 * fence told the reader nothing twice over -- the sentence already stands
 * in "#### The options on its answer fact" and the rest of the node in the
 * judged node's own rendering above -- so it collapses to one line rather
 * than a second copy of the node.
 *
 * Where an option differs from the migration's copy, only the sections that
 * differ are shown, each labelled, and the sections that match are named on
 * one line rather than silently dropped -- the reader is told what was
 * checked and not only what changed. The frontmatter is never shown whole:
 * the judged node's own frontmatter is already rendered once, above every
 * option, and repeating an option's beside it would be the same double
 * carriage this whole rule exists to strike.
 *
 * Within a differing section, the choice is still by size, and still
 * measured rather than assumed (`survey-selection`'s "its content never
 * rendered twice"): whichever is shorter, the section's body whole or its
 * difference from the judged node's own.
 *
 * The two readings head the carried answer differently -- the survey writes
 * "#### The one answer that binds", the draft "#### Answer (the text that
 * stands)" -- so the caller names its own heading and the line that points
 * the reader back to it points at a heading that is actually there.
 *
 * @param {string} answerHeading - the heading the resolved answer stands
 *   under in the caller's own block.
 */
function optionContentAgainstAnswer(node, option, carried, answerHeading = "#### The one answer that binds") {
  if (option.name === carried) {
    return [`Content: the node as rendered above, under '${answerHeading}'.`, ""];
  }
  const content = option.content ?? null;
  if (content === null) {
    return ["(this node is in the legacy encoding: the option carries no content of its own, and what it would answer is its sentence above)", ""];
  }
  if (content.form === "change") {
    return [
      `Content: a named change against \`${content.from}\`, as the record writes it.`,
      "",
      "```diff",
      String(content.diff).replace(/\n+$/, ""),
      "```",
      "",
    ];
  }

  // The base a rival is shown as a difference from is the text the caller
  // rendered above, which is `carriedText`'s and not the doctrinal reading's:
  // a diff taken against a different base than the one on the page is a diff
  // against nothing the reader can see.
  const base = carriedText(node);
  const target = optionContentText(node, ANSWER_FACT, option);
  if (target === null || /^\(unresolvable: /.test(target)) {
    return [target ?? "(no content resolved for this option)", ""];
  }
  if (base === null) return ["```markdown", target, "```", ""];
  if (base === target) return ["Content: identical to the answer above.", ""];

  const baseParts = splitWholeNodeText(base);
  const targetParts = splitWholeNodeText(target);
  if (baseParts === null || targetParts === null) {
    // Not amenable to section comparison (malformed, or not a `---`-framed
    // node at all): fall back to the old whole-document diff-or-whole rule.
    const diff = diffText(base, target, DIFF_CONTEXT);
    if (Buffer.byteLength(diff) >= Buffer.byteLength(target)) {
      return ["```markdown", target, "```", ""];
    }
    const lines = diff.replace(/\n+$/, "").split("\n");
    const shown = lines.slice(0, DIFF_LINE_CAP);
    const out = ["Content: the answer above, with this difference.", "", "```diff", ...shown, "```"];
    if (lines.length > shown.length) {
      out.push(`… ${lines.length - shown.length} more line(s) of this diff; open ${nodeFile(node)} for the option whole.`);
    }
    out.push("");
    return out;
  }

  // Rule 1: the migration's copy -- the answer holds only this option's own
  // sentence, and nothing else about the node differs.
  const sentence = optionSentence(option);
  if (sentence !== null) {
    const targetAnswer = targetParts.sections.get("Answer") ?? null;
    if (
      targetAnswer !== null
      && targetAnswer.trim() === sentence.trim()
      && baseParts.frontmatter === targetParts.frontmatter
      && sectionsEqualExcept(baseParts, targetParts, "Answer")
    ) {
      return [
        "Content: the node as it stands with this option's sentence in the answer's place (the migration wrote no text of its own for it).",
        "",
      ];
    }
  }

  // Rule 2: only the sections that differ, each on its own, with the rest
  // named as unchanged.
  return renderSectionwiseDifference(node, baseParts, targetParts);
}

/**
 * One node id as the pair list names it: the module dropped, and the graph
 * too where it is the disposition graph, so that `public/` stays visible and
 * the common prefix is not repeated on both sides of every line. The judged
 * set's own headings keep the full id -- a reading's heading is an address --
 * and this shortening is the pair list's alone.
 */
export function shortId(id) {
  const parts = String(id).split("/");
  if (parts.length < 3) return String(id);
  const [, graph, ...rest] = parts;
  const slug = rest.join("/");
  return graph === "disposition-graph" ? slug : `${graph}/${slug}`;
}

/**
 * One nominating key as the pair list names it. A term key names the term
 * and not the node that defines it: the definer is in the concordance the
 * reader can open, and the judged node's own `Defines:` line is printed with
 * it, so repeating a full node id on every line of a list thousands of lines
 * long buys the reader nothing. A shared parent is `parent` for the same
 * reason -- the parent is on both nodes' own lines -- and a resemblance
 * keeps its score, which is the only part of it a reader can act on.
 */
export function shortKey(key) {
  const s = String(key);
  const term = s.match(/^term:(.*?)(?: \(defines: .*\))?$/);
  if (term) return `term: ${term[1]}`;
  const words = s.match(/^words:(.*)$/);
  if (words) return `words ${words[1]}`;
  if (s.startsWith("parent:")) return "parent";
  const resemblance = s.match(/^jaccard:(.*)$/);
  if (resemblance) return `resemblance ${resemblance[1]}`;
  return s;
}

/** One partner of one judged node: the partner's slug and the short keys,
 * deduplicated (two shared parents are one `parent`), and the mark where the
 * pair was drawn as the drift probe. */
function partnerLine(pair, selfId, probe) {
  const other = pair.a === selfId ? pair.b : pair.a;
  const keys = [...new Set((pair.keys ?? []).map(shortKey))].join("; ");
  return `- ${shortId(other)}${keys ? ` — ${keys}` : ""}${probe ? " (drift probe)" : ""}`;
}

/** One pair named on its own, outside any judged node's group -- the drift
 * probe's own list, whose pairs have no judged member by construction. */
export function probePairLine(pair) {
  const keys = [...new Set((pair.keys ?? []).map(shortKey))].join("; ");
  return `- ${shortId(pair.a)} + ${shortId(pair.b)}${keys ? ` — ${keys}` : ""}`;
}

/**
 * The candidate pairs as the reader is handed them: grouped by the judged
 * node each is compared against, in the ruling order, one line per partner,
 * "so the reader is told where to look and what to look for".
 *
 * The grouping is the answer's own statement of what a survey compares -- "a
 * judged node is compared against the nodes that reach it ... and against the
 * other judged nodes" (`survey-selection`) -- so every pair has exactly one
 * host, the judged node it is compared against, and a pair between two judged
 * nodes is listed once, under the earlier of the two in the ruling order,
 * with a line in the later one's group naming where to find it. A pair
 * neither of whose members is judged is compared against nothing this round:
 * it is counted here and named in the selection sidecar, which is where the
 * run records what it did not read, and it is not listed line by line.
 *
 * The list orders the reading and does not partition the brief: every node
 * the brief carries stays readable whether a key reached it or not.
 *
 * @param {Array<{a: string, b: string, keys: string[]}>} live
 * @param {object[]} judged - the judged set, already in the ruling order
 * @param {Set<string>} [probeIds] - `${a}\t${b}` of every pair drawn as the probe
 * @returns {{text: string, listed: number, unjudged: number}}
 */
export function groupedPairLines(live, judged, probeIds = new Set()) {
  const order = new Map(judged.map((n, i) => [n.id, i]));
  const groups = new Map(judged.map((n) => [n.id, []]));
  const alsoAbove = new Map(judged.map((n) => [n.id, []]));
  let unjudged = 0;
  let listed = 0;

  for (const pair of live) {
    const ia = order.has(pair.a) ? order.get(pair.a) : -1;
    const ib = order.has(pair.b) ? order.get(pair.b) : -1;
    if (ia < 0 && ib < 0) { unjudged += 1; continue; }
    let host;
    if (ia >= 0 && ib >= 0) {
      host = ia <= ib ? pair.a : pair.b;
      const later = host === pair.a ? pair.b : pair.a;
      alsoAbove.get(later).push(shortId(host));
    } else {
      host = ia >= 0 ? pair.a : pair.b;
    }
    groups.get(host).push({ pair, probe: probeIds.has(`${pair.a}\t${pair.b}`) });
    listed += 1;
  }

  const out = [];
  for (const node of judged) {
    const mine = groups.get(node.id) ?? [];
    const above = [...new Set(alsoAbove.get(node.id) ?? [])].sort();
    const lines = mine
      .map(({ pair, probe }) => partnerLine(pair, node.id, probe))
      .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    out.push(`### ${shortId(node.id)} (${mine.length} pair(s))`, "");
    if (lines.length === 0 && above.length === 0) {
      out.push("(no key nominated a pair for this node)", "");
      continue;
    }
    if (lines.length > 0) out.push(...lines);
    if (above.length > 0) out.push(`- and the pairs listed above under ${above.join(", ")}`);
    out.push("");
  }

  return { text: out.join("\n").replace(/\n+$/, ""), listed, unjudged };
}

// ------------------------------------------------------ the frontier survey

/** The heading the tier's report kind is carried under in the survey brief. */
export const TIER_REPORT_HEADING = "## What the record already knows about itself";

/**
 * The tier's two kinds, each given its own job
 * (`survey-selection`, the option
 * `the-gate-refuses-only-what-an-instrument-clears`).
 *
 * The **gate** kind is a defect of the encoding, which an instrument or the
 * session clears before the launch: it refuses the launch, and `forceTier`
 * is the diagnostic override for it and for nothing else. The **report**
 * kind is a state of the record no instrument clears, only a sitting: it
 * gates nothing and is carried into the brief. A gate whose findings the
 * session can only acknowledge is refused on every run and bypassed on
 * every run, and the bypass is then the launch -- which is what this split
 * ends, measured at graph 513edc3b as 211 findings of which the gate kind
 * was 0.
 *
 * The refusal names only the gating checks and their count: a reader told
 * that eight checks refused it, four of which cannot, has been told the
 * wrong thing.
 *
 * @param {Array<{check: string, node: string|null, detail: string, kind: string}>} findings
 * @param {{rootDir?: string|null, forceTier?: boolean}} [options]
 * @returns {{gate: object[], report: object[], error: Error|null}}
 */
export function tierGate(findings, { rootDir = null, forceTier = false } = {}) {
  const { gate, report } = partitionTier(findings);
  if (gate.length === 0 || forceTier) return { gate, report, error: null };
  const shown = gate.slice(0, 20).map((f) => `  ${f.check}: ${f.node ?? "(graph)"}: ${f.detail}`);
  const error = new Error(
    `the mechanical tier reports ${gate.length} finding(s) over the ${TIER_GATE_CHECKS.length} checks that gate `
    + `the launch (${TIER_GATE_CHECKS.join(", ")}), so no reader is launched: repair the nodes or kick them back.\n`
    + `${shown.join("\n")}\n`
    + (gate.length > shown.length
      ? `  ... and ${gate.length - shown.length} more (node packages/disposition/validate.mjs ${rootDir ?? "<graph>"} --tier)\n`
      : "")
    + "Pass --force-tier to write the brief anyway, for diagnosis; the brief then says it was launched over a failing tier.",
  );
  error.exitCode = 3;
  error.tierFindings = gate;
  return { gate, report, error };
}

/**
 * The tier's report kind, and the notes beside it, as the brief carries
 * them: one line each under a heading of their own, grouped by check with a
 * count per check, in the tier's own order. "They are reported beside the
 * tier and carried into the brief as one line each, so that the reader has
 * what the record already knows about itself and is not stopped by it."
 *
 * @param {Array<{check: string, node: string|null, detail: string}>} report
 * @param {Array<{note: string, detail: string}>} [notes]
 * @returns {string}
 */
export function tierReportSection(report, notes = []) {
  const groups = new Map();
  for (const f of report) {
    if (!groups.has(f.check)) groups.set(f.check, []);
    groups.get(f.check).push(`- ${f.node ?? "(graph)"}: ${f.detail}`);
  }
  for (const n of notes) {
    if (!groups.has(n.note)) groups.set(n.note, []);
    groups.get(n.note).push(`- ${n.detail}`);
  }
  const order = [...TIER_REPORT_CHECKS, ...[...groups.keys()].filter((k) => !TIER_REPORT_CHECKS.includes(k))];
  const lead = [
    TIER_REPORT_HEADING,
    "",
    "These are states of the record that no instrument clears and that only a sitting can, so they gate nothing and you are not stopped by them: they are here as what the record already knows about itself, and a finding of yours that repeats one of them tells the record nothing it has not already measured.",
    "",
  ];
  const total = report.length + notes.length;
  if (total === 0) {
    return [...lead, "(nothing: the tier's report kind found no state of the record to name, and every ledger entry is referenced)"].join("\n");
  }
  const body = [];
  for (const check of order) {
    const lines = groups.get(check);
    if (!lines || lines.length === 0) continue;
    body.push(`### \`${check}\` (${lines.length})`, "", ...lines, "");
  }
  return [...lead, ...body].join("\n").trimEnd();
}

/**
 * The sidecar the apply step compares against, written the moment the survey
 * is briefed: the graph commit the survey reads, the ids it judges, and the
 * recommendation hash of every node of the graph -- judged and context alike,
 * since a finding may name any node at any stage and a finding whose subject
 * has moved since is stale on its face (`clean-context-review`: "a review
 * attests to the text it read"). The apply step compares against this file
 * and never against a hash the reviewer copied.
 *
 * Beside `judged` it names `read`: every node the brief carried by what it
 * answers, with the five hashes as read. That list is what the apply step
 * pins as a read pin, and it is what makes the next delta bounded
 * (`the-whole-reading-is-a-backfill-and-the-delta-is-the-norm`: "That holds
 * only if every node the survey read carries the survey's pin, judged or
 * not, since a freeze keyed on the judged nodes' pins alone leaves every
 * settled node unfrozen and reads the whole graph forever"). The nodes the
 * brief carried on one line are not in it: they were already frozen on a
 * pin, so their pin stands as it is and the survey adds nothing to it.
 *
 * @param {object[]} read - the neighbourhood: the nodes carried by what
 *   they answer, which is what the survey actually read of them.
 * @returns {{commit: string|null, dirty: boolean, date: string,
 *   judged: string[], read: Array<{id: string, text: object}>,
 *   pins: Record<string, string>, text: Record<string, object>}}
 */
export function surveyPins({ graph, judged, read = [], date, commit, dirty }) {
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
  return {
    commit,
    dirty,
    date,
    judged: judged.map((n) => n.id),
    read: read.map((n) => ({ id: n.id, text: text[n.id] ?? sectionHashes(n, graph.words) })),
    pins,
    text,
  };
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
 * finding of its gate kind, the report kind gating nothing and being carried
 * into the brief instead (`tierGate`, `tierReportSection`; `forceTier`
 * bypasses a gating finding and stamps the brief, and stamps nothing where
 * there was none to bypass); the run is whole
 * or a delta, the whole reading being a backfill the caller asks for; and
 * the candidate pairs are nominated and cut, leaving the frozen set and the
 * drift probe drawn from it on the recorded seed.
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

  // The tier runs over the whole graph and not over the judged set, because
  // a finding on a node the survey merely reads as context is still a defect
  // the reader would spend its context on. Only the gate kind refuses the
  // launch; the report kind is carried into the brief below (`tierGate`).
  const conc = concordance(graph);
  const foldable = await loadFoldable();
  const tierFindings = checkTier(graph, { words: graph.words, foldable, concordance: conc });
  const notes = tierNotes(graph, { words: graph.words });
  const { gate: gateFindings, report: reportFindings, error: tierError } = tierGate(
    tierFindings, { rootDir, forceTier },
  );
  if (tierError !== null) throw tierError;

  // Whole or delta. The delta is the norm and the whole reading is the
  // backfill: `--whole` is the author's word and `--validations-changed`
  // the amendment, and nothing else makes a run whole. The history is read
  // so that this run can append to it, and decides nothing.
  const historyPath = path.join(sidecarBase, path.basename(SURVEY_HISTORY_FILE));
  const history = await readSurveyHistory(historyPath);
  const demand = wholeDemand(history, {
    date: effectiveDate, validationsChanged, whole,
  });
  const isWhole = demand.whole;

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const ordered = frontierOrderIds(graph).map((id) => byId.get(id)).filter(Boolean);

  const { judged: judgedUnordered, reasons } = judgedSet(graph);
  const judged = [...judgedUnordered].sort(rulingOrderCompare);
  const judgedIds = new Set(judged.map((n) => n.id));
  const neighbourIds = surveyNeighbourhoodIds(graph, judged);

  // The freeze: "a node the judged set reaches but whose read text has not
  // changed since a survey read it, judged or reached, is carried on one
  // line rather than by what it answers ... what unchanged means is the pin
  // the survey writes on every node it read, holding the hash of the text
  // it read, and never the pin of the judged nodes alone."
  //
  // So it is the five hashes against the node's own pin, of either kind,
  // and not the mere presence of a pin: a pin whose text has moved is a pin
  // on text that is no longer there, and the node it names is carried by
  // what it answers. A whole survey freezes nothing and carries every
  // neighbour by what it answers.
  const frozenIds = isWhole ? new Set() : frozenNodeIds(graph, judgedIds);
  const reached = ordered.filter((n) => neighbourIds.has(n.id));
  const unchangedReached = reached.filter((n) => frozenIds.has(n.id));
  const unchangedIds = new Set(unchangedReached.map((n) => n.id));
  const neighbourNodes = reached.filter((n) => !unchangedIds.has(n.id));
  const contextNodes = ordered.filter((n) => !judgedIds.has(n.id) && !neighbourIds.has(n.id));

  // The pairs, and the cut that leaves the frozen set behind.
  const pairs = candidatePairs(graph, { concordance: conc });
  const { live, frozen } = cutPairs(pairs, { byId, frozenIds, whole: isWhole });
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
  // "The reading's own report says which checks ran, of which kind, and what
  // the second kind found." So the stamp counts the two kinds separately and
  // points at the section that carries the second, and the forced line fires
  // only where the override actually bypassed a gating finding.
  const tierStamp = [
    `- The mechanical tier ran ${TIER_CHECKS.length} checks of two kinds. The ${TIER_GATE_CHECKS.length} that gate the launch `
      + `(${TIER_GATE_CHECKS.join(", ")}) reported ${gateFindings.length} finding(s); the ${TIER_REPORT_CHECKS.length} that report a state of the record `
      + `(${TIER_REPORT_CHECKS.join(", ")}) reported ${reportFindings.length} finding(s)`
      + `${notes.length > 0 ? `, with ${notes.length} note(s) beside them` : ""}, and gate nothing: they are carried below, under "${TIER_REPORT_HEADING.replace(/^#+ /, "")}".`
      + " A clean tier is not a clean frontier: these checks are what a machine can decide, and nothing else.",
    gateFindings.length > 0
      ? `- **This brief was launched over a failing tier (\`--force-tier\`), for diagnosis.** ${gateFindings.length} gating finding(s) stand unrepaired; treat what they name with suspicion.`
      : null,
  ].filter((line) => line !== null).join("\n");

  const selectionSummary = [
    "### The selection this survey took, and what it cost",
    "",
    `- **This survey is ${isWhole ? "whole (a backfill)" : "a delta"}.** ${demand.why}`,
    `- The judged set is ${judged.length} node(s); the neighbourhood carried by what it answers is ${neighbourNodes.length}; `
      + `${unchangedReached.length} node(s) the judged set reaches are carried on one line, their read text unchanged since a survey read them; `
      + `${contextNodes.length} node(s) are context. ${frozenIds.size} node(s) of the graph are frozen on the pin they carry.`,
    `- The keys nominated ${pairs.length} candidate pair(s): ${live.length} are live and listed below, `
      + `${frozen.length} are frozen (both members unchanged since a survey read them together) and named in \`${SURVEY_SELECTION_FILE}\`.`,
    isWhole
      ? "- Nothing is frozen and there is no drift probe: this survey is whole."
      : `- The drift probe draws ${probe.length} of the ${frozen.length} frozen pair(s), one in ${PROBE_DENOMINATOR} and never fewer than ${PROBE_FLOOR}, on seed \`${seed}\` (mulberry32, seeded from the date and the graph commit). A finding anywhere in the probe is a finding on the freeze: record it on the nodes it names like any other finding, and report it as the freeze's failure. It puts a backfill in front of the author and does not launch one.`,
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

  const grouped = groupedPairLines(live, judged, probeIds);
  const livePairs = [
    `### The candidate pairs (${live.length} live${isWhole ? "" : `, ${probe.length} of them the drift probe`}), grouped by the judged node each is compared against`,
    "",
    "A key narrows attention and never the corpus: every node this brief carries stays readable, and this list orders your reading rather than partitioning it. Record the key with any finding it produced, so a key's yield is measurable across surveys.",
    "",
    "One heading per judged node, in the ruling order, and one line per partner: the partner's slug, with the module dropped and the graph too where it is the disposition graph, then the keys that nominated the pair. A term key names the term and not the node that defines it — that node is in the concordance, and the judged node's own `Defines:` line is printed with it. A pair between two judged nodes is listed once, under the earlier of the two, and named in the later one's group.",
    "",
    grouped.listed > 0
      ? grouped.text
      : "(no key nominated a live pair against any judged node this round)",
    "",
    grouped.unjudged > 0
      ? `A further ${grouped.unjudged} live pair(s) join two nodes neither of which is judged this round. A judged node is compared against the nodes that reach it and against the other judged nodes, so those pairs are compared against nothing here; every one of them is named in \`${SURVEY_SELECTION_FILE}\`, and a finding on one of them is a finding like any other.`
      : "Every live pair this round has a judged member and is listed above.",
  ].join("\n");

  const driftProbe = probe.length > 0
    ? [
      `### The drift probe (${probe.length} frozen pair(s), drawn on seed \`${seed}\`; read them like any other pair)`,
      "",
      "Neither member of a frozen pair moved since a survey read them together — that is what froze it — so the probe is listed here rather than under a judged node's heading. A finding here is a finding on the freeze itself: write it on the nodes it names like any other finding, and say in your report that the probe found one, which is what puts a backfill before the author.",
      "",
      probe.map(probePairLine).join("\n"),
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
    tier_report: tierReportSection(reportFindings, notes),
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
    tier: {
      checks: TIER_CHECKS,
      gateChecks: TIER_GATE_CHECKS,
      reportChecks: TIER_REPORT_CHECKS,
      findings: tierFindings,
      report: reportFindings,
      notes,
      forced: forceTier && gateFindings.length > 0,
    },
    judged: judged.map((n) => ({ node: n.id, why: reasons.get(n.id) ?? null })),
    // The three node lists the selection is made of, each by id: what the
    // brief carried by what it answers, what the pins froze, and which of
    // the frozen the judged set reached and so carried on one line. The
    // apply step pins the first (`read` in the pins sidecar); the other two
    // are what a later reader audits the freeze by, since "what was not
    // read is a fact of the run and not an inference from the generator".
    neighbourhood: neighbourNodes.map((n) => n.id),
    frozen: [...frozenIds],
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
    frozenNodeCount: frozenIds.size,
    pairCount: pairs.length,
    livePairCount: live.length,
    frozenPairCount: frozen.length,
    probeCount: probe.length,
    seed,
    whole: isWhole,
    wholeDemanded: demand.demanded,
    wholeWhy: demand.why,
    // `tierFindingCount` is the gating count: it is what the launch turns
    // on, and the report kind is counted beside it and never in it.
    tierFindingCount: gateFindings.length,
    tierReportCount: reportFindings.length,
    tierNoteCount: notes.length,
    tierForced: forceTier && gateFindings.length > 0,
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
    `${JSON.stringify(surveyPins({ graph, judged, read: neighbourNodes, date: effectiveDate, commit, dirty }), null, 2)}\n`,
  );
  await writeFile(selectionPath, `${JSON.stringify(selection, null, 2)}\n`);
  await appendSurveyHistory(historyPath, history, {
    date: effectiveDate,
    whole: isWhole,
    commit,
    judged: judged.length,
    neighbourhood: neighbourNodes.length,
    frozenNodes: frozenIds.size,
    frozen: frozen.length,
    probe: probe.length,
    seed,
    bytes,
    lines,
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
        console.log(`tier: ${r.tierFindingCount} gating finding(s) over ${TIER_GATE_CHECKS.length} gating checks, ${r.tierReportCount} reported over ${TIER_REPORT_CHECKS.length} reporting checks, ${r.tierNoteCount} note(s)${r.tierForced ? " -- LAUNCHED OVER A FAILING TIER (--force-tier)" : ""}`);
        console.log(`survey: ${r.whole ? "whole" : "delta"}${r.wholeDemanded ? " (demanded)" : ""}: ${r.wholeWhy}`);
        // What the reading cost, in the terms the bound is stated in: what
        // moved, what its partners are, and what the pins froze.
        console.log(`freeze: ${r.frozenNodeCount} node(s) frozen on their pins; ${r.neighbourhoodCount} carried by what they answer; ${r.batchCount} judged and carried whole; ${r.bytes} bytes`);
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
