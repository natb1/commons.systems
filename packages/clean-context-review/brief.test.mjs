// node --test packages/clean-context-review/brief.test.mjs
//
// Exercises brief.mjs -- the two readings the review divides into, the review
// of one draft (`--node <id>`) and the survey of the frontier (`--survey`) --
// against a copy of fixtures/frontier/ beside this file, never against the
// live disposition/ graph.

import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  writeDraftBrief, writeDeltaBrief, writeSurveyBrief, frontierOrderIds,
  reviewLine, graphCommit, parseArgs, draftNeighbourhood, READING_RULES,
  chooseMode, nodeDiffSinceCommit, lastCleanContextReviewSection,
  lastAccountSectionOnly, renderNeighbourNode, surveyNeighbourhoodIds,
  frontierFindingSectionsSince,
  sectionHashes, movedSections, SECTION_HASH_KEYS, judgedSet, candidatePairs,
  cutPairs, probeSeed, drawProbe, wholeDemand,
  renderJudgedNode, groupedPairLines, shortId, shortKey, probePairLine,
} from "./brief.mjs";
import { readGraph, surveyJudges } from "@commons.systems/disposition/read.mjs";
import { diffText } from "@commons.systems/disposition/patch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const FRONTIER_FIXTURE_SRC = path.join(HERE, "fixtures/frontier");
const BRIEF_MJS = path.join(HERE, "brief.mjs");

const tmpDirs = [];
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

async function freshFrontierFixture(prefix) {
  const dir = await mkdtemp(path.join(os.tmpdir(), `clean-context-review-${prefix}`));
  tmpDirs.push(dir);
  await cp(FRONTIER_FIXTURE_SRC, dir, { recursive: true });
  return dir;
}

/**
 * A fixture copy that is also a git checkout with one commit, for the
 * re-reading's own machinery (`chooseMode`, `nodeDiffSinceCommit`), which
 * needs a real commit to diff a node's file against -- the plain fixture
 * copies elsewhere in this file carry no git history at all.
 */
async function freshGitFrontierFixture(prefix) {
  const dir = await freshFrontierFixture(prefix);
  const git = (args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  git(["init", "-q"]);
  git(["config", "user.email", "test@example.com"]);
  git(["config", "user.name", "test"]);
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "baseline"]);
  const commit = git(["rev-parse", "HEAD"]).trim();
  return { rootDir: dir, commit };
}

// A 40-hex string that is never the real recommendation hash of any fixture
// node -- only its shape (HASH_RE) is checked by the reader, so any such
// string pins a review whose node has since moved, making 'reviewStale' true.
const STALE_PIN = "1111111111111111111111111111111111111111";

const MAIEUTIC_NODE = "clean-context-review.test/main/maieutic-node";
const PERIAGOGIC_NODE = "clean-context-review.test/main/periagogic-node";
const REVIEW_A = "clean-context-review.test/main/review-a";
const REVIEW_B = "clean-context-review.test/main/review-b";
const REVIEW_GLOBAL = "clean-context-review.test/main/review-global";
const REVIEW_LOW = "clean-context-review.test/main/review-low";
const REVIEW_SETTLES = "clean-context-review.test/main/review-settles";
const RULING_A = "clean-context-review.test/main/ruling-a";
const ANSWERED = "clean-context-review.test/main/answered-ratified";
const SIBLING = "clean-context-review.test/main/sibling-node";
const SURVEY_PINNED = "clean-context-review.test/main/survey-pinned";
const CHILD_OF_REVIEW_LOW = "clean-context-review.test/main/child-of-review-low";
const READING_OF_REVIEW_LOW = "clean-context-review.test/main/reading-of-review-low";
const CHILD_AND_READING_OF_REVIEW_LOW = "clean-context-review.test/main/child-and-reading-of-review-low";

// The class the reader derives for a node no ruling reaches, as a brief
// prints it: there is no stamp any more, so this is what stands in its place
// (commons.systems/disposition-graph/viable-options).
const UNRULED = "unanswered (no ruling on this node or on any ancestor: nothing on it acts)";

