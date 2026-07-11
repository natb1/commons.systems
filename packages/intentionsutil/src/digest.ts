// Read-only, token-bounded digest of the whole intention graph.
//
// The digest is the first-read surface for /align-audit and the align skills'
// corpus sweeps: a compact per-node summary (Section 1) plus derived check
// tables (Section 2) that carry the mechanical portion of a whole-graph audit
// without re-reading every node body as text.
//
// This module is PURE — it takes the inputs the CLI gathers (nodes, bodies,
// raw file texts, and the ids deleted from git history) and returns strings.
// No fs, no git, no network here; `scripts/graph-digest.ts` does the I/O and
// calls in.
//
// Determinism: every table is id-sorted (or count-then-id sorted) and carries
// no wall-clock/environment data, so two runs on the same inputs emit
// byte-identical output.

import { parse } from "yaml";
import type { IntentionNode } from "./schema.js";
import { validateGraph } from "./schema.js";
import { IntentionSchemaError } from "./errors.js";

/**
 * Inputs the CLI gathers for the digest. Kept as plain data so the module
 * never touches fs/git/network:
 *
 *  - `nodes`      — every node in the store (from `listNodes`), id order not
 *                   assumed (the digest sorts).
 *  - `bodies`     — node id → raw markdown body (from `readNodeBody`), for the
 *                   per-node body-length column and DANGLING-REFS extraction.
 *  - `rawTexts`   — node id → raw file text, for STORED-DEFAULTS frontmatter
 *                   parsing (the digest parses the same YAML the store does).
 *  - `deletedIds` — ids whose `intentions/<id>.md` was deleted in git history
 *                   (from `git log --diff-filter=D`), for classifying a
 *                   DANGLING-REFS reference as `pruned` rather than `missing`.
 */
export interface DigestInput {
  nodes: IntentionNode[];
  bodies: Map<string, string>;
  rawTexts: Map<string, string>;
  deletedIds: string[];
}

// --- Section 1: per-node digest lines --------------------------------------

const ISO_DATE = /\b(\d{4}-\d{2}-\d{2})\b/g;

/** Latest `YYYY-MM-DD` appearing across a node's clarification answers, or "-". */
function latestClarificationDate(node: IntentionNode): string {
  let latest = "";
  for (const c of node.clarifications) {
    for (const m of c.answer.matchAll(ISO_DATE)) {
      if (m[1] > latest) latest = m[1]; // ISO dates sort lexically
    }
  }
  return latest === "" ? "-" : latest;
}

/** `attributes.conditions` length, or 0 when absent / not an array. */
function conditionCount(node: IntentionNode): number {
  const c = node.attributes.conditions;
  return Array.isArray(c) ? c.length : 0;
}

/** Signal presence: `none` (no signal), `proxy`, or `direct`. */
function signalPresence(node: IntentionNode): "none" | "proxy" | "direct" {
  if (node.success_signal === null) return "none";
  return node.success_signal.is_proxy ? "proxy" : "direct";
}

/** One per-node summary line. */
function perNodeLine(node: IntentionNode, body: string): string {
  const serves = node.serves.length > 0 ? node.serves.join(",") : "-";
  const bodyBytes = Buffer.byteLength(body, "utf8");
  return [
    node.id,
    `kind=${node.kind}`,
    `status=${node.status}`,
    `parent=${node.parent ?? "-"}`,
    `serves=${serves}`,
    `phase=${node.phase ?? "-"}`,
    `clar=${node.clarifications.length}@${latestClarificationDate(node)}`,
    `cond=${conditionCount(node)}`,
    `signal=${signalPresence(node)}`,
    `body=${bodyBytes}b`,
  ].join("  ");
}

