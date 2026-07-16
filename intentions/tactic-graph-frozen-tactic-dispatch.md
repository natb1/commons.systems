---
id: tactic-graph-frozen-tactic-dispatch
kind: tactic
statement: "frozen-node dispatch: the selector ranks and selects frozen nodes
  (draft/raw + soft-frozen), resolves a strategy entry to its highest-ranked
  frozen descendant with a progression-ordinal tiebreak, claims the resolved
  node, and routes it to /align-tactics <node-id>; /align-tactics is extended to
  accept a tactic target"
owner: ai
status: codified
parent: null
rationale: Surfaced 2026-07-11 /align-strategy interview recording the
  frozen-tactic-dispatch clarification (clarification 52) on
  strategy-graph-native-dispatch. Implements the selector + /align-tactics
  changes that make a frozen tactic ranked, selectable, and self-decomposing.
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 11
  override: null
  rationale: "Author-directed 2026-07-16: re-boosted to the TOP of the ordinary
    queue. Own boost 11 + strategy-graph-native-dispatch's inherited 5 resolves
    to authored 16 (~16.33 with the delegation-github capture term) — one above
    the prior ordinary ceiling of authored 15
    (tactic-phase-boot-offload-launcher, tactic-phase-standup-audit-lens,
    tactic-thin-oversized-skill-bodies), and below strategy-main-health's
    emergency ceiling (100). Rationale: this tactic implements clarification 52
    — the frozen/draft-node first-class selectable disposition (a boosted draft
    becomes selectable for a per-node /align-tactics <id> session like any other
    node). Until it lands, EVERY boosted draft — the prior 15-tier and
    tactic-tick-scriptable-then-spawn (authored 12) alike — is inert for
    autonomous selection, because a draft is not a selection candidate at all;
    so the enabling capability must outrank the individual boosted drafts it
    unblocks. Supersedes the stale 2026-07-11 note (own boost 4 -> authored 9,
    'current max authored 8'), now inaccurate."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# frozen-node dispatch: the selector ranks and selects frozen nodes (draft/raw + soft-frozen), resolves a strategy entry to its highest-ranked frozen descendant with a progression-ordinal tiebreak, claims the resolved node, and routes it to /align-tactics <node-id>; /align-tactics is extended to accept a tactic target

## Context

`strategy-graph-native-dispatch` clarification 52 (2026-07-11) makes a **frozen
node** — a draft/raw tactic (never decomposed) or a soft-frozen tactic (a
planned tactic whose serving-strategy substance fingerprint changed,
clarification 10) — first-class: ranked by calculated attention like any node
(clarification 11, derived at read time regardless of `phase`) and
**selectable**. Selecting one runs `/align-tactics <node-id>` to decompose (a
draft) or re-plan (a soft-frozen tactic) it.

Today the selector **excludes** frozen nodes. In
`packages/intentionsutil/src/router.ts`, `selectGraphTargets` (router.ts:216):
the tactic-candidate loop skips any node that is not `isOpenTactic` (a draft /
`phase: null` tactic, router.ts:261) and skips `frozenTacticIds` (soft-frozen,
router.ts:262); the soft-freeze scan (router.ts:234-254) instead emits one
re-evaluation candidate for the **strategy** (`asCandidate(true)`,
router.ts:289-292). A never-decomposed draft is not a selection candidate at
all. `/align-tactics` accepts a **strategy** target only (`.claude/skills/
align-tactics/SKILL.md:41` "the sole argument is the id of the strategy").

The consequence, and why this tactic is author-boosted to the top of the
ordinary queue: **a boosted draft is inert** — boosting a draft cannot make it
run, because a draft is not a candidate. This tactic is the enabling capability
that makes every boosted draft selectable, so it must land first. (It is being
bootstrapped into `phase: implement` by a per-node `/align-tactics
<tactic-id>` session, the very capability it defines, per clarification 52 and
the memory `align-tactics-tactic-id-per-node-finalize`.)

The soft-freeze **detection** machinery already exists and is reused wholesale
(`isStrategyStale`/`isFingerprintStale`, `transitions.ts:384`/`:366`; the scan
at router.ts:234-254). What is missing is making frozen nodes *selectable
candidates that route to `/align-tactics`*, resolving a strategy entry to its
highest-ranked frozen descendant, a progression-ordinal tiebreak over the full
phase order, the execute-side gate + directive wiring for a `tactic:align-tactics`
target, and the `/align-tactics` skill text + spec reconciliation.

