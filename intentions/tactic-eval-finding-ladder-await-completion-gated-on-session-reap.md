---
id: tactic-eval-finding-ladder-await-completion-gated-on-session-reap
kind: tactic
statement: dispatch-ladder-await Stage 2 polls session liveness only and never
  asks origin/main while the worker reads working, so a phase whose completion
  is already public at origin/main is not detected until the session registry
  reaps the worker — the review phase waited 41 minutes on a finished review,
  and an await-repoll reported running 20 minutes after the reviewed marker was
  public
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
    - metric: completion_detection_latency_s
      value: 2473
      unit: seconds
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: events.jsonl + git reflog
      measured: 2026-08-13
    - metric: graph_unasked_while_landed_s
      value: 1201
      unit: seconds
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: events.jsonl + git reflog
      measured: 2026-08-13
    - metric: phase_elapsed_s
      value: 12326
      unit: seconds
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: wasted_share_of_phase_elapsed
      value: 0.201
      unit: ratio
      window: tactic-attention-namespaced-rank review 2026-08-13
      sensor: events.jsonl + git reflog
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
---
## What was observed

`tactic-attention-namespaced-rank`, ladder phase `review`, run started
2026-08-13T14:29:51Z. The phase's completion was public at `origin/main` for
**41 minutes** before the ladder noticed it.

Timeline (all UTC):

| time | event | source |
| --- | --- | --- |
| 14:30:52 | `launched` review, `skill=/review-fix` | `events.jsonl` |
| 17:13:58 | commit `f3e0a632` adds `reviewed` to `execution.markers` | `git show f3e0a632` |
| 17:15:05 | `f3e0a632` reaches `origin/main` (`update by push`) | `git reflog show origin/main` |
| 17:16:03 | review worker `40c253c4`'s transcript stops (last write) | transcript mtime |
| 17:35:06 | `await-repoll` reports `running`, `elapsed_s=11054` | `events.jsonl` |
| 17:56:18 | `awaited` / `reviewed`, `elapsed_s=12326` | `events.jsonl` |

The `await-repoll` at 17:35:06 fired **20 minutes after** the `reviewed` marker
was already visible at `origin/main`.

## The mechanism

`dispatch-ladder-await`'s Stage 2 loop (lines 456–488) polls **session liveness
only**:

```
while (( SECONDS < DEADLINE )); do
  case "$(session_state)" in
    absent)    report_graph_verdict ... ;;
    done-held) ... ;;
  esac
  sleep "$POLL_S"
done
```

`graph_verdict` — which already knows how to see this exact completion signal,
via the `reviewed`-marker carve-out at lines 307–333 — is called **only** on a
session-state change. While `session_state` returns `working`, the graph is
never asked. So the await's detection latency is bounded below by how long the
session registry keeps reporting the worker as live, not by when the completion
became visible at `origin/main`.

Two mechanisms compound, and this occurrence cannot separate their shares:

1. **The gate.** Stage 2 does not ask `origin/main` while the session reads
   `working`, so a completion that lands before the session is reaped waits.
2. **Reap lag.** The registry reported the worker as `working` at 17:35:06,
   19 minutes after its transcript's last write at 17:16:03. Whatever that lag
   is, mechanism 1 converts it directly into ladder wall clock.

Only mechanism 1 is local to this script. Mechanism 2 was not diagnosed here.

## Bounded, defensible figures

- **≥1,201 s (20 min)** in which the completion was provably public at
  `origin/main` (17:15:05) while Stage 2 provably never asked (the 17:35:06
  repoll is exit 20 — the deadline expired without `session_state` ever leaving
  `working`). This is the floor and does not depend on any reap-lag estimate.
- **2,473 s (41 min 13 s)** total from public-at-`origin/main` (17:15:05) to
  detection (17:56:18).
- **20.1%** of the phase's measured `elapsed_s=12326` was spent after the
  phase had finished.
- **11.4%** of the run's `max_run_s=21600` budget.

## What would have to change

The decision belongs to `dispatch-ladder-await`, which owns the await contract.
The shape of the gap is that `graph_verdict` is reachable only from a
session-state transition, while the signal it reads is independent of session
state. Whether the answer is asking the graph on every poll, asking it once per
window before returning exit 20, or fixing the reap lag instead is the author's
call — this entry records the cost, not the rule.

## Positive control

This is not an absence claim, but the searches were controlled anyway: the
`--node`-scoped `aggregate-usage.sh` document returned 39 non-empty session rows
for the window, `jq 'select(.phase == "review")'` returned 10 ledger lines, and
`git log -S'reviewed' -- intentions/tactic-attention-namespaced-rank.md`
returned the marker commit. Every instrument used here demonstrated it can see.
