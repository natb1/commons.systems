---
id: tactic-worker-start-revalidation
kind: tactic
statement: "Worker-start re-validation gate: provision-node-worktree re-checks
  node state against fresh origin/main before a phase worker executes"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-06 /align-strategy concurrency interview
  (select-all safety round): the selection-to-execution staleness window has a
  write-side gate (transitions Unit 1) but no execute-side gate. New scope,
  deliberately NOT an amendment to the in-flight tactic-graph-router-selector PR
  2785; finalize after that PR merges."
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
# Worker-start re-validation gate: provision-node-worktree re-checks node state against fresh origin/main before a phase worker executes

Draft context from the 2026-07-06 /align-strategy concurrency interview
(strategy clarifications: two-gate staleness bracket; global worker cap).
Retained, not refined — a later /align-tactics round finalizes.

## Gate contents (author-decided)

`provision-node-worktree <node-id> <selected-phase>` re-validates against
fresh `origin/main` before any phase work:

- node file exists on origin/main (pruned → stale)
- persisted `phase` (either convention: first-class or `attributes.phase`
  until the backfill lands) equals `<selected-phase>` — the directive is
  never re-derived
- `office_hours` is null (an author park mid-tick must win)
- serving strategy's substance fingerprint equals the tactic's stamped
  `execution.strategy_fingerprint`, checked only where the stamp is
  non-null (`strategyFingerprint` in packages/intentionsutil/src/router.ts
  is the canonical hash)

Any mismatch → a distinct exit code (12 suggested; 10=ci-waiting and
11=merge-conflict are taken) → the worker reports disposition `skipped`
(add to dispatch-graph-tick.js RESULT_SCHEMA), its claim clears, the next
tick re-selects from current state.

## Plumbing

- `dispatch-graph-execute` already carries `phase` per selection spec —
  pass it into the runner prompt's provision command.
- `.claude/workflows/dispatch-graph-tick.js` `nodePrompt` adds the phase
  arg and the exit-12 route.
- Soft-freeze precision this delivers: a selected-but-unstarted worker
  counts as NOT started and yields to the freeze (strategy clarification,
  2026-07-06).

## Sequencing

Blocked in substance on tactic-graph-router-selector's PR #2785 merging
(provision-node-worktree and dispatch-graph-tick.js are its unit 3/4
deliverables — do not amend the in-flight PR). Tests land in
test-dispatch-scripts.sh beside the existing provision tests.
