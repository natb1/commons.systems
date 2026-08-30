---
id: tactic-mainqa-conflict-outranks-ci-precedence-machine
kind: tactic
statement: "Post-merge verification of tactic-conflict-outranks-ci-precedence
  (PR #3019) — machine-verifiable items"
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-conflict-outranks-ci-precedence
  pr: 3019
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-conflict-outranks-ci-precedence
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-conflict-outranks-ci-precedence (PR #3019) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-conflict-outranks-ci-precedence` (PR #3019). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **10 — Real-world confirmation that a CONFLICTING + red PR declines the interrupt in the live fleet**
  - Path: `current`
  - Expected outcome: zero fix-interrupt writes against a conflicted-and-red PR on `main`, with the conflict lane still picking it up — the end-to-end behavior the hermetic fixtures only simulate (real `gh` mergeable state + real `provision-node-worktree` exit-11 handoff, not stubbed sensors).
  - Finding: all 8 script-verifiable QA items passed (including the full 71/71 hermetic bash-fixture suite covering the decline path, the mergeable-red control, sensor wiring, the cost guard, `qa`-phase non-stranding, and eval-failure fail-safe). The node body's own "Manual / observe-in-production" section above already names the exact checks: `git log --oneline origin/main -- intentions/<id>.md` shows no `graph: enter fix-interrupt on <id>` commit for the episode; the tick journal / selector stderr carries the `declining the fix interrupt` line; the node's `execution.fix` stays `null` and it reaches `/dispatch-conflict` Lane 3.
  - Verifiability: WAIT
  - Check: `git log --oneline origin/main -- 'intentions/*.md' | xargs -I{} git log -1 --format='%H %s' {} 2>/dev/null | grep 'graph: enter fix-interrupt'` cross-referenced against a concurrently `CONFLICTING` PR at the same commit, plus a `journalctl`/tick-log grep for `declining the fix interrupt`.
