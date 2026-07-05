# Example instance flake for a private "office-hours-nate" repo.
#
# This is a copy-paste template. It consumes the identity-free
# commons.systems framework and supplies the home identity (username, home
# directory, git name/email) that the framework no longer hardcodes.
#
# Switch command (pure eval — no --impure needed on darwin):
#
#   home-manager switch --flake .#aarch64-darwin
#
# The exposed attribute below is keyed by system, so the `.#aarch64-darwin`
# in that command matches `homeConfigurations."aarch64-darwin"`.
#
# --impure nuance (darwin vs Linux/WSL):
# This darwin example evaluates purely, and a Linux/WSL instance does too. The
# framework's Linux-only extras (e.g. nix/home/wezterm-windows.nix) reach across
# the WSL boundary and fetch the Windows WezTerm binary at activation *runtime*
# — a `${pkgs.curl}` call inside a home.activation script, gated on
# `pkgs.stdenv.isLinux` — not during evaluation. No framework module reads the
# environment or fetches over the network at eval time, so `--impure` is not
# required on any platform. If you adapt this template and your own eval
# genuinely needs it, confirm first with `nix eval` (without `--impure`) against
# your homeConfiguration, and add the flag only if that eval actually fails.

{
  description = "office-hours-nate — private instance of the commons.systems framework";

  inputs = {
    commons-systems = {
      url = "github:natb1/commons.systems";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{ commons-systems, nixpkgs, home-manager, ... }:
    let
      # Select the system explicitly. This is a pure string literal — not
      # derived from the current system or the environment — so eval needs no
      # --impure.
      system = "aarch64-darwin";

      # Build the fully-configured pkgs set from the framework's exported helper.
      # mkPkgs applies the claude-code-nix overlay (so pkgs.claude-code resolves,
      # required by commons-systems.homeManagerModules.default), applies the direnv
      # test-skip, and allows claude-code as unfree. The framework is the single
      # source of this wiring, so instances no longer copy it.
      pkgs = commons-systems.mkPkgs { inherit system; };
    in
    {
      # `home-manager switch --flake .#aarch64-darwin` resolves this attribute.
      homeConfigurations."aarch64-darwin" = home-manager.lib.homeManagerConfiguration {
        inherit pkgs;
        extraSpecialArgs = { inherit inputs; };
        modules = [
          commons-systems.homeManagerModules.default
          {
            # Identity — replace these placeholders with your own values.
            # (home.stateVersion is intentionally NOT set here: the framework's
            # nix/home/default.nix already sets it to "24.11", and setting it
            # again would conflict.)
            home.username = "youruser";
            home.homeDirectory = "/Users/youruser";
            programs.git.settings.user.name = "Your Name";
            programs.git.settings.user.email = "you@example.com";
          }
        ];
      };
    };
}
