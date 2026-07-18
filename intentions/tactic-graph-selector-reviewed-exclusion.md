---
id: tactic-graph-selector-reviewed-exclusion
kind: tactic
statement: Selector and explicit-dispatch exclude a reviewed-marked node from
  review-worker candidacy; a red-CI fix dispatch clears the reviewed marker so
  the node re-enters review
owner: ai
status: codified
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview recording the
  reviewed-marker-terminates-review-candidacy clarification
  (strategy-graph-native-dispatch). selectGraphTargets emits any open
  phase:review tactic as a review-worker candidate without reading
  execution.markers, so a fully-reviewed node awaiting merge is re-dispatched
  /review-fix every tick (observed on tactic-graph-node-lane-write-hardening /
  PR #2882 during this session). Complementary to
  tactic-graph-tick-node-lane-auto-merge, which owns the tick-side merge of the
  same reviewed nodes; this tactic owns the selector-side exclusion so the two
  do not both act on one node per tick."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 12
  override: null
  rationale: "Author-directed 2026-07-18: top-rank this selector-exclusion tactic
    above the current working max (tactic-graph-node-lane-write-hardening,
    resolved 16.333) so it is selected and finalized first — own boost 12 added
    to strategy-graph-native-dispatch's inherited 5.333 resolves to 17.333,
    clearing the max."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Selector excludes a reviewed-marked node from review-worker candidacy

## Context

Retained draft from the 2026-07-18 `/align-strategy` interview that recorded the
`strategy-graph-native-dispatch` clarification "A node's `reviewed` marker is
written but its PR is not yet merged … does the selector keep dispatching a
review worker to it?" (refining clarification 53's worker/tick split from the
tick side to the selector side). This tactic carries the implementation.

The gap, confirmed by reading the selector at `origin/main`:

