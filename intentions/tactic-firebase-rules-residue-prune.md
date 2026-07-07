---
id: tactic-firebase-rules-residue-prune
kind: tactic
statement: "Prune dead Firebase rules surface: budget's legacy group-sharing
  collections and Storage's legacy member_N metadata fallback"
owner: ai
status: raw
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy code review:
  firestore.rules still defines the full legacy group-shared budget data model
  (budget/{env}/transactions etc. with groupId/memberEmails auth) though no
  runtime path reads or writes those collections — budget is local-first now and
  its entity types keep groupId/memberEmails only for format compatibility; and
  storage.rules carries the pre-#1301 member_0..2 metadata fallback whose
  removal awaits a metadata migration nothing tracks. Dead rules are
  review/attack surface implying a sharing model the products no longer have.
  Fits strategy-firebase-demo-saas's no-dead-code invariant (rules surface is
  not import-reachability, so tactic-firebase-integration-audit alone will not
  catch it). Retained as a draft for /align-tactics."
reading: null
gap: null
serves:
  - strategy-firebase-demo-saas
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
# Prune dead Firebase rules surface: budget's legacy group-sharing collections and Storage's legacy member_N metadata fallback
