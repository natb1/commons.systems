#!/usr/bin/env node
// Project a disposition graph into one self-contained HTML page, and/or into
// the harness-context projections named by session-context: `--rules <dir>`
// (one file per `tier: global` node), `--ancestry <node id> --local <file>`
// (one node's ancestry, pinned by blob hash), `--frontier <file>` (every
// node in rank order, `-` for stdout) -- the un-aligned-dispositions listing
// the browser itself excludes -- and `--alignment <file>` (`-` for stdout):
// the open dialogue the author rules on, one page, every node carrying a
// `stage`.
//
// Usage:
//   node packages/disposition/project.mjs [rootDir] [--input nodes.json] \
//     [--out browser/index.html] [--rules dir] [--ancestry nodeId --local file] \
//     [--frontier file] [--alignment file]
//
// Without --input the graph is read with readGraph(rootDir) from ./read.mjs.
// Each output is independent and only runs when its own flag is given. For
// --out, the graph is inlined verbatim into
// packages/disposition/browser-template.html; every projection decision
// lives in that template, so this script only reads, checks, and writes.

import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

// The one home of an option's sentence and of the terms the record glosses
// (commons.systems/disposition-graph/dialogue,
// `every-option-carries-its-sentence`): a projection reads them from here and
// never carries a sentence of its own for any option.
import { glossary, optionText } from "./derive.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MARKER = "<!--DG:GRAPH-->";

function parseArgs(argv) {
  const opts = { rootDir: null, input: null, out: null, rules: null, ancestry: null, local: null, frontier: null, alignment: null };
  const valueFlags = { "--input": "input", "--out": "out", "--rules": "rules", "--ancestry": "ancestry", "--local": "local", "--frontier": "frontier", "--alignment": "alignment" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a in valueFlags) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      opts[valueFlags[a]] = v;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag ${a}`);
    } else if (opts.rootDir === null) {
      opts.rootDir = a;
    } else {
      throw new Error(`unexpected argument ${a}`);
    }
  }
  if (opts.rootDir === null) opts.rootDir = ".";
  if ((opts.ancestry === null) !== (opts.local === null)) {
    throw new Error("--ancestry and --local must be given together");
  }
  return opts;
}

async function loadGraph(opts) {
  if (opts.input) return JSON.parse(await readFile(resolve(opts.input), "utf8"));
  const { readGraph } = await import("./read.mjs");
  return await readGraph(resolve(opts.rootDir));
}

// read.mjs's own `defineTerms` (packages/disposition/read.mjs), copied
// rather than imported: project.mjs's `--input`/`--out` path stays free of
// read.mjs's static 'yaml' import -- loadGraph only reaches read.mjs
// dynamically, and only when `--input` is absent -- and a helper this small
// is not worth drawing the whole reader in for.
function defineTerms(n) {
  return (n?.defines ?? []).map((d) => (typeof d === "string" ? d : d?.term)).filter((t) => typeof t === "string");
}

// Fatal on anything the page cannot render around; a warning on a field the
// page reads but the reader did not supply, so a contract drift is visible.
export function check(graph) {
  const warn = [];
  if (!graph || typeof graph !== "object") throw new Error("graph is not an object");
  if (!Array.isArray(graph.nodes)) throw new Error("graph.nodes is not an array");
  if (!graph.graphs || typeof graph.graphs !== "object") throw new Error("graph.graphs is not an object");
  if (graph.nodes.length === 0) throw new Error("graph.nodes is empty; nothing to project");

  const seen = new Set();
  const defines = new Map();
  for (const n of graph.nodes) {
    if (!n || typeof n.id !== "string" || !n.id) throw new Error("a node has no id");
    if (seen.has(n.id)) throw new Error(`duplicate node id ${n.id}`);
    seen.add(n.id);
    if (typeof n.question !== "string" || !n.question) warn.push(`${n.id}: no question`);
    if (!(n.graph in graph.graphs)) warn.push(`${n.id}: graph "${n.graph}" is not in graphs`);
    if (typeof n.rank !== "number" || !(n.rank > 0) || n.rank > 1) warn.push(`${n.id}: rank ${n.rank} is not in (0,1]`);
    if (!n.status) warn.push(`${n.id}: no status`);
    if (!Array.isArray(n.children)) warn.push(`${n.id}: children is not an array`);
    if (!Array.isArray(n.under)) warn.push(`${n.id}: under is not an array`);
    for (const t of defineTerms(n)) {
      const key = t.toLowerCase();
      if (defines.has(key)) warn.push(`term "${t}" defined by both ${defines.get(key)} and ${n.id}`);
      else defines.set(key, n.id);
    }
    // The browser's vocabulary reads a term's gloss where the node recorded
    // one (falling back to the node's opening sentence otherwise), so a term
    // with no gloss yet is not fatal but is worth a warning: the live graph
    // is mid-migration from the bare-string 'defines' entry to {term, gloss},
    // and this is the one place that drift becomes visible.
    for (const entry of n.defines || []) {
      const term = typeof entry === "string" ? entry : entry?.term;
      const gloss = typeof entry === "string" ? null : entry?.gloss;
      if (typeof term === "string" && term && !gloss) warn.push(`${n.id}: term "${term}" has no gloss`);
    }
  }
  for (const n of graph.nodes) {
    for (const id of n.under || []) if (!seen.has(id)) warn.push(`${n.id}: under names unknown ${id}`);
    for (const id of n.children || []) if (!seen.has(id)) warn.push(`${n.id}: children names unknown ${id}`);
    for (const c of n.cites || []) if (!seen.has(c && c.id)) warn.push(`${n.id}: cites unknown ${c && c.id}`);
    if (n.ceiling && !seen.has(n.ceiling)) warn.push(`${n.id}: ceiling names unknown ${n.ceiling}`);
  }
  return warn;
}

const RULES_NOTICE = "Generated by packages/disposition/project.mjs --rules; do not edit.";

/**
 * The authority a projection names on a node, in one phrase. There is no
 * stamp to quote: the class is derived from the rulings recorded on the
 * node's facts (commons.systems/disposition-graph/viable-options), so what
 * a reader needs is the class and where it came from -- this node's own
 * ruling, with the date of it, or the ancestor whose ruling grants it, or
 * nothing at all, in which state the node is unanswered and carries the
 * stage of the dialogue owed on it.
 *
 * @param {object} node - a node as `read.mjs` returns it.
 * @returns {string}
 */
export function classPhrase(node) {
  const cls = node.class || "unanswered";
  const src = node.classSource || null;
  let head;
  if (cls === "unanswered") {
    head = "unanswered";
  } else if (src && src.kind === "ancestor") {
    head = `${cls}, granted by ${src.id}`;
  } else {
    const fact = cls === "ratified"
      ? node.answerFact
      : (node.facts || []).find((f) => f.name === "authority") || null;
    const ruled = fact ? (fact.options || []).find((o) => o.ruling) : null;
    head = ruled ? `${cls}, ruled ${ruled.ruling.date}` : cls;
  }
  return node.stage ? `${head}; stage ${node.stage}` : head;
}

/**
 * Project every `tier: global` node into its own rule file under `dir`, one
 * file per node, named `<slug>.md`: a `# <question>` heading, the exact
 * notice line session-context's rules are read against, a blank line, then
 * the node's `## Answer` text verbatim (nothing from the rationale).
 *
 * This function owns `dir`: an existing file at a written slug is replaced
 * unconditionally (generated or hand-written -- either way it is now stale),
 * and afterward, every other `.md` file already in `dir` that carries
 * RULES_NOTICE but was not just written is deleted, because it can only be
 * this function's own output from a node that is no longer `tier: global`.
 * A file without the notice is never deleted: silence about hand-written
 * files is what lets this function own the directory safely.
 *
 * @param {{nodes: object[]}} graph
 * @param {string} dir
 * @returns {Promise<{dir: string, written: string[], deleted: string[]}>}
 */
export async function writeRules(graph, dir) {
  const target = resolve(dir);
  await mkdir(target, { recursive: true });

  const written = [];
  const keep = new Set();
  for (const node of graph.nodes) {
    if (node.tier !== "global") continue;
    if (typeof node.answer !== "string" || node.answer.length === 0) {
      throw new Error(`--rules: global-tier node ${node.id} has no '## Answer' section to project`);
    }
    const fileName = `${node.slug}.md`;
    const filePath = join(target, fileName);
    const notice = `> Projected from ${node.id} (${classPhrase(node)}). ${RULES_NOTICE} If this file conflicts with the graph on the disposition ref, the graph wins.`;
    const content = `# ${node.question}\n${notice}\n\n${node.answer}\n`;
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
    written.push(filePath);
    keep.add(fileName);
  }

  const deleted = [];
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || keep.has(entry.name)) continue;
    const filePath = join(target, entry.name);
    const text = await readFile(filePath, "utf8");
    if (text.includes(RULES_NOTICE)) {
      await rm(filePath);
      deleted.push(filePath);
    }
  }

  return { dir: target, written, deleted };
}

/**
 * Breadth-first walk of `nodeId` and its ancestors up every `under` edge to
 * the roots: the node itself first, then its parents, then their parents,
 * and so on, each id appearing exactly once, at the shallowest depth it is
 * reachable from (a multi-parent join does not duplicate a shared ancestor).
 * Ties within one depth break by id, for a deterministic order.
 *
 * @param {string} nodeId
 * @param {Map<string, {id: string, under?: string[]}>} nodesById
 * @returns {string[]} nodeId then its ancestors, nearest first
 */
function ancestorChain(nodeId, nodesById) {
  if (!nodesById.has(nodeId)) {
    throw new Error(`--ancestry: no node with id '${nodeId}'`);
  }
  const order = [];
  const visited = new Set([nodeId]);
  let frontier = [nodeId];
  while (frontier.length > 0) {
    frontier.sort();
    order.push(...frontier);
    const next = new Set();
    for (const id of frontier) {
      for (const parent of nodesById.get(id).under ?? []) {
        if (!visited.has(parent)) {
          visited.add(parent);
          next.add(parent);
        }
      }
    }
    frontier = [...next];
  }
  return order;
}

/**
 * Write the `CLAUDE.local.md`-shaped ancestry projection of one node: a
 * title, a notice line that pins the node and every ancestor (nearest first,
 * up every `under` chain to the roots, no duplicates) to its exact blob
 * hash, then one `## <question>` section per node in that same list giving
 * its id, the class its rulings derive to ("un-aligned" where it has no
 * `## Answer` at all, which no class says), and its `## Answer` text
 * verbatim.
 *
 * A `tier: global` node is pinned like any other ancestor -- its hash still
 * lets a bite detect that a rule moved under it -- but gets no section of
 * its own: its question and answer are already projected as a rule, and
 * repeating them here would give the two projections a chance to read
 * differently once only one is regenerated.
 *
 * @param {{nodes: object[]}} graph
 * @param {string} nodeId
 * @param {string} file
 * @returns {Promise<{file: string, content: string}>}
 */
