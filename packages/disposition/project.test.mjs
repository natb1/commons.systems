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

/* The template's script is written so that every top-level statement is a
   declaration and the one call is guarded on `document`. That lets the whole
   renderer be loaded here, without a DOM, and called directly. */
function loadRenderer() {
  const m = TEMPLATE.match(/<script>\n([\s\S]*?)\n<\/script>/);
  assert.ok(m, "template has a plain <script> block");
  const api = "esc inline mdHtml mdBlocks groupRejected plain firstSentence termIndex termRegex fmtPct formWord safeHref truncate shimsHtml chooseRoute savePlace loadPlace PLACE_KEY STATUS_WORD STATUS_CLASS pill stampPill unansweredPill draftNoteHtml alternativesHtml authorityHtml rowHtml";
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
    `  recommendation: adopts ${ruling.recommendation.adopts}, ${ruling.recommendation.class}, boldness ${ruling.recommendation.boldness}`,
  ));
  assert.ok(rulingBlock.includes(`  review: forward (strong, 2026-09-03)`), "not stale (of matches)");
  assert.ok(!rulingBlock.includes("draft changed since the review"));
  assert.ok(rulingBlock.includes("  draft: yes"));

  const reviewOnlyBlock = blockFor("review-node");
  assert.ok(reviewOnlyBlock.includes("  recommendation: adopts standing, delegated, boldness high"));
  assert.ok(!reviewOnlyBlock.includes("  review:"), "no review yet at the review stage");
  assert.ok(!reviewOnlyBlock.includes("  draft:"));
});

test("renderFrontier appends ', draft changed since the review' when reviewStale", async () => {
  const dir = await freshTmpDir("project-frontier-stale-");
  await mkdir(join(dir, "main"), { recursive: true });
  await writeFile(join(dir, "disposition.yaml"), "module: example.test\ngraphs:\n  main:\n    about: fixture\n");
  await writeFile(
    join(dir, "main", "stale.md"),
    "---\nquestion: Stale?\nform: rule\nauthority:\n  class: deferred\n  by: x\n  date: 2026-01-01\nstage: ruling\nrecommendation:\n  adopts: standing\n  class: ratified\n  boldness: low\n  amends: " + "b".repeat(40) + "\n  at: a1b2c3d\nreview:\n  verdict: forward\n  strength: none\n  date: 2026-01-01\n  of: " + "a".repeat(40) + "\n---\n\n## Answer\n\nAns.\n",
  );
  const graph = await readGraph(dir);
  const listing = renderFrontier(graph);
  assert.ok(listing.includes("  review: forward (none, 2026-01-01), draft changed since the review"));
});

