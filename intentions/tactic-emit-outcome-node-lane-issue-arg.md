---
id: tactic-emit-outcome-node-lane-issue-arg
kind: tactic
statement: dispatch-emit-outcome's --issue flag hard-requires a positive
  integer, but review-fix and qa-fix's node-lane terminal steps are documented
  to call it with the graph-native node id (a string) as --issue, so the
  node-lane outcome-envelope emit will always exit 2 and never has been able to
  run
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-08-04 running /review-fix on
  tactic-review-verify-per-file-batching (PR #3027), a graph-native node-lane
  run. Step 7 of review-fix/SKILL.md and qa-fix's terminal-disposition.md both
  document calling `dispatch-emit-outcome --issue \"$N\"` unchanged on the node
  lane, where $N is the node id string (e.g.
  tactic-review-verify-per-file-batching), not a gh issue number.
  dispatch-emit-outcome's own argument parser calls `_require_pos_int issue
  \"$ISSUE\"` (scripts/dispatch-emit-outcome:205), which regex-matches
  `^[1-9][0-9]*$` and exits 2 on any non-integer value. The outcome-envelope
  schema doc (.claude/docs/outcome-envelope.md) also types `issue` as `integer,
  no, the dispatch issue number` with no node-id variant. So every node-lane
  review/qa terminal pass that reaches this call fails it; this session skipped
  the emit rather than fabricate a fake issue number (which would corrupt
  aggregate-usage.sh's per-issue cost attribution) or hard-crash the terminal
  sequence before the load-bearing completion action (transition-node --set-pr)
  ran."
reading: null
gap: null
serves:
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
# dispatch-emit-outcome hard-validates --issue as a positive integer, but review-fix and qa-fix's node lane both pass the node id (non-numeric) as --issue per their own terminal-disposition docs, so every node-lane outcome-envelope emit call exits 2 and no envelope ever lands for graph-native runs, silently excluding the entire node lane from the token-audit dataset

## Provenance

- **Location**: `.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome:205`
  (`_require_pos_int issue "$ISSUE"`, regex `^[1-9][0-9]*$`), documented call
  sites at `.claude/skills/review-fix/references/terminal-actions.md:148/186`
  and `.claude/skills/qa-fix/references/terminal-disposition.md:97/213`
  (`--issue "$N"` where `$N` is the node id on the node lane).
- **Failure scenario**: run `/review-fix` or `/qa-fix` to completion on a
  graph-native tactic node (e.g. this session's `tactic-review-verify-per-file-batching`,
  PR #3027) and reach the terminal outcome-envelope emit as documented →
  `dispatch-emit-outcome --issue "$N" ...` exits 2
  (`--issue must be a positive integer (>= 1), got: tactic-...`), because
  `$N` is a node-id string, not a gh issue number.
- **Adversarial check performed**: read the script's parser directly
  (no `--node-id` variant or string-issue branch exists), read
  `.claude/docs/outcome-envelope.md`'s field table (`issue: integer, no, the
  dispatch issue number`, no node-id alternative documented), and confirmed
  both `review-fix` and `qa-fix` node-lane docs pass `$N` unchanged with no
  re-keyed seam noted for this call — this is not a one-off doc typo, it is
  the same gap in both phases' node lane.
- **Source PR**: this finding was surfaced, not fixed, while running
  `/review-fix` on PR #3027
  (`tactic-review-verify-per-file-batching`); this session skipped the
  node-lane outcome-envelope emit for that run rather than fabricate a
  numeric `--issue` value.

## Suggested direction (not binding)

Either widen `dispatch-emit-outcome`'s `--issue` validation to accept a
node-id string alongside a positive integer (and extend
`.claude/docs/outcome-envelope.md`'s `issue` field to a `string | integer`
union covering both lane shapes), or add a distinct `--node-id` flag so the
envelope schema can keep `issue` strictly numeric while still recording
graph-native runs under their own key. Either direction needs
`aggregate-usage.sh` (the envelope's reader) updated to handle whichever
shape is chosen.
