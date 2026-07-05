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
    nixos-wsl = {
      url = "github:nix-community/NixOS-WSL";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{ nixpkgs, home-manager, claude-code-nix, darwin, nixos-wsl, ... }:
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
            claudeCodeTests = pkgs.callPackage ./nix/home/claude-code.test.nix { };
          in
          {
            wezterm-test-suite = weztermTests.wezterm-test-suite;
            claude-code-test-suite = claudeCodeTests.claude-code-test-suite;
          }
          // weztermTests.wezterm-tests
          // claudeCodeTests.claude-code-tests
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
      # The WSL box is now built in-flake as nixosConfigurations.nixos (below),
      # consuming nixos-wsl as a flake input rather than the channel — so the old
      # channel-unresolvability caveat is gone. But a *reusable*
      # nixosModules.default export is still NOT provided:
      # nix/nixos/configuration.nix hardcodes wsl.* / the n8 user, and exporting a
      # reusable, identity-parameterized module is deferred to epic #2446 / #2449.
      homeManagerModules = { default = ./nix/home/default.nix; };
      darwinModules      = { default = ./nix/darwin/default.nix; };

      # Shared integrated home-manager wiring for the two host configs.
      # darwinConfigurations.default and nixosConfigurations.nixos embed the same
      # six settings (nixpkgs.overlays, nixpkgs.config.allowUnfreePredicate,
      # home-manager.useGlobalPkgs/useUserPackages/extraSpecialArgs, and the
      # users.n8 imports + forced username/homeDirectory). Only hostPlatform and
      # homeDirectory differ and are parameters; platform-specific extras (darwin's
      # wezterm disable, nixos's backupFileExtension) are layered as small sibling
      # modules at each call site via the module system's native merge.
      #
      # hostPlatform in-module is the current idiom (the legacy `system` arg to
      # darwinSystem/nixosSystem is discouraged). The overlay/allowUnfree lines
      # make the reused nix/home/default.nix (which pulls the unfree
      # pkgs.claude-code from the claude-code-nix overlay) build.
      mkIntegratedHmConfig = { hostPlatform, homeDirectory }: {
        nixpkgs.hostPlatform = hostPlatform;

        nixpkgs.overlays = [ claude-code-nix.overlays.default direnvSkipTestsOverlay ];
        nixpkgs.config.allowUnfreePredicate =
          pkg: builtins.elem (nixpkgs.lib.getName pkg) [ "claude-code" ];

        home-manager.useGlobalPkgs = true;
        home-manager.useUserPackages = true;
        home-manager.extraSpecialArgs = { inherit inputs; };
        home-manager.users.n8 = { lib, ... }: {
          imports = [ homeManagerModules.default ];

          # The framework's nix/home/default.nix no longer assigns
          # username/homeDirectory — it leaves them unset so each instance sets
          # its own. lib.mkForce is load-bearing here: it overrides home-manager's
          # nixos/common.nix, which derives homeDirectory from
          # config.users.users.n8.home at priority 100. On darwin,
          # nix/darwin/default.nix defines no users.users.n8, so that derivation
          # yields null; mkForce (priority 50) ensures our values win. Do not drop
          # mkForce as redundant — darwin CI fails without it (see the flake log,
          # "restore lib.mkForce ... to override ... null derivation").
          home.username = lib.mkForce "n8";
          home.homeDirectory = lib.mkForce homeDirectory;
        };
      };

      darwinConfigurations.default = darwin.lib.darwinSystem {
        specialArgs = { inherit inputs; };
        modules = [
          darwinModules.default
          home-manager.darwinModules.home-manager
          # The Mac is Apple Silicon.
          (mkIntegratedHmConfig {
            hostPlatform = "aarch64-darwin";
            homeDirectory = "/Users/n8";
          })
          {
            # Out-of-scope constraint: do NOT enable programs.wezterm on Darwin.
            # nix/home/wezterm.nix unconditionally sets enable = true; override it
            # here. (wezterm-windows.nix is already gated on isLinux, so it is a
            # no-op on Darwin and needs no change.) This touches no shared file, so
            # the NixOS/WSL host config stays byte-identical.
            #
            # The framework (nix/home/default.nix, nix/home/git.nix) no longer
            # assigns git identity — it leaves it unset so each instance supplies
            # its own. This office-hours-nate instance sets the git identity here.
            # mkIntegratedHmConfig already imports homeManagerModules.default and
            # forces username/homeDirectory; this sibling users.n8 block merges in
            # the identity and wezterm override via the module system.
            home-manager.users.n8 = { lib, ... }: {
              programs.git.settings.user.name = "Nathan Buesgens";
              programs.git.settings.user.email = "nathan@natb1.com";
              programs.wezterm.enable = lib.mkForce false;
            };
          }
        ];
      };

      nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
        specialArgs = { inherit inputs; };
        modules = [
          nixos-wsl.nixosModules.default
          ./nix/nixos/configuration.nix
          home-manager.nixosModules.home-manager
          (mkIntegratedHmConfig {
            hostPlatform = "x86_64-linux";
            homeDirectory = "/home/n8";
          })
          {
            # backupFileExtension makes the clobber-abort impossible: when a switch
            # meets an unmanaged file it wants to own, it backs it up (.backup)
            # instead of aborting mid-activation. This option exists only in the
            # NixOS/nix-darwin module, not standalone home-manager.
            home-manager.backupFileExtension = "backup";

            # The framework (nix/home/git.nix) no longer assigns a git identity —
            # it asserts loudly if git is enabled without one. This instance
            # supplies its identity here. mkIntegratedHmConfig already imports
            # homeManagerModules.default and forces username/homeDirectory; this
            # sibling users.n8 block merges the identity in via the module system.
            home-manager.users.n8 = {
              programs.git.settings.user.name = "Nathan Buesgens";
              programs.git.settings.user.email = "nathan@natb1.com";
              services.sshAuthorizedKeys.keys = [
                "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBzEPhvoentKLmUnWPI0mfPHEFNP2bj0ekvC3N5LcI58 n8@nixos"
                "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM7rlIYWYTjLuwkOyKsO4PxewINlxA8HezSW+GTpE9os n8@Nathans-MacBook-Air.local"
              ];
              services.dispatchUsageSamples.enable = true;
              services.dispatchUsageSamples.groupId = "commons-systems";
            };

            # Contrast with darwin: do NOT disable programs.wezterm here. Linux/WSL
            # wants wezterm and its mux-server user service; the darwin config
            # force-disables it only because macOS is out of scope there.
          }
        ];
      };
    in
    systemOutputs // { inherit darwinConfigurations nixosConfigurations homeManagerModules darwinModules; };
}