test("renderFrontier names what the recommendation adopts, marks a prune, and marks a stale recommendation", async () => {
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
  assert.ok(fresh.includes("  recommendation: adopts split-the-node, ratified, boldness high"));
  assert.ok(!fresh.includes("(prune)"), "the adopted alternative is not a prune");
  assert.ok(!fresh.includes("standing text changed since the recommendation"));
  assert.ok(fresh.includes("  draft: yes"));
  assert.ok(fresh.includes(
    "  alternatives: 3 (keep-standing:author, split-the-node:review, follow-the-instrument:proposal)",
  ), "the count, then each name with its source, in the list's own order");
  const draftAt = fresh.indexOf("  draft:");
  const altsAt = fresh.indexOf("  alternatives:");
  assert.ok(draftAt >= 0 && draftAt < altsAt, "the alternatives line comes last of the dialogue lines");

  const prune = blockFor("prune-node");
  assert.ok(prune.includes("  recommendation: adopts fold-into-the-parent (prune), delegated, boldness moderate"));
  assert.ok(!prune.includes("  draft:"), "a prune quotes no fence");
  assert.ok(prune.includes("  alternatives: 1 (fold-into-the-parent:review)"));

  const stale = blockFor("stale-node");
  assert.ok(stale.includes(
    "  recommendation: adopts standing, delegated, boldness low, standing text changed since the recommendation",
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
      { name: "keep-standing", source: "author", ref: "2026-09-01", prune: false },
      { name: "fold-into-the-parent", source: "review", ref: "2026-09-02", prune: true },
      { name: "follow-the-instrument", source: "proposal", ref: "node --test x.mjs", prune: false },
    ],
    alternativesText: {
      "keep-standing": "Leave the node as it stands.",
      "fold-into-the-parent": "Delete the node; the one sentence that survives moves up.",
      "follow-the-instrument": "The instrument contradicts the standing answer.",
    },
  });
  assert.ok(html.includes("Pending alternatives"));
  for (const name of ["keep-standing", "fold-into-the-parent", "follow-the-instrument"]) {
    assert.ok(html.includes(`>${name}</span>`), `${name} is named`);
  }
  assert.ok(html.includes("author · 2026-09-01"), "the source and the ref that dates it");
  assert.ok(html.includes("proposal · node --test x.mjs"), "the ref that names the instrument");
  assert.ok(html.includes("Leave the node as it stands."), "each alternative's prose");
  assert.ok(html.includes("Delete the node; the one sentence that survives moves up."));
  assert.ok(html.includes('<span class="pill sm prune">prune</span>'), "the prune is marked");
  assert.equal(html.split('class="pill sm prune"').length - 1, 1, "and only the prune is");
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

  const pruned = R.alternativesHtml(graph.nodes.find((n) => n.slug === "prune-node"));
  assert.ok(pruned.includes(">fold-into-the-parent</span>"));
  assert.ok(pruned.includes('<span class="pill sm prune">prune</span>'), "a prune alternative is marked as one");

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

test("orderAlignmentItems keeps the manifest's graph order and ranks descending within a graph", () => {
  const groups = orderAlignmentItems(TWO_GRAPHS);
  assert.deepEqual(groups.map((g) => g.graph), ["first", "second"], "manifest order, not rank order");
  assert.deepEqual(groups.map((g) => g.about), [
    "the graph the manifest names first",
    "the graph the manifest names second",
  ]);
  assert.deepEqual(groups[0].items.map((n) => n.slug), ["leaf-a", "leaf-b"], "rank tie broken by id");
  assert.deepEqual(groups[1].items.map((n) => n.slug), ["root"]);
  // the second graph's single item outranks both of the first graph's, and
  // still comes after them: rank orders within a graph, never between.
  assert.ok(groups[1].items[0].rank > groups[0].items[0].rank);

  const one = orderAlignmentItems(ALIGNMENT_GRAPH);
  assert.deepEqual(one.map((g) => g.graph), ["main"]);
  assert.deepEqual(one[0].items.map((n) => n.slug), ["child-unaligned", "child-ruling"]);
  assert.ok(one[0].items[0].rank > one[0].items[1].rank, "the higher-ranked item comes first");
});

test("orderAlignmentItems takes only nodes carrying a stage, and appends an undeclared graph rather than dropping it", () => {
  const groups = orderAlignmentItems(DIALOGUE_GRAPH);
  const slugs = groups.flatMap((g) => g.items.map((n) => n.slug));
  assert.ok(!slugs.includes("answered-no-stage"), "a node with no stage is not an item");
  assert.deepEqual(slugs, ["answered-with-stage", "review-node", "ruling-node"]);

  const stray = orderAlignmentItems({
    graphs: { main: { about: "declared" } },
    nodes: [
      { id: "example.test/main/a", slug: "a", graph: "main", stage: "ruling", rank: 1 },
      { id: "example.test/other/b", slug: "b", graph: "other", stage: "ruling", rank: 1 },
    ],
  });
  assert.deepEqual(stray.map((g) => g.graph), ["main", "other"]);
  assert.equal(stray[1].about, null);
  assert.deepEqual(stray[1].items.map((n) => n.slug), ["b"]);
});

test("--alignment lays the page out graph by graph then by rank, and leaves out a node with no stage", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, TWO_GRAPHS);
  const first = html.indexOf('id="graph-first"');
  const second = html.indexOf('id="graph-second"');
  assert.ok(first >= 0 && second > first, "the manifest's first graph heads the page");
  assert.ok(html.includes("the graph the manifest names first"), "the about line is the section's subtitle");
  const leafA = html.indexOf('data-id="example.test/first/leaf-a"');
  const leafB = html.indexOf('data-id="example.test/first/leaf-b"');
  const root = html.indexOf('data-id="example.test/second/root"');
  assert.ok(first < leafA && leafA < leafB && leafB < second && second < root);

  const dialogue = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);
  const noStage = nodeBySlug(DIALOGUE_GRAPH, "answered-no-stage");
  assert.equal(noStage.stage, null, "fixture precondition: a node with no stage");
  assert.ok(!dialogue.includes(noStage.question), "the node without a stage is absent from the page");
  assert.ok(!dialogue.includes(`data-id="${noStage.id}"`));
});

