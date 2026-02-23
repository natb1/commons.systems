# Home Manager Configuration Entry Point
#
# Manages user-specific configuration files declaratively.
#
# To activate this configuration:
#   First time (requires experimental features flags):
#     nix --extra-experimental-features 'nix-command flakes' run home-manager/master -- switch --extra-experimental-features 'nix-command flakes' --flake .#default --impure
#
#   After first activation (auto-detects system architecture):
#     home-manager switch --flake .#default --impure
#
#   Or explicitly specify system:
#     home-manager switch --flake .#x86_64-linux --impure
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
    ./direnv.nix
    ./gh.nix
    ./git.nix
    ./neovim.nix
    ./nix.nix
    ./ssh.nix
    ./ssh-authorized-keys.nix
    ./ssh-keygen.nix
    ./wezterm.nix
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
  ];

  # Let Home Manager manage itself
  programs.home-manager.enable = true;

  # Disable version mismatch check since we're using home-manager/master with nixos-unstable
  home.enableNixpkgsReleaseCheck = false;

  home.stateVersion = "24.11";
}
