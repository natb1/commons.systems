---
id: tactic-nix-fullsystem-instance-split
kind: tactic
statement: "Finish the nix framework/instance split for the full-system layer:
  export a reusable identity-free nixosModules.default, relocate the operator's
  real NixOS-WSL / nix-darwin system configs out of the public flake into a
  private office-hours-nate instance, preserve CI's full-system build coverage,
  and retire the darwin lib.mkForce identity workaround."
owner: human
status: codified
parent: null
rationale: "Migrated 2026-07-06 from GitHub issue #2446 (the nix personalization
  epic), which was closed not-planned with its residual tracked here. The epic's
  home-manager layer reached the greenfield framework/instance split
  (identity-free nix/home + nix/darwin modules, a working
  examples/office-hours-nate instance template, a zero-edit forker path); the
  full-system (NixOS-WSL / nix-darwin) layer did not. Born-parked because the
  remaining work needs the owner to ratify several design decisions
  (nixosModules scope, CI full-system coverage, the mkForce/criterion
  resolution) and to execute the operator-machine relocation, before it can be
  decomposed into claude-implementable tactics. Edge recorded 2026-07-09: the
  statement's first clause (export a reusable identity-free
  nixosModules.default) is owned by tactic-nix-export-nixos-modules — this
  tactic is blocked_by it and builds the relocation and CI coverage on the
  exported module rather than re-implementing the export."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-nix-export-nixos-modules
office_hours:
  reason: Needs owner design ratification (nixosModules.default scope, CI
    full-system build coverage once the real instance leaves the public repo,
    and the darwin mkForce / criterion-4 resolution) plus owner execution of the
    operator-machine relocation to a private office-hours-nate repo. Not
    claude-decidable or claude-executable as-is; once ratified, /align-tactics
    decomposes it into implement-ready tactics.
  since: 2026-07-06
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Finish the nix framework/instance split for the full-system layer

## Context

Migrated 2026-07-06 from GitHub issue #2446 (the nix personalization epic),
closed not-planned with its residual tracked here. The epic aimed to turn
`commons.systems` into an identity-free forkable framework, with a private
`office-hours-nate` instance flake holding the operator's personal values.

**What shipped (the home-manager layer reached greenfield).** The reusable
modules carry zero personal defaults: `nix/home/**` and `nix/darwin/**` are
identity-free (username, home dir, git identity, ssh keys, dispatch group id are
all unset options or throw-if-unset). `flake.nix` exports
`homeManagerModules.default` and `darwinModules.default`. A complete
copy-paste instance template exists at `examples/office-hours-nate/flake.nix`
(imports `commons.systems` as a flake input, sets placeholder identity, switches
purely with no `--impure`). A forker copies that template into their own repo,
replaces four placeholders, and runs `home-manager switch` — never editing
`commons.systems`. That forker path is the epic's central value and it works.

**What did not ship (the full-system layer).** The operator's real NixOS-WSL and
nix-darwin *system* configs still live in the public framework `flake.nix` and
still hardcode personal values:

- `nixosConfigurations.nixos` and `darwinConfigurations.default` are defined in
  `flake.nix` (~`flake.nix:173-249`) and embed real identity via the inline
  instance module: `instance.hostUser = "n8"` (~`:220`), git name/email, ssh
  pubkeys (~`:236-239`), `services.dispatchUsageSamples.groupId` (~`:241`).
  In-file comments relabel these blocks as "this office-hours-nate instance", but
  they physically live in the public repo — so a fresh fork of the *system*
  config still builds Nathan's identity.
- No reusable `nixosModules.default` is exported — deliberately deferred at
  `flake.nix:121-130` ("a larger step ... out of scope here"). Only home-manager
  and darwin modules are reusable; the NixOS/WSL layer is not.
- The darwin `home.username = lib.mkForce "n8"` identity workaround remains in
  `mkIntegratedHmConfig` (~`flake.nix:150-169`). `--impure`/`getEnv` is gone, but
  the mkForce is now load-bearing for a *different* reason (darwin's
  `nixos/common.nix` derives `homeDirectory` as null); "darwin CI fails without
  it" per the in-file comment.

This is a coherent intermediate waypoint, not a defect: the sub-issues
consciously deferred the full-system extraction. Per
`.claude/rules/design-proposals.md` the greenfield target still stands unless the
owner intentionally relaxes it — closing #2446 and tracking the residual here is
that decision to keep the target and finish it in the graph.

## Remaining greenfield work (the target end state)

