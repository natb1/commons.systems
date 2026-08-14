// census-tick — the store-mutation half of the scripted census dispatch-tick
// step (tactic-census-scripted-tick Unit 2). Consumes the pure decision layer
// (`census-decide`'s `partitionDonePresent`) and applies the mutations:
//
//   - prune every done-present node whose completion verifies mechanically —
//     PLUS every done-present census-defect node, which census retires without
//     merge evidence because it minted the node itself (see
//     `census-decide.ts`'s `partitionDonePresent`) — repairing the inbound
//     `blocked_by` edges that would otherwise dangle (validateGraph rule 13),
//   - mint one `tactic-census-defect-*` node per done-present node whose
//     completion does NOT verify, deduped by the deterministic defect id so a
//     repeated tick surfaces each defect exactly once.
//
// Refusal, not repair, for every OTHER inbound edge class validateGraph
// checks: a prune candidate still named by a surviving node's `parent`,
// `serves`, `validates`, or `recovers` (schema.ts's `validateGraph` — e.g.
// 'parent "x" does not resolve to a node') is dropped from the batch —
// left on disk, untouched, no defect minted for it — and reported in
// `Plan.retained`. `blocked_by` is the one edge class census repairs, because
// removing a `blocked_by` entry is semantics-preserving (absence already
// reads as completion to the selector — see `inboundBlockers`'s doc comment).
// Stripping a `serves`/`validates` entry or re-pointing a `parent` is not:
// it would silently change what the surviving node MEANS (which strategy it
// validates, which node it is a child of), a call census has no authority to
// make unattended. Refusing leaves the decision for a human/office-hours pass
// instead of guessing.
//
// Acceptable known residue: pruning a defect node discards its own completion
// record — census keeps no evidence that the defect was resolved, or by whom.
// That is by design and costs nothing recoverable. The defect node is
// bookkeeping census minted; the real evidence of the FIX lives on the target's
// `execution`, which census re-checks every tick. And because mint-dedup is by
// file existence, a defect closed while its target is still unverifiable is
// simply re-minted on the next tick — so the residue is a lost audit trail on a
// throwaway record, never a lost defect.
//
// Structural analog of `reconcile-graph.ts`: a decision-and-mutation TS module
// that does its own file writes/deletes and prints the graph-commit plan as
// JSON on stdout. No git, no gh — the bash wrapper owns those and runs the
// printed graph-commit.
//
// Usage:
//   node --import tsx/esm census-tick.ts [--intentions <dir>] [--now <YYYY-MM-DD>]
//                                        [--skip <id>]...
//
// `--skip <id>` (repeatable) excludes `<id>` from the done-present partition
// entirely — it is neither pruned nor counted/minted as a defect this run. It
// stays a FULL member of the node set for every inbound-edge scan, so a
// skipped node still protects its own references: another candidate the
// skipped node names via parent/serves/validates/recovers is still refused
// (`Plan.retained`). The dispatch caller passes the ids the SAME tick's
// reconciler just transitioned to done, so a node is never absorbed and
// deleted seconds apart; deferring its prune by one tick costs nothing (it is
// still done-present, and no longer newly-transitioned, on the next tick).
//
// Stdout: one JSON object
//   { "prune": [...ids], "edit": [...ids], "defectsMinted": [...ids],
//     "defectsExisting": [...ids], "defectCount": <n>, "retained": [...ids] }

import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes, readNode, writeNode } from "../src/store.js";
import type { IntentionNode, IntentionNodeInput } from "../src/schema.js";
import { inboundBlockers } from "../src/transitions.js";
import { isCensusDefectNode, partitionDonePresent, type DefectReason } from "./census-decide.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

/** The strategy every minted integrity-defect tactic serves. */
const DEFECT_SERVES = "strategy-graph-native-dispatch";

export interface Args {
  dir: string;
  date: string;
  /**
   * Ids excluded from the done-present partition: neither pruned nor minted as
   * defects this run, but still present in the node set every inbound-edge scan
   * reads (see the header comment). Empty for an unrestricted census.
   */
  skip: string[];
}

export interface Plan {
  prune: string[];
  edit: string[];
  defectsMinted: string[];
  defectsExisting: string[];
  defectCount: number;
  /**
   * Prune candidates REFUSED because a surviving (not co-pruned) node still
   * names them via `parent`, `serves`, `validates`, or `recovers`. Left on
   * disk untouched; no defect minted. Sorted.
   */
  retained: string[];
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    dir: join(repoRoot, "intentions"),
    date: new Date().toISOString().slice(0, 10),
    skip: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--intentions":
        out.dir = argv[++i];
        break;
      case "--now":
        out.date = argv[++i];
        break;
      case "--skip":
        out.skip.push(argv[++i]);
        break;
      default:
        throw new Error(`census-tick: unknown flag '${a}'`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.date)) {
    throw new Error(`census-tick: --now must be YYYY-MM-DD, got "${out.date}"`);
  }
  return out;
}

