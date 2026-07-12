---
id: tactic-reconcile-graph-mainqa-guard-prune
kind: tactic
statement: "Prune the now-dead main-qa forward-compat guard and vestigial
  deferred plan scaffolding, and fix the stale header comments, left behind
  after PR #2859 adopted main-qa into the Phase enum. In
  packages/intentionsutil/scripts/reconcile-graph.ts the guard at lines 109-112
  -- if (!PHASES.includes('main-qa')) then plan.deferred.push(...) -- is now
  permanently unreachable, so plan.deferred is always empty, and the header
  comment at lines 13-18 still describes the removed deferral behavior. In the
  bash wrapper .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged
  the same dead cluster persists: an unreachable deferred print loop (~lines
  102-104), its stdout-protocol doc line (~line 26), and a stale header comment
  (~lines 10-11) calling the residue-to-main-qa route deferred and inert now. PR
  #2859 updated the twin comments in router.ts and transitions.ts in-diff but
  left these two files (owned by tactic-graph-router-transitions) as
  acknowledged deferred debt. Surfaced by /review-fix on PR #2859; serves
  strategy-graph-native-dispatch."
owner: ai
status: raw
parent: null
rationale: null
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
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Prune the now-dead main-qa forward-compat guard and vestigial deferred plan scaffolding, and fix the stale header comments, left behind after PR #2859 adopted main-qa into the Phase enum. In packages/intentionsutil/scripts/reconcile-graph.ts the guard at lines 109-112 -- if (!PHASES.includes('main-qa')) then plan.deferred.push(...) -- is now permanently unreachable, so plan.deferred is always empty, and the header comment at lines 13-18 still describes the removed deferral behavior. In the bash wrapper .claude/skills/dispatch-propagate/scripts/reconcile-graph-merged the same dead cluster persists: an unreachable deferred print loop (~lines 102-104), its stdout-protocol doc line (~line 26), and a stale header comment (~lines 10-11) calling the residue-to-main-qa route deferred and inert now. PR #2859 updated the twin comments in router.ts and transitions.ts in-diff but left these two files (owned by tactic-graph-router-transitions) as acknowledged deferred debt. Surfaced by /review-fix on PR #2859; serves strategy-graph-native-dispatch.

## Provenance

Surfaced by `/review-fix` (`/code-review max`) on PR #2859 — the main-qa phase
adoption — which pulled `main-qa` into the `Phase` enum and updated the twin
comments in `router.ts` and `transitions.ts` in-diff, but left two sibling files
(owned by `tactic-graph-router-transitions`) carrying dead code and stale
comments. PR #2859's body explicitly acknowledges this as deferred debt.

### Finding 1 — reconcile-graph.ts dead guard + stale comment (out of scope; not in PR diff)

- `packages/intentionsutil/scripts/reconcile-graph.ts:109-112` — the guard
  `if (!PHASES.includes("main-qa")) → plan.deferred.push(...)` is now permanently
  unreachable because the PR adopted `main-qa` into `Phase`. `plan.deferred` is
  therefore always `[]`.
- `packages/intentionsutil/scripts/reconcile-graph.ts:13-18` — the header comment
  still describes the removed deferral behavior.

### Finding 2 — reconcile-graph-merged wrapper dead loop + stale comment (out of scope)

- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` ~lines 102-104
  — an unreachable `deferred` print loop.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` ~line 26 — a
  stdout-protocol doc line for that dead loop.
- `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` ~lines 10-11
  — a stale header comment saying the residue→main-qa route is "deferred … inert
  now".

### Scope

Prune both dead-code clusters and correct all four stale comment sites. No
behavior change — the pruned code is provably unreachable. Owned by
`tactic-graph-router-transitions`; deferred (not dismissed) by PR #2859.
