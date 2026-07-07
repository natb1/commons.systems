---
id: tactic-preview-deploy-on-demand
kind: tactic
statement: Dedicate a skill to on-demand PR preview deploys and remove the
  automatic preview-and-smoke job from pr-checks
owner: ai
status: raw
parent: null
rationale: "Author directive at the 2026-07-07 /align-strategy
  operational-mechanics round: preview channels stay available but only when
  explicitly requested (for example during office-hours-parked QA), so remove
  the preview-and-smoke job from .github/workflows/pr-checks.yml (and rehome its
  merge-time cleanup-preview coupling in prod-deploy.yml to the skill's
  lifecycle) and add a skill that runs the existing change-scoped
  run-all-preview-deploy-smoke.sh path on demand. CI verification must remain
  change-scoped for speed — the skill reuses get-changed-apps.sh scoping, it
  does not reintroduce deploy-everything. Retained as a draft for
  /align-tactics."
reading: null
gap: null
serves:
  - strategy-autonomous-execution
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
# Dedicate a skill to on-demand PR preview deploys and remove the automatic preview-and-smoke job from pr-checks
