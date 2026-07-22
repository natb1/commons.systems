---
id: tactic-playwright-nix-browser-single-source
kind: tactic
statement: Couple @playwright/test to pkgs.playwright-driver.version at
  flake-update time so the npm chromium pin cannot drift from the nix-shipped
  browser
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-22 /align-strategy 'track greenfield' round after
  the 2026-07-21 recurrence (PR #2930): the npm @playwright/test chromium pin
  drifts from the nix pkgs.playwright-driver chromium whenever an automated
  nixpkgs bump moves playwright-driver, and check-playwright-version-sync.sh
  detects but cannot prevent it. The browser-revision axis of
  strategy-distribute-workflow's one-source-of-truth-for-the-toolchain
  requirement, orthogonal to the node-version axis
  (tactic-node-toolchain-single-source). Greenfield endorsed: nix authoritative,
  the npm pin follows by construction, coupled at the nix flake update mover.
  Retained as a draft for /align-tactics."
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
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Couple @playwright/test to pkgs.playwright-driver.version at flake-update time so the npm chromium pin cannot drift from the nix-shipped browser

## Context

The nix dev/dispatch shell provides chromium via `pkgs.playwright-driver.browsers`
(`flake.nix:91,96`, exported as `PLAYWRIGHT_BROWSERS_PATH`), whose chromium
revision is fixed by the nixpkgs rev pinned in `flake.lock`. The npm side pins
`@playwright/test` in `package.json` and `audio/package.json`, whose installed
`node_modules/playwright-core/browsers.json` declares the chromium revision
playwright *expects*. These are two independent declarations of the same browser
binary, coupled only by a detector — `.github/scripts/check-playwright-version-sync.sh`
(hard check in `unit-tests.yml:256` under `nix develop`, soft/`|| true` in
`.envrc:9`). The detector catches drift *after* nixpkgs moves; it cannot prevent
it, so every automated `nix flake update` that advances `playwright-driver`
re-opens the gap.

It recurred 2026-07-21: flake bump a12b1779 took `playwright-driver` to 1.61.1
(chromium 1228) while `@playwright/test` stayed 1.60.0 (chromium 1223); the npm
pin was hand-bumped to 1.61.1 in PR #2930. The recurrence surfaced again on a
local direnv reload because the fix sat unmerged as a draft PR — see that PR's
history. Until the two pins are coupled by construction this recurs on every
nixpkgs bump that moves the driver.

This is the **browser-revision axis** of strategy-distribute-workflow's
"one source of truth for the toolchain" requirement — distinct from and
orthogonal to the **node-version axis** (tactic-node-toolchain-single-source,
which single-sources `.node-version` vs nix `nodejs_22`). The 2026-07-07
strategy clarification conflated the two; the 2026-07-22 clarification on
strategy-distribute-workflow separates them.

## Greenfield design

nix is authoritative — nixpkgs decides which chromium even exists — and the npm
pin follows by construction. The invariant:

    @playwright/test (root and audio) == pkgs.playwright-driver.version

verified 2026-07-22: `nix eval --raw` of the driver's `version` attribute
returns `1.61.1`, matching the npm pin after #2930. The two share the same
upstream playwright release number, so equality of that one number keeps
chromium in lockstep.

Couple them at the mover. `nix flake update` is the manual operation that
advances nixpkgs — the "Update flake.lock" commits are hand-run; no CI cron
does it. Wrap it: after the update, read `playwright-driver.version`, rewrite
the `@playwright/test` pin in both `package.json` files to that exact version,
`npm install` to relock, and stage `flake.lock` + both `package.json` +
`package-lock.json` into one commit. A flake bump can then never *land* browser
drift. Keep `check-playwright-version-sync.sh` as a backstop (out-of-band edits,
belt-and-braces).

Implement the unit in a subagent launched with its recommended model
(Agent/Task tool, `model: opus`), passing this context and scope; constrain it
to working-tree edits.

## Units of work (provisional — /align-tactics to finalize)

### Unit 1 — flake-update wrapper that syncs the npm playwright pin

Recommended model: opus

Scope:
- New `nix/scripts/flake-update.sh` (or extend a node-toolchain update runbook
  if one lands first from tactic-node-toolchain-single-source — check and reuse):
  - `nix flake update "$@"`;
  - `pw=$(nix eval --raw <attr>.playwright-driver.version)` — resolve the exact
    eval attr against `flake.nix` (the driver is `pkgs.playwright-driver`;
    confirm the concrete path, e.g. via the `nixpkgs` input's `legacyPackages`);
  - rewrite `.devDependencies["@playwright/test"]` to `$pw` in `package.json`
    and `audio/package.json` with `jq` (per `.claude/rules/shell-json.md` — never
    `echo` JSON into `jq`);
  - `npm install` to regenerate `package-lock.json`;
  - `git add flake.lock package.json audio/package.json package-lock.json`.
- Document it in the nix/dev runbook: use the wrapper in place of bare
  `nix flake update`.
- Out of scope: the node-version axis (tactic-node-toolchain-single-source);
  removing `check-playwright-version-sync.sh` (it stays as backstop); any CI cron
  for flake updates (none exists — updates stay manual).

## Reuse

- The invariant and the drift detector: `.github/scripts/check-playwright-version-sync.sh`.
- `nix eval` of `playwright-driver.version` (confirmed working 2026-07-22).
- `jq` rewrite discipline: `.claude/rules/shell-json.md`.

## Verification

```verify
nix develop --command bash .github/scripts/check-playwright-version-sync.sh
```

Prose: after the wrapper runs on a real `nix flake update` that moves
`playwright-driver`, confirm `@playwright/test` in both `package.json` equals
`nix eval --raw <attr>.playwright-driver.version` and the sync check exits 0
under `nix develop`. The wrapper needs network (nixpkgs + npm registry) — run
sandbox-off locally or let CI verify.
