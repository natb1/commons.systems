// node --test .claude/skills/align-review/apply.test.mjs
//
// Exercises apply.mjs and brief.mjs against copies of
// packages/disposition/fixtures/valid-dialogue/, never against the live
// disposition/ graph (see brief-apply-script.md: "Never edit disposition/").

import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { applyReviews } from "./apply.mjs";
import { writeBriefs } from "./brief.mjs";
import { parseNode } from "../../../packages/disposition/read.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const FIXTURE_SRC = path.join(REPO_ROOT, "packages/disposition/fixtures/valid-dialogue");
const APPLY_MJS = path.join(HERE, "apply.mjs");
const BRIEF_MJS = path.join(HERE, "brief.mjs");

// Named by the brief: "test against copies under
// /home/n8/.claude/jobs/3dcce675/tmp/apply-check/".
const TMP_BASE = "/home/n8/.claude/jobs/3dcce675/tmp/apply-check";

const tmpDirs = [];
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

/** A fresh copy of the fixture graph: `dir` is a valid rootDir (has disposition.yaml directly). */
async function freshFixture(prefix) {
  await mkdir(TMP_BASE, { recursive: true });
  const dir = await mkdtemp(path.join(TMP_BASE, prefix));
  tmpDirs.push(dir);
  await cp(FIXTURE_SRC, dir, { recursive: true });
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
    assert.ok(block.includes("siblings: []"), "no per-node siblings file or --siblings map: empty list");

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

  test("also lifts the 'stage must be review' precondition, letting a ruling-stage node through, and replaces an existing review block wholesale", async () => {
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
    assert.ok(block.includes("siblings: []"), "the old siblings list (review-node) is replaced, not merged, since no siblings source was given this time");
    assert.ok(!afterText.includes("example.test/main/review-node"), "old siblings entry is gone");

    // draft hash is independent of stage/recommendation/review and of the
    // Proposal text, so it must be unchanged by this edit.
    const oldHash = fieldValue(reviewBlockOf(before), "of");
    assert.equal(fieldValue(block, "of"), oldHash);
  });
});

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
      new RegExp(`${REVIEW_NODE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: strength 'strong' requires a reply`),
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

  test("an amendment entry on a non-ruling node is refused", async () => {
    const rootDir = await freshFixture("amend-wrong-stage-");
    const reviewDir = path.join(rootDir, "_review");
    const file = await reviewNodePath(rootDir);
    const before = await readFile(file, "utf8");

    const entry = { id: REVIEW_NODE, scope: "amendment", verdict: "forward", findings: [], counter_argument: null, strength: "none", facts_check: null };
    await assert.rejects(
      () => applyReviews({ rootDir, reviewDir, entries: [entry], replies: {}, date: DATE }),
      /amendment entry requires stage 'ruling', found 'review'/,
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

describe("apply.mjs: --dry", () => {
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

describe("apply.mjs: CLI", () => {
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

async function freshFixtureScratch(prefix) {
  await mkdir(TMP_BASE, { recursive: true });
  const dir = await mkdtemp(path.join(TMP_BASE, prefix));
  tmpDirs.push(dir);
  await cp(FIXTURE_SRC, path.join(dir, "disposition"), { recursive: true });
  return dir;
}

// ---------------------------------------------------------------- brief.mjs

describe("brief.mjs", () => {
  test("writes ancestry + brief with every placeholder filled; siblings derive from the other stage:review node", async () => {
    const rootDir = await freshFixture("brief-ok-");
    const reviewDir = path.join(rootDir, "_review");
    // Fixture precondition: answered-with-stage.md is also at stage:
    // review, so it is review-node's one sibling by the review-stage half
    // of the derivation alone (this fixture has no .git, so the git-diff
    // half is inert -- best-effort, and must not throw here).
    const results = await writeBriefs({ rootDir, reviewDir, gitDir: rootDir, ids: [REVIEW_NODE] });

    assert.equal(results.length, 1);
    const [r] = results;
    assert.equal(r.id, REVIEW_NODE);

    const ancestry = await readFile(r.ancestryFile, "utf8");
    assert.ok(ancestry.startsWith(`# Ancestry of ${REVIEW_NODE}`));

    const brief = await readFile(r.briefFile, "utf8");
    assert.ok(!brief.includes("{{"), `unfilled placeholder left in brief:\n${brief}`);
    assert.ok(brief.includes(REVIEW_NODE));
    assert.ok(brief.includes(path.join(rootDir, "main/review-node.md")));
    assert.ok(brief.includes(r.ancestryFile));
    assert.ok(brief.includes("the whole node"), "no --amendment given");
    assert.ok(brief.includes(`\`${path.join(rootDir, "main/answered-with-stage.md")}\``), "the other stage:review node, as a backtick-quoted absolute path");
    assert.ok(brief.includes(r.outFile));

    const siblings = JSON.parse(await readFile(r.siblingsJsonFile, "utf8"));
    assert.deepEqual(siblings, [ANSWERED_WITH_STAGE]);
  });

  test("siblings render as 'none' when nothing else qualifies", async () => {
    const rootDir = await freshFixture("brief-none-");
    const reviewDir = path.join(rootDir, "_review");
    // Take the fixture's one other stage:review node out of the dialogue
    // entirely (ratified, no stage, no recommendation -- same shape as
    // answered-no-stage.md) so review-node has no sibling left.
    const onlyFile = path.join(rootDir, "main/answered-with-stage.md");
    const text = await readFile(onlyFile, "utf8");
    const edited = text.replace("stage: review\nrecommendation:\n  class: ratified\n  boldness: low\n", "");
    assert.notEqual(edited, text, "fixture edit precondition matched");
    await writeFile(onlyFile, edited);

    const results = await writeBriefs({ rootDir, reviewDir, gitDir: rootDir, ids: [REVIEW_NODE] });
    const brief = await readFile(results[0].briefFile, "utf8");
    assert.match(brief, /^What you review: the whole node\.$/m);
    assert.ok(brief.includes("written together: none."), `expected 'none' siblings in:\n${brief}`);
    assert.deepEqual(JSON.parse(await readFile(results[0].siblingsJsonFile, "utf8")), []);
  });

  test("refuses a node not at the required stage, writing nothing", async () => {
    const rootDir = await freshFixture("brief-refuse-");
    const reviewDir = path.join(rootDir, "_review");
    await assert.rejects(
      () => writeBriefs({ rootDir, reviewDir, gitDir: rootDir, ids: [RULING_NODE] }),
      new RegExp(`refusing ${RULING_NODE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}: stage is 'ruling', expected 'review'`),
    );
  });

  test("--amendment requires stage ruling instead, and accepts the amended node", async () => {
    const rootDir = await freshFixture("brief-amend-");
    const reviewDir = path.join(rootDir, "_review");
    const results = await writeBriefs({ rootDir, reviewDir, gitDir: rootDir, ids: [RULING_NODE], amendment: "The Answer section now reads differently." });
    const brief = await readFile(results[0].briefFile, "utf8");
    assert.ok(brief.includes("The Answer section now reads differently."));
    assert.ok(!brief.includes("{{"));
  });

  test("CLI: prints the brief path", async () => {
    const scratch = await freshFixtureScratch("brief-cli-");
    const stdout = execFileSync(process.execPath, [BRIEF_MJS, REVIEW_NODE], { cwd: scratch, encoding: "utf8" });
    assert.equal(stdout.trim(), path.join(scratch, "tmp/review/review-node.brief.md"));
  });
});
