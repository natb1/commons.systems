---
id: tactic-conflict-outranks-ci-precedence
kind: tactic
statement: Make the normal selection path check mergeable BEFORE writing
  execution.fix, so a CONFLICTING-and-red node routes straight to the conflict
  lane instead of burning a graph write and a fix attempt on stale-code CI
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-29 /align-strategy dispatch-containment
  interview. Conflict-vs-CI precedence is inconsistent across stages: the
  reviewed-node path is correct (transitions.ts:272-276, documented at :262-265
  as 'CONFLICTING takes precedence over failing when both hold'), while the
  normal path enters the fix interrupt and COMMITS execution.fix to main —
  consuming attempt 1 of 3 — before provisioning reaches exit 11 and routes to
  the conflict lane. The write is wasted and the attempt is burned against a PR
  whose CI result was about pre-merge code. Author ratified
  conflict-outranks-CI-failed as doctrine this round. This tactic is the
  targeted fix; the full one-ordered-cascade unification is recorded as the
  greenfield with a migration path and deliberately sequenced after this and its
  siblings, each of which removes a special case that would otherwise be carried
  into the unified form."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Bootstrap re-scale 2026-07-30: Waves B-D of a three-band interim
    scale (50 / 20 / 10) - dispatch-containment and evidence-custody work that
    follows the Wave-A write-path fixes. Interim scaffolding only;
    tactic-attention-tier-ranking and tactic-attention-boost-scripts retire this
    numeric scheme."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Make the normal selection path check mergeable BEFORE writing execution.fix, so a CONFLICTING-and-red node routes straight to the conflict lane instead of burning a graph write and a fix attempt on stale-code CI
