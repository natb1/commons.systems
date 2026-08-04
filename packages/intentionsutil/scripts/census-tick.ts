// census-tick — the store-mutation half of the scripted census dispatch-tick
// step (tactic-census-scripted-tick Unit 2). Consumes the pure decision layer
// (`census-decide`'s `partitionDonePresent`) and applies the mutations:
//
//   - prune every done-present node whose completion verifies mechanically,
//     repairing the inbound `blocked_by` edges that would otherwise dangle
//     (validateGraph rule 13),
//   - mint one `tactic-census-defect-*` node per done-present node whose
//     completion does NOT verify, deduped by the deterministic defect id so a
//     repeated tick surfaces each defect exactly once.
//
// Structural analog of `reconcile-graph.ts`: a decision-and-mutation TS module
// that does its own file writes/deletes and prints the graph-commit plan as
// JSON on stdout. No git, no gh — the bash wrapper owns those and runs the
// printed graph-commit.
//
// Usage:
//   node --import tsx/esm census-tick.ts [--intentions <dir>] [--now <YYYY-MM-DD>]
//
// Stdout: one JSON object
//   { "prune": [...ids], "edit": [...ids], "defectsMinted": [...ids],
//     "defectsExisting": [...ids], "defectCount": <n> }

import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes, readNode, writeNode } from "../src/store.js";
import type { IntentionNode, IntentionNodeInput } from "../src/schema.js";
import { inboundBlockers } from "../src/transitions.js";
import { partitionDonePresent, type DefectReason } from "./census-decide.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

/** The strategy every minted integrity-defect tactic serves. */
const DEFECT_SERVES = "strategy-graph-native-dispatch";

export interface Args {
  dir: string;
  date: string;
}

export interface Plan {
  prune: string[];
  edit: string[];
  defectsMinted: string[];
  defectsExisting: string[];
  defectCount: number;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    dir: join(repoRoot, "intentions"),
    date: new Date().toISOString().slice(0, 10),
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
  const { prunable, defects } = partitionDonePresent(nodes);
  const prunableSet = new Set(prunable);

  const plan: Plan = {
    prune: [],
    edit: [],
    defectsMinted: [],
    defectsExisting: [],
    defectCount: defects.length,
  };
  const editSet = new Set<string>();

  // Edge repair FIRST, deletion last (below): every inbound read happens while
  // every file still exists, so no read races an about-to-be-deleted file.
  // validateGraph rule 13 rejects a surviving blocked_by that no longer
  // resolves, so these edges must be repaired in the same commit as the prune.
  for (const id of prunable) {
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
  for (const id of prunable) {
    rmSync(join(args.dir, `${id}.md`));
    plan.prune.push(id);
  }

  // Defect mint, deduped on the deterministic id: a defect already surfaced by
  // an earlier tick is reported, not re-minted.
  for (const { id: targetId, reason } of defects) {
    const defectId = defectIdFor(targetId);
    if (existsSync(join(args.dir, `${defectId}.md`))) {
      plan.defectsExisting.push(defectId);
      continue;
    }
    const target = byId.get(targetId);
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
