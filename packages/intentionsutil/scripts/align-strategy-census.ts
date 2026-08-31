// Deterministic corpus enumeration for /align-strategy's improvement pass.
//
// /align-strategy's improvement pass used to prescribe hand-reading every
// strategy-*.md node in the graph and computing an unserved-virtues listing
// (a pure set difference over `serves` arrays) by hand, plus keyword-grep-based
// overlap/delegation sweeps. This script makes that enumeration deterministic:
// it dumps every strategy node's frontmatter-only summary, the virtues no
// strategy currently serves, and every delegation record's axes — so the
// session's judgment (staleness, overlap, delegation review) operates on a
// complete, accurate listing instead of a partial hand-read.
//
// This script is enumeration only: no staleness or overlap judgment is
// attempted here — that stays with the session.
//
// Usage:
//   node --import tsx/esm packages/intentionsutil/scripts/align-strategy-census.ts [intentionsDir]
//
// intentionsDir defaults to `intentions` (relative to cwd), matching
// validate-graph.ts. Errors propagate as thrown errors — no fallback, no
// silent default.

import { listNodes } from "../src/store.js";
import { isPlainObject } from "../src/schema.js";
import type { IntentionNode } from "../src/schema.js";
import { deriveGap } from "../src/sensors.js";

const RECORDED_DATE_RE = /Recorded\s+(\d{4}-\d{2}-\d{2})/g;

function recordedDates(node: IntentionNode): string[] {
  const dates: string[] = [];
  for (const clarification of node.clarifications) {
    for (const match of clarification.answer.matchAll(RECORDED_DATE_RE)) {
      dates.push(match[1]);
    }
  }
  return dates;
}

function printStrategy(node: IntentionNode): void {
  const lines: string[] = [];
  lines.push(`id: ${node.id}`);
  lines.push(`statement: ${node.statement}`);
  lines.push(`serves: ${node.serves.length > 0 ? node.serves.join(" | ") : "(none)"}`);
  if (node.office_hours !== null) {
    const reasonFirstLine = node.office_hours.reason.split("\n")[0];
    lines.push(`office_hours.reason: ${reasonFirstLine}`);
  }
  const conditions = node.attributes.conditions;
  if (Array.isArray(conditions) && conditions.length > 0) {
    lines.push(`attributes.conditions: ${conditions.join(" | ")}`);
  } else {
    lines.push(`attributes.conditions: (none)`);
  }
  lines.push(`reading: ${node.reading ?? "null"}`);
  lines.push(`gap: ${deriveGap(node) ?? "null"}`);
  const dates = recordedDates(node);
  lines.push(
    `clarification dates: ${dates.length} recorded${dates.length > 0 ? ` (${dates.join(", ")})` : ""}`
  );
  process.stdout.write(lines.join("\n") + "\n\n");
}

function printUnservedVirtues(nodes: IntentionNode[]): void {
  const virtueIds = new Set(nodes.filter((n) => n.kind === "virtue").map((n) => n.id));
  const served = new Set<string>();
  for (const node of nodes) {
    if (node.kind !== "strategy") continue;
    for (const target of node.serves) {
      served.add(target);
    }
  }
  const unserved = [...virtueIds].filter((id) => !served.has(id)).sort();
  process.stdout.write("=== Unserved virtues ===\n");
  process.stdout.write(unserved.length > 0 ? unserved.join("\n") + "\n\n" : "(none)\n\n");
}

function printDelegations(nodes: IntentionNode[]): void {
  process.stdout.write("=== Delegations ===\n");
  const delegations = nodes.filter((n) => n.kind === "delegation");
  for (const node of delegations) {
    const lines: string[] = [];
    lines.push(`id: ${node.id}`);
    lines.push(`statement: ${node.statement}`);
    lines.push(`attributes.delegated: ${String(node.attributes.delegated ?? "(none)")}`);
    const divergence = node.attributes.divergence;
    const level = isPlainObject(divergence) ? String(divergence.level ?? "(none)") : "(none)";
    lines.push(`attributes.divergence.level: ${level}`);
    const irreversibility = node.attributes.irreversibility;
    const gated = isPlainObject(irreversibility) ? String(irreversibility.gated ?? "(none)") : "(none)";
    const recoveryCost = isPlainObject(irreversibility)
      ? String(irreversibility.recovery_cost ?? "(none)")
      : "(none)";
    lines.push(`attributes.irreversibility.gated: ${gated}`);
    lines.push(`attributes.irreversibility.recovery_cost: ${recoveryCost}`);
    process.stdout.write(lines.join("\n") + "\n\n");
  }
}

function main(): void {
  const intentionsDir = process.argv[2] ?? "intentions";
  const nodes = listNodes(intentionsDir);

  process.stdout.write("=== Strategies ===\n");
  for (const node of nodes) {
    if (node.kind !== "strategy") continue;
    printStrategy(node);
  }

  printUnservedVirtues(nodes);
  printDelegations(nodes);
}

main();
