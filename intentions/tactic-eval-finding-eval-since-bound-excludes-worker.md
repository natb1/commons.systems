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
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## Recurrence — `tactic-attention-namespaced-rank`, phase `review`, 2026-08-13

Confirmed again, and this occurrence adds two things the first did not have: an
exact skew measurement, and evidence the skew is **systematic across every
phase this driver launches**, not incidental to one run.

### This occurrence

- `--since` handed to the evaluator: `1786631452` = `2026-08-13T14:30:52Z`
  (matches the `launched` line in `events.jsonl`).
- The phase's own worker session `40c253c4-108e-44e3-b0e9-e71afa959dee`:
  `started_at = 2026-08-13T14:30:38.676Z`.
- **Skew: 13.3 s.** The worker starts *before* the bound and is dropped by the
  skill's prescribed `started_at >= $since` filter.

What vanishes with it:

| lost | value |
| --- | --- |
| `price_proxy_usd` | $53.66 of the phase's $286.26 (**18.7%**) |
| turns | 133 of 1,033 |
| `peak_context` | 201,642 — the phase's largest, and one of only two >120k rows |
| `launch_skill` | `review-fix` — the **only** row carrying it; without it the phase has no attributed skill at all |
| `outcome` envelope | **the entire object** — `findings_surfaced: 22`, `findings_actionable: 4`, `fixes_applied: 4`, `followups_filed: 0`, `subagents_launched: 32`, `disposition: completed_with_fixes` |
| `outcome_rates` | `actionability: 0.182`, `fix_rate: 1.0` |

The `outcome` object is the load-bearing loss. It lives on the worker row and
nowhere else, so a compliant evaluator following the skill text measures a
review phase with no idea what the review found or fixed — lenses 3, 4 and 5
lose their only evidence — and the empty-selection guard never trips, because
37 subagent rows still come back.

### The skew is structural, not a race

`dispatch-ladder-run:992` takes `PASS_SINCE` **before** `dispatch-ladder-advance`
runs; `:1005` takes `LAUNCH_EPOCH` **after** it returns. `advance` blocks on
`verify_launch`, so the worker session already exists by the time
`LAUNCH_EPOCH` is stamped — and `LAUNCH_EPOCH` is what `:1033` passes to the
evaluator as `--since`.

The comment at `:987–991` names this hazard exactly, and fixes it for
`PASS_SINCE` while deliberately leaving `LAUNCH_EPOCH` alone:

> `LAUNCH_EPOCH` is already later than the spawn … `LAUNCH_EPOCH` itself is left
> alone: it is also the evaluator's `aggregate-usage.sh` window and means
> something else.

So the same skew the driver corrects for its own probe is handed to the
evaluator uncorrected.

### Every phase on this ladder, same ~13 s

Each phase's `launched` event timestamp against its worker's `started_at`:

| phase | worker | `started_at` | `launched` | skew |
| --- | --- | --- | --- | --- |
| implement | `db21b669` | 01:19:25.368Z | 01:19:38Z | 13 s |
| fix | `c1c85aeb` | 02:02:45.876Z | 02:02:59Z | 13 s |
| qa | `17e4bf6c` | 02:18:17.063Z | 02:18:30Z | 13 s |
| qa | `801bd0c6` | 04:07:57.335Z | 04:08:10Z | 13 s |
| qa | `72d549c3` | 14:05:24.779Z | 14:05:38Z | 13 s |
| review | `40c253c4` | 14:30:38.676Z | 14:30:52Z | 13 s |

Six of six. Every per-phase evaluation this driver has ever spawned measured
only its phase's subagents.

### Note on the original statement's "95 percent"

That figure was this defect's first occurrence, not a constant. Here the
excluded worker is 18.7% of phase spend — the review phase is subagent-heavy
(32 launched), so the *spend* share lost is much smaller while the *semantic*
loss (the whole `outcome` envelope, the only `launch_skill`) is total. The share
lost varies with fan-out; the loss of the outcome envelope does not.
