---
id: tactic-provision-worktree-script-tests
kind: tactic
statement: Add script-level test coverage for provision-node-worktree's
  worker-start gate integration (selected-phase arg, exit 12/13 pass-through,
  scope-fingerprint stamp write) in test-provision-node-worktree.sh
owner: ai
status: raw
parent: null
rationale: "Surfaced during Unit 2 of tactic-worker-start-revalidation
  (2026-07-07): the plan called for extending 'the provision section of
  test-dispatch-scripts.sh', but no provision-node-worktree test harness exists
  there (plan anchor drift). The gate LOGIC is well covered (15 unit tests on
  check-node-selection.ts), but the bash plumbing Unit 2 added — the new second
  arg, the exit-12/13 pass-through, and the '<fingerprint> <sha>' stamp write —
  has no script-level test. Recommendation: a small harness (mock the
  check-node-selection call and the git rev-parse, assert arg forwarding + exit
  mapping + stamp file contents), most economically added as a UNIT of
  tactic-graph-router-transitions rather than a standalone tactic, since that
  tactic already builds the transition-time stamp refresh this harness would
  share fixtures with. Retained as a draft for /align-tactics to place."
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
# provision-node-worktree gate: script-level test coverage

## Context

`tactic-worker-start-revalidation` Unit 2 added branching to
`provision-node-worktree`: a new `<selected-phase>` positional arg, a
`check-node-selection.ts` call in the prelude, exit-12 (stale-selection) /
exit-13 (scope-stale) pass-through, and a `<scope-fingerprint>
<origin-main-sha>` stamp write on pass. Its plan called for extending the
"provision section" of
`.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`, but that
file has no `provision-node-worktree` tests to extend — the anchor had drifted.

The gate LOGIC is covered by 15 unit tests on `check-node-selection.ts`. The
uncovered surface is the bash plumbing: argument forwarding, exit-code mapping,
and the stamp-file write.

## Recommended scope

A focused harness (mirroring the mock-`gh`/fixture pattern already in
`test-dispatch-scripts.sh`):

- **arg forwarding** — `provision-node-worktree <id> <phase>` invokes
  `check-node-selection.ts` with both args; a one-arg call exits 2 (usage).
- **exit pass-through** — a mocked gate exiting 12 / 13 makes
  `provision-node-worktree` exit 12 / 13 with the gate's stderr line forwarded.
- **stamp write** — on gate exit 0, `<node-id>.scope-fingerprint` receives
  exactly `<gate-stdout-fingerprint> <origin/main-sha>`.
- **10 / 11 unchanged** — ci-waiting and merge-conflict behavior is untouched.

## Placement

Best folded in as a UNIT of `tactic-graph-router-transitions` (the next
bootstrap tactic): it adds the transition-time stamp refresh this harness's
fixtures overlap with, so a shared harness avoids duplicated provisioning
scaffolding. A standalone tiny tactic is acceptable under sole-tracker doctrine
if that tactic lands first. `/align-tactics` decides.
