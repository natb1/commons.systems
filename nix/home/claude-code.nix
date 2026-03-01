# Claude Code CLI
#
# Installs Claude Code from the community flake (sadjow/claude-code-nix)
# which provides hourly updates for the latest releases.
#
# The claude-code-nix wrapper already bundles bubblewrap and socat into the
# binary's PATH, so no explicit sandbox packages are needed here.
#
# On Linux, this module also installs the seccomp filter from
# @anthropic-ai/sandbox-runtime and configures Claude's settings.local.json
# to use it. The filter blocks Unix domain socket access in sandboxed processes.

{
  config,
  pkgs,
  lib,
  ...
}:

let
  # Architecture mapping: nix system -> npm tarball directory name
  archDir =
    {
      "x86_64-linux" = "x64";
      "aarch64-linux" = "arm64";
    }
    .${pkgs.stdenv.hostPlatform.system} or null;

  sandbox-seccomp = pkgs.stdenv.mkDerivation {
    pname = "claude-sandbox-seccomp";
    version = "0.0.39";

    src = pkgs.fetchurl {
      url = "https://registry.npmjs.org/@anthropic-ai/sandbox-runtime/-/sandbox-runtime-0.0.39.tgz";
      sha256 = "1vaq7sbqwjcggzcn0318ik72h3afxav5jbf9v4lhwrqfbhjc8fsc";
    };

    sourceRoot = ".";

    installPhase = ''
      mkdir -p $out/lib/claude-seccomp
      cp package/vendor/seccomp/${archDir}/apply-seccomp $out/lib/claude-seccomp/
      cp package/vendor/seccomp/${archDir}/unix-block.bpf $out/lib/claude-seccomp/
      chmod +x $out/lib/claude-seccomp/apply-seccomp
    '';
  };

in
{
  home.packages = [
    pkgs.claude-code
  ];

  # Configure Claude to use the nix-managed seccomp filter.
  # Deep-merges into settings.json to preserve existing user settings.
  # Uses settings.json (not settings.local.json) because Claude's seccomp
  # diagnostic reads from settings.json specifically.
  home.activation.configureClaudeSeccomp = lib.mkIf (pkgs.stdenv.isLinux && archDir != null) (
    lib.hm.dag.entryAfter [ "writeBoundary" ] ''
      SETTINGS_DIR="${config.home.homeDirectory}/.claude"
      SETTINGS_FILE="$SETTINGS_DIR/settings.json"

      $DRY_RUN_CMD ${pkgs.coreutils}/bin/mkdir -p "$SETTINGS_DIR"

      if [ ! -f "$SETTINGS_FILE" ]; then
        echo '{}' > "$SETTINGS_FILE"
      fi

      SECCOMP_OVERLAY=$(${pkgs.coreutils}/bin/cat <<'ENDJSON'
      {
        "sandbox": {
          "seccomp": {
            "bpfPath": "${sandbox-seccomp}/lib/claude-seccomp/unix-block.bpf",
            "applyPath": "${sandbox-seccomp}/lib/claude-seccomp/apply-seccomp"
          }
        }
      }
      ENDJSON
      )

      $DRY_RUN_CMD ${pkgs.jq}/bin/jq -s '.[0] * .[1]' \
        "$SETTINGS_FILE" \
        <(echo "$SECCOMP_OVERLAY") \
        > "$SETTINGS_FILE.tmp"
      $DRY_RUN_CMD ${pkgs.coreutils}/bin/mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
    ''
  );
}
