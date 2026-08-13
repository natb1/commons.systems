// Pure render logic for `rsi-plan.md` — the derived dashboard the `/rsi` loop
// maintains (`strategy-recursive-self-improvement` condition 5: "the graph
// stays the sole tracker: rsi-plan.md is a derived, fully rendered artifact —
// every section is produced by render-rsi-plan.ts from graph state ... a
// hand-edited section is a defect").
//
// This module is fs-free, git-free and process-free by design, exactly like
// `census.ts`: the caller (`scripts/render-rsi-plan.ts`) loads the store at a
// git ref, shells out to `office-hours-select.ts --list`, and reads the token
// aggregate, then hands the already-gathered inputs here. That split is what
// makes the whole render testable on in-memory fixtures.
//
// WHERE EACH SECTION'S SOURCE OF TRUTH LIVES (all of it in the graph):
//
//   §1 priorities  — strategy nodes ordered by the resolved rank key
//                    `(tier, band, rank)`.
//   §2 dispatch    — `attributes.queue_summary` on strategy-graph-native-dispatch
//                    plus the mechanical phase census of its tactics.
//   §3 parked      — `attributes.queue_summary` on strategy-attention-surface
//                    plus `office-hours-select.ts --list` rows (band-source
//                    NOTE lines included — never a hand-rolled park probe).
//   §4 metrics     — every goal-layer node whose `success_signal.sensor` name
//                    is REGISTERED in the read-sensors registry, with its
//                    `reading`, `threshold` and derived gap.
//   §5 telemetry   — `tooling_goals` entries of `kind: sensor` across the
//                    graph: the graph's own record of instrumentation it wants
//                    and does not yet have.
//   §6 task plan   — tactics serving strategy-recursive-self-improvement, with
//                    `attributes.rsi_cost` as the budget cost.
//
// THE QUEUE-SUMMARY FIELD, AND WHY IT IS NOT `reading`. The recorded design
// says the three model-drafted queue summaries "land first as dated readings on
// their owning strategy nodes ... and are rendered from there". The top-level
// `reading` field cannot carry them: it is sensor-owned — `read-sensors.ts`
// overwrites it on every batch run, and two of the three owners
// (strategy-graph-native-dispatch's lifecycle sensor,
// strategy-recursive-self-improvement's own rsi sensor) are registered, so a
// hand-drafted summary parked there would be silently clobbered on the next
// read. The summaries therefore live in `attributes.queue_summary` — a dated
// record on the owning strategy node, which is what the design asked for, in
// the one place a non-sensor writer may own. It is fingerprint-safe:
// `strategyFingerprint` (router.ts) hashes only `attributes.conditions` out of
// `attributes`, so re-drafting a summary each iteration does not invalidate the
// strategy stamp of a single open child.

import { ownTier } from "./schema.js";
import type { IntentionNode } from "./schema.js";
import { compareRankKeyDesc, resolveAttention } from "./attention.js";
import { deriveGap } from "./sensors.js";
import { classifyTactic, strategyBacklogBand } from "./census.js";

// --- Node ids this render is anchored to ------------------------------------

/** The strategy whose loop owns this file, and whose tactics are the task plan. */
export const RSI_STRATEGY_ID = "strategy-recursive-self-improvement";

/** Owner of the dispatch queue summary. */
export const DISPATCH_STRATEGY_ID = "strategy-graph-native-dispatch";

/** Owner of the office-hours queue summary. */
export const OFFICE_HOURS_STRATEGY_ID = "strategy-attention-surface";

/**
 * How many days a queue summary may age before the render flags it. An /rsi
 * iteration re-drafts all three, so anything older than a week means either no
 * iteration ran or one skipped its draft step.
 */
export const SUMMARY_STALE_DAYS = 7;

/**
 * How many UNBANDED parks §3 lists. Every park that ranks in a band it got from
 * a parent is always shown — those are the critical-path ones, since a park's
 * blocked source is one of its parents. The rest are a long tail (the store
 * carries ~90 parks), so the section shows the highest-ranked few and states how
 * many it dropped rather than reproducing the whole queue.
 */
export const PARKED_UNBANDED_SHOWN = 10;

// --- Inputs -----------------------------------------------------------------

