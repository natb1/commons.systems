---
id: tactic-nix-operator-machine-cutover
kind: tactic
statement: Stand up the private office-hours-nate full-system instance flake
  with the operator's real values and switch the real WSL NixOS and nix-darwin
  machines against it, retiring the public repo as the operator's switch target
owner: human
status: codified
parent: null
rationale: "Successor to tactic-nix-fullsystem-instance-split, retired
  2026-07-30. This is the owner-execution half of that node: it needs a private
  repo, real ssh keys and git identity, and physical switches of two real
  machines, none of which is autonomously executable or autonomously verifiable.
  Verified 2026-07-30 during the office-hours tick:
  /home/n8/natb1/office-hours-nate EXISTS but is a stale QA harness for issue
  #2479 (2 commits, last 2026-06-29, outputs named .qa, supplies no identity at
  all), NOT a working instance flake — so the full cutover is still owed, not a
  narrowed residual. Follows the tactic-mainqa-instance-flake-personalization
  pattern that tactic-nix-instance-flake-extraction's own completion criteria
  call for."
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
blocked_by: []
office_hours:
  reason: "Owner execution, not claude-executable: requires a private repo the
    fleet cannot write, the operator's real ssh public keys and git identity,
    and physical `nixos-rebuild switch` / `darwin-rebuild switch` runs on the
    real WSL and Darwin machines. Verified 2026-07-30 that
    /home/n8/natb1/office-hours-nate is a stale #2479 QA harness, not a working
    instance flake, so the whole cutover is owed. Sequencing hazard:
    nix/nixos/configuration.nix:5 documents the operator switching against THIS
    repo (`sudo nixos-rebuild switch --flake .#nixos`); once PR #2848 lands,
    that target builds placeholderInstance, so the operator's machines cannot
    pick up their real identity from the public repo any more."
  since: 2026-07-30
  recommendation: "Do the private-repo setup while PR #2848 is still red on
    nixos-build: copy examples/office-hours-nate/flake.nix from that PR into
    github.com/natb1/office-hours-nate (overwriting the stale #2479 QA harness),
    fill in the real
    username/homeDirectory/gitName/gitEmail/hostUser/sshAuthorizedKeys/dispatch\
    UsageSamples, switch both machines from it, and confirm `git log` identity
    and ssh access still work. That closes the window with zero downtime."
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---

# Stand up the private office-hours-nate instance and switch the real machines

## Context

`commons.systems` is a forkable framework; the operator's personal values are
meant to live in a private `office-hours-nate` instance flake that consumes it.
`tactic-nix-instance-flake-extraction` (PR #2848) delivers the framework side:
it replaces the operator's real identity in `flake.nix` with a
`placeholderInstance` and exposes `mkDarwinConfiguration` /
`mkNixosConfiguration` constructors for an instance flake to call.

The other side — creating that private instance with the real values and
switching the real machines onto it — is owner work. It needs a private repo the
fleet cannot write, the operator's real ssh public keys and git identity, and
physical `nixos-rebuild switch` / `darwin-rebuild switch` runs on the WSL and
Darwin hosts. None of it is autonomously executable, and the outcome (the
machines still work, `git log` shows the right identity, ssh still admits the
right keys) is not autonomously verifiable. This follows the
`tactic-mainqa-instance-flake-personalization` pattern that
`tactic-nix-instance-flake-extraction`'s own completion criteria call for.

## State of the private repo, verified 2026-07-30 (untrusted-read summary)

An office-hours tick was told the private repo already existed and the cutover
was therefore defused. **It is not.** `/home/n8/natb1/office-hours-nate` exists
on the operator's disk and has a real git remote
(`https://github.com/natb1/office-hours-nate.git`), but it is **a stale QA
harness, not a working instance flake**:

- Its own `description` reads `QA consumer flake for #2479 — imports
  commons.systems module outputs`.
- Its outputs are named `.qa` — `nixosConfigurations.qa`,
  `darwinConfigurations.qa`, `homeConfigurations.qa` — not the real machine
  targets.
- It supplies **no identity whatsoever**: no `username`, `homeDirectory`,
  `gitName`/`gitEmail`, `hostUser`, `sshAuthorizedKeys`, or
  `dispatchUsageSamples`. It only imports the bare module outputs to confirm
  they resolve.
- `nixosConfigurations.qa` imports `commons.nixosModules.default` *without*
  `nixos-wsl.nixosModules.default` and *without* `instance.hostUser` — the two
  prerequisites documented at `flake.nix:131-142` — so it would fail eval today.
- 2 commits, both #2479 QA-harness commits, last dated 2026-06-29, pinned to
  `nixpkgs-24.11` and older home-manager revisions.

So the whole cutover is owed, not a narrowed residual.

## Sequencing hazard

`nix/nixos/configuration.nix:5` documents the operator switching against **this
public repo**: `sudo nixos-rebuild switch --flake .#nixos`. Once PR #2848 lands,
that target builds `placeholderInstance` (`username = "operator"`,
`sshAuthorizedKeys = [ ]`, `dispatchUsageSamples.enable = false`), so the
operator's machines can no longer pick up their real identity from the public
repo.

This cutover now mechanically gates that merge: as of 2026-07-30
`tactic-nix-instance-flake-extraction` is `blocked_by` this node, so #2848
cannot land until the real private instance exists. The author added that gate
after an office-hours tick verified their earlier assumption was wrong (the
private repo was a stale #2479 QA harness, not a working instance flake). As of
2026-07-30 #2848 is also red on `nixos-build`
(`unit-home-manager-operator.service.drv`, label
`dispatch:qa-fix-attempt-1`).

**Why this node is not itself blocked_by the extraction** (that would be a
`blocked_by` cycle, which schema rule 15 rejects): the cutover needs #2848's
*content*, not its *merge*. `mkDarwinConfiguration` / `mkNixosConfiguration`
exist on the PR branch already, and a private instance flake pins
`commons.systems` as a flake input — so it can point at
`github:natb1/commons.systems/tactic-nix-instance-flake-extraction` until the PR
lands. The honest order is: stand up the private repo against the PR branch →
switch both machines → let #2848 merge → repoint the input to `main`.

## What is owed (owner)

1. Copy `examples/office-hours-nate/flake.nix` from PR #2848 into
   `github.com/natb1/office-hours-nate`, overwriting the stale #2479 QA harness.
2. Fill in the real values the constructors take: `username`, `homeDirectory`
   (darwin only), `gitName`, `gitEmail`, `hostUser`, `sshAuthorizedKeys`,
   `dispatchUsageSamples` (`enable` + `groupId`). `git add` the flake — in a git
   repo, Nix flakes only see git-tracked files.
3. Switch both machines from the private flake:
   `darwin-rebuild switch --flake .#default` and
   `sudo nixos-rebuild switch --flake .#nixos`.
4. Confirm the switch actually preserved the operator's world: `git log`
   identity is right, ssh access to the WSL box still works with the existing
   keys, and the dispatch capacity sampler still reports under the real
   `groupId`.

## Reuse

- Instance template and its field-by-field README: `examples/office-hours-nate/`
  as rewritten by PR #2848 (constructor argument tables, the `username` vs
  `hostUser` naming trap, and the "no `homeDirectory` on NixOS" note).
- Prior art for an owner-verified cutover node:
  `tactic-mainqa-instance-flake-personalization`.
- Module prerequisites a full-system consumer must supply:
  `flake.nix:131-142`.

## Verification

Not autonomously verifiable — this is on-machine owner QA. The check is step 4
above, performed by the operator on both hosts after the switch.

## Completion

Both machines switched from the private instance and step 4 confirmed →
`phase: done`. Clearing the office_hours park is part of that same disposition.
