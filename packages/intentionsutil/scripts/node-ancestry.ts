// node-ancestry — a bounded ancestry-projection primitive for a graph node.
//
// A worker provisioned for a tactic already holds the tactic itself, but the
// decision context that justifies it lives UP the graph: the strategy it
// serves, that strategy's virtue, the parent tactics in its subtree, and the
// clarifications/conditions/success-signals recorded on each. This script walks
// that ancestry (a bounded BFS closure over BOTH `parent` and `serves` edges,
// nearest-first) and renders it as a single read-only Markdown context file the
// worker — and any human — can read.
//
// Data shape: ONE core computation. `buildAncestryProjection` returns the
// structured object (for unit tests); `renderAncestryProjection` produces the
// single Markdown rendering every consumer reads. There is no JSON output and
// no second format — every consumer is a reader.
//
// The walk is bounded three ways so the primitive never hangs or blows a
// context budget: a hop cap (`MAX_ANCESTORS`), a per-ancestor clarification-title
// cap (`MAX_CLARIFICATION_TITLES`), and a firm rendered-byte ceiling
// (`MAX_PROJECTION_BYTES`). Every truncation is both silent-safe (the projection
// stays well-formed, truncated only at a node boundary) and loud (a `notes`
// entry the CLI echoes to stderr as a WARNING).
//
// This extends the shape of `servingStrategyIds` (src/router.ts) — a
// `parent`-walk accumulating `serves` — past the tactic→strategy boundary it
// stops at, additionally emitting the ancestor nodes themselves. It does not
// modify `servingStrategyIds`.
//
// The intentions/ directory defaults to the one resolved from `import.meta.url`,
// not cwd, matching strategy-fingerprint.ts / dump-node.ts; provision passes an
// explicit `--dir`.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/node-ancestry.ts <node-id> \
//     [--dir <intentions-dir>] [--out <path>]
//
// Without --out, the rendered Markdown is written to stdout; with --out, it is
// written to that path (parent dirs created). Truncation notices are written to
// stderr as WARNING lines regardless.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode } from "../src/store.js";
import type { IntentionNode, SuccessSignal } from "../src/schema.js";

// The script lives at `packages/intentionsutil/scripts/node-ancestry.ts`, so the
// repo root is three directories up. Resolve from this file's own location,
// never from cwd (matches strategy-fingerprint.ts / dump-node.ts).
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const defaultIntentionsDir = join(repoRoot, "intentions");

// --- Bounds ----------------------------------------------------------------
// Inline cap constants following the house `LIMIT + "…and N more"` idiom
// (src/digest.ts). No shared truncation helper exists, so each is defined here.

/** Hop/count cap on the walk — cycle & unexpectedly-deep-graph guard. A real
 *  chain is <10 nodes, so 64 is generous headroom that still bounds a
 *  pathological graph. Belt-and-suspenders alongside the `visited` set. */
export const MAX_ANCESTORS = 64;

/** Per-ancestor clarification-title cap. Beyond it, the first N questions are
 *  kept (titles only) and the rest counted in `clarifications_omitted`; full
 *  histories are pulled on demand via `readNode`, never inlined by default. */
export const MAX_CLARIFICATION_TITLES = 20;

/** Firm ceiling on the rendered Markdown (~24 KB). Enforced AFTER render: drop
 *  trailing (farthest-from-node, least-specific) ancestor blocks until it fits. */
export const MAX_PROJECTION_BYTES = 24_000;

// --- Types -----------------------------------------------------------------

export interface AncestorEntry {
  id: string;
  kind: string;
  statement: string;
  rationale: string | null;
  conditions: string[]; // attributes.conditions, [] when absent
  success_signal: SuccessSignal | null;
  attention_rationale: string | null; // attention?.rationale
  clarification_titles: string[]; // clarifications[].question only (titles-only index)
  clarifications_omitted: number; // count dropped by the per-ancestor cap
}

export interface AncestryProjection {
  root: string; // the node id the projection is FOR (not itself an ancestor)
  ancestors: AncestorEntry[]; // nearest-first (BFS order from the node)
  truncated: boolean;
  notes: string[]; // human-readable truncation/cycle notices
}

// --- Build -----------------------------------------------------------------

/** Read `attributes.conditions` as a string list, tolerating absence or a
 *  non-array/non-string value (the walk never throws on shape). */
