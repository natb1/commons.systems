---
id: tactic-align-tactics-self-claim-collision
kind: tactic
statement: Fix align-tactics Step 0.2 worktree_has_live_session self-claim
  false-positive when graph-launched under Shape B
owner: ai
status: raw
parent: null
rationale: 'Surfaced 2026-07-14 by the /review-fix pass on PR #2870
  (tactic-graph-phase-launch-per-phase, the Shape-B launch-per-phase tactic).
  The Shape-B strategy lane spawns the /align-tactics orchestrator session with
  `--name "$id"` — exactly the worktree basename that a live-session check keys
  on — so align-tactics own Step 0.2 worktree_has_live_session lookup can match
  its own just-spawned session as a pre-existing claim, a self-collision. Filed
  as a Deferred follow-up rather than fixed in PR #2870 because the fix belongs
  in align-tactics/SKILL.md and the shared lib-claude-agents.sh helper (30+
  callers, large test suite) — outside dispatch-graph-execute, the file PR #2870
  touches. Source PR: #2870.'
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
  - strategy-token-economy
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
pace_exempt: false
rounds: null
attributes: {}
---
# Fix align-tactics Step 0.2 worktree_has_live_session self-claim false-positive when graph-launched under Shape B

## Finding

- **Location**: `.claude/skills/dispatch-propagate/scripts/dispatch-graph-execute:149`
- **Source**: code-review, surfaced by `/review-fix` on PR #2870
- **Failure scenario**: the Shape-B strategy lane spawns the `/align-tactics`
  orchestrator session with `--name "$id"`, which is exactly the worktree
  basename a live-session check keys on
  (`worktree_has_live_session`/`lib-claude-agents.sh`). When `/align-tactics`
  Step 0.2 runs its own self-claim check against that same session name, it can
  match the just-spawned session as a pre-existing live claim — a
  self-collision that would incorrectly treat the node as already claimed by
  another worker.
- **Disposition**: classified `Fixed` by the review-fix Workflow's classifier,
  but the Opus fix agent declined to apply a fix in-scope: the mechanism lives
  in `.claude/skills/align-tactics/SKILL.md` and the shared
  `lib-claude-agents.sh` helper (30+ callers, large test suite), outside
  `dispatch-graph-execute` — the only file PR #2870 touches. Reclassified
  `Deferred` for filing purposes.
- **Recommended fix** (from the review pass): give the self-claim check a
  session-id exclusion mirroring `dispatch-spawn-job`'s `$SESSION_ID` guard —
  e.g. pass align-tactics' own `$CLAUDE_CODE_SESSION_ID` and skip a match where
  the live session's id equals self — or, since a successful
  `dispatch-spawn-job` kick already establishes the claim under Shape B,
  drop/short-circuit align-tactics' Step 0.2 `worktree_has_live_session` check
  entirely when launched via the graph lane.
- **Source PR**: #2870 (`tactic-graph-phase-launch-per-phase`)
