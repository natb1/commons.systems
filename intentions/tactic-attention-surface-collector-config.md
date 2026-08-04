---
id: tactic-attention-surface-collector-config
kind: tactic
statement: collector config home — promote the local analytics collector's
  non-secret operator config to typed module options set by the
  office-hours-nate instance flake; document the config taxonomy (no GitHub
  Variables machinery)
owner: ai
status: codified
parent: null
rationale: "Migrated from GitHub issue #2450 (epic #2446's optional last
  sub-issue) after its Step-0 inventory found premise drift:
  collectProjectSignals survived the office-hours decommission (PR #2763)
  carrying 11 non-secret operator params misclassified as Actions Secrets, and
  the author resolved the config-home fork toward the local collector
  (tactic-attention-surface-analytics-collector). So the config home is typed
  Nix module options set by the instance flake — not GitHub repository Variables
  (zero vars consumers exist; the sole workflow consumer is an operator deploy,
  not public CI; the Variables reconciler is not built). The Firebase-side
  wiring (functions-deploy.yml, functions/.env.commons-systems) is transient —
  tactic-attention-surface-firestore-retire deletes it."
reading: null
gap: null
serves:
  - strategy-attention-surface
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-attention-surface-analytics-collector
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# collector config home — promote the local analytics collector's non-secret operator config to typed module options set by the office-hours-nate instance flake; document the config taxonomy (no GitHub Variables machinery)

## Context

Migrated from GitHub issue #2450 (the optional last sub-issue of nix epic
#2446) after its Step-0 inventory. The inventory (recorded on #2450 as the
`dispatch:recommended-steps` comment) found:

- `collectProjectSignals` survived the office-hours decommission (PR #2763)
  and carries 11 non-secret operator/targeting params
  (`functions/src/project-signals.ts:139-164`) currently delivered as GitHub
  Actions **Secrets** (`.github/workflows/functions-deploy.yml:41-51`) —
  misclassified; they are non-secret operator config.
- Zero GitHub repository Variables (`${{ vars.* }}`) are consumed by any
  workflow; no `sync-config` exists. The sole config consumer
  (`functions-deploy.yml`) is an operator-privileged deploy, not public CI,
  so the issue's own gate says the Variables reconciler is NOT built.
- The expected survivors — feed-proxy build config and hosting plumbing
  (`.firebaserc`, `firebase.json`) — are already file-declarative and need
  no work.

The author resolved the config-home fork: `collectProjectSignals` moves to
the local analytics collector
(`tactic-attention-surface-analytics-collector`), whose config is consumed
at Nix activation. That collector's plan routes all config through the
out-of-store EnvironmentFile, lumping secrets (PSI key, GitHub token, GA4
OAuth) with non-secret targeting config (GA4 property, GSC site, PSI URLs,
strategy). This tactic separates them: the non-secret subset becomes typed
module options set by the `office-hours-nate` instance layer, rendered into
the systemd unit's `Environment=`; the EnvironmentFile keeps secrets only.
The Firebase-side wiring (`functions-deploy.yml` config step,
`functions/.env.commons-systems`) is transient — it dies with
`tactic-attention-surface-firestore-retire` — so this tactic touches no
`functions/` files.

## Unit 1 — typed module options for the collector's non-secret config

**Recommended model:** opus

Scope:
- Extend `options.services.officeHoursProducer` (or the analytics service's
  own option set) in `nix/nixos/office-hours.nix:71` with typed non-secret
  options for the analytics collector's targeting config. The exact key set
  is read from the landed collector's `config.ts` env contract — expected
  roughly: GA4 property id, GA4 host-apps map, GSC site, PSI URL list, PSI
  strategy, GitHub repo. Render them into the `office-hours-analytics`
  unit's `Environment=` (non-secret, world-readable in the nix store is
  acceptable by definition of this set); secrets stay in the out-of-store
  `EnvironmentFile` (`nix/nixos/office-hours.nix:27-64` contract).
- Set the instance values at the current instance-config site
  (`nix/nixos/configuration.nix:41-45`, the interim home whose relocation to the
  instance flake is tracked by `tactic-nix-instance-flake-extraction` and
  `tactic-nix-operator-machine-cutover`) and
  mirror the option shape in the
  `examples/office-hours-nate/flake.nix` template with placeholder values.
- The module stays forkable: no personal values in module defaults; new
  options documented in the module header per the existing contract.
- Out of scope: any `functions/` file, GitHub Variables, `sync-config`,
  secret-valued options.

## Unit 2 — config taxonomy documentation

**Recommended model:** sonnet

Scope:
- Add a config-taxonomy subsection to `README.md` (CI/CD section, ~line
  168): credentials and PII → GCP Secret Manager (Functions, transitional)
  or the out-of-store EnvironmentFile (local collector); Nix-consumed
  operator config → typed module options set by the `office-hours-nate`
  instance layer; public-CI non-secret config → none exists (zero
  `${{ vars.* }}` consumers; no Variables machinery, trust boundary
  unchanged).
- Note that `functions/.env.commons-systems`'s header claim ("overwritten
  from repository Variables") describes a design that was never built — the
  workflow reads Secrets; correct that header in place only if
  `tactic-attention-surface-firestore-retire` has not already deleted the
  file.

## Dependencies

- `tactic-attention-surface-analytics-collector` (blocked_by) — unit 1's
  option set is derived from the collector's landed `config.ts` env
  contract, and the `office-hours-analytics` systemd unit the options render
  into does not exist until that tactic's unit 2 lands.

## Reuse

- `nix/nixos/office-hours.nix` module structure (options + header contract
  + EnvironmentFile pattern).
- `office-hours-snapshot/src/config.ts` fail-fast env validation (the
  contract the option set mirrors).
- `examples/office-hours-nate/flake.nix` instance-template shape (#2448
  precedent).

## Verification

```verify
nix flake check --impure .
```

Manual: operator applies the nixos rebuild — the analytics timer's unit
file carries the non-secret config as `Environment=` entries and the
EnvironmentFile contains only secrets; a forker reading the README
taxonomy can classify a new config item without asking.

## Implementation notes

Two units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain to working-tree edits.
