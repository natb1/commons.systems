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
// (under, depends) first, then -- only when the node carries at least one
// alternative -- a semicolon clause naming the alternatives count
// "uncounted", since a node's own alternatives are not summed into
// `settles` (deriveSettles).
function settlesBreakdown(node) {
  const s = node.settledBy;
  const alt = s.alternatives > 0 ? `; ${s.alternatives} alternatives, uncounted` : "";
  return `${node.settles} (${s.under} under, ${s.depends} depends${alt})`;
}

/* The template's script is written so that every top-level statement is a
   declaration and the one call is guarded on `document`. That lets the whole
   renderer be loaded here, without a DOM, and called directly. */
function loadRenderer() {
  const m = TEMPLATE.match(/<script>\n([\s\S]*?)\n<\/script>/);
  assert.ok(m, "template has a plain <script> block");
  const api = "esc inline mdHtml mdBlocks groupRejected plain firstSentence termIndex termRegex fmtPct formWord safeHref truncate shimsHtml chooseRoute savePlace loadPlace PLACE_KEY STATUS_WORD STATUS_CLASS pill stampPill unansweredPill draftNoteHtml alternativesHtml factsHtml authorityHtml rowHtml";
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
  assert.ok(
    text.includes(
      `> Projected from ${node.id} (answered: ratified, Fixture Author, 2026-01-01). Generated by packages/disposition/project.mjs --rules; do not edit. If this file conflicts with the graph on the disposition ref, the graph wins.`
    ),
    "carries the exact notice line",
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
    `# Old rule\n> Projected from example.test/main/gone (deferred, x, 2026-01-01). ${staleNotice} If this file conflicts with the graph on the disposition ref, the graph wins.\n\nGone.\n`,
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
        authority: { class: "ratified", by: "Fixture Author", date: "2026-01-01" },
        answer: "Global answer.", status: "answered", stage: null,
      },
      { id: "example.test/main/u", slug: "u", question: "U?", tier: null, authority: null, answer: null, status: "unanswered" },
    ],
  };
  const { written } = await writeRules(graph, dir);
  assert.deepEqual(written, [join(dir, "g.md")]);
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

  // child-a1 carries an answer but no authority stamp, like root-a: a plain,
  // unstamped draft.
  assert.ok(content.includes(`${id("child-a1")} (unstamped)`));

  const rootA = nodesById.get(id("root-a"));
  assert.ok(content.includes(rootA.answer), "an ancestor's answer is reproduced verbatim");
});

