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
import { validateGraph, mentionsRef } from "./schema.js";
import { IntentionSchemaError } from "./errors.js";
import { extractFrontmatter } from "./frontmatter.js";
import { readingDate } from "./router.js";
import { buildIdRefMatchers, classifyRef, extractIdRefs } from "./id-refs.js";
import {
  deriveReconciliationFrontier,
  type ReconciliationFrontierEntry,
} from "./frontier-reconciliation.js";
import { liveShimCount } from "./shims.js";
import type { GapNoteRecord } from "./gap-notes.js";

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
  /**
   * Every gap-note record in the store (`intentions/operational/gap-notes/`),
   * for the `prose-gap` arm of `tableReconciliationFrontier`. Read by the CLI
   * (`graph-digest.ts`'s `gatherInput`) exactly as `bodies`/`rawTexts` already
   * are — this module stays fs-free.
   */
  gapNotes: GapNoteRecord[];
}

// Ids come from YAML frontmatter and are only path-safety validated (store.ts
// `assertPathSafeId` blocks separators and '.'/'..'; `requireString` only checks
// non-empty), so an id may legally carry newlines, CR, tabs, brackets, or
// arbitrary prose. The digest is the first-read surface fed to the /align-audit
// LLM auditor; an un-sanitized id could inject forged check-table lines or direct
// instructions into that context (a malicious node hiding a real integrity
// violation or steering the audit's conclusion). Escape control characters —
// C0/C1 plus DEL — at EVERY render boundary so an id cannot break out of its
// field. The escaped form is still human-legible in the digest, and the escape
// is deterministic (no wall-clock/environment data), preserving byte-identity.
function renderId(id: string): string {
  // Walk code points rather than a control-char regex literal (which trips
  // eslint's no-control-regex) and escape C0 controls (U+0000-U+001F), DEL
  // (U+007F), and C1 controls (U+0080-U+009F) as \xHH so the id stays a
  // single field.
  return Array.from(id)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      const isControl = code <= 0x1f || code === 0x7f || (code >= 0x80 && code <= 0x9f);
      return isControl ? `\\x${code.toString(16).padStart(2, "0")}` : ch;
    })
    .join("");
}

// --- Section 1: per-node digest lines --------------------------------------

