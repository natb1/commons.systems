# Home Manager Configuration Entry Point
#
# Manages user-specific configuration files declaratively.

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
  ];

  # Let Home Manager manage itself
  programs.home-manager.enable = true;

  # Disable version mismatch check since we're using home-manager/master with nixos-unstable
  home.enableNixpkgsReleaseCheck = false;

  home.stateVersion = "24.11";
}
