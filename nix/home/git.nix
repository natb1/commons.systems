# Git Configuration Module
#
# This module configures Git settings through Home Manager.
# Home Manager will merge these settings with your existing ~/.gitconfig,
# so any settings you have defined manually will be preserved unless
# explicitly overridden here.

{
  config,
  pkgs,
  lib,
  ...
}:

{
  programs.git = {
    enable = true;

    # User identity - automatically detected from environment
    # These values are read from GIT_AUTHOR_NAME and GIT_AUTHOR_EMAIL environment variables.
    # If not set, sensible defaults are used.
    #
    # To customize, either:
    #   1. Export environment variables: export GIT_AUTHOR_NAME="Your Name"
    #   2. Override in Home Manager: programs.git.settings.user.name = lib.mkForce "Your Name";
    #   3. Keep existing ~/.gitconfig values (Home Manager merges, not replaces)
    settings = {
      user = {
        name = lib.mkDefault (
          let
            envName = builtins.getEnv "GIT_AUTHOR_NAME";
          in
          if envName != "" then envName else "Nathan Buesgens"
        );

        email = lib.mkDefault (
          let
            envEmail = builtins.getEnv "GIT_AUTHOR_EMAIL";
          in
          if envEmail != "" then envEmail else "nathan@natb1.com"
        );
      };

      # Core settings
      pull = {
        rebase = true;
      };

      init = {
        defaultBranch = "main";
      };

      # Common aliases
      alias = {
        st = "status";
        co = "checkout";
        br = "branch";
        ci = "commit";
        unstage = "reset HEAD --";
        last = "log -1 HEAD";
        visual = "log --graph --oneline --all";
      };
    };
  };
}
