---
id: tactic-eval-finding-ladder-gate-stale-main-checkout-halt
kind: tactic
statement: dispatch-ladder halts exit-12 stalled on a phase that SUCCEEDED — the
  selector reads origin/main but provision-node-worktree re-validates against
  the main checkout working tree, which nothing on the advance path
  fast-forwards, so the transition the ladder just landed reads as a stale
  selection until the requeue budget runs out
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
    - metric: stale_selection_refusals
      value: 6
      unit: refusals
      window: tactic-attention-namespaced-rank qa phase, 2026-08-13T14:22:35Z-14:23:07Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: requeue_budget_exhaustion_s
      value: 32
      unit: seconds
      window: tactic-attention-namespaced-rank qa phase, 2026-08-13T14:22:35Z-14:23:07Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: main_checkout_lag_commits
      value: 3
      unit: commits
      window: main checkout fbb9be83 vs origin/main db9e7f2c, 2026-08-13T14:23:07Z
      sensor: git
      measured: 2026-08-13
    - metric: halted_after_successful_phase_price_proxy_usd
      value: 78.39
      unit: usd
      window: tactic-attention-namespaced-rank qa phase attempt 4, 2026-08-13
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: stale_selection_requeues
      value: 10
      unit: requeues
      window: tactic-attention-namespaced-rank runs A+B 2026-08-13T14:05..14:31Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: runs_halted
      value: 1
      unit: runs
      window: tactic-attention-namespaced-rank runs A+B 2026-08-13T14:05..14:31Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: launch_delay_s
      value: 61
      unit: seconds
      window: tactic-attention-namespaced-rank review launch 2026-08-13
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## Recurrence — `tactic-attention-namespaced-rank`, review launch, 2026-08-13

The symptom recurred twice in eight minutes, on consecutive runs, either side of
the `review` phase's launch.

**Run A** (started 14:05:13Z). The `qa` phase advanced cleanly at 14:22:27Z
(`awaited` / `advanced`, `elapsed_s=1009`). The transition was at `origin/main`
— `db9e7f2c` reached it at 14:20:39Z per `git reflog show origin/main`. The
driver then burned its whole requeue budget on the node it had just advanced:

```
14:22:35Z idle qa stale-selection requeue_budget=4
14:22:41Z idle qa stale-selection requeue_budget=3
14:22:48Z idle qa stale-selection requeue_budget=2
14:22:54Z idle qa stale-selection requeue_budget=1
14:23:00Z idle qa stale-selection requeue_budget=0
14:23:07Z halt qa stalled  "the requeue budget ran out on repeated
                            'stale-selection' — the node keeps being
                            re-selected without progressing"
```

**Run B** (started 14:29:51Z), 6 minutes 44 s later. Identical, from a cold
start, with no phase yet launched (`phase: null`):

```
14:29:58Z idle stale-selection requeue_budget=4
14:30:06Z idle stale-selection requeue_budget=3
14:30:13Z idle stale-selection requeue_budget=2
14:30:20Z idle stale-selection requeue_budget=1
14:30:27Z idle stale-selection requeue_budget=0
14:30:52Z launched review  kind=tactic skill=/review-fix
```

Run B consumed all five requeues and then succeeded 25 s later. So the same
condition that terminated Run A cleared on its own inside Run B — consistent
with the entry's diagnosis that the blocker is the **main checkout's working
tree** lagging `origin/main`, with recovery whenever something else
fast-forwards it, rather than with anything the driver did.

## Cost measured here

- **10 stale-selection requeues** across the two runs.
- **One run terminated** (Run A, exit 12 `stalled`) on a phase that had
  succeeded 40 s earlier.
- **61 s** of Run B's wall clock (14:29:51 → 14:30:52) spent before the review
  phase could launch, with zero requeue budget left as a safety margin — one
  more stale read and Run B would have halted exactly as Run A did.
- Run A's halt cost a full driver restart: a human or scheduler had to start
  Run B.

## Attribution note

This occurrence matches the entry's described symptom exactly (repeated
`stale-selection` on a just-landed transition, until the requeue budget runs
out) and is on the same driver. It was **not** independently verified that the
main checkout's working-tree HEAD lagged `origin/main` at 14:22:35Z and
14:29:58Z — that state is no longer observable. The symptom match is exact; the
causal attribution is inherited from the entry, not re-proven here.
