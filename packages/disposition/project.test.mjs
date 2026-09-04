// node --test packages/disposition/project.test.mjs
//
// Two things are checked here: that the projector inlines a graph the page can
// read back, and that the page's own renderer (extracted from the template and
// run without a DOM) turns markdown into the HTML the layout expects.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, mkdir, cp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { build, project, writeRules, writeAncestry, excludeUnaligned, renderFrontier, buildAlignment, orderAlignmentItems, frontmatterEdits, wordDiff } from "./project.mjs";
import { readGraph } from "./read.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = await readFile(resolve(HERE, "browser-template.html"), "utf8");
const ALIGNMENT_TEMPLATE = await readFile(resolve(HERE, "alignment-template.html"), "utf8");
const FIXTURE = JSON.parse(await readFile(resolve(HERE, "fixtures/browser/nodes.json"), "utf8"));
const VALID_GRAPH = await readGraph(resolve(HERE, "fixtures/valid"));

// os.tmpdir() may be unset in this sandbox; when a job scratch dir is
// available, prefer it over an empty os.tmpdir() (mirrors read.test.mjs).
function tmpBase() {
  const jobDir = process.env.CLAUDE_JOB_DIR;
  return jobDir ? join(jobDir, "tmp") : os.tmpdir();
}
const tmpDirs = [];
async function freshTmpDir(prefix) {
  const dir = await mkdtemp(join(tmpBase(), prefix));
  tmpDirs.push(dir);
  return dir;
}
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

// Mirrors project.mjs's private settlesBreakdown: the counted terms
// (under, depends) first, then -- only when the node's answer fact carries
// at least one option -- a semicolon clause naming the option count
// "uncounted", since a node's own options are not summed into `settles`
// (deriveSettles).
function settlesBreakdown(node) {
  const s = node.settledBy;
  const opts = s.options > 0 ? `; ${s.options} option${s.options === 1 ? "" : "s"}, uncounted` : "";
  return `${node.settles} (${s.under} under, ${s.depends} depends${opts})`;
}

/* The template's script is written so that every top-level statement is a
   declaration and the one call is guarded on `document`. That lets the whole
   renderer be loaded here, without a DOM, and called directly. */
function loadRenderer() {
  const m = TEMPLATE.match(/<script>\n([\s\S]*?)\n<\/script>/);
  assert.ok(m, "template has a plain <script> block");
  const api = "esc inline mdHtml mdBlocks groupRejected plain firstSentence termIndex termRegex fmtPct formWord safeHref truncate shimsHtml chooseRoute savePlace loadPlace PLACE_KEY STATUS_WORD STATUS_CLASS pill classPill stagePill fenceNoteHtml orderedOptions optionHtml optionReadings factsHtml classHtml nodeHeader renderNode index DG relBadge bearsHtml readsSection readingBlock answerSection rowHtml";
  return new Function(`${m[1]}\nreturn { ${api.split(" ").join(", ")} };`)();
}
const R = loadRenderer();

/* ---------------------------------------------------------------- build */

test("build inlines a graph that parses back out of the page", () => {
  const html = build(TEMPLATE, FIXTURE);
  const m = html.match(/<script type="application\/json" id="graph">([\s\S]*?)<\/script>/);
  assert.ok(m, "page carries a JSON graph element");
  assert.deepEqual(JSON.parse(m[1]), FIXTURE);
  assert.ok(!html.includes("<!--DG:GRAPH-->"), "marker is consumed");
});

test("the inlined payload cannot close its own script element", () => {
  const hostile = {
    module: "m",
    ref: "r",
    graphs: { g: { about: "a" } },
    nodes: [{ id: "m/g/x", graph: "g", question: "</script><script>alert(1)</script>", answer: "<img src=x>", children: [], under: [], rank: 1, status: "question" }]
  };
  const html = build(TEMPLATE, hostile);
  const block = html.slice(html.indexOf('id="graph"'));
  const json = block.slice(block.indexOf(">") + 1, block.indexOf("</script>"));
  assert.ok(!json.includes("<"), "every < is escaped in the payload");
  assert.equal(JSON.parse(json).nodes[0].question, hostile.nodes[0].question);
});

test("build refuses a template with no marker", () => {
  assert.throws(() => build("<title>x</title>", FIXTURE), /DG:GRAPH/);
});

/* -------------------------------------------------------------- project() */

// covers finding project.mjs:62 -- a `graphs` entry with a null value (YAML
// `main:` with nothing after it, which readGraph and canonicalizeId both
// accept) was flagged as undeclared by a `!graph.graphs[n.graph]` truthiness
// test; `in` must accept a declared-but-empty entry.
test("check() does not warn on a node whose graph entry is null", async () => {
  const dir = await freshTmpDir("project-null-graph-");
  const out = join(dir, "index.html");
  const input = resolve(HERE, "fixtures/browser/null-graph-entry.json");
  const { warnings } = await project({ input, out });
  assert.deepEqual(warnings, []);
});

// covers finding project.mjs:102 -- the old main-module guard compared
// `import.meta.url` to a hand-built `file://${argv[1]}`, which does not
// percent-encode a space, so the CLI silently produced no output through any
// path containing one. This copies just project.mjs + the template (not the
// whole package) into a space-containing directory and drives it with
// --input, so it needs no ancestor node_modules for read.mjs's 'yaml' import.
test("CLI writes its output when invoked through a path containing a space", async () => {
  const dir = await freshTmpDir("project-space-");
  const spaceDir = join(dir, "has space");
  await mkdir(spaceDir, { recursive: true });
  await cp(join(HERE, "project.mjs"), join(spaceDir, "project.mjs"));
  await cp(join(HERE, "browser-template.html"), join(spaceDir, "browser-template.html"));

  const input = resolve(HERE, "fixtures/browser/nodes.json");
  const outFile = join(dir, "out", "index.html");

  const stdout = execFileSync(
    process.execPath,
    [join(spaceDir, "project.mjs"), "--input", input, "--out", outFile],
    { encoding: "utf8" },
  );
  assert.match(stdout, /^\d+ nodes, \d+ graphs -> /);
  const html = await readFile(outFile, "utf8");
  assert.ok(html.includes('<script type="application/json" id="graph">'));
});

/* -------------------------------------------------------------- writeRules */

test("writeRules writes one file per global-tier node with the exact notice line and the answer text", async () => {
  const dir = await freshTmpDir("project-rules-");
  const result = await writeRules(VALID_GRAPH, dir);
  assert.equal(result.dir, resolve(dir));
  assert.deepEqual(result.written, [join(dir, "root-b.md")]);
  assert.deepEqual(result.deleted, []);

  const node = VALID_GRAPH.nodes.find((n) => n.id === "example.test/main/root-b");
  const text = await readFile(join(dir, "root-b.md"), "utf8");
  assert.ok(text.startsWith(`# ${node.question}\n`), "first line is the question");
  assert.equal(node.stage, null, "fixture precondition: root-b carries no stage");
  assert.equal(node.class, "ratified");
  assert.deepEqual(node.classSource, { kind: "ruling" });
  assert.ok(
    text.includes(
      `> Projected from ${node.id} (ratified, ruled 2026-01-01). Generated by packages/disposition/project.mjs --rules; do not edit. If this file conflicts with the graph on the disposition ref, the graph wins.`
    ),
    "carries the exact notice line: the class and the date of the ruling, and no stamp",
  );
  assert.ok(text.includes(node.answer), "carries the answer text verbatim");
  assert.ok(!text.includes("## Answer"), "the heading itself is not reproduced");
});

test("writeRules overwrites a same-slug file, deletes only its own stale output, and leaves an unrelated hand-written file alone", async () => {
  const dir = await freshTmpDir("project-rules-sweep-");
  const staleNotice = "Generated by packages/disposition/project.mjs --rules; do not edit.";
  await writeFile(join(dir, "root-b.md"), "hand-written content about to be overwritten\n");
  await writeFile(join(dir, "handwritten.md"), "a file the projector never wrote\n");
  await writeFile(
    join(dir, "stale.md"),
    `# Old rule\n> Projected from example.test/main/gone (deferred, ruled 2026-01-01). ${staleNotice} If this file conflicts with the graph on the disposition ref, the graph wins.\n\nGone.\n`,
  );

  const { written, deleted } = await writeRules(VALID_GRAPH, dir);
  assert.deepEqual(written, [join(dir, "root-b.md")]);
  assert.deepEqual(deleted, [join(dir, "stale.md")]);

  const overwritten = await readFile(join(dir, "root-b.md"), "utf8");
  assert.ok(!overwritten.includes("hand-written content about to be overwritten"), "same-slug file is overwritten");

  const untouched = await readFile(join(dir, "handwritten.md"), "utf8");
  assert.equal(untouched, "a file the projector never wrote\n", "a hand-written file without the notice is kept");

  await assert.rejects(readFile(join(dir, "stale.md"), "utf8"), "the stale generated file is deleted");
});

// covers rule 1d (an un-aligned node is never tier: global, so it is never a
// candidate here) with an explicit mixed graph, rather than relying on the
// valid fixture -- which, once every node in it has an '## Answer', no
// longer has any un-aligned node to mix in.
test("writeRules still projects a global-tier node when the graph also has an un-aligned node", async () => {
  const dir = await freshTmpDir("project-rules-unaligned-");
  const graph = {
    nodes: [
      {
        id: "example.test/main/g", slug: "g", question: "G?", tier: "global",
        class: "ratified", classSource: { kind: "ruling" },
        facts: [{ name: "answer", options: [{ name: "standing", ruling: { response: "confirm", date: "2026-01-01", of: "x" } }] }],
        answerFact: { name: "answer", options: [{ name: "standing", ruling: { response: "confirm", date: "2026-01-01", of: "x" } }] },
        answer: "Global answer.", status: "answered", stage: null,
      },
      { id: "example.test/main/u", slug: "u", question: "U?", tier: null, class: "unanswered", classSource: null, facts: [], answerFact: null, answer: null, status: "unanswered" },
    ],
  };
  const { written } = await writeRules(graph, dir);
  assert.deepEqual(written, [join(dir, "g.md")]);
});

// The three shapes the notice line takes, in place of the stamp it used to
// quote: a class the node's own ruling confers with the date of that ruling,
// a class an ancestor's ruling grants with the ancestor named, and
// `unanswered` with the stage of the dialogue owed on it.
test("writeRules names the class and where it comes from, never a stamp", async () => {
  const dir = await freshTmpDir("project-rules-class-");
  const mk = (slug, extra) => ({
    id: `example.test/main/${slug}`, slug, question: `${slug}?`, tier: "global",
    answer: `Answer for ${slug}.`, status: "answered", stage: null, facts: [], answerFact: null,
    ...extra,
  });
  const authorityFact = (name, date) => ({
    name: "authority",
    options: [{ name, ruling: { response: "confirm", date, of: "pin" } }],
  });
  const graph = {
    nodes: [
      mk("granted", {
        class: "delegated", classSource: { kind: "ancestor", id: "example.test/main/up" },
      }),
      mk("open", { class: "unanswered", classSource: null, status: "unanswered", stage: "review" }),
      mk("own", {
        class: "deferred", classSource: { kind: "ruling" },
        facts: [authorityFact("deferred", "2026-09-05")],
      }),
    ],
  };
  await writeRules(graph, dir);
  const read = async (slug) => await readFile(join(dir, `${slug}.md`), "utf8");
  assert.match(await read("own"), /\(deferred, ruled 2026-09-05\)/);
  assert.match(await read("granted"), /\(delegated, granted by example\.test\/main\/up\)/);
  assert.match(await read("open"), /\(unanswered; stage review\)/);
  for (const slug of ["own", "granted", "open"]) {
    assert.ok(!(await read(slug)).includes("Fixture Author"), `${slug} names no stamp`);
  }
});

/* ----------------------------------------------------------- writeAncestry */

test("writeAncestry lists the node then its ancestors nearest-first, pins every one by hash, and omits global-tier sections", async () => {
  const dir = await freshTmpDir("project-ancestry-");
  const nodesById = new Map(VALID_GRAPH.nodes.map((n) => [n.id, n]));
  const id = (slug) => `example.test/main/${slug}`;

  const { file, content } = await writeAncestry(VALID_GRAPH, id("reading"), join(dir, "CLAUDE.local.md"));
  assert.equal(file, resolve(join(dir, "CLAUDE.local.md")));
  assert.ok(content.startsWith(`# Ancestry of ${id("reading")}\n`));

  // the notice pins the node and every ancestor, global tier included
  for (const slug of ["reading", "multi", "child-a1", "root-b", "root-a"]) {
    const node = nodesById.get(id(slug));
    assert.ok(content.includes(`${node.id}@${node.hash}`), `pins ${slug}`);
  }
  assert.ok(content.includes("Pins:") && content.includes("for the node and each ancestor."));

  // nearest-first order
  const at = (slug) => content.indexOf(`## ${nodesById.get(id(slug)).question}`);
  assert.ok(at("reading") >= 0 && at("multi") >= 0 && at("child-a1") >= 0 && at("root-a") >= 0);
  assert.ok(at("reading") < at("multi"), "the node's own section comes first");
  assert.ok(at("multi") < at("child-a1"), "nearer ancestors come before farther ones");
  assert.ok(at("child-a1") < at("root-a"));

  // root-b is tier: global -- pinned above, but not repeated as a section,
  // since its question and answer are already projected as a rule
  const rootB = nodesById.get(id("root-b"));
  assert.ok(!content.includes(`## ${rootB.question}`), "no section for the global-tier ancestor");
  assert.ok(!content.includes(rootB.answer), "its answer is not repeated either");

  // child-a1 carries an answer that no ruling reaches, like root-a: an
  // unanswered node with a drafted answer.
  assert.ok(content.includes(`${id("child-a1")} (unanswered)`));

  const rootA = nodesById.get(id("root-a"));
  assert.ok(content.includes(rootA.answer), "an ancestor's answer is reproduced verbatim");
});

test("writeAncestry labels an ancestor with its class, and 'un-aligned' when it has no answer at all", async () => {
  const dir = await freshTmpDir("project-ancestry-labels-");
  const graph = {
    nodes: [
      { id: "root", slug: "root", question: "Root?", under: [], tier: null, class: "delegated", answer: "Answer root.", hash: "hash-root" },
      { id: "mid", slug: "mid", question: "Mid?", under: ["root"], tier: null, class: "unanswered", answer: "Answer mid.", hash: "hash-mid" },
      { id: "leaf", slug: "leaf", question: "Leaf?", under: ["mid"], tier: null, class: "unanswered", answer: null, hash: "hash-leaf" },
    ],
  };
  const { content } = await writeAncestry(graph, "leaf", join(dir, "CLAUDE.local.md"));
  assert.ok(content.includes("leaf (un-aligned)"), "no answer at all: un-aligned, which no class says");
  assert.ok(content.includes("mid (unanswered)"), "an answer no ruling reaches");
  assert.ok(content.includes("root (delegated)"), "the class a ruling confers");
});

test("writeAncestry on a no-answer node targeted directly prints 'un-aligned' for itself", async () => {
  const dir = await freshTmpDir("project-ancestry-unaligned-");
  const graph = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
  const unaligned = graph.nodes.find((n) => n.answer == null);
  assert.ok(unaligned, "fixture has a no-answer node");
  const { content } = await writeAncestry(graph, unaligned.id, join(dir, "CLAUDE.local.md"));
  assert.ok(content.includes(`${unaligned.id} (un-aligned)`));
});

test("writeAncestry deduplicates an ancestor reachable by two paths, keeping it at its nearest depth", async () => {
  const graph = {
    nodes: [
      { id: "a", slug: "a", question: "A?", under: [], tier: null, class: "ratified", answer: "Answer A.", hash: "hash-a" },
      { id: "b", slug: "b", question: "B?", under: ["a"], tier: null, class: "unanswered", answer: "Answer B.", hash: "hash-b" },
      { id: "c", slug: "c", question: "C?", under: ["a"], tier: null, class: "unanswered", answer: "Answer C.", hash: "hash-c" },
      { id: "d", slug: "d", question: "D?", under: ["b", "c"], tier: null, class: "unanswered", answer: "Answer D.", hash: "hash-d" },
    ],
  };
  const dir = await freshTmpDir("project-ancestry-dedup-");
  const { content } = await writeAncestry(graph, "d", join(dir, "CLAUDE.local.md"));

  assert.equal(content.split("## A?").length - 1, 1, "a shared ancestor reached via two paths appears once");
  assert.ok(content.includes("a@hash-a") && content.includes("b@hash-b") && content.includes("c@hash-c") && content.includes("d@hash-d"));

  const order = ["## D?", "## B?", "## C?", "## A?"].map((s) => content.indexOf(s));
  assert.deepEqual(order, [...order].sort((x, y) => x - y), "nearest-first: d, then b and c, then their shared parent a");
});

