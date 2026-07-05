---
id: strategy-autonomous-execution
kind: strategy
statement: Run tactical execution through an owned autonomous dispatch chain
owner: human
status: codified
parent: strategy-owned-orchestration
serves:
  - virtue-progressive-detachment
  - virtue-alignment-of-attachments
rationale: >-
  The dispatch workflow is a project in its own right and carries its
  intentions here like any other. The autonomous chain — issue to plan to
  implement to review to QA — converts tactical execution into strategic
  attention: intent enters as issues, the chain does the tactical work, and
  the human engages at escalation points rather than in every step. The
  office-hours app is its observability surface: backlog runway, capacity
  band, escalations, and the intention tree itself.


  The whole chain is skills and scripts in the repo, forkable and locally
  run — no platform runtime, per its parent strategy-owned-orchestration.
  That makes it the artifact most distinctive for practitioner distribution:
  dual-tier in the strategy-progressive-validation sense, the author's daily
  development tool and the thing a practitioner would most plausibly fork.
reading: null
gap: null
clarifications: []
tooling_goals: []
success_signal:
  observable: attention economics — the chain drains the backlog while human escalations stay bounded
  sensor: the office-hours dashboard (backlog runway, capacity band, escalation queue)
  threshold: backlog runway stays inside the capacity band without escalation volume exceeding office-hours capacity
  is_proxy: true
attributes:
  conditions:
    - frontier-agent access remains economical at individual scale
    - escalation volume stays within office-hours capacity
---
# Run tactical execution through an owned autonomous dispatch chain
