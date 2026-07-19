---
id: tactic-fix-interrupt-orthogonal-state
kind: tactic
statement: "Model the CI-fix interrupt as orthogonal execution state, not a
  phase value: phase stays ladder-positional across a fix, a post-review fix
  resets phase to review directly instead of reconstructing position from
  markers, and phase workers advance the ladder unconditionally while the
  selector scripts all CI-gated fix routing (no metered transition-time CI
  read)"
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
clarifications:
  - question: Should a phase-worker session read CI to decide its own forward
      transition, or advance the ladder unconditionally and let dispatch script
      the CI-gated fix routing at selection?
    answer: "Advance unconditionally. A phase worker completes its phase and takes
      its forward ladder edge (implement->qa, qa->review, review->arm-merge)
      without reading CI; the completion writer (decideTransition /
      transition-node) drops its CI-verdict sensor (the gh pr view head-SHA +
      CI-verdict REST round-trip at transition-node:107-114). All CI-gated fix
      routing moves to the selector (graph-select-target's sensor_gate,
      :190-215), which already reads CI at selection: concluded-red sets
      execution.fix and routes /fix-checks; concluded-green clears it (with the
      past-review re-review reset) and routes the phase worker; pending waits.
      Rationale: the transition-time read is redundant with the selector's own
      dispatch-ci-ready read and burns metered-session round-trips on a routing
      decision dispatch can script for free in owned code -- the
      strategy-token-economy standup-cost lever and
      strategy-graph-native-dispatch's thin-script doctrine. Traced consistent
      across every phase progression this session (implement->qa, qa->review,
      review->arm-merge -- safe CI-blind because GitHub gates the merge and a
      red verdict routes to fix/disarm before it can land -- and the fix
      interrupt from any phase). Refines Units 2 (decideTransition CI-blind,
      forward edges unconditional) and 3 (selector is the sole CI-routing
      authority, owning execution.fix set/clear). Recorded 2026-07-18
      /align-strategy interview (author direction)."
tooling_goals: []
success_signal: null
attention:
  boost: 63
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18): this node
    is the tracker of record for the fix-interrupt marker-write gap that cycles
    a tactic implement -> fix -> implement. Diagnosed live on
    tactic-align-provenance-lint-doctrine (PR #2894): a CI-failing implement
    completion fires the fix interrupt (transitions.ts:98) before the `planned`
    completion marker is written (apply-node-transition.ts advances-only marker
    rule), so resumeAfterFix([]) (transitions.ts:116) finds no marker and falls
    back to implement instead of qa. This node's greenfield fix — split `fix`
    out of the phase enum into an orthogonal execution.fix field so phase stays
    ladder-positional across a fix — removes the lossy marker reconstruction
    entirely. Sized against the composed selector rank (childless, empty
    blocked_by: rank = boost + 5.33; current max 67.33 on
    tactic-scope-inert-restamp-primitive at boost 62), so boost 63 gives 68.33 —
    strictly top of the selector frontier, verified via select-targets. The
    boost flows nowhere else (no blocked_by, no children)."
phase: review
execution:
  branch: tactic-fix-interrupt-orthogonal-state
  pr: 2905
  attempts: {}
  markers:
    - planned
    - qa-done
  strategy_fingerprint: null
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
new code must be reviewed — so the fix worker disarms auto-merge immediately at
push, and the selector resets `phase → review` on the next green (see the
"Metered vs. scripted" paragraph below for the metered-vs-scripted split). With
`phase` preserved, the common
`fix → implement → qa` collapses to nothing: the node was at `implement`, stays
at `implement`, and takes one forward edge when implement completes.

**Metered vs. scripted — advance unconditionally (author direction,
2026-07-18).** The phase worker's completion transition is **CI-blind**:
`decideTransition` / `transition-node` drop the CI-verdict sensor and take the
forward ladder edge (`implement → qa`, `qa → review`, `review → arm-merge`)
**unconditionally**, never reading CI and never setting `execution.fix`. All
CI-gated fix routing moves to the **selector** (`graph-select-target`'s
`sensor_gate`), which already reads CI at selection: a concluded-**red** verdict
sets `execution.fix` and routes `/fix-checks`; concluded-**green** clears it
(with the past-review re-review reset) and routes the phase worker; **pending**
waits. The transition-time read the worker used to pay (`gh pr view` for the
head SHA + a CI-verdict REST call, `transition-node:107-114`) is redundant with
the selector's own read (`dispatch-ci-ready`, `graph-select-target:190-215`) and
burns metered-session round-trips on a routing decision dispatch can script for
free in owned code — `strategy-token-economy`'s standup-cost lever and
`strategy-graph-native-dispatch`'s thin-script doctrine (selection/transition
mechanics live in owned, testable code). Traced consistent across **every** phase
progression this session (`implement→qa`, `qa→review`, `review→arm-merge`, and
the fix interrupt from any phase); the one wrinkle is that `review` arms
auto-merge CI-blind, which is safe because GitHub gates the actual merge and a
red verdict routes the node to fix (disarm + `phase → review`) before it can
land.

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
pass. Also deferred to that same pass (same soft-freeze reason): articulating the
**advance-unconditionally / selector-scripts-CI doctrine** as a first-class
`strategy-graph-native-dispatch` clarification. It is a sharpening of that
strategy's existing thin-script doctrine ("selection, transition, and
provisioning mechanics live in owned code"); the concrete design is fully carried
by this tactic's clarification + Units 2–3, so no strategy edit is owed now.
**Do not edit strategy frontmatter or the spec node in this PR.**

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
  - `decideTransition` (`:166-212`): make it **CI-blind** (author direction,
    2026-07-18 — see Context "Metered vs. scripted"). **Drop the `ci` parameter**
    from its forward-routing role: the forward ladder edge fires
    **unconditionally** (`implement → qa`, `qa → review`, `review → arm-merge`),
    never routed into `fix` by a verdict this function reads. Remove the
    `fixInterrupt`-drives-`{ phase: "fix" }` branch (`:188-189`) entirely — the
    transition no longer sets `execution.fix`. The freshness gates (scope-stale
    demotion, strategy-stale hold) stay. **`execution.fix` set/clear + the
    re-review reset move to the selector (Unit 3)** — they are no longer the
    completion transition's job.
  - Delete `resumeAfterFix` (`:116-122`) and its marker-reconstruction — with
    `phase` preserved there is nothing to reconstruct. Retire the fix-specific
    `LADDER`/`forwardPhase` comments (`:59`, `:71`) referencing `fix`.
  - `TransitionDecision` (`:127-143`) no longer carries any fix/CI field — it
    expresses only the unconditional forward edge, the demote, and the hold.
  - Keep `fixInterrupt` (`:105-107`) / `FIX_INTERRUPTIBLE` (`:95`) as the
    **interrupt predicate the selector calls** (which phases a red verdict may
    interrupt), not a transition-time branch — export them for Unit 3's selector
    use.