test("writeAncestry rejects an unknown node id", async () => {
  const dir = await freshTmpDir("project-ancestry-missing-");
  await assert.rejects(
    writeAncestry(VALID_GRAPH, "example.test/main/does-not-exist", join(dir, "CLAUDE.local.md")),
    /no node with id/,
  );
});

/* --------------------------------------------------- un-aligned dispositions */

test("--out drops an un-aligned node: absent from nodes and from every cite; other nodes survive", async () => {
  const dir = await freshTmpDir("project-unaligned-out-");
  const out = join(dir, "index.html");
  const graph = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
  const unaligned = graph.nodes.find((n) => n.answer == null);
  const others = graph.nodes.filter((n) => n.answer != null);
  assert.ok(unaligned && others.length === graph.nodes.length - 1);

  const { html } = await project({ rootDir: resolve(HERE, "fixtures/valid-unaligned"), out });
  const m = html.match(/<script type="application\/json" id="graph">([\s\S]*?)<\/script>/);
  const embedded = JSON.parse(m[1]);

  assert.ok(!embedded.nodes.some((n) => n.id === unaligned.id), "no page for the un-aligned node");
  for (const n of embedded.nodes) {
    assert.ok(!(n.cites || []).some((c) => c.id === unaligned.id), `${n.id}'s cites do not name the un-aligned node`);
  }
  for (const n of others) {
    assert.ok(embedded.nodes.some((x) => x.id === n.id), `${n.id} is still in the page`);
  }
});

test("excludeUnaligned drops the node and any cite pointing at it, leaving everything else untouched", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
  const root = graph.nodes.find((n) => n.slug === "root");
  assert.ok(root.cites.some((c) => c.id.endsWith("child-unaligned")), "fixture root cites the un-aligned node");

  const filtered = excludeUnaligned(graph);
  assert.equal(filtered.nodes.length, graph.nodes.length - 1);
  assert.ok(!filtered.nodes.some((n) => n.answer == null));
  const filteredRoot = filtered.nodes.find((n) => n.slug === "root");
  assert.deepEqual(filteredRoot.cites, [], "the dangling cite is dropped");
});

test("excludeUnaligned returns the graph unchanged when nothing is un-aligned", () => {
  assert.equal(excludeUnaligned(VALID_GRAPH), VALID_GRAPH);
});

// covers a live-graph defect: the `projection` node's derived `children`
// named `frontier-metrics` (un-aligned, dropped from the page) even though
// `cites` was already filtered -- the browser's embedded JSON still pointed
// at a node with no page. `root`'s children here mirror that shape: one
// dropped (child-unaligned) and one kept (child-ruling) sibling.
test("excludeUnaligned also drops the id from every remaining node's children, and leaves --alignment untouched", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
  const root = graph.nodes.find((n) => n.slug === "root");
  const unaligned = graph.nodes.find((n) => n.answer == null);
  const ruling = graph.nodes.find((n) => n.slug === "child-ruling");
  assert.ok(root.children.includes(unaligned.id), "fixture root's children includes the un-aligned node before filtering");
  assert.ok(root.children.includes(ruling.id), "fixture root's children includes the surviving sibling before filtering");

  const filtered = excludeUnaligned(graph);
  const filteredRoot = filtered.nodes.find((n) => n.slug === "root");
  assert.ok(!filteredRoot.children.includes(unaligned.id), "children no longer names the dropped id");
  assert.ok(filteredRoot.children.includes(ruling.id), "the surviving sibling is still named");

  const untouchedRuling = filtered.nodes.find((n) => n.slug === "child-ruling");
  assert.equal(untouchedRuling, graph.nodes.find((n) => n.slug === "child-ruling"), "a node naming no dropped id is returned unchanged");

  // --alignment does not call excludeUnaligned -- it renders every staged
  // node, aligned or not -- so the fix above must not change its output.
  const alignmentHtml = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(alignmentHtml.includes(unaligned.id), "the un-aligned node is still present in the alignment output");
});

test("renderFrontier lists every node in descending rank order with stage/settles/under/instrument/shim lines", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
  const listing = renderFrontier(graph);
  assert.ok(listing.startsWith(`# Frontier of ${graph.module}\n\n## Ruling order\n`));
  assert.ok(listing.includes("\n\n## Every node, by rank\n"), "the two sections, in order");

  const root = graph.nodes.find((n) => n.slug === "root");
  const unaligned = graph.nodes.find((n) => n.slug === "child-unaligned");
  const ruling = graph.nodes.find((n) => n.slug === "child-ruling");

  // "Every node, by rank" is unaffected by the ruling order above it: rank
  // order, descending: root (1.0) > child-unaligned (0.75) > child-ruling (0.25)
  const everyNodeSection = listing.slice(listing.indexOf("## Every node, by rank"));
  const at = (id) => everyNodeSection.indexOf(`- ${id}`);
  assert.ok(at(root.id) >= 0 && at(unaligned.id) >= 0 && at(ruling.id) >= 0);
  assert.ok(at(root.id) < at(unaligned.id));
  assert.ok(at(unaligned.id) < at(ruling.id));

  // child-unaligned and child-ruling share the identical parent (root), so
  // their lines are compared within each node's own block, not by a global
  // substring search that the shared 'under' text would satisfy either way.
  const blockFor = (id) => {
    const start = everyNodeSection.indexOf(`- ${id}`);
    const next = everyNodeSection.indexOf("\n- ", start + 1);
    return everyNodeSection.slice(start, next === -1 ? everyNodeSection.length : next);
  };

  const unalignedBlock = blockFor(unaligned.id);
  assert.ok(unalignedBlock.includes(`  stage: ${unaligned.stage}`));
  assert.ok(unalignedBlock.includes(`  settles: ${settlesBreakdown(unaligned)}`), "the settles line, right after stage");
  assert.ok(unalignedBlock.includes(`  under: ${unaligned.under.join(", ")}`), "under: lists an un-aligned node's parents");
  assert.ok(unalignedBlock.includes("  instrument: none"));

  const rulingBlock = blockFor(ruling.id);
  assert.ok(rulingBlock.includes(`  stage: ${ruling.stage}`));
  assert.ok(rulingBlock.includes(`  settles: ${ruling.settles} (`));
  assert.ok(!rulingBlock.includes("  under:"), "under: is only for un-aligned nodes");
  assert.ok(
    rulingBlock.includes(`shim (${ruling.shims[0].declared}): ${ruling.shims[0].artifact} — for: unstated — liquidation: ${ruling.shims[0].liquidation}`),
    "a shim with no 'for' prints 'unstated'",
  );

  const rootBlock = blockFor(root.id);
  assert.ok(rootBlock.includes(`instrument: ${root.instrument.kind}: ${root.instrument.ref}`), "a real instrument renders");
  assert.ok(!rootBlock.includes("  stage:"), "root has no stage");
  assert.ok(!rootBlock.includes("  settles:"), "no stage, so no settles line either");
});

test("renderFrontier's '## Ruling order' lists only the alignment frontier, sorted by settles descending then rank, and prints '_none_' when empty", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
  const listing = renderFrontier(graph);
  const rulingSection = listing.slice(listing.indexOf("## Ruling order"), listing.indexOf("## Every node, by rank"));

  const unaligned = graph.nodes.find((n) => n.slug === "child-unaligned");
  const ruling = graph.nodes.find((n) => n.slug === "child-ruling");
  const root = graph.nodes.find((n) => n.slug === "root");
  assert.equal(root.stage, null, "fixture precondition: root carries no stage");
  assert.ok(!rulingSection.includes(root.id), "a node with no stage is not in the ruling order");

  assert.equal(unaligned.settles, ruling.settles, "fixture precondition: both leaves settle nothing of their own");
  assert.ok(unaligned.rank > ruling.rank, "and the settles tie is broken by rank");
  const ids = [...rulingSection.matchAll(/^\d+\. (\S+) —/gm)].map((m) => m[1]);
  assert.deepEqual(ids, [unaligned.id, ruling.id]);
  assert.ok(
    rulingSection.includes(`1. ${unaligned.id} — settles ${settlesBreakdown(unaligned)} — rank ${unaligned.rank.toFixed(4)} — stage ${unaligned.stage}`),
  );

  const emptyListing = renderFrontier({ module: "example.test", nodes: [{ id: "example.test/main/x", stage: null, rank: 1, settles: 0, settledBy: { under: 0, alternatives: 0, depends: 0 }, status: "answered", authority: null }] });
  const emptyRulingSection = emptyListing.slice(emptyListing.indexOf("## Ruling order"), emptyListing.indexOf("## Every node, by rank"));
  assert.ok(emptyRulingSection.includes("_none_"));
});

test("renderFrontier's ruling order sorts by settles descending before rank, and a node's own alternatives do not count toward it", () => {
  const mk = (id, stage, rank, settles, settledBy) => ({
    id, stage, rank, settles, settledBy, status: "unanswered", authority: null,
  });
  const graph = {
    module: "example.test",
    nodes: [
      // a's settledBy sums to 4 (3 under + 1 depends); its one alternative
      // is carried on settledBy.alternatives but is not part of that sum.
      mk("example.test/main/a", "review", 0.1, 4, { under: 3, alternatives: 1, depends: 1 }),
      mk("example.test/main/b", "ruling", 0.9, 4, { under: 4, alternatives: 0, depends: 0 }),
      mk("example.test/main/c", "periagogic", 0.5, 9, { under: 9, alternatives: 0, depends: 0 }),
      mk("example.test/main/d", null, 0.99, 0, { under: 0, alternatives: 0, depends: 0 }),
    ],
  };
  const listing = renderFrontier(graph);
  const rulingSection = listing.slice(listing.indexOf("## Ruling order"), listing.indexOf("## Every node, by rank"));
  const ids = [...rulingSection.matchAll(/^\d+\. (\S+) —/gm)].map((m) => m[1]);
  assert.deepEqual(ids, [
    "example.test/main/c", // settles 9, the outright highest
    "example.test/main/b", // ties a on settles (4); rank 0.9 beats a's 0.1
    "example.test/main/a",
  ]);
  assert.ok(!ids.includes("example.test/main/d"), "no stage, so not in the ruling order at all");
});

test("renderFrontier prints a 'depends:' line, bare or qualified by an option, right after settles:", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-depends"));
  const listing = renderFrontier(graph);
  const everyNodeSection = listing.slice(listing.indexOf("## Every node, by rank"));
  const blockFor = (slug) => {
    const node = graph.nodes.find((n) => n.slug === slug);
    assert.ok(node, `fixture has no node ${slug}`);
    const start = everyNodeSection.indexOf(`- ${node.id}`);
    const next = everyNodeSection.indexOf("\n- ", start + 1);
    return everyNodeSection.slice(start, next === -1 ? everyNodeSection.length : next);
  };

  const plainBlock = blockFor("dependent");
  assert.ok(plainBlock.includes("  depends: example.test/main/prerequisite"), "a bare entry renders without '#'");
  const settlesAt = plainBlock.indexOf("  settles:");
  const dependsAt = plainBlock.indexOf("  depends:");
  assert.ok(settlesAt >= 0 && dependsAt === plainBlock.indexOf("\n", settlesAt) + 1, "right after settles:");

  const qualifiedBlock = blockFor("sibling");
  assert.ok(
    qualifiedBlock.includes("  depends: example.test/main/prerequisite#split-it"),
    "a qualified entry keeps its '#option', the option name the answer fact lists",
  );

  const open = blockFor("prerequisite");
  assert.ok(!open.includes("  depends:"), "the node depended on names no dependency of its own");
});

test("renderFrontier prints an 'order:' line, right after the head line, for a node carrying order", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-order"));
  const listing = renderFrontier(graph);
  const orderNode = graph.nodes.find((n) => n.slug === "order-node");

  const headAt = listing.indexOf(`- ${orderNode.id}`);
  assert.ok(headAt >= 0, "the head line is present");
  const nextLine = listing.slice(headAt).split("\n")[1];
  assert.equal(
    nextLine,
    "  order: example.test/main/order-node = example.test/main/leaf-a > example.test/main/leaf-b",
    "steps join with ' = ' within a step and ' > ' between steps",
  );

  const other = graph.nodes.find((n) => n.slug === "hub");
  const otherBlock = listing.slice(listing.indexOf(`- ${other.id}`));
  assert.ok(!otherBlock.slice(0, otherBlock.indexOf("\n- ", 1)).includes("  order:"), "a node with no order gets no order line");
});

// There is no stamp to quote: the head line names the status, the class the
// node's rulings derive to, and where that class came from -- this node's
// own ruling, the ancestor whose ruling grants it, or no ruling at all.
test("renderFrontier's head line reads '<id> — <status> — <class> (<source>)'", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const listing = renderFrontier(graph);
  const headOf = (slug) => {
    const node = graph.nodes.find((n) => n.slug === slug);
    assert.ok(node, `fixture has no node ${slug}`);
    const start = listing.indexOf(`- ${node.id}`);
    return { node, line: listing.slice(start).split("\n")[0] };
  };

  const ratified = headOf("ratified");
  assert.equal(ratified.line, `- ${ratified.node.id} — answered — ratified (ruling) — rank ${ratified.node.rank.toFixed(4)}`);

  const inherited = headOf("inherits-delegated");
  assert.equal(
    inherited.line,
    `- ${inherited.node.id} — answered — delegated (ancestor example.test/main/delegated) — rank ${inherited.node.rank.toFixed(4)}`,
    "an ancestor's ruling is named as the source",
  );

  const inheritedDeferred = headOf("inherits-deferred");
  assert.equal(
    inheritedDeferred.line,
    `- ${inheritedDeferred.node.id} — answered — deferred (ancestor example.test/main/deferred) — rank ${inheritedDeferred.node.rank.toFixed(4)}`,
    "deferred wins over delegated at equal depth, and the ancestor is named",
  );

  // The author ruled `ratified` on the authority fact and has not ratified
  // the answer: a ruling reaches the node and still leaves it unanswered.
  const held = headOf("authority-ratified");
  assert.equal(held.line, `- ${held.node.id} — unanswered — unanswered (ruling) — rank ${held.node.rank.toFixed(4)}`);

  assert.ok(!listing.includes("no stamp"), "no stamp is named anywhere in the listing");

  // A node no ruling reaches at all, on a graph that has one.
  const open = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const fresh = open.nodes.find((n) => n.slug === "fresh-node");
  const openListing = renderFrontier(open);
  assert.ok(openListing.includes(
    `- ${fresh.id} — unanswered — unanswered (no ruling) — rank ${fresh.rank.toFixed(4)}`,
  ));
});

// The whole of a node's authority is its facts, so the frontier prints all
// of one: what it recommends and with what boldness, the option ruled on and
// whether the recommendation has moved since, what stands, whether a fence
// carries a newer recommendation, and every option with its source.
test("renderFrontier prints one line per fact: recommends, ruling, stands, fence, options", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const listing = renderFrontier(graph);
  const blockFor = (slug) => {
    const node = graph.nodes.find((n) => n.slug === slug);
    assert.ok(node, `fixture has no node ${slug}`);
    const start = listing.indexOf(`- ${node.id}`);
    const next = listing.indexOf("\n- ", start + 1);
    return listing.slice(start, next === -1 ? listing.length : next);
  };

  const delegated = blockFor("delegated");
  assert.ok(delegated.includes(
    "  fact answer: recommends narrower (boldness moderate); stands standing; fence; options: standing (ai), narrower (ai)",
  ), "the answer fact: its recommendation, what stands, the fence, and every option with its source");
  assert.ok(delegated.includes(
    "  fact authority: recommends delegated (boldness moderate); ruled confirm on delegated, 2026-09-05; options: delegated, ratified",
  ), "a reserved fact's options are its vocabulary and carry no source");

  const moved = blockFor("moved");
  assert.ok(moved.includes(
    "  fact answer: recommends standing (boldness high); ruled confirm on standing, 2026-09-05, moved; stands standing; options: standing (ai)",
  ), "a ruling whose pin no longer matches the recommendation is flagged moved");

  const ratified = blockFor("ratified");
  assert.ok(!ratified.includes(", moved"), "a ruling that still pins its recommendation is not");
  assert.ok(!ratified.includes("; fence"), "a node recommending the option that stands carries no fence");

  const inherits = blockFor("inherits-delegated");
  assert.ok(inherits.includes("  fact answer: no recommendation; stands standing; options: standing (ai)"));

  const reading = blockFor("reading-diverged");
  assert.ok(!reading.includes("recommendation:"), "the node-level recommendation line is gone");
  assert.ok(!listing.includes("  draft: yes") && !listing.includes("  alternatives:"), "and so are the draft and alternatives lines");
});

