---
id: strategy-recover-finance
kind: strategy
statement: Recover financial visibility with owned, local-first budgeting
owner: human
status: codified
parent: strategy-recover-author-autonomy
rationale: >-
  Assemble the household financial picture with owned tools instead of SaaS
  budgeting services that monetize the data they are shown
  (delegation-finance-saas). The artifacts are the budget web app and the
  budget-etl CLI: local-first analysis over the banks' own statement exports,
  encrypted .benc snapshots, nothing uploaded. Both are in daily use — this is
  the graph's exercised recovery, not a planned one.


  Financial visibility is itself instrumental, which is why this domain earns a
  strategy rather than just an app. It is the sensor supplying
  strategy-financial-sustainability's runway signal, and it is what keeps the
  paid vendor delegations honestly managed: paying a vendor imports "promote the
  vendor's growth via spend" — a minor capture recorded on
  delegation-anthropic-claude and delegation-firebase — and that import is only
  visible while the spend is visible.
reading: null
gap: null
serves:
  - virtue-progressive-detachment
recovers:
  - delegation-finance-saas
clarifications:
  - question: Can statement exports overlap — can multiple exports reference the
      same transactions and carry same-month balance snapshots?
    answer: "Yes — exports are overlapping evidence over one underlying ledger.
      Multiple exports may carry the same transactions, and multiple balance
      observations may land in the same account-month; the merge must accept
      both. Found live 2026-07: budget-etl's
      one-balance-anchor-per-account-month invariant (dedupStatementData) failed
      a monthly sync on overlapping same-month exports that were mutually
      consistent. Recorded 2026-07-06 interview."
  - question: How is disagreement between overlapping balance observations handled?
    answer: "Surface, don't gate: the merge accepts overlapping anchors, keeps the
      latest as-of-date observation per month (until anchors are keyed by as-of
      date), and logs the reconciliation delta. Adjudication lives in the budget
      app's existing divergence surface (balance.ts computeNetWorth
      divergences), which already treats pending-charge noise in exports as
      expected. No tolerance constant in the merge; a sync never blocks on bank
      noise. Recorded 2026-07-06 interview."
  - question: What identifies a transaction across overlapping exports?
    answer: (institution, account, FITID) — statement-independent. The current doc
      ID embeds the carrying export's statement month, so overlapping exports
      whose balance dates land in different months silently duplicate shared
      transactions. Migrating identity requires deterministically remapping
      doc-ID-keyed data carried in the snapshot (old IDs are recomputable from
      stored fields). Recorded 2026-07-06 interview.
  - question: How does budget-etl resolve the snapshot decryption password?
    answer: "Env var first, macOS Keychain as explicit opt-in fallback, hard fail
      with guidance when neither — BUDGET_ETL_PASSWORD (sourced from pass/GPG,
      so non-macOS hosts resolve without the macOS security tool) takes
      precedence over --keychain, and
      projects/budget-etl/internal/password/password.go is the single resolution
      point all subcommands share. The requirement underneath: secrets are
      session-scoped and never persist to disk in plaintext — no interactive
      prompt, no config-file password, failure is fast and self-describing
      rather than silently degraded. Recorded 2026-07-07 interview."
  - question: Why is the budget app's statements-folder grant read-only?
    answer: Bank statement exports are evidence the app must never mutate or upload.
      The standing File System Access grant to the statements folder is
      read-only by construction — mode:'read' at every permission call
      (budget/src/statements-dir.ts) plus a path-traversal guard on file
      resolution — a structural guarantee, not a convention. If a future feature
      ever needs to write near the originals (archiving, renaming), it takes a
      separate readwrite grant on a different handle; this handle is
      deliberately never widened. Recorded 2026-07-07 interview.
tooling_goals: []
success_signal:
  observable: every month's financial picture assembled by the owned pipeline from
    bank exports
  sensor: the budget app and its encrypted snapshot history
  threshold: statements merged and categorized monthly with no SaaS budgeting
    service holding the data
  is_proxy: false
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds:
  count: 1
  last_completed: 2026-07-06
attributes:
  conditions:
    - banks keep supplying machine-readable statement exports
    - banks keep FITIDs unique and stable per account (the OFX contract) — a
      recycled or unstable FITID silently merges or duplicates distinct
      transactions
---
# Recover financial visibility with owned, local-first budgeting
