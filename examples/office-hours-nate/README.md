# office-hours-nate instance flake (template)

This directory is a copy-paste template for your private `office-hours-nate`
instance flake. The flake consumes the `commons.systems` framework as a flake
input and supplies the home identity (username, home directory, git
name/email) that the framework deliberately leaves unset.

## Why this exists

Issue #2448 (epic #2446) split the identity-free framework from the private
instance. The framework used to ship an in-repo `default` entry point you could switch
against directly with `home-manager switch`. That entry point has been removed.
The framework's home and git modules no longer carry
any identity, so a `home-manager switch` against the framework alone now throws
on the unset `home.username`/`home.homeDirectory` and on the git identity
assertion. You keep your identity in your own instance flake and switch against
that instead.

## Steps

1. Copy `flake.nix` into your private `office-hours-nate` repo.
2. Replace the placeholder identity: `youruser`, `/Users/youruser`,
   `Your Name`, `you@example.com`.
3. If you are not on Apple Silicon, change `system` (and the matching
   `homeConfigurations."<system>"` key and the switch command) to your system.
4. Run the pure switch:

       home-manager switch --flake .#aarch64-darwin

   On darwin this evaluates purely — no `--impure` needed.

## --impure caveat (Linux/WSL)

The darwin path above is pure. A Linux or WSL instance still needs `--impure`,
because the framework's `nix/home/wezterm-windows.nix` calls
`builtins.fetchurl`, forced only on Linux via `lib.mkIf pkgs.stdenv.isLinux`.
If you adapt this template to Linux, keep `--impure` on the switch command.

## Do not strip the claude-code overlay

The template builds `pkgs` with `claude-code-nix.overlays.default` applied. The
framework's `homeManagerModules.default` installs `pkgs.claude-code`, which only
exists when that overlay is present. Remove it and eval fails with
`attribute 'claude-code' missing in set`. The template already wires it; leave
it in place.
