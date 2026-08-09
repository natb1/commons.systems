---
id: tactic-duplicate-session-mechanical-resolution
kind: tactic
statement: Add the duplicate-session invalid-state kind with a mechanical tier
  that stops the newer session and lets the older complete — unless the older is
  itself frozen or terminal — declares the stopped session under a new
  duplicate-stopped disposition so it reaps instead of freezing the node afresh,
  and captures rather than discards its uncommitted work in the shared worktree
owner: ai
status: raw
parent: null
rationale: "The RESOLUTION half of the 2026-08-05 /align concurrent-session
  interview (detection is tactic-fleet-watch-duplicate-session-predicate; the
  per-kind skill split it depends on is tactic-invalid-state-skill-per-kind).
  Author-ruled, node-scoped, no fleet latch: a node with a live session is
  already frozen because worktree_has_live_session is name-keyed on the node id,
  so no new pause mechanism is introduced and one duplicate never halts the
  fleet. FOUR CONSTRAINTS the round settled, each with a reason that must
  survive into the plan. (1) SURVIVOR RULE: stop the newer, let the older
  complete — but age is not liveness, so if the older session is itself already
  detectable as frozen or terminal (both are existing kinds with their own
  probes) the newer healthy worker is kept instead; and consistent with the
  2026-08-04 ratification that every mechanical-tier gate fails toward keep, any
  uncertainty about which to stop means stopping nothing and escalating. (2) THE
  STOP MUST DECLARE: under condition 14 an undeclared terminal exit is KEPT —
  the Stop hook holds the job and worktree_has_live_session freezes the node —
  so a bare stop merely converts a duplicate-session state into a
  terminal-session state and routes back into the lane, a loop. The stop writes
  a node-terminal marker naming the node under a NEW disposition member,
  duplicate-stopped; condition 14 sanctions this additively
  ('dispatch-self-close reads only ^node=, so adding a member never re-stales
  this condition'). The existing no-claim member was considered and rejected as
  false — the loser DID hold a claim and may have done work. (3) RESIDUE: the
  loser's uncommitted diff is captured as evidence on the tracked follow-up and
  the tree is NEVER auto-cleaned, because the surviving session is live in that
  same tree and any restore/checkout/clean would race its writes; for the same
  reason the existing worktree-residue kind must not fire on a tree occupied by
  a live session (the hazard already recorded raw as
  tactic-provision-residue-live-session-check, which this gives a second
  caller). (4) ROOT CAUSE IS TRACKED, not just resolved — the lane's existing
  find-or-create dedup applies. HAZARD to verify at plan time, from operating
  experience rather than from the code: `claude rm` has been observed exiting 0
  while DECLINING to reap when a session has unpushed work, which would silently
  leave the stopped session registered and the node frozen indefinitely — the
  reap must be verified against the registry rather than trusted from the exit
  code, and the worktree-remove-before-rm ordering may apply."
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
# Add the duplicate-session invalid-state kind with a mechanical tier that stops the newer session and lets the older complete — unless the older is itself frozen or terminal — declares the stopped session under a new duplicate-stopped disposition so it reaps instead of freezing the node afresh, and captures rather than discards its uncommitted work in the shared worktree
