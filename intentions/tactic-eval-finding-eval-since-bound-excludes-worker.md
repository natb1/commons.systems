---
id: tactic-eval-finding-eval-since-bound-excludes-worker
kind: tactic
statement: The --since epoch dispatch-ladder-run hands each per-phase evaluator
  is stamped AFTER launch verification, ~13s after the worker session starts, so
  the skill prescribed started_at filter silently drops the phase worker itself
  and measures only its subagents — 95 percent of the phase spend and the entire
  outcome object vanish without tripping the empty-selection guard
owner: ai
status: raw
parent: null
rationale: Auto-created by dispatch-eval-finding as an evaluation finding ledger
  entry. Similar findings MERGE into this node — a recurrence updates
  attributes.measured_impact, never mints a second node. See the body for the
  finding.
reading: null
serves:
  - strategy-recursive-self-improvement
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
pace_exempt: true
rounds: null
attributes:
  ledger_entry: true
  first_seen: 2026-08-13
  measured_impact:
    - metric: since_bound_lag_s
      value: 13.2
      unit: seconds
      window: tactic-attention-namespaced-rank qa attempt 4, 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_price_proxy_excluded_share
      value: 0.949
      unit: fraction
      window: tactic-attention-namespaced-rank qa attempt 4, 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_turns_excluded_share
      value: 0.977
      unit: fraction
      window: tactic-attention-namespaced-rank qa attempt 4, 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: since_skew_s
      value: 13.3
      unit: seconds
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: aggregate-usage.sh + events.jsonl
      measured: 2026-08-13
    - metric: excluded_worker_price_proxy_usd
      value: 53.66
      unit: usd
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: excluded_share_of_phase_price_proxy
      value: 0.187
      unit: ratio
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phases_affected_on_this_ladder
      value: 6
      unit: phases
      window: tactic-attention-namespaced-rank ladder 2026-08-12..2026-08-13
      sensor: events.jsonl + aggregate-usage.sh
      measured: 2026-08-13
    - metric: since_bound_offset_s
      value: 13.66
      unit: s
      window: fix phase of tactic-attention-namespaced-rank 2026-08-13T18:11:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_sessions_dropped_by_prescribed_filter
      value: 1
      unit: sessions
      window: fix phase of tactic-attention-namespaced-rank 2026-08-13T18:11:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_price_proxy_dropped_usd
      value: 31.6646295
      unit: usd
      window: fix phase of tactic-attention-namespaced-rank 2026-08-13T18:11:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_spend_dropped_fraction
      value: 1
      unit: fraction
      window: fix phase of tactic-attention-namespaced-rank 2026-08-13T18:11:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: since_bound_skew_s
      value: 13.26
      unit: s
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z
      sensor: aggregate-usage.sh + events.jsonl
      measured: 2026-08-13
    - metric: phase_price_proxy_dropped_usd
      value: 25.04
      unit: usd
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_price_proxy_dropped_fraction
      value: 0.663
      unit: fraction
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_turns_dropped_fraction
      value: 0.629
      unit: fraction
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: findings_invisible_under_prescribed_bound
      value: 2
      unit: findings
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z
      sensor: rsi
      measured: 2026-08-13
    - metric: phases_with_measured_skew
      value: 4
      unit: phases
      window: tactic-attention-namespaced-rank ladder 2026-08-12..2026-08-13
      sensor: events.jsonl + aggregate-usage.sh
      measured: 2026-08-13
    - metric: recurrence_count
      value: 4
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## Fourth occurrence — the dropped row was the only one that explained the halt

Observed 2026-08-13 evaluating the `review` phase of
`tactic-attention-namespaced-rank`
(eval `rsi-eval-tactic-attention-namespaced-rank-review-1786657321`).

The driver stamped `eval_since_epoch=1786657321` = `2026-08-13T21:42:01Z`, the
instant it wrote the `launched` line. The phase worker session
`e68cfcc4-f3b7-4e99-875a-1363aeedcb9e` (`launch_skill=review-fix`) has
`started_at=2026-08-13T21:41:47.736Z` — **13.26 s before the bound**, the same
~13 s skew measured on the `qa` and `fix` phases.

Applying the filter exactly as `.claude/skills/rsi/SKILL.md` step 2
prescribes returned **4 of 72 rows**: three subagents and one 0-turn `other`
row. The worker was dropped, taking with it:

- **$25.04** of $37.75 phase price proxy (**66.3%**)
- **61** of 97 phase turns (**62.9%**)
- the phase's only `launch_skill`, `artifact.node_id`, `peak_context` (166811),
  `hit_ratio` (0.943) and `outcome` fields

What makes this occurrence worth recording separately from the first three is
what the dropped row contained. This phase **halted** (ladder exit 12,
`stalled`). The entire causal chain lives on the worker row and nowhere else:
its `permission_friction` (`user_rejections: 1`, `sandbox_overrides: 13`), and
the transcript pointer that leads to the `"User rejected tool use"` record at
`21:49:38.668Z` which is the reason the phase died.

Read through the prescribed filter, the `review` phase of a halted ladder run
looks like **$12.71 of anonymous subagent work with no worker, no launch skill,
and no visible failure** — an evaluation that covers all seven lenses and
concludes nothing. The two findings landed from this phase
(`detached-code-review-dies-with-launcher`,
`unattended-worker-tool-use-rejected-midflight`) are both invisible under the
prescribed bound and were only reachable by widening it by 60 s.

The empty-selection guard in the skill does not fire here, because the
selection is not empty — it is 4 rows of real subagents. A guard keyed on
"zero rows" cannot catch a bound that drops exactly the one row that matters.

## Prior occurrences (retained)

- **First** — `qa` attempt 4: 13.2 s skew, 94.9% of phase price proxy and 97.7%
  of phase turns excluded.
- **Second** — `review` phase, launch `2026-08-13T14:30:52Z`: 13.3 s skew,
  $53.66 worker price proxy excluded (18.7% of a large fan-out phase).
- **Third** — `fix` phase, launch `2026-08-13T18:11:06Z`: 13.7 s skew, the drop
  was **total** — 0 of 66 rows selected, 100% of the $31.66 phase spend gone,
  which *did* trip the empty-selection guard.

The pattern across four phases is consistent: the worker starts ~13–14 s before
the driver logs `launched`, so the bound the driver hands the evaluator is
*always* after the worker's `started_at`. This is not a sampling accident; it
is deterministic.

## What would have to change

The driver should stamp `eval_since_epoch` at the moment it **spawns** the
worker rather than after launch verification, or hand the evaluator the phase
worker's session id directly. Failing either, the skill's prescribed filter
needs a documented back-off (e.g. `since - 60`) — but a back-off is a
workaround that widens into the previous phase's tail, so the stamp is the
right fix.

Verifiable afterwards: for any phase, `min(started_at)` over the selected
sessions should be ≥ the launch and the selection should contain exactly one
row whose `type` is `worker`.