/** Section 1 — one summary line per node, id-sorted. */
export function renderPerNode(input: DigestInput): string {
  const sorted = [...input.nodes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const lines = sorted.map((n) => perNodeLine(n, input.bodies.get(n.id) ?? ""));
  return `[NODES] ${sorted.length} nodes\n${lines.join("\n")}\n`;
}

// --- Section 2 tables ------------------------------------------------------

function sortedIds(ids: Iterable<string>): string[] {
  return [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** VALIDATE: run validateGraph; emit pass or the integrity-violation message. */
function tableValidate(nodes: IntentionNode[]): string {
  try {
    validateGraph(nodes);
    return "[VALIDATE] pass";
  } catch (err) {
    if (err instanceof IntentionSchemaError) {
      return `[VALIDATE] FAIL\n${err.message}`;
    }
    throw err;
  }
}

/**
 * CLOSURE: every strategy and tactic whose motivation chain — `serves` entries
 * plus the transitive `parent` chain — never reaches a `kind: virtue` node.
 *
 * Memoized DFS with a cycle guard (mirrors `computeSignalPath`'s pattern): a
 * node reaches a virtue iff it IS a virtue, or any of its `serves`/`parent`
 * targets reaches one. An empty-`serves` strategy whose parent chain reaches a
 * virtue root is closed (the sub-strategy inheritance case).
 */
function tableClosure(nodes: IntentionNode[]): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const memo = new Map<string, boolean>();
  const stack = new Set<string>();

  const reachesVirtue = (id: string): boolean => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (stack.has(id)) return false; // cycle short-circuit — this path does not reach a virtue
    const node = byId.get(id);
    if (node === undefined) return false;
    if (node.kind === "virtue") {
      memo.set(id, true);
      return true;
    }
    stack.add(id);
    let result = false;
    for (const target of node.serves) {
      if (reachesVirtue(target)) {
        result = true;
        break;
      }
    }
    if (!result && node.parent !== null && byId.has(node.parent)) {
      result = reachesVirtue(node.parent);
    }
    stack.delete(id);
    // Cache true unconditionally; cache false only when not inside a live cycle.
    // A false reached via `stack.has` short-circuit is re-derived from a fresh
    // root, matching computeSignalPath's provisional-false discipline.
    if (result || stack.size === 0) memo.set(id, result);
    return result;
  };

  const unclosed = sortedIds(
    nodes
      .filter((n) => (n.kind === "strategy" || n.kind === "tactic") && !reachesVirtue(n.id))
      .map((n) => n.id),
  );
  if (unclosed.length === 0) return "[CLOSURE] pass — every strategy/tactic reaches a virtue root";
  return `[CLOSURE] ${unclosed.length} unclosed\n${unclosed.map((id) => `  ${id}`).join("\n")}`;
}

/** DONE-PRESENT: tactics at `phase: done` still present in the store. */
function tableDonePresent(nodes: IntentionNode[]): string {
  const done = sortedIds(
    nodes.filter((n) => n.kind === "tactic" && n.phase === "done").map((n) => n.id),
  );
  if (done.length === 0) return "[DONE-PRESENT] none";
  return `[DONE-PRESENT] ${done.length} done tactics still in store\n${done
    .map((id) => `  ${id}`)
    .join("\n")}`;
}

/**
 * DUP-SERVES: every node re-declaring an entry of its DIRECT parent's `serves`.
 * Partial overlaps included, strategy AND tactic layers. Emits the node id plus
 * only the redundant (parent-inherited) entries.
 */
function tableDupServes(nodes: IntentionNode[]): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rows: string[] = [];
  for (const node of nodes) {
    if (node.parent === null) continue;
    const parent = byId.get(node.parent);
    if (parent === undefined) continue;
    const parentServes = new Set(parent.serves);
    const redundant = node.serves.filter((s) => parentServes.has(s));
    if (redundant.length > 0) {
      rows.push(`  ${node.id}: ${redundant.join(",")}`);
    }
  }
  rows.sort();
  if (rows.length === 0) return "[DUP-SERVES] none";
  return `[DUP-SERVES] ${rows.length} nodes re-declare a parent serve\n${rows.join("\n")}`;
}

/** Lowercased alphanumeric token set of a statement, for Jaccard similarity. */
function statementTokens(statement: string): Set<string> {
  return new Set(
    statement
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 0),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// A shortlist cap keeps the table bounded even when a graph carries many benign
// near-duplicates (parallel per-strategy sweep families): the full pair count is
// still reported in the header, but only the top `NEAR_DUP_LIMIT` most-similar
// pairs are itemized. Without this the table is O(n^2) rows and can blow the
// Section-2 output budget on a store dense with sweep families.
const NEAR_DUP_LIMIT = 100;

/**
 * NEAR-DUP-STATEMENTS: statement pairs with token-Jaccard similarity above
 * `threshold` (default 0.6), highest-similarity first, capped at
 * `NEAR_DUP_LIMIT` itemized rows. A shortlist for the audit's human
 * disposition, never a disposition itself — parallel per-strategy sweep
 * families are a known benign pattern.
 */
function tableNearDup(nodes: IntentionNode[], threshold = 0.6): string {
  const entries = nodes.map((n) => ({ id: n.id, tokens: statementTokens(n.statement) }));
  const pairs: { a: string; b: string; sim: number }[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const sim = jaccard(entries[i].tokens, entries[j].tokens);
      if (sim >= threshold) {
        const [a, b] = entries[i].id < entries[j].id
          ? [entries[i].id, entries[j].id]
          : [entries[j].id, entries[i].id];
        pairs.push({ a, b, sim });
      }
    }
  }
  pairs.sort((x, y) => (y.sim - x.sim) || (x.a < y.a ? -1 : x.a > y.a ? 1 : x.b < y.b ? -1 : 1));
  if (pairs.length === 0) return `[NEAR-DUP-STATEMENTS] none above ${threshold}`;
  const shown = pairs.slice(0, NEAR_DUP_LIMIT);
  const rows = shown.map((p) => `  ${p.sim.toFixed(2)}  ${p.a}  ${p.b}`);
  if (pairs.length > shown.length) {
    rows.push(`  ... and ${pairs.length - shown.length} more pairs >= ${threshold}`);
  }
  return `[NEAR-DUP-STATEMENTS] ${pairs.length} pairs >= ${threshold}\n${rows.join("\n")}`;
}

