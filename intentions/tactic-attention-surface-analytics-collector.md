---
id: tactic-attention-surface-analytics-collector
kind: tactic
statement: analytics collector — local scheduled job (nix-managed timer) gathers
  GA4/Search Console/PageSpeed/GitHub signals into the snapshot, replacing the
  Firestore function
owner: ai
status: codified
parent: null
rationale: "Replaces the pruned born-parked analytics-drop tactic per strategy
  clarification 8: collection must be automated, not an author export ritual.
  The collectProjectSignals core is already dependency-injected and
  firebase-functions-free, so it moves into the local producer; scheduling stays
  in the repo's nix config per the office-hours.nix precedent."
reading: null
gap: null
serves:
  - strategy-attention-surface
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
attributes:
  phase: qa
  blocked_by: []
  execution:
    branch: tactic-attention-surface-analytics-collector
    pr: 2783
---
# analytics collector — local scheduled job (nix-managed timer) gathers GA4/Search Console/PageSpeed/GitHub signals into the snapshot, replacing the Firestore function

## Context

Strategy clarification 8: analytics collection is automated end-to-end.
Today `collectProjectSignals` (`functions/src/project-signals.ts`) gathers
GitHub, GA4, Search Console, and PageSpeed signals server-side on a
Firebase schedule and persists them to Firestore, which the snapshot
producer then captures. The redesign inverts this: the local producer
collects directly and folds the results into `office-hours-current.benc`
— no Firestore hop. The core logic
(`functions/src/project-signals-core.ts`) is already dependency-injected
and firebase-functions-free (only a type-import of `Firestore`), so it
moves rather than being rewritten. The attachment and its capture posture
are recorded in `intentions/delegation-web-analytics.md`.

## Unit 1 — producer analytics scope

**Recommended model:** opus

Scope:
- Move `functions/src/project-signals-core.ts` into
  `office-hours-snapshot/src/` — the producer becomes its owner. The
  Firebase function keeps its copy untouched until
  `tactic-attention-surface-firestore-retire` deletes it (do not touch
  `functions/` in this PR).
- New producer scope (extend `SnapshotScope` in
  `office-hours-snapshot/src/config.ts`), e.g. `--scope analytics`:
  fetch per the core's source list, fold a `projectSignals` section into
  the `office-hours-current.benc` payload
  (`office-hours-snapshot/src/persist.ts`); extend the schema and parity
  tests (`parity.ts`, `snapshot.test.ts`, `produce.test.ts`).
- Credentials arrive via the existing EnvironmentFile contract validated
  fail-fast in `config.ts` (GA4 property, GSC site, PSI key, GitHub
  token) — clear errors over fallbacks; a missing key fails the scope
  loudly, it never silently skips a source.

## Unit 2 — nix timer

**Recommended model:** sonnet

Scope:
- Extend `nix/nixos/office-hours.nix` with a second service/timer pair
  (e.g. `office-hours-analytics`) invoking the producer with
  `--scope analytics` on its own configurable `OnCalendar` (daily
  default — GA4/GSC windows are 28–30-day aggregates; hourly would be
  noise), following the module's existing operator-user +
  EnvironmentFile + `after = mount-gdrive.service` pattern.
- The module stays forkable: no personal values; new EnvironmentFile
  keys documented in the module header per the existing contract.

## Dependencies

None — independent leaf. Adjacency note: unit 1 touches the same
producer files as `tactic-attention-surface-velocity-pace` unit 1
(`persist.ts`, parity tests); no ordering required, expect a mechanical
merge if they land close together.

## Reuse

- `functions/src/project-signals-core.ts` (moved, not rewritten).
- `office-hours-snapshot/src/config.ts` scope/env-var validation;
  `persist.ts` encryption path; `nix/nixos/office-hours.nix` module
  structure.

## Verification

```verify
npx vitest run --project office-hours-snapshot --root .
```

Manual: run `main.ts --scope analytics` locally with real credentials —
the snapshot gains a `projectSignals` section matching the function's
wire shape; the operator applies the nixos rebuild and confirms the
timer fires; update the review notes in
`intentions/delegation-web-analytics.md` with the first-party API
collection posture (no manual exports anywhere).

## Implementation notes

Two units, one PR; each unit in a subagent with its Recommended model;
supply this Context and the unit's Scope; constrain to working-tree
edits.