test("writeAncestry labels an authority-less ancestor 'unstamped' when it has an answer and 'un-aligned' when it has none", async () => {
  const dir = await freshTmpDir("project-ancestry-labels-");
  const graph = {
    nodes: [
      { id: "root", slug: "root", question: "Root?", under: [], tier: null, authority: null, answer: "Answer root.", hash: "hash-root" },
      { id: "leaf", slug: "leaf", question: "Leaf?", under: ["root"], tier: null, authority: null, answer: null, hash: "hash-leaf" },
    ],
  };
  const { content } = await writeAncestry(graph, "leaf", join(dir, "CLAUDE.local.md"));
  assert.ok(content.includes("leaf (un-aligned)"), "no answer, no stamp: un-aligned");
  assert.ok(content.includes("root (unstamped)"), "an answer with no stamp: unstamped");
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
      { id: "a", slug: "a", question: "A?", under: [], tier: null, authority: { class: "ratified", by: "x", date: "2026-01-01" }, answer: "Answer A.", hash: "hash-a" },
      { id: "b", slug: "b", question: "B?", under: ["a"], tier: null, authority: null, answer: "Answer B.", hash: "hash-b" },
      { id: "c", slug: "c", question: "C?", under: ["a"], tier: null, authority: null, answer: "Answer C.", hash: "hash-c" },
      { id: "d", slug: "d", question: "D?", under: ["b", "c"], tier: null, authority: null, answer: "Answer D.", hash: "hash-d" },
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

test("renderFrontier gains a 'depends:' line, placed after 'alternatives:' when there is one and after 'settles:' otherwise", async () => {
  const dir = await freshTmpDir("project-frontier-depends-");
  await mkdir(join(dir, "main"), { recursive: true });
  await writeFile(join(dir, "disposition.yaml"), "module: example.test\ngraphs:\n  main:\n    about: fixture\n");
  await writeFile(
    join(dir, "main", "root.md"),
    "---\nquestion: Root?\nstage: periagogic\nalternatives:\n  - name: split-it\n    source: author\n    ref: 2026-01-01\n---\n\n## Disposition\n\nOpen.\n\n## Alternatives\n\n### split-it\n\nSplit it.\n",
  );
  await writeFile(
    join(dir, "main", "plain.md"),
    "---\nquestion: Plain?\nstage: periagogic\ndepends:\n  - example.test/main/root\n---\n\n## Disposition\n\nOpen.\n",
  );
  await writeFile(
    join(dir, "main", "qualified.md"),
    "---\nquestion: Qualified?\nform: target\nalternatives:\n  - name: own-alt\n    source: author\n    ref: 2026-01-01\ndepends:\n  - example.test/main/root#split-it\nstage: review\nrecommendation:\n  adopts: standing\n  boldness: low\n  amends: " + "a".repeat(40) + "\n  at: a1b2c3d\n---\n\n## Answer\n\nAns.\n\n## Alternatives\n\n### own-alt\n\nAn alternative of its own.\n",
  );
  const graph = await readGraph(dir);
  const listing = renderFrontier(graph);
  const everyNodeSection = listing.slice(listing.indexOf("## Every node, by rank"));
  const blockFor = (slug) => {
    const node = graph.nodes.find((n) => n.slug === slug);
    const start = everyNodeSection.indexOf(`- ${node.id}`);
    const next = everyNodeSection.indexOf("\n- ", start + 1);
    return everyNodeSection.slice(start, next === -1 ? everyNodeSection.length : next);
  };

  // plain: no alternatives of its own, so its 'depends:' line sits right
  // after 'settles:'.
  const plainBlock = blockFor("plain");
  assert.ok(plainBlock.includes("  depends: example.test/main/root"), "a bare entry renders without '#'");
  const plainSettlesAt = plainBlock.indexOf("  settles:");
  const plainDependsAt = plainBlock.indexOf("  depends:");
  assert.ok(
    plainSettlesAt >= 0 && plainDependsAt === plainBlock.indexOf("\n", plainSettlesAt) + 1,
    "right after settles: when there is no alternatives: line",
  );

  // qualified: carries its own alternatives, so its 'depends:' line sits
  // right after 'alternatives:' instead, past recommendation/review/draft.
  const qualifiedBlock = blockFor("qualified");
  assert.ok(qualifiedBlock.includes("  depends: example.test/main/root#split-it"), "a qualified entry keeps its '#alternative'");
  const qualifiedAltAt = qualifiedBlock.indexOf("  alternatives:");
  const qualifiedDependsAt = qualifiedBlock.indexOf("  depends:");
  assert.ok(
    qualifiedAltAt >= 0 && qualifiedDependsAt === qualifiedBlock.indexOf("\n", qualifiedAltAt) + 1,
    "right after alternatives: when there is one",
  );

  const rootBlock = blockFor("root");
  assert.ok(!rootBlock.includes("  depends:"), "root names no dependency of its own, alternatives of its own notwithstanding");
});

test("renderFrontier prints an 'order:' line, right after the stamp line, for a node carrying order", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-order"));
  const listing = renderFrontier(graph);
  const orderNode = graph.nodes.find((n) => n.slug === "order-node");

  const stampAt = listing.indexOf(`- ${orderNode.id}`);
  assert.ok(stampAt >= 0, "the stamp line is present");
  const nextLine = listing.slice(stampAt).split("\n")[1];
  assert.equal(
    nextLine,
    "  order: example.test/main/order-node = example.test/main/leaf-a > example.test/main/leaf-b",
    "steps join with ' = ' within a step and ' > ' between steps",
  );

  const other = graph.nodes.find((n) => n.slug === "hub");
  const otherBlock = listing.slice(listing.indexOf(`- ${other.id}`));
  assert.ok(!otherBlock.slice(0, otherBlock.indexOf("\n- ", 1)).includes("  order:"), "a node with no order gets no order line");
});

test("renderFrontier's first line reads '<id> — <status> — <class> (<by>, <date>)', or '— no stamp' with none", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-dialogue"));
  const blockFor = (slug) => {
    const node = graph.nodes.find((n) => n.slug === slug);
    const listing = renderFrontier(graph);
    const start = listing.indexOf(`- ${node.id}`);
    const next = listing.indexOf("\n- ", start + 1);
    return { node, firstLine: listing.slice(start, next === -1 ? listing.length : next).split("\n")[0] };
  };

  const { node: stamped, firstLine: stampedLine } = blockFor("ruling-node");
  assert.equal(
    stampedLine,
    `- ${stamped.id} — unanswered — deferred (claude, 2026-09-03) — rank ${stamped.rank.toFixed(4)}`,
  );

  const { node: unstamped, firstLine: unstampedLine } = blockFor("review-node");
  assert.equal(
    unstampedLine,
    `- ${unstamped.id} — unanswered — no stamp — rank ${unstamped.rank.toFixed(4)}`,
  );

  const { node: answered, firstLine: answeredLine } = blockFor("answered-no-stage");
  assert.equal(
    answeredLine,
    `- ${answered.id} — answered — ratified (Fixture Author, 2026-09-03) — rank ${answered.rank.toFixed(4)}`,
  );
});

test("renderFrontier prints recommendation/review/draft lines after the stage line, review carrying staleness", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-dialogue"));
  const listing = renderFrontier(graph);
  const blockFor = (slug) => {
    const node = graph.nodes.find((n) => n.slug === slug);
    const start = listing.indexOf(`- ${node.id}`);
    const next = listing.indexOf("\n- ", start + 1);
    return listing.slice(start, next === -1 ? listing.length : next);
  };

  const ruling = graph.nodes.find((n) => n.slug === "ruling-node");
  const rulingBlock = blockFor("ruling-node");
  const stageAt = rulingBlock.indexOf("  stage:");
  const recAt = rulingBlock.indexOf("  recommendation:");
  const reviewAt = rulingBlock.indexOf("  review:");
  const draftAt = rulingBlock.indexOf("  draft:");
  assert.ok(stageAt >= 0 && stageAt < recAt && recAt < reviewAt && reviewAt < draftAt, "recommendation, then review, then draft, all after stage");
  assert.ok(rulingBlock.includes(
    `  recommendation: adopts ${ruling.recommendation.adopts}, boldness ${ruling.recommendation.boldness}`,
  ));
  assert.ok(rulingBlock.includes(`  review: forward (strong, 2026-09-03)`), "not stale (of matches)");
  assert.ok(!rulingBlock.includes("draft changed since the review"));
  assert.ok(rulingBlock.includes("  draft: yes"));

  const reviewOnlyBlock = blockFor("review-node");
  assert.ok(reviewOnlyBlock.includes("  recommendation: adopts standing, boldness high"));
  assert.ok(!reviewOnlyBlock.includes("  review:"), "no review yet at the review stage");
  assert.ok(!reviewOnlyBlock.includes("  draft:"));
});

