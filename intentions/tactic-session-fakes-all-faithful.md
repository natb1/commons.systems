---
id: tactic-session-fakes-all-faithful
kind: tactic
statement: Make the dispatch/hook session fakes --all-faithful so occupancy
  integration tests exercise the done-holder path
owner: ai
status: raw
parent: null
rationale: "Deferred out-of-scope finding from the /review-fix pass on PR #2998
  (tactic-stopped-session-blocks-node). worktree_has_live_session now reads the
  REGISTERED view (claude agents --json --all), so a stopped-but-not-removed
  session keeps holding its worktree. The predicate itself is covered
  non-vacuously in test-lib-claude-agents.sh (the --all-faithful
  office_hours_state_fake_claude fixture plus a discriminator case). Its
  integration consumers are not: two remaining fakes are argv-blind (return the
  same payload with or without --all) so their suites pass identically under
  either view and prove nothing about the done-holder path for the two
  highest-consequence consumers (worktree removal, sweep reaping)."
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
# Make the dispatch/hook session fakes --all-faithful so occupancy integration tests exercise the done-holder path

## Provenance

Deferred out-of-scope finding from the `/review-fix` pass on PR #2998
(tactic-stopped-session-blocks-node), source `code-review`.

`worktree_has_live_session` now reads the REGISTERED view (`claude agents
--json --all`), so a stopped-but-not-removed session keeps holding its
worktree. The predicate itself is covered non-vacuously in
`.claude/skills/dispatch-propagate/scripts/test-lib-claude-agents.sh` (the
`--all`-faithful `office_hours_state_fake_claude` fixture plus a discriminator
case).

Its integration consumers are not. Both remaining fakes are argv-blind — they
return the same payload with or without `--all`:

- `.claude/hooks/test-worktree-remove.sh:25-37` (the hook stub `claude`)
- `select_target_fake_claude` in
  `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh:1359-1381`,
  backing `test-dispatch-sweep.sh`, `test-graph-select-target.sh`, and
  `test-dispatch-resolve-worktree.sh`

So those suites pass identically under either view and prove nothing about the
done-holder path — the two highest-consequence consumers (worktree removal,
sweep reaping) have no regression net there.

**Adversarial verdict:** not independently adversarially verified — this is a
Lane-A (`code-review`) residue finding, dispositioned `Deferred` directly by
the residue phase rather than routed through the shared skeptic-verify stage.

## Work

1. Make `select_target_fake_claude` argv-aware (strip `state == "done"` rows
   unless `--all` appears in argv), mirroring `office_hours_state_fake_claude`'s
   "--all FAITHFULNESS" contract comment, and confirm the existing 288 tests
   stay green.
2. Add one dispatch-sweep node-worktree case with a `done` holder asserting
   KEEP/skip, plus a `working` control.
3. Make the hook stub in `.claude/hooks/test-worktree-remove.sh` `--all`-aware
   and add a done-holder case asserting the hook logs KEEP and does not call
   `git worktree remove`.

**Out of scope.** Any behavior change to the predicate itself.