/** The deterministic, stable id of the defect node tracking `targetId`. */
export function defectIdFor(targetId: string): string {
  return `tactic-census-defect-${targetId.replace(/^(tactic|strategy)-/, "")}`;
}

/**
 * The ids of nodes referencing `id` through any inbound edge class OTHER than
 * `blocked_by` that `validateGraph` (schema.ts) checks resolve to an existing
 * node: `parent`, `serves`, `validates`, `recovers` (its rules 1-4 and 13-14,
 * e.g. 'parent "x" does not resolve to a node'). `blocked_by` is excluded —
 * that edge class has its own dedicated repair loop (`inboundBlockers`).
 *
 * Mirrors `inboundBlockers`'s shape: returns RAW referrers, unfiltered for
 * co-pruning. The caller applies the co-prune exemption, same as the
 * `blocked_by` repair loop does.
 */
export function inboundNonBlockedByReferences(id: string, nodes: readonly IntentionNode[]): string[] {
  return nodes
    .filter(
      (n) =>
        n.parent === id ||
        n.serves.includes(id) ||
        n.validates.includes(id) ||
        n.recovers.includes(id),
    )
    .map((n) => n.id);
}

/**
 * Replace a just-written node file's generated `# ${statement}` placeholder body
 * with `body`. `writeNode` only generates the placeholder for a brand-new file
 * (it preserves an existing body verbatim), so this runs immediately after the
 * mint. Mirrors the fence-preserving splice the retired `dispatch-graph-census`
 * (replaced by `dispatch-census-tick`) used to do in bash: keep everything
 * through the frontmatter's closing `---` fence, overwrite the rest.
 */
function spliceBody(dir: string, id: string, body: string): void {
  const path = join(dir, `${id}.md`);
  const raw = readFileSync(path, "utf8");
  const fence = "\n---\n";
  // Start past the opening `---\n` fence so the SECOND fence is the one found.
  const end = raw.indexOf(fence, 3);
  if (end === -1) {
    throw new Error(`census-tick: no closing frontmatter fence in ${id}.md`);
  }
  writeFileSync(path, `${raw.slice(0, end + fence.length)}${body}`);
}

/**
 * The statement text for a minted defect node. Shared by `defectNode` (the
 * `statement` field) and `censusTick` (the spliced body's `# ` heading) so the
 * two cannot drift apart.
 */
function defectStatement(targetId: string, reason: DefectReason, target: IntentionNode | undefined): string {
  const pr = target?.execution?.pr ?? "none";
  return (
    `census integrity defect: ${targetId} is phase:done with execution.pr:${String(pr)} ` +
    `but completion is not mechanically verifiable (${reason})`
  );
}

function defectNode(
  defectId: string,
  targetId: string,
  reason: DefectReason,
  target: IntentionNode | undefined,
  date: string,
): IntentionNodeInput {
  return {
    id: defectId,
    kind: "tactic",
    statement: defectStatement(targetId, reason, target),
    owner: "ai",
    status: "codified",
    parent: null,
    serves: [DEFECT_SERVES],
    recovers: [],
    rationale: null,
    reading: null,
    gap: null,
    clarifications: [],
    tooling_goals: [],
    success_signal: null,
    attention: null,
    // REQUIRED for selectability: "implement" is an open phase per router.ts's
    // isOpenTactic (neither draft nor done), so the node is router-eligible.
    phase: "implement",
    execution: null,
    validates: [],
    blocked_by: [],
    // Deliberately NOT a park: a census defect must be autonomously selectable,
    // never queued behind office hours.
    office_hours: null,
    pace_exempt: false,
    rounds: null,
    attributes: { census_defect: { target: targetId, reason, detected: date } },
  };
}

