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
// It also emits a leading serving-strategy block carrying the strategy's
// `reading` and its DERIVED `gap`. `gap` is not stored on the node — it is
// computed fresh on every read via `deriveGap`
// (packages/intentionsutil/src/sensors.ts), the same doctrine `attention`
// already follows — so callers can no longer read `gap` off frontmatter and
// must get it from here (or call `deriveGap` themselves).
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/align-tactics-census.ts <strategy-id> [intentionsDir]
//
// intentionsDir defaults to `intentions` (relative to cwd), matching
// validate-graph.ts. Errors (missing argument, unknown id, non-strategy id)
// propagate as thrown errors — no fallback, no silent default.

import { listNodes, readNodeBody } from "../src/store.js";
import { classifyTactic } from "../src/census.js";
import type { TacticClassification } from "../src/census.js";
import { deriveGap } from "../src/sensors.js";

function headings(body: string): string[] {
  const matches = body.matchAll(/^##\s+(.+)$/gm);
  return [...matches].map((m) => m[1].trim());
}

function main(): void {
  const strategyId = process.argv[2];
  if (!strategyId) {
    throw new Error(
      "Usage: node --import tsx/esm packages/intentionsutil/scripts/align-tactics-census.ts <strategy-id> [intentionsDir]"
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

  const strategyLines: string[] = [];
  strategyLines.push("=== Serving strategy ===");
  strategyLines.push(`id: ${strategy.id}`);
  strategyLines.push(`reading: ${strategy.reading ?? "null"}`);
  strategyLines.push(`gap: ${deriveGap(strategy) ?? "null"}`);
  process.stdout.write(strategyLines.join("\n") + "\n\n");

  const tactics = nodes.filter((n) => n.kind === "tactic" && n.serves.includes(strategyId));

  for (const tactic of tactics) {
    const classification: TacticClassification = classifyTactic(tactic);
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
