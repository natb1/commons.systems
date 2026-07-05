---
id: tactic-mainqa-dispatch-daemon-restart
kind: tactic
statement: Verify dispatch-claude-daemon auto-restart semantics live — restarts
  onto the new store path on a claude-code flake bump, no gratuitous restart on
  unrelated activations
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issues 2757, 2756. Fixes the recurring
  stale-daemon-version failure mode; the daemon substrate carries the
  graph-native fleet too, so this outlives the legacy router. Observable only on
  the next real claude-code flake bump + activation on the WSL host."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours:
  reason: observable only on the next real claude-code flake bump and home-manager
    activation on the live host
  since: 2026-07-05
pace_exempt: false
rounds: null
attributes: {}
---
# Verify dispatch-claude-daemon auto-restart semantics live — restarts onto the new store path on a claude-code flake bump, no gratuitous restart on unrelated activations

## Context

Migrated 2026-07-05 from the legacy gh main-qa office-hours queue during the
target-state review. Source issues (closed, content preserved here): 2757,
2756 — needs-main residue from the daemon nix-module work (issue 2736, PR
2755). This is the fix for the recurring stale-daemon failure mode
(background sessions running the old claude-code binary until a manual
`systemctl --user restart dispatch-claude-daemon.service`). The daemon
substrate carries graph-native workers too, so the check outlives the legacy
router. Passive: observe on the next real claude-code flake bump.

## Verification checklist

1. **Restart onto the new store path** (was 2757): after a nix flake update
   bumping claude-code plus activation, sd-switch restarts
   `dispatch-claude-daemon.service` onto the new store path; a freshly forked
   background session reports the new version; no manual restart needed.
2. **No gratuitous restart** (was 2756): a home-manager activation that does
   not change the claude-code store path leaves the daemon running (unit
   bytes unchanged → no sd-switch restart → no fleet reap). The stable-anchor
   PATH design gives this statically; confirm the runtime behavior across two
   real activations.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.