test("renderFrontier flags a review whose pin no longer matches the recommendation", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const listing = renderFrontier(graph);
  assert.ok(listing.includes("  review: forward (weak, 2026-09-03), changed since its review"));
  assert.ok(listing.includes("  review: forward (strong, 2026-09-03)\n"), "a current review carries no flag");
});

test("renderFrontier's option counts ride the settles breakdown, singular and plural", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const listing = renderFrontier(graph);
  const fresh = graph.nodes.find((n) => n.slug === "fresh-node");
  assert.equal(fresh.settledBy.options, 3, "fixture precondition: three answers on the table");
  assert.ok(listing.includes(`1. ${fresh.id} — settles 0 (0 under, 0 depends; 3 options, uncounted) — rank`));
  const prune = graph.nodes.find((n) => n.slug === "prune-node");
  assert.ok(listing.includes(`${prune.id} — settles 0 (0 under, 0 depends; 1 option, uncounted) — rank`), "singular");
});

/* ------------------------------------------------------- page constraints */

test("the template obeys the artifact skeleton and CSP", () => {
  assert.ok(!/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(TEMPLATE), "no skeleton tags");
  assert.ok(TEMPLATE.slice(0, 8192).includes("<title>Disposition Graph</title>"), "title in the first 8KB");
  const hosts = new Set([...TEMPLATE.matchAll(/https?:\/\/([^\/"'\s)]+)/g)].map((m) => m[1]));
  assert.deepEqual([...hosts], ["fonts.googleapis.com"], "the only external host is the font stylesheet");
});

test("all three theme states are defined", () => {
  assert.match(TEMPLATE, /:root \{[^}]*--paper:/);
  assert.match(TEMPLATE, /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\)/);
  assert.match(TEMPLATE, /:root\[data-theme="dark"\] \{/);
  assert.match(TEMPLATE, /body \{[\s\S]*?background: var\(--paper\)/);
});

// covers the removal of the hand-written "how to read this" details block,
// the vocabulary view, and the bootstrap view: none of their toolbar labels
// or page titles may survive anywhere in the template.
test("the retired howto/vocabulary/bootstrap chrome is gone from the template", () => {
  assert.ok(!TEMPLATE.includes("How to read this"));
  assert.ok(!TEMPLATE.includes("Vocabulary"));
  assert.ok(!TEMPLATE.includes("Bootstrap"));
});

/* -------------------------------------------------------------- markdown */

test("html is escaped everywhere", () => {
  assert.equal(R.esc('<a href="x">&'), "&lt;a href=&quot;x&quot;&gt;&amp;");
  assert.equal(R.mdHtml("<script>alert(1)</script>"), "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  assert.equal(R.mdHtml("`<b>`"), "<p><code>&lt;b&gt;</code></p>");
});

test("paragraphs, headings, lists, fences, quotes", () => {
  assert.equal(R.mdHtml("one\ntwo\n\nthree"), "<p>one two</p><p>three</p>");
  assert.equal(R.mdHtml("### Rejected"), "<h3>Rejected</h3>");
  assert.equal(R.mdHtml("#### deep"), "<h4>deep</h4>");
  assert.equal(R.mdHtml("- a\n- b"), "<ul><li>a</li><li>b</li></ul>");
  assert.equal(R.mdHtml("1. a\n2. b"), "<ol><li>a</li><li>b</li></ol>");
  assert.equal(R.mdHtml("```\nx < y\n```"), "<pre><code>x &lt; y</code></pre>");
  assert.equal(R.mdHtml("> cited"), "<blockquote><p>cited</p></blockquote>");
  assert.equal(R.mdHtml("---"), "<hr>");
});

test("inline emphasis, code and links", () => {
  assert.equal(R.mdHtml("**a** and *b* and _c_"), "<p><strong>a</strong> and <em>b</em> and <em>c</em></p>");
  assert.equal(R.mdHtml("[here](https://example.com)"), '<p><a href="https://example.com" target="_blank" rel="noreferrer noopener">here</a></p>');
  assert.equal(R.mdHtml("[node](#commons.systems/g/n)"), '<p><a href="#commons.systems/g/n">node</a></p>');
  assert.equal(R.safeHref("javascript:alert(1)"), null);
  assert.ok(!R.mdHtml("[x](javascript:alert(1))").includes("<a "), "a script url is left as text");
});

test("a Rejected heading becomes its own labelled block", () => {
  const html = R.groupRejected(R.mdBlocks("why this\n\n### Rejected\n\n- other\n\n### After\n\nnot rejected"));
  assert.match(html, /<section class="rejected"><h3 class="blk-label">Rejected<\/h3><ul><li>other<\/li><\/ul><\/section>/);
  assert.ok(html.indexOf("not rejected") > html.indexOf("</section>"), "the next heading closes the block");
});

/* ------------------------------------------------------------ vocabulary */

test("terms index by first definer and match whole words, including non-ascii", () => {
  const { map, terms } = R.termIndex(FIXTURE.nodes);
  assert.ok(map.has("fixture") && map.has("agreement"), "both defined terms of the fixture graph");
  assert.equal(map.get("fixture").id, "example.test/main/root-a");
  assert.equal(map.get("fixture").sentence, "To exercise the reader against a small, hand-checkable graph.");
  assert.ok(terms.indexOf(terms.slice().sort((a, b) => b.length - a.length)[0]) === 0, "longest term is tried first");

  // The index takes its terms from `defines` and its sentence from the
  // answer, so a term with a non-ascii character is exercised on a node
  // written here rather than waiting for a fixture graph to define one.
  const nonAscii = R.termIndex([
    { id: "example.test/main/arche", defines: ["archē"], answer: "A root of the record.", rank: 1 },
  ]);
  assert.ok(nonAscii.map.has("archē"));

  const hit = (text, term) => {
    const re = R.termRegex([term]);
    return re.test(text);
  };
  assert.ok(hit("an archē is a root", "archē"), "matches a non-ascii term between spaces");
  assert.ok(!hit("archētype", "archē"), "does not match inside a longer word");
  assert.ok(hit("A Fixture holds.", "fixture"), "case-insensitive");
  assert.ok(!hit("prefixture", "fixture"), "respects the left boundary");
});

test("first sentence skips headings, strips markup, and carries a short opener", () => {
  assert.equal(R.firstSentence("### Head\n\nA long enough opening sentence to stand alone. Second one."), "A long enough opening sentence to stand alone.");
  assert.equal(R.firstSentence("I am. Delegation is expected and good."), "I am. Delegation is expected and good.");
  assert.equal(R.firstSentence("**Bold** and `code` and [a link](https://x.test) here."), "Bold and code and a link here.");
  assert.equal(R.firstSentence(null), "");
  assert.ok(R.firstSentence("x ".repeat(400)).endsWith("…"), "a runaway sentence is cut");
});

/* ----------------------------------------------------------- small facts */

test("rank prints as a percentage and archē keeps its macron", () => {
  assert.equal(R.fmtPct(1), "100%");
  assert.equal(R.fmtPct(0.925), "93%");
  assert.equal(R.fmtPct(0.043), "4.3%");
  assert.equal(R.fmtPct(null), "—");
  assert.equal(R.formWord("arche"), "archē");
  assert.equal(R.formWord(null), "unanswered");
  assert.equal(R.truncate("abcdefghij", 6), "abcde…");
});

// There is no stamp: `class` is derived from the rulings on a node's facts
// and on its ancestors' (derive.mjs's deriveClass), and `unanswered` is one
// of the four classes rather than the absence of one. 'proposal' and
// 'unaligned' are gone, and 'question' never was one.
test("STATUS_WORD and STATUS_CLASS carry the four derived classes", () => {
  assert.deepEqual(Object.keys(R.STATUS_WORD).sort(), ["deferred", "delegated", "ratified", "unanswered"]);
  assert.deepEqual(Object.keys(R.STATUS_CLASS).sort(), ["deferred", "delegated", "ratified", "unanswered"]);
  assert.equal(R.STATUS_WORD.unaligned, undefined);
  assert.equal(R.STATUS_WORD.proposal, undefined);
  assert.equal(R.STATUS_WORD.question, undefined);
  assert.equal(R.STATUS_WORD.unstamped, undefined);
});

/* ------------------------------------------------------ class and stage */

test("classPill shows the derived class, and never a stamp", () => {
  assert.equal(R.classPill({ class: "ratified" }), '<span class="pill rat">ratified</span>');
  assert.equal(R.classPill({ class: "unanswered" }), '<span class="pill unans">unanswered</span>');
  assert.equal(R.classPill({ class: "deferred" }, true), '<span class="pill sm def">deferred</span>');
  assert.equal(R.classPill({}), '<span class="pill unans">unanswered</span>', "a node with no class reads unanswered");
});

test("stagePill names the stage alone, since the class pill already says unanswered", () => {
  assert.equal(R.stagePill({ class: "unanswered", stage: "review" }), '<span class="pill stg">in dialogue · review</span>');
  assert.equal(R.stagePill({ class: "ratified", stage: "review" }), '<span class="pill stg">in dialogue · review</span>');
  assert.equal(R.stagePill({ class: "ratified", stage: null }), "");
  assert.equal(R.stagePill({}), "");
  assert.ok(!R.stagePill({ stage: "review" }).includes("unanswered"), "the word is not repeated from the class pill");
});

test("fenceNoteHtml points to the alignment page for a fence, a proposal, and a divergence", () => {
  assert.match(R.fenceNoteHtml({ fence: { raw: "x" } }), /A recommendation awaits the author's ruling on the alignment page\./);
  assert.equal(R.fenceNoteHtml({ fence: null }), "");
  assert.equal(R.fenceNoteHtml({}), "");

  const moved = R.fenceNoteHtml({ proposal: true });
  assert.match(moved, /ratified and its recommendation has moved since the ruling/);
  assert.match(moved, /returned to the alignment page for re-confirmation/);

  const diverged = R.fenceNoteHtml({ divergesFromRecommendation: true });
  assert.match(diverged, /ruled against the AI's recommendation/);
});

/* ----------------------------------------------------- facts and options */

test("orderedOptions puts the option that stands first on the answer fact, and leaves every other fact alone", () => {
  const answer = { name: "answer", stands: "standing", options: [{ name: "bolder" }, { name: "standing" }, { name: "third" }] };
  assert.deepEqual(R.orderedOptions(answer).map((o) => o.name), ["standing", "bolder", "third"]);
  const authority = { name: "authority", options: [{ name: "ratified" }, { name: "delegated" }] };
  assert.deepEqual(R.orderedOptions(authority).map((o) => o.name), ["ratified", "delegated"]);
  const unstood = { name: "answer", options: [{ name: "a" }, { name: "b" }] };
  assert.deepEqual(R.orderedOptions(unstood).map((o) => o.name), ["a", "b"]);
});

test("factsHtml renders the answer fact's options with source, ref, prose, and the marks a ruling and a recommendation leave", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const fresh = graph.nodes.find((n) => n.slug === "fresh-node");
  assert.equal(fresh.answerFact.options.length, 3, "fixture precondition: three answers on the table");
  const html = R.factsHtml(fresh);

  assert.ok(html.includes("The decisions this ruling asks"));
  for (const name of ["standing", "split-the-node", "follow-the-instrument"]) {
    assert.ok(html.includes(`>${name}</span>`), `${name} is named`);
  }
  assert.ok(html.includes("review · 2026-09-02"), "the source and the ref that dates it");
  assert.ok(html.includes("node --test packages/disposition/read.test.mjs · 2026-09-03"), "the ref that names the instrument");
  assert.ok(html.includes("the question is two questions"), "the option's own prose");
  assert.ok(html.includes('<span class="pill sm rec">recommended · boldness high</span>'), "the recommended option is marked with its boldness");
  assert.ok(html.includes('<span class="pill sm none">stands</span>'), "and the option whose text stands says so");
  assert.ok(
    html.indexOf(">standing</span>") < html.indexOf(">split-the-node</span>"),
    "the option that stands leads the list",
  );
  assert.ok(
    html.includes("The standing answer keeps its full authority until the author confirms one of these."),
    "the line that says what the list does not do",
  );
  assert.ok(!html.includes("Pending alternatives"), "there is no separate alternatives block any more");

  // A reserved fact reads the same way, its option names its vocabulary.
  const pruneNode = graph.nodes.find((n) => n.slug === "prune-node");
  const facts = R.factsHtml(pruneNode);
  assert.ok(facts.includes(">existence</span>"), "the existence fact is named");
  assert.ok(facts.includes(">prune</span>") && facts.includes(">keep</span>"), "both of its options");
  assert.ok(facts.includes("recommended · boldness moderate"), "and the one recommended");
  assert.ok(!facts.includes("keeps its full authority"), "no options pending on its answer, so no note");
  assert.equal(R.factsHtml({ facts: [] }), "", "nothing for a node with no facts");

  // and the browser keeps every node of this fixture: each has an answer
  const kept = excludeUnaligned(graph).nodes.map((n) => n.slug).sort();
  assert.deepEqual(kept, ["fresh-node", "prune-node", "stale-review"]);
});

test("factsHtml marks the confirmed option with its response and date, and shows the readings on each option", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const diverges = graph.nodes.find((n) => n.slug === "diverges");
  const html = R.factsHtml(diverges);
  assert.ok(html.includes('<span class="pill sm ruled">confirmed · edit · 2026-09-05</span>'), "the ruling on the option it was made on");
  assert.ok(html.includes("recommended · boldness high"), "and the recommendation on the option that was not chosen");

  // A tradition bears on an option, not on a node: the reading that adopts
  // the option the author did not choose is shown as chosen over.
  const delegated = graph.nodes.find((n) => n.slug === "delegated");
  const delegatedHtml = R.factsHtml(delegated);
  assert.ok(delegatedHtml.includes("example.test/main/reading-diverged"), "the reading is named on the option it bears on");
  assert.ok(delegatedHtml.includes('<span class="badge diverged">diverged</span>'));

  const ratified = graph.nodes.find((n) => n.slug === "ratified");
  const ratifiedHtml = R.factsHtml(ratified);
  assert.ok(ratifiedHtml.includes('<span class="badge adopted">adopted</span>'), "adopted on the option that was chosen");
});

test("classHtml names the class and where it comes from, with the stage beside it", () => {
  const ruled = R.classHtml({
    class: "deferred",
    classSource: { kind: "ruling" },
    facts: [{ name: "authority", options: [{ name: "deferred", ruling: { response: "confirm", date: "2026-09-05" } }] }],
    stage: "review",
  });
  assert.ok(ruled.includes('<span class="pill def">deferred</span>'));
  assert.ok(ruled.includes('<span class="classnote">ruled 2026-09-05</span>'));
  assert.ok(ruled.includes('<span class="pill stg">in dialogue · review</span>'));

  const granted = R.classHtml({ class: "delegated", classSource: { kind: "ancestor", id: "example.test/main/up" }, facts: [] });
  assert.ok(granted.includes('<span class="pill del">delegated</span>'));
  assert.ok(granted.includes("granted by example.test/main/up"));
  assert.ok(!granted.includes("stg"), "no stage, no stage pill");

  const open = R.classHtml({ class: "unanswered", classSource: null, facts: [], stage: "maieutic" });
  assert.ok(open.includes('<span class="pill unans">unanswered</span>'));
  assert.ok(open.includes('<span class="classnote">no ruling</span>'));
});

test("rowHtml marks a node in the navigation with its class and its stage", () => {
  const answered = R.rowHtml({ id: "x", question: "Q?", form: "rule", class: "ratified", stage: null }, null);
  assert.ok(answered.includes('<span class="pill sm rat">ratified</span>'));
  assert.ok(!answered.includes("stg"));

  const unanswered = R.rowHtml({ id: "y", question: "Q2?", form: "rule", class: "unanswered", answer: "x", stage: "periagogic" }, null);
  assert.ok(unanswered.includes('<span class="pill sm unans">unanswered</span>'));
  assert.ok(unanswered.includes("in dialogue · periagogic"));
});

/* -------------------------------------------------- readings and answers */

test("a reading says what it bears on: the node, the fact and the option, with the relation", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const reading = graph.nodes.find((n) => n.slug === "reading-diverged");
  assert.equal(reading.bears.length, 2, "fixture precondition: it bears on two nodes");

  const solo = R.readsSection(reading);
  assert.ok(solo.includes(reading.source), "the citation it is a reading of");
  assert.ok(solo.includes("example.test/main/delegated · answer · narrower"));
  assert.ok(solo.includes("example.test/main/ratified · answer · standing"));
  assert.ok(solo.includes('<span class="badge diverged">diverged</span>'));
  assert.ok(solo.includes('<span class="badge adopted">adopted</span>'));
  assert.equal(R.readsSection({ form: "rule", bears: [] }), "", "only a reading carries the section");

  // Listed under a node it bears on, it shows only the relations it records
  // against that node.
  const onDelegated = R.readingBlock(reading, "example.test/main/delegated");
  assert.ok(onDelegated.includes('<span class="badge diverged">diverged</span>'));
  assert.ok(!onDelegated.includes('<span class="badge adopted">adopted</span>'), "the other node's relation is not shown here");
  assert.ok(onDelegated.includes("answer · narrower"));
  assert.ok(onDelegated.includes("delegated"), "and its own class, in place of a stamp");
});

test("answerSection marks an unanswered node's text as unruled", () => {
  const open = R.answerSection({ class: "unanswered", form: "rule", answer: "Provisionally." });
  assert.ok(open.includes('class="mdbody unruled"'));
  const ruled = R.answerSection({ class: "ratified", form: "rule", answer: "Ruled." });
  assert.ok(ruled.includes('class="mdbody"') && !ruled.includes("unruled"));
  const conferred = R.answerSection({ class: "delegated", form: "rule", answer: "Delegated." });
  assert.ok(!conferred.includes("unruled"), "a class an ancestor confers is still a class");
});

/* ------------------------------------------------------------------ shims */

// covers the ledger-badge replacement: the shims fixture's node declares two
// shims (one with `for`, one without), and the shims block must render every
// one of their fields.
test("the shims block covers a fixture node that declares shims", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-shims"));
  const node = graph.nodes.find((n) => n.shims && n.shims.length >= 2);
  assert.ok(node, "fixture node declares at least two shims");
  const html = R.shimsHtml(node.shims);
  for (const s of node.shims) {
    assert.ok(html.includes(R.esc(s.artifact)), `includes artifact ${s.artifact}`);
    assert.ok(html.includes(R.esc(s.liquidation)), `includes liquidation ${s.liquidation}`);
    assert.ok(html.includes(s.declared), `includes declared date ${s.declared}`);
    if (s.for) assert.ok(html.includes(R.esc(s.for)), `includes for ${s.for}`);
  }
});

test("shimsHtml renders nothing for an empty list", () => {
  assert.equal(R.shimsHtml([]), "");
});

/* -------------------------------------------------- the whole node page */

// The renderer's own end-to-end path, driven on the fixture the browser
// receives: the header's `class` row in place of the retired `authority`
// one, the decisions block beneath it, and no stamp anywhere.
test("the node page heads with the class and carries the facts beneath it", () => {
  R.DG.data = FIXTURE;
  R.index();
  const ratified = FIXTURE.nodes.find((n) => n.class === "ratified");
  assert.ok(ratified, "fixture precondition: one node's own ruling ratifies it");
  const html = R.renderNode(ratified);
  assert.ok(html.includes("<dt>class</dt>"), "the header row is the class");
  assert.ok(!html.includes("<dt>authority</dt>"), "and never the retired stamp row");
  assert.ok(html.includes('<span class="pill rat">ratified</span>'));
  assert.ok(html.includes("The decisions this ruling asks"), "the facts block");
  assert.ok(html.includes(">standing</span>"), "with the option that stands named");
  assert.ok(html.includes('<span class="pill sm none">stands</span>'), "and marked as the one whose text stands");
  assert.ok(html.includes('<span class="pill sm ruled">confirmed'), "and as the confirmed choice");

  const reading = FIXTURE.nodes.find((n) => n.form === "reading");
  const readingHtml = R.renderNode(reading);
  assert.ok(readingHtml.includes("Reads"), "a reading carries the section that says what it reads");
  assert.ok(readingHtml.includes(reading.bears[0].node), "and what it bears on");

  const parent = FIXTURE.nodes.find((n) => n.id === reading.bears[0].node);
  const parentHtml = R.renderNode(parent);
  assert.ok(parentHtml.includes("Traditions"), "the node it bears on lists it as a tradition");
  assert.ok(parentHtml.includes("answer · standing"), "naming the fact and option it bears on");
});

/* ---------------------------------------------------------- reader's place */

// The place-keeping helpers take the storage object as an argument rather
// than reaching for window.localStorage directly, so they can be driven here
// without a DOM: a plain Map-backed stub stands in for localStorage.
function stubStorage() {
  const store = new Map();
  return {
    store,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
  };
}

test("savePlace and loadPlace round-trip an id through an injectable storage object", () => {
  const storage = stubStorage();
  assert.equal(R.loadPlace(storage), null, "nothing stored yet");
  R.savePlace("commons.systems/disposition-graph/purpose", storage);
  assert.equal(storage.store.get(R.PLACE_KEY), "commons.systems/disposition-graph/purpose");
  assert.equal(R.loadPlace(storage), "commons.systems/disposition-graph/purpose");
});

test("savePlace and loadPlace tolerate a storage that throws", () => {
  const hostile = {
    getItem() { throw new Error("storage disabled"); },
    setItem() { throw new Error("storage disabled"); },
  };
  assert.doesNotThrow(() => R.savePlace("x", hostile));
  assert.equal(R.loadPlace(hostile), null);
});

test("chooseRoute falls back to the default when the stored id names no node", () => {
  const hasNode = (id) => id === "default-node";
  const route = R.chooseRoute("", "no-longer-exists", hasNode, "default-node");
  assert.deepEqual(route, { kind: "node", id: "default-node", implicit: true });
});

test("chooseRoute reopens the remembered node on an empty fragment", () => {
  const hasNode = (id) => id === "default-node" || id === "remembered-node";
  const route = R.chooseRoute("", "remembered-node", hasNode, "default-node");
  assert.deepEqual(route, { kind: "node", id: "remembered-node", implicit: true });
});

test("chooseRoute prefers a non-empty fragment over the stored place", () => {
  const hasNode = (id) => id === "from-hash" || id === "remembered-node";
  const route = R.chooseRoute("from-hash", "remembered-node", hasNode, "default-node");
  assert.deepEqual(route, { kind: "node", id: "from-hash" });
});

test("chooseRoute reports a missing id even when a stored place would resolve", () => {
  const hasNode = (id) => id === "remembered-node";
  const route = R.chooseRoute("nope", "remembered-node", hasNode, "default-node");
  assert.deepEqual(route, { kind: "missing", id: "nope" });
});

test("chooseRoute treats the retired vocabulary and bootstrap hashes as empty", () => {
  const hasNode = (id) => id === "default-node";
  assert.deepEqual(R.chooseRoute("~vocabulary", null, hasNode, "default-node"), { kind: "node", id: "default-node", implicit: true });
  assert.deepEqual(R.chooseRoute("~bootstrap", null, hasNode, "default-node"), { kind: "node", id: "default-node", implicit: true });
});

test("chooseRoute reports missing with no default and nothing stored", () => {
  const hasNode = () => false;
  assert.deepEqual(R.chooseRoute("", null, hasNode, null), { kind: "missing", id: "" });
});

/* ------------------------------------------------------------- alignment */

const ALIGNMENT_GRAPH = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
const DIALOGUE_GRAPH = await readGraph(resolve(HERE, "fixtures/valid-dialogue"));
const TWO_GRAPHS = await readGraph(resolve(HERE, "fixtures/valid-two-graphs"));

// One item's own markup, so an assertion about an item never matches the
// left rail, the page head, or a neighbouring item.
function itemHtml(html, nodeId) {
  const start = html.indexOf(`data-id="${nodeId}"`);
  assert.ok(start > 0, `no item rendered for ${nodeId}`);
  return html.slice(start, html.indexOf("</article>", start));
}

// A node that carries no stage is off the alignment frontier and renders no
// item. Where a fixture's node is deliberately off it -- a ratified node with
// nothing moved, a delegated one -- this puts it on, so the page's rendering
// of that node's own data can be checked at all.
function stage(graph, id, at = "ruling") {
  return { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, stage: at } : n)) };
}

function nodeBySlug(graph, slug) {
  const n = graph.nodes.find((x) => x.slug === slug);
  assert.ok(n, `fixture has no node ${slug}`);
  return n;
}

test("buildAlignment refuses a template with no marker", () => {
  assert.throws(() => buildAlignment("<title>x</title>", ALIGNMENT_GRAPH), /DG:ITEMS/);
});

test("orderAlignmentItems returns one flat ruling order across every graph (settles, then rank, then id), with the manifest's per-graph about text and counts as metadata", () => {
  const { items, graphs } = orderAlignmentItems(TWO_GRAPHS);
  // the second graph's root settles two leaves of the first graph (each
  // stands under it) and so leads the flat order, even though the
  // manifest names "first" before "second" -- a graph is a label here,
  // never a precedence.
  assert.equal(items[0].settles, 2, "fixture precondition: root settles both leaves");
  assert.deepEqual(items.map((n) => n.slug), ["root", "leaf-a", "leaf-b"], "settles descending; the tied leaves then break by id");

  assert.deepEqual(graphs.map((g) => g.graph), ["first", "second"], "graphs metadata still follows the manifest's own order");
  assert.deepEqual(graphs.map((g) => g.about), [
    "the graph the manifest names first",
    "the graph the manifest names second",
  ]);
  assert.deepEqual(graphs.map((g) => g.count), [2, 1], "each graph's open-item count");

  const one = orderAlignmentItems(ALIGNMENT_GRAPH);
  assert.deepEqual(one.graphs.map((g) => g.graph), ["main"]);
  assert.equal(one.items[0].settles, one.items[1].settles, "fixture precondition: both leaves settle nothing of their own");
  assert.deepEqual(one.items.map((n) => n.slug), ["child-unaligned", "child-ruling"]);
  assert.ok(one.items[0].rank > one.items[1].rank, "settles ties, so the higher-ranked item comes first");
});

test("orderAlignmentItems takes only nodes carrying a stage, appends an undeclared graph's metadata rather than dropping it, and settles outranks rank", () => {
  const { items } = orderAlignmentItems(DIALOGUE_GRAPH);
  const slugs = items.map((n) => n.slug);
  assert.ok(!slugs.includes("answered-no-stage"), "a node with no stage is not an item");

  // settles outranks rank. Three items, ranks tied: ruling-node settles 1
  // -- a real dependant elsewhere, not its own alternatives, which it also
  // carries but which no longer count toward settles (deriveSettles) --
  // and so leads even though answered-with-stage and review-node (settles
  // 0 apiece) tie it on rank.
  const ordered = orderAlignmentItems({
    graphs: { main: {} },
    nodes: [
      { id: "example.test/main/answered-with-stage", slug: "answered-with-stage", graph: "main", stage: "review", rank: 0.25, settles: 0 },
      { id: "example.test/main/review-node", slug: "review-node", graph: "main", stage: "review", rank: 0.25, settles: 0 },
      { id: "example.test/main/ruling-node", slug: "ruling-node", graph: "main", stage: "ruling", rank: 0.25, settles: 1, alternatives: [{ name: "whole-node" }] },
    ],
  });
  const item = (slug) => ordered.items.find((n) => n.slug === slug);
  assert.equal(item("ruling-node").settles, 1);
  assert.equal(item("answered-with-stage").settles, 0);
  assert.equal(item("review-node").settles, 0);
  assert.deepEqual(ordered.items.map((n) => n.slug), ["ruling-node", "answered-with-stage", "review-node"], "settles 1 leads settles 0, whatever the ranks");

  const stray = orderAlignmentItems({
    graphs: { main: { about: "declared" } },
    nodes: [
      { id: "example.test/main/a", slug: "a", graph: "main", stage: "ruling", rank: 1 },
      { id: "example.test/other/b", slug: "b", graph: "other", stage: "ruling", rank: 1 },
    ],
  });
  assert.deepEqual(stray.graphs.map((g) => g.graph), ["main", "other"]);
  assert.equal(stray.graphs[1].about, null);
  assert.deepEqual(stray.items.map((n) => n.slug), ["a", "b"]);
});

test("--alignment lays the page out in one flat ruling order, the graph a label on each rail row, and leaves out a node with no stage", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, TWO_GRAPHS);
  // The pagehead is gone: it liquidated without a disposition, on the
  // author's ruling of 2026-09-03 (commons.systems/disposition-graph/alignment-page).
  assert.ok(!html.includes("the graph the manifest names first"), "no per-graph about line");
  assert.ok(!html.includes('class="pagehead"'), "no pagehead");
  assert.ok(!html.includes('<dl class="counts">'), "no stage counts: a stage count instruments no disposition");
  assert.ok(!html.includes("Every node is unanswered until the author confirms it, here or in prose"), "no lede");
  assert.ok(!html.includes('id="graph-first"'), "no per-graph item section remains");
  assert.ok(!html.includes('id="graph-second"'));
  // The graph is a label on the rail row, never a division of the order.
  assert.ok(html.includes("&#183; first</span>") || html.includes("· first</span>"), "the first graph labels its rows");

  const leafA = html.indexOf('data-id="example.test/first/leaf-a"');
  const leafB = html.indexOf('data-id="example.test/first/leaf-b"');
  const root = html.indexOf('data-id="example.test/second/root"');
  // root settles both leaves and so leads the flat order, ahead of the
  // graph the manifest names first (see the cross-graph precedence test
  // below for the property this buys).
  assert.ok(root >= 0 && root < leafA && leafA < leafB);

  const dialogue = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);
  const noStage = nodeBySlug(DIALOGUE_GRAPH, "answered-no-stage");
  assert.equal(noStage.stage, null, "fixture precondition: a node with no stage");
  assert.ok(!dialogue.includes(noStage.question), "the node without a stage is absent from the page");
  assert.ok(!dialogue.includes(`data-id="${noStage.id}"`));
});

