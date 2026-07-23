---
id: tactic-main-post-merge-validation
kind: tactic
statement: decide whether origin/main gets its own validating build, since the
  merge-gating suite never runs on main
owner: human
status: raw
parent: null
rationale: "Retained from the 2026-07-23 /align-strategy round on the wezterm
  pin. unit-tests.yml's fifteen jobs carry branches-ignore [main, graph/**], so
  the trunk's merge-gating suite is validated pre-merge on the branch push and
  never post-merge on main. That is coherent for commit-caused breakage but
  blind to breakage whose cause is OUTSIDE the repo and arrives with no commit —
  the wezterm asset repackage being the worked example. Open question,
  deliberately undecided: whether to add a scheduled or post-merge main build,
  which costs real CI time (a nix build runs roughly 22 minutes) and trades
  against strategy-token-economy. Owner human because the cost/benefit call is
  the author's, not a mechanical fix."
reading: null
gap: null
serves:
  - strategy-main-health
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
# decide whether origin/main gets its own validating build, since the merge-gating suite never runs on main
