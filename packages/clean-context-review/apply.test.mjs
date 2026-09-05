// node --test packages/clean-context-review/apply.test.mjs
//
// Exercises apply.mjs against copies of two fixture graphs -- never against
// the live disposition/ graph (both skills forbid it):
// packages/disposition/fixtures/valid-dialogue/ for the review of one draft,
// and fixtures/frontier/ beside this file for the survey of the frontier,
// which clean-context-review.md and frontier-consistency.md divide the
// reading into. The reading is read from the input's own `scope`; nothing is
// locked, and the survey is serialized by the pins sidecar brief.mjs wrote.

import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { applyReviews } from "./apply.mjs";
import { parseNode, readGraph, surveyJudges } from "@commons.systems/disposition/read.mjs";
import { deriveClass, deriveRecommendationHash } from "@commons.systems/disposition/derive.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const FIXTURE_SRC = path.join(REPO_ROOT, "packages/disposition/fixtures/valid-dialogue");
const FRONTIER_FIXTURE_SRC = path.join(HERE, "fixtures/frontier");
const APPLY_MJS = path.join(HERE, "apply.mjs");

const tmpDirs = [];
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function scratch(prefix) {
  const dir = await mkdtemp(path.join(os.tmpdir(), `clean-context-review-${prefix}`));
  tmpDirs.push(dir);
  return dir;
}

/** A fresh copy of the dialogue fixture graph: `dir` is a valid rootDir. */
async function freshFixture(prefix) {
  const dir = await scratch(prefix);
  await cp(FIXTURE_SRC, dir, { recursive: true });
  return dir;
}

/** The same, one level down, so the CLI's `<cwd>/disposition` resolution works. */
async function freshFixtureScratch(prefix) {
  const dir = await scratch(prefix);
  await cp(FIXTURE_SRC, path.join(dir, "disposition"), { recursive: true });
  return dir;
}

/**
 * The same as `freshFixture`, but a real git checkout: `apply.mjs`'s draft
 * path reads the graph commit off `rootDir` itself (`graphCommit`, shared
 * with the survey's own sidecar), so exercising `review.commit` needs a
 * real repository, not a bare directory copy.
 */
async function freshGitFixture(prefix) {
  const dir = await freshFixture(prefix);
  const git = (args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" });
  git(["init", "-q"]);
  git(["-c", "user.email=test@example.com", "-c", "user.name=test", "add", "-A"]);
  git(["-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "-q", "-m", "fixture"]);
  const sha = git(["rev-parse", "HEAD"]).trim();
  return { rootDir: dir, sha };
}

/** A fresh copy of the frontier fixture graph. */
async function freshFrontierFixture(prefix) {
  const dir = await scratch(prefix);
  await cp(FRONTIER_FIXTURE_SRC, dir, { recursive: true });
  return dir;
}

async function freshFrontierScratch(prefix) {
  const dir = await scratch(prefix);
  await cp(FRONTIER_FIXTURE_SRC, path.join(dir, "disposition"), { recursive: true });
  return dir;
}

const REVIEW_NODE = "example.test/main/review-node";
const RULING_NODE = "example.test/main/ruling-node";
const ANSWERED_WITH_STAGE = "example.test/main/answered-with-stage";
const DATE = "2026-09-03";

function reviewNodePath(rootDir) {
  return path.join(rootDir, "main/review-node.md");
}
function rulingNodePath(rootDir) {
  return path.join(rootDir, "main/ruling-node.md");
}
function answeredWithStagePath(rootDir) {
  return path.join(rootDir, "main/answered-with-stage.md");
}

function reviewBlockOf(text) {
  const m = text.match(/^review:\n((?:^[ \t].*\n?)*)/m);
  return m ? m[0] : null;
}
function factsBlockOf(text) {
  const m = text.match(/^facts:\n((?:^[ \t].*\n?)*)/m);
  return m ? m[0] : null;
}
function fieldValue(text, key) {
  const m = text.match(new RegExp(`^\\s*${key}:\\s*(.*)$`, "m"));
  return m ? m[1].trim() : null;
}

const DRAFT_OPENING = "Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting.";
const SURVEY_OPENING = "Read in clean context by a subagent given the whole graph and nothing of the sitting, judging this node's recommendation against every other node. The survey gives no verdict.";

// --------------------------------------------------------------- the modes

describe("apply.mjs: the reading is read from 'scope'", () => {
  test("a missing scope, an unknown scope, and a bare list are each refused; nothing is written", async () => {
    const rootDir = await freshFixture("scope-");
    const file = reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");

    for (const input of [
      { id: REVIEW_NODE, verdict: "forward", findings: [] },
      { scope: "batch", nodes: [] },
      [{ id: REVIEW_NODE, verdict: "forward" }],
    ]) {
      await assert.rejects(
        () => applyReviews({ rootDir, input, replies: {}, date: DATE }),
        /the input names no reading: 'scope' must be 'draft' .* or 'survey'/,
      );
    }
    assert.equal(await readFile(file, "utf8"), before);
  });
});

// ------------------------------------------------- the review of one draft

describe("apply.mjs: draft, forward", () => {
  test("appends the subsection to '## Account', sets stage ruling, writes the review block, keeps other lines byte for byte", async () => {
    const rootDir = await freshFixture("fwd-");
    const file = reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");

    const parsedBefore = parseNode(before, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file });
    const wantHash = parsedBefore.recommendationHash;

    const input = {
      scope: "draft",
      id: REVIEW_NODE,
      verdict: "forward",
      findings: ["Answer: needs a caveat about X."],
      counter_argument: "A boldness gate could miss low-boldness drafts that are wrong for other reasons: the \"gate\" is a proxy.",
      strength: "moderate",
      facts_check: "Delegated and high boldness both look right for this draft.",
      viability: "Both options are viable; none is missing.",
    };
    const result = await applyReviews({
      rootDir,
      input,
      replies: { [REVIEW_NODE]: "Accepted: the gate stays proposal-only for now." },
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/review-node: Clean-context review (forward), review → ruling"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.notEqual(afterText, before);

    assert.equal(fieldValue(afterText, "stage"), "ruling");
    assert.equal(factsBlockOf(afterText), factsBlockOf(before), "the facts are kept byte for byte: this script never touches what a node recommends");
    const block = reviewBlockOf(afterText);
    assert.ok(block, "review block present");
    assert.equal(fieldValue(block, "verdict"), "forward");
    assert.equal(fieldValue(block, "strength"), "moderate");
    assert.equal(fieldValue(block, "date"), DATE);
    assert.equal(fieldValue(block, "of"), wantHash, "'review.of' pins the node's recommendation hash");
    assert.equal(
      fieldValue(block, "against"),
      JSON.stringify("A boldness gate could miss low-boldness drafts that are wrong for other reasons: the \"gate\" is a proxy."),
      "'review.against' is written from the non-null counter_argument, beside strength, quoted so a colon or a quote in it stays YAML",
    );
    assert.ok(!block.includes("survey:"), "no survey pin is invented where the node carried none");

    // The review block goes after the facts, which is where the reader's own
    // key order puts it.
    assert.ok(afterText.indexOf("\nfacts:") < afterText.indexOf("\nreview:"));

    // Untouched lines: question and the Disposition paragraph survive verbatim.
    assert.ok(afterText.includes("question: Should boldness gate which drafts need a second reviewer?\n"));
    assert.ok(afterText.includes("The author asked whether a high-boldness draft needs a second pass before the\nruling."));

    // The heading carries the short pin of the recommendation the reading
    // read, so two readings of two answers on one day stay addressable.
    const pinned = /^  of: ([0-9a-f]{40})$/m.exec(afterText);
    assert.ok(pinned, "the review block pins the recommendation");
    const expectedSubsection = [
      `### Clean-context review, 2026-09-03, of ${pinned[1].slice(0, 8)}`,
      "",
      `${DRAFT_OPENING} Verdict: forward to the author's ruling.`,
      "",
      "Recommended at this reading: `standing`.",
      "",
      "Findings:",
      "",
      "- Answer: needs a caveat about X.",
      "",
      "On the facts and what they recommend: Delegated and high boldness both look right for this draft.",
      "",
      "On the viability of the options: Both options are viable; none is missing.",
      "",
      'Strongest counter-argument (moderate): A boldness gate could miss low-boldness drafts that are wrong for other reasons: the "gate" is a proxy.',
      "",
      "The session's reply: Accepted: the gate stays proposal-only for now.",
      "",
    ].join("\n");
    assert.ok(afterText.endsWith(expectedSubsection), `unexpected tail:\n${afterText.slice(-400)}`);
    assert.ok(afterText.includes("fence.\n\n### Clean-context review"), "the pre-existing Account text is kept, ahead of the new subsection");
  });

  test("preserves a survey pin the node already carries: the review block is merged, never replaced wholesale", async () => {
    const rootDir = await freshFrontierFixture("draft-keeps-survey-");
    const file = path.join(rootDir, "main/survey-pinned.md");
    const before = await readFile(file, "utf8");
    const parsedBefore = parseNode(before, { id: "clean-context-review.test/main/survey-pinned", graph: "main", slug: "survey-pinned", path: file });
    assert.equal(parsedBefore.review.verdict, null, "fixture precondition: the survey has pinned it and no draft review has run");
    assert.equal(parsedBefore.review.survey.date, "2026-08-02");

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: "clean-context-review.test/main/survey-pinned",
        verdict: "forward",
        findings: ["Answer: sound as drafted."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: "2026-09-04",
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.ok(result.report[0].includes("survey pin kept"), `report does not say the survey pin was kept: ${result.report.join(" | ")}`);

    const after = await readFile(file, "utf8");
    const parsed = parseNode(after, { id: "clean-context-review.test/main/survey-pinned", graph: "main", slug: "survey-pinned", path: file });
    assert.equal(parsed.stage, "ruling");
    assert.equal(parsed.review.verdict, "forward");
    assert.equal(parsed.review.date, "2026-09-04");
    assert.equal(parsed.review.of, parsed.recommendationHash);
    assert.deepEqual(parsed.review.survey, { date: "2026-08-02", of: parsedBefore.review.survey.of },
      "the survey's pin survives the draft review's write");
    assert.equal(parsed.readyToRule, true, "with both pins on the recommendation as it stands, the node is ready to rule");
  });
});

describe("apply.mjs: draft, review.commit", () => {
  test("a clean checkout's HEAD is written into the review block, beside 'of'", async () => {
    const { rootDir, sha } = await freshGitFixture("commit-clean-");
    const file = reviewNodePath(rootDir);

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["Answer: sound as drafted."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    });
    assert.equal(result.validation.ok, true, result.validation && result.validation.message);

    const afterText = await readFile(file, "utf8");
    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "commit"), sha, "'review.commit' is the checkout's HEAD, the commit this reading read");

    const parsed = parseNode(afterText, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file });
    assert.equal(parsed.review.commit, sha);
  });

  test("a dirty checkout writes no commit: it must not silently pin a tree the checkout no longer matches", async () => {
    const { rootDir } = await freshGitFixture("commit-dirty-");
    const file = reviewNodePath(rootDir);
    // Untracked change after the fixture's commit: the checkout is dirty.
    await writeFile(path.join(rootDir, "untracked.txt"), "dirty\n");

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["Answer: sound as drafted."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    });
    assert.equal(result.validation.ok, true, result.validation && result.validation.message);

    const afterText = await readFile(file, "utf8");
    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "commit"), null, "no 'commit' line: a dirty tree records none rather than a stale one");

    const parsed = parseNode(afterText, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file });
    assert.equal(parsed.review.commit, null);
  });
});

