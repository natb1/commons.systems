# Example instance flake for a private "office-hours-nate" repo.
#
# This is a copy-paste template. It consumes the identity-free commons.systems
# framework and supplies the personal values (username, home directory, git
# identity, ssh keys, dispatch group, host user) that the framework no longer
# hardcodes. The framework's flake.nix carries only placeholder values so its
# CI keeps building; your real machines live here.
#
# It exposes three build targets, one per switch path:
#
#   darwin-rebuild switch --flake .#default      # macOS host (nix-darwin)
#   sudo nixos-rebuild switch --flake .#nixos    # WSL NixOS host
#   home-manager switch --flake .#aarch64-darwin # standalone home-manager
#
# The two integrated host configs (darwinConfigurations / nixosConfigurations)
# call the framework's mkDarwinConfiguration / mkNixosConfiguration constructors,
# which wire home-manager into the system config for you. The standalone
# homeConfigurations target is for a plain machine that is neither a nix-darwin
# nor a NixOS host (e.g. a stock Linux box) — it activates only the home layer.
# Keep the one you use and delete the rest.
#
# --impure nuance (darwin vs Linux/WSL):
# All three targets evaluate purely — no --impure on any platform. The
# framework's Linux-only extras (e.g. nix/home/wezterm-windows.nix) reach across
# the WSL boundary and fetch the Windows WezTerm binary at activation *runtime* —
# a `${pkgs.curl}` call inside a home.activation script, gated on
# `pkgs.stdenv.isLinux` — not during evaluation. No framework module reads the
# environment or fetches over the network at eval time, so `--impure` is not
# required. If you adapt this template and your own eval genuinely needs it,
# confirm first with `nix eval` (without `--impure`) against the target, and add
# the flag only if that eval actually fails.

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

  outputs = inputs@{ commons-systems, home-manager, ... }:
    {
      # macOS host (Apple Silicon). Switch with:
      #   darwin-rebuild switch --flake .#default
      # mkDarwinConfiguration wires home-manager into the nix-darwin system and
      # sets home.homeDirectory from the value below (no lib.mkForce needed).
      # Replace every placeholder with your own value.
      darwinConfigurations.default = commons-systems.mkDarwinConfiguration {
        username = "youruser";
        homeDirectory = "/Users/youruser";
        gitName = "Your Name";
        gitEmail = "you@example.com";
      };

      # WSL NixOS host. Switch with:
      #   sudo nixos-rebuild switch --flake .#nixos
      # mkNixosConfiguration derives the home directory as /home/<hostUser> from
      # the NixOS user, so there is no separate homeDirectory field here.
      nixosConfigurations.nixos = commons-systems.mkNixosConfiguration {
        hostUser = "youruser";
        gitName = "Your Name";
        gitEmail = "you@example.com";

        # Authorized SSH keys written to ~/.ssh/authorized_keys. The empty list
        # is authoritative and clears the file; set your real public keys if this
        # host runs sshd and should accept them:
        sshAuthorizedKeys = [
          # "ssh-ed25519 AAAA... you@host"
        ];

        # Dispatch capacity sampling (office-hours Capacity view) is per-machine
        # opt-in. Leave it disabled unless you run the dispatch chain and report
        # to an office-hours group, in which case set enable = true and supply
        # your groupId:
        dispatchUsageSamples = {
          enable = false;
          # groupId = "your-group";
        };
      };

      # Standalone home-manager (a machine that is neither a nix-darwin nor a
      # NixOS host). Switch with:
      #   home-manager switch -b backup --flake .#aarch64-darwin
      # The -b backup flag is required: a standalone homeConfigurations build has
      # no home.backupFileExtension equivalent, so without it the first
      # activation aborts on any pre-existing unmanaged file it wants to own
      # (e.g. ~/.zshrc). Change the system string (and the matching key + switch
      # command) if you are not on Apple Silicon.
      homeConfigurations."aarch64-darwin" = home-manager.lib.homeManagerConfiguration {
        # Build the fully-configured pkgs set from the framework's exported
        # helper. mkPkgs applies the claude-code-nix overlay (which pins
        # pkgs.claude-code to the sadjow fork used by
        # commons-systems.homeManagerModules.default), applies the direnv
        # test-skip, and allows claude-code as unfree. Recent nixpkgs ships its
        # own claude-code, so dropping the overlay would not fail eval — it would
        # silently swap in nixpkgs' build/version instead of the pinned fork. Use
        # mkPkgs; do not hand-roll `import nixpkgs { ... }` without the overlay.
        pkgs = commons-systems.mkPkgs { system = "aarch64-darwin"; };
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

            # Authorized SSH keys are optional. A standalone Mac
            # homeConfiguration usually has no inbound sshd, so the empty default
            # is a no-op; set real keys only if you run sshd:
            # services.sshAuthorizedKeys.keys = [ "ssh-ed25519 AAAA... you@host" ];

            # Dispatch capacity sampling is off by default; most forkers won't
            # want it. Enable it only if you run the dispatch chain and report to
            # an office-hours group:
            # services.dispatchUsageSamples.enable = true;
            # services.dispatchUsageSamples.groupId = "your-group";
          }
        ];
      };
    };
}
