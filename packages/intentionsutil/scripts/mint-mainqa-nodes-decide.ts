// mint-mainqa-nodes-decide — the network-free DECISION half of the main-qa
// destination-node mint. A thin CLI over ../src/mainqaRouting.ts: it reads a
// `/qa-fix` record-time payload, reads the SOURCE node out of a store the
// caller names, and emits one decision per non-empty lane. The LANDING half is
// the bash `mint-mainqa-nodes` next to this file (write-node.ts + graph-commit),
// mirroring the decision/land split of hold-node-decide.ts / hold-node.
//
// This tool WRITES NOTHING, and runs no git and no gh. It reads exactly one
// file (the source node) plus the payload.
//
// Usage:
//   node --import tsx/esm mint-mainqa-nodes-decide.ts --dir <intentions-dir>
//     [--file <payload.json>] [--existing <id>]... [--now <YYYY-MM-DD>]
//     [--ids-only]
//
// `--dir <intentions-dir>` is REQUIRED and has no default, for the reason
// write-node.ts documents at its own `parseIntentionsDir`
// (strategy-graph-native-dispatch clarification 194, ADOPTED): the store a tool
// reads must be a property of what the CALLER asked for, never of which copy of
// the script happened to run. Unlike write-node.ts, a usage error here exits 2
// rather than 1, matching the sibling hold-node-decide.ts so the bash half can
// keep the project-wide "2 means usage error" contract.
//
// Note what `--dir` names for THIS tool: the store to READ THE SOURCE NODE from.
// `mint-mainqa-nodes` passes a temp directory holding origin/main's snapshot of
// the source, which is how the source's own working-tree file is never opened —
// not for read, not for write — on a mint. (The destinations are written
// elsewhere, by write-node.ts, under the real intentions dir.)
//
// THE existingIds SPLIT. `decideMint` needs to know which destination files
// already exist, but this module is deliberately fs-free about that question
// and this CLI is deliberately git-free. So existence is the BASH half's job:
// it probes `origin/main:intentions/<id>.md` directly (the only authority that
// matters — a mint lands on main, and a far-behind PR-branch worktree's local
// copy is not evidence) and reports the answer back through `--existing <id>`,
// repeatable. To learn WHICH ids to probe without duplicating the id-derivation
// rule in bash, the caller runs this tool twice, exactly as hold-node does for
// its hold id: once with `--ids-only` to learn the candidate ids, then again
// with the `--existing` flags that probe produced. `mainqaNodeId` stays the
// single source of truth for id derivation.
//
// Payload (stdin, or `--file <path>`):
//   { "source_id": "tactic-…", "pr": 123, "items": [ { … }, … ] }
// Each item: { id, title, url_path, expected_outcome, finding,
//              verifiability?, check? }.
//
// `verifiability` is OPTIONAL here and defaults to "MACHINE". That default is
// this CLI's job, not the module's: mainqaRouting.ts's header states the
// MACHINE default for an unmarked item belongs to the caller, and this is the
// caller. A present-but-unrecognized mark is a hard error, never a silent
// default (.claude/rules/code-style.md).
//
// Stdout:
//   default    — one JSON MainqaMintDecision object per line (JSONL), lane order
//                machine then author, only for lanes that have items.
//   --ids-only — one candidate node id per line, same lane order.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readNode } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";
import {
  MAINQA_LANES,
  decideMint,
  groupByLane,
  mainqaNodeId,
  type DecideMintArgs,
  type MainqaItem,
  type VerifiabilityMark,
} from "../src/mainqaRouting.js";

const USAGE =
  "usage: mint-mainqa-nodes-decide.ts --dir <intentions-dir> [--file <payload.json>]\n" +
  "  [--existing <id>]... [--now <YYYY-MM-DD>] [--ids-only]\n" +
  "  Reads the payload from <path>, or from stdin when --file is omitted.\n";

function fail(message: string): never {
  process.stderr.write(`mint-mainqa-nodes-decide: ${message}\n`);
  process.exit(2);
}

