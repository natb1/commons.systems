---
id: tactic-drain-disposition-diagnosis-cas
kind: tactic
statement: An office-hours drain records the node's origin/main blob at
  DIAGNOSIS time and passes it as graph-commit --base when it executes the
  disposition, so a fleet write landing during the human interview window is
  refused mechanically instead of silently losing the race
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-25 concurrency/serialization review.
  tactic-clear-park-primitive supplies clear-park with --base compare-and-swap,
  but captures the base immediately before landing (park-node's pattern), so it
  catches only a write concurrent with the land itself. The interview window —
  diagnosis, author question, author answer, execution — stays unguarded, and
  that is precisely the window the 2026-07-25 graph-router race landed in.
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# An office-hours drain records the node's origin/main blob at DIAGNOSIS time and passes it as graph-commit --base when it executes the disposition, so a fleet write landing during the human interview window is refused mechanically instead of silently losing the race

## Context

Retained byproduct of the 2026-07-25 concurrency/serialization review
(`strategy-graph-native-dispatch`). Not yet planned.

`park-node` establishes the compare-and-swap pattern: fetch `origin/main`,
refresh the local node file from it, capture the blob SHA, mutate, then pass
`--base "<id>=<sha>"` to `graph-commit`, which refuses the write if
`origin/main` advanced. `tactic-clear-park-primitive` (PR #2947) carries the
same pattern into `clear-park`.

The gap is WHEN the base is captured. Both capture it immediately before
landing, so they detect only a write concurrent with the land itself. An
office-hours drain has a much longer critical section: diagnose → ask the
author → wait → execute. A fleet write landing anywhere in that window is
invisible, and the disposition executes against a node that has since changed.

## Scope sketch (for /align-tactics, not a plan)

- In scope: carry a base token captured at DIAGNOSIS through to execution, so a
  mid-interview write is refused mechanically rather than caught late by a
  non-fast-forward push or not at all. `dump-node.ts --out-dir` already emits
  exactly such a manifest (it is what `/align-strategy` and `/align-tactics`
  pass to `graph-commit --base`), so the primitive exists; what is missing is
  the drain lane threading it through the interview.
- Design question for the planning round: a refusal is the correct outcome, but
  the drain must then re-diagnose rather than abort — the refusal has to route
  back into the review, not into a park.
- Out of scope: `clear-park`'s own land-time CAS (`tactic-clear-park-primitive`).

## Related

Supersedes the prose-only mitigation currently carried as session memory
("re-verify before executing a granted disposition"), converting session
discipline into mechanism — the same upgrade the 2026-07-06 base-version
clarification made for read-freshness generally.
