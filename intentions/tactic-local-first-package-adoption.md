---
id: tactic-local-first-package-adoption
kind: tactic
statement: Consolidate the duplicated FSA handle-store implementations onto
  packages/local-first
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review:
  packages/local-first (capability probes, IndexedDB-persisted FSA handles
  namespaced {app}:{purpose}) is the intended shared substrate but its only
  non-test importer is a scaffolding template — budget re-implements its own FSA
  handle store and write-back layer (budget/src/local-file.ts, file-sync.ts).
  Duplicated permission/handle logic is the same drift-hazard class the crypto
  consolidation fixes. Retained as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-durable-owned-data
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
# Consolidate the duplicated FSA handle-store implementations onto packages/local-first
