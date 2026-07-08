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
  - question: What license carries the gift, and is whole-repo CC-BY-SA (code
      included) deliberate?
    answer: "CC-BY-SA 4.0 across the entire repo, deliberately uniform — this is the
      code-license record that strategy-recover-publishing's content-license
      clarification points to. Share-alike is the anti-enclosure clause: the
      capture open source suffered came through permissive portability (code
      moved freely between institutions while users gained no mobility), and
      share-alike resists re-enclosure of the gift. The license is also a
      stand-down precondition: if the project stops, the archives remain legally
      usable and forkable, so strategy-reversible-institution's
      degrade-to-referrals-and-archives path works with no live licensor.
      Creative Commons' own advice against CC licenses for software (no patent
      grant; adaptation semantics undefined for linking) is known and accepted:
      at individual scale with no patent portfolio the grant is moot, and one
      uniform share-alike license over prose, graph, and code is worth more than
      ecosystem convention — revisit only if a recipient reports a real
      integration blocker. Recorded 2026-07-08 interview."
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
    - the repo-wide CC-BY-SA 4.0 license persists, keeping archives legally
      forkable — the legal substrate of the stand-down path and of every
      fork-shaped gift
  traditions:
    - tradition-aristotle
---
# Open source as gift, not offering — transfer capability, not dependency