test("--alignment heads each item with its id, rank, stage pill, stamp and parents", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = nodeBySlug(ALIGNMENT_GRAPH, "child-ruling");
  const article = itemHtml(html, ruling.id);
  assert.ok(article.includes(`>${ruling.id}<`), "the id is printed");
  assert.ok(article.includes(`rank ${ruling.rank.toFixed(4)}`), "the rank to four decimals");
  assert.ok(article.includes('class="pill stage-ruling">ruling<'), "the stage pill");
  assert.ok(article.includes("deferred · Fixture Author · 2026-01-01"), "the stamp");
  assert.ok(article.includes("under example.test/main/root"), "the parents from under");

  const unstamped = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned").id);
  assert.ok(unstamped.includes("no stamp"), "an unstamped node says so");
});

test("--alignment carries the author's words, the node as it stands, and the no-answer line", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  const ruling = nodeBySlug(ALIGNMENT_GRAPH, "child-ruling");
  const unaligned = nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned");

  const rulingItem = itemHtml(html, ruling.id);
  assert.ok(rulingItem.includes("The author's words"));
  assert.ok(rulingItem.includes("The node as it stands"));
  assert.ok(rulingItem.includes(ruling.answer), "the current answer text");
  assert.ok(rulingItem.includes(ruling.rationale), "the rationale text");
  assert.ok(rulingItem.includes("The AI's account"));
  assert.ok(rulingItem.includes(ruling.account), "the account text");

  const unalignedItem = itemHtml(html, unaligned.id);
  assert.equal(unaligned.answer, null, "fixture precondition: no answer");
  assert.ok(unalignedItem.includes("The node as it stands"), "the section is still there");
  assert.ok(
    unalignedItem.includes("No answer yet: this node is the author's disposition awaiting its answer."),
    "with the no-answer line in place of an answer",
  );
});

test("--alignment shows the draft, the changed frontmatter field, and a word-level ins/del diff", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH);
  const drafted = nodeBySlug(DIALOGUE_GRAPH, "ruling-node");
  assert.ok(drafted.draft, "fixture precondition: the node carries a '## Draft'");
  const article = itemHtml(html, drafted.id);

  assert.ok(article.includes("The draft"), "the draft's own label");
  assert.ok(article.includes("Yes: a draft is a whole proposed node"), "the draft's answer, rendered as prose");
  assert.ok(article.includes("The edit"), "the edit's label");

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
  assert.ok(article.includes("Confirm ratifies the draft as the node."), "the edit's caption");
  assert.ok(article.includes("The node as it stands is what remains if you deny."));

  // a node with no draft gets neither the draft section nor the caption
  const plain = itemHtml(html, nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(!plain.includes("The edit"));
  assert.ok(!plain.includes("Confirm ratifies the draft as the node."));
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
      draft: { frontmatter: {}, sections: { Answer: `${long} more`, Rationale: null } },
    }],
  };
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  assert.ok(html.includes("<ins>"), "60 tokens is well under the 4000-token cap");
  assert.ok(!/too long to diff/i.test(html));
});