// --- DANGLING-REFS ---------------------------------------------------------

// An id-shaped token: a kind prefix seen in the graph followed by >=1 slug
// segments. Kind prefixes are DERIVED from the vocabulary (never a hardcoded
// kind list), so the extractor tracks whatever kinds the graph actually holds.
function idShapeRegexp(prefixes: Set<string>): RegExp {
  const alt = sortedIds(prefixes)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  // Boundaries reject [\w-] on either side so a real id inside a longer compound
  // (e.g. `tactic-x` inside `tactic-x-v2`) does not match.
  return new RegExp(`(?<![\\w-])(?:${alt})-[a-z0-9]+(?:-[a-z0-9]+)*(?![\\w-])`, "g");
}

interface DanglingRef {
  ref: string;
  referencedBy: string;
  klass: "live" | "pruned" | "missing";
}

/**
 * DANGLING-REFS: node-id references in prose bodies classified live / pruned /
 * missing. Extractor requirements (learned from the 2026-07-09 prototype's
 * misfires):
 *
 *  - A `missing` reference must be BACKTICK-QUOTED and id-shaped. A bare
 *    kind-prefix token in flowing prose is never treated as a reference — that
 *    over-matched compounds like `tactic-only`.
 *  - A non-backticked token counts only when it is in the known vocabulary
 *    (current store ids ∪ deleted ids), so it can only ever be `live`/`pruned`.
 *  - A family wildcard (`tactic-recovery-drill-*`) resolves against its member
 *    nodes (store ids sharing the prefix), never as a bare missing id.
 */
function tableDanglingRefs(input: DigestInput): string {
  const storeIds = new Set(input.nodes.map((n) => n.id));
  const deletedIds = new Set(input.deletedIds);
  const vocab = new Set<string>([...storeIds, ...deletedIds]);
  const prefixes = new Set([...vocab].map((id) => id.split("-")[0]).filter((p) => p.length > 0));
  const idShape = idShapeRegexp(prefixes);
  // Backtick-quoted content: `...` on a single line.
  const backtickRe = /`([^`\n]+)`/g;
  // Family wildcard inside backticks: <prefix>-...-*
  const wildcardRe = new RegExp(`^(?:${[...prefixes].join("|")})-[a-z0-9-]+-\\*$`);

  const classify = (ref: string): "live" | "pruned" | "missing" =>
    storeIds.has(ref) ? "live" : deletedIds.has(ref) ? "pruned" : "missing";

  const refs: DanglingRef[] = [];
  const wildcardRows: string[] = [];

  for (const node of input.nodes) {
    const body = input.bodies.get(node.id) ?? "";
    const seen = new Set<string>();

    // Explicit backtick references (the only source of `missing` classifications).
    for (const m of body.matchAll(backtickRe)) {
      const t = m[1].trim();
      if (wildcardRe.test(t)) {
        const prefix = t.slice(0, -1); // drop trailing '*'
        const members = [...storeIds].filter((id) => id.startsWith(prefix)).length;
        wildcardRows.push(`  ${node.id} -> ${t} (${members} member${members === 1 ? "" : "s"})`);
        continue;
      }
      // id-shaped? reuse the prefix/shape test via a fresh anchored regexp.
      if (new RegExp(`^(?:${[...prefixes].join("|")})-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(t)) {
        if (t !== node.id && !seen.has(t)) {
          seen.add(t);
          refs.push({ ref: t, referencedBy: node.id, klass: classify(t) });
        }
      }
    }

    // Vocabulary references anywhere in prose (live/pruned only — a token not in
    // vocab is skipped, so prose compounds never become `missing`).
    for (const m of body.matchAll(idShape)) {
      const t = m[0];
      if (t === node.id || seen.has(t)) continue;
      if (vocab.has(t)) {
        seen.add(t);
        refs.push({ ref: t, referencedBy: node.id, klass: classify(t) });
      }
    }
  }

  // Planned-reference annotation: does any OPEN (non-done) tactic's statement or
  // body mention a missing ref? The planned-vs-violation judgment stays with the
  // audit; the digest only flags the heuristic.
  const openTactics = input.nodes.filter((n) => n.kind === "tactic" && n.phase !== "done");
  const mentionsRef = (ref: string): boolean =>
    openTactics.some(
      (t) => t.statement.includes(ref) || (input.bodies.get(t.id) ?? "").includes(ref),
    );

  const missing = refs.filter((r) => r.klass === "missing");
  const pruned = refs.filter((r) => r.klass === "pruned");
  const liveCount = refs.filter((r) => r.klass === "live").length;

  const missingRows = missing
    .map((r) => {
      const annot = mentionsRef(r.ref) ? " [planned: open tactic mentions it]" : " [no open mention]";
      return `  MISSING ${r.ref} <- ${r.referencedBy}${annot}`;
    })
    .sort();
  const prunedRows = pruned.map((r) => `  PRUNED ${r.ref} <- ${r.referencedBy}`).sort();
  wildcardRows.sort();

  const header = `[DANGLING-REFS] live=${liveCount} pruned=${pruned.length} missing=${missing.length} wildcard=${wildcardRows.length}`;
  const sections = [header];
  if (missingRows.length > 0) sections.push(missingRows.join("\n"));
  if (prunedRows.length > 0) sections.push(prunedRows.join("\n"));
  if (wildcardRows.length > 0) sections.push(wildcardRows.join("\n"));
  return sections.join("\n");
}