// --- Payload validation (a runtime guard at a system edge, not a fallback) ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Every item field this CLI accepts is rendered by `buildMainqaBody` into
 * exactly one markdown line (`- **<id> — <title>**`, `  - Finding: <finding>`, …). A value
 * carrying a newline therefore does not merely look untidy — it breaks the
 * bullet structure `/qa-main`'s node lane parses back out (`.claude/skills/
 * qa-main/SKILL.md`, "New shape"), silently orphaning every sub-line after the
 * break, and a continuation line beginning `## ` would inject a heading into
 * the node body — including a `## needs-main…` one, which is exactly the
 * heading a destination node must never carry (`hasNeedsMainResidue`,
 * src/transitions.ts). Reject at the edge with a clear error rather than
 * silently collapsing the author's text (.claude/rules/code-style.md).
 */
function assertSingleLine(value: string, key: string, where: string): void {
  if (/[\r\n]/.test(value)) {
    fail(
      `${where}: "${key}" must be a single line — it is rendered as one markdown ` +
        `line on the destination node and a newline breaks the item parse; got ` +
        `${JSON.stringify(value)}`,
    );
  }
}

function requireString(record: Record<string, unknown>, key: string, where: string): string {
  const value = record[key];
  if (typeof value !== "string" || value === "") {
    fail(`${where}: "${key}" must be a non-empty string, got ${JSON.stringify(value)}`);
  }
  assertSingleLine(value, key, where);
  return value;
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
  where: string,
): string | null {
  const value = record[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    fail(`${where}: "${key}" must be a string when present, got ${JSON.stringify(value)}`);
  }
  assertSingleLine(value, key, where);
  return value;
}

const VERIFIABILITY_MARKS: readonly VerifiabilityMark[] = ["MACHINE", "AUTHOR", "WAIT"];

/**
 * The unmarked-item MACHINE default lives here (see the header). An item that
 * DOES carry a mark must carry a recognized one — an unrecognized mark silently
 * defaulted to MACHINE would route an author-required item into the autonomous
 * lane, which is the one mistake this seam must never make.
 */
function parseVerifiability(record: Record<string, unknown>, where: string): VerifiabilityMark {
  const raw = record.verifiability;
  if (raw === undefined || raw === null || raw === "") return "MACHINE";
  if (typeof raw !== "string") {
    fail(`${where}: "verifiability" must be a string, got ${JSON.stringify(raw)}`);
  }
  const upper = raw.toUpperCase();
  const mark = VERIFIABILITY_MARKS.find((candidate) => candidate === upper);
  if (mark === undefined) {
    fail(
      `${where}: "verifiability" must be one of ${VERIFIABILITY_MARKS.join("|")}, got ` +
        `${JSON.stringify(raw)}`,
    );
  }
  return mark;
}

function parseItem(value: unknown, index: number): MainqaItem {
  if (!isRecord(value)) {
    fail(`items[${index}] must be a JSON object, got ${JSON.stringify(value)}`);
  }
  const where = `items[${index}]`;
  return {
    id: requireString(value, "id", where),
    title: requireString(value, "title", where),
    url_path: requireString(value, "url_path", where),
    expected_outcome: requireString(value, "expected_outcome", where),
    finding: requireString(value, "finding", where),
    verifiability: parseVerifiability(value, where),
    check: optionalString(value, "check", where),
  };
}

interface Payload {
  sourceId: string;
  pr: number;
  items: MainqaItem[];
}

