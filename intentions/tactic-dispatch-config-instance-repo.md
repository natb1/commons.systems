---
id: tactic-dispatch-config-instance-repo
kind: tactic
statement: Migrate private operator config (dispatch.config/) into the
  version-controlled instance-config repo per the nix instance conventions
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview: all private
  config is expected to be version-controlled in the dedicated instance-config
  repo (natb1/office-hours-nate, following the nix conventions;
  examples/office-hours-nate is the template), but dispatch.config/ is currently
  git-untracked in the monorepo, so fleet-behavior changes (pace-curve pins,
  auto-merge gating) leave no reviewable history. Design questions retained for
  /align-tactics: which files are human-edited config (migrate) vs
  machine-written outputs like phase-model-policy.json (decide their home), and
  how the monorepo scripts locate the instance repo's copies. Retained as a
  draft."
reading: null
gap: null
serves:
  - strategy-owned-orchestration
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
# Migrate private operator config (dispatch.config/) into the version-controlled instance-config repo per the nix instance conventions
