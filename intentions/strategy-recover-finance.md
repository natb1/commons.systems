---
id: strategy-recover-finance
kind: strategy
statement: Recover financial visibility with owned, local-first budgeting
owner: human
status: codified
parent: strategy-recover-author-autonomy
serves:
  - virtue-progressive-detachment
recovers:
  - delegation-finance-saas
rationale: >-
  Assemble the household financial picture with owned tools instead of SaaS
  budgeting services that monetize the data they are shown
  (delegation-finance-saas). The artifacts are the budget web app and the
  budget-etl CLI: local-first analysis over the banks' own statement exports,
  encrypted .benc snapshots, nothing uploaded. Both are in daily use — this
  is the graph's exercised recovery, not a planned one.


  Financial visibility is itself instrumental, which is why this domain
  earns a strategy rather than just an app. It is the sensor supplying
  strategy-financial-sustainability's runway signal, and it is what keeps
  the paid vendor delegations honestly managed: paying a vendor imports
  "promote the vendor's growth via spend" — a minor capture recorded on
  delegation-anthropic-claude and delegation-firebase — and that import is
  only visible while the spend is visible.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal:
  observable: every month's financial picture assembled by the owned pipeline from bank exports
  sensor: the budget app and its encrypted snapshot history
  threshold: statements merged and categorized monthly with no SaaS budgeting service holding the data
  is_proxy: false
attributes:
  conditions:
    - banks keep supplying machine-readable statement exports
---
# Recover financial visibility with owned, local-first budgeting
