---
id: tactic-mainqa-wsl-host-activation
kind: tactic
statement: Verify the WSL host home-manager integration on-box — atomic
  activation, retired standalone profile, backup extension, linger/mux
  persistence, wezterm connect and Windows profile resolution
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issues 2647, 2648, 2649, 2650, 2651, 2579, 2578. The
  owned WSL orchestration host's nix configuration is target-state; these checks
  need a real nixos-rebuild switch on the actual hardware. One on-box sweep
  covers all of them."
reading: null
gap: null
serves:
  - strategy-owned-orchestration
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution: null
validates: []
blocked_by: []
office_hours:
  reason: needs on-box nixos-rebuild switch on the actual WSL hardware plus
    Windows interop — not automatable
  since: 2026-07-05
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Verify the WSL host home-manager integration on-box — atomic activation, retired standalone profile, backup extension, linger/mux persistence, wezterm connect and Windows profile resolution

## Context

Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase. Source issues (closed, content
preserved here): 2647, 2648, 2649, 2650, 2651, 2579, 2578 — needs-main
residue from the WSL home-manager integration (issue 2636, PR 2638) and the
wezterm Windows-profile work (issue 62, PR 2458). CI proves the config
evaluates and builds; these checks need the actual WSL hardware and Windows
interop. One on-box sweep around a single `sudo nixos-rebuild switch`.

## Verification checklist

1. **Atomic activation** (was 2647): one `sudo nixos-rebuild switch` activates
   system and home-manager profile together; no standalone
   `home-manager switch` entry point remains.
2. **Standalone profile retired** (was 2648): the standalone home-manager
   profile no longer activates; no dotfile is double-managed; the integrated
   module is the sole source of truth.
3. **backupFileExtension** (was 2649): a pre-existing unmanaged file at a
   home-manager-managed path is preserved as `<file>.backup` and activation
   completes instead of aborting on the collision.
4. **Linger keeps the mux server alive** (was 2650): with
   `users.users.n8.linger = true`, after logout/login
   `systemctl --user status wezterm-mux-server` is active with no manual
   restart; `loginctl show-user n8` shows `Linger=yes`.
5. **wezterm connect after binary upgrade** (was 2651):
   `wezterm connect nixos` succeeds against the lingering mux server after
   the switch upgrades the binary.
6. **Windows profile resolution on a multi-profile host** (was 2579, PR
   2458): the activation copies the wezterm config under the *active*
   Windows user profile via cmd.exe/wslpath interop; override tier takes
   precedence; fall-through works with no override.
7. **Nix fidelity anchor** (was 2578): the local nix eval of
   `wezterm-test.nix` confirms the assembled activation string contains the
   expected tokens (CI does not run this).

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.