test("renderFrontier appends ', draft changed since the review' when reviewStale", async () => {
  const dir = await freshTmpDir("project-frontier-stale-");
  await mkdir(join(dir, "main"), { recursive: true });
  await writeFile(join(dir, "disposition.yaml"), "module: example.test\ngraphs:\n  main:\n    about: fixture\n");
  await writeFile(
    join(dir, "main", "stale.md"),
    "---\nquestion: Stale?\nform: rule\nauthority:\n  class: deferred\n  by: x\n  date: 2026-01-01\nstage: ruling\nrecommendation:\n  adopts: standing\n  boldness: low\n  amends: " + "b".repeat(40) + "\n  at: a1b2c3d\nreview:\n  verdict: forward\n  strength: none\n  date: 2026-01-01\n  of: " + "a".repeat(40) + "\n---\n\n## Answer\n\nAns.\n",
  );
  const graph = await readGraph(dir);
  const listing = renderFrontier(graph);
  assert.ok(listing.includes("  review: forward (none, 2026-01-01), draft changed since the review"));
});

test("renderFrontier names what the recommendation adopts, lists the facts, and marks a stale recommendation", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const listing = renderFrontier(graph);
  const blockFor = (slug) => {
    const node = graph.nodes.find((n) => n.slug === slug);
    assert.ok(node, `fixture has no node ${slug}`);
    const start = listing.indexOf(`- ${node.id}`);
    const next = listing.indexOf("\n- ", start + 1);
    return listing.slice(start, next === -1 ? listing.length : next);
  };

  const fresh = blockFor("fresh-node");
  assert.ok(fresh.includes("  recommendation: adopts split-the-node, boldness high"),
    "the class left the recommendation: it is the authority fact");
  assert.ok(!fresh.includes(", ratified,"), "no class on the recommendation line");
  assert.ok(!fresh.includes("standing text changed since the recommendation"));
  assert.ok(fresh.includes("  draft: yes"));
  assert.ok(fresh.includes(
    "  alternatives: 3 (keep-standing:author, split-the-node:review, follow-the-instrument:proposal)",
  ), "the count, then each name with its source, in the list's own order");
  const draftAt = fresh.indexOf("  draft:");
  const altsAt = fresh.indexOf("  alternatives:");
  assert.ok(draftAt >= 0 && draftAt < altsAt, "the alternatives line comes last of the dialogue lines");

  // Pruning is the `existence` fact, never an alternative: the
  // recommendation adopts the node as it stands and the fact carries the
  // proposal to delete it (commons.systems/disposition-graph/dialogue).
  const prune = blockFor("prune-node");
  assert.ok(prune.includes("  recommendation: adopts standing, boldness moderate"));
  assert.ok(!prune.includes("  draft:"), "adopting the standing text quotes no fence");
  assert.ok(!prune.includes("  alternatives:"), "the prune alternative is gone");
  assert.ok(
    prune.includes("  facts: authority: delegated of ratified|delegated (boldness moderate); existence: prune of keep|prune (boldness moderate)"),
    "the facts line names each fact, its adopted choice, its choice set, and its boldness, in the reserved order",
  );
  assert.ok(
    fresh.includes("  facts: authority: ratified of ratified|delegated (boldness high)"),
    "a node with only the authority fact still prints one",
  );

  const stale = blockFor("stale-node");
  assert.ok(stale.includes(
    "  recommendation: adopts standing, boldness low, standing text changed since the recommendation",
  ));
  assert.ok(!stale.includes("  alternatives:"), "no alternatives line when there are none");
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
  assert.ok(map.has("disposition") && map.has("archē"));
  assert.equal(map.get("disposition").id, "commons.systems/disposition-graph/node");
  assert.equal(map.get("disposition").sentence, "One record is one disposition: a single question, and the answer that stands today.");
  assert.ok(terms.indexOf(terms.slice().sort((a, b) => b.length - a.length)[0]) === 0, "longest term is tried first");

  const hit = (text, term) => {
    const re = R.termRegex([term]);
    return re.test(text);
  };
  assert.ok(hit("an archē is a root", "archē"), "matches a non-ascii term between spaces");
  assert.ok(!hit("archētype", "archē"), "does not match inside a longer word");
  assert.ok(hit("A Disposition holds.", "disposition"), "case-insensitive");
  assert.ok(!hit("predisposition", "disposition"), "respects the left boundary");
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

// `status` is now derived as answered/unanswered (deriveStatus), not a
// per-node word painted through this map, so STATUS_WORD/STATUS_CLASS keep
// only the three stamp classes they still render directly (authorityHtml,
// stampPill); 'proposal' and 'unaligned' are gone, and 'question' never was one.
test("STATUS_WORD and STATUS_CLASS carry only the three stamp classes", () => {
  assert.deepEqual(Object.keys(R.STATUS_WORD).sort(), ["deferred", "delegated", "ratified"]);
  assert.deepEqual(Object.keys(R.STATUS_CLASS).sort(), ["deferred", "delegated", "ratified"]);
  assert.equal(R.STATUS_WORD.unaligned, undefined);
  assert.equal(R.STATUS_WORD.proposal, undefined);
  assert.equal(R.STATUS_WORD.question, undefined);
});

/* --------------------------------------------------------- unanswered pill */

test("stampPill shows the authority class when stamped, and a neutral 'unstamped' pill otherwise", () => {
  assert.equal(R.stampPill({ authority: { class: "ratified" } }), '<span class="pill rat">ratified</span>');
  assert.equal(R.stampPill({ authority: null }), '<span class="pill none">unstamped</span>');
  assert.equal(R.stampPill({ authority: { class: "deferred" } }, true), '<span class="pill sm def">deferred</span>');
});

test("unansweredPill renders 'unanswered · <stage>' only for an unanswered node, empty otherwise", () => {
  assert.equal(R.unansweredPill({ status: "unanswered", stage: "review" }), '<span class="pill unans">unanswered · review</span>');
  assert.equal(R.unansweredPill({ status: "answered", stage: null }), "");
  assert.equal(R.unansweredPill({ status: "answered" }), "", "an answered node never gets the pill even if it carries a stage");
});

test("draftNoteHtml points to the alignment page only when the node carries a Recommendation", () => {
  assert.equal(R.draftNoteHtml({ draft: { raw: "x" } }), '<p class="draftnote">A recommendation awaits the author\'s ruling on the alignment page.</p>');
  assert.equal(R.draftNoteHtml({ draft: null }), "");
  assert.equal(R.draftNoteHtml({}), "");
});

test("alternativesHtml lists each pending alternative with its source, ref and prose, and says the standing answer still holds", () => {
  const html = R.alternativesHtml({
    alternatives: [
      { name: "keep-standing", source: "author", ref: "2026-09-01" },
      { name: "split-the-node", source: "review", ref: "2026-09-02" },
      { name: "follow-the-instrument", source: "proposal", ref: "node --test x.mjs" },
    ],
    alternativesText: {
      "keep-standing": "Leave the node as it stands.",
      "split-the-node": "The question is two questions.",
      "follow-the-instrument": "The instrument contradicts the standing answer.",
    },
  });
  assert.ok(html.includes("Pending alternatives"));
  for (const name of ["keep-standing", "split-the-node", "follow-the-instrument"]) {
    assert.ok(html.includes(`>${name}</span>`), `${name} is named`);
  }
  assert.ok(html.includes("author · 2026-09-01"), "the source and the ref that dates it");
  assert.ok(html.includes("proposal · node --test x.mjs"), "the ref that names the instrument");
  assert.ok(html.includes("Leave the node as it stands."), "each alternative's prose");
  assert.ok(html.includes("The question is two questions."));
  // Deleting the node is the `existence` fact and never an alternative, so
  // no alternative is ever marked a prune here
  // (commons.systems/disposition-graph/dialogue).
  assert.ok(!html.includes("prune"), "no alternative carries a prune mark any more");
  assert.ok(
    html.includes("The standing answer keeps its authority until the author confirms one of these."),
    "the line that says what the list does not do",
  );

  assert.equal(R.alternativesHtml({ alternatives: [] }), "", "nothing for a node with none");
  assert.equal(R.alternativesHtml({}), "");
});

test("the browser's node page carries the pending alternatives beside the stamp", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const fresh = graph.nodes.find((n) => n.slug === "fresh-node");
  assert.equal(fresh.alternatives.length, 3, "fixture precondition: three answers on the table");
  const html = R.alternativesHtml(fresh);
  assert.ok(html.includes(">split-the-node</span>") && html.includes(">follow-the-instrument</span>"));
  assert.ok(html.includes("review · 2026-09-02"));
  assert.ok(html.includes("the question is two questions"), "the alternative's prose");
  assert.ok(!html.includes("prune"), "no prune among these three");

  // The node whose deletion is proposed carries no alternative at all: the
  // proposal is its `existence` fact, which factsHtml renders.
  const pruneNode = graph.nodes.find((n) => n.slug === "prune-node");
  assert.equal(R.alternativesHtml(pruneNode), "", "no alternatives on it to list");
  const facts = R.factsHtml(pruneNode);
  assert.ok(facts.includes("The decisions this ruling asks"));
  assert.ok(facts.includes(">existence</span>"), "the existence fact is named");
  assert.ok(facts.includes("<strong class=\"mono\">prune</strong>"), "and its adopted choice is marked");
  assert.ok(facts.includes(">authority</span>"), "the authority fact beside it");
  assert.equal(R.factsHtml({ facts: [] }), "", "nothing for a node with no facts");

  // and the browser keeps every node of this fixture: each has an answer
  const kept = excludeUnaligned(graph).nodes.map((n) => n.slug).sort();
  assert.deepEqual(kept, ["fresh-node", "prune-node", "stale-node"]);
});

