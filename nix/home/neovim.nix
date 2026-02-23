# Neovim Configuration Module
#
# Modern text editor for terminal-based development. Provides:
# - Fast, efficient text editing
# - Extensive plugin ecosystem
# - LSP (Language Server Protocol) support
# - Terminal integration
#
# After activating this configuration:
#   1. Launch with: nvim
#   2. Configure via ~/.config/nvim/ (user responsibility)

{
  config,
  pkgs,
  lib,
  ...
}:

{
  programs.neovim = {
    enable = true;

    # Use neovim as the default editor
    defaultEditor = true;

    # Create vim and vi aliases
    viAlias = true;
    vimAlias = true;
    vimdiffAlias = true;
  };
}