function readConditions(attributes: Record<string, unknown>): string[] {
  const raw = attributes.conditions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

/** One ancestor node → its projection entry, applying the clarification cap. */
function toEntry(node: IntentionNode): AncestorEntry {
  const questions = node.clarifications.map((c) => c.question);
  const clarification_titles = questions.slice(0, MAX_CLARIFICATION_TITLES);
  return {
    id: node.id,
    kind: node.kind,
    statement: node.statement,
    rationale: node.rationale,
    conditions: readConditions(node.attributes),
    success_signal: node.success_signal,
    attention_rationale: node.attention !== null ? node.attention.rationale : null,
    clarification_titles,
    clarifications_omitted: questions.length - clarification_titles.length,
  };
}

/**
 * Build the bounded ancestry projection for node `id` in store `dir`.
 *
 * Walk semantics: a BFS closure from the node over BOTH `parent` and `serves`
 * edges, nearest-first. The queue is seeded with the node's OWN `parent` and
 * `serves` (the node itself is excluded — the worker already holds it); for each
 * dequeued ancestor its `parent` and `serves` are enqueued in turn. Virtue roots
 * terminate naturally (`parent === null`, `serves === []`).
 *
 * Cycle-safety: a `visited` set keyed by node id — an id already seen is never
 * re-enqueued, so a cycle or a converging diamond is walked at most once.
 * Belt-and-suspenders: the `MAX_ANCESTORS` hop cap stops a pathological graph
 * and sets `truncated`.
 *
 * A `parent`/`serves` id that does not resolve on disk is skipped with a `notes`
 * entry (never throws — a mid-flight store can carry a dangling edge).
 *
 * After the walk, the rendered Markdown is measured; if it exceeds
 * `MAX_PROJECTION_BYTES`, trailing (farthest-from-node) ancestor blocks are
 * dropped until it fits, `truncated` is set, and a `notes` entry records how
 * many blocks were dropped.
 */
export function buildAncestryProjection(dir: string, id: string): AncestryProjection {
  const projection: AncestryProjection = {
    root: id,
    ancestors: [],
    truncated: false,
    notes: [],
  };

  const root = readNode(dir, id);

  const visited = new Set<string>([id]); // the node itself is never an ancestor
  const queue: string[] = [];
  const enqueue = (nid: string): void => {
    if (visited.has(nid)) return;
    visited.add(nid);
    queue.push(nid);
  };
  const enqueueAncestors = (node: IntentionNode): void => {
    if (node.parent !== null) enqueue(node.parent);
    for (const s of node.serves) enqueue(s);
  };

  enqueueAncestors(root);

  while (queue.length > 0) {
    if (projection.ancestors.length >= MAX_ANCESTORS) {
      projection.truncated = true;
      projection.notes.push(
        `ancestry walk hit the ${MAX_ANCESTORS}-node cap (cycle or unexpectedly deep graph); projection is partial`,
      );
      break;
    }
    const curId = queue.shift();
    if (curId === undefined) break;
    let node: IntentionNode;
    try {
      node = readNode(dir, curId);
    } catch {
      projection.notes.push(`ancestor "${curId}" does not resolve on disk; skipped`);
      continue;
    }
    projection.ancestors.push(toEntry(node));
    enqueueAncestors(node);
  }

  enforceByteCap(projection);
  return projection;
}

/** The rendered-byte ceiling: drop trailing ancestor blocks until the Markdown
 *  fits `MAX_PROJECTION_BYTES`. Silent-safe (well-formed to a node boundary) and
 *  loud (a `notes` entry the CLI echoes to stderr). */
function enforceByteCap(projection: AncestryProjection): void {
  const overBudget = (): boolean =>
    Buffer.byteLength(renderAncestryProjection(projection), "utf8") > MAX_PROJECTION_BYTES;
  if (!overBudget()) return;

  projection.truncated = true;
  const noteIdx = projection.notes.length;
  projection.notes.push(""); // reserve — its bytes count toward the ceiling
  let dropped = 0;
  while (projection.ancestors.length > 0) {
    projection.ancestors.pop();
    dropped++;
    projection.notes[noteIdx] = byteDropNote(dropped);
    if (!overBudget()) break;
  }
  projection.notes[noteIdx] = byteDropNote(dropped);
}

function byteDropNote(dropped: number): string {
  return (
    `dropped ${dropped} trailing ancestor block(s) (farthest-from-node first) ` +
    `to fit the ${MAX_PROJECTION_BYTES}-byte projection cap`
  );
}

// --- Render ----------------------------------------------------------------

function renderSuccessSignal(s: SuccessSignal | null): string {
  if (s === null) return "(none)";
  return `${s.observable} — ${s.threshold} (${s.sensor})`;
}

function renderBlock(a: AncestorEntry): string {
  const lines: string[] = [];
  lines.push(`## ${a.id}  (${a.kind})`);
  lines.push(`- statement: ${a.statement}`);
  lines.push(`- rationale: ${a.rationale ?? "(none)"}`);
  if (a.conditions.length === 0) {
    lines.push(`- conditions: (none)`);
  } else {
    lines.push(`- conditions:`);
    for (const c of a.conditions) lines.push(`  - ${c}`);
  }
  lines.push(`- success_signal: ${renderSuccessSignal(a.success_signal)}`);
  lines.push(`- attention: ${a.attention_rationale ?? "(none)"}`);
  lines.push(`- clarifications (titles only — pull full text on demand via readNode):`);
  if (a.clarification_titles.length === 0) {
    lines.push(`  - (none)`);
  } else {
    for (const q of a.clarification_titles) lines.push(`  - ${q}`);
    if (a.clarifications_omitted > 0) lines.push(`  - …and ${a.clarifications_omitted} more`);
  }
  return lines.join("\n");
}

/**
 * Render the projection into Markdown — the single form every consumer reads. The
 * file opens with a one-line header naming it read-only ancestry decision
 * context for `<root>`, then one block per ancestor (nearest-first, fixed field
 * order), then, when there are truncation/cycle notices, a trailing `> NOTE —`
 * line per note.
 */
export function renderAncestryProjection(p: AncestryProjection): string {
  const parts: string[] = [];
  parts.push(`# Read-only ancestry context for \`${p.root}\` — decision context, do not edit`);
  for (const a of p.ancestors) {
    parts.push("");
    parts.push(renderBlock(a));
  }
  if (p.notes.length > 0) {
    parts.push("");
    for (const note of p.notes) parts.push(`> NOTE — ${note}`);
  }
  return `${parts.join("\n")}\n`;
}

// --- Arg parsing -----------------------------------------------------------

const USAGE =
  "usage: node-ancestry.ts <node-id> [--dir <intentions-dir>] [--out <path>]\n" +
  "  Renders the bounded ancestry projection for <node-id> as read-only Markdown.\n" +
  "  Without --out the Markdown is written to stdout; with --out it is written\n" +
  "  to that path (parent dirs created). Truncation notices go to stderr.\n";

interface Args {
  id: string;
  dir: string;
  out: string | null;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { id: "", dir: defaultIntentionsDir, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--dir": {
        const value = argv[++i];
        if (value === undefined || value === "") throw new Error("node-ancestry: --dir requires a directory argument");
        out.dir = value;
        break;
      }
      case "--out": {
        const value = argv[++i];
        if (value === undefined || value === "") throw new Error("node-ancestry: --out requires a path argument");
        out.out = value;
        break;
      }
      case "--help":
      case "-h":
        process.stdout.write(USAGE);
        process.exit(0);
        break;
      default:
        if (a.startsWith("--")) throw new Error(`node-ancestry: unknown flag '${a}'`);
        if (out.id !== "") throw new Error(`node-ancestry: unexpected extra argument '${a}'`);
        out.id = a;
    }
  }
  if (out.id === "") throw new Error("node-ancestry: <node-id> is required");
  return out;
}

// --- Main ------------------------------------------------------------------

function main(argv: string[]): void {
  const args = parseArgs(argv);
  const projection = buildAncestryProjection(args.dir, args.id);
  const rendered = renderAncestryProjection(projection);

  // Truncation notices are surfaced loudly so a systematically over-cap chain is
  // visible in the tick journal rather than silently thinned.
  for (const note of projection.notes) process.stderr.write(`WARNING: ${note}\n`);

  if (args.out !== null) {
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(args.out, rendered);
  } else {
    process.stdout.write(rendered);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exit(2);
  }
}
