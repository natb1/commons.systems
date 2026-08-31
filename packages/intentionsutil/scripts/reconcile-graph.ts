// reconcile-graph — the store-mutation half of the graph-native reconciler
// sweep (tactic-graph-router-transitions Unit 2, extended by
// tactic-execution-pr-merge-verification). Given the terminal PR states its
// bash wrapper (reconcile-graph-merged) gathered from gh, it decides each open
// graph-native tactic's reconciliation, applies the store mutations
// (phase→main-qa or phase→done, both recording completion evidence, plus the
// serving strategy's round stamp), and prints the graph-commit plan as JSON.
//
// The DECISION lives in the pure `transitions` module (reconcileMergedPhase /
// reconcileClosedPhase / stampRound); this driver only wires it to the store.
// No git, no gh — the wrapper owns those and runs the printed graph-commit.
//
// merged + needs-main residue → `main-qa` (strategy clarification 22), verified
// post-merge; the merge evidence (mergedAt + mergeCommitSha) is recorded on the
// node so later phase writes carry it through to done.
//
// merged without residue, or closed-not-merged → `done`. The done-transition NO
// LONGER prunes: the node is written with `phase: "done"` and left present on
// disk. For a genuine merge, execution.completion records mergedAt +
// mergeCommitSha; for a closed-not-merged PR, completion is left untouched
// (null for a never-merged tactic) — a deliberate census-flaggable
// integrity-defect signal. Inbound-blocked_by edge repair and file DELETION are
// no longer this driver's concern: they move to a separate future
// census/cleanup pass that verifies the evidence and prunes. Only round-stamping
// remains a done-transition concern here.
//
// Batch correctness: a strategy's round is stamped only when EVERY one of its
// non-draft, non-done children is in this sweep's done set — so co-transitioned
// siblings do not each falsely trip the last-child rule, and a sibling already
// at `done` from a prior sweep (now persisted on disk) does not wrongly keep the
// round open.
//
// Usage:
//   node --import tsx/esm reconcile-graph.ts --pr-states <json-file> [--dir <intentions-dir>] [--date <YYYY-MM-DD>] [--no-apply]
//
// <json-file> maps tactic id → { state: "merged" | "closed"; mergedAt?; mergeCommitSha? }
// (open PRs omitted).
//
// --no-apply runs the IDENTICAL traversal/decision passes but skips every
// mutating side-effect (the writeNode calls) — the returned Plan (its
// edit/deferred/reconciled arrays) is byte-for-byte identical to an apply run
// over the same unmutated dir, so the caller can snapshot the plan's id set from
// origin/main BEFORE the apply run dirties disk (plan-then-apply rollback).
// Stdout: one JSON object
//   { "edit": [...ids], "deferred": [{id,reason}], "reconciled": [{id,target}] }

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode, readNodeBody, writeNode } from "../src/store.js";
import { listNodesStrictCached } from "../src/store-cache.js";
import { servingStrategyIds } from "../src/router.js";
import {
  hasNeedsMainResidue,
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
  // Plan-only mode: run the identical decision passes but skip every mutating
  // side-effect. Optional so in-process callers (tests) may omit it — undefined
  // is treated as false. parseArgs always sets a definite boolean.
  noApply?: boolean;
  // `DISPATCH_GRAPH_NODE_CACHE` (../src/store-cache.ts) names a storage
  // LOCATION for a read-only, content-addressed memo of the strict enumeration
  // below — never a node subset, so it cannot change what this sweep decides —
  // and it is read at the CLI layer only, so unset/empty (and every in-process
  // caller that omits it) simply self-enumerates.
  cacheDir?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    dir: join(repoRoot, "intentions"),
    prStatesFile: "",
    date: new Date().toISOString().slice(0, 10),
    noApply: false,
    cacheDir: process.env.DISPATCH_GRAPH_NODE_CACHE || "",
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
      case "--no-apply":
        out.noApply = true;
        break;
      default:
        throw new Error(`reconcile-graph: unknown flag '${a}'`);
    }
  }
  if (out.prStatesFile === "") throw new Error("reconcile-graph: --pr-states <file> is required");
  return out;
}

interface Plan {
  edit: string[];
  // No pass in this file pushes to `deferred` anymore — the only producer was
  // a schema-migration guard for main-qa, which has since landed (main-qa is a
  // real PHASES member; see the header note above). The field itself stays:
  // the output shape is documented as byte-for-byte stable (see the header),
  // and the bash wrapper / dispatch-ladder-run's `deferred` handling both read
  // this key, so removing it would be a silent contract break for no gain.
  deferred: { id: string; reason: string }[];
  reconciled: { id: string; target: string }[];
}

/** One entry of the --pr-states JSON: terminal PR state plus optional merge evidence. */
interface PrState {
  state: string;
  mergedAt?: string;
  mergeCommitSha?: string;
}

