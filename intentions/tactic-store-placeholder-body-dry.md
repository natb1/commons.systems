---
id: tactic-store-placeholder-body-dry
kind: tactic
statement: "DRY the placeholder tactic-body string in
  packages/intentionsutil/src/store.ts: writeNode and assertNoTacticBodyLoss
  both hardcode the `# <statement>` placeholder; extract a shared
  placeholderBody(statement) helper so a format change cannot desync the guard"
owner: ai
status: raw
parent: null
rationale: "Deferred (optional, drift-prevention) finding from the terminal
  review of PR #2775 (tactic-graph-write-validation-hardening) during the
  2026-07-07 graph-native router tick. Not a bug: if the placeholder format
  changes in writeNode alone, assertNoTacticBodyLoss stops recognizing
  placeholders and throws on legitimate never-planned-tactic reclassification."
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
# DRY the placeholder tactic-body string in packages/intentionsutil/src/store.ts: writeNode and assertNoTacticBodyLoss both hardcode the `# <statement>` placeholder; extract a shared placeholderBody(statement) helper so a format change cannot desync the guard
