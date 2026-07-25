// Deterministic idempotency census for /align-tactics' step 0.
//
// /align-tactics re-evaluates a strategy's tactic subtree on every run. That
// re-evaluation used to be a hand-run grep/classify dance over `serves` block
// sequences, which has previously false-matched a spec-carrier body and missed
// an indirectly-affected tactic. This script replaces the manual dance with a
// deterministic dump of every tactic serving the target strategy — its
// classification, phase, parked reason (first line only), statement, and the
// body's "## " headings — so the session's semantic judgment (which stays a
// human/agent call, not something this script attempts) operates on each
// child's actual recorded units instead of a keyword match.
//
// Usage:
//   npx tsx packages/intentionsutil/scripts/align-tactics-census.ts <strategy-id> [intentionsDir]
//
// intentionsDir defaults to `intentions` (relative to cwd), matching
// validate-graph.ts. Errors (missing argument, unknown id, non-strategy id)
// propagate as thrown errors — no fallback, no silent default.

import { listNodes, readNodeBody } from "../src/store.js";
import type { IntentionNode } from "../src/schema.js";

type Classification = "draft" | "born-parked" | "open" | "done";

function classify(node: IntentionNode): Classification {
  if (node.phase === "done") return "done";
  if (node.phase !== null) return "open";
  // phase is null/absent here
  return node.office_hours === null ? "draft" : "born-parked";
}

function headings(body: string): string[] {
  const matches = body.matchAll(/^##\s+(.+)$/gm);
  return [...matches].map((m) => m[1].trim());
}

function main(): void {
  const strategyId = process.argv[2];
  if (!strategyId) {
    throw new Error(
      "Usage: npx tsx packages/intentionsutil/scripts/align-tactics-census.ts <strategy-id> [intentionsDir]"
    );
  }
  const intentionsDir = process.argv[3] ?? "intentions";

  const nodes = listNodes(intentionsDir);
  const strategy = nodes.find((n) => n.id === strategyId);
  if (!strategy) {
    throw new Error(`Unknown node id: "${strategyId}"`);
  }
  if (strategy.kind !== "strategy") {
    throw new Error(`Node "${strategyId}" is kind:${strategy.kind}, not kind:strategy`);
  }

  const tactics = nodes.filter((n) => n.kind === "tactic" && n.serves.includes(strategyId));

  for (const tactic of tactics) {
    const classification = classify(tactic);
    const body = readNodeBody(intentionsDir, tactic.id);
    const lines: string[] = [];
    lines.push(`id: ${tactic.id}`);
    lines.push(`classification: ${classification}`);
    lines.push(`phase: ${tactic.phase ?? "null"}`);
    if (classification === "born-parked" && tactic.office_hours) {
      const reasonFirstLine = tactic.office_hours.reason.split("\n")[0];
      lines.push(`office_hours.reason: ${reasonFirstLine}`);
    }
    lines.push(`statement: ${tactic.statement}`);
    const heads = headings(body);
    lines.push(`headings: ${heads.length > 0 ? heads.join(" | ") : "(none)"}`);
    process.stdout.write(lines.join("\n") + "\n\n");
  }
}

main();
