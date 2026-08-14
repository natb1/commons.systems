// migrate-boost-levels — the one-shot store rewrite that moves every node's
// `attention` onto the canonical per-tier `boosts` map AND onto the closed boost
// LEVEL vocabulary (`BOOST_LEVELS` in src/schema.ts). Owned by
// tactic-attention-per-tier-boost-migration.
//
// Four rewrites, per node, in this order:
//
//  1. FORM. The legacy spellings (`boost: X` with an optional `tier: T` tag, and
//     `override: X`) are normalized into `boosts: { T: X }` by `validateAttention`
//     on the READ path, and `writeNode` re-serializes through `validateNode` — so
//     the form conversion is a free side-effect of reading and writing the node
//     back out. This script never parses the legacy spelling itself; it only
//     detects that the FILE still carries a legacy key so a form-only node is
//     still rewritten (its in-memory shape is already canonical, so an
//     in-memory diff alone would miss it).
//
//  2. LADDER REVERT. The 2026-08-11 "namespacing stopgap" hand-compressed boost
//     magnitudes onto a 0.01-per-level ladder so a tactic's boost could not lift
//     it out of its parent strategy's band, preserving the original magnitude at
//     `attributes.pre_namespacing_boost`. That bound is now structural (band is a
//     harder axis in the rank key), so the stopgap is REVERTED — the preserved
//     magnitude is restored as the boost and the attribute is deleted — never
//     rescaled. The stopgap's trailing rationale paragraph is stripped with it,
//     since it cites an attribute this migration removes.
//
//  3. SNAP. Every remaining boost value is snapped to the nearest member of
//     `BOOST_LEVEL_VALUES` by absolute distance (ties snap UP), and each changed
//     key gets one dated migration line appended to the rationale.
//
//  4. THE ONE OVERRIDE NODE. `tactic-transition-node-stamp-landed-body` carries
//     the last `override: 60`, an authored branch-cap claim with no meaning in
//     the per-tier map. It is at `phase: done`, so the claim is spent: its whole
//     attention block is dropped (`attention: null`). Guarded — if the node has
//     moved off `done` the script hard-errors rather than silently dropping a
//     live authored claim.
//
// No coercion anywhere: a 0, negative, or non-finite magnitude, a
// `pre_namespacing_boost` on a node whose boosts map is not exactly `{1: X}`, or
// a stopgap paragraph that is not the trailing content of its rationale is a
// hard error naming the node id.
//
// Usage:
//   node --import tsx/esm migrate-boost-levels.ts [--dir <intentions-dir>] [--date <YYYY-MM-DD>] [--no-apply | --check]
//
// --no-apply runs the identical traversal and prints the identical plan but
// writes nothing. --check runs the identical traversal, writes nothing, and
// EXITS NON-ZERO listing every node that still needs migrating — a true no-op
// fence once the migration has been applied (nodes are only written when their
// content actually changes, so a second apply is a no-op).
//
// Stdout (normal / --no-apply): one JSON object
//   { "migrated": [ { "id": "...", "changes": ["..."] } ] }

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "yaml";
import { listNodesStrict, writeNode } from "../src/store.js";
import { extractFrontmatter } from "../src/frontmatter.js";
import { BOOST_LEVELS, BOOST_LEVEL_VALUES, type IntentionNode } from "../src/schema.js";

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/`, so the repo root is
// three directories up. Resolved from this file's own location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

/** The one node still carrying a legacy `override:` — see rewrite 4 above. */
export const OVERRIDE_DROP_NODE_ID = "tactic-transition-node-stamp-landed-body";

/** The stopgap paragraph's fixed opening and closing sentences (rewrite 2). */
const STOPGAP_OPEN = "NAMESPACING STOPGAP 2026-08-11: magnitude compressed from";
const STOPGAP_CLOSE = "Original magnitude preserved at attributes.pre_namespacing_boost for restoration.";

/** The legacy `attention` keys whose presence in a FILE means a form rewrite is owed. */
const LEGACY_ATTENTION_KEYS: readonly string[] = ["boost", "override", "tier"];

export interface Args {
  dir: string;
  date: string;
  /** Plan-only: identical traversal, no writes. Undefined is false (in-process callers). */
  noApply?: boolean;
  /** Fence mode: identical traversal, no writes, non-zero exit if anything is owed. */
  check?: boolean;
}

export interface NodePlan {
  id: string;
  changes: string[];
}

export interface Plan {
  migrated: NodePlan[];
}

export function parseArgs(argv: string[]): Args {
  const out: Args = {
    dir: join(repoRoot, "intentions"),
    date: new Date().toISOString().slice(0, 10),
    noApply: false,
    check: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--dir":
        out.dir = argv[++i];
        break;
      case "--date":
        out.date = argv[++i];
        break;
      case "--no-apply":
        out.noApply = true;
        break;
      case "--check":
        out.check = true;
        break;
      default:
        throw new Error(`migrate-boost-levels: unknown flag '${a}'`);
    }
  }
  return out;
}

/**
 * The member of `BOOST_LEVEL_VALUES` nearest `value` by absolute distance; on an
 * exact tie the HIGHER level wins.
 *
 * The tie branch is a guard, not a live case: the midpoints are 7.5 / 15 / 35 /
 * 67.5 and no stored magnitude sits on one. It is still decided (rather than
 * left to iteration order) so the migration is deterministic.
 */
export function snapToLevel(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`migrate-boost-levels: cannot snap non-positive or non-finite boost ${value}`);
  }
  let best = BOOST_LEVEL_VALUES[0];
  let bestDistance = Math.abs(value - best);
  for (const level of BOOST_LEVEL_VALUES) {
    const distance = Math.abs(value - level);
    if (distance < bestDistance || (distance === bestDistance && level > best)) {
      best = level;
      bestDistance = distance;
    }
  }
  return best;
}

/** The vocabulary NAME of a level value (for the migration note's prose). */
function levelName(value: number): string {
  const found = Object.entries(BOOST_LEVELS).find(([, v]) => v === value);
  if (found === undefined) {
    throw new Error(`migrate-boost-levels: ${value} is not a boost level value`);
  }
  return found[0];
}

/**
 * The legacy `attention` keys present in the node's FILE (not in its parsed
 * in-memory form, which `validateAttention` has already normalized). Non-empty
 * means the file still spells attention the old way and owes a form rewrite even
 * if nothing else about the node changes.
 */
function legacyFileKeys(dir: string, id: string): string[] {
  const raw = readFileSync(join(dir, `${id}.md`), "utf8");
  const frontmatter: unknown = parse(extractFrontmatter(raw, id));
  if (typeof frontmatter !== "object" || frontmatter === null) return [];
  const attention: unknown = (frontmatter as Record<string, unknown>).attention; // type-safety-ok: raw YAML frontmatter has no static type; the object/null guard above narrows it enough to read a known key
  if (typeof attention !== "object" || attention === null) return [];
  return LEGACY_ATTENTION_KEYS.filter((k) => k in (attention as Record<string, unknown>)); // type-safety-ok: same untyped-YAML boundary as above
}

/**
 * Strip the trailing namespacing-stopgap paragraph from `rationale`.
 *
 * Throws when the paragraph is present but is NOT the trailing content (the
 * opening sentence is there but the text does not end with the closing one) —
 * a malformed or mid-rationale stopgap block is guessed at, never silently
 * repaired.
 */
function stripStopgapParagraph(id: string, rationale: string): string {
  const start = rationale.indexOf(STOPGAP_OPEN);
  if (start === -1) {
    throw new Error(`migrate-boost-levels: ${id} has no namespacing-stopgap paragraph to strip`);
  }
  const tail = rationale.slice(start).trimEnd();
  if (!tail.endsWith(STOPGAP_CLOSE)) {
    throw new Error(
      `migrate-boost-levels: ${id}'s namespacing-stopgap paragraph is not the trailing content of attention.rationale — refusing to guess where it ends`,
    );
  }
  const kept = rationale.slice(0, start).trimEnd();
  if (kept === "") {
    throw new Error(
      `migrate-boost-levels: ${id}'s attention.rationale is nothing but the namespacing-stopgap paragraph — stripping it would leave an empty rationale`,
    );
  }
  return kept;
}

