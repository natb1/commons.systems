# Zsh Shell Configuration
#
# Minimal zsh config managed by Home Manager.
# Ensures .zshrc and .zshenv exist so zsh-newuser-install doesn't prompt.

{ lib, pkgs, ... }:

{
  programs.zsh = {
    enable = true;
    # Put Homebrew on PATH for login shells. Previously this lived in an
    # unmanaged ~/.zprofile; managing it here lets Home Manager own the file.
    profileExtra = lib.optionalString pkgs.stdenv.isDarwin ''
      eval "$(/opt/homebrew/bin/brew shellenv)"
    '';
    initExtra = ''
      __wezterm_set_git_branch() {
        local branch
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        if [[ -n "$branch" ]]; then
          printf '\e]1337;SetUserVar=%s=%s\a' git_branch "$(printf '%s' "$branch" | base64)"
        else
          printf '\e]1337;SetUserVar=%s=%s\a' git_branch ""
        fi
      }
      precmd_functions+=(__wezterm_set_git_branch)
      chpwd_functions+=(__wezterm_set_git_branch)
    '';
  };
}
