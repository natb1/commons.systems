---
id: tactic-practitioner-plugin-distribution
kind: tactic
statement: Package the graph-native workflow (align skills + intentionsutil +
  router) as a Claude Code plugin distributed via npm and the official
  marketplace
owner: ai
status: raw
parent: null
rationale: "Retained from gh #440 during the 2026-07-06 tier-gate interview.
  Publication channels are the invitation surface: this ships only after the
  tier-3 entry declaration on strategy-progressive-validation, and only after
  the align skill family and tactic-legacy-router-removal land so the bundle
  never ships surface scheduled for deletion."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-tier3-entry-declaration
  - tactic-legacy-router-removal
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Package the graph-native workflow (align skills + intentionsutil + router) as a Claude Code plugin distributed via npm and the official marketplace

## Retained concepts (from gh #440, migrated 2026-07-06)

- Bundle: the align skill family (`align`, `align-init`, `align-strategy`,
  `align-tactics`), `packages/intentionsutil`, the graph router/selector
  scripts, and the worktree hooks (`worktree-create.sh`, `worktree-remove.sh`)
  with a `settings.json` fragment registering them — the exact set is whatever
  the landed align-family tactics reference at packaging time.
- `/align-init` is the post-install entry point (orient → validate deployment
  → virtue review → `/align-strategy`).
- No legacy-router surface ships: no `dispatch:*` label scripts, no `/ready`
  (`tactic-legacy-router-removal` defines what counts as legacy).
- `.claude-plugin/marketplace.json` rebuilt around this plugin only (#658
  emptied it); `plugin.json` follows the current Claude Code plugin spec.
- README covers installation and running `/align-init` on a new repo, with
  prerequisites (GitHub CLI, git, direnv; Nix flake optional but recommended).
- Validation: installs on a clean repo via the plugin CLI and `/align-init`
  produces a real artifact there (virtue roots / first strategy interview).
- Channels: npm (e.g. `@commons-systems/align-workflow`; marketplace entry
  uses `"source": "npm"`) and the official marketplace. Channels are not the
  sensor — success is strategy-distribute-workflow's recorded signal
  (entry-point visits, forks, derivative reports at office-hours), never
  download counts.

Sequencing: after the align skill family and `tactic-legacy-router-removal`
land, and only after the tier-3 declaration on strategy-progressive-validation
with tactic-practitioner-support-boundary written first. Full original text:
gh #440.
