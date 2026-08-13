import { execFileSync } from "node:child_process";
import { resolveAttention, listNodesStrict } from "@commons-systems/intentionsutil";
import type { IntentionNode } from "@commons-systems/intentionsutil";
import { buildRows, isOpenTactic, subtreeParents } from "./rows.js";
import { readVelocity } from "./velocity.js";
import type { PageData, Payload, PlanRow, Provenance } from "./model.js";

/**
 * The commit and clean-state the build ran against.
 *
 * The page is a snapshot with no runtime read, so this stamp is what stops a
 * reader mistaking old rank for current rank. It replaces the
 * `STALE_CLONE_THRESHOLD_MS` guard inherited from
 * `office-hours/src/graph-source.ts`, which no longer applies: there is no live
 * clone read to go stale, only a build that has a date. The guard's INTENT is
 * ported; the guard itself is not.
 */
export function readProvenance(repoDir: string, ref = "origin/main"): Provenance {
  const git = (args: string[]): string =>
    execFileSync("git", args, { cwd: repoDir, encoding: "utf8" }).trim();

  const sha = git(["rev-parse", "HEAD"]);
  const status = git(["status", "--porcelain"]);
  return {
    sha,
    shaShort: sha.slice(0, 8),
    clean: status === "",
    builtAt: new Date().toISOString(),
    ref,
  };
}

/** Delegation ids reachable from a tactic: its own `recovers`, plus its strategies'. */
export function delegationIndex(nodes: IntentionNode[]): Record<string, string[]> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const index: Record<string, string[]> = {};
  for (const node of nodes) {
    if (!isOpenTactic(node)) continue;
    const ids = new Set<string>(node.recovers);
    for (const sid of node.serves) {
      for (const id of byId.get(sid)?.recovers ?? []) ids.add(id);
    }
    if (ids.size > 0) index[node.id] = [...ids].sort();
  }
  return index;
}

/**
 * Done/total descendant counts per ancestor, over ALL tactics including done
 * ones.
 *
 * Global rather than windowed, and labelled as such on the page: heat answers
 * "what dominates the current window", progress answers "how far has this
 * lineage got overall". Scoping progress to the filter too would make a
 * lineage's completion rate jump whenever the reader hid rows, which is not a
 * fact about the lineage.
 *
 * The greenfield rule that a `done` node contributes nothing to any axis is
 * what makes these two readings coherent: heat DECAYS as work lands, so heat
 * falling and progress rising are two readings of the same motion.
 */
export function progressIndex(nodes: IntentionNode[]): Record<string, { done: number; total: number }> {
  const attention = resolveAttention(nodes);
  const index: Record<string, { done: number; total: number }> = {};
  for (const node of nodes) {
    if (node.kind !== "tactic") continue;
    const done = node.phase === "done";
    for (const id of attention.get(node.id)?.sources ?? []) {
      if (id === node.id) continue;
      const entry = index[id] ?? { done: 0, total: 0 };
      entry.total += 1;
      if (done) entry.done += 1;
      index[id] = entry;
    }
  }
  return index;
}

function countReasons(rows: PlanRow[], kind: string): number {
  return rows.filter((row) => row.reason?.kind === kind).length;
}

export interface BuildPayloadOptions {
  repoDir: string;
  intentionsDir: string;
  today?: Date;
}

export function buildPayload(options: BuildPayloadOptions): Payload {
  const { repoDir, intentionsDir } = options;

  // STRICT enumeration, never the tolerant `listNodes`: `blockersComplete`
  // reads absence as completion, so a node file the tolerant reader silently
  // drops would unblock its dependent and let it appear as schedulable. A
  // fail-open gate is worse in a published snapshot than in a live tool,
  // because nobody re-runs it to notice.
  const nodes = listNodesStrict(intentionsDir);
  const provenance = readProvenance(repoDir);
  const velocity = readVelocity(repoDir);
  const today = options.today ?? new Date(provenance.builtAt);

  const rows = buildRows({ nodes, velocity, today });
  const containers = subtreeParents(nodes);

  const titles: Record<string, string> = {};
  const kinds: Record<string, string> = {};
  const referenced = new Set<string>();
  for (const row of rows) {
    referenced.add(row.id);
    for (const id of row.spine) referenced.add(id);
    for (const lane of row.lanes) referenced.add(lane.id);
    for (const source of row.sources) referenced.add(source.id);
    if (row.reason?.kind === "blocked") for (const id of row.reason.by) referenced.add(id);
  }
  const delegations = delegationIndex(nodes);
  for (const ids of Object.values(delegations)) for (const id of ids) referenced.add(id);

  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const id of referenced) {
    const node = byId.get(id);
    if (node === undefined) continue;
    titles[id] = node.statement;
    kinds[id] = node.kind;
  }

  return {
    provenance,
    velocity,
    rows,
    titles,
    kinds,
    counts: {
      openTactics: rows.length,
      selectable: rows.filter((row) => row.position !== null).length,
      drafts: rows.filter((row) => row.position !== null && row.draft).length,
      phaseSet: rows.filter((row) => row.position !== null && !row.draft).length,
      parked: countReasons(rows, "parked"),
      blocked: countReasons(rows, "blocked"),
      container: containers.size === 0 ? 0 : countReasons(rows, "container"),
    },
  };
}

/**
 * Compose everything the page needs. The progress and delegation indexes are
 * the build-time side channels the hot-lineage panel consumes when it
 * recomputes client-side under a filter — the page cannot fetch, so anything a
 * filter can reach has to be baked in.
 */
export function buildPageData(options: BuildPayloadOptions): PageData {
  const nodes = listNodesStrict(options.intentionsDir);
  return {
    payload: buildPayload(options),
    progress: progressIndex(nodes),
    delegations: delegationIndex(nodes),
  };
}
