{
  description = "commons.systems dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    claude-code-nix = {
      url = "github:sadjow/claude-code-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    darwin = {
      url = "github:nix-darwin/nix-darwin/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{ nixpkgs, home-manager, claude-code-nix, darwin, ... }:
    let
      # direnv 2.37.1 checkPhase hangs when built from source; skip tests.
      direnvSkipTestsOverlay = final: prev: {
        direnv = prev.direnv.overrideAttrs (_: { doCheck = false; });
      };

      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = fn: nixpkgs.lib.genAttrs systems (system: fn {
        pkgs = nixpkgs.legacyPackages.${system};
        inherit system;
      });

      # Per-system outputs
      systemOutputs = {
        packages = forAllSystems ({ pkgs, ... }: {
          dispatch = pkgs.callPackage ./nix/packages/dispatch.nix { };
          office-hours = pkgs.callPackage ./nix/packages/office-hours.nix { };
        });

        devShells = forAllSystems ({ pkgs, ... }:
          let
            dispatch = pkgs.callPackage ./nix/packages/dispatch.nix { };
            office-hours = pkgs.callPackage ./nix/packages/office-hours.nix { };
          in
          {
            default = pkgs.mkShell {
              packages = (with pkgs; [
                nodejs_22
                openjdk
                go
                python3
                jq
                fswatch
                playwright-driver.browsers
                gnupg
                pass
              ]) ++ [ dispatch office-hours ];
              shellHook = ''
                export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
              '';
            };
          });

        checks = forAllSystems ({ pkgs, ... }:
          let
            weztermTests = pkgs.callPackage ./nix/home/wezterm.test.nix { };
          in
          {
            wezterm-test-suite = weztermTests.wezterm-test-suite;
          }
          // weztermTests.wezterm-tests
        );
      };

      # Reusable module entry points (bare paths, no inputs threading)
      #
      # Overlay prerequisite: homeManagerModules.default imports
      # nix/home/claude-code.nix, which installs pkgs.claude-code. That attribute
      # exists only when claude-code-nix.overlays.default is applied to the pkgs
      # set the module is evaluated against. A consumer importing this module
      # with a plain nixpkgs.legacyPackages.<system> pkgs set (no overlay) hits
      # `error: attribute 'claude-code' missing in set` at eval time. Apply
      # claude-code-nix.overlays.default to nixpkgs before using this module.
      #
      # nixosModules is intentionally NOT exported: nix/nixos/configuration.nix
      # is machine-specific (imports <nixos-wsl/modules> via the nixos-wsl
      # channel, which is unresolvable under pure flake eval, and hardcodes
      # wsl.* / the n8 user), so it is not a reusable module. The real machine
      # consumes it through the /etc/nixos stub + channel, not this flake.
      homeManagerModules = { default = ./nix/home/default.nix; };
      darwinModules      = { default = ./nix/darwin/default.nix; };

      darwinConfigurations.default = darwin.lib.darwinSystem {
        specialArgs = { inherit inputs; };
        modules = [
          darwinModules.default
          home-manager.darwinModules.home-manager
          {
            # Architecture-aware: hostPlatform in-module is the current idiom
            # (legacy `system` arg to darwinSystem is discouraged). The Mac is
            # Apple Silicon.
            nixpkgs.hostPlatform = "aarch64-darwin";

            # System nixpkgs config — shared with home-manager via useGlobalPkgs.
            # Applies the claude-code-nix overlay so the reused nix/home/default.nix
            # (which pulls the unfree pkgs.claude-code from that overlay) builds.
            nixpkgs.overlays = [ claude-code-nix.overlays.default direnvSkipTestsOverlay ];
            nixpkgs.config.allowUnfreePredicate =
              pkg: builtins.elem (nixpkgs.lib.getName pkg) [ "claude-code" ];

            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = { inherit inputs; };
            home-manager.users.n8 = { lib, ... }: {
              imports = [ homeManagerModules.default ];

              # The framework (nix/home/default.nix, nix/home/git.nix) no longer
              # assigns home identity or git identity — it leaves them unset so each
              # instance supplies its own. This office-hours-nate instance sets
              # username/homeDirectory and the git identity directly.
              #
              # lib.mkForce overrides home-manager's nixos/common.nix, which derives
              # homeDirectory from config.users.users.n8.home at priority 100. Since
              # nix/darwin/default.nix defines no users.users.n8, that derivation yields
              # null. mkForce (priority 50) ensures our values win.
              home.username = lib.mkForce "n8";
              home.homeDirectory = lib.mkForce "/Users/n8";
              programs.git.settings.user.name = "Nathan Buesgens";
              programs.git.settings.user.email = "nathan@natb1.com";

              # Out-of-scope constraint: do NOT enable programs.wezterm on Darwin.
              # nix/home/wezterm.nix unconditionally sets enable = true; override it
              # here. (wezterm-windows.nix is already gated on isLinux, so it is a
              # no-op on Darwin and needs no change.) This touches no shared file,
              # so the NixOS/WSL host config stays byte-identical.
              programs.wezterm.enable = lib.mkForce false;
            };
          }
        ];
      };
    in
    systemOutputs // { inherit darwinConfigurations homeManagerModules darwinModules; };
}
