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
  renderNeighbourNode,
} from "./brief.mjs";
import { readGraph } from "@commons.systems/disposition/read.mjs";

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
    assert.deepEqual(parseArgs(["--node", "x"]), { node: "x", survey: false, rootDir: null, date: null, dry: false, fresh: false });
    assert.deepEqual(parseArgs(["--survey", "root", "--date", "2026-09-04", "--dry"]),
      { node: null, survey: true, rootDir: "root", date: "2026-09-04", dry: true, fresh: false });
    assert.throws(() => parseArgs([]), /no reading named/);
    assert.throws(() => parseArgs(["--node", "x", "--survey"]), /one invocation runs one of them/);
    assert.throws(() => parseArgs(["--survey", "--frontier"]), /unknown flag --frontier/);
    assert.throws(() => parseArgs(["--node"]), /--node needs a node id/);
  });

  test("--fresh forces the draft brief, and refuses beside --survey", () => {
    assert.deepEqual(parseArgs(["--node", "x", "--fresh"]),
      { node: "x", survey: false, rootDir: null, date: null, dry: false, fresh: true });
    assert.throws(() => parseArgs(["--survey", "--fresh"]), /--fresh forces the draft brief on a re-reading/);
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

    // The node itself goes in whole, its '## Account' included: a draft's
    // dialogue is its own history. Everything else goes in without one.
    const nodeSection = brief.slice(brief.indexOf("\n## The node under review"), brief.indexOf("\n## Its ancestry"));
    assert.ok(nodeSection.includes(`### ${REVIEW_LOW}`));
    assert.ok(nodeSection.includes("#### Account (the AI's account, with the subsections of earlier readings)"));

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
    assert.deepEqual(parts.children.map((n) => n.id), [CHILD_AND_READING_OF_REVIEW_LOW, CHILD_OF_REVIEW_LOW],
      "every node whose 'under' names this node, sorted");
    assert.deepEqual(parts.siblings.map((n) => n.id), [SIBLING], "the node under the same parent");
    // 'readings' is taken before 'cited' (review-cost: a node whose 'bears'
    // names this one is otherwise always claimed first by 'cited', since
    // every option's own rendering quotes the readings that bear on it), so
    // reading-of-review-low lands in 'readings' now.
    // child-and-reading-of-review-low bears on the same option too, but it
    // is already taken by 'children'.
    assert.deepEqual(parts.readings.map((n) => n.id), [READING_OF_REVIEW_LOW],
      "the reading bearing on this node, taken before 'cited' gets a chance to claim it");
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
    assert.equal(result.childrenCount, 2);
    assert.equal(result.siblingCount, 1);
    assert.equal(result.citedCount, 1);
    assert.equal(result.readingsCount, 1);
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
    assert.ok(children.includes(`### ${CHILD_OF_REVIEW_LOW}`) && children.includes(`### ${CHILD_AND_READING_OF_REVIEW_LOW}`));
    assert.ok(!index.includes(CHILD_OF_REVIEW_LOW), "a child is carried whole above, not repeated in the index");
    assert.ok(siblings.includes(`### ${SIBLING}`));
    assert.ok(cited.includes(`### ${RULING_A}`));
    assert.ok(cited.includes("Answered whole: one node, one question, one answer."), "a cited node's now-recommended answer is carried");
    assert.ok(!cited.includes(`### ${READING_OF_REVIEW_LOW}`), "the reading is no longer in 'cited': 'readings' claims it first");
    assert.ok(readings.includes(`### ${READING_OF_REVIEW_LOW}`), "the reading is carried in its own part now");
    assert.ok(round.includes(REVIEW_SETTLES) && round.includes("now recommends:"), "the round names the drafts that moved and what they now recommend");
    assert.ok(!round.includes(`### ${REVIEW_SETTLES}`), "the round is pointers, never a whole node");
    for (const id of [PERIAGOGIC_NODE, MAIEUTIC_NODE, SURVEY_PINNED]) {
      assert.ok(index.includes(`- ${id} | `), `${id} is in the index, as a one-line pointer`);
    }
    assert.ok(!index.includes("#### Other options on its answer"), "the index is one line a node, not the standing answer and its options");
  });

  test("a node claimed by an earlier part is never duplicated in a later one: a node both under this node and a reading of it lands only in 'children'", async () => {
    const rootDir = await freshFrontierFixture("draft-dedup-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const parts = draftNeighbourhood(graph, node);

    assert.ok(parts.children.some((n) => n.id === CHILD_AND_READING_OF_REVIEW_LOW),
      "it is under review-low, so 'children' claims it first");
    assert.ok(!parts.cited.some((n) => n.id === CHILD_AND_READING_OF_REVIEW_LOW),
      "not repeated in 'cited', though its 'Readings bearing on it' line names it too");
    assert.ok(!parts.readings.some((n) => n.id === CHILD_AND_READING_OF_REVIEW_LOW),
      "not repeated in 'readings' either, though it carries a 'bears' entry naming this node");
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
    assert.equal(headingOccurrences, 1, "the node is carried whole exactly once in the whole brief: once, in 'children'");
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
    assert.match(dry, /draft: clean-context-review\.test\/main\/review-low; ancestry 2, rules 0, children 2, siblings 1, cited 1, readings 1, round 3, index \d+; \d+ bytes over \d+ lines/);
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
  test("the judged set is surveyJudges in the ruling order; every other node is context; no account anywhere", async () => {
    const rootDir = await freshFrontierFixture("survey-ok-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));

    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-04" });
    assert.equal(result.briefPath, path.join(reviewDir, "survey.brief.md"));
    assert.equal(result.outFile, "tmp/review/survey.json");
    assert.equal(result.batchCount, 6, "the six nodes at review or ruling owed a survey");
    assert.equal(result.contextCount, graph.nodes.length - 6);

    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(!brief.includes("{{"), "every placeholder filled");
    assert.ok(!brief.includes("#### Account"), "no '## Account' section goes into the survey's brief");

    const batchSection = brief.slice(brief.indexOf("\n## The judged set"), brief.indexOf("\n## The full graph, as context"));
    const contextSection = brief.slice(brief.indexOf("\n## The full graph, as context"), brief.indexOf("\n## Output"));

    for (const id of [REVIEW_A, REVIEW_B, REVIEW_GLOBAL, REVIEW_LOW, REVIEW_SETTLES, RULING_A]) {
      assert.ok(batchSection.includes(`### ${id}`), `${id} is judged`);
      assert.ok(!contextSection.includes(`### ${id}`), `${id} is not repeated as context`);
    }
    // survey-pinned stands at the review stage but carries a survey pin on
    // the recommendation it now stands on: nothing has moved, so the survey
    // does not judge it again.
    for (const id of [ANSWERED, MAIEUTIC_NODE, PERIAGOGIC_NODE, SIBLING, SURVEY_PINNED]) {
      assert.ok(contextSection.includes(`### ${id}`), `${id} is context`);
      assert.ok(!batchSection.includes(`### ${id}`), `${id} is not judged`);
    }

    // the ruling order: settles descending, then rank descending, then id
    const judged = [REVIEW_A, REVIEW_B, REVIEW_GLOBAL, REVIEW_LOW, REVIEW_SETTLES, RULING_A].map((id) => byId.get(id));
    const want = [...judged].sort((a, b) => (b.settles - a.settles) || (b.rank - a.rank) || (a.id < b.id ? -1 : 1)).map((n) => n.id);
    const gotIndex = [...brief.matchAll(/^- (\S+) \| stage \S+ \| rank /gm)].map((m) => m[1]);
    assert.deepEqual(gotIndex, want);
    assert.equal(gotIndex[0], REVIEW_SETTLES, "the node whose ruling settles another is ruled on first");
    const gotHeadings = [...batchSection.matchAll(/^### (\S+)$/gm)].map((m) => m[1]);
    assert.deepEqual(gotHeadings, want, "the judged set is presented in the ruling order too");

    // the context index is the frontier's own order
    const contextIndexStart = brief.indexOf("\n## The full graph, as context");
    const contextIndex = brief.slice(contextIndexStart, brief.indexOf("\n### ", contextIndexStart));
    const gotContext = [...contextIndex.matchAll(/^- (\S+) \| /gm)].map((m) => m[1]);
    const judgedIds = new Set(want);
    assert.deepEqual(gotContext, frontierOrderIds(graph).filter((id) => !judgedIds.has(id)));
  });

  test("writes the pins sidecar: the graph commit, the ids judged, and a pin for every node of the graph", async () => {
    const rootDir = await freshFrontierFixture("survey-pins-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);

    const result = await writeSurveyBrief({ rootDir, reviewDir, date: "2026-09-04" });
    assert.equal(result.pinsPath, path.join(reviewDir, "survey.pins.json"));
    const pins = JSON.parse(await readFile(result.pinsPath, "utf8"));

    assert.deepEqual(Object.keys(pins).sort(), ["commit", "date", "dirty", "judged", "pins"]);
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
    assert.match(dry, /survey: 6 node\(s\) judged; context: 8 node\(s\); \d+ bytes over \d+ lines; graph commit \(unknown/);
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

describe("chooseMode: the re-reading's own mode, derived from the record and never told by a flag", () => {
  test("no review at all: draft, and says so as the first reading", async () => {
    const rootDir = await freshFrontierFixture("mode-first-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    const mode = chooseMode(node, { rootDir, fresh: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, false);
    assert.match(mode.reason, /first reading/);
  });

  test("--fresh forces the draft brief even where the recommendation has moved and a re-reading could otherwise run", async () => {
    const { rootDir } = await stageReReading("mode-fresh-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.reviewStale, true, "fixture precondition: the recommendation has moved");
    const mode = chooseMode(node, { rootDir, fresh: true });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, false);
    assert.match(mode.reason, /--fresh/);
  });

  test("a kickback owes a fresh reading and the record says so, with no flag from the session", async () => {
    // `review-cost`: a kickback is a new answer, which owes a reading of its
    // own and not a re-reading of the answer it replaced. `apply.mjs` writes
    // the reader's verdict into the node's `review` block on a kickback just
    // as it does on a forward, so the choice is derivable and the session
    // names nothing -- which is what the review skill claims of it.
    const { rootDir } = await stageReReading("mode-kickback-");
    const file = path.join(rootDir, "main", "review-low.md");
    const staged = (await readFile(file, "utf8")).replace("  verdict: forward\n", "  verdict: kickback\n");
    await writeFile(file, staged);

    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.reviewStale, true, "fixture precondition: the answer moved after the reading");
    assert.equal(node.review.verdict, "kickback", "fixture precondition: the reading kicked it back");

    const mode = chooseMode(node, { rootDir, fresh: false });
    assert.equal(mode.mode, "draft", "the redrawn answer gets a fresh reading");
    assert.equal(mode.fallback, false, "and it is the owed reading, not a fallback");
    assert.match(mode.reason, /kicked this answer back/);

    // The same node with a forward verdict is the re-reading's case, so the
    // branch turns on the verdict and not on some other property of the
    // fixture.
    const forwarded = { ...node, review: { ...node.review, verdict: "forward" } };
    assert.equal(chooseMode(forwarded, { rootDir, fresh: false }).mode, "delta");
  });

  test("the recommendation has not moved since the review's pin: draft, nothing to re-read", async () => {
    const rootDir = await freshFrontierFixture("mode-unmoved-");
    const before = await readGraph(rootDir);
    const currentHash = before.nodes.find((n) => n.id === REVIEW_LOW).recommendationHash;
    assert.ok(currentHash, "fixture precondition: the node has a recommendation hash");

    const file = path.join(rootDir, "main", "review-low.md");
    const text = await readFile(file, "utf8");
    const staged = text.replace(
      "stage: review\n",
      `stage: review\nreview:\n  verdict: forward\n  strength: moderate\n  date: "2026-09-04"\n  of: "${currentHash}"\n`,
    );
    assert.notEqual(staged, text, "fixture precondition matched");
    await writeFile(file, staged);

    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.reviewStale, false, "fixture precondition: the pin still matches");
    const mode = chooseMode(node, { rootDir, fresh: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, false);
    assert.match(mode.reason, /not moved/);
  });

  test("stale, but the review names no commit: draft, with fallback", async () => {
    const { rootDir } = await stageReReading("mode-nocommit-", { commitValue: null });
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.reviewStale, true, "fixture precondition");
    const mode = chooseMode(node, { rootDir, fresh: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, true);
    assert.match(mode.reason, /names no commit/);
  });

  test("stale, commit given but unresolvable (no git checkout at all): draft, with fallback", async () => {
    const { rootDir } = await stageReReading("mode-unresolvable-", { git: false, commitValue: STALE_PIN });
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.reviewStale, true, "fixture precondition");
    const mode = chooseMode(node, { rootDir, fresh: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, true);
    assert.match(mode.reason, /could not resolve/);
  });

  test("stale, commit resolvable, but no prior '### Clean-context review,' subsection: draft, with fallback", async () => {
    const { rootDir } = await stageReReading("mode-noprevious-", { previousReading: false });
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.reviewStale, true, "fixture precondition");
    const mode = chooseMode(node, { rootDir, fresh: false });
    assert.equal(mode.mode, "draft");
    assert.equal(mode.fallback, true);
    assert.match(mode.reason, /no prior reading/);
  });

  test("stale, commit resolvable, a previous reading on record: delta, carrying the commit, the diff, and the previous reading", async () => {
    const { rootDir, commit } = await stageReReading("mode-delta-");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);
    assert.equal(node.reviewStale, true, "fixture precondition");
    const mode = chooseMode(node, { rootDir, fresh: false });
    assert.equal(mode.mode, "delta");
    assert.equal(mode.fallback, false);
    assert.equal(mode.commit, commit);
    assert.ok(mode.diff.includes("amended to also name"), "the diff shows the amendment");
    assert.ok(mode.previous.startsWith("### Clean-context review, 2026-09-04"));
    assert.ok(mode.previous.includes(PREVIOUS_FINDING_TEXT));
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

  test("extracts the last matching subsection verbatim, and never a re-reading's", () => {
    const account = [
      "### Clean-context review, 2026-08-01",
      "",
      "First reading, superseded.",
      "",
      "### Clean-context review, 2026-09-04",
      "",
      "Second reading, the one to re-read against.",
      "",
      "### Clean-context re-reading, 2026-09-05",
      "",
      "A re-reading's own subsection: never matched as 'the previous reading'.",
      "",
    ].join("\n");
    const found = lastCleanContextReviewSection(account);
    assert.ok(found.startsWith("### Clean-context review, 2026-09-04"));
    assert.ok(found.includes("Second reading, the one to re-read against."));
    assert.ok(!found.includes("First reading, superseded."));
    assert.ok(!found.includes("re-reading"), "stops before the re-reading subsection that follows it");
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
});

describe("CLI: --node derives its mode from the record, prints it, and --fresh forces the draft brief", () => {
  test("a stale node with a resolvable commit and a previous reading takes the re-reading; --fresh on the same node forces the draft", async () => {
    const { rootDir } = await stageReReading("cli-delta-");
    const cwd = path.dirname(rootDir);

    const delta = runCli(["--node", REVIEW_LOW, rootDir, "--date", "2026-09-05", "--dry"], cwd);
    assert.match(delta, /^mode: delta \(/m);
    assert.match(delta, /delta: clean-context-review\.test\/main\/review-low; \d+ bytes over \d+ lines/);
    assert.match(delta, /the reviewer's output file: tmp\/review\/delta-review-low\.json/);

    const fresh = runCli(["--node", REVIEW_LOW, rootDir, "--date", "2026-09-05", "--dry", "--fresh"], cwd);
    assert.match(fresh, /^mode: draft \(--fresh/m);
    assert.match(fresh, /draft: clean-context-review\.test\/main\/review-low;/);
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
