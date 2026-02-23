# Zsh Shell Configuration
#
# Minimal zsh config managed by Home Manager.
# Ensures .zshrc and .zshenv exist so zsh-newuser-install doesn't prompt.

{ lib, ... }:

{
  programs.zsh = {
    enable = true;
  };
}
