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

      # The unfree package names the framework permits (claude-code is unfree).
      claudeUnfreePredicate =
        pkg: builtins.elem (nixpkgs.lib.getName pkg) [ "claude-code" ];

      # The framework's full opinionated stack, composing claude-code-nix (pins
      # pkgs.claude-code to the sadjow fork used by homeManagerModules.default;
      # recent nixpkgs ships its own claude-code, so without this overlay eval
      # still succeeds but resolves to nixpkgs' build/version instead) with the
      # direnv test-skip. Consumed internally by mkPkgs/mkIntegratedHmConfig and
      # exported as overlays.default; a consumer wanting only the claude-code
      # capability (without the direnv rebuild) applies overlays.claude-code
      # instead. Composing into one function keeps it a valid overlay output
      # (nix flake check rejects a list here).
      claudeOverlay = nixpkgs.lib.composeManyExtensions [
        claude-code-nix.overlays.default
        direnvSkipTestsOverlay
      ];

      # Build a fully-configured pkgs set for `system`: the composed overlay applied
      # and claude-code allowed as unfree. Instance flakes call this instead of
      # copying the `import nixpkgs { … }` block. Closes over the framework's own
      # nixpkgs/claude-code-nix inputs, which instance flakes make follow their
      # nixpkgs via `inputs.nixpkgs.follows`.
      mkPkgs = { system }: import nixpkgs {
        inherit system;
        overlays = [ claudeOverlay ];
        config.allowUnfreePredicate = claudeUnfreePredicate;
      };

      # Claim core.hooksPath so .githooks/pre-commit runs. That hook carries the
      # vendored-skill drift and shadow checks, which CI structurally cannot run
      # (they need the machine's own Claude skill roots) -- see
      # .claude/rules/vendored-skills.md. Git will not read a repo-controlled
      # hooks path on its own, and this flake is the project's only sanctioned
      # path for environment configuration, so the claim happens here.
      #
      # Claimed only when core.hooksPath is unset, so a developer who points it
      # somewhere of their own keeps that. Failure is not fatal to entering the
      # shell: a read-only .git (some sandboxes) must not make the devshell
      # unusable, but it must say so rather than leaving the hooks silently
      # uninstalled.
      installGitHooks = ''
        if [ -d .githooks ] && [ -z "$(git config --get core.hooksPath 2>/dev/null)" ]; then
          git config core.hooksPath .githooks \
            || echo "warning: could not set core.hooksPath; run 'git config core.hooksPath .githooks' by hand" >&2
        fi
      '';

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
          # WSL wezterm rebuilt from the pinned nightly (nix/home/wezterm-pin.nix).
          # Exposed so `nix build .#wezterm` can verify the pin and so
          # nix/home/sync-wezterm.sh can resolve the vendor hash against it.
          wezterm = pkgs.callPackage ./nix/home/wezterm-package.nix { };
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
                ${installGitHooks}
              '';
            };

            # Environment configuration with no toolchain, for the Claude Code
            # cloud container. That container is ephemeral and already ships
            # node/java/go/python/jq, so realizing devShells.default there would
            # pay several minutes and ~2GB per session to replace tools it has
            # -- and would repoint PLAYWRIGHT_BROWSERS_PATH away from the
            # Chromium the image pre-installs at /opt/pw-browsers.
            #
            # This shell exists so the cloud init script can still get its
            # environment configuration from nix rather than from a second,
            # divergent path: `nix develop .#cloud --command true` runs the
            # shellHook and exits, leaving core.hooksPath set. Anything else the
            # cloud environment needs configured belongs here, next to it.
            #
            # Empty `packages` is deliberate, not an oversight. Adding a tool
            # here makes every cloud session pay for it.
            cloud = pkgs.mkShell {
              packages = [ ];
              shellHook = installGitHooks;
            };
          });

        checks = forAllSystems ({ pkgs, ... }:
          let
            weztermTests = pkgs.callPackage ./nix/home/wezterm.test.nix { };
            claudeCodeTests = pkgs.callPackage ./nix/home/claude-code.test.nix { };
            zshTests = pkgs.callPackage ./nix/home/zsh.test.nix { };
          in
          {
            wezterm-test-suite = weztermTests.wezterm-test-suite;
            claude-code-test-suite = claudeCodeTests.claude-code-test-suite;
            zsh-test-suite = zshTests.zsh-test-suite;
          }
          // weztermTests.wezterm-tests
          // claudeCodeTests.claude-code-tests
          // zshTests.zsh-tests
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
      # The WSL box is built in-flake as nixosConfigurations.nixos (below),
      # consuming nixos-wsl as a flake input rather than the channel.
      # nix/nixos/configuration.nix is identity-parameterized: the host user
      # comes from config.instance.hostUser (this instance supplies it below),
      # so no user name is hardcoded there.
      #
      # nixosModules.default exports that framework NixOS layer as a bare path,
      # mirroring the two exports above. configuration.nix threads no flake
      # inputs itself, but a consumer building a host from it must supply two
      # things the module leaves open:
      #   - nixos-wsl.nixosModules.default, which provides the wsl.* options
      #     (wsl.enable, wsl.defaultUser) configuration.nix sets — without it
      #     eval fails with an undefined-option error for wsl.enable.
      #   - instance.hostUser (a typed str with no default, defined in
      #     nix/nixos/host-user.nix and read throughout configuration.nix), the
      #     host user name.
      # A consumer that also wires home-manager.users.<name> through
      # homeManagerModules.default additionally inherits that module's
      # claude-code overlay prerequisite noted above.
      homeManagerModules = { default = ./nix/home/default.nix; };
      darwinModules      = { default = ./nix/darwin/default.nix; };
      nixosModules       = { default = ./nix/nixos/configuration.nix; };

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

        nixpkgs.overlays = [ claudeOverlay ];
        nixpkgs.config.allowUnfreePredicate = claudeUnfreePredicate;

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
          # Consume the framework export a forker uses, not the path directly,
          # so the in-repo host exercises the same entry point.
          nixosModules.default
          home-manager.nixosModules.home-manager
          (mkIntegratedHmConfig {
            hostPlatform = "x86_64-linux";
            homeDirectory = "/home/n8";
          })
          {
            # The NixOS host user (wsl.defaultUser, users.users.<name>, and the
            # office-hours producer user) — the framework's nix/nixos modules read
            # this instead of hardcoding a name. This office-hours-nate instance
            # supplies it here.
            instance.hostUser = "n8";

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
    systemOutputs // {
      inherit darwinConfigurations nixosConfigurations homeManagerModules darwinModules nixosModules mkPkgs;
      overlays = {
        # The only overlay homeManagerModules.default requires: pins
        # pkgs.claude-code to the sadjow fork. A consumer wanting just the
        # claude-code capability applies this alone.
        claude-code = claude-code-nix.overlays.default;
        # Optional, independent build workaround (direnv doCheck = false); not
        # required by claude-code.
        direnv-skip-tests = direnvSkipTestsOverlay;
        # The framework's full opinionated stack (both composed). Applying it
        # rebuilds direnv with doCheck = false, so a consumer wanting only
        # claude-code should apply overlays.claude-code instead.
        default = claudeOverlay;
      };
    };
}