- `selectGraphTargets` (`packages/intentionsutil/src/router.ts`, tactic-candidate
  loop ~L288-300) emits **any** open `phase:review` tactic as a review-worker
  candidate — eligibility is `office_hours == null`, `isOpenTactic` (phase set,
  not draft, not done), not soft-frozen, blockers complete. It never reads
  `execution.markers`, so a node whose `reviewed` marker is already written (review
  done, PR awaiting the tick's merge) is still emitted as a review candidate.
- The post-selection staleness gate `check-node-selection.ts` does not read
  `execution.markers` either.

Result: a fully-reviewed node is re-dispatched `/review-fix` every tick — observed
this session on `tactic-graph-node-lane-write-hardening` / PR #2882. **Correction
during finalization:** `/review-fix`'s existing re-entry short-circuit
(`.claude/skills/review-fix/SKILL.md`) is gated on the **`dispatch:reviewed`
GitHub label**, and the node-target lane explicitly does **not** apply that label
(`SKILL.md`'s "Node-target lane" section: "Do **not** apply `dispatch:reviewed`
via `dispatch-complete-phase`" — it records the `reviewed` marker in
`execution.markers` instead). So on `origin/main` today there is **no**
marker-gated re-entry check on the node lane: a re-dispatched reviewed node
re-runs the **full** review pass every tick, not a no-op — a real, live cost,
not a latent one.

## Desired behavior (from the interview)

Once `execution.markers` includes `reviewed`, the node is no longer a review-worker
candidate in **either** dispatch path — the scheduled selector or an explicit
`dispatch <node>` resolution. Its remaining lifecycle is entirely tick-owned
(clarification 53):

- **green CI + `mergeable==MERGEABLE`** → the tick's `graph-auto-merge`
  (`tactic-graph-tick-node-lane-auto-merge`) merges it label-free;
  `reconcile-graph-merged` absorbs the merge to `done`/`main-qa` with worktree
  cleanup.
- **red CI** → the fix interrupt (clarification 18) dispatches a fix worker, and
  that fix dispatch **clears the `reviewed` marker** so the node re-enters review
  after fix→qa. A CI failure means code changed that the completed review never
  saw; unreviewed code must never reach merge. This is distinct from the
  scope-stale demote-to-implement (clarification 36), which fires on a post-review
  scope *edit*, not a CI failure.

## Design pointer (greenfield; /align-tactics owns the decomposition)

Single source of truth is the pure selector: exclude a `phase:review` tactic whose
`execution.markers` includes `reviewed` from the review-candidate pool in
`selectGraphTargets` — the same layer clarification 53 assigns the disposition to,
so the selector and the tick's `graph-auto-merge` agree on which nodes are
"reviewed, awaiting merge" from one predicate. `check-node-selection.ts` gains the
parallel guard, and — because `dispatch-graph-execute` pre-provisions every tactic
lane spec (scheduled or explicit) through `provision-node-worktree`, which calls
`check-node-selection.ts` before any skill spawns — that one guard covers both the
scheduled selector path *and* the explicit-dispatch path with no separate change to
`dispatch-graph-execute`'s phase→skill case statement. Its exit-12 ("stale-selection")
disposition already resolves to `dispatch-graph-execute` printing `skipped <id>` and
clearing the reservation with **no** worker spawned and **no** graph write — that is
the correct behavior for this tactic's scope: the actual merge/fix disposition
belongs to the tick-side `graph-auto-merge` reconciler (the sibling tactic below),
not to this exclusion. The red-CI marker-clear rides with the fix interrupt in the
pure decision layer (`decideTransition`/`fixInterrupt` in `transitions.ts`), which
already exists and already fires on `phase: "review"` today (independent of whether
the tick-side auto-merge reconciler has landed) — a `/review-fix` worker itself can
still hit a residual CI failure at completion and call the transition writer with
`ci: "failing"` at `phase: "review"`, so this is live, testable ground now.

Sibling linkage: complementary to `tactic-graph-tick-node-lane-auto-merge` (the
tick-side merge of the same reviewed set) — not `blocked_by` it. Landing this
exclusion before the auto-merge reconciler lands only removes the redundant
review dispatch (a reviewed node then simply waits for human/tick merge, as it
does today), so there is no window where nothing handles a reviewed node worse
than the current state.

## Unit 1 — selector excludes a reviewed phase:review tactic

**Recommended model:** sonnet

Well-specified, mechanical: one new guard clause in an existing loop, following
the loop's own established eligibility-check style, plus a unit test using
already-existing fixture helpers.

Scope:
- `packages/intentionsutil/src/router.ts` — in the tactic-candidate loop inside
  `selectGraphTargets` (currently `router.ts:289-303`; body:
  ```ts
  for (const t of tactics) {
    if (t.office_hours !== null) continue;
    if (!isOpenTactic(t)) continue;
    if (frozenTacticIds.has(t.id)) continue;
    if (!blockersComplete(t, byId)) continue;
    candidates.push({ ... });
  }
  ```
  ), add one more guard before the `candidates.push(...)`: skip a tactic when
  `t.phase === "review"` and `t.execution?.markers.includes(REVIEWED_MARKER)`.
  `router.ts:3` already has `import { isStrategyStale } from "./transitions.js";`
  — extend that **existing** import to `import { isStrategyStale, REVIEWED_MARKER
  } from "./transitions.js";` (do not add a second `transitions.js` import line;
  `REVIEWED_MARKER` is exported at `transitions.ts:30`).
- Out of scope: any other candidate loop (strategy candidates, frozen-tactic
  re-evaluation candidates) — the `reviewed` marker is only ever written at
  `phase: "review"` completion (`PHASE_COMPLETION_MARKER.review`,
  `transitions.ts:33`), so no other candidate kind can carry it meaningfully.

Dependencies: none.

Reuse:
- `REVIEWED_MARKER` constant, `packages/intentionsutil/src/transitions.ts:30`
  (do not re-declare the string `"reviewed"` locally).
- The loop's existing guard-clause style (`if (...) continue;`) — match it,
  don't refactor the loop shape.

## Unit 2 — check-node-selection.ts parallel guard

**Recommended model:** sonnet

Well-specified: mirrors an existing disposition (`EXIT_STALE_SELECTION`) already
used by three other checks in the same function, with a clear test pattern to
copy from the file's own `seedTactic` helper.

Scope:
- `packages/intentionsutil/scripts/check-node-selection.ts` — immediately after
  the phase-equality check (currently lines 161-178, ending
  `} else if (phase !== selectedPhase) { return fail(EXIT_STALE_SELECTION, "phase", ...); }`),
  add: when `selectedPhase === "review"` and the node's `execution?.markers`
  includes `REVIEWED_MARKER` (import from `../src/transitions.js`), return
  `fail(EXIT_STALE_SELECTION, "phase", "<nodeId> already carries the reviewed marker — awaiting tick merge/fix, not a review candidate")`.
  Place it so it only evaluates once the ordinary phase check has already
  confirmed `phase === "review"` (i.e. nest it in that branch, or check
  `phase === selectedPhase === "review"` explicitly) — this guard must not fire
  for a node whose phase has already moved on (that case is caught by the
  existing equality check first).
- Do not touch the `align-tactics` branch (lines 162-175) or the fingerprint/
  scope-chain checks below (lines 190+) — this is a new, independent condition
  alongside the existing phase check, not a replacement for it.

Dependencies: none (independent of Unit 1 — both read the same marker but from
different call sites; landing either alone is safe, per the sibling-linkage note
above).

Reuse:
- `EXIT_STALE_SELECTION` and the `fail(...)` helper already in this file
  (`check-node-selection.ts:58` and its call sites at lines 143, 167, 177, 182).
- `REVIEWED_MARKER` from `packages/intentionsutil/src/transitions.ts:30` (same
  constant as Unit 1 — do not hand-write the string `"reviewed"`).

## Unit 3 — fix-interrupt clears the reviewed (and qa-done) markers

**Recommended model:** opus

Judgment call already resolved during planning, but the change touches a pure
decision interface's return shape (`TransitionDecision`) plus five existing
whole-object `toEqual` assertions that must be updated in lockstep — a
cross-cutting, easy-to-break-quietly change that warrants opus over a mechanical
sonnet pass.

**Resolved design call:** the retained draft's phrase "re-enters review after
fix→qa" is read as: leaving `fix` on green CI should resume at `qa` (not
`review`) when the node had already earned `REVIEWED_MARKER` before the CI
regression — a CI failure means code changed after the review, so both `qa` and
`review` must re-run, not just `review`. Mechanically this means the fix
interrupt (case 3 in `decideTransition`, i.e. `fixInterrupt(phase, ci)` firing —
**not** case 4's "still red, stay in fix" hold) must clear **both**
`QA_DONE_MARKER` and `REVIEWED_MARKER` from `execution.markers`, so
`resumeAfterFix`'s cascade (`transitions.ts:113-118`) falls through past its
first two `has(...)` checks to `has(PLANNED_MARKER) → "qa"`.

Scope:
- `packages/intentionsutil/src/transitions.ts`:
  - Extend the `TransitionDecision` interface (currently `phase`, `armMerge`,
    `hold`, `demote`) with a new field `clearMarkers: readonly string[]`.
  - In `decideTransition`, every existing `return { phase: ..., armMerge: ...,
    hold: ..., demote: ... }` literal gains `clearMarkers: []` **except** case 3
    (the fix-interrupt branch, `if (fixInterrupt(phase, ci)) { return { phase:
    "fix", ... } }`), which gets `clearMarkers: [QA_DONE_MARKER, REVIEWED_MARKER]`.
    Case 4's "still red" branch (`return { phase: "fix", armMerge: false, hold:
    true, demote: false }`) gets `clearMarkers: []` — markers were already
    cleared on the call that first entered `fix`; this is a distinct branch
    (`hold: true` vs case 3's `hold: false`), so the two are already
    discriminated by an existing field.
- `packages/intentionsutil/scripts/apply-node-transition.ts` — in the block that
  currently reads:
  ```ts
  if (decision.demote) {
    execution = { ...execution, markers: [] };
    node.phase = "implement";
  } else if (!decision.hold) {
    node.phase = decision.phase as typeof node.phase;
  }
  ```
  add, before this block, a filter step applied whenever
  `decision.clearMarkers.length > 0`:
  `execution = { ...execution, markers: execution.markers.filter((m) => !decision.clearMarkers.includes(m)) };`
  This runs independently of (and before) the `demote` branch — `demote` already
  wholesale-clears to `[]`, so the filter is a no-op superset in that case, but
  ordering doesn't matter for correctness either way.
- Out of scope: `resumeAfterFix` itself needs no change — it already reads
  markers generically; clearing the markers upstream is sufficient to change its
  output. Do not add a `qa` special-case to `resumeAfterFix`.

Dependencies: none (independent of Units 1–2 — different call path; the marker
representation Unit 1/2 read is unaffected by when it gets cleared).

Reuse:
- `QA_DONE_MARKER`, `REVIEWED_MARKER`, `PLANNED_MARKER` constants
  (`transitions.ts:28-30`).
- The existing `demote` marker-clear as the pattern to sit alongside, not
  duplicate wholesale-clear logic.

**Test updates (same unit, not a separate one — the interface change forces
them):**
- `packages/intentionsutil/test/transitions.test.ts` — the five whole-object
  `toEqual({ phase, armMerge, hold, demote })` assertions (lines 127, 136, 153,
  159, 164) each need `clearMarkers: []` added except the fix-interrupt one at
  line ~141 (`"interrupts to fix on failing CI from any ladder phase"`, which
  currently asserts only `.phase`) — add a new assertion there (or a new `it`)
  that `clearMarkers` equals `[QA_DONE_MARKER, REVIEWED_MARKER]` when the
  incoming `markers` fixture includes `REVIEWED_MARKER`.
- `packages/intentionsutil/test/apply-node-transition.test.ts` — `seedTactic`
  (this file's own helper, ~line 14) only sets a fixed `phase`/`body` with
  `execution: null`; it has no parameter for pre-seeding `execution.markers`, so
  a node starting with `[PLANNED_MARKER, QA_DONE_MARKER, REVIEWED_MARKER]` must
  be built by **chained `applyNodeTransition` calls** against a real temp store,
  the same pattern the existing "demotes to implement on scope-stale" case (line
  ~91) already uses for a two-hop `[planned, qa-done]` state. Add a new test:
  ```ts
  it("interrupts a fully-reviewed tactic to fix and clears qa-done + reviewed", () => {
    const dir = tempDir();
    seedTactic(dir, "implement", "# body\n");
    applyNodeTransition({ ...baseArgs, dir }); // implement→qa (planned)
    applyNodeTransition({ ...baseArgs, dir, ci: "passing" }); // qa→review (qa-done)
    applyNodeTransition({ ...baseArgs, dir, ci: "passing" }); // review armMerge (reviewed), phase stays review
    expect(readNode(dir, "tactic-syn").execution?.markers).toEqual(["planned", "qa-done", "reviewed"]);

    const r = applyNodeTransition({ ...baseArgs, dir, ci: "failing" }); // fix interrupt
    expect(r.phase).toBe("fix");
    expect(readNode(dir, "tactic-syn").execution?.markers).toEqual(["planned"]);

    const r2 = applyNodeTransition({ ...baseArgs, dir, ci: "passing" }); // leaves fix
    expect(r2.phase).toBe("qa"); // NOT "review" — resumeAfterFix falls through to planned-only
  });
  ```
  This is a single new `it`, not a modification of the existing
  "interrupts review→fix on failing CI without writing a marker" case (which
  seeds `phase: "review"` directly with no prior markers and stays correct
  unchanged — its assertion `markers: []` still holds since there was nothing to
  clear).

## Verification

```verify
npx vitest run --project intentionsutil --root .
```

- Unit test `selectGraphTargets` (Unit 1): a `phase:review` tactic with
  `reviewed` in `execution.markers` is NOT among the emitted review candidates;
  the same node without the marker still is.
- Unit test `check-node-selection.ts` (Unit 2): selecting `review` on a
  reviewed-marked node yields exit 12 (stale-selection), matching the pure-layer
  exclusion; a `review`-phase node without the marker still passes.
- Unit tests `transitions.ts` / `apply-node-transition.ts` (Unit 3): a
  fix-interrupt from `phase: "review"` with `REVIEWED_MARKER` already set clears
  both `QA_DONE_MARKER` and `REVIEWED_MARKER`; leaving `fix` on green CI then
  resumes at `"qa"`, not `"review"`.
- Manual, end-to-end (observe in production, once the tick's `graph-auto-merge`
  sibling tactic also lands — not blocking this tactic): on the next reviewed
  node-lane PR, confirm no `/review-fix` worker is dispatched to it post-review
  and the tick merges it, with Claude intervening only on a red-CI fix that then
  visibly re-runs qa and review.
