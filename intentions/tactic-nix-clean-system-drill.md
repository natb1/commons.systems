---
id: tactic-nix-clean-system-drill
kind: tactic
statement: Validate Nix devshell reproducibility on a clean system and detect
  flake/CI drift — the fresh-machine provisioning drill
owner: ai
status: codified
parent: null
rationale: "Retained from gh #515 during the 2026-07-06 tier-gate interview,
  deliberately ungated: this is tier-1 self-validation —
  delegation-os-hardware's non-delegable floor (provision the working
  environment from scratch on a fresh machine, last_exercised currently null) —
  not practitioner management. Only its secondary practitioner-clone framing
  waits on the tier-3 declaration on strategy-progressive-validation."
reading: null
gap: null
serves:
  - strategy-exercise-recovery-paths
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-nix-clean-system-drill
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 4ee635b8acf77f2cb701ca3625baa5edf2209e23bf04d30e72650eb7b94f36fa
  fix: null
  completion: null
validates:
  - strategy-exercise-recovery-paths
blocked_by:
  - tactic-nix-instance-flake-extraction
  - tactic-nix-host-option-surface
  - tactic-nix-operator-machine-cutover
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Validate Nix devshell reproducibility on a clean system and detect flake/CI drift — the fresh-machine provisioning drill

## Context

`delegation-os-hardware`'s non_delegable_floor is "the ability to
provision the working environment from scratch on a fresh machine", and
its `last_exercised` is null. This drill (retained from gh 515, planned
2026-07-11) exercises the devshell layer of that floor mechanically and
keeps it exercised: a clean-environment `nix develop` from a fresh clone
must produce a working build environment, and drift between `flake.nix`'s
toolchain and CI's (`actions/setup-node` + `.node-version`, currently
22.22.3) must fail loud.

Sequencing (the `blocked_by` edges): the drill must run against the
framework flake with placeholder instance values —
`tactic-nix-instance-flake-extraction` (personal values out of
`flake.nix`), `tactic-nix-host-option-surface` (the host-specific
option surface), and `tactic-nix-operator-machine-cutover` (the operator
machine relocation). Before those land, a drill would exercise the wrong entry
point: a repo hardcoding the author's identity behind `--impure` /
`builtins.getEnv`. Re-read all three tactics' final shape at implement time —
this plan anchors on the post-split contract, not on today's `flake.nix`
line numbers.

Layer honesty: this tactic covers the **devshell** half of the floor
(`nix develop` from scratch). The full-system half (`home-manager switch`
/ OS provision on fresh hardware) is author work that rides
`tactic-nix-operator-machine-cutover`'s completion; the record flip in
Unit 3 names the exercised layer explicitly.

## Unit 1 — clean-environment devshell drill in CI

**Recommended model:** opus

Implement in a subagent (`model: opus`), working-tree edits only, passing
this unit's context and scope in the prompt.

Scope:

- A CI job (new job in `.github/workflows/unit-tests.yml`, sibling to the
  existing `darwin-build`/`nixos-build` jobs, or a dedicated workflow if
  cleaner) that on a runner with nix installed: clones the repo fresh
  (the checkout the job already gets), runs
  `nix develop --command bash -c '<toolchain check>'` with **no** direnv,
  no pre-existing `node_modules`, and no personal instance values — the
  placeholder-instance framework flake is the entry point.
- The toolchain check: `node --version` matches `.node-version`;
  `npm ci` succeeds at the workspace root; one representative package
  builds (pick a cheap one — e.g. `npx tsc -p packages/intentionsutil`
  or the package's build script); the Go toolchain from the devshell can
  `go build` one of the Go tools (they sit outside the npm workspace —
  `budget/` / `go.work` — and have their own build deps, so they are the
  easy thing to silently lose).
- Trigger: on changes to `flake.nix`, `flake.lock`, `.node-version`, or
  the workflow itself, plus a weekly `schedule` cron so the drill re-runs
  as the substrate drifts (recovered artifacts decay at substrate drift
  rate — kind-delegation).
- Out of scope: darwin (no fresh-darwin runner assumption beyond what
  `darwin-build` already covers); `home-manager switch` (full-system
  half, see Context); practitioner-clone framing (waits on the tier-3
  declaration on strategy-progressive-validation).

## Unit 2 — flake/CI drift check

**Recommended model:** sonnet

Dependencies: Unit 1.

Implement in a subagent (`model: sonnet`), working-tree edits only.

Scope: a small script (e.g. `ops/scripts/check-toolchain-drift.sh` or a
step inside the Unit 1 job) that extracts the node major/minor/patch the
flake devshell provides (`nix develop --command node --version`) and
compares it against `.node-version` and against every
`actions/setup-node` usage in `.github/workflows/*.yml` (they all read
`.node-version` via `node-version-file` today — assert that stays true
rather than hardcoding versions). Mismatch = job failure with a message
naming both sides. Follow `.claude/rules/shell-json.md` in committed
`.sh` files.

## Unit 3 — flip the record

**Recommended model:** sonnet

Dependencies: Units 1-2 (the drill must have passed on CI).

Implement in a subagent (`model: sonnet`), working-tree edits only.

Scope: update `intentions/delegation-os-hardware.md` via
`packages/intentionsutil/scripts/write-node.ts`: set
`attributes.irreversibility.last_exercised` to the first green drill-run
date, and note in `attributes.irreversibility.recovery_path` (or the
node body's audit narrative) that the exercised layer is the devshell
provision, with the full-system half riding
`tactic-nix-operator-machine-cutover`. Land via
`packages/intentionsutil/scripts/graph-commit delegation-os-hardware` —
node edits never ride the code PR.

## Reuse

- The existing `darwin-build` / `nixos-build` jobs in
  `.github/workflows/unit-tests.yml` as the workflow-shape exemplar
  (nix install action, cache setup).
- `.node-version` (22.22.3, pinned — see the
  preview-deploy node-drift history) as the single node-version source.
- `packages/intentionsutil/scripts/write-node.ts` + `graph-commit` for
  the record flip.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: run the drill locally first
(`nix develop --command bash -c 'node --version && npm ci'` in a scratch
clone outside any direnv-loaded shell); then confirm the CI job goes
green on the PR, and red when `.node-version` is temporarily perturbed
(revert the perturbation — never land it). Confirm
`delegation-os-hardware`'s `last_exercised` is a real date on
`origin/main` after the graph-commit.
