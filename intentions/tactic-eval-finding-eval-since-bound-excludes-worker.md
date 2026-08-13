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
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## What was observed

The `--since <epoch>` bound `dispatch-ladder-run` hands each per-phase evaluator
is stamped **after** the phase worker's session has already started, so the
session-selection filter the `/rsi` skill prescribes excludes the phase's own
worker — the single largest row in the measurement.

Concretely, for this evaluation (`/rsi tactic-attention-namespaced-rank qa
--since 1786629938`):

| | timestamp |
| --- | --- |
| worker session `72d549c3` `started_at` | `2026-08-13T14:05:24.779Z` |
| `--since 1786629938` | `2026-08-13T14:05:38Z` |

The bound lands **13.2 s after** the session it is meant to select. Applying the
filter from `.claude/skills/rsi/SKILL.md` step 2 verbatim:

```
jq --argjson since 1786629938 '[ .sessions[] | select(.started_at != null and
   ((.started_at | sub("\\.[0-9]+Z$";"Z") | fromdateiso8601) >= $since)) ]'
```

returns **2 rows** — both 2-turn Workflow subagents — and drops the 171-turn
worker. Measured share of the phase excluded:

- price proxy: `$74.37` of `$78.39` → **94.9 %**
- turns: 171 of 175 → **97.7 %**
- and with it the whole `outcome` object (`disposition`, `findings_surfaced`,
  `fixes_applied`, `followups_filed`) and every `permission_friction` figure —
  the subagent rows carry `outcome: null` and all-zero friction.

An evaluator that trusted the filter would report the phase as costing $4.02,
having no permission friction, and having no recorded outcome. Every one of those
is wrong, and none of them looks wrong: two non-empty rows do not trip the
skill's own "an empty selection is a missing measurement" guard.

## The mechanism

`dispatch-ladder-advance` spawns the worker, then runs `verify_launch` before
printing `launched`, and only then does `dispatch-ladder-run` write the
`launched` event and stamp `eval_since_epoch` from it. The verification budget is
deliberately wide — `LIB_CLAUDE_AGENTS_VERIFY_INTERVAL_S:=3`, five attempts,
"≈12s per candidate cwd", up to ≈24 s over two cwds
(`dispatch-ladder-advance:~285-300`). The session writes its first transcript
records during that window. So the gap is not a race that sometimes bites: it is
the launch-verification budget, and it is always on the wrong side of the bound.

Corroborating stamps on the same node: qa attempt 1 worker `17e4bf6c` started
`02:18:17.063Z` against a `launched` event at `02:18:30Z` (12.9 s); attempt 3
worker `801bd0c6` started `04:07:57.335Z` against `04:08:10Z` (12.7 s). The lag is
stable at ≈13 s.

## What would have to change

Any of:

- `dispatch-ladder-run` stamps `eval_since_epoch` **before** the spawn rather than
  after launch verification; or
- the skill's filter subtracts a launch-verification margin (≥30 s) from the
  bound; or
- the filter selects on the artifact rather than the clock — `aggregate-usage.sh`
  rows already carry `artifact.node_id` and `launch_skill`, so
  `select(.launch_skill == "qa-fix")` plus a coarse day bound identifies the
  phase's sessions without depending on a sub-minute stamp at all.

Whichever is chosen, the skill's step-2 filter and the driver's stamp have to
agree; today they are written independently and disagree by the width of a
verification budget. Recorded, not applied — the fix touches an orchestration
script's stamp semantics, which is the author's call.