test("authorityHtml appends the unanswered pill beside the stamp it already shows", () => {
  const stamped = R.authorityHtml({ authority: { class: "deferred", by: "claude", date: "2026-09-02" }, status: "unanswered", stage: "ruling" });
  assert.ok(stamped.includes('<span class="pill def">deferred</span>'), "the existing stamp pill is unchanged");
  assert.ok(stamped.includes('<span class="pill unans">unanswered · ruling</span>'));

  const settled = R.authorityHtml({ authority: { class: "ratified", by: "nathan", date: "2026-09-02" }, status: "answered" });
  assert.ok(!settled.includes("unans"), "an answered node with no dialogue gets no stage pill");

  // an answered node whose standing answer holds while a dialogue runs on
  // it anyway: the stage shows, but "unanswered" would misdescribe it.
  const reopened = R.authorityHtml({ authority: { class: "ratified", by: "nathan", date: "2026-09-02" }, status: "answered", stage: "review" });
  assert.ok(reopened.includes('<span class="pill unans">in dialogue · review</span>'));
  assert.ok(!reopened.includes("unanswered"));

  const unstamped = R.authorityHtml({ authority: null, answer: "x", status: "unanswered", stage: "maieutic" });
  assert.ok(unstamped.includes('<span class="pill none">unstamped</span>'));
  assert.ok(unstamped.includes("unanswered · maieutic"));
});

test("rowHtml marks an unanswered node in the navigation with the same pill", () => {
  const answered = R.rowHtml({ id: "x", question: "Q?", form: "rule", authority: { class: "ratified" }, status: "answered" }, null);
  assert.ok(!answered.includes("unans"));

  const unanswered = R.rowHtml({ id: "y", question: "Q2?", form: "rule", authority: null, answer: "x", status: "unanswered", stage: "periagogic" }, null);
  assert.ok(unanswered.includes("unanswered · periagogic"));
});

/* ------------------------------------------------------------------ shims */

