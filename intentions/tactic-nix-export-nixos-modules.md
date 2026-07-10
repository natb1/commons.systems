---
id: tactic-nix-export-nixos-modules
kind: tactic
statement: Export a reusable nixosModules.default from the flake — the
  framework/instance step deliberately deferred at flake.nix:126-130
owner: ai
status: codified
parent: null
rationale: Residual greenfield work from gh epic 2446 (nix framework/instance
  split), recorded 2026-07-06 when the epic's owner chose to finish the
  greenfield target rather than relax it. The flake exports homeManagerModules
  and darwinModules but explicitly defers a reusable nixosModules.default;
  without it a forker cannot build a NixOS host from the framework and the
  instance-flake extraction (tactic-nix-instance-flake-extraction) has nothing
  to import.
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: fix
execution:
  branch: tactic-nix-export-nixos-modules
  pr: 2834
  attempts: {}
  markers: []
  strategy_fingerprint: ad890cb118eee6d8398f7432525d7de820443b52bbfa6f058262157d6d07214d
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Export a reusable nixosModules.default from the flake — the framework/instance step deliberately deferred at flake.nix:126-130

## Context

Residual greenfield work from gh epic 2446 (nix framework/instance split;
sub-issues 2447-2450 all merged). The flake exports `homeManagerModules =
{ default = ./nix/home/default.nix; }` and `darwinModules = { default =
./nix/darwin/default.nix; }` (flake.nix:131-132) but the comment block at
flake.nix:126-130 explicitly defers a reusable `nixosModules.default`:
"exporting a reusable module — with the claude-code overlay threaded through
and full instance parameterization (wsl.* and the rest) — is a larger step,
deliberately deferred". Without this export a forker cannot build a NixOS
host from the framework, and `tactic-nix-instance-flake-extraction` (which
moves the author's `nixosConfigurations.nixos` out of the framework flake)
has nothing for the private instance flake to import.

The NixOS framework modules already exist and are identity-parameterized:
`nix/nixos/configuration.nix` reads `config.instance.hostUser` (option
defined in `nix/nixos/host-user.nix`, a typed `str` with no default), and
`nix/nixos/mounts.nix` is de-personalized. What is missing is only the flake
output that composes them for an external consumer.

## Unit 1 — export nixosModules.default

**Recommended model:** opus

Implement in a subagent (Agent tool, `model: opus`, working-tree edits only),
passing this unit's context and scope in the prompt.

Scope:
- `flake.nix` (~line 126-132): add `nixosModules = { default = ...; };`
  beside the existing `homeManagerModules` / `darwinModules` exports, and add
  `nixosModules` to the `inherit` list in the final outputs attrset
  (flake.nix:252).
- The exported module should compose the framework's NixOS layer:
  `./nix/nixos/configuration.nix` (which itself imports `host-user.nix` and
  `mounts.nix` — verify its imports list and export whichever composition
  makes each module reachable). Keep it a bare-path module export like the
  other two if possible (no inputs threading); if `configuration.nix`
  references flake inputs (e.g. nixos-wsl), document in the export comment
  what the consumer must supply (nixos-wsl module, overlay) — mirroring the
  overlay-prerequisite comment style used for `homeManagerModules` at
  flake.nix:113-119.
- Update the deferral comment at flake.nix:126-130 to describe the now-real
  export instead of deferring it.
- Rewire `nixosConfigurations.nixos` (flake.nix:205+) to consume the new
  export instead of importing `./nix/nixos/configuration.nix` directly, so
  the in-repo config exercises the same entry point a forker uses.
- Out of scope: moving personal values out of flake.nix (that is
  `tactic-nix-instance-flake-extraction`); any change to what the NixOS
  modules configure.

Reuse: the existing module-export pattern at flake.nix:131-132 and the
overlay-prerequisite comment at flake.nix:113-119.

## Verification

```verify
nix flake check --no-build 2>&1 | tail -5
```

```verify
grep -n 'nixosModules' flake.nix
```

The grep must show a `nixosModules` definition beside `homeManagerModules`
and its presence in the final outputs `inherit`. The authoritative build
gate is CI `nixos-build` (`nix build
.#nixosConfigurations.nixos.config.system.build.toplevel`) and
`darwin-build`, which fire on any `nix/` or `flake.nix` change
(.github/workflows/unit-tests.yml:332,359). If `nix flake check --no-build`
is unavailable in the local sandbox, rely on CI — do not weaken the check.

## Completion

Merged to main with CI green → `phase: done` (prune the node).
`tactic-nix-instance-flake-extraction` is `blocked_by` this tactic and
becomes selectable when this node is pruned.
