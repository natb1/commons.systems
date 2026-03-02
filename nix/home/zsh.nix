# Zsh Shell Configuration
#
# Minimal zsh config managed by Home Manager.
# Ensures .zshrc and .zshenv exist so zsh-newuser-install doesn't prompt.

{ lib, ... }:

{
  programs.zsh = {
    enable = true;
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
    '';
  };
}
