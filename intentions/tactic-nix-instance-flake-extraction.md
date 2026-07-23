---
id: tactic-nix-instance-flake-extraction
kind: tactic
statement: Move the personal instance config (host configs, identity, ssh
  pubkeys, group id, host user) out of the framework flake.nix — commons.systems
  carries zero personal values and CI builds placeholder instance configs
owner: ai
status: codified
parent: null
rationale: "Residual greenfield work from gh epic 2446 (nix framework/instance
  split), recorded 2026-07-06 when the epic's owner chose to finish the
  greenfield target rather than relax it. The sub-issues (2447-2450)
  parameterized the framework modules but consciously shipped an intermediate:
  flake.nix still embeds the author's instance — nixosConfigurations.nixos and
  darwinConfigurations.default hardcode n8, the git identity, real ssh pubkeys,
  the dispatch group id, and the host user. The greenfield target (a fork builds
  as its own operator with zero edits) stands per
  .claude/rules/design-proposals.md; this tactic delivers the commons.systems
  side of it."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-nix-instance-flake-extraction
  pr: 2848
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by:
  - tactic-nix-export-nixos-modules
office_hours:
  reason: "Re-audited 2026-07-23 against origin/main; the hash values in the
    original park text were stale and are corrected below. Implementation is
    COMPLETE on PR #2848 (draft, head 02f0df9c): darwin-build GREEN, so the
    Unit 2 lib.mkForce drop is validated on macOS. Only nixos-build is red,
    for exactly one cause, and it is not this diff: hash mismatch in the
    fixed-output derivation WezTerm-windows-nightly.zip (CI run 29141605543,
    job 86515720728) — specified
    sha256-Beo9PtQ5UmqdmBbagYfVoS0hglseF/1F/uUMHtGxr1c=, got
    sha256-twQWc8bNnvKVPRj0Fi2gqv5HfK1WvLD0ZtN2DsZpl8I=. That pin lives in
    nix/home/wezterm-pin.nix, which this PR never touches (Linux/WSL-only, so
    darwin-build is unaffected). CORRECTION: the Beo9 value is only what THIS
    BRANCH still carries (pin version 20260707-093716); origin/main has since
    moved the pin to version 20260716-195552 with windowsZipHash
    sha256-QiVmQOEZToNMDnFfVLujiHPl4MrKYXyoLtvCfqzv5X8=, and that value is
    stale upstream too. PR #2953 (branch wezterm-pin-refresh, open) bumps it
    to sha256-bTvVHVpB8Mh6g2lF2RB9Egs2IApanVb5Z1R2M9UCZZ8= and its nixos-build
    PASSES — that is the corrective change, and it has not landed yet.
    RELEVANCE re-confirmed: this work is still needed. origin/main flake.nix
    lines 152-254 still hardcode n8, Nathan Buesgens, nathan@natb1.com, two
    real ssh-ed25519 pubkeys, instance.hostUser and the dispatch groupId;
    nothing landed by another route. BRANCH VIABILITY re-confirmed: 952
    commits behind origin/main, but git merge-tree reports a CLEAN merge, and
    no commit on main has touched flake.nix or examples/office-hours-nate/
    since the merge-base c1474b5d, so there is no content drift. origin/main
    was deliberately NOT merged into this branch during the audit: it would
    only swap one stale wezterm hash for another and cannot turn nixos-build
    green before #2953 lands. NEXT STEPS, in order: (1) land #2953; (2) merge
    origin/main into this branch and re-run CI — this also re-validates the
    Unit 2 mkForce drop against the three flake.lock bumps (nixpkgs,
    home-manager) that landed since the branch point, which the 2026-07-11
    darwin-build did not cover; (3) if darwin-build and nixos-build are both
    green, unpark and re-tick. Do NOT couple the wezterm hash bump into this
    scoped instance-flake PR."
  since: 2026-07-11
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Move the personal instance config (host configs, identity, ssh pubkeys, group id, host user) out of the framework flake.nix — commons.systems carries zero personal values and CI builds placeholder instance configs

## Context

Residual greenfield work from gh epic 2446. The sub-issues (2447-2450)
parameterized the framework modules under `nix/` — no personal values remain
there — but the root `flake.nix` still does double duty as framework AND the
author's private instance. As of main @ 97eca424 it hardcodes:

- `home.username = lib.mkForce "n8"` (flake.nix:168) and `homeDirectory`
  literals `"/Users/n8"` (flake.nix:181) / `"/home/n8"` (flake.nix:213)
  inside `mkIntegratedHmConfig` and its two call sites
- `programs.git.settings.user.name = "Nathan Buesgens"` /
  `user.email = "nathan@natb1.com"` in both the darwin (flake.nix:196-197)
  and nixos blocks
- two real ssh pubkeys (`ssh-ed25519 ... n8@nixos`,
  `... n8@Nathans-MacBook-Air.local`) at flake.nix:236-239
- `services.dispatchUsageSamples.enable = true; groupId = "commons-systems"`
  (flake.nix:240-241) and `instance.hostUser = "n8"` (flake.nix:220)

Greenfield target (epic 2446 criterion 1): a fork builds as its own operator
with zero edits — no personal data anywhere in the public repo. The author's
real values move to the private office-hours-nate repo's instance flake
(which imports this framework); commons.systems keeps only placeholder
instance configs so CI still builds the darwin and nixos outputs.

