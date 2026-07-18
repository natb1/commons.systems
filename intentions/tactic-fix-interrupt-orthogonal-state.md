---
id: tactic-fix-interrupt-orthogonal-state
kind: tactic
statement: "Model the CI-fix interrupt as orthogonal execution state, not a
  phase value: phase stays ladder-positional across a fix, and a post-review fix
  resets phase to review directly instead of reconstructing position from
  markers"
owner: ai
status: raw
parent: tactic-graph-native-dispatch
rationale: "Surfaced in the 2026-07-18 /align-strategy interview questioning the
  two-step fix->implement->qa transition (observed on
  tactic-fingerprint-recipe-single-callsite / PR #2885). The fix-as-phase model
  overloads the single `phase` scalar with two orthogonal jobs -- ladder
  position and CI-fix-active -- so entering `fix` destroys ladder position,
  forcing the lossy resumeAfterFix marker-reconstruction (transitions.ts:116)
  and the two-commit resume-then-advance. Author confirmed the greenfield
  direction: split the scalar. Draft (retain-not-refine); a later /align-tactics
  round decomposes it into PR-sized units. Doctrine unchanged -- fix is an
  interrupt (clarification 18) and unreviewed code must never merge after a fix
  (clarification 63); only the implementation mechanism changes, so no
  strategy-clarification amendment (which would soft-freeze the ~20 open child
  tactics of strategy-graph-native-dispatch)."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Fix as orthogonal interrupt state, not a phase value

Draft retained by the 2026-07-18 `/align-strategy` interview
(retain-not-refine, strategy clarification 6). A later `/align-tactics` round
decomposes this into PR-sized units and writes the clean-session plans. This
body carries the design decision and its consequences, not a finalized plan.

## Problem

The current router models the CI-fix interrupt as a value of the `phase` enum
(`packages/intentionsutil/src/schema.ts:28`). This overloads one scalar with
two orthogonal concerns:

1. **ladder position** — where on the success ladder the work sits
   (`implement → qa → review → main-qa → done`), and
2. **fix-active** — whether a CI-failure interrupt is currently in flight.

Because `phase` is a single field, entering `fix` **destroys** the ladder
position. The code then has to *reconstruct* it from `execution.markers`:
`resumeAfterFix` (`packages/intentionsutil/src/transitions.ts:116`) reads the
completion markers (`planned`/`qa-done`/`reviewed`) to guess where to resume.
That reconstruction is lossy for an *in-progress* phase — a fix that interrupts
mid-`implement` (no `planned` marker yet) resumes to `implement`, then needs a
*second* transition to advance to `qa`. Observed live on
`tactic-fingerprint-recipe-single-callsite` / PR #2885: `fix → implement → qa`,
two state-only commits on `main` to express "CI went green, carry on."

**Correctness defect the current model carries** (grounded in
`transitions.ts:118`): `resumeAfterFix` returns `done`/`main-qa` directly when
the `reviewed` marker is present, so a CI fix that lands *after* review has
completed can auto-merge its newly-pushed code **without re-review**. Strategy
clarification 63 (2026-07-18) records the requirement that closes this
("unreviewed code must never reach merge") and its interim mechanism (fix
dispatch clears the `reviewed` marker), but neither is implemented in
`transitions.ts` yet. See the reconciliation note below.

## Greenfield design (fix leaves the phase enum)

Split the overloaded scalar into two orthogonal fields.

1. **`fix` leaves the phase enum.** `phase` becomes purely ladder-positional:
   `implement → qa → review → main-qa → done`. It is never overwritten by a CI
   failure.
2. **A new orthogonal `execution.fix` interrupt-state** (nullable; shape TBD at
   plan time, e.g. `{ since, attempt, pushed_sha }`). This is the state a node
   must retain for an in-progress fix. It does two jobs the phase overwrite was
   secretly doing:
   - **selector gating** — it tells the selector "dispatch `/fix-checks`, not
     the phase worker," and
   - **pending-CI concurrency guard** — it survives the window between the
     fix worker pushing and CI re-reporting, so a not-yet-green re-run is not
     misread as "resume the phase worker" and a duplicate fix worker is not
     spawned. (The worktree live-session lock already prevents two concurrent
     workers on one node; this field carries the intent *across* the ticks when
     no session is live.)
3. **Selector precedence made explicit in data.** `execution.fix` active (or a
   live red CI verdict) → fix worker; else → the phase worker for the preserved
   `phase`. This is the same "CI verdict is checked BEFORE phase logic"
   precedence the current `fixInterrupt` comment already admits
   (`transitions.ts:98-107`) — the redesign moves it out of a phase overwrite
   and into an orthogonal field the selector reads.
4. **One deliberate backward edge (re-review).** When `/fix-checks` pushes code
   and review has already completed (reviewed / merge-armed / `main-qa`), the
   fix worker resets `phase → review` **and disarms auto-merge**. This is a
   correctness move (new code must be reviewed), not a resume mechanism. When
   the interrupt fires *before* review completes, `phase` is already at
   `implement`/`qa`/`review` and is simply preserved — no special handling.
5. **No `resumeAfterFix`, no marker-reconstruction, no two-step.** CI green +
   no fix pending → clear `execution.fix`; the node is *already* at its correct
   `phase` and the next tick takes its single normal forward edge. In the
   common case `fix → implement → qa` collapses to *nothing*: the node was at
   `implement`, stays at `implement`, and takes one forward edge when implement
   completes.
6. **`execution.markers` loses its load-bearing fix role.** Markers existed to
   let `resumeAfterFix` reconstruct position; with `phase` preserved they are
   no longer needed for the fix path. Whether to retire them entirely or keep
   them for audit/idempotency (the reconciler and the reviewed-exclusion
   selector still read `reviewed`) is a plan-time call for `/align-tactics` —
   note the coupling with `tactic-graph-selector-reviewed-exclusion` below.

## Brownfield migration (backwards-incompatible, multi-PR)

Dropping the `fix` enum value breaks any node currently at `phase: fix`, so the
change is sequenced:

1. **Additive schema.** Add `execution.fix` to the schema and validator; ships
   first, changes no behavior.
2. **Dual-read transition/selector.** Teach `decideTransition` and the selector
   to read `execution.fix`, keeping `phase: "fix"` working in parallel.
3. **One-time migration.** Migrate any live `phase: fix` node to `(preserved
   phase + execution.fix set)`, reconstructing the preserved phase from markers
   *once* at migration time — the last use of the lossy reconstruction.
4. **Remove `fix` from the enum**; delete `fixInterrupt` and `resumeAfterFix`.

## Reconciliation with in-flight and recorded work

- **`tactic-graph-selector-reviewed-exclusion`** (phase `implement`, top-ranked
  `boost: 12`) owns two things: (a) the selector excluding a `reviewed`-marked
  node from review-worker candidacy — orthogonal to the fix model, retained
  under any design; and (b) re-review-after-fix via the **marker-clear**
  mechanism (fix dispatch clears `reviewed`, `resumeAfterFix` re-enters review).
  Author decision 2026-07-18: **ship the interim marker-clear fix now** (it
  closes the live unreviewed-merge bug observed on PR #2882) and let this
  redesign **supersede that mechanism later** — when this tactic is scheduled,
  re-review migrates from marker-clear to the direct `phase → review` reset of
  greenfield step 4, and the marker-clear path is retired here. This tactic does
  NOT block or duplicate `tactic-graph-selector-reviewed-exclusion`.
- **Strategy clarifications 18 (fix-as-phase, 2026-07-04) and 63 (re-review,
  2026-07-18)** encode the *doctrine* this redesign preserves (fix is an
  interrupt; unreviewed code must never merge after a fix). Only the
  *implementation mechanism* changes, so this round records no
  strategy-clarification amendment — amending them would change the strategy's
  substance fingerprint (`router.ts:88` includes `clarifications`) and
  soft-freeze the ~20 open child tactics of `strategy-graph-native-dispatch`
  (clarification 10; machinery live via the `done`
  `tactic-graph-router-transitions`). The pointer-amendments to 18/63 (marking
  their fix-as-phase / marker-clear framing superseded by this tactic) should be
  folded into the `/align-tactics` round that *schedules* this work, so the
  soft-freeze coincides with real re-evaluation of the subtree rather than
  stalling the active fleet for a not-yet-scheduled change.
- **Strategy clarification (2026-07-04 main-qa)** states "The phase ladder
  becomes `main-qa → review → fix → qa → implement → align-tactics`" as the
  attention-ranking order. Removing `fix` from the enum requires reconciling
  that ranking order too — a plan-time item for the scheduling `/align-tactics`
  round.

