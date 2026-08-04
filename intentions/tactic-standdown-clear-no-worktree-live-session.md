---
id: tactic-standdown-clear-no-worktree-live-session
kind: tactic
statement: The standdown sweep's cleared-no-worktree branch erases a stand-down
  while a live session still holds the node name, silently re-creating the
  deadlock this tactic exists to remove for strategy- nodes, which never get a
  pre-provisioned worktree
owner: ai
status: raw
parent: null
rationale: "Filed 2026-07-31 by /review-fix on PR #2996
  (tactic-standdown-winner-liveness), classified Deferred (out of scope for that
  PR, needs an author ruling): lib-standdown-recheck.sh:619's
  cleared-no-worktree branch drops the marker whenever
  <repo>/.claude/worktrees/<node> is missing, on the reasoning that no unpushed
  work is possible there. But rule (d) has already handled n_live == 0, so at
  that point at least one live session still holds the node name -- precisely
  the state rule (i) (standdown-winner-dead-node-held) exists to surface. The
  gap bites hardest for ^strategy- names, which
  claude_agents_list_duplicate_node_names deliberately includes but which
  dispatch-graph-execute never pre-provisions a worktree for (it spawns with
  --cwd $PROJECT_ROOT and lets /align-tactics claim its own worktree). A
  stranded strategy-node stand-down is therefore silently erased instead of
  parked -- the exact silent stall tactic-standdown-winner-liveness exists to
  remove. This is a deliberate deviation from that tactic's rule table, which
  specifies the clear as written, so it needs an author ruling before it is
  applied."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
# The standdown sweep's cleared-no-worktree branch erases a stand-down while a live session still holds the node name, silently re-creating the deadlock this tactic exists to remove for strategy- nodes, which never get a pre-provisioned worktree

## Provenance

- **Source**: `/review-fix` on PR #2996 (`tactic-standdown-winner-liveness`), 2026-07-31.
- **Location**: `.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:619`.
- **Disposition**: classified `Deferred` (code-review residue phase) — a valid finding, out of scope for PR #2996, needing an author ruling before the code changes.

## Failure scenario

`lib-standdown-recheck.sh`'s `cleared-no-worktree` branch drops the marker
whenever `<repo>/.claude/worktrees/<node>` is absent, reasoning that no
unpushed work is possible there. But rule (d) has already handled
`n_live == 0` before this branch runs, so at the point `cleared-no-worktree`
fires, at least one live session still holds the node name — exactly the
state rule (i) (`standdown-winner-dead-node-held`) exists to surface, not
clear silently.

The gap bites hardest for `^strategy-` names: `claude_agents_list_duplicate_node_names`
deliberately includes them, but `dispatch-graph-execute` never pre-provisions a
worktree for the strategy lane (it spawns with `--cwd $PROJECT_ROOT` and lets
`/align-tactics` claim its own worktree, `dispatch-graph-execute:185-200`). A
stranded strategy-node stand-down is therefore silently erased instead of
parked — the exact silent stall `tactic-standdown-winner-liveness` exists to
remove.

## Proposed change

Do not clear on a missing worktree while a live session still holds the node
name. Fall through to rule (i) with a reason variant noting no worktree
exists (so no unpushed work is at risk), and keep the clear only for the
`n_live == 0` case rule (d) already covers. Touches: the rule ladder in
`lib-standdown-recheck.sh` (body + header contract) and test 15
(`no-worktree`) in `test-lib-standdown-recheck.sh`.

This is a deliberate deviation from `tactic-standdown-winner-liveness`'s own
rule table, which specifies the clear as written — hence the author ruling
this draft asks for before the change lands.