export function censusTick(args: Args): Plan {
  // TOLERANT enumeration is correct here (unlike reconcile-graph.ts, which needs
  // listNodesStrict because it writes phase transitions that must not silently
  // skip a corrupt file). census-tick only prunes/edits already-done nodes and
  // mints new defect files; a corrupt file simply is not censused this tick.
  const nodes = listNodes(args.dir);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Skipped ids are withheld from the PARTITION only — they are neither pruned
  // nor counted/minted as defects this run. Every inbound-edge scan below still
  // reads the FULL `nodes` array, so a skipped node keeps protecting whatever it
  // references: it survives this batch, so a candidate it names via
  // parent/serves/validates/recovers is still refused (retained), and a
  // `blocked_by` entry it holds is still repaired.
  const skipSet = new Set(args.skip);
  const { prunable, defects } = partitionDonePresent(nodes.filter((n) => !skipSet.has(n.id)));
  const candidateSet = new Set(prunable);

  // Refusal pass, BEFORE the edge-repair loop below: a candidate still named
  // by a surviving (not co-pruned) node's parent/serves/validates/recovers is
  // dropped from the prune batch entirely — census repairs blocked_by, but
  // refuses rather than repairs every other edge class (see header comment).
  // Same co-prune exemption as the blocked_by loop: a referrer that is itself
  // a prune candidate this batch does not block the prune, since it too is
  // about to vanish.
  const retained: string[] = [];
  for (const id of prunable) {
    const referrers = inboundNonBlockedByReferences(id, nodes).filter((r) => !candidateSet.has(r));
    if (referrers.length > 0) retained.push(id);
  }
  const retainedSet = new Set(retained);
  const prunableFiltered = prunable.filter((id) => !retainedSet.has(id));
  const prunableSet = new Set(prunableFiltered);

  const plan: Plan = {
    prune: [],
    edit: [],
    defectsMinted: [],
    defectsExisting: [],
    defectCount: defects.length,
    retained: retained.sort(),
  };
  const editSet = new Set<string>();

  // Edge repair FIRST, deletion last (below): every inbound read happens while
  // every file still exists, so no read races an about-to-be-deleted file.
  // validateGraph rule 13 rejects a surviving blocked_by that no longer
  // resolves, so these edges must be repaired in the same commit as the prune.
  for (const id of prunableFiltered) {
    for (const inbound of inboundBlockers(id, nodes)) {
      // A co-pruned blocker is itself being deleted this run — editing it would
      // write a file that is about to vanish.
      if (prunableSet.has(inbound)) continue;
      const node = readNode(args.dir, inbound);
      node.blocked_by = node.blocked_by.filter((b) => b !== id);
      writeNode(args.dir, node);
      editSet.add(inbound);
    }
  }

  // NO round stamping here — a deliberate divergence from reconcile-graph.ts.
  // Every node census prunes is ALREADY `phase: done`; its serving strategy's
  // round was closed at that done-transition (reconcile-graph.ts Pass 3).
  // Stamping again at prune time would double-count the same completion.

  // Deletion LAST, after every edge-repair read/write above.
  for (const id of prunableFiltered) {
    rmSync(join(args.dir, `${id}.md`));
    plan.prune.push(id);
  }

  // Defect mint, deduped on the deterministic id: a defect already surfaced by
  // an earlier tick is reported, not re-minted.
  for (const { id: targetId, reason } of defects) {
    const defectId = defectIdFor(targetId);
    const target = byId.get(targetId);

    // Defense in depth against the closed-defect self-regress: a census-minted
    // defect node must NEVER itself become a defect target. `partitionDonePresent`
    // already routes a done defect node to `prunable`, so this only fires if
    // that classification is ever weakened — and if it did fire without this
    // guard, the mint would produce `tactic-census-defect-census-defect-<x>`
    // (`defectIdFor` strips only ONE leading `tactic-`/`strategy-`), which the
    // next tick would compound again, unbounded.
    if (target !== undefined && isCensusDefectNode(target)) continue;

    // Same-batch id collision: the deletion loop above already removed the
    // pruned files, so `existsSync` cannot see a defect node pruned THIS tick.
    // `prunableSet` is exactly the set of ids that loop deleted. When a pruned
    // defect's target is still unverifiable, the mint loop would otherwise
    // re-create the very id sitting in `plan.prune`, and the batch would hand
    // graph-commit the same id as both `--prune <id>` and a bare create arg.
    // Skip it this tick; the next tick re-mints it cleanly — which is the right
    // outcome, because the target is still broken and the defect is still owed.
    if (prunableSet.has(defectId)) continue;

    if (existsSync(join(args.dir, `${defectId}.md`))) {
      plan.defectsExisting.push(defectId);
      continue;
    }
    writeNode(args.dir, defectNode(defectId, targetId, reason, target, args.date));
    const statement = defectStatement(targetId, reason, target);
    spliceBody(
      args.dir,
      defectId,
      `# ${statement}\n\n` +
        `Investigate why \`${targetId}\`'s completion is not mechanically verifiable and ` +
        `record the missing completion evidence (re-derive from git history / \`gh\`, or if ` +
        `the node is legitimately complete, backfill the merge-verification field on its ` +
        `\`execution\`). If \`${targetId}\` already verifies and was pruned, close this node ` +
        `(phase → done).\n`,
    );
    plan.defectsMinted.push(defectId);
  }

  // Defensive guard (mirrors reconcile-graph.ts): a node can never be both
  // pruned and edited.
  plan.edit = [...editSet].filter((id) => !prunableSet.has(id)).sort();
  plan.prune.sort();
  return plan;
}

function main(argv: string[]): void {
  process.stdout.write(`${JSON.stringify(censusTick(parseArgs(argv)))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