// --- STORED-DEFAULTS -------------------------------------------------------

/** True when a serialized frontmatter value equals a schema default. */
function isDefaultValue(value: unknown): boolean {
  if (value === null) return true;
  if (value === false) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object" && value !== null) return Object.keys(value).length === 0;
  return false;
}

// Itemize only the top over-serializers: every node carries a near-uniform
// baseline of default-valued keys, so listing all of them is anti-token-bounded
// noise (this tactic exists to keep whole-graph reading token-bounded). The
// header reports the graph-wide total and node count; the rows are the
// shortlist of nodes carrying the most default-valued keys.
const STORED_DEFAULTS_LIMIT = 60;

/**
 * STORED-DEFAULTS: per node, the count of serialized frontmatter keys whose
 * value equals a schema default (`[]`, `null`, `false`, `{}`). Parsed from the
 * raw file text with the same YAML library the store uses. Structure-parsimony
 * signal only — remediation is owned elsewhere
 * (tactic-omit-default-serialization / strategy-graph-self-description).
 */
function tableStoredDefaults(input: DigestInput): string {
  const rows: { id: string; count: number }[] = [];
  let total = 0;
  for (const node of input.nodes) {
    const raw = input.rawTexts.get(node.id);
    if (raw === undefined) continue;
    const fm = extractFrontmatterText(raw);
    if (fm === null) continue;
    const parsed: unknown = parse(fm);
    if (parsed === null || typeof parsed !== "object") continue;
    let count = 0;
    for (const value of Object.values(parsed)) {
      if (isDefaultValue(value)) count++;
    }
    if (count > 0) {
      rows.push({ id: node.id, count });
      total += count;
    }
  }
  rows.sort((a, b) => b.count - a.count || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const shown = rows.slice(0, STORED_DEFAULTS_LIMIT);
  const lines = shown.map((r) => `  ${String(r.count).padStart(2)} ${r.id}`);
  if (rows.length > shown.length) {
    lines.push(`  ... and ${rows.length - shown.length} more nodes with default-valued keys`);
  }
  return `[STORED-DEFAULTS] ${total} default-valued keys across ${rows.length} nodes (top ${shown.length} shown)\n${lines.join("\n")}`;
}

/** Extract the raw frontmatter text (between the first two `---` fences), or null. */
function extractFrontmatterText(raw: string): string | null {
  if (!raw.startsWith("---\n")) return null;
  const body = raw.slice("---\n".length);
  const closeIndex = body.search(/^---$/m);
  if (closeIndex === -1) return null;
  return body.slice(0, closeIndex);
}

// --- Assembly --------------------------------------------------------------

/** Section 2 — the derived check tables, in a fixed order. */
export function renderTables(input: DigestInput): string {
  return [
    tableValidate(input.nodes),
    tableClosure(input.nodes),
    tableDonePresent(input.nodes),
    tableDupServes(input.nodes),
    tableNearDup(input.nodes),
    tableDanglingRefs(input),
    tableStoredDefaults(input),
  ].join("\n\n") + "\n";
}

/** Full digest: Section 1 (per-node) then Section 2 (tables). */
export function renderDigest(input: DigestInput): string {
  return `${renderPerNode(input)}\n${renderTables(input)}`;
}