/** A dated, model-drafted queue summary read from `attributes.queue_summary`. */
export interface QueueSummary {
  /** `YYYY-MM-DD` — the day the summary was drafted. */
  date: string;
  /** The drafted prose. Rendered verbatim; never edited in the .md. */
  summary: string;
}

/**
 * A pointer to an operational record that lives OUTSIDE the graph — read from
 * `attributes.external_ledgers` on the rsi strategy.
 *
 * These exist only during bootstrap. A prototype session's plan file can carry
 * invariants, write recipes, and traps that no graph node has absorbed yet;
 * until they are absorbed, that file is load-bearing and the rendered plan must
 * say where it is. Recording the pointer as graph data rather than as renderer
 * prose means supersession is a graph edit — delete the entry and the section
 * stops rendering — instead of a code change.
 */
export interface ExternalLedger {
  /** Filesystem path to the record. Rendered verbatim. */
  path: string;
  /** What it still carries that the graph does not, and what would retire it. */
  note: string;
}

/**
 * One parked row as emitted by `office-hours-select.ts --list`. `note` carries
 * the selector's `NOTE —` advisory verbatim when the row has one: that line is
 * how a BANDED park declares the parent it got its band from — under the
 * widened attention relation a park's blocked source IS one of its parents, so
 * that is precisely the critical-path signal §3 exists to surface.
 */
export interface ParkedItem {
  /** The row's first column: the park's penalized `score`. */
  rank: number;
  sessionType: string;
  id: string;
  since: string;
  note: string | null;
}

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

/** Everything `renderRsiPlan` needs, all of it gathered by the caller. */
export interface RsiRenderInput {
  /** The whole store, read at `ref` — not the local working tree. */
  nodes: IntentionNode[];
  /** Rows from `office-hours-select.ts --list`. */
  parked: ParkedItem[];
  /**
   * Per-workflow token attribution, or `null` when no aggregate was available.
   * `null` renders an explicit "unavailable" line — never a zero, which would
   * read as "rsi spent nothing" rather than "nothing was measured".
   */
  spend: WorkflowSpend[] | null;
  /** Window the spend covers, e.g. `7d`. Ignored when `spend` is null. */
  spendWindow: string;
  /** Names the read-sensors registry currently resolves. */
  registeredSensors: ReadonlySet<string>;
  /** The git ref the store was read at, and its resolved commit. */
  ref: string;
  sha: string;
  /** `YYYY-MM-DD` render date. Injected so the render is deterministic. */
  generatedAt: string;
}

// --- Staleness flags --------------------------------------------------------

/**
 * A mechanical staleness finding. `/rsi-plan` renders these for the `/rsi` main
 * thread's judgment step — this module never decides what to DO about one
 * (strategy condition: rendering is the subagent's job, judgment is the main
 * thread's).
 */
export interface StalenessFlag {
  kind:
    | "task-done"
    | "task-parked"
    | "summary-missing"
    | "summary-stale"
    | "threshold-breach"
    | "unread-sensor"
    | "spend-deviation";
  /** The node id (or workflow name) the finding is about. */
  subject: string;
  detail: string;
}

export interface RsiRender {
  markdown: string;
  flags: StalenessFlag[];
}

// --- Field readers ----------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The dated queue summary on a strategy node, or `null` when absent. Returns
 * `null` — rather than throwing — for a malformed value, because the caller
 * turns absence into a rendered "not drafted" line plus a `summary-missing`
 * flag, which is more useful to the judgment step than an aborted render. A
 * malformed value is not silently treated as valid: it takes the same
 * absent path and the same flag.
 */
export function queueSummaryOf(node: IntentionNode | undefined): QueueSummary | null {
  if (node === undefined) return null;
  const raw = node.attributes.queue_summary;
  if (!isPlainObject(raw)) return null;
  const { date, summary } = raw;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (typeof summary !== "string" || summary.trim() === "") return null;
  return { date, summary: summary.trim() };
}

/**
 * The external operational ledgers recorded on a strategy node, or `[]` when
 * the field is absent, malformed, or empty.
 *
 * An empty result is the terminal state, not an error: it means every ledger
 * has been absorbed into the graph. So absence renders nothing and raises no
 * flag — unlike a missing queue summary, which is a gap the judgment step must
 * see. Individual malformed entries are skipped rather than aborting the render,
 * on the same reasoning as `queueSummaryOf`.
 */