function parsePayload(jsonText: string): Payload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    fail(`the payload is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!isRecord(parsed)) {
    fail(`the payload must be a JSON object of the shape {source_id, pr, items}`);
  }
  const sourceId = requireString(parsed, "source_id", "payload");
  const pr = parsed.pr;
  if (typeof pr !== "number" || !Number.isInteger(pr) || pr <= 0) {
    // A destination node is born carrying the source's already-merged PR, so a
    // missing/zero PR is a caller bug, not a state to render as "PR #null".
    fail(`payload: "pr" must be a positive integer, got ${JSON.stringify(pr)}`);
  }
  const rawItems = parsed.items;
  if (!Array.isArray(rawItems)) {
    fail(`payload: "items" must be an array, got ${JSON.stringify(rawItems)}`);
  }
  if (rawItems.length === 0) {
    fail(`payload: "items" is empty — there is nothing to mint a destination node for`);
  }
  return { sourceId, pr, items: rawItems.map(parseItem) };
}

// --- Args --------------------------------------------------------------------

interface Args {
  intentionsDir: string;
  payloadFile: string | null;
  existingIds: string[];
  now: string;
  idsOnly: boolean;
}

function parseArgs(argv: string[]): Args {
  let intentionsDir: string | null = null;
  let payloadFile: string | null = null;
  const existingIds: string[] = [];
  let now: string | null = null;
  let idsOnly = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") intentionsDir = argv[++i] ?? null;
    else if (arg === "--file") payloadFile = argv[++i] ?? null;
    else if (arg === "--existing") {
      const id = argv[++i];
      if (id === undefined || id === "") fail("--existing requires a node id");
      existingIds.push(id);
    } else if (arg === "--now") now = argv[++i] ?? null;
    else if (arg === "--ids-only") idsOnly = true;
    else fail(`unknown argument "${arg}"\n${USAGE}`);
  }

  if (intentionsDir === null || intentionsDir === "" || intentionsDir.startsWith("-")) {
    fail(
      "--dir <intentions-dir> is required and has no default — name the store to read the " +
        "source node from. This script does not infer the store from its own file location.\n" +
        USAGE,
    );
  }
  if (payloadFile !== null && (payloadFile === "" || payloadFile.startsWith("-"))) {
    fail(`--file requires a path argument\n${USAGE}`);
  }
  if (now === null) now = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(now)) fail(`--now must be YYYY-MM-DD, got "${now}"`);

  return { intentionsDir, payloadFile, existingIds, now, idsOnly };
}

// --- Main --------------------------------------------------------------------

/**
 * Build the `decideMint` arguments, reading `serves` and the execution branch
 * off the source node. A source at `main-qa` has just merged a PR, so it always
 * carries an `execution.branch`; its absence is genuine breakage and gets a
 * clear error rather than a manufactured default branch name
 * (.claude/rules/code-style.md).
 */
function buildDecideArgs(args: Args, payload: Payload): DecideMintArgs {
  const nodePath = join(args.intentionsDir, `${payload.sourceId}.md`);
  let source: IntentionNode;
  try {
    source = readNode(args.intentionsDir, payload.sourceId);
  } catch (err) {
    fail(
      `could not read the source node at ${nodePath}: ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const branch = source.execution === null ? null : source.execution.branch;
  if (branch === null || branch === "") {
    fail(
      `source node "${payload.sourceId}" has no execution.branch — a main-qa destination ` +
        `records the branch its source merged from, and there is nothing to record`,
    );
  }
  return {
    sourceId: payload.sourceId,
    items: payload.items,
    branch,
    pr: payload.pr,
    serves: source.serves,
    since: args.now,
    existingIds: args.existingIds,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const payloadText =
    args.payloadFile === null
      ? readFileSync("/dev/stdin", "utf8")
      : readFileSync(args.payloadFile, "utf8");
  const payload = parsePayload(payloadText);
  // Built in BOTH modes so a bad source id / missing execution.branch fails on
  // the caller's cheap first (--ids-only) run, before it writes anything.
  const decideArgs = buildDecideArgs(args, payload);

  if (args.idsOnly) {
    const grouped = groupByLane(payload.items);
    const ids = MAINQA_LANES.filter((lane) => grouped[lane].length > 0).map((lane) =>
      mainqaNodeId(payload.sourceId, lane),
    );
    process.stdout.write(ids.map((id) => `${id}\n`).join(""));
    return;
  }

  const decisions = decideMint(decideArgs);
  process.stdout.write(decisions.map((decision) => `${JSON.stringify(decision)}\n`).join(""));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
