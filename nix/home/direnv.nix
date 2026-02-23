# Direnv Configuration Module
#
# Automatically loads and unloads environment variables when you
# enter and leave a directory. Particularly useful for:
# - Auto-loading Nix development shells via .envrc files
# - Managing per-project environment variables
# - Seamless workflow without manually running 'nix develop'
#
# After activating this configuration:
#   1. Run: direnv allow
#   2. cd into a directory with .envrc
#   3. The environment automatically loads

{
  config,
  pkgs,
  lib,
  ...
}:

{
  programs.direnv = {
    enable = true;

    # Enable shell integrations based on what shells are enabled
    enableBashIntegration = true;
    enableZshIntegration = true;

    # nix-direnv provides fast caching for Nix environments
    # This significantly speeds up entering directories with .envrc
    # that use 'use flake' or 'use nix'
    nix-direnv.enable = true;
  };
}
