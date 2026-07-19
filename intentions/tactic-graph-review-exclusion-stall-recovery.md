---
id: tactic-graph-review-exclusion-stall-recovery
kind: tactic
statement: Add a reconciler that routes a stranded phase:review tactic carrying
  the reviewed marker back to fix when its armed auto-merge cannot complete (PR
  CONFLICTING or CI turns red), since the selector's reviewed-marker exclusion
  (tactic-graph-selector-reviewed-exclusion) removes the incidental recovery
  that re-selection used to provide
owner: ai
status: raw
parent: null
rationale: "Deferred code-review finding from the /review-fix pass on PR #2888
  (tactic-graph-selector-reviewed-exclusion). Recorded-text hygiene draft: input
  to a later /align-tactics strategy-graph-native-dispatch round."
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
attributes:
  bug_fix: true
---
# Add a reconciler that routes a stranded phase:review tactic carrying the reviewed marker back to fix when its armed auto-merge cannot complete (PR CONFLICTING or CI turns red), since the selector's reviewed-marker exclusion (tactic-graph-selector-reviewed-exclusion) removes the incidental recovery that re-selection used to provide

**Draft** — deferred code-review finding from the `/review-fix` pass on PR #2888
(`tactic-graph-selector-reviewed-exclusion`). Input to a later
`/align-tactics strategy-graph-native-dispatch` round.

## Context

`packages/intentionsutil/src/router.ts:296` adds `if (t.phase === "review" &&
t.execution?.markers.includes(REVIEWED_MARKER)) continue;` to
`selectGraphTargets`, permanently excluding a review+reviewed node from
selection. A clean review arms auto-merge
(`packages/intentionsutil/src/transitions.ts:213-214`) and stays at phase
`review` with the `reviewed` marker stamped.

## Failure scenario

If the armed merge cannot complete after that point — `origin/main` moves and
the PR becomes `CONFLICTING`, or a required branch-up-to-date re-run turns CI
persistently red — auto-merge never fires and the PR neither merges nor
closes. `transition-node` (the only producer of graph phase `fix`, via
`decideTransition`'s fix interrupt) runs only when a node is selected. Because
the selector now permanently skips this node, `transition-node` is never
invoked for it, so the fix interrupt that would route it back to `fix` can
never fire. The node is stranded at phase `review` indefinitely.

Before this PR the node was re-selected every tick — wastefully re-running
`/review-fix` and re-provisioning — which incidentally recovered these cases:
provisioning caught a merge conflict via park, and the worker's own
transition caught red CI via fix. The exclusion removes that recovery without
replacing it.

## Recommended fix

Add a companion reconciler sweep (or extend `reconcile-graph-merged`) that,
each tick, routes a `phase: review` node carrying the `reviewed` marker whose
open PR is `CONFLICTING` or has failing CI back to `fix` — clearing the
`reviewed` marker (mirroring `decideTransition`'s fix-interrupt
`clearMarkers`) so the node re-enters the ladder — instead of relying on
re-selection. Alternatively, scope the selector exclusion to nodes whose PR is
still mergeable/green, so a regressed reviewed node is re-selected and
re-transitioned.

## Provenance

- **Location**: `packages/intentionsutil/src/router.ts:296`
- **Adversarial verdict**: not adversarially verified — this is a `Deferred`
  code-review finding, not a `Required` security finding, so the
  adversarial-verify step was skipped for it.
- **Source PR**: #2888 (`execution.pr` on `tactic-graph-selector-reviewed-exclusion`)