/**
 * The completion evidence recorded for a genuinely-merged tactic.
 *
 * Normalizes EMPTY strings to null, not just absent keys: the bash wrapper
 * builds the entry with `jq -r '.mergedAt // empty'` / `'.mergeCommitSha //
 * empty'`, so a null/absent GitHub field arrives here as `""`. `optionalString`
 * (schema.ts) preserves `""` verbatim, so without this an empty sha would land
 * as `mergeCommitSha: ""` and satisfy the Completion JSDoc's "mergedAt +
 * mergeCommitSha both non-null" merge proof while carrying no evidence at all.
 */
function mergeCompletion(entry: PrState): { mergedAt: string | null; mergeCommitSha: string | null; graphCommitSha: null } {
  return {
    mergedAt: entry.mergedAt || null,
    mergeCommitSha: entry.mergeCommitSha || null,
    graphCommitSha: null,
  };
}

/** A tactic is "open" (in flight) when its phase is set and neither draft nor done. */
function isOpen(phase: string | null): boolean {
  return phase !== null && phase !== "draft" && phase !== "done";
}

/**
 * Whether an out-of-band merge event may still be ABSORBED into this tactic —
 * a strictly narrower question than `isOpen`, which only asks whether the
 * tactic is in flight. `main-qa` is open (it is a live phase a node sits at
 * awaiting `/qa-main`) but it is NOT merge-absorbable.
 *
 * A node at `main-qa` has nothing to absorb from a merge. Either it arrived by
 * the reconciler's own main-qa transition, which already recorded the merge
 * evidence, or it was minted directly at `main-qa` at qa record time, in which
 * case the merge it would absorb is its SOURCE's and belongs to the source
 * node, not to it. Re-processing it can only mis-classify it.
 *
 * Concretely, without this narrowing a node minted directly at `main-qa` and
 * carrying no `## needs-main` heading would be read as `hasResidue === false`
 * by `reconcileMergedPhase` and written straight to `done` on the very next
 * sweep — destroying the verification node before `/qa-main` ever runs. The
 * destination node carries no residue heading BY DESIGN (buildMainqaBody uses
 * `## Verification items`), so the residue heading is NOT the protection;
 * being at `main-qa` is.
 *
 * Advancing a `main-qa` node (drain tail included) is `/qa-main`'s job, not
 * this reconciler's — for a MERGE. See `isCloseAbsorbable` for the one event
 * that is not a merge and that `/qa-main` structurally cannot handle.
 */
function isMergeAbsorbable(phase: string | null): boolean {
  return isOpen(phase) && phase !== "main-qa";
}

/**
 * Whether a CLOSED-WITHOUT-MERGE event may be absorbed into this tactic. Every
 * open phase qualifies — `main-qa` INCLUDED, which is the one way this differs
 * from `isMergeAbsorbable`.
 *
 * The two events are categorically different and the caller already
 * distinguishes them: `--pr-states` carries `state: "merged"` only when GitHub
 * reported a non-null `mergedAt`, and `state: "closed"` means terminal AND
 * never merged (reconcile-graph-merged's terminal arm; an OPEN PR never reaches
 * it). The narrowing above is about a MERGE — "there is no out-of-band merge
 * left to absorb" — and a close-without-merge absorbs no merge. Nothing landed,
 * so there is nothing to verify against deployed main and the verification node
 * is moot.
 *
 * Without this, a destination node born at `main-qa` whose source PR is closed
 * unmerged is stranded FOREVER: `graph-select-target`'s `main-qa` arm gates on
 * `mergedAt` and returns `pr-not-merged` on every tick, so `/qa-main` can never
 * receive it, and `isMergeAbsorbable` keeps this sweep from ever enumerating it
 * again. Assigning the advance to `/qa-main` is vacuous in exactly this case.
 *
 * The outcome is the SAME rule every other closed-unmerged tactic already gets
 * (see this file's header): `phase: "done"` with `completion` left null — the
 * deliberate census-flaggable integrity-defect signal, not silent deletion.
 */
function isCloseAbsorbable(phase: string | null): boolean {
  return isOpen(phase);
}

