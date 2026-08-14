---
id: tactic-eval-finding-ladder-worker-unstamped-audit-blind
kind: tactic
statement: Detached ladder phase workers are born with no .dispatch-stamp.json
  sidecar, so aggregate-usage.sh --node scans zero files and the whole phase is
  unmeasurable by the instrument condition 14 mandates — the SessionStart hook
  does not mint stamps for claude --bg workers and no phase skill carries the
  belt-and-suspenders mint its own header prescribes
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
    - metric: unmeasured_phase_price_proxy_usd
      value: 81.94
      unit: usd
      window: tactic-align-review-skill align-tactics 2026-08-14T14:57:37Z/15:13:37Z
      sensor: transcript jq aggregate
      measured: 2026-08-14
    - metric: unmeasured_phase_turns
      value: 314
      unit: assistant turns
      window: tactic-align-review-skill align-tactics 2026-08-14T14:57:37Z/15:13:37Z
      sensor: transcript jq aggregate
      measured: 2026-08-14
    - metric: node_scoped_files_scanned
      value: 0
      unit: files
      window: tactic-align-review-skill align-tactics 2026-08-14T14:57:37Z/15:13:37Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: phase_skills_minting_a_sidecar
      value: 0
      unit: of 7 phase skills
      window: origin/main de347430
      sensor: grep dispatch-stamp-session
      measured: 2026-08-14
    - metric: worktree_sessions_without_sidecar
      value: 13
      unit: of 13 sessions
      window: 2026-08-14 worktree project dirs (indicative, needs fleet-scope
        confirmation)
      sensor: filesystem
      measured: 2026-08-14
    - metric: recurrence_count
      value: 1
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
The per-phase evaluation mandated by `strategy-recursive-self-improvement`
condition 14 prescribes `aggregate-usage.sh --node <id>` as its one instrument.
That instrument returned an **empty document** for this phase — not a zero, a
blindness.

## Observed

Node `tactic-align-review-skill`, phase `align-tactics`, ladder run started
2026-08-14T14:57:33Z (`.claude/worktrees/tactic-align-review-skill.ladder/events.jsonl`),
halted 15:13:41Z at exit 11 (`throw ... parked`).

```
aggregate-usage.sh --node tactic-align-review-skill
  → window.files_scanned: 0, sessions: [], totals.price_proxy_usd: 0
```

A positive control ruled out instrument failure: the same script scoped to
`tactic-attention-namespaced-rank` scanned 90 files and reported
`price_proxy_usd: 860.90`. The instrument can see; it could not see this phase.

## Cause

`aggregate-usage.sh:1437-1443` filters `--node` on the sibling sidecar:

```bash
node_stamp="$session_stem.dispatch-stamp.json"
if [[ ! -f "$node_stamp" ]] || [[ "$(jq -r '.node_id // empty' "$node_stamp")" != "$NODE_ID" ]]; then
  continue
fi
```

The phase worker session is
`~/.claude/projects/-home-n8-natb1-commons-systems--claude-worktrees-tactic-align-review-skill/0f494129-10fe-4e69-9295-f45cf968231e.jsonl`
(started 14:57:37.216Z — 0.2 s after the ladder's `launched` event; ended
15:13:37.554Z; `custom-title`/`agent-name` both `tactic-align-review-skill`).
It has **no** `.dispatch-stamp.json`, so it was skipped before it was counted.

This is *not* the `--since` bound defect already on the ledger as
`eval-since-bound-excludes-worker`: the driver's `--since 1786719457` equals the
launch second and the worker's `started_at` is 0.216 s later, so the time filter
would have admitted it. The document was empty *before* any `--since` filter ran.

Node-id derivation is also not at fault. The worker branch is exactly
`tactic-align-review-skill`, which takes `dispatch-stamp-session:255-257`'s
"the branch IS a node id" path. The stamp was never written at all.

The sole minting path is the `SessionStart:startup|resume` hook
`.claude/hooks/stamp-dispatch-session.sh`. Its own header names this exact
uncertainty, unresolved at authoring time:

> (a) Whether `SessionStart:startup` fires for detached `claude --bg` worker
> sessions (the primary dispatch worker launch path).

and prescribes the escalation:

> add a scripted `dispatch-stamp-session` call at the start of each phase
> SKILL.md (plan-issue, implement, qa-fix, review-fix, etc.) as a
> belt-and-suspenders write. NOT implemented.

**This run is the observation that resolves uncertainty (a) negatively.** Of the
seven phase skills, only `qa-fix` and `review-fix` mention
`dispatch-stamp-session` at all — and their call is
`--backfill-pr "$PR_NUM"` (`.claude/skills/qa-fix/references/idempotency-preamble.md:17`),
which is Mode B: it updates an existing stamp and does not mint one. So **no
phase skill mints a stamp today**; every phase depends entirely on the hook.

`align-tactics`, `implement`, `fix-checks`, `qa-main` and `dispatch-conflict`
carry no call whatsoever.

## Magnitude

Computed directly from the transcript with bounded `jq` (the instrument being
blind, there was no other route):

| figure | worker | + subagents | total |
| --- | --- | --- | --- |
| assistant turns | 88 | 226 | **314** |
| cache_creation tok | 603,287 | 1,213,391 | 1,816,678 |
| cache_read tok | 10,799,828 | 15,103,219 | 25,903,047 |
| output tok | 54,070 | 66,160 | 120,230 |
| price proxy | $31.57 | $50.37 | **$81.94** |
| opus cost | $10.52 | $16.79 | **$27.31** |

Cache hit ratio 0.934. All of it invisible to the mandated instrument.

Lenses 1 (recurring errors), 2 (round trips), 4 (rework), 5 (plan-quality yield)
and 7 (friction) all read their evidence off session rows, `tool_errors` and
`outcome` — every one of them was unmeasurable here through the prescribed route.

## Breadth

Every one of the 13 worktree-project sessions with a 2026-08-14 mtime lacks a
sidecar (13/13). Sidecar mtimes exist in quantity on earlier days (74 on 08-10,
10 on 08-13, 0 on 08-14). Treat the fleet-wide rate as *indicative only* — a
pooled rate is a fleet-only lens and this is a node-scoped run; it needs a
fleet-scope `aggregate-usage.sh` run to confirm. The node-scoped fact — this
phase produced no stamp and is therefore unmeasured — is solid on its own.

## What would have to change

Implement the escalation the hook's header already specifies: a scripted
`dispatch-stamp-session --session-id … --transcript-path …` mint at the start of
each phase skill, so measurability does not depend on whether a `SessionStart`
hook fires in `--bg` mode. This is a recommendation for the author, not applied
here.