/**
 * Apply every owed rewrite to `node` IN PLACE, returning one human-readable line
 * per change (empty when the node is already migrated).
 */
export function migrateNode(node: IntentionNode, date: string): string[] {
  const changes: string[] = [];

  // Rewrite 4 first — it replaces the whole block, so rewrites 1-3 are moot.
  if (node.id === OVERRIDE_DROP_NODE_ID) {
    if (node.attention === null) return changes;
    if (node.phase !== "done") {
      throw new Error(
        `migrate-boost-levels: ${OVERRIDE_DROP_NODE_ID} carries the legacy override claim but is at phase ${String(node.phase)}, not done — refusing to drop a live authored claim`,
      );
    }
    node.attention = null;
    changes.push("dropped the legacy override attention block (the claim is spent: phase done)");
    return changes;
  }

  if (node.attention === null) return changes;

  // Rewrite 2: ladder revert.
  const preserved: unknown = node.attributes.pre_namespacing_boost;
  if (preserved !== undefined && preserved !== null) {
    if (typeof preserved !== "number" || !Number.isFinite(preserved) || preserved <= 0) {
      throw new Error(
        `migrate-boost-levels: ${node.id} has attributes.pre_namespacing_boost ${JSON.stringify(preserved)} — expected a finite number > 0`,
      );
    }
    const keys = Object.keys(node.attention.boosts);
    if (keys.length !== 1 || keys[0] !== "1") {
      throw new Error(
        `migrate-boost-levels: ${node.id} carries attributes.pre_namespacing_boost but its boosts map is {${keys.join(", ")}} — the preserved magnitude was chosen on the tier-1 scale only`,
      );
    }
    const compressed = node.attention.boosts["1"];
    node.attention.boosts["1"] = preserved;
    delete node.attributes.pre_namespacing_boost;
    changes.push(
      `reverted the namespacing stopgap: tier 1 boost restored from ${compressed} to ${preserved} and attributes.pre_namespacing_boost deleted`,
    );
    // The stopgap prose cites the attribute just deleted, so it must go too. A
    // reverted node whose rationale carries no matching trailing paragraph is a
    // hard error inside stripStopgapParagraph.
    node.attention.rationale = stripStopgapParagraph(node.id, node.attention.rationale);
    changes.push("stripped the trailing namespacing-stopgap rationale paragraph");
  } else if (node.attention.rationale.includes(STOPGAP_OPEN)) {
    // Stopgap prose without the preserved magnitude: nothing to revert, but the
    // paragraph still cites a deleted attribute, so strip it (loudly if malformed).
    node.attention.rationale = stripStopgapParagraph(node.id, node.attention.rationale);
    changes.push("stripped the trailing namespacing-stopgap rationale paragraph");
  }

  // Rewrite 3: snap every boost onto the closed level vocabulary.
  for (const key of Object.keys(node.attention.boosts)) {
    const from = node.attention.boosts[key];
    if (!Number.isFinite(from) || from <= 0) {
      throw new Error(
        `migrate-boost-levels: ${node.id} has attention.boosts[${key}] = ${from} — expected a finite number > 0`,
      );
    }
    const to = snapToLevel(from);
    if (to === from) continue;
    node.attention.boosts[key] = to;
    node.attention.rationale = `${node.attention.rationale}\n\nLEVEL MIGRATION ${date}: tier ${key} boost snapped from ${from} to the closed level vocabulary value ${to} (${levelName(to)}) per strategy-graph-drives-dispatch's level-vocabulary clarification; ordering intent unchanged.`;
    changes.push(`snapped tier ${key} boost from ${from} to ${to} (${levelName(to)})`);
  }

  return changes;
}