test("--alignment orders across graphs by settles, not by the manifest's declaration order: a node of the graph declared second still renders first when it settles more", () => {
  const graph = {
    module: "example.test", ref: null,
    graphs: {
      "declared-first": { about: "declared first in the manifest" },
      "declared-second": { about: "declared second in the manifest" },
    },
    nodes: [
      {
        id: "example.test/declared-first/a", slug: "a", graph: "declared-first", question: "A?",
        form: "rule", under: [], rank: 0.9, status: "unanswered", stage: "ruling", settles: 1,
      },
      {
        id: "example.test/declared-second/b", slug: "b", graph: "declared-second", question: "B?",
        form: "rule", under: [], rank: 0.1, status: "unanswered", stage: "ruling", settles: 5,
      },
    ],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const aAt = html.indexOf('data-id="example.test/declared-first/a"');
  const bAt = html.indexOf('data-id="example.test/declared-second/b"');
  assert.ok(aAt >= 0 && bAt >= 0);
  assert.ok(bAt < aAt, "the graph declared second settles the most and renders first, ahead of the graph declared first");
});

test("--alignment heads each item with its id, graph label, settles, options, rank, class and parents, with the stage chip trailing on its own lead line", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = nodeBySlug(ALIGNMENT_GRAPH, "child-ruling");
  const article = itemHtml(html, ruling.id);
  assert.ok(article.includes(`>${ruling.id}<`), "the id is printed");
  assert.equal(typeof ruling.settles, "number", "fixture precondition: readGraph computed a settles count");
  assert.ok(article.includes(`class="meta mono num">settles ${ruling.settles}<`), "settles, right before rank");
  assert.ok(article.includes(`<span class="meta mono">${ruling.graph}</span>`), "the item's graph, as a label");
  // The stage pill became a chip carrying the two routes into the dialogue
  // (renderStageChip), still pulled out of the eyebrow onto its own
  // `.stagelead` line in the asking column
  // (commons.systems/disposition-graph/alignment-page): the eyebrow runs
  // graph, settles, rank, class, parents start to finish, and the chip
  // trails the whole of it. There is no stamp: the class is derived, and the
  // eyebrow names it and nothing else about authority.
  const graphAt = article.indexOf(`<span class="meta mono">${ruling.graph}</span>`);
  const settlesAt = article.indexOf(`settles ${ruling.settles}`);
  const rankAt = article.indexOf(`rank ${ruling.rank.toFixed(4)}`);
  const classAt = article.indexOf('<span class="meta mono">unanswered');
  const parentsAt = article.indexOf("under example.test/main/root");
  const stageAt = article.indexOf('class="chip stage-ruling"');
  assert.ok(
    graphAt >= 0 && graphAt < settlesAt && settlesAt < rankAt && rankAt < classAt && classAt < parentsAt && parentsAt < stageAt,
    "the eyebrow leads with the graph label, then settles, then rank, then the class and parents, and the stage chip trails outside it",
  );
  assert.ok(article.includes('class="chip stage-ruling"'), "the stage chip");
  assert.ok(article.includes('class="chipname">ruling<'), "the chip names the stage");
  assert.equal(ruling.class, "unanswered", "fixture precondition: no ruling on its own answer, and none on its authority fact either");
  assert.ok(article.includes("under example.test/main/root"), "the parents from under");
  assert.ok(!html.includes("no stamp") && !html.includes("Fixture Author"), "no stamp is named anywhere on the page");

  const open = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned").id);
  assert.ok(open.includes('<span class="meta mono">unanswered'), "a node no ruling reaches says so");
});

