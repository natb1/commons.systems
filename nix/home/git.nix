# Git Configuration Module
#
# This module writes settings into Home Manager's XDG git config
# (~/.config/git/config). Git resolves identity by config precedence:
# XDG config < ~/.gitconfig < command-line flags. Settings here land in the
# XDG layer, so ~/.gitconfig values win over anything set by this module.
#
# Identity is set only when GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL are present at
# eval time (requires `--impure`; builtins.getEnv returns "" under pure eval).
# If neither env var is set, no [user] section is emitted here and git falls
# through to whatever ~/.gitconfig provides. If ~/.gitconfig has no identity
# either, git errors at commit time with "Author identity unknown" and directs
# you to `git config --global user.name` / `user.email`.

{
  config,
  pkgs,
  lib,
  ...
}:

let
  envName = builtins.getEnv "GIT_AUTHOR_NAME";
  envEmail = builtins.getEnv "GIT_AUTHOR_EMAIL";
in

{
  programs.git = {
    enable = true;

    # User identity — read from environment at eval time (requires --impure).
    # If an env var is unset, that attribute is omitted and git's own config
    # precedence applies (falls through to ~/.gitconfig, then errors clearly).
    #
    # To customize, either:
    #   1. Export environment variables and run home-manager switch with --impure:
    #        export GIT_AUTHOR_NAME="Your Name"
    #        export GIT_AUTHOR_EMAIL="you@example.com"
    #        home-manager switch --flake .#default --impure
    #   2. Override in Home Manager: programs.git.settings.user.name = lib.mkForce "Your Name";
    #   3. Set values directly in ~/.gitconfig (takes precedence over this XDG config)
    settings = {
      user =
        lib.optionalAttrs (envName != "") { name = lib.mkDefault envName; }
        // lib.optionalAttrs (envEmail != "") { email = lib.mkDefault envEmail; };

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
