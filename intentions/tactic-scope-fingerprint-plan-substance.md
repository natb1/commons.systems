---
id: tactic-scope-fingerprint-plan-substance
kind: tactic
statement: Scope tacticScopeFingerprint to PLAN SUBSTANCE only, excluding
  machinery-appended body sections, so no machinery writer can trip the tactic
  scope-custody gate by construction
owner: ai
status: raw
parent: null
rationale: "The greenfield half of the 2026-07-25 /align-strategy round on false
  scope-drift demotions, recorded per the design-proposals rule alongside its
  migration carrier tactic-transition-node-stamp-landed-body.
  tacticScopeFingerprint(statement, body) hashes the WHOLE body, so any
  machinery-written section counts as scope drift — today that is /qa-fix's Step
  3.6 `## needs-main residue` append, but the class is open and every future
  machinery body-writer reintroduces it. The 2026-07-18 round already met this
  hazard from the align-session side and resolved it with a manual, fail-closed
  re-stamp primitive (restamp-scope-fingerprint.ts) plus the doctrine that
  'phase workers, qa/review sessions, and the tick never re-stamp' — leaning on
  the transition writer's machinery refresh to cover the machinery side. That
  refresh is defective, so the lean does not hold. Scoping the fingerprint to
  plan substance removes the need for either mechanism to be right about
  machinery writes at all: a machinery append is definitionally not plan
  substance. Requires a body-section convention distinguishing plan substance
  from machinery output, which does not exist yet — that convention is the
  substantive design work of this tactic, not an incidental. Deliberately NOT
  boosted: it is the sequenced target, not the immediate stop-the-bleeding fix."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 85
  override: null
  rationale: "Recorded 2026-07-25 /align-strategy round: the greenfield target
    design for the machinery-write custody hazard. Placed in the standing 85
    band rather than the round's two author-boosted carriers (95) — it is the
    sequenced target rather than the immediate repair, and the author's boost
    directive named the false-demotion bug and the correctness hole, not this."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Scope tacticScopeFingerprint to PLAN SUBSTANCE only, excluding machinery-appended body sections, so no machinery writer can trip the tactic scope-custody gate by construction