// renderStageChip's two routes into the dialogue -- the launch link and the
// per-node copy button -- must never claim to do the same thing and carry
// different text (commons.systems/disposition-graph/ruling-transport).
// alignInstruction, sessionSeed and sessionRepo are project.mjs's own,
// unexported, so the expected values are derived here rather than imported,
// and the two routes are checked against each other -- the href's own
// decoded `prompt` param against the copy button's payload -- rather than
// against two hand-written literals that could drift from each other and
// still both "look right".
test("the stage chip carries both routes, and they agree", () => {
  const graph = {
    module: "example.test", ref: null, graphs: { main: { about: "fixture" } },
    nodes: [{
      id: "example.test/main/chip", slug: "chip", question: "Chip?", graph: "main", stage: "ruling",
      under: [], rank: 1, status: "unanswered",
      shims: [{
        artifact: "The session launcher opens https://claude.ai/code?repositories=fixture-owner/fixture-repo",
        for: "the launch control",
        liquidation: "never",
        declared: "2026-09-04",
      }],
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const article = itemHtml(html, "example.test/main/chip");

  const hrefMatch = article.match(/<a class="chipbtn stub" href="([^"]*)"/);
  assert.ok(hrefMatch, "the chip carries a launch anchor");
  const href = hrefMatch[1].replace(/&amp;/g, "&");

  const copyMatch = article.match(/<button type="button" class="chipbtn" data-copy="([^"]*)"/);
  assert.ok(copyMatch, "the chip carries a copy button");
  const copyPayload = copyMatch[1];

  assert.equal(copyPayload, "/align example.test/main/chip", "the copy payload is alignInstruction(node.id)");

  const url = new URL(href);
  assert.equal(url.origin + url.pathname, "https://claude.ai/code", "the launch link seeds a Claude Code session");
  assert.equal(url.searchParams.get("prompt"), copyPayload, "the link's own prompt param is the same string the copy button carries");
  assert.equal(url.searchParams.get("repositories"), "fixture-owner/fixture-repo", "seeded with the repo the fixture's shim declares");
});

test("--alignment carries the author's words, the node as it stands, and the no-answer line", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = nodeBySlug(ALIGNMENT_GRAPH, "child-ruling");
  const unaligned = nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned");

  // The node as it would stand is the right-hand column's whole content; the
  // author's words and the account are drill-downs in the asking column
  // beside it. The assertions below read the item as a whole, so they hold
  // either way -- the test that pins which column each lands in is the one
  // named for that.
  const rulingItem = itemHtml(html, ruling.id);
  assert.ok(rulingItem.includes("The author's words"));
  assert.ok(rulingItem.includes("The node as it would stand"));
  assert.ok(rulingItem.includes(ruling.answer), "the current answer text");
  assert.ok(rulingItem.includes(ruling.rationale), "the rationale text");
  assert.ok(rulingItem.includes("The AI's account"));
  assert.ok(rulingItem.includes(ruling.account), "the account text");
  assert.ok(rulingItem.includes('<aside class="col-pane">'), "the pane is its own column");
  assert.ok(rulingItem.includes('<div class="col-ask">'), "and the decisions are the other");

  const unalignedItem = itemHtml(html, unaligned.id);
  assert.equal(unaligned.answer, null, "fixture precondition: no answer");
  assert.ok(unalignedItem.includes("The node as it would stand"), "the section is still there");
  assert.ok(
    unalignedItem.includes("No answer yet: this node is the author's disposition awaiting its answer."),
    "with the no-answer line in place of an answer",
  );
  assert.ok(
    unalignedItem.includes("No answer is drafted yet"),
    "and the caption that says there is nothing yet to confirm",
  );
});

test("--alignment gives the asking column the apparatus and the pane only the disposition", () => {
  // A node whose ruling makes something decidable (a child under it, staged)
  // so askIndications renders, alongside the decisions, the whole-node
  // control and the review -- everything the ruling asks -- while the pane
  // holds nothing but the node itself
  // (commons.systems/disposition-graph/alignment-page).
  const graph = {
    module: "example.test", ref: null,
    graphs: { main: { about: "fixture" } },
    nodes: [
      {
        id: "example.test/main/parent", slug: "parent", graph: "main", question: "Which of these stands?",
        form: "rule", under: [], rank: 1, status: "unanswered", stage: "ruling",
        authority: { class: "deferred", by: "claude", date: "2026-09-03" },
        answer: "The standing answer.",
        alternatives: [{ name: "alt-a", source: "author", ref: "2026-09-01" }],
        alternativesText: { "alt-a": "Take the alternative path." },
      },
      {
        id: "example.test/main/child", slug: "child", graph: "main", question: "What follows the parent?",
        form: "target", under: ["example.test/main/parent"], rank: 0.5, status: "unanswered", stage: "maieutic",
      },
    ],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const article = itemHtml(html, "example.test/main/parent");

  const paneAt = article.indexOf('<aside class="col-pane">');
  assert.ok(paneAt > 0, "the pane is present");
  const ask = article.slice(0, paneAt);
  const pane = article.slice(paneAt);

  assert.ok(pane.includes('class="stands"'), "the pane carries the rendered disposition");
  for (const marker of ['class="indications"', "data-controls", 'class="caption"', 'class="rev"', "data-option"]) {
    assert.ok(!pane.includes(marker), `the pane never carries ${marker}`);
  }
  for (const marker of ['class="stagelead"', 'class="decisions"', "data-controls", 'class="indications"', 'class="rev"']) {
    assert.ok(ask.includes(marker), `the asking column carries ${marker}`);
  }
});

test("--alignment shows the fence, the changed frontmatter field, and a word-level ins/del diff", async () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);
  const fenced = nodeBySlug(DIALOGUE_GRAPH, "ruling-node");
  assert.ok(fenced.fence, "fixture precondition: the node carries a '## Recommendation' fence");
  const article = itemHtml(html, fenced.id);

  assert.ok(article.includes("The node as it would stand"), "the pane's label");
  assert.ok(article.includes("Yes: a fence holds a whole proposed node"), "the recommended text's answer, rendered as prose");
  // The edit's own label names what it diffs against rather than implying
  // the base it diffs from has standing: no ruling stands on ruling-node's
  // answer, so its edit is against an unconfirmed draft.
  assert.ok(article.includes("The edit, against a draft no one has confirmed"), "the edit's label");
  assert.ok(article.includes("The node it would leave"), "and the whole beneath the edit");

  // the frontmatter half: this fence changes nothing in the frontmatter, so
  // the pane says so rather than printing an empty list.
  assert.ok(article.includes("No frontmatter field changes."));
  assert.ok(!article.includes("<code>stage</code>"), "the dialogue's own keys are not part of the edit");
  assert.ok(!article.includes("<code>facts</code>"), "facts least of all: a fence may not carry them");
  assert.ok(!article.includes("<code>review</code>"));
  assert.ok(!article.includes("<code>depends</code>"));
  assert.ok(!article.includes("<code>authority</code>"), "and there is no authority key left to move");

  // the word-level half
  assert.ok(/<del>[^<]*Not[^<]*<\/del>/.test(article), "a deletion is marked up");
  assert.ok(/<ins>[^<]*Yes:[^<]*<\/ins>/.test(article), "an insertion is marked up");
  assert.ok(article.includes("Confirming ratifies the recommended text as the node."), "the edit's caption");
  assert.ok(article.includes("Denying leaves the earlier draft, which no one has confirmed either."));

  // A fence that does move a frontmatter field prints it old -> new, in the
  // reader's own key order.
  const doctrine = await readGraph(resolve(HERE, "fixtures/valid-draft-old-doctrine"));
  const moved = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, doctrine), nodeBySlug(doctrine, "ruling-node").id);
  assert.ok(moved.includes("<code>form</code>"), "the changed field is named");
  assert.ok(moved.includes('<span class="was">rule</span>') && moved.includes('<span class="now">disposition</span>'));
  assert.ok(moved.includes("<code>under</code>") && moved.includes('<span class="now">[example.test/main/nowhere]</span>'));
  assert.ok(moved.includes("<code>tier</code>") && moved.includes('<span class="was">none</span>'));

  // A node with no fence gets no edit and no edit caption. review-node's
  // answer carries no ruling, so its pane leads with the whole, and its
  // caption says a confirmation would ratify the AI's own draft.
  const plain = itemHtml(html, nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(!plain.includes("The edit,"));
  assert.ok(!plain.includes("Confirming ratifies the recommended text as the node."));
  assert.ok(
    plain.includes("Confirming ratifies the AI's draft as this node's answer. No one has confirmed it yet, and no ruling on its answer stands behind it."),
    "a node with an answer but no ruling on it says confirming would ratify the AI's own draft",
  );
});

test("frontmatterEdits compares a field as a whole and ignores the dialogue's own keys", () => {
  const node = {
    form: "rule",
    instrument: { kind: "check", ref: "node --test x.mjs", note: null },
    under: ["x/y/z"],
    defines: [],
    stage: "ruling",
    facts: [{ name: "answer", options: [{ name: "standing" }] }],
    review: { verdict: "forward", strength: "none", date: "2026-09-03", of: "a" },
    depends: [{ id: "x/y/w", option: null }],
  };
  const fence = {
    frontmatter: {
      form: "rule",
      instrument: { ref: "node --test x.mjs", note: null, kind: "check" },
      under: ["x/y/z"],
      defines: ["a term"],
    },
  };
  const edits = frontmatterEdits(node, fence);
  assert.deepEqual(
    edits.map((e) => e.field),
    ["defines"],
    "the same instrument written in another key order is not an edit, and the dialogue's keys never are",
  );
  assert.equal(edits[0].before, "none", "an empty list reads as none");
  assert.equal(edits[0].after, "[a term]");

  const reinstrumented = frontmatterEdits(node, {
    frontmatter: { ...fence.frontmatter, instrument: { kind: "assessment", ref: "the author reads it", note: null } },
  });
  assert.deepEqual(reinstrumented.map((e) => e.field), ["instrument", "defines"]);
  assert.equal(reinstrumented[0].before, "{kind: check, ref: node --test x.mjs}");
  assert.equal(reinstrumented[0].after, "{kind: assessment, ref: the author reads it}");

  // `bears` replaces the reading's old `relation` among the fields the edit
  // compares, since a reading's fence may move what it bears on.
  const reading = { form: "reading", source: "A tradition", bears: [{ node: "x/y/z", fact: "answer", option: "standing", relation: "adopted" }] };
  const moved = frontmatterEdits(reading, {
    frontmatter: { form: "reading", source: "A tradition", bears: [{ node: "x/y/z", fact: "answer", option: "standing", relation: "diverged" }] },
  });
  assert.deepEqual(moved.map((e) => e.field), ["bears"]);
});

test("wordDiff matches off the shared head and tail, and returns null past the token cap", () => {
  const ops = wordDiff("the record is the answer", "the record is the draft");
  assert.deepEqual(
    ops.map((o) => `${o.op}:${o.tok.t}`),
    ["same:the", "same:record", "same:is", "same:the", "del:answer", "ins:draft"],
  );
  assert.equal(wordDiff("one two", "one three", 1), null, "over the cap on either side");

  // the page prints the fallback rather than a diff
  const long = new Array(60).fill("word").join(" ");
  const answerFact = {
    name: "answer", stands: "standing", recommends: "bolder", boldness: "moderate", ruled: null, moved: false, prose: "",
    options: [{ name: "standing", source: "ai", ref: "2026-09-04", ruling: null, prose: "", readings: [] },
      { name: "bolder", source: "ai", ref: "2026-09-05", ruling: null, prose: "", readings: [] }],
  };
  const graph = {
    module: "example.test", ref: null, graphs: { main: { about: "fixture" } },
    nodes: [{
      id: "example.test/main/long", slug: "long", question: "Long?", graph: "main", stage: "ruling",
      under: [], rank: 1, status: "unanswered", class: "unanswered", classSource: null, answer: long, rationale: null,
      facts: [answerFact], answerFact,
      fence: { frontmatter: {}, sections: { Answer: `${long} more`, Rationale: null } },
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(html.includes("<ins>"), "60 tokens is well under the 4000-token cap");
  assert.ok(!/too long to diff/i.test(html));
});

test("--alignment makes the node's facts its decisions, the answer first, with its options as the choices", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const fresh = nodeBySlug(graph, "fresh-node");
  const article = itemHtml(html, fresh.id);

  assert.ok(article.includes("What this ruling asks"), "the decisions' label");
  assert.ok(article.includes('data-decision="answer"'), "the answer fact is a decision");
  assert.ok(article.includes('data-decision="authority"'), "and so is every reserved fact");
  assert.ok(article.indexOf('data-decision="answer"') < article.indexOf('data-decision="authority"'), "the answer comes first");
  assert.ok(article.includes(fresh.question), "the answer decision is labelled with the node's own question");

  // the option whose text stands leads the choices
  const standingAt = article.indexOf('value="standing"');
  assert.ok(standingAt >= 0, "the option that stands is a choice");
  for (const name of ["split-the-node", "follow-the-instrument"]) {
    assert.ok(article.includes(`value="${name}"`), `${name} is a choice`);
    assert.ok(standingAt < article.indexOf(`value="${name}"`), "the option that stands leads");
  }
  assert.ok(article.includes('<span class="pill alt-src">review</span>'), "each option's source");
  assert.ok(article.includes('<span class="pill alt-src">node --test packages/disposition/read.test.mjs</span>'), "an instrument names itself as the source");
  assert.ok(article.includes('<span class="pill alt-ref mono">2026-09-02</span>'), "and its ref");
  // the prose leads the row directly -- not folded into a drill-down --
  // since every option here is short enough to show in full
  // (commons.systems/disposition-graph/alignment-page, public/agency)
  assert.ok(article.includes('<span class="choicesays">'), "the choice leads with what it would answer");
  assert.ok(article.includes("the question is two questions"), "the prose of an option");
  assert.ok(article.includes("contradicts the standing answer"));

  // every decision marks the option its recommendation adopts, so scope the
  // count to the answer's own fieldset
  const answerFs = article.slice(
    article.indexOf('data-decision="answer"'),
    article.indexOf("</fieldset>", article.indexOf('data-decision="answer"')),
  );
  assert.equal(
    answerFs.split("the recommendation adopts this").length - 1, 1,
    "exactly one option of the answer is marked as adopted",
  );
  const adoptedAt = answerFs.indexOf("the recommendation adopts this");
  const splitAt = answerFs.indexOf('value="split-the-node"');
  const followAt = answerFs.indexOf('value="follow-the-instrument"');
  assert.ok(splitAt < adoptedAt && adoptedAt < followAt, "and it is the one the recommendation names");
  assert.ok(answerFs.includes('<span class="pill rec-bold-high">boldness: high</span>'), "the recommendation's boldness rides its own row");
  assert.ok(article.includes('class="choice adopted"'), "the adopted row is marked on its own element too");
  assert.ok(!article.includes('class="divergence"'), "no leaf depends on this fixture's node, so no divergence paragraph");

  // the last row of every decision rejects all of its choices with feedback
  assert.ok(article.includes('value="__reject"'), "a rejection row");
  assert.ok(article.includes("Reject all of these, with feedback"));

  // a decision folds unasked when its boldness is low, the answer fact
  // included: stale-review's only fact recommends at low boldness, so the
  // item asks nothing and says what folded instead.
  const plain = itemHtml(html, nodeBySlug(graph, "stale-review").id);
  assert.ok(!plain.includes('data-decision="answer"'), "a low-boldness answer folds rather than asking");
  assert.ok(plain.includes("Nothing on this node is asked separately"));
  assert.ok(plain.includes("Folded in, low boldness:") && plain.includes("standing"));
});

test("--alignment marks the option the author ruled on, and says when the recommendation has moved since", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const moved = nodeBySlug(graph, "moved");
  assert.equal(moved.proposal, true, "fixture precondition: ratified, and the recommendation has moved");
  const movedItem = itemHtml(html, moved.id);
  assert.ok(movedItem.includes('<span class="pill alt-ruled">confirmed: confirm 2026-09-05</span>'), "the ruling rides the option it was made on");
  assert.ok(movedItem.includes('class="choice adopted ruled"'), "the row carries both marks");
  assert.ok(movedItem.includes("Ruled confirm on <span class=\"mono\">standing</span>, 2026-09-05. The recommendation has moved since."));
  assert.ok(movedItem.includes('<span class="pill rec-moved">moved since its ruling</span>'), "and the whole-node pill says so");

  const ratified = nodeBySlug(graph, "deferred");
  const stable = itemHtml(html, ratified.id);
  assert.ok(!stable.includes("rec-moved"), "a ruling that still pins its recommendation is not flagged");
});

test("a choice row leads with what it would answer, not with its slug", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const fresh = nodeBySlug(graph, "fresh-node");
  const article = itemHtml(html, fresh.id);

  // isolate "split-the-node"'s own <li>, so a match cannot bleed in from a
  // neighbouring choice's row
  const radioAt = article.indexOf('value="split-the-node"');
  const li = article.slice(article.lastIndexOf("<li", radioAt), article.indexOf("</li>", radioAt) + "</li>".length);

  assert.ok(li.includes('<span class="choicesays">'), "the row carries a choicesays span");
  const saysAt = li.indexOf('<span class="choicesays">');
  const nameAt = li.indexOf('<span class="choicename mono handle">split-the-node</span>');
  assert.ok(nameAt > saysAt, "the prose leads; the name -- how a ruling is filed in the record -- follows it");
  assert.ok(
    li.slice(saysAt, nameAt).includes("the question is two questions"),
    "the choicesays span holds the option's own '#### <option>' prose",
  );
});