export function externalLedgersOf(node: IntentionNode | undefined): ExternalLedger[] {
  if (node === undefined) return [];
  const raw = node.attributes.external_ledgers;
  if (!Array.isArray(raw)) return [];
  const out: ExternalLedger[] = [];
  for (const entry of raw) {
    if (!isPlainObject(entry)) continue;
    const { path, note } = entry;
    if (typeof path !== "string" || path.trim() === "") continue;
    if (typeof note !== "string" || note.trim() === "") continue;
    out.push({ path: path.trim(), note: note.trim() });
  }
  return out;
}

/**
 * An rsi task's budget cost. Default 0, per the recorded budget semantics
 * ("an rsi-implement task costs 1 and other tasks cost 0 unless a task
 * specifies its own cost") — a task declares its own via `attributes.rsi_cost`.
 */
export function rsiTaskCost(node: IntentionNode): number {
  const raw = node.attributes.rsi_cost;
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

/** Whole days between two `YYYY-MM-DD` dates, `later - earlier`. */
export function daysBetween(earlier: string, later: string): number {
  const a = Date.parse(`${earlier}T00:00:00Z`);
  const b = Date.parse(`${later}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
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
  ["rsi", ["rsi", "rsi-plan"] as const],
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
 *
 * Shared by `render-rsi-plan.ts` and the rsi sensor in `read-sensors.ts` so the
 * two cannot drift on what counts as a readable aggregate.
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

// --- Render helpers ---------------------------------------------------------

/** Escape the pipe characters that would otherwise split a markdown table cell. */
function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

/** One-line clip for table cells, with an ellipsis when it bites. */
function clip(text: string, max: number): string {
  const flat = cell(text);
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

function num(value: number, digits = 1): string {
  return value.toFixed(digits);
}

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

// --- The render -------------------------------------------------------------

/**
 * Render the whole of `rsi-plan.md` from graph state, plus the mechanical
 * staleness flags the `/rsi` judgment step reads.
 *
 * Deterministic: every ordering has a unique final tiebreak (node id), and the
 * only wall-clock input is the caller-supplied `generatedAt`. Two runs against
 * the same store, ref and date emit byte-identical markdown — which is what
 * makes `--check` a usable "is the committed file stale?" gate.
 */
export function renderRsiPlan(input: RsiRenderInput): RsiRender {
  const { nodes, generatedAt } = input;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const flags: StalenessFlag[] = [];
  const out: string[] = [];

  out.push("# rsi-plan");
  out.push("");
  out.push(
    `> **Generated file — do not hand-edit.** Rendered by ` +
      `\`packages/intentionsutil/scripts/render-rsi-plan.ts\` on ${generatedAt} from ` +
      `the intention store at \`${input.ref}\` (\`${input.sha.slice(0, 8)}\`).`,
  );
  out.push(">");
  out.push(
    `> Single writer: the \`/rsi\` skill, serialized on the ` +
      `\`${RSI_STRATEGY_ID}\` worktree claim, direct-pushed to main ` +
      `(\`${RSI_STRATEGY_ID}\` condition 5). The graph is the sole tracker — ` +
      `every section here is derived, and a hand-edited section is a defect. ` +
      `To change what this file says, change the graph and re-render.`,
  );
  out.push("");

  out.push(...renderPriorities(nodes));
  out.push(...renderDispatchQueue(nodes, byId, generatedAt, flags));
  out.push(...renderParked(input, byId, generatedAt, flags));
  out.push(...renderMetrics(input, flags));
  out.push(...renderTelemetry(nodes));
  out.push(...renderTaskPlan(nodes, byId, generatedAt, flags));
  out.push(...renderLedgers(byId));

  return { markdown: `${out.join("\n").replace(/\n+$/, "")}\n`, flags };
}

// --- §1 ---------------------------------------------------------------------

function renderPriorities(nodes: IntentionNode[]): string[] {
  const resolved = resolveAttention(nodes);
  const strategies = nodes
    .filter((n) => n.kind === "strategy")
    .map((n) => {
      const attention = resolved.get(n.id);
      // A strategy of a non-goal-layer kind has no resolved entry; it falls back
      // to its OWN tier (never a flat 1) and a zero band/score/depth, matching
      // `projectGoals`' fallback in goals.ts.
      return {
        node: n,
        key: {
          tier: attention?.tier ?? ownTier(n),
          band: attention?.band ?? 0,
          score: attention?.score ?? 0,
          depth: attention?.depth ?? 0,
        },
      };
    })
    .sort((a, b) => compareRankKeyDesc(a.key, b.key) || a.node.id.localeCompare(b.node.id))
    .slice(0, 10);

  const out = [
    "## 1. Top author priorities",
    "",
    "Ordered by the graph's own attention resolution — the `(tier, band, rank)` key",
    "`resolveAttention` derives (`src/attention.ts`), tier outermost. `band` is the",
    "best rank among a node's parents, so a whole cohort under one hot parent sorts",
    "together before each member's own rank breaks ties inside it. No hand-ranking:",
    "to move an item, author an `attention` boost or a tier on its node.",
    "",
    "| # | tier | band | rank | strategy | open / total tactics |",
    "|---|---|---|---|---|---|",
  ];
  strategies.forEach((s, i) => {
    // The BACKLOG band (census.ts) — the share of this strategy's tactics that
    // are backlogged. Nothing to do with the ranking `band` above; named apart
    // so the two never read as the same quantity.
    const backlogBand = strategyBacklogBand(nodes, s.node.id);
    const open = nodes.filter(
      (n) =>
        n.kind === "tactic" &&
        n.serves.includes(s.node.id) &&
        classifyTactic(n) === "open",
    ).length;
    out.push(
      `| ${i + 1} | ${s.key.tier} | ${num(s.key.band)} | ${num(s.key.score)} | ` +
        `\`${s.node.id}\` — ${clip(s.node.statement, 90)} | ${open} / ${backlogBand.total} |`,
    );
  });
  out.push("");
  return out;
}

// --- §2 ---------------------------------------------------------------------

function renderQueueSummary(
  queue: string,
  strategyId: string,
  byId: Map<string, IntentionNode>,
  today: string,
  flags: StalenessFlag[],
): string[] {
  const summary = queueSummaryOf(byId.get(strategyId));
  if (summary === null) {
    flags.push({
      kind: "summary-missing",
      subject: strategyId,
      detail: `no \`attributes.queue_summary\` for the ${queue} queue — /rsi-plan must draft one`,
    });
    return [
      `**${queue} queue summary** — *not drafted.* The \`/rsi-plan\` step drafts it`,
      `onto \`${strategyId}\` as \`attributes.queue_summary\`.`,
      "",
    ];
  }
  const age = daysBetween(summary.date, today);
  if (age > SUMMARY_STALE_DAYS) {
    flags.push({
      kind: "summary-stale",
      subject: strategyId,
      detail: `${queue} queue summary is ${age}d old (drafted ${summary.date}, limit ${SUMMARY_STALE_DAYS}d)`,
    });
  }
  return [
    `**${queue} queue summary** (drafted ${summary.date}${age > SUMMARY_STALE_DAYS ? `, **${age}d stale**` : ""}, ` +
      `source of truth \`${strategyId}\`):`,
    "",
    summary.summary,
    "",
  ];
}

function renderDispatchQueue(
  nodes: IntentionNode[],
  byId: Map<string, IntentionNode>,
  today: string,
  flags: StalenessFlag[],
): string[] {
  const out = ["## 2. Dispatch queue — delegated priorities", ""];
  out.push(...renderQueueSummary("dispatch", DISPATCH_STRATEGY_ID, byId, today, flags));

  const tactics = nodes.filter(
    (n) => n.kind === "tactic" && n.serves.includes(DISPATCH_STRATEGY_ID),
  );
  const byPhase = new Map<string, IntentionNode[]>();
  for (const t of tactics) {
    if (classifyTactic(t) !== "open") continue;
    const phase = t.phase ?? "(none)";
    const bucket = byPhase.get(phase);
    if (bucket === undefined) byPhase.set(phase, [t]);
    else bucket.push(t);
  }
  const band = strategyBacklogBand(nodes, DISPATCH_STRATEGY_ID);
  out.push(
    `Backlog band: **${band.pct === null ? "n/a" : pct(band.pct)}** ` +
      `(${band.backlog}/${band.total} tactics serving \`${DISPATCH_STRATEGY_ID}\`; ` +
      "recorded threshold 35% and non-increasing).",
    "",
    "| phase | count | nodes |",
    "|---|---|---|",
  );
  for (const [phase, tactics] of [...byPhase.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const ids = tactics.map((t) => t.id).sort();
    out.push(
      `| \`${phase}\` | ${ids.length} | ${clip(ids.map((i) => `\`${i}\``).join(", "), 220)} |`,
    );
  }
  if (byPhase.size === 0) out.push("| — | 0 | no open tactics |");
  out.push("");
  return out;
}

// --- §3 ---------------------------------------------------------------------

function renderParked(
  input: RsiRenderInput,
  byId: Map<string, IntentionNode>,
  today: string,
  flags: StalenessFlag[],
): string[] {
  const out = ["## 3. Office-hours queue — parked nodes on the critical path", ""];
  out.push(
    ...renderQueueSummary("office-hours", OFFICE_HOURS_STRATEGY_ID, byId, today, flags),
  );

  // Banded rows first: a park carrying a NOTE ranks in a band it got from a
  // parent — and a park's blocked source IS one of its parents — which is
  // exactly the "what does this park block?" question §3 exists to answer.
  // Within each group, rank descending, id ascending.
  const sorted = [...input.parked].sort(
    (a, b) =>
      Number(b.note !== null) - Number(a.note !== null) ||
      b.rank - a.rank ||
      a.id.localeCompare(b.id),
  );
  // §3 is the CRITICAL-PATH view, not the whole queue: every banded park (each
  // one hangs off live work) plus the highest-ranked unbanded parks. The
  // remainder is reported as a count with the command that lists it — a cap
  // that is stated is a scope decision; a cap that is silent reads as "this is
  // everything".
  const banded = sorted.filter((p) => p.note !== null);
  const unbanded = sorted.filter((p) => p.note === null);
  const shownUnbanded = unbanded.slice(0, PARKED_UNBANDED_SHOWN);
  const shown = [...banded, ...shownUnbanded];
  out.push(
    "Canonical source: `office-hours-select.ts --list`, read at the same ref as the",
    "rest of this render. A parked blocker already ranks in the band of the work it",
    "blocks — the `blocks` column names the parent a park got its band from, which",
    "is what makes it critical-path. Never hand-roll this list.",
    "",
    "| rank | type | parked node | since | blocks |",
    "|---|---|---|---|---|",
  );
  for (const item of shown) {
    out.push(
      `| ${num(item.rank)} | ${cell(item.sessionType)} | \`${item.id}\` | ${cell(item.since)} | ` +
        `${bandSourceOf(item)} |`,
    );
  }
  if (shown.length === 0) out.push("| — | — | nothing parked | — | — |");
  out.push("");
  if (unbanded.length > shownUnbanded.length) {
    out.push(
      `Showing every banded park (${banded.length}) and the top ` +
        `${shownUnbanded.length} of ${unbanded.length} unbanded parks by rank. The ` +
        `remaining **${unbanded.length - shownUnbanded.length}** are not shown here — ` +
        "`npx tsx packages/intentionsutil/scripts/office-hours-select.ts --list` is the full queue.",
      "",
    );
  }

  const blockedByParked = countBlockedByParked(input.nodes);
  out.push(
    `Parked total: **${sorted.length}**, of which **${banded.length}** rank in a band ` +
      `they got from a parent. Live nodes held by a \`blocked_by\` edge onto ` +
      `a parked node: **${blockedByParked}**.`,
    "",
  );
  return out;
}