- `transition-node` (`:107-114`): **remove the CI-verdict sensor** (`gh_pr_view_rest`
  head SHA + `dispatch_ci_verdict_rest`) — the completion writer no longer reads
  CI. This is the metered round-trip the change eliminates.
- `apply-node-transition.ts`: drop the `--ci` input and the fix-write handling;
  it applies only the unconditional forward / demote / hold decision.
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

**Scope.** Repoint every consumer that currently branches on `phase == "fix"`,
and make the selector the **sole CI-routing authority** (the work moved out of
`decideTransition` in Unit 2):
- `.claude/skills/dispatch-propagate/scripts/graph-select-target:190-215` — the
  `sensor_gate` `fix|qa|review)` CI gate is where the concluded-CI verdict is now
  read and **acted on** (not just concluded-vs-pending). It must distinguish
  concluded-**red** from concluded-**green**, not just pending: on a concluded-red
  verdict at an interruptible phase (`fixInterrupt`/`FIX_INTERRUPTIBLE`, exported
  from Unit 2), **set `execution.fix`** and emit the node as a **fix candidate**;
  on concluded-green with `execution.fix` set, **clear `execution.fix`** — and if
  the node is past review (`reviewed` marker / merge-armed) reset `phase → review`
  and disarm auto-merge (the re-review edge) — then emit its phase worker; on
  concluded-green with no `execution.fix`, emit the phase worker; on pending,
  skip (unchanged). The `execution.fix` write lands through the graph-commit
  write path the selector already uses for its state writes (never a metered
  session). The `pushed_sha` pending-CI guard (Unit 1) is what lets the selector
  tell "fix worker pushed, CI not yet green" from "resume the phase worker."
  (The `/fix-checks` worker still **disarms auto-merge immediately** when it
  pushes post-review code — a safety action at push time — and records
  `pushed_sha`; the selector owns the `phase → review` reset on the next green.)
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
- Drive a red-CI interrupt end-to-end on a scratch node: the implement worker
  opens the PR and advances to `qa` **unconditionally** (no CI read in its
  completion transition); the PR's CI then fails → at the **next selection** the
  selector sets `execution.fix` and dispatches `/fix-checks` (not the qa worker),
  `phase` staying `qa`; CI green → the selector clears `execution.fix` and emits
  the `qa` worker (no `fix → implement → qa` double-commit, and no transition-time
  `gh pr view` / CI-verdict round-trip in any phase worker session).
- Post-review re-review edge: with a `reviewed`-marked node, a `/fix-checks`
  push resets `phase → review` and auto-merge is disarmed — newly pushed code
  cannot merge unreviewed (the `transitions.ts:118` defect is closed).
- Confirm the legacy gh-lane `fix-checks` label path still functions (shared
  name, distinct mechanism) — it must not regress.

## needs-main residue

Recorded by `/qa-fix` (PR #2905) — items only verifiable against merged
main/deployed production, not reproducible synthetically at QA time.

- **id:** 7
- **title:** Red-CI interrupt drives cleanly end-to-end on a scratch node across selector ticks
- **url_path:** current
- **expected_outcome:** The full interrupt->fix->reset cycle behaves as this
  node's own Verification section claims: the implement worker advances to
  `qa` unconditionally with no CI read in its completion transition; the PR's
  CI then fails and at the next selection the selector sets `execution.fix`
  and dispatches `/fix-checks` (not the qa worker), `phase` staying `qa`; CI
  green causes the selector to clear `execution.fix` and emit the `qa` worker
  (no `fix -> implement -> qa` double-commit, no transition-time CI-verdict
  round-trip in any phase worker session); and for a reviewed node, a
  `/fix-checks` push resets `phase -> review` and disarms auto-merge so newly
  pushed code cannot merge unreviewed.
- **finding:** planned deferral — this is an end-to-end live-selector
  behavior spanning a real CI failure/success cycle over multiple selector
  ticks; it cannot be reproduced synthetically at QA time (no scratch node /
  live selector tick loop available in a QA session) and is best observed in
  production/main-qa, exactly as this node's own Verification section marks
  it manual/observe-in-production.
