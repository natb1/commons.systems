---
id: strategy-durable-owned-data
kind: strategy
statement: Keep owned data durable — redundant copies, tested restores, an
  archive the household can read
owner: human
status: refining
parent: null
rationale: >-
  The recover-* family moves data out of platforms into owned storage — repos,
  encrypted .benc snapshots, plain-text notes, exported records — but no
  strategy owns what happens to it there. Local-first without a durability
  practice trades platform capture for single-substrate fragility: the
  irreversibility axis inverted, loss by disk instead of loss by lockout. The
  honest current state: copies are ad-hoc — a Google Drive shared drive and the
  dev machine — with no tested restore. That Drive dependency now carries its
  own record (delegation-cloud-backup, recorded 2026-07-02 by the completeness
  sweep); whether this strategy's redundancy design keeps Drive as one audited
  leg or replaces it is decided here, with the record keeping the dependency
  visible either way.

  This strategy owns the standing practice: every owned-data class carries a
  redundant copy including one off-machine, restores are actually rehearsed
  rather than assumed, and the archive is readable by the household — the
  requirement strategy-household-shared-attachments states ("an export only the
  author can read is not a recovered family archive") lands here. Household
  legibility is virtue-respect-for-persons content per the continuity scope
  clarified 2026-07-02, not just detachment hygiene. For the encrypted classes,
  legibility depends on key continuity, which strategy-secure-identity-root owns
  — the two strategies are halves of one continuity practice: that one keeps the
  keys reachable, this one keeps the data worth reaching.
reading: ad-hoc copies (Google Drive shared drive, dev machine); no tested
  restore (owner interview, 2026-07-02)
gap: reading "ad-hoc copies (Google Drive shared drive, dev machine); no tested
  restore (owner interview, 2026-07-02)" does not meet threshold "no owned-data
  class has a single copy, a restore has been rehearsed within the review cycle,
  and the household can read the archive"
serves:
  - virtue-progressive-detachment
  - virtue-respect-for-persons
recovers: []
clarifications: []
tooling_goals: []
success_signal:
  observable: every owned-data class has a redundant off-machine copy and a
    rehearsed restore, in a form the household can read
  sensor: owner review at office-hours
  threshold: no owned-data class has a single copy, a restore has been rehearsed
    within the review cycle, and the household can read the archive
  is_proxy: true
attributes:
  conditions:
    - storage redundancy stays affordable at individual scale (local disks plus
      one off-site copy)
---
# Keep owned data durable — redundant copies, tested restores, an archive the household can read