test("--alignment lists the alternatives after the node as it stands, marking the adopted one and any prune", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const fresh = nodeBySlug(graph, "fresh-node");
  const article = itemHtml(html, fresh.id);

  assert.ok(article.includes("The alternatives"), "the section's label");
  const standsAt = article.indexOf("The node as it stands");
  const altsAt = article.indexOf("The alternatives");
  const recAt = article.indexOf("The recommendation");
  assert.ok(standsAt >= 0 && standsAt < altsAt && altsAt < recAt, "after the node, before the recommendation");

  for (const name of ["keep-standing", "split-the-node", "follow-the-instrument"]) {
    assert.ok(article.includes(`<span class="mono">${name}</span>`), `${name} is named`);
  }
  assert.ok(article.includes('<span class="pill alt-src">author</span>'), "each alternative's source");
  assert.ok(article.includes('<span class="pill alt-src">proposal</span>'));
  assert.ok(
    article.includes('<span class="pill alt-ref mono">node --test packages/disposition/read.test.mjs</span>'),
    "the ref the proposal names",
  );
  assert.ok(article.includes("leave the node as it stands and close the dialogue"), "the prose of an alternative");
  assert.ok(article.includes("the question is two questions"));

  assert.equal(
    article.split("the recommendation adopts this").length - 1, 1,
    "exactly one alternative is marked as adopted",
  );
  const adoptedAt = article.indexOf("the recommendation adopts this");
  const splitAt = article.indexOf('<span class="mono">split-the-node</span>');
  const followAt = article.indexOf('<span class="mono">follow-the-instrument</span>');
  assert.ok(splitAt < adoptedAt && adoptedAt < followAt, "and it is the one the recommendation names");
  assert.ok(article.includes('class="alt adopted"'), "the adopted entry is marked on its own element too");

  // a node with nothing on the table renders no section at all
  const plain = itemHtml(html, nodeBySlug(graph, "stale-node").id);
  assert.ok(!plain.includes("The alternatives"));
});

test("--alignment marks a prune alternative and captions what confirming it does", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);
  const prune = nodeBySlug(graph, "prune-node");
  assert.equal(prune.alternatives[0].prune, true, "fixture precondition: the alternative prunes the node");
  assert.equal(prune.draft, null, "fixture precondition: a prune quotes no fence");
  const article = itemHtml(html, prune.id);

  assert.ok(article.includes('<span class="pill alt-prune">prune</span>'), "the entry is marked a prune");
  assert.ok(article.includes("the recommendation adopts this"));
  assert.ok(article.includes("adopts: fold-into-the-parent"), "the recommendation names it");
  assert.ok(
    article.includes("Confirm prunes the node; the node as it stands is what remains if you deny."),
    "the prune's own caption",
  );
  assert.ok(!article.includes("Confirm ratifies the draft as the node."), "not the edit's caption");
  assert.ok(!article.includes("The edit"), "and no edit, since there is no recommended text");

  const fresh = itemHtml(html, nodeBySlug(graph, "fresh-node").id);
  assert.ok(!fresh.includes("Confirm prunes the node"), "a recommendation that rewrites gets the edit's caption");
  assert.ok(fresh.includes("Confirm ratifies the draft as the node."));
});