/**
 * The parent a banded park got its band from, as a table cell. The selector's
 * advisory reads `<id> ranks at tier T band B via <source> (own score S)`; the
 * source id is the only part §3 needs — the rank is already its own column, and
 * the park's own id is already the row. A note that does not match the expected
 * shape is rendered verbatim rather than dropped, so a selector wording change
 * degrades to noisy, not silent.
 */
function bandSourceOf(item: ParkedItem): string {
  if (item.note === null) return "—";
  const match = item.note.match(/ via (\S+)/);
  return match === null ? clip(item.note, 160) : `\`${match[1]}\``;
}

/** Open tactics with at least one `blocked_by` edge onto a parked node. */
function countBlockedByParked(nodes: IntentionNode[]): number {
  const parked = new Set(nodes.filter((n) => n.office_hours !== null).map((n) => n.id));
  return nodes.filter(
    (n) =>
      n.office_hours === null &&
      n.phase !== null &&
      n.phase !== "done" &&
      n.blocked_by.some((b) => parked.has(b)),
  ).length;
}

// --- §4 ---------------------------------------------------------------------

function renderMetrics(input: RsiRenderInput, flags: StalenessFlag[]): string[] {
  const out = [
    "## 4. Metrics",
    "",
    "Every graph signal whose `success_signal.sensor` name is REGISTERED in the",
    "read-sensors registry (`scripts/read-sensors.ts`) — i.e. every signal that is",
    "actually measured, with a threshold to be measured against. This is a subset of",
    "graph signals rendered from the existing readings machinery, never a parallel",
    "metric registry (`" +
      RSI_STRATEGY_ID +
      "` condition 8). Registering a new rsi metric",
    "means adding a sensor there and naming it on the owning node.",
    "",
    "**Fitness function.** rsi optimizes the value the combined dispatch +",
    "office-hours + rsi system delivers toward author intentions — closure velocity",
    "plus strategy signal progress, per token, attributed per workflow. Greenfield",
    "expectation: dispatch spend significantly outpaces office-hours and rsi; a",
    "deviation from that is itself a review trigger, not a datum to note and pass.",
    "",
    "| node | reading | threshold | gap |",
    "|---|---|---|---|",
  ];

  // Carry the signal alongside the node rather than re-reaching for it below:
  // the filter narrows `success_signal` but the narrowing does not survive into
  // the loop, and re-asserting it there would assert what this flatMap already
  // proved.
  const measured = input.nodes
    .flatMap((node) => {
      const signal = node.success_signal;
      if (signal === null || !input.registeredSensors.has(signal.sensor)) return [];
      return [{ node, signal }];
    })
    .sort((a, b) => a.node.id.localeCompare(b.node.id));

  for (const { node, signal } of measured) {
    const gap = deriveGap(node);
    if (node.reading === null) {
      flags.push({
        kind: "unread-sensor",
        subject: node.id,
        detail: `registered sensor has never been read — run read-sensors.ts`,
      });
    } else if (gap !== null) {
      flags.push({
        kind: "threshold-breach",
        subject: node.id,
        detail: gap,
      });
    }
    out.push(
      `| \`${node.id}\` | ${clip(node.reading ?? "*(unread)*", 220)} | ` +
        `${clip(signal.threshold, 180)} | ${gap === null ? "**met**" : "shortfall"} |`,
    );
  }
  if (measured.length === 0) out.push("| — | no registered sensor resolves to a node | — | — |");
  out.push("");

  out.push(...renderSpend(input, flags));
  return out;
}