// The option whose text stands has no `#### ` prose of its own, so its row is
// named for the authority that text actually has: only a ruling on the answer
// fact makes it the author's.
test("the keep-choice is named for the authority the text actually has, not for the class a ruling elsewhere confers", () => {
  const answerFact = (extra) => {
    const f = {
      name: "answer", stands: "standing", recommends: null, boldness: null, prose: "", ruled: null, moved: false,
      options: [
        { name: "standing", source: "ai", ref: "2026-09-03", ruling: null, prose: "", readings: [] },
        { name: "alt-a", source: "author", ref: "2026-09-01", ruling: null, prose: "An option beside the one that stands.", readings: [] },
      ],
      ...extra,
    };
    return f;
  };
  const mk = (slug, cls, fact, answer) => ({
    id: `example.test/main/${slug}`, slug, graph: "main", question: "Which stands?",
    form: "rule", under: [], rank: 1, status: cls === "unanswered" ? "unanswered" : "answered", stage: "ruling",
    class: cls, classSource: cls === "unanswered" ? null : { kind: "ruling" },
    answer, facts: [fact], answerFact: fact,
  });
  const ruledFact = answerFact({
    ruled: "standing",
    options: [
      { name: "standing", source: "author", ref: "2026-09-03", ruling: { response: "confirm", date: "2026-09-03", of: "pin" }, prose: "", readings: [] },
      { name: "alt-a", source: "author", ref: "2026-09-01", ruling: null, prose: "An option beside the one that stands.", readings: [] },
    ],
  });
  const openFact = {
    name: "answer", stands: null, recommends: "alt-c", boldness: "high", prose: "", ruled: null, moved: false,
    options: [{ name: "alt-c", source: "author", ref: "2026-09-01", ruling: null, prose: "An option with nothing standing yet.", readings: [] }],
  };
  const graph = {
    module: "example.test", ref: null,
    graphs: { main: { about: "fixture" } },
    nodes: [
      mk("ratified", "ratified", ruledFact, "The ratified answer."),
      mk("delegated", "delegated", answerFact({}), "The AI's draft answer."),
      { ...mk("open", "unanswered", openFact, null), stage: "maieutic" },
    ],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const ratified = itemHtml(html, "example.test/main/ratified");
  assert.ok(ratified.includes('value="standing"'), "a ratified answer still files its keep choice as its option name");
  assert.ok(ratified.includes('<span class="choicename">keep the answer as ratified</span>'));

  const delegated = itemHtml(html, "example.test/main/delegated");
  assert.ok(delegated.includes('<span class="choicename">keep the AI\'s draft as it is</span>'),
    "a class conferred on the authority fact is not a ruling on this answer");
  assert.ok(!delegated.includes("the node as it stands"), "a class is never called out as though the text stood");

  const open = itemHtml(html, "example.test/main/open");
  assert.ok(!open.includes('value="standing"'), "nothing stands here to keep, so no standing radio renders at all");
  assert.ok(open.includes('value="alt-c"'), "and the options on the table are still asked");
});

test("the caption never claims nothing else is proposed while options are pending", () => {
  const fact = (options, stands) => ({
    name: "answer", stands, recommends: null, boldness: null, prose: "", ruled: null, moved: false, options,
  });
  const opt = (name) => ({ name, source: "author", ref: "2026-09-01", ruling: null, prose: `Take path ${name}.`, readings: [] });
  const standing = { name: "standing", source: "ai", ref: "2026-09-01", ruling: null, prose: "", readings: [] };
  const mk = (slug, question, f, answer) => ({
    id: `example.test/main/${slug}`, slug, graph: "main", question,
    form: "rule", under: [], rank: 1, status: "unanswered", stage: "ruling",
    class: "unanswered", classSource: null, answer, facts: [f], answerFact: f,
  });
  const graph = {
    module: "example.test", ref: null,
    graphs: { main: { about: "fixture" } },
    nodes: [
      mk("pending", "Which of these?", fact([standing, opt("alt-a"), opt("alt-b")], "standing"), "The standing answer."),
      mk("settled", "Anything else on the table?", fact([standing], "standing"), "The only answer on the table."),
    ],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const pending = itemHtml(html, "example.test/main/pending");
  const pendingCaption = pending.slice(pending.indexOf('<p class="caption">'), pending.indexOf("</p>", pending.indexOf('<p class="caption">')));
  assert.ok(!pendingCaption.includes("Nothing else is proposed"), "options are pending, so nothing else is not true");
  assert.ok(!pendingCaption.includes("as it stands"), "and the caption never claims the node simply stands");
  assert.ok(pendingCaption.includes("2 other options are pending on this node."), "it reports the count instead");

  const settled = itemHtml(html, "example.test/main/settled");
  const settledCaption = settled.slice(settled.indexOf('<p class="caption">'), settled.indexOf("</p>", settled.indexOf('<p class="caption">')));
  assert.ok(settledCaption.includes("Nothing else is proposed"), "with nothing pending, the caption says so");
});

test("--alignment's eyebrow carries the pending-option count right after settles, plural or singular, and omits it for a node with none", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const fresh = nodeBySlug(graph, "fresh-node");
  assert.equal(fresh.answerFact.options.length, 3, "fixture precondition: three answers on the table, one of them standing");
  const freshArticle = itemHtml(html, fresh.id);
  assert.ok(freshArticle.includes('<span class="meta mono num">2 options pending</span>'), "plural, counting all but the one that stands");
  const settlesAt = freshArticle.indexOf(`settles ${fresh.settles}`);
  const optsAt = freshArticle.indexOf("2 options pending");
  const rankAt = freshArticle.indexOf(`rank ${fresh.rank.toFixed(4)}`);
  assert.ok(settlesAt >= 0 && settlesAt < optsAt && optsAt < rankAt, "right after settles, before rank");

  const stale = nodeBySlug(graph, "stale-review");
  assert.equal(stale.answerFact.options.length, 1, "fixture precondition: only the option that stands");
  const staleArticle = itemHtml(html, stale.id);
  assert.ok(!staleArticle.includes("options pending"), "nothing rendered for a node with none");

  // valid-rulings' delegated node is off the alignment frontier by design,
  // so it is staged here to be rendered at all.
  const rulings = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const one = nodeBySlug(rulings, "delegated");
  assert.equal(one.answerFact.options.length, 2);
  const oneArticle = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, stage(rulings, one.id)), one.id);
  assert.ok(oneArticle.includes('<span class="meta mono num">1 option pending</span>'), "singular");
});

test("--alignment inverts a divergence onto the ancestor's options: what a ruling for each keeps and discards", () => {
  const opt = (name, prose) => ({ name, source: "author", ref: "2026-09-01", ruling: null, prose, readings: [] });
  const answerFact = {
    name: "answer", stands: "standing", recommends: null, boldness: null, prose: "", ruled: null, moved: false,
    options: [
      { name: "standing", source: "ai", ref: "2026-09-01", ruling: null, prose: "", readings: [] },
      opt("alt-a", "Take path A."),
      opt("alt-b", "Take path B."),
      opt("alt-c", "Take path C, which nothing stands under."),
    ],
  };
  const leaf = (slug, question, option) => ({
    id: `example.test/main/${slug}`, slug, graph: "main", question,
    form: "target", under: [], rank: 0.1, status: "unanswered", stage: "maieutic",
    class: "unanswered", classSource: null, facts: [], answerFact: null,
    depends: [{ id: "example.test/main/anc", option }],
  });
  const graph = {
    module: "example.test", ref: null,
    graphs: { main: { about: "fixture" } },
    nodes: [
      {
        id: "example.test/main/anc", slug: "anc", graph: "main", question: "Which option should the author take?",
        form: "rule", class: "unanswered", classSource: null,
        under: [], rank: 1, status: "unanswered", stage: "ruling", settles: 2,
        facts: [answerFact], answerFact, answer: "The standing answer.",
      },
      leaf("leaf-a", "What follows under A?", "alt-a"),
      leaf("leaf-b", "What follows under B?", "alt-b"),
      leaf("leaf-open", "What is still just waiting on the open question?", null),
    ],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const article = itemHtml(html, "example.test/main/anc");

  const altAAt = article.indexOf('value="alt-a"');
  const altBAt = article.indexOf('value="alt-b"');
  const altCAt = article.indexOf('value="alt-c"');
  assert.ok(altAAt >= 0 && altAAt < altBAt && altBAt < altCAt, "the three options, in the list's own order");
  const blockA = article.slice(altAAt, altBAt);
  const blockB = article.slice(altBAt, altCAt);
  const blockC = article.slice(altCAt);

  assert.ok(
    blockA.includes('<p class="divergence">A ruling for this keeps: <em>example.test/main/leaf-a</em>. It discards: <em>example.test/main/leaf-b</em>.</p>'),
    "alt-a keeps its own leaf and discards the leaf standing under the sibling option",
  );
  assert.ok(!blockA.includes("leaf-open"), "an unqualified depends entry is neither kept nor discarded by any option");

  assert.ok(
    blockB.includes('<p class="divergence">A ruling for this keeps: <em>example.test/main/leaf-b</em>. It discards: <em>example.test/main/leaf-a</em>.</p>'),
    "and the inversion holds symmetrically for alt-b",
  );

  assert.ok(
    blockC.includes('<p class="divergence">A ruling for this keeps nothing recorded.</p>'),
    "alt-c has no leaf of its own, but the paragraph still renders since a sibling option does",
  );
  assert.ok(!blockC.includes("It discards"), "nothing to discard when nothing is kept");
});

test("--alignment carries the readings that bear on an option into that option's drill-down", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const delegated = nodeBySlug(graph, "delegated");
  const html = buildAlignment(ALIGNMENT_TEMPLATE, stage(graph, delegated.id));
  const article = itemHtml(html, delegated.id);
  const narrowerAt = article.indexOf('value="narrower"');
  const li = article.slice(article.lastIndexOf("<li", narrowerAt), article.indexOf("</li>", narrowerAt) + 5);
  assert.ok(li.includes('<ul class="optreadings">'), "the readings ride the option they bear on");
  assert.ok(li.includes('<span class="badge diverged">diverged</span>'));
  assert.ok(li.includes("example.test/main/reading-diverged"));

  const standingAt = article.indexOf('value="standing"');
  const standingLi = article.slice(article.lastIndexOf("<li", standingAt), article.indexOf("</li>", standingAt) + 5);
  assert.ok(!standingLi.includes("optreadings"), "and never onto an option no reading names");
});

test("--alignment asks the prune as the existence fact, not as an answer option or a caption", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const prune = nodeBySlug(graph, "prune-node");
  assert.deepEqual(prune.answerFact.options.map((o) => o.name), ["standing"],
    "fixture precondition: no answer option proposes the deletion");
  assert.equal(prune.facts.find((f) => f.name === "existence").recommends, "prune",
    "fixture precondition: the existence fact proposes it");
  assert.equal(prune.fence, null, "fixture precondition: recommending the option that stands quotes no fence");
  const article = itemHtml(html, prune.id);

  assert.ok(article.includes('data-decision="existence"'), "the prune is a decision of its own");
  // FACT_QUESTIONS names the existence fact by the question it asks, not by
  // a category; it happens to read the same as this fixture's own question,
  // since here the node's whole business is whether it should exist.
  assert.ok(article.includes("Is this node worth keeping at all?"), "labelled in the words the author reads it by");
  const existenceFs = article.slice(
    article.indexOf('data-decision="existence"'),
    article.indexOf("</fieldset>", article.indexOf('data-decision="existence"')),
  );
  assert.ok(existenceFs.includes('value="keep"') && existenceFs.includes('value="prune"'), "both options");
  assert.ok(existenceFs.includes("the recommendation adopts this"), "with the recommended one marked");
  assert.ok(existenceFs.includes("Nothing here survives as a node of its own"), "the fact's prose under its legend");
  assert.ok(!article.includes("Confirm prunes the node"), "and no caption of its own");
  assert.ok(!article.includes("The edit"), "no edit, since the recommendation adopts the option that stands");
  assert.ok(
    article.includes("Confirming ratifies the AI's draft as this node's answer. No one has confirmed it yet, and no ruling on its answer stands behind it."),
    "the pane's caption for a standing recommendation, worded for a draft nobody has confirmed",
  );

  const fresh = itemHtml(html, nodeBySlug(graph, "fresh-node").id);
  assert.ok(!fresh.includes('data-decision="existence"'), "a node nobody proposes to delete asks no existence decision");
  assert.ok(fresh.includes("Confirming ratifies the recommended text as the node."));
});

test("--alignment shows what the answer fact recommends, and pills a ruling whose recommendation has moved", async () => {
  const rulings = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, rulings);

  const moved = nodeBySlug(rulings, "moved");
  assert.equal(moved.moved, true, "fixture precondition: the ruling pins a recommendation that has changed");
  const movedItem = itemHtml(html, moved.id);
  assert.ok(movedItem.includes("adopts: standing"), "adopts is shown even for the option that stands");
  assert.ok(movedItem.includes("boldness: high"));
  assert.ok(!movedItem.includes("class: delegated"), "the recommendation carries no class: it is the authority fact");
  assert.ok(movedItem.includes("moved since its ruling"), "the moved pill");

  const options = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const fresh = nodeBySlug(options, "fresh-node");
  assert.equal(fresh.moved, false, "fixture precondition: nothing ruled here, so nothing moved");
  const freshItem = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, options), fresh.id);
  assert.ok(freshItem.includes("adopts: split-the-node"));
  assert.ok(!freshItem.includes("moved since its ruling"));
});

test("--alignment says when the author's ruling diverged from the recommendation", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const diverges = nodeBySlug(graph, "diverges");
  assert.equal(diverges.divergesFromRecommendation, true, "fixture precondition: the author ruled against the recommendation");
  // valid-rulings' diverging node carries no stage, so it is not on the
  // alignment page; the pill is rendered from the same node data all the
  // same, which is what renderRecommendation is asked for here.
  const item = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, stage(graph, diverges.id)), diverges.id);
  assert.ok(item.includes("the ruling diverges from this"), "the divergence pill sits on the recommendation it diverges from");
  assert.ok(item.includes('<span class="pill alt-ruled">confirmed: edit 2026-09-05</span>'), "and the confirmed option carries the author's own response");
});

test("--alignment renders the recommendation's pills and persistence line, or says there is none", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = nodeBySlug(ALIGNMENT_GRAPH, "child-ruling");
  const article = itemHtml(html, ruling.id);
  assert.ok(article.includes("adopts: "), "what it adopts");
  assert.ok(!article.includes("class: ratified"), "no class pill: the class is the authority fact");
  assert.ok(article.includes("What class would a confirmation confer?"), "which the decisions carry instead, in FACT_QUESTIONS' own words");
  assert.ok(article.includes("boldness: moderate"), "the boldness pill");
  assert.ok(article.includes("Persistence: standing, with 1 shim:"), "the shim count");
  assert.ok(article.includes("this fixture's ruling stage"), "each shim's artifact");

  const plain = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned").id);
  assert.ok(plain.includes("No recommendation yet."));

  const delegated = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH), nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(delegated.includes("boldness: high"));
  assert.ok(delegated.includes("Persistence: standing."), "no shims, so the bare line");
});

