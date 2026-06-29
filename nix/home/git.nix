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

let
  gitSettings = config.programs.git.settings;
  hasName = gitSettings ? user && gitSettings.user ? name && gitSettings.user.name != "";
  hasEmail = gitSettings ? user && gitSettings.user ? email && gitSettings.user.email != "";
in
{
  assertions = [
    {
      assertion = !config.programs.git.enable || (hasName && hasEmail);
      message = ''
        Git is enabled but no git identity is set.

        The commons.systems framework no longer bakes in a personal git
        identity. Set both of these in your office-hours-nate instance flake:

          programs.git.settings.user.name  = "Your Name";
          programs.git.settings.user.email = "you@example.com";

        See issue #2448 / epic #2446 (the personal instance was split out of
        the framework).
      '';
    }
  ];

  programs.git = {
    enable = true;

    # User identity (user.name / user.email) is intentionally NOT set here.
    # The framework repo no longer bakes in a personal git identity; the
    # consuming instance flake (office-hours-nate) supplies it via
    # programs.git.settings.user.name / .email. The assertion below fails
    # loudly if git is enabled without an identity. See issue #2448 / epic #2446.
    settings = {
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
