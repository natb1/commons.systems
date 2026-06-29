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
# This darwin example evaluates purely. A Linux/WSL instance would still need
# `--impure`, because the framework's nix/home/wezterm-windows.nix calls
# `builtins.fetchurl`, forced only on Linux via `lib.mkIf pkgs.stdenv.isLinux`.
# If you adapt this template to a Linux system, keep `--impure` on the switch.

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
    claude-code-nix = {
      url = "github:sadjow/claude-code-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{ commons-systems, nixpkgs, home-manager, claude-code-nix, ... }:
    let
      # Select the system explicitly. This is a pure string literal — not
      # derived from the current system or the environment — so eval needs no
      # --impure.
      system = "aarch64-darwin";

      # direnv 2.37.1 checkPhase hangs when built from source; skip tests.
      # The framework does not export this overlay, so define it inline.
      direnvSkipTestsOverlay = final: prev: {
        direnv = prev.direnv.overrideAttrs (_: { doCheck = false; });
      };

      # Build pkgs WITH the claude-code-nix overlay. This is load-bearing:
      # commons-systems.homeManagerModules.default imports nix/home/claude-code.nix,
      # which installs pkgs.claude-code. That attribute exists only when
      # claude-code-nix.overlays.default is applied. Without it, eval fails with
      # `error: attribute 'claude-code' missing in set`.
      pkgs = import nixpkgs {
        inherit system;
        overlays = [ claude-code-nix.overlays.default direnvSkipTestsOverlay ];
        config.allowUnfreePredicate =
          pkg: builtins.elem (nixpkgs.lib.getName pkg) [ "claude-code" ];
      };
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
