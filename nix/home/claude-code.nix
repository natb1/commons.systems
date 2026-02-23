# Claude Code CLI
#
# Installs Claude Code from the community flake (sadjow/claude-code-nix)
# which provides hourly updates for the latest releases.
#
# After activation, the 'claude' command will be available system-wide.

{ pkgs, ... }:

{
  home.packages = [
    pkgs.claude-code

    # Sandbox dependencies
    pkgs.bubblewrap
    pkgs.socat
    pkgs.libseccomp
  ];
}
