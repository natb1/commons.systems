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
// The walk is bounded so the primitive never hangs or blows a context budget: a
// hop cap (`MAX_ANCESTORS`), a per-ancestor clarification-title cap
// (`MAX_CLARIFICATION_TITLES`), a rendered-ancestor backstop
// (`MAX_RENDERED_ANCESTORS`), and a firm rendered-byte ceiling
// (`MAX_PROJECTION_BYTES`).
//
// The byte ceiling is spent by FAIR SHARE, not by dropping ancestors. Every
// ancestor block gets its natural size when the total fits; otherwise a
// water-filling allocator (`allocateBudgets`) gives each block an equal share and
// re-divides the unused remainder of the blocks that came in under it, so one
// enormous ancestor can never crowd out the virtue roots this projection exists
// to surface. A block that overruns its allocation is shed from the inside — the
// least decision-relevant content first (clarification titles, then conditions,
// then the rationale down to `MIN_RATIONALE_BYTES`) — and never loses its
// heading, `statement`, or `success_signal`.
//
// Warning policy: within-block shedding is NORMAL operation. It is recorded in
// the Markdown itself ("…and N more", "(truncated)") and sets `truncated`, but
// pushes no `notes` entry. Only the two should-never-happen bounds — the
// `MAX_ANCESTORS` cycle/hop cap and the `MAX_RENDERED_ANCESTORS` whole-ancestor
// backstop — push a `notes` entry, which the CLI echoes to stderr as a WARNING.
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
//   node --import tsx/esm packages/intentionsutil/scripts/node-ancestry.ts <node-id> \
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

/** Firm ceiling on the rendered Markdown (~24 KB). Spent by fair share across
 *  the ancestor blocks (`allocateBudgets`), never by dropping ancestors. */
export const MAX_PROJECTION_BYTES = 24_000;

/** Backstop on how many ancestor blocks are RENDERED — the only place a whole
 *  ancestor is dropped. Unreachable on a healthy graph (the deepest real chain
 *  walks 8 ancestors); it exists so a pathological graph still renders. Virtue
 *  ancestors are always kept; the remaining slots go to the nearest non-virtue
 *  ancestors, dropping from the middle. */
export const MAX_RENDERED_ANCESTORS = 24;

/** Floor on a shed `rationale`. Below this the rationale stops being decision
 *  context at all, so shedding stops here even if the block is still over. */
export const MIN_RATIONALE_BYTES = 200;

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
  clarifications_omitted: number; // count dropped by the per-ancestor cap / shedding
  conditions_omitted: number; // count of conditions dropped by shedding
  rationale_truncated: boolean; // `rationale` was cut at a byte boundary by shedding
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
    conditions_omitted: 0,
    rationale_truncated: false,
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
 * After the walk: the `MAX_RENDERED_ANCESTORS` backstop is applied (virtues
 * always kept), then each surviving block's natural rendered size is measured and
 * `allocateBudgets` divides the byte ceiling among them by fair share. A block
 * over its allocation is shed from the inside (`shedBlockToFit`) and `truncated`
 * is set — with no `notes` entry, since within-block shedding is normal and is
 * already visible in the rendered Markdown.
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

  applyRenderedAncestorCap(projection);
  applyByteBudget(projection);
  return projection;
}

// --- Bounding the render ----------------------------------------------------

/** The pathological-depth backstop — the ONLY place a whole ancestor is dropped.
 *  Every `virtue` ancestor is kept (they are the cheapest blocks and the whole
 *  point of the projection); the remaining slots go to the nearest non-virtue
 *  ancestors in BFS order, so the drops come from the middle of the chain. Loud:
 *  sets `truncated` and pushes a `notes` entry the CLI echoes as a WARNING. */
function applyRenderedAncestorCap(projection: AncestryProjection): void {
  const total = projection.ancestors.length;
  if (total <= MAX_RENDERED_ANCESTORS) return;

  const virtues = projection.ancestors.filter((a) => a.kind === "virtue");
  const slots = MAX_RENDERED_ANCESTORS - virtues.length;
  const kept = new Set<AncestorEntry>(virtues);
  let filled = 0;
  for (const a of projection.ancestors) {
    if (filled >= slots) break;
    if (a.kind === "virtue") continue;
    kept.add(a);
    filled++;
  }

  projection.ancestors = projection.ancestors.filter((a) => kept.has(a));
  const dropped = total - projection.ancestors.length;
  projection.truncated = true;
  projection.notes.push(
    `dropped ${dropped} middle ancestor block(s) to fit the ` +
      `${MAX_RENDERED_ANCESTORS}-ancestor render cap (every virtue root kept)`,
  );
}

/**
 * Water-filling budget allocation: give every block its natural size if the
 * total fits; else give each block an equal share, hand back the unused
 * remainder of blocks smaller than their share, and re-divide it among the
 * blocks that are still over. Guarantees: sum(result) <= budget, and every
 * result[i] > 0.
 */
export function allocateBudgets(naturalSizes: number[], budget: number): number[] {
  if (naturalSizes.length === 0) return [];
  const total = naturalSizes.reduce((sum, n) => sum + n, 0);
  if (total <= budget) return naturalSizes;

  const result = new Array<number>(naturalSizes.length).fill(0);
  let remaining = budget;
  let active = naturalSizes.map((_unused, i) => i);
  while (active.length > 0) {
    const share = Math.floor(remaining / active.length);
    const stillActive: number[] = [];
    for (const i of active) {
      if (naturalSizes[i] <= share) {
        result[i] = naturalSizes[i];
        remaining -= naturalSizes[i];
      } else {
        stillActive.push(i);
      }
    }
    if (stillActive.length === active.length) {
      // Nobody was finalized this pass — every remaining block wants more than
      // its equal share, so they all settle at exactly that share.
      for (const i of active) result[i] = share;
      break;
    }
    active = stillActive;
  }
  return result;
}