Greenfield-relevance gate: no live or superseded node owns this scope. The two
analogs — `tactic-phase-skill-node-targets` and `tactic-graph-router-transitions`
— are `phase: done` and non-overlapping (they re-keyed the *execution* phase
skills and the transition writer; this extends the same node-target pattern to
`/align-tactics` and the *selector*). `tactic-graph-eligibility-last-aligned`
(raw) also touches §3.1 but on the strategy fresh-reading gate, a distinct
mechanism; coordinate the §3.1 edit (Unit 5) with its wording but do not absorb
its scope.

## Units of work

### Unit 1 — Progression-ordinal tiebreak over the full phase order

**Recommended model:** opus

**Scope.** Replace the selection sort's secondary key — currently
`ladderIndex(a.phase)` over `PHASE_LADDER` (router.ts:344-350, `PHASE_LADDER`
defined router.ts:28-35, `ladderIndex` router.ts:173) — with a
**progression-ordinal** comparator over the full `PHASES` order
(`packages/intentionsutil/src/schema.ts:34-43`:
`draft < align-tactics < implement < fix < qa < review < main-qa < done`),
**more-progressed first**.

- Add a helper `progressionIndex(candidate, byId)` in router.ts near
  `ladderIndex` (router.ts:173): look up the underlying node via
  `byId.get(candidate.id)`; for a **strategy** use `"align-tactics"` (a
  strategy carries no persisted phase — its directive rung); for a **tactic**
  use `node.phase ?? "draft"`. Return `PHASES.indexOf(p)` (import `PHASES` from
  `./schema`). Sort **descending** on this index (higher = more progressed =
  preferred), preserving `rank` as the outermost key and `id` ascending as the
  final deterministic tiebreak.
- This intentionally reorders **fix vs qa** relative to the old ladder: the old
  `PHASE_LADDER` listed `fix` before `qa` (fix "closer to done"), but the
  `PHASES` progression is `implement < fix < qa < review`, so under this change
  `qa` is more-progressed than `fix` and sorts first. This matches the ordinal
  the strategy substance names verbatim; call it out in the commit message.
- `PHASE_LADDER`/`ladderIndex` become unused; remove them **only if** no other
  reference remains (grep the package first — `PHASE_LADDER` is currently
  imported by `packages/intentionsutil/test/router.test.ts:3-9`). Update
  `router.test.ts` to import/assert the progression ordering instead: replace
  any ladder-order assertion (e.g. a `fix`-before-`qa` expectation) with the
  progression order, and add a case asserting a **draft** tactic and a **done**
  tactic sort at the correct ends (draft last among selectable ties; `done`
  nodes are never candidates so only assert via the helper if unit-tested
  directly).

Out of scope: the frozen-candidate emission itself (Unit 2) — this unit only
changes the ordering primitive, keyed off whatever candidates exist.

**Dependencies:** none.

### Unit 2 — Frozen-node eligibility + strategy-entry resolution (selection core)

**Recommended model:** opus

**Scope.** In `selectGraphTargets` (router.ts:216-353), make frozen tactics
first-class candidates that route to `/align-tactics`, and add the
strategy→descendant resolver.

- **Emit draft/raw frozen candidates.** After the executable tactic-candidate
  loop (router.ts:259-273), emit a candidate for every tactic with
  `isDraft(t)` (router.ts:119) that is eligible — `t.office_hours === null`
  **and** `blockersComplete(t, byId)` (router.ts:165). Shape:
  `{ id: t.id, kind: "tactic", phase: "align-tactics", rank: attention.get(t.id)?.value ?? 0, pace_exempt: t.pace_exempt, pr: null, reevaluation: false }`.
  `phase: "align-tactics"` is the **directive rung** (mirrors the strategy
  candidate at router.ts:282), not the node's persisted phase — Unit 1's
  progression ordinal reads the *real* phase from `byId`, so a draft still sorts
  as `draft`.
- **Emit soft-frozen candidates instead of excluding them.** A soft-frozen
  tactic is an `isOpenTactic` already collected in `frozenTacticIds`
  (router.ts:245-248). Keep the exclusion in the *executable* loop
  (router.ts:262) so it does **not** route to its phase skill, and instead emit
  it as a re-eval `/align-tactics` candidate: same shape as above but
  `reevaluation: true` and `pr: t.execution?.pr ?? null`, gated on
  `t.office_hours === null && blockersComplete(t, byId)`.
