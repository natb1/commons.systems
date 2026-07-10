---
id: tactic-omit-default-serialization
kind: tactic
statement: writeNode omits default-valued fields — ~3,700 lines of serialized
  defaults stop being written; normalization is incremental
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round
  (author-confirmed): serialized defaults are ~19% of frontmatter bulk,
  fingerprint the authoring tool, and put dispatch fields on records-not-goals
  kinds. validateNode already applies defaults, so omission is lossless and
  backwards compatible today."
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
# tactic-omit-default-serialization

## Context

286 nodes carry ~3,704 frontmatter lines of pure default values
(reading: null, recovers: [], pace_exempt: false, rounds: null, ...).
validateNode applies defaults on read, so omitted fields are ALREADY valid —
11 nodes omit them today. Decision: omit-when-default at write.

## Scope

- store.ts writeNode: before stringify, drop every optional field whose value
  deep-equals its validateNode default (parent null, serves [], recovers [],
  rationale null, reading null, gap null, clarifications [], tooling_goals [],
  success_signal null, attention null, phase null, execution null,
  validates [], blocked_by [], office_hours null, pace_exempt false,
  rounds null, attributes {}).
- Round-trip tests: write(read(x)) stable; omitted and explicit forms
  validate identically.
- NO validator rule rejects explicit defaults — normalization is incremental
  as nodes are rewritten through writeNode (backwards compatible; no flag
  day). An optional one-shot normalization sweep over intentions/ may ride
  along as a separate commit if review prefers a single convention landing.

## Verification

```verify
npx vitest run --project intentionsutil --root .
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