/** Spend `MAX_PROJECTION_BYTES` across the ancestor blocks by fair share, then
 *  shed the blocks that overrun their allocation. Within-block shedding is
 *  normal operation: it sets `truncated` (and shows up in the Markdown) but
 *  pushes NO `notes` entry, so the stderr WARNING keeps meaning "something is
 *  wrong with the graph". */
function applyByteBudget(projection: AncestryProjection): void {
  if (projection.ancestors.length === 0) return;

  // Exact fixed overhead: the header, the notes block, the trailing newline, and
  // the two joiner bytes each block contributes ("\n" + "" + "\n" before it).
  const chrome = { ...projection, ancestors: [] };
  const overhead =
    Buffer.byteLength(renderAncestryProjection(chrome), "utf8") + projection.ancestors.length * 2;
  const budget = Math.max(1, MAX_PROJECTION_BYTES - overhead);

  const natural = projection.ancestors.map((a) => blockBytes(a));
  const allocations = allocateBudgets(natural, budget);
  for (let i = 0; i < projection.ancestors.length; i++) {
    if (natural[i] <= allocations[i]) continue;
    if (shedBlockToFit(projection.ancestors[i], allocations[i])) projection.truncated = true;
  }
}

/** The rendered byte size of one ancestor block. */
export function blockBytes(a: AncestorEntry): number {
  return Buffer.byteLength(renderBlock(a), "utf8");
}

/** Cut `s` to at most `max` bytes, backing off to a UTF-8 character boundary so
 *  the result is never a broken code point. */
function truncateToBytes(s: string, max: number): string {
  const buf = Buffer.from(s, "utf8");
  if (buf.length <= max) return s;
  let end = Math.max(0, max);
  while (end > 0 && (buf[end] & 0xc0) === 0x80) end--;
  return buf.subarray(0, end).toString("utf8");
}

/**
 * Shrink one ancestor block to fit `allocation` bytes by dropping the least
 * decision-relevant content first, re-measuring after each step:
 *
 *   1. clarification titles from the tail (counted in `clarifications_omitted`)
 *   2. conditions from the tail (counted in `conditions_omitted`)
 *   3. `rationale` cut at a byte boundary, down to `MIN_RATIONALE_BYTES`
 *
 * The `## <id>  (<kind>)` heading, `- statement:`, and `- success_signal:` are
 * never shed — they are the ancestor's identity and its intent test — so a block
 * has a non-zero floor and may end up over its allocation. Returns whether
 * anything was shed. Mutates `a` in place.
 */
export function shedBlockToFit(a: AncestorEntry, allocation: number): boolean {
  let shed = false;
  if (blockBytes(a) <= allocation) return false;

  while (a.clarification_titles.length > 0 && blockBytes(a) > allocation) {
    a.clarification_titles.pop();
    a.clarifications_omitted++;
    shed = true;
  }
  while (a.conditions.length > 0 && blockBytes(a) > allocation) {
    a.conditions.pop();
    a.conditions_omitted++;
    shed = true;
  }
  if (a.rationale !== null) {
    let bytes = Buffer.byteLength(a.rationale, "utf8");
    while (blockBytes(a) > allocation && bytes > MIN_RATIONALE_BYTES) {
      const over = blockBytes(a) - allocation;
      const target = Math.max(MIN_RATIONALE_BYTES, bytes - Math.max(over, 1));
      a.rationale = truncateToBytes(a.rationale, target);
      a.rationale_truncated = true;
      shed = true;
      const next = Buffer.byteLength(a.rationale, "utf8");
      if (next >= bytes) break; // no progress possible — stop rather than spin
      bytes = next;
    }
  }
  return shed;
}

// --- Render ----------------------------------------------------------------

function renderSuccessSignal(s: SuccessSignal | null): string {
  if (s === null) return "(none)";
  return `${s.observable} — ${s.threshold} (${s.sensor})`;
}

/** The suffix appended to a rationale that shedding cut short — it points the
 *  reader at the node file holding the full text. */
function rationaleTruncationSuffix(id: string): string {
  return ` … (truncated — read intentions/${id}.md for the full text)`;
}

export function renderBlock(a: AncestorEntry): string {
  const lines: string[] = [];
  lines.push(`## ${a.id}  (${a.kind})`);
  lines.push(`- statement: ${a.statement}`);
  const rationale = a.rationale ?? "(none)";
  lines.push(`- rationale: ${rationale}${a.rationale_truncated ? rationaleTruncationSuffix(a.id) : ""}`);
  if (a.conditions.length === 0 && a.conditions_omitted === 0) {
    lines.push(`- conditions: (none)`);
  } else {
    lines.push(`- conditions:`);
    for (const c of a.conditions) lines.push(`  - ${c}`);
    if (a.conditions_omitted > 0) lines.push(`  - …and ${a.conditions_omitted} more`);
  }
  lines.push(`- success_signal: ${renderSuccessSignal(a.success_signal)}`);
  lines.push(`- attention: ${a.attention_rationale ?? "(none)"}`);
  lines.push(`- clarifications (titles only — pull full text on demand via readNode):`);
  if (a.clarification_titles.length === 0 && a.clarifications_omitted === 0) {
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
  parts.push(
    `# Read-only ancestry context for \`${p.root}\` — decision context, do not edit ` +
      `(bounded projection: ≤${MAX_PROJECTION_BYTES} bytes, ≤${MAX_RENDERED_ANCESTORS} ancestors; ` +
      `over-budget blocks are shed from the inside — read the node file for full text)`,
  );
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
