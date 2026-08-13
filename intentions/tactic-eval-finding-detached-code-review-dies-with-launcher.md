---
id: tactic-eval-finding-detached-code-review-dies-with-launcher
kind: tactic
statement: The /code-review pre-stage the review phase launches as a detached
  run is not detached from its launching Bash tool call — interrupting that call
  killed the child session 3ms later and both in-flight max-effort angle
  subagents 96ms later, destroying a 4.5-hour-budgeted review 63 seconds after
  it started and leaving the phase with no graph change
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
    - metric: phase_price_proxy_usd_discarded
      value: 37.75
      unit: usd
      window: tactic-attention-namespaced-rank review 2026-08-13T21:42:01Z..21:51:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: detached_review_subagent_price_proxy_usd_killed
      value: 6.99
      unit: usd
      window: tactic-attention-namespaced-rank review 2026-08-13T21:48:36Z..21:49:38Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: child_death_lag_after_parent_interrupt_ms
      value: 3
      unit: ms
      window: tactic-attention-namespaced-rank review 2026-08-13T21:49:38Z
      sensor: session-transcript-mtime
      measured: 2026-08-13
    - metric: detached_review_lifetime_s
      value: 63
      unit: s
      window: tactic-attention-namespaced-rank review 2026-08-13T21:48:35Z..21:49:38Z
      sensor: code-review-lock+session-transcript
      measured: 2026-08-13
    - metric: review_launches_on_node
      value: 3
      unit: count
      window: tactic-attention-namespaced-rank ladder
        2026-08-12T20:01Z..2026-08-13T21:52Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: cumulative_review_fix_price_proxy_usd
      value: 135.09
      unit: usd
      window: tactic-attention-namespaced-rank all sessions
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
# The "detached" code-review dies with the Bash call that launched it

## What was observed

`tactic-attention-namespaced-rank`, `review` phase, ladder launch
`2026-08-13T21:42:01Z` (`--since 1786657321`), halted `2026-08-13T21:51:58Z`
with ladder exit 12, disposition `stalled`.

The review-fix worker reached Step 1b and ran the prescribed launch:

```
cd /home/n8/natb1/commons.systems/.claude/worktrees/tactic-attention-namespaced-rank
...
CR_OUT=$(.claude/skills/dispatch-propagate/scripts/dispatch-code-review \
  --target "$REVIEW_BASE..HEAD" --out-dir "tmp/code-review-$N" \
  --effort "$CR_EFFORT" --deadline-seconds "$CR_DEADLINE_S" 2>"tmp/code-review-$N.err")
```

The launch **succeeded**. The advisory sidecar
`.claude/worktrees/tactic-attention-namespaced-rank.code-review-lock` was
written at `21:48:35Z` (`pid=2790475 effort=max model=opus deadline_s=16200
target=c3bafccd..HEAD`), and the detached review session
`4328c9ed-97ae-45f0-a62e-e80e9aeda0df` started at `21:48:36.314Z` and spawned
two angle subagents (`agent-a79a2c3f3c15e889b` at `21:48:36.981Z`,
`agent-a34ac99010b84a930` at `21:49:31.384Z`).

65 seconds into that still-running Bash call, the permission layer recorded
`toolUseResult: "User rejected tool use"` on the worker at
**`21:49:38.668Z`**, followed by `[Request interrupted by user for tool use]`.

Every session in the tree stopped writing at the same instant:

| session | role | last transcript write |
| --- | --- | --- |
| `e68cfcc4-…` | review-fix worker | `21:49:38.668Z` (rejection record) |
| `4328c9ed-…` | detached `/code-review` child | `21:49:38.671Z` |
| `agent-a79a2c3f3c15e889b` | angle subagent | `21:49:38.764Z` |
| `agent-a34ac99010b84a930` | angle subagent | `21:49:38.764Z` |

3 ms and 96 ms after the parent's interrupt. Both angle subagents were
mid-work — `a79a2c3` was spawning its own nested "Angle A line-by-line scan"
agent, `a34ac99` was still reading `diff.patch`. `pid=2790475` is gone.

## Why it matters

`dispatch-code-review` is built specifically so the child outlives the caller:
its header documents the child running under `flock -w 1 <sidecar>` with the
kernel holding the node lock "for exactly the child's lifetime", a
`--deadline-seconds` backstop (16200 s here) instead of a foreground timeout,
and a sidecar body it explicitly warns is stale text a crashed run "leaves
behind forever". None of that survives contact with a tool-use interrupt: the
child is evidently in the launching Bash call's process group, so killing the
call reaps the whole tree.

The consequence is that the entire review phase hangs off the survival of one
foreground tool call. When that call was interrupted, a `max`-effort Opus
review with a 4.5-hour budget — already past plan-gating, already fanned out —
was destroyed 63 seconds after it started, and the ladder saw only "the worker
stopped with no graph change".

## Measured cost of this one occurrence

- Phase price proxy **$37.75** (cost $9.25) for **zero** graph change.
- Of that, **$6.99** was the detached review's own already-spawned angle
  subagents, killed mid-turn.
- Worker `e68cfcc4`: 61 turns, peak context 166811, hit ratio 0.943,
  13 sandbox overrides, 1 permission rejection.
- This is the node's **third** review launch (14:30:52 → `reviewed` then
  CI-failed into `fix`; 18:35:04 → no terminal ladder event at all;
  21:42:01 → this halt). Cumulative `review-fix` worker spend on the node is
  $135.09 price proxy with the phase still not complete.

## What would have to change

The detached child must survive an interrupt of the tool call that launched
it — i.e. `dispatch-code-review` should place the child in its own process
group / session (`setsid`, or a double-fork) rather than inheriting the Bash
call's, so that reaping the caller does not reap the review. The sidecar,
`--deadline-seconds`, and the stale-body warning already assume this property;
today the assumption is false.

Verifiable afterwards: interrupt the launching Bash call and confirm
`pid=<sidecar pid>` is still alive and the child transcript keeps growing.

Related: the interrupt that triggered this is recorded separately as
`unattended-worker-tool-use-rejected-midflight`.
