# GitHub CLI
#
# Installs the gh command-line tool for working with GitHub
# repositories, pull requests, issues, and more.

{ pkgs, ... }:

{
  programs.gh = {
    enable = true;
  };
}
