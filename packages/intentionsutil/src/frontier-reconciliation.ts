/**
 * The reconciliation frontier: the derived delta between where the graph is
 * and where the author wants it, recomputed on every read and stored nowhere.
 *
 * This is the IaC reconciliation loop applied to the intention graph
 * (`tactic-migration-frontier-projection`'s rationale: Terraform `plan`, the
 * level-triggered controller). A stored migration step-list is a
 * hand-maintained projection of that delta and stales the moment either side
 * moves; the frontier IS the remaining migration, so it cannot be wrong about
 * the past. Nothing here writes, caches, or remembers.
 *
 * PURE. No fs, no process, no clock. `IntentionNode[]` and the check runs
 * arrive as arguments; `scripts/reconciliation-frontier.ts` does the I/O and
 * calls in, exactly as `grounding-gap.ts` does for `grounding.ts`. That is
 * what lets this module sit on the browser-safe barrel beside `criteria.ts`.
 *
 * ARMS. Five kinds are DECLARED here and three are LANDED:
 *
 *  - `unsatisfied-criterion` — landed (unit 3).
 *  - `observe-failure`       — landed (unit 3).
 *  - `stale-intent`          — landed (unit 4, derived by `basis-pins.ts`).
 *  - `overdue-shim`          — landed (unit 5, derived by `shims.ts`).
 *  - `prose-gap`             — unit 7.
 *
 * The unlanded arms are declared in the kind union NOW, deliberately, so they
 * append through this same entry type: the renderer, the CLI and the digest
 * table need no change when they land. An arm is added by extending
 * `deriveReconciliationFrontier`'s concatenation and nothing else — which is
 * exactly what units 4 and 5 did, and neither changed anything else in this
 * file: no new `ReconciliationFrontierInput` field for either — `nodes`
 * already carries everything the pins are read from, and `overdue-shim` reads
 * `nodes` for the shim inventory and the already-present `checkRuns` for the
 * gating/satisfaction lookup.
 *
 * NAMING, DELIBERATELY NON-COLLIDING. `frontier` already carries three senses
 * in this repo — the goal-layer active frontier (`activeFrontier`,
 * `goals.ts`), the review-coverage frontier entry (`frontierEntryFor`,
 * `coverage.ts`), and a local BFS variable in `grounding.ts`. Every symbol this
 * module adds therefore carries the `Reconciliation` qualifier, and no existing
 * `frontier` symbol is renamed: renaming would be a migration this node has not
 * sanctioned. The entry interface is spelled `ReconciliationFrontierEntry`
 * rather than the plan's shorthand `FrontierEntry` for exactly this reason —
 * an unqualified `FrontierEntry` beside `checks.ts`'s `FrontierEntrySeed` would
 * read as the whole of the frontier vocabulary rather than one sense of it.
 *
 * THE ASSUMPTION CLASS IS NEVER A WORK ITEM (author-ratified `kind-kind`
 * refinement 7, 2026-09-01). An `assumption` criterion is a world-premise the
 * strategy rests on, evaluated by ASSESSMENT — dated and expiring — and an
 * observed violation means RE-DERIVE THE STRATEGY, never schedule a task. So
 * assumption-class criteria are excluded from the unsatisfied-criteria arm
 * outright: a work-item-shaped frontier entry is precisely the wrong response
 * to a failed premise. No assessment machinery exists yet, so there is no
 * mechanical satisfaction signal for an assumption to report against either.
 * The assumption arm arrives WITH that machinery (owned elsewhere), and its
 * entries will carry the re-derive-the-strategy semantics rather than this
 * module's backlog semantics. Nothing here invents an assessment store.
 */
import {
  STANDING_CRITERIA_HOME,
  CRITERIA_KEY,
  effectiveCriteria,
  standingCriteria,
  type Criterion,
  type CriterionAuthority,
} from "./criteria.js";
import { deriveStaleIntent } from "./basis-pins.js";
import { deriveShimFrontier } from "./shims.js";
import type { CheckDeclaration, CheckResult, CheckTier } from "./checks.js";
import type { IntentionNode } from "./schema.js";

/**
 * The kinds of frontier item, in the fixed order the renderer emits them.
 *
 * Order is part of the render contract, so it is declared once here and never
 * re-spelled at a call site.
 */
export const RECONCILIATION_FRONTIER_KINDS = [
  "unsatisfied-criterion",
  "observe-failure",
  "stale-intent",
  "overdue-shim",
  "prose-gap",
] as const;

