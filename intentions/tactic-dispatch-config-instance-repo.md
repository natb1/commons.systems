---
id: tactic-dispatch-config-instance-repo
kind: tactic
statement: Migrate private operator config (dispatch.config/) into the
  version-controlled instance-config repo per the nix instance conventions
owner: human
status: delegated
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview: all private
  operator config is expected to be version-controlled in the dedicated
  instance-config repo (natb1/office-hours-nate, following the nix conventions;
  examples/office-hours-nate is the template), but dispatch.config/ is
  git-untracked in the monorepo, so fleet-behavior changes (pace-curve pins,
  auto-merge gating) leave no reviewable history. Finalized 2026-07-11
  /align-tactics round: the retained design questions are decided (strategy
  clarification, 2026-07-11 — human-edited config migrates tracked;
  machine-written artifacts stay gitignored in place; lookup via host symlink).
  The monorepo-side convention lands at tactic-dispatch-config-template; this
  tactic is the remaining human half — creating the private repo's
  dispatch.config/, committing live values, and placing the host symlink —
  private-repo and host-local operator actions, not claude-executable."
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
blocked_by:
  - tactic-dispatch-config-template
office_hours:
  reason: "Human migration sitting: populate natb1/office-hours-nate's
    dispatch.config/ with the live operator config and symlink the monorepo's
    dispatch.config to it. Needs the private instance repo and host-local
    filesystem changes — not claude-executable. 15-30 minutes."
  since: 2026-07-11
  recommendation: "Wait for tactic-dispatch-config-template to merge. Then at one
    sitting: (1) in natb1/office-hours-nate, create dispatch.config/ following
    the examples/office-hours-nate template — copy the live target-workers.json,
    auto-merge.json, epic.json from the host, add the template's .gitignore
    (phase-model-policy.json, *.bak.*, *.prepause*), commit and push; (2) on the
    WSL host, move the untracked <project-root>/dispatch.config aside, symlink
    <project-root>/dispatch.config -> <instance-checkout>/dispatch.config, and
    copy phase-model-policy.json into the new directory (it stays gitignored);
    (3) verify .claude/skills/dispatch-propagate/scripts/dispatch-config-load
    target-workers prints the normalized config; (4) set this tactic phase: done
    — one graph-commit."
pace_exempt: false
rounds: null
attributes: {}
---
# Migrate private operator config (dispatch.config/) into the version-controlled instance-config repo per the nix instance conventions

Born-parked: the migration's remaining half is private-repo and host-local
operator work — committing live config values into natb1/office-hours-nate
(invisible to this public repo and to autonomous sessions) and replacing the
host's untracked `dispatch.config/` with a symlink into the instance
checkout. One sitting (15-30 minutes) after `tactic-dispatch-config-template`
merges; that tactic's template README carries the written procedure, and the
`office_hours.recommendation` here mirrors it with the completion stamp
(this tactic `phase: done`).