1. **Export a reusable, identity-free `nixosModules.default`** — a parameterized
   version of `nix/nixos/**` with typed options (no personal defaults;
   throw-if-unset per `.claude/rules/code-style.md`), added to `flake.nix`'s
   module exports (the `inherit ... nixosModules` at `flake.nix:251-252`),
   mirroring `homeManagerModules.default` / `darwinModules.default`.
2. **Relocate the operator's real system configs** — move
   `nixosConfigurations.nixos` / `darwinConfigurations.default` (real identity,
   ssh keys, group id, host user) out of the public `flake.nix` into the private
   `office-hours-nate` repo, which imports `commons.systems` and sets the values.
   Requires the owner to stand up that private full-system instance and switch
   the real WSL and Darwin machines against it.
3. **Preserve CI's full-system build coverage** — CI today builds
   `nixosConfigurations.nixos` and `darwinConfigurations.default` end-to-end
   (`.github/scripts/build-nixos-config.sh`, `build-darwin-config.sh`, gated in
   `.github/workflows/unit-tests.yml`). The existing `examples/office-hours-nate`
   template is a *standalone home-manager* config only — it does not exercise a
   full nixosSystem/darwinSystem. Once the real instance leaves the public repo,
   CI needs a placeholder full-system example (fake identity) to keep that
   coverage, or an explicit decision to accept reduced coverage.
4. **Retire the darwin `lib.mkForce` identity workaround** — fix the darwin
   null-`homeDirectory` derivation properly so the mkForce can be dropped, OR
   ratify epic #2446 criterion 4 as mis-specified (the mkForce is a legitimate
   module-system artifact of the integrated path, not the impurity artifact the
   criterion assumed; the clean standalone template needs no mkForce).

## Design decisions the owner must ratify before decomposition

These are why this tactic is born-parked rather than an implement-ready plan.
Each shapes the forkable framework's public surface and is not claude-decidable:

- **`nixosModules.default` scope** — a *generic* NixOS module (factor
  `nixos-wsl` into an optional layer) versus a *WSL-host* module (WSL coupling
  baked in). `wsl.enable`/`wsl.defaultUser` and `nixos-wsl.nixosModules.default`
  are currently hardcoded (`nix/nixos/configuration.nix:36-37`, `flake.nix:208`).
- **Overlay wiring** — the claude-code overlay reaches the config today via
  `mkIntegratedHmConfig` (`flake.nix:150-151`), not the nixos modules
  themselves. Decide whether the exported module bundles the overlay/allowUnfree
  wiring or documents it as a prerequisite (as `homeManagerModules.default` does
  at `flake.nix:113-119`).
- **Host-specific option surface** — which of these become instance options vs
  module defaults: `time.timeZone` (`configuration.nix:103`, also duplicated at
  `nix/darwin/default.nix:11`), `system.stateVersion` (`configuration.nix:57`),
  `services.avahi` mDNS (`:69-80`), `mounts.nix`'s hardcoded `uid=1000`/`gid=100`
  (`nix/nixos/mounts.nix:47-48`), and the opinionated `users.users.<host>`
  `extraGroups`/`linger`/shell defaults (`configuration.nix:86-90`).
- **CI coverage approach** — placeholder full-system example vs reduced coverage
  (item 3 above).
- **mkForce / criterion-4** — fix vs ratify-as-mis-specified (item 4 above).

## Reuse / grounding

- Existing module-export pattern: `flake.nix:131-132` (home + darwin), re-export
  at `flake.nix:251-252`.
- The instance-option pattern to generalize: `instance.hostUser` declared at
  `nix/nixos/host-user.nix:3-10` (str, no default → throws when unset),
  consumed at `configuration.nix:22,37,47,83-85`.
- Cleanest typed-option module to mirror for house style:
  `nix/nixos/office-hours.nix:71-111` (mkEnableOption + no-default str + `mkIf
  cfg.enable`, forkability contract in the header).
- Instance template shape: `examples/office-hours-nate/flake.nix`.
- CI full-system builds: `.github/scripts/build-nixos-config.sh`,
  `.github/scripts/build-darwin-config.sh`, invoked from
  `.github/workflows/unit-tests.yml` (`nixos-build` / `darwin-build` jobs, gated
  on `nix` changes; no `--impure`).

## Path forward

Once the owner ratifies the design decisions above (via office-hours or an
`/align-strategy` refinement of `strategy-distribute-workflow`), run
`/align-tactics strategy-distribute-workflow` to decompose this into
implement-ready tactics (e.g. an `owner: ai` `nixosModules.default` export tactic
carrying a full plan, blocking an `owner: human` operator-machine relocation
tactic). The verification-only sibling
`tactic-mainqa-instance-flake-personalization` covers real-machine QA of the
personalization that already shipped and is separate from this extraction work.
