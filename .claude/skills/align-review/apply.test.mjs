// node --test .claude/skills/align-review/apply.test.mjs
//
// Exercises apply.mjs against copies of two fixture graphs -- never against
// the live disposition/ graph (see SKILL.md: "Never edit disposition/"):
// packages/disposition/fixtures/valid-dialogue/ for the old per-node shape
// (kept so --fields-only, and JSON files shaped the old way, still work),
// and fixtures/frontier/ beside this file for the batch shape
// clean-context-review.md and frontier-consistency.md describe -- the nodes
// at `stage: review`, judged against the full graph.

import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { applyReviews } from "./apply.mjs";
import { parseNode } from "../../../packages/disposition/read.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const FIXTURE_SRC = path.join(REPO_ROOT, "packages/disposition/fixtures/valid-dialogue");
const FRONTIER_FIXTURE_SRC = path.join(HERE, "fixtures/frontier");
const APPLY_MJS = path.join(HERE, "apply.mjs");

// Named by the brief: test against copies under this job's scratch dir.
const TMP_BASE = "/home/n8/.claude/jobs/55639327/tmp/align-review/apply-check";

const tmpDirs = [];
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A fresh copy of the old per-node fixture graph: `dir` is a valid rootDir. */
async function freshFixture(prefix) {
  await mkdir(TMP_BASE, { recursive: true });
  const dir = await mkdtemp(path.join(TMP_BASE, prefix));
  tmpDirs.push(dir);
  await cp(FIXTURE_SRC, dir, { recursive: true });
  return dir;
}

async function freshFixtureScratch(prefix) {
  await mkdir(TMP_BASE, { recursive: true });
  const dir = await mkdtemp(path.join(TMP_BASE, prefix));
  tmpDirs.push(dir);
  await cp(FIXTURE_SRC, path.join(dir, "disposition"), { recursive: true });
  return dir;
}

/** A fresh copy of the batch fixture graph. */
async function freshFrontierFixture(prefix) {
  await mkdir(TMP_BASE, { recursive: true });
  const dir = await mkdtemp(path.join(TMP_BASE, prefix));
  tmpDirs.push(dir);
  await cp(FRONTIER_FIXTURE_SRC, dir, { recursive: true });
  return dir;
}

const REVIEW_NODE = "example.test/main/review-node";
const RULING_NODE = "example.test/main/ruling-node";
const ANSWERED_WITH_STAGE = "example.test/main/answered-with-stage";
const DATE = "2026-09-03";

async function reviewNodePath(rootDir) {
  return path.join(rootDir, "main/review-node.md");
}
async function rulingNodePath(rootDir) {
  return path.join(rootDir, "main/ruling-node.md");
}
async function answeredWithStagePath(rootDir) {
  return path.join(rootDir, "main/answered-with-stage.md");
}

function reviewBlockOf(text) {
  const m = text.match(/^review:\n((?:^[ \t].*\n?)*)/m);
  return m ? m[0] : null;
}
function fieldValue(text, key) {
  const m = text.match(new RegExp(`^\\s*${key}:\\s*(.*)$`, "m"));
  return m ? m[1].trim() : null;
}