describe("apply.mjs: draft, kickback", () => {
  test("sets the kickback stage, records a null counter-argument as 'no strong', omits absent fields", async () => {
    const rootDir = await freshFixture("kick-");
    const file = reviewNodePath(rootDir);

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: REVIEW_NODE,
        verdict: "kickback",
        kickback_stage: "maieutic",
        findings: ["Answer: the disposition is ambiguous about who runs the second pass."],
        counter_argument: null,
        strength: "none",
        facts_check: null,
        viability: null,
      },
      replies: {},
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/review-node: Clean-context review (kickback), review → maieutic"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.equal(fieldValue(afterText, "stage"), "maieutic");
    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "verdict"), "kickback");
    assert.equal(fieldValue(block, "strength"), "none");

    assert.ok(afterText.includes("Verdict: kicked back to the maieutic stage."));
    assert.ok(afterText.includes("The review found no strong counter-argument."));
    assert.ok(!afterText.includes("On the facts and what they recommend:"), "facts_check omitted when null");
    assert.ok(!afterText.includes("On the viability of the options:"), "viability omitted when null");
    assert.ok(!afterText.includes("The session's reply:"), "reply line omitted when none given");
    assert.ok(!block.includes("against:"), "'review.against' omitted when counter_argument is null");
  });

  test("writes 'review.against' from a non-null counter_argument on a kickback too, beside strength", async () => {
    const rootDir = await freshFixture("kick-against-");
    const file = reviewNodePath(rootDir);

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: REVIEW_NODE,
        verdict: "kickback",
        kickback_stage: "periagogic",
        findings: ["Disposition: the ground itself needs redrawing."],
        counter_argument: "The ground may already be settled elsewhere and this redraws it needlessly.",
        strength: "weak",
      },
      replies: {},
      date: DATE,
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const block = reviewBlockOf(await readFile(file, "utf8"));
    assert.equal(fieldValue(block, "verdict"), "kickback");
    assert.equal(fieldValue(block, "strength"), "weak");
    assert.equal(
      fieldValue(block, "against"),
      JSON.stringify("The ground may already be settled elsewhere and this redraws it needlessly."),
    );
  });

  test("a kickback to a stage no reading may send a node back to is refused", async () => {
    const rootDir = await freshFixture("kick-bad-stage-");
    const before = await readFile(reviewNodePath(rootDir), "utf8");
    await assert.rejects(
      () => applyReviews({
        rootDir,
        input: { scope: "draft", id: REVIEW_NODE, verdict: "kickback", kickback_stage: "ruling", findings: [], strength: "none" },
        replies: {},
        date: DATE,
      }),
      /kickback_stage must be 'periagogic' .* or 'maieutic'/,
    );
    assert.equal(await readFile(reviewNodePath(rootDir), "utf8"), before);
  });
});

describe("apply.mjs: draft, override", () => {
  test("wins over the verdict's stage; the appended prose still narrates the reviewer's own verdict; creates '## Account' when absent", async () => {
    const rootDir = await freshFixture("ovr-");
    const file = answeredWithStagePath(rootDir);
    const before = await readFile(file, "utf8");
    assert.ok(!before.includes("## Account"), "fixture precondition: no Account section yet");

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: ANSWERED_WITH_STAGE,
        verdict: "kickback",
        kickback_stage: "maieutic",
        findings: ["Answer: unclear whether a reopened ratified node keeps the authority its ruling conferred."],
        counter_argument: "A ratified answer reopened for review might mislead a reader into thinking it is still final.",
        strength: "weak",
        facts_check: "Ratified/low is right; nothing here touches the ruling.",
        viability: "One option, and it is the one the author confirmed.",
      },
      replies: {},
      overrides: { [ANSWERED_WITH_STAGE]: "periagogic" },
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/answered-with-stage: Clean-context review (kickback), review → periagogic"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.equal(fieldValue(afterText, "stage"), "periagogic", "override wins over kickback_stage");
    assert.ok(afterText.includes("Verdict: kicked back to the maieutic stage."), "prose still reports the reviewer's own verdict");
    assert.ok(afterText.includes("\n## Account\n\n### Clean-context review"), "Account section created at the end");
    assert.ok(
      afterText.includes("        ruling:\n          response: confirm\n          date: 2026-09-03\n"),
      "the ruling on the answer fact is untouched: only the author writes one",
    );
    const parsedAfter = parseNode(afterText, { id: ANSWERED_WITH_STAGE, graph: "main", slug: "answered-with-stage", path: file });
    assert.equal(deriveClass(parsedAfter, new Map([[ANSWERED_WITH_STAGE, parsedAfter]])), "ratified", "the class the ruling confers is unchanged");
  });

  test("also lifts the 'stage must be review' precondition, letting a ruling-stage node through, and writes a fresh review block wholesale", async () => {
    const rootDir = await freshFixture("ovr-ruling-");
    const file = rulingNodePath(rootDir);
    const before = await readFile(file, "utf8");
    const fenceBefore = before.match(/```markdown\n([\s\S]*?)\n```/)[1];

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: RULING_NODE,
        verdict: "forward",
        findings: ["Rationale: sound, confirmed on a second look."],
        counter_argument: "The fixture's own record is thin, so 'sound' rests on little evidence.",
        strength: "strong",
        facts_check: null,
        viability: null,
      },
      replies: { [RULING_NODE]: "The record is small on purpose; accepted regardless." },
      overrides: { [RULING_NODE]: "ruling" },
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/ruling-node: Clean-context review (forward), ruling → ruling"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.equal(afterText.match(/```markdown\n([\s\S]*?)\n```/)[1], fenceBefore, "the '## Recommendation' fence is never touched");

    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "verdict"), "forward");
    assert.equal(fieldValue(block, "strength"), "strong");
    assert.equal(fieldValue(block, "against"), JSON.stringify("The fixture's own record is thin, so 'sound' rests on little evidence."));
    assert.deepEqual(topKeys(block), ["verdict", "strength", "date", "of", "against"], "review block is exactly these five keys, 'against' from the non-null counter_argument");

    // the recommendation hash is independent of stage, review and the
    // account text, so the pin this edit writes is the one already there.
    assert.equal(fieldValue(block, "of"), fieldValue(reviewBlockOf(before), "of"));
  });
});

/** The keys at one level of indentation in a `review:\n  k: v\n...` block. */
function topKeys(block) {
  return block.split("\n").slice(1)
    .map((l) => l.match(/^\s{2}([a-z_]+):/))
    .filter(Boolean)
    .map((m) => m[1]);
}

// ------------------------------------------ scope 'delta': the re-reading

describe("apply.mjs: scope 'delta' (the re-reading of an amendment)", () => {
  test("appends '### Clean-context re-reading' with the delta's own opening sentence and forward wording; stage and review block behave exactly as the draft path's", async () => {
    const rootDir = await freshFixture("delta-fwd-");
    const file = reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");
    const parsedBefore = parseNode(before, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file });
    const wantHash = parsedBefore.recommendationHash;

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "delta",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["The amendment answers the last reading's finding about X."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/review-node: Clean-context re-reading (forward), review → ruling"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.equal(fieldValue(afterText, "stage"), "ruling");
    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "verdict"), "forward");
    assert.equal(fieldValue(block, "of"), wantHash, "'review.of' pins the node's recommendation hash exactly as the draft path does");

    assert.ok(afterText.includes(`### Clean-context re-reading, ${DATE}`), "the delta heading, not the draft's");
    assert.ok(!afterText.includes(`### Clean-context review, ${DATE}`), "never the draft's own heading for a delta reading");
    assert.ok(
      afterText.includes(
        "Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. Verdict: the amendment stands, forwarded to the author's ruling.",
      ),
      "the delta's own opening sentence and forward wording, distinct from the draft's",
    );
  });

  test("a kickback re-reading writes the delta heading with the wording shared with the draft path, and sets the kickback stage the same way", async () => {
    const rootDir = await freshFixture("delta-kick-");
    const file = reviewNodePath(rootDir);

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "delta",
        id: REVIEW_NODE,
        verdict: "kickback",
        kickback_stage: "maieutic",
        findings: ["The amendment does not answer the last reading's finding: still ambiguous."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/review-node: Clean-context re-reading (kickback), review → maieutic"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.equal(fieldValue(afterText, "stage"), "maieutic");
    assert.ok(afterText.includes(`### Clean-context re-reading, ${DATE}`));
    assert.ok(afterText.includes("Verdict: kicked back to the maieutic stage."), "the kickback wording is shared with the draft path");
  });

  test("'nodes'/'frontier' on a delta-scoped input is refused with the same scope-aware message as the draft path", async () => {
    const rootDir = await freshFixture("delta-with-nodes-");
    await assert.rejects(
      () => applyReviews({
        rootDir,
        input: { scope: "delta", id: REVIEW_NODE, verdict: "forward", findings: [], strength: "none", nodes: [] },
        replies: {},
        date: DATE,
      }),
      /'nodes' and 'frontier' belong to the survey, and this file names scope 'delta'/,
    );
  });
});

// ------------------------------------------------- the two-reading cap

/** The fixture's own answer fact `recommends`, `standing` (review-node.md);
 * the two-reading cap tests below pass this explicitly wherever a prior
 * reading is meant to count as a reading of the node's current answer. */
const REVIEW_NODE_RECOMMENDS = "standing";

/** Splices reading subsections into a fixture's existing '## Account' prose,
 * ahead of anything already there, exactly as a prior apply would have left
 * them -- built directly rather than by chaining `applyReviews` calls, since
 * a forward verdict advances the stage past 'review' and a further call
 * would need an override to get back in, which is not what this is testing.
 * `recommends`, per section, renders the "Recommended at this reading" line
 * apply.mjs's own `renderSubsection` writes; omitting it (the default)
 * builds a section as any reading written before that recording existed
 * left it -- with no such line at all. */
function withPriorReadings(text, sections) {
  const rendered = sections.map(({ date, kind = "review", verdict = "forward", stage = null, recommends = null }) => [
    `### Clean-context ${kind === "delta" ? "re-reading" : "review"}, ${date}`,
    "",
    kind === "delta"
      ? `Read in clean context by a subagent given the amendment, the diff against the text the last reading pinned, and that reading's own findings, and nothing else of the sitting. ${verdict === "forward" ? "Verdict: the amendment stands, forwarded to the author's ruling." : `Verdict: kicked back to the ${stage} stage.`}`
      : `Read in clean context by a subagent given this draft, its ancestry, its siblings, the nodes it names, and the index of every question the record asks, and nothing of the sitting. ${verdict === "forward" ? "Verdict: forward to the author's ruling." : `Verdict: kicked back to the ${stage} stage.`}`,
    ...(recommends ? ["", `Recommended at this reading: \`${recommends}\`.`] : []),
    "",
    "Findings:",
    "",
    "- Answer: as read.",
    "",
    "The review found no strong counter-argument.",
    "",
  ].join("\n")).join("\n");
  const withSections = text.replace("## Account\n\n", `## Account\n\n${rendered}`);
  assert.notEqual(withSections, text, "fixture precondition: '## Account' present to splice readings ahead of");
  return withSections;
}

