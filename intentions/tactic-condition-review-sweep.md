---
id: tactic-condition-review-sweep
kind: tactic
statement: Add a standing conditions sweep to the align dialectic's consistency pass
owner: human
status: raw
parent: null
rationale: kind-strategy calls every attributes.conditions entry a standing
  review trigger, but nothing reviews them. Have /align-init's scheduled rung-5
  consistency-tester role (align-consistency) sweep all strategy conditions each
  cycle and record which were checked; sensor spend-shaped conditions through
  the owned budget pipeline where possible.
reading: null
gap: null
serves:
  - strategy-explicit-intent
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
# Add a standing conditions sweep to the align dialectic's consistency pass

## Home — /align-init's scheduled rung-5 consistency role

The retired standalone `/align` consolidated into `/align-init` (2026-07-09
clarification on strategy-graph-native-dispatch): its scheduled (align jit)
trigger runs the rung-5 dialectic engine unchanged, including the
`align-consistency` consistency-tester role (the veto layer over charter
compliance and dependency health, `.claude/skills/align-init/SKILL.md:246`).
That role is the home for this standing-conditions sweep — the earlier
`/align-audit` candidate did not become a separate skill. The sweep's
substance is unchanged; only its host moved.
