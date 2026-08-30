---
id: tactic-mainqa-attention-namespaced-rank-machine
kind: tactic
statement: "Post-merge verification of tactic-attention-namespaced-rank (PR
  #3075) — machine-verifiable items"
owner: ai
status: codified
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-drives-dispatch
  - strategy-rsi-delegated-prioritization
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution:
  branch: tactic-attention-namespaced-rank
  pr: 3075
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by:
  - tactic-attention-namespaced-rank
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Post-merge verification of tactic-attention-namespaced-rank (PR #3075) — machine-verifiable items

## Context

Post-merge verification recorded by `/qa-fix` at qa record time for
`tactic-attention-namespaced-rank` (PR #3075). Verified against the deployed `main` for that PR,
not against a preview.

## Verification items

- **1 — Removal of the two legacy `boost:`/`override:` compat parse branches**
  - Path: `current`
  - Expected outcome: the two legacy-form compat branches are eventually deleted once node files are rewritten onto the canonical `boosts:` form.
  - Finding: this PR deliberately keeps both legacy parse branches alive so the live store — 91 nodes on the legacy `boost:` form, 1 on `override:` — keeps parsing under the new sparse per-tier `boosts` map shape. This node's own "Explicitly out of scope" section assigns the branches' removal to the sibling `tactic-attention-per-tier-boost-migration`, which rewrites node files onto the canonical form and then deletes the compat branches. Both branches are already commented in `schema.ts` naming that sibling as their removal owner (grep-verified this pass). Removal is not assertable at this PR's merge time.
  - Verifiability: WAIT