export function reconcileGraph(args: Args): Plan {
  const prStates: Record<string, PrState> = JSON.parse(readFileSync(args.prStatesFile, "utf8"));
  // STRICT enumeration: reconciliation writes phase transitions back to disk,
  // and every id it does NOT see is treated as "not a graph node" (skipped).
  // Under the tolerant `listNodes` a corrupt node file would silently drop out
  // of `byId`, so its merged PR would never be reconciled and the node would
  // sit at a stale phase forever. A corrupt file must refuse loudly instead.
  const nodes = listNodesStrictCached(args.dir, args.cacheDir ?? "");
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const plan: Plan = { edit: [], deferred: [], reconciled: [] };
  const editSet = new Set<string>();

  // Pass 1: classify each terminal-PR tactic into main-qa-transition vs done.
  // doneSet maps each done-transitioning id to its pr-states entry so Pass 3 can
  // record the right completion evidence; mainQaTargets carries the entry too.
  //
  // Deliberately NO office_hours filter here. graph-auto-merge gates on a live
  // office_hours park because it DECIDES — it takes the irreversible autonomous
  // action of squash-merging, and a park revokes that authority. This pass only
  // RECORDS REALITY: the PR is already terminal on GitHub, and refusing to
  // reconcile a parked node would strand it at a stale phase with graph state
  // contradicting GitHub — exactly what this reconciler exists to prevent. The
  // park survives the write untouched: office_hours is a frontmatter field the
  // phase write never touches, and officeHoursQueue (src/officeHours.ts:48-75)
  // keys only on office_hours !== null with no phase filter, so the node stays
  // in the office-hours queue after reconciliation.
  const doneSet = new Map<string, PrState>();
  const mainQaTargets: { id: string; entry: PrState }[] = [];
  for (const [id, entry] of Object.entries(prStates)) {
    const node = byId.get(id);
    if (node === undefined || node.kind !== "tactic") continue;
    // Merge and close are absorbable into DIFFERENT phase sets — `main-qa` is
    // excluded from the first and included in the second. See the two
    // predicates above.
    const merged = entry.state === "merged";
    if (!(merged ? isMergeAbsorbable(node.phase) : isCloseAbsorbable(node.phase))) continue;
    const residue = hasNeedsMainResidue(readNodeBody(args.dir, id));
    const target = merged ? reconcileMergedPhase(residue) : reconcileClosedPhase();
    if (target === "main-qa") {
      mainQaTargets.push({ id, entry });
    } else {
      doneSet.set(id, entry);
    }
  }

  // Pass 2: main-qa transitions (a plain phase write). The node genuinely
  // merged, so record the merge evidence now — later phase writes round-trip
  // `completion` through validateExecution and preserve it through to done.
  for (const { id, entry } of mainQaTargets) {
    const node = readNode(args.dir, id);
    node.phase = "main-qa" as typeof node.phase;
    // The enumeration that produces --pr-states only yields tactics carrying a
    // non-null execution.pr, so `execution` is guaranteed here. Silently
    // skipping the write would record the all-null completion that means
    // "abandoned or unverifiable" on genuinely-merged work — a clear error
    // beats that fallback (.claude/rules/code-style.md).
    if (node.execution == null) {
      throw new Error(`reconcile-graph: ${id} has a terminal merged PR but no execution object`);
    }
    node.execution.completion = mergeCompletion(entry);
    if (!args.noApply) writeNode(args.dir, node);
    editSet.add(id);
    plan.reconciled.push({ id, target: "main-qa" });
  }

  // Pass 3: done transitions — write `phase: "done"` + completion evidence and
  // LEAVE the node present. No prune, no inbound-blocked_by repair: the node
  // stays on disk as a real file, so inbound blocked_by edges still resolve and
  // validateGraph is satisfied, and the router already treats a present-done
  // blocker as complete (router.ts blockersComplete). Edge repair and deletion
  // are only needed at actual deletion time, which is now a separate future
  // census concern. Round stamps are computed against the FULL done set so
  // co-transitioned siblings do not each falsely trip the last-child rule.
  const strategiesStamped = new Set<string>();
  for (const [id, entry] of doneSet) {
    const tactic = byId.get(id);
    if (tactic === undefined) continue;

    // Write the done transition as an edit.
    const node = readNode(args.dir, id);
    node.phase = "done" as typeof node.phase;
    // Merged → record evidence; closed-not-merged → leave completion untouched
    // (null for a never-merged tactic), the deliberate census-flaggable case.
    // On the merged path `execution` is guaranteed non-null (the enumeration
    // only yields tactics carrying execution.pr); erroring beats silently
    // writing the all-null completion that means "unverifiable".
    if (entry.state === "merged") {
      if (node.execution == null) {
        throw new Error(`reconcile-graph: ${id} has a terminal merged PR but no execution object`);
      }
      node.execution.completion = mergeCompletion(entry);
    }
    if (!args.noApply) writeNode(args.dir, node);
    editSet.add(id);

    // Round stamp: a serving strategy whose every non-draft, non-done child is
    // in this sweep's done set closes a round. Excluding `phase === "done"` is
    // essential now that done nodes PERSIST on disk — a sibling reconciled to
    // done in a PRIOR sweep (so not in this sweep's doneSet) must not be counted
    // as a live "remaining" child that would block the stamp forever.
    for (const sid of servingStrategyIds(tactic, byId)) {
      if (strategiesStamped.has(sid)) continue;
      const remaining = nodes.filter(
        (n) =>
          !doneSet.has(n.id) &&
          n.kind === "tactic" &&
          n.phase !== null &&
          n.phase !== "draft" &&
          n.phase !== "done" &&
          servingStrategyIds(n, byId).has(sid),
      );
      if (remaining.length === 0) {
        const strategy = byId.get(sid);
        if (strategy !== undefined && strategy.kind === "strategy") {
          strategy.rounds = stampRound(strategy.rounds, args.date);
          if (!args.noApply) writeNode(args.dir, strategy);
          editSet.add(sid);
          strategiesStamped.add(sid);
        }
      }
    }

    plan.reconciled.push({ id, target: "done" });
  }

  // Nothing is pruned anymore, so every mutated id (including done-transitioned
  // ones) is a genuine edit.
  plan.edit = [...editSet].sort();
  return plan;
}

function main(argv: string[]): void {
  process.stdout.write(`${JSON.stringify(reconcileGraph(parseArgs(argv)))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
