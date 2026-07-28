// graph-census-debt — compute the graph's owed reconciliation debt and decide
// whether to birth a recurring census tactic (tactic-graph-census-recurrence
// Unit 2). This is the network-free, testable DECISION half of the standing
// per-tick reconciliation duty; the bash caller (dispatch-graph-census) owns
// the LANDING half (write-node.ts + graph-commit), mirroring the decision/land
// split between reconcile-graph.ts and reconcile-graph-merged.
//
// Debt has three components:
//   - owed prunes    — done-but-present nodes (phase === "done", still in the
//                      store, not yet pruned by the reconciler). This is the
//                      dominant, network-free signal the tick +3 (2026-07-10)
//                      observation flagged as re-accumulating.
//   - unverified PR-merges — nodes carrying execution.pr whose PR is merged but
//                      the node is not yet absorbed to done. Computed only when
//                      the caller supplies --pr-states (a JSON map id -> state);
//                      the tick's standing duty runs graph-only (near-free, no
//                      network — the clarification's stated rationale) and omits
//                      it, so this component is 0 unless states are provided.
//   - orphans        — nodes whose non-null parent, or any serves target, no
//                      longer resolves to a node in the store. validateGraph
//                      normally prevents dangling refs, so this is a safety net
//                      that is 0 in a healthy graph.
//
// Total debt is the size of the UNION of the three id sets. When
// --threshold <N> is given, the tool also decides whether to birth a census:
// shouldBirth is true iff total >= N AND no open census node already exists
// (the born-parked census node is the recurrence latch) AND the proposed census
// id is not already present on disk (never clobber an existing node).
//
// A census node is identified by attributes.census === true. An "open" census
// is one whose phase !== "done" (a born-parked node has phase null, so it
// latches until it is worked, resolved to done, and pruned).
//
// Usage:
//   node --import tsx/esm graph-census-debt.ts [--intentions <dir>]
//     [--pr-states <file>] [--threshold <N>] [--now <YYYY-MM-DD>]
//
// Stdout: one JSON object:
//   { total, donePresent, orphans, mergedUnabsorbed, openCensus, shouldBirth,
//     node?, node_body? }
// `node` and `node_body` are present only when shouldBirth is true.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listNodes } from "../src/store.js";
import type { IntentionNode, IntentionNodeInput } from "../src/schema.js";

const CENSUS_SERVES = "strategy-graph-native-dispatch";
const OPEN_PHASES = new Set(["implement", "fix", "qa", "review", "main-qa"]);

interface Args {
  intentionsDir: string;
  prStatesFile: string | null;
  threshold: number | null;
  now: string;
}

function parseArgs(argv: string[]): Args {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = dirname(dirname(dirname(scriptDir)));
  let intentionsDir = join(repoRoot, "intentions");
  let prStatesFile: string | null = null;
  let threshold: number | null = null;
  let now: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--intentions") intentionsDir = argv[++i];
    else if (a === "--pr-states") prStatesFile = argv[++i];
    else if (a === "--threshold") threshold = Number(argv[++i]);
    else if (a === "--now") now = argv[++i];
    else {
      process.stderr.write(`graph-census-debt: unknown argument "${a}"\n`);
      process.exit(2);
    }
  }

  if (threshold !== null && (!Number.isInteger(threshold) || threshold < 0)) {
    process.stderr.write(`graph-census-debt: --threshold must be a non-negative integer\n`);
    process.exit(2);
  }
  if (now === null) now = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(now)) {
    process.stderr.write(`graph-census-debt: --now must be YYYY-MM-DD, got "${now}"\n`);
    process.exit(2);
  }
  return { intentionsDir, prStatesFile, threshold, now };
}

/** Read the id -> state map, keeping only "merged" entries. */
function readMergedIds(file: string | null): Set<string> {
  if (file === null) return new Set();
  const raw = readFileSync(file, "utf8").trim();
  if (raw === "") return new Set();
  const parsed: Record<string, unknown> = JSON.parse(raw);
  const merged = new Set<string>();
  for (const [id, state] of Object.entries(parsed)) {
    if (state === "merged") merged.add(id);
  }
  return merged;
}

