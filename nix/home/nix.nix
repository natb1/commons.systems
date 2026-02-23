# Nix Configuration
#
# Configures Nix settings via Home Manager.
# This enables experimental features permanently so you don't need to pass
# --extra-experimental-features flags with every command.

{
  config,
  pkgs,
  lib,
  ...
}:

{
  nix = {
    package = lib.mkDefault pkgs.nix;

    settings = {
      # Enable flakes and nix-command permanently
      experimental-features = [
        "nix-command"
        "flakes"
      ];

      # Warn about dirty Git trees
      warn-dirty = false;
    };
  };
}
