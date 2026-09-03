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

import { build, project, writeRules, writeAncestry } from "./project.mjs";
import { readGraph } from "./read.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = await readFile(resolve(HERE, "browser-template.html"), "utf8");
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
  const api = "esc inline mdHtml mdBlocks groupRejected plain firstSentence termIndex termRegex fmtPct formWord safeHref truncate shimsHtml chooseRoute savePlace loadPlace PLACE_KEY";
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

  // child-a1 has no '## Answer' of its own: it still gets an "open question"
  // line, just no answer paragraph
  assert.ok(content.includes(`${id("child-a1")} (open question)`));

  const rootA = nodesById.get(id("root-a"));
  assert.ok(content.includes(rootA.answer), "an ancestor's answer is reproduced verbatim");
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
