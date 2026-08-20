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
phase: done
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
    - metric: reap_wait_seconds
      value: 4288
      unit: seconds
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: reap_wait_share_of_phase_elapsed
      value: 0.698
      unit: fraction
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: phase_elapsed_seconds
      value: 6140
      unit: seconds
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: reported_reap_lag_s_understatement_factor
      value: 3.73
      unit: ratio
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
# Recurrence 2 — `tactic-attention-per-tier-boost-migration`, `align-tactics` phase, run started 2026-08-14T15:11:58Z

The first sighting was the review phase waiting 41 minutes on a finished review.
This is the same defect on `align-tactics`, and it is worse: **69.8% of the
phase's measured wall clock was spent waiting for a session-registry reap of a
worker whose result was already public at `origin/main`.**

## The measurement

From `.claude/worktrees/tactic-attention-per-tier-boost-migration.ladder/events.jsonl`
and the run's journal (`journalctl --user -u
dispatch-ladder-tactic-attention-per-tier-boost-migration`, 2026-08-14 11:11–12:54
local / 15:11–16:54Z):

| moment | UTC | source |
| --- | --- | --- |
| phase launched | 15:12:03 | `events.jsonl` `launched` |
| `advanced` already public at `origin/main` | **≤ 15:42:53** | journal: `dispatch-ladder-await: … reached 'advanced' at origin/main while its session was still registered (state 'working')` |
| session row finally reaped | 16:54:21 | journal: `… session row is gone 1148s after 'advanced' became public` |
| `awaited align-tactics advanced` | 16:54:23 | `events.jsonl`, `elapsed_s=6140 await_repolls=2 window_s=1800` |

- Real phase work: **≤ 1850 s (~31 min)** — launch to first observation that
  `advanced` was public.
- Wait on the reap: **4288 s (71.5 min)** — 15:42:53Z → 16:54:21Z.
- That is **69.8 % of the recorded `elapsed_s=6140`**, and 3.4× the configured
  `window_s=1800`.

## Two things this run adds beyond the first sighting

**1. The reported `reap_lag_s` understates the true wait by 3.7×.** The verdict
line reported `reap_lag_s=1148`, measured from the *last* `dispatch-ladder-await`
invocation's own first observation (15:35:13Z→16:54:21Z local-clock 12:35:13→12:54:21).
The driver spawns a fresh `await` process on every re-poll, so each one measures
only its own slice. The true interval from first-public to reap was **4288 s**.
Anything reading `reap_lag_s` off the event line — including this evaluator's
lens 6, and the closing cross-phase synthesis — sees 27% of the real figure.

**2. The blocker here was a missing node-terminal marker, not ordinary reap
latency.** The journal names it explicitly, three times:

```
dispatch-ladder-await: the session named tactic-attention-per-tier-boost-migration
has state 'done' but was NOT reaped — it stopped without writing a node-terminal
marker, so dispatch-stop.sh is holding the job alive, and
tactic-attention-per-tier-boost-migration carries no office_hours park at origin/main.
```

`lib-frozen-session-park` observed it for the full 300 s grace, logged five
`held-sweep` events (60→300 s of a 420 s budget), then at 16:34:25Z routed the
node to the invalid-state lane — *deferred, not resolved*. The reap did not
arrive until 20 minutes after that routing.

So the wait had two stacked causes: `dispatch-ladder-await` Stage 2 will not
accept `origin/main` as authoritative while the row is registered (the original
finding), and the row stayed registered because `/align-tactics` exited without
a node-terminal marker (`.claude/worktrees/…-per-tier-boost-migration.invalid-state-attempts`
now reads `2`).

## Recommended default (lens 6 owes a number; recorded, not applied)

- `--timeout-s`: the phase's real work was ~1850 s against a 1800 s window, so
  the two `await-repoll`s were pure overhead on a phase that had essentially
  finished. **2400 s** for `align-tactics` covers the observed work with headroom
  and removes both repolls.
- The load-bearing change is not a timeout: it is that **`advanced` public at
  `origin/main` is already the authoritative completion signal.** A cap on the
  post-`advanced`-public reap wait — **300 s**, matching `lib-frozen-session-park`'s
  own grace — would have returned 4000 s of this run's 6140 s. Recorded for the
  author; this evaluator does not write orchestration rules.
- Separately: report `reap_lag_s` as first-public→reap, not per-`await`-process
  slice, or the figure cannot be used for calibration at all.