- **Retarget the soft-freeze strategy branch.** Replace the
  `frozenStrategyIds` branch that emits `asCandidate(true)` for the *strategy*
  (router.ts:289-292): the re-evaluation now targets the frozen **tactics**
  directly (emitted above), not the strategy id. Keep the `freeze`
  `SelectionEvent` (router.ts:249-253) for logging; a purely-soft-frozen
  strategy no longer emits a strategy-kind `align-tactics` candidate.
- **Keep the strategy fresh-round path unchanged** (router.ts:295-340): a
  strategy with only draft children stays align-eligible for a full fresh round
  that consumes those drafts (drafts remain non-blocking, router.ts:297 uses
  `!isDraft`). This is the **additive** path from clarification 9's amendment —
  the strategy fresh-round candidate and its draft children's per-node
  candidates coexist and compete by `rank`; the claim keyed on the resolved
  node (Unit 3) dedupes same-node selection, and `graph-commit` serializes the
  rest. Do not attempt to suppress one in favor of the other.
- **Add exported `resolveFrozenDescendant(strategy, nodes): IntentionNode | null`**
  in router.ts, next to `strategyAlignSelectable` (router.ts:374). Returns the
  strategy's highest-ranked **eligible frozen descendant** — a
  `servingStrategyIds`-member (router.ts, via the `childrenOf` construction
  router.ts:226-232) tactic that is draft-or-soft-frozen, `office_hours` null,
  blockers complete — ranked by `resolveAttention` value with the Unit 1
  progression ordinal then `id` ascending as tiebreaks; `null` when the strategy
  has no such descendant (a zero-tactic strategy resolves to *itself*). This is
  the "strategy-entry resolution" primitive the spec and Unit 3 name; it is the
  single source of truth for the resolution, not re-derived at call sites.
- **Add exported `frozenTacticSelectable(tactic, nodes): boolean`**, the
  frozen-tactic analog of `strategyAlignSelectable` (router.ts:374): membership
  as a `kind: "tactic", phase: "align-tactics"` candidate in
  `selectGraphTargets(nodes).candidates`. Consumed by Unit 3's execute-side
  gate. Single-callsite doctrine — do not re-implement the eligibility gates.

Tests: extend `packages/intentionsutil/test/router.test.ts` (fixture builder
`anode(partial)`, router.test.ts:11) — a draft tactic and a soft-frozen tactic
each emit a `tactic:align-tactics` candidate; a parked / blocked draft does not;
a soft-frozen tactic does **not** also emit its phase-skill candidate;
`resolveFrozenDescendant` returns the highest-ranked descendant and `null` for a
zero-tactic strategy; `frozenTacticSelectable` agrees with candidate membership.

Out of scope: directive/script/gate wiring (Unit 3); SKILL.md/spec prose
(Units 4-5).

**Dependencies:** Unit 1 (the resolver and sort use the progression ordinal).

### Unit 3 — Execute-side gate + directive wiring for a `tactic:align-tactics` target

**Recommended model:** opus

**Scope.** Route a resolved frozen-tactic candidate to `/align-tactics
<tactic-id>` through the same no-pre-provision claim model the strategy lane
uses, and let the re-validation gate accept it.

- **Directive mapping** — `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:124-136`:
  add a case `tactic:align-tactics) SKILL="/align-tactics"; MODEL_PHASE="align-tactics" ;;`
  to the `case "$kind:$phase"` block.
- **Launch lane** — dispatch-graph-execute:147-175: the strategy lane
  (`if [[ "$kind" == "strategy" ]]`, :147) spawns `cwd=$PROJECT_ROOT` and lets
  `/align-tactics` claim its own worktree; the tactic lane pre-provisions a
  worktree (:162+). A `tactic:align-tactics` target must take the **no-pre-provision
  align lane** (the resolved node's worktree is claimed by `/align-tactics`
  Step 0, keyed on the tactic node id — the "claim keyed on the resolved node"
  requirement). Change the lane guard from `kind == strategy` to
  `kind == strategy || phase == align-tactics`, so a frozen-tactic align target
  spawns `cwd=$PROJECT_ROOT` with `"/align-tactics $id"`.
