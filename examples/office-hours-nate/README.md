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

1. Enable flakes before your first switch. This standalone flake needs the
   `nix-command` and `flakes` experimental features, and nothing bootstraps them
   for you. Add to `~/.config/nix/nix.conf` (or export `NIX_CONFIG`):

       experimental-features = nix-command flakes

   Without this the first switch aborts with
   `error: experimental Nix feature 'nix-command' is disabled`.
2. Copy `flake.nix` into your private `office-hours-nate` repo.
3. Replace the placeholder identity: `youruser`, `/Users/youruser`,
   `Your Name`, `you@example.com`.
4. If you are not on Apple Silicon, change `system` (and the matching
   `homeConfigurations."<system>"` key and the switch command) to your system.
5. Run the pure switch:

       home-manager switch -b backup --flake .#aarch64-darwin

   On darwin this evaluates purely — no `--impure` needed. The `-b backup` flag
   is required: this standalone `homeConfigurations` build has no
   `home.backupFileExtension` equivalent, so without it the first activation
   aborts mid-run on any pre-existing unmanaged file it wants to own (e.g.
   `~/.zshrc` or `~/.gitconfig`), leaving the profile half-updated.

## Optional: authorized SSH keys

`services.sshAuthorizedKeys.keys` defaults to `[]` (a no-op); set it to your
public-key strings only if this machine runs sshd and should accept them.

## --impure (not required on any platform)

The darwin path above is pure, and a Linux or WSL instance is too. The
framework's Linux-only extras (e.g. `nix/home/wezterm-windows.nix`) reach across
the WSL boundary and fetch the Windows WezTerm binary at activation *runtime* — a
`${pkgs.curl}` call inside a `home.activation` script, gated on
`pkgs.stdenv.isLinux` — not during evaluation. No framework module reads the
environment or fetches over the network at eval time, so `--impure` is not
required. If you adapt this template and your own eval genuinely needs it,
confirm first with `nix eval` (without `--impure`) against your
homeConfiguration, and add the flag only if that eval actually fails.

## Do not strip the claude-code overlay

The template builds `pkgs` with `claude-code-nix.overlays.default` applied. The
framework's `homeManagerModules.default` installs `pkgs.claude-code`, which only
exists when that overlay is present. Remove it and eval fails with
`attribute 'claude-code' missing in set`. The template already wires it; leave
it in place.
