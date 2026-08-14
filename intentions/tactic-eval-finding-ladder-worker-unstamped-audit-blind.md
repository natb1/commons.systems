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
    - metric: node_scope_files_scanned
      value: 0
      unit: files
      window: tactic-attention-per-tier-boost-migration/align-tactics
        2026-08-14T15:11:58Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: fleet_sidecars_written_during_run
      value: 0
      unit: sidecars
      window: 2026-08-14T15:12:03Z..16:54:23Z fleet-wide
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: newest_fleet_sidecar_epoch
      value: 1786661383
      unit: epoch_seconds
      window: fleet-wide as of 2026-08-14T16:54Z
      sensor: aggregate-usage.sh
      measured: 2026-08-14
    - metric: recurrence_count
      value: 2
      unit: occurrences
      window: all-time
      sensor: rsi
      measured: 2026-08-14
---
# Recurrence 2 — `tactic-attention-per-tier-boost-migration`, `align-tactics` phase, 2026-08-14

Reproduced exactly as first recorded. The instrument condition 14 mandates
returned an empty document at node scope:

```
$ .claude/skills/rsi-audit/scripts/aggregate-usage.sh \
    --node tactic-attention-per-tier-boost-migration --json-out …
$ jq '{files_scanned: .window.files_scanned, sessions: (.sessions|length),
       sidecar_eligible: .window.sidecar_eligible,
       sidecar_present: .window.sidecar_present}' …
{ "files_scanned": 0, "sessions": 0, "sidecar_eligible": 0, "sidecar_present": 0 }
```

## Positive control (required before recording an absence)

The instrument is not blind in general:

- `find /home/n8/.claude/projects -name '*.dispatch-stamp.json' | wc -l` → **1681**
  sidecars exist fleet-wide, so the scan path works.
- Scoping the same document by session instead — `--session
  adaffcf8-1144-41bf-b038-e0cddc37f89e`, this phase's worker — returns
  `files_scanned: 7`, `sessions: 7`. The instrument can see this session's
  family; it cannot see it by node.
- `grep -rl tactic-attention-per-tier-boost-migration
  /home/n8/.claude/projects --include='*.dispatch-stamp.json'` → **no matches.**

So the cause is confirmed as the one first recorded: **no
`<stem>.dispatch-stamp.json` was minted for the detached ladder phase worker**,
and `--node` matches on `node_id` inside that sidecar
(`aggregate-usage.sh:1432-1442`).

## New evidence: the drought is fleet-wide for the whole run window

The newest sidecar anywhere under `~/.claude/projects` is stamped
`1786661383` (2026-08-14T05:29:43Z). This phase ran 15:12:03Z → 16:54:23Z.
**Zero sidecars were written anywhere on the machine during the entire
102-minute run**, across every node the fleet was working — so this is not a
per-node accident but a stopped writer.

## What is lost

Every any-scope lens that reads a session row: `turns`, `peak_context`,
`price_proxy_usd`, `hit_ratio`, `outcome`, `permission_friction`. This
evaluation recovered them only by falling back to `--session`, which requires
already knowing the session id — and the ladder does not record one
(`dispatch-graph-execute` spawns every phase with `--name <node-id>`). The id
was recoverable here only because `lib-frozen-session-park` happened to print
`session=adaffcf8-…` in the journal while sweeping the un-reaped worker. On a
phase that reaps cleanly, that line never appears and the phase is
unmeasurable outright.

See also `tactic-eval-finding-align-tactics-worker-transcript-unscanned`: even
with a sidecar, this particular phase's worker transcript is in a project
directory `aggregate-usage.sh` structurally never scans, so minting the sidecar
is necessary but not sufficient for `align-tactics`.
