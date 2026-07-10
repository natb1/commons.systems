// reconcile-graph — the store-mutation half of the graph-native reconciler
// sweep (tactic-graph-router-transitions Unit 2). Given the terminal PR states
// its bash wrapper (reconcile-graph-merged) gathered from gh, it decides each
// open graph-native tactic's reconciliation, applies the store mutations
// (phase→main-qa, or the done PRUNE with its inbound-blocked_by repair and the
// serving strategy's round stamp), and prints the graph-commit plan as JSON.
//
// The DECISION lives in the pure `transitions` module (reconcileMergedPhase /
// reconcileClosedPhase / inboundBlockers / strategiesToStamp / stampRound); this
// driver only wires it to the store. No git, no gh — the wrapper owns those and
// runs the printed graph-commit.
//
// merged + needs-main residue → `main-qa` (strategy clarification 22), verified
// post-merge. That phase value is adopted by tactic-main-qa-phase; until it is
// in the schema enum, this driver DEFERS the transition (leaves the tactic
// open, records it under `deferred`) rather than writing an invalid phase —
// the same forward-compat posture as graph-select-target's main-qa arm. No
// residue-bearing merged tactic exists in the graph yet, so the branch is inert.
//
// Batch correctness: a strategy's round is stamped only when EVERY one of its
// non-draft children is in this sweep's done set — so co-pruned siblings do not
// each falsely trip the last-child rule.
//
// Usage:
//   node --import tsx/esm reconcile-graph.ts --pr-states <json-file> [--dir <intentions-dir>] [--date <YYYY-MM-DD>]
//
// <json-file> maps tactic id → "merged" | "closed" (open PRs omitted).
// Stdout: one JSON object
//   { "prune": [...ids], "edit": [...ids], "deferred": [{id,reason}], "reconciled": [{id,target}] }

import { readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes, readNode, readNodeBody, writeNode } from "../src/store.js";
import { PHASES } from "../src/schema.js";
import { servingStrategyIds } from "../src/router.js";
import {
  hasNeedsMainResidue,
  inboundBlockers,
  reconcileClosedPhase,
  reconcileMergedPhase,
  stampRound,
} from "../src/transitions.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

interface Args {
  dir: string;
  prStatesFile: string;
  date: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    dir: join(repoRoot, "intentions"),
    prStatesFile: "",
    date: new Date().toISOString().slice(0, 10),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--dir":
        out.dir = argv[++i];
        break;
      case "--pr-states":
        out.prStatesFile = argv[++i];
        break;
      case "--date":
        out.date = argv[++i];
        break;
      default:
        throw new Error(`reconcile-graph: unknown flag '${a}'`);
    }
  }
  if (out.prStatesFile === "") throw new Error("reconcile-graph: --pr-states <file> is required");
  return out;
}

interface Plan {
  prune: string[];
  edit: string[];
  deferred: { id: string; reason: string }[];
  reconciled: { id: string; target: string }[];
}

/** A tactic is "open" (in flight) when its phase is set and neither draft nor done. */
function isOpen(phase: string | null): boolean {
  return phase !== null && phase !== "draft" && phase !== "done";
}

export function reconcileGraph(args: Args): Plan {
  const prStates: Record<string, string> = JSON.parse(readFileSync(args.prStatesFile, "utf8"));
  const nodes = listNodes(args.dir);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const plan: Plan = { prune: [], edit: [], deferred: [], reconciled: [] };
  const editSet = new Set<string>();

  // Pass 1: classify each terminal-PR tactic into main-qa-transition vs done.
  const doneSet = new Set<string>();
  const mainQaTargets: string[] = [];
  for (const [id, state] of Object.entries(prStates)) {
    const node = byId.get(id);
    if (node === undefined || node.kind !== "tactic" || !isOpen(node.phase)) continue;
    const residue = hasNeedsMainResidue(readNodeBody(args.dir, id));
    const target = state === "merged" ? reconcileMergedPhase(residue) : reconcileClosedPhase();
    if (target === "main-qa") {
      if (!PHASES.includes("main-qa" as (typeof PHASES)[number])) {
        plan.deferred.push({ id, reason: "main-qa phase not yet in schema (tactic-main-qa-phase)" });
        continue;
      }
      mainQaTargets.push(id);
    } else {
      doneSet.add(id);
    }
  }

  // Pass 2: main-qa transitions (a plain phase write, no prune).
  for (const id of mainQaTargets) {
    const node = readNode(args.dir, id);
    node.phase = "main-qa" as typeof node.phase;
    writeNode(args.dir, node);
    editSet.add(id);
    plan.reconciled.push({ id, target: "main-qa" });
  }

  // Pass 3: done prunes — inbound-blocked_by repair + round stamps, then delete.
  // Compute the round stamps against the FULL done set so co-pruned siblings do
  // not each falsely trip the last-child rule.
  const strategiesStamped = new Set<string>();
  for (const id of doneSet) {
    const tactic = byId.get(id);
    if (tactic === undefined) continue;

    // Inbound blocked_by repair — remove the pruned id from every survivor that
    // still lists it (a co-pruned blocker is itself deleted, so skip those).
    for (const inbound of inboundBlockers(id, nodes)) {
      if (doneSet.has(inbound)) continue;
      const node = readNode(args.dir, inbound);
      node.blocked_by = node.blocked_by.filter((b) => b !== id);
      writeNode(args.dir, node);
      editSet.add(inbound);
    }

    // Round stamp: a serving strategy whose every non-draft child is in the
    // done set closes a round.
    for (const sid of servingStrategyIds(tactic, byId)) {
      if (strategiesStamped.has(sid)) continue;
      const remaining = nodes.filter(
        (n) =>
          !doneSet.has(n.id) &&
          n.kind === "tactic" &&
          n.phase !== null &&
          n.phase !== "draft" &&
          servingStrategyIds(n, byId).has(sid),
      );
      if (remaining.length === 0) {
        const strategy = byId.get(sid);
        if (strategy !== undefined && strategy.kind === "strategy") {
          strategy.rounds = stampRound(strategy.rounds, args.date);
          writeNode(args.dir, strategy);
          editSet.add(sid);
          strategiesStamped.add(sid);
        }
      }
    }

    plan.reconciled.push({ id, target: "done" });
  }

  // Delete the pruned node files last (after all reads above).
  for (const id of doneSet) {
    rmSync(join(args.dir, `${id}.md`));
    plan.prune.push(id);
  }

  // A pruned node must never also appear as an edit (a co-pruned inbound
  // blocker was already skipped, but guard defensively).
  plan.edit = [...editSet].filter((id) => !doneSet.has(id)).sort();
  plan.prune.sort();
  return plan;
}

function main(argv: string[]): void {
  process.stdout.write(`${JSON.stringify(reconcileGraph(parseArgs(argv)))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
