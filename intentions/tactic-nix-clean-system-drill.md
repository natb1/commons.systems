---
id: tactic-nix-clean-system-drill
kind: tactic
statement: Validate Nix devshell reproducibility on a clean system and detect
  flake/CI drift — the fresh-machine provisioning drill
owner: ai
status: raw
parent: null
rationale: "Retained from gh #515 during the 2026-07-06 tier-gate interview,
  deliberately ungated: this is tier-1 self-validation —
  delegation-os-hardware's non-delegable floor (provision the working
  environment from scratch on a fresh machine, last_exercised currently null) —
  not practitioner management. Only its secondary practitioner-clone framing
  waits on the tier-3 declaration on strategy-progressive-validation."
reading: null
gap: null
serves:
  - strategy-exercise-recovery-paths
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
# Validate Nix devshell reproducibility on a clean system and detect flake/CI drift — the fresh-machine provisioning drill

## Retained concepts (from gh #515, migrated 2026-07-06)

- A CI job or local validation script runs `nix develop` and verifies the
  devshell produces a working build environment; drift between `flake.nix`
  dependencies and CI workflow dependencies (actions/setup-node +
  `.node-version`) is detected.
- Context: `.envrc` assumes `use flake` (nix + direnv); the Go tools
  (budget-etl, scaffolding) sit outside the npm workspace with their own
  build dependencies.
- Sequencing: after the #2446 epic / instance-flake split
  (tactic-nix-instance-flake-extraction,
  tactic-nix-fullsystem-instance-split) — a drill today would exercise the
  wrong entry point, a repo hardcoding the author's identity behind
  `--impure` / `builtins.getEnv`. The meaningful drill is `nix develop` /
  `home-manager switch` from a fresh fork or the instance flake.
- On completion: record the exercised run against
  strategy-exercise-recovery-paths (flip its `last_exercised`).
- The practitioner-clone framing is secondary and waits on the tier-3
  declaration; the drill itself is tier-1 self-validation and ungated.

Full original text: gh #515.
