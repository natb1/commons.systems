---
id: tactic-clarification-citation-ids
kind: tactic
statement: Lazy clarification ids — entries gain an optional id slug when cited;
  '<node-id>#<slug>' citations resolve under a validate-graph rule
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: ordinal
  clarification citations broke twice (commit 7cb64dbc; entries 35/37 on
  strategy-graph-native-dispatch, repaired 2026-07-09 with question-anchored
  interim refs). Citations must be insertion-stable and checkable."
reading: null
gap: null
serves:
  - strategy-graph-self-description
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
# tactic-clarification-citation-ids

## Context

Free-text ordinal refs ('clarification 26') shift on insertion and nothing
validates them. Decision: lazy ids — an entry gains an id only when something
cites it; uncited entries carry no overhead.

## Scope

- schema.ts Clarification: optional id (kebab-case slug, unique per node);
  validateNode currently DROPS unknown keys, so this schema change must land
  before any id is stored.
- validate-graph rule: every '<node-id>#<slug>' citation in statement,
  rationale, clarification, or condition text resolves to an existing entry
  id on the named node; unresolved citations fail with the offending source
  field named.
- Upgrade pass: convert the question-anchored interim refs (2026-07-09 fixes
  on strategy-graph-native-dispatch, and any '(the ... clarification,
  <date>)' forms) to id citations, assigning slugs to the cited entries.
- Ordinal refs elsewhere upgrade opportunistically as nodes are next amended
  — no big-bang rewrite of 44-entry histories.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
Plus: author a dangling citation locally and confirm validate-graph rejects it.