test("--alignment renders the review's pills, marks a stale one, and says when there is no review", async () => {
  const options = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const stale = nodeBySlug(options, "stale-review");
  assert.equal(stale.reviewStale, true, "fixture precondition: the recommendation moved since the review");
  const staleItem = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, options), stale.id);
  assert.ok(staleItem.includes("The review"));
  assert.ok(staleItem.includes(">forwarded<"), "the verdict reads as a word, not the field's value");
  assert.ok(staleItem.includes("counter-argument: weak"));
  assert.ok(staleItem.includes(">2026-09-03<"));
  assert.ok(staleItem.includes("changed since its review"), "the staleness warning");

  const html = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);
  const fresh = nodeBySlug(DIALOGUE_GRAPH, "ruling-node");
  assert.equal(fresh.reviewStale, false, "fixture precondition: the review pins this recommendation");
  const freshItem = itemHtml(html, fresh.id);
  assert.ok(freshItem.includes(">forwarded<") && freshItem.includes("counter-argument: strong"));
  assert.ok(!freshItem.includes("changed since its review"), "no warning on a current review");

  const unreviewed = itemHtml(html, nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(unreviewed.includes("Not yet reviewed."));
});

test("--alignment offers the three responses on every item, with the stage's hint and no placeholder on the whole-node control", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  for (const label of ["Confirm", "Confirm with edits", "Deny with feedback"]) {
    assert.ok(html.includes(`>${label}</span>`), `the choice "${label}" is offered`);
  }
  for (const value of ["confirm", "edit", "deny"]) {
    assert.ok(html.includes(`value="${value}"`), `the ruling value "${value}" is written on the control`);
  }
  assert.ok(html.includes('data-note-label="A note (optional)"'));
  assert.ok(html.includes('data-note-label="Your edits"'));
  assert.ok(html.includes('data-note-label="Your feedback"'));
  // WORDS_PLACEHOLDER is retired along with ASK_LEGEND and AHEAD_NOTE: the
  // whole-node control's textarea carries no placeholder at any stage, early
  // ones included. LOCKED_NOTE, beneath the stage chip, is what an
  // early-stage item says instead (the author's ruling of 2026-09-04: a
  // confirmation recorded before the ruling stage is invalid).
  assert.ok(!html.includes('placeholder="Your words'), "the retired words placeholder is gone");

  const periagogic = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned").id);
  assert.ok(periagogic.includes("The dialogue owes your account of the ground first; your words here are recorded verbatim."));

  const ruling = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-ruling").id);
  assert.ok(!ruling.includes("In review."), "the ruling stage carries no hint beyond the edit's caption");
  assert.ok(!ruling.includes("The answer is not yet drafted"));
  assert.ok(!ruling.includes("The dialogue owes your account"));

  const dialogue = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);
  const inReview = itemHtml(dialogue, nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(inReview.includes("In review. A confirmation given now is held until the review forwards the draft."));
  assert.ok(inReview.includes('name="opt:example.test:main:review-node"'), "a review item still takes a response");

  const maieutic = {
    module: "example.test", ref: null, graphs: { main: { about: "fixture" } },
    nodes: [{
      id: "example.test/main/m", slug: "m", question: "Drawn out?", graph: "main", stage: "maieutic",
      under: [], rank: 1, status: "unanswered", disposition: "The author's words so far.",
    }],
  };
  const maieuticHtml = buildAlignment(ALIGNMENT_TEMPLATE, maieutic);
  assert.ok(maieuticHtml.includes("The answer is not yet drafted; confirming takes the proposal's recommendation."));
});

// A confirmation recorded on a node that has not reached the ruling stage
// is invalid (the author's ruling of 2026-09-04): renderAsk computes
// `locked` off the stage and threads it through every input the asking
// column offers, but the decisions and their choices still render in full
// -- the gate disables input, it never hides what would be asked.
test("the ruling stage gates the inputs, but never hides what they would answer", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);

  // facts-node-changed is periagogic and carries two high-boldness facts, so
  // its decisions render full choice rows -- radios included -- rather than
  // folding into the low-boldness summary line.
  const locked = itemHtml(html, nodeBySlug(DIALOGUE_GRAPH, "facts-node-changed").id);
  const lockedAsk = locked.slice(locked.indexOf('<div class="col-ask">'), locked.indexOf('<aside class="col-pane">'));
  const lockedInputs = lockedAsk.match(/<input type="radio"[^>]*>|<textarea[^>]*>/g) || [];
  assert.ok(lockedInputs.length > 0, "fixture precondition: the locked item asks at least one input");
  for (const tag of lockedInputs) assert.ok(tag.includes(" disabled"), `locked: disabled (${tag})`);
  assert.ok(lockedAsk.includes('class="locked"'), "the locked note is present");
  assert.ok(lockedAsk.includes('class="decisions"'), "the locked item still renders its decisions");
  assert.ok(/class="choice/.test(lockedAsk), "and their choices");

  // ruling-node is at the ruling stage: the one stage a confirmation is
  // valid on, so nothing in its asking column is disabled.
  const ruling = itemHtml(html, nodeBySlug(DIALOGUE_GRAPH, "ruling-node").id);
  const rulingAsk = ruling.slice(ruling.indexOf('<div class="col-ask">'), ruling.indexOf('<aside class="col-pane">'));
  const rulingInputs = rulingAsk.match(/<input type="radio"[^>]*>|<textarea[^>]*>/g) || [];
  assert.ok(rulingInputs.length > 0, "fixture precondition: the ruling item asks at least one input");
  for (const tag of rulingInputs) assert.ok(!tag.includes(" disabled"), `ruling: not disabled (${tag})`);
  assert.ok(!rulingAsk.includes('class="locked"'), "no locked note at the ruling stage");
  assert.ok(rulingAsk.includes('class="decisions"'), "the ruling item renders its decisions too");
});

test("the doc id in --alignment output replaces '/' with ':'", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = nodeBySlug(ALIGNMENT_GRAPH, "child-ruling");
  const doc = ruling.id.replace(/\//g, ":");
  assert.ok(!doc.includes("/"));
  assert.ok(html.includes(`data-doc="${doc}"`));
  assert.ok(html.includes(`id="item-${doc}"`), "the item's anchor id uses the same transform");
  assert.ok(html.includes(`href="#item-${doc}"`), "and so does the rail's link to it");
});

