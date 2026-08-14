---
id: tactic-eval-finding-review-fix-reviewed-before-ci-verdict
kind: tactic
statement: The review phase applies the reviewed marker on its own fix commit
  without any CI verdict for that commit, so a review fix that breaks CI is
  discovered only by the ladder review-stall sweep 14 minutes later and costs a
  whole extra fix phase
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
    - metric: review_fix_commits_regressing_ci
      value: 1
      unit: of 1 commits
      window: tactic-attention-namespaced-rank review phase 2026-08-13T14:30:52Z
      sensor: rsi
      measured: 2026-08-13
    - metric: rework_phase_price_proxy_usd
      value: 31.6646295
      unit: usd
      window: tactic-attention-namespaced-rank fix attempt 2 2026-08-13T18:11:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: rework_phase_cost_usd
      value: 6.3329259
      unit: usd
      window: tactic-attention-namespaced-rank fix attempt 2 2026-08-13T18:11:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: rework_phase_turns
      value: 97
      unit: turns
      window: tactic-attention-namespaced-rank fix attempt 2 2026-08-13T18:11:06Z
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: detection_latency_s
      value: 851
      unit: s
      window: review reviewed 17:56:18Z to review-stall route 18:10:43Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: rework_phase_wall_s
      value: 612
      unit: s
      window: tactic-attention-namespaced-rank fix attempt 2 2026-08-13T18:11:06Z
      sensor: events.jsonl
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
## The review phase's own fix commit broke CI, and `reviewed` was applied anyway

Observed 2026-08-13 on `tactic-attention-namespaced-rank`, ladder run started
14:29:51Z. This is the finding that explains why the evaluated `fix` phase
existed at all.

### Sequence

| time (UTC) | event |
| --- | --- |
| 14:30:52 | `review` launched (`/review-fix`) |
| 17:56:18 | `awaited reviewed` — worker outcome `completed_with_fixes`, `findings_surfaced=22`, `findings_actionable=4`, `fixes_applied=4`, base_sha `db9e7f2c` |
| 17:56:32 → 18:08:35 | 10 ci-wait poll cycles, `ci_waited=0s … 540s of 3600s`, each cycle a `merge`/`absorb`/`idle` triple |
| 18:10:43 | `review-stall recovered … -> fix (ci=failing merge=MERGEABLE)` |
| 18:11:06 | `fix` launched (`/fix-checks`), attempt 2 |
| 18:21:18 | `fix awaited advanced`, `elapsed_s=612` |

The review phase applied its fixes in commit `d3bf3ac0` ("review fixes for
tactic-attention-namespaced-rank"), wrote the `reviewed` marker, and completed.
It did not wait for CI on its own commit. CI on `d3bf3ac0` failed.

### The regression was introduced by the review fix itself

`git log -S'as unknown as IntentionNodeInput' -- packages/intentionsutil/test/store.test.ts`
over `origin/main..origin/tactic-attention-namespaced-rank` returns exactly one
commit: **`d3bf3ac0`**, the review-fix commit. The `type-safety-sensor` check
flagged the two net-new unsuppressed casts it added. The entire content of the
follow-on fix phase's commit `4f979ad8` is two same-line comments:

```
-      } as unknown as IntentionNodeInput;
+      } as unknown as IntentionNodeInput; // type-safety-ok: legacy attention spellings intentionally omit fields IntentionNodeInput requires
```

So the review phase declared the branch reviewed while its own edit had made CI
red, and the ladder then spent a full phase discovering and undoing that.

### Measured cost of the round trip

- fix-phase worker `b3e6cb28-75b4-4e38-b6bc-761977b94c16`: 97 turns,
  171 641 peak context, **$31.66 price proxy / $6.33 cost**, 612 s wall
- 10 ladder ci-wait poll cycles + review-stall diagnosis: ~14 min wall
  (17:56:32 → 18:10:43) before the route to fix
- `execution.fix.attempt` incremented 1 → 2
- net product change delivered by the whole round trip: two comments

The proximate cause of the two missing markers is recorded separately as
`type-safety-marker-invisible-at-write-time`. This entry is about the phase
contract: `reviewed` is a claim the branch is ready, and it is currently applied
without any evidence about the reviewer's own commit.

### What would have to change

`/review-fix` today runs its fix fan-out, commits, and applies `dispatch:reviewed`
in one pass. Whether the marker should be gated on a CI verdict for the fix
commit, whether the review phase should re-enter its own fix loop, or whether the
ladder should treat a post-review CI failure as the reviewer's rework rather than
a fresh fix attempt, is an orchestration decision for the author — this entry
records the exposure and its measured cost, and applies nothing.
