---
id: tactic-invalid-state-skill-per-kind
kind: tactic
statement: dispatch-invalid-state-route resolves its intervention skill
  directory from --kind instead of hardcoding one skill, and each invalid-state
  kind carries its own skill body — the shared three-tier ladder stays written
  down exactly once
owner: ai
status: raw
parent: null
rationale: "Author ruling in the 2026-08-05 /align concurrent-session interview,
  amending the intervention-skill limb of the 2026-08-04 invalid-state-lane
  clarification. Measured state at the time of the ruling: SKILL_DIR is
  hardcoded to $PROJECT_ROOT/.claude/skills/dispatch-invalid-state
  (dispatch-invalid-state-route:503, with a DISPATCH_INVALID_STATE_SKILL_DIR
  test override) and the spawn prompt is PROMPT=\"/dispatch-invalid-state
  $NODE_ID\" (:587) — so the kind is never passed to the skill at all, and one
  skill body nominally serves all five kinds (terminal-session, frozen-session,
  provision-conflict, worktree-residue, fix-attempt-cap; kind_class at
  :136-144). That body is written wholly for terminal-session: its method is
  reading a DEAD session's transcript, and its frontmatter states it is 'never
  invoked on a live claim'. Adding duplicate-session under the same skill would
  force one body to branch across contradictory preconditions, which is what the
  ruling forbids. SCOPE: the router KEEPS --kind — it needs it for the
  mechanical tier and the escalation class — and the ONE common ladder
  (mechanical tier, intervention session, escalation), the fleet latch, the
  per-node attempt cap and the exit-code contract (0 handled, 4 keep, 10
  escalate, 1 router failure treated as escalate, 2 usage) all stay shared; the
  script header explicitly justifies that centralization ('the class
  discrimination is written down exactly once instead of being re-derived per
  call site'), so splitting the router too was considered and rejected in the
  same round. Only the skill directory becomes kind-derived, and today's skill
  becomes the terminal-session skill. Sequencing note for planning: the lane was
  armed fleet-wide only on 2026-08-05, so a rename of the live skill directory
  is a hot change — the router falls back to 'intervention skill absent ... tier
  inert; escalating to the caller' (:504-505) if the path does not resolve,
  which fails safe but disarms the tier until the rename lands."
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
# dispatch-invalid-state-route resolves its intervention skill directory from --kind instead of hardcoding one skill, and each invalid-state kind carries its own skill body — the shared three-tier ladder stays written down exactly once