test("a fenced ```markdown block inside an Account is quoted in its own labelled block", () => {
  const graph = {
    module: "example.test", ref: null, graphs: { main: { about: "fixture" } },
    nodes: [{
      id: "example.test/main/d", slug: "d", question: "Drafted?", graph: "main", stage: "ruling",
      under: [], rank: 1, status: "unanswered", answer: "Current answer.",
      account: "Ordinary account prose.\n\n```markdown\n## Answer\n\nA quoted earlier draft.\n```\n\nMore prose after.",
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(html.includes("Quoted in the account; the sections above are the node"));
  assert.ok(html.includes("A quoted earlier draft."));
  assert.ok(html.includes("Ordinary account prose.") && html.includes("More prose after."));
  // the quoted block is preformatted, not parsed as markdown itself
  assert.ok(html.includes("<pre><code>## Answer"));
});

test("--alignment escapes HTML in node content", () => {
  const graph = {
    module: "example.test", ref: null, graphs: { main: { about: "fixture" } },
    nodes: [{
      id: "example.test/main/x", slug: "x", question: "<script>alert(1)</script>", graph: "main", stage: "periagogic",
      under: [], rank: 1, status: "unanswered", disposition: "<img src=x onerror=alert(1)>",
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;script&gt;") && html.includes("&lt;img"));
});

test("--alignment renders a markdown link as plain text", () => {
  const graph = {
    module: "example.test", ref: null, graphs: { main: { about: "fixture" } },
    nodes: [{
      id: "example.test/main/l", slug: "l", question: "Linked?", graph: "main", stage: "maieutic",
      under: [], rank: 1, status: "unanswered", disposition: "See [growth](#commons.systems/disposition-graph/growth) for context.",
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  // Scoped to the item's own article: the stage chip legitimately carries a
  // real <a class="chipbtn stub"> launch anchor (renderStageChip), which
  // must not count against this check and is the item's only other anchor
  // -- the left rail's own <a href="#item-..."> link lives outside the item.
  const article = itemHtml(html, "example.test/main/l");
  assert.ok(article.includes("See growth for context."), "the link renders as its label, no anchor");
  const anchors = article.match(/<a\b[^>]*>/g) || [];
  assert.equal(anchors.length, 1, "the only anchor in the item is the chip's own launch stub");
  assert.ok(anchors[0].includes('class="chipbtn stub"'), "and not one the markdown link produced");
});

test("the alignment header carries the title and the module, and the rail's metrics each name and link the disposition they instrument", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  assert.ok(html.includes(">Alignment<"));
  assert.ok(html.includes(ALIGNMENT_GRAPH.module));
  // The masthead lost its own copy control (btn-copy moved to the footer,
  // relabelled "Copy the instruction"); the staging-footer test covers it.
  assert.ok(html.includes("Widen the node"), "the pane can take the whole screen");

  // The stage counts and the lede are gone: a stage count instruments no
  // disposition, which is the standard the author set on frontier-metrics,
  // and the lede liquidated without one
  // (commons.systems/disposition-graph/alignment-page).
  for (const stage of ["ruling", "review", "maieutic", "periagogic"]) {
    assert.ok(!html.includes(`<dt>${stage}</dt>`), `no raw count for ${stage}`);
  }
  assert.ok(!html.includes("<dt>items</dt>"), "no item total");

  // Four metrics, each a signal of a recorded disposition, in the rail.
  assert.ok(html.includes('<dl class="metrics">'), "the metrics sit at the top of the rail");
  const instruments = [
    ["open", "commons.systems/disposition-graph/unanswered"],
    ["ruleable", "commons.systems/disposition-graph/clean-context-review"],
    ["next settles", "commons.systems/disposition-graph/alignment-order"],
    ["stale", "commons.systems/disposition-graph/frontier-consistency"],
  ];
  for (const [key, of] of instruments) {
    assert.ok(html.includes(`<dt>${key}</dt>`), `the ${key} metric`);
    assert.ok(html.includes(`Instruments ${of}.`), `${key} names the disposition it instruments`);
  }
  assert.equal(html.split('class="metric"').length - 1, 4, "four and no more");

  // With no shim naming the browser there is nowhere to link, and a metric
  // renders unlinked rather than pointing nowhere.
  assert.ok(html.includes('<div class="metric"'), "a div, not an anchor, with no browser shim");
  assert.ok(!html.includes('<a class="metric"'));

  // With one, each metric links out to that disposition's page there: the
  // browser addresses every node by its id and this page addresses none.
  const withBrowser = buildAlignment(ALIGNMENT_TEMPLATE, {
    ...ALIGNMENT_GRAPH,
    nodes: ALIGNMENT_GRAPH.nodes.map((n, i) => (i === 0 ? {
      ...n,
      shims: [{
        artifact: "the graph browser, published as https://example.test/artifact/abc123def",
        for: "the record's documentation",
        liquidation: "published from the implementation ref",
        declared: "2026-09-03",
      }],
    } : n)),
  });
  assert.equal(withBrowser.split('<a class="metric"').length - 1, 4, "all four link");
  for (const [, of] of instruments) {
    assert.ok(
      withBrowser.includes(`href="https://example.test/artifact/abc123def#${of}"`),
      `${of} is addressed by its id in the browser`,
    );
  }
});

test("only the selected node is shown, and the [hidden] rule beats the item's own display", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  // Every item renders hidden; the rail's selection is what shows one
  // (commons.systems/disposition-graph/alignment-page). Counted by the
  // shared "item" class prefix rather than an exact match on the whole
  // attribute, since a bare item (no answer, no draft) now also carries
  // "nostand" (renderAlignmentItem).
  const items = (html.match(/<article class="item(?: nostand)?"/g) || []).length;
  assert.ok(items > 1, "fixture precondition: more than one item");
  assert.equal(html.split('data-stage="').length - 1, items, "one data-stage per item");
  assert.equal((html.match(/<article class="item(?: nostand)?"[^>]*hidden>/g) || []).length, items, "all of them hidden at rest");
  assert.ok(
    /\[hidden\]\s*\{\s*display:\s*none\s*!important/.test(html),
    "and `display: grid` on .item does not beat it",
  );
  assert.ok(html.includes('aria-current="false"'), "the rail marks which one is current");
});

test("the page carries the staging footer at rest and a rail row, with its stage dot, per item", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  assert.ok(html.includes('id="staged-count">0 responses staged<'), "the footer's count, at rest");
  // "Submit" read as starting a session; the button now says what it does --
  // record into this artifact's own record -- and the id and the disabled
  // attribute no longer sit right next to the closing ">": a title attribute
  // comes between them now.
  assert.ok(html.includes('id="btn-submit" disabled'), "the submit button, disabled with nothing staged");
  assert.ok(html.includes(">Record 0 for a session<"), "and its label says what it does");
  // The masthead lost its own copy control; the footer is now the one place
  // that copies the instruction for every staged and recorded response.
  assert.ok(html.includes('id="btn-copy"') && html.includes(">Copy the instruction<"), "the copy-instruction control");
  for (const slug of ["child-unaligned", "child-ruling"]) {
    const n = nodeBySlug(ALIGNMENT_GRAPH, slug);
    const doc = n.id.replace(/\//g, ":");
    assert.ok(html.includes(`data-rail data-doc="${doc}"`), `${slug} has a rail row`);
    assert.ok(html.includes(`<span class="dot stage-${n.stage}"`), `${slug}'s rail row carries its stage dot`);
  }
  assert.ok(html.includes("data-mark"), "the rail row has somewhere to mark a response");
});

test("the alignment template obeys the artifact skeleton and CSP", () => {
  assert.ok(!/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(ALIGNMENT_TEMPLATE), "no skeleton tags");
  assert.ok(ALIGNMENT_TEMPLATE.slice(0, 8192).includes("<title>Alignment</title>"), "title in the first 8KB");
  const hosts = new Set([...ALIGNMENT_TEMPLATE.matchAll(/https?:\/\/([^\/"'\s)]+)/g)].map((m) => m[1]));
  assert.deepEqual([...hosts], ["fonts.googleapis.com"], "the only external host is the font stylesheet");
});

test("the alignment template defines all three theme states with an explicit body background", () => {
  assert.match(ALIGNMENT_TEMPLATE, /:root \{[^}]*--paper:/);
  assert.match(ALIGNMENT_TEMPLATE, /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\)/);
  assert.match(ALIGNMENT_TEMPLATE, /:root\[data-theme="dark"\] \{/);
  assert.match(ALIGNMENT_TEMPLATE, /body \{[\s\S]*?background: var\(--paper\)/);
});

test("the edit's ins/del and each stage's colour are defined in both themes", () => {
  for (const token of ["--ins", "--ins-soft", "--del", "--del-soft", "--stage-ruling", "--stage-periagogic"]) {
    const uses = ALIGNMENT_TEMPLATE.split(`${token}:`).length - 1;
    assert.ok(uses >= 3, `${token} is defined in all three theme blocks (found ${uses})`);
  }
  assert.match(ALIGNMENT_TEMPLATE, /\n  ins \{[^}]*background: var\(--ins-soft\)/);
  assert.match(ALIGNMENT_TEMPLATE, /\n  del \{[^}]*background: var\(--del-soft\)/);
});

test("project({ rootDir }) with no --out still returns the graph --alignment needs", async () => {
  const { out, html, graph } = await project({ rootDir: resolve(HERE, "fixtures/valid-unaligned") });
  assert.equal(out, null);
  assert.equal(html, null);
  assert.ok(Array.isArray(graph.nodes) && graph.nodes.length > 0);
  const alignmentHtml = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(alignmentHtml.includes(graph.module));
});

/* --------------------------------------------- the page's own script */

/* The template's script, like the browser template's, is written so that
   every top-level statement is a declaration and the one call is guarded on
   `document` -- but that call is the boot, so this loader hands it a small
   stand-in DOM instead of no DOM at all. The stand-in throws on any selector
   it does not know, so a script that starts reaching for something new fails
   here rather than silently in the artifact. */
function alStubDom({ items, db }) {
  const storage = {};
  const el = (tag, attrs) => ({
    tag,
    attrs: attrs || {},
    children: [],
    textContent: "",
    value: "",
    checked: false,
    hidden: false,
    disabled: false,
    desc: [],
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    hasAttribute(k) { return k in this.attrs; },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener() {},
    appendChild(c) { this.children.push(c); return c; },
    focus() {},
    scrollIntoView() {},
    classList: { toggle() {} },
    parentNode: null,
    querySelector(sel) { return this.desc.find((n) => alStubMatches(n, sel)) || null; },
    querySelectorAll(sel) { return this.desc.filter((n) => alStubMatches(n, sel)); },
  });

  const built = items.map((spec) => {
    const item = el("article", { "data-item": "", "data-doc": spec.doc, "data-id": spec.id, "data-stage": spec.stage });
    const controls = el("fieldset", { "data-controls": "" });
    const radios = ["confirm", "edit", "deny"].map((v) => Object.assign(
      el("input", { type: "radio", value: v, "data-note-label": `note for ${v}` }),
      { value: v },
    ));
    const note = el("textarea", { "data-field": "text" });
    const label = el("label", { "data-note-lbl": "" });
    // The controls fieldset is the whole-node control's own scope
    // (alControlScope): in the real markup the three radios, the note and
    // its label all nest inside it, so its own `desc` must carry them, or
    // alReadControl/alApplyControl/alSyncNoteLabel -- now scoped to it --
    // find nothing (commons.systems/disposition-graph/alignment-page).
    controls.desc = [...radios, note, label];
    const state = el("p", { "data-state": "" });
    // one decision fieldset, so the per-decision path is exercised too
    // (commons.systems/disposition-graph/unanswered: the three responses
    // are open on a node or on one of the decisions its ruling asks)
    const decision = el("fieldset", { "data-decision": "authority" });
    const decRadios = ["ratified", "delegated", "__reject"].map((v) => Object.assign(
      el("input", { type: "radio", value: v }),
      { value: v },
    ));
    const decNote = el("textarea", { "data-decision-text": "" });
    decision.desc = [...decRadios, decNote];
    decision.radios = decRadios;
    decision.note = decNote;
    item.desc = [...radios, note, label, controls, state, decision];
    item.radios = radios;
    item.note = note;
    item.state = state;
    item.controls = controls;
    item.decision = decision;
    return item;
  });

  const rails = items.map((spec) => {
    const mark = el("span", { "data-mark": "" });
    const a = el("a", { "data-rail": "", "data-doc": spec.doc });
    a.desc = [mark];
    a.mark = mark;
    mark.parentNode = a;
    return a;
  });

  const byId = {
    "module-name": Object.assign(el("span", {}), { textContent: "example.test" }),
    "btn-theme": el("button", {}),
    "btn-copy": el("button", {}),
    "btn-wide": el("button", {}),
    main: el("main", {}),
    "btn-submit": el("button", {}),
    "staged-count": el("span", {}),
    notice: el("p", {}),
    "foot-note": el("span", {}),
  };

  const document = {
    documentElement: { setAttribute() {}, removeAttribute() {} },
    getElementById: (id) => byId[id] || null,
    createElement: (tag) => el(tag, {}),
    // alBoot delegates the per-chip copy control's click handling to the
    // document itself (one listener for every node's [data-copy] button);
    // the stub only has to accept the registration. No test here drives a
    // click through it -- each script function is exercised directly, as
    // with every other handler -- so this stays a no-op, like the same
    // method already on every stub element.
    addEventListener() {},
    querySelector(sel) {
      if (sel === ".shell") return el("div", {});
      throw new Error(`the stand-in DOM does not know the selector ${sel}`);
    },
    querySelectorAll(sel) {
      if (sel === "[data-item]") return built;
      if (sel === "[data-rail]") return rails;
      throw new Error(`the stand-in DOM does not know the selector ${sel}`);
    },
  };
  const window = {
    localStorage: {
      getItem: (k) => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
    },
    setTimeout: () => {},
    addEventListener() {},
    location: { hash: "" },
    history: { replaceState() {} },
    claude: db === undefined ? undefined : { use: async () => db },
  };
  return { document, window, navigator: {}, items: built, rails, byId, storage };
}

function alStubMatches(node, sel) {
  if (sel === 'input[type="radio"]:checked') return node.tag === "input" && node.checked;
  if (sel === '[data-field="text"]') return node.getAttribute("data-field") === "text";
  if (sel.startsWith('input[type="radio"][value=')) {
    const want = sel.match(/value="([^"]*)"/)[1];
    return node.tag === "input" && node.getAttribute("value") === want;
  }
  for (const attr of ["data-note-lbl", "data-state", "data-controls", "data-mark", "data-decision", "data-decision-text"]) {
    if (sel === `[${attr}]`) return node.hasAttribute(attr);
  }
  throw new Error(`the stand-in DOM does not know the selector ${sel}`);
}

async function loadAlignmentScript(env) {
  const m = ALIGNMENT_TEMPLATE.match(/<script>\n([\s\S]*?)\n<\/script>/);
  assert.ok(m, "the alignment template has a plain <script> block");
  const api = "AL alStage alSubmit alCopyAll";
  const fn = new Function("window", "document", "navigator", `${m[1]}\nreturn { ${api.split(" ").join(", ")} };`);
  const loaded = fn(env.window, env.document, env.navigator);
  await new Promise((resolve) => setTimeout(resolve, 0)); // let the boot's awaits settle
  return loaded;
}

// A db stand-in with the one shape the page uses: doc(path).set(data) and
// collection(path).get().docs.
function alStubDb({ failOn } = {}) {
  const docs = new Map();
  return {
    writes: docs,
    doc: (path) => ({
      set: async (data) => {
        if (failOn && path.endsWith(failOn)) throw Object.assign(new Error("the record refused it"), { code: "invalid_argument" });
        docs.set(path, data);
      },
    }),
    collection: (path) => ({
      get: async () => ({
        docs: [...docs.entries()]
          .filter(([k]) => k.startsWith(`${path}/`))
          .map(([k, v]) => ({ id: k.slice(path.length + 1), data: () => v })),
      }),
    }),
  };
}

const SCRIPT_ITEMS = [
  { doc: "example.test:main:a", id: "example.test/main/a", stage: "ruling" },
  { doc: "example.test:main:b", id: "example.test/main/b", stage: "periagogic" },
];

test("the page stages a response locally and submits it as one document per node", async () => {
  const db = alStubDb();
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  const page = await loadAlignmentScript(env);

  const [a, b] = env.items;
  a.radios[0].checked = true;
  a.note.value = "Confirmed, with a note.";
  page.alStage(a);
  b.note.value = "The ground, in my own words.";
  page.alStage(b);

  assert.equal(env.byId["staged-count"].textContent, "2 responses staged");
  assert.equal(env.byId["btn-submit"].textContent, "Record 2 for a session");
  assert.equal(env.byId["btn-submit"].disabled, false);
  assert.deepEqual(Object.keys(JSON.parse(env.storage["alignment-staged:example.test"])), [a.attrs["data-doc"], b.attrs["data-doc"]]);
  assert.equal(env.rails[0].mark.textContent, "●", "the rail marks a staged item");

  await page.alSubmit();

  const written = db.writes.get("responses/example.test:main:a");
  assert.deepEqual(Object.keys(written).sort(), ["decisions", "node", "ruling", "stage", "text", "updated"]);
  assert.equal(written.node, "example.test/main/a");
  assert.equal(written.stage, "ruling");
  assert.equal(written.ruling, "confirm");
  assert.equal(written.text, "Confirmed, with a note.");
  assert.deepEqual(written.decisions, {}, "no decision answered, so the map is empty");
  assert.match(written.updated, /^\d{4}-\d{2}-\d{2}T/);

  const words = db.writes.get("responses/example.test:main:b");
  assert.equal(words.ruling, null, "words with no choice are still a response");
  assert.equal(words.text, "The ground, in my own words.");

  const status = db.writes.get("meta/status");
  assert.deepEqual(Object.keys(status).sort(), ["answered", "at", "total"]);
  assert.equal(status.answered, 2, "the count of documents in responses");
  assert.equal(status.total, 2, "the count of items on the page");

  assert.deepEqual(JSON.parse(env.storage["alignment-staged:example.test"]), {}, "the staged copy is cleared");
  assert.equal(env.byId["staged-count"].textContent, "0 responses staged");
  assert.ok(a.state.textContent.startsWith("Submitted "), "the item says when it was submitted");
  assert.equal(a.controls.disabled, true, "and locks until the author asks to change it");
  assert.equal(env.rails[0].mark.textContent, "✓", "the rail marks a submitted item");
});

test("a response on one of the decisions a ruling asks is staged and submitted beside the node's own", async () => {
  const db = alStubDb();
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  const page = await loadAlignmentScript(env);

  // the author answers one decision and nothing on the node as a whole
  const [a, b] = env.items;
  a.decision.radios[0].checked = true;
  page.alStage(a);
  assert.equal(env.byId["staged-count"].textContent, "1 response staged",
    "a decision alone is a response");

  // and a rejection of every choice on one decision, with feedback
  b.decision.radios[2].checked = true;
  b.decision.note.value = "None of these; here is why.";
  page.alStage(b);

  await page.alSubmit();

  const first = db.writes.get("responses/example.test:main:a");
  assert.equal(first.ruling, null, "the node as a whole was not ruled on");
  assert.deepEqual(first.decisions, {
    authority: { ruling: "confirm", choice: "ratified", text: "" },
  }, "the decision carries its own ruling and the choice confirmed");

  const second = db.writes.get("responses/example.test:main:b");
  assert.deepEqual(second.decisions, {
    authority: { ruling: "deny", choice: null, text: "None of these; here is why." },
  }, "the last row of a decision denies every choice, with feedback");

  // and it reads back onto the page, so a reload does not lose it
  const env2 = alStubDom({ items: SCRIPT_ITEMS, db });
  await loadAlignmentScript(env2);
  assert.equal(env2.items[0].decision.radios[0].checked, true, "the confirmed choice comes back");
  assert.equal(env2.items[1].decision.note.value, "None of these; here is why.", "and the feedback with it");
});

test("a checked decision radio is not read as the whole-node ruling", async () => {
  // alReadControl and alReadDecisions both look for a checked radio inside
  // one item; before alControlScope scoped the whole-node read to
  // `[data-controls]`, an unscoped search returned whichever radio came
  // first in the document, so choosing a decision's own choice was read
  // back and staged as the node's ruling, where confirm/edit/deny was meant.
  const env = alStubDom({ items: SCRIPT_ITEMS, db: null });
  const page = await loadAlignmentScript(env);
  const [a] = env.items;

  a.decision.radios[0].checked = true;
  page.alStage(a);
  let staged = JSON.parse(env.storage["alignment-staged:example.test"])[a.attrs["data-doc"]];
  assert.equal(staged.ruling, null, "a decision's own checked radio is not read back as the node's ruling");
  assert.deepEqual(staged.decisions, {
    authority: { ruling: "confirm", choice: "ratified", text: "" },
  }, "but the decision itself is staged");

  a.radios[0].checked = true;
  page.alStage(a);
  staged = JSON.parse(env.storage["alignment-staged:example.test"])[a.attrs["data-doc"]];
  assert.equal(staged.ruling, "confirm", "the whole-node control's own radio is read as the ruling");
  assert.deepEqual(staged.decisions, {
    authority: { ruling: "confirm", choice: "ratified", text: "" },
  }, "and the decision answer still stands beside it");
});

test("with no db the page keeps responses in this browser and says so on the footer", async () => {
  const env = alStubDom({ items: SCRIPT_ITEMS, db: null });
  const page = await loadAlignmentScript(env);
  assert.equal(env.byId["foot-note"].textContent, "No shared record in this view: responses are kept in this browser only.");

  const [a] = env.items;
  a.radios[2].checked = true;
  a.note.value = "Denied, and here is why.";
  page.alStage(a);
  await page.alSubmit();

  const kept = JSON.parse(env.storage["alignment-responses:example.test"]);
  assert.deepEqual(Object.keys(kept), ["example.test:main:a"]);
  assert.equal(kept["example.test:main:a"].ruling, "deny");
  assert.deepEqual(JSON.parse(env.storage["alignment-staged:example.test"]), {});
});

test("a refused write keeps its staged copy and puts the error's own message on the footer", async () => {
  const db = alStubDb({ failOn: "example.test:main:b" });
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  const page = await loadAlignmentScript(env);

  const [a, b] = env.items;
  a.radios[0].checked = true;
  page.alStage(a);
  b.radios[1].checked = true;
  page.alStage(b);
  await page.alSubmit();

  assert.ok(db.writes.has("responses/example.test:main:a"), "the write that succeeded stands");
  assert.ok(!db.writes.has("responses/example.test:main:b"));
  assert.deepEqual(Object.keys(JSON.parse(env.storage["alignment-staged:example.test"])), ["example.test:main:b"], "the refused one is still staged");
  assert.equal(env.byId["foot-note"].textContent, "the record refused it");
  assert.equal(env.byId["staged-count"].textContent, "1 response staged");
});

test("a node off the ruling stage offers no change affordance over a recorded response", async () => {
  // A response recorded while the node was at the ruling stage, on a node the
  // dialogue has since moved back. Its inputs carry their own `disabled` from
  // the render, and an element's own disabled attribute is never lifted by an
  // ancestor fieldset -- so a "change" button there would open the fieldset
  // and leave every control inert. The page offers none and says why.
  const db = alStubDb();
  await db.doc("responses/example.test:main:b").set({
    node: "example.test/main/b", stage: "ruling", ruling: "confirm", text: "Ruled when it was open.",
    updated: "2026-09-03T09:00:00.000Z",
  });
  await db.doc("responses/example.test:main:a").set({
    node: "example.test/main/a", stage: "ruling", ruling: "confirm", text: "Ruled.",
    updated: "2026-09-03T09:00:00.000Z",
  });
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  await loadAlignmentScript(env);
  const [ruling, locked] = env.items;

  assert.equal(locked.getAttribute("data-stage"), "periagogic", "the fixture's second item is off the ruling stage");
  assert.equal(locked.state.children.length, 0, "no change button is appended on a locked node");
  assert.match(locked.state.textContent, /^Recorded /);
  assert.match(locked.state.textContent, /takes no response here/);
  assert.equal(locked.controls.disabled, true, "and its control stays shut");

  // The ruling-stage item is unaffected: it still offers the change.
  assert.equal(ruling.state.children.length, 1, "the ruling-stage node keeps its change button");
  assert.equal(ruling.state.children[0].getAttribute("data-change"), "");
  assert.ok(ruling.state.textContent.startsWith("Submitted "));
});

test("the page reads back what was submitted before, and copies a digest of both kinds", async () => {
  const db = alStubDb();
  await db.doc("responses/example.test:main:a").set({
    node: "example.test/main/a", stage: "ruling", ruling: "confirm", text: "Earlier.", updated: "2026-09-03T09:00:00.000Z",
  });
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  const page = await loadAlignmentScript(env);

  const [a, b] = env.items;
  assert.equal(a.note.value, "Earlier.", "the submitted response is shown on its item");
  assert.equal(a.radios[0].checked, true);
  assert.ok(a.state.textContent.startsWith("Submitted "));

  b.note.value = "Still thinking.";
  page.alStage(b);

  let copied = null;
  env.navigator.clipboard = { writeText: (t) => { copied = t; return Promise.resolve(); } };
  page.alCopyAll();
  // Recorded reads "(recorded)" and staged reads "(staged, not recorded)";
  // a response with no ruling on the whole names that too, rather than
  // leaving a blank, and its note sits on its own indented line beneath it.
  assert.match(copied, /example\.test\/main\/a \[ruling\] confirm \(recorded\)\n {2}Earlier\./);
  assert.match(copied, /example\.test\/main\/b \[periagogic\] no ruling on the whole \(staged, not recorded\)\n {2}Still thinking\./);
});

// alInstructionAll opens every copy with the bare "/align" line and a
// sentence telling the reader to act on what follows, so the author's paste
// reopens the dialogue and drives it rather than handing back a listing to
// read (the skill's step 0.4). With nothing ruled on yet it still opens the
// dialogue and says so plainly, rather than coming back empty.
test("the copied instruction is an instruction, not a digest", async () => {
  const env = alStubDom({ items: SCRIPT_ITEMS, db: null });
  const page = await loadAlignmentScript(env);
  let copied = null;
  env.navigator.clipboard = { writeText: (t) => { copied = t; return Promise.resolve(); } };

  page.alCopyAll();
  assert.match(copied, /^\/align\n/, "opens with the bare /align line");
  assert.ok(copied.includes("I have ruled on nothing yet on the alignment page"), "and says nothing is ruled on yet");

  const [a] = env.items;
  a.radios[0].checked = true;
  a.note.value = "Confirmed, with a note.";
  page.alStage(a);

  page.alCopyAll();
  assert.match(copied, /^\/align\n/, "still opens with the bare /align line");
  assert.ok(copied.includes(a.attrs["data-id"]), "names the node");
  assert.ok(copied.includes("confirm"), "and the ruling on it");
  assert.ok(
    copied.includes("Act on every response below before anything else"),
    "the preamble instructs the reader to act, not just to read a listing",
  );
});
