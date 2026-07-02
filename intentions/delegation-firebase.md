---
id: delegation-firebase
kind: delegation
statement: App hosting and backend delegated to Firebase
owner: human
status: codified
parent: null
serves:
  - strategy-recover-author-autonomy
rationale: >-
  Firebase hosts the deployed apps and supplies the thin backend surface
  (hosting, Firestore, functions) behind them. The apps are deliberately
  local-first — user data lives in user-held files, not in the backend — so
  the delegation stays shallow by design: what Firebase holds is
  deployment convenience, not user capability. The easiest of the current
  infrastructure migrations.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal: null
attributes:
  delegatee: Firebase (Google)
  delegated: static hosting, Firestore for the office-hours/dispatch surfaces, scheduled functions
  origin: chosen
  divergence:
    level: low
    imported:
      - Blaze billing model
      - quota and service policies
    contradictions: []
  irreversibility:
    recovery_path: >-
      re-host — static apps deploy anywhere; the Firestore surfaces are small
      and behind an abstraction; functions are portable Node
    recovery_cost: low; the local-first design keeps user data out of the migration entirely
    gated: false
    last_exercised: null
  classification: platform
  non_delegable_floor: user data never lives only in the backend — local-first files are the source of truth
  review_trigger: pricing or quota changes that break the runway rule; service deprecations
  last_assessed: 2026-07-02
---
# App hosting and backend delegated to Firebase