describe("apply.mjs: forward", () => {
  test("appends the subsection to '## Account', sets stage ruling, writes the review block, keeps other lines byte for byte", async () => {
    const rootDir = await freshFixture("fwd-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");

    const wantHash = parseNode(before, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file }).draftHash;

    const entry = {
      id: REVIEW_NODE,
      verdict: "forward",
      findings: ["Answer: needs a caveat about X."],
      counter_argument: "A boldness gate could miss low-boldness drafts that are wrong for other reasons.",
      strength: "moderate",
      facts_check: "Delegated and high boldness both look right for this draft.",
    };
    const result = await applyReviews({
      rootDir,
      reviewDir,
      entries: [entry],
      replies: { [REVIEW_NODE]: "Accepted: the gate stays proposal-only for now." },
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/review-node: forward, review → ruling"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.notEqual(afterText, before);

    // Frontmatter: stage flips, recommendation untouched, review block new.
    assert.equal(fieldValue(afterText, "stage"), "ruling");
    assert.ok(afterText.includes("recommendation:\n  adopts: standing\n  class: delegated\n  boldness: high\n"), "recommendation kept byte for byte");
    const block = reviewBlockOf(afterText);
    assert.ok(block, "review block present");
    assert.equal(fieldValue(block, "verdict"), "forward");
    assert.equal(fieldValue(block, "strength"), "moderate");
    assert.equal(fieldValue(block, "date"), DATE);
    assert.equal(fieldValue(block, "of"), wantHash);

    // Untouched lines: question and the Disposition paragraph survive verbatim.
    assert.ok(afterText.includes("question: Should boldness gate which drafts need a second reviewer?\n"));
    assert.ok(afterText.includes("The author asked whether a high-boldness draft needs a second pass before\nthe ruling."));

    // The appended subsection, exactly.
    const expectedSubsection = [
      "### Clean-context review, 2026-09-03",
      "",
      "Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.",
      "",
      "Findings:",
      "",
      "- Answer: needs a caveat about X.",
      "",
      "On the three facts: Delegated and high boldness both look right for this draft.",
      "",
      "Strongest counter-argument (moderate): A boldness gate could miss low-boldness drafts that are wrong for other reasons.",
      "",
      "The session's reply: Accepted: the gate stays proposal-only for now.",
      "",
    ].join("\n");
    assert.ok(afterText.endsWith(expectedSubsection), `unexpected tail:\n${afterText.slice(-400)}`);
    // The pre-existing Account text is kept, ahead of the new subsection.
    assert.ok(afterText.includes("'## Recommendation' fence.\n\n### Clean-context review"));
    assert.ok(!afterText.includes("## Proposal"), "the section is named '## Account' now");
  });
});

describe("apply.mjs: kickback", () => {
  test("sets the kickback stage, records a null counter-argument as 'no strong', omits absent fields", async () => {
    const rootDir = await freshFixture("kick-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await reviewNodePath(rootDir);

    const entry = {
      id: REVIEW_NODE,
      verdict: "kickback",
      kickback_stage: "maieutic",
      findings: ["Answer: the disposition is ambiguous about who runs the second pass."],
      counter_argument: null,
      strength: "none",
      facts_check: null,
    };
    const result = await applyReviews({ rootDir, reviewDir, entries: [entry], replies: {}, date: DATE });

    assert.deepEqual(result.report, ["example.test/main/review-node: kickback, review → maieutic"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.equal(fieldValue(afterText, "stage"), "maieutic");
    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "verdict"), "kickback");
    assert.equal(fieldValue(block, "strength"), "none");

    assert.ok(afterText.includes("Verdict: kicked back to the maieutic stage."));
    assert.ok(afterText.includes("The review found no strong counter-argument."));
    assert.ok(!afterText.includes("On the three facts:"), "facts_check omitted when null");
    assert.ok(!afterText.includes("The session's reply:"), "reply line omitted when none given");
  });
});

describe("apply.mjs: override", () => {
  test("wins over the verdict's stage; the appended prose still narrates the reviewer's own verdict; creates '## Account' when absent", async () => {
    const rootDir = await freshFixture("ovr-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await answeredWithStagePath(rootDir);
    const before = await readFile(file, "utf8");
    assert.ok(!before.includes("## Account"), "fixture precondition: no Account section yet");

    const entry = {
      id: ANSWERED_WITH_STAGE,
      verdict: "kickback",
      kickback_stage: "maieutic",
      findings: ["Answer: unclear whether a reopened ratified node keeps its old authority stamp."],
      counter_argument: "A ratified answer reopened for review might mislead a reader into thinking it is still final.",
      strength: "weak",
      facts_check: "Ratified/low is right; nothing here changes the stamp.",
    };
    const result = await applyReviews({
      rootDir,
      reviewDir,
      entries: [entry],
      replies: {},
      overrides: { [ANSWERED_WITH_STAGE]: "periagogic" },
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/answered-with-stage: kickback, review → periagogic"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    assert.equal(fieldValue(afterText, "stage"), "periagogic", "override wins over kickback_stage");
    assert.ok(afterText.includes("Verdict: kicked back to the maieutic stage."), "prose still reports the reviewer's own verdict");
    assert.ok(afterText.includes("\n## Account\n\n### Clean-context review"), "Account section created at the end");
    // authority stamp untouched
    assert.ok(afterText.includes("authority:\n  class: ratified\n  by: Fixture Author\n  date: 2026-09-03\n"));
  });

  test("also lifts the 'stage must be review' precondition, letting a ruling-stage node through, and writes a fresh review block wholesale", async () => {
    const rootDir = await freshFixture("ovr-ruling-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await rulingNodePath(rootDir);
    const before = await readFile(file, "utf8");
    const draftFenceBefore = before.match(/```markdown\n([\s\S]*?)\n```/)[1];

    const entry = {
      id: RULING_NODE,
      verdict: "forward",
      findings: ["Rationale: sound, confirmed on a second look."],
      counter_argument: "The fixture's own record is thin, so 'sound' rests on little evidence.",
      strength: "strong",
      facts_check: null,
    };
    const result = await applyReviews({
      rootDir,
      reviewDir,
      entries: [entry],
      replies: { [RULING_NODE]: "The record is small on purpose; accepted regardless." },
      overrides: { [RULING_NODE]: "ruling" },
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/ruling-node: forward, ruling → ruling"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    const draftFenceAfter = afterText.match(/```markdown\n([\s\S]*?)\n```/)[1];
    assert.equal(draftFenceAfter, draftFenceBefore, "the '## Recommendation' fence is never touched");

    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "verdict"), "forward");
    assert.equal(fieldValue(block, "strength"), "strong");
    assert.deepEqual(Object.keys(YAMLish(block)), ["verdict", "strength", "date", "of"], "review block is exactly these four keys");

    // draft hash is independent of stage/recommendation/review and of the
    // account text, so it must be unchanged by this edit.
    const oldHash = fieldValue(reviewBlockOf(before), "of");
    assert.equal(fieldValue(block, "of"), oldHash);
  });
});

/** Minimal indentation-based key lister for a `review:\n  k: v\n...` block. */
function YAMLish(block) {
  const out = {};
  for (const line of block.split("\n").slice(1)) {
    const m = line.match(/^\s{2}([a-z_]+):/);
    if (m) out[m[1]] = true;
  }
  return out;
}

describe("apply.mjs: amendment", () => {
  test("appends 'of the amendment' subsection and touches no frontmatter at all", async () => {
    const rootDir = await freshFixture("amend-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await rulingNodePath(rootDir);
    const before = await readFile(file, "utf8");
    const fmBefore = before.slice(0, before.indexOf("\n## "));

    const entry = {
      id: RULING_NODE,
      scope: "amendment",
      verdict: "forward",
      findings: ["Answer, amended sentence: still reads as intended after the edit."],
      counter_argument: null,
      strength: "none",
      facts_check: "No change to the three facts.",
    };
    const result = await applyReviews({
      rootDir,
      reviewDir,
      entries: [entry],
      replies: { [RULING_NODE]: "Accepted in full." },
      date: DATE,
    });

    assert.deepEqual(result.report, ["example.test/main/ruling-node: forward, ruling → ruling"]);
    assert.equal(result.validation.ok, true);

    const afterText = await readFile(file, "utf8");
    const fmAfter = afterText.slice(0, afterText.indexOf("\n## "));
    assert.equal(fmAfter, fmBefore, "frontmatter, including the existing review: block, is untouched by an amendment entry");

    assert.ok(afterText.includes("Ratify the alternative above.\n\n### Clean-context review of the amendment, 2026-09-03"));
    assert.ok(
      afterText.includes(
        "Read in clean context by a subagent given the node, its ancestry, the author's words, and the amendment named in the brief, and nothing of the sitting. Verdict: forward to the author's ruling.",
      ),
    );
    assert.ok(afterText.includes("On the three facts: No change to the three facts."));
    assert.ok(afterText.includes("The session's reply: Accepted in full."));
  });
});

describe("apply.mjs: --fields-only", () => {
  test("writes only the review block and the stage, leaving an already-hand-applied Account untouched, and computes the same hash the real reader would", async () => {
    const rootDir = await freshFixture("fields-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await reviewNodePath(rootDir);
    const original = await readFile(file, "utf8");

    // The hash a fully-valid reading of the ORIGINAL text produces (stage:
    // review parses cleanly) is the independent oracle this test checks
    // apply.mjs's unvalidated-graph fallback against.
    const wantHash = parseNode(original, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file }).draftHash;

    // Simulate a node hand-advanced to `stage: ruling` with its review
    // applied by hand before apply.mjs existed: a '### Clean-context
    // review' subsection in the Account, but no `review:` frontmatter.
    // This file, read by itself, no longer validates (dialogue.md's "stage
    // ruling requires a 'review' with verdict forward"), which is the
    // point of the test.
    const seeded = `${original.slice(0, original.indexOf("## Account")).replace("stage: review", "stage: ruling")}${[
      "## Account",
      "",
      "### Clean-context review, 2026-09-01",
      "",
      "Read in clean context by a subagent given the batch at the review stage and the full graph as its context, and nothing of the sitting. Verdict: forward to the author's ruling.",
      "",
      "Findings:",
      "",
      "- Applied by hand before apply.mjs existed.",
      "",
      "Strongest counter-argument (weak): None worth the author's time.",
      "",
    ].join("\n")}`;
    assert.ok(seeded.includes("stage: ruling"), "fixture edit precondition: the stage replacement matched");
    await writeFile(file, seeded);
    assert.throws(() => parseNode(seeded, { id: REVIEW_NODE, graph: "main", slug: "review-node", path: file }), /stage ruling requires a 'review' with verdict forward/, "precondition: the seeded file does not validate standalone");

    const entry = {
      id: REVIEW_NODE,
      verdict: "forward",
      findings: ["Ignored under --fields-only."],
      counter_argument: "Ignored under --fields-only.",
      strength: "moderate",
      facts_check: "Ignored under --fields-only.",
    };
    const result = await applyReviews({ rootDir, reviewDir, entries: [entry], replies: {}, date: DATE, fieldsOnly: true });

    assert.deepEqual(result.report, ["example.test/main/review-node: forward, ruling → ruling"]);
    assert.equal(result.validation.ok, true, "the one field-completed node now validates on its own");

    const afterText = await readFile(file, "utf8");
    const accountAfter = afterText.slice(afterText.indexOf("## Account"));
    const accountBefore = seeded.slice(seeded.indexOf("## Account"));
    assert.equal(accountAfter, accountBefore, "the Account (already hand-applied) is never touched under --fields-only");

    assert.equal(fieldValue(afterText, "stage"), "ruling");
    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "verdict"), "forward");
    assert.equal(fieldValue(block, "of"), wantHash, "unvalidated-path hash matches the real reader's hash for the same text");
  });

  test("refuses a node with no existing 'Clean-context review' subsection", async () => {
    const rootDir = await freshFixture("fields-refuse-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await rulingNodePath(rootDir);
    const before = await readFile(file, "utf8");
    assert.ok(!before.includes("Clean-context review"), "fixture precondition: ruling-node has no review subsection yet");

    const entry = { id: RULING_NODE, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null };
    await assert.rejects(
      () => applyReviews({ rootDir, reviewDir, entries: [entry], replies: {}, date: DATE, fieldsOnly: true }),
      /--fields-only requires an existing '### Clean-context review' subsection/,
    );
    assert.equal(await readFile(file, "utf8"), before, "nothing written on refusal");
  });
});

describe("apply.mjs: refusals write nothing", () => {
  test("a strong finding with no reply is refused, naming the id", async () => {
    const rootDir = await freshFixture("strong-noreply-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");

    const entry = { id: REVIEW_NODE, verdict: "forward", findings: ["x"], counter_argument: "y", strength: "strong", facts_check: null };
    await assert.rejects(
      () => applyReviews({ rootDir, reviewDir, entries: [entry], replies: {}, date: DATE }),
      new RegExp(`${escapeRe(REVIEW_NODE)}: strength 'strong' requires a reply`),
    );
    assert.equal(await readFile(file, "utf8"), before);
  });

  test("a node entry on a non-review node with no override is refused", async () => {
    const rootDir = await freshFixture("wrong-stage-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await rulingNodePath(rootDir);
    const before = await readFile(file, "utf8");

    const entry = { id: RULING_NODE, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null };
    await assert.rejects(
      () => applyReviews({ rootDir, reviewDir, entries: [entry], replies: {}, date: DATE }),
      /requires stage 'review' \(or an override\), found 'ruling'/,
    );
    assert.equal(await readFile(file, "utf8"), before);
  });

  test("a batch mixing one bad entry with one good entry writes neither", async () => {
    const rootDir = await freshFixture("batch-refuse-");
    const reviewDir = path.join(rootDir, "_review");
    const goodFile = await reviewNodePath(rootDir);
    const badFile = await rulingNodePath(rootDir);
    const goodBefore = await readFile(goodFile, "utf8");
    const badBefore = await readFile(badFile, "utf8");

    const entries = [
      { id: REVIEW_NODE, verdict: "forward", findings: ["fine"], counter_argument: null, strength: "none", facts_check: null },
      { id: RULING_NODE, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null }, // wrong stage, no override
    ];
    await assert.rejects(() => applyReviews({ rootDir, reviewDir, entries, replies: {}, date: DATE }));
    assert.equal(await readFile(goodFile, "utf8"), goodBefore, "the good entry in the same run is not written either");
    assert.equal(await readFile(badFile, "utf8"), badBefore);
  });
});

describe("apply.mjs: --dry (old shape)", () => {
  test("reports the plan and writes nothing", async () => {
    const rootDir = await freshFixture("dry-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");

    const entry = { id: REVIEW_NODE, verdict: "forward", findings: ["x"], counter_argument: null, strength: "none", facts_check: null };
    const result = await applyReviews({ rootDir, reviewDir, entries: [entry], replies: {}, date: DATE, dry: true });

    assert.deepEqual(result.report, ["example.test/main/review-node: forward, review → ruling"]);
    assert.equal(result.validation, null, "--dry never runs the post-write readGraph check");
    assert.equal(await readFile(file, "utf8"), before, "nothing written");
  });
});

describe("apply.mjs: CLI (old shape -- a JSON list file, so batch-detection falls through)", () => {
  test("the real command line: --dry over one JSON file, exit 0, exact stdout", async () => {
    const scratch = await freshFixtureScratch("cli-");
    const rootDir = path.join(scratch, "disposition");

    const jsonFile = path.join(scratch, "entry.json");
    await writeFile(
      jsonFile,
      JSON.stringify([{ id: REVIEW_NODE, verdict: "forward", findings: ["x"], counter_argument: null, strength: "none", facts_check: null }]),
    );

    const stdout = execFileSync(process.execPath, [APPLY_MJS, jsonFile, "--date", DATE, "--dry"], { cwd: scratch, encoding: "utf8" });
    assert.equal(stdout, "example.test/main/review-node: forward, review → ruling\n(dry run: 1 node(s) planned, nothing written)\n");
    assert.equal(await readFile(path.join(rootDir, "main/review-node.md"), "utf8"), await readFile(path.join(FIXTURE_SRC, "main/review-node.md"), "utf8"));
  });

  test("a refusal exits non-zero and prints the reason on stderr", async () => {
    const scratch = await freshFixtureScratch("cli-refuse-");
    const jsonFile = path.join(scratch, "entry.json");
    await writeFile(jsonFile, JSON.stringify([{ id: RULING_NODE, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null }]));

    assert.throws(() => execFileSync(process.execPath, [APPLY_MJS, jsonFile, "--date", DATE, "--dry"], { cwd: scratch, encoding: "utf8" }));
  });
});

// --------------------------------------------------------------------------
// apply.mjs: the batch shape (clean-context-review.md, frontier-consistency.md,
// SKILL.md §4): the nodes at `stage: review` receive verdicts; a finding may
// name any node in the graph, and may propose an alternative on one.
// --------------------------------------------------------------------------

const MAIEUTIC_NODE = "align-review.test/main/maieutic-node";
const PERIAGOGIC_NODE = "align-review.test/main/periagogic-node";
const REVIEW_A = "align-review.test/main/review-a";
const REVIEW_B = "align-review.test/main/review-b";
const RULING_A = "align-review.test/main/ruling-a";
const ANSWERED_NODE = "align-review.test/main/answered-ratified";
const BATCH_DATE = "2026-09-03";

function nodePath(rootDir, slug) {
  return path.join(rootDir, "main", `${slug}.md`);
}

function fullReadIds() {
  return [MAIEUTIC_NODE, PERIAGOGIC_NODE, REVIEW_A, REVIEW_B, RULING_A, ANSWERED_NODE];
}
/** The batch: the nodes at `stage: review`, and no other. */
function fullNodeEntries() {
  return [
    { id: REVIEW_A, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null },
    { id: REVIEW_B, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null },
  ];
}

describe("apply.mjs: batch shape", () => {
  test("verdicts on the batch, a finding across two non-batch nodes, a finding on a ruling-stage node, the earliest-stage rule against a forward, and an override -- end to end", async () => {
    const rootDir = await freshFrontierFixture("batch-e2e-");
    const reviewDir = path.join(rootDir, "_review");

    const reviewAFile = nodePath(rootDir, "review-a");
    const reviewBFile = nodePath(rootDir, "review-b");
    const rulingAFile = nodePath(rootDir, "ruling-a");
    const maieuticFile = nodePath(rootDir, "maieutic-node");
    const periagogicFile = nodePath(rootDir, "periagogic-node");

    const reviewABefore = await readFile(reviewAFile, "utf8");
    const wantHashReviewA = parseNode(reviewABefore, { id: REVIEW_A, graph: "main", slug: "review-a", path: reviewAFile }).draftHash;
    const rulingABefore = await readFile(rulingAFile, "utf8");

    const batch = {
      date: BATCH_DATE,
      read: fullReadIds(),
      nodes: [
        { id: REVIEW_A, verdict: "forward", findings: ["Answer: sound as drafted."], counter_argument: "Could be read more narrowly.", strength: "moderate", facts_check: "Boldness moderate looks right." },
        { id: REVIEW_B, verdict: "kickback", kickback_stage: "maieutic", findings: ["Answer: ambiguous about the second case."], counter_argument: null, strength: "none", facts_check: null },
      ],
      frontier: [
        {
          kind: "placement",
          nodes: [MAIEUTIC_NODE, PERIAGOGIC_NODE],
          finding: "These two overlap in scope and should trade stages.",
          proposal: "Swap: settle the ground under periagogic-node's question, redraft maieutic-node's answer.",
          stages: { [MAIEUTIC_NODE]: "periagogic", [PERIAGOGIC_NODE]: "maieutic" },
        },
        {
          kind: "decomposition",
          nodes: [REVIEW_A],
          finding: "review-a answers two questions at once.",
          proposal: "Split review-a into two nodes once the ground settles.",
          stages: { [REVIEW_A]: "maieutic" },
        },
        {
          kind: "cross-reference",
          nodes: [RULING_A],
          finding: "ruling-a's account cites a reading that no longer says what is attributed to it.",
          proposal: "Redraft the account's citation.",
          stages: { [RULING_A]: "maieutic" },
        },
      ],
      // ruling_order is the superseded field subtree_divergences replaces
      // (see the dedicated describe block below): present here only to
      // exercise that it is simply ignored, not echoed, alongside
      // everything else this end-to-end test already covers.
      ruling_order: [REVIEW_A],
    };

    // a lock created before the run must be gone after it.
    await mkdir(reviewDir, { recursive: true });
    await writeFile(path.join(reviewDir, "frontier.lock"), '{"pid": 1}\n');

    const result = await applyReviews({
      rootDir,
      reviewDir,
      batch,
      replies: {},
      overrides: { [REVIEW_B]: "periagogic" },
    });

    assert.equal(result.validation.ok, true, result.validation.message);
    assert.equal(await readFile(path.join(reviewDir, "frontier.lock"), "utf8").catch(() => null), null, "the lock is removed after a successful write");
    assert.ok(!result.report.includes(REVIEW_A), "ruling_order is no longer echoed into the report as its own line");

    // review-a: forwarded by its own verdict (-> ruling) but the
    // decomposition finding also names it at maieutic; maieutic is
    // earlier, so it wins even against a forward.
    const reviewAAfter = await readFile(reviewAFile, "utf8");
    assert.equal(fieldValue(reviewAAfter, "stage"), "maieutic", "earliest-stage rule: maieutic beats the verdict's ruling");
    assert.ok(reviewAAfter.includes("### Clean-context review, 2026-09-03"));
    assert.ok(reviewAAfter.includes("### Frontier finding, 2026-09-03"));
    assert.ok(reviewAAfter.includes("Kind: decomposition."));
    assert.ok(reviewAAfter.includes("Names only this node."), "the decomposition finding names only review-a");
    const reviewABlock = reviewBlockOf(reviewAAfter);
    assert.equal(fieldValue(reviewABlock, "verdict"), "forward", "the review: block still records the reviewer's own verdict");
    assert.equal(fieldValue(reviewABlock, "of"), wantHashReviewA);
    // the Clean-context review subsection precedes the Frontier finding one (input order).
    assert.ok(reviewAAfter.indexOf("### Clean-context review") < reviewAAfter.indexOf("### Frontier finding"));

    // review-b: kickback_stage is maieutic, but the override sends it to
    // periagogic outright; the prose still narrates the kickback verdict.
    const reviewBAfter = await readFile(reviewBFile, "utf8");
    assert.equal(fieldValue(reviewBAfter, "stage"), "periagogic", "override wins outright");
    assert.ok(reviewBAfter.includes("Verdict: kicked back to the maieutic stage."), "prose still reports the reviewer's own kickback_stage");
    assert.ok(!reviewBAfter.includes("Frontier finding"), "no finding named review-b");

    // ruling-a: outside the batch, so no verdict and no new review: block --
    // the finding alone moves it, and its earlier round's subsection stays.
    const rulingAAfter = await readFile(rulingAFile, "utf8");
    assert.equal(fieldValue(rulingAAfter, "stage"), "maieutic", "a finding kicks back a node outside the batch");
    assert.ok(rulingAAfter.includes("### Clean-context review, 2026-08-01"), "the earlier round's subsection is kept");
    assert.ok(!rulingAAfter.includes("### Clean-context review, 2026-09-03"), "no verdict is recorded on a node outside the batch");
    assert.ok(rulingAAfter.includes("### Frontier finding, 2026-09-03") && rulingAAfter.includes("Kind: cross-reference."));
    assert.equal(reviewBlockOf(rulingAAfter), reviewBlockOf(rulingABefore), "the review: block of a node with no verdict is left as it stands");

    // maieutic-node and periagogic-node: findings-only, no verdict of
    // their own -- no Clean-context review subsection, no review: block,
    // just the stage move and the one Frontier finding subsection each,
    // with different target stages from the same finding.
    const maieuticAfter = await readFile(maieuticFile, "utf8");
    const periagogicAfter = await readFile(periagogicFile, "utf8");
    assert.equal(fieldValue(maieuticAfter, "stage"), "periagogic");
    assert.equal(fieldValue(periagogicAfter, "stage"), "maieutic");
    assert.ok(!maieuticAfter.includes("Clean-context review") && !maieuticAfter.includes("review:\n"));
    assert.ok(!periagogicAfter.includes("Clean-context review") && !periagogicAfter.includes("review:\n"));
    assert.ok(maieuticAfter.includes("### Frontier finding, 2026-09-03") && maieuticAfter.includes("Kind: placement."));
    assert.ok(periagogicAfter.includes("### Frontier finding, 2026-09-03") && periagogicAfter.includes("Kind: placement."));
    assert.ok(maieuticAfter.includes(`Also named: ${PERIAGOGIC_NODE}.`));
    assert.ok(periagogicAfter.includes(`Also named: ${MAIEUTIC_NODE}.`));
    // the account section is named '## Account' now, and is created where absent.
    assert.ok(maieuticAfter.includes("\n## Account\n\n### Frontier finding"));
    assert.ok(!maieuticAfter.includes("## Proposal"));
  });

  test("--dry prints the plan (subsections and stage before/after) and writes nothing", async () => {
    const rootDir = await freshFrontierFixture("batch-dry-");
    const reviewDir = path.join(rootDir, "_review");
    const before = await readFile(nodePath(rootDir, "review-a"), "utf8");

    const batch = { date: BATCH_DATE, read: fullReadIds(), nodes: fullNodeEntries(), frontier: [], ruling_order: [] };
    const result = await applyReviews({ rootDir, reviewDir, batch, replies: {}, dry: true });

    assert.equal(result.validation, null);
    assert.ok(result.report.some((l) => l.startsWith(`${REVIEW_A}: Clean-context review, review → ruling`)));
    assert.equal(await readFile(nodePath(rootDir, "review-a"), "utf8"), before, "nothing written under --dry");
    await assert.rejects(readFile(path.join(reviewDir, "frontier.lock")), { code: "ENOENT" }, "no lock under --dry");
  });

  describe("the batch is the review stage, and only that", () => {
    test("a review-stage node missing its 'nodes' entry is refused", async () => {
      const rootDir = await freshFrontierFixture("chk-entry-");
      const reviewDir = path.join(rootDir, "_review");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries().filter((e) => e.id !== REVIEW_A),
        frontier: [],
      };
      await assert.rejects(
        () => applyReviews({ rootDir, reviewDir, batch, replies: {} }),
        new RegExp(`'nodes' is missing an entry for ${escapeRe(REVIEW_A)} \\(stage review\\)`),
      );
    });

    test("a verdict on a node outside the batch is refused: only the batch receives verdicts", async () => {
      const rootDir = await freshFrontierFixture("chk-nonbatch-");
      const reviewDir = path.join(rootDir, "_review");
      const before = await readFile(nodePath(rootDir, "ruling-a"), "utf8");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: [...fullNodeEntries(), { id: RULING_A, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null }],
        frontier: [],
      };
      await assert.rejects(
        () => applyReviews({ rootDir, reviewDir, batch, replies: {} }),
        new RegExp(`'nodes' names ${escapeRe(RULING_A)}, which is not in the batch \\(stage ruling\\); only the batch receives verdicts`),
      );
      assert.equal(await readFile(nodePath(rootDir, "ruling-a"), "utf8"), before, "nothing written on refusal");
    });

    test("a batch node missing from 'read' is refused; a periagogic node absent from 'read' is not", async () => {
      const rootDir = await freshFrontierFixture("chk-read-");
      const reviewDir = path.join(rootDir, "_review");

      await assert.rejects(
        () => applyReviews({
          rootDir,
          reviewDir,
          batch: { date: BATCH_DATE, read: fullReadIds().filter((id) => id !== REVIEW_A), nodes: fullNodeEntries(), frontier: [] },
          replies: {},
        }),
        new RegExp(`'read' is missing ${escapeRe(REVIEW_A)}, which is in the batch \\(stage review\\)`),
      );

      const ok = await applyReviews({
        rootDir,
        reviewDir,
        batch: { date: BATCH_DATE, read: [REVIEW_A, REVIEW_B], nodes: fullNodeEntries(), frontier: [] },
        replies: {},
        dry: true,
      });
      assert.equal(ok.plans.length, 2);
    });

    test("a frontier finding with no 'stages' entry for a named id (and no override) is allowed: the subsection lands, the stage is left untouched", async () => {
      const rootDir = await freshFrontierFixture("chk-stages-");
      const reviewDir = path.join(rootDir, "_review");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{ kind: "vocabulary", nodes: [MAIEUTIC_NODE], finding: "x", proposal: "y", stages: {} }],
      };
      const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
      assert.equal(result.validation.ok, true, result.validation.message);
      assert.ok(result.report.includes(`${MAIEUTIC_NODE}: Frontier finding, maieutic → maieutic`));

      const after = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");
      assert.equal(fieldValue(after, "stage"), "maieutic", "no 'stages' entry for this id: the finding does not move its stage");
      assert.ok(after.includes("### Frontier finding, 2026-09-03") && after.includes("Kind: vocabulary."), "the finding's subsection is still appended");
    });

    test("a finding naming two nodes but giving 'stages' for only one: the unstaged node keeps its stage and still gets the subsection; the staged node moves", async () => {
      const rootDir = await freshFrontierFixture("chk-stages-partial-");
      const reviewDir = path.join(rootDir, "_review");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{
          kind: "placement",
          nodes: [MAIEUTIC_NODE, PERIAGOGIC_NODE],
          finding: "periagogic-node's ground needs redrawing; maieutic-node is cited for comparison only.",
          proposal: "Redraft periagogic-node's account; nothing is proposed for maieutic-node itself.",
          stages: { [PERIAGOGIC_NODE]: "maieutic" },
        }],
      };
      const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
      assert.equal(result.validation.ok, true, result.validation.message);
      assert.ok(result.report.includes(`${MAIEUTIC_NODE}: Frontier finding, maieutic → maieutic`), "unstaged: reported as unchanged");
      assert.ok(result.report.includes(`${PERIAGOGIC_NODE}: Frontier finding, periagogic → maieutic`), "staged: reported as moved");

      const maieuticAfter = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");
      const periagogicAfter = await readFile(nodePath(rootDir, "periagogic-node"), "utf8");

      assert.equal(fieldValue(maieuticAfter, "stage"), "maieutic", "unstaged in this finding: stage left untouched");
      assert.ok(maieuticAfter.includes("### Frontier finding, 2026-09-03"), "unstaged node still gets the subsection");
      assert.ok(maieuticAfter.includes(`Also named: ${PERIAGOGIC_NODE}.`));

      assert.equal(fieldValue(periagogicAfter, "stage"), "maieutic", "the staged id still moves per its 'stages' entry");
      assert.ok(periagogicAfter.includes("### Frontier finding, 2026-09-03"));
      assert.ok(periagogicAfter.includes(`Also named: ${MAIEUTIC_NODE}.`));
    });

    test("an override excuses a finding's missing 'stages' entry for that id", async () => {
      const rootDir = await freshFrontierFixture("chk-stages-override-");
      const reviewDir = path.join(rootDir, "_review");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{ kind: "vocabulary", nodes: [MAIEUTIC_NODE], finding: "x", proposal: "y", stages: {} }],
      };
      await applyReviews({ rootDir, reviewDir, batch, replies: {}, overrides: { [MAIEUTIC_NODE]: "periagogic" } });
      assert.equal(fieldValue(await readFile(nodePath(rootDir, "maieutic-node"), "utf8"), "stage"), "periagogic");
    });

    test("a strong counter-argument with no reply is refused", async () => {
      const rootDir = await freshFrontierFixture("chk-strong-");
      const reviewDir = path.join(rootDir, "_review");

      const nodes = fullNodeEntries();
      nodes[0] = { ...nodes[0], counter_argument: "y", strength: "strong" };
      const batch = { date: BATCH_DATE, read: fullReadIds(), nodes, frontier: [] };
      await assert.rejects(
        () => applyReviews({ rootDir, reviewDir, batch, replies: {} }),
        new RegExp(`${escapeRe(REVIEW_A)}: strength 'strong' requires a reply`),
      );
    });
  });

  describe("a finding may name a node outside the batch", () => {
    test("an answered node with no stage is given one and opened, when the finding names its stage", async () => {
      const rootDir = await freshFrontierFixture("nonbatch-answered-");
      const reviewDir = path.join(rootDir, "_review");
      const file = nodePath(rootDir, "answered-ratified");
      const before = await readFile(file, "utf8");
      assert.ok(!before.includes("stage:"), "fixture precondition: settled doctrine, no dialogue open");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{
          kind: "contradiction",
          nodes: [ANSWERED_NODE, REVIEW_A],
          finding: "The answered node and review-a's answer disagree on the same matter.",
          proposal: "Reopen the answered node's ground.",
          stages: { [ANSWERED_NODE]: "periagogic" },
        }],
      };
      const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
      assert.equal(result.validation.ok, true, result.validation.message);
      assert.ok(result.report.includes(`${ANSWERED_NODE}: Frontier finding, no stage → periagogic`));

      const after = await readFile(file, "utf8");
      assert.equal(fieldValue(after, "stage"), "periagogic", "the stage line is inserted, opening the dialogue");
      assert.ok(after.includes("authority:\n  class: ratified\n  by: Fixture Author\n  date: 2026-08-01\n"), "the stamp is untouched");
      assert.ok(after.includes("\n## Account\n\n### Frontier finding, 2026-09-03"));
    });

    test("a stage-less node named with no stage at all is refused, naming what is missing", async () => {
      const rootDir = await freshFrontierFixture("nonbatch-nostage-");
      const reviewDir = path.join(rootDir, "_review");
      const before = await readFile(nodePath(rootDir, "answered-ratified"), "utf8");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{
          kind: "coverage",
          nodes: [ANSWERED_NODE],
          finding: "The answered node is cited for context only.",
          proposal: "Nothing.",
          stages: {},
        }],
      };
      await assert.rejects(
        () => applyReviews({ rootDir, reviewDir, batch, replies: {} }),
        /carries no stage, and nothing in this batch names one for it/,
      );
      assert.equal(await readFile(nodePath(rootDir, "answered-ratified"), "utf8"), before, "nothing written on refusal");
    });
  });

  describe("a merge finding is recorded as a pending alternative", () => {
    test("on a node that already has an '## Alternatives' section: the entry is appended, in order, with source review and the review's date", async () => {
      const rootDir = await freshFrontierFixture("merge-append-");
      const reviewDir = path.join(rootDir, "_review");
      const file = nodePath(rootDir, "review-b");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{
          kind: "merge",
          nodes: [REVIEW_B, MAIEUTIC_NODE],
          finding: "maieutic-node is a new answer to review-b's question, not a new question.",
          proposal: "Fold maieutic-node into review-b as an alternative; review-b survives.",
          stages: { [REVIEW_B]: "maieutic" },
          alternatives: [{
            node: REVIEW_B,
            name: "folded-from-maieutic",
            text: "Answer B as maieutic-node would: the same question, answered from the other end.",
          }],
        }],
      };
      const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
      assert.equal(result.validation.ok, true, result.validation.message);
      assert.ok(result.report.some((l) => l.includes("alternative 'folded-from-maieutic'")), `report does not name the alternative: ${result.report.join(" | ")}`);

      const after = await readFile(file, "utf8");
      const parsed = parseNode(after, { id: REVIEW_B, graph: "main", slug: "review-b", path: file });
      assert.deepEqual(parsed.alternatives.map((a) => [a.name, a.source, a.ref]), [
        ["narrower", "ai", null],
        ["folded-from-maieutic", "review", "2026-09-03"],
      ], "the review's alternative is appended after the node's own");
      assert.equal(parsed.alternativesText["folded-from-maieutic"], "Answer B as maieutic-node would: the same question, answered from the other end.");
      assert.ok(after.includes("### narrower\n"), "the node's own alternative survives");
      assert.ok(after.indexOf("### narrower") < after.indexOf("### folded-from-maieutic"), "the subsections follow the list's order");
      assert.ok(after.includes("Recorded as a pending alternative on this node: `folded-from-maieutic` (source review, 2026-09-03)."));
      // and on the other node the finding names, the pointer to where it went
      const other = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");
      assert.ok(other.includes(`Recorded as a pending alternative on ${REVIEW_B}: \`folded-from-maieutic\``));
    });

    test("on a node with no '## Alternatives' section: the list and the section are created, the section before '## Account'", async () => {
      const rootDir = await freshFrontierFixture("merge-create-");
      const reviewDir = path.join(rootDir, "_review");
      const file = nodePath(rootDir, "review-a");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{
          kind: "merge",
          nodes: [REVIEW_A],
          finding: "The author's words on review-a are a new answer to review-a's own question.",
          proposal: "Record them as an alternative on review-a.",
          stages: { [REVIEW_A]: "maieutic" },
          alternatives: [{ node: REVIEW_A, name: "the-authors-own", text: "Answer A as the author's words already answer it." }],
        }],
      };
      const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
      assert.equal(result.validation.ok, true, result.validation.message);

      const after = await readFile(file, "utf8");
      const parsed = parseNode(after, { id: REVIEW_A, graph: "main", slug: "review-a", path: file });
      assert.deepEqual(parsed.alternatives.map((a) => a.name), ["the-authors-own"]);
      assert.equal(parsed.alternativesText["the-authors-own"], "Answer A as the author's words already answer it.");
      assert.ok(after.indexOf("\n## Alternatives\n") < after.indexOf("\n## Account\n"), "'## Alternatives' is inserted before '## Account'");
      assert.ok(after.includes("alternatives:\n  - name: the-authors-own\n    source: review\n    ref: \"2026-09-03\"\n"));
    });

    test("a name already listed on the node is skipped with a note; the finding is still recorded", async () => {
      const rootDir = await freshFrontierFixture("merge-dup-");
      const reviewDir = path.join(rootDir, "_review");
      const file = nodePath(rootDir, "review-b");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{
          kind: "merge",
          nodes: [REVIEW_B],
          finding: "The same narrowing is on the table twice.",
          proposal: "Record it as an alternative on review-b.",
          stages: {},
          alternatives: [{ node: REVIEW_B, name: "narrower", text: "A second wording of the alternative already listed." }],
        }],
      };
      const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
      assert.equal(result.validation.ok, true, result.validation.message);
      assert.ok(
        result.report.includes(`${REVIEW_B}: alternative 'narrower' is already listed on this node; skipped (the finding is still recorded)`),
        `report does not carry the skip note: ${result.report.join(" | ")}`,
      );

      const after = await readFile(file, "utf8");
      const parsed = parseNode(after, { id: REVIEW_B, graph: "main", slug: "review-b", path: file });
      assert.deepEqual(parsed.alternatives.map((a) => a.name), ["narrower"], "the list is not doubled");
      assert.equal((after.match(/### narrower/g) || []).length, 1, "the subsection is not doubled");
      assert.ok(after.includes("### Frontier finding, 2026-09-03"), "the finding is still recorded");
    });

    test("a merge finding with no alternative, an alternative on an unnamed node, and a reserved name are each refused", async () => {
      const rootDir = await freshFrontierFixture("merge-refuse-");
      const reviewDir = path.join(rootDir, "_review");
      const before = await readFile(nodePath(rootDir, "review-b"), "utf8");
      const base = { date: BATCH_DATE, read: fullReadIds(), nodes: fullNodeEntries() };

      await assert.rejects(
        () => applyReviews({
          rootDir,
          reviewDir,
          batch: { ...base, frontier: [{ kind: "merge", nodes: [REVIEW_B], finding: "x", proposal: "y", stages: {} }] },
          replies: {},
        }),
        /a 'merge' finding must propose at least one alternative/,
      );

      await assert.rejects(
        () => applyReviews({
          rootDir,
          reviewDir,
          batch: {
            ...base,
            frontier: [{
              kind: "redundancy",
              nodes: [REVIEW_B],
              finding: "x",
              proposal: "y",
              stages: {},
              alternatives: [{ node: REVIEW_A, name: "elsewhere", text: "z" }],
            }],
          },
          replies: {},
        }),
        new RegExp(`proposes an alternative on ${escapeRe(REVIEW_A)}, which this finding does not name in 'nodes'`),
      );

      await assert.rejects(
        () => applyReviews({
          rootDir,
          reviewDir,
          batch: {
            ...base,
            frontier: [{
              kind: "merge",
              nodes: [REVIEW_B],
              finding: "x",
              proposal: "y",
              stages: {},
              alternatives: [{ node: REVIEW_B, name: "standing", text: "z" }],
            }],
          },
          replies: {},
        }),
        /'name' must be a lowercase slug and never 'standing'/,
      );

      assert.equal(await readFile(nodePath(rootDir, "review-b"), "utf8"), before, "nothing written on any refusal");
    });
  });

  test("date resolution: --date wins, else the batch's own date, else today", async () => {
    const rootDir = await freshFrontierFixture("batch-date-");
    const reviewDir = path.join(rootDir, "_review");
    const batch = { date: "2020-01-01", read: fullReadIds(), nodes: fullNodeEntries(), frontier: [] };

    const viaBatch = await applyReviews({ rootDir, reviewDir, batch, replies: {}, dry: true });
    assert.ok(viaBatch.report.some((l) => l.includes("Clean-context review")));
    const afterDry = await readFile(nodePath(rootDir, "review-a"), "utf8");
    assert.ok(!afterDry.includes("2020-01-01"), "--dry writes nothing, so the date never lands in a file here");

    const rootDir2 = await freshFrontierFixture("batch-date-override-");
    await applyReviews({ rootDir: rootDir2, reviewDir: path.join(rootDir2, "_review"), batch, replies: {}, date: "2021-06-06" });
    assert.ok((await readFile(nodePath(rootDir2, "review-a"), "utf8")).includes("### Clean-context review, 2021-06-06"), "--date overrides the batch's own date");

    const rootDir3 = await freshFrontierFixture("batch-date-batch-");
    await applyReviews({ rootDir: rootDir3, reviewDir: path.join(rootDir3, "_review"), batch, replies: {} });
    assert.ok((await readFile(nodePath(rootDir3, "review-a"), "utf8")).includes("### Clean-context review, 2020-01-01"), "absent --date, the batch's own date is used");
  });
});

