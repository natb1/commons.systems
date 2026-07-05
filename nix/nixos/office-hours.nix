# office-hours snapshot producer — system-level systemd service + timer
#
# Schedules the office-hours local-snapshot producer (the
# `office-hours-snapshot/` workspace package, landed in #2658) on a recurring
# timer. Each tick runs `npx tsx office-hours-snapshot/src/main.ts --scope full`,
# which produces an encrypted `.benc` snapshot into the operator's Drive folder
# — a freshness floor for the hosted reader plus a chain-liveness heartbeat.
#
# Why a SYSTEM service (PID 1), not a `systemd --user` unit:
#
#   - It must survive the death of the dispatch chain. A `--user` unit is tied to
#     the operator's login session/bus; a system unit is owned by PID 1 and keeps
#     firing regardless of whether any interactive Claude session is alive.
#   - The `after = mount-gdrive.service` ordering only resolves against system
#     units. mount-gdrive (mounts.nix) is a system service, so the producer can
#     order itself after the Drive is mounted only from the system manager.
#
# Why it runs as `User = <operator>`, not root:
#
#   The producer reads the operator's per-user credentials and checkout that root
#   does not have: `gh` auth (~/.config/gh), Google ADC (~/.config/gcloud, for the
#   member-email Secret Manager fetch), the repo working tree, and its installed
#   `node_modules`. Running as the operator account is what makes those resolve.
#
# ---------------------------------------------------------------------------
# EnvironmentFile contract (the operator provides this out-of-git file)
# ---------------------------------------------------------------------------
#
# All personal/runtime values live in an out-of-store `EnvironmentFile` so this
# module stays forkable — it hardcodes NO personal values. That file must be mode
# 0600, owned by the operator, and live OUTSIDE git and OUTSIDE the Nix store
# (the store is world-readable; the file carries the BENC password). It is a
# plain `KEY=value` file. The producer's env-var contract is defined by
# `office-hours-snapshot/src/config.ts` (validated fail-fast there).
#
# Required keys:
#   OFFICE_HOURS_REPO_DIR         Absolute path to the repo checkout to run from
#                                 (this module cd's here; the producer resolves
#                                 office-hours-snapshot/ and node_modules relative
#                                 to it). Read by the ExecStart script, not config.ts.
#   OFFICE_HOURS_SNAPSHOT_DIR     Drive folder the encrypted snapshot is written to.
#   OFFICE_HOURS_GROUP_ID         Owning group id.
#   OFFICE_HOURS_QUEUE_REPOS      Comma-separated owner/name repos scanned for
#                                 queue metrics + parked office-hours work.
#   OFFICE_HOURS_GROUP_REPO       owner/name of the jit group repo (required for
#                                 --scope full).
#   OFFICE_HOURS_SNAPSHOT_PASSWORD  BENC encryption password for the snapshot.
#
# Member emails are NOT an env var: they are the member-email PII list, resolved
# at runtime from the `OFFICE_HOURS_MEMBER_EMAILS` Secret Manager secret via ADC
# (see resolveMemberEmailsFromSecret in run.ts). Only the secret NAME and GCP
# project id are configurable (OFFICE_HOURS_MEMBER_EMAILS_SECRET /
# OFFICE_HOURS_GCP_PROJECT_ID), both with sane defaults.
#
# Optional keys (dormant until set — each unset source is simply omitted from the
# snapshot; see config.ts):
#   PROJECT_SIGNALS_GITHUB_REPO
#   PROJECT_SIGNALS_GA4_PROPERTY_ID, PROJECT_SIGNALS_GA4_HOST_APPS
#   PROJECT_SIGNALS_GSC_SITE
#   PROJECT_SIGNALS_PSI_URLS, PROJECT_SIGNALS_PSI_STRATEGY
#   GOOGLE_ANALYTICS_CLIENT_ID, GOOGLE_ANALYTICS_CLIENT_SECRET,
#   GOOGLE_ANALYTICS_REFRESH_TOKEN   (GA4 + GSC OAuth triple; all-or-nothing)
#   PAGESPEED_API_KEY

