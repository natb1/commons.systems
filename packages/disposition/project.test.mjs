// node --test packages/disposition/project.test.mjs
//
// Two things are checked here: that the projector inlines a graph the page can
// read back, and that the page's own renderer (extracted from the template and
// run without a DOM) turns markdown into the HTML the layout expects.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, cp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { build, project } from "./project.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = await readFile(resolve(HERE, "browser-template.html"), "utf8");
const FIXTURE = JSON.parse(await readFile(resolve(HERE, "fixtures/browser/nodes.json"), "utf8"));

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
  const api = "esc inline mdHtml mdBlocks groupRejected plain firstSentence termIndex termRegex fmtPct formWord safeHref truncate";
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
