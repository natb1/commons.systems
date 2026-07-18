---
id: tactic-graph-selector-reviewed-exclusion
kind: tactic
statement: Selector and explicit-dispatch exclude a reviewed-marked node from
  review-worker candidacy; a red-CI fix dispatch clears the reviewed marker so
  the node re-enters review
owner: ai
status: raw
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
phase: null
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
this session on `tactic-graph-node-lane-write-hardening` / PR #2882. It is a no-op
only because that node's own gap-(e) hardening added the node-lane review-fix
re-entry check (skip Steps 1–6 when `reviewed ∈ execution.markers`), but it still
consumes a worker slot each tick.

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
parallel guard (a reviewed node selected for `review` yields the worker), and the
explicit-dispatch resolution routes a reviewed node to the scripted merge/fix
disposition rather than `/review-fix`. The red-CI marker-clear rides with the fix
interrupt.

Sibling linkage: complementary to `tactic-graph-tick-node-lane-auto-merge` (the
tick-side merge of the same reviewed set) — not `blocked_by` it. Landing this
exclusion before the auto-merge reconciler lands only removes the redundant
review dispatch (a reviewed node then simply waits for human/tick merge, as it
does today), so there is no window where nothing handles a reviewed node worse
than the current state.

## Verification (at finalization)

- Unit test `selectGraphTargets`: a `phase:review` tactic with `reviewed` in
  `execution.markers` is NOT among the emitted review candidates; the same node
  without the marker still is.
- Unit test `check-node-selection.ts`: selecting `review` on a reviewed-marked node
  yields (stale-selection), matching the pure-layer exclusion.
- End-to-end: on the next reviewed node-lane PR, confirm no `/review-fix` worker is
  dispatched to it post-review and the tick merges it (once `graph-auto-merge` is
  live), with Claude intervening only on a red-CI fix.
