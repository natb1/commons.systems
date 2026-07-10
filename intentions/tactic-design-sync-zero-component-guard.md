---
id: tactic-design-sync-zero-component-guard
kind: tactic
statement: Make design-sync resync fail loudly when component extraction returns
  0 instead of silently syncing nothing
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy operational-mechanics
  round: the ds-bundle converter's ts-morph extraction depends on
  packages/ds/package.json's types field pointing at src/index.ts; if that field
  is removed the sync silently produces 0 components ([TITLE_UNMAPPED] on every
  story) rather than erroring. The only current guard is a prose warning in
  .design-sync/NOTES.md. Add a hard failure (exit non-zero with the NOTES.md
  remediation inline) when exported-component extraction returns 0 — per the
  repo's clear-errors-over-defensive-fallbacks rule. Retained as a draft for
  /align-tactics."
reading: null
gap: null
serves:
  - strategy-owned-web-platform
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
# Make design-sync resync fail loudly when component extraction returns 0 instead of silently syncing nothing
