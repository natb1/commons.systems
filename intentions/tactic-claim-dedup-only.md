---
id: tactic-claim-dedup-only
kind: tactic
statement: "node-id claiming narrows to router scheduling-dedup: no session is
  blocked from editing a node by a held claim; align skills drop the
  stop-on-held-claim step"
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-07-13 automatic-serialization interview: the
  claim/worktree ledger stops gating edits (write safety moves to land time) and
  keeps only duplicate-spawn prevention for router workers. Motivating episode:
  an unrelated diagnose-main bg session squatting the strategy worktree blocked
  this very interview at the align skill's stop-on-held-claim step."
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
# node-id claiming narrows to router scheduling-dedup: no session is blocked from editing a node by a held claim; align skills drop the stop-on-held-claim step

**Draft** — byproduct of the 2026-07-13 automatic-serialization interview
(doctrine home: that date's clarification on `strategy-graph-native-dispatch`);
input to a later `/align-tactics strategy-graph-native-dispatch` round.

## What changes

The claim/worktree ledger had two jobs; it keeps one:

- **Kept — scheduling dedup:** the router does not spawn a second worker for
  a node whose claim is live (duplicate workers burn tokens on redundant
  work). `tactic-graph-router-selector` claim semantics unchanged for spawn
  decisions.
- **Dropped — edit gating:** no session (align interview, phase worker,
  office-hours entry) is refused, stopped, or made to wait because a node's
  worktree has a live session. Write safety lives entirely at land time
  (`tactic-graph-commit-auto-serialization`'s ladder).

## Surfaces to change

- `.claude/skills/align-strategy/SKILL.md` Step 0.2 — the
  stop-and-report-held-claim rule (and its `worktree_has_live_session` check)
  is removed; a session may author in any worktree cut from fresh
  origin/main. Step 0's freshness and never-author-in-main-checkout rules
  stay.
- `/align-tactics` and office-hours skill equivalents of the same step.
- The 2026-07-06 uniform-claiming clarification's skill-facing guidance is
  already amended on the strategy node (2026-07-13); skills follow.

## Motivating episode (recorded evidence)

2026-07-13: an unrelated `diagnose-main` background session with cwd in
`.claude/worktrees/strategy-graph-native-dispatch` blocked the
automatic-serialization interview itself at the stop-on-held-claim step —
a claim gate serializing the author where no overlapping work existed. The
liveness rule cannot distinguish an authoring session from a squatter, and
dedup-only scope makes that distinction irrelevant for edits.

Incidental defect seen live: `worktree_has_live_session`
(`.claude/skills/dispatch-propagate/scripts/lib-claude-agents.sh`) hit
`command not found: basename` — a zsh path/PATH-clobber-shaped bug — and
still returned held; fix opportunistically when touching this surface.
