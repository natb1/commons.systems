# Claude Code CLI
#
# Installs Claude Code from the community flake (sadjow/claude-code-nix)
# which provides hourly updates for the latest releases.
#
# After activation, the 'claude' command will be available system-wide.
#
# Sandbox support:
# - macOS: Uses built-in Seatbelt framework via sandbox-exec (no additional dependencies)
# - Linux/WSL2: Requires bubblewrap, socat, and libseccomp

{ pkgs, lib, ... }:

{
  home.packages = [
    pkgs.claude-code
  ] ++ lib.optionals pkgs.stdenv.isLinux [
    # Sandbox dependencies for Linux only
    pkgs.bubblewrap
    pkgs.socat
    pkgs.libseccomp
  ];
}
