#!/usr/bin/env node
// .claude/skills/align-review/brief.mjs
//
// Writes one clean-context-review brief for the batch of nodes at the review
// stage, judged against the full graph: brief.md with its placeholders filled
// from the graph as it stands (SKILL.md §2; clean-context-review.md: "every
// invocation of it is one batch: the nodes at the review stage, evaluated
// against the full graph, answered and unanswered at every stage, read in one
// context, with nothing isolated by node"). Locks tmp/review/frontier.lock
// against a concurrent batch (frontier-consistency.md: "One review runs at a
// time over the frontier").
//
// The batch's nodes are carried in full -- question, disposition, the text
// that stands, rationale, every fact with every option it holds viable (its
// source and reference, the readings that bear on it, the one recommended
// and why, the one that stands, and the author's ruling where there is one),
// the '## Recommendation' fence when there is one, the review state, and the
// account -- because that is what receives a verdict. Every other node is
// carried as context -- class, stage, question, the text that stands, and a
// summary of its facts -- so the reviewer can tell whether a node or an
// option is a new question or a new answer to a question the record already
// asks (frontier-consistency.md, validation 15). Nothing of the invoking
// session enters the brief.
//
// Usage:
//   node brief.mjs [rootDir] [--date YYYY-MM-DD] [--dry]

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readGraph } from "../../../packages/disposition/read.mjs";
import { renderFrontier } from "../../../packages/disposition/project.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRIEF_TEMPLATE_PATH = path.join(HERE, "brief.md");
const OUT_FILE = "tmp/review/frontier.json";
const LOCK_MESSAGE = "a review is running (tmp/review/frontier.lock); wait for it, or remove the lock if its writer is gone";

