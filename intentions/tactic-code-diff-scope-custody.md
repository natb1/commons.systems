---
id: tactic-code-diff-scope-custody
kind: tactic
statement: "Extend scope custody to the code diff: check git diff --name-only
  origin/main...HEAD against the node's declared scope.files at the phase
  transition, mirroring the body-level tacticScopeFingerprint"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-27 /align-strategy round. §Fingerprint &
  Freeze stamps the strategy frontmatter (strategyFingerprint) and the tactic
  body (tacticScopeFingerprint) — nothing gates what the branch actually
  changed. Live instance: PR #2918 shipped a qa-fix doctrine reversal (72ecbad1)
  plus a conflict-strike CAP raise 2 to 3 (aef5d659) under a title naming only
  graph-select-target --standalone; the body-level gate saw no drift because the
  node body never changed. blocked_by tactic-node-scope-files-overlap-gate: a
  diff gate needs a declared scope to compare against. Awaiting an
  /align-tactics round to finalize."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-node-scope-files-overlap-gate
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Extend scope custody to the code diff: check git diff --name-only origin/main...HEAD against the node's declared scope.files at the phase transition, mirroring the body-level tacticScopeFingerprint

## Context — the gap in scope custody

`strategy-graph-native-dispatch` §Fingerprint & Freeze records two stamps:

- **`strategyFingerprint`** (`router.ts`) — hashes the *strategy's* substance
  (statement, clarifications, conditions, serves, success_signal, tooling_goals)
  and soft-freezes materially-affected open children.
- **`tacticScopeFingerprint`** (`router.ts`) — hashes the *tactic's* statement plus
  its markdown body, and demotes a tactic whose own plan moved under it.

Neither stamp observes **what the branch actually changed**. There is no gate at
all on the code diff, so a PR can carry substance its node body never described
and every custody check still reports green.

Live instance: PR #2918 shipped a `/qa-fix` doctrine reversal (`72ecbad1`) and a
conflict-strike `CAP` raise from 2 to 3 (`aef5d659`) under a title naming only
`graph-select-target --standalone`. The body-level gate saw no drift because the
node body never changed — correctly, by its own contract. The doctrine reversal is
what turned a routine textual merge conflict into a semantic one (see
[[tactic-phase-routing-table-generated]] for that half of the story).

## Target behavior

Mirror the body-level gate one layer down: at the phase transition, compute
`git diff --name-only origin/main...HEAD` for the node's branch and check it
against the node's declared `scope.files`. An undeclared path in the diff is scope
drift — the same class of event as a body edit under an in-flight tactic, and it
should route the same way (demote / re-plan) rather than merging silently.

## Dependencies

`blocked_by: [tactic-node-scope-files-overlap-gate]` — a diff gate needs a declared
scope to compare the diff against, and that tactic is what introduces
`scope.files`. This is a hard gate, not a compose-with: there is no meaningful
interim form of this check without a declaration.

## Open questions for /align-tactics

1. Where does the check fire — `transition-node` (per-transition, catching drift
   as it lands) or a tick-wide sweep (like `dispatch-graph-scope-sweep`)? The
   former is tighter; the latter does not add a `gh`/git call to every transition.
2. Disposition on drift: demote to `implement`, park to `office_hours`, or record a
   review finding? Demotion is the precedent set by the body-level gate, but a diff
   is far noisier than a body (lockfiles, generated files, formatter churn).
3. Does an *undeclared but obviously incidental* path (test fixtures, snapshots,
   `package-lock.json`) need an exemption list, and if so where does it live —
   schema, config, or per-node?
4. Interaction with the machinery-sentinel convention: appends below the sentinel
   are deliberately outside the body fingerprint. Is there an analogous
   always-allowed path set for the diff?