export type ReconciliationFrontierKind = (typeof RECONCILIATION_FRONTIER_KINDS)[number];

/**
 * One item of remaining reconciliation work.
 *
 * A strict superset of `checks.ts`'s `FrontierEntrySeed`: a check knows only
 * `subject` and `detail`; the deriver attaches the kind, the stable id, and
 * the criterion/authority join. Two fields are nullable BY DESIGN — an arm
 * that genuinely has no bound criterion (a prose gap, a dangling tooling path)
 * would otherwise have to invent one, and invented provenance is worse than
 * absent provenance.
 */
export interface ReconciliationFrontierEntry {
  kind: ReconciliationFrontierKind;
  /**
   * Stable, unique-in-practice sort key, `<kind>:<discriminator>`. Stable
   * across runs on unchanged inputs, so an entry can be cited, pinned or
   * diffed between two readings.
   */
  id: string;
  /** What is out of line — a criterion id, a node id, a file path, a symbol. */
  subject: string;
  /** Why it is out of line, one line of prose. */
  detail: string;
  /** The criterion id this item reconciles against, or null when it has none. */
  criterion: string | null;
  /** That criterion's authority, or null when unknown/unbound. */
  authority: CriterionAuthority | null;
}

/**
 * One check, as the runner observed it: the declaration, the tier
 * `deriveTier` derived for it, and what its `run` returned.
 *
 * The tier is passed IN rather than derived here. `deriveTier` (`checks.ts`)
 * is the single home of the sanction gate, and it needs the high-water source
 * — a store read this pure module must not make. The runner derives once and
 * hands the result over.
 */
export interface ReconciliationCheckRun {
  check: CheckDeclaration;
  tier: CheckTier;
  result: CheckResult;
}

/**
 * What the frontier is derived FROM: the target state (the graph's criteria)
 * and the operational state (what the checks reported).
 *
 * `checkRuns` is REQUIRED, never optional. A caller with no runner says so by
 * passing `[]`, and the resulting frontier — every non-assumption criterion
 * unsatisfied — is the honest bootstrap reading. An optional field would let
 * "I forgot to run the checks" and "the checks all passed" render identically.
 *
 * Units 4, 5 and 7 add their inputs as further fields here.
 */
export interface ReconciliationFrontierInput {
  /**
   * EVERY node in the store. A truncated list is refused rather than
   * defaulted: `standingCriteria` throws when `kind-strategy` is absent,
   * because an empty standing set would silently shrink the frontier.
   */
  nodes: readonly IntentionNode[];
  /** The checks the runner executed, with their derived tiers. May be empty. */
  checkRuns: readonly ReconciliationCheckRun[];
}

/** A criterion in force, with the node that AUTHORS it (not every node it binds). */
interface HomedCriterion {
  criterion: Criterion;
  home: string;
}

/**
 * The criteria in force across the whole graph, keyed by id.
 *
 * The union of a strategy's own criteria with the standing set is
 * `effectiveCriteria`'s rule and is not re-implemented here (single-home
 * doctrine, `criteria.ts`) — this function calls it once per CARRIER and
 * merges the results by id.
 *
 * A carrier is a `strategy` node, or any node that authors an
 * `attributes.criteria` key. The second clause exists so a criterion authored
 * on a goal-layer node that is not a strategy is still seen; `kind-kind`
 * documents the key as valid on any goal-layer node, and a criterion the
 * frontier cannot see is a criterion nothing can ever report as unsatisfied.
 *
 * The standing set is read FIRST and directly, before any carrier is
 * inspected. That is deliberate: it is in force for every strategy by
 * definition, and reading it up front means a truncated node list is refused
 * even when the list happens to carry no criteria carrier at all.
 *
 * Carriers are visited in id order, so when two carriers author the same
 * criterion id the home recorded is the lowest carrier id — deterministic
 * regardless of input order. (Two carriers authoring one id with different
 * text is a graph defect owned by `validateGraph`, not something this
 * projection adjudicates.)
 */
function criteriaInForce(nodes: readonly IntentionNode[]): Map<string, HomedCriterion> {
  const inForce = new Map<string, HomedCriterion>();
  for (const criterion of standingCriteria(nodes)) {
    inForce.set(criterion.id, { criterion, home: STANDING_CRITERIA_HOME });
  }
  const carriers = nodes
    .filter((n) => n.kind === "strategy" || n.attributes[CRITERIA_KEY] != null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const carrier of carriers) {
    for (const criterion of effectiveCriteria(carrier, nodes)) {
      if (inForce.has(criterion.id)) continue;
      inForce.set(criterion.id, { criterion, home: carrier.id });
    }
  }
  return inForce;
}

