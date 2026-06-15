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

        apps = forAllSystems ({ pkgs, ... }:
          let
            home-manager-setup = pkgs.callPackage ./nix/apps/home-manager-setup.nix { };
          in
          {
            home-manager-setup = {
              type = "app";
              program = "${home-manager-setup}/bin/home-manager-setup";
            };
          }
        );

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

      # Home Manager configurations (not per-system in flake schema)
      mkHomeConfig = system:
        let
          pkgs = import nixpkgs {
            inherit system;
            overlays = [ claude-code-nix.overlays.default direnvSkipTestsOverlay ];
            config.allowUnfreePredicate = pkg:
              builtins.elem (nixpkgs.lib.getName pkg) [
                "claude-code"
              ];
          };
        in
        home-manager.lib.homeManagerConfiguration {
          inherit pkgs;
          modules = [
            ./nix/home/default.nix
          ];
          extraSpecialArgs = {
            inherit inputs;
          };
        };

      homeConfigurations = builtins.listToAttrs (
        map (system: {
          name = system;
          value = mkHomeConfig system;
        }) systems
      ) // {
        default = mkHomeConfig builtins.currentSystem;
      };

      darwinConfigurations.default = darwin.lib.darwinSystem {
        specialArgs = { inherit inputs; };
        modules = [
          ./nix/darwin/default.nix
          home-manager.darwinModules.home-manager
          {
            # Architecture-aware: hostPlatform in-module is the current idiom
            # (legacy `system` arg to darwinSystem is discouraged). The Mac is
            # Apple Silicon.
            nixpkgs.hostPlatform = "aarch64-darwin";

            # System nixpkgs config — shared with home-manager via useGlobalPkgs.
            # Mirrors mkHomeConfig so the reused nix/home/default.nix (which pulls
            # the unfree pkgs.claude-code from the claude-code-nix overlay) builds.
            nixpkgs.overlays = [ claude-code-nix.overlays.default direnvSkipTestsOverlay ];
            nixpkgs.config.allowUnfreePredicate =
              pkg: builtins.elem (nixpkgs.lib.getName pkg) [ "claude-code" ];

            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = { inherit inputs; };
            home-manager.users.n8 = { lib, ... }: {
              imports = [ ./nix/home/default.nix ];

              # nix/home/default.nix derives username/homeDirectory impurely via
              # builtins.getEnv (fine for the standalone --impure homeConfigurations,
              # but it would throw under the PURE acceptance eval). Force them so the
              # getEnv/throw thunks are never evaluated and pure eval passes.
              home.username = lib.mkForce "n8";
              home.homeDirectory = lib.mkForce "/Users/n8";

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
    systemOutputs // { inherit homeConfigurations; } // { inherit darwinConfigurations; };
}
