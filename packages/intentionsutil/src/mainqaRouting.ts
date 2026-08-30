// mainqaRouting — the lane vocabulary, deterministic node-id derivation, and
// mint decision for a source tactic's main-qa verification items. Modeled
// structurally on holds.ts (vocabulary + id derivation) and the decide half of
// scripts/hold-node-decide.ts (pure over an in-memory input, no fs/git/gh).
//
// Doctrine (binding author ruling R1): a WAIT verifiability mark is a hold on
// the MACHINE-verifiable node, never a third lane. `laneFor` encodes this —
// MACHINE and WAIT both route to "machine". The MACHINE default applied to an
// item with no verifiability mark at all is the CALLER's job, not this
// module's: this module only maps an already-decided mark to a lane.
//
// This module is pure: no fs, no git, no gh, no network, no import from
// store.ts. Every id-derivation and disk-existence question a caller needs is
// passed in as plain data.

import type { Execution, IntentionNodeInput, OfficeHours } from "./schema.js";

// --- Lane vocabulary ---------------------------------------------------------

export type MainqaLane = "machine" | "author";

export const MAINQA_LANES: readonly MainqaLane[] = ["machine", "author"];

export type VerifiabilityMark = "MACHINE" | "AUTHOR" | "WAIT";

/**
 * A single post-merge verification item as recorded by `/qa-fix` at qa record
 * time. `check` is the optional machine-runnable check description; absent or
 * null omits the `Check:` line from the rendered body.
 */
export interface MainqaItem {
  id: string;
  title: string;
  url_path: string;
  expected_outcome: string;
  finding: string;
  verifiability: VerifiabilityMark;
  check?: string | null;
}

/**
 * Which lane a verifiability mark routes to. `AUTHOR` -> "author"; `MACHINE`
 * and `WAIT` both -> "machine" (R1: WAIT is a hold on the machine-verifiable
 * node, not a third lane).
 */
export function laneFor(mark: VerifiabilityMark): MainqaLane {
  return mark === "AUTHOR" ? "author" : "machine";
}

/**
 * Group items by lane, preserving each lane's items in their original
 * relative input order.
 */
export function groupByLane(items: readonly MainqaItem[]): Record<MainqaLane, MainqaItem[]> {
  const grouped: Record<MainqaLane, MainqaItem[]> = { machine: [], author: [] };
  for (const item of items) {
    grouped[laneFor(item.verifiability)].push(item);
  }
  return grouped;
}

// --- Node id -----------------------------------------------------------------

/**
 * Derive the deterministic main-qa node id for `sourceId` on `lane`: strips
 * ONE leading `tactic-` from `sourceId` (a source id without that prefix, e.g.
 * a strategy id, is used verbatim) and returns
 * `tactic-mainqa-<slug>-<lane>`.
 *
 * Throws on an empty slug (nothing left after stripping the prefix — e.g.
 * `sourceId === "tactic-"` or `""`), and throws if the derived id contains a
 * path separator — mirroring the intent of `assertPathSafeId`
 * (src/store.ts:39) without importing it, so this module stays fs-free.
 */
export function mainqaNodeId(sourceId: string, lane: MainqaLane): string {
  const slug = sourceId.replace(/^tactic-/, "");
  if (slug === "") {
    throw new Error(`mainqaNodeId: source id "${sourceId}" yields an empty slug`);
  }
  const id = `tactic-mainqa-${slug}-${lane}`;
  if (id.includes("/") || id.includes("\\")) {
    throw new Error(
      `mainqaNodeId: derived id "${id}" contains a path separator (from source "${sourceId}")`,
    );
  }
  return id;
}

// --- Body rendering ------------------------------------------------------------

/**
 * A destination node is born at qa record time carrying the source's still-open
 * PR, so the PR number is always known at mint time. Refuse rather than render
 * `PR #null` into a node statement and body — the payload arrives in JSON form,
 * so this is a real runtime possibility, not just a type-level one.
 */
function assertSourcePr(pr: number): void {
  if (!Number.isInteger(pr) || pr <= 0) {
    throw new Error(
      `mainqaRouting: a destination node requires the source PR number, got ${JSON.stringify(pr)}`,
    );
  }
}

/** Statement per lane, exactly per the target design. */
function mainqaStatement(sourceId: string, lane: MainqaLane, pr: number): string {
  const suffix = lane === "machine" ? "machine-verifiable items" : "author-required items";
  return `Post-merge verification of ${sourceId} (PR #${pr}) — ${suffix}`;
}