/**
 * THE SATISFACTION RULE, stated once.
 *
 * A criterion is SATISFIED iff at least one registered check binds to it AND
 * every bound check that ran reported `ok`. Anything else is unsatisfied, in
 * two shapes:
 *
 *  - NO BOUND CHECK — nothing mechanical decides this criterion, so nothing
 *    can report it met. This is the honest bootstrap reading, and it is the
 *    load-bearing half: with zero checks registered today, every
 *    non-assumption criterion in force is unsatisfied, and that set IS the
 *    remaining migration ("unsatisfied criteria ARE the backlog", the
 *    2026-09-01 ladder-reconciliation ruling). The alternative reading —
 *    "unbound means nothing is known, so say nothing" — renders an empty
 *    frontier on a graph with no checks at all, which is the most misleading
 *    output this surface could produce.
 *  - A BOUND CHECK FAILED — the criterion is decided, and the decision is no.
 *
 * TIER IS NOT CONSULTED. A passing check satisfies its criterion whether it is
 * observe or gating; the tier decides what a FAILURE costs (block vs. list),
 * which is the runner's business and the `observe-failure` arm's, not this
 * arm's. Consulting it here would double-count every failing observe check.
 */
function deriveUnsatisfiedCriteria(
  inForce: ReadonlyMap<string, HomedCriterion>,
  checkRuns: readonly ReconciliationCheckRun[],
): ReconciliationFrontierEntry[] {
  const entries: ReconciliationFrontierEntry[] = [];
  for (const { criterion, home } of inForce.values()) {
    // See the module header: an assumption is evaluated by assessment and a
    // violation re-derives the strategy, so it is never a work item.
    if (criterion.class === "assumption") continue;
    const bound = checkRuns.filter((run) => run.check.criterion === criterion.id);
    if (bound.length > 0 && bound.every((run) => run.result.ok)) continue;
    const failing = bound.filter((run) => !run.result.ok).map((run) => run.check.id);
    const detail =
      bound.length === 0
        ? `no registered check binds to this ${criterion.class} criterion, so nothing ` +
          `mechanically reports it met`
        : `bound check(s) reported not-ok: ${[...failing].sort().join(", ")}`;
    entries.push({
      kind: "unsatisfied-criterion",
      id: `unsatisfied-criterion:${criterion.id}`,
      subject: home,
      detail,
      criterion: criterion.id,
      authority: criterion.authority,
    });
  }
  return entries;
}

/**
 * The observe-tier arm: one entry per item a non-clean observe-tier check
 * reported.
 *
 * CLEAN means `ok` AND no entries. A check that reports `ok` with a NON-EMPTY
 * entry list is not a contradiction and is not a bug — `checks.ts` names it
 * "exactly the migration-frontier case": these remain, and that is expected
 * today. Those items are remaining migration work by construction, so they
 * belong on the frontier; suppressing them would discard the very list the
 * `FrontierEntrySeed` shape exists to carry.
 *
 * GATING RUNS ARE EXCLUDED. A failing gating check blocks the build — it is
 * the runner's verdict, not a listing of work to schedule — and listing it
 * here would report the same failure twice in two registers. The frontier is a
 * sensor; gating force lives in a separate runner, so reading the frontier can
 * never fail a build.
 *
 * A non-clean check that reports NO seeds still yields one entry, carrying the
 * check's own `detail`. A red check with an empty list is a check that cannot
 * itemize its failure, not a check with nothing wrong.
 */
function deriveObserveFailures(
  inForce: ReadonlyMap<string, HomedCriterion>,
  checkRuns: readonly ReconciliationCheckRun[],
): ReconciliationFrontierEntry[] {
  const entries: ReconciliationFrontierEntry[] = [];
  for (const run of checkRuns) {
    if (run.tier !== "observe") continue;
    if (run.result.ok && run.result.entries.length === 0) continue;
    const criterion = run.check.criterion;
    const authority = inForce.get(criterion)?.criterion.authority ?? null;
    if (run.result.entries.length === 0) {
      entries.push({
        kind: "observe-failure",
        id: `observe-failure:${run.check.id}`,
        subject: run.check.id,
        detail: run.result.detail,
        criterion,
        authority,
      });
      continue;
    }
    for (const seed of run.result.entries) {
      entries.push({
        kind: "observe-failure",
        id: `observe-failure:${run.check.id}:${seed.subject}`,
        subject: seed.subject,
        detail: seed.detail,
        criterion,
        authority,
      });
    }
  }
  return entries;
}

