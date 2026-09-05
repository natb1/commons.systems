// node --test packages/disposition/project.test.mjs
//
// Two things are checked here: that the projector inlines a graph the page can
// read back, and that the page's own renderer (extracted from the template and
// run without a DOM) turns markdown into the HTML the layout expects.

import { test, after, describe } from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, mkdir, cp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { check, build, project, writeRules, writeAncestry, excludeUnaligned, renderFrontier, withOptionSentences, buildAlignment, orderAlignmentItems, frontmatterEdits, wordDiff } from "./project.mjs";
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
  const api = "esc inline mdHtml mdBlocks plain firstSentence termIndex termRegex fmtPct formWord safeHref truncate shimsHtml chooseRoute savePlace loadPlace PLACE_KEY STATUS_WORD STATUS_CLASS pill classPill stagePill fenceNoteHtml orderedOptions optionHtml optionAgainstHtml optionReadings factsHtml classHtml nodeHeader renderNode index DG relBadge bearsHtml readsSection readingBlock answerSection rowHtml";
  return new Function(`${m[1]}\nreturn { ${api.split(" ").join(", ")} };`)();
}
const R = loadRenderer();

/* ---------------------------------------------------------------- build */

test("build inlines a graph that parses back out of the page, each option's own sentence added", () => {
  const html = build(TEMPLATE, FIXTURE);
  const m = html.match(/<script type="application\/json" id="graph">([\s\S]*?)<\/script>/);
  assert.ok(m, "page carries a JSON graph element");
  assert.deepEqual(JSON.parse(m[1]), withOptionSentences(FIXTURE));
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

test("build strips 'probes' from every node before serializing -- the browser publishes the whole graph object, so an unstripped probe would reach anyone who opened the page", () => {
  const withProbes = {
    ...FIXTURE,
    nodes: FIXTURE.nodes.map((n, i) => (i === 0 ? {
      ...n,
      probes: [{
        id: "should-not-leak",
        asks: "A question the author has not seen yet.",
        why: "the record does not say",
        discharges: "the answer recommendation",
        source: "ai",
        raised: "2026-09-04",
        fact: null,
        status: null,
        reason: null,
      }],
    } : n)),
  };
  const html = build(TEMPLATE, withProbes);
  assert.ok(!html.includes("should-not-leak"), "a probe's id must not reach the built page");
  assert.ok(!html.includes("A question the author has not seen yet"), "nor its 'asks'");
  assert.ok(!html.includes("the record does not say"), "nor its 'why'");
  assert.ok(!html.includes('"probes"'), "the key itself is dropped, not just emptied");

  const m = html.match(/<script type="application\/json" id="graph">([\s\S]*?)<\/script>/);
  const parsed = JSON.parse(m[1]);
  assert.ok(!Object.prototype.hasOwnProperty.call(parsed.nodes[0], "probes"), "the node object itself carries no 'probes' key");
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
// path containing one. This copies project.mjs + the template + derive.mjs
// (not the whole package) into a space-containing directory and drives it
// with --input, so it needs no ancestor node_modules: derive.mjs has no
// dependency of its own, and this still needs none for read.mjs's 'yaml'
// import, since --input never reaches read.mjs at all.
test("CLI writes its output when invoked through a path containing a space", async () => {
  const dir = await freshTmpDir("project-space-");
  const spaceDir = join(dir, "has space");
  await mkdir(spaceDir, { recursive: true });
  await cp(join(HERE, "project.mjs"), join(spaceDir, "project.mjs"));
  await cp(join(HERE, "derive.mjs"), join(spaceDir, "derive.mjs"));
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
  assert.ok(
    listing.startsWith(`# Frontier of ${graph.module}\n\nReady to rule: 0 of 1 at the ruling stage. Awaiting the survey: 1.\n\n## Ruling order\n`),
    "the head counts what the two readings leave outstanding, above the ruling order",
  );
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

test("renderFrontier prints a 'probes:' line with the count of open probes, omitted when there are none", () => {
  const probe = (id, status) => ({
    id, asks: "?", why: "w", discharges: "d", source: "ai", raised: "2026-09-04", fact: null,
    status: status ?? null, reason: status ? "the author answered it" : null,
  });
  const mk = (id, probes) => ({
    id, stage: "maieutic", rank: 0.5, settles: 0,
    settledBy: { under: 0, alternatives: 0, depends: 0 }, status: "unanswered", authority: null, probes,
  });
  const graph = {
    module: "example.test",
    nodes: [
      mk("example.test/main/two-open", [probe("a"), probe("b", "discharged")]),
      mk("example.test/main/none-open", []),
      mk("example.test/main/no-field", undefined),
    ],
  };
  const listing = renderFrontier(graph);
  const everyNodeSection = listing.slice(listing.indexOf("## Every node, by rank"));
  const blockFor = (id) => {
    const start = everyNodeSection.indexOf(`- ${id}`);
    const next = everyNodeSection.indexOf("\n- ", start + 1);
    return everyNodeSection.slice(start, next === -1 ? everyNodeSection.length : next);
  };

  const twoOpen = blockFor("example.test/main/two-open");
  assert.ok(twoOpen.includes("  probes: 1 open"), "counts only the entry with no status");
  const depAt = twoOpen.indexOf("  settles:");
  const probesAt = twoOpen.indexOf("  probes:");
  assert.ok(depAt >= 0 && probesAt > depAt, "beside stage/settles/depends, after them");

  assert.ok(!blockFor("example.test/main/none-open").includes("  probes:"), "no open probes, no line");
  assert.ok(!blockFor("example.test/main/no-field").includes("  probes:"), "no 'probes' field at all, no line");
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
    "  fact answer: recommends narrower (boldness moderate, against: none); stands standing; fence; options (2): standing (ai), narrower (ai)",
  ), "the answer fact: its recommendation, the case against it, what stands, the fence, and every option with its source");
  assert.ok(delegated.includes(
    "  fact authority: recommends delegated (boldness moderate, against: none); ruled confirm on delegated, 2026-09-05; options (2): delegated, ratified",
  ), "a reserved fact's options are its vocabulary and carry no source");

  const moved = blockFor("moved");
  assert.ok(moved.includes(
    "  fact answer: recommends standing (boldness high, against: none); ruled confirm on standing, 2026-09-05, moved; stands standing; options (1): standing (ai)",
  ), "a ruling whose pin no longer matches the recommendation is flagged moved");

  const ratified = blockFor("ratified");
  assert.ok(!ratified.includes(", moved"), "a ruling that still pins its recommendation is not");
  assert.ok(!ratified.includes("; fence"), "a node recommending the option that stands carries no fence");

  const inherits = blockFor("inherits-delegated");
  assert.ok(inherits.includes("  fact answer: no recommendation; stands standing; options (1): standing (ai)"));

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

test("renderFrontier prints each node's survey state and marks the ready ones, and heads the listing with both counts", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-survey"));
  const listing = renderFrontier(graph);
  const blockFor = (slug) => {
    const node = graph.nodes.find((n) => n.slug === slug);
    assert.ok(node, `fixture has no node ${slug}`);
    const start = listing.indexOf(`- ${node.id}`);
    const next = listing.indexOf("\n- ", start + 1);
    return listing.slice(start, next === -1 ? listing.length : next);
  };

  // Two of the five stand at the ruling stage; one of those carries both
  // pins. Two owe the survey: one whose pin the recommendation moved past,
  // one that has never been read.
  assert.ok(
    listing.startsWith("# Frontier of example.test\n\nReady to rule: 1 of 2 at the ruling stage. Awaiting the survey: 2.\n"),
    "the head counts the ready and the awaited",
  );

  const ready = blockFor("ready-node");
  assert.ok(ready.includes("  review: forward (moderate, 2026-09-04)\n"), "a current draft review carries no flag");
  assert.ok(ready.includes("  survey: surveyed 2026-09-04\n"), "and a current survey prints when it read");
  assert.ok(ready.includes("  ready to rule"), "neither reading owed, at the ruling stage");

  const stale = blockFor("stale-survey");
  assert.ok(stale.includes("  review: forward (weak, 2026-09-03)\n"), "the draft review is untouched by the survey's staleness");
  assert.ok(stale.includes("  survey: surveyed 2026-09-03, changed since its survey; survey owed"));
  assert.ok(!stale.includes("ready to rule"), "a forward verdict alone is not readiness");

  const unsurveyed = blockFor("unsurveyed");
  assert.ok(!unsurveyed.includes("  review:"), "no review at all");
  assert.ok(unsurveyed.includes("  survey: owed"));

  const only = blockFor("survey-only");
  assert.ok(!only.includes("  review:"), "a survey pin alone prints no review line");
  assert.ok(only.includes("  survey: surveyed 2026-09-04\n"));
  assert.ok(!only.includes("ready to rule"), "the draft review is still owed");

  const kicked = blockFor("kicked-back");
  assert.ok(kicked.includes("  survey: surveyed 2026-09-03, changed since its survey\n"), "stale, but not owed below the review stage");
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

test("a 'Rejected' heading in prose renders as ordinary prose: the page reads structure, never a heading's text", () => {
  const html = R.mdHtml("why this\n\n### Rejected\n\n- other\n\n### After\n\nnot rejected");
  assert.ok(!html.includes("rejected\""), "no special class keyed off the heading's own words");
  assert.match(html, /<h3>Rejected<\/h3><ul><li>other<\/li><\/ul><h3>After<\/h3><p>not rejected<\/p>/);
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
  // factsHtml reads an option's text from `sentence`, the data the browser
  // actually receives (withOptionSentences, called by build()): read
  // straight off readGraph, an option carries no `sentence` of its own.
  const graph = withOptionSentences(await readGraph(resolve(HERE, "fixtures/valid-options")));
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

/* ---------------------------------------------------------------------- *
 * the facts-with-options encoding: status/reason, a ruling's own reason,
 * a fact's and a review's own case against, and a defined term's gloss,
 * across check(), build()'s option sentences, the frontier, and the page.
 * ---------------------------------------------------------------------- */

describe("check(): the new 'defines' shape and the gloss it may carry", () => {
  test("uses defineTerms to find a duplicate defined term even when 'defines' carries {term, gloss} objects", () => {
    const graph = {
      graphs: { g: { about: "g" } },
      nodes: [
        { id: "m/g/a", graph: "g", question: "A?", rank: 1, status: "s", children: [], under: [], defines: [{ term: "Widget", gloss: "First." }] },
        { id: "m/g/b", graph: "g", question: "B?", rank: 0.5, status: "s", children: [], under: [], defines: [{ term: "widget", gloss: "Second." }] },
      ],
    };
    const warnings = check(graph);
    assert.ok(
      warnings.includes('term "widget" defined by both m/g/a and m/g/b'),
      `expected a duplicate-term warning naming the plain term string, got: ${JSON.stringify(warnings)}`,
    );
  });

  test("warns when a defined term carries no gloss yet, on a {term, gloss} entry and on a bare string alike, and not when it has one", () => {
    const graph = {
      graphs: { g: { about: "g" } },
      nodes: [
        { id: "m/g/a", graph: "g", question: "A?", rank: 1, status: "s", children: [], under: [], defines: [{ term: "glossed", gloss: "Said once, here." }] },
        { id: "m/g/b", graph: "g", question: "B?", rank: 0.5, status: "s", children: [], under: [], defines: [{ term: "bare", gloss: null }] },
        { id: "m/g/c", graph: "g", question: "C?", rank: 0.25, status: "s", children: [], under: [], defines: ["also-bare"] },
      ],
    };
    const warnings = check(graph);
    assert.ok(!warnings.some((w) => w.includes('"glossed"')), "no warning for a term that carries a gloss");
    assert.ok(warnings.includes('m/g/b: term "bare" has no gloss'));
    assert.ok(warnings.includes('m/g/c: term "also-bare" has no gloss'), "a bare-string entry has no gloss either");
  });
});

describe("withOptionSentences: optionText carried into the data the page reads", () => {
  test("attaches the standing answer's '## Answer', another option's own prose, null where nothing is recorded, and a vocabulary option's gloss from the node that defines it -- without mutating the graph given it", () => {
    const glossNode = { id: "m/g/gloss", defines: [{ term: "widget", gloss: "A small reusable part." }] };
    const mainNode = {
      id: "m/g/main",
      answer: "What stands, in full.",
      facts: [
        {
          name: "answer",
          stands: "standing",
          recommends: "standing",
          boldness: "moderate",
          options: [
            { name: "standing" },
            { name: "other", prose: "The other way." },
            { name: "bare" },
          ],
        },
        {
          name: "authority",
          recommends: "widget",
          boldness: "low",
          options: [{ name: "widget" }, { name: "unglossed-term" }],
        },
      ],
    };
    const graph = { nodes: [glossNode, mainNode] };

    const enriched = withOptionSentences(graph);
    const main = enriched.nodes.find((n) => n.id === "m/g/main");
    const answerOptions = main.facts[0].options;
    assert.deepEqual(
      answerOptions.find((o) => o.name === "standing").sentence,
      { text: "What stands, in full.", from: "m/g/main" },
      "the standing option's sentence is the node's own '## Answer'",
    );
    assert.deepEqual(
      answerOptions.find((o) => o.name === "other").sentence,
      { text: "The other way.", from: "m/g/main" },
      "another answer option's sentence is its own prose",
    );
    assert.equal(answerOptions.find((o) => o.name === "bare").sentence, null, "nothing recorded, nothing to show");

    const authorityOptions = main.facts[1].options;
    assert.deepEqual(
      authorityOptions.find((o) => o.name === "widget").sentence,
      { text: "A small reusable part.", from: "m/g/gloss" },
      "a vocabulary option's sentence is the gloss on the node that defines the term",
    );
    assert.equal(authorityOptions.find((o) => o.name === "unglossed-term").sentence, null, "no node glosses this term");

    assert.equal(mainNode.facts[0].options[0].sentence, undefined, "the graph given it is never mutated");
  });
});

describe("termIndex: a defined term's own gloss, where the record wrote one", () => {
  test("prefers the recorded gloss over the node's opening sentence, and falls back where there is none yet -- on a {term, gloss} entry and on a bare string alike", () => {
    const glossed = R.termIndex([
      { id: "m/g/a", defines: [{ term: "widget", gloss: "A small reusable part." }], answer: "Something else entirely, as an opening sentence.", rank: 1 },
    ]);
    assert.equal(glossed.map.get("widget").sentence, "A small reusable part.");

    const noGlossYet = R.termIndex([
      { id: "m/g/b", defines: [{ term: "gadget", gloss: null }], answer: "The opening sentence carries the fallback.", rank: 1 },
    ]);
    assert.equal(noGlossYet.map.get("gadget").sentence, "The opening sentence carries the fallback.");

    const bareString = R.termIndex([
      { id: "m/g/c", defines: ["thingamajig"], answer: "A bare string entry falls back the same way.", rank: 1 },
    ]);
    assert.equal(bareString.map.get("thingamajig").sentence, "A bare string entry falls back the same way.");
  });
});

describe("factsHtml/optionHtml: status and reason, a ruling's reason, and the case against the recommendation", () => {
  test("marks a passed-over option with its status and reason, and shows the fact's own case against and the review's, with its strength, only on the recommended option", () => {
    const node = {
      review: { against: "A fuller review might weigh the cost differently.", strength: "moderate" },
      facts: [
        {
          name: "answer",
          recommends: "keep",
          boldness: "moderate",
          against: "Keeping it costs more to maintain going forward.",
          stands: "keep",
          options: [
            { name: "keep", sentence: { text: "Keep it as is." } },
            { name: "drop", status: "passed", reason: "Loses information nothing else recorded." },
          ],
        },
      ],
    };
    const html = R.factsHtml(node);
    assert.ok(
      html.includes('<span class="pill sm pro">passed over · Loses information nothing else recorded.</span>'),
      "the passed-over option's status and reason, packed into one mark like a ruling's",
    );
    assert.ok(html.includes("Keeping it costs more to maintain going forward."), "the fact's own case against its recommendation");
    assert.ok(html.includes("Review (moderate)."), "the review's case against is labelled with its strength");
    assert.ok(html.includes("A fuller review might weigh the cost differently."));

    const dropLi = html.slice(html.indexOf(">drop</span>"));
    assert.ok(!dropLi.includes("Keeping it costs more"), "no case against beside the option that was passed over, not recommended");
  });

  test("shows a ruling's own reason beside its response and date", () => {
    const node = {
      facts: [
        {
          name: "authority",
          recommends: "delegated",
          boldness: "moderate",
          options: [
            { name: "delegated", ruling: { response: "confirm", date: "2026-09-04", reason: "Trusted to move within this scope." } },
            { name: "ratified" },
          ],
        },
      ],
    };
    const html = R.factsHtml(node);
    assert.ok(html.includes('<span class="pill sm ruled">confirmed · confirm · 2026-09-04 · Trusted to move within this scope.</span>'));
  });

  test("a rejected heading in an option's own prose renders as ordinary prose, and nothing is shown when neither case against is on record", () => {
    const node = {
      facts: [
        {
          name: "answer",
          recommends: "standing",
          boldness: "low",
          stands: "standing",
          options: [{ name: "standing", sentence: { text: "### Rejected\n\nStill shown, as prose." } }],
        },
      ],
    };
    const html = R.factsHtml(node);
    assert.ok(!html.includes('class="rejected"'), "no special wrapper for a heading named 'Rejected' inside an option's own prose either");
    assert.match(html, /<h3>Rejected<\/h3><p>Still shown, as prose\.<\/p>/);
  });
});

describe("renderFrontier: option counts, the against marker, and the review's own case against", () => {
  test("factLine shows how many options are on the table and how many are passed over, and marks whether the recommendation carries a case against it", () => {
    const graph = {
      module: "m",
      nodes: [
        {
          id: "m/g/n1", rank: 1, status: "question", class: "unanswered", classSource: null,
          facts: [
            {
              name: "answer", recommends: "keep", boldness: "moderate", against: "It costs more to maintain.", stands: "keep",
              options: [{ name: "keep", source: "ai" }, { name: "drop", source: "ai", status: "passed" }, { name: "other", source: "ai" }],
            },
          ],
        },
        {
          id: "m/g/n2", rank: 0.5, status: "question", class: "unanswered", classSource: null,
          facts: [{ name: "answer", recommends: "standing", boldness: "low", stands: "standing", options: [{ name: "standing", source: "ai" }] }],
        },
      ],
    };
    const listing = renderFrontier(graph);
    assert.ok(listing.includes(
      "fact answer: recommends keep (boldness moderate, against: case against recorded); stands keep; options (3, 1 passed over): keep (ai), drop (ai), other (ai)",
    ));
    assert.ok(listing.includes(
      "fact answer: recommends standing (boldness low, against: none); stands standing; options (1): standing (ai)",
    ));
  });

  test("prints the review's own case against, collapsed to one line, right after the review line", () => {
    const graph = {
      module: "m",
      nodes: [
        {
          id: "m/g/n3", rank: 1, status: "question", class: "unanswered", classSource: null,
          facts: [{ name: "answer", recommends: "keep", boldness: "moderate", options: [{ name: "keep", source: "ai" }] }],
          review: { verdict: "forward", strength: "moderate", date: "2026-09-04", against: "Line one.\nLine two, which should collapse onto the same physical line." },
        },
      ],
    };
    const listing = renderFrontier(graph);
    assert.ok(listing.includes(
      "  review: forward (moderate, 2026-09-04)\n  against: Line one. Line two, which should collapse onto the same physical line.\n",
    ));
  });

  test("truncates a long review.against to one line with an ellipsis, never breaking the frontier's own line-per-entry format", () => {
    const graph = {
      module: "m",
      nodes: [
        {
          id: "m/g/n4", rank: 1, status: "question", class: "unanswered", classSource: null,
          facts: [],
          review: { verdict: "kickback", strength: "weak", date: "2026-09-04", against: "x".repeat(200) },
        },
      ],
    };
    const listing = renderFrontier(graph);
    const line = listing.split("\n").find((l) => l.startsWith("  against:"));
    assert.ok(line, "an against line is printed");
    assert.ok(line.length < 200, "the line is shorter than the source text");
    assert.ok(line.endsWith("…"), "a truncated line ends with an ellipsis");
  });
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

test("orderAlignmentItems returns one flat ruling order across every graph (settles, then rank, then id), and nothing else", () => {
  const ordered = orderAlignmentItems(TWO_GRAPHS);
  const { items } = ordered;
  // the second graph's root settles two leaves of the first graph (each
  // stands under it) and so leads the flat order, even though the
  // manifest names "first" before "second" -- a graph is a label here,
  // never a precedence.
  assert.equal(items[0].settles, 2, "fixture precondition: root settles both leaves");
  assert.deepEqual(items.map((n) => n.slug), ["root", "leaf-a", "leaf-b"], "settles descending; the tied leaves then break by id");

  // The per-graph `about` text and counts went with the pagehead: the rail
  // labels a row with the node's own graph and nothing reads a graph's
  // metadata (commons.systems/disposition-graph/alignment-page).
  assert.deepEqual(Object.keys(ordered), ["items"], "the order and nothing else");

  const one = orderAlignmentItems(ALIGNMENT_GRAPH);
  assert.equal(one.items[0].settles, one.items[1].settles, "fixture precondition: both leaves settle nothing of their own");
  assert.deepEqual(one.items.map((n) => n.slug), ["child-unaligned", "child-ruling"]);
  assert.ok(one.items[0].rank > one.items[1].rank, "settles ties, so the higher-ranked item comes first");
});

test("orderAlignmentItems takes only nodes carrying a stage, whatever graph they name, and settles outranks rank", () => {
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

  // A node naming a graph the manifest does not declare is an item like any
  // other: the order is over the nodes, and a graph is a label on a row.
  const stray = orderAlignmentItems({
    graphs: { main: { about: "declared" } },
    nodes: [
      { id: "example.test/main/a", slug: "a", graph: "main", stage: "ruling", rank: 1 },
      { id: "example.test/other/b", slug: "b", graph: "other", stage: "ruling", rank: 1 },
    ],
  });
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
  // The graph is a label on the rail row, never a division of the order, and
  // the row carries the node's stage rather than its place in the order,
  // which the order itself already shows.
  assert.ok(html.includes('<span class="rmeta mono">first · maieutic · settles'), "the graph, the stage and the settling count label a row");
  assert.ok(!/rmeta mono">\d+ ·/.test(html), "and no ordinal");

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

test("the eyebrow is one line: the settling count with its breakdown, the options pending, and what the node stands under", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = nodeBySlug(ALIGNMENT_GRAPH, "child-ruling");
  const article = itemHtml(html, ruling.id);
  assert.ok(article.includes(`>${ruling.id}<`), "the id is printed above the line");
  assert.equal(typeof ruling.settles, "number", "fixture precondition: readGraph computed a settles count");

  // What put the node where it is, and nothing else: the graph is already in
  // the id above, the rank breaks ties in an order the rail shows, and the
  // class is read off the facts the column renders one by one beneath
  // (commons.systems/disposition-graph/alignment-page). The stage went to the
  // chip, which carries the two routes into the dialogue and the readiness.
  const eyebrow = article.match(/<p class="eyebrow">.*?<\/p>/)[0];
  assert.ok(eyebrow.includes(`settles ${ruling.settles} (`), "the settling count leads, with its breakdown");
  assert.ok(eyebrow.includes("under example.test/main/root"), "and what it stands under closes the line");
  assert.ok(!eyebrow.includes(`>${ruling.graph}<`), "no graph word of its own");
  assert.ok(!eyebrow.includes("rank"), "no rank");
  assert.ok(!eyebrow.includes("unanswered"), "no class word");
  assert.ok(!eyebrow.includes("chip"), "and the stage is not in the line at all");

  assert.ok(article.includes('class="chip stage-ruling"'), "the stage chip");
  assert.ok(article.includes('class="chipname">ruling<'), "the chip names the stage");
  assert.equal(ruling.class, "unanswered", "fixture precondition: no ruling on its own answer, and none on its authority fact either");
  assert.ok(!html.includes("no stamp") && !html.includes("Fixture Author"), "no stamp is named anywhere on the page");

  const root = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, stage(ALIGNMENT_GRAPH, "example.test/main/root")), "example.test/main/root");
  assert.ok(root.match(/<p class="eyebrow">.*?<\/p>/)[0].includes("a root"), "a node under nothing says so");
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

test("--alignment carries the author's words, the node as it stands, and one column where there is no disposition to show", () => {
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
  assert.ok(rulingItem.includes('<div class="col-ask">'), "and what the ruling asks is the other");

  // Neither an answer nor a recommended text: the pane is not held open at
  // all, and one line after the stage's ask says so. Half a screen of white
  // reserved for a sentence spends the reader's attention on something that
  // is not the node (commons.systems/disposition-graph/alignment-page).
  const unalignedItem = itemHtml(html, unaligned.id);
  assert.equal(unaligned.answer, null, "fixture precondition: no answer");
  assert.ok(!unalignedItem.includes('<aside class="col-pane">'), "no pane is rendered");
  assert.ok(!unalignedItem.includes("The node as it would stand"), "and no label for one");
  const opens = html.lastIndexOf("<article", html.indexOf(`data-id="${unaligned.id}"`));
  assert.ok(html.slice(opens, opens + 30).includes('class="item nostand"'), "the item is one column");
  assert.ok(
    unalignedItem.includes('<p class="none nopane">No answer yet: this node is the author\'s disposition awaiting its answer.</p>'),
    "with the line saying so in the asking column",
  );
});

test("--alignment gives the asking column the apparatus and the pane only the disposition", () => {
  // A node whose ruling makes something decidable (a child under it, staged)
  // so askIndications renders, alongside the stage chip and the facts --
  // everything the ruling asks -- while the pane holds nothing but the node
  // itself (commons.systems/disposition-graph/alignment-page).
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
  for (const marker of ['class="indications"', "data-inputs", "data-fact", "data-option", 'class="readiness"', "<textarea"]) {
    assert.ok(!pane.includes(marker), `the pane never carries ${marker}`);
  }
  for (const marker of ['class="stagelead"', 'class="readiness"', "data-inputs", 'class="facts"', 'class="indications"']) {
    assert.ok(ask.includes(marker), `the asking column carries ${marker}`);
  }
  // The review keeps no section of its own: its readiness went to the chip
  // and its counter-argument to the row it argues against.
  assert.ok(!article.includes('class="rev"'), "no review section anywhere on the item");
  assert.ok(!article.includes("The review, in its two readings"));
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
  // The caption that used to say what a confirmation of the whole would do
  // went with the whole-node control: what confirming does is said on the
  // option's own row, and the ruling on the whole is liquidated
  // (the author's refinement of 2026-09-04).
  assert.ok(!article.includes("Confirming ratifies the recommended text as the node."), "no whole-node caption");
  assert.ok(!article.includes("Denying leaves the earlier draft, which no one has confirmed either."));

  // A fence that does move a frontmatter field prints it old -> new, in the
  // reader's own key order.
  const doctrine = await readGraph(resolve(HERE, "fixtures/valid-draft-old-doctrine"));
  const moved = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, doctrine), nodeBySlug(doctrine, "ruling-node").id);
  assert.ok(moved.includes("<code>form</code>"), "the changed field is named");
  assert.ok(moved.includes('<span class="was">rule</span>') && moved.includes('<span class="now">disposition</span>'));
  assert.ok(moved.includes("<code>under</code>") && moved.includes('<span class="now">[example.test/main/nowhere]</span>'));
  assert.ok(moved.includes("<code>tier</code>") && moved.includes('<span class="was">none</span>'));

  // A node with no fence gets no edit: its pane leads with the whole.
  const plain = itemHtml(html, nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(!plain.includes("The edit,"));
  assert.ok(plain.includes('<section class="stands">'), "the pane shows the node whole instead");
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

// The fixture the page's own tests read: a node at the ruling stage with a
// passed option, a ruling with a reason, a fact's case against, a review's
// counter-argument and a persistence fact; a maieutic node with two drafts and
// no recommendation; a periagogic node with no facts at all; and a node that
// glosses the vocabulary the reserved facts' options are named in.
const PAGE_GRAPH = await readGraph(resolve(HERE, "fixtures/alignment"));
const pageItem = (slug, graph = PAGE_GRAPH) => itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, graph), nodeBySlug(graph, slug).id);

// One fact's own fieldset, so an assertion about a fact never matches its
// neighbour. The facts are flat -- no fieldset nests inside another -- so the
// first closing tag after the opening one is this fact's.
function factHtml(article, name) {
  const start = article.indexOf(`data-fact="${name}"`);
  assert.ok(start > 0, `no fact rendered for ${name}`);
  return article.slice(start, article.indexOf("</fieldset>", start));
}

// One option's own row: from its own `<li class="choice` to the next one, or
// to the end of the list. A drill-down carries a list of its own (the
// readings' accounts), so the first `</li>` after the radio is not the row's.
function optionHtml(scope, name) {
  const at = scope.indexOf(`data-option="${name}"`);
  assert.ok(at > 0, `no row rendered for ${name}`);
  const start = scope.lastIndexOf('<li class="choice', at);
  const next = scope.indexOf('<li class="choice', at);
  return scope.slice(start, next > 0 ? next : scope.indexOf("</ul>", at));
}

test("every fact the node carries is rendered, the answer first, and none of them folds", () => {
  const article = pageItem("ruling-node");
  const node = nodeBySlug(PAGE_GRAPH, "ruling-node");

  assert.ok(article.includes("What this ruling asks"), "the label over the facts");
  assert.deepEqual(
    [...article.matchAll(/data-fact="([^"]+)"/g)].map((m) => m[1]),
    node.facts.map((f) => f.name),
    "every fact the node carries, in the record's own order, the answer first",
  );
  // The fold is struck: nothing is folded away at low boldness, and the page
  // no longer prints a line saying what folded (the author's words of
  // 2026-09-04, commons.systems/disposition-graph/alignment-page).
  assert.equal(node.facts.filter((f) => f.boldness === "low").length, 2, "fixture precondition: two low-boldness facts");
  assert.ok(!article.includes("Folded in, low boldness:"), "no fold line");
  assert.ok(!article.includes("Nothing on this node is asked separately"));
  assert.ok(article.includes('data-fact="authority"') && article.includes('data-fact="persistence"'), "both of them asked");

  // Each fact is labelled with the question it asks: the node's own for the
  // answer, the gloss of the fact's name where the record carries one, and
  // the question of the node that defines the term where it does not.
  assert.ok(factHtml(article, "answer").includes(node.question), "the answer fact asks the node's question");
  assert.ok(
    factHtml(article, "authority").includes("Who may change an answer in the fixture?"),
    "an unglossed term falls back to the question of the node that defines it",
  );
  assert.ok(
    factHtml(article, "persistence").includes("What would the ruling leave standing?"),
    "and a glossed one is labelled with its gloss",
  );
  assert.ok(!article.includes("What class would a confirmation confer?"), "no sentence the page keeps for itself");

  // The boldness rides the legend, and a fact with no recommendation says so
  // rather than rendering an unmarked list that reads as one withheld.
  assert.ok(factHtml(article, "answer").includes('<span class="pill rec-bold-moderate">moderate boldness</span>'));
  assert.ok(factHtml(pageItem("maieutic-node"), "answer").includes('<span class="pill rec-bold-none">no recommendation stands</span>'));
});

test("the kick-back is the last row of every fact, in the same group, with its feedback at the first level", () => {
  const article = pageItem("ruling-node");
  for (const name of ["answer", "authority", "persistence"]) {
    const fact = factHtml(article, name);
    const kickAt = fact.indexOf("data-kickback");
    assert.ok(kickAt > 0, `${name} carries a kick-back row`);
    const lastOption = [...fact.matchAll(/data-option="/g)].pop();
    assert.ok(lastOption.index < kickAt, `${name}'s kick-back comes after every option`);
    assert.ok(
      fact.slice(kickAt).includes('data-kickback-text rows="2"'),
      "and its feedback opens with the row, not in a drill-down",
    );
    assert.ok(fact.slice(kickAt).indexOf("<details") === -1, "nothing of the kick-back is folded");
    assert.ok(
      fact.includes(`name="fact:example.test:main:ruling-node:${name}" value="__kickback"`),
      "the refusal stays in the fact's own radio group",
    );
  }
  assert.ok(article.includes("None of these is acceptable: the node returns to the maieutic movement"), "captioned with what it does");
  assert.ok(article.includes("A kick-back on one fact moves the whole node"), "and with what it does to the rest of the node");
  assert.ok(!article.includes("Reject all of these, with feedback"), "the old rejection row's wording is gone");
});

test("every option's row leads with its sentence, read from the record and never from the page", () => {
  const answer = factHtml(pageItem("ruling-node"), "answer");
  const drafted = optionHtml(answer, "the-drafted-answer");
  const saysAt = drafted.indexOf('<span class="choicesays">');
  const nameAt = drafted.indexOf('<span class="choicename mono handle">the-drafted-answer</span>');
  assert.ok(saysAt >= 0 && nameAt > saysAt, "the sentence leads; the name follows as the handle a ruling is filed under");
  assert.ok(drafted.slice(saysAt, nameAt).includes("The drafted answer's own sentence"), "from the option's own subsection");

  // The option that stands has no subsection of its own: its sentence is the
  // node's `## Answer`, read through optionText like every other row's.
  assert.ok(optionHtml(answer, "standing").includes("What stands today, confirmed by the author"), "the standing row leads with the answer");

  // A reserved fact's options are the graph's own vocabulary, and their
  // sentence is the gloss on the node that defines the term -- projected from
  // there and never carried by the page, since a class means the same on
  // every node (commons.systems/disposition-graph/dialogue).
  const authority = factHtml(pageItem("ruling-node"), "authority");
  assert.ok(optionHtml(authority, "ratified").includes("You decided it, in this dialogue"), "the gloss is the sentence");
  assert.ok(optionHtml(authority, "delegated").includes("You hand this class of decision to the AI"));
  assert.ok(optionHtml(authority, "deferred").includes("You let the recommendation act"));

  // Where the record holds no sentence the row shows the bare name: a
  // sentence the page kept in its own text would be a rule no node projects.
  const unglossed = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH), nodeBySlug(ALIGNMENT_GRAPH, "child-ruling").id);
  const bare = optionHtml(factHtml(unglossed, "authority"), "ratified");
  assert.ok(bare.includes('<span class="choicename">ratified</span>'), "the bare name, with no sentence invented for it");
  assert.ok(!bare.includes("choicesays"));
});

test("a row carries the status the record holds: its source, the recommendation, what stands, a ruling, and a passing over", () => {
  const answer = factHtml(pageItem("ruling-node"), "answer");

  const standing = optionHtml(answer, "standing");
  assert.ok(standing.includes('<span class="pill alt-src">from the author, 2026-01-01</span>'), "the source and its ref");
  assert.ok(standing.includes('<span class="pill alt-stands">stands: the ratified answer</span>'), "what stands, named for the authority it has");
  assert.ok(standing.includes('<span class="pill alt-ruled">ruled: confirm, 2026-01-01</span>'), "the author's own ruling on it");

  const drafted = optionHtml(answer, "the-drafted-answer");
  assert.ok(drafted.includes('<span class="pill alt-src">from the AI, 2026-01-02</span>'));
  assert.ok(drafted.includes('<span class="pill alt-adopted">recommended, moderate boldness</span>'));
  assert.ok(drafted.includes('class="choice adopted"'), "and the row itself is marked");

  const passed = optionHtml(answer, "the-passed-option");
  assert.ok(passed.includes('<span class="pill alt-src">from the review, 2026-01-02</span>'));
  assert.ok(
    passed.includes('<span class="pill alt-passed">passed over: it measures the wrong thing</span>'),
    "a passed-over option stays listed, with the reason it was passed over",
  );
  assert.ok(passed.includes('data-option="the-passed-option"'), "and the author may still rule for it");

  // The fact's own line reports the ruling and that the recommendation has
  // moved since, with the author's reason where they gave one.
  assert.ok(answer.includes('Ruled confirm on <span class="mono">standing</span>, 2026-01-01. The recommendation has moved since.'));
  assert.ok(answer.includes("The author's reason for confirming what stands."));
});

// A choice that keeps the text already in the record is named for the
// authority that text has and never for more: only a ruling on the answer
// fact makes it the author's, and a class conferred on the authority fact is
// a ruling about who decides, not about this text.
test("the standing row is named for the authority the text actually has, and is not offered where nothing stands", () => {
  const ratified = optionHtml(factHtml(pageItem("ruling-node"), "answer"), "standing");
  assert.ok(ratified.includes("stands: the ratified answer"), "a ruling on the answer fact makes it the author's");

  const draft = optionHtml(factHtml(pageItem("child-ruling", ALIGNMENT_GRAPH), "answer"), "standing");
  assert.equal(nodeBySlug(ALIGNMENT_GRAPH, "child-ruling").class, "unanswered", "fixture precondition: no ruling on its answer");
  assert.ok(draft.includes("stands: a draft no one has confirmed"), "and without one it is a draft, whatever class is conferred elsewhere");

  const html = buildAlignment(ALIGNMENT_TEMPLATE, PAGE_GRAPH);
  assert.ok(!html.includes("the node as it stands"), "never a standing the text does not have");
  assert.ok(!html.includes("keep the answer as ratified") && !html.includes("keep the AI's draft"), "and never the old captions");

  // Nothing stands on the maieutic node, so no row offers to keep it.
  const open = factHtml(pageItem("maieutic-node"), "answer");
  assert.ok(!open.includes("alt-stands"), "nothing stands here, so the choice is not offered");
  assert.ok(open.includes('data-option="the-first-draft"'), "and the options on the table are still asked");
});

test("the recommended row carries the case against it, and no other row does", () => {
  const article = pageItem("ruling-node");

  // On the answer fact the clean-context review has returned a
  // counter-argument, so that is the line, at the strength the review gave it.
  const answer = factHtml(article, "answer");
  const drafted = optionHtml(answer, "the-drafted-answer");
  assert.ok(drafted.includes('<span class="againstlbl">The case against it</span>'), "the case against leads the line");
  assert.ok(drafted.includes("The review's own counter-argument against the drafted answer."));
  assert.ok(drafted.includes('<span class="pill rev-strength">the review, 2026-01-02, moderate</span>'), "with its source and strength");
  assert.ok(!drafted.includes("The AI's own case against the drafted answer."), "the review's replaces the AI's");
  for (const other of ["standing", "the-passed-option"]) {
    assert.ok(!optionHtml(answer, other).includes('class="against'), `no case against on ${other}`);
  }

  // Where no review has run, the fact's own `against` is the line.
  const persistence = factHtml(article, "persistence");
  assert.ok(optionHtml(persistence, "with the fixture's shim").includes("The AI's own case against keeping the shim here."));
  assert.ok(optionHtml(persistence, "with the fixture's shim").includes('<span class="pill rev-strength">the AI</span>'));

  // And where neither exists the row says so: a recommendation that goes
  // alone says that it does (commons.systems/disposition-graph/recording).
  const authority = factHtml(article, "authority");
  assert.ok(optionHtml(authority, "ratified").includes('<p class="against none">no case against is recorded</p>'));
});

test("an option's drill-down holds the rest of it, the words it rests on, the AI's reason, the readings and a control for the author's own", () => {
  const answer = factHtml(pageItem("ruling-node"), "answer");

  const drafted = optionHtml(answer, "the-drafted-answer");
  const drill = drafted.slice(drafted.indexOf("<details"));
  assert.ok(drill.includes("A second paragraph the drill-down carries."), "the rest of the option's own text");
  assert.ok(drill.includes("The text as it would stand"), "and, for a candidate answer, the text a ruling would leave");
  assert.ok(drill.includes("The drafted answer as it would stand, in full."));
  assert.ok(drill.includes("Why the AI recommends it"), "the fact's own reason, on the row it argues for");
  assert.ok(drill.includes("The reason the fixture recommends the drafted answer over what stands."));
  assert.ok(drill.includes('data-option-text="the-drafted-answer"'), "and a control for the author's reason or edits");
  assert.ok(!drafted.slice(0, drafted.indexOf("<details")).includes("Why the AI recommends it"), "the reason is one step down, never on the row");

  // The author's words the option rests on, where the author is its source:
  // the entries of the disposition dated as the option's own ref.
  const standing = optionHtml(answer, "standing");
  assert.ok(standing.includes("The author's words it rests on"));
  assert.ok(standing.includes("keep what stands unless something better is drafted"), "the entry dated as the option's ref");
  assert.ok(!standing.includes("draft it, and show me the case against"), "and not the entries of another date");
  assert.ok(standing.includes("The rest of the author’s words on this node are below."));
  assert.ok(!optionHtml(answer, "the-drafted-answer").includes("The author's words it rests on"), "nothing for an option the AI sourced");
});

test("--alignment's eyebrow carries the pending-option count right after settles, plural or singular, and omits it for a node with none", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-options"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const fresh = nodeBySlug(graph, "fresh-node");
  assert.equal(fresh.answerFact.options.length, 3, "fixture precondition: three answers on the table, one of them standing");
  const freshArticle = itemHtml(html, fresh.id);
  assert.ok(freshArticle.includes('<span class="meta mono">2 options pending</span>'), "plural, counting all but the one that stands");
  const eyebrow = freshArticle.match(/<p class="eyebrow">.*?<\/p>/)[0];
  const settlesAt = eyebrow.indexOf(`settles ${fresh.settles}`);
  const optsAt = eyebrow.indexOf("2 options pending");
  const parentsAt = Math.max(eyebrow.indexOf("under example.test"), eyebrow.indexOf("a root"));
  assert.ok(settlesAt >= 0 && settlesAt < optsAt && optsAt < parentsAt, "right after settles, before what it stands under");

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
  assert.ok(oneArticle.includes('<span class="meta mono">1 option pending</span>'), "singular");
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

test("what a tradition says of an option is on that option's row, with its account one step down", async () => {
  const answer = factHtml(pageItem("ruling-node"), "answer");
  const drafted = optionHtml(answer, "the-drafted-answer");
  const row = drafted.slice(0, drafted.indexOf("<details"));
  assert.ok(
    row.includes('href="https://example.test/artifact/abc123def#example.test/main/reading-node"'),
    "the chip links to the reading in the browser, which addresses every node by its id",
  );
  assert.ok(row.includes(">reading-node: supports</a>"), "adopted reads as support, in the reading's own name");

  const drill = drafted.slice(drafted.indexOf("<details"));
  assert.ok(drill.includes('<ul class="readacct">'), "the reading's own account is one step down");
  assert.ok(drill.includes("Supports the drafted answer."), "in the first sentences of its answer");

  // A reading bears on an option and not on the node, so a row no reading
  // names carries nothing for tradition -- not an empty mark.
  const standing = optionHtml(answer, "standing");
  assert.ok(!standing.includes("alt-reading") && !standing.includes("readacct"), "never onto an option no reading names");

  // A divergence reads as a departure.
  const rulings = await readGraph(resolve(HERE, "fixtures/valid-rulings"));
  const delegated = nodeBySlug(rulings, "delegated");
  const item = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, stage(rulings, delegated.id)), delegated.id);
  const narrower = optionHtml(factHtml(item, "answer"), "narrower");
  assert.ok(narrower.includes("reading-diverged: departs"), "diverged reads as a departure");
  assert.ok(narrower.includes('<span class="badge diverged">diverged</span>'), "and the account names the relation");
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

  assert.ok(article.includes('data-fact="existence"'), "the prune is a fact of its own");
  const existenceFs = factHtml(article, "existence");
  assert.ok(existenceFs.includes('data-option="keep"') && existenceFs.includes('data-option="prune"'), "both options");
  assert.ok(existenceFs.includes("recommended, "), "with the recommended one marked");
  assert.ok(existenceFs.includes("Nothing here survives as a node of its own"), "the fact's own reason, in the recommended row's drill-down");
  assert.ok(!article.includes("Confirm prunes the node"), "and no caption of its own");
  assert.ok(!article.includes("The edit"), "no edit, since the recommendation adopts the option that stands");

  const fresh = itemHtml(html, nodeBySlug(graph, "fresh-node").id);
  assert.ok(!fresh.includes('data-fact="existence"'), "a node nobody proposes to delete asks no existence fact");
});

test("the stage chip carries the node's readiness, and the review keeps no section of its own", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-survey"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  // The chip's own line: these fixtures talk about the two readings in their
  // own prose, and an assertion about the readiness must not match that.
  const item = (slug) => {
    const article = itemHtml(html, nodeBySlug(graph, slug).id);
    const start = article.indexOf('<span class="readiness">');
    assert.ok(start > 0, `no readiness rendered for ${slug}`);
    assert.ok(!article.includes('<section class="rev">'), `${slug} carries no review section`);
    return article.slice(start, article.indexOf("</p>", start));
  };

  const ready = item("ready-node");
  assert.ok(ready.includes("this draft: forwarded 2026-09-04"), "the draft's verdict and the date it read");
  assert.ok(ready.includes("the frontier: surveyed 2026-09-04"), "the survey's own pin, with its date");
  assert.ok(!ready.includes("is owed"), "neither reading is owed");
  assert.ok(ready.includes(">ready to rule<"));

  const stale = item("stale-survey");
  assert.ok(!stale.includes("moved since its review"), "the draft review is current");
  assert.ok(stale.includes("moved since its survey"), "and the survey is not");
  assert.ok(stale.includes("the survey of the frontier is owed"));
  assert.ok(!stale.includes("the review of this draft is owed"));
  assert.ok(!stale.includes(">ready to rule<"));

  const unsurveyed = item("unsurveyed");
  assert.ok(unsurveyed.includes("this draft: not yet reviewed") && unsurveyed.includes("the frontier: not yet surveyed"));
  assert.ok(unsurveyed.includes("the review of this draft is owed"));
  assert.ok(unsurveyed.includes("the survey of the frontier is owed"), "both, on a node with neither pin");

  const only = item("survey-only");
  assert.ok(only.includes("this draft: not yet reviewed"), "a survey pin alone leaves the draft review unrun");
  assert.ok(only.includes("the frontier: surveyed 2026-09-04"));
  assert.ok(only.includes("the review of this draft is owed"));
  assert.ok(!only.includes("the survey of the frontier is owed"));

  // Below the review stage neither reading is owed yet, so the chip says
  // nothing about what is owed and marks nothing ready.
  const kicked = item("kicked-back");
  assert.ok(kicked.includes("moved since its survey"), "the stale pin still shows");
  assert.ok(!kicked.includes("is owed"));
  assert.ok(!kicked.includes(">ready to rule<"));
});

test("the stage chip's readiness carries the count of open probes and only the count -- never a probe's asks, why, discharges or id", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-survey"));
  const node = nodeBySlug(graph, "ready-node");
  node.probes = [
    {
      id: "boundary-open",
      asks: "Is the boundary right where the answer stands?",
      why: "the record does not say and the AI has looked",
      discharges: "the answer recommendation",
      source: "ai",
      raised: "2026-09-04",
      fact: null,
      status: null,
      reason: null,
    },
    {
      id: "already-discharged",
      asks: "A question the author already answered.",
      why: "it was open once",
      discharges: "the answer recommendation",
      source: "ai",
      raised: "2026-09-03",
      fact: null,
      status: "discharged",
      reason: "the author answered it",
    },
  ];
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const article = itemHtml(html, node.id);
  const start = article.indexOf('<span class="readiness">');
  assert.ok(start > 0, "no readiness rendered");
  const readiness = article.slice(start, article.indexOf("</p>", start));
  assert.ok(readiness.includes("1 probe open"), "counts only the open one, singular");
  assert.ok(!readiness.includes("Is the boundary right"), "never a probe's 'asks'");
  assert.ok(!readiness.includes("the record does not say"), "never a probe's 'why'");
  assert.ok(!readiness.includes("the answer recommendation"), "never a probe's 'discharges'");
  assert.ok(!readiness.includes("boundary-open") && !readiness.includes("already-discharged"), "never a probe's id");

  const untouched = nodeBySlug(graph, "unsurveyed");
  const untouchedArticle = itemHtml(html, untouched.id);
  const untouchedStart = untouchedArticle.indexOf('<span class="readiness">');
  const untouchedReadiness = untouchedArticle.slice(untouchedStart, untouchedArticle.indexOf("</p>", untouchedStart));
  assert.ok(!untouchedReadiness.includes("probe"), "a node with no probes carries no probe pill at all");
});

test("what each stage asks: the author's words at the two early stages, a line at review, the facts alone at the ruling stage", () => {
  const periagogic = pageItem("periagogic-node");
  assert.ok(periagogic.includes("The dialogue owes your own account of what this question sits on"), "the periagogic ask");
  assert.ok(periagogic.includes(">Your account of the ground</label>"), "with the control for it");
  assert.ok(periagogic.includes('data-words rows="4"'));
  assert.ok(
    periagogic.indexOf("data-words") < periagogic.indexOf('<details class="drill words" open>'),
    "the control leads, with the author's existing words open beside it",
  );
  assert.ok(periagogic.includes("ask me what this sits on before you draft anything"), "which are the author's own");
  // A node with no facts offers what its stage asks and nothing invented.
  assert.ok(periagogic.includes("Nothing is proposed on this node yet"), "and says nothing is proposed yet");
  assert.ok(!periagogic.includes("data-fact="), "no fact is invented for it");
  assert.ok(!periagogic.includes('class="locked"'), "and nothing is locked, since nothing below is asked");

  const maieutic = pageItem("maieutic-node");
  assert.ok(maieutic.includes("The ground is recorded and no answer is drafted."), "the maieutic ask");
  assert.ok(maieutic.includes(">Your intention</label>"));
  assert.ok(maieutic.includes("No words of yours are recorded on this node yet."), "with the line that says the record holds none");

  const ruling = pageItem("ruling-node");
  assert.ok(!ruling.includes("data-words"), "the ruling stage asks for no words of its own: its ask is the facts");
  assert.ok(!ruling.includes("Your account of the ground") && !ruling.includes("Your intention"));
  assert.ok(
    ruling.indexOf('<details class="drill words">') > ruling.indexOf('class="facts"'),
    "and the author's words stay a drill-down below the facts",
  );

  const inReview = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH), nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(inReview.includes("This draft is with the clean-context review"), "the review stage says the reading is owed or running");
  assert.ok(!inReview.includes("data-words"), "and offers no control at all");

  // The three responses the page used to stage on the node as a whole are
  // gone with the ruling on the whole: every response is given on a fact
  // (the author's refinement of 2026-09-04).
  const html = buildAlignment(ALIGNMENT_TEMPLATE, PAGE_GRAPH);
  for (const gone of ["Your ruling on the whole", "Confirm with edits", "Deny with feedback", "data-controls", "data-note-label"]) {
    assert.ok(!html.includes(gone), `the whole-node control's ${gone} is gone`);
  }
});

// A confirmation recorded on a node that has not reached the ruling stage
// is invalid (the author's ruling of 2026-09-04): renderAsk computes
// `locked` off the stage and threads it through every input among the facts,
// which still render in full -- the gate disables input, it never hides what
// would be asked. The stage's own control is not among them: it is what the
// earlier stages ask for.
test("the ruling stage gates the inputs, but never hides what they would answer", () => {
  const locked = pageItem("maieutic-node");
  const lockedAsk = locked.slice(locked.indexOf('<div class="col-ask">'));
  const factInputs = factHtml(lockedAsk, "answer").match(/<input type="radio"[^>]*>|<textarea[^>]*>/g) || [];
  assert.ok(factInputs.length > 0, "fixture precondition: the locked item asks at least one input");
  for (const tag of factInputs) assert.ok(tag.includes(" disabled"), `locked: disabled (${tag})`);
  assert.ok(lockedAsk.includes('class="locked"'), "the locked note is present");
  assert.ok(lockedAsk.includes('class="facts"'), "the locked item still renders its facts");
  assert.ok(/class="choice/.test(lockedAsk), "and their options");
  assert.ok(!/<textarea[^>]*data-words[^>]*disabled/.test(lockedAsk), "but the stage's own control is open: it is what this stage asks for");

  // The ruling stage is the one stage a confirmation is valid on, so nothing
  // among its facts is disabled.
  const ruling = pageItem("ruling-node");
  const rulingAsk = ruling.slice(ruling.indexOf('<div class="col-ask">'), ruling.indexOf('<aside class="col-pane">'));
  const rulingInputs = rulingAsk.match(/<input type="radio"[^>]*>|<textarea[^>]*>/g) || [];
  assert.ok(rulingInputs.length > 0, "fixture precondition: the ruling item asks at least one input");
  for (const tag of rulingInputs) assert.ok(!tag.includes(" disabled"), `ruling: not disabled (${tag})`);
  assert.ok(!rulingAsk.includes('class="locked"'), "no locked note at the ruling stage");
  assert.ok(rulingAsk.includes('class="facts"'), "the ruling item renders its facts too");
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

  // Five metrics, each a signal, an instrument or a criterion of a recorded
  // disposition. Ruleable is both readings behind the node, Stale is either
  // pin no longer matching or a ruled recommendation moved, and Survey owed
  // instruments the same option of clean-context-review as Ruleable, from the
  // other side (commons.systems/disposition-graph/alignment-page).
  assert.ok(html.includes('<dl class="metrics">'), "the metrics sit at the top of the rail");
  assert.ok(!html.includes("<dt>ready to rule</dt>"), "the ruling stage alone is not the count");
  const instruments = [
    ["open", "commons.systems/disposition-graph/unanswered"],
    ["ruleable", "commons.systems/disposition-graph/clean-context-review"],
    ["next settles", "commons.systems/disposition-graph/alignment-order"],
    ["stale", "commons.systems/disposition-graph/frontier-consistency"],
    ["survey owed", "commons.systems/disposition-graph/clean-context-review"],
  ];
  for (const [key, of] of instruments) {
    assert.ok(html.includes(`<dt>${key}</dt>`), `the ${key} metric`);
    assert.ok(html.includes(`Instruments ${of}`), `${key} names the disposition it instruments`);
  }
  assert.equal(html.split('class="metric"').length - 1, 5, "five and no more");
  assert.deepEqual(
    [...html.matchAll(/<dt>([^<]+)<\/dt>/g)].map((m) => m[1]),
    instruments.map(([key]) => key),
    "in the order the answer names them",
  );

  // With no shim naming the browser there is nowhere to link, and a metric
  // renders unlinked rather than pointing nowhere.
  assert.ok(html.includes('<div class="metric"'), "a div, not an anchor, with no browser shim");
  assert.ok(!html.includes('<a class="metric"'));

  // With one, each metric links out to that disposition's page there: the
  // browser addresses every node by its id and this page addresses none. A
  // node the browser does not render -- one with no answer yet -- is named by
  // its id and not linked, and the metric's title says so.
  const withBrowser = (nodes) => buildAlignment(ALIGNMENT_TEMPLATE, {
    ...ALIGNMENT_GRAPH,
    nodes: [
      ...ALIGNMENT_GRAPH.nodes.map((n, i) => (i === 0 ? {
        ...n,
        shims: [{
          artifact: "the graph browser, published as https://example.test/artifact/abc123def",
          for: "the record's documentation",
          liquidation: "published from the implementation ref",
          declared: "2026-09-03",
        }],
      } : n)),
      ...nodes,
    ],
  });
  const named = instruments.map(([, of]) => of).filter((of, i, all) => all.indexOf(of) === i);
  const all = withBrowser(named.map((id) => ({ id, graph: "main", question: `${id}?`, answer: "Answered." })));
  assert.equal(all.split('<a class="metric"').length - 1, 5, "all five link");
  for (const of of named) {
    assert.ok(all.includes(`href="https://example.test/artifact/abc123def#${of}"`), `${of} is addressed by its id in the browser`);
  }
  assert.ok(!all.includes('class="metric-of'), "and no metric prints its id when it can link to it");

  const [firstNamed, ...rest] = named;
  const partial = withBrowser([
    { id: firstNamed, graph: "main", question: `${firstNamed}?`, answer: null },
    ...rest.map((id) => ({ id, graph: "main", question: `${id}?`, answer: "Answered." })),
  ]);
  assert.ok(!partial.includes(`href="https://example.test/artifact/abc123def#${firstNamed}"`), "an answerless node is not linked");
  assert.ok(
    partial.includes(`<span class="metric-of mono">${firstNamed}</span>`),
    "the metric carries the node's id instead",
  );
  assert.ok(
    partial.includes(`Instruments ${firstNamed}, which the browser does not render: it has no answer yet.`),
    "and says so in its title",
  );
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

  // The markup one item renders: the control the stage's own ask offers, one
  // fieldset over everything the item can take, and one fact with its options,
  // its per-option text controls and the kick-back last -- the hooks the
  // script reads (renderAsk, renderFact, renderOption, renderKickback).
  const built = items.map((spec) => {
    const item = el("article", { "data-item": "", "data-doc": spec.doc, "data-id": spec.id, "data-stage": spec.stage });
    const controls = el("fieldset", { "data-inputs": "" });
    const words = el("textarea", { "data-words": "" });
    const state = el("p", { "data-state": "" });

    const fact = el("fieldset", { "data-fact": "authority" });
    const radios = ["ratified", "delegated"].map((v) => Object.assign(
      el("input", { type: "radio", value: v, "data-option": v }),
      { value: v },
    ));
    const kick = Object.assign(el("input", { type: "radio", value: "__kickback", "data-kickback": "" }), { value: "__kickback" });
    const notes = {};
    for (const v of ["ratified", "delegated"]) notes[v] = el("textarea", { "data-option-text": v });
    const kickNote = el("textarea", { "data-kickback-text": "" });
    fact.desc = [...radios, kick, ...Object.values(notes), kickNote];
    fact.radios = radios;
    fact.kick = kick;
    fact.notes = notes;
    fact.kickNote = kickNote;

    controls.desc = [words, fact, ...fact.desc];
    item.desc = [words, controls, state, fact, ...fact.desc];
    item.words = words;
    item.state = state;
    item.controls = controls;
    item.fact = fact;
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
    "btn-launch": el("a", { "data-seed-base": "https://claude.ai/code?repositories=owner%2Frepo" }),
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
  if (sel === "textarea") return node.tag === "textarea";
  if (sel === "textarea:not([disabled])") return node.tag === "textarea" && !node.disabled;
  if (sel.startsWith('input[type="radio"][value=')) {
    const want = sel.match(/value="([^"]*)"/)[1];
    return node.tag === "input" && node.getAttribute("value") === want;
  }
  const valued = sel.match(/^\[(data-fact|data-option-text)="([^"]*)"\]$/);
  if (valued) return node.getAttribute(valued[1]) === valued[2];
  for (const attr of ["data-state", "data-inputs", "data-mark", "data-fact", "data-words", "data-kickback", "data-kickback-text"]) {
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

test("the page stages a response on a fact and submits it as one document per node", async () => {
  const db = alStubDb();
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  const page = await loadAlignmentScript(env);

  const [a, b] = env.items;
  a.fact.radios[0].checked = true;
  a.fact.notes.ratified.value = "Confirmed, with my reason.";
  page.alStage(a);
  b.words.value = "The ground, in my own words.";
  page.alStage(b);

  assert.equal(env.byId["staged-count"].textContent, "2 responses staged");
  assert.equal(env.byId["btn-submit"].textContent, "Record 2 for a session");
  assert.equal(env.byId["btn-submit"].disabled, false);
  assert.deepEqual(Object.keys(JSON.parse(env.storage["alignment-staged:example.test"])), [a.attrs["data-doc"], b.attrs["data-doc"]]);
  assert.equal(env.rails[0].mark.textContent, "●", "the rail marks a staged item");

  await page.alSubmit();

  // The document the page writes: the node, the stage it was at, when, the
  // words its stage asked for, and one entry per fact the author answered
  // (commons.systems/disposition-graph/alignment-page).
  const written = db.writes.get("responses/example.test:main:a");
  assert.deepEqual(Object.keys(written).sort(), ["facts", "node", "stage", "updated", "words"]);
  assert.equal(written.node, "example.test/main/a");
  assert.equal(written.stage, "ruling");
  assert.equal(written.words, "", "no words are asked at the ruling stage");
  assert.deepEqual(written.facts, [
    { name: "authority", option: "ratified", kickback: false, text: "Confirmed, with my reason." },
  ]);
  assert.match(written.updated, /^\d{4}-\d{2}-\d{2}T/);

  const words = db.writes.get("responses/example.test:main:b");
  assert.deepEqual(words.facts, [], "the words a stage asks for are a response with no fact answered");
  assert.equal(words.words, "The ground, in my own words.");

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

test("the kick-back on a fact is a denial with feedback on that decision, and reads back onto the page", async () => {
  const db = alStubDb();
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  const page = await loadAlignmentScript(env);

  const [a, b] = env.items;
  a.fact.radios[1].checked = true;
  page.alStage(a);
  assert.equal(env.byId["staged-count"].textContent, "1 response staged", "an option alone is a response");

  b.fact.kick.checked = true;
  b.fact.kickNote.value = "None of these; here is why.";
  page.alStage(b);

  await page.alSubmit();

  assert.deepEqual(db.writes.get("responses/example.test:main:a").facts, [
    { name: "authority", option: "delegated", kickback: false, text: "" },
  ], "a confirmation with no words of its own");
  assert.deepEqual(db.writes.get("responses/example.test:main:b").facts, [
    { name: "authority", option: null, kickback: true, text: "None of these; here is why." },
  ], "the kick-back names no option and carries the feedback the row asked for");

  // and it reads back onto the page, so a reload does not lose it
  const env2 = alStubDom({ items: SCRIPT_ITEMS, db });
  await loadAlignmentScript(env2);
  assert.equal(env2.items[0].fact.radios[1].checked, true, "the confirmed option comes back");
  assert.equal(env2.items[1].fact.kick.checked, true, "and so does the kick-back");
  assert.equal(env2.items[1].fact.kickNote.value, "None of these; here is why.", "with its feedback");
});

test("the text staged with a fact is the text of the row the author chose", async () => {
  // Every option carries a control for the author's reason and their edits,
  // so the page has to stage the one belonging to the chosen row and not
  // whichever it finds first.
  const env = alStubDom({ items: SCRIPT_ITEMS, db: null });
  const page = await loadAlignmentScript(env);
  const [a] = env.items;

  a.fact.notes.ratified.value = "A reason written against the first row.";
  a.fact.notes.delegated.value = "A reason written against the second.";
  a.fact.radios[1].checked = true;
  page.alStage(a);

  const staged = JSON.parse(env.storage["alignment-staged:example.test"])[a.attrs["data-doc"]];
  assert.deepEqual(staged.facts, [
    { name: "authority", option: "delegated", kickback: false, text: "A reason written against the second." },
  ]);

  // Words written with nothing chosen are kept rather than dropped: a
  // half-finished response must survive the next keystroke.
  const env2 = alStubDom({ items: SCRIPT_ITEMS, db: null });
  const page2 = await loadAlignmentScript(env2);
  env2.items[0].fact.notes.ratified.value = "Still deciding.";
  page2.alStage(env2.items[0]);
  assert.deepEqual(JSON.parse(env2.storage["alignment-staged:example.test"])[SCRIPT_ITEMS[0].doc].facts, [
    { name: "authority", option: null, kickback: false, text: "Still deciding." },
  ]);
});

test("with no db the page keeps responses in this browser and says so on the footer", async () => {
  const env = alStubDom({ items: SCRIPT_ITEMS, db: null });
  const page = await loadAlignmentScript(env);
  assert.equal(env.byId["foot-note"].textContent, "No shared record in this view: responses are kept in this browser only.");

  const [a] = env.items;
  a.fact.kick.checked = true;
  a.fact.kickNote.value = "Denied, and here is why.";
  page.alStage(a);
  await page.alSubmit();

  const kept = JSON.parse(env.storage["alignment-responses:example.test"]);
  assert.deepEqual(Object.keys(kept), ["example.test:main:a"]);
  assert.equal(kept["example.test:main:a"].facts[0].kickback, true);
  assert.deepEqual(JSON.parse(env.storage["alignment-staged:example.test"]), {});
});

test("a refused write keeps its staged copy and puts the error's own message on the footer", async () => {
  const db = alStubDb({ failOn: "example.test:main:b" });
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  const page = await loadAlignmentScript(env);

  const [a, b] = env.items;
  a.fact.radios[0].checked = true;
  page.alStage(a);
  b.fact.radios[1].checked = true;
  page.alStage(b);
  await page.alSubmit();

  assert.ok(db.writes.has("responses/example.test:main:a"), "the write that succeeded stands");
  assert.ok(!db.writes.has("responses/example.test:main:b"));
  assert.deepEqual(Object.keys(JSON.parse(env.storage["alignment-staged:example.test"])), ["example.test:main:b"], "the refused one is still staged");
  assert.equal(env.byId["foot-note"].textContent, "the record refused it");
  assert.equal(env.byId["staged-count"].textContent, "1 response staged");
});

test("a node recorded at the ruling stage and since moved back offers no change affordance", async () => {
  // Its fact inputs carry their own `disabled` from the render, and an
  // element's own disabled attribute is never lifted by an ancestor fieldset
  // -- so a "change" button there would open the fieldset and leave every
  // control inert. The page offers none and says why.
  const db = alStubDb();
  await db.doc("responses/example.test:main:b").set({
    node: "example.test/main/b", stage: "ruling", words: "",
    facts: [{ name: "authority", option: "ratified", kickback: false, text: "Ruled when it was open." }],
    updated: "2026-09-03T09:00:00.000Z",
  });
  await db.doc("responses/example.test:main:a").set({
    node: "example.test/main/a", stage: "ruling", words: "",
    facts: [{ name: "authority", option: "ratified", kickback: false, text: "Ruled." }],
    updated: "2026-09-03T09:00:00.000Z",
  });
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  await loadAlignmentScript(env);
  const [ruling, movedBack] = env.items;

  assert.equal(movedBack.getAttribute("data-stage"), "periagogic", "the fixture's second item has moved back off the ruling stage");
  assert.equal(movedBack.state.children.length, 0, "no change button is appended on it");
  assert.match(movedBack.state.textContent, /^Recorded /);
  assert.match(movedBack.state.textContent, /takes no response here/);

  // The ruling-stage item is unaffected: it still offers the change.
  assert.equal(ruling.state.children.length, 1, "the ruling-stage node keeps its change button");
  assert.equal(ruling.state.children[0].getAttribute("data-change"), "");
  assert.ok(ruling.state.textContent.startsWith("Submitted "));
});

test("the page reads back what was submitted before, and the copy and the launch link carry the same instruction", async () => {
  const db = alStubDb();
  await db.doc("responses/example.test:main:a").set({
    node: "example.test/main/a", stage: "ruling", words: "",
    facts: [{ name: "authority", option: "ratified", kickback: false, text: "Earlier." }],
    updated: "2026-09-03T09:00:00.000Z",
  });
  const env = alStubDom({ items: SCRIPT_ITEMS, db });
  const page = await loadAlignmentScript(env);

  const [a, b] = env.items;
  assert.equal(a.fact.notes.ratified.value, "Earlier.", "the submitted response is shown on its own row");
  assert.equal(a.fact.radios[0].checked, true);
  assert.ok(a.state.textContent.startsWith("Submitted "));

  b.words.value = "Still thinking.";
  b.fact.kick.checked = true;
  b.fact.kickNote.value = "None of these.";
  page.alStage(b);

  let copied = null;
  env.navigator.clipboard = { writeText: (t) => { copied = t; return Promise.resolve(); } };
  page.alCopyAll();

  // The instruction is `/align <node id>` per node, the words its stage asked
  // for, and one line per fact answered.
  assert.match(copied, /^\/align example\.test\/main\/a\n\nauthority: ratified — Earlier\.$/m);
  assert.match(copied, /\/align example\.test\/main\/b\n\nStill thinking\.\n\nauthority: kick back — None of these\./);

  // The launch link is the same instruction by the other route: two controls
  // claiming to do the same thing must not emit different text
  // (commons.systems/disposition-graph/ruling-transport).
  const url = new URL(env.byId["btn-launch"].href);
  assert.equal(url.searchParams.get("prompt"), copied, "the link's own prompt is what the copy control copies");
  assert.equal(url.searchParams.get("repositories"), "owner/repo", "seeded with the repo the record's shim declares");
});

test("with nothing staged the instruction is the bare /align, and both routes still agree", async () => {
  const env = alStubDom({ items: SCRIPT_ITEMS, db: null });
  const page = await loadAlignmentScript(env);
  let copied = null;
  env.navigator.clipboard = { writeText: (t) => { copied = t; return Promise.resolve(); } };

  page.alCopyAll();
  assert.equal(copied, "/align", "nothing to carry, so nothing is claimed");
  assert.equal(new URL(env.byId["btn-launch"].href).searchParams.get("prompt"), "/align");
});