function isCensusNode(n: IntentionNode): boolean {
  return n.kind === "tactic" && n.attributes?.census === true;
}

export interface CensusDebt {
  total: number;
  donePresent: string[];
  orphans: string[];
  mergedUnabsorbed: string[];
  openCensus: string[];
}

/** Compute the three debt components and the open-census latch set. */
export function computeDebt(nodes: IntentionNode[], mergedIds: Set<string>): CensusDebt {
  const ids = new Set(nodes.map((n) => n.id));

  const donePresent: string[] = [];
  const orphans: string[] = [];
  const mergedUnabsorbed: string[] = [];
  const openCensus: string[] = [];

  for (const n of nodes) {
    if (n.phase === "done") donePresent.push(n.id);

    const danglingParent = n.parent !== null && !ids.has(n.parent);
    const danglingServes = n.serves.some((s) => !ids.has(s));
    if (danglingParent || danglingServes) orphans.push(n.id);

    const pr = n.execution?.pr ?? null;
    if (
      pr !== null &&
      n.phase !== null &&
      OPEN_PHASES.has(n.phase) &&
      mergedIds.has(n.id)
    ) {
      mergedUnabsorbed.push(n.id);
    }

    if (isCensusNode(n) && n.phase !== "done") openCensus.push(n.id);
  }

  const union = new Set<string>([...donePresent, ...orphans, ...mergedUnabsorbed]);
  return {
    total: union.size,
    donePresent,
    orphans,
    mergedUnabsorbed,
    openCensus,
  };
}

/**
 * `attributes` payload of a born-parked census node. `IntentionNode.attributes`
 * is deliberately `Record<string, unknown>` — kind-specific fields are defined
 * by the `kind-<kind>` node, not the schema — so the census kind names its own
 * shape here. That keeps the batch lists typed for every reader instead of
 * making each one cast `unknown` back to an array.
 */
export interface CensusAttributes {
  census: true;
  batch: {
    donePresent: string[];
    mergedUnabsorbed: string[];
    orphans: string[];
  };
}

/** A born-parked census node: the write-input shape with census attributes. */
export type CensusNode = IntentionNodeInput & { attributes: CensusAttributes };