test("--alignment shows what the recommendation adopts and pills a stale one", async () => {
  const graph = await readGraph(resolve(HERE, "fixtures/valid-alternatives"));
  const html = buildAlignment(ALIGNMENT_TEMPLATE, graph);

  const stale = nodeBySlug(graph, "stale-node");
  assert.equal(stale.recommendationStale, true, "fixture precondition: the standing text moved");
  const staleItem = itemHtml(html, stale.id);
  assert.ok(staleItem.includes("adopts: standing"), "adopts is shown even for the node as it stands");
  assert.ok(staleItem.includes("class: delegated") && staleItem.includes("boldness: low"));
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
  assert.ok(article.includes("The recommendation"));
  assert.ok(article.includes("class: ratified"), "the class pill");
  assert.ok(article.includes("boldness: moderate"), "the boldness pill");
  assert.ok(article.includes("Persistence: standing, with 1 shim:"), "the shim count");
  assert.ok(article.includes("this fixture's ruling stage"), "each shim's artifact");

  const plain = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned").id);
  assert.ok(plain.includes("No recommendation yet."));

  const delegated = itemHtml(buildAlignment(ALIGNMENT_TEMPLATE, DIALOGUE_GRAPH), nodeBySlug(DIALOGUE_GRAPH, "review-node").id);
  assert.ok(delegated.includes("class: delegated") && delegated.includes("boldness: high"));
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

test("--alignment offers the three responses on every item, with the stage's hint and the words placeholder", () => {
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

  const periagogic = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-unaligned").id);
  assert.ok(periagogic.includes("The dialogue owes your account of the ground first; your words here are recorded verbatim."));
  assert.ok(periagogic.includes('placeholder="Your words: your account of the ground, or your intention"'));

  const ruling = itemHtml(html, nodeBySlug(ALIGNMENT_GRAPH, "child-ruling").id);
  assert.ok(!ruling.includes("placeholder="), "a ruling item asks for a response, not for the author's words");
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
  assert.ok(maieuticHtml.includes('placeholder="Your words: your account of the ground, or your intention"'));
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
  // scoped to the item's own article: the left rail legitimately links to it
  // with a real <a href="#item-..."> anchor, which must not count against
  // this check.
  const article = itemHtml(html, "example.test/main/l");
  assert.ok(article.includes("See growth for context."), "the link renders as its label, no anchor");
  assert.ok(!article.includes("<a "), "no anchor tag is produced inside the item");
});

test("the alignment header carries the title, the module, the counts per stage, and the lede", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  assert.ok(html.includes(">Alignment<"));
  assert.ok(html.includes(ALIGNMENT_GRAPH.module));
  assert.ok(html.includes("Every node is unanswered until the author confirms it, here or in prose. Listed by rank, the purpose node first. Respond to any subset and submit; the alignment session reads the responses back."));
  assert.ok(html.includes("Copy all responses"));
  for (const stage of ["ruling", "review", "maieutic", "periagogic"]) {
    assert.ok(html.includes(`<dt>${stage}</dt>`), `the count for ${stage}`);
  }
  assert.ok(html.includes("<dt>items</dt><dd class=\"num\">2</dd>"), "the item total");
});

test("the page carries the staging footer at rest and a rail row, with its stage dot, per item", () => {
  const html = buildAlignment(ALIGNMENT_TEMPLATE, ALIGNMENT_GRAPH);
  assert.ok(html.includes('id="staged-count">0 responses staged<'), "the footer's count, at rest");
  assert.ok(html.includes('id="btn-submit" disabled>Submit 0 responses<'), "the submit button, disabled with nothing staged");
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
    querySelector(sel) { return this.desc.find((n) => alStubMatches(n, sel)) || null; },
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
    const state = el("p", { "data-state": "" });
    item.desc = [...radios, note, label, controls, state];
    item.radios = radios;
    item.note = note;
    item.state = state;
    item.controls = controls;
    return item;
  });

  const rails = items.map((spec) => {
    const mark = el("span", { "data-mark": "" });
    const a = el("a", { "data-rail": "", "data-doc": spec.doc });
    a.desc = [mark];
    a.mark = mark;
    return a;
  });

  const byId = {
    "module-name": Object.assign(el("span", {}), { textContent: "example.test" }),
    "btn-theme": el("button", {}),
    "btn-copy": el("button", {}),
    "btn-submit": el("button", {}),
    "staged-count": el("span", {}),
    notice: el("p", {}),
    "foot-note": el("span", {}),
  };

  const document = {
    documentElement: { setAttribute() {}, removeAttribute() {} },
    getElementById: (id) => byId[id] || null,
    createElement: (tag) => el(tag, {}),
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
  for (const attr of ["data-note-lbl", "data-state", "data-controls", "data-mark"]) {
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
  assert.equal(env.byId["btn-submit"].textContent, "Submit 2 responses");
  assert.equal(env.byId["btn-submit"].disabled, false);
  assert.deepEqual(Object.keys(JSON.parse(env.storage["alignment-staged:example.test"])), [a.attrs["data-doc"], b.attrs["data-doc"]]);
  assert.equal(env.rails[0].mark.textContent, "●", "the rail marks a staged item");

  await page.alSubmit();

  const written = db.writes.get("responses/example.test:main:a");
  assert.deepEqual(Object.keys(written).sort(), ["node", "ruling", "stage", "text", "updated"]);
  assert.equal(written.node, "example.test/main/a");
  assert.equal(written.stage, "ruling");
  assert.equal(written.ruling, "confirm");
  assert.equal(written.text, "Confirmed, with a note.");
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
  assert.match(copied, /example\.test\/main\/a \[ruling\] confirm \(submitted\)\nEarlier\./);
  assert.match(copied, /example\.test\/main\/b \[periagogic\] no ruling \(staged\)\nStill thinking\./);
});
