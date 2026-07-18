---
id: tactic-fix-interrupt-orthogonal-state
kind: tactic
statement: "Model the CI-fix interrupt as orthogonal execution state, not a
  phase value: phase stays ladder-positional across a fix, and a post-review fix
  resets phase to review directly instead of reconstructing position from
  markers"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "Surfaced in the 2026-07-18 /align-strategy interview questioning the
  two-step fix->implement->qa transition (observed on
  tactic-fingerprint-recipe-single-callsite / PR #2885). The fix-as-phase model
  overloads the single `phase` scalar with two orthogonal jobs -- ladder
  position and CI-fix-active -- so entering `fix` destroys ladder position,
  forcing the lossy resumeAfterFix marker-reconstruction (transitions.ts:116)
  and the two-commit resume-then-advance. Greenfield direction
  (author-confirmed): split the scalar -- `fix` leaves the phase enum and the
  interrupt becomes an orthogonal execution.fix field. Finalized 2026-07-18 as a
  single atomic PR (author office-hours decision, this session): schema-additive
  execution.fix, transition/selector redesign, shell-layer repoint, then
  live-node migration + fix-enum removal in one cutover. Doctrine unchanged --
  fix is an interrupt (clarification 18) and unreviewed code must never merge
  after a fix (clarification 63); only the mechanism changes. No
  strategy-clarification amendment this round: finalizing/implementing changes
  no strategy fingerprint (strategyFingerprint at router.ts:89 hashes
  clarifications, not the schema PHASES enum), so it soft-freezes none of the
  strategy open children. The now-stale fix-as-phase framing in clarifications
  18/63, the 2026-07-04 main-qa ladder, and the phase ordinal is deferred
  record-hygiene for a later /align-strategy pass."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix as orthogonal interrupt state, not a phase value

## Context

The router models the CI-fix interrupt as a value of the `phase` enum
(`packages/intentionsutil/src/schema.ts:28`, `:38`). This overloads one scalar
with two orthogonal concerns: **ladder position** (`implement → qa → review →
main-qa → done`) and **fix-active** (is a CI-failure interrupt in flight). Because
`phase` is a single field, entering `fix` *destroys* the ladder position, so
`resumeAfterFix` (`transitions.ts:116-122`) reconstructs it from
`execution.markers` — lossy for an in-progress phase (a fix mid-`implement`, no
`planned` marker, resumes to `implement` then needs a *second* transition to
`qa`; observed on `tactic-fingerprint-recipe-single-callsite` / PR #2885 as
`fix → implement → qa`, two state-only commits). Worse, `resumeAfterFix` returns
`done`/`main-qa` directly when the `reviewed` marker is present
(`transitions.ts:118`), so a CI fix landing *after* review can auto-merge newly
pushed code without re-review.

**Greenfield direction (author-confirmed):** `fix` leaves the phase enum. `phase`
becomes purely ladder-positional and is never overwritten by a CI failure. A new
orthogonal, nullable `execution.fix` interrupt-state carries the two jobs the
phase overwrite was secretly doing: (a) **selector gating** — non-null tells the
selector "dispatch `/fix-checks`, not the phase worker"; and (b) a
**pending-CI concurrency guard** — a `pushed_sha` that survives the window
between the fix worker pushing and CI re-reporting, so a not-yet-green re-run is
not misread as "resume the phase worker." The one deliberate backward edge is
**re-review**: when `/fix-checks` pushes code and review has already completed,
the fix worker resets `phase → review` and disarms auto-merge (a correctness
move — new code must be reviewed). With `phase` preserved, the common
`fix → implement → qa` collapses to nothing: the node was at `implement`, stays
at `implement`, and takes one forward edge when implement completes.

**Shape:** one atomic PR (author decision). The change is backwards-incompatible
(dropping the `fix` enum value breaks any node at `phase: fix`), so the code and
the 2 live `phase: fix` nodes cut over together in a single merge rather than
across sequenced deploys — no window where the enum is half-removed. The units
below are additive-first so intermediate commits stay green; the enum removal and
live-node migration are the final cutover unit.

**Supersedes the interim marker-clear re-review.** `tactic-graph-selector-
reviewed-exclusion` (in flight, `phase: qa` at planning time) ships an interim
re-review-after-fix via *clearing the `reviewed` marker*; that mechanism will be
on `origin/main` by the time this implements. This tactic **replaces** it with
the direct `phase → review` reset of the greenfield design (Unit 2) — remove the
marker-clear path, keep the orthogonal selector-side reviewed-exclusion that
tactic also owns. Not a hard `blocked_by` (author note: "does NOT block or
duplicate"); merge order is naturally after the sibling.

**Out of scope (deliberately deferred — author decision this session):** the
stale *fix-as-phase framing* in `strategy-graph-native-dispatch` clarifications
18 / 63, the 2026-07-04 main-qa ladder clarification, and the phase-ordinal prose
in this spec node's body (`intentions/tactic-graph-native-dispatch.md` §3.1).
The greenfield preserves their doctrine; only incidental wording goes stale, and
nothing in code (`transitions.ts` / `router.ts` / `validate-graph`) reads that
prose. Editing the strategy's `clarifications` would change its fingerprint and
soft-freeze its ~16 open children, so it is left to a later `/align-strategy`
pass. **Do not edit strategy frontmatter or the spec node in this PR.**

## Units of work

### Unit 1 — Schema: add orthogonal `execution.fix` (additive, no removals)

**Scope.** In `packages/intentionsutil/src/schema.ts`:
- Add a nullable `FixState` to the `Execution` type (`schema.ts:339-345`):
  `fix: { since: string; attempt: number; pushed_sha: string | null } | null`.
  `since` = interrupt date (`date -u +%Y-%m-%d`), `attempt` = fix-attempt
  counter (replaces the `attempts["fix"]` convention), `pushed_sha` = the last
  SHA `/fix-checks` pushed (the pending-CI guard; null before the first push).
- Extend `validateExecution` (`schema.ts:422-433`) to validate `fix` (nullable
  object; string `since`, number `attempt`, nullable-string `pushed_sha`).
- Do **not** touch the `Phase` union (`:24-32`) or `PHASES` (`:34-43`) yet —
  `fix` stays in the enum through Units 1-3 so live nodes keep validating.
- Out of scope: transition/selector behavior, any removals.

**Recommended model:** sonnet — bounded, additive type + validator work with a
given shape.

**Dependencies:** none.

### Unit 2 — Transitions + router: drive the interrupt off `execution.fix`

**Scope.** Rewrite the fix machinery to read/write `execution.fix` and preserve
`phase`:
- `packages/intentionsutil/src/transitions.ts`:
  - `decideTransition` (`:166-212`): on `fixInterrupt` conditions
    (`ci === "failing"` at an interruptible ladder phase — reuse the
    `FIX_INTERRUPTIBLE` set semantics, `:95`), **set `execution.fix`** and
    **leave `phase` unchanged**, instead of returning `{ phase: "fix" }`
    (`:189`). On green CI with `execution.fix` set: **clear `execution.fix`**;
    if the node is past review (has the `reviewed` marker / merge-armed), reset
    `phase → review` and signal **disarm auto-merge** (the re-review edge);
    otherwise leave `phase` as-is. Still-red CI holds with `execution.fix`
    retained (replaces the `:198` stay-in-fix branch).
  - Delete `resumeAfterFix` (`:116-122`) and its marker-reconstruction — with
    `phase` preserved there is nothing to reconstruct. Retire the fix-specific
    `LADDER`/`forwardPhase` comments (`:59`, `:71`) referencing `fix`.
  - Extend `TransitionDecision` (`:127-143`) to express the fix write
    (set/clear `execution.fix`, `disarmAutoMerge`) and phase-preservation.
  - Keep `fixInterrupt` (`:105-107`) as the interrupt predicate (now gating an
    `execution.fix` write, not a phase overwrite) — or inline it; implementer's
    call.
- `apply-node-transition.ts` (invoked by `transition-node`): apply the new
  `execution.fix` set/clear + `disarmAutoMerge` writes.
- `packages/intentionsutil/src/router.ts`: candidate emission (`:289-303`)
  currently emits `phase` verbatim; ensure a node with `execution.fix` set is
  emitted as a **fix candidate** regardless of its preserved `phase`, and a node
  without it emits its `phase` worker. `progressionIndex` (`:194-199`) derives
  from `PHASES`; no change needed here (Unit 4 removes `fix` from `PHASES` and
  the ordinal self-adjusts). Retire the `fix` entry from the vestigial
  `PHASE_LADDER` (`:34`) if it is dead; otherwise leave for Unit 4.
- **Remove the interim marker-clear re-review** (from `tactic-graph-selector-
  reviewed-exclusion`, on main by now); the direct `phase → review` reset above
  replaces it. Preserve that tactic's orthogonal selector-side
  reviewed-exclusion (reviewed nodes are not re-emitted as review candidates).
- Update TS tests to the new semantics: `transitions.test.ts` (`fixInterrupt`
  `:87-98`, `resumeAfterFix` `:103-112` — remove, `decideTransition` fix cases
  `:141`/`:146`/`:152-153`, `incrementAttempt(e,"fix")` `:197-199`),
  `router.test.ts` (`:147`, `:663`, `:696`), `apply-node-transition.test.ts:78`.
  Add coverage for: fix preserves phase; post-review fix resets to review +
  disarms; pending-CI guard (`pushed_sha` set, CI not yet green → no duplicate
  dispatch, no premature resume).

**Recommended model:** opus — core orthogonal-state redesign; the re-review
correctness edge, the concurrency-guard semantics, and the selector precedence
are design-bearing and easy to get subtly wrong.

**Dependencies:** Unit 1 (needs the `execution.fix` field).

### Unit 3 — Shell dispatch layer: route the fix worker off `execution.fix`

**Scope.** Repoint every consumer that currently branches on `phase == "fix"`:
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:195` — the
  `sensor_gate` `fix|qa|review)` CI gate: gate the fix worker on `execution.fix`
  being set (or a live red-CI verdict), not on `phase == fix`.
- `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:126-135` —
  the `case "$kind:$phase"` phase→skill map (`tactic:fix → /fix-checks`, `:129`):
  dispatch `/fix-checks` when `execution.fix` is set, independent of the
  preserved `phase`.
- `packages/intentionsutil/scripts/check-node-selection.ts` — `SCOPE_CHAINED_PHASES`
  (`:61`) and the worker-start literal phase-equality gate (`:161-177`): admit a
  fix-selected node by its `execution.fix` state rather than `phase === "fix"`.
- `.claude/skills/fix-checks/SKILL.md:50-51` — the preamble hard-gate
  `if [ "$NODE_PHASE" != "fix" ]`: repoint to assert `execution.fix` is set at
  origin/main (and update the references at `:35,187,206,345,368`).
- Legacy gh-lane `fix-checks` label/PR-queue references (`dispatch-phase`,
  `dispatch-select-target`, `dispatch-mark-complete`, `dispatch-phase-model`,
  `dispatch-preflight.sh`) are the *label* phase, distinct from the graph enum —
  leave unless they read the graph node's `phase`.

**Recommended model:** opus — cross-cutting judgment across bash + a TS helper +
a SKILL gate; each consumer must be repointed to the correct new signal without
regressing the legacy label lane that shares the `fix-checks` name.

**Dependencies:** Units 1, 2 (the field exists and the transition writes it).

### Unit 4 — Cutover: migrate live nodes, then drop `fix` from the enum

**Scope.**
- One-time migration of every node currently at `phase: fix` to
  `(preserved phase + execution.fix)`, reconstructing the preserved phase from
  `markers` this once (the last use of the lossy mapping). Today:
  - `intentions/tactic-phase-standup-audit-lens.md` — `markers: []`, `pr: 2880`
    → preserved `phase: implement`, `execution.fix: { since, attempt: 1,
    pushed_sha: null }`.
  - `intentions/tactic-tailscale-shell-health-check.md` — `markers: [planned]`,
    `pr: 2874` → preserved `phase: qa`, `execution.fix` set as above.
  Re-scan for `^phase: fix$` at implement time (`grep -rl` in `intentions/`) in
  case new ones appeared; migrate all. Land these node edits through
  `write-node.ts` + `graph-commit` (never hand-edit YAML), preserving each
  node's body.
- Remove `"fix"` from the `Phase` union (`schema.ts:28`) and `PHASES`
  (`schema.ts:38`); the `requireOneOf(value.phase, PHASES, "phase")` check
  (`schema.ts:516`) then rejects any stray `phase: fix`.
- Delete now-dead fix-phase code: the vestigial `PHASE_LADDER` fix entry
  (`router.ts:34`) and any remaining `fix`-phase literals in `transitions.ts`
  not already removed in Unit 2.
- Final `validate-graph` clean and full suite green.

**Recommended model:** sonnet — mechanical given the explicit marker→phase
mapping and the single-line enum removals; the design decisions were made in
Units 1-2.

**Dependencies:** Units 1, 2, 3 (selector must read `execution.fix` before the
live nodes leave `phase: fix`; enum removal must follow the migration).

## Reuse

- `FIX_INTERRUPTIBLE` set + `fixInterrupt` predicate (`transitions.ts:95,105-107`)
  — the interrupt condition; reuse rather than re-deriving which phases interrupt.
- `PHASE_COMPLETION_MARKER` / `reviewed` marker (`transitions.ts:30,33-37`) — the
  "past review?" test for the re-review reset, and the one-time marker→phase
  reconstruction in Unit 4.
- `strategyFingerprint` (`router.ts:89`) — confirms this change touches no
  fingerprint input (hashes `clarifications`, not `PHASES`), so no soft-freeze.
- `write-node.ts` / `dump-node.ts` / `graph-commit` — the only sanctioned path
  for the Unit 4 live-node migration (frontmatter via `write-node`, land via
  `graph-commit --base`).
- `validateExecution` (`schema.ts:422-433`) — extend the existing validator; do
  not add a parallel one.

## Verification

```verify
npx vitest run --project packages/intentionsutil --root .
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual / observe-in-production:
- After Unit 4, `grep -rl '^phase: fix$' intentions/` returns nothing and no node
  fails validation.
- Drive a red-CI interrupt end-to-end on a scratch node: CI fails mid-`implement`
  → `execution.fix` set, `phase` stays `implement`, `/fix-checks` dispatched
  (not the implement worker); CI green → `execution.fix` cleared, node resumes at
  `implement` and takes a single forward edge (no `fix → implement → qa`
  double-commit).
- Post-review re-review edge: with a `reviewed`-marked node, a `/fix-checks`
  push resets `phase → review` and auto-merge is disarmed — newly pushed code
  cannot merge unreviewed (the `transitions.ts:118` defect is closed).
- Confirm the legacy gh-lane `fix-checks` label path still functions (shared
  name, distinct mechanism) — it must not regress.
