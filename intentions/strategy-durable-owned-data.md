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
clarifications:
  - question: What is the durable at-rest contract for encrypted owned data?
    answer: "The BENC container: [magic \"BENC\" 4B][salt 16B][IV 12B][AES-256-GCM
      ciphertext+tag], key derived via PBKDF2-HMAC-SHA256 at 600,000 iterations
      with a per-file salt — implemented byte-for-byte in TypeScript
      (packages/crypto-core) and Go (budget-etl internal/export). PBKDF2 over a
      memory-hard KDF is deliberate: WebCrypto plus Go-stdlib portability keeps
      the format decodable everywhere with zero exotic dependencies. The
      password is the sole secret, held session-only in the browser and never
      persisted — no key escrow by design; key continuity is
      strategy-secure-identity-root's half of the practice. Recorded 2026-07-07
      interview."
  - question: What are the known hazards in that contract?
    answer: "Two, same drift class as the tracked crypto-core duplication: the
      header carries no format-version/KDF-params byte, so a parameter change
      silently breaks TS-Go round-trips of financial data; and the snapshot JSON
      schema is hand-mirrored between the Go and TS validators, mitigated only
      by a golden fixture. Both queued at tactic-benc-format-versioning, to land
      coordinated with tactic-crypto-core-consolidate as one format epoch.
      Recorded 2026-07-07 interview."
  - question: What is the on-disk write pattern for user-held files?
    answer: "User-held files are the system of record: budget overwrites the on-disk
      .benc via debounced FSA write-back with generation counters and
      abort-on-failure (a truncated file never replaces the original);
      print/audio persist app state to plain-JSON .commons-* sidecars inside the
      user's own folder so it rides their folder sync and works unauthenticated;
      Go writes are atomic temp+rename; validation runs only at the write
      boundary so an older file always loads. Deliberately no replication or
      sync engine (no CRDTs, no offline queue): your-files-on-your-disk is the
      ownership claim, and cross-device continuity is the user's folder-sync
      choice. Recorded 2026-07-07 interview."
  - question: What owned-data classes does the durability practice cover, as
      instrumented this round?
    answer: "First-pass inventory instrumented by the durability audit
      (tactic-durability-audit-instrument), carried as owner-editable manifest
      data rather than hard-coded: (1) encrypted budget .benc snapshots —
      user-held file plus the Google Drive shared-drive copy
      (delegation-cloud-backup); (2) bank statements — plaintext downloads on
      the same shared drive; (3) app sidecar state — plain-JSON .commons-*
      directories inside the user's own media folders (print/audio), riding the
      user's folder sync; (4) git repositories including this intention graph —
      local checkout plus GitHub. The inventory is a first pass for the owner to
      ratify or amend at the born-parked redundancy-design decision
      (tactic-durability-redundancy-design); the audit reads it as data, so
      amending the inventory needs no re-plan. Recorded 2026-07-11
      /align-tactics round."
tooling_goals: []
success_signal:
  observable: every owned-data class has a redundant off-machine copy and a
    rehearsed restore, in a form the household can read
  sensor: owner review at office-hours
  threshold: no owned-data class has a single copy, a restore has been rehearsed
    within the review cycle, and the household can read the archive
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 0
  last_completed: null
attributes:
  conditions:
    - storage redundancy stays affordable at individual scale (local disks plus
      one off-site copy)
---
# Keep owned data durable — redundant copies, tested restores, an archive the household can read