/** Build the born-parked census node object + its markdown body. */
function buildCensusNode(id: string, now: string, debt: CensusDebt) {
  const batchLine = `${debt.donePresent.length} owed prune(s), ${debt.mergedUnabsorbed.length} unverified PR-merge(s), ${debt.orphans.length} orphan(s)`;
  const reason =
    `Reconciliation debt reached ${debt.total} (${batchLine}); a census is owed to drain it. ` +
    `Next steps: run the census over the batch listed in this node's body — for each done-but-present node, FIRST verify its execution.completion evidence (a real merge = mergedAt AND mergeCommitSha both non-null; or an out-of-band landing = graphCommitSha non-null); prune ONLY the verified ones with graph-commit --prune (repairing inbound blocked_by edges in the same commit, per tactic-graph-self-consistency-sweep) and LEAVE every evidence-less node in place as an integrity defect to investigate; absorb any unverified PR-merge, and repair any orphan's dangling parent/serves; then resolve this node (phase -> done) so the recurrence latch clears.`;

  // Typed rather than left to literal inference: the born-parked contract is
  // defined by which optional fields are OMITTED — `phase` above all — and an
  // inferred literal type has no `phase` key at all, so a reader asserting
  // `node.phase === undefined` cannot even name the field. The annotation makes
  // the omission part of the type and pins owner/status to their schema unions.
  const node: CensusNode = {
    id,
    kind: "tactic",
    statement:
      `census: drain accumulated reconciliation debt (${batchLine}) — prune the completion-VERIFIED done-but-present nodes with edge repair, leave evidence-less ones as integrity defects, absorb unverified PR-merges, and repair orphans`,
    owner: "ai",
    status: "codified",
    parent: null,
    serves: [CENSUS_SERVES],
    // `session_type: "other"` is stated rather than left to
    // `validateOfficeHours`'s absent-field substitution: this is a
    // machine-authored park with no natural sitting type, which is exactly what
    // "other" documents, and spelling it out keeps the written node identical to
    // the validated one.
    office_hours: { reason, since: now, recommendation: null, session_type: "other" },
    attributes: {
      census: true,
      batch: {
        donePresent: debt.donePresent,
        mergedUnabsorbed: debt.mergedUnabsorbed,
        orphans: debt.orphans,
      },
    },
  };

  const fmt = (label: string, ids: string[]) =>
    ids.length === 0
      ? `- ${label}: none\n`
      : `- ${label} (${ids.length}):\n` + ids.map((i) => `  - ${i}`).join("\n") + "\n";

  const body =
    `# census: drain reconciliation debt (${now})\n\n` +
    `## Context\n\n` +
    `The standing per-tick reconciliation duty (dispatch-graph-census) found ` +
    `accumulated reconciliation debt of ${debt.total}, at or above the birth ` +
    `threshold. This born-parked census carries the batch to drain. It is the ` +
    `recurrence latch: no second census is born while this one stays open ` +
    `(phase !== done). Drain the batch, then resolve this node to clear the latch.\n\n` +
    `## Batch\n\n` +
    fmt("Owed prunes (done-but-present)", debt.donePresent) +
    fmt("Unverified PR-merges", debt.mergedUnabsorbed) +
    fmt("Orphans (dangling parent/serves)", debt.orphans) +
    `\n## How to drain\n\n` +
    `Re-derive the batch at execution (the snapshot above may have aged).\n\n` +
    `**Never prune a done-but-present node unverified.** Since ` +
    `tactic-execution-pr-merge-verification, the reconciler stops deleting at the ` +
    `done-transition and instead records \`execution.completion\` evidence, so ` +
    `"done-but-present" no longer implies "safe to delete". For each such node, ` +
    `check \`execution.completion\`: it verifies when \`mergedAt\` AND ` +
    `\`mergeCommitSha\` are both non-null (a real PR merge), or when ` +
    `\`graphCommitSha\` is non-null (content landed out-of-band). Prune ONLY the ` +
    `verified ones via \`graph-commit --prune <id>\`, removing any inbound ` +
    `\`blocked_by\` entry that names them in the same commit. Leave every ` +
    `evidence-less node ON DISK and investigate it — either recover the landing ` +
    `sha and backfill \`execution.completion.graphCommitSha\` (via ` +
    `\`packages/intentionsutil/scripts/write-node.ts\`), or record that the work ` +
    `was genuinely abandoned. Then absorb any unverified PR-merge ` +
    `(reconcile-graph-merged); repair any orphan's dangling \`parent\`/\`serves\`. ` +
    `Finally set this node's \`phase\` to \`done\` and prune it so the recurrence ` +
    `latch clears.\n`;

  return { node, body };
}

export interface CensusDecision extends CensusDebt {
  shouldBirth: boolean;
  node?: CensusNode;
  node_body?: string;
}

/**
 * Compute debt and, when `threshold` is non-null, decide whether to birth a
 * census tactic. shouldBirth is true iff total debt >= threshold AND no census
 * node is already open (the born-parked latch) AND the dated census id is not
 * already present (never clobber an existing node). When it births, the
 * proposed born-parked `node` and its markdown `node_body` are included.
 */
export function decideCensus(
  nodes: IntentionNode[],
  mergedIds: Set<string>,
  threshold: number | null,
  now: string,
): CensusDecision {
  const debt = computeDebt(nodes, mergedIds);
  const decision: CensusDecision = { ...debt, shouldBirth: false };

  if (threshold !== null) {
    const censusId = `tactic-graph-census-${now}`;
    const idExists = nodes.some((n) => n.id === censusId);
    decision.shouldBirth =
      debt.total >= threshold && debt.openCensus.length === 0 && !idExists;
    if (decision.shouldBirth) {
      const { node, body } = buildCensusNode(censusId, now, debt);
      decision.node = node;
      decision.node_body = body;
    }
  }
  return decision;
}

function main(): void {
  const { intentionsDir, prStatesFile, threshold, now } = parseArgs(process.argv.slice(2));
  const nodes = listNodes(intentionsDir);
  const mergedIds = readMergedIds(prStatesFile);
  const decision = decideCensus(nodes, mergedIds, threshold, now);
  process.stdout.write(JSON.stringify(decision) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