{ config, lib, pkgs, ... }:

let
  cfg = config.services.officeHoursProducer;
in
{
  options.services.officeHoursProducer = {
    enable = lib.mkEnableOption "the office-hours snapshot producer timer";

    user = lib.mkOption {
      type = lib.types.str;
      description = ''
        The operator account the service runs as. Its per-user credentials are
        what the producer reads: `gh` auth, Google ADC, the repo checkout, and
        node_modules. No default — the operator must name their account.
      '';
    };

    environmentFile = lib.mkOption {
      type = lib.types.path;
      description = ''
        Absolute path to the out-of-store `KEY=value` env file holding the
        producer's config and the BENC password (see the contract at the top of
        this module). Must be mode 0600, owned by `user`, and outside git and the
        Nix store. No default — the operator supplies it.
      '';
    };

    onCalendar = lib.mkOption {
      type = lib.types.str;
      default = "hourly";
      description = ''
        systemd `OnCalendar` expression controlling how often the producer runs.
      '';
    };

    randomizedDelaySec = lib.mkOption {
      type = lib.types.str;
      default = "5min";
      description = ''
        systemd `RandomizedDelaySec` — jitter added to each fire so runs do not
        stampede exactly on the hour.
      '';
    };
  };

  config = lib.mkIf cfg.enable {
    # Only the TIMER carries `wantedBy = [ "timers.target" ]`. Persistent = true
    # catches up a fire missed while the machine was asleep/off (WSL shutdown,
    # reboot) by running once immediately on next boot.
    systemd.timers."office-hours-producer" = {
      wantedBy = [ "timers.target" ];
      timerConfig = {
        OnCalendar = cfg.onCalendar;
        Persistent = true;
        RandomizedDelaySec = cfg.randomizedDelaySec;
      };
    };

    # The service deliberately has NO `wantedBy` and NO `RemainAfterExit`: it is a
    # bare oneshot that must actually re-run on every timer tick. RemainAfterExit
    # would leave it `active (exited)` and systemd would never start it again; a
    # service-level `wantedBy` would race it at boot instead of leaving firing to
    # the timer.
    systemd.services."office-hours-producer" = {
      description = "office-hours snapshot producer (freshness floor + chain-liveness heartbeat)";
      # Order after the Drive mount (so OFFICE_HOURS_SNAPSHOT_DIR exists) and after
      # the network is up (the producer fetches gh + Google signals).
      after = [ "mount-gdrive.service" "network-online.target" ];
      wants = [ "network-online.target" ];
      # `npx tsx`, `gh`, and `git` on PATH; coreutils for the ExecStart script.
      path = [ pkgs.nodejs_22 pkgs.gh pkgs.git pkgs.coreutils ];
      serviceConfig = {
        Type = "oneshot";
        User = cfg.user;
        EnvironmentFile = cfg.environmentFile;
        ExecStart = pkgs.writeShellScript "office-hours-producer" ''
          set -euo pipefail
          # Deny loud: OFFICE_HOURS_REPO_DIR must be set and a real directory. No
          # fallback default — a missing/wrong repo dir is a misconfigured env file,
          # not something to paper over (see .claude/rules/code-style.md).
          if [ -z "''${OFFICE_HOURS_REPO_DIR:-}" ]; then
            echo "OFFICE_HOURS_REPO_DIR is not set in the EnvironmentFile" >&2
            exit 1
          fi
          if [ ! -d "$OFFICE_HOURS_REPO_DIR" ]; then
            echo "OFFICE_HOURS_REPO_DIR is not a directory: $OFFICE_HOURS_REPO_DIR" >&2
            exit 1
          fi
          cd "$OFFICE_HOURS_REPO_DIR"
          exec npx tsx office-hours-snapshot/src/main.ts --scope full
        '';
      };
    };
  };
}
