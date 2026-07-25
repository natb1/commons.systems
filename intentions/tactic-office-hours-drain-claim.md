---
id: tactic-office-hours-drain-claim
kind: tactic
statement: Every office-hours drain joins the node-id reservation ledger
  regardless of launch path — subagent fan-out and interactive drains included —
  so a drain cannot race the fleet or a second drain
owner: ai
status: raw
parent: null
rationale: Byproduct of the 2026-07-25 concurrency/serialization review on
  strategy-graph-native-dispatch. tactic-office-hours-concurrency-dedup closes
  the duplicate-launch window only for sessions launched through
  office-hours-graph, whose occupancy check keys on the session name
  office-hours-<node-id>. A drain launched any other way writes no reservation
  marker and registers no matching session name, so it is invisible to both
  halves of the claimed set and races the dispatch fleet.
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
# Every office-hours drain joins the node-id reservation ledger regardless of launch path — subagent fan-out and interactive drains included — so a drain cannot race the fleet or a second drain

## Context

Retained byproduct of the 2026-07-25 concurrency/serialization review
(`strategy-graph-native-dispatch`, "Does the greenfield design enforce
serialization…"). Not yet planned — `/align-tactics` owns decomposition.

The claimed set has two halves (`graph-select-target`, the claim block):
a reservation-ledger marker named by node id, and
`worktree_has_live_session` on `<root>/.claude/worktrees/<node-id>`, which is
name-keyed on the worktree basename. The office-hours lane satisfies neither
unless it was launched through `office-hours-graph`, which names its session
`office-hours-<node-id>` and is the only place the occupancy check runs.

Consequence: a drain run as a subagent fan-out, from an interactive session, or
from an emulated skill is invisible to dedup. It races both the dispatch fleet
and a second drain, and nothing records that a park is being worked.

Live evidence (2026-07-25): while this session held an unexecuted author grant
for one resolution of `tactic-graph-router-live-worker-visibility`, a concurrent
fleet actor landed the opposite resolution and cleared the park. The design
question was settled by push timing. The only race detector that fired was a
non-fast-forward push rejection, which is late by construction.

## Scope sketch (for /align-tactics, not a plan)

- In scope: a claim step every drain entry path must take, writing a node-id
  reservation marker before diagnosis and clearing it at terminal disposition.
  Reuse `reservation_write` / `reservation_clear` / `reservation_exists` from
  `.claude/skills/dispatch-propagate/scripts/lib-reservation-ledger.sh` — the
  ledger already accepts node-id markers; only the drain lane's callers are
  missing.
- Note the ledger's boot-grace and `reservation_sweep` reclaim rules: a drain
  that outlives its launching session must not be swept as dead-session-stranded
  mid-interview. A human interview can run far longer than the 30s boot grace,
  so sweep interaction is a genuine design question for the planning round, not
  an implementation detail.
- Out of scope: the office-hours-graph launch path's existing dedup, delivered
  by `tactic-office-hours-concurrency-dedup` (PR #2945). This tactic is the
  residual only.

## Related

`tactic-office-hours-concurrency-dedup` (the launch-path half),
`tactic-drain-disposition-diagnosis-cas` (the write-time half of the same race),
`tactic-claim-dedup-only` (claiming is scheduling dedup, never an edit block).