function todayIsoUtc() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const opts = { rootDir: null, date: null, dry: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--date") {
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
 * This is the order `{{context_index}}` is written in, and the order
 * `batchNodes`/`contextNodes` are both drawn from below: the context is read
 * by rank because it is not what the author rules on. `{{batch_index}}` is
 * not this order -- it is separately re-sorted into the *ruling order*
 * (`rulingOrderCompare`), settling count first, since that is the order the
 * author rules on the batch in (`alignment-order`), and a node's rank alone
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
 * The batch's *ruling order* (`alignment-order`): settling count
 * descending -- a node whose ruling would settle more of the graph (more of
 * it standing under the node itself, or depending on it; `deriveSettles`)
 * is ruled on first -- then rank descending, then id ascending to break
 * what settling count alone does not. A node's own options are its own
 * ruling's content, not reach elsewhere, and do not count toward this. This
 * is deliberately not the frontier's own order (`frontierOrderIds`): rank
 * alone ranks by boost and shape, not by how much of the graph a ruling
 * settles, so the two orders can and do differ.
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

function reviewLine(node) {
  if (!node.review) return "none (never reviewed)";
  const stale = node.reviewStale
    ? " — STALE: what the node recommends has moved since that review was written (`reviewStale`), so its verdict answers a recommendation the node no longer carries"
    : "";
  return `${node.review.verdict} (${node.review.strength}, ${node.review.date}, of ${node.review.of})${stale}`;
}

function dependsText(node) {
  const entries = node.depends || [];
  if (entries.length === 0) return "none";
  return entries.map((d) => (d.option ? `${d.id}#${d.option}` : d.id)).join(", ");
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
 * out of which options, with what boldness, what stands, and what was ruled.
 */
function factDetail(fact) {
  const options = (fact.options || []).map((o) => o.name).join("|");
  const bits = [fact.recommends ? `recommends ${fact.recommends} (${fact.boldness})` : "recommends nothing yet"];
  bits.push(` of ${options}`);
  if (fact.stands) bits.push(`, stands ${fact.stands}`);
  const ruled = ruledOptionName(fact);
  if (ruled) {
    const ruling = fact.options.find((o) => o.name === ruled).ruling;
    bits.push(`, ruled ${ruling.response} on ${ruled} (${ruling.date})${fact.moved ? " — MOVED since that ruling" : ""}`);
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
      if (fact.stands === option.name) marks.push("stands (its text is the '## Answer' above)");
      if (option.ruling) marks.push(`ruled ${option.ruling.response} on ${option.ruling.date}, pinning ${option.ruling.of}`);
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

/** One batch node, whole: everything the reviewer gives a verdict on. */
function renderBatchNode(node) {
  const parts = [
    `### ${node.id}`,
    "",
    `- File: ${nodeFile(node)}`,
    `- Question: ${node.question}`,
    `- Stage: ${node.stage} | rank ${node.rank.toFixed(4)} | settles ${settlesText(node)} | status ${node.status} | class: ${classText(node)}`,
    `- Facts: ${factsSummary(node)}`,
    `- Earlier review: ${reviewLine(node)}`,
    `- Depends: ${dependsText(node)} | under: ${(node.under || []).join(", ") || "none"}`,
  ];
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

  parts.push("#### Account (the AI's account, with the subsections of earlier reviews)", "");
  parts.push(node.account || "(no '## Account' section)", "");

  return parts.join("\n");
}

/** One context node: what the batch is judged against. */
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
 * Fill brief.md for the batch at the review stage, with the full graph as
 * context, and write it, locking tmp/review/frontier.lock against a
 * concurrent batch -- unless `dry`, which prints the filled brief to stdout
 * and writes nothing at all, lock included. Refuses (letting the reader's
 * own message through) on a graph that does not validate.
 *
 * @returns {Promise<{briefPath: string, lockPath: string, batchCount: number, contextCount: number, lines: number}>}
 */
export async function writeFrontierBrief({ rootDir, reviewDir, date = null, dry = false }) {
  const lockPath = path.join(reviewDir, "frontier.lock");
  const briefPath = path.join(reviewDir, "frontier.brief.md");

  if (!dry) {
    let existingLock = null;
    try {
      existingLock = await readFile(lockPath, "utf8");
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    if (existingLock !== null) {
      const lockErr = new Error(LOCK_MESSAGE);
      lockErr.exitCode = 3;
      lockErr.lockContents = existingLock;
      throw lockErr;
    }
  }

  const graph = await readGraph(rootDir);
  const effectiveDate = date ?? todayIsoUtc();

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const ordered = frontierOrderIds(graph).map((id) => byId.get(id)).filter(Boolean);

  // The batch: the nodes at the review stage, in the frontier's order (the
  // order the batch itself, `{{batch}}`, is presented in). The context:
  // every other node, answered or unanswered, at whatever stage, by rank.
  const batchNodes = ordered.filter((n) => n.stage === "review");
  const contextNodes = ordered.filter((n) => n.stage !== "review");

  // The batch *index* alone is re-sorted into the ruling order: the author
  // rules on the batch in that order, not by rank, so this is the one
  // listing that must show it (`rulingOrderCompare`). The batch's own
  // presentation above (`batchText`) stays in the frontier's order.
  const batchIndexNodes = [...batchNodes].sort(rulingOrderCompare);

  const batchIndexText = batchIndexNodes.length > 0
    ? batchIndexNodes.map(indexLine).join("\n")
    : "(the batch is empty: no node carries `stage: review`)";
  const batchText = batchNodes.length > 0
    ? batchNodes.map(renderBatchNode).join("\n")
    : "(the batch is empty: no node carries `stage: review`, so there is no verdict to give)";
  const contextIndexText = contextNodes.length > 0
    ? contextNodes
      .map((n) => `- ${n.id} | ${n.status} | stage ${n.stage || "none"} | rank ${n.rank.toFixed(4)} | settles ${settlesText(n)} | ${classText(n)} | ${nodeFile(n)}`)
      .join("\n")
    : "(no other node: the batch is the whole graph)";
  const contextText = contextNodes.length > 0
    ? contextNodes.map(renderContextNode).join("\n")
    : "(no other node: the batch is the whole graph)";

  const template = await readFile(BRIEF_TEMPLATE_PATH, "utf8");
  const withoutNav = template
    .split("{{date}}").join(effectiveDate)
    .split("{{repo}}").join(path.resolve(rootDir, ".."))
    .split("{{batch_count}}").join(String(batchNodes.length))
    .split("{{context_count}}").join(String(contextNodes.length))
    .split("{{batch_index}}").join(batchIndexText)
    .split("{{context_index}}").join(contextIndexText)
    .split("{{batch}}").join(batchText)
    .split("{{context}}").join(contextText)
    .split("{{out}}").join(OUT_FILE);

  // {{nav}} is filled last, from the filled text itself: the brief is long,
  // and a reader that must read it whole is told where its parts begin. The
  // replacement is one line, as the placeholder's own line is, so the line
  // numbers it names stay true.
  const navLines = withoutNav.split("\n");
  const lineOf = (heading) => {
    const i = navLines.findIndex((l) => l === heading || l.startsWith(`${heading} `));
    return i === -1 ? "?" : String(i + 1);
  };
  const nav = `This brief is ${navLines.length} lines. Read it whole before writing anything: "## The batch" begins at line ${lineOf("## The batch")}, "## The full graph, as context" at line ${lineOf("## The full graph, as context")}, and "## Output" at line ${lineOf("## Output")}.`;
  const filled = navLines.map((l) => (l === "{{nav}}" ? nav : l)).join("\n");

  const result = {
    briefPath,
    lockPath,
    batchCount: batchNodes.length,
    contextCount: contextNodes.length,
    lines: navLines.length,
  };

  if (dry) {
    process.stdout.write(filled);
    return result;
  }

  await mkdir(reviewDir, { recursive: true });
  await writeFile(briefPath, filled);
  await writeFile(
    lockPath,
    `${JSON.stringify({ pid: process.pid, started: new Date().toISOString(), brief: "tmp/review/frontier.brief.md", out: OUT_FILE }, null, 2)}\n`,
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
      process.stderr.write(`${err.message}\n`);
      process.exitCode = 1;
      return;
    }
    const rootDir = path.resolve(process.cwd(), opts.rootDir ?? "disposition");
    const reviewDir = path.resolve(process.cwd(), "tmp/review");
    try {
      const result = await writeFrontierBrief({ rootDir, reviewDir, date: opts.date, dry: opts.dry });
      if (!opts.dry) {
        console.log(result.briefPath);
        console.log(`batch: ${result.batchCount} node(s) at stage review; context: ${result.contextCount} node(s); ${result.lines} lines`);
        if (result.lines > 4000) {
          process.stderr.write(
            `note: this brief is ${result.lines} lines; one reviewer may not hold it whole. Say so in the report if the reviewer could not read it all.\n`,
          );
        }
      }
    } catch (err) {
      if (err.lockContents) console.log(err.lockContents);
      process.stderr.write(`${err.message}\n`);
      process.exitCode = err.exitCode ?? 1;
    }
  })();
}