/** Runs `fn`, capturing everything written to `process.stderr` meanwhile. */
async function captureStderr(fn) {
  const original = process.stderr.write.bind(process.stderr);
  const chunks = [];
  process.stderr.write = (chunk) => { chunks.push(chunk.toString()); return true; };
  try {
    const result = await fn();
    return { result, stderr: chunks.join("") };
  } finally {
    process.stderr.write = original;
  }
}

describe("apply.mjs: the two-reading cap (review-cost)", () => {
  test("a third reading with no intervening kickback prints a non-fatal stderr warning naming the node; the write still succeeds", async () => {
    const rootDir = await freshFixture("cap-warn-");
    const file = reviewNodePath(rootDir);
    const seeded = withPriorReadings(await readFile(file, "utf8"), [
      { date: "2026-08-01", kind: "review", verdict: "forward", recommends: REVIEW_NODE_RECOMMENDS },
      { date: "2026-08-15", kind: "delta", verdict: "forward", recommends: REVIEW_NODE_RECOMMENDS },
    ]);
    await writeFile(file, seeded);

    const { result, stderr } = await captureStderr(() => applyReviews({
      rootDir,
      input: {
        scope: "delta",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["A third, later amendment."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    }));

    assert.equal(result.validation.ok, true, "the cap warns; it never refuses the write");
    assert.ok(stderr.includes(REVIEW_NODE), `warning does not name the node: ${stderr}`);
    assert.ok(stderr.includes("caps a single answer at two readings"), `warning missing the cap's own wording: ${stderr}`);

    const afterText = await readFile(file, "utf8");
    assert.ok(afterText.includes(`### Clean-context re-reading, ${DATE}`), "the third reading is still written despite the warning");
  });

  test("a kickback between two readings resets the cap: the next reading after it warns nothing", async () => {
    const rootDir = await freshFixture("cap-reset-");
    const file = reviewNodePath(rootDir);
    const seeded = withPriorReadings(await readFile(file, "utf8"), [
      { date: "2026-08-01", kind: "review", verdict: "kickback", stage: "maieutic" },
      { date: "2026-08-20", kind: "review", verdict: "forward" },
    ]);
    await writeFile(file, seeded);

    const { stderr } = await captureStderr(() => applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["Only one reading has happened since the kickback; the cap does not reach back across it."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    }));
    assert.equal(stderr, "", "the kickback in between resets the cap: this reading is only the second one since it");
  });

  test("exactly two readings since the last kickback (or none) do not warn: the cap trips only on the third", async () => {
    const rootDir = await freshFixture("cap-under-");
    const file = reviewNodePath(rootDir);
    const seeded = withPriorReadings(await readFile(file, "utf8"), [
      { date: "2026-08-01", kind: "review", verdict: "forward", recommends: REVIEW_NODE_RECOMMENDS },
    ]);
    await writeFile(file, seeded);

    const { stderr } = await captureStderr(() => applyReviews({
      rootDir,
      input: {
        scope: "delta",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["The second reading of this answer."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    }));
    assert.equal(stderr, "", "only the first reading stands so far: the second is not yet the cap's third");
  });

  /** Turns the fixture's answer fact from recommending `standing` (its only
   * option) into recommending a second option, `reconsidered`, `stands` left
   * at `standing` -- exercising the boundary a moved recommendation draws on
   * the cap, distinct from a kickback's, per review-cost's account "A defect
   * in the cap's own instrument": a moved recommendation begins a new answer
   * exactly as a kickback does. The added option's prose, and the recommended
   * fence, are placeholders; this is not a real second draft. */
  function withMovedRecommendation(text) {
    const withOption = text.replace(
      "      - name: standing\n        source: ai\n        ref: 2026-09-03\n    recommends: standing\n",
      "      - name: standing\n        source: ai\n        ref: 2026-09-03\n      - name: reconsidered\n        source: ai\n        ref: 2026-09-04\n    recommends: reconsidered\n",
    );
    assert.notEqual(withOption, text, "fixture precondition: the answer fact's single option and its 'recommends' line");
    const inserted = [
      "## Facts",
      "",
      "### answer",
      "",
      "The reconsidered option is now recommended.",
      "",
      "#### reconsidered",
      "",
      "Reconsidered: a second look at the question found a better answer.",
      "",
      "## Recommendation",
      "",
      "```markdown",
      "---",
      "question: Should boldness gate which drafts need a second reviewer?",
      "form: rule",
      "---",
      "",
      "## Answer",
      "",
      "Reconsidered: yes, a second look at the question found a better answer.",
      "```",
      "",
    ].join("\n");
    // The original '## Account\n\n' marker is kept intact at the end of the
    // replacement -- `withPriorReadings` below splices prior readings ahead
    // of that same marker, and the account's own prose (kept, after it)
    // stays exactly where it was.
    const withFactsAndFence = withOption.replace("## Account\n\n", `${inserted}## Account\n\n`);
    assert.notEqual(withFactsAndFence, withOption, "fixture precondition: '## Account' present to splice facts and the fence ahead of");
    return withFactsAndFence;
  }

  test("two prior readings recording the option the node still recommends warn on the third (the minimum case the cap exists for)", async () => {
    const rootDir = await freshFixture("cap-same-option-");
    const file = reviewNodePath(rootDir);
    const seeded = withPriorReadings(await readFile(file, "utf8"), [
      { date: "2026-08-01", kind: "review", verdict: "forward", recommends: REVIEW_NODE_RECOMMENDS },
      { date: "2026-08-15", kind: "delta", verdict: "forward", recommends: REVIEW_NODE_RECOMMENDS },
    ]);
    await writeFile(file, seeded);

    const { stderr } = await captureStderr(() => applyReviews({
      rootDir,
      input: {
        scope: "delta",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["A third reading of the same, still-standing answer."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    }));
    assert.ok(stderr.includes("caps a single answer at two readings"), `two readings of one answer already stand; the third must warn: ${stderr}`);
  });

  test("a recommendation moved to a different option between two prior readings and now does not warn: the move began a new answer, not a third round of the old one", async () => {
    const rootDir = await freshFixture("cap-moved-");
    const file = reviewNodePath(rootDir);
    const withMove = withMovedRecommendation(await readFile(file, "utf8"));
    const seeded = withPriorReadings(withMove, [
      { date: "2026-08-01", kind: "review", verdict: "forward", recommends: REVIEW_NODE_RECOMMENDS },
      { date: "2026-08-15", kind: "delta", verdict: "forward", recommends: REVIEW_NODE_RECOMMENDS },
    ]);
    await writeFile(file, seeded);

    const { stderr } = await captureStderr(() => applyReviews({
      rootDir,
      input: {
        scope: "delta",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["The first reading of the recommendation as moved to 'reconsidered'."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    }));
    assert.equal(stderr, "", `the two prior readings recorded 'standing', and the node now recommends 'reconsidered'; the move is a new answer and this is its first reading, so the cap must not warn: ${stderr}`);
  });

  test("a prior reading section with no recorded option stops the count rather than assuming it matches: the write after it does not warn", async () => {
    const rootDir = await freshFixture("cap-unknown-");
    const file = reviewNodePath(rootDir);
    const seeded = withPriorReadings(await readFile(file, "utf8"), [
      // Written as any reading before this recording existed would read: no
      // "Recommended at this reading" line at all (`recommends` omitted).
      { date: "2026-07-01", kind: "review", verdict: "forward" },
      { date: "2026-08-01", kind: "review", verdict: "forward", recommends: REVIEW_NODE_RECOMMENDS },
    ]);
    await writeFile(file, seeded);

    const { stderr } = await captureStderr(() => applyReviews({
      rootDir,
      input: {
        scope: "delta",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["This would be the third reading by a naive count, but the oldest section records no option."],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    }));
    assert.equal(stderr, "", `the oldest section's missing record must stop the count rather than assume it matches, so only one reading is counted: ${stderr}`);
  });
});

// ------------------------------------------------------ probes (both modes)
//
// author-questions: a probe recorded on a node at the review or the ruling
// stage returns it to the maieutic stage, whatever verdict or override says
// -- never 'ruling' -- and a node already at the periagogic stage stays
// there, since a movement only ever moves a node back. The applying step
// derives the stage from the probes before it reads the verdict.

const FRONTIER_PERIAGOGIC = "clean-context-review.test/main/periagogic-node";

/** An existing open probe, in the shape a node file itself carries it, spliced
 * in ahead of `facts:` -- for a test that needs a node already carrying one,
 * without adding a fixture file the batch survey tests below would also see
 * (they iterate every node under `fixtures/frontier/`). */
const EXISTING_PROBE_BLOCK = [
  "probes:",
  "  - id: what-does-the-ground-mean-here",
  "    asks: What does the ground mean here?",
  "    why: The disposition never defines what counts as the ground versus the answer, and the account does not say either.",
  "    discharges: Whether the periagogic movement here targets the disposition text or the answer fact.",
  "    source: review",
  '    raised: "2026-08-01"',
].join("\n");
function withExistingProbe(text) {
  const withBlock = text.replace(/^facts:\n/m, `${EXISTING_PROBE_BLOCK}\nfacts:\n`);
  assert.notEqual(withBlock, text, "fixture precondition: a top-level 'facts:' line to splice ahead of");
  return withBlock;
}

function onePropoundedProbe(extra = {}) {
  return [{
    asks: "Does this recommendation cover the case the author raised, or a narrower one?",
    why: "The disposition names the case but the answer does not say which reading it takes.",
    discharges: "Whether the standing option or a narrower one is what the node recommends.",
    fact: null,
    ...extra,
  }];
}

describe("apply.mjs: draft, probes", () => {
  test("a draft returning one probe writes it into 'probes:' (created, since the node had none) and sets the stage to maieutic, after facts and review in the frontmatter's key order", async () => {
    const rootDir = await freshFixture("probe-kickback-");
    const file = reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");
    assert.ok(!before.includes("probes:"), "fixture precondition: no probes yet");

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: REVIEW_NODE,
        verdict: "kickback",
        kickback_stage: "maieutic",
        findings: ["Answer: ambiguous about which case is covered."],
        probes: onePropoundedProbe(),
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.equal(fieldValue(await readFile(file, "utf8"), "stage"), "maieutic");

    const after = await readFile(file, "utf8");
    const parsed = parseNode(after, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file });
    assert.equal(parsed.probes.length, 1);
    const [p] = parsed.probes;
    assert.match(p.id, /^[a-z0-9][a-z0-9-]*$/);
    assert.equal(p.asks, "Does this recommendation cover the case the author raised, or a narrower one?");
    assert.equal(p.why, "The disposition names the case but the answer does not say which reading it takes.");
    assert.equal(p.discharges, "Whether the standing option or a narrower one is what the node recommends.");
    assert.equal(p.source, "review");
    assert.equal(p.raised, DATE);
    assert.equal(p.fact, null);
    assert.equal(p.status, null, "an open probe carries no status");
    assert.ok(result.report[0].includes(`probe '${p.id}'`), `report names the probe's generated id: ${result.report[0]}`);

    assert.ok(after.indexOf("\nreview:") < after.indexOf("\nprobes:"), "probes: comes after review:, the reader's own key order");
  });

  test("the same reading with a 'forward' verdict still sets maieutic, and the applying step records the contradiction without refusing the file", async () => {
    const rootDir = await freshFixture("probe-forward-");
    const file = reviewNodePath(rootDir);

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: REVIEW_NODE,
        verdict: "forward",
        findings: ["Answer: looks sound but see the probe."],
        probes: onePropoundedProbe(),
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: DATE,
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const after = await readFile(file, "utf8");
    assert.equal(fieldValue(after, "stage"), "maieutic", "never 'ruling' while an open probe stands, whatever the verdict says");
    const block = reviewBlockOf(after);
    assert.equal(fieldValue(block, "verdict"), "forward", "the reviewer's own verdict is still recorded as written");

    assert.ok(
      result.notes.some((n) => n.includes(REVIEW_NODE) && n.includes("contradiction")),
      `expected a contradiction note, got: ${JSON.stringify(result.notes)}`,
    );
    assert.ok(result.report.some((l) => l.includes("contradiction")), "the note reaches the report too");
  });

  test("an override of 'ruling' is beaten by an open probe", async () => {
    const rootDir = await freshFixture("probe-override-ruling-");
    const file = rulingNodePath(rootDir);

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: RULING_NODE,
        verdict: "forward",
        findings: ["Rationale: needs the probe answered first."],
        probes: onePropoundedProbe(),
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      overrides: { [RULING_NODE]: "ruling" },
      date: DATE,
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.equal(fieldValue(await readFile(file, "utf8"), "stage"), "maieutic", "the override said 'ruling'; the open probe beats it outright");
  });

  test("an override of 'periagogic' is honoured", async () => {
    const rootDir = await freshFixture("probe-override-periagogic-");
    const file = answeredWithStagePath(rootDir);

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: ANSWERED_WITH_STAGE,
        verdict: "kickback",
        kickback_stage: "maieutic",
        findings: ["Answer: the ground itself may need redrawing."],
        probes: onePropoundedProbe(),
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      overrides: { [ANSWERED_WITH_STAGE]: "periagogic" },
      date: DATE,
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.equal(fieldValue(await readFile(file, "utf8"), "stage"), "periagogic");
  });

  test("a node already at the periagogic stage stays there even under an override that names another stage; without a probe the override applies as it always did", async () => {
    const withProbe = await freshFrontierFixture("probe-periagogic-stays-");
    const withoutProbe = await freshFrontierFixture("probe-periagogic-control-");
    const filePath = (dir) => path.join(dir, "main/periagogic-node.md");

    const withProbeResult = await applyReviews({
      rootDir: withProbe,
      input: {
        scope: "draft",
        id: FRONTIER_PERIAGOGIC,
        verdict: "kickback",
        kickback_stage: "maieutic",
        findings: ["Disposition: still needs the probe answered."],
        probes: onePropoundedProbe(),
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      overrides: { [FRONTIER_PERIAGOGIC]: "maieutic" },
      date: DATE,
    });
    assert.equal(withProbeResult.validation.ok, true, withProbeResult.validation.message);
    assert.equal(
      fieldValue(await readFile(filePath(withProbe), "utf8"), "stage"),
      "periagogic",
      "a movement only ever moves a node back: an open probe cannot advance it past periagogic",
    );

    const withoutProbeResult = await applyReviews({
      rootDir: withoutProbe,
      input: {
        scope: "draft",
        id: FRONTIER_PERIAGOGIC,
        verdict: "kickback",
        kickback_stage: "maieutic",
        findings: ["Disposition: still needs redrafting, no probe this time."],
        probes: [],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      overrides: { [FRONTIER_PERIAGOGIC]: "maieutic" },
      date: DATE,
    });
    assert.equal(withoutProbeResult.validation.ok, true, withoutProbeResult.validation.message);
    assert.equal(
      fieldValue(await readFile(filePath(withoutProbe), "utf8"), "stage"),
      "maieutic",
      "with no probe the override applies exactly as it always did: this pair shows the probe rule changes nothing else",
    );
  });

  test("a generated id colliding with one the node already carries is disambiguated, and the existing probe is kept byte for byte", async () => {
    const rootDir = await freshFixture("probe-collide-");
    const file = reviewNodePath(rootDir);
    const before = withExistingProbe(await readFile(file, "utf8"));
    await writeFile(file, before);

    const result = await applyReviews({
      rootDir,
      input: {
        scope: "draft",
        id: REVIEW_NODE,
        verdict: "kickback",
        kickback_stage: "maieutic",
        findings: ["Answer: a second ambiguity, distinct from the first."],
        // slugifies to the same base as the probe the fixture already carries
        probes: [{
          asks: "What does the ground mean here?",
          why: "A second look at the same passage finds a second gap the first probe did not cover.",
          discharges: "Whether 'the ground' in this sentence means the disposition or the account.",
          fact: null,
        }],
        counter_argument: null,
        strength: "none",
      },
      replies: {},
      date: "2026-09-05",
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const after = await readFile(file, "utf8");
    const parsed = parseNode(after, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file });
    assert.equal(parsed.probes.length, 2);
    assert.equal(parsed.probes[0].id, "what-does-the-ground-mean-here", "the existing probe's id is untouched");
    assert.equal(parsed.probes[0].raised, "2026-08-01", "and so is the rest of it: it is not rewritten by this apply");
    assert.equal(parsed.probes[1].id, "what-does-the-ground-mean-here-2", "the collision is disambiguated rather than refused or overwriting the first");
    assert.equal(parsed.probes[1].raised, "2026-09-05");
    assert.ok(before.includes("id: what-does-the-ground-mean-here\n"), "fixture precondition unchanged");
  });
});

describe("apply.mjs: draft refusals write nothing", () => {
  test("a strong finding with no reply is refused, naming the id", async () => {
    const rootDir = await freshFixture("strong-noreply-");
    const file = reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");

    await assert.rejects(
      () => applyReviews({
        rootDir,
        input: { scope: "draft", id: REVIEW_NODE, verdict: "forward", findings: ["x"], counter_argument: "y", strength: "strong" },
        replies: {},
        date: DATE,
      }),
      new RegExp(`${escapeRe(REVIEW_NODE)}: strength 'strong' requires a reply`),
    );
    assert.equal(await readFile(file, "utf8"), before);
  });

  test("a draft entry on a non-review node with no override is refused", async () => {
    const rootDir = await freshFixture("wrong-stage-");
    const file = rulingNodePath(rootDir);
    const before = await readFile(file, "utf8");

    await assert.rejects(
      () => applyReviews({
        rootDir,
        input: { scope: "draft", id: RULING_NODE, verdict: "forward", findings: [], counter_argument: null, strength: "none" },
        replies: {},
        date: DATE,
      }),
      /the review of a draft runs on a node at stage 'review' \(or an override\), found 'ruling'/,
    );
    assert.equal(await readFile(file, "utf8"), before);
  });

  test("a draft file carrying the survey's own fields is refused", async () => {
    const rootDir = await freshFixture("draft-with-nodes-");
    await assert.rejects(
      () => applyReviews({
        rootDir,
        input: { scope: "draft", id: REVIEW_NODE, verdict: "forward", findings: [], strength: "none", nodes: [] },
        replies: {},
        date: DATE,
      }),
      /'nodes' and 'frontier' belong to the survey/,
    );
  });
});

describe("apply.mjs: draft --dry and the CLI", () => {
  test("--dry reports the plan and writes nothing", async () => {
    const rootDir = await freshFixture("dry-");
    const file = reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");

    const result = await applyReviews({
      rootDir,
      input: { scope: "draft", id: REVIEW_NODE, verdict: "forward", findings: ["x"], counter_argument: null, strength: "none" },
      replies: {},
      date: DATE,
      dry: true,
    });

    assert.deepEqual(result.report, ["example.test/main/review-node: Clean-context review (forward), review → ruling"]);
    assert.equal(result.validation, null, "--dry never runs the post-write readGraph check");
    assert.equal(await readFile(file, "utf8"), before, "nothing written");
  });

  test("the real command line: --dry over one JSON file, exit 0, exact stdout", async () => {
    const dir = await freshFixtureScratch("cli-");
    const jsonFile = path.join(dir, "draft-review-node.json");
    await writeFile(jsonFile, JSON.stringify({
      scope: "draft", id: REVIEW_NODE, verdict: "forward", findings: ["x"], counter_argument: null, strength: "none",
    }));

    const stdout = execFileSync(process.execPath, [APPLY_MJS, jsonFile, "--date", DATE, "--dry"], { cwd: dir, encoding: "utf8" });
    assert.equal(stdout, "example.test/main/review-node: Clean-context review (forward), review → ruling\n(dry run: 1 node(s) planned, nothing written)\n");
    assert.equal(
      await readFile(path.join(dir, "disposition/main/review-node.md"), "utf8"),
      await readFile(path.join(FIXTURE_SRC, "main/review-node.md"), "utf8"),
    );
  });

  test("a refusal exits non-zero and prints the reason on stderr", async () => {
    const dir = await freshFixtureScratch("cli-refuse-");
    const jsonFile = path.join(dir, "draft.json");
    await writeFile(jsonFile, JSON.stringify({ scope: "draft", id: RULING_NODE, verdict: "forward", findings: [], strength: "none" }));
    assert.throws(() => execFileSync(process.execPath, [APPLY_MJS, jsonFile, "--date", DATE, "--dry"], { cwd: dir, encoding: "utf8" }));
  });
});

// --------------------------------------------------------------------------
// apply.mjs: the survey (clean-context-review.md, frontier-consistency.md,
// review-skills.md). Its judged set and its serialization both come from the pins
// sidecar brief.mjs wrote: a judged node whose recommendation still matches
// its pin is applied, one that has moved receives nothing, and a finding
// naming any node that has moved is discarded.
// --------------------------------------------------------------------------

const MAIEUTIC_NODE = "clean-context-review.test/main/maieutic-node";
const PERIAGOGIC_NODE = "clean-context-review.test/main/periagogic-node";
const REVIEW_A = "clean-context-review.test/main/review-a";
const REVIEW_B = "clean-context-review.test/main/review-b";
const REVIEW_LOW = "clean-context-review.test/main/review-low";
const RULING_A = "clean-context-review.test/main/ruling-a";
const ANSWERED_NODE = "clean-context-review.test/main/answered-ratified";
const SURVEY_PINNED = "clean-context-review.test/main/survey-pinned";
const SURVEY_DATE = "2026-09-03";
const COMMIT = "1111111111111111111111111111111111111111";

function nodePath(rootDir, slug) {
  return path.join(rootDir, "main", `${slug}.md`);
}

function parseAt(rootDir, slug, id) {
  const file = nodePath(rootDir, slug);
  return readFile(file, "utf8").then((text) => parseNode(text, { id, graph: "main", slug, path: file }));
}

/** The sidecar brief.mjs writes, built here from the graph as it stands. */
async function pinsFor(rootDir, { date = SURVEY_DATE, commit = COMMIT, patch = {} } = {}) {
  const graph = await readGraph(rootDir);
  const pins = {};
  for (const n of graph.nodes) pins[n.id] = n.recommendationHash;
  return {
    commit,
    dirty: false,
    date,
    judged: surveyJudges(graph).map((n) => n.id),
    pins: { ...pins, ...patch },
  };
}

/** Two judged nodes' entries, the shape the survey's brief asks for. */
function judgedEntries() {
  return [
    { id: REVIEW_A, findings: ["The frontier reads this node's answer as it stands."], counter_argument: null, strength: "none" },
    { id: REVIEW_B, findings: [], counter_argument: null, strength: "none" },
  ];
}

function surveyInput(extra = {}) {
  return { scope: "survey", commit: COMMIT, date: SURVEY_DATE, nodes: judgedEntries(), frontier: [], subtree_divergences: [], ...extra };
}

describe("apply.mjs: survey", () => {
  test("writes the survey's pin on every judged node whose recommendation still matches, beside the draft review it already carries", async () => {
    const rootDir = await freshFrontierFixture("survey-pin-");
    const pins = await pinsFor(rootDir);
    const rulingBefore = await parseAt(rootDir, "ruling-a", RULING_A);
    assert.equal(rulingBefore.review.survey, null, "fixture precondition: no survey pin yet");

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        nodes: [...judgedEntries(), { id: RULING_A, findings: ["Nothing across the frontier moves this one."], counter_argument: null, strength: "none" }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.deepEqual(result.moved, [], "nothing moved since the survey read it");

    const reviewA = await parseAt(rootDir, "review-a", REVIEW_A);
    assert.deepEqual(reviewA.review.survey, { date: SURVEY_DATE, of: pins.pins[REVIEW_A] });
    assert.equal(reviewA.review.verdict, "forward", "the draft review already on the node is kept");
    assert.equal(reviewA.review.date, "2026-08-01");
    assert.equal(reviewA.surveyStale, false);
    assert.equal(reviewA.stage, "review", "the survey forwards nothing: only a finding moves a stage");

    const reviewB = await parseAt(rootDir, "review-b", REVIEW_B);
    assert.deepEqual(reviewB.review.survey, { date: SURVEY_DATE, of: pins.pins[REVIEW_B] });
    assert.equal(reviewB.review.verdict, null, "a node with no draft review gets the survey's half alone");

    const rulingA = await parseAt(rootDir, "ruling-a", RULING_A);
    assert.deepEqual(rulingA.review.survey, { date: SURVEY_DATE, of: pins.pins[RULING_A] });
    assert.equal(rulingA.readyToRule, true, "a forward verdict and a survey pin on the same recommendation: ready to rule");

    // the account subsection, and no verdict in it
    const text = await readFile(nodePath(rootDir, "review-a"), "utf8");
    assert.ok(text.includes("### Frontier survey, 2026-09-03"));
    assert.ok(text.includes(SURVEY_OPENING));
    assert.ok(!text.includes("### Clean-context review, 2026-09-03"), "the survey writes no draft review");
    assert.ok(result.report.some((l) => l === `${REVIEW_A}: Frontier survey + draft review kept, review → review`));
  });

  test("preserves the draft review's own 'against' when the survey merges its pin in beside it", async () => {
    const rootDir = await freshFrontierFixture("survey-against-");
    const file = nodePath(rootDir, "review-a");
    const before = await readFile(file, "utf8");
    const withAgainst = before.replace(
      "  of: 0586c577f9126f9c1f3b74b1a98f9e542a19b869\n",
      "  of: 0586c577f9126f9c1f3b74b1a98f9e542a19b869\n  against: A stands only on a provisional reading; a fuller one may not agree.\n",
    );
    assert.notEqual(withAgainst, before, "fixture precondition: the review block matched");
    await writeFile(file, withAgainst);
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({ rootDir, pins, input: surveyInput(), replies: {} });
    assert.equal(result.validation.ok, true, result.validation.message);

    const reviewA = await parseAt(rootDir, "review-a", REVIEW_A);
    assert.equal(
      reviewA.review.against,
      "A stands only on a provisional reading; a fuller one may not agree.",
      "the draft review's own case against survives the survey's own write",
    );
    assert.deepEqual(reviewA.review.survey, { date: SURVEY_DATE, of: pins.pins[REVIEW_A] }, "and the survey's pin is written beside it");
  });

  test("a judged node whose recommendation moved since the survey read it receives nothing and is reported", async () => {
    const rootDir = await freshFrontierFixture("survey-moved-");
    const pins = await pinsFor(rootDir, { patch: { [REVIEW_A]: "cccccccccccccccccccccccccccccccccccccccc" } });
    const before = await readFile(nodePath(rootDir, "review-a"), "utf8");

    const result = await applyReviews({ rootDir, pins, input: surveyInput(), replies: {} });
    assert.equal(result.validation.ok, true, result.validation.message);

    assert.equal(await readFile(nodePath(rootDir, "review-a"), "utf8"), before, "the moved node is left exactly as it stands");
    assert.equal(result.moved.length, 1);
    assert.match(result.moved[0], new RegExp(`^${escapeRe(REVIEW_A)}: moved since the survey read it \\(pinned cccc.*, now [0-9a-f]{40}\\); nothing written, judged again by the next survey$`));
    assert.ok(result.report.includes(result.moved[0]), "the report carries the moved list");

    const reviewB = await parseAt(rootDir, "review-b", REVIEW_B);
    assert.deepEqual(reviewB.review.survey, { date: SURVEY_DATE, of: pins.pins[REVIEW_B] }, "the rest of the run still applies");
  });

  test("a frontier finding naming a node that moved is discarded with a note and applied to none of its nodes", async () => {
    const rootDir = await freshFrontierFixture("survey-discard-");
    const pins = await pinsFor(rootDir, { patch: { [MAIEUTIC_NODE]: "dddddddddddddddddddddddddddddddddddddddd" } });
    const maieuticBefore = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");
    const periagogicBefore = await readFile(nodePath(rootDir, "periagogic-node"), "utf8");

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        frontier: [
          {
            kind: "placement",
            nodes: [MAIEUTIC_NODE, PERIAGOGIC_NODE],
            finding: "These two overlap in scope and should trade stages.",
            proposal: "Swap them.",
            stages: { [MAIEUTIC_NODE]: "periagogic", [PERIAGOGIC_NODE]: "maieutic" },
          },
          {
            kind: "vocabulary",
            nodes: [REVIEW_A],
            finding: "One term is used two ways.",
            proposal: "Define it once.",
            stages: { [REVIEW_A]: "maieutic" },
          },
        ],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    assert.equal(result.discarded.length, 1);
    assert.match(result.discarded[0], /^frontier\[0\] \(placement\): discarded — names .*maieutic-node \(pinned dddd.*\), moved since the survey read it; applied to none of its nodes$/);
    assert.equal(await readFile(nodePath(rootDir, "maieutic-node"), "utf8"), maieuticBefore, "the moved node the finding names is untouched");
    assert.equal(
      await readFile(nodePath(rootDir, "periagogic-node"), "utf8"),
      periagogicBefore,
      "and so is the other node it names: a discarded finding is applied to none of them",
    );

    // the finding that names only current nodes still applies
    const reviewA = await parseAt(rootDir, "review-a", REVIEW_A);
    assert.equal(reviewA.stage, "maieutic");
    assert.ok((await readFile(nodePath(rootDir, "review-a"), "utf8")).includes("Kind: vocabulary."));
  });

  test("a finding naming a node the survey never pinned at all is discarded too", async () => {
    const rootDir = await freshFrontierFixture("survey-unpinned-");
    const pins = await pinsFor(rootDir);
    delete pins.pins[PERIAGOGIC_NODE];
    const before = await readFile(nodePath(rootDir, "periagogic-node"), "utf8");

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        frontier: [{ kind: "coverage", nodes: [PERIAGOGIC_NODE], finding: "x", proposal: "y", stages: { [PERIAGOGIC_NODE]: "maieutic" } }],
      }),
      replies: {},
    });
    assert.equal(result.discarded.length, 1);
    assert.match(result.discarded[0], /pinned nothing/);
    assert.equal(await readFile(nodePath(rootDir, "periagogic-node"), "utf8"), before);
  });

  test("an entry for a node the survey did not judge is refused, and nothing is written", async () => {
    const rootDir = await freshFrontierFixture("survey-unjudged-");
    const pins = await pinsFor(rootDir);
    const before = await readFile(nodePath(rootDir, "review-a"), "utf8");
    assert.ok(!pins.judged.includes(SURVEY_PINNED), "fixture precondition: survey-pinned carries a current pin, so it is not judged");

    await assert.rejects(
      () => applyReviews({
        rootDir,
        pins,
        input: surveyInput({ nodes: [...judgedEntries(), { id: SURVEY_PINNED, findings: [], strength: "none" }] }),
        replies: {},
      }),
      new RegExp(`'nodes' names ${escapeRe(SURVEY_PINNED)}, which this survey did not judge`),
    );
    assert.equal(await readFile(nodePath(rootDir, "review-a"), "utf8"), before, "nothing is written when any problem occurs");
  });

  test("a duplicate entry, a strong counter-argument with no reply, and an entry that is not a node are each refused", async () => {
    const rootDir = await freshFrontierFixture("survey-refuse-");
    const before = await readFile(nodePath(rootDir, "review-a"), "utf8");
    const pins = await pinsFor(rootDir);

    await assert.rejects(
      () => applyReviews({ rootDir, pins, input: surveyInput({ nodes: [...judgedEntries(), judgedEntries()[0]] }), replies: {} }),
      new RegExp(`'nodes' has more than one entry for ${escapeRe(REVIEW_A)}`),
    );
    await assert.rejects(
      () => applyReviews({
        rootDir,
        pins,
        input: surveyInput({ nodes: [{ id: REVIEW_A, findings: [], counter_argument: "y", strength: "strong" }] }),
        replies: {},
      }),
      new RegExp(`${escapeRe(REVIEW_A)}: strength 'strong' requires a reply`),
    );
    await assert.rejects(
      () => applyReviews({ rootDir, pins, input: surveyInput({ nodes: [{ id: "clean-context-review.test/main/nope", findings: [] }] }), replies: {} }),
      /'nodes' names clean-context-review\.test\/main\/nope, which is not a node/,
    );
    assert.equal(await readFile(nodePath(rootDir, "review-a"), "utf8"), before, "nothing written on any refusal");
  });

  test("refuses without a pins sidecar: a survey applied unpinned is applied to text no reading attests to", async () => {
    const dir = await freshFrontierScratch("survey-nopins-");
    const jsonFile = path.join(dir, "survey.json");
    await writeFile(jsonFile, JSON.stringify(surveyInput()));
    await assert.rejects(
      () => applyReviews({ rootDir: path.join(dir, "disposition"), file: jsonFile, replies: {} }),
      /cannot read the survey's pins at .*survey\.pins\.json/,
    );
  });

  test("a sidecar that is not one is refused by shape", async () => {
    const rootDir = await freshFrontierFixture("survey-badpins-");
    await assert.rejects(
      () => applyReviews({ rootDir, pins: { commit: null }, input: surveyInput(), replies: {} }),
      /'judged' must be the list of ids the survey judged/,
    );
  });

  test("a commit that disagrees with the sidecar's is noted, and the sidecar's hashes decide", async () => {
    const rootDir = await freshFrontierFixture("survey-commit-");
    const pins = await pinsFor(rootDir);
    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({ commit: "2222222222222222222222222222222222222222" }),
      replies: {},
    });
    assert.ok(result.notes.some((n) => n.includes("the survey names graph commit 2222")), `no note about the commit: ${result.notes.join(" | ")}`);
    assert.equal(result.validation.ok, true, result.validation.message);
  });

  test("--dry reports the plan and writes nothing", async () => {
    const rootDir = await freshFrontierFixture("survey-dry-");
    const pins = await pinsFor(rootDir);
    const before = await readFile(nodePath(rootDir, "review-a"), "utf8");

    const result = await applyReviews({ rootDir, pins, input: surveyInput(), replies: {}, dry: true });
    assert.equal(result.validation, null);
    assert.ok(result.report.some((l) => l.startsWith(`${REVIEW_A}: Frontier survey`)));
    assert.equal(await readFile(nodePath(rootDir, "review-a"), "utf8"), before, "nothing written under --dry");
  });

  test("the real command line: the sidecar is read from beside the input file", async () => {
    const dir = await freshFrontierScratch("survey-cli-");
    const rootDir = path.join(dir, "disposition");
    const jsonFile = path.join(dir, "survey.json");
    await writeFile(jsonFile, JSON.stringify(surveyInput()));
    await writeFile(path.join(dir, "survey.pins.json"), JSON.stringify(await pinsFor(rootDir)));

    const stdout = execFileSync(process.execPath, [APPLY_MJS, jsonFile, "--date", SURVEY_DATE, "--dry"], { cwd: dir, encoding: "utf8" });
    assert.match(stdout, new RegExp(`^${escapeRe(REVIEW_A)}: Frontier survey \\+ draft review kept, review → review\\n`));
    assert.match(stdout, /\(dry run: 2 node\(s\) planned, nothing written\)\n$/);
  });

  test("date resolution: --date wins, else the survey's own date", async () => {
    const rootDir = await freshFrontierFixture("survey-date-");
    const pins = await pinsFor(rootDir);
    await applyReviews({ rootDir, pins, input: surveyInput({ date: "2020-01-01" }), replies: {} });
    assert.ok((await readFile(nodePath(rootDir, "review-a"), "utf8")).includes("### Frontier survey, 2020-01-01"));

    const rootDir2 = await freshFrontierFixture("survey-date-flag-");
    const pins2 = await pinsFor(rootDir2);
    await applyReviews({ rootDir: rootDir2, pins: pins2, input: surveyInput({ date: "2020-01-01" }), replies: {}, date: "2021-06-06" });
    assert.ok((await readFile(nodePath(rootDir2, "review-a"), "utf8")).includes("### Frontier survey, 2021-06-06"));
  });
});

describe("apply.mjs: survey, probes", () => {
  test("a probe on a node the survey is judging sets that node to maieutic", async () => {
    const rootDir = await freshFrontierFixture("survey-probe-judged-");
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        probes: [{
          node: REVIEW_A,
          asks: "Does 'standing' cover the narrower case as well as the general one?",
          why: "Neither the disposition nor the account says whether the narrower case was considered.",
          discharges: "Whether 'standing' alone is enough or a second option belongs beside it.",
          fact: "answer",
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const reviewA = await parseAt(rootDir, "review-a", REVIEW_A);
    assert.equal(reviewA.stage, "maieutic", "a probe beats the survey's own 'nothing forwards' default");
    assert.equal(reviewA.probes.length, 1);
    assert.equal(reviewA.probes[0].source, "review");
    assert.equal(reviewA.probes[0].raised, SURVEY_DATE);
    assert.equal(reviewA.probes[0].fact, "answer");
    assert.ok(result.report.some((l) => l.startsWith(`${REVIEW_A}: `) && l.includes("probe") && l.includes("review → maieutic")));
  });

  test("a probe on a node the survey is not judging reaches it and kicks it back the same way, from 'ruling' to 'maieutic'", async () => {
    const rootDir = await freshFrontierFixture("survey-probe-unjudged-");
    const pins = await pinsFor(rootDir);
    const before = await parseAt(rootDir, "ruling-a", RULING_A);
    assert.equal(before.stage, "ruling", "fixture precondition");

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        probes: [{
          node: RULING_A,
          asks: "Does the whole-thing option still answer the case the disposition raised?",
          why: "The account's earlier round did not address the split the disposition describes.",
          discharges: "Whether 'whole-thing' stands as the recommendation or needs a further split.",
          fact: null,
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const rulingA = await parseAt(rootDir, "ruling-a", RULING_A);
    assert.equal(rulingA.stage, "maieutic", "the same rule reaches a node the survey never judged this round");
    assert.equal(rulingA.probes.length, 1);
    assert.equal(rulingA.probes[0].fact, null);
  });

  test("an override of 'ruling' is beaten by an open probe", async () => {
    const rootDir = await freshFrontierFixture("survey-probe-override-ruling-");
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        probes: [{
          node: REVIEW_A,
          asks: "Same as above -- does 'standing' cover the narrower case?",
          why: "As above.",
          discharges: "As above.",
        }],
      }),
      overrides: { [REVIEW_A]: "ruling" },
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    const reviewA = await parseAt(rootDir, "review-a", REVIEW_A);
    assert.equal(reviewA.stage, "maieutic", "the override said 'ruling'; the open probe beats it outright");
  });

  test("an override of 'periagogic' is honoured", async () => {
    const rootDir = await freshFrontierFixture("survey-probe-override-periagogic-");
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        probes: [{
          node: REVIEW_B,
          asks: "Is the 'narrower' option meant to replace 'standing' or to sit beside it?",
          why: "The account does not say whether the two options are mutually exclusive.",
          discharges: "Whether 'narrower' stays an alternative or becomes the recommendation.",
        }],
      }),
      overrides: { [REVIEW_B]: "periagogic" },
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    const reviewB = await parseAt(rootDir, "review-b", REVIEW_B);
    assert.equal(reviewB.stage, "periagogic");
  });

  test("a node already at the periagogic stage stays there even under an override that names another stage; without a probe the override applies as it always did", async () => {
    const withProbe = await freshFrontierFixture("survey-probe-periagogic-stays-");
    const withoutProbe = await freshFrontierFixture("survey-probe-periagogic-control-");

    const pinsWith = await pinsFor(withProbe);
    const resultWith = await applyReviews({
      rootDir: withProbe,
      pins: pinsWith,
      input: surveyInput({
        nodes: [],
        probes: [{
          node: PERIAGOGIC_NODE,
          asks: "Is the ground here the disposition's or the account's?",
          why: "Neither section says which one the periagoge is meant to settle.",
          discharges: "Which text the periagogic movement is meant to redraw.",
        }],
      }),
      overrides: { [PERIAGOGIC_NODE]: "maieutic" },
      replies: {},
    });
    assert.equal(resultWith.validation.ok, true, resultWith.validation.message);
    const withProbeAfter = await parseAt(withProbe, "periagogic-node", PERIAGOGIC_NODE);
    assert.equal(withProbeAfter.stage, "periagogic", "a movement only ever moves a node back: the probe cannot advance it past periagogic");

    const pinsWithout = await pinsFor(withoutProbe);
    const resultWithout = await applyReviews({
      rootDir: withoutProbe,
      pins: pinsWithout,
      input: surveyInput({
        nodes: [],
        frontier: [{
          kind: "placement", nodes: [PERIAGOGIC_NODE], finding: "x", proposal: "y", stages: { [PERIAGOGIC_NODE]: "maieutic" },
        }],
      }),
      overrides: { [PERIAGOGIC_NODE]: "maieutic" },
      replies: {},
    });
    assert.equal(resultWithout.validation.ok, true, resultWithout.validation.message);
    const withoutProbeAfter = await parseAt(withoutProbe, "periagogic-node", PERIAGOGIC_NODE);
    assert.equal(withoutProbeAfter.stage, "maieutic", "with no probe the override applies exactly as it always did");
  });

  test("appends to an existing 'probes:' block and disambiguates a colliding generated id", async () => {
    const rootDir = await freshFrontierFixture("survey-probe-collide-");
    const file = nodePath(rootDir, "review-b");
    const before = withExistingProbe(await readFile(file, "utf8"));
    await writeFile(file, before);
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        nodes: [],
        probes: [{
          node: REVIEW_B,
          asks: "What does the ground mean here?",
          why: "A second look at the same passage finds a second gap the first probe did not cover.",
          discharges: "Whether 'the ground' in this sentence means the disposition or the account.",
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const after = await parseAt(rootDir, "review-b", REVIEW_B);
    assert.equal(after.probes.length, 2);
    assert.equal(after.probes[0].id, "what-does-the-ground-mean-here");
    assert.equal(after.probes[0].raised, "2026-08-01", "the existing probe is kept as it stood");
    assert.equal(after.probes[1].id, "what-does-the-ground-mean-here-2");
    assert.equal(after.probes[1].raised, SURVEY_DATE);
    assert.ok(before.includes("id: what-does-the-ground-mean-here\n"), "fixture precondition unchanged");
  });

  test("a probe naming a node that moved since the survey read it is discarded and not written", async () => {
    const rootDir = await freshFrontierFixture("survey-probe-moved-");
    const pins = await pinsFor(rootDir, { patch: { [REVIEW_B]: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" } });
    const before = await readFile(nodePath(rootDir, "review-b"), "utf8");

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        nodes: [judgedEntries()[0]],
        probes: [{
          node: REVIEW_B,
          asks: "Does the narrower option still make sense after the edit?",
          why: "The survey read this node before the edit that moved its recommendation.",
          discharges: "Whether 'narrower' still belongs on the table.",
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.equal(await readFile(nodePath(rootDir, "review-b"), "utf8"), before, "the moved node is left exactly as it stands");
    assert.ok(
      result.discarded.some((l) => l.includes("probes[0]") && l.includes(REVIEW_B) && l.includes("moved since the survey read it")),
      `expected a discarded-probe line, got: ${JSON.stringify(result.discarded)}`,
    );
  });

  test("a probe naming a node that is not in the graph is refused, and nothing is written", async () => {
    const rootDir = await freshFrontierFixture("survey-probe-badnode-");
    const pins = await pinsFor(rootDir);
    const before = await readFile(nodePath(rootDir, "review-a"), "utf8");

    await assert.rejects(
      () => applyReviews({
        rootDir,
        pins,
        input: surveyInput({ probes: [{ node: "clean-context-review.test/main/nope", asks: "x", why: "y", discharges: "z" }] }),
        replies: {},
      }),
      /probes\[0\]: 'node' must name a node/,
    );
    assert.equal(await readFile(nodePath(rootDir, "review-a"), "utf8"), before);
  });
});

describe("apply.mjs: a survey finding may name any node", () => {
  test("a finding across two nodes moves each to the stage it names; an unstaged node keeps its stage and still gets the subsection", async () => {
    const rootDir = await freshFrontierFixture("finding-stages-");
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        frontier: [{
          kind: "placement",
          nodes: [MAIEUTIC_NODE, PERIAGOGIC_NODE],
          finding: "periagogic-node's ground needs redrawing; maieutic-node is cited for comparison only.",
          proposal: "Redraft periagogic-node's account; nothing is proposed for maieutic-node itself.",
          stages: { [PERIAGOGIC_NODE]: "maieutic" },
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.ok(result.report.includes(`${MAIEUTIC_NODE}: Frontier finding, maieutic → maieutic`), "unstaged: reported as unchanged");
    assert.ok(result.report.includes(`${PERIAGOGIC_NODE}: Frontier finding, periagogic → maieutic`), "staged: reported as moved");

    const maieuticAfter = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");
    const periagogicAfter = await readFile(nodePath(rootDir, "periagogic-node"), "utf8");
    assert.equal(fieldValue(maieuticAfter, "stage"), "maieutic");
    assert.ok(maieuticAfter.includes("### Frontier finding, 2026-09-03") && maieuticAfter.includes(`Also named: ${PERIAGOGIC_NODE}.`));
    assert.ok(!maieuticAfter.includes("review:\n"), "a node no entry judged gets no review block");
    assert.equal(fieldValue(periagogicAfter, "stage"), "maieutic");
    assert.ok(maieuticAfter.includes("\n## Account\n\n### Frontier finding"), "'## Account' is created where absent");
  });

  test("the earliest stage wins, never forward of a stage another finding set", async () => {
    const rootDir = await freshFrontierFixture("finding-earliest-");
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        frontier: [
          { kind: "decomposition", nodes: [REVIEW_A], finding: "review-a answers two questions.", proposal: "Split it.", stages: { [REVIEW_A]: "maieutic" } },
          { kind: "supersession", nodes: [REVIEW_A], finding: "and its ground was superseded.", proposal: "Draw the ground again.", stages: { [REVIEW_A]: "periagogic" } },
        ],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    const after = await readFile(nodePath(rootDir, "review-a"), "utf8");
    assert.equal(fieldValue(after, "stage"), "periagogic", "the earliest stage any entry named");
    assert.ok(after.indexOf("Kind: decomposition.") < after.indexOf("Kind: supersession."), "the subsections land in the order 'frontier' lists them");
    assert.ok(after.includes("### Frontier survey, 2026-09-03"), "the judged node's own reading is recorded first");
    assert.ok(after.indexOf("### Frontier survey") < after.indexOf("### Frontier finding"));
  });

  test("an override excuses a finding's missing 'stages' entry for that id", async () => {
    const rootDir = await freshFrontierFixture("finding-override-");
    const pins = await pinsFor(rootDir);
    await applyReviews({
      rootDir,
      pins,
      input: surveyInput({ frontier: [{ kind: "vocabulary", nodes: [MAIEUTIC_NODE], finding: "x", proposal: "y", stages: {} }] }),
      replies: {},
      overrides: { [MAIEUTIC_NODE]: "periagogic" },
    });
    assert.equal(fieldValue(await readFile(nodePath(rootDir, "maieutic-node"), "utf8"), "stage"), "periagogic");
  });

  test("a ruled node with no stage is given one and opened when the finding names its stage, and refused when nothing does", async () => {
    const rootDir = await freshFrontierFixture("finding-answered-");
    const pins = await pinsFor(rootDir);
    const file = nodePath(rootDir, "answered-ratified");
    const before = await readFile(file, "utf8");
    assert.ok(!before.includes("stage:"), "fixture precondition: settled doctrine, no dialogue open");

    await assert.rejects(
      () => applyReviews({
        rootDir,
        pins,
        input: surveyInput({ frontier: [{ kind: "coverage", nodes: [ANSWERED_NODE], finding: "Cited for context only.", proposal: "Nothing.", stages: {} }] }),
        replies: {},
      }),
      /carries no stage, and nothing in this survey names one for it/,
    );
    assert.equal(await readFile(file, "utf8"), before, "nothing written on refusal");

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        frontier: [{
          kind: "contradiction",
          nodes: [ANSWERED_NODE, REVIEW_A],
          finding: "The ruled node and review-a's answer disagree on the same matter.",
          proposal: "Reopen the ruled node's ground.",
          stages: { [ANSWERED_NODE]: "periagogic" },
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.ok(result.report.includes(`${ANSWERED_NODE}: Frontier finding, no stage → periagogic`));

    const after = await readFile(file, "utf8");
    assert.equal(fieldValue(after, "stage"), "periagogic", "the stage line is inserted, opening the dialogue");
    const parsed = parseNode(after, { id: ANSWERED_NODE, graph: "main", slug: "answered-ratified", path: file });
    assert.equal(deriveClass(parsed, new Map([[ANSWERED_NODE, parsed]])), "ratified", "the ruling, and the class it confers, are untouched");
    assert.equal(parsed.moved, false, "and the pin on that ruling still matches");
  });
});

describe("apply.mjs: a merge finding is recorded as an option on the answer fact", () => {
  test("appended to an existing '### answer' with source review and the survey's date, the '#### <name>' subsection last", async () => {
    const rootDir = await freshFrontierFixture("merge-append-");
    const pins = await pinsFor(rootDir);
    const file = nodePath(rootDir, "review-b");
    const before = await parseAt(rootDir, "review-b", REVIEW_B);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        frontier: [{
          kind: "merge",
          nodes: [REVIEW_B, MAIEUTIC_NODE],
          finding: "maieutic-node is a new answer to review-b's question, not a new question.",
          proposal: "Fold maieutic-node into review-b as an option; review-b survives.",
          stages: { [REVIEW_B]: "maieutic" },
          options: [{
            node: REVIEW_B,
            name: "folded-from-maieutic",
            text: "Answer B as maieutic-node would: the same question, answered from the other end.",
          }],
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.ok(result.report.some((l) => l.includes("option 'folded-from-maieutic'")), `report does not name the option: ${result.report.join(" | ")}`);

    const after = await readFile(file, "utf8");
    const parsed = parseNode(after, { id: REVIEW_B, graph: "main", slug: "review-b", path: file });
    assert.deepEqual(parsed.answerFact.options.map((o) => [o.name, o.source, o.ref]), [
      ["standing", "ai", "2026-08-01"],
      ["narrower", "ai", "2026-08-01"],
      ["folded-from-maieutic", "review", "2026-09-03"],
    ], "the review's option is appended to the answer fact, after the node's own");
    assert.equal(
      parsed.answerFact.options.find((o) => o.name === "folded-from-maieutic").prose,
      "Answer B as maieutic-node would: the same question, answered from the other end.",
    );
    assert.equal(parsed.answerFact.recommends, "standing", "an option is added; what the fact recommends is not touched");
    assert.ok(after.indexOf("#### narrower") < after.indexOf("#### folded-from-maieutic"), "the subsections follow the options' order");
    assert.ok(after.includes("Recorded as an option on this node's answer fact: `folded-from-maieutic` (source review, 2026-09-03)."));
    const other = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");
    assert.ok(other.includes(`Recorded as an option on ${REVIEW_B}'s answer fact: \`folded-from-maieutic\``));

    // the survey's pin still names the recommendation as it stands: adding an
    // option moves neither the recommendation nor its hash.
    assert.equal(parsed.recommendationHash, before.recommendationHash);
    assert.equal(parsed.review.survey.of, parsed.recommendationHash);
    assert.equal(parsed.review.survey.of, deriveRecommendationHash(parsed), "and that is deriveRecommendationHash, not some other digest");
    assert.equal(parsed.surveyStale, false);
    assert.equal(parsed.standingHash, before.standingHash, "nor what stands");
  });

  test("on a node with no '## Facts' section: the section and its '### answer' subsection are created, before '## Account'", async () => {
    const rootDir = await freshFrontierFixture("merge-create-");
    const pins = await pinsFor(rootDir);
    const file = nodePath(rootDir, "review-a");
    assert.ok(!(await readFile(file, "utf8")).includes("## Facts"), "fixture precondition: review-a states no fact in prose yet");

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        frontier: [{
          kind: "merge",
          nodes: [REVIEW_A],
          finding: "The author's words on review-a are a new answer to review-a's own question.",
          proposal: "Record them as an option on review-a.",
          stages: { [REVIEW_A]: "maieutic" },
          options: [{ node: REVIEW_A, name: "the-authors-own", text: "Answer A as the author's words already answer it." }],
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const after = await readFile(file, "utf8");
    const parsed = parseNode(after, { id: REVIEW_A, graph: "main", slug: "review-a", path: file });
    assert.deepEqual(parsed.answerFact.options.map((o) => o.name), ["standing", "the-authors-own"]);
    assert.equal(parsed.answerFact.options[1].prose, "Answer A as the author's words already answer it.");
    assert.ok(after.indexOf("\n## Facts\n") < after.indexOf("\n## Account\n"), "'## Facts' is inserted before '## Account'");
    assert.ok(after.includes("### answer\n\n#### the-authors-own\n"));
    assert.ok(after.includes('      - name: the-authors-own\n        source: review\n        ref: "2026-09-03"\n'), "written in the file's own YAML style");
  });

  test("a name already on the node's answer fact is skipped with a note; the finding is still recorded", async () => {
    const rootDir = await freshFrontierFixture("merge-dup-");
    const pins = await pinsFor(rootDir);
    const file = nodePath(rootDir, "review-b");

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        frontier: [{
          kind: "merge",
          nodes: [REVIEW_B],
          finding: "The same narrowing is on the table twice.",
          proposal: "Record it as an option on review-b.",
          stages: {},
          options: [{ node: REVIEW_B, name: "narrower", text: "A second wording of the option already listed." }],
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.ok(
      result.report.includes(`${REVIEW_B}: option 'narrower' is already on this node's answer fact; skipped (the finding is still recorded)`),
      `report does not carry the skip note: ${result.report.join(" | ")}`,
    );

    const after = await readFile(file, "utf8");
    const parsed = parseNode(after, { id: REVIEW_B, graph: "main", slug: "review-b", path: file });
    assert.deepEqual(parsed.answerFact.options.map((o) => o.name), ["standing", "narrower"], "the list is not doubled");
    assert.equal((after.match(/#### narrower/g) || []).length, 1, "the subsection is not doubled");
    assert.ok(after.includes("### Frontier finding, 2026-09-03"), "the finding is still recorded");
  });

  test("a merge finding with no option, an option on an unnamed node, and a reserved name are each refused", async () => {
    const rootDir = await freshFrontierFixture("merge-refuse-");
    const pins = await pinsFor(rootDir);
    const before = await readFile(nodePath(rootDir, "review-b"), "utf8");

    await assert.rejects(
      () => applyReviews({ rootDir, pins, input: surveyInput({ frontier: [{ kind: "merge", nodes: [REVIEW_B], finding: "x", proposal: "y", stages: {} }] }), replies: {} }),
      /a 'merge' finding must propose at least one option/,
    );
    await assert.rejects(
      () => applyReviews({
        rootDir,
        pins,
        input: surveyInput({
          frontier: [{ kind: "redundancy", nodes: [REVIEW_B], finding: "x", proposal: "y", stages: {}, options: [{ node: REVIEW_A, name: "elsewhere", text: "z" }] }],
        }),
        replies: {},
      }),
      new RegExp(`proposes an option on ${escapeRe(REVIEW_A)}, which this finding does not name in 'nodes'`),
    );
    await assert.rejects(
      () => applyReviews({
        rootDir,
        pins,
        input: surveyInput({
          frontier: [{ kind: "merge", nodes: [REVIEW_B], finding: "x", proposal: "y", stages: {}, options: [{ node: REVIEW_B, name: "standing", text: "z" }] }],
        }),
        replies: {},
      }),
      /'name' must be a lowercase slug and never 'standing'/,
    );
    assert.equal(await readFile(nodePath(rootDir, "review-b"), "utf8"), before, "nothing written on any refusal");
  });
});

// --------------------------------------------------------------------------
// apply.mjs: subtree_divergences (frontier-consistency.md
// validation 13, alignment-order): a tangle between two unruled subtrees
// standing under different options of one ancestor's answer fact, written on
// the leaves and never on the ancestor.
// --------------------------------------------------------------------------

describe("apply.mjs: subtree_divergences", () => {
  test("writes 'depends' on the leaves and never on the ancestor; the account subsections land on the ancestor and on each leaf with the right keeps/discards; an option proposed by this same run satisfies the option-exists check", async () => {
    const rootDir = await freshFrontierFixture("divergence-basic-");
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        // ruling-a's answer fact already lists 'whole-thing'; 'keep-part' is
        // new, proposed by this same run's own frontier -- the divergence
        // below stands one side on each, so it exercises both ways an option
        // can be "on the table" (frontier-consistency's own phrase).
        frontier: [{
          kind: "redundancy",
          nodes: [RULING_A],
          finding: "A second, narrower option belongs on ruling-a's table beside 'whole-thing'.",
          proposal: "Add it as an option on ruling-a.",
          stages: {},
          options: [{ node: RULING_A, name: "keep-part", text: "Keep only the part the author actually ruled on; split the rest into a node of its own." }],
        }],
        subtree_divergences: [{
          ancestor: RULING_A,
          sides: { "whole-thing": [MAIEUTIC_NODE], "keep-part": [PERIAGOGIC_NODE] },
          finding: "maieutic-node stands under 'whole-thing' and periagogic-node stands under 'keep-part'; a ruling for one discards the ground the other rests on.",
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const rulingAAfter = await readFile(nodePath(rootDir, "ruling-a"), "utf8");
    const maieuticAfter = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");
    const periagogicAfter = await readFile(nodePath(rootDir, "periagogic-node"), "utf8");

    assert.ok(!rulingAAfter.includes("depends:"), "the ancestor never gains a 'depends' field");
    assert.equal(fieldValue(rulingAAfter, "stage"), "ruling", "a subtree divergence never touches stage");

    const maieuticParsed = parseNode(maieuticAfter, { id: MAIEUTIC_NODE, graph: "main", slug: "maieutic-node", path: nodePath(rootDir, "maieutic-node") });
    const periagogicParsed = parseNode(periagogicAfter, { id: PERIAGOGIC_NODE, graph: "main", slug: "periagogic-node", path: nodePath(rootDir, "periagogic-node") });
    assert.ok(maieuticParsed.depends.some((d) => d.id === RULING_A && d.option === "whole-thing"));
    assert.deepEqual(periagogicParsed.depends, [{ id: RULING_A, option: "keep-part" }]);

    assert.ok(rulingAAfter.includes("### Subtree divergence, 2026-09-03"));
    assert.ok(rulingAAfter.includes(`\`whole-thing\` keeps ${MAIEUTIC_NODE}; discards ${PERIAGOGIC_NODE}.`));
    assert.ok(rulingAAfter.includes(`\`keep-part\` keeps ${PERIAGOGIC_NODE}; discards ${MAIEUTIC_NODE}.`));
    assert.ok(maieuticAfter.includes(`Stands under ${RULING_A}, option \`whole-thing\`.`));
    assert.ok(periagogicAfter.includes(`Stands under ${RULING_A}, option \`keep-part\`.`));

    assert.ok(
      result.report.some((l) => l === `subtree divergence on ${RULING_A}: whole-thing 1, keep-part 1`),
      `report is missing the per-entry summary line: ${result.report.join(" | ")}`,
    );
  });

  test("an unknown option name, a ruled leaf, and a leaf equal to its own ancestor are each refused; the run writes nothing", async () => {
    const rootDir = await freshFrontierFixture("divergence-refuse-basic-");
    const pins = await pinsFor(rootDir);
    const rulingABefore = await readFile(nodePath(rootDir, "ruling-a"), "utf8");
    const maieuticBefore = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");

    await assert.rejects(
      () => applyReviews({ rootDir, pins, input: surveyInput({ subtree_divergences: [{ ancestor: RULING_A, sides: { "nonexistent-alt": [MAIEUTIC_NODE] }, finding: "x" }] }), replies: {} }),
      /'nonexistent-alt' is not an option on .*ruling-a's answer fact \(not listed, and not added to it by this run's 'frontier'\)/,
    );
    await assert.rejects(
      () => applyReviews({ rootDir, pins, input: surveyInput({ subtree_divergences: [{ ancestor: RULING_A, sides: { "whole-thing": [ANSWERED_NODE] }, finding: "x" }] }), replies: {} }),
      new RegExp(`names ${escapeRe(ANSWERED_NODE)}, which is answered; a subtree divergence stands on unruled nodes`),
    );
    await assert.rejects(
      () => applyReviews({ rootDir, pins, input: surveyInput({ subtree_divergences: [{ ancestor: RULING_A, sides: { "whole-thing": [RULING_A] }, finding: "x" }] }), replies: {} }),
      new RegExp(`names ${escapeRe(RULING_A)}, which is this entry's own ancestor`),
    );

    assert.equal(await readFile(nodePath(rootDir, "ruling-a"), "utf8"), rulingABefore, "nothing written on any refusal");
    assert.equal(await readFile(nodePath(rootDir, "maieutic-node"), "utf8"), maieuticBefore, "nothing written on any refusal");
  });

  test("a node standing under two options of the same ancestor is refused; the run writes nothing", async () => {
    const rootDir = await freshFrontierFixture("divergence-refuse-twosides-");
    const pins = await pinsFor(rootDir);
    const before = await readFile(nodePath(rootDir, "periagogic-node"), "utf8");

    await assert.rejects(
      () => applyReviews({
        rootDir,
        pins,
        input: surveyInput({
          frontier: [{
            kind: "decomposition",
            nodes: [REVIEW_LOW],
            finding: "review-low's ground splits two ways.",
            proposal: "Put both ways on the table as options.",
            stages: {},
            options: [
              { node: REVIEW_LOW, name: "alt-x", text: "The first way." },
              { node: REVIEW_LOW, name: "alt-y", text: "The second way." },
            ],
          }],
          subtree_divergences: [{
            ancestor: REVIEW_LOW,
            sides: { "alt-x": [PERIAGOGIC_NODE], "alt-y": [PERIAGOGIC_NODE] },
            finding: "periagogic-node is cited under both, which cannot be right.",
          }],
        }),
        replies: {},
      }),
      new RegExp(`${escapeRe(PERIAGOGIC_NODE)} stands under two options \\('alt-x' and 'alt-y'\\) of the same ancestor`),
    );
    assert.equal(await readFile(nodePath(rootDir, "periagogic-node"), "utf8"), before, "nothing written on refusal");
  });

  test("a leaf that already depends on the ancestor under a different option is refused as a conflict, not overwritten", async () => {
    const rootDir = await freshFrontierFixture("divergence-refuse-conflict-");
    const maieuticFile = nodePath(rootDir, "maieutic-node");
    const seeded = (await readFile(maieuticFile, "utf8")).replace("depends:\n", `depends:\n  - ${RULING_A}#whole-thing\n`);
    assert.ok(seeded.includes(`  - ${RULING_A}#whole-thing`), "fixture edit precondition: the seed landed");
    await writeFile(maieuticFile, seeded);
    const pins = await pinsFor(rootDir);

    await assert.rejects(
      () => applyReviews({
        rootDir,
        pins,
        input: surveyInput({
          frontier: [{
            kind: "redundancy",
            nodes: [RULING_A],
            finding: "A narrower option belongs on the table too.",
            proposal: "Add it as an option on ruling-a.",
            stages: {},
            options: [{ node: RULING_A, name: "keep-part", text: "Keep only the part the author actually ruled on." }],
          }],
          subtree_divergences: [{
            ancestor: RULING_A,
            sides: { "keep-part": [MAIEUTIC_NODE] },
            finding: "maieutic-node actually stands under 'keep-part', not 'whole-thing'.",
          }],
        }),
        replies: {},
      }),
      new RegExp(`${escapeRe(MAIEUTIC_NODE)} already depends on ${escapeRe(RULING_A)}#whole-thing, which conflicts with side 'keep-part'; not overwritten, refused`),
    );
    assert.equal(await readFile(maieuticFile, "utf8"), seeded, "nothing written on refusal");
  });

  test("a node that already carries exactly the entry a divergence would write is skipped and noted; the rest of the entry still applies", async () => {
    const rootDir = await freshFrontierFixture("divergence-skip-");
    const maieuticFile = nodePath(rootDir, "maieutic-node");
    const seeded = (await readFile(maieuticFile, "utf8")).replace("depends:\n", `depends:\n  - ${RULING_A}#whole-thing\n`);
    await writeFile(maieuticFile, seeded);
    const pins = await pinsFor(rootDir);

    const result = await applyReviews({
      rootDir,
      pins,
      input: surveyInput({
        subtree_divergences: [{
          ancestor: RULING_A,
          sides: { "whole-thing": [MAIEUTIC_NODE] },
          finding: "maieutic-node stands under 'whole-thing', confirmed on a second look.",
        }],
      }),
      replies: {},
    });
    assert.equal(result.validation.ok, true, result.validation.message);

    const after = await readFile(maieuticFile, "utf8");
    const parsed = parseNode(after, { id: MAIEUTIC_NODE, graph: "main", slug: "maieutic-node", path: maieuticFile });
    assert.equal(parsed.depends.filter((d) => d.id === RULING_A && d.option === "whole-thing").length, 1, "the entry is not duplicated");
    assert.ok(after.includes("### Subtree divergence, 2026-09-03"), "the divergence is still recorded on the leaf");
    assert.ok(
      result.report.some((l) => l === `subtree divergence on ${RULING_A}: whole-thing 1; already present, skipped: ${MAIEUTIC_NODE}`),
      `report does not carry the skip note: ${result.report.join(" | ")}`,
    );
  });
});

describe("apply.mjs: a reading's heading is an address", () => {
  test("the pin distinguishes two readings of two answers, and a roman suffix keeps a same-pin same-day pair addressable", async () => {
    const rootDir = await freshFixture("heading-");
    const file = reviewNodePath(rootDir);
    const input = {
      scope: "draft",
      id: REVIEW_NODE,
      verdict: "forward",
      findings: ["Answer: read once."],
      counter_argument: null,
      strength: "none",
    };

    // The stage is held at 'review' across both applies: what is under test
    // is the heading, and a forward would otherwise move the node to 'ruling'
    // and the second apply would refuse it.
    const overrides = { [REVIEW_NODE]: "review" };
    const first = await applyReviews({ rootDir, input, replies: {}, overrides, date: DATE });
    assert.equal(first.validation.ok, true, JSON.stringify(first.validation));
    const afterFirst = await readFile(file, "utf8");
    const pin = /^  of: ([0-9a-f]{40})$/m.exec(afterFirst);
    assert.ok(pin, "the review block pins the recommendation");
    const head = `### Clean-context review, ${DATE}, of ${pin[1].slice(0, 8)}`;
    assert.ok(afterFirst.includes(`${head}\n`), `first heading missing: ${head}`);

    // The same answer read again on the same day: the cap forbids it and the
    // caller warns, but the heading must still name one section and not two.
    const { result: second } = await captureStderr(() => applyReviews({
      rootDir, input: { ...input, findings: ["Answer: read twice."] }, replies: {}, overrides, date: DATE,
    }));
    assert.equal(second.validation.ok, true, JSON.stringify(second.validation));
    const afterSecond = await readFile(file, "utf8");
    assert.ok(afterSecond.includes(`${head}\n`), "the first heading survives untouched");
    assert.ok(afterSecond.includes(`${head} (ii)\n`), `the second heading is not disambiguated:\n${afterSecond.slice(-600)}`);
    assert.equal(afterSecond.split(`${head}\n`).length - 1, 1, "exactly one section carries the bare heading");
  });
});
