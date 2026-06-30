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

      # Suppress warnings about uncommitted changes in flake Git trees
      warn-dirty = false;
    };

    # Authenticate GitHub API requests used to resolve `github:` flake inputs.
    #
    # `nix flake update` queries api.github.com for each input's current HEAD.
    # Unauthenticated requests are capped at 60/hour *per source IP* — behind
    # carrier-grade NAT (e.g. cellular) that budget is drained by other users
    # sharing the IP. A token raises the cap to 5000/hour for your own account.
    #
    # The token must not enter the Nix store (the generated nix.conf is
    # world-readable there), so it lives in an out-of-store file pulled in with
    # `!include`. The `!` prefix makes the include optional: contributors who
    # have not created the file are unaffected.
    #
    # To enable, create the file (chmod 600) with a single line:
    #   access-tokens = github.com=github_pat_xxxxxxxx
    # Generate the token at https://github.com/settings/tokens — a fine-grained
    # token with no scopes (public read only) is sufficient.
    extraOptions = ''
      !include ${config.home.homeDirectory}/.config/nix/access-tokens.conf
    '';
  };
}
