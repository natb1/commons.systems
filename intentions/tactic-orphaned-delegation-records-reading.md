---
id: tactic-orphaned-delegation-records-reading
kind: tactic
statement: read-sensors.ts's readDelegationRecordsReading is now unreachable
  from production code (superseded by two new per-strategy reading functions
  landed on tactic-first-sensor-pass), but it is also the only code implementing
  a doctrine rule about excluding declined delegation records from unexercised
  counts for strategy-exercise-recovery-paths. An author needs to decide whether
  that rule still governs the new readings before the orphaned function and its
  tests can be safely deleted.
owner: ai
status: raw
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution:
  branch: tactic-orphaned-delegation-records-reading
  pr: 3062
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Orphaned readDelegationRecordsReading vs. exercise-recovery-paths counting rule

## Provenance

- `packages/intentionsutil/scripts/read-sensors.ts:899` — dead-code / doctrine-gap
  finding, deferred from the `/review-fix` code-review residue pass on this PR
  (bucket: Deferred, source: code-review). Not routed through the
  input-validation/red-team adversarial-verify pipeline, so no adversarial-verify
  verdict is recorded for it.
- Category: `readDelegationRecordsReading` has no remaining production caller —
  the sensor dispatch now routes `strategy-exercise-recovery-paths` through a
  different, newly added reading function — so only the test file still
  exercises it. Left as-is it can silently drift out of sync with the module.
- The non-trivial part is a semantics question, not a bug: the orphaned
  function is the only place that implements a rule for
  `strategy-exercise-recovery-paths` about not counting a delegation record
  with a "declined" origin as unexercised (such a record has no entered path
  to walk). Whether the newly landed per-strategy reading still needs to honor
  that rule, or whether the rule has been superseded by a simpler threshold
  count, is an open call for a human/author to make before the dead function
  and its tests can be safely removed.
- No runtime bug is implicated; this is dead code plus an unresolved reading-
  semantics decision.

Source PR: #3062

