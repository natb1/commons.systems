---
id: strategy-user-onboarding
kind: strategy
statement: Onboard user-tier stakeholders through owned, QA-walked
  progressive-disclosure surfaces, lit only after tier-2 entry is declared
owner: human
status: raw
parent: strategy-promote-progressive-detachment
rationale: >-
  Users are tier 2 of the progressive-promotion ladder
  (strategy-progressive-validation). Onboarding surfaces — in-app chips, hero
  paths, step-by-step fork instructions — are invitations that create support
  obligations the moment someone follows them. A live path the author lacks the
  bandwidth to support sends a counterproductive signal: the one user who tries
  a stale chip is burned, which is a virtue-respect-for-persons failure worse
  than no invitation at all. So production apps run quiet until tier-2 entry is
  declared: app heroes carry the landing-style capability statement only, while
  the service-sales path stays open through the landing CTA and About page —
  kept relevant and reflecting current capability, without focusing on
  origination before users are supported.


  When tier 2 is declared, the progressive-disclosure ladder returns — easy (use
  it locally), medium (extend it, e.g. write a parser), hard (fork and host it)
  — which is strategy-open-source-as-gift's right-amounts clause applied to
  onboarding: each level increases the user's autonomy, not their dependency. It
  returns surface by surface, each flow QA-walked end-to-end before it is
  re-lit, each app exposing exactly one front door, with completion reports
  arriving over owned channels (repo issues, webmentions, email) rather than
  platform metrics — the sensor is the report, never an engagement dashboard
  (delegation-web-analytics stays untripped).
reading: null
gap: null
serves:
  - virtue-progressive-detachment
  - virtue-respect-for-persons
recovers: []
clarifications:
  - question: Why remove the already-shipped onboarding content instead of leaving
      it dormant until tier 2?
    answer: "Because it is not dormant — it is live and stale. The print hero ships
      two fork/open-in-Claude-Desktop chips and a 'you should try creating your
      own' note, and the budget hero ships the Easy analyze-locally panel with
      an inline fork-and-run-/budget-parser sentence; all predate the current
      design and give counterproductive signals. Decision: remove all of it
      (including the already-QA'd Easy chip and the print built-with note) and
      replace both app heroes with the landing hero — same
      headline/subline/CTAs, without the project demo cards — rendered only when
      viewing public demo data. The chip concepts are retained behind the tier-2
      gate in tactic-restore-onboarding-chips. Recorded 2026-07-06 interview."
  - question: "Where did gh #721 and #722 (restore the Medium and Hard budget chips
      after QA) land?"
    answer: Their QA-then-restore concept is retained in
      tactic-restore-onboarding-chips, a draft tactic under this strategy, now
      also covering the Easy chip that this round removes. The QA scopes (walk
      /budget-parser end-to-end against an unsupported format; walk
      fork-modify-firebase-deploy including the fork-to-deploy project gap) are
      preserved in that tactic's body. Restoration is gated on the tier-2 entry
      declaration on strategy-progressive-validation. Recorded 2026-07-06
      interview.
tooling_goals: []
success_signal:
  observable: non-author users complete an onboarding path end-to-end and a report
    of it reaches the author
  sensor: office-hours review of inbound reports (issues, webmentions, email)
  threshold: onboarding surfaces are live only after tier-2 entry is declared and
    each live surface's flow has been QA-walked end-to-end; at least one
    non-author completion is reported
  is_proxy: false
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
    - tier-2 (user) entry is declared on strategy-progressive-validation
      (explicit dated author clarification) before any onboarding surface is
      re-lit
    - each onboarding surface is QA-walked end-to-end before it goes live
    - the landing CTA and About page remain the ungated service-sales surface,
      kept accurate to current capability
---
# Onboard user-tier stakeholders through owned, QA-walked progressive-disclosure surfaces, lit only after tier-2 entry is declared
