---
id: tactic-eval-finding-review-orchestration-outspends-review-lenses
kind: tactic
statement: The review phase orchestrator session itself consumed 109 turns and
  37.47 dollars of the phase 76.09 dollar price proxy — 2.7 times what all five
  review lenses spent combined — because roughly 830 of the 1026 second phase is
  fixed setup, hand-off and marker plumbing that does not scale down with the
  delta, so a 1-file +2/-2 comment-only re-review spent 82 percent of its cost
  outside the review itself and returned 0 actionable findings
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
  first_seen: 2026-08-14
  measured_impact:
    - metric: phase_price_proxy_usd
      value: 76.09
      unit: usd
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: orchestrator_session_price_proxy_usd
      value: 37.47
      unit: usd
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: review_lens_price_proxy_usd
      value: 13.72
      unit: usd
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: review_share_of_phase_price
      value: 18
      unit: percent
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: phase_turns
      value: 248
      unit: turns
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: review_wall_clock_s
      value: 205
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: orchestration_wall_clock_s
      value: 830
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: rsi
      measured: 2026-08-14
    - metric: phase_elapsed_s
      value: 1026
      unit: seconds
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: findings_actionable
      value: 0
      unit: findings
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: review-fix result.json
      measured: 2026-08-14
    - metric: delta_changed_files
      value: 1
      unit: files
      window: review phase of tactic-attention-namespaced-rank,
        2026-08-13T22:44:24Z-23:01:54Z
      sensor: dispatch-review-base
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Observed

`tactic-attention-namespaced-rank`, phase `review`, ladder run started
2026-08-13T22:44:24Z, phase launched 22:44:48Z, `awaited/reviewed` 23:01:54Z
with `elapsed_s=1026 await_repolls=0 window_s=1800`.

This was the first live run of the narrowed re-review base (PR #3088,
`a272ea9c`). The narrowing worked: `review_base_source=sidecar-rebased`,
`target=3cc80c54..HEAD`, delta **1 file, +2/-2, comment-only**
(`packages/intentionsutil/test/store.test.ts`). The unnarrowed review would have
been 23 files; the naive two-dot range would have been 70.

Against that 4-line delta the phase spent, per `aggregate-usage.sh --node` with
the `--since 1786661064` selection (17 sessions):

| | turns | price proxy |
| --- | --- | --- |
| **orchestrator worker** (`launch_skill=review-fix`) | **109** | **$37.47** |
| the 5 review lenses (Lane B fan-out, opus) | 50 | $13.72 |
| `/review-plan` Opus pre-pass | 15 | $3.92 |
| `/code-review` detached pre-stage | 25 | $3.88 |
| 7 post-processing / plumbing subagents | 26 | $12.44 |
| PR-comment composer | 23 | $4.65 |
| **phase total** | **248** | **$76.09** ($18.09 cost) |

**The orchestrator session alone outspends every reviewer combined, 2.7 to 1.**
Only $13.72 of $76.09 — 18% — was spent looking at the diff.

Wall clock divides the same way. From the worker transcript
(`6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6`, 328 entries, 41 Bash calls, 2 Agent,
1 Workflow), 22:44:35 → 23:01:50:

- ~205s actual review depth — 101s `/code-review` pre-stage
  (`wall_clock_s=101` in its own `summary.txt`) + 104s of parallel Lane B lenses
  (22:53:07 → 22:54:51).
- ~830s orchestration: 173s Step 1 setup (15 Bash calls),
  108s `/review-plan`, 100s re-deriving the Workflow arg contract,
  ~113s of Workflow plumbing subagents, 78s PR-comment composition,
  70s phase-log rework, 66s `transition-node`, 27s sidecar + envelope.

None of that 830s scales with delta size. At the 3h26m / 32-subagent incident
this plan was written to fix, the floor was invisible. On a 4-line delta it is
**80% of the runtime and 82% of the spend**.

Yield for the whole $76.09: **10 findings surfaced, 0 actionable, 0 fixes**
(`result.json`: `findings_surfaced=10 findings_actionable=0 fixes_applied=0`,
all 10 dispositioned `Informational`).

# What would have to change

The floor, not the depth. The depth question is already recorded separately as
`review-plan-cheapen-requires-unanimity`; this entry is about the cost the
phase pays *before and after* any reviewer runs. Three of its components have
their own entries with concrete, non-redesign fixes:
`review-fix-workflow-args-rederived-each-pass`,
`phase-log-writer-issue-num-param-undocumented-for-pr-lane`, and
`workflow-file-writes-cost-subagent-roundtrips`. Those three account for
roughly 270s and $5.50 of the 830s / $62.

The remainder is the orchestrator's own 109 turns across 41 Bash calls — the
Step 1 classifier sequence (`dispatch-derive-node-target` ran three times:
once sandbox-denied, once with the override, once more purely to re-extract
`PR_NUM`), the context pack, and the Step 7 marker/sidecar/envelope tail.
Whether that sequence can be collapsed into fewer script invocations is the
open question this entry records; it is not proposed here, because a rule about
what the phase must do lives in the skill that owns the decision.

# Evidence a later session cannot rediscover

- Worker transcript: `6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6.jsonl` under
  `~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/`.
- Workflow journal + 12 subagent transcripts:
  `.../6b9f36ea-.../subagents/workflows/wf_ffefa101-347/`.
- `result.json` and `summary.txt` under the node worktree's
  `tmp/review-result-*` and `tmp/code-review-*` — both are worktree-local and
  will not survive a sweep.
