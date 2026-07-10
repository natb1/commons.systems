---
id: tactic-graph-self-consistency-sweep
kind: tactic
statement: "intention graph hygiene: prune all done-but-present nodes (repairing
  dependent blocked_by edges), fix the graph-native-dispatch subtree map and
  stale prose, collapse template clusters to one-home pointers, and strip
  duplicate sub-strategy serves"
owner: ai
status: codified
parent: null
rationale: "Surfaced by the 2026-07-05 target-state review; re-scoped 2026-07-09
  by the /align-strategy full-graph review round: the prune count grew from
  three to eleven, the old Unit 3 (sync kind docs to SCHEMA.md) is superseded by
  tactic-schema-md-deprecation — SCHEMA.md is deprecated, not a sync target —
  and the template-cluster and serves-inheritance decisions added units. Serves
  strategy-graph-drives-dispatch: the graph can only drive dispatch reliably if
  it is internally consistent and self-describing."
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 4
  override: null
  rationale: "Owed-prune debt authority: the census that reconciles
    done-but-present nodes (incl. the 2026-07-10 deferred batch and PR-2788
    closed-unmerged anomaly) sits at rank 0 and never runs. Raised by the router
    (bootstrap tick 2026-07-10) so the deferred prune debt gets executed."
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# intention graph: self-consistency sweep

## Context

The 2026-07-05 target-state review found the graph failing its own doctrine in
several bounded ways; the 2026-07-09 /align-strategy full-graph review re-scoped
this tactic (prune count 3 → 11; old Unit 3 superseded by
tactic-schema-md-deprecation; template-cluster and serves-inheritance units
added). Each item is low-risk but they accumulate; the graph must be
internally consistent and self-describing to drive dispatch reliably.

## Unit 1 — prune ALL done nodes (with edge repair)

**Recommended model:** sonnet

Scope:
- Eleven tactics sit at `phase: done` with merged PRs (2026-07-09 census):
  tactic-graph-commit-hardening, tactic-graph-write-validation-hardening,
  tactic-align-init-skill, tactic-graph-commit,
  tactic-tailscale-router-expiry-disable, tactic-curriculum-chunk-metadata,
  tactic-graph-dispatch-schema, tactic-intentions-branch-protection,
  tactic-graph-router-selector, tactic-reading-chunk-1-plato-cave,
  tactic-schema-migration-backfill. Re-derive the list at execution
  (`grep -l '^phase: done' intentions/tactic-*.md`), verify each node's PR
  merged, then prune via `graph-commit --prune` (the prune primitive is live).
- Inbound `blocked_by` edges pointing at pruned nodes dangle: remove each
  entry (exact id match) from the dependent nodes in the same commit so
  validate-graph stays green.
- Per kind-tactic's settled-doctrine rule (2026-07-09): before pruning, confirm any
  doctrine a done node's body settled has a persistent-layer home; land the
  missing homes first.

## Unit 2 — subtree map and stale prose

**Recommended model:** sonnet

Scope:
- `tactic-graph-native-dispatch.md §5`: the "Fifteen children" map/diagram
  still shows pruned align-skill tactics and omits later children; correct
  the count and the list against the live graph.
- `tactic-first-sensor-pass.md` ("every reading and gap is null"):
  contradicted by ~47 signal-bearing strategies; update or delete.
- `tactic-condition-review-sweep.md`: repoint from the retired `/align`
  rung-5 consistency role to `/align-init`.
- (strategy-graph-drives-dispatch's stale "readings are null" rationale was
  amended directly in the 2026-07-09 round — dropped from this unit.)

## Unit 3 — template clusters → one-home pointers

**Recommended model:** sonnet

Scope:
- The 23 `tactic-reading-chunk-*` nodes repeat a near-identical
  office_hours.reason paragraph: state the full reason once at the curriculum
  owner (the reading-program tactic / strategy-philosophical-grounding), and
  reduce each chunk's reason to a one-line pointer plus its unique payload
  (passages, questions).
- Tier-gate restatements: the rule "tier entry is a dated author declaration
  on strategy-progressive-validation" is restated on ~4 nodes — replace the
  restatements with citations of strategy-progressive-validation
  (grep for "tier 2"/"tier entry"/"dated declaration" to enumerate).
- recovers-abstention re-derivations: kind-delegation carries the canonical
  sentence (2026-07-09: "maintaining an abstention is not unwinding...") — the ≥6
  strategy nodes re-deriving it cite kind-delegation instead
  (grep for "nothing to unwind"/"not unwinding"/"declined" across
  strategy-*.md to enumerate).

## Unit 4 — strip duplicate sub-strategy serves

**Recommended model:** sonnet

Scope:
- Per kind-strategy's sub-strategy inheritance rule (2026-07-09): a child strategy
  re-declaring its parent's exact virtue set strips to `serves: []`. Seven as
  of 2026-07-09: strategy-autonomous-execution, strategy-firebase-demo-saas,
  strategy-own-audience, strategy-recover-attention,
  strategy-recover-discovery, strategy-services-funnel,
  strategy-tailscale-auth-visibility. Re-derive at execution
  (child.serves == parent.serves, both sorted, child non-empty); keep any
  child whose serves adds a claim beyond the parent's.

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

- No tactic at `phase: done` remains; no `blocked_by` entry names a missing
  node; no non-empty child-strategy serves equals its parent's set.