- **Sensor gate** — `.claude/skills/dispatch-propagate/scripts/graph-select-target`
  `sensor_gate` (:190-232): confirm `align-tactics` returns 0 / no gate keyed on
  *phase* (:193-194) so a `tactic:align-tactics` is gate-free like the strategy
  align arm; if the gate branches on `kind`, extend it. The `node <id> <kind>
  <phase>` print (:266) already emits `node <id> tactic align-tactics` correctly.
- **Re-validation gate** — `packages/intentionsutil/scripts/check-node-selection.ts`
  `evaluateSelection`: the phase check special-cases `selectedPhase ===
  "align-tactics"` and currently **rejects a tactic** ("selected align-tactics
  but ${nodeId} is a ${node.kind}, not a strategy", ~line 162-163) and requires
  `phase === null` (~line 165-166). Extend: for `selectedPhase ===
  "align-tactics"` accept a **tactic** node that is frozen-eligible, and replace
  the strategy-only align-eligibility re-check (`strategyAlignSelectable`, ~line
  182) with a `kind`-dispatched check — `strategyAlignSelectable` for a
  strategy, `frozenTacticSelectable` (Unit 2) for a tactic. A tactic whose phase
  has advanced past frozen (no longer draft, no longer stale) fails
  `frozenTacticSelectable` and correctly exit-12s as a stale selection. Import
  `frozenTacticSelectable` alongside `strategyAlignSelectable`
  (check-node-selection.ts:47).

Tests: extend `packages/intentionsutil/test/check-node-selection.test.ts` — a
frozen tactic selected at `align-tactics` passes; a tactic that advanced out of
frozen since selection exit-12s.

Out of scope: SKILL.md/spec prose (Units 4-5).

**Dependencies:** Unit 2 (`frozenTacticSelectable`, `resolveFrozenDescendant`).

### Unit 4 — `/align-tactics` accepts a tactic target (per-node finalize / re-plan)

**Recommended model:** opus

**Scope.** Extend `.claude/skills/align-tactics/SKILL.md` so a `tactic-<slug>`
argument is a first-class target, preserving the autonomous,
never-`AskUserQuestion` contract. This encodes the doctrine already relied on by
the memory `align-tactics-tactic-id-per-node-finalize` (clarification 52).

- **Trigger and input** (SKILL.md:39-43): the sole argument is a
  `strategy-<slug>` **or** a `tactic-<slug>` naming a **frozen** tactic
  (draft/raw, or soft-frozen). Replace "the sole argument is the id of the
  strategy" (:41) and "a strategy id is required" (:42-43) accordingly; keep
  "never selects its own target."
- **Step 0** (:45-69): target resolution accepts a tactic id; the claim /
  worktree / reservation is keyed on the target node id (already the uniform
  node-id rule), so a tactic target claims `.../worktrees/<tactic-id>`.
- **Per-node target path** — add a subsection governing a tactic target:
  - **Draft/raw tactic → finalize (Step-2 finalize path) into `phase:
    implement`** with a full clean-session plan in its body, scoped to **that
    one tactic**. Do **not** sweep the serving strategy's other drafts and do
    **not** bump the strategy's `rounds` (round accounting is completion-time,
    prod-verified — Step 5 "Strategy round accounting"). Whole-node reconcile
    (Re-evaluation mode's "Amendment completeness", condition 8): rewrite any
    stale draft narrative in `statement`/`rationale`/`attention.rationale`/body
    so it does not contradict the finalized state, **preserving the authored
    `attention.boost` value**. Frontmatter: `status: codified`, `phase:
    implement`, `execution: null`, `validates: []` unless the tactic produces
    the signal reading.
  - **Soft-frozen tactic → re-plan (Re-evaluation mode, per-node).** Reconcile
    the whole node against the current serving-strategy substance, re-stamp
    **only** the re-evaluated strategy's entry in
    `execution.strategy_fingerprint` (leaving other serving strategies'
    entries), and land via `graph-commit`. (A tactic still at `execution: null`
    has no map to re-stamp.)
  - Both land the **single** pre-existing node via `graph-commit --base`
    (dump it first with `dump-node.ts`); no strategy edit.
- **Re-evaluation mode** (:478-517): note that under frozen-tactic-dispatch the
  router may queue re-evaluation as a **per-node** `/align-tactics <tactic-id>`
  session targeting one soft-frozen tactic, not only a strategy-wide sweep.
- Preserve the born-parked / office-hours autonomy contract verbatim; a tactic
  target parks the **tactic** node on ambiguity.

Out of scope: the selector/gate code (Units 1-3); deleting `/plan-issue`.

**Dependencies:** none (skill prose; independent of the code units, though it
describes the behavior Unit 3 routes to).

### Unit 5 — Spec reconciliation in `tactic-graph-native-dispatch.md`

**Recommended model:** sonnet

**Scope.** Reconcile the spec §3.1 and the directive-per-node line to the
landed behavior (Units 1-3).

- **§3.1 Eligibility** (`intentions/tactic-graph-native-dispatch.md:326-350`):
  add a **frozen-node eligibility** clause — a frozen tactic (draft/raw, or
  soft-frozen per clarification 10) with `office_hours` null and `blocked_by`
  complete is eligible for an `/align-tactics` session, parallel to strategy
  eligibility. Clarify the existing tactic-eligibility line (:340-342, "`phase`
  is neither `draft` nor `done`") so it scopes to the tactic's **phase skill**
  only — a frozen tactic is ineligible for its phase skill but eligible for
  `/align-tactics`. Add **strategy-entry resolution** (a strategy with frozen
  descendants resolves to its highest-ranked frozen descendant; a zero-tactic
  strategy resolves to itself) and the **progression-ordinal tiebreak** (full
  `PHASES` order, more-progressed first — note it generalizes and replaces the
  closest-to-done `PHASE_LADDER`, reordering fix/qa). Reconcile the soft-freeze
  gate note (:344-350) so a frozen subtree's re-evaluation is a per-node
  `/align-tactics <tactic-id>` session, not a strategy-level one.
- **Directive per node** (:505-508): extend to "`/align-tactics <id>` for a
  strategy **or a frozen tactic**; the tactic's persisted `phase` mapped to its
  phase skill for a non-frozen open tactic."
- Coordinate wording with `tactic-graph-eligibility-last-aligned` (which also
  edits the §3.1 fresh-reading gate) to avoid a conflicting rewrite of the same
  lines; land only the frozen-node clauses here.

Out of scope: code (Units 1-3), SKILL.md (Unit 4).

**Dependencies:** Units 1, 2, 3 (the spec must describe the landed semantics).

## Reuse

- `selectGraphTargets`, `resolveAttention` (attention.ts:285), `strategyFingerprint`
  (router.ts:83), `isStrategyStale`/`isFingerprintStale` (transitions.ts:384/:366) —
  the soft-freeze detection is reused, not rebuilt.
- `isDraft` (router.ts:119), `isOpenTactic` (router.ts:125), `blockersComplete`
  (router.ts:165), `servingStrategyIds` + `childrenOf` (router.ts:226-232),
  `PHASES` (schema.ts:34-43), the strategy candidate shape (router.ts:279-287).
- `strategyAlignSelectable` (router.ts:374) as the template for
  `frozenTacticSelectable`.
- `evaluateSelection`/`readPhase` (check-node-selection.ts), the `case
  "$kind:$phase"` directive block and the no-pre-provision strategy lane
  (dispatch-graph-execute:124-154), `provision-node-worktree`.
- Test scaffold: `anode(partial)` fixture builder (router.test.ts:11), the
  existing `check-node-selection.test.ts` cases.
- `align-tactics-tactic-id-per-node-finalize` memory — the doctrine Unit 4
  encodes.

## Verification

Unit-level, machine-runnable (router/gate/attention suites):

```verify
npx vitest run --root . packages/intentionsutil/test/router.test.ts packages/intentionsutil/test/attention.test.ts packages/intentionsutil/test/check-node-selection.test.ts
```

Package typecheck (confirm the new exports and imports resolve):

```verify
npm run -w packages/intentionsutil typecheck
```

Graph validity of this node after finalize (and any nodes a real frozen-node
session later lands):

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual / observe-in-production (no CI harness for the shell scripts):

- Dry-run the selector against a store snapshot containing a boosted draft
  tactic (e.g. this repo's own `intentions/`): confirm `selectGraphTargets`
  now emits a `tactic:align-tactics` candidate for the draft and that
  `graph-select-target` prints `node <draft-id> tactic align-tactics`.
- Confirm `dispatch-graph-execute` on a `tactic:align-tactics` decision spawns
  `cwd=$PROJECT_ROOT` with `/align-tactics <id>` (the no-pre-provision lane) and
  does **not** call `provision-node-worktree`.
- Confirm `check-node-selection.ts <draft-id> align-tactics --dir intentions`
  exits 0 for a still-frozen tactic and exit-12s for one advanced out of frozen.