export async function writeAncestry(graph, nodeId, file) {
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const chain = ancestorChain(nodeId, nodesById);

  const pins = chain.map((id) => `${id}@${nodesById.get(id).hash}`).join(", ");
  const lines = [
    `# Ancestry of ${nodeId}`,
    `> Projected by packages/disposition/project.mjs --ancestry; do not edit. Pins: ${pins} for the node and each ancestor.`,
    "",
  ];

  for (const id of chain) {
    const node = nodesById.get(id);
    if (node.tier === "global") continue;
    // The class the node's rulings confer, which the reader has already
    // derived (`class`), and "un-aligned" for the disposition with a
    // question and no answer yet -- a distinction the class does not carry,
    // since an unanswered node may well have a drafted answer. Read off the
    // node rather than recomputed: this file is sometimes copied standalone
    // (see project.test.mjs's space-in-path CLI test), so it must not pick
    // up a static sibling-module dependency.
    const hasAnswer = typeof node.answer === "string" && node.answer.length > 0;
    const label = hasAnswer ? (node.class || "unanswered") : "un-aligned";
    lines.push(`## ${node.question}`, "", `${node.id} (${label})`);
    if (typeof node.answer === "string" && node.answer.length > 0) {
      lines.push("", node.answer);
    }
    lines.push("");
  }
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  const content = `${lines.join("\n")}\n`;
  const filePath = resolve(file);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
  return { file: filePath, content };
}

/**
 * Drop every node with no `## Answer` (`node.answer == null`) -- an
 * un-aligned disposition that has not survived the alignment dialogue --
 * from the data the browser receives: it renders no page, appears in no
 * nav tree or search, and defines no term, simply by being absent from
 * `nodes`. This is not a `status` check: `status` is derived from the
 * rulings alone (see `deriveStatus`) and an unanswered node with an answer
 * -- a draft no ruling reaches -- is very much shown, just marked
 * unanswered; only a genuine no-answer node is excluded here. Any
 * surviving node's `cites` entries and `children` list that point at a
 * dropped id are removed too, since the cited/child node no longer exists
 * in this projection; nothing else about a node changes. A graph with
 * nothing to drop is returned unchanged, and a node that names no dropped
 * id in either field is returned unchanged as well.
 *
 * This runs after `check()`, not before: `check()` validates the reader's
 * full contract, and a citation or child reference into a node this
 * function is about to drop is not a contract violation.
 *
 * @param {{nodes: object[]}} graph
 * @returns {{nodes: object[]}}
 */
export function excludeUnaligned(graph) {
  const dropped = new Set(graph.nodes.filter((n) => n.answer == null).map((n) => n.id));
  if (dropped.size === 0) return graph;
  const nodes = graph.nodes
    .filter((n) => !dropped.has(n.id))
    .map((n) => {
      const citesHit = (n.cites || []).some((c) => dropped.has(c.id));
      const childrenHit = (n.children || []).some((id) => dropped.has(id));
      if (!citesHit && !childrenHit) return n;
      const next = { ...n };
      if (citesHit) next.cites = n.cites.filter((c) => !dropped.has(c.id));
      if (childrenHit) next.children = n.children.filter((id) => !dropped.has(id));
      return next;
    });
  return { ...graph, nodes };
}

/**
 * `graph`, with every fact's every option carrying its own `sentence`:
 * `optionText`'s result (derive.mjs), computed once here and carried into
 * the page as data rather than re-derived by the browser, which has no
 * glossary of its own to build one from (commons.systems/disposition-graph/
 * dialogue, `every-option-carries-its-sentence`). Never mutates its
 * argument -- a fresh node, fact and option are built wherever a sentence is
 * attached -- since the same graph object may still be read by
 * --rules/--frontier/--alignment in the same run.
 *
 * @param {{nodes: object[]}} graph
 * @returns {{nodes: object[]}}
 */
export function withOptionSentences(graph) {
  const nodes = graph.nodes.map((n) => {
    const facts = n.facts;
    if (!Array.isArray(facts) || facts.length === 0) return n;
    return {
      ...n,
      facts: facts.map((f) => ({
        ...f,
        options: (f.options || []).map((o) => ({ ...o, sentence: optionText(graph, n, f, o) })),
      })),
    };
  });
  return { ...graph, nodes };
}

// `graph`, with `probes` dropped from every node before it is serialized.
// The browser publishes the whole graph object into the page source, so an
// unstripped `probes` would be readable by anyone who opened the page
// whatever the client rendered -- a probe is not published, and the
// maieutic session is the only place it is asked
// (commons.systems/disposition-graph/dialogue).
function withoutProbes(graph) {
  const nodes = graph.nodes.map((n) => {
    if (!('probes' in n)) return n;
    const { probes, ...rest } = n;
    return rest;
  });
  return { ...graph, nodes };
}

export function build(template, graph) {
  if (!template.includes(MARKER)) throw new Error(`template has no ${MARKER} marker`);
  // "<" only ever occurs inside a JSON string, so escaping it keeps the
  // payload valid JSON and keeps "</script" out of the document.
  const json = JSON.stringify(withoutProbes(withOptionSentences(graph))).replace(/</g, "\\u003c");
  const block = `<script type="application/json" id="graph">${json}</script>`;
  return template.replace(MARKER, () => block);
}

// `<id>` for a bare depends entry, `<id>#<option>` for a qualified one --
// the same syntax `readDependsList` (read.mjs) parses back apart.
function formatDependsEntry(d) {
  return d.option ? `${d.id}#${d.option}` : d.id;
}

// The count of open probes on a node -- entries carrying no `status` -- read
// on both the frontier's per-node block and the alignment page's stage chip.
// Never the probe's `asks`, `why`, `discharges`, or `id`: the maieutic
// session is where those are read, and this is only ever the count
// (commons.systems/disposition-graph/dialogue).
function countOpenProbes(node) {
  return (node.probes || []).filter((p) => !p.status).length;
}

// The parenthetical breakdown shared by the ruling-order line and the
// per-node "settles:" detail line below, which differ only in the label's
// punctuation (inline prose there, a "key: value" detail line here). The
// node's own answer options are counted and never summed: they say what a
// sitting on this node will cost and settle nothing beyond it.
function settlesBreakdown(node) {
  const s = node.settledBy;
  const opts = s.options > 0 ? `; ${s.options} option${s.options === 1 ? "" : "s"}, uncounted` : "";
  return `${node.settles} (${s.under} under, ${s.depends} depends${opts})`;
}

// Where a node's class comes from, in the frontier's own shorthand: this
// node's own ruling, the ancestor whose ruling grants it, or no ruling at
// all reaching it.
function classSourceWord(node) {
  const src = node.classSource;
  if (!src) return "no ruling";
  return src.kind === "ancestor" ? `ancestor ${src.id}` : "ruling";
}

/* One fact of a node on one line: what it recommends and with what
 * boldness, whether a case against that recommendation is on record, the
 * option the author ruled on and whether the recommendation has moved
 * since, what stands and whether a fence carries a newer recommendation,
 * and every option with the source that put it on the table, how many are
 * on the table and how many of those are passed over. This is the whole of
 * a node's authority now, so the frontier prints all of it rather than a
 * summary. */
function factLine(node, fact) {
  const bits = [
    fact.recommends
      ? `recommends ${fact.recommends} (boldness ${fact.boldness}, against: ${fact.against ? "case against recorded" : "none"})`
      : "no recommendation",
  ];
  if (fact.ruled) {
    const option = fact.options.find((o) => o.name === fact.ruled);
    const moved = fact.moved ? ", moved" : "";
    bits.push(`ruled ${option.ruling.response} on ${fact.ruled}, ${option.ruling.date}${moved}`);
  }
  if (fact.name === "answer") {
    bits.push(fact.stands ? `stands ${fact.stands}` : "nothing stands");
    if (node.fence) bits.push("fence");
  }
  const options = fact.options
    .map((o) => (o.source ? `${o.name} (${o.source})` : o.name))
    .join(", ");
  const passed = fact.options.filter((o) => o.status === "passed").length;
  const count = passed > 0 ? `${fact.options.length}, ${passed} passed over` : `${fact.options.length}`;
  bits.push(`options (${count}): ${options}`);
  return `  fact ${fact.name}: ${bits.join("; ")}`;
}

/* One node's survey state on one line: when the survey last read this
 * recommendation, whether the recommendation has moved since, and whether
 * the survey is owed. Null where there is nothing to say -- no pin, and no
 * stage the survey judges (commons.systems/disposition-graph/dialogue's
 * `survey-pin-in-review`: the projections derive which of the two readings
 * is owed and show it). */
function surveyLine(node) {
  const survey = node.review ? node.review.survey : null;
  if (!survey) return node.surveyOwed ? "survey: owed" : null;
  const stale = node.surveyStale ? ", changed since its survey" : "";
  const owed = node.surveyOwed ? "; survey owed" : "";
  return `survey: surveyed ${survey.date}${stale}${owed}`;
}

