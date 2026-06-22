// Read-only intention-tree backfill.
//
// Snapshots the current project state into intention nodes under the repo-root
// `intentions/` directory. It is STRICTLY READ-ONLY toward GitHub: the only
// GitHub calls are `gh api` GETs (open issues, an issue's /parent). It never
// writes to GitHub.
//
// It produces two internally-linked layers that share one id space:
//   (a) PRINCIPLE ROOTS parsed from CHARTER.md's `## Principles` section
//       (each `### <Title>` becomes a parent-less node), and
//   (b) ISSUE LEAVES from open GitHub issues, linked to one another by the
//       existing GitHub issue hierarchy (`/parent`).
// There is intentionally NO cross-layer principle<->issue link; that is
// deferred dialectic work in a later epic stage.
//
// Run from anywhere (the output dir is resolved relative to this file, not cwd):
//   npx tsx intentionsutil/scripts/backfill.ts

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeNode } from "../src/store.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `intentionsutil/scripts/backfill.ts`, so the repo root is
// two directories up. Resolve from this file's own location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(scriptDir));
const intentionsDir = join(repoRoot, "intentions");
const charterPath = join(repoRoot, "CHARTER.md");

// --- Helpers ---------------------------------------------------------------

/** lowercase, collapse runs of non-alphanumerics to single hyphens, trim. */
function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Run a `gh` subcommand and return stdout. Throws on non-zero exit. */
function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf8" });
}

// --- Principle roots from CHARTER.md ---------------------------------------

interface Principle {
  title: string;
  prose: string;
}

/**
 * Parse the `## Principles` section of CHARTER.md into principle subsections.
 *
 * The section runs from the `## Principles` line to the next top-level `## `
 * heading (`## Strategy`). Within it, each `### <Title>` line starts a
 * subsection whose prose is the lines up to the next `### ` or section-ending
 * `## `. Boundaries anchor on `^## ` (exactly two hashes) so `### ` subsections
 * never end the section, and on `^### ` for titles.
 */
function parsePrinciples(charter: string): Principle[] {
  const lines = charter.split("\n");

  // Find the `## Principles` line, then the next `^## ` line after it.
  const startIdx = lines.findIndex((l) => /^## Principles\s*$/.test(l));
  if (startIdx === -1) {
    throw new Error("CHARTER.md: could not find a `## Principles` section");
  }
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  const section = lines.slice(startIdx + 1, endIdx);
  const principles: Principle[] = [];
  let current: { title: string; body: string[] } | null = null;
  for (const line of section) {
    const m = /^### (.+)$/.exec(line);
    if (m) {
      if (current) {
        principles.push({ title: current.title, prose: current.body.join("\n").trim() });
      }
      current = { title: m[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) {
    principles.push({ title: current.title, prose: current.body.join("\n").trim() });
  }
  if (principles.length === 0) {
    throw new Error("CHARTER.md: `## Principles` section contained no `### ` subsections");
  }
  return principles;
}

// --- Issue leaves from open GitHub issues ----------------------------------

interface OpenIssue {
  number: number;
  title: string;
  body: string | null;
}

/**
 * Fetch all open issues (PRs excluded). The REST `/issues` endpoint includes
 * pull requests; any item carrying a `pull_request` key is a PR and is skipped.
 *
 * `--paginate --slurp` returns a single JSON array-of-arrays (one inner array
 * per page); we flatten it. This is robust regardless of page count.
 */
function fetchOpenIssues(): OpenIssue[] {
  const out = gh([
    "api",
    "--paginate",
    "--slurp",
    "/repos/{owner}/{repo}/issues?state=open&per_page=100",
  ]);
  const pages = JSON.parse(out) as Array<Array<Record<string, unknown>>>;
  const items = pages.flat();
  return items
    .filter((it) => it.pull_request === undefined)
    .map((it) => ({
      number: it.number as number,
      title: (it.title as string) ?? "",
      body: (it.body as string | null) ?? null,
    }));
}

/**
 * Extract a `## Scope` section's text from an issue body: lines from `^## Scope`
 * to the next `^## ` or EOF, trimmed. Returns null when there is no such
 * section.
 */
function extractScope(body: string | null): string | null {
  if (!body) return null;
  const lines = body.split("\n");
  const startIdx = lines.findIndex((l) => /^## Scope\s*$/.test(l));
  if (startIdx === -1) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  const text = lines.slice(startIdx + 1, endIdx).join("\n").trim();
  return text === "" ? null : text;
}

/**
 * Resolve an issue's GitHub parent number. The `/parent` endpoint 404s (gh
 * exits non-zero, so execFileSync throws) when there is no parent — that is the
 * one documented expected error, caught here and only here so real errors (auth,
 * rate-limit) elsewhere still surface. Returns null when there is no parent.
 */
function fetchParentNumber(issueNumber: number): number | null {
  let out: string;
  try {
    out = gh(["api", `/repos/{owner}/{repo}/issues/${issueNumber}/parent`, "--jq", ".number"]);
  } catch {
    // Expected: no parent → /parent 404s.
    return null;
  }
  const trimmed = out.trim();
  if (trimmed === "") return null;
  return Number(trimmed);
}

// --- Main ------------------------------------------------------------------

/**
 * Remove existing `*.md` node files so regeneration is a true point-in-time
 * snapshot — without this, a node whose source disappeared (e.g. a closed
 * issue) would linger as a stale orphan on a rerun. Non-node files (README.md)
 * are preserved.
 */
function pruneStaleNodes(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name.endsWith(".md") && name !== "README.md") {
      rmSync(join(dir, name));
    }
  }
}

function main(): void {
  mkdirSync(intentionsDir, { recursive: true });
  pruneStaleNodes(intentionsDir);

  // Principle roots.
  const charter = readFileSync(charterPath, "utf8");
  const principles = parsePrinciples(charter);
  for (const p of principles) {
    writeNode(intentionsDir, {
      id: `principle-${kebab(p.title)}`,
      statement: p.title, // verbatim heading text, commas and all
      owner: "human",
      status: "codified", // charter principles are settled
      parent: null,
      rationale: p.prose,
    } as never);
  }

  // Issue leaves — two passes.
  // Pass 1: collect the full set of open issue numbers (PRs already excluded)
  // so parent membership can be checked.
  const openIssues = fetchOpenIssues();
  const openNumbers = new Set(openIssues.map((i) => i.number));

  // Pass 2: build and write each node.
  for (const issue of openIssues) {
    const scope = extractScope(issue.body);
    const parentNum = fetchParentNumber(issue.number);
    // Referential integrity: only link a parent that is itself an open issue
    // (and thus has a node file). A GitHub parent that is CLOSED has no node
    // file, so its dangling reference is nulled rather than emitted. Every
    // non-null parent therefore points to an existing node file.
    const parent =
      parentNum !== null && openNumbers.has(parentNum) ? `issue-${parentNum}` : null;

    writeNode(intentionsDir, {
      id: `issue-${issue.number}`,
      statement: issue.title.trim(),
      owner: "human",
      status: "raw", // not yet refined through the dialectic
      parent,
      rationale: scope,
      reading: scope,
    } as never);
  }

  const total = principles.length + openIssues.length;
  console.log(
    `Backfill complete: ${principles.length} principle roots, ` +
      `${openIssues.length} issue leaves, ${total} nodes total → ${intentionsDir}`,
  );
}

main();
