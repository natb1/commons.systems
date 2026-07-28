# office-hours-nate instance flake (template)

This directory is a copy-paste template for your private `office-hours-nate`
instance flake. The flake consumes the `commons.systems` framework as a flake
input and supplies the personal values (username, home directory, git identity,
ssh keys, dispatch group, host user) that the framework deliberately leaves
unset. The framework's own `flake.nix` carries only placeholder values so its CI
keeps building; your real machines live in this instance flake.

## Why this exists

The framework and the instance are deliberately split: `commons.systems` is
identity-free, and every personal value lives in a private instance flake like
this one. The framework's home and git modules carry no identity, and its
`flake.nix` hardcodes nobody's machines — it exposes `mkDarwinConfiguration` /
`mkNixosConfiguration` constructors instead and builds its own
`darwinConfigurations.default` / `nixosConfigurations.nixos` from placeholder
values so its CI keeps compiling. You keep your identity in your own instance
flake, call those constructors with your real values, and switch against that.

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

## Constructor arguments

Everything the framework needs from you is passed here. You should not have to
read the framework's source to fill these in.

### `mkDarwinConfiguration { ... }`

Takes one attrset. All four fields are required; omitting one fails evaluation
with a missing-attribute error.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `username` | string | yes | macOS account name; also the home-manager user |
| `homeDirectory` | string (absolute path) | yes | that account's home, e.g. `/Users/youruser` |
| `gitName` | string | yes | `git config user.name` |
| `gitEmail` | string | yes | `git config user.email` |

### `mkNixosConfiguration { ... }`

Takes one attrset. All five fields are required — the two "optional" features
are opted *out of* by passing their neutral value (`[ ]`, `enable = false`), not
by omitting the field.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `hostUser` | string | yes | NixOS system user: `wsl.defaultUser`, `users.users.<name>`, and the office-hours producer user. Also the home-manager user. There is **no** `homeDirectory` field — see below |
| `gitName` | string | yes | `git config user.name` |
| `gitEmail` | string | yes | `git config user.email` |
| `sshAuthorizedKeys` | list of strings | yes | public-key lines written to `~/.ssh/authorized_keys`. `[ ]` means none — and is authoritative, see "Optional: authorized SSH keys" |
| `dispatchUsageSamples` | attrset `{ enable; groupId? }` | yes | capacity sampler. `enable` is a bool; `groupId` is a string that is required if and only if `enable = true`, and must be omitted otherwise |

### `mkPkgs { system = "<system>"; }`

Only the standalone `homeConfigurations` target needs this — it returns the
nixpkgs set with the framework's overlays applied. The two integrated host
configs get it from the constructors and take no `pkgs` argument. See "Do not
strip the claude-code overlay".

## Steps

1. Enable flakes before your first switch. These flakes need the `nix-command`
   and `flakes` experimental features, and nothing bootstraps them for you. Add
   to `~/.config/nix/nix.conf` (or export `NIX_CONFIG`):

       experimental-features = nix-command flakes

   Without this the first switch aborts with
   `error: experimental Nix feature 'nix-command' is disabled`.
2. Copy `flake.nix` into your private `office-hours-nate` repo.
3. `git add flake.nix`, and commit it. In a git repo, Nix flakes see only
   git-tracked files: an untracked `flake.nix` is invisible to the evaluator, so
   the first switch fails with a confusing path/`does not provide attribute`
   error rather than an obvious "you forgot to add it". Staging is enough —
   later uncommitted edits to a tracked file are picked up — but committing
   avoids the same trap on any file you add next.
4. Replace the placeholder values in the target(s) you keep. Which field to edit
   depends on the target; the field names are **not** the same across all three:
   - `darwinConfigurations.default` — set `username` (the macOS account, e.g.
     `youruser`), `homeDirectory` (its absolute path, e.g. `/Users/youruser`),
     `gitName`, and `gitEmail`.
   - `nixosConfigurations.nixos` — set `hostUser` (a *different field name*, not
     `username`), `gitName`, and `gitEmail`. There is no `homeDirectory` here;
     it is derived. Also set `sshAuthorizedKeys` and `dispatchUsageSamples` if
     you want them.
   - `homeConfigurations."<system>"` — this target takes no constructor attrset.
     Set the values inside its `modules` list instead: `home.username`,
     `home.homeDirectory`, `programs.git.settings.user.name`, and
     `programs.git.settings.user.email`.
5. Optional — if you forked `commons.systems` rather than consuming it upstream,
   repoint the `commons-systems` input `url` (`github:natb1/commons.systems`) at
   your own fork, e.g. `github:youruser/commons.systems`. Leaving it on upstream
   is the default and is fine; you only need this if you intend to carry your own
   framework changes.
6. Switch:
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

## Home directory: you supply it on darwin, not on NixOS

On the darwin target you supply `homeDirectory` yourself (e.g.
`/Users/youruser`), because macOS home paths are not predictable from the
account name — nix-darwin does not define the account, so nothing can infer it.

On the NixOS target you supply nothing: the home directory is always
`/home/<hostUser>`, so passing `hostUser` is enough and there is no
`homeDirectory` field to set. (Mechanically, `mkDarwinConfiguration` defines
`users.users.<username>.home` from the value you pass, which lets home-manager
derive `home.homeDirectory` the same way it does on NixOS — no `lib.mkForce`
override on either side.)

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
