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
const TMP_BASE = "/home/n8/.claude/jobs/3dcce675/tmp/apply-check";

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
  test("fills every placeholder: date, frontier lines, answered list, and the literal out path", async () => {
    const rootDir = await freshFrontierFixture("brief-ok-");
    const reviewDir = path.join(rootDir, "_review");

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    assert.equal(result.briefPath, path.join(reviewDir, "frontier.brief.md"));
    assert.equal(result.lockPath, path.join(reviewDir, "frontier.lock"));
    assert.equal(result.frontierCount, 5, "every staged node, answered-ratified excluded");
    assert.equal(result.answeredCount, 1);

    const brief = await readFile(result.briefPath, "utf8");
    assert.ok(!brief.includes("{{"), `unfilled placeholder left in brief:\n${brief}`);
    assert.ok(brief.startsWith("# Clean-context review of the unanswered frontier, 2026-09-03"));
    assert.ok(brief.includes("tmp/review/frontier.json"), "the literal {{out}} path, regardless of the scratch reviewDir");

    // {{frontier}}: one line per staged node, in the given format. Every
    // node in this fixture is a root with the default boost, so all five
    // tie at rank 0.1667, and none carries an authority stamp.
    const wantLines = [
      `- ${MAIEUTIC_NODE} | stage maieutic | rank 0.1667 | no stamp | disposition/main/maieutic-node.md`,
      `- ${PERIAGOGIC_NODE} | stage periagogic | rank 0.1667 | no stamp | disposition/main/periagogic-node.md`,
      `- ${REVIEW_A} | stage review | rank 0.1667 | no stamp | disposition/main/review-a.md`,
      `- ${REVIEW_B} | stage review | rank 0.1667 | no stamp | disposition/main/review-b.md`,
      `- ${RULING_A} | stage ruling | rank 0.1667 | no stamp | disposition/main/ruling-a.md`,
    ];
    for (const line of wantLines) {
      assert.ok(brief.includes(line), `missing frontier line:\n${line}`);
    }
    assert.ok(!brief.includes(`${ANSWERED} | stage`), "the answered node has no stage line");

    // {{answered}}
    assert.ok(brief.includes(`${ANSWERED} (disposition/main/answered-ratified.md)`));
  });

  test("frontier order equals renderFrontier's own order", async () => {
    const rootDir = await freshFrontierFixture("brief-order-");
    const reviewDir = path.join(rootDir, "_review");
    const graph = await readGraph(rootDir);
    const listing = renderFrontier(graph);

    const wantOrder = [];
    for (const line of listing.split("\n")) {
      const m = line.match(/^- (\S+)/);
      if (m) {
        const node = graph.nodes.find((n) => n.id === m[1]);
        if (node.stage) wantOrder.push(m[1]);
      }
    }
    assert.equal(wantOrder.length, 5);

    const result = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03" });
    const brief = await readFile(result.briefPath, "utf8");
    const gotOrder = [...brief.matchAll(/^- (\S+) \| stage/gm)].map((m) => m[1]);
    assert.deepEqual(gotOrder, wantOrder);
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
    assert.equal(result.frontierCount, 5);
    await assert.rejects(readFile(result.briefPath), { code: "ENOENT" });
    await assert.rejects(readFile(result.lockPath), { code: "ENOENT" });

    // dry ignores a standing lock rather than refusing on it.
    await mkdir(reviewDir, { recursive: true });
    await writeFile(result.lockPath, '{"pid": 1}\n');
    const second = await writeFrontierBrief({ rootDir, reviewDir, date: "2026-09-03", dry: true });
    assert.equal(second.frontierCount, 5);
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
    });
    assert.ok(stdout.startsWith("# Clean-context review of the unanswered frontier, 2026-09-03"));
    await assert.rejects(readFile(path.join(rootDir, "..", "tmp/review/frontier.lock")), { code: "ENOENT" });
  });
});
