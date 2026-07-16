---
id: tactic-audit-routing-advisory-gate
kind: tactic
statement: Make the audit-written routing policy loop advisory — surface routing
  recommendations for explicit author approval, never auto-apply
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-16 /align-strategy interview
  (strategy-token-economy clarification 10). The author deprecated the
  align-family Opus floor in favour of a general rule: no audit-driven routing
  change is applied automatically. This tactic carries the actuator-side
  mechanism change, not yet in place."
reading: null
gap: null
serves:
  - strategy-token-economy
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
# Make the audit-written routing policy loop advisory — surface routing recommendations for explicit author approval, never auto-apply

Retained draft (`phase: null`) — context for a later `/align-tactics
strategy-token-economy` round, not selectable work. Surfaced by the
2026-07-16 `/align-strategy` interview; the *requirement* lives on
`strategy-token-economy` (clarification 10), this node holds the *mechanism*.

## Why this exists

The 2026-07-16 interview deprecated the align-family Opus floor
(`tactic-align-family-opus-default`) and replaced it with a general rule: the
audit-written routing policy loop no longer applies **any** routing change
automatically — model demotion, model promotion, or effort tuning alike. When
the `/dispatch-token-audit` finds a task can run on a cheaper model without
compromising quality (or otherwise warrants a routing change), it **must
surface** the recommendation; implementation waits for **explicit author
approval**. This protects the high-stakes work without a per-phase floor
allowlist, and it applies uniformly rather than carving out the align family.

## Open mechanism questions

1. Change the routing actuator (the graph-native launch chain's
   phase→model/phase→effort routing with the `phase-model-policy.json`
   audit-written policy file) so that it **reads** an author-approved policy
   rather than auto-writing one. The audit produces routing *recommendations*;
   a change lands in the live policy only after author approval.
2. Give the token audit a required output surface for routing recommendations
   (which task, current model → recommended model, the verified yield metric
   justifying it, and the quality-preservation evidence). Recommendations
   grounded on unverified accounting (e.g. the open qa `fixes_applied` gap)
   stay untrusted, per the strategy's `attributes.conditions`.
3. Define the approval mechanism — how the author reviews and approves a batch
   of recommendations, and how an approved change is applied. Keep the record
   of approved changes auditable.

## Boundary

This node is the **actuator-side** advisory-gate mechanism. The `/align-tactics`
Sonnet-orchestrator + Opus-subagent split is a separate mechanism on
`tactic-align-family-opus-default`. Both serve `strategy-token-economy` and
both were surfaced in the same 2026-07-16 interview.
