# Claude Code CLI
#
# Installs Claude Code from the community flake (sadjow/claude-code-nix)
# which provides hourly updates for the latest releases.
#
# The claude-code-nix wrapper already bundles bubblewrap and socat into the
# binary's PATH, so no explicit sandbox packages are needed here.
#
# On Linux, this module also installs the seccomp filter from
# @anthropic-ai/sandbox-runtime. Claude's auto-detection scans global npm
# install paths for vendor/seccomp/<arch>/{apply-seccomp,unix-block.bpf},
# so the activation script symlinks the nix store files into ~/.npm-global/.
#
# Note: Claude Code's settings.sandbox.seccomp paths are parsed but never
# passed to the detection function (rGA() omits the field). The symlink
# approach bypasses this by matching the auto-detection path directly.

{
  config,
  pkgs,
  lib,
  ...
}:

let
  # Architecture mapping: nix system -> npm tarball directory name.
  # Evaluates to null on unsupported platforms, which disables the seccomp
  # activation below.
  archDir =
    {
      "x86_64-linux" = "x64";
      "aarch64-linux" = "arm64";
    }
    .${pkgs.stdenv.hostPlatform.system} or null;

  # To update: bump version and sha256, then verify tarball paths are unchanged.
  # nix-prefetch-url https://registry.npmjs.org/@anthropic-ai/sandbox-runtime/-/sandbox-runtime-<version>.tgz
  sandbox-seccomp = assert archDir != null; pkgs.stdenv.mkDerivation {
    pname = "claude-sandbox-seccomp";
    version = "0.0.39";

    src = pkgs.fetchurl {
      url = "https://registry.npmjs.org/@anthropic-ai/sandbox-runtime/-/sandbox-runtime-0.0.39.tgz";
      sha256 = "1vaq7sbqwjcggzcn0318ik72h3afxav5jbf9v4lhwrqfbhjc8fsc";
    };

    sourceRoot = ".";

    installPhase = ''
      mkdir -p $out/lib/claude-seccomp
      install -m 755 package/vendor/seccomp/${archDir}/apply-seccomp $out/lib/claude-seccomp/
      install -m 644 package/vendor/seccomp/${archDir}/unix-block.bpf $out/lib/claude-seccomp/
    '';
  };

in
{
  home.packages = [
    pkgs.claude-code
  ];

  # Home-manager owns the durable dispatch background supervisor daemon (#1197,
  # #2736). ExecStart pins the CONCRETE ${pkgs.claude-code} store path (not the
  # profile symlink), so the unit's rendered bytes change on every claude-code
  # version bump — home-manager's sd-switch (startServices defaults to true) then
  # restarts the daemon onto the new binary at activation. A long-running process
  # never re-resolves the profile symlink, so without this the daemon (and every
  # bg session it forks) would keep executing the old binary until someone ran
  # `systemctl --user restart dispatch-claude-daemon.service` by hand.
  #
  # Fleet-reap consequence (accepted): the unit sets no KillMode, so it defaults
  # to control-group, and the whole background fleet lives in the daemon's cgroup
  # (#1197). An sd-switch restart SIGKILLs that cgroup, killing every in-flight
  # dispatch worker at activation time. This is acceptable for a deliberate
  # upgrade; gating the restart on an idle fleet is a possible future enhancement,
  # out of scope here.
  systemd.user.services.dispatch-claude-daemon = lib.mkIf pkgs.stdenv.isLinux {
    Unit = {
      Description = "Dispatch durable Claude background supervisor daemon";
      After = [ "network-online.target" ];
      StartLimitIntervalSec = 60;
      StartLimitBurst = 10;
    };
    Service = {
      Type = "simple";
      # Concrete store path — the whole point: the unit's bytes change on every
      # claude-code version bump, so home-manager's sd-switch restarts the daemon
      # onto the new binary at activation. The profile SYMLINK would not (a running
      # process never re-resolves it).
      ExecStart = "${pkgs.claude-code}/bin/claude daemon run";
      # The systemd USER manager's own PATH is minimal (systemd's bin only) — it
      # does NOT contain git/jq/gh/claude. The daemon forks bg workers that run
      # those, and they inherit the SERVICE env, so PATH must be set here. Build it
      # ONLY from STABLE directory references (profile dirs + system paths), never
      # per-generation store paths — otherwise unrelated activations would change
      # the unit bytes and trigger a gratuitous fleet-reaping restart (AC4). The
      # per-generation-varying token stays confined to ExecStart above.
      Environment = [
        "PATH=${config.home.profileDirectory}/bin:/etc/profiles/per-user/${config.home.username}/bin:/run/current-system/sw/bin:/run/wrappers/bin"
      ];
      Restart = "always";
      RestartSec = 1;
    };
    Install.WantedBy = [ "default.target" ];
  };

  # Symlink seccomp filter files into a global npm install path where Claude's
  # auto-detection will find them. Claude scans paths like ~/.npm-global/lib/
  # node_modules/@anthropic-ai/sandbox-runtime/vendor/seccomp/<arch>/.
  home.activation.configureClaudeSeccomp = lib.mkIf (pkgs.stdenv.isLinux && archDir != null) (
    lib.hm.dag.entryAfter [ "writeBoundary" ] ''
      set -eu

      VENDOR_DIR="${config.home.homeDirectory}/.npm-global/lib/node_modules/@anthropic-ai/sandbox-runtime/vendor/seccomp/${archDir}"

      $DRY_RUN_CMD ${pkgs.coreutils}/bin/mkdir -p "$VENDOR_DIR"

      $DRY_RUN_CMD ${pkgs.coreutils}/bin/ln -sf \
        "${sandbox-seccomp}/lib/claude-seccomp/apply-seccomp" \
        "$VENDOR_DIR/apply-seccomp"

      $DRY_RUN_CMD ${pkgs.coreutils}/bin/ln -sf \
        "${sandbox-seccomp}/lib/claude-seccomp/unix-block.bpf" \
        "$VENDOR_DIR/unix-block.bpf"
    ''
  );
}
