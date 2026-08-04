---
id: delegation-banking
kind: delegation
statement: Money and payment rails delegated to retail banks
owner: human
status: raw
parent: null
rationale: "The accounts, the payment rails, and the authoritative transaction
  record live at retail banks. Recorded 2026-07-02 by the completeness sweep
  (strategy-complete-ledger): strategy-recover-finance's standing condition —
  banks keep supplying machine-readable statement exports — was reading against
  a delegatee with no record. The export path is currently healthy: every
  account feeding budget-etl has a working machine-readable export (owner
  interview, 2026-07-02), which is what keeps the owned financial picture
  assemblable. A future-candidate capture, raw per kind-delegation; axes below
  are a first pass, not an assessment. Axis resolution
  (tactic-delegation-classification-derivation, 2026-08-04): divergence was
  recorded as `low-moderate` before the axes were enum-ized; resolved to
  `moderate` — the bank holds the authoritative transaction record and the
  imported fee structures and product upsells are standing pressure, which is
  buy-in rather than a separable tool. recovery_cost resolved to `moderate` —
  the recorded assessment was days per account move, with rewiring direct
  deposit and autopay the friction."
reading: null
gap: null
serves: []
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
  delegatee: retail banks and payment networks
  delegated: custody of money, payment execution, and the authoritative transaction record
  origin: inherited
  divergence:
    level: moderate
    imported:
      - fee structures and product upsells
      - the bank's data practices around transaction history
    contradictions: []
  irreversibility:
    recovery_path: substitute — accounts replicate at competing banks; the owned
      statement archive (strategy-recover-finance) keeps the record portable
    recovery_cost: moderate
    gated:
      level: partial
      note: the authoritative record is the bank's; the exercised export bounds the
        loss
    last_exercised: null
  non_delegable_floor: reading the statements — assembling and auditing the
    household picture from raw exports
  review_trigger: any account losing its machine-readable export path
    (strategy-recover-finance's condition failing), or selection as a recovery
    domain
  last_assessed: 2026-07-02
  household:
    shared: true
    basis: The record's non_delegable_floor names assembling and auditing the
      household financial picture; household accounts, direct deposit, and
      autopay are jointly held, so a bank move changes the household's daily
      finances.
    consent: []
    preferences: []
---
# Money and payment rails delegated to retail banks
