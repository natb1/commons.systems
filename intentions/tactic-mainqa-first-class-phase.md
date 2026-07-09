---
id: tactic-mainqa-first-class-phase
kind: tactic
statement: main-qa becomes a first-class Phase — enum + migration of the mainqa
  tactics in one PR, eligibility split automated vs office-hours
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: 12
  tactic-mainqa-* nodes sit at placeholder phase: implement (a
  bootstrap-emulation side effect) with only the office-hours park keeping the
  selector from routing observation work to implement workers. The main-qa phase
  design is already recorded (strategy-graph-native-dispatch, the main-qa
  clarification of 2026-07-04); this tactic implements it and migrates the
  placeholders."
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
# tactic-mainqa-first-class-phase

## Context

The Phase enum lacks main-qa, so migrated post-merge-verification work wears
phase: implement + office_hours. Design home: strategy-graph-native-dispatch's
main-qa clarification (2026-07-04) — main-qa sits between merge and done; the
router maps it to the qa-main handler; outcomes pass→done(prune),
broken→implement-chain bug tactic, cannot-verify→office_hours.

## Scope (ONE PR — the validator rejects unknown phase values, so enum and
migration cannot land separately)

- schema.ts: PHASES gains "main-qa" (position per the recorded ladder).
- Migrate all placeholder nodes (12 tactic-mainqa-* + 2 tactic-main-qa-*) to
  phase: main-qa; normalize naming to tactic-mainqa-* (rename = prune old id
  + write new id via graph-commit --prune, preserving bodies and inbound
  edges).
- Eligibility split per node: claude-eligible verification (deployed-surface
  checks, script-verifiable observations) drops its office_hours park and is
  selectable by the qa-main handler; human-observation items keep the park
  with office_hours.recommendation naming what the human observes.
- The two unbounded event-wait nodes (statements that wait on an external
  event with no bounded verification) are NOT migrated: move each watch
  condition to the owning strategy's attributes.conditions (standing state
  belongs in the persistent layer) and prune the tactic nodes.
- Dedup: the 10 identical migration-Context blocks collapse — each node's
  body keeps only its unique verification payload plus a pointer to this
  tactic as the migration record.
- Selector/tick emulation guidance: main-qa nodes are selected only by the
  qa-main handler mapping, gated on the prod deploy landing.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
! ls intentions/tactic-main-qa-*.md 2>/dev/null
! grep -l "^phase: implement" intentions/tactic-mainqa-*.md
```