function runCli(args, cwd) {
  return execFileSync(process.execPath, [BRIEF_MJS, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function runCliExpectingFailure(args, cwd) {
  try {
    runCli(args, cwd);
  } catch (err) {
    return { status: err.status, stderr: String(err.stderr), stdout: String(err.stdout) };
  }
  throw new Error(`expected a non-zero exit from: ${args.join(" ")}`);
}

// --------------------------------------------------------------- the modes

describe("brief.mjs: the two readings", () => {
  test("parseArgs takes exactly one reading, and refuses neither, both, and an unknown flag", () => {
    assert.deepEqual(parseArgs(["--node", "x"]), { node: "x", survey: false, rootDir: null, date: null, dry: false, draft: false, whole: false, forceTier: false, validationsChanged: false, out: null, sidecarDir: null });
    assert.deepEqual(parseArgs(["--survey", "root", "--date", "2026-09-04", "--dry"]),
      { node: null, survey: true, rootDir: "root", date: "2026-09-04", dry: true, draft: false, whole: false, forceTier: false, validationsChanged: false, out: null, sidecarDir: null });
    assert.throws(() => parseArgs([]), /no reading named/);
    assert.throws(() => parseArgs(["--node", "x", "--survey"]), /one invocation runs one of them/);
    assert.throws(() => parseArgs(["--survey", "--frontier"]), /unknown flag --frontier/);
    assert.throws(() => parseArgs(["--node"]), /--node needs a node id/);
  });

  test("--sidecar-dir is read for --survey, and refused for --node", () => {
    assert.deepEqual(parseArgs(["--survey", "--sidecar-dir", "elsewhere"]),
      { node: null, survey: true, rootDir: null, date: null, dry: false, draft: false, whole: false, forceTier: false, validationsChanged: false, out: null, sidecarDir: "elsewhere" });
    assert.throws(() => parseArgs(["--node", "x", "--sidecar-dir", "elsewhere"]), /--sidecar-dir is the survey's/);
    assert.throws(() => parseArgs(["--survey", "--sidecar-dir"]), /--sidecar-dir needs a directory/);
  });

  test("--draft forces the draft brief, and refuses beside --survey; --fresh is a deprecated alias", () => {
    assert.deepEqual(parseArgs(["--node", "x", "--draft"]),
      { node: "x", survey: false, rootDir: null, date: null, dry: false, draft: true, whole: false, forceTier: false, validationsChanged: false, out: null, sidecarDir: null });
    assert.deepEqual(parseArgs(["--node", "x", "--fresh"]),
      { node: "x", survey: false, rootDir: null, date: null, dry: false, draft: true, whole: false, forceTier: false, validationsChanged: false, out: null, sidecarDir: null });
    assert.throws(() => parseArgs(["--survey", "--draft"]), /--draft forces the draft brief on a re-reading/);
    assert.throws(() => parseArgs(["--survey", "--fresh"]), /--draft forces the draft brief on a re-reading/);
  });

  test("CLI: neither mode, both, and an unknown flag each print the usage on stderr and exit 2", async () => {
    const rootDir = await freshFrontierFixture("modes-");
    const cwd = path.dirname(rootDir);
    for (const args of [[rootDir], ["--node", REVIEW_A, "--survey", rootDir], ["--survey", "--batch", rootDir]]) {
      const r = runCliExpectingFailure(args, cwd);
      assert.equal(r.status, 2, `expected exit 2 from: ${args.join(" ")}`);
      assert.match(r.stderr, /usage: node brief\.mjs --node <id>/);
    }
  });

  test("CLI: --node on a node that does not exist, and on one not at the review stage, each exit 2", async () => {
    const rootDir = await freshFrontierFixture("node-stage-");
    const cwd = path.dirname(rootDir);

    const missing = runCliExpectingFailure(["--node", "clean-context-review.test/main/nope", rootDir, "--dry"], cwd);
    assert.equal(missing.status, 2);
    assert.match(missing.stderr, /no node 'clean-context-review\.test\/main\/nope'/);

    const wrongStage = runCliExpectingFailure(["--node", MAIEUTIC_NODE, rootDir, "--dry"], cwd);
    assert.equal(wrongStage.status, 2);
    assert.match(wrongStage.stderr, /is at stage maieutic, and a reading runs on a node at stage review/);
    assert.match(wrongStage.stderr, /or on one at stage ruling whose recommendation has moved/);
  });

  test("CLI: a ruling-stage node is refused while its pin is current, and accepted once its recommendation has moved", async () => {
    const rootDir = await freshFrontierFixture("ruling-stage-");
    const cwd = path.dirname(rootDir);
    const file = path.join(rootDir, "main", "ruling-a.md");

    const ready = runCliExpectingFailure(["--node", RULING_A, rootDir, "--dry"], cwd);
    assert.equal(ready.status, 2);
    assert.match(ready.stderr, /is at stage ruling and its recommendation has not moved/);

    // The amendment a forward reading earns: the answer text moves, the
    // review's pin does not, and the re-reading that would re-pin it must be
    // generable or the node reaches the author pinned to text nobody read.
    const before = await readFile(file, "utf8");
    const at = before.lastIndexOf("\n## Answer\n");
    assert.ok(at > 0, "fixture precondition: the recommendation fence carries an '## Answer'");
    const amended = `${before.slice(0, at)}\n## Answer\n\nAmended after the forward reading, which moves the recommendation pin.\n${before.slice(at + "\n## Answer\n".length)}`;
    await writeFile(file, amended);

    const accepted = runCli(["--node", RULING_A, rootDir, "--dry"], cwd);
    assert.match(accepted, /mode: (delta|draft)/, `the reading was not generated:\n${accepted}`);
  });
});

// ------------------------------------------------------ the review of one draft

describe("writeDraftBrief", () => {
  test("fills every placeholder; the node goes in whole with its account, the neighbourhood without", async () => {
    const rootDir = await freshFrontierFixture("draft-ok-");
    const reviewDir = path.join(rootDir, "_review");

    const result = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-04" });
    assert.equal(result.briefPath, path.join(reviewDir, "draft-review-low.brief.md"));
    assert.equal(result.outFile, "tmp/review/draft-review-low.json");

    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(!brief.includes("{{"), `unfilled placeholder left in brief:\n${brief.slice(0, 2000)}`);
    assert.ok(brief.startsWith("# Clean-context review of a draft, 2026-09-04: `clean-context-review.test/main/review-low`"));
    assert.ok(brief.includes("tmp/review/draft-review-low.json"), "the literal {{out}} path, regardless of the scratch reviewDir");
    assert.match(brief, /\*\*The graph commit you are reading is `\(unknown: this graph is not a git checkout\)`\.\*\*/,
      "a plain fixture copy carries no git checkout, and the brief says so rather than leaving the line unfilled");

    // The node itself goes in whole, its '## Account' included -- only the
    // last '### ' section of it, per review-cost: a draft's dialogue is its
    // own history, but an account that has accumulated one subsection per
    // earlier reading is not read in full each time. Everything else goes
    // in without one.
    const nodeSection = brief.slice(brief.indexOf("\n## The node under review"), brief.indexOf("\n## Its ancestry"));
    assert.ok(nodeSection.includes(`### ${REVIEW_LOW}`));
    assert.ok(nodeSection.includes("#### Account (the AI's account: only the last '### ' section; the rest is on disk at the file above)"));
    assert.ok(nodeSection.includes("(no '## Account' section)"), "this fixture's review-low carries no account at all");

    const restOfBrief = brief.slice(brief.indexOf("\n## Its ancestry"));
    assert.ok(!restOfBrief.includes("#### Account"), "the neighbourhood carries no account");

    // {{nav}}: filled last, from the filled text itself. The file ends in a
    // newline, so `split("\n")` yields one trailing empty element that is
    // not a line; the nav line reports the true count, the one `wc -l`
    // would give, and not `split`'s off-by-one.
    const lines = brief.split("\n");
    const trueLineCount = brief.endsWith("\n") ? lines.length - 1 : lines.length;
    const navLine = lines.find((l) => l.startsWith("This brief is "));
    assert.ok(navLine, "the nav sentence is written");
    // `review-cost` fixes the measure in bytes; the line count stays beside
    // it because the nav names line numbers the reader pages by.
    const trueBytes = Buffer.byteLength(brief, "utf8");
    assert.match(navLine, new RegExp(`^This brief is ${trueBytes.toLocaleString("en-US")} bytes over ${trueLineCount.toLocaleString("en-US")} lines\\.`));
    const named = navLine.match(/"## The node under review" at line (\d+)/);
    assert.ok(named, `nav sentence does not name the node's line: ${navLine}`);
    assert.ok(lines[Number(named[1]) - 1].startsWith("## The node under review"), "the line the nav names is the node's heading");
  });

  test("the parts: ancestry with the global-tier rules, children, siblings, the nodes it names, readings, the round, and the index of the rest", async () => {
    const rootDir = await freshFrontierFixture("draft-parts-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);

    const parts = draftNeighbourhood(graph, node);
    assert.deepEqual(parts.ancestry.map((n) => n.id), [ANSWERED, REVIEW_GLOBAL],
      "the under chain, then every global-tier node not already in it");
    assert.deepEqual(parts.rules, [], "this fixture graph carries none of the twelve production rule ids");
    assert.deepEqual(parts.children.map((n) => n.id), [CHILD_OF_REVIEW_LOW],
      "every node whose 'under' names this node, minus the one 'readings' claimed first");
    assert.deepEqual(parts.siblings.map((n) => n.id), [SIBLING], "the node under the same parent");
    // 'readings' is taken first of all the parts (2026-09-07): a reading is
    // mounted `under` the node it bears on, so 'children' claimed every
    // reading before this part ever ran and the brief said "no reading bears
    // on this node" above option lines naming several. Both readers land
    // here now, in the order `readingIdsOn` reads them off the options.
    assert.deepEqual([...parts.readings.map((n) => n.id)].sort(),
      [CHILD_AND_READING_OF_REVIEW_LOW, READING_OF_REVIEW_LOW],
      "every reading bearing on this node, taken before 'children' and 'cited' can claim it");
    assert.deepEqual(parts.cited.map((n) => n.id), [RULING_A],
      "the node its own text names, minus the reading 'readings' already took");
    assert.deepEqual(parts.round.map((n) => n.id), [REVIEW_SETTLES, REVIEW_A, REVIEW_B],
      "surveyJudges, minus this node itself and whatever an earlier part already carried (review-global in ancestry, ruling-a in cited)");
    const takenIds = [REVIEW_LOW, ANSWERED, REVIEW_GLOBAL, CHILD_AND_READING_OF_REVIEW_LOW, CHILD_OF_REVIEW_LOW,
      SIBLING, READING_OF_REVIEW_LOW, RULING_A, REVIEW_SETTLES, REVIEW_A, REVIEW_B];
    assert.ok(!parts.index.some((n) => takenIds.includes(n.id)),
      "the index is every node no earlier part carries");
    assert.equal(parts.index.length + takenIds.length, graph.nodes.length);

    const result = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-04" });
    assert.equal(result.ancestryCount, 2);
    assert.equal(result.rulesCount, 0);
    assert.equal(result.childrenCount, 1);
    assert.equal(result.siblingCount, 1);
    assert.equal(result.citedCount, 1);
    assert.equal(result.readingsCount, 2);
    assert.equal(result.roundCount, 3);
    assert.equal(result.indexCount, graph.nodes.length - takenIds.length);

    const brief = await readFile(result.briefPath, "utf8");
    const section = (from, to) => brief.slice(brief.indexOf(`\n## ${from}`), brief.indexOf(`\n## ${to}`));
    const ancestry = section("Its ancestry", "The rules of this reading");
    const rules = section("The rules of this reading", "The nodes under it");
    const children = section("The nodes under it", "Its siblings");
    const siblings = section("Its siblings", "The nodes it names");
    const cited = section("The nodes it names", "The readings that bear on it");
    const readings = section("The readings that bear on it", "The round: the other drafts that have moved");
    const round = section("The round: the other drafts that have moved", "Every other question the record asks");
    const index = section("Every other question the record asks", "Output");

    assert.ok(ancestry.includes(`### ${ANSWERED}`) && ancestry.includes(`### ${REVIEW_GLOBAL}`));
    assert.ok(rules.includes("none of the twelve rule nodes are in this graph"), "the fallback text: no production rule ids here");
    assert.ok(children.includes(`### ${CHILD_OF_REVIEW_LOW}`));
    assert.ok(!children.includes(`### ${CHILD_AND_READING_OF_REVIEW_LOW}`), "a child that is also a reading is carried in 'readings'");
    assert.ok(!index.includes(CHILD_OF_REVIEW_LOW), "a child is carried whole above, not repeated in the index");
    assert.ok(siblings.includes(`### ${SIBLING}`));
    assert.ok(cited.includes(`### ${RULING_A}`));
    assert.ok(cited.includes("Answered whole: one node, one question, one answer."), "a cited node's now-recommended answer is carried");
    assert.ok(!cited.includes(`### ${READING_OF_REVIEW_LOW}`), "the reading is no longer in 'cited': 'readings' claims it first");
    assert.ok(readings.includes(`### ${READING_OF_REVIEW_LOW}`), "the reading is carried in its own part now");
    assert.ok(readings.includes(`### ${CHILD_AND_READING_OF_REVIEW_LOW}`), "and so is the reading that is also a child, which 'children' used to swallow");
    assert.ok(round.includes(REVIEW_SETTLES) && round.includes("now recommends:"), "the round names the drafts that moved and what they now recommend");
    assert.ok(!round.includes(`### ${REVIEW_SETTLES}`), "the round is pointers, never a whole node");
    for (const id of [PERIAGOGIC_NODE, MAIEUTIC_NODE, SURVEY_PINNED]) {
      assert.ok(index.includes(`- ${id} | `), `${id} is in the index, as a one-line pointer`);
    }
    assert.ok(!index.includes("#### Other options on its answer"), "the index is one line a node, not the standing answer and its options");
  });

  test("a node claimed by an earlier part is never duplicated in a later one: a node both under this node and a reading of it lands only in 'readings'", async () => {
    const rootDir = await freshFrontierFixture("draft-dedup-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const parts = draftNeighbourhood(graph, node);

    assert.ok(parts.readings.some((n) => n.id === CHILD_AND_READING_OF_REVIEW_LOW),
      "it bears on review-low, and 'readings' is taken first, so it is carried as a reading");
    assert.ok(!parts.cited.some((n) => n.id === CHILD_AND_READING_OF_REVIEW_LOW),
      "not repeated in 'cited', though its 'Readings bearing on it' line names it too");
    assert.ok(!parts.children.some((n) => n.id === CHILD_AND_READING_OF_REVIEW_LOW),
      "not repeated in 'children' either, though its 'under' names this node");
    assert.ok(!parts.index.some((n) => n.id === CHILD_AND_READING_OF_REVIEW_LOW),
      "and not repeated in the index");

    const result = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-04" });
    const brief = await readFile(result.briefPath, "utf8");
    // The dedup guarantee is which *part* carries a node whole, never a bound
    // on how many times its id appears as text: review-low's own rendered
    // facts inline "Readings bearing on it: <id>" for every reading on its
    // answer option (renderFacts/readingsText, pre-existing), so the id
    // legitimately appears there too, inside '## The node under review'.
    // What must hold is that the node is carried *whole* -- a '### <id>'
    // heading -- exactly once, and that is in 'children'.
    const headingOccurrences = [...brief.matchAll(new RegExp(`^### ${CHILD_AND_READING_OF_REVIEW_LOW.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "gm"))].length;
    assert.equal(headingOccurrences, 1, "the node is carried whole exactly once in the whole brief: once, in 'readings'");
    assert.ok(!brief.includes(`- ${CHILD_AND_READING_OF_REVIEW_LOW} | `), "and never as an index pointer line");
  });

  test("draftNeighbourhood: a node whose 'bears' names this node lands in 'readings' when no earlier part already claims it", () => {
    // A hand-built graph, not a fixture on disk: draftNeighbourhood trusts
    // its inputs and does not validate them, so this isolates the mechanism
    // from the interaction the fixture-based test above documents, where a
    // reading is already caught by 'cited' because the node under review's
    // own rendered facts already quote every reading bearing on them
    // ("Readings bearing on it: ..."). Here the node under review carries no
    // facts at all, so nothing in its own rendered text names the reader.
    const target = {
      id: "synthetic/root", question: "What does the root ask?", rank: 0,
      under: [], children: [], facts: [], bears: [], depends: [],
    };
    const reader = {
      id: "synthetic/reader", question: "What does the reader ask?", rank: 0,
      under: [], children: [], facts: [],
      bears: [{ node: "synthetic/root", fact: "answer", option: "x", relation: "adopted" }],
      depends: [],
    };
    const graph = { nodes: [target, reader] };

    const parts = draftNeighbourhood(graph, target);
    assert.deepEqual(parts.readings.map((n) => n.id), ["synthetic/reader"]);
    assert.deepEqual(parts.cited, [], "nothing in the node's own text names the reader here");
    assert.deepEqual(parts.index, [], "the reader is carried in 'readings', not left for the index");
  });

  test("draftNeighbourhood: a 'bears' entry that omits 'node' means the parent the reading is mounted under", () => {
    // A 'bears' entry may omit 'node' -- read.mjs canonicalizes that to the
    // reading's sole 'under' parent before draftNeighbourhood ever sees a
    // graph it read (readBears, read.mjs's parse-time canonicalization), but
    // draftNeighbourhood trusts its inputs and does not assume that
    // resolution has already run, so this exercises its own fallback
    // directly, hand-built as the explicit-'node' test above. 'children' is
    // left empty by hand, as that test's comment explains, so this isolates
    // the 'readings' mechanism from the fact that a reading naming its own
    // sole parent is always that parent's child too.
    const target = {
      id: "synthetic/root", question: "What does the root ask?", rank: 0,
      under: [], children: [], facts: [], bears: [], depends: [],
    };
    const reader = {
      id: "synthetic/reader", question: "What does the reader ask?", rank: 0,
      under: ["synthetic/root"], children: [], facts: [],
      bears: [{ fact: "answer", option: "x", relation: "adopted" }],
      depends: [],
    };
    const graph = { nodes: [target, reader] };

    const parts = draftNeighbourhood(graph, target);
    assert.deepEqual(parts.readings.map((n) => n.id), ["synthetic/reader"],
      "the omitted 'node' is read as bearing on 'synthetic/root', the reader's sole 'under' parent");
  });

  test("renderNeighbourNode: an option whose source is the draft under review is carried whole; the rest stay names only", () => {
    // clean-context-review and review-cost both state the one exception to
    // "a neighbour is carried by what it answers, not by its whole file": an
    // option on the neighbour's answer fact whose 'source' is the node
    // under review is carried whole, prose included, because it is the
    // draft's own text. Three options here: one from an unrelated source
    // (stays name-only), one whose source matches and carries prose (the
    // exception), and one whose source matches but carries no prose (the
    // same fallback text 'missingProseText' gives the node under review's
    // own rendering).
    const otherOption = { name: "other-option", source: "ai", ref: "2026-09-01" };
    const matchingOption = {
      name: "matching-option", source: "synthetic/draft", ref: "2026-09-05",
      prose: "The option's own prose, put there by the draft under review.",
    };
    const matchingNoProse = { name: "matching-no-prose", source: "synthetic/draft", ref: "2026-09-05" };
    const answerFact = {
      name: "answer",
      options: [otherOption, matchingOption, matchingNoProse],
      recommends: "other-option",
      stands: "other-option",
    };
    const neighbour = {
      id: "synthetic/neighbour", graph: "synthetic-graph", slug: "neighbour",
      question: "What does the neighbour ask?", rank: 0, stage: "ruling",
      status: "standing", class: "delegated", classSource: { kind: "ancestor", id: "synthetic/root" },
      settles: 0, answer: "Neighbour's own answer.", answerFact,
    };

    const rendered = renderNeighbourNode(neighbour, "synthetic/draft");
    const lines = rendered.split("\n");

    const otherIdx = lines.indexOf("- `other-option` — source ai, recommended");
    assert.ok(otherIdx !== -1, `line not found in:\n${rendered}`);
    assert.notEqual(lines[otherIdx + 1], "  The option's own prose, put there by the draft under review.",
      "an option from an unrelated source is not followed by prose");

    const matchingIdx = lines.indexOf("- `matching-option` — source synthetic/draft");
    assert.ok(matchingIdx !== -1, `line not found in:\n${rendered}`);
    assert.equal(lines[matchingIdx + 1], "  The option's own prose, put there by the draft under review.",
      "the matching option is carried whole: its own prose follows immediately");

    const noProseIdx = lines.indexOf("- `matching-no-prose` — source synthetic/draft");
    assert.ok(noProseIdx !== -1, `line not found in:\n${rendered}`);
    assert.equal(lines[noProseIdx + 1],
      "  (no prose recorded, though every answer option but the one that stands owes one)",
      "a matching option with no prose recorded gets the same fallback text the node under review's own rendering uses");
  });

  test("draftNeighbourhood: 'cited' is a bounded id match and a bounded '<slug> node' prose match, never a bare substring or a bare slug", () => {
    // Hand-built, as the 'bears' test above: no facts on the target, so
    // nothing but its own prose (the question) drives 'cited' here.
    const review = {
      id: "synthetic/review", question: "no mention here", rank: 0,
      under: [], children: [], facts: [], bears: [], depends: [],
    };
    const reviewSkills = {
      id: "synthetic/review-skills", question: "no mention here either", rank: 0,
      under: [], children: [], facts: [], bears: [], depends: [],
    };
    const alignmentOrder = {
      id: "synthetic/alignment-order", question: "no mention here either", rank: 0,
      under: [], children: [], facts: [], bears: [], depends: [],
    };
    const target = {
      id: "synthetic/target",
      question: "As the alignment-order node says, this mentions synthetic/review-skills, and node alone.",
      rank: 0, under: [], children: [], facts: [], bears: [], depends: [],
    };
    const graph = { nodes: [target, review, reviewSkills, alignmentOrder] };

    const parts = draftNeighbourhood(graph, target);
    const citedIds = parts.cited.map((n) => n.id).sort();

    assert.ok(!citedIds.includes("synthetic/review"),
      "the prefix false positive: 'synthetic/review' must not match inside 'synthetic/review-skills'");
    assert.ok(citedIds.includes("synthetic/review-skills"), "its own full id occurs, unambiguously bounded");
    assert.ok(citedIds.includes("synthetic/alignment-order"), "the '<slug> node' prose form: 'the alignment-order node says'");
    assert.deepEqual(citedIds, ["synthetic/alignment-order", "synthetic/review-skills"]);
  });

  test("draftNeighbourhood: a bare slug with no trailing 'node' does not match, but a 'depends' entry pulls its node in regardless of text", () => {
    const checkpoint = {
      id: "synthetic/checkpoint", question: "no mention here", rank: 0,
      under: [], children: [], facts: [], bears: [], depends: [],
    };
    const undependedOnByText = {
      id: "synthetic/undepended-on-by-text", question: "no mention here either", rank: 0,
      under: [], children: [], facts: [], bears: [], depends: [],
    };
    const target = {
      id: "synthetic/target",
      question: "The checkpoint requires nothing further -- 'checkpoint' alone, with no trailing 'node', is bare prose.",
      rank: 0, under: [], children: [], facts: [], bears: [],
      depends: [{ id: "synthetic/undepended-on-by-text" }],
    };
    const graph = { nodes: [target, checkpoint, undependedOnByText] };

    const parts = draftNeighbourhood(graph, target);
    const citedIds = parts.cited.map((n) => n.id);

    assert.ok(!citedIds.includes("synthetic/checkpoint"), "a bare slug, with no trailing 'node', names nothing");
    assert.ok(citedIds.includes("synthetic/undepended-on-by-text"),
      "'depends' still pulls its node in even though the text never names it");
  });

  test("draftNeighbourhood on the live graph: the twelve rules of the reading are carried whole, in 'ancestry' or in 'rules'", async () => {
    const graph = await readGraph(path.join(REPO_ROOT, "disposition"));
    const node = graph.nodes.find((n) => n.id === "commons.systems/disposition-graph/decomposition");
    assert.ok(node, "the decomposition node is in the live graph");
    const { ancestry, rules } = draftNeighbourhood(graph, node);
    const covered = new Set([...ancestry, ...rules].map((n) => n.id));
    for (const id of READING_RULES) {
      assert.ok(covered.has(id), `${id} is carried whole, in ancestry (if global-tier) or in rules`);
    }
    // the five global-tier rules are already in every node's ancestry, so
    // 'rules' carries only the other seven, never duplicating them
    const ancestryIds = new Set(ancestry.map((n) => n.id));
    for (const rule of rules) assert.ok(!ancestryIds.has(rule.id), `${rule.id} is not duplicated between ancestry and rules`);
  });

  test("a draft with no parent and no citation says so rather than showing a gap", async () => {
    const rootDir = await freshFrontierFixture("draft-empty-");
    const reviewDir = path.join(rootDir, "_review");
    const result = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_GLOBAL, date: "2026-09-04" });
    const brief = await readFile(result.briefPath, "utf8");
    assert.equal(result.siblingCount, 0);
    assert.ok(brief.includes("(no sibling: no other node stands under the same parent)"));
    assert.ok(brief.includes("(no node above it and no rule that binds everywhere: this node is a root)"),
      "the only global-tier node is the node under review itself, so its ancestry is empty");
  });

  test("no model is computed and none is printed: the model is review-model's, not this script's", async () => {
    const rootDir = await freshFrontierFixture("draft-silent-");
    const reviewDir = path.join(rootDir, "_review");

    // the four shapes the superseded rule read off the node -- low boldness on
    // a plain leaf, boldness not low, global tier, a ruling that settles
    // others -- all return the same result shape, with no model in it
    // (`review-model`: "brief.mjs computes no model and prints none").
    for (const id of [REVIEW_LOW, REVIEW_A, REVIEW_GLOBAL, REVIEW_SETTLES]) {
      const r = await writeDraftBrief({ rootDir, reviewDir, id, date: "2026-09-04" });
      assert.ok(!("model" in r), `${id}: the result names no model`);
    }
    const s = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-04" });
    assert.ok(!("model" in s), "the survey's result names no model either");
  });

  test("CLI: --node prints the brief, the counts and the output file, and no model; --dry writes nothing", async () => {
    const rootDir = await freshFrontierFixture("draft-cli-");
    const cwd = path.dirname(rootDir);

    const dry = runCli(["--node", REVIEW_LOW, rootDir, "--date", "2026-09-04", "--dry"], cwd);
    assert.doesNotMatch(dry, /model/i, "the script prints no model: it computes none");
    assert.match(dry, /\(dry run: nothing written\)/);
    assert.match(dry, /draft: clean-context-review\.test\/main\/review-low; ancestry 2, rules 0, children 1, siblings 1, cited 1, readings 2, round 3, index \d+; \d+ bytes over \d+ lines/);
    assert.match(dry, /the reviewer's output file: tmp\/review\/draft-review-low\.json/);
    await assert.rejects(readFile(path.join(cwd, "tmp/review/draft-review-low.brief.md")), { code: "ENOENT" });

    const bold = runCli(["--node", REVIEW_A, rootDir, "--date", "2026-09-04", "--dry"], cwd);
    assert.doesNotMatch(bold, /model/i, "and prints none whatever the node's boldness");
  });

  test("--dry (dry: true) writes no brief at all", async () => {
    const rootDir = await freshFrontierFixture("draft-dry-");
    const reviewDir = path.join(rootDir, "_review");
    const result = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_A, date: "2026-09-04", dry: true });
    await assert.rejects(readFile(result.briefPath), { code: "ENOENT" });
  });

  test("refuses on a graph that does not validate, letting the reader's own message through", async () => {
    const rootDir = await freshFrontierFixture("draft-invalid-");
    const reviewDir = path.join(rootDir, "_review");
    await writeFile(path.join(rootDir, "main", "review-a.md"), "not a node file at all");
    await assert.rejects(
      () => writeDraftBrief({ rootDir, reviewDir, id: REVIEW_A, date: "2026-09-04" }),
      /must begin with a '---' frontmatter delimiter/,
    );
  });
});

// -------------------------------------------------------- the survey

describe("writeSurveyBrief", () => {
  test("the judged set is surveyJudges, whole, in the ruling order; its neighbourhood is lean; everything else is one line; no account anywhere", async () => {
    const rootDir = await freshFrontierFixture("survey-ok-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));

    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-04" });
    assert.equal(result.briefPath, path.join(reviewDir, "survey.brief.md"));
    assert.equal(result.outFile, "tmp/review/survey.json");
    assert.equal(result.batchCount, 6, "the six nodes at review or ruling owed a survey");
    // The neighbourhood is everything review-low's own ancestry, children,
    // siblings and readings reach (answered-ratified, its two children, its
    // sibling, and the reading bearing on it) -- the other five judged nodes
    // cite nothing and share no parent. Everything else -- maieutic-node,
    // periagogic-node, survey-pinned -- is neither judged nor a neighbour.
    assert.equal(result.neighbourhoodCount, 5);
    assert.equal(result.contextCount, graph.nodes.length - 6 - 5);

    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(!brief.includes("{{"), "every placeholder filled");
    assert.ok(!brief.includes("#### Account"), "no '## Account' section goes into the survey's brief");

    const batchSection = brief.slice(brief.indexOf("\n## The judged set"), brief.indexOf("\n## The neighbourhood of the judged set"));
    const neighbourhoodSection = brief.slice(brief.indexOf("\n## The neighbourhood of the judged set"), brief.indexOf("\n## The full graph, as context"));
    const contextSection = brief.slice(brief.indexOf("\n## The full graph, as context"), brief.indexOf("\n## Output"));

    for (const id of [REVIEW_A, REVIEW_B, REVIEW_GLOBAL, REVIEW_LOW, REVIEW_SETTLES, RULING_A]) {
      assert.ok(batchSection.includes(`### ${id}`), `${id} is judged, carried whole`);
      assert.ok(!neighbourhoodSection.includes(`### ${id}`) && !contextSection.includes(`### ${id}`), `${id} is not repeated`);
    }
    for (const id of [ANSWERED, CHILD_OF_REVIEW_LOW, CHILD_AND_READING_OF_REVIEW_LOW, SIBLING, READING_OF_REVIEW_LOW]) {
      assert.ok(neighbourhoodSection.includes(`### ${id}`), `${id} is review-low's neighbour, carried leanly`);
      assert.ok(!batchSection.includes(`### ${id}`) && !contextSection.includes(`### ${id}`), `${id} is not repeated`);
    }
    // survey-pinned stands at the review stage but carries a survey pin on
    // the recommendation it now stands on: nothing has moved, so the survey
    // does not judge it again, and it neighbours nothing judged this round.
    for (const id of [MAIEUTIC_NODE, PERIAGOGIC_NODE, SURVEY_PINNED]) {
      assert.ok(contextSection.includes(`- ${id} | `), `${id} is plain context, one line`);
      assert.ok(!contextSection.includes(`### ${id}`), `${id} is never carried whole or leanly`);
      assert.ok(!batchSection.includes(`### ${id}`) && !neighbourhoodSection.includes(`### ${id}`), `${id} is not repeated`);
    }

    // the ruling order: settles descending, then rank descending, then id
    const judged = [REVIEW_A, REVIEW_B, REVIEW_GLOBAL, REVIEW_LOW, REVIEW_SETTLES, RULING_A].map((id) => byId.get(id));
    const want = [...judged].sort((a, b) => (b.settles - a.settles) || (b.rank - a.rank) || (a.id < b.id ? -1 : 1)).map((n) => n.id);
    const gotIndex = [...brief.matchAll(/^- (\S+) \| stage \S+ \| rank /gm)].map((m) => m[1]);
    assert.deepEqual(gotIndex, want);
    assert.equal(gotIndex[0], REVIEW_SETTLES, "the node whose ruling settles another is ruled on first");
    const gotHeadings = [...batchSection.matchAll(/^### (\S+)$/gm)].map((m) => m[1]);
    assert.deepEqual(gotHeadings, want, "the judged set is presented in the ruling order too");

    // the plain context index is the frontier's own order, minus the judged
    // set and its neighbourhood
    const contextIndexStart = brief.indexOf("\n## The full graph, as context");
    const contextIndex = brief.slice(contextIndexStart, brief.indexOf("\n## Output"));
    const gotContext = [...contextIndex.matchAll(/^- (\S+) \| /gm)].map((m) => m[1]);
    const judgedIds = new Set(want);
    const neighbourIds = surveyNeighbourhoodIds(graph, judged);
    assert.deepEqual(gotContext, frontierOrderIds(graph).filter((id) => !judgedIds.has(id) && !neighbourIds.has(id)));
  });

  test("writes the pins sidecar: the graph commit, the ids judged, and a pin for every node of the graph", async () => {
    const rootDir = await freshFrontierFixture("survey-pins-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);

    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-04" });
    assert.equal(result.pinsPath, path.join(reviewDir, "survey.pins.json"));
    const pins = JSON.parse(await readFile(result.pinsPath, "utf8"));

    assert.deepEqual(Object.keys(pins).sort(), ["commit", "date", "dirty", "judged", "pins", "text"]);
    assert.equal(pins.date, "2026-09-04");
    // the fixture copy is not a git checkout, so there is no commit to name
    assert.equal(pins.commit, null);
    assert.equal(pins.dirty, false);
    assert.deepEqual([...pins.judged].sort(), [REVIEW_A, REVIEW_B, REVIEW_GLOBAL, REVIEW_LOW, REVIEW_SETTLES, RULING_A].sort());

    assert.deepEqual(Object.keys(pins.pins).sort(), graph.nodes.map((n) => n.id).sort(),
      "every node of the graph is pinned, judged and context alike");
    for (const n of graph.nodes) {
      assert.equal(pins.pins[n.id], n.recommendationHash, `${n.id} is pinned to its recommendation hash`);
    }

    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(brief.includes("(unknown: this graph is not a git checkout)"), "the brief names the commit it read");
    assert.ok(brief.includes("tmp/review/survey.pins.json"), "the brief names the sidecar the session compares against");
  });

  test("graphCommit reads the commit and the dirty flag from git, and says nothing rather than guessing outside a checkout", async () => {
    const rootDir = await freshFrontierFixture("survey-commit-");
    assert.deepEqual(graphCommit(rootDir), { commit: null, dirty: false });

    const live = graphCommit(path.join(REPO_ROOT, "disposition"));
    assert.match(live.commit, /^[0-9a-f]{40}$/, "the live graph is a git checkout and names its head");
    assert.equal(typeof live.dirty, "boolean");
  });

  test("CLI: --survey prints the counts, the commit and the sidecar, and no model; --dry writes nothing", async () => {
    const rootDir = await freshFrontierFixture("survey-cli-");
    const cwd = path.dirname(rootDir);
    const dry = runCli(["--survey", rootDir, "--date", "2026-09-04", "--dry"], cwd);
    assert.doesNotMatch(dry, /model/i, "the script prints no model: it computes none");
    assert.match(dry, /survey: 6 node\(s\) judged; neighbourhood 5 node\(s\); reached but unchanged, one line each: \d+; context: 3 node\(s\); \d+ bytes over \d+ lines; graph commit \(unknown/);
    assert.match(dry, /tier: 0 finding\(s\) over 8 checks, 0 note\(s\)/, "the run always says which tier ran and what it found");
    assert.match(dry, /survey: whole \(demanded\): no survey history/, "with no history neither backstop can be certified, so the survey runs whole");
    assert.match(dry, /pairs: \d+ nominated; \d+ live, 0 frozen, 0 drawn as the drift probe on seed \d+/);
    assert.match(dry, /the selection sidecar: .*survey\.selection\.json \(dry run: nothing written\)/);
    assert.match(dry, /the pins sidecar: .*survey\.pins\.json \(dry run: nothing written\)/);
    await assert.rejects(readFile(path.join(cwd, "tmp/review/survey.brief.md")), { code: "ENOENT" });
    await assert.rejects(readFile(path.join(cwd, "tmp/review/survey.pins.json")), { code: "ENOENT" });
  });

  test("--dry (dry: true) writes neither the brief nor the sidecar", async () => {
    const rootDir = await freshFrontierFixture("survey-dry-");
    const reviewDir = path.join(rootDir, "_review");
    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-04", dry: true });
    assert.equal(result.batchCount, 6);
    await assert.rejects(readFile(result.briefPath), { code: "ENOENT" });
    await assert.rejects(readFile(result.pinsPath), { code: "ENOENT" });
  });

  test("nothing is judged when every node at those stages carries a current pin", async () => {
    const rootDir = await freshFrontierFixture("survey-none-");
    const reviewDir = path.join(rootDir, "_review");
    // leave only survey-pinned at a stage the survey judges
    for (const slug of ["review-a", "review-b", "review-global", "review-low", "review-settles"]) {
      const file = path.join(rootDir, "main", `${slug}.md`);
      await writeFile(file, (await readFile(file, "utf8")).replace("stage: review", "stage: maieutic"));
    }
    const rulingFile = path.join(rootDir, "main", "ruling-a.md");
    await writeFile(rulingFile, (await readFile(rulingFile, "utf8")).replace("stage: ruling", "stage: maieutic"));
    // maieutic-node's depends names review-settles, which still carries a stage

    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-04" });
    assert.equal(result.batchCount, 0);
    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(brief.includes("(nothing is judged: there is no entry to write in `nodes`)"));
  });
});

// ------------------------------------------------------ the review state line

describe("reviewLine", () => {
  test("a survey-only review renders both halves and never 'null (null, null, of null)'", async () => {
    const rootDir = await freshFrontierFixture("review-line-");
    const graph = await readGraph(rootDir);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));

    const surveyOnly = reviewLine(byId.get(SURVEY_PINNED));
    assert.ok(!surveyOnly.includes("null"), `a survey-only review must not print nulls: ${surveyOnly}`);
    assert.match(surveyOnly, /^draft review: none \(this draft has not been reviewed\); survey: surveyed 2026-08-02, of 556a7fe535f582386cc3cdaacaad2c7f0b507539$/);

    const draftOnly = reviewLine(byId.get(REVIEW_A));
    assert.match(draftOnly, /^draft review: forward \(weak, 2026-08-01, of [0-9a-f]{40}\); survey: none \(no survey has pinned this node\)$/);

    assert.equal(reviewLine(byId.get(MAIEUTIC_NODE)), "none (neither reading has run)");
  });

  test("each pin is flagged stale on its own; both halves show together", async () => {
    const rootDir = await freshFrontierFixture("review-line-stale-");
    // review-a's answer fact recommends the option that stands, so its
    // recommendation hash folds in the standing text: amending that text
    // without a fresh reading is exactly what the two pins exist to catch.
    const file = path.join(rootDir, "main", "review-a.md");
    const withSurvey = (await readFile(file, "utf8"))
      .replace("A stands on this provisional answer", "A now stands on a different provisional answer")
      .replace("  of: 0586c577f9126f9c1f3b74b1a98f9e542a19b869\n",
        "  of: 0586c577f9126f9c1f3b74b1a98f9e542a19b869\n  survey:\n    date: 2026-08-02\n    of: 0586c577f9126f9c1f3b74b1a98f9e542a19b869\n");
    await writeFile(file, withSurvey);

    const graph = await readGraph(rootDir);
    const line = reviewLine(graph.nodes.find((n) => n.id === REVIEW_A));
    assert.match(line, /draft review: forward .*— STALE: what the node recommends has moved since that review was written/);
    assert.match(line, /survey: surveyed 2026-08-02, of [0-9a-f]{40} — STALE: what the node recommends has moved since that survey read it/);

    const reviewDir = path.join(rootDir, "_review");
    const brief = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-04" });
    assert.ok((await readFile(brief.briefPath, "utf8")).includes("`surveyStale`"), "the brief carries the flag");
  });
});

describe("frontierOrderIds", () => {
  test("names every node exactly once, whatever the projector renders", async () => {
    const rootDir = await freshFrontierFixture("order-ids-");
    const graph = await readGraph(rootDir);
    const ids = frontierOrderIds(graph);
    assert.equal(ids.length, graph.nodes.length);
    assert.deepEqual([...ids].sort(), graph.nodes.map((n) => n.id).sort());
  });
});

// -------------------------------- against, passed-over, ruling reason, defines

describe("writeDraftBrief: a fact's own case against, a passed-over option, a ruling's reason, and a glossed term", () => {
  test("all four reach the brief text, on the node under review and on an ancestor carried into it", async () => {
    const rootDir = await freshFrontierFixture("new-fields-");
    const reviewDir = path.join(rootDir, "_review");

    // review-b: a case against its own recommendation, a passed-over option
    // with its reason, and a term this node defines with its gloss.
    const reviewBFile = path.join(rootDir, "main", "review-b.md");
    const reviewBBefore = await readFile(reviewBFile, "utf8");
    const reviewBAfter = reviewBBefore
      .replace(
        '      - name: narrower\n        source: ai\n        ref: "2026-08-01"\n',
        '      - name: narrower\n        source: ai\n        ref: "2026-08-01"\n        status: passed\n        reason: Covers less than the author\'s words ask for.\n',
      )
      .replace(
        "    recommends: standing\n    boldness: high\n    stands: standing\n",
        "    recommends: standing\n    boldness: high\n    against: The narrower reading would have covered fewer cases, at less risk.\n    stands: standing\n",
      )
      .replace(
        "form: rule\nstage: review\nfacts:",
        "form: rule\nstage: review\ndefines:\n  - term: narrower-reading\n    gloss: Answering only the case the author named.\nfacts:",
      );
    assert.notEqual(reviewBAfter, reviewBBefore, "fixture precondition: every replacement matched");
    await writeFile(reviewBFile, reviewBAfter);

    const bResult = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_B, date: "2026-09-04" });
    const bBrief = await readFile(bResult.briefPath, "utf8");
    assert.ok(
      bBrief.includes("against: The narrower reading would have covered fewer cases, at less risk."),
      "the fact's own case against its recommendation",
    );
    assert.ok(
      bBrief.includes("passed over — Covers less than the author's words ask for."),
      "the passed-over option's status and reason",
    );
    assert.ok(
      bBrief.includes("`narrower-reading` — Answering only the case the author named."),
      "the term this node defines, with its gloss",
    );

    // answered-ratified: a reason on the author's own ruling, carried into
    // review-low's brief as an ancestor (draftNeighbourhood's own test pins
    // its ancestry as [ANSWERED, REVIEW_GLOBAL]).
    const answeredFile = path.join(rootDir, "main", "answered-ratified.md");
    const answeredBefore = await readFile(answeredFile, "utf8");
    const answeredAfter = answeredBefore.replace(
      "          of: 70edb8ce8610630d55750558a972541c6f05b677\n",
      "          of: 70edb8ce8610630d55750558a972541c6f05b677\n          reason: Nothing has come up since to reopen it.\n",
    );
    assert.notEqual(answeredAfter, answeredBefore, "fixture precondition: the ruling block matched");
    await writeFile(answeredFile, answeredAfter);

    const lowResult = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-04" });
    const lowBrief = await readFile(lowResult.briefPath, "utf8");
    // A ruling's reason lived in the fact-detail line ("- Facts: ...") that
    // renderWholeNode prints for the node itself; a neighbour (review-cost's
    // neighbours-answered-not-whole clause) no longer carries that line at
    // all, only the status line, the answer that stands, and the names of
    // its answer fact's options -- so the reason is not here to find, and
    // the neighbour still says it was ruled.
    assert.ok(
      !lowBrief.includes("Nothing has come up since to reopen it."),
      "a neighbour no longer carries a ruling's reason: that prose stays in the fact detail, dropped like its rationale",
    );
    const answeredSection = lowBrief.slice(lowBrief.indexOf(`### ${ANSWERED}`));
    assert.match(
      answeredSection.slice(0, answeredSection.indexOf("###", 3)),
      /class: ratified \(ruled here\)/,
      "the ancestor's status line still says it was ruled, without the reason prose",
    );
  });
});

// ------------------------------------------------- the re-reading of an amendment

const PREVIOUS_FINDING_TEXT = "the plain-answer sentence should name the node it cites by its full id, which it already does";

/**
 * Stage review-low as a node whose recommendation has moved since a review
 * that stood at `commitValue`: the review block, an optional prior
 * '### Clean-context review,' account subsection (the previous reading), and
 * the amendment itself -- a changed '## Answer' -- written into the working
 * tree. `commitValue: "auto"` resolves to the fixture's own baseline commit
 * (requires `git: true`); a literal string is used as given, so a caller can
 * hand it an unresolvable-looking sha1 on a plain, non-git copy; `null`
 * leaves the 'commit' key out of the review block entirely.
 */
async function stageReReading(prefix, { git = true, commitValue = "auto", previousReading = true, of = STALE_PIN } = {}) {
  let rootDir;
  let resolvedCommit = commitValue;
  if (git) {
    const staged = await freshGitFrontierFixture(prefix);
    rootDir = staged.rootDir;
    if (commitValue === "auto") resolvedCommit = staged.commit;
  } else {
    rootDir = await freshFrontierFixture(prefix);
    if (commitValue === "auto") throw new Error("commitValue 'auto' needs git: true to resolve a real commit");
  }

  const file = path.join(rootDir, "main", "review-low.md");
  const before = await readFile(file, "utf8");
  const reviewLines = ["review:", "  verdict: forward", "  strength: moderate", '  date: "2026-09-04"', `  of: "${of}"`];
  if (resolvedCommit) reviewLines.push(`  commit: "${resolvedCommit}"`);
  let after = before.replace("stage: review\n", `stage: review\n${reviewLines.join("\n")}\n`);
  assert.notEqual(after, before, "fixture precondition: 'stage: review' matched");

  if (previousReading) {
    const accountBefore = after;
    after = after.replace(
      "smaller reviewer's model is read for.\n",
      "smaller reviewer's model is read for.\n\n"
      + "## Account\n\n### Clean-context review, 2026-09-04\n\n"
      + "Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.\n\n"
      + `Findings:\n\n- Answer: ${PREVIOUS_FINDING_TEXT}.\n\nThe review found no strong counter-argument.\n`,
    );
    assert.notEqual(after, accountBefore, "fixture precondition: the rationale's last line matched");
  }

  const beforeAmend = after;
  after = after.replace(
    "A plain answer at low boldness: nothing here reaches beyond the node itself,\nand clean-context-review.test/main/ruling-a is the node it names.",
    "A plain answer at low boldness, amended to also name clean-context-review.test/main/answered-ratified, in answer to the review's finding.",
  );
  assert.notEqual(after, beforeAmend, "fixture precondition: the Answer text matched");

  await writeFile(file, after);
  return { rootDir, reviewDir: path.join(rootDir, "_review"), commit: resolvedCommit };
}

const FRONTIER_FINDING_TEXT = "review-low's recommended text still names ruling-a where the record now prefers answered-ratified";

/**
 * Builds on `stageReReading`: a node a survey's frontier finding sent back
 * without ever writing `review.verdict: kickback` -- `stage` moved away
 * from `review` (to `maieutic` by default) and a `### Frontier finding,
 * <date>` account section appended after the reading it follows, mirroring
 * the record's own `growth` node at 2026-09-07 (a survey finding regresses a
 * node's stage on its own account, and `review.verdict` is left exactly as
 * the last draft or delta reading wrote it). `findingDate` defaults to the
 * same date `stageReReading` gives the review block, so it is "on or after
 * `review.date`" by the narrowest possible margin.
 */
async function stageFrontierFinding(prefix, { stage = "maieutic", findingDate = "2026-09-04" } = {}) {
  const { rootDir, reviewDir, commit } = await stageReReading(prefix);
  const file = path.join(rootDir, "main", "review-low.md");
  let text = await readFile(file, "utf8");

  const beforeStage = text;
  text = text.replace("stage: review\n", `stage: ${stage}\n`);
  assert.notEqual(text, beforeStage, "fixture precondition: the leading 'stage: review' matched");

  text += `\n### Frontier finding, ${findingDate}\n\nKind: contradiction.\n\n${FRONTIER_FINDING_TEXT}.\n`;

  await writeFile(file, text);
  return { rootDir, reviewDir, commit };
}

describe("chooseMode: the re-reading's own mode, derived from the record and never told by a flag", () => {
  test("no review at all: draft, and says so as the first reading", async () => {
    const rootDir = await freshFrontierFixture("mode-first-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const mode = chooseMode(node, { rootDir, draft: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, false);
    assert.match(mode.reason, /first reading/);
  });

  test("--draft forces the draft brief even where a commit is pinned and the file has changed", async () => {
    const { rootDir } = await stageReReading("mode-draft-flag-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const mode = chooseMode(node, { rootDir, draft: true });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, false);
    assert.match(mode.reason, /--draft/);
  });

  test("a kickback with review.commit set and the file since amended: delta, whatever the verdict", async () => {
    // `review-cost`: an amendment made for a reading's findings is read once
    // more, that re-reading's object being the amendment and not the node --
    // a kickback repaired in a few sentences owes exactly that, and not a
    // whole fresh draft reading of the redrawn answer.
    const { rootDir } = await stageReReading("mode-kickback-");
    const file = path.join(rootDir, "main", "review-low.md");
    const staged = (await readFile(file, "utf8")).replace("  verdict: forward\n", "  verdict: kickback\n");
    await writeFile(file, staged);

    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.review.verdict, "kickback", "fixture precondition: the reading kicked it back");

    const mode = chooseMode(node, { rootDir, draft: false });
    assert.equal(mode.mode, "delta", "the repair is the re-reading's object, not the whole node");
    assert.equal(mode.fallback, false);
    assert.equal(mode.kickback, true);
    assert.match(mode.reason, /kicked this answer back/);

    // The same node with a forward verdict takes the same mode: the choice
    // never turns on the verdict, only on the commit and the diff.
    const forwarded = { ...node, review: { ...node.review, verdict: "forward" } };
    const forwardedMode = chooseMode(forwarded, { rootDir, draft: false });
    assert.equal(forwardedMode.mode, "delta");
    assert.equal(forwardedMode.kickback, false);
  });

  test("a survey's frontier finding sent the node back without ever writing review.verdict: kickback: delta all the same", async () => {
    // Mirrors the record's own growth.md at 2026-09-07: a survey finding can
    // move a node's stage away from 'review' or 'ruling' on its own account,
    // leaving 'review.verdict' exactly as the last reading wrote it. The
    // choice between draft and delta does not read the verdict at all, so
    // this case takes the same delta a kickback would.
    const { rootDir } = await stageFrontierFinding("mode-frontier-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.stage, "maieutic", "fixture precondition: the survey sent it back");
    assert.equal(node.review.verdict, "forward", "fixture precondition: the verdict itself never changed");

    const mode = chooseMode(node, { rootDir, draft: false });
    assert.equal(mode.mode, "delta");
    assert.equal(mode.fallback, false);
    assert.equal(mode.kickback, false);
    assert.deepEqual(mode.frontierFindings.length, 1);
    assert.ok(mode.frontierFindings[0].startsWith("### Frontier finding, 2026-09-04"));
    assert.ok(mode.frontierFindings[0].includes(FRONTIER_FINDING_TEXT));
  });

  test("no review.commit at all: draft, whatever the verdict or the stage", async () => {
    const rootDir = await freshFrontierFixture("mode-nocommit-verdict-");
    const file = path.join(rootDir, "main", "review-low.md");
    const text = await readFile(file, "utf8");
    const staged = text.replace(
      "stage: review\n",
      'stage: maieutic\nreview:\n  verdict: kickback\n  strength: moderate\n  date: "2026-09-04"\n  of: "1111111111111111111111111111111111111111"\n',
    );
    assert.notEqual(staged, text, "fixture precondition matched");
    await writeFile(file, staged);

    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const mode = chooseMode(node, { rootDir, draft: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, true);
    assert.match(mode.reason, /names no commit/);
  });

  test("the node's file matches the commit its review pinned: draft, nothing to re-read", async () => {
    // `nodeDiffSinceCommit` diffs whatever commit `chooseMode` is handed
    // against the working tree, so a real commit whose tree already matches
    // the current file byte for byte -- the fixture's own untouched
    // baseline -- exercises the "nothing changed" branch honestly, without
    // needing the file to somehow embed its own future commit hash (which
    // no git history can do).
    const { rootDir, commit } = await freshGitFrontierFixture("mode-unmoved-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const withCommit = {
      ...node,
      review: { verdict: "forward", strength: "moderate", date: "2026-09-04", of: node.recommendationHash, against: null, commit, survey: null },
    };
    const mode = chooseMode(withCommit, { rootDir, draft: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, false);
    assert.match(mode.reason, /matches the commit/);
  });

  test("commit given but unresolvable (no git checkout at all): draft, with fallback", async () => {
    const { rootDir } = await stageReReading("mode-unresolvable-", { git: false, commitValue: STALE_PIN });
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const mode = chooseMode(node, { rootDir, draft: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, true);
    assert.match(mode.reason, /could not resolve/);
  });

  test("commit resolvable, but no prior '### Clean-context review,' or '### Clean-context re-reading,' subsection: draft, with fallback", async () => {
    const { rootDir } = await stageReReading("mode-noprevious-", { previousReading: false });
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const mode = chooseMode(node, { rootDir, draft: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, true);
    assert.match(mode.reason, /no prior reading/);
  });

  test("commit resolvable, a previous reading on record: delta, carrying the commit, the diff, and the previous reading", async () => {
    const { rootDir, commit } = await stageReReading("mode-delta-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const mode = chooseMode(node, { rootDir, draft: false });
    assert.equal(mode.mode, "delta");
    assert.equal(mode.fallback, false);
    assert.equal(mode.commit, commit);
    assert.ok(mode.diff.includes("amended to also name"), "the diff shows the amendment");
    assert.ok(mode.previous.startsWith("### Clean-context review, 2026-09-04"));
    assert.ok(mode.previous.includes(PREVIOUS_FINDING_TEXT));
    assert.deepEqual(mode.frontierFindings, []);
  });
});

describe("nodeDiffSinceCommit", () => {
  test("returns the diff text when the commit and the file both resolve", async () => {
    const { rootDir, commit } = await freshGitFrontierFixture("diff-ok-");
    const file = path.join(rootDir, "main", "review-low.md");
    await writeFile(file, `${await readFile(file, "utf8")}\nAmended.\n`);
    const diff = nodeDiffSinceCommit(rootDir, commit, "main/review-low.md");
    assert.ok(diff !== null);
    assert.match(diff, /\+Amended\.$/m);
  });

  test("returns null on a graph with no git checkout at all", async () => {
    const rootDir = await freshFrontierFixture("diff-nogit-");
    assert.equal(nodeDiffSinceCommit(rootDir, STALE_PIN, "main/review-low.md"), null);
  });

  test("returns null on a commit git cannot resolve, even inside a real checkout", async () => {
    const { rootDir } = await freshGitFrontierFixture("diff-badcommit-");
    assert.equal(nodeDiffSinceCommit(rootDir, STALE_PIN, "main/review-low.md"), null);
  });
});

describe("lastCleanContextReviewSection", () => {
  test("returns null on empty or absent account text", () => {
    assert.equal(lastCleanContextReviewSection(null), null);
    assert.equal(lastCleanContextReviewSection(""), null);
    assert.equal(lastCleanContextReviewSection("### Something else entirely\n\nNo review here.\n"), null);
  });

  test("extracts the last matching subsection verbatim, a draft review where no re-reading follows it", () => {
    const account = [
      "### Clean-context review, 2026-08-01",
      "",
      "First reading, superseded.",
      "",
      "### Clean-context review, 2026-09-04",
      "",
      "Second reading, the one to re-read against.",
      "",
    ].join("\n");
    const found = lastCleanContextReviewSection(account);
    assert.ok(found.startsWith("### Clean-context review, 2026-09-04"));
    assert.ok(found.includes("Second reading, the one to re-read against."));
    assert.ok(!found.includes("First reading, superseded."));
  });

  test("a re-reading following a draft review is the last match, not the draft review beneath it: a chain of re-readings is now possible since a kickback no longer forces a fresh draft", () => {
    const account = [
      "### Clean-context review, 2026-08-01",
      "",
      "The first, draft reading, long superseded.",
      "",
      "### Clean-context re-reading, 2026-09-04",
      "",
      "The re-reading this brief's own object is judged against.",
      "",
    ].join("\n");
    const found = lastCleanContextReviewSection(account);
    assert.ok(found.startsWith("### Clean-context re-reading, 2026-09-04"),
      "the most recent reading of either kind, since a re-reading can itself be repaired and re-read again");
    assert.ok(found.includes("The re-reading this brief's own object is judged against."));
    assert.ok(!found.includes("draft reading, long superseded"));
  });

  test("fence-aware: a heading-looking line inside a fenced code block is not a heading", () => {
    const account = [
      "### Clean-context review, 2026-08-01",
      "",
      "```markdown",
      "### Clean-context review, 2099-01-01",
      "not a real heading -- inside a fence",
      "```",
      "",
      "The real subsection continues here.",
      "",
    ].join("\n");
    const found = lastCleanContextReviewSection(account);
    assert.ok(found.startsWith("### Clean-context review, 2026-08-01"));
    assert.ok(found.includes("The real subsection continues here."));
    assert.ok(found.includes("```markdown"), "the fence itself is part of the one real subsection, carried whole");
  });
});

describe("frontierFindingSectionsSince", () => {
  test("returns [] on empty or absent account text, or no sinceDate", () => {
    assert.deepEqual(frontierFindingSectionsSince(null, "2026-09-04"), []);
    assert.deepEqual(frontierFindingSectionsSince("", "2026-09-04"), []);
    assert.deepEqual(frontierFindingSectionsSince("### Frontier finding, 2026-09-05\n\nSomething.\n", null), []);
  });

  test("carries every '### Frontier finding, <date>' section on or after sinceDate, verbatim, and excludes earlier ones", () => {
    const account = [
      "### Frontier finding, 2026-09-01",
      "",
      "Too early: excluded.",
      "",
      "### Frontier finding, 2026-09-04",
      "",
      "On the boundary: included.",
      "",
      "### Frontier finding, 2026-09-05",
      "",
      "After: included.",
      "",
    ].join("\n");
    const found = frontierFindingSectionsSince(account, "2026-09-04");
    assert.equal(found.length, 2);
    assert.ok(found[0].startsWith("### Frontier finding, 2026-09-04"));
    assert.ok(found[0].includes("On the boundary: included."));
    assert.ok(found[1].startsWith("### Frontier finding, 2026-09-05"));
    assert.ok(found[1].includes("After: included."));
    assert.ok(!found.some((s) => s.includes("Too early")));
  });

  test("does not match a titled finding, only the bare '### Frontier finding, <date>' heading the survey's apply step writes", () => {
    const account = "### Frontier finding: a titled one, 2026-09-05\n\nNot matched: the date is not where this function expects it.\n";
    assert.deepEqual(frontierFindingSectionsSince(account, "2026-09-01"), []);
  });
});

describe("lastAccountSectionOnly", () => {
  test("no account at all: text is null, nothing omitted", () => {
    assert.deepEqual(lastAccountSectionOnly(null), { text: null, omitted: 0 });
    assert.deepEqual(lastAccountSectionOnly(""), { text: null, omitted: 0 });
  });

  test("no '### ' heading at all: the whole account is carried, nothing omitted", () => {
    const account = "Untitled prose, no subsections at all.";
    assert.deepEqual(lastAccountSectionOnly(account), { text: account, omitted: 0 });
  });

  test("one '### ' section: carried whole, nothing omitted", () => {
    const account = "### Clean-context review, 2026-08-01\n\nThe only reading so far.";
    const { text, omitted } = lastAccountSectionOnly(account);
    assert.equal(omitted, 0);
    assert.equal(text, account);
  });

  test("several '### ' sections: only the last is carried, and the rest are counted", () => {
    const account = [
      "### Clean-context review, 2026-08-01",
      "",
      "First reading, superseded.",
      "",
      "### Frontier survey, 2026-08-15",
      "",
      "A survey subsection, also superseded.",
      "",
      "### Clean-context review, 2026-09-04",
      "",
      "The last reading, the one this brief carries.",
      "",
    ].join("\n");
    const { text, omitted } = lastAccountSectionOnly(account);
    assert.equal(omitted, 2, "the two earlier sections are counted, not carried");
    assert.ok(text.startsWith("### Clean-context review, 2026-09-04"));
    assert.ok(text.includes("The last reading, the one this brief carries."));
    assert.ok(!text.includes("First reading, superseded."));
    assert.ok(!text.includes("A survey subsection, also superseded."));
  });

  test("fence-aware, like lastCleanContextReviewSection: a heading-looking line inside a fence is not a heading", () => {
    const account = [
      "### Clean-context review, 2026-08-01",
      "",
      "```markdown",
      "### Clean-context review, 2099-01-01",
      "not a real heading -- inside a fence",
      "```",
      "",
      "The real subsection continues here.",
    ].join("\n");
    const { text, omitted } = lastAccountSectionOnly(account);
    assert.equal(omitted, 0, "the fenced text is not a second heading");
    assert.ok(text.includes("```markdown"), "the fence is part of the one real section, carried whole");
    assert.ok(text.includes("The real subsection continues here."));
  });
});

describe("writeDeltaBrief", () => {
  test("fills every placeholder; carries the node whole, the diff, the previous reading, and no neighbourhood", async () => {
    const { rootDir, reviewDir, commit } = await stageReReading("delta-ok-");
    const result = await writeDeltaBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-05" });
    assert.equal(result.briefPath, path.join(reviewDir, "delta-review-low.brief.md"));
    assert.equal(result.outFile, "tmp/review/delta-review-low.json");

    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(!brief.includes("{{"), `unfilled placeholder left in brief:\n${brief.slice(0, 2000)}`);
    assert.ok(brief.startsWith(`# Clean-context re-reading, 2026-09-05: \`${REVIEW_LOW}\``));
    assert.ok(brief.includes(`### ${REVIEW_LOW}`), "the node whole");
    assert.ok(brief.includes("#### Account (the AI's account"), "the node's account goes in whole, same as the draft brief");
    assert.ok(brief.includes(commit), "the pinned commit is named");
    assert.ok(brief.includes("amended to also name"), "the diff, showing the amendment");
    assert.ok(brief.includes(PREVIOUS_FINDING_TEXT), "the previous reading, verbatim");
    assert.ok(brief.includes('"scope": "delta"'), "the output schema pins scope to delta");
    assert.ok(brief.includes("tmp/review/delta-review-low.json"));

    // no neighbourhood: review-cost's answer gives a re-reading only the
    // node, the diff, and the previous reading -- never the ancestry, the
    // siblings, or the index a first reading is given.
    for (const heading of ["## Its ancestry", "## Its siblings", "## The nodes it names", "## Every other question"]) {
      assert.ok(!brief.includes(heading), `a re-reading carries no '${heading}': that question is already settled`);
    }
  });

  test("refuses with an exit-2 error when the node cannot take a re-reading (chooseMode would not choose delta)", async () => {
    const rootDir = await freshFrontierFixture("delta-refuse-");
    const reviewDir = path.join(rootDir, "_review");
    await assert.rejects(
      () => writeDeltaBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-05" }),
      (err) => {
        assert.match(err.message, /cannot take a re-reading brief/);
        assert.equal(err.exitCode, 2);
        return true;
      },
    );
  });

  test("carries the graph commit it was generated at, and no kickback note on a forward", async () => {
    const { rootDir, reviewDir } = await stageReReading("delta-graph-commit-");
    const result = await writeDeltaBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-05" });
    const brief = await readFile(result.briefPath, "utf8");
    assert.match(brief, /\*\*The graph commit you are reading is `[0-9a-f]{40}( \(dirty\))?`\.\*\*/);
    assert.ok(!brief.includes("kicked this node back"), "the last verdict was forward: no kickback note");
  });

  test("a kickback: the opening line says so, and the mode is still derived from the record", async () => {
    const { rootDir, reviewDir } = await stageReReading("delta-kickback-note-");
    const file = path.join(rootDir, "main", "review-low.md");
    const staged = (await readFile(file, "utf8")).replace("  verdict: forward\n", "  verdict: kickback\n");
    await writeFile(file, staged);

    const result = await writeDeltaBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-05" });
    const brief = await readFile(result.briefPath, "utf8");
    assert.match(brief, /The last reading kicked this node back; the amendment below is the repair/);
  });

  test("a survey's frontier finding dated on or after the review's date is carried verbatim, under its own heading", async () => {
    const { rootDir, reviewDir } = await stageFrontierFinding("delta-frontier-");
    const result = await writeDeltaBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-05" });
    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(brief.includes("## The survey's findings the repair answers"));
    assert.ok(brief.includes("### Frontier finding, 2026-09-04"));
    assert.ok(brief.includes(FRONTIER_FINDING_TEXT));
    // The verdict never moved to kickback on this node: no kickback note.
    assert.ok(!brief.includes("kicked this node back"));
  });

  test("no frontier finding on or after the review's date: the section says so and carries nothing", async () => {
    const { rootDir, reviewDir } = await stageReReading("delta-no-frontier-");
    const result = await writeDeltaBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-05" });
    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(brief.includes("(no `### Frontier finding` section dated on or after the last review"));
  });
});

describe("CLI: --node derives its mode from the record, prints it, and --draft forces the draft brief", () => {
  test("a commit-pinned node whose file has changed takes the re-reading; --draft on the same node forces the draft, and --fresh does the same as a deprecated alias", async () => {
    const { rootDir } = await stageReReading("cli-delta-");
    const cwd = path.dirname(rootDir);

    const delta = runCli(["--node", REVIEW_LOW, rootDir, "--date", "2026-09-05", "--dry"], cwd);
    assert.match(delta, /^mode: delta \(/m);
    assert.match(delta, /delta: clean-context-review\.test\/main\/review-low; \d+ bytes over \d+ lines/);
    assert.match(delta, /the reviewer's output file: tmp\/review\/delta-review-low\.json/);

    const forced = runCli(["--node", REVIEW_LOW, rootDir, "--date", "2026-09-05", "--dry", "--draft"], cwd);
    assert.match(forced, /^mode: draft \(--draft/m);
    assert.match(forced, /draft: clean-context-review\.test\/main\/review-low;/);

    const fresh = runCli(["--node", REVIEW_LOW, rootDir, "--date", "2026-09-05", "--dry", "--fresh"], cwd);
    assert.match(fresh, /^mode: draft \(--draft/m, "--fresh is a deprecated alias of --draft");
  });

  test("a node whose review carries no commit at all takes the draft brief, whatever its verdict", async () => {
    const rootDir = await freshFrontierFixture("cli-nocommit-");
    const cwd = path.dirname(rootDir);
    const file = path.join(rootDir, "main", "review-low.md");
    const text = await readFile(file, "utf8");
    const staged = text.replace(
      "stage: review\n",
      'stage: maieutic\nreview:\n  verdict: kickback\n  strength: moderate\n  date: "2026-09-04"\n  of: "1111111111111111111111111111111111111111"\n',
    );
    assert.notEqual(staged, text, "fixture precondition matched");
    await writeFile(file, staged);

    const out = runCliExpectingFailure(["--node", REVIEW_LOW, rootDir, "--dry"], cwd);
    // No commit and a stage of neither 'review' nor a commit-backed
    // amendment: resolveReviewNode has nothing to accept this node on.
    assert.equal(out.status, 2);
    assert.match(out.stderr, /or on one whose review\.commit is set/);
  });

  test("a fallback prints the reason on stdout's mode line and warns on stderr, but still writes the draft brief", async () => {
    const { rootDir } = await stageReReading("cli-fallback-", { commitValue: null });
    const cwd = path.dirname(rootDir);
    const { stdout, stderr, status } = spawnSync(
      process.execPath,
      [BRIEF_MJS, "--node", REVIEW_LOW, rootDir, "--date", "2026-09-05", "--dry"],
      { cwd, encoding: "utf8" },
    );
    assert.equal(status, 0, `expected success; stderr:\n${stderr}`);
    assert.match(stdout, /^mode: draft \(.*names no commit/m);
    assert.match(stdout, /draft: clean-context-review\.test\/main\/review-low;/, "still writes the draft brief");
    assert.match(stderr, /falling back to the draft brief: .*names no commit/);
  });
});

// ------------------------------------------------- the survey's selection

describe("sectionHashes and movedSections: the five sections a delta compares", () => {
  test("the five keys, each a hash, and two identical nodes hash the same", async () => {
    const graph = await readGraph(await freshFrontierFixture("hash-"));
    const node = graph.nodes.find((n) => n.id === REVIEW_A);
    const hashes = sectionHashes(node, graph.words);
    assert.deepEqual(Object.keys(hashes), SECTION_HASH_KEYS);
    for (const key of SECTION_HASH_KEYS) assert.match(hashes[key], /^[0-9a-f]{64}$/);
    assert.deepEqual(sectionHashes(node, graph.words), hashes, "the hash is of the text and nothing else");
  });

  test("movedSections names which of the five moved, and nothing where none did", () => {
    const pinned = { question: "q", answer: "a", options: "o", rivals: "r", words: "w" };
    assert.deepEqual(movedSections(pinned, pinned), []);
    assert.deepEqual(movedSections(pinned, { ...pinned, answer: "A", words: "W" }), ["answer", "words"]);
  });

  test("a key the pin does not carry is not a move: an older pin is read for what it says", () => {
    assert.deepEqual(movedSections({ question: "q" }, { question: "q", answer: "different" }), []);
  });
});

describe("judgedSet", () => {
  test("carries every node a survey owes a reading, with the reason it was judged", async () => {
    const graph = await readGraph(await freshFrontierFixture("judged-"));
    const { judged, reasons } = judgedSet(graph);
    const owed = new Set(surveyJudges(graph).map((n) => n.id));
    for (const id of owed) {
      assert.ok(judged.some((n) => n.id === id), `${id} is owed a reading and is judged`);
      assert.match(reasons.get(id), /no survey has read it|moved past its survey pin/);
    }
    assert.equal(new Set(judged.map((n) => n.id)).size, judged.length, "each node once");
  });

  test("a node whose read text moved since its survey pinned it is judged, and names which section moved", async () => {
    const graph = await readGraph(await freshFrontierFixture("judged-text-"));
    const node = graph.nodes.find((n) => (n.review?.survey ?? null) === null && n.answerFact);
    // Give it a survey pin that is current on the recommendation and stale on
    // the text: the delta compares hashes, so this is the one thing that
    // brings a node back that `surveyJudges` would not.
    node.review = {
      ...(node.review ?? { verdict: null, strength: null, date: null, of: null, against: null, commit: null }),
      survey: {
        date: "2026-09-01",
        of: node.recommendationHash,
        text: { ...sectionHashes(node, graph.words), answer: "0".repeat(64) },
      },
    };
    const { judged, reasons } = judgedSet(graph);
    assert.ok(judged.some((n) => n.id === node.id));
    assert.match(reasons.get(node.id), /read text moved since the survey pinned it: answer/);
  });

  test("a node whose text is exactly what the survey pinned is not judged again", async () => {
    const graph = await readGraph(await freshFrontierFixture("judged-unchanged-"));
    const node = graph.nodes.find((n) => (n.review?.survey ?? null) === null && n.answerFact);
    node.review = {
      ...(node.review ?? {}),
      survey: { date: "2026-09-01", of: node.recommendationHash, text: sectionHashes(node, graph.words) },
    };
    const { judged } = judgedSet(graph);
    assert.equal(judged.some((n) => n.id === node.id), false);
  });
});

describe("candidatePairs: the five keys, each nominating on its own", () => {
  const bare = (id, extra = {}) => ({
    id, question: `What is ${id}?`, under: [], depends: [], cites: [], bears: [],
    defines: [], facts: [], stage: null, review: null, account: null,
    recommendationHash: "a".repeat(40), ...extra,
  });
  const keysOf = (pairs, a, b) => (pairs.find((p) => p.a === a && p.b === b) ?? { keys: [] }).keys;

  test("a term pairs the definer with a user, and records the term and the definer", () => {
    const pairs = candidatePairs({ nodes: [
      bare("g/def", { defines: ["judged set"] }),
      bare("g/x", { answer: "The judged set is read." }),
      bare("g/y", { answer: "A judged set again." }),
    ] });
    const defXKeys = keysOf(pairs, "g/def", "g/x");
    assert.ok(defXKeys.some((k) => k.startsWith("term:judged set")), "the definer and a user are paired, with the term named");
    assert.ok(defXKeys.some((k) => k.includes("g/def")), "the pair's key names which node defines the term");
    assert.ok(keysOf(pairs, "g/def", "g/y").some((k) => k.startsWith("term:judged set")), "the definer is paired with the other user too");
  });

  test("two users of the same term are not paired on `term`", () => {
    const pairs = candidatePairs({ nodes: [
      bare("g/def", { defines: ["judged set"] }),
      bare("g/x", { answer: "The judged set is read." }),
      bare("g/y", { answer: "A judged set again." }),
    ] });
    assert.deepEqual(keysOf(pairs, "g/x", "g/y"), [], "two users of one term are never paired with each other on `term`");
  });

  test("a shared entry of the author's words", () => {
    const withRef = (id) => bare(id, {
      facts: [{ name: "answer", options: [{ name: "x", supports: ["words/2026-09-05/1"] }] }],
    });
    const words = new Map([["words/2026-09-05/1", { address: "words/2026-09-05/1", text: "said" }]]);
    const pairs = candidatePairs({ nodes: [withRef("g/a"), withRef("g/b")], words });
    assert.ok(keysOf(pairs, "g/a", "g/b").includes("words:words/2026-09-05/1"));
  });

  test("a shared parent", () => {
    const pairs = candidatePairs({ nodes: [
      bare("g/p"), bare("g/a", { under: ["g/p"] }), bare("g/b", { under: ["g/p"] }),
    ] });
    assert.ok(keysOf(pairs, "g/a", "g/b").includes("parent:g/p"));
  });

  test("a citation either way, in `depends` or in prose", () => {
    const pairs = candidatePairs({ nodes: [
      bare("g/t", { question: "What is the target?" }),
      bare("g/d", { depends: [{ id: "g/t", option: null }] }),
      bare("g/p", { answer: "As `g/t` says." }),
    ] });
    assert.ok(keysOf(pairs, "g/d", "g/t").includes("depends"));
    assert.ok(keysOf(pairs, "g/p", "g/t").includes("cites"));
  });

  test("resemblance over word shingles, at or above the threshold and not below it", () => {
    const long = "the record keeps the author's standing answers and the work is derived from that record rather than from prompts or chat and this sentence is long enough to shingle";
    const near = `${long} with one clause added at the end`;
    const far = "a wholly different sentence about nothing this record says anywhere else at all whatever";
    const pairs = candidatePairs({ nodes: [
      bare("g/a", { answer: long }), bare("g/b", { answer: near }), bare("g/c", { answer: far }),
    ] });
    assert.ok(keysOf(pairs, "g/a", "g/b").some((k) => k.startsWith("jaccard:")));
    assert.deepEqual(keysOf(pairs, "g/a", "g/c"), []);
  });

  test("one pair carries every key that nominated it, and each pair appears once", () => {
    const pairs = candidatePairs({ nodes: [
      bare("g/p"),
      bare("g/a", { under: ["g/p"], defines: ["judged set"] }),
      bare("g/b", { under: ["g/p"], answer: "The judged set." }),
    ] });
    const keys = keysOf(pairs, "g/a", "g/b");
    assert.ok(keys.includes("parent:g/p"));
    assert.ok(keys.some((k) => k.startsWith("term:judged set")));
    assert.equal(pairs.filter((p) => p.a === "g/a" && p.b === "g/b").length, 1);
  });
});

describe("cutPairs, probeSeed and drawProbe", () => {
  const pinned = (id, date) => ({
    id, review: { survey: { date, of: "a".repeat(40) } },
  });

  test("a pair both of whose members are unchanged since a survey read them together is frozen", () => {
    const a = pinned("g/a", "2026-09-01");
    const b = pinned("g/b", "2026-09-01");
    const c = pinned("g/c", "2026-09-02");
    const byId = new Map([a, b, c].map((n) => [n.id, n]));
    const pairs = [{ a: "g/a", b: "g/b", keys: ["parent:x"] }, { a: "g/a", b: "g/c", keys: ["parent:x"] }];
    const { live, frozen } = cutPairs(pairs, { byId, judgedIds: new Set() });
    assert.deepEqual(frozen.map((p) => p.b), ["g/b"]);
    assert.deepEqual(live.map((p) => p.b), ["g/c"], "read by no one survey together: live");
  });

  test("a judged member thaws the pair, and a whole survey freezes nothing", () => {
    const a = pinned("g/a", "2026-09-01");
    const b = pinned("g/b", "2026-09-01");
    const byId = new Map([a, b].map((n) => [n.id, n]));
    const pairs = [{ a: "g/a", b: "g/b", keys: ["parent:x"] }];
    assert.equal(cutPairs(pairs, { byId, judgedIds: new Set(["g/a"]) }).frozen.length, 0);
    assert.equal(cutPairs(pairs, { byId, judgedIds: new Set(), whole: true }).frozen.length, 0);
    assert.equal(cutPairs(pairs, { byId, judgedIds: new Set(), whole: true }).live.length, 1);
  });

  test("the pairs a survey recorded on a node decide, where it recorded any", () => {
    const a = { id: "g/a", review: { survey: { date: "2026-09-01", pairs: [{ with: "g/b", keys: ["parent:x"] }] } } };
    const b = { id: "g/b", review: { survey: { date: "2026-09-02", pairs: [] } } };
    const c = { id: "g/c", review: { survey: { date: "2026-09-01", pairs: [] } } };
    const byId = new Map([a, b, c].map((n) => [n.id, n]));
    const pairs = [{ a: "g/a", b: "g/b", keys: ["k"] }, { a: "g/a", b: "g/c", keys: ["k"] }];
    const { frozen } = cutPairs(pairs, { byId, judgedIds: new Set() });
    assert.deepEqual(frozen.map((p) => p.b), ["g/b"], "a recorded pair freezes; a shared date does not, once pairs are recorded");
  });

  test("the seed is a function of the date and the commit, and the draw is reproducible on it", () => {
    assert.equal(probeSeed("2026-09-07", "abc"), probeSeed("2026-09-07", "abc"));
    assert.notEqual(probeSeed("2026-09-07", "abc"), probeSeed("2026-09-08", "abc"));
    assert.notEqual(probeSeed("2026-09-07", "abc"), probeSeed("2026-09-07", "def"));

    const frozen = Array.from({ length: 400 }, (_, i) => ({ a: `g/a${i}`, b: `g/b${i}`, keys: ["k"] }));
    const seed = probeSeed("2026-09-07", "abc");
    assert.deepEqual(drawProbe(frozen, seed), drawProbe(frozen, seed), "same seed, same draw");
    assert.notDeepEqual(drawProbe(frozen, seed), drawProbe(frozen, seed + 1));
  });

  test("one in twenty, and never fewer than ten", () => {
    const frozen = (n) => Array.from({ length: n }, (_, i) => ({ a: `g/a${i}`, b: `g/b${i}`, keys: ["k"] }));
    assert.equal(drawProbe(frozen(400), 1).length, 20, "one in twenty of four hundred");
    assert.equal(drawProbe(frozen(100), 1).length, 10, "the floor, not five");
    assert.equal(drawProbe(frozen(7), 1).length, 7, "fewer frozen than the floor: all of them");
    assert.equal(drawProbe([], 1).length, 0);
    const drawn = drawProbe(frozen(400), 1);
    assert.equal(new Set(drawn.map((p) => p.a)).size, drawn.length, "no pair drawn twice");
  });
});

describe("wholeDemand: the two backstops and the two overrides", () => {
  const s = (date, whole) => ({ date, whole });

  test("no history at all demands a whole survey", () => {
    const d = wholeDemand(null, { date: "2026-09-07" });
    assert.equal(d.whole, true);
    assert.equal(d.demanded, true);
    assert.match(d.why, /no survey history/);
  });

  test("four deltas since the last whole survey demand one", () => {
    const history = { surveys: [s("2026-09-01", true), s("2026-09-02"), s("2026-09-03"), s("2026-09-04")] };
    assert.equal(wholeDemand(history, { date: "2026-09-05" }).whole, false, "three deltas is not yet four");
    history.surveys.push(s("2026-09-05"));
    const d = wholeDemand(history, { date: "2026-09-06" });
    assert.equal(d.whole, true);
    assert.match(d.why, /4 delta survey\(s\) have run/);
  });

  test("a whole survey older than thirty days demands one", () => {
    const history = { surveys: [s("2026-08-01", true)] };
    const d = wholeDemand(history, { date: "2026-09-07" });
    assert.equal(d.whole, true);
    assert.match(d.why, /at least once in any thirty days/);
    assert.equal(wholeDemand({ surveys: [s("2026-09-01", true)] }, { date: "2026-09-07" }).whole, false);
  });

  test("--validations-changed demands one whatever the history says", () => {
    const d = wholeDemand({ surveys: [s("2026-09-06", true)] }, { date: "2026-09-07", validationsChanged: true });
    assert.equal(d.whole, true);
    assert.match(d.why, /--validations-changed/);
  });

  test("--whole takes one without demanding it: the caller asked, no backstop fired", () => {
    const d = wholeDemand({ surveys: [s("2026-09-06", true)] }, { date: "2026-09-07", forced: true });
    assert.equal(d.whole, true);
    assert.equal(d.demanded, false);
    assert.match(d.why, /--whole/);
  });
});

describe("writeSurveyBrief: the tier gates the launch", () => {
  /** The fixture, with a duplicated passage written into two of its nodes. */
  async function withTierFinding(prefix) {
    const rootDir = await freshFrontierFixture(prefix);
    const passage = "A paragraph long enough to clear the two hundred byte floor the tier holds, written into two node files of this fixture so that the duplicated-passage check has something to find, and byte-identical in both of them.";
    for (const id of [REVIEW_A, REVIEW_B]) {
      const file = path.join(rootDir, "main", `${id.split("/").pop()}.md`);
      await writeFile(file, `${await readFile(file, "utf8")}\n${passage}\n`);
    }
    return rootDir;
  }

  test("a finding refuses the launch, names the count and the checks, and writes nothing", async () => {
    const rootDir = await withTierFinding("tier-gate-");
    const reviewDir = path.join(rootDir, "out");
    const err = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07" }).then(() => null, (e) => e);
    assert.ok(err !== null, "the tier refuses the launch");
    assert.equal(err.exitCode, 3);
    assert.match(err.message, /the mechanical tier reports \d+ finding\(s\) over 8 checks/);
    assert.match(err.message, /duplicated-passage/);
    assert.match(err.message, /--force-tier/);
    await assert.rejects(readFile(path.join(reviewDir, "survey.brief.md"), "utf8"), "nothing written");
  });

  test("--force-tier writes the brief and stamps it as launched over a failing tier", async () => {
    const rootDir = await withTierFinding("tier-force-");
    const reviewDir = path.join(rootDir, "out");
    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07", forceTier: true });
    assert.ok(result.tierFindingCount > 0);
    assert.equal(result.tierForced, true);
    const brief = await readFile(path.join(reviewDir, "survey.brief.md"), "utf8");
    assert.match(brief, /launched over a failing tier/);
    assert.match(brief, /A clean tier is not a clean frontier/);
  });

  test("a clean tier writes the brief, says how many checks ran, and says a clean tier is not a clean frontier", async () => {
    const rootDir = await freshFrontierFixture("tier-clean-");
    const reviewDir = path.join(rootDir, "out");
    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07" });
    assert.equal(result.tierFindingCount, 0);
    const brief = await readFile(path.join(reviewDir, "survey.brief.md"), "utf8");
    assert.match(brief, /ran 8 checks/);
    assert.match(brief, /A clean tier is not a clean frontier/);
    assert.doesNotMatch(brief, /launched over a failing tier/);
  });
});

describe("writeSurveyBrief: the selection, the sidecars and --out", () => {
  test("the brief names the judged set with its reasons, the pairs with their keys, and the frozen set", async () => {
    const rootDir = await freshFrontierFixture("selection-");
    const reviewDir = path.join(rootDir, "out");
    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07" });
    const brief = await readFile(path.join(reviewDir, "survey.brief.md"), "utf8");
    assert.match(brief, /### The selection this survey took, and what it cost/);
    assert.match(brief, /### The judged set, in the ruling order/);
    assert.match(brief, /judged because /);
    assert.match(brief, /### The candidate pairs \(\d+ live/);
    assert.match(brief, /^### main\/\S+ \(\d+ pair\(s\)\)$/m, "the pairs are grouped by the judged node each is compared against");
    assert.equal(result.pairCount, result.livePairCount + result.frozenPairCount);
  });

  test("the pins sidecar carries the five section hashes of every node, beside its recommendation hash", async () => {
    const rootDir = await freshFrontierFixture("pins-text-");
    const reviewDir = path.join(rootDir, "out");
    await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07" });
    const pins = JSON.parse(await readFile(path.join(reviewDir, "survey.pins.json"), "utf8"));
    const graph = await readGraph(rootDir);
    for (const node of graph.nodes) {
      assert.deepEqual(Object.keys(pins.text[node.id]), SECTION_HASH_KEYS, node.id);
      assert.equal(pins.pins[node.id], node.recommendationHash);
    }
  });

  test("the selection sidecar names the frozen set, the probe and the seed, so what was not read is a fact of the run", async () => {
    const rootDir = await freshFrontierFixture("selection-json-");
    const reviewDir = path.join(rootDir, "out");
    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07" });
    const selection = JSON.parse(await readFile(path.join(reviewDir, "survey.selection.json"), "utf8"));
    assert.equal(selection.date, "2026-09-07");
    assert.equal(selection.seed, result.seed);
    assert.equal(selection.pairs.nominated, result.pairCount);
    assert.equal(selection.pairs.live.length, result.livePairCount);
    assert.equal(selection.pairs.frozen.length, result.frozenPairCount);
    assert.deepEqual(selection.tier.checks.length, 8);
    for (const entry of selection.judged) assert.ok(entry.why, `${entry.node} carries the reason it was judged`);
  });

  test("the history sidecar is appended, and a second run reads what the first wrote", async () => {
    const rootDir = await freshFrontierFixture("history-");
    const reviewDir = path.join(rootDir, "out");
    const first = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07" });
    assert.equal(first.whole, true, "no history: the backstop demands a whole survey");
    const history = JSON.parse(await readFile(path.join(reviewDir, "survey.history.json"), "utf8"));
    assert.equal(history.surveys.length, 1);
    assert.equal(history.surveys[0].whole, true);

    const second = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-08" });
    assert.equal(second.whole, false, "a whole survey ran yesterday: this one is a delta");
    assert.match(second.wholeWhy, /both backstops are met/);
    const after2 = JSON.parse(await readFile(path.join(reviewDir, "survey.history.json"), "utf8"));
    assert.equal(after2.surveys.length, 2);
  });

  test("--whole freezes nothing and says so", async () => {
    const rootDir = await freshFrontierFixture("whole-");
    const reviewDir = path.join(rootDir, "out");
    await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07" });
    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-08", whole: true });
    assert.equal(result.whole, true);
    assert.equal(result.frozenPairCount, 0);
    assert.equal(result.probeCount, 0);
    const brief = await readFile(path.join(reviewDir, "survey.brief.md"), "utf8");
    assert.match(brief, /Nothing is frozen and there is no drift probe: this survey is whole\./);
  });

  test("--out writes the brief where the caller asked, and the sidecars beside it", async () => {
    const rootDir = await freshFrontierFixture("out-");
    const out = path.join(rootDir, "elsewhere", "my-survey.md");
    const result = await writeSurveyBrief({ rootDir, reviewDir: path.join(rootDir, "out"), date: "2026-09-07", out });
    assert.equal(result.briefPath, out);
    assert.match(await readFile(out, "utf8"), /### The selection this survey took/);
  });

  test("sidecarDir redirects the pins, selection and history sidecars away from reviewDir, without moving the brief", async () => {
    const rootDir = await freshFrontierFixture("sidecar-");
    const reviewDir = path.join(rootDir, "out");
    const sidecarDir = path.join(rootDir, "elsewhere-sidecars");
    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07", sidecarDir });

    assert.equal(result.briefPath, path.join(reviewDir, "survey.brief.md"));
    assert.equal(result.pinsPath, path.join(sidecarDir, "survey.pins.json"));
    assert.equal(result.selectionPath, path.join(sidecarDir, "survey.selection.json"));

    // The brief itself is where reviewDir (or --out) says; only the three
    // sidecars move, and reviewDir's own copies of them are never written.
    await readFile(result.briefPath, "utf8");
    await readFile(path.join(sidecarDir, "survey.pins.json"), "utf8");
    await readFile(path.join(sidecarDir, "survey.selection.json"), "utf8");
    await readFile(path.join(sidecarDir, "survey.history.json"), "utf8");
    await assert.rejects(readFile(path.join(reviewDir, "survey.pins.json"), "utf8"));
    await assert.rejects(readFile(path.join(reviewDir, "survey.selection.json"), "utf8"));
    await assert.rejects(readFile(path.join(reviewDir, "survey.history.json"), "utf8"));
  });

  test("a dry run writes nothing at all", async () => {
    const rootDir = await freshFrontierFixture("dry-");
    const reviewDir = path.join(rootDir, "out");
    await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07", dry: true });
    await assert.rejects(readFile(path.join(reviewDir, "survey.brief.md"), "utf8"));
    await assert.rejects(readFile(path.join(reviewDir, "survey.history.json"), "utf8"));
  });
});

// ------------------------------------- the judged node, and the pair list
//
// `survey-selection`: the judged node is "carried once ... its content never
// rendered twice", and a key "narrows attention and never the corpus", the
// pair list ordering the reading rather than partitioning it.

const CONTENT_NODE = "clean-context-review.test/main/content-node";

/** Content, as `parseOptionContent` normalizes it: no trailing blank line,
 * one closing newline -- so a diff computed here applies to what the reader
 * resolves there. */
const content = (...lines) => `${lines.join("\n").replace(/\n+$/, "")}\n`;

/** Four hundred lines of body, so that a near copy rewriting fifty
 * consecutive ones has a difference well past the eighty-line cap and well
 * short of the copy itself. */
const LONG_BODY = Array.from({ length: 400 }, (_, i) => `Line ${i}, which the long near copy either keeps or rewrites.`);

const RECOMMENDED_CONTENT = content(
  "---",
  "question: What does a content-encoded node carry?",
  "form: rule",
  "---",
  "",
  "## Answer",
  "",
  "The recommended answer, which is the one that binds.",
  "",
  "A second paragraph, which the near copy rewrites and nothing else touches.",
  "",
  ...LONG_BODY,
);

const LONG_NEAR_COPY_CONTENT = content(
  ...RECOMMENDED_CONTENT.replace(/\n$/, "").split("\n").map((line) => {
    const m = /^Line (\d+), /.exec(line);
    return m && Number(m[1]) >= 100 && Number(m[1]) < 150 ? `Line ${m[1]}, rewritten by the long near copy.` : line;
  }),
);

const NEAR_COPY_CONTENT = RECOMMENDED_CONTENT.replace(
  "A second paragraph, which the near copy rewrites and nothing else touches.",
  "A second paragraph, rewritten by the near copy and otherwise the same node.",
);

const NAMED_CHANGE_TARGET = RECOMMENDED_CONTENT.replace(
  "The recommended answer, which is the one that binds.",
  "The named change's answer, which is the recommendation with its first line replaced.",
);

const NAMED_CHANGE_DIFF = diffText(RECOMMENDED_CONTENT, NAMED_CHANGE_TARGET);

const DIFFERENT_DRAFT_CONTENT = content(
  "---",
  "question: What does a content-encoded node carry?",
  "form: rule",
  "---",
  "",
  "## Answer",
  "",
  "Nothing of the sort.",
);

/** A whole option whose frontmatter differs from the recommendation's own
 * (`form: target` rather than `form: rule`) and whose `## Answer` is
 * byte-identical to it -- rule 3's case: the frontmatter is never rendered
 * whole, only diffed, and the unchanged answer is named rather than shown. */
const FRONTMATTER_CHANGE_CONTENT = content(
  "---",
  "question: What does a content-encoded node carry?",
  "form: target",
  "---",
  "",
  "## Answer",
  "",
  "The recommended answer, which is the one that binds.",
  "",
  "A second paragraph, which the near copy rewrites and nothing else touches.",
  "",
  ...LONG_BODY,
);

/** What the migration of 2026-09-07 left on most options: the whole node,
 * frontmatter and all, with the option's own sentence standing in the `##
 * Answer`'s place and nothing else of the node touched -- the case
 * `optionContentAgainstAnswer`'s rule 1 collapses to one line. */
const MIGRATED_SENTENCE = "The migration carried this option's sentence into the answer's place and wrote no text of its own.";

const MIGRATED_WHOLE_CONTENT = content(
  "---",
  "question: What does a content-encoded node carry?",
  "form: rule",
  "---",
  "",
  "## Answer",
  "",
  MIGRATED_SENTENCE,
);

/**
 * One node in the content encoding, judged: five options on its answer fact,
 * of which one is the recommendation the answer resolves to, one a near copy
 * of it, one byte-identical to it, one a named change against it, and one a
 * different draft altogether and shorter than the difference from the answer
 * would be. `depends` names another judged node, so the pair list has a
 * judged-judged pair to place.
 */
function contentEncodedNode() {
  const whole = (name, sentence, text) => [
    `#### ${name}`,
    "",
    sentence,
    "",
    "**AI support.** Support the survey never reads.",
    "",
    "**AI divergence.** Divergence the survey never reads either.",
    "",
    "**Content.**",
    "",
    "```markdown",
    text.replace(/\n$/, ""),
    "```",
    "",
  ].join("\n");

  return [
    "---",
    "question: What does a content-encoded node carry?",
    "form: rule",
    "stage: ruling",
    "facts:",
    "  - name: answer",
    "    options:",
    "      - name: recommended-whole",
    "        source: ai",
    '        ref: "2026-09-07"',
    "      - name: near-copy-whole",
    "        source: ai",
    '        ref: "2026-09-07"',
    "      - name: same-as-recommended",
    "        source: ai",
    '        ref: "2026-09-07"',
    "      - name: a-named-change",
    "        source: ai",
    '        ref: "2026-09-07"',
    "      - name: a-long-near-copy",
    "        source: ai",
    '        ref: "2026-09-07"',
    "      - name: a-frontmatter-change",
    "        source: ai",
    '        ref: "2026-09-07"',
    "      - name: migrated-whole",
    "        source: ai",
    '        ref: "2026-09-07"',
    "      - name: a-different-draft",
    "        source: ai",
    '        ref: "2026-09-07"',
    "    recommends: recommended-whole",
    "    boldness: low",
    "  - name: authority",
    "    options:",
    "      - name: ratified",
    "      - name: delegated",
    "      - name: deferred",
    "    recommends: deferred",
    "    boldness: low",
    "review:",
    "  verdict: forward",
    "  strength: weak",
    '  date: "2026-09-07"',
    "  of: bbcda4b8c34fbcad8efcb72f071571ea038b415c",
    "depends:",
    "  - clean-context-review.test/main/ruling-a",
    "---",
    "",
    "## Facts",
    "",
    "### answer",
    "",
    "The five options differ only in what each would make of the node.",
    "",
    whole("recommended-whole", "What the node says under the recommendation.", RECOMMENDED_CONTENT),
    whole("near-copy-whole", "The recommendation with its second paragraph rewritten.", NEAR_COPY_CONTENT),
    whole("same-as-recommended", "The recommendation again, word for word.", RECOMMENDED_CONTENT),
    [
      "#### a-named-change",
      "",
      "The recommendation with its first line replaced, written as a change.",
      "",
      "**Content.**",
      "",
      "From: recommended-whole",
      "",
      "```diff",
      NAMED_CHANGE_DIFF.replace(/\n$/, ""),
      "```",
      "",
    ].join("\n"),
    whole("a-long-near-copy", "The recommendation with fifty of its lines rewritten.", LONG_NEAR_COPY_CONTENT),
    whole("a-frontmatter-change", "The recommendation with a different form declared.", FRONTMATTER_CHANGE_CONTENT),
    whole("migrated-whole", MIGRATED_SENTENCE, MIGRATED_WHOLE_CONTENT),
    whole("a-different-draft", "A different draft, shorter than the difference from the answer.", DIFFERENT_DRAFT_CONTENT),
    [
      "## Account",
      "",
      "### Clean-context review, 2026-09-07",
      "",
      "Read in clean context. Verdict: forward to the author's ruling.",
      "",
    ].join("\n"),
  ].join("\n");
}

async function fixtureWithContentNode(prefix) {
  const rootDir = await freshFrontierFixture(prefix);
  await writeFile(path.join(rootDir, "main", "content-node.md"), contentEncodedNode());
  return rootDir;
}

describe("renderJudgedNode: the content of every option, and the answer never twice", () => {
  test("the answer is carried once; a near copy and a named change are differences, an equal option one line, a different draft whole", async () => {
    const rootDir = await fixtureWithContentNode("judged-content-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === CONTENT_NODE);
    assert.ok(node, "the content-encoded node reads");
    assert.equal(node.encoding, "content");

    const block = renderJudgedNode(node, graph.words, new Map(graph.nodes.map((n) => [n.id, n])));

    // carried once: the answer's own sentence is in the block exactly once,
    // and no option repeats it in a fenced block of its own.
    const answerSentence = "The recommended answer, which is the one that binds.";
    const asItsOwnLine = block.split("\n").filter((line) => line === answerSentence);
    assert.equal(asItsOwnLine.length, 1,
      "the text that binds stands once in the whole block, under the answer and nowhere else");
    // the one other occurrence is inside the named change's hunks, where the
    // record itself writes the line it removes, prefixed: a change is quoted
    // as the record writes it and is not the node carried again.
    assert.equal(block.split(answerSentence).length - 1, 2);
    assert.match(block, new RegExp(`^-${answerSentence.replace(/[.]/g, "\\.")}$`, "m"));
    assert.match(block, /#### The one answer that binds \(the resolved content of `recommended-whole`\)/);
    assert.match(block, /##### `recommended-whole`\n\nContent: the node as rendered above/);

    // the near copy: a difference, not the node again -- rendered section by
    // section now, so the unchanged frontmatter is named and only the
    // `## Answer` section carries a diff.
    const nearCopy = block.slice(block.indexOf("##### `near-copy-whole`"), block.indexOf("##### `same-as-recommended`"));
    assert.match(nearCopy, /unchanged: frontmatter/);
    assert.match(nearCopy, /Answer:/);
    assert.match(nearCopy, /```diff/);
    assert.match(nearCopy, /^\+A second paragraph, rewritten by the near copy and otherwise the same node\.$/m);
    assert.ok(!nearCopy.includes("```markdown"), "a near copy is never carried as a second copy of the node");

    // the option whose content resolves to the answer's own text
    const same = block.slice(block.indexOf("##### `same-as-recommended`"), block.indexOf("##### `a-named-change`"));
    assert.match(same, /Content: identical to the answer above\./);
    assert.ok(!same.includes("```"), "an identical option carries no block at all");

    // the named change, as the record writes it
    const named = block.slice(block.indexOf("##### `a-named-change`"), block.indexOf("##### `a-long-near-copy`"));
    assert.match(named, /Content: a named change against `recommended-whole`, as the record writes it\./);
    assert.ok(named.includes(NAMED_CHANGE_DIFF.replace(/\n$/, "")), "the record's own hunks, verbatim");

    // the long near copy: its `## Answer` section still carries a difference
    // past the cap, cut there with what was cut and where to read the rest
    const longCopy = block.slice(block.indexOf("##### `a-long-near-copy`"), block.indexOf("##### `a-frontmatter-change`"));
    assert.match(longCopy, /Answer:/);
    assert.match(longCopy, /^… \d+ more line\(s\) of this diff; open \S+content-node\.md for the option whole\.$/m);
    assert.ok(longCopy.split("\n").filter((l) => /^[-+@]/.test(l)).length < 120, "the cut diff is a fraction of the four hundred lines");

    // a frontmatter change: never rendered whole, only diffed, with the
    // byte-identical `## Answer` named as unchanged rather than repeated
    const frontmatterChange = block.slice(block.indexOf("##### `a-frontmatter-change`"), block.indexOf("##### `migrated-whole`"));
    assert.match(frontmatterChange, /Frontmatter differs:/);
    assert.match(frontmatterChange, /```diff/);
    assert.ok(!frontmatterChange.includes("```markdown"), "an option's frontmatter is never rendered whole");
    assert.match(frontmatterChange, /unchanged: answer/);

    // the migration's own copy: the answer holds only this option's
    // sentence, and every other section matches -- one line, no fence, and
    // the option's frontmatter appears nowhere in its own block
    const migrated = block.slice(block.indexOf("##### `migrated-whole`"), block.indexOf("##### `a-different-draft`"));
    assert.match(
      migrated,
      /Content: the node as it stands with this option's sentence in the answer's place \(the migration wrote no text of its own for it\)\.$/m,
    );
    assert.ok(!migrated.includes("```"), "the migration's own copy renders no fence at all");
    assert.ok(!migrated.includes("question: What does a content-encoded node carry?"), "its frontmatter appears nowhere in its block");

    // the different draft: its content is shorter than the difference would
    // be, so the content is what the reader is shown -- the measured rule,
    // since on this record a rival is usually a draft and not a copy. Its
    // frontmatter matches the judged node's and is named unchanged rather
    // than repeated; only the `## Answer` section is shown, in a fence.
    const different = block.slice(block.indexOf("##### `a-different-draft`"));
    assert.match(different, /unchanged: frontmatter/);
    assert.match(different, /Answer:/);
    assert.match(different, /```markdown/);
    assert.ok(different.includes("Nothing of the sort."), "the different draft is carried whole");
    assert.ok(!different.includes("question: What does a content-encoded node carry?"), "its frontmatter is not repeated");

    // struck, as the answer says: no rationale, no facts prose, no
    // accumulated support or divergence
    assert.ok(!block.includes("**AI support.**"), "the AI's accumulated support is not carried");
    assert.ok(!block.includes("**AI divergence.**"), "nor its divergence");
    assert.ok(!block.includes("The five options differ only in"), "nor the fact's own prose");

    // and the fact line the reader rules on: what is recommended, with what
    // boldness, out of which options, on both facts
    assert.match(block, /^- Facts: answer: recommends recommended-whole \(low\) of /m);
    assert.match(block, /authority: recommends deferred \(low\)/);
  });
});

describe("the candidate pairs, grouped by the judged node each is compared against", () => {
  test("shortId drops the module, and the graph where it is the disposition graph", () => {
    assert.equal(shortId("commons.systems/disposition-graph/authority"), "authority");
    assert.equal(shortId("commons.systems/public/why-this-exists"), "public/why-this-exists");
    assert.equal(shortId("clean-context-review.test/main/review-a"), "main/review-a");
    assert.equal(shortId("not-an-id"), "not-an-id");
  });

  test("shortKey names the term and not its definer, and keeps the resemblance's score", () => {
    assert.equal(shortKey("term:judged set (defines: commons.systems/disposition-graph/survey-selection)"), "term: judged set");
    assert.equal(shortKey("words:words/2026-09-07/9"), "words words/2026-09-07/9");
    assert.equal(shortKey("parent:commons.systems/disposition-graph/review-cost"), "parent");
    assert.equal(shortKey("jaccard:0.61"), "resemblance 0.61");
    assert.equal(shortKey("cites"), "cites");
    assert.equal(shortKey("depends"), "depends");
  });

  test("groupedPairLines gives each pair one host, names a judged-judged pair once, and counts the rest", () => {
    const judged = [{ id: "m/g/a" }, { id: "m/g/b" }];
    const live = [
      { a: "m/g/a", b: "m/g/b", keys: ["depends", "parent:m/g/p"] },
      { a: "m/g/a", b: "m/g/z", keys: ["term:probe (defines: m/g/z)"] },
      { a: "m/g/y", b: "m/g/z", keys: ["cites"] },
    ];
    const { text, listed, unjudged } = groupedPairLines(live, judged, new Set(["m/g/a\tm/g/z"]));
    assert.equal(listed, 2);
    assert.equal(unjudged, 1, "a pair neither of whose members is judged is counted, not listed");
    assert.ok(!text.includes("m/g/y"), "and never listed line by line");
    assert.match(text, /^### g\/a \(2 pair\(s\)\)$/m);
    assert.match(text, /^- g\/b — depends; parent$/m);
    assert.match(text, /^- g\/z — term: probe \(drift probe\)$/m);
    assert.match(text, /^### g\/b \(0 pair\(s\)\)$/m);
    assert.match(text, /^- and the pairs listed above under g\/a$/m);
    assert.equal(text.split("- g/b — depends; parent").length - 1, 1, "the judged-judged pair is listed once");
  });

  test("probePairLine names both sides, since a frozen pair has no judged member to sit under", () => {
    assert.equal(
      probePairLine({ a: "commons.systems/disposition-graph/x", b: "commons.systems/public/y", keys: ["cites", "cites"] }),
      "- x + public/y — cites",
    );
  });

  test("the brief groups the live pairs under the judged nodes, in the ruling order, with no module prefix", async () => {
    const rootDir = await fixtureWithContentNode("pairs-grouped-");
    const reviewDir = path.join(rootDir, "out");
    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-07" });
    const brief = await readFile(result.briefPath, "utf8");
    const pairs = brief.slice(brief.indexOf("\n## Where to look first"), brief.indexOf("\n## How you record what you find"));

    const headings = [...pairs.matchAll(/^### (main\/\S+) \(\d+ pair\(s\)\)$/gm)].map((m) => m[1]);
    const judgedIndex = [...brief.matchAll(/^- (\S+) \| stage \S+ \| rank /gm)].map((m) => m[1]);
    assert.deepEqual(headings, judgedIndex.map(shortId), "one group per judged node, in the ruling order");

    assert.ok(!pairs.includes("clean-context-review.test/"), "no line repeats the module on both sides");
    assert.match(pairs, /^- main\/\S+ — .*depends/m, "a pair carries the key that nominated it");

    // content-node depends on ruling-a: both are judged, so the pair is
    // listed under whichever comes first in the ruling order and named in
    // the other's group.
    const listed = (pairs.match(/^- main\/(content-node|ruling-a) — depends$/gm) ?? []);
    assert.equal(listed.length, 1, "a judged-judged pair is listed once");
    assert.match(pairs, /^- and the pairs listed above under main\/(content-node|ruling-a)$/m);

    // the paragraph that says what the list is for stays
    assert.match(pairs, /A key narrows attention and never the corpus/);
  });
});
