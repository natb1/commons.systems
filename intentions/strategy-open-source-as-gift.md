---
id: strategy-open-source-as-gift
kind: strategy
statement: Open source as gift, not offering — transfer capability, not dependency
owner: human
status: codified
parent: strategy-promote-progressive-detachment
rationale: >-
  Open source got captured because it optimized for code portability while
  leaving user portability unaddressed. Artifacts moved freely between
  institutions; users did not gain mobility. The license guaranteed that the
  code could be forked, but said nothing about whether the people running the
  code on your behalf had any interest aligned with yours. The lesson: optimize
  for human freedom, not code freedom.


  Gifts are designed to transfer capability, not just tools. The budget tool's
  progressive disclosure — easy (analyze locally), medium (write a parser), hard
  (fork and host) — is structured so each level increases the user's autonomy
  rather than their dependency on the project.


  Forkability without documentation is a hollow gift — a fork becomes a
  maintenance burden if the recipient cannot understand the architectural
  decisions behind it. The project has an ongoing obligation to keep shallow
  forks viable: composable skill-based architecture, the design system
  documented at packages/ds/README.md, and agent-assisted maintenance that
  lowers the cost of iterating on a fork.
reading: null
gap: null
serves:
  - virtue-respect-for-persons
recovers: []
clarifications:
  - question: Which tradition names the gift?
    answer: "Aristotelian liberality — eleutheriotēs, NE IV.1 (recorded 2026-07-04
      interview): the virtue of giving the right things, in the right amounts,
      from the right motive. Aristotle's mark of giving badly is giving that
      binds the recipient to the giver; 'transfer capability, not dependency' is
      that mark stated as a design requirement, and progressive disclosure
      (easy/medium/hard) is liberality's right-amounts clause. The gift shape
      was chosen before it was named; the naming makes it auditable
      (tradition-aristotle, adopted)."
tooling_goals: []
success_signal:
  observable: shallow-fork viability — a fork can be understood and iterated by
    its recipient without the author
  sensor: fork reviews and practitioner reports at office-hours
  threshold: each public artifact carries documentation sufficient for a shallow
    fork to stand alone
  is_proxy: true
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - agent-assisted maintenance keeps shallow forks viable for recipients
  traditions:
    - tradition-aristotle
---
# Open source as gift, not offering — transfer capability, not dependency
