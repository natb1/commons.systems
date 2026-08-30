---
id: tactic-graph-router-conflict-routing
kind: tactic
statement: "Router recognizes a CONFLICTING pending-merge PR and routes a
  conflict worker: the selector reads a new mergeable sensor and sets/routes an
  orthogonal execution.conflict interrupt (parity with execution.fix) —
  CONFLICTING dispatches dispatch-conflict, MERGEABLE clears, UNKNOWN waits;
  execution.conflict.attempt caps then parks; the tick keeps only the no-worker
  merge action"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Surfaced in the 2026-07-19 /align-strategy interview (strategy
  clarification 85) confirming the graph-native router has no seam to detect a
  CONFLICTING pending-merge work-PR and route a conflict worker — the legacy
  dispatch lane buckets CONFLICTING to /fix-conflicts, but read-sensors.ts has
  no mergeable sensor, PHASES has no conflict phase, and the selector's only
  interrupt is the CI-fix (clarification 66). (Finalized 2026-07-22
  /align-tactics.) Decomposed into four PR-sized units (schema field,
  apply-conflict-state.ts primitive, router/selector/dispatch wiring,
  dispatch-auto-merge conflict-clear guard) — full plan in the body. blocked_by
  wires tactic-dispatch-conflict-branch-merge-lane (repointed 2026-07-27
  /align-strategy): Unit 3 dispatches /dispatch-conflict against a node id, so
  the lane answering that call must reproduce and resolve a live
  origin/main-vs-branch git conflict. The original gate,
  tactic-dispatch-conflict-greenfield, shipped as PR #2951 and was pruned — it
  did make /dispatch-conflict accept a node id (Lane 2), but Lane 2 explicitly
  does not reproduce a live git conflict: it services only graph-commit
  concurrent-edit parks carrying the mechanical-unresolved marker and refuses
  anything else, while Lane 1 does reproduce a live conflict but is
  worktree-derived and rejects node-id targets. Node-id acceptance alone
  therefore does not discharge this gate; the capability actually owed is
  tactic-dispatch-conflict-branch-merge-lane's node-id-targeted
  reproduce-and-resolve lane. The edge was left empty by the greenfield prune,
  which would have let this tactic ship into a lane that refuses every dispatch
  it makes. tactic-pending-merge-phase stays a compose-with, not a blocked_by:
  this tactic's design surfaces the reviewed-awaiting-merge state via the
  selector's existing shell-facing signal-phase mechanism (parity with how `fix`
  is surfaced today) rather than a persisted `pending-merge` phase value, so it
  does not need that draft tactic to land first — see the body's Dependencies
  section for the un-narrowed reasoning, retained verbatim from the original
  interview."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Is a merge conflict handled exactly like a failing CI check —
      interrupt phase progression, launch the conflict-resolution skill
      directly, and park the source node itself only when the skill cannot
      resolve it mechanically?
    answer: "(Recorded 2026-08-03, author-confirmed.) Yes, and that is this tactic's
      design as already written — this clarification ratifies it as the target
      and resolves one live contradiction against
      [[tactic-mechanical-park-producers]]. Four points. (1) PARITY IS EXACT.
      The conflict interrupt is the structural twin of the CI-fix interrupt, not
      a separate lane: `execution.conflict` mirrors `execution.fix`'s shape, the
      selector is the routing authority for both, and neither adds a `PHASES`
      value (clarification 66's precedent). Detecting a conflict interrupts
      phase progression and dispatches the resolver directly — the phase worker
      is never relied on to notice or fix it, exactly as a red check dispatches
      `/fix-checks` rather than waiting for the phase worker. (2) THE WORKER IS
      RANKED NORMALLY. A conflict worker is selected by the ordinary attention
      ranking against the SOURCE node, with no special lane, exemption, or
      priority carve-out. The source keeps its own rank throughout, because the
      interrupt is orthogonal execution state on the source rather than a
      separate node standing in for it. (3) THE WORKER ASSESSES, THEN PARKS ONLY
      IF AUTHOR ATTENTION IS REQUIRED. The conflict worker judges whether the
      resolution is mechanical (doable without author input) or whether the
      author's intention is not sufficiently recorded in the graph to resolve
      it. Mechanical → resolve, clear `execution.conflict`, proceed
      (materiality-scoped re-review per clarification 78). Author intention
      required → park. (4) THE PARK LANDS ON THE SOURCE NODE'S OWN
      `office_hours`, carrying the reason and the recommended next step — the
      same shape `/fix-checks` and `/qa-fix` already use for their own
      escalations. This is what this node's Plan already specifies (`park-node
      <id> conflict-attempt-cap \"<recommendation>\"` in
      `_gate_conflict_active`), and it now explicitly SUPERSEDES
      [[tactic-mechanical-park-producers]]' direction that this cap call
      `hold-node` instead of parking. No hold node, no `blocked_by` edge, and no
      attention-value indirection stands between a conflicted node and the human
      queue. Landing this tactic therefore also retires the two interim
      provision-conflict hold producers it converges on: `/dispatch-conflict`
      Lane 3's `hold-node --kind provision-conflict` escalation, and
      `dispatch-graph-execute` case 11's strike/hold ladder (whose own
      CONVERGENCE NOTE already anticipates being replaced wholesale). Both
      become a direct `park-node` on the source. The `hold-node` primitive
      itself is NOT deleted — it survives for the `fix-attempt-cap` producer and
      any future kind; see [[tactic-mechanical-park-producers]]' companion
      clarification for why that producer keeps the hold shape."