export function migrateBoostLevels(args: Args): Plan {
  // STRICT enumeration: this is a write-back migration, so an unreadable node
  // file must refuse loudly rather than be silently skipped and left behind on
  // the legacy shape forever (`listNodes` would only warn).
  const nodes = listNodesStrict(args.dir);
  const plan: Plan = { migrated: [] };

  for (const node of nodes) {
    const before = JSON.stringify(node);
    const changes = migrateNode(node, args.date);
    // A node with no attention block (either it never had one, or rewrite 4 just
    // dropped it) owes no form rewrite — the legacy keys only live inside the
    // block. Otherwise consult the FILE, since the in-memory shape is already
    // canonical whatever the file says.
    const legacyKeys = node.attention === null ? [] : legacyFileKeys(args.dir, node.id);
    if (legacyKeys.length > 0) {
      changes.push(
        `rewrote the legacy attention spelling (${legacyKeys.join(", ")}) into the canonical boosts map`,
      );
    }
    if (JSON.stringify(node) === before && legacyKeys.length === 0) continue;
    plan.migrated.push({ id: node.id, changes });
    if (args.noApply !== true && args.check !== true) writeNode(args.dir, node);
  }

  return plan;
}

function main(argv: string[]): void {
  const args = parseArgs(argv);
  const plan = migrateBoostLevels(args);
  if (args.check === true) {
    if (plan.migrated.length > 0) {
      process.stderr.write(
        `migrate-boost-levels: ${plan.migrated.length} node(s) still need migrating:\n${plan.migrated
          .map((n) => `  ${n.id}: ${n.changes.join("; ")}`)
          .join("\n")}\n`,
      );
      process.exit(1);
    }
    return;
  }
  process.stdout.write(`${JSON.stringify(plan)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
