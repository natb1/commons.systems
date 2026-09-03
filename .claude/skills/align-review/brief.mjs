#!/usr/bin/env node
// .claude/skills/align-review/brief.mjs
//
// Writes one clean-context-review brief for the whole unanswered frontier:
// brief.md with its placeholders filled from the graph's current frontier
// and answered set (SKILL.md §2, frontier-consistency.md: "EVERY invocation
// ... is a batch operation that evaluates the full unanswered frontier").
// Locks tmp/review/frontier.lock against a concurrent batch
// (frontier-consistency.md: "One review runs at a time over the frontier").
//
// Usage:
//   node brief.mjs [rootDir] [--date YYYY-MM-DD] [--dry]

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readGraph } from "../../../packages/disposition/read.mjs";
import { renderFrontier } from "../../../packages/disposition/project.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRIEF_TEMPLATE_PATH = path.join(HERE, "brief.md");
const OUT_FILE = "tmp/review/frontier.json";
const LOCK_MESSAGE = "a review is running (tmp/review/frontier.lock); wait for it, or remove the lock if its writer is gone";

function todayIsoUtc() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const opts = { rootDir: null, date: null, dry: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--date") {
      const v = argv[++i];
      if (v === undefined) throw new Error("--date needs a value");
      opts.date = v;
    } else if (a === "--dry") {
      opts.dry = true;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag ${a}`);
    } else if (opts.rootDir === null) {
      opts.rootDir = a;
    } else {
      throw new Error(`unexpected argument ${a}`);
    }
  }
  return opts;
}

function stampText(node) {
  return node.authority ? `${node.authority.class}, ${node.authority.by}, ${node.authority.date}` : "no stamp";
}

/**
 * The frontier's order, exactly as `renderFrontier` (descending rank, id
 * tiebreak) lists it -- recovered from its own rendered listing rather than
 * re-implementing the comparator, since `renderFrontier` does not expose
 * the sorted id list on its own. Every node's own line starts with `- `
 * followed immediately by its id (ids never contain a space); every other
 * line renderFrontier emits is indented, so this cannot mistake one for
 * the other.
 *
 * @param {{nodes: object[]}} graph
 * @returns {string[]} every node id, in the frontier's order
 */
function frontierOrderIds(graph) {
  const listing = renderFrontier(graph);
  const ids = [];
  for (const line of listing.split("\n")) {
    const m = line.match(/^- (\S+)/);
    if (m) ids.push(m[1]);
  }
  return ids;
}

/**
 * Fill brief.md for the whole unanswered frontier and write it, locking
 * tmp/review/frontier.lock against a concurrent batch -- unless `dry`, which
 * prints the filled brief to stdout and writes nothing at all, lock
 * included. Refuses (letting the reader's own message through) on a graph
 * that does not validate.
 *
 * @returns {Promise<{briefPath: string, lockPath: string, frontierCount: number, answeredCount: number}>}
 */
export async function writeFrontierBrief({ rootDir, reviewDir, date = null, dry = false }) {
  const lockPath = path.join(reviewDir, "frontier.lock");
  const briefPath = path.join(reviewDir, "frontier.brief.md");

  if (!dry) {
    let existingLock = null;
    try {
      existingLock = await readFile(lockPath, "utf8");
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    if (existingLock !== null) {
      const lockErr = new Error(LOCK_MESSAGE);
      lockErr.exitCode = 3;
      lockErr.lockContents = existingLock;
      throw lockErr;
    }
  }

  const graph = await readGraph(rootDir);
  const effectiveDate = date ?? todayIsoUtc();

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const frontierNodes = frontierOrderIds(graph)
    .map((id) => byId.get(id))
    .filter((n) => n && n.stage);
  const frontierText = frontierNodes
    .map((n) => `- ${n.id} | stage ${n.stage} | rank ${n.rank.toFixed(4)} | ${stampText(n)} | disposition/${n.graph}/${n.slug}.md`)
    .join("\n");

  const answeredNodes = graph.nodes.filter((n) => n.status === "answered");
  const answeredText = answeredNodes.length > 0
    ? answeredNodes.map((n) => `${n.id} (disposition/${n.graph}/${n.slug}.md)`).join(", ")
    : "none";

  const template = await readFile(BRIEF_TEMPLATE_PATH, "utf8");
  const filled = template
    .split("{{date}}").join(effectiveDate)
    .split("{{frontier}}").join(frontierText)
    .split("{{answered}}").join(answeredText)
    .split("{{out}}").join(OUT_FILE);

  if (dry) {
    process.stdout.write(filled);
    return { briefPath, lockPath, frontierCount: frontierNodes.length, answeredCount: answeredNodes.length };
  }

  await mkdir(reviewDir, { recursive: true });
  await writeFile(briefPath, filled);
  await writeFile(
    lockPath,
    `${JSON.stringify({ pid: process.pid, started: new Date().toISOString(), brief: "tmp/review/frontier.brief.md", out: OUT_FILE }, null, 2)}\n`,
  );

  return { briefPath, lockPath, frontierCount: frontierNodes.length, answeredCount: answeredNodes.length };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  (async () => {
    let opts;
    try {
      opts = parseArgs(process.argv.slice(2));
    } catch (err) {
      process.stderr.write(`${err.message}\n`);
      process.exitCode = 1;
      return;
    }
    const rootDir = path.resolve(process.cwd(), opts.rootDir ?? "disposition");
    const reviewDir = path.resolve(process.cwd(), "tmp/review");
    try {
      const result = await writeFrontierBrief({ rootDir, reviewDir, date: opts.date, dry: opts.dry });
      if (!opts.dry) {
        console.log(result.briefPath);
      }
    } catch (err) {
      if (err.lockContents) console.log(err.lockContents);
      process.stderr.write(`${err.message}\n`);
      process.exitCode = err.exitCode ?? 1;
    }
  })();
}
