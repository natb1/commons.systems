// Per-workflow token attribution — folding `aggregate-usage.sh`'s per-skill
// spend buckets into the dispatch / office-hours / rsi split that
// `strategy-recursive-self-improvement` measures the harness by.
//
// This module is fs-free, git-free and process-free by design, exactly like
// `census.ts`: a caller reads the usage aggregate off disk, hands the parsed
// document to `spendBucketsFrom`, and folds the result with `attributeSpend`.
// That split is what makes the attribution testable on in-memory fixtures.
//
// Its two consumers are the rsi sensor in `scripts/read-sensors.ts` and the
// `/rsi-audit` token-economy instrument, so the two cannot drift on what counts
// as a readable aggregate or on which skill belongs to which workflow.
//
// (Formerly `src/rsi.ts`, which also carried the `rsi-plan.md` render. That
// render and its dashboard were retired 2026-08-12 along with the attended
// judgment loop — harness self-improvement is measurement, not a second
// orchestrator — leaving this file the token-attribution module it is named for.)

/** One workflow's share of the audited window's token spend. */
export interface WorkflowSpend {
  workflow: string;
  priceProxyUsd: number;
  costUsd: number;
  turns: number;
  /** Fraction of the window's total `priceProxyUsd`, in [0, 1]. */
  share: number;
}

/** A per-skill spend bucket, as `aggregate-usage.sh` emits it under `by_phase`. */
export interface SpendBucket {
  price_proxy_usd?: number;
  cost_usd?: number;
  turns?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// --- Token attribution ------------------------------------------------------

/**
 * Which workflow each attributable skill belongs to. Keyed by the
 * `attributionSkill` values `aggregate-usage.sh` emits under `by_phase`.
 *
 * This map is the ONE place the dispatch/office-hours/rsi split is defined, and
 * it must be extended when a new skill joins one of the three workflows —
 * mirroring the same single-source discipline `aggregate-usage.sh`'s
 * `worker_skills` list carries. A skill absent from every list lands in
 * `other`, which is rendered rather than dropped: an unattributed bucket that
 * silently vanished would make every share above it look larger than it is.
 */
export const WORKFLOW_SKILLS: ReadonlyMap<string, readonly string[]> = new Map([
  [
    "dispatch",
    [
      // The seven phase buckets `aggregate-usage.sh` always seeds…
      "plan-implement",
      "review-fix",
      "security-review-fix",
      "qa-fix",
      "code-review-fix",
      "fix-checks",
      "dispatch-worker",
      // …plus every other skill that has appeared as an `attributionSkill` on a
      // dispatch-lane turn.
      "plan-issue",
      "implement",
      "implement-unit",
      "code-review",
      "qa-main",
      "fix-conflicts",
      "dispatch-conflict",
      "dispatch-invalid-state",
      "dispatch-diagnose-main",
      "dispatch-propagate",
      "resolve-epic",
      "align-tactics",
      "commit-merge-push",
      // The per-phase ladder evaluator. It buckets under DISPATCH, not rsi,
      // even though its name is `rsi`: the ladder spawns it, it fires once per
      // phase, and its spend therefore scales with dispatch volume — it is the
      // cost of dispatch measuring itself, not the cost of the harness
      // improving itself. Bucketed under rsi it would make rsi spend scale
      // with dispatch by construction, so the recorded spend-deviation review
      // trigger ("rsi spend approaching dispatch") would fire permanently and
      // mean nothing.
      "rsi",
      // The ladder driver that spawns that evaluator. Same argument, one level
      // up: leaving the driver in `other` while its evaluator sits in
      // `dispatch` splits one workflow across two buckets for no reason.
      //
      // Deliberately NOT mapped here: `dispatch-emulate` (a retired name with
      // no carrier anywhere in the tree — a skill that cannot recur is dead
      // configuration), and the author-tooling skills `dataviz`,
      // `artifact-design`, `artifact-capabilities` and `update-config`, which
      // belong to none of the three workflows and are meant to land in
      // `other`.
      "dispatch-ladder",
    ] as const,
  ],
  [
    "office-hours",
    [
      "office-hours",
      "align",
      "align-strategy",
      "align-init",
      "reading-review",
      "new-requirement",
      "file-issue",
    ] as const,
  ],
  // The rsi bucket is the harness-measurement workflow proper: the token audit
  // an author runs over the fleet. `rsi` itself is NOT here — see the note in
  // the dispatch list above.
  ["rsi", ["rsi-audit"] as const],
]);

/** The workflow a skill bucket belongs to, or `"other"` when unmapped. */
export function workflowOfSkill(skill: string): string {
  for (const [workflow, skills] of WORKFLOW_SKILLS) {
    if (skills.includes(skill)) return workflow;
  }
  return "other";
}

/**
 * Fold `aggregate-usage.sh`'s per-skill `by_phase` buckets into the three
 * workflows plus `other`, in a fixed render order. Buckets are summed on
 * `price_proxy_usd` (the uniform-rate figure the audit ranks on, so shares
 * compare token volume rather than model choice) with `cost_usd` reported
 * alongside as the truthful bill.
 */
export function attributeSpend(byPhase: Record<string, SpendBucket>): WorkflowSpend[] {
  // Insertion order IS render order, so iterating the map at the end needs no
  // second ordered list to look values back up through.
  const totals = new Map<string, { proxy: number; cost: number; turns: number }>([
    ["dispatch", { proxy: 0, cost: 0, turns: 0 }],
    ["office-hours", { proxy: 0, cost: 0, turns: 0 }],
    ["rsi", { proxy: 0, cost: 0, turns: 0 }],
    ["other", { proxy: 0, cost: 0, turns: 0 }],
  ]);
  for (const [skill, bucket] of Object.entries(byPhase)) {
    const acc = totals.get(workflowOfSkill(skill));
    if (acc === undefined) continue;
    acc.proxy += bucket.price_proxy_usd ?? 0;
    acc.cost += bucket.cost_usd ?? 0;
    acc.turns += bucket.turns ?? 0;
  }
  const grandProxy = [...totals.values()].reduce((sum, t) => sum + t.proxy, 0);
  return [...totals.entries()].map(([workflow, t]) => ({
    workflow,
    priceProxyUsd: t.proxy,
    costUsd: t.cost,
    turns: t.turns,
    share: grandProxy === 0 ? 0 : t.proxy / grandProxy,
  }));
}

/**
 * The per-skill spend buckets inside an `aggregate-usage.sh --json-out`
 * document, or `null` when the document is not one.
 *
 * Validates rather than asserts: the document comes off disk and may be
 * truncated, from an older schema, or another file entirely, so every bucket
 * field is re-derived numerically instead of being cast into shape. A bucket
 * that is not an object is skipped rather than defaulted to zeros — the
 * difference between "this skill spent nothing" and "this row was unreadable"
 * is exactly what the dispatch-dominance check turns on.
 */
export function spendBucketsFrom(doc: unknown): Record<string, SpendBucket> | null {
  if (!isPlainObject(doc)) return null;
  const byPhase = doc.by_phase;
  if (!isPlainObject(byPhase)) return null;
  const finite = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;
  const out: Record<string, SpendBucket> = {};
  for (const [skill, bucket] of Object.entries(byPhase)) {
    if (!isPlainObject(bucket)) continue;
    out[skill] = {
      price_proxy_usd: finite(bucket.price_proxy_usd),
      cost_usd: finite(bucket.cost_usd),
      turns: finite(bucket.turns),
    };
  }
  return out;
}