export interface MainqaBodyArgs {
  sourceId: string;
  lane: MainqaLane;
  pr: number;
  items: readonly MainqaItem[];
}

/**
 * The canonical main-qa node body. The heading is deliberately
 * `## Verification items`, NOT a `## needs-main…` heading: `hasNeedsMainResidue`
 * (src/transitions.ts:402) matches only an H2 whose text begins `needs-main`,
 * and a main-qa destination node must never be mistaken for a residue-carrying
 * source by the reconciler.
 */
export function buildMainqaBody(args: MainqaBodyArgs): string {
  assertSourcePr(args.pr);
  const statement = mainqaStatement(args.sourceId, args.lane, args.pr);
  const lines: string[] = [
    `# ${statement}`,
    ``,
    `## Context`,
    ``,
    `Post-merge verification recorded by \`/qa-fix\` at qa record time for`,
    `\`${args.sourceId}\` (PR #${args.pr}). Verified against the deployed \`main\` for that PR,`,
    `not against a preview.`,
    ``,
    `## Verification items`,
    ``,
  ];
  for (const item of args.items) {
    lines.push(`- **${item.id} — ${item.title}**`);
    lines.push(`  - Path: \`${item.url_path}\``);
    lines.push(`  - Expected outcome: ${item.expected_outcome}`);
    lines.push(`  - Finding: ${item.finding}`);
    lines.push(`  - Verifiability: ${item.verifiability}`);
    if (item.check !== undefined && item.check !== null) {
      lines.push(`  - Check: ${item.check}`);
    }
  }
  return lines.join("\n") + "\n";
}

// --- Node (frontmatter) construction -----------------------------------------

export interface MainqaNodeArgs {
  sourceId: string;
  lane: MainqaLane;
  pr: number;
  branch: string;
  serves: readonly string[];
  /** Stamped as `office_hours.since` on the author lane; ignored on machine. */
  since: string;
  /** Required (non-empty after trim) on the author lane; ignored on machine. */
  reason?: string;
  /** Required (non-empty after trim) on the author lane; ignored on machine. */
  recommendation?: string;
}

function buildAuthorOfficeHours(args: MainqaNodeArgs): OfficeHours {
  const reason = args.reason ?? "";
  const recommendation = args.recommendation ?? "";
  if (reason.trim() === "") {
    throw new Error(
      `buildMainqaNode: author lane for "${args.sourceId}" requires a non-empty reason`,
    );
  }
  if (recommendation.trim() === "") {
    throw new Error(
      `buildMainqaNode: author lane for "${args.sourceId}" requires a non-empty recommendation`,
    );
  }
  return { reason, since: args.since, recommendation, session_type: "other" };
}

/**
 * Build the born frontmatter for a main-qa lane node. Frontmatter only — the
 * body is `buildMainqaBody`'s job. Exactly the target-design table: `phase:
 * main-qa` on both lanes, `owner`/`status` split machine (ai/codified) vs
 * author (human/delegated), `office_hours: null` on machine vs a populated
 * record on author, `serves` copied verbatim from the source, `blocked_by:
 * [sourceId]`, and an `execution` record carrying the source's branch/PR.
 */
export function buildMainqaNode(args: MainqaNodeArgs): IntentionNodeInput {
  assertSourcePr(args.pr);
  const id = mainqaNodeId(args.sourceId, args.lane);
  const statement = mainqaStatement(args.sourceId, args.lane, args.pr);
  const execution: Execution = {
    branch: args.branch,
    pr: args.pr,
    attempts: {},
    markers: [],
    strategy_fingerprint: null,
  };
  const isAuthor = args.lane === "author";
  return {
    id,
    kind: "tactic",
    statement,
    owner: isAuthor ? "human" : "ai",
    status: isAuthor ? "delegated" : "codified",
    phase: "main-qa",
    serves: [...args.serves],
    parent: null,
    blocked_by: [args.sourceId],
    execution,
    office_hours: isAuthor ? buildAuthorOfficeHours(args) : null,
  };
}

// --- Mint decision -------------------------------------------------------------

/**
 * Compose the author lane's `office_hours.reason` from its items — a
 * born-parked node must carry at birth everything a fresh sitting needs, so
 * the reason names every item requiring human attention, not just a count.
 */
