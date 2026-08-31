// Ledger census — enumerate every `kind: delegation` record with its
// git-derived entry date so the completeness pass of the portfolio review
// (strategy-complete-ledger's sensor) is runnable.
//
// This is a read-only, local-first CLI. It prints every delegation record with
// its entry date (the first commit that added `intentions/<id>.md`),
// `last_assessed`, `origin`, and status — sorted by entry date ascending — then
// the standing completeness question and the strategy's in-scope category
// prompts. It writes nothing, makes no gh/network call, and touches no sensor
// registry: the sensor here is the human office-hours pass, not a registry
// sensor.
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   node --import tsx/esm packages/intentionsutil/scripts/ledger-census.ts

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/ledger-census.ts`, so the
// repo root is three directories up. Resolve from this file's own location,
// never from cwd — the git entry-date lookup runs with `cwd: repoRoot`.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

/** Renders when a record has no git add-date yet (e.g. untracked). */
export const UNRECORDED = "unrecorded";

/** Verbatim completeness question the sweep closes with. */
export const COMPLETENESS_QUESTION =
  "What does the household now depend on that carries no record?";

/**
 * In-scope category prompts from strategy-complete-ledger's scope sentence:
 * every institutional attachment, digital or not.
 */
export const CATEGORY_PROMPTS = [
  "utilities",
  "insurance",
  "transport",
  "food supply",
  "digital/institutional attachments generally",
];

/**
 * A per-id entry-date lookup. Returns a `%as` date string (YYYY-MM-DD) or
 * `UNRECORDED` when the record has no add commit yet. Injected so the pure
 * rendering below is testable without a git fixture.
 */
export type EntryDateLookup = (id: string) => string;

/** One census row, already resolved to display strings. */
export interface CensusRow {
  id: string;
  entry: string;
  lastAssessed: string;
  origin: string;
  status: string;
}

function attrString(node: IntentionNode, key: string): string {
  const value = node.attributes[key];
  return typeof value === "string" && value.length > 0 ? value : "-";
}

/**
 * Project delegation nodes into census rows, sorted by entry date ascending.
 * `UNRECORDED` rows sort last (no date yet), then by id for a stable order.
 */
export function buildRows(
  nodes: IntentionNode[],
  entryDateOf: EntryDateLookup,
): CensusRow[] {
  const rows = nodes
    .filter((n) => n.kind === "delegation")
    .map((n) => ({
      id: n.id,
      entry: entryDateOf(n.id),
      lastAssessed: attrString(n, "last_assessed"),
      origin: attrString(n, "origin"),
      status: n.status,
    }));
  const sortKey = (r: CensusRow) => (r.entry === UNRECORDED ? "9999-99-99" : r.entry);
  return rows.sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    if (ka !== kb) return ka < kb ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Render the census: a padded table, the record count, question, and prompts. */
export function renderCensus(rows: CensusRow[]): string {
  const headers: CensusRow = {
    id: "ID",
    entry: "ENTRY",
    lastAssessed: "LAST ASSESSED",
    origin: "ORIGIN",
    status: "STATUS",
  };
  const cols: (keyof CensusRow)[] = ["id", "entry", "lastAssessed", "origin", "status"];
  const width = (col: keyof CensusRow) =>
    Math.max(headers[col].length, ...rows.map((r) => r[col].length));
  const widths: Record<keyof CensusRow, number> = {
    id: width("id"),
    entry: width("entry"),
    lastAssessed: width("lastAssessed"),
    origin: width("origin"),
    status: width("status"),
  };
  const line = (r: CensusRow) =>
    cols.map((c) => r[c].padEnd(widths[c])).join("  ").trimEnd();

  const lines: string[] = [];
  lines.push(line(headers));
  for (const r of rows) lines.push(line(r));
  lines.push("");
  lines.push(`${rows.length} delegation record${rows.length === 1 ? "" : "s"}.`);
  lines.push("");
  lines.push(`Completeness question: ${COMPLETENESS_QUESTION}`);
  lines.push("In-scope categories:");
  for (const prompt of CATEGORY_PROMPTS) lines.push(`  - ${prompt}`);
  return lines.join("\n");
}

/**
 * Parse `git log --format=%as` output into an entry date: git lists newest-first,
 * so the LAST non-blank line is the earliest (first) add. An empty result
 * (untracked) is `UNRECORDED`. Pure string → date; separated from the
 * `execFileSync` call so the last-line-wins rule is unit-testable without a git
 * fixture.
 */
export function parseEntryDate(out: string): string {
  const dates = out.split("\n").filter((l) => l.length > 0);
  return dates.length === 0 ? UNRECORDED : dates[dates.length - 1];
}

/**
 * Git-derived entry date for a record: the first commit that added
 * `intentions/<id>.md`. `--diff-filter=A` selects add events; `--follow` tracks
 * across renames; the LAST line of `%as` output is the earliest (first) add. No
 * fallback on a real git failure — a nonzero exit throws with git's own message
 * (`.claude/rules/code-style.md`); an empty result (untracked) is `UNRECORDED`.
 *
 * Refuses to run against a shallow checkout: with a truncated history the
 * boundary commit has no parent to diff against, so `--diff-filter=A` reports
 * every path present there as newly Added — silently yielding a plausible but
 * wrong (too-recent) date. Fail loudly instead (`.claude/rules/code-style.md`).
 */
export function gitEntryDate(root: string, id: string): string {
  const isShallow = execFileSync(
    "git",
    ["rev-parse", "--is-shallow-repository"],
    { cwd: root, encoding: "utf8" },
  ).trim();
  if (isShallow === "true") {
    throw new Error(
      `Cannot derive entry dates from a shallow checkout (${root}): ` +
        "the shallow boundary makes --diff-filter=A report wrong add dates. " +
        "Re-run from a full clone (e.g. `git fetch --unshallow`).",
    );
  }
  const out = execFileSync(
    "git",
    ["log", "--follow", "--diff-filter=A", "--format=%as", "--", `intentions/${id}.md`],
    { cwd: root, encoding: "utf8" },
  );
  return parseEntryDate(out);
}

function main(): void {
  const nodes = listNodes(intentionsDir);
  const rows = buildRows(nodes, (id) => gitEntryDate(repoRoot, id));
  process.stdout.write(renderCensus(rows) + "\n");
}

// Run only when invoked directly, not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
