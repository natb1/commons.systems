---
id: tactic-emit-outcome-node-lane-issue-arg
kind: tactic
statement: dispatch-emit-outcome hard-validates --issue as a positive integer,
  but review-fix and qa-fix's node lane both pass the node id (non-numeric) as
  --issue per their own terminal-disposition docs, so every node-lane
  outcome-envelope emit call exits 2 and no envelope ever lands for graph-native
  runs, silently excluding the entire node lane from the token-audit dataset
owner: ai
status: raw
parent: null
rationale: "Discovered 2026-07-31 by /review-fix on PR #3004
  (tactic-phase-terminal-requires-disposition) while executing its own Step 7
  terminal actions: dispatch-emit-outcome
  (.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome) requires
  --issue to match ^[1-9][0-9]*$ and exits 2 otherwise (\"--issue must be a
  positive integer\"). review-fix's node-lane docs
  (references/terminal-actions.md's general Step 7 recipe, not re-keyed by
  references/node-lane.md's seam list) call `dispatch-emit-outcome --issue <N>`
  where $N is bound to the node id string on the node lane (e.g.
  tactic-phase-terminal-requires-disposition) -- not a number. qa-fix's
  references/terminal-disposition.md has the identical pattern (`--issue \"$N\"`
  with no lane distinction). So on every node-lane run of either skill the emit
  call fails validation and no envelope is ever printed to the transcript,
  meaning aggregate-usage.sh / dispatch-token-audit silently sees zero node-lane
  runs -- not an accurate zero, an unmeasured gap that looks identical to a
  clean or unused pipeline. This PR's own review-fix pass hit this and skipped
  the emit for its run rather than fabricate a numeric placeholder (which would
  misattribute review-fix outcomes to a fake issue number and corrupt rather
  than merely omit data)."
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
# dispatch-emit-outcome hard-validates --issue as a positive integer, but review-fix and qa-fix's node lane both pass the node id (non-numeric) as --issue per their own terminal-disposition docs, so every node-lane outcome-envelope emit call exits 2 and no envelope ever lands for graph-native runs, silently excluding the entire node lane from the token-audit dataset
