---
id: tactic-nix-host-option-surface
kind: tactic
statement: "Parameterize the host-specific option surface of the NixOS framework
  layer on the ratified three-tier rule: throw-if-unset for values that are
  silently wrong for another operator (system.stateVersion, mounts.nix uid/gid),
  a defaulted deduped option for time.timeZone, and plain module defaults for
  the framework's opinionated product surface"
owner: ai
status: codified
parent: null
rationale: "Successor to tactic-nix-fullsystem-instance-split, retired
  2026-07-30 after an office-hours ratification tick found three of its four
  parked design questions already resolved (nixosModules.default scope merged
  via tactic-nix-export-nixos-modules; CI placeholder coverage and the darwin
  mkForce removal in flight on PR #2848 / tactic-nix-instance-flake-extraction).
  The host-specific option surface was the one genuinely open question; the
  author ratified the three-tier proposal on 2026-07-30. This node carries that
  decision and its two-step migration. Blocked_by
  tactic-nix-instance-flake-extraction because PR #2848 rewrites the same
  flake.nix host-config region into mkDarwinConfiguration / mkNixosConfiguration
  constructors; landing option work first would conflict."
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
  - tactic-nix-instance-flake-extraction
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Parameterize the host-specific option surface of the NixOS framework layer

## Context

`commons.systems` is a forkable framework: the reusable modules carry no
identity, and every personal value lives in a private instance flake. The
home-manager and darwin layers reached that target; the NixOS full-system layer
was finished in two pieces — `tactic-nix-export-nixos-modules` (exported
`nixosModules.default`, merged) and `tactic-nix-instance-flake-extraction`
(moves the operator's real values out of `flake.nix` behind
`mkDarwinConfiguration` / `mkNixosConfiguration` constructors, PR #2848, in
flight).

What neither piece touched is the **host-specific option surface**: values baked
into `nix/nixos/configuration.nix` and `nix/nixos/mounts.nix` that are not
identity but are still specific to one machine. An office-hours ratification tick
on 2026-07-30 put the question to the author, who ratified the three-tier rule
below.

### The ratified rule (author, 2026-07-30)

Nix's module system already lets any consumer override any default for free. So
promoting a setting to a typed instance option only buys something when the
default is **silently wrong** for another operator, or when leaving it unset
**should fail loudly** (per `.claude/rules/code-style.md`, "prefer clear errors
over defensive fallbacks"). That yields three tiers:

**Tier 1 — throw-if-unset** (silently wrong for anyone else). Mirror the
`instance.hostUser` pattern at `nix/nixos/host-user.nix:3-10` (typed `str`, no
default, so eval throws when unset):

- `system.stateVersion` (`nix/nixos/configuration.nix:57`, currently `"23.11"`)
  — this is the operator's first-install release. A forker installing in 2026
  silently inherits stale stateful defaults.
- `nix/nixos/mounts.nix` `uid=1000` / `gid=100` (`mounts.nix:47-48`) — worse
  than merely wrong: they are strings inside a `fileSystems."/mnt/g".options`
  list, so a consumer cannot override them without redefining the entire
  `fileSystems."/mnt/g"` attrset. Derive them from the host user rather than
  hardcoding.

**Tier 2 — defaulted option**: `time.timeZone`. Personal but harmless, and
currently **duplicated** at `nix/nixos/configuration.nix:103` and
`nix/darwin/default.nix:11`. Give it a default and collapse the two sites to one
source.

**Tier 3 — leave as plain module defaults** (these *are* the framework's
product; a forker adopting `commons.systems` wants the dispatch-capable box):
`services.avahi` (`configuration.nix:69-80`), `services.openssh`
(`:60-66`), `virtualisation.docker` (`:97`), `programs.zsh` /
`users.defaultUserShell`, `environment.variables.EDITOR` (`:99`), and the
`users.users.<hostUser>` `extraGroups` / `linger` / `shell` block (`:86-90`).
Document them in the module header per the existing forkability contract; add
`mkEnableOption` gates only where turning one off is plausible.

## Dependencies

`tactic-nix-instance-flake-extraction` (PR #2848) must land first. It rewrites
the same `flake.nix` host-config region into the `mkDarwinConfiguration` /
`mkNixosConfiguration` constructors and adds `placeholderInstance`. Any new
instance option added here has to be threaded through those constructors and
through `placeholderInstance`, so doing this work first would guarantee a
conflict. Re-read that PR's final shape at implement time — this plan anchors on
the post-#2848 contract, not on today's `flake.nix` line numbers.

## Migration path (two steps — the split is load-bearing)

This is deliberately two units because Tier 1 is **backwards-incompatible**: a
no-default option breaks every consumer that has not yet supplied it, including
the framework's own CI. Per `.claude/rules/design-proposals.md` the greenfield
target is the three tiers above; this is the sequencing that reaches it without
a red `nixos-build` in between.

### Unit 1 — add every option WITH a default (non-breaking)

**Recommended model:** sonnet

Implement in a subagent (Agent tool, `model: sonnet`), working-tree edits only.

Scope:

- `nix/nixos/configuration.nix`: declare `system.stateVersion` as an
  `instance.*` option whose default is the current `"23.11"`; declare the Tier-2
  `time.timeZone` option with the current `"America/New_York"` default.
- `nix/darwin/default.nix:11`: consume the same Tier-2 timezone option instead
  of repeating the literal — one source, two consumers.
- `nix/nixos/mounts.nix:47-48`: derive `uid` / `gid` from the host user rather
  than the hardcoded `1000` / `100`, keeping the present values as the resolved
  default for the existing host user.
- Thread each new option through `mkNixosConfiguration` / `mkDarwinConfiguration`
  and give it a value in `placeholderInstance` (both in `flake.nix`, as landed
  by #2848).
- Mirror the new option shape in `examples/office-hours-nate/flake.nix` with
  placeholder values, and document each option in its module header per the
  existing forkability contract.
- Out of scope: every Tier-3 setting listed above; any `nix/home/**` change.

### Unit 2 — flip the two Tier-1 values to no-default/throw (breaking)

**Recommended model:** sonnet

Depends on: Unit 1, **and** on `tactic-nix-operator-machine-cutover` having
supplied these values in the private instance flake. Flipping before the private
instance sets them breaks the operator's own switch.

Implement in a subagent (Agent tool, `model: sonnet`), working-tree edits only.

Scope: remove the defaults from the Tier-1 options only (`system.stateVersion`
and the `mounts.nix` uid/gid derivation source), so an unset value throws at eval
time exactly as `instance.hostUser` does. `placeholderInstance` and the
`examples/office-hours-nate` template must supply them explicitly — that is what
keeps CI green after the flip.

Tier 2 keeps its default. Tier 3 is untouched.

## Reuse

- Throw-if-unset option pattern: `nix/nixos/host-user.nix:3-10` (typed `str`,
  no default), consumed at `nix/nixos/configuration.nix:22,37,47,83-85`.
- House style for a typed option module: `nix/nixos/office-hours.nix:71-111`
  (`mkEnableOption` + no-default `str` + `mkIf cfg.enable`, with the forkability
  contract stated in the module header).
- Constructor + placeholder threading point: `mkNixosConfiguration`,
  `mkDarwinConfiguration`, and `placeholderInstance` in `flake.nix` (added by
  PR #2848).
- Instance template to mirror: `examples/office-hours-nate/flake.nix`.

## Verification

The authoritative gate is CI `nixos-build` + `darwin-build` green on the PR —
these build `nixosConfigurations.nixos` and `darwinConfigurations.default`
end-to-end from `placeholderInstance`. Note that plan-verification greps
false-fail on nix personalization checks; trust the `nix-build` jobs, not a grep.

```verify
.github/scripts/build-nixos-config.sh
```

```verify
.github/scripts/build-darwin-config.sh
```

After Unit 2, the throw must actually fire. Manual check (judgment, not
auto-runnable): evaluate a host config with the Tier-1 options omitted and
confirm eval fails with a clear missing-option error rather than silently
building — the same failure shape `instance.hostUser` produces today.

## Completion

Both units merged with CI green → `phase: done`.
