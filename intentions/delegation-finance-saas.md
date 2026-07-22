---
id: delegation-finance-saas
kind: delegation
statement: Financial visibility delegated to SaaS budgeting tools
owner: human
status: codified
parent: null
rationale: >-
  The Mint/YNAB class of delegation: hand the household financial picture to a
  SaaS service and receive convenience priced in the data itself — the service's
  business is monetizing what it is shown. The capability ultimately serves
  strategies that require tracking the finances: the runway rule of
  strategy-financial-sustainability, and honest management of the paid vendor
  delegations (delegation-anthropic-claude, delegation-firebase), whose spend
  imports the minor capture of promoting a vendor's growth — visible only while
  the spend is visible.


  This is the graph's first exercised recovery: the budget app and budget-etl
  replaced the SaaS class outright (strategy-recover-finance) and are in daily
  use, so last_exercised below is a real date, not a hope. The classification
  records the edge as the standing offer presents it; the exercised substitute
  is what keeps the record from being a live capture.
reading: null
gap: null
serves:
  - strategy-financial-sustainability
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
  delegatee: SaaS budgeting and financial-visibility services (the Mint/YNAB class)
  delegated: assembling and categorizing the household financial picture
  origin: inherited
  divergence:
    level: high
    imported:
      - monetization of financial data
      - engagement with the service's plans and upsells
    contradictions:
      - virtue-alignment-of-attachments
  irreversibility:
    recovery_path: substitute — the budget app plus the budget-etl CLI over the
      banks' own statement exports; encrypted local .benc snapshots; nothing
      uploaded
    recovery_cost: already paid — the owned pipeline is the daily tool; residual
      cost is writing a parser when a bank changes its export format
    gated: false — the source data is the banks' exports, not the budgeting
      service's records
    last_exercised: 2026-06-30
  classification: captured
  non_delegable_floor: reading a bank statement and knowing where the money went —
    the categorization judgment itself
  review_trigger: a bank withdrawing machine-readable exports; the owned pipeline
    falling out of monthly use
  last_assessed: 2026-07-02
  household:
    shared: true
    basis: The delegated capability is assembling and categorizing the household
      financial picture; its exercised recovery (the budget app) serves the
      household.
    consent: []
    preferences: []
---
# Financial visibility delegated to SaaS budgeting tools