tooling_goals: []
success_signal: null
attention:
  boost: 12
  override: null
  rationale: "Author-directed 2026-08-03: prioritize bug-ledger fixes directly
    BELOW the token-efficiency cluster. Boost 12 resolves to 17.33 because an
    inbound distributor adds 5.33 — under that cluster's 20.00 and above the
    5.33 undecomposed baseline. Simulated over the live store before writing: 0
    tier changes, 0 value drift onto non-target nodes."
  tier: 1
phase: done
execution:
  branch: tactic-graph-router-conflict-routing
  pr: 3038
  attempts: {}
  markers:
    - planned
    - qa-done
    - reviewed
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-06T02:30:42Z
    mergeCommitSha: fa9c43386d00268005d874fd4f96f896cc7f7cb3
    graphCommitSha: null
validates: []
blocked_by:
  - tactic-dispatch-conflict-branch-merge-lane
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Router-side detect-and-route for a conflicting pending-merge PR

Finalized 2026-07-22 `/align-tactics` (from the 2026-07-19 `/align-strategy`
interview, strategy clarification 85). This is the **router-side
detect-and-route** half of the merge-conflict story; the resolution **worker**
is [[tactic-dispatch-conflict-branch-merge-lane]] (`blocked_by`, below — its
node-id-targeted reproduce-and-resolve lane is what lets `/dispatch-conflict`
answer this tactic's dispatch at all) and the wait phase it composes with (not
`blocked_by`, see Dependencies) is [[tactic-pending-merge-phase]].

## Context — the gap

The legacy dispatch lane recognizes a work-PR's GitHub `mergeable==CONFLICTING`
and buckets it to `/fix-conflicts` (`lib.sh` maps `mergeable` to the
`MERGEABLE`/`CONFLICTING`/`UNKNOWN` enum that `dispatch-phase` string-compares).
The **graph-native** router has no equivalent:

- `read-sensors.ts` reads CI/test status and git status only — **no `mergeable`
  sensor**.
- `PHASES` (`schema.ts`) is `draft, align-tactics, implement, qa, review,
  main-qa, done` — **no conflict phase**, and none should be added (see below).
- The selector's only interrupt is the CI-fix (`fixInterrupt`,
  `transitions.ts` → `execution.fix`); merge state is read nowhere.

So a reviewed node-lane PR that goes `CONFLICTING` fails the tick's
`mergeable==MERGEABLE` auto-merge precondition (strategy clarification 64) and
sits **silently unmerged with no worker dispatched**. Observed live on
`tactic-align-skills-dataviz-guidance` (2026-07-19).

## Target behavior (author-confirmed this interview)

The merge-conflict interrupt is the structural twin of the CI-fix interrupt and
is modeled the same way — as **orthogonal execution state**, per strategy
clarification 66 / [[tactic-fix-interrupt-orthogonal-state]].

- **Encoding:** new nullable `execution.conflict = {since, attempt}`, mirroring
  `execution.fix`'s shape. `phase` stays ladder-positional (at `pending-merge`,
  or post-review arm-merge in the interim) across the interrupt. **No conflict
  value in the `PHASES` enum** — the clarification-66 precedent that pulled
  `fix` out of the enum applies verbatim (a phase value overloads ladder
  position with interrupt-active).
