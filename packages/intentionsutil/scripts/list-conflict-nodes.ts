// list-conflict-nodes — enumerate the PR numbers of every tactic currently
// carrying a merge-conflict interrupt (tactic-graph-router-conflict-routing
// Unit 4).
//
// The consumer is `.claude/skills/dispatch-propagate/scripts/dispatch-auto-merge`,
// the legacy label-gated issue-lane merge reconciler. That script works purely
// off the GitHub PR list and merges anything GitHub reports `MERGEABLE`. A node
// can flip `CONFLICTING → MERGEABLE` while `execution.conflict` is STILL set —
// the per-node selector pass that self-heals the interrupt has not run yet this
// tick, or observed a stale mergeable read — and merging in that window lands
// conflict-resolution code the completed review never saw. This enumeration is
// what lets that merge sweep exclude those PRs.
//
// The node-lane copy of the same exclusion does NOT go through this script:
// `graph-auto-merge` (the only code that merges a node-lane PR) applies the
// `execution.conflict == null` filter inline in its `listNodesStrict`
// enumeration, so it inherits that reader's fail-closed posture.
//
// Read-only: no graph writes, no git, no gh. It reads through the TOLERANT
// `listNodes` (not `listNodesStrict`) so one unparseable node file does not
// abort the enumeration. A process-level failure IS still fatal to the caller:
// dispatch-auto-merge exits 1 rather than degrading to an empty exclusion set.
//
// Usage:
//   node --import tsx/esm list-conflict-nodes.ts --dir <intentions-dir>
//
//   --dir  (required) the intentions store directory the nodes load from.
//
// Stdout: each conflicting node's `execution.pr` number on its own line (bare
// numbers, nothing else; no output when none are conflicting).
// Exit 0 on success; exit 2 on a usage error or a malformed store.

import { pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";

/**
 * The PR numbers of every node with a merge-conflict interrupt in flight AND a
 * recorded PR. Reads the FIRST-CLASS `execution.conflict` field only — never
 * the `attributes` squatter path some other readers tolerate — so a non-tactic
 * node that happens to carry a conflict-shaped `attributes.execution` is not
 * matched. Exported so the filter is unit-tested without spawning a process.
 */
export function conflictPrNumbers(nodes: IntentionNode[]): number[] {
  const prs: number[] = [];
  for (const node of nodes) {
    const execution = node.execution;
    if (execution == null) continue;
    if (execution.conflict == null) continue;
    if (execution.pr == null) continue;
    prs.push(execution.pr);
  }
  return prs;
}

function parseArgs(argv: string[]): { dir: string } {
  let dir: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      const v = argv[++i];
      if (v === undefined || v === "") {
        throw new Error("list-conflict-nodes: --dir requires a directory argument");
      }
      dir = v;
    } else {
      throw new Error(`list-conflict-nodes: unknown argument '${arg}'`);
    }
  }
  if (dir === null) {
    throw new Error("usage: list-conflict-nodes.ts --dir <intentions-dir>");
  }
  return { dir };
}

function main(argv: string[]): void {
  const { dir } = parseArgs(argv);
  for (const pr of conflictPrNumbers(listNodes(dir))) {
    process.stdout.write(`${pr}\n`);
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
