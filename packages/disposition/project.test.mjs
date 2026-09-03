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

import { build, project, writeRules, writeAncestry, excludeUnaligned, renderFrontier, buildAlignment, groupAlignmentItems } from "./project.mjs";
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

/* The template's script is written so that every top-level statement is a
   declaration and the one call is guarded on `document`. That lets the whole
   renderer be loaded here, without a DOM, and called directly. */
function loadRenderer() {
  const m = TEMPLATE.match(/<script>\n([\s\S]*?)\n<\/script>/);
  assert.ok(m, "template has a plain <script> block");
  const api = "esc inline mdHtml mdBlocks groupRejected plain firstSentence termIndex termRegex fmtPct formWord safeHref truncate shimsHtml chooseRoute savePlace loadPlace PLACE_KEY STATUS_WORD";
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
  assert.ok(
    text.includes(
      `> Projected from ${node.id} (ratified, Fixture Author, 2026-01-01). Generated by packages/disposition/project.mjs --rules; do not edit. If this file conflicts with the graph on the disposition ref, the graph wins.`
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
        answer: "Global answer.", status: "ratified",
      },
      { id: "example.test/main/u", slug: "u", question: "U?", tier: null, authority: null, answer: null, status: "unaligned" },
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
  // unstamped proposal.
  assert.ok(content.includes(`${id("child-a1")} (proposal)`));

  const rootA = nodesById.get(id("root-a"));
  assert.ok(content.includes(rootA.answer), "an ancestor's answer is reproduced verbatim");
});

test("writeAncestry labels an authority-less ancestor 'proposal' when it has an answer and 'un-aligned' when it has none", async () => {
  const dir = await freshTmpDir("project-ancestry-labels-");
  const graph = {
    nodes: [
      { id: "root", slug: "root", question: "Root?", under: [], tier: null, authority: null, answer: "Answer root.", hash: "hash-root" },
      { id: "leaf", slug: "leaf", question: "Leaf?", under: ["root"], tier: null, authority: null, answer: null, hash: "hash-leaf" },
    ],
  };
  const { content } = await writeAncestry(graph, "leaf", join(dir, "CLAUDE.local.md"));
  assert.ok(content.includes("leaf (un-aligned)"), "no answer, no stamp: un-aligned");
  assert.ok(content.includes("root (proposal)"), "an answer with no stamp: proposal");
});