function renderSpend(input: RsiRenderInput, flags: StalenessFlag[]): string[] {
  if (input.spend === null) {
    return [
      "**Per-workflow token attribution** — *unavailable.* No usage aggregate was",
      "read for this render. `/rsi-plan` produces one with",
      "`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh --days 7",
      "--json-out tmp/usage-audit.json` before rendering. An absent aggregate is",
      "reported, never rendered as zero spend.",
      "",
    ];
  }
  const out = [
    `**Per-workflow token attribution** (window ${input.spendWindow}, from`,
    "`aggregate-usage.sh`'s per-skill `by_phase` buckets folded by `WORKFLOW_SKILLS`,",
    "`src/rsi.ts`). `price_proxy_usd` holds price constant to compare token volume;",
    "`cost_usd` is the truthful per-model bill.",
    "",
    "| workflow | share | price proxy (USD) | cost (USD) | turns |",
    "|---|---|---|---|---|",
  ];
  for (const s of input.spend) {
    out.push(
      `| ${s.workflow} | ${pct(s.share)} | ${num(s.priceProxyUsd, 2)} | ` +
        `${num(s.costUsd, 2)} | ${s.turns} |`,
    );
  }
  out.push("");

  // The fitness function's recorded expectation, checked mechanically: dispatch
  // is expected to dominate. It failing to is a review trigger, so it is a flag
  // rather than a line of prose the reader has to notice.
  const dispatch = input.spend.find((s) => s.workflow === "dispatch");
  const rivals = input.spend.filter((s) => s.workflow !== "dispatch" && s.workflow !== "other");
  const measured = input.spend.some((s) => s.priceProxyUsd > 0);
  if (measured && dispatch !== undefined) {
    const bigger = rivals.filter((r) => r.priceProxyUsd >= dispatch.priceProxyUsd);
    if (bigger.length > 0) {
      flags.push({
        kind: "spend-deviation",
        subject: "dispatch",
        detail:
          `dispatch (${pct(dispatch.share)}) does not outpace ` +
          bigger.map((r) => `${r.workflow} (${pct(r.share)})`).join(", ") +
          " — the fitness function's recorded expectation is that it dominates; review",
      });
    }
  }
  return out;
}

