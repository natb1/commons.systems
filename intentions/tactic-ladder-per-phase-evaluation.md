---
id: tactic-ladder-per-phase-evaluation
kind: tactic
statement: Make /dispatch-ladder evaluate at every phase boundary — the driver
  spawns a fire-and-forget per-phase evaluation job and never waits — and narrow
  the closing pass to cross-phase synthesis only
owner: ai
status: raw
parent: null
rationale: "Drafted 2026-08-12 /align round, carrying the amendment to rsi
  condition 14 recorded the same day. Cross-cutting serves is honest, not
  nearest-fit: the REVIEW CONTRACT is owned by
  strategy-recursive-self-improvement (condition 14), while the ARTIFACT —
  .claude/skills/dispatch-ladder/SKILL.md and its scripts — is owned by
  strategy-graph-native-dispatch, which owns the dispatch skill surface."
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
blocked_by:
  - tactic-audit-instrument-scoping
  - tactic-rsi-session-sweep-trigger
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Make /dispatch-ladder evaluate at every phase boundary — the driver spawns a fire-and-forget per-phase evaluation job and never waits — and narrow the closing pass to cross-phase synthesis only

Drafted by the 2026-08-12 `/align` round. Carries rsi condition 14's
two-tier amendment of the same date; read that condition and the
"Should the acceleration review run after each phase" clarification on
`strategy-recursive-self-improvement` for the reasoning this node executes.

## What changes

`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run` — at each phase
boundary (the `awaited` event, `dispatch-ladder-run:677`) spawn an evaluation
job scoped to the session that just finished, **fire-and-forget**. The driver
must not wait on it: "it sequences; it never gates" and the no-model-turn-in-
the-loop premise are the whole reason this is a detached shell script, and a
blocking evaluation would reintroduce exactly what the script removed.

`.claude/skills/dispatch-ladder/SKILL.md` §"The closing acceleration review" —
narrow it to the cross-phase synthesis only: rework loops across phases, the
halt-cause taxonomy, end-to-end wall clock against the plan. Everything
phase-local moves to the per-phase evaluator.

Halt paths (`halt()`, exit 10/11/12/13/21) must also run the evaluation owed for
the phases that DID complete. Today a halted run records nothing, so the most
defect-rich runs produce no review at all — this is an independent defect, not
merely a consequence of the granularity change.

## Evidence the evaluator reads

Already exists, nothing new to instrument:

- `<main-root>/.claude/worktrees/<node-id>.ladder/events.jsonl` — `elapsed_s`,
  `window_s`, `await_repolls`, and the disposition vocabulary
  (`grace-wait` / `ci-wait` / `stalled` / `throw`).
- the phase session's transcript, read through the audit instrument scoped to
  that session (`tactic-audit-instrument-scoping`), never by hand.
- the node's `execution.fix.attempt` and conflict-attempt counters, for the
  rework lens.

## Required lenses

Per rsi condition 14 as amended: recurring errors causing quality issues;
unnecessary round trips; variances requiring intervention; rework and backtrack
rate; plan-quality yield; calibration and waiting; friction and adherence.

## Bounds

- Findings land as ledger entries (`tactic-eval-finding-ledger`) — merged into
  one node with summary metrics, never a node per occurrence.
- The evaluator **records; it never executes**. The `/fewer-permission-prompts`
  step is attended-only and belongs to the periodic audit
  (`tactic-audit-permission-friction`), not here.
- It never invents an orchestration rule. A finding that wants one is recorded
  for the author, not applied.

## Open question for planning

Model tier and effort for the evaluator are unset. It is a small, bounded,
mechanical read over one session — a Sonnet or Haiku candidate — but the cost
of N evaluations per ladder against the freshness they buy is **unmeasured**,
and rsi condition 14's "no extra budget cost" clause was retired on that
expectation. Measuring it is part of this unit's acceptance.

## Superseded in part — 2026-08-14 `/align` round

This node's statement says the driver evaluates at **every** phase boundary.
That is no longer the doctrine. The 2026-08-14 round amended the every-run
evaluation condition on `strategy-recursive-self-improvement` twice over:

1. **Both drivers, not just the ladder.** The trigger is keyed on the *session*
   (a sweep over ended sessions' `dispatch-stamp` sidecars), not on a driver's
   control flow, so it covers tick-spawned phase and unattended-intervention
   sessions too. Carrier: `tactic-rsi-session-sweep-trigger`.
2. **Threshold-gated, not automatic.** Four trigger families — outcome
   (unconditional), relative cost-per-unit-of-change, an absolute ceiling, and a
   sampling floor. Carrier: `tactic-rsi-trigger-threshold-gate`.

What survives unchanged: the fire-and-forget spawn that never blocks the driver,
the narrowed closing cross-phase synthesis, the record-only bounds, and — now
explicitly protected against the gate — the halt clause.

The "Open question for planning" above is partly answered: the cost of N
evaluations per ladder is what the gate exists to bound, and the 2026-08-13
measurement recorded on the strategy ($37.47 of $76.09 outside a review that
returned 0 actionable findings) is the first datapoint. The model/effort
question is still open.

Note also that "condition 14" as cited throughout this body is an ordinal that
no longer resolves — the conditions array now has 16 entries and the one meant
is index 7. The general defect is tracked by `tactic-clarification-citation-ids`.
