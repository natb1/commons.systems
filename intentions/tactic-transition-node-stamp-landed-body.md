---
id: tactic-transition-node-stamp-landed-body
kind: tactic
statement: transition-node's refresh_stamp hashes the post-`git reset --hard`
  worktree body, so every node-lane worker stamps the PRE-edit scope fingerprint
  — repair it to stamp what actually landed on origin/main
owner: ai
status: raw
parent: null
rationale: "Found 2026-07-25 while diagnosing repeated /qa-fix sessions closing
  as 'qa already complete but phase was not progressed'. transition-node:178-183
  lands the write via graph-commit and THEN calls refresh_stamp; graph-commit's
  cleanup does `git reset --hard $ORIG_HEAD` (graph-commit:301-303) to restore
  the far-ahead PR-branch tip it moved off to land an intentions/-only SHA.
  refresh_stamp then reads REPO_ROOT's intentions/<id>.md — by that point
  reverted to the branch copy — and writes that stale fingerprint to
  <main>/.claude/worktrees/<id>.scope-fingerprint. Result: stamp != origin/main
  whenever the transition also changed the body, which is exactly the /qa-fix
  Step 3.6 `## needs-main residue` case. The next dispatch-graph-scope-sweep
  tick reads that as scope drift and calls demote-node-to-implement, which wipes
  execution.markers to [] (dropping qa-done and planned) and discards completed
  QA custody. Note the stamp PATH is already correct (MAIN_ROOT is resolved
  deliberately for this, transition-node:48-51) — the defect is the CONTENT
  SOURCE, which is why tactic-transition-node-scope-stale-test-coverage does not
  cover it."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 95
  override: null
  rationale: "Author-directed 2026-07-25 /align-strategy round ('boost both to top
    rank'): this and tactic-phase-evidence-fingerprint-bound rank at the top of
    normal work — above the current top tactic band (90) and the 85 band below
    it, and below the strategy-main-health emergency ceiling (boost 100), which
    the 2026-07-13 write-path guard keeps dominant and which this round does not
    disturb."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# transition-node's refresh_stamp hashes the post-`git reset --hard` worktree body, so every node-lane worker stamps the PRE-edit scope fingerprint — repair it to stamp what actually landed on origin/main