// --- §5 ---------------------------------------------------------------------

function renderTelemetry(nodes: IntentionNode[]): string[] {
  const out = [
    "## 5. Recommended additional telemetry",
    "",
    "The graph's own record of instrumentation it wants and does not yet have:",
    "every `tooling_goals` entry of `kind: sensor`, with its owning node. A gap",
    "belongs here by being authored on the node that feels it — not by being",
    "listed here.",
    "",
    "| owning node | sensor goal |",
    "|---|---|",
  ];
  const rows: string[] = [];
  for (const node of [...nodes].sort((a, b) => a.id.localeCompare(b.id))) {
    for (const goal of node.tooling_goals) {
      if (goal.kind !== "sensor") continue;
      rows.push(`| \`${node.id}\` | ${clip(goal.statement, 240)} |`);
    }
  }
  out.push(...(rows.length > 0 ? rows : ["| — | no sensor-kind tooling goals authored |"]));
  out.push("");
  return out;
}

// --- §6 ---------------------------------------------------------------------

function renderTaskPlan(
  nodes: IntentionNode[],
  byId: Map<string, IntentionNode>,
  today: string,
  flags: StalenessFlag[],
): string[] {
  const tasks = nodes
    .filter((n) => n.kind === "tactic" && n.serves.includes(RSI_STRATEGY_ID))
    .sort((a, b) => a.id.localeCompare(b.id));

  const rows: string[] = [];
  for (const task of tasks) {
    const state = classifyTactic(task);
    if (state === "done") {
      flags.push({
        kind: "task-done",
        subject: task.id,
        detail: "task node is `phase: done` — drop it from the plan and re-derive the sequence",
      });
    }
    if (task.office_hours !== null) {
      flags.push({
        kind: "task-parked",
        subject: task.id,
        detail: `task is parked for office-hours (${task.office_hours.reason})`,
      });
    }
    rows.push(
      `| \`${task.id}\` | ${rsiTaskCost(task)} | ${task.phase ?? "—"} | ${state}` +
        `${task.office_hours !== null ? " (parked)" : ""} | ${clip(task.statement, 110)} |`,
    );
  }
  if (rows.length === 0) rows.push("| — | — | — | — | no tasks serve the rsi strategy |");

  return [
    "## 6. RSI task plan",
    "",
    ...renderQueueSummary("rsi", RSI_STRATEGY_ID, byId, today, flags),
    "Every task is a graph node serving `" + RSI_STRATEGY_ID + "` — the graph is the",
    "sole tracker, so a task that is not a node does not exist. Budget: a session's",
    "default is 1; a task costs what its `attributes.rsi_cost` says (default 0).",
    "Execution continues until the budget is exhausted.",
    "",
    "| task | cost | phase | state | statement |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ];
}

// --- §7 ---------------------------------------------------------------------

/**
 * Pointers to operational records the graph has not absorbed yet.
 *
 * Omitted entirely when there are none — the section's absence IS the statement
 * that the graph is self-sufficient. This is the one section whose disappearance
 * is a result rather than a defect, so it renders last, after everything derived.
 */
function renderLedgers(byId: Map<string, IntentionNode>): string[] {
  const ledgers = externalLedgersOf(byId.get(RSI_STRATEGY_ID));
  if (ledgers.length === 0) return [];

  const out = [
    "## 7. External operational ledgers",
    "",
    "Records that are still load-bearing and still live outside the graph. Each",
    "is a bootstrap carry: read it before acting on the operational layer, and",
    "retire the entry — by deleting it from `attributes.external_ledgers` on",
    "`" + RSI_STRATEGY_ID + "` — once the graph carries what it carries. Do not",
    "delete the file itself while its entry stands.",
    "",
  ];
  for (const ledger of ledgers) {
    out.push(`- \`${ledger.path}\``);
    out.push(`  — ${ledger.note}`);
  }
  out.push("");
  return out;
}
