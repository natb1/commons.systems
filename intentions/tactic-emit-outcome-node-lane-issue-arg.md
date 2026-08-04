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
rationale: "Discovered independently twice. First by /review-fix on PR #3004
  (tactic-phase-terminal-requires-disposition), 2026-07-31, while executing its
  own Step 7 terminal actions: dispatch-emit-outcome
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
  clean or unused pipeline. That PR's own review-fix pass hit this and skipped
  the emit for its run rather than fabricate a numeric placeholder (which would
  misattribute review-fix outcomes to a fake issue number and corrupt rather
  than merely omit data). Rediscovered independently 2026-08-04 by /review-fix
  on PR #3027 (tactic-review-verify-per-file-batching), confirming the gap is
  still unfixed and recurring on every node-lane terminal pass, not a one-off:
  same call site (dispatch-emit-outcome:205, _require_pos_int issue), same
  failure mode. That second session skipped its own emit the same way, then
  filed this node without first checking whether it already existed and briefly
  overwrote this original PR #3004 provenance with its own before the collision
  was caught and the two write-ups were merged back together here."
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

## Provenance

- **Location**: `.claude/skills/dispatch-propagate/scripts/dispatch-emit-outcome:205`
  (`_require_pos_int issue "$ISSUE"`, regex `^[1-9][0-9]*$`), documented call
  sites at `.claude/skills/review-fix/references/terminal-actions.md:148/186`
  and `.claude/skills/qa-fix/references/terminal-disposition.md:97/213`
  (`--issue "$N"` where `$N` is the node id on the node lane).
- **Failure scenario**: run `/review-fix` or `/qa-fix` to completion on a
  graph-native tactic node and reach the terminal outcome-envelope emit as
  documented → `dispatch-emit-outcome --issue "$N" ...` exits 2
  (`--issue must be a positive integer (>= 1), got: tactic-...`), because `$N`
  is a node-id string, not a gh issue number. Confirmed on two independent
  occurrences: PR #3004 (2026-07-31) and PR #3027 (2026-08-04).
- **Adversarial check performed**: read the script's parser directly
  (no `--node-id` variant or string-issue branch exists), read
  `.claude/docs/outcome-envelope.md`'s field table (`issue: integer, no, the
  dispatch issue number`, no node-id alternative documented), and confirmed
  both `review-fix` and `qa-fix` node-lane docs pass `$N` unchanged with no
  re-keyed seam noted for this call — this is not a one-off doc typo, it is
  the same gap in both phases' node lane.
- Both sessions skipped the node-lane outcome-envelope emit for their run
  rather than fabricate a numeric `--issue` value (which would misattribute
  the run to a fake issue number and corrupt aggregate-usage.sh's per-issue
  cost attribution, rather than merely omit data).

## Suggested direction (not binding)

Either widen `dispatch-emit-outcome`'s `--issue` validation to accept a
node-id string alongside a positive integer (and extend
`.claude/docs/outcome-envelope.md`'s `issue` field to a `string | integer`
union covering both lane shapes), or add a distinct `--node-id` flag so the
envelope schema can keep `issue` strictly numeric while still recording
graph-native runs under their own key. Either direction needs
`aggregate-usage.sh` (the envelope's reader) updated to handle whichever
shape is chosen.
