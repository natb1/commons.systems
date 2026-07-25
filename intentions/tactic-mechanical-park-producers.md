---
id: tactic-mechanical-park-producers
kind: tactic
statement: "Mechanical retry holds stop being office_hours parks: the
  provision-exit-11 path and the fix-attempt-cap park emit blocked_by edges
  against a tracked fix tactic instead, and tactic-router-failure-fuses is
  re-scoped to match"
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-25 concurrency/serialization review,
  implementing the park-taxonomy clarification recorded the same day. A park
  asserts that no autonomous path forward exists and a human is required, but a
  merge conflict against a moving main frequently self-resolves. At recording
  time roughly five of the most recent commits on main were provision-exit-11
  parks, burying the genuinely author-required parks.
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
  rationale: "Author-directed 2026-07-25: the queue-serialization work
    (dispatch-queue claim integrity, office-hours drain claiming, and the
    cross-queue landing path) is the current focus. Own boost 85 composes with
    the +5 inherited from strategy-graph-native-dispatch to an authored 90 —
    exact parity with tactic-graph-router-live-worker-read-robust, the existing
    author-set boost on this same defect class — and deliberately below
    strategy-main-health's standing 100 so the main-health signal keeps its
    recorded dominance."
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "graph-commit: mechanical-unresolved — 1 field(s) diverged across
    concurrent writes and could not be auto-merged (layers 1-3 exhausted)"
  since: 2026-07-25
  recommendation: >-
    A concurrent writer landed an overlapping edit to this node while this
    session's edit was in flight; this writer's content was NOT landed. This
    session's unlanded content is preserved at
    /tmp/tmp.5q83lp7pJ1/tactic-mechanical-park-producers.md (this machine only —
    may not survive past this session). Recommended: the losing writer re-reads
    the current origin/main content, manually merges in its intended edit, and
    re-runs graph-commit on the merged result — that same commit clears this
    office_hours park. A third session encountering this park while the loser is
    still working should wait rather than attempt its own merge (the mailbox
    discipline).


    Diverged field 'attention' on tactic-mechanical-park-producers:
      this session's value: null
      origin/main's value: {"boost":85,"override":null,"rationale":"Author-directed 2026-07-25: the queue-serialization work (dispatch-queue claim integrity, office-hours drain claiming, and the cross-queue landing path) is the current focus. Own boost 85 composes with the +5 inherited from strategy-graph-native-dispatch to an authored 90 — exact parity with tactic-graph-router-live-worker-read-robust, the existing author-set boost on this same defect class — and deliberately below strategy-main-health's standing 100 so the main-health signal keeps its recorded dominance."}
pace_exempt: false
rounds: null
attributes: {}
---
# Mechanical retry holds stop being office_hours parks: the provision-exit-11 path and the fix-attempt-cap park emit blocked_by edges against a tracked fix tactic instead, and tactic-router-failure-fuses is re-scoped to match

## Context

Retained byproduct of the 2026-07-25 concurrency/serialization review
(`strategy-graph-native-dispatch`, park-taxonomy clarification). Not yet planned.

A park asserts that no autonomous path forward exists under current graph
direction and a human is required. Provision exit 11 ("origin/main does not
merge clean into this tactic's branch") does not meet that bar: it is a race
against a moving main that frequently self-resolves. At recording time roughly
five of the most recent commits on main were provision-exit-11 parks; stale ones
were cleared by hand in this round and the prior one, burying the genuinely
author-required parks beneath mechanical noise.

The author's disposition (2026-07-25): fix the PRODUCERS, add no schema field.
The terminal-disposition doctrine already prescribes the handling — a mechanical
hold converts to `blocked_by` edges against a tracked fix tactic and clears in
the same `graph-commit`.

## Scope sketch (for /align-tactics, not a plan)

- Producers to audit: the provision-exit-11 park path (callers of
  `provision-node-worktree` acting on exit 11) and the fix-attempt-cap park in
  `graph-select-target` (`apply-fix-state --park-if-capped` plus its
  `graph-commit`). The review named these two; the planning round should
  enumerate every `office_hours` writer rather than trust that list — it was not
  verified exhaustive.
- Re-scope `tactic-router-failure-fuses` (status raw), which currently proposes
  routing new mechanical no-progress and systemic-breaker failures into the same
  `office_hours` queue. Its per-node fuse and systemic breaker are wanted; their
  destination is not.
- Rejected alternative, recorded: a park-kind field on the
  `tactic-office-hours-session-type` precedent. It adds a second taxonomy to the
  same record to describe states doctrine says should not be parks at all.
