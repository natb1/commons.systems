#!/usr/bin/env node
// .claude/skills/align-review/brief.mjs
//
// Writes one clean-context-review brief per node id: the ancestry
// projection (by the same code path as `project.mjs --ancestry --local`),
// then brief.md with its placeholders filled. See SKILL.md §2 and brief.md.
//
// Usage:
//   node brief.mjs <node id> [<node id> ...] [--amendment "<text>"]

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readGraph } from "../../../packages/disposition/read.mjs";
import { writeAncestry } from "../../../packages/disposition/project.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRIEF_TEMPLATE_PATH = path.join(HERE, "brief.md");

function parseArgs(argv) {
  const ids = [];
  let amendment = null;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--amendment") {
      const v = argv[++i];
      if (v === undefined) throw new Error("--amendment needs a value");
      amendment = v;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag ${a}`);
    } else {
      ids.push(a);
    }
  }
  if (ids.length === 0) {
    throw new Error('usage: node brief.mjs <node id> [<node id> ...] [--amendment "<text>"]');
  }
  return { ids, amendment };
}

/**
 * Every other node's file that differs from `origin/disposition`, as node
 * ids: `git diff --name-only origin/disposition` (working tree + index
 * against that ref) union `git status --porcelain` (to also catch
 * untracked new node files, which plain `diff` never lists), read-only,
 * run inside `gitDir`. Best-effort: a `gitDir` that is not a git checkout
 * of the disposition ref (a test fixture has no such thing) yields no
 * git-derived siblings rather than throwing, since the review-stage half
 * of the sibling set below stands on its own.
 */
function deriveChangedIds(gitDir, graph) {
  const run = (args) => {
    try {
      return execFileSync("git", args, { cwd: gitDir, encoding: "utf8" });
    } catch {
      return "";
    }
  };
  const diffOut = run(["diff", "--name-only", "origin/disposition"]);
  const statusOut = run(["status", "--porcelain"]);

  const relPaths = new Set();
  for (const line of diffOut.split("\n")) {
    const p = line.trim();
    if (p) relPaths.add(p);
  }
  for (const line of statusOut.split("\n")) {
    const m = line.match(/^..\s+(.*)$/);
    if (!m) continue;
    const parts = m[1].split(" -> ");
    relPaths.add(parts[parts.length - 1].trim());
  }

  const byPath = new Map(graph.nodes.map((n) => [n.path, n.id]));
  const ids = [];
  for (const p of relPaths) {
    const clean = p.startsWith('"') && p.endsWith('"') ? JSON.parse(p) : p;
    const normalized = clean.split(path.sep).join("/");
    if (byPath.has(normalized)) ids.push(byPath.get(normalized));
  }
  return ids;
}

/**
 * Write the ancestry projection and the filled brief for every id, deriving
 * `{{siblings}}` once for the whole run (every other node at `stage:
 * review`, union every node file the graph worktree holds changed against
 * `origin/disposition`) and excluding the id under review from its own
 * sibling list. Refuses the whole run -- writing nothing -- if any id
 * fails its stage precondition or does not exist.
 *
 * @returns {Promise<{id:string, ancestryFile:string, briefFile:string, siblingsJsonFile:string, outFile:string}[]>}
 */
export async function writeBriefs({ rootDir, reviewDir, gitDir, ids, amendment = null }) {
  const graph = await readGraph(rootDir);
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const requiredStage = amendment ? "ruling" : "review";

  const problems = [];
  for (const id of ids) {
    const node = nodesById.get(id);
    if (!node) {
      problems.push(`refusing ${id}: no such node`);
    } else if (node.stage !== requiredStage) {
      problems.push(`refusing ${id}: stage is '${node.stage}', expected '${requiredStage}'${amendment ? " (amendment review)" : ""}`);
    }
  }
  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }

  const reviewStageIds = graph.nodes.filter((n) => n.stage === "review").map((n) => n.id);
  const changedIds = deriveChangedIds(gitDir, graph);
  const unionAll = new Set([...reviewStageIds, ...changedIds]);

  const template = await readFile(BRIEF_TEMPLATE_PATH, "utf8");
  await mkdir(reviewDir, { recursive: true });

  const results = [];
  for (const id of ids) {
    const node = nodesById.get(id);
    const siblingIds = [...unionAll].filter((x) => x !== id).sort();
    const siblingsRendered = siblingIds.length > 0
      ? siblingIds.map((x) => `\`${path.resolve(rootDir, nodesById.get(x).path)}\``).join(", ")
      : "none";

    const ancestryFile = path.join(reviewDir, `${node.slug}.ancestry.md`);
    await writeAncestry(graph, id, ancestryFile);

    const briefFile = path.join(reviewDir, `${node.slug}.brief.md`);
    const outFile = path.join(reviewDir, `${node.slug}.json`);
    const siblingsJsonFile = path.join(reviewDir, `${node.slug}.siblings.json`);

    const filled = template
      .split("{{id}}").join(id)
      .split("{{path}}").join(path.resolve(rootDir, node.path))
      .split("{{ancestry}}").join(ancestryFile)
      .split("{{amendment}}").join(amendment ?? "the whole node")
      .split("{{siblings}}").join(siblingsRendered)
      .split("{{out}}").join(outFile);

    await writeFile(briefFile, filled);
    await writeFile(siblingsJsonFile, `${JSON.stringify(siblingIds, null, 2)}\n`);

    results.push({ id, ancestryFile, briefFile, siblingsJsonFile, outFile });
  }
  return results;
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
    const rootDir = path.resolve(process.cwd(), "disposition");
    const reviewDir = path.resolve(process.cwd(), "tmp/review");
    try {
      const results = await writeBriefs({ rootDir, reviewDir, gitDir: rootDir, ids: opts.ids, amendment: opts.amendment });
      for (const r of results) console.log(r.briefFile);
    } catch (err) {
      process.stderr.write(`${err.message}\n`);
      process.exitCode = 1;
    }
  })();
}