/** Latest `YYYY-MM-DD` appearing across a node's clarification answers, or "-". */
function latestClarificationDate(node: IntentionNode): string {
  // Reuse router's shared ISO-date extractor over the joined answers rather than
  // re-deriving the date regex here (avoids drift between two implementations).
  return readingDate(node.clarifications.map((c) => c.answer).join("\n")) ?? "-";
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
    renderId(node.id),
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
function tableClosure(nodes: IntentionNode[], byId: Map<string, IntentionNode>): string {
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
  return `[CLOSURE] ${unclosed.length} unclosed\n${unclosed.map((id) => `  ${renderId(id)}`).join("\n")}`;
}

/** DONE-PRESENT: tactics at `phase: done` still present in the store. */
function tableDonePresent(nodes: IntentionNode[]): string {
  const done = sortedIds(
    nodes.filter((n) => n.kind === "tactic" && n.phase === "done").map((n) => n.id),
  );
  if (done.length === 0) return "[DONE-PRESENT] none";
  return `[DONE-PRESENT] ${done.length} done tactics still in store\n${done
    .map((id) => `  ${renderId(id)}`)
    .join("\n")}`;
}

/**
 * DUP-SERVES: every node re-declaring an entry of its DIRECT parent's `serves`.
 * Partial overlaps included, strategy AND tactic layers. Emits the node id plus
 * only the redundant (parent-inherited) entries.
 */
function tableDupServes(nodes: IntentionNode[], byId: Map<string, IntentionNode>): string {
  const rows: string[] = [];
  for (const node of nodes) {
    if (node.parent === null) continue;
    const parent = byId.get(node.parent);
    if (parent === undefined) continue;
    const parentServes = new Set(parent.serves);
    const redundant = node.serves.filter((s) => parentServes.has(s));
    if (redundant.length > 0) {
      rows.push(`  ${renderId(node.id)}: ${redundant.map(renderId).join(",")}`);
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
  const rows = shown.map((p) => `  ${p.sim.toFixed(2)}  ${renderId(p.a)}  ${renderId(p.b)}`);
  if (pairs.length > shown.length) {
    rows.push(`  ... and ${pairs.length - shown.length} more pairs >= ${threshold}`);
  }
  return `[NEAR-DUP-STATEMENTS] ${pairs.length} pairs >= ${threshold}\n${rows.join("\n")}`;
}

// --- DANGLING-REFS ---------------------------------------------------------

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
  const matchers = buildIdRefMatchers(prefixes);

  const refs: DanglingRef[] = [];
  const wildcardRows: string[] = [];

  for (const node of input.nodes) {
    const body = input.bodies.get(node.id) ?? "";
    const seenWildcards = new Set<string>();

    // Family wildcards inside backticks: <prefix>-...-* — resolved against
    // member nodes and reported separately from the live/pruned/missing refs.
    for (const m of body.matchAll(matchers.backtickRe)) {
      const t = m[1].trim();
      if (!matchers.wildcardRe.test(t)) continue;
      if (seenWildcards.has(t)) continue; // same wildcard quoted twice in one body — dedup
      seenWildcards.add(t);
      const prefix = t.slice(0, -1); // drop trailing '*'
      const members = [...storeIds].filter((id) => id.startsWith(prefix)).length;
      wildcardRows.push(`  ${renderId(node.id)} -> ${renderId(t)} (${members} member${members === 1 ? "" : "s"})`);
    }

    for (const ref of extractIdRefs(body, matchers, vocab, node.id)) {
      refs.push({ ref, referencedBy: node.id, klass: classifyRef(ref, storeIds, deletedIds) });
    }
  }

  // Planned-reference annotation: does any OPEN (non-done) tactic's statement or
  // body mention a missing ref? The planned-vs-violation judgment stays with the
  // audit; the digest only flags the heuristic. Shared with
  // validateGraphProseRefs via the exported `mentionsRef` above.
  const missing = refs.filter((r) => r.klass === "missing");
  const pruned = refs.filter((r) => r.klass === "pruned");
  const liveCount = refs.filter((r) => r.klass === "live").length;

  const missingRows = missing
    .map((r) => {
      const annot = mentionsRef(input.nodes, input.bodies, r.ref, r.referencedBy)
        ? " [planned: open tactic mentions it]"
        : " [no open mention]";
      return `  MISSING ${renderId(r.ref)} <- ${renderId(r.referencedBy)}${annot}`;
    })
    .sort();
  const prunedRows = pruned
    .map((r) => `  PRUNED ${renderId(r.ref)} <- ${renderId(r.referencedBy)}`)
    .sort();
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
    // Shared frontmatter parser throws on a malformed fence — a corrupted node
    // surfaces loudly rather than silently vanishing from the audit.
    const parsed: unknown = parse(extractFrontmatter(raw, node.id));
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
  const lines = shown.map((r) => `  ${String(r.count).padStart(2)} ${renderId(r.id)}`);
  if (rows.length > shown.length) {
    lines.push(`  ... and ${rows.length - shown.length} more nodes with default-valued keys`);
  }
  return `[STORED-DEFAULTS] ${total} default-valued keys across ${rows.length} nodes (top ${shown.length} shown)\n${lines.join("\n")}`;
}

// A shortlist cap, same shape and same reason as STORED-DEFAULTS': the frontier
// grows with the criteria corpus and with every arm units 4-7 add, and Section 2
// is a token budget. The header still reports the full count.
const RECONCILIATION_FRONTIER_LIMIT = 50;

/**
 * RECONCILIATION-FRONTIER: the derived delta between the graph's recorded
 * target state and its operational state — the remaining migration, recomputed
 * on every digest run and stored nowhere
 * (`frontier-reconciliation.ts`; `tactic-migration-frontier-projection`).
 *
 * GRAPH-ONLY DERIVATION. The digest is a pure projection of the node corpus and
 * runs no checks, so `checkRuns` is `[]` here. That means the observe-failure
 * arm is empty in this surface by construction and the criteria arm reads every
 * non-assumption criterion in force as unsatisfied — which is the honest
 * reading of a store whose registry decides none of them yet. The header says
 * so on every line-item run rather than letting a reader mistake it for a
 * check-informed verdict. The `prose-gap` arm is the one exception: `gapNotes`
 * is real data (read by the CLI from `intentions/operational/gap-notes/`,
 * exactly as `bodies`/`rawTexts` already are), so that arm renders live entries
 * here, not an empty-by-construction one.
 *
 * A malformed criteria corpus is REPORTED, not thrown, exactly as
 * `tableValidate` reports an integrity violation: one bad `attributes.criteria`
 * list must not take the whole digest down, because the digest is the surface
 * an auditor reads to FIND that kind of defect.
 */
function tableReconciliationFrontier(input: DigestInput): string {
  let entries: ReconciliationFrontierEntry[];
  try {
    entries = deriveReconciliationFrontier({
      nodes: input.nodes,
      checkRuns: [],
      gapNotes: input.gapNotes,
    });
  } catch (err) {
    if (err instanceof IntentionSchemaError) {
      return `[RECONCILIATION-FRONTIER] FAIL\n${err.message}`;
    }
    throw err;
  }
  const scope = "graph-only derivation: the digest runs no checks";
  if (entries.length === 0) return `[RECONCILIATION-FRONTIER] none (${scope})`;
  const shown = entries.slice(0, RECONCILIATION_FRONTIER_LIMIT);
  // Every rendered field goes through renderId, not just the id column. Ids
  // reach `subject` (a criterion's home node) and can reach `detail` (an arm
  // naming the checks that failed), and this table lands in the /align-audit
  // LLM auditor's first-read context — an un-escaped control character in any
  // column could forge a table line or an instruction. renderId is a no-op on
  // ordinary prose, so escaping all three costs nothing.
  const lines = shown.map(
    (e) => `  ${renderId(e.id)} — ${renderId(e.subject)} — ${renderId(e.detail)}`,
  );
  if (entries.length > shown.length) {
    lines.push(`  ... and ${entries.length - shown.length} more frontier items`);
  }
  return `[RECONCILIATION-FRONTIER] ${entries.length} items (${scope}; top ${shown.length} shown)\n${lines.join("\n")}`;
}

/**
 * LIVE-SHIMS: the cheap machine signal `shims.ts`'s header promises the
 * observe loop — every declared shim across the graph, overdue or not. It
 * never runs a check (`liveShimCount` doesn't take one), so unlike the
 * reconciliation-frontier table above this row is not a "graph-only"
 * approximation of a richer answer — it is the whole answer, on every digest
 * run.
 */
function tableLiveShims(input: DigestInput): string {
  const count = liveShimCount(input.nodes);
  const noun = count === 1 ? "shim" : "shims";
  return `[LIVE-SHIMS] ${count} declared ${noun} across the graph`;
}

// --- Assembly --------------------------------------------------------------

/** Section 2 — the derived check tables, in a fixed order. */
export function renderTables(input: DigestInput): string {
  // Built once and shared by the tables that need id lookup (tableValidate
  // builds its own inside validateGraph).
  const byId = new Map<string, IntentionNode>(input.nodes.map((n) => [n.id, n]));
  return [
    tableValidate(input.nodes),
    tableClosure(input.nodes, byId),
    tableDonePresent(input.nodes),
    tableDupServes(input.nodes, byId),
    tableNearDup(input.nodes),
    tableDanglingRefs(input),
    tableStoredDefaults(input),
    tableReconciliationFrontier(input),
    tableLiveShims(input),
  ].join("\n\n") + "\n";
}

/** Full digest: Section 1 (per-node) then Section 2 (tables). */
export function renderDigest(input: DigestInput): string {
  return `${renderPerNode(input)}\n${renderTables(input)}`;
}
