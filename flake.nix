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
  };

  outputs = { nixpkgs, home-manager, claude-code-nix, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = fn: nixpkgs.lib.genAttrs systems (system: fn {
        pkgs = nixpkgs.legacyPackages.${system};
        inherit system;
      });

      # Per-system outputs
      systemOutputs = {
        packages = forAllSystems ({ pkgs, ... }: {
          productivity-tui = pkgs.callPackage ./nix/packages/productivity-tui.nix { };
        });

        devShells = forAllSystems ({ pkgs, ... }: {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_22
              openjdk
              go
              jq
              playwright-driver.browsers
            ];
            shellHook = ''
              export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
              export PATH="$PWD/dispatch/bin:$PATH"
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
          # direnv 2.37.1 checkPhase hangs when built from source; skip tests.
          direnvSkipTestsOverlay = final: prev: {
            direnv = prev.direnv.overrideAttrs (_: { doCheck = false; });
          };
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
        };

      homeConfigurations = builtins.listToAttrs (
        map (system: {
          name = system;
          value = mkHomeConfig system;
        }) systems
      ) // {
        default = mkHomeConfig builtins.currentSystem;
      };
    in
    systemOutputs // { inherit homeConfigurations; };
}
