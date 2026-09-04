// node --test .claude/skills/align-review/brief.test.mjs
//
// Exercises brief.mjs (writeFrontierBrief) against a copy of
// fixtures/frontier/ beside this file -- never against the live
// disposition/ graph.

import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { writeFrontierBrief } from "./brief.mjs";
import { readGraph } from "../../../packages/disposition/read.mjs";
import { renderFrontier } from "../../../packages/disposition/project.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTIER_FIXTURE_SRC = path.join(HERE, "fixtures/frontier");
const BRIEF_MJS = path.join(HERE, "brief.mjs");
const TMP_BASE = "/home/n8/.claude/jobs/55639327/tmp/align-review/apply-check";

const tmpDirs = [];
after(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

async function freshFrontierFixture(prefix) {
  await mkdir(TMP_BASE, { recursive: true });
  const dir = await mkdtemp(path.join(TMP_BASE, prefix));
  tmpDirs.push(dir);
  await cp(FRONTIER_FIXTURE_SRC, dir, { recursive: true });
  return dir;
}

const MAIEUTIC_NODE = "align-review.test/main/maieutic-node";
const PERIAGOGIC_NODE = "align-review.test/main/periagogic-node";
const REVIEW_A = "align-review.test/main/review-a";
const REVIEW_B = "align-review.test/main/review-b";
const RULING_A = "align-review.test/main/ruling-a";
const ANSWERED = "align-review.test/main/answered-ratified";

describe("writeFrontierBrief", () => {
  test("fills every placeholder: date, the batch's index, the context's index, and the literal out path", async () => {
    const rootDir = await freshFrontierFixture("brief-ok-");
    const reviewDir = path.join(rootDir, "_review");

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    assert.equal(result.briefPath, path.join(reviewDir, "frontier.brief.md"));
    assert.equal(result.lockPath, path.join(reviewDir, "frontier.lock"));

    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(!brief.includes("{{"), `unfilled placeholder left in brief:\n${brief.slice(0, 2000)}`);
    assert.ok(brief.startsWith("# Clean-context review, 2026-09-03: the batch at the review stage"));
    assert.ok(brief.includes("tmp/review/frontier.json"), "the literal {{out}} path, regardless of the scratch reviewDir");

    // {{batch_index}}: one line per review-stage node, in the given format.
    // Every node in this fixture is a root with the default boost, so all
    // six tie at rank 0.1667, and none carries an authority stamp except
    // the answered one. Neither review-a nor review-b has any descendant or
    // dependant of its own, so both settle nothing; review-b's pending
    // alternative ('narrower') is its own content and does not count.
    for (const line of [
      `- ${REVIEW_A} | stage review | rank 0.1667 | settles 0 | no stamp | disposition/main/review-a.md`,
      `- ${REVIEW_B} | stage review | rank 0.1667 | settles 0 | no stamp | disposition/main/review-b.md`,
    ]) {
      assert.ok(brief.includes(line), `missing batch index line:\n${line}`);
    }

    // {{context_index}}: every other node, whatever its stage.
    for (const id of [MAIEUTIC_NODE, PERIAGOGIC_NODE, RULING_A, ANSWERED]) {
      assert.ok(new RegExp(`^- ${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\| `, "m").test(brief), `missing context index line for ${id}`);
    }
    assert.ok(!brief.includes(`- ${ANSWERED} | stage`), "an answered node with no dialogue carries no stage line");

    // {{nav}}: filled last, from the filled text itself.
    const lines = brief.split("\n");
    const navLine = lines.find((l) => l.startsWith("This brief is "));
    assert.ok(navLine, "the nav sentence is written");
    assert.match(navLine, new RegExp(`^This brief is ${lines.length} lines\\.`));
    const named = navLine.match(/"## The batch" begins at line (\d+)/);
    assert.ok(named, `nav sentence does not name the batch's line: ${navLine}`);
    assert.ok(lines[Number(named[1]) - 1].startsWith("## The batch"), "the line the nav names is the batch heading");
  });

  test("the batch is the review-stage nodes, whole; every other node is context", async () => {
    const rootDir = await freshFrontierFixture("brief-batch-");
    const reviewDir = path.join(rootDir, "_review");

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    assert.equal(result.batchCount, 2, "review-a and review-b, and no other");
    assert.equal(result.contextCount, 4, "maieutic, periagogic, ruling-a, answered-ratified");

    const brief = await readFile(result.briefPath, "utf8");
    const batchSection = brief.slice(brief.indexOf("\n## The batch"), brief.indexOf("\n## The full graph, as context"));
    const contextSection = brief.slice(brief.indexOf("\n## The full graph, as context"), brief.indexOf("\n## Output"));

    for (const id of [REVIEW_A, REVIEW_B]) {
      assert.ok(batchSection.includes(`### ${id}`), `${id} is presented in the batch`);
      assert.ok(!contextSection.includes(`### ${id}`), `${id} is not repeated as context`);
    }
    for (const id of [MAIEUTIC_NODE, PERIAGOGIC_NODE, RULING_A, ANSWERED]) {
      assert.ok(contextSection.includes(`### ${id}`), `${id} is presented as context`);
      assert.ok(!batchSection.includes(`### ${id}`), `${id} receives no verdict`);
    }

    // Each batch node whole: its recommendation with its staleness, its
    // alternatives with their prose, its account.
    assert.ok(batchSection.includes("- Recommendation: adopts standing, boldness moderate, amends b38cdaaa0f936057e0cb5edddba6f28fa983ab8c, at 0000000"));
    // The class a confirmation would confer left the recommendation for
    // the `authority` fact, so the reviewer reads it on its own line
    // (commons.systems/disposition-graph/dialogue).
    assert.ok(batchSection.includes("- Facts: authority: adopts delegated of ratified|delegated, boldness moderate"),
      "the facts line names each fact, its adopted choice, its choice set and its boldness");
    assert.ok(batchSection.includes("- Alternatives on the table: 1 (narrower:ai)"), "review-b's pending alternative is summarised");
    assert.ok(batchSection.includes("##### narrower (source ai)"), "and carried with its prose");
    assert.ok(batchSection.includes("Answer B only for the case the author named"), "alternativesText is rendered");
    assert.ok(batchSection.includes("Under clean-context review; no ruling yet, so no `review` data."), "the account is carried");
    assert.ok(batchSection.includes("(no '## Recommendation' fence"), "a standing recommendation says so in place of a fence");

    // A context node carries its stamp, stage, answer, and pending
    // alternatives -- enough to see whether a question is already asked.
    assert.ok(contextSection.includes("- Status: answered | stamp: ratified, Fixture Author, 2026-08-01"));
    assert.ok(contextSection.includes("Yes, already settled; an answered node carries no stage."), "a context node's answer is carried");
    assert.ok(contextSection.includes("#### Alternatives pending"), "ruling-a's pending alternative is carried as context");
    assert.ok(contextSection.includes("Answer the question whole rather than in parts"));
  });

  test("a batch node's '## Recommendation' fence is carried verbatim when there is one", async () => {
    const rootDir = await freshFrontierFixture("brief-fence-");
    const reviewDir = path.join(rootDir, "_review");
    // move ruling-a into the batch by putting it back at the review stage:
    // it is the fixture's node with a fence.
    const file = path.join(rootDir, "main", "ruling-a.md");
    await writeFile(file, (await readFile(file, "utf8")).replace("stage: ruling", "stage: review"));

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    assert.equal(result.batchCount, 3);
    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(brief.includes("Answered whole: one node, one question, one answer."), "the fence's own text is carried");
    assert.ok(brief.includes("- Earlier review: forward (weak, 2026-08-01, of 0c79dd25a75caee3b256551263babe34c4313c3c)"));
  });

  test("a stale recommendation is flagged on the node's own line", async () => {
    const rootDir = await freshFrontierFixture("brief-stale-");
    const reviewDir = path.join(rootDir, "_review");
    const file = path.join(rootDir, "main", "review-a.md");
    // amending the standing text without redrafting the recommendation is
    // exactly what `amends` exists to catch.
    await writeFile(file, (await readFile(file, "utf8")).replace("A stands on this provisional answer", "A now stands on a different provisional answer"));

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    const brief = await readFile(result.briefPath, "utf8");
    assert.equal(result.batchCount, 2);
    assert.ok(brief.includes("STALE: the standing text has changed since this recommendation was drafted (`recommendationStale`)"));
  });

  test("the context index is the frontier's own order; the batch (whole, {{batch}}) is too", async () => {
    const rootDir = await freshFrontierFixture("brief-order-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const listing = renderFrontier(graph);

    const wantOrder = [];
    for (const line of listing.split("\n")) {
      const m = line.match(/^- (\S+)/);
      if (m) wantOrder.push(m[1]);
    }
    assert.equal(wantOrder.length, 6);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    const brief = await readFile(result.briefPath, "utf8");

    // The batch's own presentation ({{batch}}, the '### <id>' headings) is
    // still in the frontier's order; only its index is re-sorted (the next
    // test below).
    const batchSection = brief.slice(brief.indexOf("\n## The batch"), brief.indexOf("\n## The full graph, as context"));
    const gotBatchHeadings = [...batchSection.matchAll(/^### (\S+)$/gm)].map((m) => m[1]);
    assert.deepEqual(gotBatchHeadings, wantOrder.filter((id) => byId.get(id).stage === "review"));

    const contextIndexStart = brief.indexOf("\n## The full graph, as context");
    const contextIndex = brief.slice(contextIndexStart, brief.indexOf("\n### ", contextIndexStart));
    const gotContext = [...contextIndex.matchAll(/^- (\S+) \| /gm)].map((m) => m[1]);
    assert.deepEqual(gotContext, wantOrder.filter((id) => byId.get(id).stage !== "review"));
  });

  test("the batch index is the ruling order (settles descending, then rank descending, then id ascending), not the frontier's rank order", async () => {
    const rootDir = await freshFrontierFixture("brief-ruling-order-");
    const reviewDir = path.join(rootDir, "_review");

    // review-b's own pending alternative no longer counts toward `settles`
    // (deriveSettles), so the fixture needs a real dependant to keep the
    // ruling order and the rank order apart: give periagogic-node (context,
    // outside the batch, already at a stage so `depends` is legal on it) a
    // `depends` on review-b. That is one open node waiting on review-b's
    // ruling -- one more than review-a settles -- while both still tie on
    // rank, so a test that happened to pass under rank order too would not
    // catch a regression to it.
    const periagogicFile = path.join(rootDir, "main", "periagogic-node.md");
    await writeFile(
      periagogicFile,
      (await readFile(periagogicFile, "utf8")).replace(
        "stage: periagogic\n",
        `stage: periagogic\ndepends:\n  - ${REVIEW_B}\n`,
      ),
    );

    const graph = await readGraph(rootDir);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));

    // Precondition: review-b settles more than review-a (periagogic-node
    // depends on it, review-a has no dependant), while both tie on rank.
    assert.ok(byId.get(REVIEW_B).settles > byId.get(REVIEW_A).settles, "fixture precondition: review-b settles more than review-a");
    const rankOrder = [REVIEW_A, REVIEW_B].sort((a, b) => (a < b ? -1 : 1)); // both rank 0.1667: id order
    const rulingOrder = [REVIEW_B, REVIEW_A]; // settles 1 before settles 0

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    const brief = await readFile(result.briefPath, "utf8");
    const gotBatchIndex = [...brief.matchAll(/^- (\S+) \| stage review \| /gm)].map((m) => m[1]);

    assert.deepEqual(gotBatchIndex, rulingOrder);
    assert.notDeepEqual(gotBatchIndex, rankOrder, "the batch index is not simply the rank/frontier order");
  });

  test("the lock is written, and a second run refuses while it stands", async () => {
    const rootDir = await freshFrontierFixture("brief-lock-");
    const reviewDir = path.join(rootDir, "_review");

    const first = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    const lockText = await readFile(first.lockPath, "utf8");
    const lock = JSON.parse(lockText);
    assert.equal(typeof lock.pid, "number");
    assert.equal(lock.brief, "tmp/review/frontier.brief.md");
    assert.equal(lock.out, "tmp/review/frontier.json");

    await assert.rejects(
      () => writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" }),
      (err) => {
        assert.match(err.message, /a review is running \(tmp\/review\/frontier\.lock\); wait for it, or remove the lock if its writer is gone/);
        assert.equal(err.exitCode, 3);
        assert.equal(err.lockContents, lockText);
        return true;
      },
    );
  });

  test("--dry (dry: true) prints nothing to disk: no brief file, no lock, even when one already stands", async () => {
    const rootDir = await freshFrontierFixture("brief-dry-");
    const reviewDir = path.join(rootDir, "_review");

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03", dry: true });
    assert.equal(result.batchCount, 2);
    await assert.rejects(readFile(result.briefPath), { code: "ENOENT" });
    await assert.rejects(readFile(result.lockPath), { code: "ENOENT" });

    // dry ignores a standing lock rather than refusing on it.
    await mkdir(reviewDir, { recursive: true });
    await writeFile(result.lockPath, '{"pid": 1}\n');
    const second = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03", dry: true });
    assert.equal(second.batchCount, 2);
  });

  test("refuses on a graph that does not validate, letting the reader's own message through", async () => {
    const rootDir = await freshFrontierFixture("brief-invalid-");
    const reviewDir = path.join(rootDir, "_review");
    await writeFile(path.join(rootDir, "main", "review-a.md"), "not a node file at all");

    await assert.rejects(
      () => writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" }),
      /must begin with a '---' frontmatter delimiter/,
    );
  });

  test("CLI: --dry prints the brief to stdout and never writes the lock", async () => {
    const rootDir = await freshFrontierFixture("brief-cli-");
    const stdout = execFileSync(process.execPath, [BRIEF_MJS, rootDir, "--date", "2026-09-03", "--dry"], {
      cwd: path.dirname(rootDir),
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    assert.ok(stdout.startsWith("# Clean-context review, 2026-09-03: the batch at the review stage"));
    await assert.rejects(readFile(path.join(rootDir, "..", "tmp/review/frontier.lock")), { code: "ENOENT" });
  });
});
