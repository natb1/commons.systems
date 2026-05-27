# Dispatch Timer
#
# Declares a systemd.user oneshot service + timer that fires the
# `dispatch-spawn` script once a day at 9 AM (system local time) from the
# main worktree. `dispatch-spawn` is the shared primitive (#756) that prunes
# stale agents, dedup-guards, and spawns
# `claude --bg --name dispatch-<id> "/dispatch"` in the "auto mode" permission
# posture. This timer acts as the daily heartbeat that re-seeds the baton-pass
# chain after a cold start, crash, or missed tick.
#
# How the background session survives the oneshot unit deactivating:
#   `dispatch-spawn` invokes `claude --bg`, which starts a detached background
#   session owned by Claude Code's per-user background supervisor daemon. The
#   oneshot service exits as soon as the spawn completes. `KillMode = "process"`
#   scopes systemd's unit teardown to the ExecStart process only (which has
#   already exited), so the detached background session is not killed when the
#   oneshot unit deactivates — the supervisor daemon owns the session lifetime,
#   not the timer service.
#
# WSL prerequisites:
#   1. Enable systemd in the WSL distro by adding to /etc/wsl.conf:
#        [boot]
#        systemd=true
#   2. Run `loginctl enable-linger $USER` once so the user's systemd instance
#      (and therefore this timer) runs while the user is logged out.
#
# VM-lifecycle limitation:
#   WSL2 stops the distro VM shortly after its last process exits. The timer
#   fires only while WSL is running and does not wake a stopped VM.
#   `Persistent = true` covers catch-up: a tick missed while WSL was down runs
#   on the next start.

{ config, pkgs, lib, ... }:

let
  # /dispatch must run from the main worktree. Adjust this path if the
  # checkout moves.
  mainWorktree = "${config.home.homeDirectory}/natb1/commons.systems/worktrees/main";

  # A systemd user service does not inherit the login shell's PATH and the
  # devShell/direnv environment is unavailable, so PATH is set explicitly.
  # The issue names claude/gh/node/jq; git and coreutils are added because
  # /dispatch's git operations and shell scripts need them; nodejs_22 matches
  # .node-version.
  servicePath = lib.makeBinPath [
    pkgs.claude-code
    pkgs.gh
    pkgs.git
    pkgs.nodejs_22
    pkgs.jq
    pkgs.coreutils
  ];

in
{
  systemd.user.services.dispatch = {
    Unit.Description = "Run dispatch-spawn (daily at 9 AM) to seed the dispatch baton-pass chain";
    Service = {
      Type = "oneshot";
      WorkingDirectory = mainWorktree;
      Environment = [ "PATH=${servicePath}" ];
      ExecStart = "${mainWorktree}/.claude/skills/dispatch/scripts/dispatch-spawn";
      KillMode = "process"; # scopes teardown to the already-exited ExecStart process so the detached --bg session survives the oneshot unit deactivating
    };
  };

  systemd.user.timers.dispatch = {
    Unit.Description = "Fire the dispatch service daily at 9 AM local time";
    Timer = {
      OnCalendar = "*-*-* 09:00:00"; # daily at 09:00 system local time
      Persistent = true;             # a tick missed while WSL was down runs on next start
    };
    Install.WantedBy = [ "timers.target" ];
  };
}
