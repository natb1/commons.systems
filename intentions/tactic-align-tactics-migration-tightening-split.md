---
id: tactic-align-tactics-migration-tightening-split
kind: tactic
statement: /align-tactics has no rule against planning a data migration and the
  schema tightening that rejects its pre-migration spelling into the same PR, so
  plans keep pairing them and rely on the origin/main data test being green --
  record the rule in the skill and reconcile the two live plan units that
  violate it today
owner: ai
status: raw
parent: null
rationale: "Filed 2026-08-18 as a residual of PR #3095 (graph write-path
  integrity, squash-merged to main as fe0b1c4d). PR1's closing batch could not
  carry a node create -- graph-commit's --base compare-and-swap manifest pins a
  pre-image per id, and an id with no pre-image corrupts the batch -- so the
  residuals it discovered were recorded in the PR's plan document and filed
  nowhere in the graph. This node closes that gap. The rule -- direction 1 --
  arrived as planning-time doctrine on PR1 unit 4's node and was deliberately
  put out of that PR's scope: it is /align-tactics doctrine, not graph-write
  code, so PR1 correctly declined it and recommended a follow-up node that was
  then never filed. It is worth filing rather than dropping because the
  serialized PR plan violates it in two places right now, and both are currently
  safe only because PR1 fixed the origin/main data test -- which is precisely
  what the rule says not to rely on."
reading: null
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
# Record the migration/tightening split rule in `/align-tactics`

## Context

The rule, stated once so it can be quoted:

> **A data migration and the schema tightening that rejects its pre-migration
> spelling cannot share a PR.** The migration lands first and reaches
> `origin/main`; the tightening lands after.

The reason is mechanical. A schema tightening is validated against the data on
`origin/main`. If the migration that rewrites that data is in the same PR, the
tightening is being checked against data that has not landed yet — the PR
passes only because of the order its own checks happen to run in, not because
the constraint holds on the trunk.

This arrived as planning-time doctrine on PR #3095's unit 4 and was
deliberately excluded from that PR's scope: it is `/align-tactics` doctrine,
not graph-write code. PR1 declined it correctly and recommended a follow-up
node. The follow-up was never filed — which is why it is being filed now,
after the second plan revision to rediscover it.

## Why this is not bookkeeping

The serialized graph write-path plan **violates the rule in two live units
today**:

- One unit backfills six nodes off `attributes.phase` *and* makes
  `validate-graph` reject the key, in a single unit. That section already
  records that it "does trip the origin/main data test".
- Another strips `attributes.ledger_entry` from forty nodes *and* removes the
  reader in the same PR.

Both are currently safe **only because PR #3095 fixed the origin/main data
test**. That is precisely the rule's point: it says do not depend on that.

## Scope

1. **`.claude/skills/align-tactics/SKILL.md`** — add the rule to the planning
   guidance, as a constraint on how a tactic is split into units, with the
   mechanical reason stated. A rule recorded without its reason gets
   "simplified" away by the next reader who cannot see what it is protecting.
2. **Reconcile the two violating units.** Splitting them is the obvious move
   and may not be the right one — the alternative is to record explicitly, on
   each, why the pairing is safe in that specific case. Either outcome is
   acceptable; leaving them unexamined is not, because the rule's first
   application should not have a silent exception.

Out of scope: `validate-graph`, the schema, and any mechanical enforcement of
the rule. This is doctrine a planner applies, not a check a validator runs. If
enforcement turns out to be feasible, that is a separate node — do not grow
this one into it.

## Dependencies

None mechanically. But the reconciliation in (2) has to happen **before** the
two violating units are executed, or the rule is being recorded after the last
moment it could have been applied.

## Reuse

- `.claude/skills/align-tactics/SKILL.md` already carries per-unit planning
  constraints; this belongs beside them, not in a new document.
- `.claude/rules/planning.md` defines the plan-body schema (Context, Scope,
  Dependencies, Reuse, Verification) that the unit split has to satisfy — the
  new rule constrains where a unit boundary may fall, so it should be phrased
  in that document's vocabulary.

## Verification

Doctrine, so the verification is a reading rather than a command: a planner
with no memory of this node, reading only the amended SKILL text, must be able
to say which of the two violating units above is non-compliant and why. If the
rule as written does not let them do that, it is not yet written.

The reconciliation half is checkable directly — after (2), each of the two
units either has a unit boundary between migration and tightening, or carries a
written justification for why it does not.