test("writeAncestry on an un-aligned node targeted directly prints 'un-aligned' for itself", async () => {
  const dir = await freshTmpDir("project-ancestry-unaligned-");
  const graph = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
  const unaligned = graph.nodes.find((n) => n.status === "unaligned");
  assert.ok(unaligned, "fixture has an un-aligned node");
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
  const unaligned = graph.nodes.find((n) => n.status === "unaligned");
  const others = graph.nodes.filter((n) => n.status !== "unaligned");
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
  assert.ok(!filtered.nodes.some((n) => n.status === "unaligned"));
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
  const unaligned = graph.nodes.find((n) => n.status === "unaligned");
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

test("renderFrontier lists every node in descending rank order with stage/under/instrument/shim lines", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-unaligned"));
  const listing = renderFrontier(graph);
  assert.ok(listing.startsWith(`# Frontier of ${graph.module}\n`));

  const root = graph.nodes.find((n) => n.slug === "root");
  const unaligned = graph.nodes.find((n) => n.slug === "child-unaligned");
  const ruling = graph.nodes.find((n) => n.slug === "child-ruling");

  // rank order, descending: root (1.0) > child-unaligned (0.75) > child-ruling (0.25)
  const at = (id) => listing.indexOf(`- ${id}`);
  assert.ok(at(root.id) >= 0 && at(unaligned.id) >= 0 && at(ruling.id) >= 0);
  assert.ok(at(root.id) < at(unaligned.id));
  assert.ok(at(unaligned.id) < at(ruling.id));

  // child-unaligned and child-ruling share the identical parent (root), so
  // their lines are compared within each node's own block, not by a global
  // substring search that the shared 'under' text would satisfy either way.
  const blockFor = (id) => {
    const start = listing.indexOf(`- ${id}`);
    const next = listing.indexOf("\n- ", start + 1);
    return listing.slice(start, next === -1 ? listing.length : next);
  };

  const unalignedBlock = blockFor(unaligned.id);
  assert.ok(unalignedBlock.includes(`  stage: ${unaligned.stage}`));
  assert.ok(unalignedBlock.includes(`  under: ${unaligned.under.join(", ")}`), "under: lists an un-aligned node's parents");
  assert.ok(unalignedBlock.includes("  instrument: none"));

  const rulingBlock = blockFor(ruling.id);
  assert.ok(rulingBlock.includes(`  stage: ${ruling.stage}`));
  assert.ok(!rulingBlock.includes("  under:"), "under: is only for un-aligned nodes");
  assert.ok(
    rulingBlock.includes(`shim (${ruling.shims[0].declared}): ${ruling.shims[0].artifact} — for: unstated — liquidation: ${ruling.shims[0].liquidation}`),
    "a shim with no 'for' prints 'unstated'",
  );

  const rootBlock = blockFor(root.id);
  assert.ok(rootBlock.includes(`instrument: ${root.instrument.kind}: ${root.instrument.ref}`), "a real instrument renders");
  assert.ok(!rootBlock.includes("  stage:"), "root has no stage");
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

// the browser never receives an un-aligned node (excludeUnaligned drops it
// before build()), but the status-word map must not lie about one if it
// ever did: 'question' is retired in favor of 'unaligned' -> "un-aligned".
test("STATUS_WORD carries 'unaligned' -> 'un-aligned' and no longer has a 'question' key", () => {
  assert.equal(R.STATUS_WORD.unaligned, "un-aligned");
  assert.equal(R.STATUS_WORD.question, undefined);
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

test("buildAlignment refuses a template with no marker", () => {
  assert.throws(() => buildAlignment("<title>x</title>", ALIGNMENT_GRAPH), /DG:ITEMS/);
});

test("groupAlignmentItems groups in the fixed stage order and ranks descending within a group", () => {
  const groups = groupAlignmentItems(ALIGNMENT_GRAPH.nodes.filter((n) => n.stage));
  assert.deepEqual(groups.map((g) => g.stage), ["ruling", "review", "maieutic", "periagogic"]);
  const ruling = groups.find((g) => g.stage === "ruling");
  const periagogic = groups.find((g) => g.stage === "periagogic");
  assert.equal(ruling.items.length, 1);
  assert.equal(ruling.items[0].slug, "child-ruling");
  assert.equal(periagogic.items.length, 1);
  assert.equal(periagogic.items[0].slug, "child-unaligned");
  assert.equal(groups.find((g) => g.stage === "maieutic").items.length, 0);
  assert.equal(groups.find((g) => g.stage === "review").items.length, 0);
});

test("--alignment output holds both items grouped under their stage headings in order, and no node without a stage", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = ALIGNMENT_GRAPH.nodes.find((n) => n.slug === "child-ruling");
  const unaligned = ALIGNMENT_GRAPH.nodes.find((n) => n.slug === "child-unaligned");
  const root = ALIGNMENT_GRAPH.nodes.find((n) => n.slug === "root");
  assert.equal(root.stage, null, "fixture root carries no stage");

  assert.ok(html.includes(ruling.id) && html.includes(ruling.question), "the ruling item is present");
  assert.ok(html.includes(unaligned.id) && html.includes(unaligned.question), "the periagogic (un-aligned) item is present");
  assert.ok(!html.includes(root.question), "the node without a stage is absent");

  // grouped under their stage headings, in the required order: the
  // "Ruling" stage heading precedes the ruling item, which precedes the
  // "Periagogic" heading, which precedes the periagogic item.
  const atRulingHeading = html.indexOf('id="stage-ruling"');
  const atRulingItem = html.indexOf(ruling.id);
  const atPeriagogicHeading = html.indexOf('id="stage-periagogic"');
  const atPeriagogicItem = html.indexOf(unaligned.id);
  assert.ok(atRulingHeading >= 0 && atRulingHeading < atRulingItem);
  assert.ok(atRulingItem < atPeriagogicHeading);
  assert.ok(atPeriagogicHeading < atPeriagogicItem);
});

test("--alignment output carries the author's words, the current answer, and the AI's account, correctly labelled", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = ALIGNMENT_GRAPH.nodes.find((n) => n.slug === "child-ruling");
  const unaligned = ALIGNMENT_GRAPH.nodes.find((n) => n.slug === "child-unaligned");

  assert.ok(html.includes("The author's words"), "the Disposition label is present");
  assert.ok(html.includes(unaligned.disposition), "the un-aligned node's author's-words text is present");
  assert.ok(html.includes("The node as it stands"), "the answered-node label is present");
  assert.ok(html.includes(ruling.answer), "the current answer text is present");
  assert.ok(html.includes(ruling.rationale), "the rationale text is present");
  assert.ok(html.includes("The AI's account"), "the Proposal label is present");
  assert.ok(html.includes(ruling.proposal), "the proposal text is present");

  // the un-aligned node has no '## Answer': its section must not appear at all.
  const unalignedBlock = html.slice(html.indexOf(unaligned.id));
  assert.ok(!unalignedBlock.slice(0, unalignedBlock.indexOf("</article>")).includes("The node as it stands"));
});

test("--alignment renders the ruling options and the periagogic/maieutic free-text field, and no controls for review", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  for (const label of ["Ratify as shown", "Ratify with edits", "Defer", "Overrule"]) {
    assert.ok(html.includes(label), `option "${label}" is present`);
  }
  assert.ok(html.includes("Your words"), "the periagogic/maieutic free-text label is present");

  const graph = {
    module: "example.test", ref: null, graphs: { main: {} },
    nodes: [{
      id: "example.test/main/r", slug: "r", question: "Reviewed?", graph: "main", stage: "review",
      under: [], rank: 1, status: "proposal", answer: "An answer under review.", proposal: "A proposal.",
    }],
  };
  const reviewHtml = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(reviewHtml.includes("In clean-context review; nothing to answer yet."));
  assert.ok(!reviewHtml.includes("Ratify as shown"), "a review item gets no ruling controls");
  assert.ok(!reviewHtml.includes("Your words"), "a review item gets no free-text field");
});

test("a ruling-stage item with an answer carries the account/as-shown caption above its controls; one with no answer does not", () => {
  const withAnswer = ALIGNMENT_GRAPH.nodes.find((n) => n.slug === "child-ruling");
  assert.ok(withAnswer.stage === "ruling" && withAnswer.answer, "fixture precondition: ruling stage with an answer");
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const caption = "The options rule on the AI's account above; 'as shown' means the draft in it. The node as it stands is what remains if you overrule.";
  assert.ok(html.includes(caption), "the caption is present");

  const start = html.indexOf(`data-id="${withAnswer.id}"`);
  const article = html.slice(start, html.indexOf("</article>", start));
  assert.ok(article.indexOf(caption) < article.indexOf('data-role="ruling"'), "the caption sits above the response controls");

  const noAnswerGraph = {
    module: "example.test", ref: null, graphs: { main: {} },
    nodes: [{
      id: "example.test/main/r2", slug: "r2", question: "Unanswered ruling?", graph: "main", stage: "ruling",
      under: [], rank: 1, status: "unaligned", disposition: "Still open.", answer: null,
    }],
  };
  const noAnswerHtml = buildAlignment(ALIGNMENT_TEMPLATE, noAnswerGraph);
  assert.ok(noAnswerHtml.includes("Ratify as shown"), "still a ruling item with the usual options");
  assert.ok(!noAnswerHtml.includes(caption), "no answer to point 'as shown' at, so no caption");
});

test("the doc id in --alignment output replaces '/' with ':'", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = ALIGNMENT_GRAPH.nodes.find((n) => n.slug === "child-ruling");
  const doc = ruling.id.replace(/\//g, ":");
  assert.ok(!doc.includes("/"));
  assert.ok(html.includes(`data-doc="${doc}"`));
  assert.ok(html.includes(`id="item-${doc}"`), "the item's anchor id uses the same transform");
});

test("a fenced ```markdown block inside a Proposal renders as a labelled draft, apart from the rest of the account", () => {
  const graph = {
    module: "example.test", ref: null, graphs: { main: {} },
    nodes: [{
      id: "example.test/main/d", slug: "d", question: "Drafted?", graph: "main", stage: "ruling",
      under: [], rank: 1, status: "proposal", answer: "Current answer.",
      proposal: "Ordinary account prose.\n\n```markdown\n## Answer\n\nA quoted earlier draft.\n```\n\nMore prose after.",
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(html.includes("Drafted at the sitting; the node above is current"));
  assert.ok(html.includes("A quoted earlier draft."));
  assert.ok(html.includes("Ordinary account prose.") && html.includes("More prose after."));
  // the draft is preformatted, not parsed as markdown itself
  assert.ok(html.includes("<pre><code>## Answer"));
});

test("--alignment escapes HTML in node content", () => {
  const graph = {
    module: "example.test", ref: null, graphs: { main: {} },
    nodes: [{
      id: "example.test/main/x", slug: "x", question: "<script>alert(1)</script>", graph: "main", stage: "periagogic",
      under: [], rank: 1, status: "unaligned", disposition: "<img src=x onerror=alert(1)>",
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;script&gt;") && html.includes("&lt;img"));
});

test("--alignment renders a markdown link as plain text", () => {
  const graph = {
    module: "example.test", ref: null, graphs: { main: {} },
    nodes: [{
      id: "example.test/main/l", slug: "l", question: "Linked?", graph: "main", stage: "maieutic",
      under: [], rank: 1, status: "unaligned", disposition: "See [growth](#commons.systems/disposition-graph/growth) for context.",
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  // scoped to the item's own article: the left rail legitimately links to it
  // with a real <a href="#item-..."> anchor, which must not count against
  // this check.
  const start = html.indexOf('data-id="example.test/main/l"');
  const article = html.slice(start, html.indexOf("</article>", start));
  assert.ok(article.includes("See growth for context."), "the link renders as its label, no anchor");
  assert.ok(!article.includes("<a "), "no anchor tag is produced inside the item");
});

test("the alignment header carries the title, module, per-stage counts, the intro paragraph, and a copy-all button", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  assert.ok(html.includes(">Alignment<"));
  assert.ok(html.includes(ALIGNMENT_GRAPH.module));
  assert.ok(html.includes("Every item is an open dialogue with the author, recorded as a node that carries its stage. Rulings and words written here are read back by the alignment session."));
  assert.ok(html.includes("Copy all responses"));
  assert.ok(html.includes(">Ruling<") && html.includes(">Review<") && html.includes(">Maieutic<") && html.includes(">Periagogic<"));
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

test("project({ rootDir }) with no --out still returns the graph --alignment needs", async () => {
  const { out, html, graph } = await project({ rootDir: resolve(HERE, "fixtures/valid-unaligned") });
  assert.equal(out, null);
  assert.equal(html, null);
  assert.ok(Array.isArray(graph.nodes) && graph.nodes.length > 0);
  const alignmentHtml = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(alignmentHtml.includes(graph.module));
});
