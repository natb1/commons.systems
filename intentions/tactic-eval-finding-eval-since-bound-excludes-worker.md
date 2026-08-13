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
    - metric: since_bound_skew_s
      value: 12.6
      unit: seconds
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: phase_price_proxy_usd_excluded
      value: 37.4744595
      unit: usd
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_price_proxy_usd_true
      value: 76.0891035
      unit: usd
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: excluded_spend_share_pct
      value: 49.25
      unit: percent
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: excluded_outcome_records_share_pct
      value: 100
      unit: percent
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_turns_excluded
      value: 109
      unit: turns
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: recurrence_count
      value: 5
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
# Occurrence — tactic-attention-namespaced-rank / review / `--since 1786661088`

Fifth sighting, and the first one that quantifies how much the loss *varies*.

## Observed

`dispatch-ladder-run` logged the `awaited`/`reviewed` event at 2026-08-13T23:01:54Z
and spawned `rsi-eval-tactic-attention-namespaced-rank-review-1786661088` with
`eval_since_epoch=1786661088` — i.e. 2026-08-13T22:44:48Z, the ledger's `launched`
timestamp for the phase.

The phase's own worker session, `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6`
(`launch_skill=review-fix`, branch `tactic-attention-namespaced-rank`), has
`started_at = 2026-08-13T22:44:35.395Z` — **12.6 seconds before** the bound.

Applying the filter the skill prescribes verbatim
(`.started_at | sub("\\.[0-9]+Z$";"Z") | fromdateiso8601 >= $since`) returns
16 rows: 15 subagents plus one 0-turn shell session. The worker is not among
them, and the selection is non-empty, so the skill's own
"an empty selection is a missing measurement" guard never fires.

## What the bound cost this evaluation

| figure | prescribed `--since` | corrected (>= 22:44:30) |
| --- | --- | --- |
| sessions | 16 | 17 |
| turns | 139 | 248 |
| price proxy | $38.61 | $76.09 |
| cost | $10.59 | $18.09 |
| sessions carrying an `outcome` | **0** | 1 |

The excluded worker alone is 109 turns and $37.47 price proxy — **49.25%** of the
phase's true spend.

## The part that does not vary

The prior statement quantified the loss at "95 percent of the phase spend". Here
it is 49%. The spend fraction is a function of how heavy the phase's fan-out was
and is not a stable figure — a review phase with 15 subagents hides less of its
worker than a phase with two. Do not treat 95% as the finding's magnitude.

What *is* invariant is the second half: `dispatch-emit-outcome` writes the
outcome record onto the **worker** session, never onto a subagent. Every
subagent row in the corrected window has `outcome: null`. So the excluded row is
100% of the phase's outcome object, every time, regardless of fan-out width:

```json
{ "phase": "review", "pr": 3075, "findings_surfaced": 10,
  "findings_actionable": 0, "fixes_applied": 0, "followups_filed": 0,
  "subagents_launched": 13, "disposition": "completed" }
```

Lens 5 (plan-quality yield) and lens 3 (variance) are computed *entirely* from
that object. Followed literally, the skill's own procedure makes both lenses
unmeasurable on every phase, while returning a plausible-looking 16-row
selection. That is the durable harm, not the spend percentage.

## What would have to change

The defect is in the producer, not the consumer: `dispatch-ladder-run` stamps
`eval_since_epoch` after launch *verification* rather than capturing the epoch
immediately before it spawns the worker. Either capture-then-launch, or have the
driver pass the worker's session id (it has it — the launch path knows the
`--name`), so the evaluator selects by identity instead of by a race-prone time
bound.

A consumer-side subtraction (`--since` minus a fudge factor) is not a fix; it
trades a silent under-count for a silent over-count into the previous phase.

## Evidence a later session cannot rediscover

- Ledger line: `{"ts":"2026-08-13T23:01:55Z","event":"eval","phase":"review","eval_since_epoch":1786661088}`
  in `.claude/worktrees/tactic-attention-namespaced-rank.ladder/events.jsonl`.
- Worker transcript:
  `~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6.jsonl`,
  `started_at 2026-08-13T22:44:35.395Z`.
- Skew this occurrence: **12.6s** (prior sighting reported ~13s — the skew is
  stable; it is the launch-verification round trip).
