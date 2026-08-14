---
id: tactic-eval-finding-review-plan-cheapen-requires-unanimity
kind: tactic
statement: review-plan cheapens effort only when ALL analyses agree but raises
  on any single one, so one legitimate narrow concern (a lane-authored sensor
  suppression) pinned effort at high against six independent cheapen signals
  including zero-executable-tokens — a 1-file +2/-2 comment-only delta cost 76
  dollars price proxy, 248 turns and 13 subagents to return 10 findings and 0
  actionable
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
    - metric: review_delta_files
      value: 1
      unit: files
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: git
      measured: 2026-08-13
    - metric: review_delta_lines_changed
      value: 4
      unit: lines
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: git
      measured: 2026-08-13
    - metric: cheapen_signals
      value: 6
      unit: analyses
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: rsi
      measured: 2026-08-13
    - metric: raise_signals
      value: 1
      unit: analyses
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: rsi
      measured: 2026-08-13
    - metric: phase_price_proxy_usd
      value: 76.0891035
      unit: usd
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_cost_usd
      value: 18.0877643
      unit: usd
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: phase_turns
      value: 248
      unit: turns
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: subagents_launched
      value: 13
      unit: sessions
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: findings_surfaced
      value: 10
      unit: findings
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: findings_actionable
      value: 0
      unit: findings
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: cold_cache_fanout_price_proxy_usd
      value: 19.512093
      unit: usd
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: aggregate-usage.sh
      measured: 2026-08-13
    - metric: usd_per_actionable_finding
      value: 76.0891035
      unit: usd
      window: tactic-attention-namespaced-rank/review@1786661088
      sensor: rsi
      measured: 2026-08-13
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-13
  resolved_by: 1092a403e0000e4a4ce8ff106b892bfb32d4cdb7
---
# First sighting — tactic-attention-namespaced-rank / review / `--since 1786661088`

## What was reviewed

The `#3088` re-review narrowing worked exactly as designed. `dispatch-review-base`
resolved `REVIEW_BASE = 3cc80c54` (a synthetic *"review-base: previously-reviewed
state brought up to the merge base"* commit), and the narrowed delta it produced
was:

```
git diff --shortstat 3cc80c54..1713cf0c
 1 file changed, 2 insertions(+), 2 deletions(-)
 packages/intentionsutil/test/store.test.ts
```

Two trailing `// type-safety-ok:` comments appended to two pre-existing casts, by
lane commit `4f979ad8`. **Zero executable tokens.**

(For contrast, the un-narrowed merge-base diff is 23 files, +1740/−1366. The
narrowing removed ~99.8% of the reported surface. This finding is not about the
narrowing; the narrowing is working.)

## What review-plan decided, and by what rule

`/review-plan`'s verdict, recovered from the worker transcript, measured the delta
correctly and completely. It produced **six independent cheapen signals and one
raise**:

| analysis | verdict |
| --- | --- |
| 1 blast radius | cheapen — `symbols=0, generic=0, files=0, truncated=false`; no out-of-diff reading list |
| 2 contract delta | cheapen — none; no signature, return shape, error/exit path, public export, schema, config default or CLI flag |
| 4 change class | cheapen — comment-only in an existing test file; **zero executable tokens changed** |
| 5 prior-finding recurrence | cheapen — none; prior pass closed `completed_with_fixes`, no deferred items |
| 6 test-coverage delta | cheapen — no production logic changed |
| 8 size/dispersion | cheapen — 1 file, +2/−2, single package |
| **7 provenance** | **raise** — a lane-authored CI repair adding a suppression to silence a sensor |

It then wrote, in its own `reasons.effort`:

> "Six analyses agree on cheapening, but analysis 7 registers one genuine raise …
> **Cheapening requires ALL signals to agree**, so the default `high` is retained
> rather than lowered; nothing (no irreversible surface, zero blast radius, no
> contract delta) argues for going above it."

`effort: "high"`. `finder_set: ["input-validation", "domain-sweep", "red-team",
"security-review", "api-cost"]`. The `/code-review` lock recorded
`effort=high model=opus deadline_s=5400`.

## The rule is the finding

Analysis 7 is *right*: whether a `type-safety-ok:` suppression is legitimate or
launders a real type error is exactly a reviewer's question, and it deserves to be
asked. The defect is the **shape of the response**, not the decision to respond.

`raise` is a binary escalation to the `high` default. There is no way to express
"one narrow question, asked well" — which is what analysis 7 actually described,
and what a 4-line comment delta actually needs. Unanimity-to-cheapen means a
single legitimate concern, however narrow, restores the full-price posture that
six independent measurements just argued against. Because cheapening needs 7/7
and raising needs 1/7, the cheapen path is nearly unreachable on any delta a lane
authored — and lane-authored CI repairs are precisely the deltas most likely to be
tiny.

## What it cost, measured

| figure | value |
| --- | --- |
| price proxy | **$76.09** |
| cost | **$18.09** |
| turns | 248 |
| sessions | 17 (1 worker + 15 subagents + 1 shell) |
| wall clock | 1026s |
| models | 9× sonnet-5, 7× opus-5 |
| cache read | 21.29M tokens |
| output | 113,062 tokens |

Against outcome:

```json
{ "findings_surfaced": 10, "findings_actionable": 0,
  "fixes_applied": 0, "followups_filed": 0,
  "subagents_launched": 13, "disposition": "completed" }
```

**$76.09 and 248 turns to review four comment lines, yielding zero actionable
findings, zero fixes, zero follow-ups.** `outcome_rates`: `hit_rate 0`,
`actionability 0`.

The pipeline is not malfunctioning — it surfaced 10 candidates and the
adversarial-verify stage correctly refuted all 10. The cost is the price of
running that machinery at `high` on a delta that six analyses called trivial.

### Where the money went

The fan-out re-primes cache per subagent. 9 of the 15 subagents ran at
`hit_ratio < 0.7` (min 0.394), together $19.51 for 43 turns — $0.45/turn against
the worker's $0.34/turn at `hit_ratio 0.975`. Roster width is the dominant term,
so effort/roster gating is where the leverage is.

## What would have to change

The author's call, not this evaluator's — recorded, not applied. The observation
is that `review-plan`'s verdict is one dimension (`effort`) plus a roster, and
analysis 7's actual content ("verify this one suppression is not laundering a
type error") is a *scope*, not an *intensity*. A verdict able to say "low effort,
one finder, this question" would have expressed analysis 7 faithfully and
truthfully at a small fraction of $76.09.

Note that the review could not fully answer analysis 7's question anyway: the
reviewer's attempts to run `.github/scripts/check-type-safety-escapes.sh` were
both permission-denied — see `eval-finding-unattended-worker-tool-use-rejected-midflight`.

## Evidence a later session cannot rediscover

- Worker transcript (holds the full verdict object):
  `~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-attention-namespaced-rank/6b9f36ea-b44f-4076-b9ee-3da2ff0a62a6.jsonl`
  — grep `blast_radius_generic` for the `review_plan` payload.
- `REVIEW_BASE` = `3cc80c54a89daefa8f5ae4000ef00e8788f1573d`;
  launch head = `1713cf0cfecb0bd36c4ac0370f8d65b47db74f22`; PR #3075.
- Lock file at the time of the run:
  `.claude/worktrees/tactic-attention-namespaced-rank.code-review-lock`
  (`target=3cc80c54..HEAD effort=high model=opus deadline_s=5400`).
- Ladder: `launched 22:44:48Z → awaited/reviewed 23:01:54Z`, `elapsed_s=1026`,
  `await_repolls=0`, `window_s=1800`.
