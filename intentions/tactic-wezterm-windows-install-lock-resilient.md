---
id: tactic-wezterm-windows-install-lock-resilient
kind: tactic
statement: make installWeztermWindows resilient to a running Windows WezTerm —
  don't fail the whole nixos-rebuild switch on a locked wezterm-gui.exe
owner: ai
status: raw
parent: null
rationale: Greenfield fix surfaced in the 2026-07-08 debugging session.
  nix/home/wezterm-windows.nix rsyncs the Windows WezTerm nightly over the
  running (locked) wezterm-gui.exe, so rsync exits 23 (partial transfer); under
  the activation script's set -eu the rsync_error=$(...) command substitution
  fails and set -e aborts the whole activation before the error handler runs —
  home-manager-n8.service dies status 23 with no logged error and nixos-rebuild
  switch fails exit 4 every time WezTerm is open. This is a finding against
  tactic-mainqa-wsl-host-activation (whose completion clause says a broken check
  authors an implement tactic). Retained as a draft for a later /align-tactics
  pass to plan.
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
# make installWeztermWindows resilient to a running Windows WezTerm — don't fail the whole nixos-rebuild switch on a locked wezterm-gui.exe

## Context

Diagnosed 2026-07-08. `sudo nixos-rebuild switch --flake .#nixos` on the WSL
host reproducibly fails exit 4: `home-manager-n8.service` dies status 23 at
`Activating installWeztermWindows` (`nix/home/wezterm-windows.nix`) with no
ERROR line in the journal.

Two layers:

1. **The lock.** The step rsyncs a fresh Windows WezTerm nightly into
   `/mnt/c/Users/<user>/AppData/Local/WezTerm/`. `wezterm-gui.exe` is a
   running, memory-mapped Windows executable (the GUI the session runs
   through) → locked → `rsync` exits **23 = "partial transfer due to error"**
   (every other file updates; that one stays stale). Because the switch is
   run from inside WezTerm, the GUI is always running, so this fails every
   time.
2. **The silent swallow.** The activation script runs under `set -eu -o
   pipefail`. The line `rsync_error=$(rsync … 2>&1)` fails the command
   substitution, so `set -e` aborts the whole activation right there — before
   `rsync_exit=$?` and the entire `if [ $rsync_exit -ne 0 ]` error-reporting
   block. Hence no ERROR echo, and the exit code is rsync's own 23, which
   coincidentally equals `WW_ERR_INSTALL_FAILED=23` and makes it look like the
   script's own error path fired when it never ran. The existing
   `WW_ERR_FILE_LOCKED` branch only matches the literal string "permission
   denied", which 9p/drvfs does not emit for a busy executable, so it never
   catches this.

## Fix direction (greenfield)

- **Un-swallow the error** so the handler runs under `set -e`:
  `rsync_exit=0; rsync_error=$(rsync … 2>&1) || rsync_exit=$?`.
- **Treat a running-GUI lock as a non-fatal warning**, not a fatal exit:
  update everything else, print "WezTerm is running on Windows — restart it to
  pick up the new binary", and exit success. Detect it by the locked
  `wezterm-gui.exe` / rsync-23 case rather than the "permission denied" string
  that never matches here.
- Design tension for the planning pass to resolve: warn-and-continue keeps
  switches green but lets the Windows binary drift from the nixpkgs-managed
  mux server (the exact drift the installer exists to prevent) until the user
  restarts WezTerm. The author accepted that trade on 2026-07-08.

Finding against `tactic-mainqa-wsl-host-activation`. A separate co-failure on
the same switch — `mount-gdrive.service` (`mount -t drvfs` → "unknown
filesystem type 'drvfs'", because this WSL2 transport uses 9p) — is
independent and out of scope here.
