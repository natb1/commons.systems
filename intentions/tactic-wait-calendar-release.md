---
id: tactic-wait-calendar-release
kind: tactic
statement: Give the WAIT hold node a calendar release predicate —
  attributes.wait_until, swept by dispatch-sweep, re-armed in place
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-07-31 /align-strategy calendar-blocking round
  (second round of that date). The WAIT hold node ratified earlier the same day
  has a shape, a counter and a cap but no release predicate for an event with no
  readable signal — the deploy-lag case it was created for. This node carries
  the implementing work for the calendar-release clarification recorded that
  round; that clarification, not this node, is the authoritative record of the
  decisions. Distinct from tactic-qa-main-verifiability-sort-criterion, which
  owns the machine-verifiable-vs-author-required SORT: this node owns the HOLD
  MECHANISM the sort's third outcome routes into. Retained as a draft byproduct,
  unrefined — /align-tactics owns the plan."
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
# Give the WAIT hold node a calendar release predicate — attributes.wait_until, swept by dispatch-sweep, re-armed in place

# tactic-wait-calendar-release

Draft byproduct of the 2026-07-31 `/align-strategy` calendar-blocking round.
Unrefined by design — `/align-tactics` owns the plan. The authoritative record
of every decision below is the calendar-release clarification on
`strategy-graph-native-dispatch` recorded that date; this body carries only the
implementation surface the interview identified.

## Known work surface

- **Sweep predicate.** One more predicate on `dispatch-sweep` (the existing tick
  sweep framework — it already reads `nodeMinAgeSeconds` from its config).
  `now >= attributes.wait_until` → set the WAIT node `phase: done`, which clears
  the source's `blocked_by` via `blockersComplete`
  (`packages/intentionsutil/src/router.ts:168-175`). Never a second sweep — the
  strategy's one-framework rule.
- **Router exclusion — already required, now wider.** `router.ts:343-355` emits
  a phase-less, `office_hours`-null tactic as an `/align-tactics` candidate.
  Without an explicit exclusion the router spawns an align worker on every WAIT
  node. Same shape as the `subtreeParentIds` skip immediately above it. The
  earlier WAIT ratification already required this; re-arming makes it wider,
  because a re-armed node returns to phase-less and re-enters that loop.
- **Cap and escalation.** `attributes.attempts` incremented on each re-arm; on
  cap exhaustion the sweep writes `office_hours` onto the WAIT node, making it a
  genuine park that does reach the author. The cap is owned by the sweep, not by
  whoever authors the node.
- **Re-arm, never re-mint.** One WAIT per source, deterministic id
  `tactic-wait-<source-id>`. Re-arm sets `phase` back to null, pushes
  `wait_until`, increments `attempts`. `source.blocked_by` does not churn.
- **Birth-time duration.** The qa phase sets the initial `wait_until` when it
  records the needs-main follow-up (default 24h); `/qa-main` revises it on each
  re-arm.

## Recorded residual risk — accepted, not mitigated

Pruning is agent-driven via the owed-prune census, not script-driven
(`packages/intentionsutil/scripts/graph-commit:179-180`), which is what makes
re-arm-in-place viable at all. But a census that prunes a released WAIT between
release and re-arm resets `attempts` to 1 and the cap becomes unreachable. The
failure direction is a wait that retries too long — visible to the author — not
a silent pass. A planning round may choose to close this (pin the node against
prune, or move the counter) or to leave it accepted.

## Verification sketch — direction only

- A WAIT node with `wait_until` in the future holds its source: the source is
  absent from selector candidates, and the WAIT itself is absent from both the
  `/align-tactics` candidate list and `officeHoursQueue`.
- After `wait_until` passes, the sweep sets `phase: done` and the source
  re-enters selection.
- A re-arm increments `attempts` and re-holds the source without touching
  `source.blocked_by`.
- At the cap, `office_hours` is written and the node appears in the
  office-hours queue.
