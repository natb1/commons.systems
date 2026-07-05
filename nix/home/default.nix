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
# This module no longer sets home.username / home.homeDirectory or a git
# identity — the framework leaves them unset so each instance flake supplies its
# own (see nix/home/git.nix and the office-hours-nate instance). A generic
# forker builds their own instance flake that imports homeManagerModules.default
# and forces those values, rather than a standalone `.#default` target.

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
