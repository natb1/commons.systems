---
id: tactic-select-target-held-done-label
kind: tactic
statement: graph-select-target should report held-done rather than live-session
  for a done-but-not-removed holder
owner: ai
status: raw
parent: null
rationale: "Deferred out-of-scope finding from the /review-fix pass on PR #2998
  (tactic-stopped-session-blocks-node). worktree_has_live_session now reads the
  REGISTERED view, so a candidate can be skipped because a session that has gone
  done (but has not been claude rm'd) still holds its worktree.
  graph-select-target
  (.claude/skills/dispatch-propagate/scripts/graph-select-target:684-687) still
  records skip_note \"$id\" \"live-session\" and prints \"graph-select-target:
  live-session\" in that case. Nothing is live, so the structured decision trace
  misattributes the block and an operator reading it hunts for a process that
  does not exist. The library's stderr diagnostic (session id + claude rm <sid>)
  partly compensates but lands on a different stream and is absent from the
  structured skip record."
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
# graph-select-target should report held-done rather than live-session for a done-but-not-removed holder

## Provenance

Deferred out-of-scope finding from the `/review-fix` pass on PR #2998
(tactic-stopped-session-blocks-node), source `code-review`.

`worktree_has_live_session` now reads the REGISTERED view, so a candidate can
be skipped because a session that has gone `done` (but has not been `claude
rm`'d) still holds its worktree. `graph-select-target`
(`.claude/skills/dispatch-propagate/scripts/graph-select-target:684-687`)
still records `skip_note "$id" "live-session"` and prints
`graph-select-target: live-session` in that case. Nothing is live, so the
structured decision trace misattributes the block and an operator reading it
hunts for a process that does not exist.

The library's stderr diagnostic (session id + `claude rm <sid>`) partly
compensates but lands on a different stream and is absent from the structured
skip record.

**Adversarial verdict:** not independently adversarially verified — this is a
Lane-A (`code-review`) residue finding, dispositioned `Deferred` directly by
the residue phase rather than routed through the shared skeptic-verify stage.

## Proposal

Have `worktree_has_live_session` publish the matched holder's state in an
exported variable (mirroring the existing `CLAUDE_SESSION_ID_LIVE_STATE` idiom
at `lib-claude-agents.sh:868-873`), and have `graph-select-target` emit
`held-done` vs `live-session` off it. Audit every consumer of the
`live-session` skip token (decision-log readers, dashboards,
`test-graph-select-target.sh`) before splitting the string, and add a case per
branch.
