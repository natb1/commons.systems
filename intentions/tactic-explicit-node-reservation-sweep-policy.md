---
id: tactic-explicit-node-reservation-sweep-policy
kind: tactic
statement: decide reservation-sweep policy for explicit-node dispatch, or
  document intentional non-reclaim
owner: ai
status: raw
parent: null
rationale: null
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
# decide reservation-sweep policy for explicit-node dispatch, or document intentional non-reclaim

Surfaced by /review-fix on PR #2921 (tactic-graph-explicit-node-dispatch),
code-review finder, residue-disposed `deferred`.

**Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick:746`

**Finding:** The explicit-node branch in `dispatch-select-tick` skips the
autonomous block that runs `reservation_sweep` before selection;
`graph-select-target --node` checks `reservation_exists` but never sweeps. So
a stale ledger marker left by a dead session for the targeted node makes
`graph-select-target --node` emit `reserved` and the tick report
`node-not-selectable`, whereas the autonomous `--top` path would have
reclaimed the stale reservation via the sweep first. A human's explicit
dispatch of a node can therefore be refused by a stale claim.

**Failure scenario:** A dead session leaves a stale reservation-ledger entry
for node X. A human or the router later runs `dispatch X` to dispatch it
explicitly; `graph-select-target --node X` reports `reserved` (the sweep
never ran), and the tick reports `node-not-selectable` even though the prior
claimant is dead and the node should be immediately reclaimable.

**Adversarial verdict:** Not independently adversarially verified — this is a
code-review residue finding (already confirmed by code-review's own internal
review pass), disposed `deferred` (out of scope for PR #2921) rather than
routed through the shared verify pipeline. Current behavior fails closed with
a clear signal (a specific `reserved` stderr message plus
`node-not-selectable`), not silent wrong behavior — this mirrors the existing
`--manual` branch, which also skips the sweep, so the current behavior may be
intentional.

**Recommended scope:** Decide between (1) running `reservation_sweep` in the
explicit-node branch before consulting `graph-select-target --node` (sourcing
`lib-reservation-ledger.sh` / `lib-claude-agents.sh` as the autonomous block
does), noting this would diverge from `--manual`'s current behavior — confirm
that divergence is wanted — or (2) documenting explicitly, in
`dispatch-select-tick`'s explicit-node branch comment, that explicit-node
dispatch intentionally does not reclaim stale reservations, the same as
`--manual`, so the clear `reserved` error is the expected escape hatch.
Scope: `dispatch-select-tick`; low priority; no user-facing production
surface.
