---
id: tactic-rsi-trigger-threshold-gate
kind: tactic
statement: Gate /rsi on four trigger families — outcome (unconditional),
  relative cost-per-unit-of-change, an absolute ceiling, and a sampling floor —
  with k, the ceiling and N author-owned config
owner: ai
status: raw
parent: null
rationale: "Drafted by the 2026-08-14 /align round, carrying the four-family
  trigger condition and the counted-skip condition recorded that day.
  Cross-cutting serves for the same reason as its sibling
  tactic-rsi-session-sweep-trigger: the trigger CONTRACT is
  strategy-recursive-self-improvement's, the dispatch-surface artifacts it edits
  are strategy-graph-native-dispatch's."
reading: null
serves:
  - strategy-recursive-self-improvement
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
# Gate /rsi on four trigger families — outcome (unconditional), relative cost-per-unit-of-change, an absolute ceiling, and a sampling floor — with k, the ceiling and N author-owned config

# Gate /rsi on four trigger families — outcome (unconditional), relative cost-per-unit-of-change, an absolute ceiling, and a sampling floor — with k, the ceiling and N author-owned config

Drafted by the 2026-08-14 `/align` round. Read the four-family trigger condition, the
counted-skip condition, and the "Which trigger families" clarification on
`strategy-recursive-self-improvement` at `origin/main`; they are authoritative and this is
their mechanism.

## The four families

| family | fires when | gated by cost? |
| --- | --- | --- |
| **outcome** | halt (exit 10/11/12/13/21), rework (`execution.fix.attempt` incremented, a conflict attempt, a demotion back to `implement`, scope-fingerprint custody churn), a new tool-error signature, a permission denial, a park | **no — unconditional** |
| **relative** | cost-per-unit-of-delivered-change > `k` × trailing 28d median for that phase kind | yes |
| **absolute** | cost-per-unit-of-delivered-change > an author-set ceiling | yes |
| **sampling floor** | 1-in-`N` of everything else | n/a |

`k`, the ceiling and `N` are configurable — and **author-written only**. The model may recommend
a change with measured justification and never writes one (condition 10's ratified
recommend/write split, applied to this actuator).

## Why not the 95th percentile as prompted

A percentile is self-normalizing: ~5% of phases trip it however good or bad the harness becomes,
so it can never say "things are fine now" nor "everything is bad". It is a fixed-rate budget
allocator, not an anomaly detector.

**The ratio-to-median that replaced it has the same defect** — a uniform 3× regression moves the
median with it and nothing fires. That is why the absolute family exists; it is the answer to the
blindness, not an afterthought. The 28-day relative window is long for the same reason: a short
window lets a recent regression become the new normal.

## Why cost-per-unit-of-delivered-change rather than raw token magnitude

Measured, not asserted. The 2026-08-13 review phase of `tactic-attention-namespaced-rank`
(PR #3075, `elapsed_s` 1026) spent ~830 of 1026 seconds and $37.47 of $76.09 outside the review
itself, on a one-file +2/-2 delta that returned 0 actionable findings; 7 of its 12 subagents
reviewed nothing. That phase was **cheap in absolute terms**, so a magnitude gate would have
missed it — while flagging a large `implement` phase that was expensive only because the work
was big. The denominator is what carries the signal.

## The counted-skip requirement is not optional

A skipped session must be **counted**. Condition 9 forbids silently dropping an occurrence; a gate
corrupts the ledger worse than lock contention does, because it changes the DENOMINATOR silently —
"recurred 3 times" is uninterpretable when you cannot tell 3-in-100-phases from 3-in-5-evaluated.
Record the skipped population so recurrence reads as a rate; the sampling floor is the unbiased
estimator for the skipped body.

Note for whoever compares figures across this change: recurrence counts recorded BEFORE the gate
ships were measured against full coverage, so the denominator breaks at the cutover.

## Relationship to the lens catalog

This gate decides **whether** `/rsi` runs. `tactic-rsi-lens-catalog-decomposition` decides **what
it does** once running. They compose and neither blocks the other, but a session implementing this
should read that node first so the gate is written against the target architecture rather than the
prose-lens one it replaces.

Do not confuse the trigger metric with
`lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips`
(`tactic-rsi-round-trips-lens-carrier`). That is a **lens**, read INSIDE an evaluation to explain
where spend went. This is a **trigger**, read OUTSIDE to decide whether to evaluate at all.