/**
 * THE DERIVER: the whole reconciliation frontier, id-sorted, total, pure.
 *
 * TOTAL means the order does not depend on input order and never leaves two
 * entries incomparable: the comparator falls through `id`, then `kind`, then
 * `subject`, then `detail`. The fallbacks are not decoration — a single check
 * may legitimately report two seeds under one subject, which collides on `id`,
 * and an unstable order there would make two readings of an unchanged graph
 * differ.
 *
 * Adding an arm means adding one call to the concatenation below. Nothing
 * downstream — renderer, CLI, digest table — changes.
 *
 * @throws IntentionSchemaError when the node list is truncated (no
 *   `kind-strategy`), when a criteria list is malformed, when a carrier shadows
 *   a standing criterion id, when a `attributes.basis_pins` list is malformed,
 *   or when a `attributes.shims` list is malformed. All five are
 *   misconfiguration, and a silently smaller frontier is the one output this
 *   surface must never produce (`.claude/rules/code-style.md`). A pin whose
 *   citation merely fails to RESOLVE is not in that set — that is a real
 *   frontier item, and `deriveStaleIntent` reports it as one — and neither is
 *   a shim whose `liquidated_by` merely fails to resolve against the current
 *   check runs: `deriveShimFrontier` reads that as "not overdue", not as an
 *   error.
 */
export function deriveReconciliationFrontier(
  input: ReconciliationFrontierInput,
): ReconciliationFrontierEntry[] {
  const inForce = criteriaInForce(input.nodes);
  const entries = [
    ...deriveUnsatisfiedCriteria(inForce, input.checkRuns),
    ...deriveObserveFailures(inForce, input.checkRuns),
    ...deriveStaleIntent(input.nodes),
    ...deriveShimFrontier(input.nodes, input.checkRuns),
    // Unit 7 appends `prose-gap`.
  ];
  return entries.sort(
    (a, b) =>
      compare(a.id, b.id) ||
      compare(a.kind, b.kind) ||
      compare(a.subject, b.subject) ||
      compare(a.detail, b.detail),
  );
}

/** Ascending UTF-16 code-unit order — the order `Array#sort` gives by default. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Render the frontier as deterministic markdown. Byte-stable across repeated
 * calls on the same entries: no dates, no wall clock, no environment data.
 * Ends with a trailing newline.
 *
 * An EMPTY frontier renders one stable summary line and nothing else — the
 * same discipline `renderFrontier` (`goals.ts`) uses for an empty goal
 * frontier. Every other segment is conditional on being non-empty: a kind with
 * no entries emits no heading, so a store whose only arm is unsatisfied
 * criteria renders exactly one section rather than four empty ones. The
 * `[criterion …]` / `[authority …]` markers follow the same rule — appended
 * only when the field is non-null, so an arm with no criterion join renders
 * unmarked instead of carrying a `null`.
 *
 * The input is re-sorted here (kind order first, then the deriver's own id
 * order) rather than trusted, so the render is deterministic for ANY
 * permutation of the same entries — including a caller that concatenated two
 * derivations.
 */
export function renderReconciliationFrontier(
  entries: readonly ReconciliationFrontierEntry[],
): string {
  if (entries.length === 0) {
    return "_No reconciliation frontier items._\n";
  }
  const noun = entries.length === 1 ? "item" : "items";
  const blocks: string[] = [`**Reconciliation frontier — ${entries.length} ${noun}.**`];
  for (const kind of RECONCILIATION_FRONTIER_KINDS) {
    const ofKind = entries
      .filter((e) => e.kind === kind)
      .sort((a, b) => compare(a.id, b.id) || compare(a.subject, b.subject) || compare(a.detail, b.detail));
    if (ofKind.length === 0) continue;
    const lines = ofKind.map((entry) => {
      let line = `- **${entry.id}** — ${entry.subject} — ${entry.detail}`;
      if (entry.criterion !== null) line += ` [criterion ${entry.criterion}]`;
      if (entry.authority !== null) line += ` [authority ${entry.authority}]`;
      return line;
    });
    blocks.push(`## ${kind} (${ofKind.length})\n${lines.join("\n")}`);
  }
  return `${blocks.join("\n\n")}\n`;
}