// covers the ledger-badge replacement: the fixture's purpose node declares
// shims (one with `for`, one without), and the shims block must render
// every one of their fields.
test("the shims block covers a fixture node that declares shims", () => {
  const node = FIXTURE.nodes.find((n) => n.id === "commons.systems/disposition-graph/purpose");
  assert.ok(node.shims && node.shims.length >= 2, "fixture node declares at least two shims");
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

test("--alignment heads each item with its id, graph label, settles, rank, stamp and parents, with the stage chip trailing on its own lead line", () => {
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
  // graph, settles, rank, stamp, parents start to finish, and the chip
  // trails the whole of it.
  const graphAt = article.indexOf(`<span class="meta mono">${ruling.graph}</span>`);
  const settlesAt = article.indexOf(`settles ${ruling.settles}`);
  const rankAt = article.indexOf(`rank ${ruling.rank.toFixed(4)}`);
  const stampAt = article.indexOf("deferred · Fixture Author · 2026-01-01");
  const parentsAt = article.indexOf("under example.test/main/root");
  const stageAt = article.indexOf('class="chip stage-ruling"');
  assert.ok(
    graphAt >= 0 && graphAt < settlesAt && settlesAt < rankAt && rankAt < stampAt && stampAt < parentsAt && parentsAt < stageAt,
    "the eyebrow leads with the graph label, then settles, then rank, then the stamp and parents, and the stage chip trails outside it",
  );
  assert.ok(article.includes('class="chip stage-ruling"'), "the stage chip");
  assert.ok(article.includes('class="chipname">ruling<'), "the chip names the stage");
  assert.ok(article.includes("deferred · Fixture Author · 2026-01-01"), "the stamp");
  assert.ok(article.includes("under example.test/main/root"), "the parents from under");

  const unstamped = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned").id);
  assert.ok(unstamped.includes("no stamp"), "an unstamped node says so");
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

test("--alignment shows the draft, the changed frontmatter field, and a word-level ins/del diff", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);
  const drafted = nodeBySlug(DIALOGUE_GRAPH, "ruling-node");
  assert.ok(drafted.draft, "fixture precondition: the node carries a '## Draft'");
  const article = itemHtml(html, drafted.id);

  assert.ok(article.includes("The node as it would stand"), "the pane's label");
  assert.ok(article.includes("Yes: a draft is a whole proposed node"), "the draft's answer, rendered as prose");
  // The edit's own label names what it diffs against rather than implying
  // the base it diffs from has standing: ruling-node's current stamp is
  // deferred, not ratified, so its edit is against an unconfirmed draft.
  assert.ok(article.includes("The edit, against a draft no one has confirmed"), "the edit's label");
  assert.ok(article.includes("The node it would leave"), "and the whole beneath the edit");
  // A stamp of any class confers authority to amend, so this pane leads
  // with the edit rather than with the first-answer caption
  // (commons.systems/disposition-graph/dialogue, first-answer-is-not-an-amendment).
  assert.ok(!article.includes("This ruling gives the node its first answer"));

  // the frontmatter half: authority is the one field that moved, compared
  // as a whole and printed old -> new.
  assert.ok(article.includes("<code>authority</code>"), "the changed field is named");
  assert.ok(article.includes("{class: deferred, by: claude, date: 2026-09-03}"), "the old value");
  assert.ok(article.includes("{class: ratified, by: Fixture Author, date: 2026-09-03}"), "the new value");
  assert.ok(!article.includes("<code>stage</code>"), "the dialogue's own keys are not part of the edit");
  assert.ok(!article.includes("<code>recommendation</code>"));
  assert.ok(!article.includes("<code>review</code>"));

  // the word-level half
  assert.ok(/<del>[^<]*Not[^<]*<\/del>/.test(article), "a deletion is marked up");
  assert.ok(/<ins>[^<]*Yes:[^<]*<\/ins>/.test(article), "an insertion is marked up");
  assert.ok(article.includes("Confirming ratifies the recommended text as the node."), "the edit's caption");
  assert.ok(article.includes("Denying leaves the earlier draft, which no one has confirmed either."));

  // A node with no fence gets no edit and no edit caption. review-node
  // carries no stamp, so its pane leads with the whole, and its caption says
  // a confirmation would ratify the AI's own draft -- never that the node
  // simply stands, since no one has confirmed it.
  const plain = itemHtml(html, nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(!plain.includes("The edit,"));
  assert.ok(!plain.includes("Confirming ratifies the recommended text as the node."));
  assert.ok(
    plain.includes("Confirming ratifies the AI's draft as this node's answer. No one has confirmed it yet, and the stamp it carries is not an answer."),
    "a node with an answer but no ratified stamp says confirming would ratify the AI's own draft",
  );
});

test("frontmatterEdits compares authority as a whole and ignores the dialogue's own keys", () => {
  const node = {
    form: "rule",
    authority: { class: "deferred", by: "claude", date: "2026-09-03" },
    under: ["x/y/z"],
    defines: [],
    stage: "ruling",
    recommendation: { class: "ratified", boldness: "low" },
    review: { verdict: "forward", strength: "none", date: "2026-09-03", of: "a" },
  };
  const draft = {
    frontmatter: {
      form: "rule",
      authority: { date: "2026-09-03", by: "claude", class: "deferred" },
      under: ["x/y/z"],
      defines: ["a term"],
      stage: "review",
      recommendation: null,
      review: null,
    },
  };
  const edits = frontmatterEdits(node, draft);
  assert.deepEqual(
    edits.map((e) => e.field),
    ["defines"],
    "the same stamp written in another key order is not an edit, and the dialogue's keys never are",
  );
  assert.equal(edits[0].before, "none", "an empty list reads as none");
  assert.equal(edits[0].after, "[a term]");

  const restamped = frontmatterEdits(node, {
    frontmatter: { ...draft.frontmatter, authority: { class: "ratified", by: "claude", date: "2026-09-03" } },
  });
  assert.deepEqual(restamped.map((e) => e.field), ["authority", "defines"]);
  assert.equal(restamped[0].before, "{class: deferred, by: claude, date: 2026-09-03}");
  assert.equal(restamped[0].after, "{class: ratified, by: claude, date: 2026-09-03}");
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
  const graph = {
    module: "example.test", ref: null, graphs: { main: { about: "fixture" } },
    nodes: [{
      id: "example.test/main/long", slug: "long", question: "Long?", graph: "main", stage: "ruling",
      under: [], rank: 1, status: "unanswered", answer: long, rationale: null,
      // a stamp of any class confers authority to amend, so the pane leads
      // with the edit and the diff is rendered at all
      authority: { class: "deferred", by: "claude", date: "2026-09-03" },
      draft: { frontmatter: {}, sections: { Answer: `${long} more`, Rationale: null } },
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(html.includes("<ins>"), "60 tokens is well under the 4000-token cap");
  assert.ok(!/too long to diff/i.test(html));
});

test("--alignment puts the alternatives on the answer decision as its choices, with the standing text first and the adopted one marked", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const fresh = nodeBySlug(graph, "fresh-node");
  const article = itemHtml(html, fresh.id);

  assert.ok(article.includes("What this ruling asks"), "the decisions' label");
  assert.ok(article.includes('data-decision="answer"'), "the answer is one of the decisions");
  assert.ok(article.includes(fresh.question), "and it is labelled with the node's own question");

  // the node as it stands is always a candidate and is the first choice
  assert.ok(article.includes('value="standing"'), "the standing text is a choice");
  const standingAt = article.indexOf('value="standing"');
  for (const name of ["keep-standing", "split-the-node", "follow-the-instrument"]) {
    assert.ok(article.includes(`value="${name}"`), `${name} is a choice`);
    assert.ok(standingAt < article.indexOf(`value="${name}"`), "the standing text leads");
  }
  assert.ok(article.includes('<span class="pill alt-src">author</span>'), "each alternative's source");
  assert.ok(article.includes('<span class="pill alt-src">proposal</span>'));
  assert.ok(
    article.includes('<span class="pill alt-ref mono">node --test packages/disposition/read.test.mjs</span>'),
    "the ref the proposal names",
  );
  // the prose leads the row directly -- not folded into a drill-down --
  // since every alternative here is short enough to show in full
  // (commons.systems/disposition-graph/alignment-page, public/agency)
  assert.ok(article.includes('<span class="choicesays">'), "the choice leads with what it would answer");
  assert.ok(article.includes("leave the node as it stands and close the dialogue"), "the prose of an alternative");
  assert.ok(article.includes("the question is two questions"));
  assert.ok(!article.includes("<summary>The rest of what it says</summary>"), "nothing here spills past the lead into a drill-down");

  // every decision marks the choice its recommendation adopts, so scope
  // the count to the answer's own fieldset
  const answerFs = article.slice(
    article.indexOf('data-decision="answer"'),
    article.indexOf("</fieldset>", article.indexOf('data-decision="answer"')),
  );
  assert.equal(
    answerFs.split("the recommendation adopts this").length - 1, 1,
    "exactly one choice of the answer is marked as adopted",
  );
  const adoptedAt = answerFs.indexOf("the recommendation adopts this");
  const splitAt = answerFs.indexOf('value="split-the-node"');
  const followAt = answerFs.indexOf('value="follow-the-instrument"');
  assert.ok(splitAt < adoptedAt && adoptedAt < followAt, "and it is the one the recommendation names");
  assert.ok(article.includes('class="choice adopted"'), "the adopted row is marked on its own element too");
  assert.ok(!article.includes('class="divergence"'), "no leaf depends on this fixture's node, so no divergence paragraph");

  // the last row of every decision rejects all of its choices with feedback
  assert.ok(article.includes('value="__reject"'), "a rejection row");
  assert.ok(article.includes("Reject all of these, with feedback"));

  // a node with nothing on the table asks no answer decision
  const plain = itemHtml(html, nodeBySlug(graph, "stale-node").id);
  assert.ok(!plain.includes('data-decision="answer"'));
});

test("a choice row leads with what it would answer, not with its slug", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const fresh = nodeBySlug(graph, "fresh-node");
  const article = itemHtml(html, fresh.id);

  // isolate "keep-standing"'s own <li>, so a match cannot bleed in from a
  // neighbouring choice's row
  const radioAt = article.indexOf('value="keep-standing"');
  const li = article.slice(article.lastIndexOf("<li", radioAt), article.indexOf("</li>", radioAt) + "</li>".length);

  assert.ok(li.includes('<span class="choicesays">'), "the row carries a choicesays span");
  const saysAt = li.indexOf('<span class="choicesays">');
  const nameAt = li.indexOf('<span class="choicename mono handle">keep-standing</span>');
  assert.ok(nameAt > saysAt, "the prose leads; the name -- how a ruling is filed in the record -- follows it");
  assert.ok(
    li.slice(saysAt, nameAt).includes("leave the node as it stands and close the dialogue"),
    "the choicesays span holds the alternative's own '## Alternatives' prose",
  );
});

test("the keep-choice is named for the authority the text actually has, not for whether it is merely stamped", () => {
  const graph = {
    module: "example.test", ref: null,
    graphs: { main: { about: "fixture" } },
    nodes: [
      {
        id: "example.test/main/ratified", slug: "ratified", graph: "main", question: "Which stands?",
        form: "rule", under: [], rank: 1, status: "answered", stage: "ruling",
        authority: { class: "ratified", by: "Fixture Author", date: "2026-09-03" },
        answer: "The ratified answer.",
        alternatives: [{ name: "alt-a", source: "author", ref: "2026-09-01" }],
        alternativesText: { "alt-a": "An alternative to the ratified answer." },
      },
      {
        id: "example.test/main/drafted", slug: "drafted", graph: "main", question: "Which stands?",
        form: "rule", under: [], rank: 1, status: "unanswered", stage: "ruling",
        authority: { class: "deferred", by: "claude", date: "2026-09-03" },
        answer: "The AI's draft answer.",
        alternatives: [{ name: "alt-b", source: "author", ref: "2026-09-01" }],
        alternativesText: { "alt-b": "An alternative to the draft." },
      },
      {
        id: "example.test/main/open", slug: "open", graph: "main", question: "Which stands?",
        form: "rule", under: [], rank: 1, status: "unanswered", stage: "maieutic",
        alternatives: [{ name: "alt-c", source: "author", ref: "2026-09-01" }],
        alternativesText: { "alt-c": "An alternative with nothing standing yet." },
        recommendation: { adopts: "alt-c", boldness: "high" },
      },
    ],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const ratified = itemHtml(html, "example.test/main/ratified");
  assert.ok(ratified.includes('value="standing"'), "a ratified answer still files its keep choice as 'standing'");
  assert.ok(ratified.includes('<span class="choicename">keep the answer as ratified</span>'));

  const drafted = itemHtml(html, "example.test/main/drafted");
  assert.ok(drafted.includes('value="standing"'), "a deferred draft's keep choice is also filed as 'standing'");
  assert.ok(drafted.includes('<span class="choicename">keep the AI\'s draft as it is</span>'));
  assert.ok(!drafted.includes("the node as it stands"), "a mere stamp is never called out as though it stood");

  const open = itemHtml(html, "example.test/main/open");
  assert.ok(!open.includes('value="standing"'), "nothing stands here to keep, so no standing radio renders at all");
});

test("the caption never claims nothing else is proposed while alternatives are pending", () => {
  const graph = {
    module: "example.test", ref: null,
    graphs: { main: { about: "fixture" } },
    nodes: [
      {
        id: "example.test/main/pending", slug: "pending", graph: "main", question: "Which of these?",
        form: "rule", under: [], rank: 1, status: "unanswered", stage: "ruling",
        authority: { class: "deferred", by: "claude", date: "2026-09-03" },
        answer: "The standing answer.",
        alternatives: [
          { name: "alt-a", source: "author", ref: "2026-09-01" },
          { name: "alt-b", source: "review", ref: "2026-09-02" },
        ],
        alternativesText: { "alt-a": "Take path A.", "alt-b": "Take path B." },
      },
      {
        id: "example.test/main/settled", slug: "settled", graph: "main", question: "Anything else on the table?",
        form: "rule", under: [], rank: 1, status: "unanswered", stage: "ruling",
        authority: { class: "deferred", by: "claude", date: "2026-09-03" },
        answer: "The only answer on the table.",
      },
    ],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const pending = itemHtml(html, "example.test/main/pending");
  const pendingCaption = pending.slice(pending.indexOf('<p class="caption">'), pending.indexOf("</p>", pending.indexOf('<p class="caption">')));
  assert.ok(!pendingCaption.includes("Nothing else is proposed"), "alternatives are pending, so nothing else is not true");
  assert.ok(!pendingCaption.includes("as it stands"), "and the caption never claims the node simply stands");
  assert.ok(pendingCaption.includes("alternative"), "it reports the count instead");

  const settled = itemHtml(html, "example.test/main/settled");
  const settledCaption = settled.slice(settled.indexOf('<p class="caption">'), settled.indexOf("</p>", settled.indexOf('<p class="caption">')));
  assert.ok(settledCaption.includes("Nothing else is proposed"), "with nothing pending, the caption says so");
});

test("--alignment's eyebrow carries the alternatives count right after settles, plural or singular, and omits it entirely for a node with none", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const fresh = nodeBySlug(graph, "fresh-node");
  assert.equal(fresh.alternatives.length, 3, "fixture precondition: three alternatives on the table");
  const freshArticle = itemHtml(html, fresh.id);
  assert.ok(freshArticle.includes('<span class="meta mono num">3 alternatives</span>'), "plural, and named 3");
  const settlesAt = freshArticle.indexOf(`settles ${fresh.settles}`);
  const altsAt = freshArticle.indexOf('3 alternatives');
  const rankAt = freshArticle.indexOf(`rank ${fresh.rank.toFixed(4)}`);
  assert.ok(settlesAt >= 0 && settlesAt < altsAt && altsAt < rankAt, "right after settles, before rank");

  const stale = nodeBySlug(graph, "stale-node");
  assert.equal((stale.alternatives || []).length, 0, "fixture precondition: no alternatives");
  const staleArticle = itemHtml(html, stale.id);
  assert.ok(!staleArticle.includes("alternative"), "nothing rendered for a node with none");
});

test("--alignment inverts a divergence onto the ancestor's alternatives: what a ruling for each keeps and discards", () => {
  const graph = {
    module: "example.test", ref: null,
    graphs: { main: { about: "fixture" } },
    nodes: [
      {
        id: "example.test/main/anc", slug: "anc", graph: "main", question: "Which alternative should the author take?",
        form: "rule", authority: { class: "deferred", by: "claude", date: "2026-09-03" },
        under: [], rank: 1, status: "unanswered", stage: "ruling", settles: 2,
        alternatives: [
          { name: "alt-a", source: "author", ref: "2026-09-01", prune: false },
          { name: "alt-b", source: "review", ref: "2026-09-02", prune: false },
          { name: "alt-c", source: "author", ref: "2026-09-03", prune: false },
        ],
        alternativesText: { "alt-a": "Take path A.", "alt-b": "Take path B.", "alt-c": "Take path C, which nothing stands under." },
        answer: "The standing answer.",
      },
      {
        id: "example.test/main/leaf-a", slug: "leaf-a", graph: "main", question: "What follows under A?",
        form: "target", under: [], rank: 0.1, status: "unanswered", stage: "maieutic",
        depends: [{ id: "example.test/main/anc", alternative: "alt-a" }],
      },
      {
        id: "example.test/main/leaf-b", slug: "leaf-b", graph: "main", question: "What follows under B?",
        form: "target", under: [], rank: 0.1, status: "unanswered", stage: "maieutic",
        depends: [{ id: "example.test/main/anc", alternative: "alt-b" }],
      },
      {
        id: "example.test/main/leaf-open", slug: "leaf-open", graph: "main", question: "What is still just waiting on the open question?",
        form: "target", under: [], rank: 0.1, status: "unanswered", stage: "maieutic",
        depends: [{ id: "example.test/main/anc", alternative: null }],
      },
    ],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const article = itemHtml(html, "example.test/main/anc");

  const altAAt = article.indexOf('value="alt-a"');
  const altBAt = article.indexOf('value="alt-b"');
  const altCAt = article.indexOf('value="alt-c"');
  assert.ok(altAAt >= 0 && altAAt < altBAt && altBAt < altCAt, "the three alternatives, in the list's own order");
  const blockA = article.slice(altAAt, altBAt);
  const blockB = article.slice(altBAt, altCAt);
  const blockC = article.slice(altCAt);

  assert.ok(
    blockA.includes('<p class="divergence">A ruling for this keeps: <em>example.test/main/leaf-a</em>. It discards: <em>example.test/main/leaf-b</em>.</p>'),
    "alt-a keeps its own leaf and discards the leaf standing under the sibling alternative",
  );
  assert.ok(!blockA.includes("leaf-open"), "an unqualified depends entry is neither kept nor discarded by any alternative");

  assert.ok(
    blockB.includes('<p class="divergence">A ruling for this keeps: <em>example.test/main/leaf-b</em>. It discards: <em>example.test/main/leaf-a</em>.</p>'),
    "and the inversion holds symmetrically for alt-b",
  );

  assert.ok(
    blockC.includes('<p class="divergence">A ruling for this keeps nothing recorded.</p>'),
    "alt-c has no leaf of its own, but the paragraph still renders since a sibling alternative does",
  );
  assert.ok(!blockC.includes("It discards"), "nothing to discard when nothing is kept");
});

test("--alignment asks the prune as the existence fact, not as an alternative or a caption", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const prune = nodeBySlug(graph, "prune-node");
  assert.equal((prune.alternatives || []).length, 0, "fixture precondition: no alternative proposes the deletion");
  assert.equal(prune.facts.find((f) => f.name === "existence").adopts, "prune",
    "fixture precondition: the existence fact proposes it");
  assert.equal(prune.draft, null, "fixture precondition: adopting the standing text quotes no fence");
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
  assert.ok(existenceFs.includes('value="keep"') && existenceFs.includes('value="prune"'), "both choices");
  assert.ok(existenceFs.includes("the recommendation adopts this"), "with the recommended one marked");
  assert.ok(existenceFs.includes("Nothing here survives as a node of its own"), "the fact's prose under its legend");
  assert.ok(!article.includes('class="pill alt-prune"'), "no prune pill: it is not an alternative");
  assert.ok(!article.includes("Confirm prunes the node"), "and no caption of its own");
  assert.ok(!article.includes("The edit"), "no edit, since the recommendation adopts the standing text");
  assert.ok(
    article.includes("Confirming ratifies the AI's draft as this node's answer. No one has confirmed it yet, and the stamp it carries is not an answer."),
    "the pane's caption for a standing adoption, worded for a draft nobody has confirmed",
  );

  const fresh = itemHtml(html, nodeBySlug(graph, "fresh-node").id);
  assert.ok(!fresh.includes('data-decision="existence"'), "a node nobody proposes to delete asks no existence decision");
  assert.ok(fresh.includes("Confirming ratifies the recommended text as the node."));
});

test("--alignment shows what the recommendation adopts and pills a stale one", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const stale = nodeBySlug(graph, "stale-node");
  assert.equal(stale.recommendationStale, true, "fixture precondition: the standing text moved");
  const staleItem = itemHtml(html, stale.id);
  assert.ok(staleItem.includes("adopts: standing"), "adopts is shown even for the node as it stands");
  assert.ok(staleItem.includes("boldness: low"));
  assert.ok(!staleItem.includes("class: delegated"),
    "the recommendation carries no class: it is the authority fact");
  assert.ok(staleItem.includes('data-decision="authority"') || staleItem.includes("delegated"),
    "and the class is asked or folded as that fact");
  assert.ok(staleItem.includes("standing text changed since the recommendation"), "the staleness pill");

  const fresh = nodeBySlug(graph, "fresh-node");
  assert.equal(fresh.recommendationStale, false, "fixture precondition: the recommendation still pins the text");
  const freshItem = itemHtml(html, fresh.id);
  assert.ok(freshItem.includes("adopts: split-the-node"));
  assert.ok(!freshItem.includes("standing text changed since the recommendation"));
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

test("--alignment renders the review's pills, marks a stale one, and says when there is no review", () => {
  const stale = nodeBySlug(ALIGNMENT_GRAPH, "child-ruling");
  assert.equal(stale.reviewStale, true, "fixture precondition: the draft moved since the review");
  const staleItem = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH), stale.id);
  assert.ok(staleItem.includes("The review"));
  assert.ok(staleItem.includes(">forwarded<"), "the verdict reads as a word, not the field's value");
  assert.ok(staleItem.includes("counter-argument: weak"));
  assert.ok(staleItem.includes(">2026-01-01<"));
  assert.ok(staleItem.includes("draft changed since the review"), "the staleness warning");

  const html = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);
  const fresh = nodeBySlug(DIALOGUE_GRAPH, "ruling-node");
  assert.equal(fresh.reviewStale, false, "fixture precondition: the review pins this draft");
  const freshItem = itemHtml(html, fresh.id);
  assert.ok(freshItem.includes(">forwarded<") && freshItem.includes("counter-argument: strong"));
  assert.ok(!freshItem.includes("draft changed since the review"), "no warning on a current review");

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
