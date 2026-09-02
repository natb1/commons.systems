// The deferred-disposition queue deriver's CLI: reads the store, derives the
// `deferredQueue` (packages/intentionsutil/src/consolidation.ts) and reports
// it. This CLI's landing is what liquidates shim (1) — the 2026-09-01
// interim office-hours practice recorded on `strategy-graph-native-dispatch`
// ("interim mechanics and initiation protocol" clarification, ruling (1)):
// `grep -rn "decision: deferred" intentions/`. Once this CLI is in place, a
// caller runs it instead of re-running that grep.
//
// Usage (the ESM loader form, never `npx tsx` — the tsx CLI opens an IPC unix
// socket at start-up that a sandboxed caller cannot open, EPERM):
//   node --import tsx/esm packages/intentionsutil/scripts/deferred-queue.ts \
//     --dir <abs intentions path> [--json]
//
// `--dir` is REQUIRED and never inferred from this script's own location —
// a worktree-isolated session refuses `git -C` to any path but its own
// worktree, and every other store-reading CLI in this plan (deferred-queue.ts
// included) takes the store path explicitly for the same reason
// (.claude/rules/sandbox.md, "git -C is auto-approved for worktrees").
//
// Output contract — the SAME three-way exit-code contract merge-node.ts
// documents (packages/intentionsutil/scripts/merge-node.ts:12-33), verbatim:
//
//   exit 0 — this tool RAN and reached a verdict. With --json, one line of
//     JSON on stdout: {"items":[...],"defects":[...],"nodeCount":N}. Without
//     --json, a human-readable report on stdout. Either way, a summary line —
//     "<n> deferred dispositions across <nodeCount> nodes" — is ALSO written
//     to stderr, including when n is 0, so a zero-item run is never a silent
//     vacuous pass (the CHECKED == 0 discipline at
//     .claude/skills/dispatch-propagate/scripts/run-typecheck.sh:287-293).
//     The summary goes to stderr rather than stdout so --json's stdout stays
//     pure, parseable JSON.
//
//   exit 3 — this tool RAN and failed ON ITS INPUTS (a missing --dir, an
//     unreadable store, a node file that fails validation). stderr carries
//     why. No JSON on stdout.
//
//   ANY OTHER exit status — this tool NEVER RAN (module resolution failure,
//     missing interpreter, a sandbox denial). Nothing here produced it.
//
// process.exitCode is used throughout, never process.exit() — same reason as
// merge-node.ts:151-163: exit() discards whatever is still queued on a PIPE
// once the payload exceeds the pipe buffer, truncating a large JSON payload
// on its way to a caller.

import { pathToFileURL } from "node:url";
import { listNodes, readNodeBody } from "../src/store.js";
import { deferredQueue, parseStampGrammar, type DeferredQueue } from "../src/consolidation.js";

/** Extract a required `--flag value` from argv, or throw. */
function requireFlag(args: string[], flag: string): string {
  const idx = args.indexOf(flag);
  if (idx === -1 || args[idx + 1] === undefined) {
    throw new Error(`deferred-queue: ${flag} requires a value argument`);
  }
  return args[idx + 1]!;
}

/**
 * Read the store at `dir` and derive its deferred-disposition queue.
 * Exported for tests that want the result without spawning the CLI.
 */
export function deriveDeferredQueue(dir: string): { queue: DeferredQueue; nodeCount: number } {
  const nodes = listNodes(dir);
  const bodyById = new Map<string, string>();
  for (const node of nodes) {
    bodyById.set(node.id, readNodeBody(dir, node.id));
  }
  // `parseStampGrammar` is the conforming `DispositionSource` implementation
  // per Unit 1's guard clause — see consolidation.ts's module header for when
  // this swaps to a `review.ts` adapter.
  const queue = deferredQueue(nodes, bodyById, { dispositions: parseStampGrammar });
  return { queue, nodeCount: nodes.length };
}

/** Render the human-readable report (the non-`--json` stdout body). */
function renderReport(queue: DeferredQueue, nodeCount: number): string {
  const lines: string[] = [];
  lines.push(`${queue.items.length} deferred dispositions across ${nodeCount} nodes`);
  if (queue.items.length > 0) {
    lines.push("");
    lines.push("items:");
    for (const item of queue.items) {
      lines.push(`  ${item.key}  ${item.nodeId}  delegatee=${item.delegatee ?? "-"}  ${item.date}  ${item.excerpt}`);
    }
  }
  if (queue.defects.length > 0) {
    lines.push("");
    lines.push(`defects (${queue.defects.length}):`);
    for (const defect of queue.defects) {
      lines.push(`  ${defect}`);
    }
  }
  return lines.join("\n") + "\n";
}

function main(): void {
  const args = process.argv.slice(2);
  const dir = requireFlag(args, "--dir");
  const json = args.includes("--json");

  const { queue, nodeCount } = deriveDeferredQueue(dir);

  // The explicit-zero summary, always to stderr, always emitted — a
  // zero-item run is a reached verdict, not a silent vacuous pass.
  process.stderr.write(`${queue.items.length} deferred dispositions across ${nodeCount} nodes\n`);

  if (json) {
    process.stdout.write(JSON.stringify({ items: queue.items, defects: queue.defects, nodeCount }) + "\n");
  } else {
    process.stdout.write(renderReport(queue, nodeCount));
  }
  process.exitCode = 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (err) {
    // A genuine failure of this tool ON ITS INPUTS: reserved exit code 3, an
    // error on stderr, no JSON on stdout. See the output contract at the top
    // of this file for why the code is 3 and not 1 (merge-node.ts:29-33 states
    // the same reasoning: 1 is not claimable, since a loader that cannot
    // resolve `tsx` also exits 1 with zero bytes on stdout).
    process.stderr.write(`deferred-queue: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 3;
  }
}
