---
id: tactic-pace-exempt-ceiling-fanout
kind: tactic
statement: Pace-exempt bypass fills to the worker ceiling and never exceeds it
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-07-31 /align-strategy fleet-scheduling
  exception-lanes round. dispatch-select-tick's autonomous at-cap block diverges
  from the record in two opposite directions at once, and one ratified rule
  fixes both: it admits only ONE pace-exempt worker per gate firing (narrower
  than the amended fill-to-ceiling rule) while consulting no ceiling at all
  (wider than the standing max_concurrent_workers invariant) — and because the
  gate re-evaluates every tick with no memory of a prior bypass, that unbounded
  half can compound across ticks, not just overshoot by one. Both are defects
  against the record, not design choices."
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
# Pace-exempt bypass fills to the worker ceiling and never exceeds it

Draft byproduct of the 2026-07-31 `/align-strategy` round that ratified the
fleet-scheduling exception lanes (see the clarification of that date on
`strategy-graph-native-dispatch`). Retained context, not a plan — the scope
below is what the interview established, and decomposition is
`/align-tactics`' job.

## The two defects, both in one block

`.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`, the autonomous
at-cap branch (the `if (( LIVE_COUNT >= TARGET_N ))` block, roughly lines
650–712 as of 2026-07-31):

1. **Too narrow.** It probes
   `graph-select-target --pace-exempt-only --top 1` and admits exactly one
   gate-exempt worker. The ratified rule is fill-to-headroom.
2. **Too wide, and not bounded to "max + 1".** The block never reads
   `MAX_WORKERS` at all — verified: zero occurrences of `MAX_WORKERS` between
   the start of the autonomous block and its hard-cap exit, while the
   `--manual` branch below it does resolve `dispatch-target-workers --max`.
   The branch fires on `LIVE_COUNT >= TARGET_N` whatever `TARGET_N` is, and
   admits one more worker than whatever is currently live at that instant —
   not specifically one more than `max_concurrent_workers`. Worse, the gate is
   re-evaluated fresh every tick with no memory of a prior bypass: the
   spawned worker counts as busy on the next tick, `LIVE_COUNT` is still
   `>= TARGET_N` (trivially so at a paced-to-zero curve, `0 >= 0`), and the
   lane can fire again — admitting yet another worker. So the overage
   compounds across ticks, bounded only by how many distinct selectable
   `pace_exempt` candidates exist, not by `max_concurrent_workers` (this code
   path never reads it) and not by a single "+1". It contradicts the standing
   ceiling invariant that predates this round.

The two are not independent bugs to fix separately: computing the headroom is
what fixes both at once.

## Shape of the fix

Resolve `MAX_WORKERS` in the autonomous block the way the `--manual` block
already does, then admit
`PACE_GAP = max(0, MAX_WORKERS - LIVE_COUNT)` pace-exempt workers, passing that
count through as `--top "$PACE_GAP"`. When `PACE_GAP` is 0 the lane admits
nothing and the branch falls through to the existing main-broken probe and hard
cap, so the ceiling becomes genuinely absolute for autonomous work.

Mechanically small — the pieces already exist:

- `graph-select-target` accepts `--top <n>` and it composes with
  `--pace-exempt-only` (only `--node` is mutually exclusive with them).
- `emit_graph_selection` already consumes multi-line selector output; the
  ordinary rank-lane fan-out at the bottom of the same script feeds it a
  `--top GAP` result.
- `dispatch-target-workers --max` is the existing accessor for the ceiling.

Unchanged by design: the `--exhausted` hard stop is evaluated **before** the
pace-exempt probe and stays there; `pace_exempt` remains orthogonal to rank
ordering (the probe still walks the rank-ordered candidate list and filters);
and both human-dispatch lanes keep their exactly-one-node ceiling override.

## Verification notes for the eventual plan

The discriminator is the routing decision log, not the flag — `skip_reason` on
`site == "select-tick"` records. `pace-exempt-bypass-at-cap` with `target` set
means the lane fired; `at-cap-no-priority` with `target: "none"` means it was
empty. The end-state observation is several pace-exempt workers concurrently
live with the weekly curve shut, and `effective_live` never exceeding
`max_concurrent_workers`.

Two hazards worth carrying into the plan:

- `graph-select-target` appends to the production `graph-selection.jsonl`, so a
  hand probe contaminates the evidence unless `DISPATCH_SELECTION_LOG_DIR` is
  redirected first.
- Fixture rows already leak into the production routing log from tests that do
  not set an override; a detect reading that log has to tolerate them.
  `tactic-test-decision-log-prod-leak` owns that defect.
