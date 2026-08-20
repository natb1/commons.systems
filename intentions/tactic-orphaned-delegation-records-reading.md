---
id: tactic-orphaned-delegation-records-reading
kind: tactic
statement: read-sensors.ts's readDelegationRecordsReading is now unreachable
  from production code (superseded by two new per-strategy reading functions
  landed on tactic-first-sensor-pass), but it is also the only code implementing
  a doctrine rule about excluding declined delegation records from unexercised
  counts for strategy-exercise-recovery-paths. An author needs to decide whether
  that rule still governs the new readings before the orphaned function and its
  tests can be safely deleted.
owner: ai
status: raw
parent: null
rationale: null
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution:
  branch: tactic-orphaned-delegation-records-reading
  pr: 3062
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  conflict: null
  completion: null
  lane_pass: null
validates: []
blocked_by: []
office_hours:
  reason: "Requirement ambiguity gates the plan: the node's two possible plans are
    mutually exclusive and the choice is an author call the graph does not
    record. Verified in-repo 2026-08-20: `readDelegationRecordsReading`
    (packages/intentionsutil/scripts/read-sensors.ts:970) is the only
    implementation of the declined-origin exclusion recorded in
    strategy-exercise-recovery-paths clarification 1 (2026-07-11):
    \"Declined-origin records have no entered delegation to exercise; the
    instrument reports them as a separate class and the portfolio review, not a
    drill, is their exercise.\" The function actually wired for that strategy,
    `readExerciseRecoveryPathsReading` (read-sensors.ts:1028), states in its own
    docstring that it does \"no declined-origin special-casing\", and the
    strategy's live reading (\"exercised: 4/22 records; 18 null last_exercised;
    review_trigger firing not recorded (sensor read 2026-08-10)\") confirms the
    declined class is not broken out in production. Exactly one of the 22
    kind:delegation records is declined-origin
    (intentions/delegation-hosted-publishing.md, last_exercised null), and a
    declined record can never acquire last_exercised — so under the plain count
    the strategy's threshold (\"no record's last_exercised is null, and no fired
    review_trigger is left unactioned\") is unreachable by construction, and
    deriveGap reports a permanent false gap on that strategy that no drill work
    can ever close. The incompleteness is on strategy-exercise-recovery-paths'
    own record (its clarification and its threshold disagree with the shipped
    reading), which a per-node session serving strategy-graph-drives-dispatch
    cannot write; naming it here per the tactic-mode park rule and the
    unrecorded-context framing (strategy clarification 31 / condition 7) — the
    fix is an author /align pass on strategy-exercise-recovery-paths to complete
    its record. THREE MEASURED ADDENDA from the caller thread, not in the drift
    review above. (1) THE RULE WAS DROPPED SILENTLY, NOT SUPERSEDED BY ANY
    DECISION — this is the decisive fact for the ratification.
    intentions/tactic-exercised-paths-reading.md (phase done, PR #2857) is the
    plan that authored the orphan; its Unit 1 scope states the declined rule
    explicitly and cites both of its homes.
    intentions/tactic-first-sensor-pass.md (phase done) is the plan that
    authored the replacement readExerciseRecoveryPathsReading; grep its body for
    \"declined\" and you get ZERO hits — it re-specified the reading straight
    from the raw threshold string and never mentioned the clarification. So the
    shipped behaviour is a regression from an incomplete re-specification, not a
    considered simplification. Nothing anywhere in the graph records a decision
    to retire the rule, so \"still governs\" is the status-quo reading and \"no
    longer governs\" is the branch that needs a positive author ruling. (2) GREP
    TRAP — a future session must not re-derive \"the rule is unrecorded\". `grep
    declined intentions/strategy-exercise-recovery-paths.md` returns NOTHING,
    because the clarification text is capital-D \"Declined-origin\". The rule is
    also recorded a second, independent time at
    intentions/kind-delegation.md:43-49, which that file calls \"the abstention
    doctrine's one auditable home (2026-07-09)\". Both are unamended. Relatedly,
    readDelegationRecordsReading's docstring phrase \"the strategy's 2026-07-11
    clarification\" refers to strategy-exercise-recovery-paths clarification 1 —
    NOT strategy-graph-drives-dispatch clarification 7, which is also dated
    2026-07-11 but is about reading provenance. (3) TEST-INTEGRITY CONSTRAINT ON
    EITHER BRANCH. The orphan's two tests at
    packages/intentionsutil/test/delegation-records-sensor.test.ts:143-184 are
    the ONLY assertions of the rule anywhere (\"counts exercised,
    declined-class, and oldest last_assessed\" and \"never counts a declined
    record as unexercised (its own class)\"). On the still-governs branch they
    must be RETARGETED onto readExerciseRecoveryPathsReading, not deleted with
    the orphan — deleting the only coverage of behaviour that is still required
    is the weakening .claude/rules/test-integrity.md forbids. Only the
    no-longer-governs branch may delete them outright. In both branches
    readDelegationRecords (read-sensors.ts:917) and
    renderDelegationRecordsReport (read-sensors.ts:998, reached by the --report
    flag at line 1739) are LIVE and must survive."
  since: 2026-08-20
  recommendation: "Rule on ONE question at office hours: does
    strategy-exercise-recovery-paths clarification 1 (2026-07-11) still govern
    the reading landed by tactic-first-sensor-pass? Then unpark this node and
    re-run /align-tactics tactic-orphaned-delegation-records-reading, which can
    plan either branch in a single PR once the ruling exists. BRANCH A (still
    governs — the status-quo reading, since nothing records a supersession): in
    the same /align pass amend strategy-exercise-recovery-paths
    success_signal.threshold so declined-origin records are excluded from the
    no-null-last_exercised requirement, because deriveGap
    (packages/intentionsutil/src/sensors.ts:241-255) is trim+lowercase STRING
    EQUALITY between reading and threshold — fixing only the reading function
    cannot close the gap. This tactic then folds the declined/active filter pair
    (read-sensors.ts:973-975) into readExerciseRecoveryPathsReading, retargets
    the two rule tests onto it, and deletes the orphan. BRANCH B (no longer
    governs): record a dated supersession clarification on
    strategy-exercise-recovery-paths — and consider whether
    kind-delegation:43-49 needs a matching note — after which this tactic is
    plain dead-code removal of the orphan plus its tests. NOTE the threshold is
    unsatisfiable under Branch B too, for the same delegation-hosted-publishing
    reason, so Branch B still owes a threshold amendment or an explicit
    acceptance that this strategy's signal never validates. Either branch is a
    small PR; the ruling is the only blocker."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Orphaned readDelegationRecordsReading vs. exercise-recovery-paths counting rule

## Provenance

- `packages/intentionsutil/scripts/read-sensors.ts:899` — dead-code / doctrine-gap
  finding, deferred from the `/review-fix` code-review residue pass on this PR
  (bucket: Deferred, source: code-review). Not routed through the
  input-validation/red-team adversarial-verify pipeline, so no adversarial-verify
  verdict is recorded for it.
- Category: `readDelegationRecordsReading` has no remaining production caller —
  the sensor dispatch now routes `strategy-exercise-recovery-paths` through a
  different, newly added reading function — so only the test file still
  exercises it. Left as-is it can silently drift out of sync with the module.
- The non-trivial part is a semantics question, not a bug: the orphaned
  function is the only place that implements a rule for
  `strategy-exercise-recovery-paths` about not counting a delegation record
  with a "declined" origin as unexercised (such a record has no entered path
  to walk). Whether the newly landed per-strategy reading still needs to honor
  that rule, or whether the rule has been superseded by a simpler threshold
  count, is an open call for a human/author to make before the dead function
  and its tests can be safely removed.
- No runtime bug is implicated; this is dead code plus an unresolved reading-
  semantics decision.

Source PR: #3062