The darwin `lib.mkForce` workaround (flake.nix:160-168) exists because
home-manager's `nixos/common.nix` derives `homeDirectory` from
`config.users.users.<name>.home` at priority 100, and on darwin
`nix/darwin/default.nix` defines no `users.users.<name>`, so the derivation
yields null. The proper fix — part of this tactic (epic 2446 criterion 4) —
is to define `users.users.${user}.home` on the darwin side (or otherwise fix
the null derivation at its source) so the `mkForce` can be dropped rather
than worked around.

## Dependencies

`tactic-nix-export-nixos-modules` must complete first (the instance flake
imports `nixosModules.default`; absence of that node from the graph means it
completed — prune-on-done).

## Unit 1 — parameterize the host configs into an instance-values attrset

**Recommended model:** opus

Implement in a subagent (Agent tool, `model: opus`, working-tree edits only),
passing this unit's context and scope in the prompt.

Scope:
- `flake.nix`: refactor `darwinConfigurations.default` and
  `nixosConfigurations.nixos` (and `mkIntegratedHmConfig`, flake.nix:147-171)
  so every personal value listed in Context is supplied by a single
  `instanceValues` attrset (username, homeDirectory per platform, git name +
  email, ssh authorized keys, dispatch-samples enable/groupId, hostUser)
  instead of inline literals. Expose the parameterized constructors (e.g.
  `mkDarwinConfiguration = instanceValues: ...`,
  `mkNixosConfiguration = instanceValues: ...`) in the flake outputs so an
  external instance flake can call them with real values.
- Fill the in-repo `darwinConfigurations.default` / `nixosConfigurations.nixos`
  from a clearly-labeled **placeholder** attrset (e.g. user `operator`, git
  identity `Example Operator <operator@example.org>`, empty ssh key list,
  dispatch samples disabled, hostUser `operator`) so CI's `darwin-build` and
  `nixos-build` (.github/workflows/unit-tests.yml:332,359) keep building both
  outputs with zero personal data.
- Out of scope: deleting the CI-built outputs; changing what the framework
  modules configure; the private office-hours-nate repo itself (Unit 3
  prepares its template; the real-values commit there is owner work).

Reuse: the option seams already exist — `services.sshAuthorizedKeys.keys`
(`nix/home/ssh-authorized-keys.nix`), `services.dispatchUsageSamples`
(`nix/home/dispatch-usage-samples.nix`), `instance.hostUser`
(`nix/nixos/host-user.nix`), `programs.git.settings.user.*`
(`nix/home/git.nix` asserts if git is enabled without an identity). This
unit only re-plumbs where the values come from.

## Unit 2 — fix the darwin null-homeDirectory derivation, drop lib.mkForce

**Recommended model:** opus

Depends on: Unit 1.

Implement in a subagent (Agent tool, `model: opus`, working-tree edits only).

Scope:
- Fix the null derivation at its source so the priority-50 `mkForce` override
  (flake.nix:168-169 pre-refactor; wherever Unit 1 moved it) becomes
  unnecessary: define `users.users.${instanceValues.username}.home` in the
  darwin system config (beside `nix/darwin/default.nix`'s existing config or
  in the flake's darwin block) so home-manager's `nixos/common.nix`
  derivation resolves to the real home directory, then remove the `mkForce`
  wrappers and set plain `home.username` / `home.homeDirectory`.
- The flake.nix:160-167 comment documents that darwin CI fails without the
  workaround — removal must be validated by CI `darwin-build`, not local
  reasoning alone. If the derivation genuinely cannot be fixed on the darwin
  side, park this node via `office_hours` with the finding rather than
  keeping the `mkForce` silently.
- Out of scope: any Linux/WSL behavior change (`nixos/common.nix` already
  derives correctly there from `users.users.<hostUser>.home`).

## Unit 3 — instance-flake template covering both hosts

**Recommended model:** sonnet

Depends on: Units 1-2.

Implement in a subagent (Agent tool, `model: sonnet`, working-tree edits
only).

Scope:
- `examples/office-hours-nate/flake.nix` + `README.md`: extend the existing
  standalone home-manager example to a full instance template that calls the
  Unit-1 constructors (`mkDarwinConfiguration` / `mkNixosConfiguration`) with
  commented placeholder values — username, git identity, ssh keys (keep the
  existing commented `ssh-ed25519 AAAA... you@host` placeholder style),
  dispatch groupId, hostUser — and documents the switch commands
  (`darwin-rebuild switch --flake`, `nixos-rebuild switch --flake`,
  `home-manager switch --flake`).
- No real personal values anywhere in `examples/`.

## Verification

```verify
grep -nE 'natb1\.com|Nathan Buesgens|ssh-ed25519 AAAAC3' flake.nix; test $? -eq 1
```

```verify
grep -nE '"n8"|/home/n8|/Users/n8' flake.nix; test $? -eq 1
```

```verify
grep -rn 'mkForce "n8"\|mkForce.*homeDirectory' flake.nix; test $? -eq 1
```

(Each grep asserts absence — exit 1 from grep is the pass. The pattern
`ssh-ed25519 AAAAC3` matches real key blobs but not the commented
`AAAA...` example placeholder and not `HostKeyAlgorithms` crypto-name lines
— the false-positive trap that parked the epic's earlier plan.)

The authoritative gate is CI `darwin-build` + `nixos-build` green on the PR.

Manual (owner, after merge): commit the real values to the private
office-hours-nate repo's instance flake using the Unit-3 template, switch
both machines from it, and confirm `git log` identity and ssh access still
work. Author a main-qa tactic for that cutover at completion (the pattern of
`tactic-mainqa-instance-flake-personalization`) — the machine switch is not
autonomously verifiable.

## Completion

Merged to main with CI green and the main-qa cutover tactic authored →
`phase: done` (prune this node).