// A field printed to one physical line, whatever whitespace the source held:
// collapsed so free text can never break the frontier's own line-per-entry
// format (brief.mjs's frontierOrderIds counts a node by its own '- <id>'
// line and would miscount one that split across lines), and capped so one
// long paragraph does not dominate an at-a-glance listing.
const ONE_LINE_CHARS = 140;
function oneLine(s, n = ONE_LINE_CHARS) {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1).trimEnd()}…` : flat;
}

/**
 * Render every node in the graph as a flat markdown listing: first the
 * ruling order -- the alignment frontier (every node carrying a `stage`)
 * ranked by `settles` descending, then `rank` descending, then id, the
 * order in which a ruling settles the most still-open ground first -- then
 * every node in the graph, descending by `rank` alone (ties broken by id),
 * which is the frontier of un-aligned dispositions (and everything else)
 * that `excludeUnaligned` hides from the browser. Pure and deterministic:
 * nothing but the graph's own data, no dates or timestamps.
 *
 * @param {{module: string, nodes: object[]}} graph
 * @returns {string} markdown, newline-terminated
 */
export function renderFrontier(graph) {
  const nodes = [...graph.nodes].sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const rulingOrder = graph.nodes.filter((n) => n.stage).sort((a, b) => {
    if (b.settles !== a.settles) return b.settles - a.settles;
    if (b.rank !== a.rank) return b.rank - a.rank;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  // The head says what the two readings leave outstanding: how many of the
  // nodes at the ruling stage carry both pins on the recommendation as it
  // stands, and how many nodes anywhere on the frontier still owe the
  // survey. That is the answer to "what can be ruled now", which the count
  // of ruling-stage nodes alone stopped being once the review divided in two
  // (commons.systems/disposition-graph/clean-context-review).
  const atRuling = graph.nodes.filter((n) => n.stage === "ruling");
  const ready = atRuling.filter((n) => n.readyToRule);
  const awaitingSurvey = graph.nodes.filter((n) => n.surveyOwed);

  const lines = [
    `# Frontier of ${graph.module}`,
    "",
    `Ready to rule: ${ready.length} of ${atRuling.length} at the ruling stage. Awaiting the survey: ${awaitingSurvey.length}.`,
    "",
    "## Ruling order",
    "",
  ];
  if (rulingOrder.length === 0) {
    lines.push("_none_");
  } else {
    rulingOrder.forEach((node, i) => {
      lines.push(`${i + 1}. ${node.id} — settles ${settlesBreakdown(node)} — rank ${node.rank.toFixed(4)} — stage ${node.stage}`);
    });
  }
  lines.push("", "## Every node, by rank", "");

  for (const node of nodes) {
    const head = [
      node.id,
      node.status,
      `${node.class} (${classSourceWord(node)})`,
      `rank ${node.rank.toFixed(4)}`,
    ];
    if (node.tier === "global") head.push("tier global");
    if (node.boost != null) head.push(`boost ${node.boost}`);
    lines.push(`- ${head.join(" — ")}`);

    if (node.order && node.order.length > 0) {
      const stepsText = node.order.map((step) => step.join(" = ")).join(" > ");
      lines.push(`  order: ${stepsText}`);
    }
    if (node.stage) {
      lines.push(`  stage: ${node.stage}`);
      lines.push(`  settles: ${settlesBreakdown(node)}`);
    }
    if (node.depends && node.depends.length > 0) {
      lines.push(`  depends: ${node.depends.map(formatDependsEntry).join(", ")}`);
    }
    const openProbes = countOpenProbes(node);
    if (openProbes > 0) lines.push(`  probes: ${openProbes} open`);
    for (const fact of node.facts || []) lines.push(factLine(node, fact));
    if (node.review && node.review.verdict) {
      const stale = node.reviewStale ? ", changed since its review" : "";
      lines.push(`  review: ${node.review.verdict} (${node.review.strength}, ${node.review.date})${stale}`);
      if (node.review.against) lines.push(`  against: ${oneLine(node.review.against)}`);
    }
    const survey = surveyLine(node);
    if (survey) lines.push(`  ${survey}`);
    if (node.readyToRule) lines.push("  ready to rule");
    if (node.answer == null) lines.push(`  under: ${(node.under || []).join(", ")}`);
    if (node.instrument) {
      const note = node.instrument.note ? ` — ${node.instrument.note}` : "";
      lines.push(`  instrument: ${node.instrument.kind}: ${node.instrument.ref}${note}`);
    } else {
      lines.push("  instrument: none");
    }
    for (const s of node.shims || []) {
      lines.push(`  shim (${s.declared}): ${s.artifact} — for: ${s.for || "unstated"} — liquidation: ${s.liquidation}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

/* ------------------------------------------------------------------ *
 * the alignment page: every node carrying a `stage` -- an unanswered
 * node, or an answered node whose ratification is under review -- rendered
 * as one flat, at-rest page the author rules on, in one ruling order
 * across every graph the manifest names (see `orderAlignmentItems`): a
 * graph is a label on each item, never a precedence, since the frontier's
 * dependencies cross graphs. Unlike the browser, every item is rendered to
 * HTML here, in Node, at build time: there is no per-node route to click
 * through, so the file itself already holds everything a reader (or a
 * test) will ever see, the edit between the node and its fence included.
 * alignment-template.html's own <script> is untouched by this function; it
 * only carries what has to run in a browser -- the theme toggle, staging
 * the author's responses, submitting them, and the "copy all" digest.
 * ------------------------------------------------------------------ */

const ALIGNMENT_MARKER = "<!--DG:ITEMS-->";

/* What each stage asks of the author, in the movement it names. Only the
 * ruling stage takes a response on the facts; the two earlier stages ask for
 * the author's own words and offer the control for them, and the review stage
 * asks for nothing at all (commons.systems/disposition-graph/alignment-page). */
const STAGE_ASK = {
  periagogic: {
    lbl: "Your account of the ground",
    hint: "The dialogue owes your own account of what this question sits on, before the AI's enters. What you write is recorded verbatim.",
    placeholder: "What this question sits on, in your words",
  },
  maieutic: {
    lbl: "Your intention",
    hint: "The ground is recorded and no answer is drafted. What you write is what the options are drawn from.",
    placeholder: "What you want this question answered to",
  },
};
const REVIEW_ASK = "This draft is with the clean-context review: the reading is owed or running, and nothing is asked here until it returns.";

const NO_ANSWER_LINE = "No answer yet: this node is the author's disposition awaiting its answer.";
const FACTS_LBL = "What this ruling asks";
const NOTHING_PROPOSED = "Nothing is proposed on this node yet: it carries no facts, and what the dialogue owes is above.";
const NO_RECOMMENDATION = "no recommendation stands";
const NO_CASE_AGAINST = "no case against is recorded";
const CASE_AGAINST_LBL = "The case against it";
const OPTION_NOTE_PLACEHOLDER = "Your reason, or the edits you want made";
const OPTION_DRILL_LBL = "The rest of it, and your own words";
const KICKBACK_VALUE = "__kickback";
const KICKBACK_CAPTION = "None of these is acceptable: the node returns to the maieutic movement, where the options are drawn again from what you write.";
const KICKBACK_NOTE = "A kick-back on one fact moves the whole node, since a node has one stage. What you confirmed on its other facts is staged and recorded with it.";
const KICKBACK_PLACEHOLDER = "What these options miss, and what the next ones are drawn from";
const PANE_LBL = "The node as it would stand";
const INDICATIONS_LBL = "What a ruling here makes decidable";
const INDICATIONS_HINT = "Context, not rows: each is a node of its own and is ruled from the rail in its own turn in the order.";

/* The authority the text already in the record actually has, which is what
 * the choice keeping it must be named for. A node's class is derived from
 * the rulings on its facts, and only a ruling on the answer fact makes the
 * text that stands the author's: a delegated or deferred class is a ruling
 * about who decides and not about this answer, so the text under it is
 * still a draft no one has confirmed. Testing for a stamp rather than for a
 * ruling on the answer called every draft in the record "standing" -- on
 * 2026-09-04 no node of the 72 was ratified and 46 carried a deferred stamp
 * -- and offered a confirmation of the AI's own draft as the safe, ordinary
 * choice (commons.systems/disposition-graph/alignment-page, the author's
 * finding on commons.systems/public/agency). */
function standingState(n) {
  const stands = n.answerFact ? n.answerFact.stands : null;
  const hasAnswer = typeof n.answer === "string" && n.answer.length > 0;
  if (!stands || !hasAnswer) return "none";
  return n.class === "ratified" ? "ratified" : "draft";
}

// The options of the answer fact other than the one whose text stands: what
// is still on the table, which is what a sitting on this node has to work
// through.
function pendingOptions(n) {
  const fact = n.answerFact;
  if (!fact) return [];
  return fact.options.filter((o) => o.name !== fact.stands);
}

/* The name a row that keeps the text already in the record goes by: the
 * authority that text actually has, and never more. Naming it "the node as it
 * stands" claimed a standing the text does not have and read as the safe,
 * ordinary choice when on an AI-drafted node written in the author's own voice
 * it is the least safe one on the page (the author's finding of 2026-09-04 on
 * commons.systems/public/agency). Where nothing stands there is no such row. */
const STANDING_LABELS = {
  ratified: "the ratified answer",
  draft: "a draft no one has confirmed",
};

const EARLY_STAGES = new Set(["periagogic", "maieutic"]);
const LOCKED_NOTE = "Not open for a ruling yet: a confirmation recorded before the ruling stage is invalid, so everything below is shown and nothing below can be answered. The chip above opens the dialogue that moves this node on.";
const NO_WORDS_LINE = "No words of yours are recorded on this node yet. What the answer below says, the AI drafted.";

// Where an option came from, in the words a row says it in: the author, the
// AI, the clean-context review, or the node whose sitting recorded it, which
// names itself.
const SOURCE_WORDS = { author: "the author", ai: "the AI", review: "the review" };

function alignEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"));
}

// Every markdown link renders as plain text: the alignment page is a flat,
// at-rest document with no per-node route to send a reader to, and almost
// every link this record writes is `[text](#some/node/id)` -- an address
// the browser resolves and this page cannot.
function alignMarks(t) {
  t = t.replace(/\[([^\]]+)\]\([^)\s]*\)/g, "$1");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[\s(["])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  t = t.replace(/(^|[\s(["])_([^_\s][^_]*)_/g, "$1<em>$2</em>");
  return t;
}

function alignInline(s) {
  return String(s == null ? "" : s).split(/(`[^`]*`)/g).map((p) => {
    if (p.length > 1 && p.charAt(0) === "`" && p.charAt(p.length - 1) === "`") {
      return `<code>${alignEsc(p.slice(1, -1))}</code>`;
    }
    return alignMarks(alignEsc(p));
  }).join("");
}

const ALIGN_RE_BULLET = /^\s*([-*+])\s+(.*)$/;
const ALIGN_RE_ORDER = /^\s*(\d+)[.)]\s+(.*)$/;
const ALIGN_RE_BREAK = /^\s*(?:#{1,6}\s|```|>|[-*+]\s|\d+[.)]\s)/;
const ALIGN_RE_RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;

/**
 * Port of the browser template's `mdBlocks`, adapted to keep a fenced
 * block's info string as `lang` so `renderProposal` can single out a
 * fenced ```markdown block -- a draft quoted into the account -- for its
 * own label; no other caller reads `lang`.
 *
 * @param {string} src
 * @returns {{type: string, lang?: string, html: string}[]}
 */
function alignBlocks(src) {
  const out = [];
  if (src == null || String(src).trim() === "") return out;
  const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = line.match(/^\s*```(\S*)\s*$/);
    if (fence) {
      const code = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
      i++;
      out.push({ type: "code", lang: fence[1] || "", html: `<pre><code>${alignEsc(code.join("\n"))}</code></pre>` });
      continue;
    }
    if (ALIGN_RE_RULE.test(line)) { out.push({ type: "rule", html: "<hr>" }); i++; continue; }
    const head = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (head) {
      const lvl = Math.max(3, Math.min(6, head[1].length));
      const text = head[2].trim().replace(/\s+#+\s*$/, "");
      out.push({ type: "heading", html: `<h${lvl}>${alignInline(text)}</h${lvl}>` });
      i++;
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quoted = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { quoted.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      out.push({ type: "quote", html: `<blockquote>${alignHtml(quoted.join("\n"))}</blockquote>` });
      continue;
    }
    if (ALIGN_RE_BULLET.test(line) || ALIGN_RE_ORDER.test(line)) {
      const ordered = !ALIGN_RE_BULLET.test(line);
      const re = ordered ? ALIGN_RE_ORDER : ALIGN_RE_BULLET;
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(re);
        if (m) { items.push(m[2]); i++; }
        else if (items.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i])) { items[items.length - 1] += ` ${lines[i].trim()}`; i++; }
        else break;
      }
      const tag = ordered ? "ol" : "ul";
      out.push({ type: "list", html: `<${tag}>${items.map((t) => `<li>${alignInline(t)}</li>`).join("")}</${tag}>` });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !ALIGN_RE_BREAK.test(lines[i]) && !ALIGN_RE_RULE.test(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    if (!para.length) { i++; continue; }
    out.push({ type: "para", html: `<p>${alignInline(para.join(" "))}</p>` });
  }
  return out;
}

function alignHtml(src) {
  return alignBlocks(src).map((b) => b.html).join("");
}

/**
 * `## Account`, with a fenced ```markdown block -- a recommended text
 * quoted into the account -- called out in its own labelled block so it is
 * never mistaken for "The node as it stands" or for the node's own
 * `## Recommendation`.
 *
 * @param {string} src
 * @returns {string}
 */
function renderAccount(src) {
  return alignBlocks(src).map((b) => {
    if (b.type === "code" && b.lang === "markdown") {
      return `<div class="quoted"><p class="blk-label">Quoted in the account; the sections above are the node</p>${b.html}</div>`;
    }
    return b.html;
  }).join("");
}

// Doc ids may not contain '/'; a node id always does.
function alignDocId(nodeId) {
  return String(nodeId).replace(/\//g, ":");
}

/* ------------------------- the edit: node against its fence ---------- */

// Every frontmatter key the reader carries except `question` (the
// validator already holds the fence to the node's own question) and the
// dialogue-state keys -- `stage`, `facts`, `review`, `depends` -- which are
// the dialogue's own state, removed at the recording, and never part of
// what the author rules on. The fence may not carry any of the four at all
// (the validator rejects them inside one), so comparing them would report
// every fenced node as dropping its own facts.
//
// `probes` belongs on this list of exclusions and is deliberately absent
// from `EDIT_FM_KEYS` below rather than added to it: a probe is never edited
// from the alignment page, for the same reason the four dialogue keys above
// are not -- it is not part of what the author rules on
// (commons.systems/disposition-graph/dialogue). Do not add it here; the
// invariant holds by omission.
const EDIT_FM_KEYS = [
  "form", "under", "tier", "boost", "cites", "instrument",
  "after", "source", "bears", "defines", "shims", "order",
];

// Key-sorted JSON, for comparison only: two values are the same field
// value when their canonical forms match, whatever order YAML gave the
// keys. A structured value (`instrument`, a `bears` entry) is compared as a
// whole, since that is what one field of the record is.
function stableJson(v) {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  if (typeof v === "object") {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stableJson(v[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

// YAML flow style, the compact one-line rendering of a frontmatter value:
// `rule`, `[a, b]`, `{class: ratified, by: claude, date: 2026-09-03}`, and
// `none` for an absent or empty one.
function flowYaml(v) {
  if (v === null || v === undefined) return "none";
  if (Array.isArray(v)) return v.length === 0 ? "none" : `[${v.map(flowYaml).join(", ")}]`;
  if (typeof v === "object") {
    const keys = Object.keys(v).filter((k) => v[k] !== null && v[k] !== undefined);
    if (keys.length === 0) return "none";
    return `{${keys.map((k) => `${k}: ${flowYaml(v[k])}`).join(", ")}}`;
  }
  return String(v);
}

/**
 * The frontmatter half of the edit: one entry per field whose value
 * differs between the node as it stands and the recommended text in its
 * fence, in the reader's own key order. The dialogue-state keys (see
 * EDIT_FM_KEYS) are ignored.
 *
 * @param {object} node - a node as `read.mjs` returns it.
 * @param {{frontmatter: object}} fence - `node.fence`.
 * @returns {{field: string, before: string, after: string}[]}
 */
export function frontmatterEdits(node, fence) {
  const out = [];
  const fm = (fence && fence.frontmatter) || {};
  // A field the reader normalizes to an empty list on the node and leaves
  // absent inside the fence -- which it does for every list key a fence does
  // not mention -- is the same field either way, and both print as "none".
  // Reporting that as an edit showed the author six changes on a fence that
  // changed nothing.
  const empty = (v) => v === undefined || v === null || (Array.isArray(v) && v.length === 0);
  for (const key of EDIT_FM_KEYS) {
    const before = empty(node[key]) ? null : node[key];
    const after = empty(fm[key]) ? null : fm[key];
    if (stableJson(before) === stableJson(after)) continue;
    out.push({ field: key, before: flowYaml(before), after: flowYaml(after) });
  }
  return out;
}

const DIFF_TOKEN_CAP = 4000;

// A token is one run of non-whitespace plus the whitespace that followed
// it, normalized to a paragraph break or a single space, so the rendered
// diff keeps the text's paragraphs (the page sets `white-space: pre-wrap`
// on it) and reflows to the measure like every other body of prose on the
// page, whether or not the node's own file hard-wraps its lines. Only `t`
// is ever compared.
function diffTokens(text) {
  const out = [];
  const re = /(\S+)(\s*)/g;
  let m;
  const src = String(text == null ? "" : text);
  while ((m = re.exec(src)) !== null) {
    const ws = m[2] === "" ? "" : /\n[^\S\n]*\n/.test(m[2]) ? "\n\n" : " ";
    out.push({ t: m[1], ws });
  }
  return out;
}

// Longest common subsequence over two token lists, walked back into a flat
// op list. The table is filled from the end so the walk forward can be
// greedy, which keeps a run of insertions together rather than
// interleaving it with the deletions it replaces.
function lcsOps(a, b) {
  const n = a.length;
  const m = b.length;
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * w + j] = a[i].t === b[j].t
        ? dp[(i + 1) * w + (j + 1)] + 1
        : Math.max(dp[(i + 1) * w + j], dp[i * w + (j + 1)]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].t === b[j].t) { ops.push({ op: "same", tok: b[j] }); i += 1; j += 1; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + (j + 1)]) { ops.push({ op: "del", tok: a[i] }); i += 1; }
    else { ops.push({ op: "ins", tok: b[j] }); j += 1; }
  }
  while (i < n) { ops.push({ op: "del", tok: a[i] }); i += 1; }
  while (j < m) { ops.push({ op: "ins", tok: b[j] }); j += 1; }
  return ops;
}

/**
 * A word-level diff of two section texts as a flat op list: `same` tokens
 * from the new text, `del` tokens from the old, `ins` tokens from the new.
 * The shared head and tail are matched off first, so the quadratic table
 * only ever covers what actually moved.
 *
 * Returns `null` -- the caller's cue to print the "too long to diff"
 * fallback -- when either side is longer than `cap` tokens, the one bound
 * on a table that is otherwise the product of the two lengths.
 *
 * @param {string|null} before
 * @param {string|null} after
 * @param {number} [cap]
 * @returns {{op: "same"|"del"|"ins", tok: {t: string, ws: string}}[]|null}
 */
export function wordDiff(before, after, cap = DIFF_TOKEN_CAP) {
  const a = diffTokens(before);
  const b = diffTokens(after);
  if (a.length > cap || b.length > cap) return null;
  let head = 0;
  while (head < a.length && head < b.length && a[head].t === b[head].t) head += 1;
  let tail = 0;
  while (
    tail < a.length - head
    && tail < b.length - head
    && a[a.length - 1 - tail].t === b[b.length - 1 - tail].t
  ) tail += 1;
  const ops = b.slice(0, head).map((tok) => ({ op: "same", tok }));
  ops.push(...lcsOps(a.slice(head, a.length - tail), b.slice(head, b.length - tail)));
  ops.push(...b.slice(b.length - tail).map((tok) => ({ op: "same", tok })));
  return ops;
}

// Consecutive ops of one kind become one <ins>/<del>; the run's own
// trailing whitespace is emitted outside the tag, so a struck-through or
// underlined run never swallows the space or newline after it.
function diffHtml(ops) {
  let html = "";
  let i = 0;
  while (i < ops.length) {
    const kind = ops[i].op;
    const run = [];
    while (i < ops.length && ops[i].op === kind) { run.push(ops[i].tok); i += 1; }
    const inner = run.map((tok, k) => alignEsc(tok.t) + (k < run.length - 1 ? tok.ws : "")).join("");
    const trailing = run[run.length - 1].ws;
    if (kind === "same") html += inner + trailing;
    else if (kind === "ins") html += `<ins>${inner}</ins>${trailing}`;
    else html += `<del>${inner}</del>${trailing}`;
  }
  return html;
}

function renderSectionDiff(label, before, after) {
  if (!(before || "").trim() && !(after || "").trim()) return "";
  const ops = wordDiff(before, after);
  const body = ops === null
    ? '<p class="none">Too long to diff: read the draft above against the node as it stands.</p>'
    : `<div class="diff">${diffHtml(ops)}</div>`;
  return `<p class="difflbl">${alignEsc(label)}</p>${body}`;
}

/* --------------------------------------------- the options ---------- */

/**
 * The divergence inversion for one option `optionName` of node `n`: every
 * other node's `depends` entry that names `n` is, on the leaf, a decision
 * the leaf stands under; here, on the ancestor, it is inverted into what a
 * ruling for this option would do. `keeps` is every node whose `depends`
 * entry names `n` under exactly this option -- a ruling for it leaves that
 * leaf's ground as recorded; `discards` is every node whose `depends` entry
 * names `n` under some other named option -- a ruling for this one
 * contradicts what that leaf stood under. Neither list ever includes a
 * plain, unqualified `depends` entry (an open question waiting on `n`'s
 * ruling generally, not a stand taken under one particular option). Both
 * sorted ascending; this is derived fresh from the graph each time, never
 * stored on the record.
 *
 * @param {{id: string}} n
 * @param {string} optionName
 * @param {object[]} allNodes - the full node list, `graph.nodes`.
 * @returns {{keeps: string[], discards: string[]}}
 */
function divergenceFor(n, optionName, allNodes) {
  const keeps = [];
  const discards = [];
  for (const other of allNodes) {
    for (const d of other.depends || []) {
      if (d.id !== n.id || d.option == null) continue;
      if (d.option === optionName) keeps.push(other.id);
      else discards.push(other.id);
    }
  }
  return { keeps: keeps.sort(), discards: discards.sort() };
}

// The one extra paragraph a divergence adds to an option's block (see
// renderDecision): what a ruling for this option keeps of the leaves
// standing under it, and, unless there are none, what it discards of the
// leaves standing under a different option of the same node.
function renderDivergenceParagraph(keeps, discards) {
  if (keeps.length === 0) {
    return `<p class="divergence">${alignEsc("A ruling for this keeps nothing recorded.")}</p>`;
  }
  let html = `<p class="divergence">A ruling for this keeps: <em>${keeps.map(alignEsc).join(", ")}</em>.`;
  if (discards.length > 0) {
    html += ` It discards: <em>${discards.map(alignEsc).join(", ")}</em>.`;
  }
  return `${html}</p>`;
}

/* ------------------------- the node's readiness ----------------------- */

// The stages at which the two readings are owed: a draft is judged once it
// is drafted, and the frontier once the node stands on it (the reader's
// SURVEY_STAGES; kept here so the page derives the same answer from a node's
// own fields).
const JUDGED_STAGES = new Set(["review", "ruling"]);

/* The readiness the ruling waits on, on the stage chip and nowhere else. The
 * review keeps no section of its own: everything a section showed -- the
 * verdict, the dates, the two pins and whether the node can be ruled -- is the
 * node's own state and not any fact's, and the chip is the node's one status
 * object, beside the two controls that move it. What the review found, its
 * counter-argument, is about one option and rides that option's row
 * (commons.systems/disposition-graph/alignment-page).
 *
 * The two readings are the ones `clean-context-review` divides into: the
 * review of this one draft, and the survey of the whole frontier. Each says
 * when it read and whether the recommendation has moved since. */
function renderReadiness(n) {
  const review = n.review || null;
  const drafted = !!(review && review.verdict);
  const survey = review ? review.survey : null;

  let pills = drafted
    ? `<span class="pill rev-${alignEsc(review.verdict)}">this draft: ${alignEsc(review.verdict === "forward" ? "forwarded" : "kicked back")} ${alignEsc(review.date)}</span>`
      + (n.reviewStale ? '<span class="pill rev-stale">moved since its review</span>' : "")
    : '<span class="pill rev-none">this draft: not yet reviewed</span>';

  pills += survey
    ? `<span class="pill rev-date">the frontier: surveyed ${alignEsc(survey.date)}</span>`
      + (n.surveyStale ? '<span class="pill rev-stale">moved since its survey</span>' : "")
    : '<span class="pill rev-none">the frontier: not yet surveyed</span>';

  const reviewOwed = JUDGED_STAGES.has(n.stage) && (!drafted || n.reviewStale);
  if (n.readyToRule) {
    pills += '<span class="pill rev-forward">ready to rule</span>';
  } else {
    if (reviewOwed) pills += '<span class="pill rev-stale">the review of this draft is owed</span>';
    if (n.surveyOwed) pills += '<span class="pill rev-stale">the survey of the frontier is owed</span>';
  }
  // The count of open probes and nothing else: no probe's `asks`, `why` or
  // `discharges`, and no `id`, reach this page -- the maieutic session is
  // where they are asked (commons.systems/disposition-graph/dialogue).
  const openProbes = countOpenProbes(n);
  if (openProbes > 0) {
    pills += `<span class="pill rev-stale">${openProbes} probe${openProbes === 1 ? "" : "s"} open</span>`;
  }
  return `<span class="readiness">${pills}</span>`;
}

/* --------------------------- the ruling screen ------------------------
 *
 * commons.systems/disposition-graph/alignment-page: one node at a time, on
 * a three-column screen, in the ruling order. The rail carries the metrics
 * and every unanswered node. The middle column carries everything the ruling
 * asks: the question and the id, one eyebrow line, the stage chip with its
 * two controls and the node's readiness, the stage's own ask, then every fact
 * the node carries with every option under it and the kick-back last, then
 * what a ruling here makes decidable and the author's words and the AI's
 * account as drill-downs. The right-hand column carries the rendered
 * disposition and nothing else (the author's refinement of 2026-09-04).
 */

// The browser's published address, read out of the record rather than
// written here: the shim that names it is declared on
// commons.systems/disposition-graph/projection. A metric links to the
// disposition it instruments at that address, since this page addresses no
// node of its own. Null when no shim names it, and then a metric renders
// unlinked rather than pointing nowhere.
function browserAddress(graph) {
  for (const n of graph.nodes || []) {
    for (const s of n.shims || []) {
      const text = String(s.artifact || "");
      if (!/browser/i.test(text)) continue;
      const m = text.match(/https:\/\/\S*?artifact\/[0-9a-f-]+/i);
      if (m) return m[0];
    }
  }
  return null;
}

/* ------------------------- the session, launched or copied ------------- */

/* The instruction that opens the dialogue on one node. One function, because
 * the launch link and the copy control must carry the same text: two controls
 * that claim to do the same thing and emit different text is the defect this
 * exists to prevent (commons.systems/disposition-graph/ruling-transport). */
function alignInstruction(nodeId) {
  return `/align ${nodeId}`;
}

const SESSION_BASE = "https://claude.ai/code";

/* The repository a launched session opens against, read out of the shim that
 * declares the launch control rather than written here -- the same way the
 * browser's address is read from its own shim. `/align` is a project skill
 * the harness finds only in this checkout, so a link that pre-fills the
 * prompt and selects no repository opens a session without the skill.
 * Null when no shim names one, and then the link carries the prompt alone. */
function sessionRepo(graph) {
  for (const n of graph.nodes || []) {
    for (const s of n.shims || []) {
      const m = String(s.artifact || "").match(/repositories=([A-Za-z0-9._-]+\/[A-Za-z0-9._-]+)/);
      if (m) return m[1];
    }
  }
  return null;
}

/* `prompt` and `repositories` are supported query parameters of
 * https://claude.ai/code (code.claude.com/docs/en/web-quickstart). The link
 * pre-fills the form and does not submit it, and the page says so rather
 * than implying a click is the whole action.
 *
 * The base carries everything but the prompt, and the page's own launch link
 * carries it as an attribute: that link's instruction grows with every
 * response staged, so the script rebuilds the address from the same base
 * rather than keeping a second copy of its shape
 * (commons.systems/disposition-graph/ruling-transport: the copy control and
 * the launch link emit one and the same instruction). */
function seedBase(repo) {
  return repo === null || repo === undefined
    ? SESSION_BASE
    : `${SESSION_BASE}?repositories=${encodeURIComponent(repo)}`;
}

function sessionSeed(instruction, repo) {
  const base = seedBase(repo);
  return `${base}${base.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(instruction)}`;
}

const SITTING_COPY_TITLE = "Copy the instruction that carries every response into a session by hand. This is the route the author uses.";
const SITTING_LAUNCH_TITLE = "Open a session on the same instruction the copy control emits, carrying every staged response. A stub: the link pre-fills the form and does not submit it, and Claude Code on the web is a research preview that needs a signed-in account.";
const SITTING_RECORD_TITLE = "Write every staged response into this artifact's own record, where a session reads them back without a paste. A buffer and never the record: nothing ruled here exists only there.";
const LAUNCH_TITLE = "Open an alignment session on this node. A stub: the link pre-fills the form and does not submit it, and Claude Code on the web is a research preview that needs a signed-in account.";
const COPY_TITLE = "Copy the instruction that opens the dialogue on this node.";
const LAUNCH_GLYPH = "\u2197";
const COPY_GLYPH = "\u29C9";

/* The stage as a chip carrying the two routes into the dialogue: a link that
 * opens a session on this node, and a copy of the instruction that starts
 * one. At every stage but `ruling` these are what the page offers instead of
 * a control, since a confirmation recorded before the ruling stage is invalid
 * (the author's ruling of 2026-09-04). */
function renderStageChip(n, repo) {
  const instruction = alignInstruction(n.id);
  const href = sessionSeed(instruction, repo);
  return `<span class="chip stage-${alignEsc(n.stage)}">`
    + `<span class="chipname">${alignEsc(n.stage)}</span>`
    + `<a class="chipbtn stub" href="${alignEsc(href)}" target="_blank" rel="noopener"`
    + ` title="${alignEsc(LAUNCH_TITLE)}" aria-label="Open an alignment session on this node (a stub)">${LAUNCH_GLYPH}</a>`
    + `<button type="button" class="chipbtn" data-copy="${alignEsc(instruction)}"`
    + ` title="${alignEsc(COPY_TITLE)}" aria-label="Copy the instruction for this node">${COPY_GLYPH}</button>`
    + "</span>";
}

/* The five metrics. A metric on this page is a signal, an instrument or a
 * criterion of a recorded disposition and never a count for its own sake:
 * `of` names the disposition it instruments and the rail links to it. The
 * stage counts, the per-graph lines and the lede went by that standard --
 * a stage count instruments no disposition
 * (commons.systems/disposition-graph/alignment-page). */
function alignmentMetrics(items) {
  const first = items[0] || null;
  return [
    {
      key: "open",
      value: items.length,
      of: "commons.systems/disposition-graph/unanswered",
      why: "Nodes the author has not confirmed. Every node is unanswered until they do, so this is the outstanding authority.",
    },
    {
      key: "ruleable",
      value: items.filter((n) => n.readyToRule).length,
      of: "commons.systems/disposition-graph/clean-context-review",
      why: "Nodes with both readings behind them: a forward review pinned to the recommendation as it stands, and a survey pin on the same. That is what can be ruled now, and the ruling stage alone stopped being it once the review divided in two.",
    },
    {
      key: "next settles",
      value: first && typeof first.settles === "number" ? first.settles : 0,
      of: "commons.systems/disposition-graph/alignment-order",
      why: "What a ruling on the first node in the order would make decidable. The order's recommended answer puts the ruling that settles the most first, so this is what one ruling buys.",
    },
    {
      key: "stale",
      value: items.filter((n) => n.moved || n.reviewStale || n.surveyStale).length,
      of: "commons.systems/disposition-graph/frontier-consistency",
      why: "Nodes on which either reading's pin, or a ruling's, no longer matches the text it read. This is how much of what looks ruleable rests on a reading of text that has since moved.",
    },
    {
      key: "survey owed",
      value: items.filter((n) => n.surveyOwed).length,
      of: "commons.systems/disposition-graph/clean-context-review",
      why: "Nodes at the review or ruling stage that no survey has pinned, or whose survey pin is stale. This is what the survey must read before any of it can be ruled.",
    },
  ];
}

/* A metric addresses the node it instruments by id, at the browser's own
 * address, since this page has no route to a node. A node the browser does
 * not render -- one with no answer yet -- is named by its id and not linked,
 * and the metric says so, rather than pointing the author at a page that
 * will not show them the disposition the number is about. */
function renderMetrics(items, ctx) {
  const cells = alignmentMetrics(items).map((m) => {
    const inner = `<dt>${alignEsc(m.key)}</dt><dd class="num">${alignEsc(m.value)}</dd>`;
    const target = ctx.byId.get(m.of) || null;
    const rendered = !!(target && typeof target.answer === "string" && target.answer.length > 0);
    if (ctx.browser === null || !rendered) {
      const because = ctx.browser === null
        ? `Instruments ${m.of}; no shim names the browser's address, so there is nothing to link to.`
        : `Instruments ${m.of}, which the browser does not render: it has no answer yet.`;
      return `<div class="metric" title="${alignEsc(`${m.why} ${because}`)}">${inner}`
        + `<span class="metric-of mono">${alignEsc(m.of)}</span></div>`;
    }
    return `<a class="metric" href="${alignEsc(ctx.browser)}#${alignEsc(m.of)}" target="_blank" rel="noopener"`
      + ` title="${alignEsc(`${m.why} Instruments ${m.of}.`)}">${inner}</a>`;
  }).join("");
  return `<dl class="metrics">${cells}</dl>`;
}

/* ------------------------- the facts this ruling asks ------------------ */

const definerCache = new WeakMap();

/* Which node defines a term, whether or not the definition carries a gloss.
 * `glossary` holds the glossed terms alone, and a fact whose name is defined
 * without one still has a question to be labelled by, so the label's fallback
 * reads the definitions themselves. */
function definerIndex(nodes) {
  if (definerCache.has(nodes)) return definerCache.get(nodes);
  const out = new Map();
  for (const n of nodes) {
    for (const term of defineTerms(n)) {
      const key = term.toLowerCase();
      if (!out.has(key)) out.set(key, n.id);
    }
  }
  definerCache.set(nodes, out);
  return out;
}

/* A fact's label is the question it asks: the node's own question for its
 * answer, and for a reserved fact the gloss of the fact's own name where the
 * record carries one, the question of the node that defines the term where it
 * does not, and the bare name where nothing does. Under `aspects-are-nodes`
 * every decision is a question, and a decision labelled with its category
 * tells the author nothing about what is being asked -- which is the second
 * thing the author could not read on commons.systems/public/agency. */
function factLabel(ctx, n, fact) {
  if (fact.name === "answer") return n.question || fact.name;
  const glossed = glossary(ctx.nodes).get(fact.name);
  if (glossed) return glossed.gloss;
  const definer = definerIndex(ctx.nodes).get(fact.name.toLowerCase());
  const node = definer ? ctx.byId.get(definer) : null;
  return (node && node.question) || fact.name;
}

/* The options of a fact in the order a row reads them: the fact's own order,
 * with the confirmed choice first where there is one -- what the answer fact
 * stands on, or the option the author ruled for on any other, as the dialogue
 * node has every projection show it. */
function orderedOptions(fact) {
  const first = fact.stands || fact.ruled || null;
  if (!first) return fact.options;
  return [...fact.options].sort((a, b) => (a.name === first ? -1 : b.name === first ? 1 : 0));
}

/* Where an option came from, in one phrase read off the record: "from the
 * author, 2026-09-04", "from the AI", "from the review, 2026-09-03", or the
 * id of the node whose sitting recorded it. */
function sourcePhrase(option) {
  if (!option.source) return null;
  const who = SOURCE_WORDS[option.source] || option.source;
  return option.ref ? `from ${who}, ${option.ref}` : `from ${who}`;
}

/* The strongest case against the recommended option, in one line on its row.
 * It is written by the AI when the recommendation is recorded, as the
 * evaluation node's adversarial review of one's own output, and the
 * clean-context review's counter-argument replaces it, at the strength the
 * review gave it, once the review has returned one. Null where neither
 * exists, and the row then says so: a recommendation that goes alone says
 * that it does (commons.systems/disposition-graph/recording). */
function caseAgainst(n, fact) {
  const review = n.review || null;
  if (fact.name === "answer" && review && review.against) {
    return { text: review.against, from: `the review, ${review.date}`, strength: review.strength };
  }
  if (fact.against) return { text: fact.against, from: "the AI", strength: null };
  return null;
}

/* The author's words a `## Disposition` section holds, entry by entry: each
 * begins at the line naming the author and the date and runs to the next such
 * line, so a quotation stays with the sentence that introduces it. */
const AUTHOR_ENTRY_RE = /^\s*(?:\*\*)?the author\b[^\n]*?(\d{4}-\d{2}-\d{2})/i;

function authorEntries(src) {
  const out = [];
  for (const block of String(src || "").split(/\n\s*\n/)) {
    if (block.trim() === "") continue;
    const m = AUTHOR_ENTRY_RE.exec(block);
    if (m || out.length === 0) out.push({ date: m ? m[1] : null, blocks: [block] });
    else out[out.length - 1].blocks.push(block);
  }
  return out;
}

/* The author's words an option rests on, for an option the author sourced:
 * the entries of the node's `## Disposition` dated as the option's `ref`,
 * where they can be found, and the whole section where they cannot. */
function authorWordsFor(n, ref) {
  if (!n.disposition) return null;
  const entries = authorEntries(n.disposition);
  const dated = ref ? entries.filter((e) => e.date === ref) : [];
  if (dated.length === 0) return { text: n.disposition, whole: true };
  return { text: dated.map((e) => e.blocks.join("\n\n")).join("\n\n"), whole: entries.length === dated.length };
}

/* The handle a reading goes by on a row: the slug of its id, the id itself
 * staying on the link's title, because the relation is read at a glance and
 * the address is read once. */
function readingName(id) {
  const parts = String(id).split("/");
  return parts[parts.length - 1] || String(id);
}

/* What the traditions say about one option, on the option's row: a reading
 * bears on an option and not on the node, so a tradition can support one
 * option and contradict another on the same fact, and "chosen over" is a
 * reading adopted on an option the author did not choose and is never stored
 * as such (commons.systems/disposition-graph/viable-options). Where no reading
 * bears, the row carries nothing rather than an empty mark: the evaluation
 * node has every tradition the second pass surfaces recorded as a reading, so
 * a row with none is a row on which none was surfaced. */
function renderReadingChips(ctx, readings) {
  return (readings || []).map((r) => {
    const says = r.relation === "diverged" ? "departs" : "supports";
    const text = `${readingName(r.id)}: ${says}`;
    const target = ctx.byId.get(r.id) || null;
    const rendered = !!(target && typeof target.answer === "string" && target.answer.length > 0);
    return ctx.browser !== null && rendered
      ? `<a class="pill alt-reading ${alignEsc(r.relation)}" href="${alignEsc(ctx.browser)}#${alignEsc(r.id)}"`
        + ` target="_blank" rel="noopener" title="${alignEsc(r.id)}">${alignEsc(text)}</a>`
      : `<span class="pill alt-reading ${alignEsc(r.relation)}" title="${alignEsc(r.id)}">${alignEsc(text)}</span>`;
  }).join("");
}

// Each reading's own account of why the tradition supports the option or is
// departed from: the first sentences of its answer, in the drill-down, linked
// where the browser renders it.
function renderReadingAccounts(ctx, readings) {
  const items = (readings || []).map((r) => {
    const target = ctx.byId.get(r.id) || null;
    const answer = target && typeof target.answer === "string" ? target.answer : "";
    const name = ctx.browser !== null && answer
      ? `<a href="${alignEsc(ctx.browser)}#${alignEsc(r.id)}" target="_blank" rel="noopener">${alignEsc(readingName(r.id))}</a>`
      : `<span class="mono">${alignEsc(readingName(r.id))}</span>`;
    const says = answer
      ? alignInline(firstSentences(answer))
      : alignEsc("The reading records no account yet.");
    return `<li>${name} <span class="badge ${alignEsc(r.relation)}">${alignEsc(r.relation)}</span> ${says}</li>`;
  }).join("");
  return items === "" ? "" : `<ul class="readacct">${items}</ul>`;
}

/* One option, leading with what it would answer. The option's name is how a
 * ruling is filed in the record; the sentence is the decision, and it is read
 * from `optionText`, the one home of it: the `#### <option>` subsection, the
 * `## Answer` for the option that stands, and the gloss on the defining node
 * for a vocabulary fact's options. Rendering the name and folding the sentence
 * into the drill-down left the author a list of identifiers, which is what
 * they reported reading on public/agency; it is progressive disclosure on the
 * wrong axis. Where the record holds no sentence yet the row shows the bare
 * name, because a sentence the page kept in its own text would be a rule no
 * node projects.
 *
 * The first level carries the sentence, the status the record holds, what each
 * reading bearing on it says, and -- on the recommended row alone -- the case
 * against. Everything else is one step down, with the control for the author's
 * reason and their edits (commons.systems/disposition-graph/alignment-page,
 * commons.systems/disposition-graph/progressive-disclosure). */
function renderOption(ctx, n, fact, o, doc, locked) {
  const recommended = fact.recommends === o.name;
  const stands = fact.name === "answer" && fact.stands === o.name;
  const said = optionText(ctx.nodes, n, fact, o);
  const lead = said
    ? `<span class="choicesays">${alignInline(firstSentences(said.text))}</span>`
      + `<span class="choicename mono handle">${alignEsc(o.name)}</span>`
    : `<span class="choicename">${alignEsc(o.name)}</span>`;

  const source = sourcePhrase(o);
  let pills = source ? `<span class="pill alt-src">${alignEsc(source)}</span>` : "";
  if (recommended) {
    pills += `<span class="pill alt-adopted">recommended${fact.boldness ? `, ${alignEsc(fact.boldness)} boldness` : ""}</span>`;
  }
  if (stands) {
    pills += `<span class="pill alt-stands">stands: ${alignEsc(STANDING_LABELS[standingState(n)] || "")}</span>`;
  }
  if (o.ruling) {
    pills += `<span class="pill alt-ruled">ruled: ${alignEsc(o.ruling.response)}, ${alignEsc(o.ruling.date)}</span>`;
  }
  if (o.status === "passed") {
    pills += `<span class="pill alt-passed">passed over${o.reason ? `: ${alignEsc(o.reason)}` : ""}</span>`;
  }
  pills += renderReadingChips(ctx, o.readings);

  // The case against, on the recommended row and on no other, at the first
  // level: the row is where the dialectic has to happen, and a case against
  // that is folded is a case the author never reads before choosing.
  let against = "";
  if (recommended) {
    const c = caseAgainst(n, fact);
    against = c === null
      ? `<p class="against none">${alignEsc(NO_CASE_AGAINST)}</p>`
      : `<p class="against"><span class="againstlbl">${alignEsc(CASE_AGAINST_LBL)}</span> ${alignInline(c.text)}`
        + `<span class="pill rev-strength">${alignEsc(c.from)}${c.strength ? `, ${alignEsc(c.strength)}` : ""}</span></p>`;
  }

  const rest = said ? restOf(said.text) : "";
  const words = o.source === "author" ? authorWordsFor(n, o.ref) : null;
  const wouldStand = fact.name === "answer" && recommended && n.fence
    ? `<p class="drilllbl">The text as it would stand</p><div class="mdbody">${alignHtml(n.fence.sections.Answer)}</div>`
    : "";
  // The AI's reason for recommending this option is the fact's own '###'
  // prose. For every other option the reason is that option's `####` prose,
  // which the row already leads with and the rest of which is just above.
  const reason = recommended && fact.prose
    ? `<p class="drilllbl">Why the AI recommends it</p><div class="mdbody">${alignHtml(fact.prose)}</div>`
    : "";
  const div = fact.name === "answer" ? divergenceFor(n, o.name, ctx.nodes) : { keeps: [], discards: [] };
  const divergence = div.keeps.length > 0 || div.discards.length > 0
    ? renderDivergenceParagraph(div.keeps, div.discards)
    : "";
  const drill = '<details class="drill">'
    + `<summary>${alignEsc(OPTION_DRILL_LBL)}</summary>`
    + (rest ? `<div class="mdbody">${alignHtml(rest)}</div>` : "")
    + wouldStand
    + (words
      ? `<p class="drilllbl">The author's words it rests on</p><div class="mdbody">${alignHtml(words.text)}</div>`
        + (words.whole ? "" : '<p class="hint-sm">The rest of the author’s words on this node are below.</p>')
      : "")
    + reason
    + renderReadingAccounts(ctx, o.readings)
    + divergence
    + `<label class="note-lbl" for="note-${alignEsc(doc)}-${alignEsc(fact.name)}-${alignEsc(o.name)}">${alignEsc(OPTION_NOTE_PLACEHOLDER)}</label>`
    + `<textarea class="note opt-note" id="note-${alignEsc(doc)}-${alignEsc(fact.name)}-${alignEsc(o.name)}"`
    + ` data-option-text="${alignEsc(o.name)}" rows="2"${locked ? " disabled" : ""}></textarea>`
    + "</details>";

  return `<li class="choice${recommended ? " adopted" : ""}${o.ruling ? " ruled" : ""}${o.status === "passed" ? " passed" : ""}">`
    + `<label class="choicelbl"><input type="radio" name="fact:${alignEsc(doc)}:${alignEsc(fact.name)}"`
    + ` value="${alignEsc(o.name)}" data-option="${alignEsc(o.name)}"${locked ? " disabled" : ""}>${lead}</label>`
    + (pills === "" ? "" : `<p class="pills optpills">${pills}</p>`)
    + `${against}${drill}</li>`;
}

/* The last row on every fact, and it is not an option: it says that none of
 * these is acceptable, records no ruling, and returns the node to the maieutic
 * movement, where the options are drawn again from what the author writes. It
 * stays in the radio group, because a refusal reached by a different control
 * is a refusal the author has to look for, and it is set apart and captioned
 * with what it does to the node rather than with the summary of an option it
 * is not. Its feedback opens with the row and never in a drill-down: the words
 * are what a kick-back consists of and what the dialogue resumes from, where
 * on an option they are optional because the ruling's content is the option
 * (commons.systems/disposition-graph/recording, `denial-typed-to-maieutic`). */
function renderKickback(doc, fact, locked) {
  return '<li class="choice kickback">'
    + `<label class="choicelbl"><input type="radio" name="fact:${alignEsc(doc)}:${alignEsc(fact.name)}"`
    + ` value="${alignEsc(KICKBACK_VALUE)}" data-kickback${locked ? " disabled" : ""}>`
    + `<span class="choicename">${alignEsc(KICKBACK_CAPTION)}</span></label>`
    + `<p class="kbnote">${alignEsc(KICKBACK_NOTE)}</p>`
    + `<label class="note-lbl" for="kb-${alignEsc(doc)}-${alignEsc(fact.name)}">Your feedback</label>`
    + `<textarea class="note kb-note" id="kb-${alignEsc(doc)}-${alignEsc(fact.name)}" data-kickback-text rows="2"`
    + ` placeholder="${alignEsc(KICKBACK_PLACEHOLDER)}"${locked ? " disabled" : ""}></textarea>`
    + "</li>";
}

/* The lead of a choice's prose: enough to decide by, with the remainder
 * behind the drill-down. One paragraph, or as many whole sentences of it as
 * the cap allows, so that a row stays a row.
 *
 * The cap is set by measurement over the 212 alternative prose blocks in the
 * graph on 2026-09-04, counting how many leads it forces to break inside a
 * sentence rather than at the end of one: 200 breaks 59%, 260 breaks 32%,
 * 320 breaks 16%, 400 breaks 3%, 480 breaks 1%. 400 is the knee -- it ends
 * all but seven leads on a full stop, at a median lead of 320 characters,
 * about four lines of the middle column -- and past it the median grows
 * without buying much. A row that breaks mid-sentence makes the author open
 * the drill-down to finish the thought, which is the fold this answer
 * exists to undo. */
const CHOICE_LEAD_CHARS = 400;
function firstSentences(prose) {
  const para = prose.trim().split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  if (para.length <= CHOICE_LEAD_CHARS) return para;
  const cut = para.slice(0, CHOICE_LEAD_CHARS);
  const at = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return at > 80 ? para.slice(0, at + 1) : `${cut.replace(/\s+\S*$/, "")}\u2026`;
}
// What the drill-down holds: the paragraphs the lead did not take. Where the
// lead is the whole first paragraph that is every paragraph after it; where
// the lead was cut short of it, the drill repeats from the start, so that
// nothing the record says about a choice is only ever shown truncated.
function restOf(prose) {
  const trimmed = prose.trim();
  const paras = trimmed.split(/\n\s*\n/);
  const firstWhole = paras[0].replace(/\s+/g, " ").trim();
  if (firstSentences(trimmed) !== firstWhole) return trimmed;
  return paras.slice(1).join("\n\n");
}

/* One fact, labelled with the question it asks, with every option under it
 * and the kick-back last. Boldness is shown on the recommendation and acts on
 * nothing: it is how much of the recommendation rests on the AI's own
 * knowledge against the record, so high boldness is low confidence, and it is
 * what the author reads to know how far to trust the mark beside an option,
 * never what the page reads to decide whether to show one. A fact with no
 * recommendation says so and marks no row, rather than rendering an unmarked
 * list that reads as a recommendation withheld. */
function renderFact(ctx, n, fact, doc, locked) {
  const rows = orderedOptions(fact).map((o) => renderOption(ctx, n, fact, o, doc, locked)).join("");
  const ruledOpt = fact.ruled ? fact.options.find((o) => o.name === fact.ruled) : null;
  const ruled = ruledOpt
    ? `<p class="ruled">Ruled ${alignEsc(ruledOpt.ruling.response)} on <span class="mono">${alignEsc(fact.ruled)}</span>, ${alignEsc(ruledOpt.ruling.date)}.`
      + (fact.moved ? " The recommendation has moved since." : "")
      + (ruledOpt.ruling.reason ? ` ${alignInline(ruledOpt.ruling.reason)}` : "")
      + "</p>"
    : "";
  const bold = fact.recommends && fact.boldness
    ? `<span class="pill rec-bold-${alignEsc(fact.boldness)}">${alignEsc(fact.boldness)} boldness</span>`
    : `<span class="pill rec-bold-none">${alignEsc(NO_RECOMMENDATION)}</span>`;
  return `<fieldset class="fact" data-fact="${alignEsc(fact.name)}">`
    + `<legend class="factlbl">${alignInline(factLabel(ctx, n, fact))}${bold}</legend>`
    + ruled
    + `<ul class="choices">${rows}${renderKickback(doc, fact, locked)}</ul>`
    + "</fieldset>";
}

/* Every fact the node carries and none folded, as the author ruled on
 * 2026-09-04: the list the page shows is the list the ruling asks, in full.
 * A node that carries no facts offers what its stage asks and nothing
 * invented -- such a node is at the periagogic or the maieutic stage, where no
 * candidate answer exists and no decision is owed yet, so the column says that
 * nothing is proposed rather than printing a sentence that is false there. */
function renderFacts(ctx, n, doc, locked) {
  const facts = n.facts || [];
  if (facts.length === 0) {
    return `<section class="facts"><p class="none">${alignEsc(NOTHING_PROPOSED)}</p></section>`;
  }
  return `<section class="facts"><p class="lbl">${alignEsc(FACTS_LBL)}</p>`
    + facts.map((f) => renderFact(ctx, n, f, doc, locked)).join("")
    + "</section>";
}

/* ------------------------- the asking column --------------------------- */

// The unanswered children of this node, and the open questions that name it
// in `depends`: indications of what a ruling here makes decidable, shown in
// the asking column and never as rows to rule from, since every node is
// ruled from the rail in its own turn in the one order.
function askIndications(n, allNodes) {
  const children = allNodes
    .filter((o) => o.stage && (o.under || []).includes(n.id))
    .map((o) => ({ id: o.id, question: o.question, how: "under it" }));
  const waiting = allNodes
    .filter((o) => o.stage && (o.depends || []).some((d) => d.id === n.id))
    .map((o) => ({
      id: o.id,
      question: o.question,
      how: (o.depends.find((d) => d.id === n.id).option
        ? `waits on ${o.depends.find((d) => d.id === n.id).option}`
        : "waits on this ruling"),
    }));
  const seen = new Set();
  const all = [...children, ...waiting].filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));
  if (all.length === 0) return "";
  const items = all.map((x) => (
    `<li><span class="indq">${alignEsc(x.question || x.id)}</span>`
    + `<span class="meta mono">${alignEsc(x.how)}</span>`
    + `<span class="indid mono">${alignEsc(x.id)}</span></li>`
  )).join("");
  return `<section class="indications"><p class="lbl">${alignEsc(INDICATIONS_LBL)} (${all.length})</p>`
    + `<p class="hint">${alignEsc(INDICATIONS_HINT)}</p><ul class="indlist">${items}</ul></section>`;
}

/* What the stage asks, which is the first thing the column says of the ruling
 * after the chip, because the stage names the movement owed and so what the
 * column is for. At the periagogic stage the ask is the author's own account
 * of the ground and the free-text control for it leads, with what they have
 * already said on this node open beside it; at the maieutic stage it is their
 * intention. The review stage takes no response and says so. The ruling stage
 * adds nothing: its ask is the facts themselves.
 *
 * Where the stage asks for the author's words and the node carries none, the
 * column says that in as many words rather than rendering an empty space,
 * because "nothing of yours is recorded here, and what the answer says the AI
 * drafted" is the fact those stages exist to change, and a blank says it to no
 * one (commons.systems/disposition-graph/alignment-page). */
function renderStageAsk(n, doc) {
  if (n.stage === "review") return `<p class="hint">${alignEsc(REVIEW_ASK)}</p>`;
  const ask = STAGE_ASK[n.stage];
  if (!ask) return "";
  const words = n.disposition
    ? `<details class="drill words" open><summary>The author's words on this node</summary>`
      + `<div class="mdbody">${alignHtml(n.disposition)}</div></details>`
    : `<p class="nowords">${alignEsc(NO_WORDS_LINE)}</p>`;
  return '<section class="stageask">'
    + `<p class="hint">${alignEsc(ask.hint)}</p>`
    + `<label class="note-lbl" for="words-${alignEsc(doc)}">${alignEsc(ask.lbl)}</label>`
    + `<textarea class="note words-note" id="words-${alignEsc(doc)}" data-words rows="4"`
    + ` placeholder="${alignEsc(ask.placeholder)}"></textarea>`
    + words
    + "</section>";
}

/* Everything the ruling asks, in the order the column is read
 * (commons.systems/disposition-graph/alignment-page, the author's refinements
 * of 2026-09-04): the stage chip with the node's readiness, the stage's own
 * ask, every fact with every option under it, then what a ruling here makes
 * decidable and the author's words and the AI's account as drill-downs. The
 * right-hand column holds the disposition and nothing else.
 */
function renderAsk(ctx, n, doc, bare) {
  // Only the ruling stage takes a response. A confirmation recorded on a node
  // that has not reached it is invalid, so everywhere else the facts, their
  // options and the recommendation are all rendered and every input among them
  // is disabled: the author sees exactly what will be asked and cannot yet
  // answer it (the author's ruling of 2026-09-04). The stage's own control is
  // not among them: it is what the earlier stages ask for.
  const locked = n.stage !== "ruling";
  const lead = `<p class="stagelead">${renderStageChip(n, ctx.repo)}${renderReadiness(n)}</p>`;
  // Nothing to render on the right: the item is one column and the line saying
  // so follows the ask, since half a screen of white reserved for a sentence
  // spends the reader's attention on something that is not the node.
  const nopane = bare ? `<p class="none nopane">${alignEsc(NO_ANSWER_LINE)}</p>` : "";
  // Nothing is locked on a node that carries no facts: what its stage asks
  // for is the control above, and there is nothing below to withhold.
  const gate = locked && (n.facts || []).length > 0
    ? `<p class="locked">${alignEsc(LOCKED_NOTE)}</p>`
    : "";
  const words = n.disposition && !EARLY_STAGES.has(n.stage)
    ? `<details class="drill words"><summary>The author's words</summary><div class="mdbody">${alignHtml(n.disposition)}</div></details>`
    : "";
  const account = n.account
    ? `<details class="drill"><summary>The AI's account</summary><div class="mdbody">${renderAccount(n.account)}</div></details>`
    : "";
  return lead
    + '<fieldset class="inputs" data-inputs>'
    + renderStageAsk(n, doc)
    + nopane
    + gate
    + renderFacts(ctx, n, doc, locked)
    + "</fieldset>"
    + '<p class="state" data-state hidden></p>'
    + askIndications(n, ctx.nodes)
    + words
    + account;
}

/* ------------------------- the node as it would stand ----------------- */

/* The disposition and nothing else. No control, no caption, no indication
 * and no drill-down shares this column: its one job is to show the author
 * the thing they are ruling on, and every sentence of apparatus in it is a
 * sentence to read past to reach that
 * (commons.systems/disposition-graph/alignment-page).
 *
 * Where an answer stands the column leads with the edit this ruling would
 * make and then the node it would leave; where none does it shows the whole.
 * "Stands" is measured by a ruling on the answer fact and never by a class:
 * a delegated or deferred class is a ruling about who decides, so a node
 * carrying one and a fence is a draft amending a draft and the diff is
 * still what the author needs to see.
 */
function renderPane(n) {
  const hasAnswer = typeof n.answer === "string" && n.answer.length > 0;
  let body;
  if (n.fence) {
    const d = n.fence;
    const whole = `<div class="mdbody">${alignHtml(d.sections.Answer)}${alignHtml(d.sections.Rationale)}</div>`;
    if (hasAnswer) {
      const fm = frontmatterEdits(n, d);
      const fmHtml = fm.length === 0
        ? '<p class="none">No frontmatter field changes.</p>'
        : `<ul class="fmdiff">${fm.map((e) => `<li><code>${alignEsc(e.field)}</code>: <span class="was">${alignEsc(e.before)}</span> <span class="arrow">&rarr;</span> <span class="now">${alignEsc(e.after)}</span></li>`).join("")}</ul>`;
      const diffs = renderSectionDiff("Answer", n.answer, d.sections.Answer)
        + renderSectionDiff("Rationale", n.rationale, d.sections.Rationale);
      // What the diff is against, said on the diff. The author's finding of
      // 2026-09-03 was that a node "still indicates that it is an edit to a
      // confirmed disposition (there appears to be a ground version that is
      // being diffed) even though no node is yet confirmed" -- raised on
      // commons.systems/disposition-graph/purpose, which has an answer, a
      // fence and no stamp at all. The diff itself is what the author needs
      // to see and stays; what was wrong was letting it imply its base had
      // standing.
      const base = standingState(n) === "ratified"
        ? "The edit, against the ratified answer"
        : "The edit, against a draft no one has confirmed";
      body = `<p class="lbl edit-lbl">${alignEsc(base)}</p><div class="edit">${fmHtml}${diffs}</div>`
        + `<p class="lbl edit-lbl">The node it would leave</p>${whole}`;
    } else {
      body = whole;
    }
  } else if (hasAnswer) {
    body = `<div class="mdbody">${alignHtml(n.answer)}${n.rationale ? alignHtml(n.rationale) : ""}</div>`;
  } else {
    // Neither an answer nor a recommended text: there is no disposition to
    // show, the item is one column, and the asking column says so.
    return "";
  }
  return '<aside class="col-pane">'
    + `<section class="stands"><p class="lbl">${alignEsc(PANE_LBL)}</p>${body}</section>`
    + "</aside>";
}

/* One line beneath the question and the id, saying what put the node where it
 * is: its settling count, which is what placed it in the order; the options
 * pending on it, which is what a sitting on it will cost; and the nodes it
 * stands under, whose grant a ruling here falls within and whose rulings made
 * this one decidable. Nothing else. The graph is already in the id above it,
 * the rank breaks ties in an order the rail already shows, and the class is
 * read off the rulings on the facts the column renders one by one beneath
 * (commons.systems/disposition-graph/alignment-page: a line no answer names
 * collects what no answer justifies, which is what had happened to it). */
function renderEyebrow(n) {
  const bits = [];
  if (typeof n.settles === "number") {
    const s = n.settledBy;
    bits.push(s
      ? `settles ${n.settles} (${s.under} under, ${s.depends} depends)`
      : `settles ${n.settles}`);
  }
  const pending = pendingOptions(n).length;
  if (pending > 0) bits.push(`${pending} option${pending === 1 ? "" : "s"} pending`);
  const under = n.under || [];
  bits.push(under.length ? `under ${under.join(", ")}` : "a root");
  return `<p class="eyebrow">${bits
    .map((b, i) => `<span class="meta mono${i === bits.length - 1 && under.length ? " parents" : ""}">${alignEsc(b)}</span>`)
    .join("")}</p>`;
}

function renderAlignmentItem(ctx, n) {
  const doc = alignDocId(n.id);

  // With no answer and no fence there is no disposition to render, so the
  // right-hand column is not held open and the item is one column.
  const bare = !(typeof n.answer === "string" && n.answer.length > 0) && !n.fence;
  let html = `<article class="item${bare ? " nostand" : ""}" id="item-${alignEsc(doc)}" data-item data-id="${alignEsc(n.id)}" data-doc="${alignEsc(doc)}" data-stage="${alignEsc(n.stage)}" hidden>`;
  html += '<div class="col-ask">';
  html += `<h2 class="iq">${alignEsc(n.question || n.id)}</h2>`;
  html += `<p class="idv mono">${alignEsc(n.id)}</p>`;
  html += renderEyebrow(n);
  html += renderAsk(ctx, n, doc, bare);
  html += "</div>";
  html += renderPane(n);
  html += "</article>";
  return html;
}

/**
 * Every node carrying a `stage`, in one flat ruling order across every
 * graph the manifest names: `settles` descending, then `rank` descending,
 * then id. The alignment frontier's dependencies cross graphs --
 * `commons.systems/public/agency` is the sole root and every
 * `disposition-graph` node hangs under it -- so a graph is a label on a
 * node here, never a precedence; ordering graph by graph would put a
 * descendant's ruling ahead of its own ancestor's, exactly what the ruling
 * order exists to prevent.
 *
 * A graph is a label on a rail row and nothing more: the per-graph `about`
 * text and counts the projector used to compute for the rail were read
 * nowhere, and the pagehead that had carried the `about` lines and the
 * per-stage counts liquidated without a disposition on the author's ruling of
 * 2026-09-03 (commons.systems/disposition-graph/alignment-page).
 *
 * @param {{nodes?: object[]}} graph
 * @returns {{items: object[]}}
 */
export function orderAlignmentItems(graph) {
  const items = (graph.nodes || []).filter((n) => n.stage).sort((a, b) => {
    const bs = b.settles ?? 0;
    const as = a.settles ?? 0;
    if (bs !== as) return bs - as;
    return b.rank !== a.rank ? b.rank - a.rank : (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
  return { items };
}

function alignmentPageHtml(graph, items) {
  const total = items.length;
  const ctx = {
    nodes: graph.nodes || [],
    byId: new Map((graph.nodes || []).map((n) => [n.id, n])),
    browser: browserAddress(graph),
    repo: sessionRepo(graph),
  };

  // The rail is the only view of the whole frontier once one node is shown
  // at a time, which is why the metrics sit at its top and why it lists
  // every node, filtering and paging nothing. A row carries the node's
  // question, its graph, its stage and its settling count -- not its place in
  // the order, which the order itself already shows.
  const railHtml = `<ol class="tree">${items.map((n) => {
    const doc = alignDocId(n.id);
    const settles = typeof n.settles === "number" ? n.settles : 0;
    return `<li><a href="#item-${alignEsc(doc)}" data-rail data-doc="${alignEsc(doc)}" aria-current="false">`
      + `<span class="dot stage-${alignEsc(n.stage)}" aria-hidden="true"></span>`
      + `<span class="rq">${alignEsc(n.question || n.id)}</span>`
      + `<span class="rmeta mono">${alignEsc(n.graph)} · ${alignEsc(n.stage)}`
      + ` · settles ${alignEsc(settles)}</span>`
      + '<span class="mark" data-mark></span></a></li>';
  }).join("")}</ol>`;

  const itemsHtml = items.map((n) => renderAlignmentItem(ctx, n)).join("");

  const emptyHtml = total === 0
    ? '<p class="empty">Nothing is unanswered. Every disposition has been confirmed by the author.</p>'
    : "";
  const refline = alignEsc([graph.module, graph.ref].filter(Boolean).join(" · "));

  return `<header class="mast">
  <div class="mast-in">
    <div class="brand">
      <span class="wordmark">Alignment</span>
      <span class="refline">${refline}</span>
      <span id="module-name" hidden>${alignEsc(graph.module || "")}</span>
    </div>
    <nav class="tools" aria-label="Actions">
      <button type="button" class="tbtn" id="btn-wide" aria-pressed="false">Widen the node</button>
      <button type="button" class="tbtn" id="btn-theme">Theme: auto</button>
    </nav>
  </div>
</header>
<div class="shell">
  <nav class="nav" id="nav" aria-label="The unanswered frontier, in the ruling order">
    ${renderMetrics(items, ctx)}
    <div id="tree">${railHtml}</div>
  </nav>
  <main id="main">
    <p class="notice" id="notice" hidden></p>
    ${itemsHtml}
    ${emptyHtml}
  </main>
</div>
<footer class="foot" id="foot">
  <div class="foot-in">
    <span class="foot-count" id="staged-count">0 responses staged</span>
    <span class="foot-note" id="foot-note"></span>
    <span class="foot-acts">
      <a class="sbtn stub" id="btn-launch" href="${alignEsc(sessionSeed("/align", ctx.repo))}" data-seed-base="${alignEsc(seedBase(ctx.repo))}" target="_blank" rel="noopener" title="${alignEsc(SITTING_LAUNCH_TITLE)}">${LAUNCH_GLYPH} Open a session</a>
      <button type="button" class="sbtn" id="btn-copy" title="${alignEsc(SITTING_COPY_TITLE)}">Copy the instruction</button>
      <button type="button" class="sbtn" id="btn-submit" disabled title="${alignEsc(SITTING_RECORD_TITLE)}">Record 0 for a session</button>
    </span>
  </div>
</footer>`;
}

/**
 * Render every node carrying a `stage` into
 * `packages/disposition/alignment-template.html`: the open dialogue the
 * author rules on, one flat page, in one ruling order across every graph
 * (see `orderAlignmentItems`). See the section comment above for why this
 * renders to HTML in Node rather than inlining JSON for a client-side
 * router, unlike `build()`.
 *
 * @param {string} template
 * @param {{module?: string, ref?: string|null, graphs?: object, nodes: object[]}} graph
 * @returns {string}
 */
export function buildAlignment(template, graph) {
  if (!template.includes(ALIGNMENT_MARKER)) throw new Error(`template has no ${ALIGNMENT_MARKER} marker`);
  const { items } = orderAlignmentItems(graph);
  const block = alignmentPageHtml(graph, items);
  return template.replace(ALIGNMENT_MARKER, () => block);
}

// Builds the browser page only when opts.out is given -- --rules and
// --ancestry are independent outputs that do not need it (see writeRules,
// writeAncestry), and check() only makes sense against the page's contract.
// check() runs against the full graph; excludeUnaligned() is applied only to
// what build() actually receives (see excludeUnaligned's own doc comment).
export async function project(opts) {
  const graph = await loadGraph(opts);
  if (!opts.out) return { out: null, html: null, graph, warnings: [] };
  const warnings = check(graph);
  const template = await readFile(resolve(HERE, "browser-template.html"), "utf8");
  const html = build(template, excludeUnaligned(graph));
  const out = resolve(opts.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
  return { out, html, graph, warnings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const opts = parseArgs(process.argv.slice(2));
  await runCli(opts);
}

// `readGraph` either returns a fully valid graph or throws with every
// problem it found and no partial data at all -- there is no "graph, plus
// a list of what's wrong with it" to render around. Rendering the frontier
// or the browser anyway on a graph that fails validation would need that
// contract to change everywhere `readGraph` is read from (validate.mjs,
// every output here, every test), which is a larger change than this
// unit's dialogue rules; the CLI's obligation ends at reporting that it
// cannot, cleanly, in the reader's own per-line message style, rather than
// an uncaught exception's raw stack trace.
async function runCli(opts) {
  let out, html, graph, warnings;
  try {
    ({ out, html, graph, warnings } = await project(opts));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
    return;
  }

  if (opts.rules) {
    const result = await writeRules(graph, opts.rules);
    for (const f of result.written) process.stdout.write(`wrote ${f}\n`);
    for (const f of result.deleted) process.stdout.write(`deleted ${f}\n`);
  }

  if (opts.ancestry) {
    const result = await writeAncestry(graph, opts.ancestry, opts.local);
    process.stdout.write(`wrote ${result.file}\n`);
  }

  if (opts.frontier) {
    const listing = renderFrontier(graph);
    if (opts.frontier === "-") {
      process.stdout.write(listing);
    } else {
      const filePath = resolve(opts.frontier);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, listing);
      process.stdout.write(`wrote ${filePath}\n`);
    }
  }

  if (opts.alignment) {
    const alignmentTemplate = await readFile(resolve(HERE, "alignment-template.html"), "utf8");
    const alignmentHtml = buildAlignment(alignmentTemplate, graph);
    if (opts.alignment === "-") {
      process.stdout.write(alignmentHtml);
    } else {
      const filePath = resolve(opts.alignment);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, alignmentHtml);
      process.stdout.write(`wrote ${filePath} (${Buffer.byteLength(alignmentHtml)} bytes)\n`);
    }
  }

  if (out) {
    for (const w of warnings) process.stderr.write(`contract: ${w}\n`);
    process.stdout.write(
      `${graph.nodes.length} nodes, ${Object.keys(graph.graphs).length} graphs -> ${out} (${Buffer.byteLength(html)} bytes)\n`
    );
  }

  if (!out && !opts.rules && !opts.ancestry && !opts.frontier && !opts.alignment) {
    process.stderr.write("nothing to do: pass --out, --rules, --ancestry (with --local), --frontier, or --alignment\n");
    process.exitCode = 1;
  }
}
