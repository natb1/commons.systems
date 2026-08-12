---
id: tactic-attention-delegation-scoring
kind: tactic
statement: Make delegations score-bearing and `recovers` a parent edge — capture
  becomes lineage, replacing the capped capture term
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-08-12 /align round that unified the ranking
  model on strategy-graph-drives-dispatch. The round ruled `recovers` a true
  parent edge, but kind-delegation has no `goal_layer: true`, so delegations
  carry no attention field and there is nothing for a recovering strategy to
  inherit — the rule cannot be implemented without this change. Split out from
  tactic-attention-namespaced-rank because it is a schema change to a kind node
  plus a derivation, not a resolver change, and because it carries an open
  decision the resolver work does not need to wait on."
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications:
  - question: What is owed before this can be implemented?
    answer: "(Recorded 2026-08-12.) The cap decision. Today the capture term is
      capped at min(1, sum) so a strategy recovering several severe delegations
      cannot swamp authored intent. Read as lineage the natural form is NO cap,
      with severity calibrated onto the same integer scale as authored per-tier
      boosts instead — but that was left open by the author at the close of the
      round and must be settled before implementation, not decided inside it.
      Scope otherwise: add `goal_layer: true` to kind-delegation; derive each
      delegation's score from its divergence and irreversibility axes using the
      existing scoring helpers in packages/intentionsutil/src/attention.ts
      rather than a second implementation; add `recovers` to the parent
      relation; delete the capture term. 19 recovers edges across 22 delegations
      are in scope. The self-updating property must be preserved: raising a
      delegation's divergence level re-ranks every recovering strategy with no
      authoring act."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-attention-namespaced-rank
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Make delegations score-bearing and `recovers` a parent edge — capture becomes lineage, replacing the capped capture term

Draft — retained interview context per the retain-not-refine contract.

## Why this is separable from the resolver work

`tactic-attention-namespaced-rank` widens the parent relation to include
`recovers`. That edit is inert until a delegation has a score to confer:
`kind-delegation` carries no `goal_layer: true`, so a delegation has no
`attention` field at all today. This node supplies the missing half — a
schema change to a kind node plus a derivation — and it also carries an
open decision the resolver work does not need to wait on.

## Scope

1. Add `goal_layer: true` to `intentions/kind-delegation.md`.
2. Derive each delegation's score from its `attributes.divergence.level` and
   `attributes.irreversibility.{gated,recovery_cost}` axes, **reusing** the
   existing `divergenceScore` / `irreversibilityScore` / `captureScore`
   helpers in `packages/intentionsutil/src/attention.ts` rather than writing
   a second implementation. Their free-text token matching is deliberate
   (the live store carries compound values such as `low-moderate`) and must
   be preserved.
3. Delete the `capture` term and `captureScoreFor` from the composition step;
   the value now arrives as lineage.
4. Confirm the self-updating property survives: raising a delegation's
   divergence level must re-rank every recovering strategy with no authoring
   act.

## Open — owed before implementation

**Cap or no cap.** Today `captureScoreFor` returns `Math.min(1, sum)`, so a
strategy recovering several severe delegations cannot swamp authored intent.
Read as lineage, the natural form of the unified model is **no cap**, with
severity instead calibrated onto the same integer scale as authored per-tier
boosts. The author left this open at the close of the 2026-08-12 round; it
must be settled before implementation, not decided inside it.

## Measured scope

19 `recovers` edges across 22 delegation nodes (live graph, 2026-08-12).
