---
id: tactic-align-tactics-premise-preflight
kind: tactic
statement: /align-tactics runs its blocking-premise check before the drift
  review and decomposition, so a node that cannot be planned parks cheaply
  instead of after a full-length session
owner: ai
status: raw
parent: null
rationale: "Retained (retain-not-refine) from the 2026-08-12 /align interview
  that recorded the self-consistency condition on
  strategy-graph-native-dispatch. The artifact is the /align-tactics skill,
  owned by that strategy. Unlike its two sibling mechanisms this one does not
  prevent the defect — it reduces the cost of discovering one: the 2026-08-12
  /dispatch-ladder run spent roughly 13 minutes of Opus before parking
  tactic-attention-namespaced-rank (2184103c) on a premise that was already
  unratified when the session started. UNVERIFIED PREMISE, flagged at record
  time by the recording session: the saving assumes the blocking-premise check
  can legally run before the drift review, which was NOT confirmed against
  /align-tactics' actual step order during the interview. A planning session
  must establish that ordering first; if the drift review is a prerequisite of
  premise detection, this tactic reduces to a smaller saving or to nothing.
  RECURRENCE 2026-08-14, second observed instance — recorded here rather than
  minted as a second node, per the find-before-minting rule and the whole-graph
  search set recorded on strategy-graph-native-dispatch the same day. A
  /dispatch-ladder run on tactic-align-review-skill spent 964s (16m04s) of Opus
  inside /align-tactics, 53.6% of the 1800s default await window
  (dispatch-ladder-run:372), and advanced zero rungs before parking on an
  unratified premise: the --review gate's discrimination mechanism (parked
  4e7131f1, cleared fe3ad88c once the author ratified option (a), the
  caller-declared seam). Same shape as the 2026-08-12 instance — the premise was
  already unratified when the session started — and 24% costlier; cumulative
  measured spend across the two instances is roughly 1744s. This instance does
  NOT settle the unverified premise above, and this round declines to claim that
  it does. The contradiction's STATEMENT is a two-document read — this node's
  item 3 against the serving strategy's scoping ruling, both readable without
  the drift review — but the park's own CONFIRMATION of it required verifying
  the item-3 predicate against five caller implementations in the codebase (the
  park text records 'Verified against origin/main d5770f6e' for /align-tactics,
  qa-fix, dispatch-diagnose-main, dispatch-eval-finding and /context-chunks).
  Whether a blocking-premise check placed before the drift review would have
  reached that confirmation cheaply is exactly the ordering question a planning
  session must establish first, and it remains open."
reading: null
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
attributes:
  measured_impact:
    - metric: align_tactics_s_before_park
      value: 964
      unit: seconds
      window: tactic-align-review-skill ladder 2026-08-14T14:57:37Z..15:13:41Z
      sensor: events.jsonl launched-to-halt delta
      measured: 2026-08-14
    - metric: ladder_rungs_advanced_for_that_spend
      value: 0
      unit: count
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: share_of_await_window_consumed
      value: 0.536
      unit: fraction
      window: tactic-align-review-skill ladder 2026-08-14, 1800s default TIMEOUT_S
        (dispatch-ladder-run:372)
      sensor: events.jsonl + dispatch-ladder-run default
      measured: 2026-08-14
    - metric: align_tactics_s_before_park_prior_instance
      value: 780
      unit: seconds
      window: tactic-attention-namespaced-rank ladder 2026-08-12, park 2184103c —
        approximate, 'roughly 13 minutes' as recorded in this node's rationale
      sensor: node rationale
      measured: 2026-08-12
    - metric: instances_observed
      value: 2
      unit: count
      window: 2026-08-12..2026-08-14
      sensor: graph read + events.jsonl
      measured: 2026-08-14
    - metric: cumulative_autonomous_s_before_park
      value: 1744
      unit: seconds
      window: 2026-08-12 and 2026-08-14 instances combined
      sensor: events.jsonl + node rationale
      measured: 2026-08-14
---
# /align-tactics runs its blocking-premise check before the drift review and decomposition, so a node that cannot be planned parks cheaply instead of after a full-length session
