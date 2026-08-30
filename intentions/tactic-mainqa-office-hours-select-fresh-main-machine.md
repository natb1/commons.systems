---
id: tactic-mainqa-office-hours-select-fresh-main-machine
kind: tactic
statement: "Post-merge verification of tactic-office-hours-select-fresh-main (PR
  #2976) — machine-verifiable items"
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
  branch: tactic-office-hours-select-fresh-main
  pr: 2976
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-office-hours-select-fresh-main
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-office-hours-select-fresh-main (PR #2976) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-office-hours-select-fresh-main` (PR #2976). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **wrapper-live-dispatch — Wrapper end-to-end dispatch — targeted launch, queue-head selection, and the reworded not-parked message**
  - Path: `current`
  - Expected outcome: Targeted and untargeted `office-hours-graph` dispatch both behave as before the refactor; the liveness (`held`) dedup still suppresses already-claimed nodes; the not-parked path prints "office-hours: node <id> is not parked on origin/main — nothing to launch for it." and launches nothing.
  - Finding: Executing the wrapper against a live target requires `dangerouslyDisableSandbox: true` and reaches the real Claude daemon socket and dispatch queue; an autonomous QA session must not risk provisioning a worktree or launching a real office-hours session against live state. The collapsed single-`office-hours-select.ts`-call path, the `--ref`/absent-node contracts, and the full retirement of `park_live_on_main`/`cleared` are all covered statically (PASS) by this pass's script-verifiable items 5, 6, and 8. Only the live end-to-end dispatch behavior remains unobserved.
  - Verifiability: WAIT
- **stale-worktree-live-repro — Stale-worktree / reverse-staleness live repro, and the no-remote posture**
  - Path: `current`
  - Expected outcome: A genuinely stale PR-branch worktree (local park state predating an origin/main clear) resolves via `office-hours-select.ts` to the CURRENT origin/main state, not the stale local state, in both directions (a park cleared on main while the worktree still shows it parked, and a park landed on main that the worktree has not yet pulled). A clone with no `origin` remote hits the documented `--ref`-escape-hatch failure mode, not a silent empty-store degrade.
  - Finding: The fixture-level equivalent of the stale-worktree direction already passed this pass (item 4 — a local uncommitted edit to a node file left `--list` output unchanged) and is covered unconditionally by `store-at-ref.test.ts`'s 5 tests (all passing, item 1). What remains unobserved is reproducing the *reverse*-staleness direction and the no-remote posture against genuine live multi-session timing, which this session cannot stage safely without touching real dispatch state.
  - Verifiability: WAIT
