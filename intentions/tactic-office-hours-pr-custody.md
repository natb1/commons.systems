---
id: tactic-office-hours-pr-custody
kind: tactic
statement: "Escalation parks keep custody of their PR: the park-time write
  records execution.pr and the resolution disposition, and /implement
  re-derivation checks for an existing open PR by branch before starting over"
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-07-23 office-hours drain round: the dominant
  failure pattern across 3 of 10 parked nodes was an escalation park leaving its
  green PR in draft with execution.pr unrecorded, so a later session re-derived
  from scratch and re-parked — silently overriding a decision the author had
  already made."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 3
  override: null
  rationale: "Author-directed 2026-07-23 /align-strategy round: the top-3 systemic
    gaps (PR custody, scripted census, playwright retry) rank ahead of the
    low-urgency tracked gaps once finalized."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Escalation parks keep custody of their PR: the park-time write records execution.pr and the resolution disposition, and /implement re-derivation checks for an existing open PR by branch before starting over

## Interview context (2026-07-23, /align-strategy byproduct — raw, for /align-tactics)

The defect chain: a qa/implement escalation parks a node, leaves its PR in **draft** with `execution.pr` **unrecorded**; nothing ever merges the PR; a later `/implement` re-derives from scratch, sees no PR, and re-parks — silently overriding a human decision.

Observed instances (2026-07-23 drain round):
- PR #2942: a ratified fix re-parked 82 minutes after ratification as "close as duplicate".
- PR #2898: green and untouched for 4 days while its bug fired 27 times in CI.
- 3 of the 10 top-ranked parks that round had this shape.

Candidate fix surface (finalization decides):
- `park-node` records `execution.pr` at park time when a pushed branch exists.
- Office-hours resolution that ratifies a fix marks the PR ready (or records an explicit disposition) — never leaves ratified work in draft.
- `/implement` re-derivation cross-checks `gh pr list --head <branch>` before starting over (the context-pack `--pr` probe has a known false-negative: it can report none with an open draft).

This is also migration step 1 of the census greenfield (strategy clarification, 2026-07-23): trustworthy `execution.pr` custody is what the scripted verify-merged-only prune reads.
