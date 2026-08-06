---
id: tactic-blocked-by-gates-code-on-main
kind: tactic
statement: blockersComplete treats a blocker as satisfied only at phase done, so
  a merged node carrying needs-main residue gates every dependent on a
  verification phase rather than on the blocker's code actually being on main --
  gate on code-on-main and add a distinct edge kind for genuine
  await-post-merge-verification dependencies
owner: ai
status: raw
parent: null
rationale: "Surfaced and ruled ADOPTED in the 2026-08-05 /align interview (R1).
  blockersComplete (packages/intentionsutil/src/router.ts:206-213) returns false
  unless blocker.phase === 'done'. Greenfield: a blocker is satisfied once its
  code is on main (execution.completion.mergedAt / mergeCommitSha, or a merged
  PR); the rare genuine 'await post-merge verification' dependency gets its own
  explicit edge kind instead of being the default. Measured on origin/main
  2026-08-05: 57 gated nodes, 5 gated SOLELY by main-qa blockers whose PRs are
  all merged (2780, 3020, 2904, 2982) -- down from 7 only because that same
  session removed two edges BY HAND, which is the argument for the fix. Retires
  the recurring manual edge-removal step."
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
# blockersComplete treats a blocker as satisfied only at phase done, so a merged node carrying needs-main residue gates every dependent on a verification phase rather than on the blocker's code actually being on main -- gate on code-on-main and add a distinct edge kind for genuine await-post-merge-verification dependencies
