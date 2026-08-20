---
id: tactic-eval-finding-lock-wait
kind: tactic
statement: Stop dispatch-eval-finding from silently dropping an occurrence when
  it loses the graph-write lock — a fire-and-forget caller never re-invokes, so
  the recurrence count under-counts
owner: ai
status: raw
parent: null
rationale: Recorded 2026-08-12 /align round, from a defect measured while
  auditing the collapse rather than from a hypothesis. dispatch-eval-finding
  skips on lock contention and warns the caller to re-invoke; its principal
  caller is the per-phase evaluator, spawned fire-and-forget by
  dispatch-ladder-run, which nobody re-invokes. Concurrent ladders therefore
  under-count exactly the metric the ledger exists to carry.
reading: null
serves:
  - strategy-recursive-self-improvement
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: done
execution:
  branch: strategy-recursive-self-improvement
  pr: 3074
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion:
    mergedAt: 2026-08-13T03:26:48Z
    mergeCommitSha: c3c229f0de63db09df7dc01ce02177f3d1b56c95
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Stop dispatch-eval-finding from silently dropping an occurrence when it loses the graph-write lock — a fire-and-forget caller never re-invokes, so the recurrence count under-counts

Recorded by the 2026-08-12 `/align` collapse round.

## The defect

`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding` takes a
per-checkout mutex around the graph write. On contention it does not wait — it
prints "another graph writer holds … skipping this pass … THIS OCCURRENCE WAS
NOT COUNTED, re-invoke to record it" and exits 0.

That contract is correct for an attended caller who can read the warning and
re-run. It is wrong for the caller it actually has: `dispatch-ladder-run`
spawns the per-phase evaluator as a detached background job at every phase
boundary and does not wait on it, by design. Nothing reads the warning and
nothing re-invokes. With several phases or several ladders live, occurrences are
dropped silently.

Why it matters more than a dropped log line: `recurrence_count` is the figure
the ledger exists to carry, and under-counting it makes a recurring finding look
novel — which is precisely the failure the finding-ledger design says it must
not have. A ledger that under-counts is worse than no ledger, because it is
believed.

## Scope

Bounded wait-and-retry on the mutex rather than immediate skip, with the bound
and the give-up path both explicit. Consider making the behaviour depend on the
caller — an attended invocation may still prefer to skip and report — but do not
default an unattended caller to the lossy branch.

A skip that does happen must remain **loud and attributable**: the occurrence
that was dropped, the slug it belonged to, and the writer that held the lock.

## Out of scope

Redesigning the lock. The mutex is the right primitive; only the contention
behaviour is wrong.

## Done-when

Two evaluators racing the same slug both land their occurrence, and
`recurrence_count` reads 2 rather than 1. This is mechanically testable with a
stubbed lock holder and should be tested, not reasoned about — the existing
suite already stubs graph writes.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-eval-finding.sh
```
