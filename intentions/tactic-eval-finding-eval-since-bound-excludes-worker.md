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
    - metric: recurrence_count
      value: 3
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## Third occurrence — this time the drop was total, not partial

Observed 2026-08-13 evaluating the `fix` phase of
`tactic-attention-namespaced-rank`
(eval `rsi-eval-tactic-attention-namespaced-rank-fix-1786644666`).

The driver stamped `eval_since_epoch=1786644666` = `2026-08-13T18:11:06Z`, the
instant it wrote the `launched` line. The phase worker session
`b3e6cb28-75b4-4e38-b6bc-761977b94c16` (`launch_skill=fix-checks`) has
`started_at=2026-08-13T18:10:52.342Z` — **13.7 s before the bound**.

Applying the filter exactly as `.claude/skills/rsi/SKILL.md` step 2 prescribes
returned `0` of 66 rows:

```
jq --argjson since 1786644666 '[.sessions[]|select(...>= $since)]|length'  ->  0
```

The two prior occurrences were on fan-out phases (qa, review), where the
subagents started after the bound and survived, so the loss read as "the worker
row is missing". **On a phase that launches no subagents the loss is 100 %.**
Every figure this evaluation owes — 97 turns, 171 641 peak context,
$31.66 price proxy, $6.33 cost, 0.968 hit ratio, 16 sandbox overrides — was
dropped, and the SKILL's own guard ("an empty selection is a missing
measurement... report the lens as unmeasured") would have converted a fully
measurable phase into seven unmeasured lenses.

The offset is systematic, not jitter — the same ~13 s appears on every phase of
this ladder:

| phase | `eval_since_epoch` | bound (UTC) | worker `started_at` | offset |
| --- | --- | --- | --- | --- |
| qa | 1786629938 | 14:05:38Z | 14:05:24.779Z | −13.2 s |
| review | 1786631452 | 14:30:52Z | 14:30:38.676Z | −13.3 s |
| fix | 1786644666 | 18:11:06Z | 18:10:52.342Z | −13.7 s |

Because the bound is the `launched` **log** timestamp and the session is born
before `dispatch-graph-execute` returns for the driver to log it, the bound can
never precede the worker it selects.

Positive control (per the SKILL's own requirement before recording absence): the
same document, filtered at `>= 1786644600` (18:10:00Z), returns the worker row
with all fields populated — the instrument can see; only the prescribed bound is
blind.

## What would have to change

One of: (a) `dispatch-ladder-run` stamps `eval_since_epoch` before spawning the
worker rather than after logging `launched`; or (b) it passes the worker's
session id / birth instant instead of a wall clock; or (c) the bound carries a
documented slack margin and the SKILL's filter subtracts it. This entry records
the defect; the choice belongs to the script's author.
