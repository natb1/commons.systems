# office-hours-nate instance flake (template)

This directory is a copy-paste template for your private `office-hours-nate`
instance flake. The flake consumes the `commons.systems` framework as a flake
input and supplies the personal values (username, home directory, git identity,
ssh keys, dispatch group, host user) that the framework deliberately leaves
unset. The framework's own `flake.nix` carries only placeholder values so its CI
keeps building; your real machines live in this instance flake.

## Why this exists

Epic #2446 split the identity-free framework from the private instance. The
framework's home and git modules no longer carry any identity, and its
`flake.nix` no longer hardcodes the author's machines — it exposes
`mkDarwinConfiguration` / `mkNixosConfiguration` constructors instead and builds
its own `darwinConfigurations.default` / `nixosConfigurations.nixos` from
placeholder values. You keep your identity in your own instance flake, call
those constructors with your real values, and switch against that.

## Three build targets

`flake.nix` exposes one target per switch path. Keep the one(s) you use and
delete the rest:

| Target | Machine | Switch command |
| --- | --- | --- |
| `darwinConfigurations.default` | macOS host (nix-darwin) | `darwin-rebuild switch --flake .#default` |
| `nixosConfigurations.nixos` | WSL NixOS host | `sudo nixos-rebuild switch --flake .#nixos` |
| `homeConfigurations."aarch64-darwin"` | plain machine (neither nix-darwin nor NixOS) | `home-manager switch -b backup --flake .#aarch64-darwin` |

The two integrated host configs call the framework constructors, which wire
home-manager into the system config for you (`darwin-rebuild` /
`nixos-rebuild`). The standalone `homeConfigurations` target activates only the
home layer, for a machine that is neither a nix-darwin nor a NixOS host.

## Steps

1. Enable flakes before your first switch. These flakes need the `nix-command`
   and `flakes` experimental features, and nothing bootstraps them for you. Add
   to `~/.config/nix/nix.conf` (or export `NIX_CONFIG`):

       experimental-features = nix-command flakes

   Without this the first switch aborts with
   `error: experimental Nix feature 'nix-command' is disabled`.
2. Copy `flake.nix` into your private `office-hours-nate` repo.
3. Replace the placeholder values in the target(s) you keep: `youruser`,
   `/Users/youruser`, `Your Name`, `you@example.com`, and — on the NixOS
   target — your `sshAuthorizedKeys` and `dispatchUsageSamples` if you want
   them.
4. Switch:
   - macOS: `darwin-rebuild switch --flake .#default`
   - WSL NixOS: `sudo nixos-rebuild switch --flake .#nixos`
   - standalone: `home-manager switch -b backup --flake .#aarch64-darwin`
     (not on Apple Silicon? change the `system` string, the matching
     `homeConfigurations."<system>"` key, and the switch command).

   The integrated host configs set `home.backupFileExtension` for you, so a
   pre-existing unmanaged file is backed up (`.backup`) instead of aborting the
   switch. The standalone `homeConfigurations` build has no such setting, so its
   switch needs the `-b backup` flag — without it the first activation aborts on
   any pre-existing unmanaged file it wants to own (e.g. `~/.zshrc` or
   `~/.gitconfig`), leaving the profile half-updated.

## Home directory: passed on darwin, derived on NixOS

`mkDarwinConfiguration` takes an explicit `homeDirectory` (e.g.
`/Users/youruser`) and defines `users.users.<username>.home` from it on the
darwin side, so home-manager's derivation resolves without a `lib.mkForce`
override. `mkNixosConfiguration` takes no `homeDirectory` — the NixOS user's
home is `/home/<hostUser>`, and home-manager derives `home.homeDirectory` from
it automatically.

## Optional: authorized SSH keys

On the NixOS target, `sshAuthorizedKeys` is authoritative: it rewrites
`~/.ssh/authorized_keys` to exactly the keys you list, so the empty list clears
the file. Set your real public-key strings only if this host runs sshd and
should accept them. On the standalone home target,
`services.sshAuthorizedKeys.keys` defaults to `null` (a no-op); set it only if
that machine runs sshd.

## Optional: dispatch capacity sampling

On the NixOS target, `dispatchUsageSamples` is per-machine opt-in. Leave
`enable = false` unless you run the dispatch chain and report capacity to an
office-hours group, in which case set `enable = true` and supply your `groupId`.

## --impure (not required on any platform)

All three targets evaluate purely — no `--impure` on macOS, Linux, or WSL. The
framework's Linux-only extras (e.g. `nix/home/wezterm-windows.nix`) reach across
the WSL boundary and fetch the Windows WezTerm binary at activation *runtime* — a
`${pkgs.curl}` call inside a `home.activation` script, gated on
`pkgs.stdenv.isLinux` — not during evaluation. No framework module reads the
environment or fetches over the network at eval time, so `--impure` is not
required. If you adapt this template and your own eval genuinely needs it,
confirm first with `nix eval` (without `--impure`) against the target, and add
the flag only if that eval actually fails.

## Do not strip the claude-code overlay

The standalone home target builds `pkgs` via
`commons-systems.mkPkgs { inherit system; }`, which applies the claude-code-nix
overlay for you. (The two integrated host configs get the overlay from the
constructors, so they need no `pkgs` argument at all.) The framework's
`homeManagerModules.default` installs `pkgs.claude-code`. Don't replace `mkPkgs`
with a hand-rolled `import nixpkgs { ... }` that omits the overlay. Recent
nixpkgs ships its own `claude-code` derivation, so eval will *succeed* without
the overlay — but it silently swaps in nixpkgs' build/version instead of the
pinned sadjow fork (`claude-code-nix`), which tracks upstream releases hourly
(see `nix/home/claude-code.nix`). Use `mkPkgs`; it already carries the overlay
for you.
