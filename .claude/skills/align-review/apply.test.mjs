// node --test .claude/skills/align-review/apply.test.mjs
//
// Exercises apply.mjs against copies of two fixture graphs -- never against
// the live disposition/ graph (see SKILL.md: "Never edit disposition/"):
// packages/disposition/fixtures/valid-dialogue/ for the old per-node shape
// (kept so --fields-only, and JSON files shaped the old way, still work),
// and fixtures/frontier/ beside this file for the whole-frontier batch
// shape frontier-consistency.md and dialogue.md describe.

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

// Named by the brief: "test against copies under
// /home/n8/.claude/jobs/3dcce675/tmp/apply-check/".
const TMP_BASE = "/home/n8/.claude/jobs/3dcce675/tmp/apply-check";

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

/** A fresh copy of the whole-frontier batch fixture graph. */
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
  test("appends the subsection, sets stage ruling, writes the review block, keeps other lines byte for byte", async () => {
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
    assert.ok(afterText.includes("recommendation:\n  class: delegated\n  boldness: high\n"), "recommendation kept byte for byte");
    const block = reviewBlockOf(afterText);
    assert.ok(block, "review block present");
    assert.equal(fieldValue(block, "verdict"), "forward");
    assert.equal(fieldValue(block, "strength"), "moderate");
    assert.equal(fieldValue(block, "date"), DATE);
    assert.equal(fieldValue(block, "of"), wantHash);
    assert.ok(!block.includes("siblings"), "the review block is verdict/strength/date/of only");

    // Untouched lines: question and the Disposition paragraph survive verbatim.
    assert.ok(afterText.includes("question: Should boldness gate which drafts need a second reviewer?\n"));
    assert.ok(afterText.includes("The author asked whether a high-boldness draft needs a second pass before\nthe ruling."));

    // The appended subsection, exactly.
    const expectedSubsection = [
      "### Clean-context review, 2026-09-03",
      "",
      "Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.",
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
    // The pre-existing Proposal placeholder text is kept, ahead of the new subsection.
    assert.ok(afterText.includes("Under clean-context review; no ruling yet, so no `review` data.\n\n### Clean-context review"));
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
  test("wins over the verdict's stage; the appended prose still narrates the reviewer's own verdict; creates '## Proposal' when absent", async () => {
    const rootDir = await freshFixture("ovr-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await answeredWithStagePath(rootDir);
    const before = await readFile(file, "utf8");
    assert.ok(!before.includes("## Proposal"), "fixture precondition: no Proposal section yet");

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
    assert.ok(afterText.includes("\n## Proposal\n\n### Clean-context review"), "Proposal section created at the end");
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
    assert.equal(draftFenceAfter, draftFenceBefore, "the '## Draft' fence is never touched");

    const block = reviewBlockOf(afterText);
    assert.equal(fieldValue(block, "verdict"), "forward");
    assert.equal(fieldValue(block, "strength"), "strong");
    assert.deepEqual(Object.keys(YAMLish(block)), ["verdict", "strength", "date", "of"], "review block is exactly these four keys");

    // draft hash is independent of stage/recommendation/review and of the
    // Proposal text, so it must be unchanged by this edit.
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

    assert.ok(afterText.includes("Ratify the draft above.\n\n### Clean-context review of the amendment, 2026-09-03"));
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
  test("writes only the review block and the stage, leaving an already-hand-applied Proposal untouched, and computes the same hash the real reader would", async () => {
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
    // review' subsection in the Proposal, but no `review:` frontmatter --
    // exactly today's live-graph shape (see brief-apply-script.md's note).
    // This file, read by itself, no longer validates (dialogue.md's "stage
    // ruling requires a 'review' with verdict forward"), which is the
    // point of the test.
    const seeded = original
      .replace("stage: review", "stage: ruling")
      .replace(
        "## Proposal\n\nUnder clean-context review; no ruling yet, so no `review` data.",
        [
          "## Proposal",
          "",
          "### Clean-context review, 2026-09-01",
          "",
          "Read in clean context by a subagent given the node, its ancestry, and the author's words, and nothing of the sitting. Verdict: forward to the author's ruling.",
          "",
          "Findings:",
          "",
          "- Applied by hand before apply.mjs existed.",
          "",
          "Strongest counter-argument (weak): None worth the author's time.",
        ].join("\n"),
      );
    assert.notEqual(seeded, original, "fixture edit precondition: both replacements matched");
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
    const proposalAfter = afterText.slice(afterText.indexOf("## Proposal"));
    const proposalBefore = seeded.slice(seeded.indexOf("## Proposal"));
    assert.equal(proposalAfter, proposalBefore, "the Proposal (already hand-applied) is never touched under --fields-only");

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
// apply.mjs: the whole-frontier batch shape (frontier-consistency.md,
// dialogue.md, SKILL.md §4)
// --------------------------------------------------------------------------

const MAIEUTIC_NODE = "align-review.test/main/maieutic-node";
const PERIAGOGIC_NODE = "align-review.test/main/periagogic-node";
const REVIEW_A = "align-review.test/main/review-a";
const REVIEW_B = "align-review.test/main/review-b";
const RULING_A = "align-review.test/main/ruling-a";
const BATCH_DATE = "2026-09-03";

function nodePath(rootDir, slug) {
  return path.join(rootDir, "main", `${slug}.md`);
}

function fullReadIds() {
  return [MAIEUTIC_NODE, PERIAGOGIC_NODE, REVIEW_A, REVIEW_B, RULING_A];
}
function fullNodeEntries() {
  return [
    { id: REVIEW_A, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null },
    { id: REVIEW_B, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null },
    { id: RULING_A, verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null },
  ];
}

describe("apply.mjs: batch shape", () => {
  test("verdicts, a frontier finding across two differently-staged nodes, the earliest-stage rule against a forward, and an override -- end to end", async () => {
    const rootDir = await freshFrontierFixture("batch-e2e-");
    const reviewDir = path.join(rootDir, "_review");

    const reviewAFile = nodePath(rootDir, "review-a");
    const reviewBFile = nodePath(rootDir, "review-b");
    const rulingAFile = nodePath(rootDir, "ruling-a");
    const maieuticFile = nodePath(rootDir, "maieutic-node");
    const periagogicFile = nodePath(rootDir, "periagogic-node");

    const reviewABefore = await readFile(reviewAFile, "utf8");
    const rulingABefore = await readFile(rulingAFile, "utf8");
    const wantHashReviewA = parseNode(reviewABefore, { id: REVIEW_A, graph: "main", slug: "review-a", path: reviewAFile }).draftHash;
    const wantHashRulingA = parseNode(rulingABefore, { id: RULING_A, graph: "main", slug: "ruling-a", path: rulingAFile }).draftHash;

    const batch = {
      date: BATCH_DATE,
      read: fullReadIds(),
      nodes: [
        { id: REVIEW_A, verdict: "forward", findings: ["Answer: sound as drafted."], counter_argument: "Could be read more narrowly.", strength: "moderate", facts_check: "Boldness moderate looks right." },
        { id: REVIEW_B, verdict: "kickback", kickback_stage: "maieutic", findings: ["Answer: ambiguous about the second case."], counter_argument: null, strength: "none", facts_check: null },
        { id: RULING_A, verdict: "forward", findings: ["Rationale: still sound on a second look."], counter_argument: "The earlier round's record is thin.", strength: "weak", facts_check: null },
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
      ],
      ruling_order: [RULING_A],
    };

    // review-b's lock: created before the run, must be gone after.
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
    assert.equal(result.report.at(-1), RULING_A, "ruling_order is printed as the report's last line(s)");

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

    // ruling-a: re-forwarded; stage stays ruling; the earlier round's
    // subsection survives as dialogue history, the new one is appended
    // after it, and the review: block is replaced wholesale (new date).
    const rulingAAfter = await readFile(rulingAFile, "utf8");
    assert.equal(fieldValue(rulingAAfter, "stage"), "ruling");
    assert.ok(rulingAAfter.includes("### Clean-context review, 2026-08-01"), "the earlier round's subsection is kept");
    assert.ok(rulingAAfter.includes("### Clean-context review, 2026-09-03"), "this round's subsection is appended");
    const rulingAProposal = rulingAAfter.slice(rulingAAfter.indexOf("## Proposal"));
    assert.ok(rulingAProposal.indexOf("2026-08-01") < rulingAProposal.indexOf("2026-09-03"), "the earlier subsection precedes the new one in the Proposal");
    const rulingABlock = reviewBlockOf(rulingAAfter);
    assert.equal(fieldValue(rulingABlock, "date"), BATCH_DATE, "the review: block itself is replaced, not merged");
    assert.equal(fieldValue(rulingABlock, "of"), wantHashRulingA);

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

  describe("checks (collected before anything is written)", () => {
    test("a staged node missing from 'read' is refused", async () => {
      const rootDir = await freshFrontierFixture("chk-read-");
      const reviewDir = path.join(rootDir, "_review");
      const before = await readFile(nodePath(rootDir, "review-a"), "utf8");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds().filter((id) => id !== MAIEUTIC_NODE),
        nodes: fullNodeEntries(),
        frontier: [],
      };
      await assert.rejects(
        () => applyReviews({ rootDir, reviewDir, batch, replies: {} }),
        new RegExp(`'read' is missing ${escapeRe(MAIEUTIC_NODE)}`),
      );
      assert.equal(await readFile(nodePath(rootDir, "review-a"), "utf8"), before, "nothing written on refusal");
    });

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
        new RegExp(`'nodes' is missing an entry for ${escapeRe(REVIEW_A)}`),
      );
    });

    test("a frontier finding with no 'stages' entry for a named id (and no override) is refused", async () => {
      const rootDir = await freshFrontierFixture("chk-stages-");
      const reviewDir = path.join(rootDir, "_review");

      const batch = {
        date: BATCH_DATE,
        read: fullReadIds(),
        nodes: fullNodeEntries(),
        frontier: [{ kind: "vocabulary", nodes: [MAIEUTIC_NODE], finding: "x", proposal: "y", stages: {} }],
      };
      await assert.rejects(
        () => applyReviews({ rootDir, reviewDir, batch, replies: {} }),
        new RegExp(`'stages' for ${escapeRe(MAIEUTIC_NODE)} must be 'periagogic' or 'maieutic'`),
      );
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
      const result = await applyReviews({ rootDir, reviewDir, batch, replies: {}, overrides: { [MAIEUTIC_NODE]: "periagogic" } });
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
