# Home Manager Configuration Entry Point
#
# Manages user-specific configuration files declaratively.
#
# The author's own machines activate this module through their integrated host
# configs rather than via standalone home-manager switch:
#   - WSL NixOS box: `sudo nixos-rebuild switch` builds `nixosConfigurations.nixos`,
#     which integrates home-manager as a NixOS module.
#   - macOS box: `darwin-rebuild switch` builds `darwinConfigurations.default`,
#     which integrates home-manager via nix-darwin.
# On those integrated paths, the NixOS/nix-darwin module sets
# `home-manager.backupFileExtension` automatically.
#
# The standalone instructions below are for the generic forker path — plain
# Linux/macOS without NixOS-WSL or nix-darwin.
#
# To activate this configuration (generic forker path):
#   First time (requires experimental features flags):
#     nix --extra-experimental-features 'nix-command flakes' run home-manager/master -- switch --extra-experimental-features 'nix-command flakes' --flake .#default --impure
#
#   After first activation (auto-detects system architecture):
#     home-manager switch -b backup --flake .#default --impure
#
#   Or explicitly specify system:
#     home-manager switch -b backup --flake .#x86_64-linux --impure
#
# Always pass `-b backup` on the standalone forker path: standalone home-manager
# has no equivalent of the NixOS/nix-darwin module's
# `home-manager.backupFileExtension`, and without it a switch aborts
# mid-activation when it meets an unmanaged file it wants to own
# (e.g. a stray ~/.zprofile), leaving the profile half-updated.
#
# Note: --impure is required because home.username and home.homeDirectory are
# automatically detected from your environment using builtins.getEnv.

{
  config,
  pkgs,
  lib,
  ...
}:

{
  imports = [
    ./claude-code.nix
    ./claude-in-chrome-windows.nix
    ./direnv.nix
    ./dispatch-usage-samples.nix
    ./gh.nix
    ./git.nix
    ./gpg.nix
    ./neovim.nix
    ./nix.nix
    ./ssh.nix
    ./ssh-authorized-keys.nix
    ./ssh-keygen.nix
    ./wezterm.nix
    ./wezterm-windows.nix
    ./zsh.nix
  ];

  # User identity - detect from environment or HOME directory
  home.username = lib.mkDefault (
    let
      envUser = builtins.getEnv "USER";
      homeDir = builtins.getEnv "HOME";
      extractedUser = if homeDir != "" then builtins.baseNameOf homeDir else "";

      diagnosticMsg = ''
        Could not determine username. Environment variable diagnostics:
          USER=${if envUser != "" then envUser else "(empty)"}
          HOME=${if homeDir != "" then homeDir else "(empty)"}
          Extracted from HOME=${
            if extractedUser != "" then extractedUser else "(failed - HOME is / or invalid)"
          }

        To fix:
          - Set USER environment variable to your username, OR
          - Set HOME environment variable to your home directory path
          - Ensure HOME is not set to "/" (root directory)
      '';
    in
    if envUser != "" then
      envUser
    else if extractedUser != "" then
      extractedUser
    else
      throw diagnosticMsg
  );

  home.homeDirectory = lib.mkDefault (
    let
      envHome = builtins.getEnv "HOME";
    in
    if envHome != "" then
      envHome
    else if pkgs.stdenv.isDarwin then
      "/Users/${config.home.username}"
    else
      "/home/${config.home.username}"
  );

  home.packages = [
    pkgs.jq
    pkgs.google-cloud-sdk
    pkgs.pass
    pkgs.python3
  ] ++ lib.optionals pkgs.stdenv.isDarwin [
    # macOS: manage these with Nix instead of Homebrew. After switching, run
    # `brew uninstall go` so the Nix copy is the one on PATH.
    # (gh is already installed by programs.gh in gh.nix; jq above is Nix-only
    # and not a brew formula — both are already Nix-managed on macOS.)
    pkgs.go
  ];

  # Let Home Manager manage itself
  programs.home-manager.enable = true;

  # Disable version mismatch check since we're using home-manager/master with nixos-unstable
  home.enableNixpkgsReleaseCheck = false;

  home.stateVersion = "24.11";
}
