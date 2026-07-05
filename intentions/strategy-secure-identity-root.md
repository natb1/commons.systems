---
id: strategy-secure-identity-root
kind: strategy
statement: Keep the identity root recoverable by more than one person —
  documented custody, break-glass, a second key-holder
owner: human
status: refining
parent: null
rationale: >-
  delegation-identity-root names the concentration: the Cloudflare account,
  the DNS zones, and the local pass/GPG keys gate every other recovery path
  in this graph — losing the root is not one more capture but loss of the
  mobility substrate itself. The current custody state, stated honestly: a
  single holder, nothing documented. Every recovery path the graph keeps warm
  therefore bottoms out in one person's memory, which fails the graph's own
  test — an unexercised path is a hope, and an undocumented one is not even
  that.

  This strategy owns the standing custody practice: a written, findable
  break-glass procedure covering account recovery and key custody; a second
  custodian in the household holding working access to it; and a rehearsal on
  the record's review cadence — a household member actually walking the
  procedure, since a walk-through only the author can perform proves nothing
  about continuity. The continuity half is virtue-respect-for-persons applied
  inward per the household scope clarified 2026-07-02: shared data and the
  identity root must remain reachable by the household when the author is
  unavailable — an archive or a root only the author can open treats them as
  dependents, not persons. The keys secured here are also what
  strategy-durable-owned-data's encrypted backups (the .benc snapshots)
  decrypt with; durability without key continuity is an archive nobody can
  open.

  Carries no recovers edge: like strategy-open-weight-readiness, this
  maintains the path rather than unwinding the delegation; the walked
  registrar-transfer drill itself belongs to strategy-exercise-recovery-paths.
reading: "single holder, nothing documented (owner interview, 2026-07-02)"
gap: reading "single holder, nothing documented (owner interview, 2026-07-02)"
  does not meet threshold "the procedure exists, a second custodian holds it,
  and a rehearsal by someone other than the author is recorded within the
  review window"
serves:
  - virtue-progressive-detachment
  - virtue-respect-for-persons
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: a documented break-glass procedure for the account root and key
    custody, held and rehearsed by a second custodian
  sensor: owner review at office-hours over delegation-identity-root
  threshold: the procedure exists, a second custodian holds it, and a rehearsal
    by someone other than the author is recorded within the review window
  is_proxy: false
attributes:
  conditions:
    - a willing second custodian exists in the household
    - registrars and key tooling keep transfer and export paths open at
      individual scale
---
# Keep the identity root recoverable by more than one person — documented custody, break-glass, a second key-holder