- **Routing authority = the selector** (parity with "the selector reads
  `execution.fix` directly"). The selector reads the PR `mergeable` sensor at
  selection and branches three ways:
  - `CONFLICTING` → set `execution.conflict`, dispatch the conflict worker
    (`dispatch-conflict`);
  - `MERGEABLE` → clear `execution.conflict`, let the tick's no-worker
    `graph-auto-merge` land it (clarification 64);
  - `UNKNOWN` → wait, retry next tick (parity with the pending-CI guard) — never
    dispatch on `UNKNOWN` (GitHub computes mergeability async; dispatching would
    thrash).
  The tick reconciler keeps **only** the no-worker merge action; it does not
  route.
- **Reaction, not prevention:** detect a conflict when it manifests and route
  reactively. Continuously rebasing pending-merge PRs to pre-empt conflicts is
  explicitly **out of scope** — a silent rebase changes the merged result and
  invalidates the passed review.
- **Spin guard:** `execution.conflict.attempt` caps the interrupt (parity with
  the fix-checks attempt cap and legacy `/fix-conflicts`' cap of 3); at the cap
  the node parks to `office_hours`.
- **Re-review after resolution** (materiality-scoped, tied to the worker's
  mechanical-vs-intention verdict — clarification 78): a purely **mechanical**
  resolution (dispatch-conflict layers 1–3, content-preserving) clears
  `execution.conflict` and returns to `pending-merge` to merge; a resolution
  needing model reconciliation or author input (layers 4–5, new substance)
  resets `phase → review` and disarms auto-merge (clarification-66 backward
  edge), because it introduced code the completed review never saw.

## Scope pointers (for /align-tactics to plan)

- **Schema:** add nullable `execution.conflict = {since, attempt}` to
  `schema.ts` (+ validator), additive.
- **Sensor:** add a `mergeable` read to `read-sensors.ts` (PR-scoped, like the
  existing CI verdict read) — the enum `MERGEABLE`/`CONFLICTING`/`UNKNOWN`.
- **Selector:** in the sensor gate that already reads CI and sets/clears
  `execution.fix`, add the three-way `mergeable` branch that sets/clears
  `execution.conflict` and routes `dispatch-conflict`.
- **Tick:** unchanged except that its `MERGEABLE`-gated merge now also requires
  `execution.conflict` clear.
- **Shell layer:** the `dispatch-conflict` skill invocation is
  [[tactic-dispatch-conflict-branch-merge-lane]]'s scope, not re-implemented
  here.

## Dependencies (wired at finalization, 2026-07-22; repointed 2026-07-27)

`blocked_by: [tactic-dispatch-conflict-branch-merge-lane]` — Unit 3's
`dispatch-graph-execute` switch case dispatches `/dispatch-conflict` against a
**node id** for a PR whose GitHub `mergeable` is `CONFLICTING`, i.e. a live
`origin/main`-vs-branch git conflict. The lane that answers must both accept a
node id **and** reproduce that conflict in a worktree.

**Repointed 2026-07-27 `/align-strategy`.** The original gate was
`tactic-dispatch-conflict-greenfield`, on the reasoning that
`/dispatch-conflict` did not accept node-id targets at all. That tactic shipped
as PR #2951 and was pruned, and the `blocked_by` edge was cleared to `[]` with
it — but clearing was wrong, because node-id acceptance was only half the gate.
Greenfield shipped **Lane 2**, which does take a node id yet explicitly does
**not** reproduce a live git conflict: it services only `graph-commit`
concurrent-edit parks carrying the mechanical-unresolved marker, and hard-
refuses any node not in that state ("not a Lane 2-eligible park" —
`.claude/skills/dispatch-conflict/SKILL.md`). **Lane 1** does reproduce a live
conflict but is worktree-derived and rejects node-id targets. So with the edge
empty, this tactic would ship a dispatch call site that gets refused on every
invocation, burning `execution.conflict.attempt` up to the cap and then parking
— strictly worse than the silent-stall it replaces.

The capability actually owed is
[[tactic-dispatch-conflict-branch-merge-lane]]'s node-id-targeted
reproduce-and-resolve lane (finalized 2026-07-27, `phase: implement`). This
tactic's dispatch call site is genuinely gated on it landing first, so it is a
hard `blocked_by`, not a compose-with.

[[tactic-pending-merge-phase]] stays a **compose-with**, not a `blocked_by`
(unchanged from the original draft's reasoning): this tactic's design
(Unit 3) surfaces the reviewed-awaiting-merge state via the selector's
existing shell-facing signal-phase mechanism — parity with how the CI-fix
interrupt already surfaces the literal `"fix"` signal without a persisted
phase value (`router.ts:302-309`) — rather than via a persisted `pending-merge`
phase. It does not need that draft tactic to land first; if/when
`tactic-pending-merge-phase` does land, the `pending-merge` signal string this
tactic introduces composes with it directly (same name, no rework implied).

## Plan

### Context

Today a tactic PR that has passed review sits at `phase: review` carrying the
`REVIEWED_MARKER`, with gh auto-merge armed (`transition-node:161-168` runs
`gh pr ready` then `dispatch-auto-merge`). The tick-wide reconciler
`dispatch-auto-merge` merges it once GitHub reports `mergeable == MERGEABLE`.
If GitHub instead reports `CONFLICTING` (the PR branch drifted behind
`origin/main`), `dispatch-auto-merge` silently skips it (`dispatch-auto-merge:92`)
and the graph selector never sees it at all — `router.ts:298` filters every
reviewed-awaiting-merge node out of the candidate list entirely. The PR is
stuck forever: no merge, no re-route to conflict resolution. Observed live on
`tactic-align-skills-dataviz-guidance` (2026-07-19).

This tactic makes the **selector** the routing authority for that state, in
exact parity with how it already routes the orthogonal CI-fix interrupt
(`execution.fix`). It adds a nullable `execution.conflict = {since, attempt}`
field, a `mergeable` sensor read (piggybacked on the existing PR REST view — no
extra API call), and a three-way selector gate: `CONFLICTING` sets
`execution.conflict` and dispatches the conflict worker (`/dispatch-conflict`);
`MERGEABLE` clears/lets the tick's no-worker merge land it; `UNKNOWN` waits
(GitHub computes mergeability asynchronously — dispatching on `UNKNOWN` would
thrash). `execution.conflict.attempt` caps the interrupt (cap 3, matching the
legacy `/fix-conflicts`) then parks to `office_hours`. The conflict worker's
own mechanical-vs-intention verdict is consumed here as two clear modes: a
**mechanical** resolution clears the interrupt and returns to pending-merge to
merge; an **intention** resolution (needs model/author reconciliation) strips
the reviewed marker and disarms auto-merge, because it introduced code the
completed review never saw.

Key architectural fact driving Unit 3: a reviewed-awaiting-merge node is at
`phase: review` + `REVIEWED_MARKER` and is **filtered out** of candidates at
`router.ts:298`. For the selector to detect `CONFLICTING`, that node must be
surfaced to the selector shell as a candidate carrying a shell-facing signal
phase (`pending-merge`, or `conflict` once the interrupt is set) — exactly as
the fix interrupt surfaces the literal `"fix"` signal (`router.ts:305`), which
is not a member of the persisted `Phase` enum. **No `conflict`/`pending-merge`
value is added to `PHASES`** (same precedent that kept `fix` out).

### Reuse

- `gh_pr_view_rest` (`lib.sh:1093-1142`) — already computes
  `mergeable: MERGEABLE|CONFLICTING|UNKNOWN` (`:1132-1136`) in the same REST
  response `_read_pr_ci` already fetches. The `mergeable` sensor is a **new
  field read off an existing call**, no extra API round-trip.
- `dispatch_ci_verdict_rest` (`lib.sh:792-827`) — the passing/failing/pending CI
  read, already used by the selector; unchanged, referenced only for parity.
- `apply-fix-state.ts` (`packages/intentionsutil/scripts/apply-fix-state.ts`) —
  the exact structural template for the new `apply-conflict-state.ts` (arg
  parsing, `defaultExecution`, `readNode`/`writeNode` round-trip, exported pure
  function, JSON-on-stdout protocol, null-interrupt guards, re-review reset via
  `REVIEWED_MARKER` strip).
- `validateFixState` / `FixState` (`schema.ts:371-375, 499-509`) — template for
  `validateConflictState` / `ConflictState`.
- `_gate_maybe_interrupt` (`graph-select-target:237-251`) and `_gate_fix_active`
  (`:257-287`) — templates for the two new conflict gates.
- `park-node` (`packages/intentionsutil/scripts/park-node`) — writes
  `office_hours` and lands via `graph-commit`; called at the attempt cap.
- `_graph_commit_fix` helper (`graph-select-target:213-216`) — the on-main
  state-write commit wrapper; reuse the same pattern for conflict-state
  commits.
- `check-node-selection.ts:222-229` (the `selectedPhase === "fix"`
  interrupt-presence arm) — template for the `conflict` arm.
- `listNodes` (`packages/intentionsutil/src/store.js`) — for the new
  `list-conflict-nodes.ts` helper.
- `dispatch-complete-phase` / the `dispatch:reviewed` label and `gh pr ready
  --undo` disarm are already correct and **out of scope** — do not touch
  (`review-fix` applies the label on completing review, matches both lanes;
  `--undo` flips the PR back to draft, which `dispatch-auto-merge:91` already
  gates on).

### Unit 1 — Schema field + attempt-cap constant

**Recommended model:** sonnet (mechanical additive schema/type mirror of an
existing pattern).

**Scope:**
- `packages/intentionsutil/src/schema.ts`:
  - Add a `ConflictState` interface mirroring `FixState` (`:371-375`) but with
    **only** `{ since: string; attempt: number }` — no `pushed_sha` (conflicts
    have no pending-CI-sha guard). Add a doc comment above it (mirror
    `:364-370`) explaining it's the pending-merge conflict interrupt,
    orthogonal to `phase`.
  - Add `conflict?: ConflictState | null` to the `Execution` interface next to
    `fix` (`:389`), with the same optional-not-just-nullable doc rationale
    (`:383-388`): existing `Execution` object literals predate the field;
    `validateExecution` always populates it.
  - Add `validateConflictState(value, field)` mirroring `validateFixState`
    (`:499-509`), minus the `pushed_sha` line: `since` via `requireDateString`,
    `attempt` via `requireNonNegativeInt`.
  - Add `conflict: validateConflictState(value.conflict, ...)` to
    `validateExecution` next to the `fix:` call (`:521`).
- `packages/intentionsutil/src/transitions.ts`:
  - Add `export const CONFLICT_ATTEMPT_CAP = 3;` next to `FIX_INTERRUPTIBLE`
    (`:98`), with a one-line doc comment (spin guard; matches legacy
    `/fix-conflicts`' cap of 3).
  - Add `export function conflictInterrupt(mergeable: string): boolean { return
    mergeable === "CONFLICTING"; }` next to `fixInterrupt` (`:109-111`), with a
    doc comment: this is the selector's mergeable-routing input, orthogonal to
    `phase`; `MERGEABLE`/`UNKNOWN` never fire (the latter waits — mergeability
    is computed asynchronously).
- `packages/intentionsutil/src/index.ts`:
  - Export `ConflictState` type in the same block `FixState` is currently
    surfaced from — check whether schema types are re-exported from
    `index.ts` at all before adding; if `apply-fix-state.ts` imports `FixState`
    directly from `../src/schema.js`, prefer matching that (direct import) over
    inventing a new `index.ts` export path.
  - Export `CONFLICT_ATTEMPT_CAP` and `conflictInterrupt` value from the
    `transitions.js` value block (`:31` sibling).
- **Out of scope:** any routing/gate/shell logic; touching `PHASES` or the
  `Phase` union (`schema.ts:36-53`) — the interrupt is orthogonal, no enum
  member is added.

**Tests:** add `execution.conflict` round-trip cases to
`packages/intentionsutil/test/schema.test.ts` (valid `{since, attempt}`, `null`,
absent-defaults-to-null, malformed `attempt`/`since` rejected) mirroring the
existing `fix` cases; add `conflictInterrupt` + `CONFLICT_ATTEMPT_CAP` cases to
`transitions.test.ts`.

**Dependencies:** none.

### Unit 2 — `apply-conflict-state.ts` state-mutation primitive

**Recommended model:** opus (verdict-dependent clear semantics, re-review-reset,
and cap logic are judgment-heavy; the mechanical-vs-intention split is the
design's subtlest point).

**Scope:**
- New file `packages/intentionsutil/scripts/apply-conflict-state.ts`,
  structured as a sibling of `apply-fix-state.ts` (same header-doc style,
  `parseArgs`/`applyConflictState`/`main`, `defaultExecution`, exported pure
  function returning one JSON object on stdout, pure of git/gh — caller lands
  the write via `graph-commit`). Modes (mutually exclusive, mirror
  `apply-fix-state`'s `setMode` guard):
  - `--set-conflict` — enter the interrupt. Writes `execution.conflict = {
    since: <today UTC>, attempt: 1 }` when none set; a defensive double-call
    bumps `attempt`, preserves `since` (parity with `--set-fix`,
    `apply-fix-state.ts:153-164`). Called by the selector on first
    `CONFLICTING` detection.
  - `--spend-attempt` — bump `execution.conflict.attempt` by 1, preserve
    `since`. Errors if `execution.conflict` is null (null-guard parity with
    `--record-push`). Called by the selector each tick it re-observes
    `CONFLICTING` on an already-set interrupt (a prior worker run did not
    resolve it).
  - `--park-if-capped` — report only: prints `{ capped: <attempt >=
    CONFLICT_ATTEMPT_CAP>, attempt }`. Does **not** itself park (the shell
    caller runs `park-node`). Imports `CONFLICT_ATTEMPT_CAP` from
    `../src/transitions.js`.
  - `--clear-conflict-mechanical` — resolve mechanically: set
    `execution.conflict = null`, **preserve** `phase` and `REVIEWED_MARKER`
    (the node returns to the pending-merge/awaiting-merge state;
    `dispatch-auto-merge` lands it once `MERGEABLE`). Null-guard: error if
    `execution.conflict` is already null. Prints `{ mode: "clear", reset:
    false, phase: <unchanged> }`.
  - `--clear-conflict-intention` — resolve with re-review: set
    `execution.conflict = null`, keep `phase` at `review` but **strip
    `REVIEWED_MARKER`** from `execution.markers` (parity with
    `apply-fix-state.ts:184-187` — strip only the reviewed marker; keep
    `qa-done`/`planned`), so the review pass actually re-runs. Null-guard as
    above. Prints `{ mode: "clear", reset: true, phase: "review" }`. (The shell
    caller additionally runs `gh pr ready --undo` to disarm the live
    auto-merge; that disarm is a shell concern, not this script's.)
- Export `applyConflictState` so the store round-trip is unit-testable without
  spawning a process (parity with `applyFixState`).
- **Out of scope:** any `pushed_sha`/record-push mode (conflicts have no
  pending-sha guard); invoking `park-node` or `gh` (pure of git/gh); the shell
  wiring (Unit 3); which clear mode the *worker* chooses (that verdict is
  `tactic-dispatch-conflict-branch-merge-lane`'s — this unit only provides the
  two clear primitives it will call).

**Tests:** new `packages/intentionsutil/test/apply-conflict-state.test.ts`
mirroring `apply-fix-state.test.ts`: set (fresh + double-call bump),
spend-attempt (bump + null-guard error), park-if-capped (below/at/over cap),
clear-mechanical (marker+phase preserved), clear-intention (marker stripped,
phase stays review), and the null-clear guards.

**Dependencies:** Unit 1 (needs `ConflictState`, `execution.conflict`,
`CONFLICT_ATTEMPT_CAP`).

### Unit 3 — Router surfacing + three-way selector gate + dispatch switch case

**Recommended model:** opus (the crux: cross-cutting change across the pure
router, the selection shell, the execute-side validator, and the worker-spawn
switch; requires the `router.ts:298` surfacing decision and the
mergeable-race reasoning).

**Scope:**
- `packages/intentionsutil/src/router.ts`:
  - `:298` — replace the reviewed-awaiting-merge **filter** (`continue`) with
    a candidate **push** carrying a shell-facing signal phase, so the selector
    shell can read the `mergeable` sensor on these nodes. Preserve the
    property that a reviewed node is **never** re-emitted as a `review`
    candidate.
  - `:305` — extend the phase-signal precedence to: `execution.fix != null ?
    "fix" : execution.conflict != null ? "conflict" : (reviewed-awaiting-merge
    ? "pending-merge" : t.phase)`. The `pending-merge` signal is emitted only
    for the node the `:298` guard used to drop (`phase === "review" &&
    markers.includes(REVIEWED_MARKER)`); a node under an active conflict
    interrupt (`execution.conflict != null`) emits `conflict` directly. Add a
    doc comment mirroring `:302-304` (these are shell-facing signal strings,
    NOT `Phase` enum members). No new `GraphCandidate` field is needed — the
    shell resolves conflict state from the node via `apply-conflict-state`,
    exactly as it resolves fix state (no analogue to `fix.pushed_sha` is
    required).
  - Update `router.test.ts` for the new candidate emission (a
    reviewed-conflict-free node now emits `pending-merge`; a reviewed node
    with `execution.conflict` set emits `conflict`; a reviewed node is never
    emitted as `review`).
- `packages/intentionsutil/scripts/check-node-selection.ts`:
  - `:222-229` sibling — add a `selectedPhase === "conflict"` arm that
    replaces the `phase`-equality check with an **interrupt-presence gate**: a
    `conflict` selection validates iff `execution.conflict != null` (a null
    interrupt means it resolved since selection → `EXIT_STALE_SELECTION`),
    exactly mirroring the `fix` arm. `pending-merge` is never a dispatched
    `selectedPhase` (the gate turns it into `conflict` or a skip), so it needs
    no arm here. Update `check-node-selection.test.ts`.
- `.claude/skills/dispatch-propagate/scripts/graph-select-target`:
  - `_read_pr_ci` (`:220-229`) — add a `_CI_MERGEABLE` global, reset it
    alongside the others (`:222`), and populate it from the **same** `$pv` via
    `jq -r '.mergeable // empty'` (no extra API call — `gh_pr_view_rest`
    already emits `.mergeable`).
  - Add `_gate_pending_merge <id> <pr>` (parity with `_gate_maybe_interrupt`,
    `:237-251`): `_read_pr_ci`; if `_CI_MERGED` non-empty return 1; branch on
    `_CI_MERGEABLE` — `CONFLICTING` → `apply-conflict-state --set-conflict` +
    `graph-commit` (reuse the `_apply_fix`/`_graph_commit_fix` wrapper pattern
    `:207-216`, add analogous `_apply_conflict`/`_graph_commit_conflict`
    helpers) then `return 0` (caller emits `conflict`); `MERGEABLE` → `return
    1` with reason `mergeable-clean` (let `dispatch-auto-merge` land it);
    `UNKNOWN`/empty → `return 1` with reason `mergeable-unknown` (wait, retry
    next tick); write/commit failure → `return 3`.
  - Add `_gate_conflict_active <id> <pr>` (parity with `_gate_fix_active`,
    `:257-287`): `_read_pr_ci`; if `_CI_MERGED` non-empty return 1
    (`pr-merged-awaiting-reconcile`); branch on `_CI_MERGEABLE` — `CONFLICTING`
    → run `apply-conflict-state --park-if-capped`; if `capped` →
    `park-node <id> conflict-attempt-cap "<recommendation>"` then `return 1`
    (`conflict-capped-parked`); else `apply-conflict-state --spend-attempt` +
    `graph-commit` then `return 0` (re-dispatch the worker, emit `conflict`).
    `MERGEABLE` → defensive self-heal of a stale interrupt:
    `apply-conflict-state --clear-conflict-mechanical` + `graph-commit`, then
    `return 1` (`conflict-cleared-mergeable`; `dispatch-auto-merge` takes it).
    Add a comment explaining WHY mechanical is the safe self-heal here:
    reaching this arm means the node still carries `REVIEWED_MARKER` (an
    intention resolution would have stripped it, making the node a fresh
    `review` candidate, not a `conflict` candidate), so no re-review is owed.
    `UNKNOWN` → `return 1` (`mergeable-unknown`, wait). The clear-mechanical /
    clear-intention calls tied to the worker's *verdict* are the worker's
    (`tactic-dispatch-conflict-branch-merge-lane`) — this gate only sets,
    retries, self-heals, and parks.
  - `sensor_gate` `case "$phase"` (`:294-352`) — add a `pending-merge)` arm
    calling `_gate_pending_merge` (emit `conflict` on rc 0), and a `conflict)`
    arm calling `_gate_conflict_active`, mirroring the existing `fix)` arm
    (`:297-299`) and the rc-0/1/3 handling in the `implement`/`qa|review` arms
    (`:305-318`).
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute`:
  - `:128-143` switch — add `tactic:conflict) SKILL="/dispatch-conflict";
    MODEL_PHASE="conflict" ;;` mirroring `tactic:fix` (`:132`). **Verify the
    live skill name at implement time**: `tactic-dispatch-conflict-rename` may
    not have landed yet — `ls .claude/skills/ | grep -iE 'conflict'`; if the
    directory is still `fix-conflicts`, use `/fix-conflicts` and leave a
    comment noting the rename tactic will update it. `MODEL_PHASE="conflict"`
    falls through `dispatch-phase-effort` to its empty default (inherit
    session effort) — confirm it does not hard-fail on an unknown phase (it
    returns `""` per `:147`); no `dispatch-phase-effort` change required.
- **Out of scope:** `apply-conflict-state`'s internals (Unit 2);
  `dispatch-auto-merge`'s guard (Unit 4); the conflict worker's resolution
  ladder and its choice of clear mode; adding a `pending-merge` value to
  `PHASES`.

**Dependencies:** Unit 1 (schema field, `conflictInterrupt`), Unit 2
(`apply-conflict-state.ts` modes).

### Unit 4 — `dispatch-auto-merge` conflict-clear guard

**Recommended model:** opus (cross-process concurrency: the load-bearing race
between the per-node selector pass and the tick-wide merge reconciler).

**Scope:**
- New file `packages/intentionsutil/scripts/list-conflict-nodes.ts` — reads
  `listNodes(dir)`, filters to nodes with `execution.conflict != null` **and**
  a non-null `execution.pr`, and prints one `execution.pr` number per line (the
  PR numbers currently under a conflict interrupt). Small, single-purpose,
  exported filter function for unit testing.
- `.claude/skills/dispatch-propagate/scripts/dispatch-auto-merge`:
  - After the config gate / before or alongside the PR fetch (`:66-75`),
    capture the conflict-PR set **once** (one `npx tsx list-conflict-nodes.ts
    --dir <intentions>` spawn) into a shell set/assoc-array. Resolve the
    intentions dir the same way the other graph scripts do
    (project-root-relative).
  - In the per-PR loop, add a gate after the `MERGEABLE` check (`:92`) and
    before the merge (`:106`): if the PR number `$N` is in the conflict set →
    `continue` (skip). Add a comment explaining this is **load-bearing, not
    defense-in-depth**: a node can flip `CONFLICTING → MERGEABLE` (GitHub
    recomputes mergeability, or a rebase races in) while `execution.conflict`
    is still set and the worker's verdict is unconsumed; merging then would
    land conflict-resolution code the completed review never saw. The
    `intention` re-review path is already covered by the `gh pr ready --undo`
    draft-flip (`:91` `isDraft==false` gate) and the stripped
    `dispatch:reviewed` label — this guard closes the remaining window where
    the interrupt is set but the PR is not yet dispositioned.
- **Out of scope:** changing the readiness predicate, the closing-set guard,
  or the merge mechanics; the selector-side set/clear (Units 2/3). This guard
  only *reads* `execution.conflict` state; it never mutates the graph.

**Tests:** unit-test `list-conflict-nodes`'s filter (nodes with/without
`execution.conflict`, with/without `execution.pr`). `dispatch-auto-merge` is a
shell reconciler with no unit harness — cover via `bash -n` syntax check and
the manual verification below.

**Dependencies:** Unit 1 only (needs `execution.conflict` in the schema).
Independent of Units 2/3 — can land in parallel.

## Verification

Auto-runnable (confirmed live against this worktree — 32 test files, 586 tests
pass today; the vitest project token is the workspace-relative dir string
itself, `packages/intentionsutil`):

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
bash -n .claude/skills/dispatch-propagate/scripts/graph-select-target || exit 1
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-auto-merge || exit 1
bash -n .claude/skills/dispatch-propagate/scripts/dispatch-graph-execute
```

Per-unit auto checks:
- Units 1/2/4: the vitest command above must stay green with the new
  `schema.test.ts`, `transitions.test.ts`, `apply-conflict-state.test.ts`, and
  `list-conflict-nodes` cases.
- Unit 3: `router.test.ts` and `check-node-selection.test.ts` must reflect the
  new candidate emission and the `conflict` selection arm.

Manual / judgment verification (cannot be automated — needs a live GitHub PR
whose mergeability GitHub actually computes):

1. **CONFLICTING dispatch:** create a reviewed graph-tactic PR (armed for
   merge, `phase: review` + `REVIEWED_MARKER`), then push a conflicting change
   to `origin/main` so GitHub marks the PR `CONFLICTING`. Run the selector
   (`graph-select-target`) and confirm it (a) sets `execution.conflict =
   {since, attempt:1}` on the node, commits it to `origin/main`, and (b) emits
   the node as a `conflict` candidate that `dispatch-graph-execute` maps to
   `/dispatch-conflict` (or `/fix-conflicts` pre-rename).
2. **MERGEABLE clears/merges:** with `execution.conflict` set, resolve the
   conflict so GitHub reports `MERGEABLE`; confirm the selector's `conflict`
   arm self-heals (clears the interrupt mechanically) and `dispatch-auto-merge`
   then lands the PR.
3. **UNKNOWN waits:** immediately after a push (while GitHub still reports
   `mergeable: null`/`UNKNOWN`), confirm the selector neither sets the
   interrupt nor dispatches — it skips with `mergeable-unknown` and retries
   next tick.
4. **Attempt cap parks:** simulate repeated unresolved `CONFLICTING`
   observations (or set `execution.conflict.attempt` to
   `CONFLICT_ATTEMPT_CAP - 1` and re-run) and confirm the node parks to
   `office_hours` via `park-node` instead of re-dispatching.
5. **Re-review reset (intention path):** have the conflict worker call
   `apply-conflict-state --clear-conflict-intention`; confirm the node stays
   at `phase: review`, loses `REVIEWED_MARKER`, is re-selected as a fresh
   `review` candidate, and that `dispatch-auto-merge` does **not** merge it
   (draft-flipped + interrupt/marker state).
6. **Merge-race guard:** with `execution.conflict` set on a node whose PR
   GitHub reports `MERGEABLE` (the race window), run `dispatch-auto-merge`
   directly and confirm it skips that PR (does not merge while the interrupt
   is unconsumed).

