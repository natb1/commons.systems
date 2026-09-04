// node --test .claude/skills/align-review/brief.test.mjs
//
// Exercises brief.mjs -- the two readings the review divides into, the review
// of one draft (`--node <id>`) and the survey of the frontier (`--survey`) --
// against a copy of fixtures/frontier/ beside this file, never against the
// live disposition/ graph.

import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  writeDraftBrief, writeSurveyBrief, frontierOrderIds, reviewerModel,
  reviewLine, graphCommit, parseArgs, draftNeighbourhood,
} from "./brief.mjs";
import { readGraph } from "../../../packages/disposition/read.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const FRONTIER_FIXTURE_SRC = path.join(HERE, "fixtures/frontier");
const BRIEF_MJS = path.join(HERE, "brief.mjs");

const tmpDirs = [];
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

async function freshFrontierFixture(prefix) {
  const dir = await mkdtemp(path.join(os.tmpdir(), `align-review-${prefix}`));
  tmpDirs.push(dir);
  await cp(FRONTIER_FIXTURE_SRC, dir, { recursive: true });
  return dir;
}

const MAIEUTIC_NODE = "align-review.test/main/maieutic-node";
const PERIAGOGIC_NODE = "align-review.test/main/periagogic-node";
const REVIEW_A = "align-review.test/main/review-a";
const REVIEW_B = "align-review.test/main/review-b";
const REVIEW_GLOBAL = "align-review.test/main/review-global";
const REVIEW_LOW = "align-review.test/main/review-low";
const REVIEW_SETTLES = "align-review.test/main/review-settles";
const RULING_A = "align-review.test/main/ruling-a";
const ANSWERED = "align-review.test/main/answered-ratified";
const SIBLING = "align-review.test/main/sibling-node";
const SURVEY_PINNED = "align-review.test/main/survey-pinned";

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
    assert.deepEqual(parseArgs(["--node", "x"]), { node: "x", survey: false, rootDir: null, date: null, dry: false });
    assert.deepEqual(parseArgs(["--survey", "root", "--date", "2026-09-04", "--dry"]),
      { node: null, survey: true, rootDir: "root", date: "2026-09-04", dry: true });
    assert.throws(() => parseArgs([]), /no reading named/);
    assert.throws(() => parseArgs(["--node", "x", "--survey"]), /one invocation runs one of them/);
    assert.throws(() => parseArgs(["--survey", "--frontier"]), /unknown flag --frontier/);
    assert.throws(() => parseArgs(["--node"]), /--node needs a node id/);
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

    const missing = runCliExpectingFailure(["--node", "align-review.test/main/nope", rootDir, "--dry"], cwd);
    assert.equal(missing.status, 2);
    assert.match(missing.stderr, /no node 'align-review\.test\/main\/nope'/);

    const wrongStage = runCliExpectingFailure(["--node", MAIEUTIC_NODE, rootDir, "--dry"], cwd);
    assert.equal(wrongStage.status, 2);
    assert.match(wrongStage.stderr, /is at stage maieutic, and the review of a draft runs on a node at stage review/);
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
    assert.ok(brief.startsWith("# Clean-context review of a draft, 2026-09-04: `align-review.test/main/review-low`"));
    assert.ok(brief.includes("tmp/review/draft-review-low.json"), "the literal {{out}} path, regardless of the scratch reviewDir");

    // The node itself goes in whole, its '## Account' included: a draft's
    // dialogue is its own history. Everything else goes in without one.
    const nodeSection = brief.slice(brief.indexOf("\n## The node under review"), brief.indexOf("\n## Its ancestry"));
    assert.ok(nodeSection.includes(`### ${REVIEW_LOW}`));
    assert.ok(nodeSection.includes("#### Account (the AI's account, with the subsections of earlier readings)"));

    const restOfBrief = brief.slice(brief.indexOf("\n## Its ancestry"));
    assert.ok(!restOfBrief.includes("#### Account"), "the neighbourhood carries no account");

    // {{nav}}: filled last, from the filled text itself.
    const lines = brief.split("\n");
    const navLine = lines.find((l) => l.startsWith("This brief is "));
    assert.ok(navLine, "the nav sentence is written");
    assert.match(navLine, new RegExp(`^This brief is ${lines.length} lines\\.`));
    const named = navLine.match(/"## The node under review" at line (\d+)/);
    assert.ok(named, `nav sentence does not name the node's line: ${navLine}`);
    assert.ok(lines[Number(named[1]) - 1].startsWith("## The node under review"), "the line the nav names is the node's heading");
  });

  test("the four parts: ancestry with the global-tier rules, siblings, the nodes it names, and the index of the rest", async () => {
    const rootDir = await freshFrontierFixture("draft-parts-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const node = graph.nodes.find((n) => n.id === REVIEW_LOW);

    const parts = draftNeighbourhood(graph, node);
    assert.deepEqual(parts.ancestry.map((n) => n.id), [ANSWERED, REVIEW_GLOBAL],
      "the under chain, then every global-tier node not already in it");
    assert.deepEqual(parts.siblings.map((n) => n.id), [SIBLING], "the node under the same parent");
    assert.deepEqual(parts.cited.map((n) => n.id), [RULING_A], "the node its own text names");
    assert.ok(!parts.index.some((n) => [REVIEW_LOW, ANSWERED, REVIEW_GLOBAL, SIBLING, RULING_A].includes(n.id)),
      "the index is every node no earlier part carries");
    assert.equal(parts.index.length + 5, graph.nodes.length);

    const result = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_LOW, date: "2026-09-04" });
    assert.equal(result.ancestryCount, 2);
    assert.equal(result.siblingCount, 1);
    assert.equal(result.citedCount, 1);
    assert.equal(result.indexCount, graph.nodes.length - 5);

    const brief = await readFile(result.briefPath, "utf8");
    const section = (from, to) => brief.slice(brief.indexOf(`\n## ${from}`), brief.indexOf(`\n## ${to}`));
    const ancestry = section("Its ancestry", "Its siblings");
    const siblings = section("Its siblings", "The nodes it names");
    const cited = section("The nodes it names", "The index of every other question");
    const index = section("The index of every other question", "Output");

    assert.ok(ancestry.includes(`### ${ANSWERED}`) && ancestry.includes(`### ${REVIEW_GLOBAL}`));
    assert.ok(siblings.includes(`### ${SIBLING}`));
    assert.ok(cited.includes(`### ${RULING_A}`));
    assert.ok(cited.includes("Answered whole: one node, one question, one answer."), "a cited node's fence is carried");
    for (const id of [REVIEW_A, REVIEW_B, PERIAGOGIC_NODE, MAIEUTIC_NODE, SURVEY_PINNED, REVIEW_SETTLES]) {
      assert.ok(index.includes(`### ${id}`), `${id} is in the index of every other question`);
    }
    assert.ok(index.includes("#### Other options on its answer"), "the index carries the other options on an answer fact");
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

  test("the reviewer's model is read from the node: opus on a low-boldness, non-global leaf, fable on each of the three conditions", async () => {
    const rootDir = await freshFrontierFixture("draft-model-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));

    // the one shape that takes the smaller model
    assert.equal(byId.get(REVIEW_LOW).answerFact.boldness, "low");
    assert.equal(byId.get(REVIEW_LOW).tier, null);
    assert.equal(byId.get(REVIEW_LOW).settles, 0);
    assert.equal(reviewerModel(byId.get(REVIEW_LOW)), "opus");

    // boldness not low
    assert.equal(byId.get(REVIEW_A).answerFact.boldness, "moderate");
    assert.equal(reviewerModel(byId.get(REVIEW_A)), "fable");
    assert.equal(byId.get(REVIEW_B).answerFact.boldness, "high");
    assert.equal(reviewerModel(byId.get(REVIEW_B)), "fable");

    // global tier, at low boldness
    assert.equal(byId.get(REVIEW_GLOBAL).answerFact.boldness, "low");
    assert.equal(byId.get(REVIEW_GLOBAL).tier, "global");
    assert.equal(reviewerModel(byId.get(REVIEW_GLOBAL)), "fable");

    // a ruling on it would settle other nodes, at low boldness and no tier
    assert.equal(byId.get(REVIEW_SETTLES).answerFact.boldness, "low");
    assert.equal(byId.get(REVIEW_SETTLES).tier, null);
    assert.ok(byId.get(REVIEW_SETTLES).settles > 0);
    assert.equal(reviewerModel(byId.get(REVIEW_SETTLES)), "fable");

    for (const [id, model] of [[REVIEW_LOW, "opus"], [REVIEW_A, "fable"], [REVIEW_GLOBAL, "fable"], [REVIEW_SETTLES, "fable"]]) {
      const r = await writeDraftBrief({ rootDir, reviewDir, id, date: "2026-09-04" });
      assert.equal(r.model, model, `${id} takes ${model}`);
    }
  });

  test("CLI: --node prints the model on stdout, in --dry too, and --dry writes nothing", async () => {
    const rootDir = await freshFrontierFixture("draft-cli-");
    const cwd = path.dirname(rootDir);

    const dry = runCli(["--node", REVIEW_LOW, rootDir, "--date", "2026-09-04", "--dry"], cwd);
    assert.match(dry, /^reviewer model: opus\n/);
    assert.match(dry, /\(dry run: nothing written\)/);
    assert.match(dry, /draft: align-review\.test\/main\/review-low; ancestry 2, siblings 1, cited 1, index \d+; \d+ lines/);
    assert.match(dry, /the reviewer's output file: tmp\/review\/draft-review-low\.json/);
    await assert.rejects(readFile(path.join(cwd, "tmp/review/draft-review-low.brief.md")), { code: "ENOENT" });

    const bold = runCli(["--node", REVIEW_A, rootDir, "--date", "2026-09-04", "--dry"], cwd);
    assert.match(bold, /^reviewer model: fable\n/);
  });

  test("--dry (dry: true) writes no brief at all", async () => {
    const rootDir = await freshFrontierFixture("draft-dry-");
    const reviewDir = path.join(rootDir, "_review");
    const result = await writeDraftBrief({ rootDir, reviewDir, id: REVIEW_A, date: "2026-09-04", dry: true });
    assert.equal(result.model, "fable");
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
    assert.equal(result.model, "opus");
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

  test("CLI: --survey prints the model, the counts, the commit and the sidecar; --dry writes nothing", async () => {
    const rootDir = await freshFrontierFixture("survey-cli-");
    const cwd = path.dirname(rootDir);
    const dry = runCli(["--survey", rootDir, "--date", "2026-09-04", "--dry"], cwd);
    assert.match(dry, /^reviewer model: opus\n/);
    assert.match(dry, /survey: 6 node\(s\) judged; context: 5 node\(s\); \d+ lines; graph commit \(unknown/);
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
    assert.match(surveyOnly, /^draft review: none \(this draft has not been reviewed\); survey: surveyed 2026-08-02, of 99a302ea296a6324291a06687d671d3d32949504$/);

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
