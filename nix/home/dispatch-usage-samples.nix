# Capacity sampler config (office-hours Capacity view; epic #1005, writer #1007,
# PII-safe config #1377).
#
# dispatch-tick runs the local capacity sampler (dispatch-sample-usage) once per
# tick. The sampler stays inert unless DISPATCH_USAGE_SAMPLES_ENABLED=1, so this
# is the per-machine opt-in: set on this author's machine, not in the shared
# flake devShell (which would enable sampling for anyone who enters the shell).
#
# WHY TWO MECHANISMS. The automated ticks — scheduled reseed timers and the
# worker Stop-hook — do NOT run dispatch-tick in an interactive shell. They run
# it as a `systemd-run --user` transient unit (see dispatch-spawn-tick), which
# inherits only the systemd *user manager's* environment plus an explicit
# --setenv=PATH. home.sessionVariables are sourced by interactive shells
# (hm-session-vars.sh) and are NOT in the user manager's environment, so they do
# not reach those ticks. ~/.config/environment.d/*.conf IS read by the user
# manager and propagated to every user unit it starts, including the transient
# tick — so that is the file the automated paths need. home.sessionVariables is
# kept as well for manual `dispatch-tick`/`dispatch-sample-usage` runs in a
# terminal.
#
# After `home-manager switch`, reload the user manager so it re-reads
# environment.d: `systemctl --user daemon-reexec` (or re-login). Fresh transient
# ticks then inherit the vars; the already-running durable daemon does not need
# them.
#
# Only the two no-default vars are set. The rest fall back to the writer's
# defaults: namespace office-hours/prod, TTL 60 days, project commons-systems.
# All are non-PII — the member-email list is resolved at runtime from the
# OFFICE_HOURS_MEMBER_EMAILS Secret Manager secret via ADC (#1377), never an env
# var and never checked in.

{
  # Reaches the systemd-run --user transient tick units (scheduled + Stop-hook).
  xdg.configFile."environment.d/dispatch-usage-samples.conf".text = ''
    DISPATCH_USAGE_SAMPLES_ENABLED=1
    DISPATCH_USAGE_SAMPLES_GROUP_ID=commons-systems
  '';

  # Reaches manual `dispatch-tick` / `dispatch-sample-usage` runs in a terminal.
  home.sessionVariables = {
    DISPATCH_USAGE_SAMPLES_ENABLED = "1";
    DISPATCH_USAGE_SAMPLES_GROUP_ID = "commons-systems";
  };
}
