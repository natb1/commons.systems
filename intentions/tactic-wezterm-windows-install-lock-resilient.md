---
id: tactic-wezterm-windows-install-lock-resilient
kind: tactic
statement: make installWeztermWindows resilient to a running Windows WezTerm —
  don't fail the whole nixos-rebuild switch on a locked wezterm-gui.exe
owner: ai
status: codified
parent: null
rationale: "Greenfield fix surfaced in the 2026-07-08 debugging session; a
  finding against tactic-mainqa-wsl-host-activation (whose completion clause
  says a broken check authors an implement tactic). Layer 2 of the original
  diagnosis — the set -e swallow of the rsync failure — already landed on main
  via PR 2794 (the rsync_exit capture at nix/home/wezterm-windows.nix:123-125).
  The residual is layer 1: a running Windows wezterm-gui.exe still fails the
  whole nixos-rebuild switch, because rsync exit 23 falls through to the fatal
  WW_ERR_INSTALL_FAILED branch — 9p/drvfs never emits the 'permission denied'
  string the WW_ERR_FILE_LOCKED branch greps. The author accepted
  warn-and-continue (binary drift until WezTerm restarts) on 2026-07-08. Bundled
  with the mechanical wezterm-pin.nix nightly-hash refresh that currently breaks
  nixos-build on origin/main and on every nix-touching PR (same subsystem, one
  PR); the refresh also unparks tactic-nix-instance-flake-extraction's PR 2848,
  parked solely on that drift. Finalized 2026-07-11 /align-tactics round."
reading: null
gap: null
serves:
  - strategy-owned-orchestration
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-wezterm-windows-install-lock-resilient
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint:
    strategy-owned-orchestration:
      hash: 5676f66f6e8500eb8752095c960615ded3fc06d00df9ab5c3038af3f9b700aec
      sha: bc642990d1344d4418bafdc924ef77e3903b0b61
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# make installWeztermWindows resilient to a running Windows WezTerm — don't fail the whole nixos-rebuild switch on a locked wezterm-gui.exe

## Context

`sudo nixos-rebuild switch --flake .#nixos` on the WSL host fails exit 4
whenever WezTerm is open on Windows: `home-manager-n8.service` dies status 23
at `Activating installWeztermWindows` (`nix/home/wezterm-windows.nix`).
Diagnosed 2026-07-08, two layers:

1. **The swallow — already fixed.** The `set -e` abort of the
   `rsync_error=$(...)` command substitution landed on main via PR 2794: the
   handler now captures the exit code without tripping `set -e`
   (`nix/home/wezterm-windows.nix:123-125`).
2. **The lock — this tactic.** The step rsyncs the pinned Windows nightly
   into `/mnt/c/Users/<user>/AppData/Local/WezTerm/`. `wezterm-gui.exe` is a
   running, memory-mapped Windows executable (the GUI the session runs
   through) → locked → rsync exits **23** (partial transfer; every other
   file updates, that one stays stale). The `WW_ERR_FILE_LOCKED` branch
   (`nix/home/wezterm-windows.nix:127-132`) greps the literal "permission
   denied", which 9p/drvfs does **not** emit for a busy executable, so exit
   23 falls through to the fatal `WW_ERR_INSTALL_FAILED` branch
   (`:133-137`) and the whole switch fails. The switch is normally run from
   inside WezTerm, so this fails every time.

**Design decision (author-accepted 2026-07-08):** treat the running-GUI lock
as a non-fatal warning — update everything else, tell the user to restart
WezTerm, let the activation succeed. Accepted trade: the Windows binary
drifts from the nixpkgs-managed mux server until the user restarts WezTerm
(the exact drift the installer exists to prevent) — warn loudly about it.

**Bundled: the Windows nightly pin refresh.** Upstream republishes the ONE
nightly zip in place, so `nix/home/wezterm-pin.nix`'s `windowsZipHash` goes
stale between merges. As of 2026-07-11 it is stale
(`sha256-Beo9PtQ5UmqdmBbagYfVoS0hglseF/1F/uUMHtGxr1c=` on main vs upstream
`sha256-twQWc8bNnvKVPRj0Fi2gqv5HfK1WvLD0ZtN2DsZpl8I=`), and `nixos-build` is
red on origin/main and on every nix-touching PR — including this tactic's, so
the refresh must ride in front. It also unparks
`tactic-nix-instance-flake-extraction`'s PR 2848, parked solely on this
drift.

## Unit 1 — refresh the WezTerm Windows nightly pin

Recommended model: sonnet

Scope:

- Run `nix/home/sync-wezterm.sh` (requires network to github.com and nix; it
  derives the pin from the published zip's internal
  `WezTerm-windows-<version>` directory name and rewrites
  `nix/home/wezterm-pin.nix`). Commit only the regenerated
  `nix/home/wezterm-pin.nix`.
- If origin/main's `windowsZipHash` already differs from the stale value
  above (someone refreshed first), still run the script — it is idempotent —
  and skip the commit if nothing changes.
- Out of scope: any other nix change; `wezterm-windows.nix` (Unit 2).

## Unit 2 — non-fatal locked-GUI handling

Recommended model: sonnet

Dependencies: none on Unit 1 logically, but Unit 1 lands first in the same PR
so CI `nixos-build` can go green.

Scope:

- `nix/home/wezterm-windows.nix`, the rsync error handler (`:126-138`). Add
  a branch **before** the existing two: when `rsync_exit` is 23 AND
  `$rsync_error` names `wezterm-gui.exe` (the running, memory-mapped
  binary), do not exit — set a `wezterm_locked=1` flag, print a WARNING to
  stderr: WezTerm is running on Windows; restart it to pick up
  `${pin.version}`; until then the GUI may not match the WSL mux server —
  and let the activation continue (the Start Menu shortcut step below still
  runs).
- Guard the unconditional success echo (`Installed Windows WezTerm ...`,
  `:144`) so the locked case prints the warning summary instead of claiming
  a clean install.
- Keep every other failure exactly as fatal as today: a 23 whose error
  output does NOT name `wezterm-gui.exe` stays `WW_ERR_INSTALL_FAILED`
  (partial transfers of other files are real failures), and the
  `WW_ERR_FILE_LOCKED` "permission denied" branch stays for genuine
  permission errors.
- Comment the new branch with the accepted-drift trade and the 9p/drvfs
  no-"permission denied" fact, so the branch is not "simplified" away later.

## Reuse

- `nix/home/sync-wezterm.sh` — the pin refresh IS one script run.
- The existing exit-capture pattern `rsync_exit=0; ... || rsync_exit=$?`
  (`nix/home/wezterm-windows.nix:123-125`) — extend its handler, do not
  restructure the activation step.

## Verification

CI `nixos-build` (and `darwin-build`) green on the PR is the authoritative
check — local grep-style verification of nix activation scripts false-fails;
the nix build is the arbiter. A red `nixos-build` on the pre-Unit-1 head is
the known main breakage (stale pin), not this PR's regression.

Manual (author-side, on the WSL host — folds naturally into the
`tactic-mainqa-wsl-host-activation` sitting): with WezTerm open,
`sudo nixos-rebuild switch --flake .#nixos` completes exit 0 and prints the
restart-WezTerm warning; after restarting WezTerm, the GUI connects to the
mux server without the version-mismatch window close.

## Implementation notes

Two units, one PR. Implement each unit in a subagent launched with
`model: sonnet`; supply this Context and the unit's Scope in the subagent
prompt; constrain subagents to working-tree edits only.
