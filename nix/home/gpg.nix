# GnuPG and gpg-agent
#
# Provides `gpg` plus a gpg-agent configured with a TTY pinentry, suitable
# for headless / WSL environments without a graphical session.

{ pkgs, ... }:

{
  programs.gpg = {
    enable = true;
  };

  services.gpg-agent = {
    enable = true;
    pinentry.package = pkgs.pinentry-curses;
  };
}
