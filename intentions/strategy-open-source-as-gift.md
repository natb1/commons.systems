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
  - question: What counts as a public artifact for the threshold's per-artifact
      documentation obligation?
    answer: "Working definition adopted by round 1: the whole-repo fork surface (the
      harness distributes by whole-repo fork; its fork documentation is the root
      README.md) plus each publicly deployed app — the Firebase hosting targets
      enumerated in .firebaserc (landing, budget, fellspiral, print, audio,
      office-hours), each mapping to its same-named source directory. Supporting
      package docs such as packages/ds/README.md aid fork viability but are not
      independently enumerated artifacts. The census instrument derives the app
      list mechanically from .firebaserc so a newly deployed app enters the
      census automatically; the owner can amend this definition when recording
      the first reading. Recorded 2026-07-11 /align-tactics round."
  - question: Why does round 1 only instrument measurement instead of closing the
      documentation gap?
    answer: "Two reasons. Minimum-to-signal: reading is null, so the round must
      first buy the instrument that makes the sensor runnable — a
      documentation-coverage census reporting, per public artifact, whether fork
      documentation exists, with the sufficiency judgment left to the
      office-hours review. Sibling gating: the flagship doc-writing work (budget
      shallow-fork docs and the app-extraction mechanism) already exists as
      tactic-shallow-fork-docs, a draft under strategy-distribute-workflow
      deliberately kept invitation-gated behind tactic-tier3-entry-declaration
      per that strategy's recorded disposition; this round does not duplicate or
      bypass that author decision. Gap closure is next-round work, informed by
      the first reading. Recorded 2026-07-11 /align-tactics round."
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
rounds:
  count: 1
  last_completed: 2026-07-11
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
