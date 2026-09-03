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
    initContent = lib.mkOrder 1000 ''
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

      __tailscale_auth_check() {
        [[ -o interactive ]] || return 0
        command -v tailscale >/dev/null 2>&1 || return 0
        local status_json
        status_json=$(tailscale status --json 2>/dev/null) || return 0
        local backend_state auth_url
        backend_state=$(printf '%s' "$status_json" | jq -r '.BackendState // ""' 2>/dev/null) || return 0
        [[ -n "$backend_state" && "$backend_state" != "Running" ]] || return 0
        auth_url=$(printf '%s' "$status_json" | jq -r '.AuthURL // ""' 2>/dev/null)
        {
          echo "tailscale is not logged in on $(hostname) (BackendState: $backend_state)"
          if [[ -n "$auth_url" ]]; then
            echo "$auth_url"
          else
            echo "run: sudo tailscale up"
          fi
        } >&2
      }
      __tailscale_auth_check
    '';
  };
}