function composeAuthorReason(items: readonly MainqaItem[]): string {
  const lines = items.map((item) => `- ${item.id} — ${item.title}: ${item.finding}`);
  return [
    `${items.length} author-required verification item(s) recorded by \`/qa-fix\` at qa ` +
      `record time need a human check against the deployed \`main\`:`,
    ...lines,
  ].join("\n");
}

/**
 * Compose the author lane's `office_hours.recommendation` from its items.
 *
 * It LEADS with the merge precondition, and that is load-bearing. This node is
 * born at qa record time — BEFORE `sourceId`'s PR merges — and it is born
 * PARKED, so it enters the office-hours queue immediately. The queue applies no
 * `blocked_by` gate and must not: `openBlockers` (src/officeHours.ts) is
 * "Advisory only — never a gate", and .claude/skills/office-hours/SKILL.md
 * makes the same rule doctrine for every disposition ("a signal, not a gate —
 * the human judges readiness"). The selector's stderr `NOTE —` advisory
 * (scripts/office-hours-select.ts) names the open blocker but not what it
 * MEANS for this node. So the only thing standing between a human sitting and a
 * verification run against code that has not landed is this text — and a
 * born-parked node must carry at birth everything a fresh sitting needs (see
 * composeAuthorReason above).
 */
function composeAuthorRecommendation(
  items: readonly MainqaItem[],
  id: string,
  sourceId: string,
  pr: number,
): string {
  const lines = items.map(
    (item) => `- ${item.id}: verify \`${item.url_path}\` — expected ${item.expected_outcome}`,
  );
  return [
    `PRECONDITION — do NOT verify until PR #${pr} has MERGED and deployed to ` +
      `\`main\`. This node was recorded at qa record time, before its source ` +
      `landed; it is \`blocked_by: [${sourceId}]\`, and the office-hours queue ` +
      `surfaces that blocker as an advisory only, never as a gate. If ` +
      `\`${sourceId}\` is not yet \`phase: done\`, leave this node parked and ` +
      `pick up another item.`,
    ``,
    `Once PR #${pr} is merged and deployed, verify each item below against the ` +
      `deployed main, then resolve this node (\`${id}\`) to \`phase: done\`:`,
    ...lines,
  ].join("\n");
}

export interface DecideMintArgs {
  sourceId: string;
  items: readonly MainqaItem[];
  branch: string;
  pr: number;
  serves: readonly string[];
  since: string;
  /**
   * Ids of `intentions/<id>.md` files the caller has already confirmed exist
   * at `origin/main`. This module does no fs — the caller determines
   * existence and reports it here.
   */
  existingIds: readonly string[];
}

export interface MainqaMintDecision {
  lane: MainqaLane;
  disposition: "CREATE" | "EXISTING";
  id: string;
  node: IntentionNodeInput;
  body: string;
}

/**
 * Decide the mint for every NON-EMPTY lane of `args.items`. A source whose
 * items are all machine-verifiable (or all WAIT, which routes to machine per
 * `laneFor`) yields exactly one entry; an all-author source yields exactly
 * one entry; a mixed source yields exactly two — never three, since WAIT is
 * not a lane.
 */
export function decideMint(args: DecideMintArgs): MainqaMintDecision[] {
  // Validate the PR at the boundary, not only inside buildMainqaNode: the
  // author-lane recommendation is composed BEFORE that call and interpolates
  // the number, so a bad `pr` would otherwise be rendered into human-facing
  // text on its way to the throw. A defensive check at a public API boundary
  // (.claude/rules/code-style.md).
  assertSourcePr(args.pr);
  const grouped = groupByLane(args.items);
  const decisions: MainqaMintDecision[] = [];
  for (const lane of MAINQA_LANES) {
    const items = grouped[lane];
    if (items.length === 0) continue;

    const id = mainqaNodeId(args.sourceId, lane);
    const disposition: "CREATE" | "EXISTING" = args.existingIds.includes(id)
      ? "EXISTING"
      : "CREATE";

    const nodeArgs: MainqaNodeArgs = {
      sourceId: args.sourceId,
      lane,
      pr: args.pr,
      branch: args.branch,
      serves: args.serves,
      since: args.since,
    };
    if (lane === "author") {
      nodeArgs.reason = composeAuthorReason(items);
      nodeArgs.recommendation = composeAuthorRecommendation(items, id, args.sourceId, args.pr);
    }

    decisions.push({
      lane,
      disposition,
      id,
      node: buildMainqaNode(nodeArgs),
      body: buildMainqaBody({ sourceId: args.sourceId, lane, pr: args.pr, items }),
    });
  }
  return decisions;
}
