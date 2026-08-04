---
id: tactic-hold-alerts-uncapped-alert-rows
kind: tactic
statement: listUnclaimedHoldAlerts has no cap on the number of alert rows it
  returns — a backlog of unclaimed manual holds against a few high-attention
  sources scales both the per-pass claim-probe count and the pushed alarm-node
  body size without limit
owner: ai
status: raw
parent: null
rationale: "Deferred cost finding from the /review-fix pass on PR #3036
  (tactic-unclaimed-hold-alerting), source lens \"cost\", ADVISORY — not
  adversarially verified (cost findings route straight to Deferred per
  review-fix's disposition table). Location:
  packages/intentionsutil/src/hold-alerts.ts:156. opts.topK gates which SOURCES
  count as important; it does not bound how many alert ROWS are emitted. Several
  manual holds can name the same top-K source via hold_for, and the loop at
  hold-alerts.ts:139-157 pushes one row per qualifying hold with no limit
  applied before or after the sort. Every returned row costs up to four claim
  probes in dispatch-fleet-watch's candidate loop (two of them live daemon
  round-trips), and every row is concatenated into the alarm node body written
  to the graph and pushed to origin/main. A backlog of unclaimed manual holds
  against a few high-attention sources therefore scales both the per-pass probe
  count and the alarm document size without limit. Recommended fix (from the
  finder, not verified): add an optional maxAlerts to HoldAlertOpts and truncate
  after the final sort (hold-alerts.ts:159-166); expose it as a --limit flag on
  list-unclaimed-hold-alerts.ts and pass a bounded value from
  dispatch-fleet-watch; render the alarm body as the capped list plus an \"and N
  more\" tail so a growing backlog does not grow the node body unboundedly.
  Source PR: #3036."
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
# listUnclaimedHoldAlerts has no cap on the number of alert rows it returns — a backlog of unclaimed manual holds against a few high-attention sources scales both the per-pass claim-probe count and the pushed alarm-node body size without limit

## Provenance

Deferred **cost** finding (ADVISORY, not adversarially verified — cost findings
route straight to Deferred per `/review-fix`'s disposition table) from the
`/review-fix` pass on `tactic-unclaimed-hold-alerting`, source PR #3036.

- **Location:** `packages/intentionsutil/src/hold-alerts.ts:156`
- **Failure scenario:** `opts.topK` gates which SOURCES count as important; it
  does not bound how many alert ROWS are emitted. Several manual holds can
  name the same top-K source via `hold_for`, and the loop at
  `hold-alerts.ts:139-157` pushes one row per qualifying hold with no `limit`
  applied before or after the sort. Every returned row costs up to four claim
  probes in `dispatch-fleet-watch`'s candidate loop (two of them live daemon
  round-trips), and every row is concatenated into the alarm node body written
  to the graph and pushed to `origin/main`. A backlog of unclaimed manual
  holds against a few high-attention sources therefore scales both the
  per-pass probe count and the alarm document size without limit.
- **Adversarial verdict:** none — cost findings are advisory by design and were
  not routed through the verify/skeptic stage.
- **Recommended fix (from the finder, unverified):** add an optional
  `maxAlerts` to `HoldAlertOpts` and truncate after the final sort
  (`hold-alerts.ts:159-166`); expose it as a `--limit` flag on
  `list-unclaimed-hold-alerts.ts` and pass a bounded value from
  `dispatch-fleet-watch`; render the alarm body as the capped list plus an
  "and N more" tail so a growing backlog does not grow the node body
  unboundedly.
