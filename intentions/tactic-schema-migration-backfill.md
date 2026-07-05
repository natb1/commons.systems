---
id: tactic-schema-migration-backfill
kind: tactic
statement: Backfill pre-schema tactic nodes whose dispatch state still squats
  under attributes.* instead of the promoted top-level fields
owner: ai
status: raw
parent: tactic-graph-native-dispatch
rationale: "Surfaced by the /review-fix pass on PR #2764
  (tactic-align-tactics-skill): intentions/tactic-token-economy-sensor.md still
  carries phase/execution/validates squatted under attributes (e.g.
  attributes.phase: implement) even though tactic-graph-dispatch-schema, which
  promoted those fields to top level, is itself already phase: done.
  align-tactics/SKILL.md's Idempotency section
  (.claude/skills/align-tactics/SKILL.md:75-90) reads a candidate child's phase
  as a top-level field; against an un-migrated node this reads as phase-absent,
  misclassifying already-planned work as an untriaged draft. Code-review
  verdict: real, but out of this PR's contract (align-tactics does not own the
  schema migration) — deferred per strategy clarification 19 as a draft tactic
  rather than a gh follow-up."
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
attributes:
  review_finding:
    source_pr: 2764
    location: .claude/skills/align-tactics/SKILL.md:75-90
    example_unmigrated_node: "intentions/tactic-token-economy-sensor.md (attributes.phase: implement)"
    failure_scenario: align-tactics (re-)invoked on a strategy whose existing
      children are still in the un-migrated attributes.* shape reads an
      already-planned child's top-level phase as absent and re-plans or
      misclassifies it as a draft.
    verdict: confirmed, out-of-contract for tactic-align-tactics-skill; the fix is a
      data migration, not a skill-authoring change
---
# Backfill pre-schema tactic nodes whose dispatch state still squats under attributes.* instead of the promoted top-level fields
