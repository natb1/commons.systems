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

## Re-scoped 2026-08-13 — the substance already shipped; only naming remains

Overtaken by a sibling. `tactic-invalid-state-lane` landed the split on
2026-08-05 (commit `62ac5bb1`), before this node was ever selected, so the
defect this node was filed against no longer exists.

**What shipped.** `worktree_occupancy_state`
(`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh:1043-1203`)
publishes the matched holder's state through exported globals —
`WORKTREE_OCCUPANCY_STATE` (`free` / `live` / `terminal` / `unknown`) and
`WORKTREE_OCCUPANCY_SESSION_ID` — which is exactly the mechanism this node's
Proposal section specified. `graph-select-target:1136-1157` switches on it and
records `skip_note "$id" "terminal-session"` with a diagnostic naming the
session id, instead of misattributing the block to `live-session`.

Two design points the shipped code got right that this node had not
considered:

- **`unknown` folds into `live-session`, deliberately.** A failed daemon read
  must never surface as an invalid state, or a daemon hiccup manufactures
  interventions out of healthy nodes (`graph-select-target:1151-1153`).
- **The call is made directly with stdout redirected, not through `$( )`.**
  Command substitution runs it in a subshell, which loses the evidence
  globals, so the diagnostic would name a stale session id.

**All that remains is the token's name.** This node asked for `held-done`;
what shipped is `terminal-session`, which is a superset — it covers any
registered-but-not-running holder, not only one that reached `done`. The
shipped name is the better one: `done` is a session status, while the
condition being reported is that *nothing is running yet the claim survives*.

So the remaining decision is whether to keep `terminal-session` and close this
node as satisfied, or to rename. It is not a code defect either way, and the
audit-every-consumer work this node's Proposal called for was already done by
`tactic-invalid-state-lane`. Deliberately **not** closed here: PR #3073 did
not touch this path and this session did not re-verify the consumer set, so
the naming call is left to whoever next picks the node up.