// --------------------------------------------------------------------------
// apply.mjs: subtree_divergences (SKILL.md §4, frontier-consistency.md
// validation 13, alignment-order): a tangle between two unanswered subtrees
// standing under different sides of one ancestor's pending alternatives,
// written on the leaves and never on the ancestor.
// --------------------------------------------------------------------------

describe("apply.mjs: subtree_divergences", () => {
  test("writes 'depends' on the leaves and never on the ancestor; the account subsections land on the ancestor and on each leaf with the right keeps/discards; an alternative proposed by this same run satisfies the alternative-exists check", async () => {
    const rootDir = await freshFrontierFixture("divergence-basic-");
    const reviewDir = path.join(rootDir, "_review");

    const batch = {
      date: BATCH_DATE,
      read: fullReadIds(),
      nodes: fullNodeEntries(),
      // ruling-a already lists 'whole-thing'; 'keep-part' is new, proposed
      // by this same run's own frontier -- the divergence below stands one
      // side on each, so it exercises both ways an alternative can be "on
      // the table" (frontier-consistency's own phrase).
      frontier: [{
        kind: "redundancy",
        nodes: [RULING_A],
        finding: "A second, narrower alternative belongs on ruling-a's table beside 'whole-thing'.",
        proposal: "Add it as an alternative on ruling-a.",
        stages: {},
        alternatives: [{ node: RULING_A, name: "keep-part", text: "Keep only the part the author actually ruled on; split the rest into a node of its own." }],
      }],
      subtree_divergences: [{
        ancestor: RULING_A,
        sides: { "whole-thing": [MAIEUTIC_NODE], "keep-part": [PERIAGOGIC_NODE] },
        finding: "maieutic-node stands under 'whole-thing' and periagogic-node stands under 'keep-part'; a ruling for one discards the ground the other rests on.",
      }],
    };

    const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
    assert.equal(result.validation.ok, true, result.validation.message);

    const rulingAFile = nodePath(rootDir, "ruling-a");
    const maieuticFile = nodePath(rootDir, "maieutic-node");
    const periagogicFile = nodePath(rootDir, "periagogic-node");
    const rulingAAfter = await readFile(rulingAFile, "utf8");
    const maieuticAfter = await readFile(maieuticFile, "utf8");
    const periagogicAfter = await readFile(periagogicFile, "utf8");

    // never on the ancestor
    assert.ok(!rulingAAfter.includes("depends:"), "the ancestor never gains a 'depends' field");
    assert.equal(fieldValue(rulingAAfter, "stage"), "ruling", "a subtree divergence never touches stage");

    // on the leaves
    const maieuticParsed = parseNode(maieuticAfter, { id: MAIEUTIC_NODE, graph: "main", slug: "maieutic-node", path: maieuticFile });
    const periagogicParsed = parseNode(periagogicAfter, { id: PERIAGOGIC_NODE, graph: "main", slug: "periagogic-node", path: periagogicFile });
    assert.deepEqual(maieuticParsed.depends, [{ id: RULING_A, alternative: "whole-thing" }]);
    assert.deepEqual(periagogicParsed.depends, [{ id: RULING_A, alternative: "keep-part" }]);
    assert.equal(fieldValue(maieuticAfter, "stage"), "maieutic", "a subtree divergence never touches stage");
    assert.equal(fieldValue(periagogicAfter, "stage"), "periagogic", "a subtree divergence never touches stage");

    // the account subsections: ancestor names both sides' keeps and discards
    assert.ok(rulingAAfter.includes("### Subtree divergence, 2026-09-03"));
    assert.ok(rulingAAfter.includes(`\`whole-thing\` keeps ${MAIEUTIC_NODE}; discards ${PERIAGOGIC_NODE}.`));
    assert.ok(rulingAAfter.includes(`\`keep-part\` keeps ${PERIAGOGIC_NODE}; discards ${MAIEUTIC_NODE}.`));
    // each leaf names the ancestor and the alternative it stands under
    assert.ok(maieuticAfter.includes("### Subtree divergence, 2026-09-03"));
    assert.ok(maieuticAfter.includes(`Stands under ${RULING_A}, alternative \`whole-thing\`.`));
    assert.ok(periagogicAfter.includes(`Stands under ${RULING_A}, alternative \`keep-part\`.`));

    assert.ok(
      result.report.some((l) => l === `subtree divergence on ${RULING_A}: whole-thing 1, keep-part 1`),
      `report is missing the per-entry summary line: ${result.report.join(" | ")}`,
    );
  });

  test("an unknown alternative name, an answered leaf, and a leaf equal to its own ancestor are each refused; the run writes nothing", async () => {
    const rootDir = await freshFrontierFixture("divergence-refuse-basic-");
    const reviewDir = path.join(rootDir, "_review");
    const base = { date: BATCH_DATE, read: fullReadIds(), nodes: fullNodeEntries(), frontier: [] };
    const rulingABefore = await readFile(nodePath(rootDir, "ruling-a"), "utf8");
    const maieuticBefore = await readFile(nodePath(rootDir, "maieutic-node"), "utf8");

    await assert.rejects(
      () => applyReviews({
        rootDir,
        reviewDir,
        batch: { ...base, subtree_divergences: [{ ancestor: RULING_A, sides: { "nonexistent-alt": [MAIEUTIC_NODE] }, finding: "x" }] },
        replies: {},
      }),
      /'nonexistent-alt' is not an alternative on .*ruling-a \(not listed, and not added to it by this run's 'frontier'\)/,
    );

    await assert.rejects(
      () => applyReviews({
        rootDir,
        reviewDir,
        batch: { ...base, subtree_divergences: [{ ancestor: RULING_A, sides: { "whole-thing": [ANSWERED_NODE] }, finding: "x" }] },
        replies: {},
      }),
      new RegExp(`names ${escapeRe(ANSWERED_NODE)}, which is answered; a subtree divergence stands on unanswered nodes`),
    );

    await assert.rejects(
      () => applyReviews({
        rootDir,
        reviewDir,
        batch: { ...base, subtree_divergences: [{ ancestor: RULING_A, sides: { "whole-thing": [RULING_A] }, finding: "x" }] },
        replies: {},
      }),
      new RegExp(`names ${escapeRe(RULING_A)}, which is this entry's own ancestor`),
    );

    assert.equal(await readFile(nodePath(rootDir, "ruling-a"), "utf8"), rulingABefore, "nothing written on any refusal");
    assert.equal(await readFile(nodePath(rootDir, "maieutic-node"), "utf8"), maieuticBefore, "nothing written on any refusal");
  });

  test("a node standing under two sides of the same ancestor is refused; the run writes nothing", async () => {
    const rootDir = await freshFrontierFixture("divergence-refuse-twosides-");
    const reviewDir = path.join(rootDir, "_review");
    const before = await readFile(nodePath(rootDir, "periagogic-node"), "utf8");

    const batch = {
      date: BATCH_DATE,
      read: fullReadIds(),
      nodes: fullNodeEntries(),
      frontier: [{
        kind: "decomposition",
        nodes: [MAIEUTIC_NODE],
        finding: "maieutic-node's ground splits two ways.",
        proposal: "Put both ways on the table as alternatives.",
        stages: {},
        alternatives: [
          { node: MAIEUTIC_NODE, name: "alt-x", text: "The first way." },
          { node: MAIEUTIC_NODE, name: "alt-y", text: "The second way." },
        ],
      }],
      subtree_divergences: [{
        ancestor: MAIEUTIC_NODE,
        sides: { "alt-x": [PERIAGOGIC_NODE], "alt-y": [PERIAGOGIC_NODE] },
        finding: "periagogic-node is cited under both, which cannot be right.",
      }],
    };

    await assert.rejects(
      () => applyReviews({ rootDir, reviewDir, batch, replies: {} }),
      new RegExp(`${escapeRe(PERIAGOGIC_NODE)} stands under two sides \\('alt-x' and 'alt-y'\\) of the same ancestor`),
    );
    assert.equal(await readFile(nodePath(rootDir, "periagogic-node"), "utf8"), before, "nothing written on refusal");
  });

  test("a leaf that already depends on the ancestor under a different alternative is refused as a conflict, not overwritten; the run writes nothing", async () => {
    const rootDir = await freshFrontierFixture("divergence-refuse-conflict-");
    const reviewDir = path.join(rootDir, "_review");
    const maieuticFile = nodePath(rootDir, "maieutic-node");
    const seeded = (await readFile(maieuticFile, "utf8")).replace("stage: maieutic\n", `stage: maieutic\ndepends:\n  - ${RULING_A}#whole-thing\n`);
    assert.ok(seeded.includes(`depends:\n  - ${RULING_A}#whole-thing`), "fixture edit precondition: the seed landed");
    await writeFile(maieuticFile, seeded);

    const batch = {
      date: BATCH_DATE,
      read: fullReadIds(),
      nodes: fullNodeEntries(),
      frontier: [{
        kind: "redundancy",
        nodes: [RULING_A],
        finding: "A narrower alternative belongs on the table too.",
        proposal: "Add it as an alternative on ruling-a.",
        stages: {},
        alternatives: [{ node: RULING_A, name: "keep-part", text: "Keep only the part the author actually ruled on." }],
      }],
      subtree_divergences: [{
        ancestor: RULING_A,
        sides: { "keep-part": [MAIEUTIC_NODE] },
        finding: "maieutic-node actually stands under 'keep-part', not 'whole-thing'.",
      }],
    };

    await assert.rejects(
      () => applyReviews({ rootDir, reviewDir, batch, replies: {} }),
      new RegExp(`${escapeRe(MAIEUTIC_NODE)} already depends on ${escapeRe(RULING_A)}#whole-thing, which conflicts with side 'keep-part'; not overwritten, refused`),
    );
    assert.equal(await readFile(maieuticFile, "utf8"), seeded, "nothing written on refusal");
  });

  test("a node that already carries exactly the entry a divergence would write is skipped and noted; the rest of the entry still applies", async () => {
    const rootDir = await freshFrontierFixture("divergence-skip-");
    const reviewDir = path.join(rootDir, "_review");
    const maieuticFile = nodePath(rootDir, "maieutic-node");
    const seeded = (await readFile(maieuticFile, "utf8")).replace("stage: maieutic\n", `stage: maieutic\ndepends:\n  - ${RULING_A}#whole-thing\n`);
    await writeFile(maieuticFile, seeded);

    const batch = {
      date: BATCH_DATE,
      read: fullReadIds(),
      nodes: fullNodeEntries(),
      frontier: [],
      subtree_divergences: [{
        ancestor: RULING_A,
        sides: { "whole-thing": [MAIEUTIC_NODE] },
        finding: "maieutic-node stands under 'whole-thing', confirmed on a second look.",
      }],
    };

    const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
    assert.equal(result.validation.ok, true, result.validation.message);

    const after = await readFile(maieuticFile, "utf8");
    const parsed = parseNode(after, { id: MAIEUTIC_NODE, graph: "main", slug: "maieutic-node", path: maieuticFile });
    assert.deepEqual(parsed.depends, [{ id: RULING_A, alternative: "whole-thing" }], "the entry is not duplicated");
    assert.ok(after.includes("### Subtree divergence, 2026-09-03"), "the divergence is still recorded on the leaf");
    assert.ok(
      result.report.some((l) => l === `subtree divergence on ${RULING_A}: whole-thing 1; already present, skipped: ${MAIEUTIC_NODE}`),
      `report does not carry the skip note: ${result.report.join(" | ")}`,
    );
  });

  test("'ruling_order' in an input file is simply ignored", async () => {
    const rootDir = await freshFrontierFixture("divergence-ruling-order-ignored-");
    const reviewDir = path.join(rootDir, "_review");
    const batch = {
      date: BATCH_DATE,
      read: fullReadIds(),
      nodes: fullNodeEntries(),
      frontier: [],
      subtree_divergences: [],
      ruling_order: [REVIEW_B, REVIEW_A],
    };

    const result = await applyReviews({ rootDir, reviewDir, batch, replies: {} });
    assert.equal(result.validation.ok, true, result.validation.message);
    assert.ok(!result.report.includes(REVIEW_A) && !result.report.includes(REVIEW_B), "ruling_order is not echoed as bare id lines");
  });
});
