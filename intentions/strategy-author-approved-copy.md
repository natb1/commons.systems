---
id: strategy-author-approved-copy
kind: strategy
statement: Author approval gates all outward-facing copy — user-, practitioner-,
  collaborator-, and prospect-facing narrative surfaces ship only wording the
  author has ratified
owner: human
status: raw
parent: strategy-promote-progressive-detachment
rationale: "Public copy is what the three audience tiers — users, practitioners,
  collaborators, and their prospects — actually encounter; it is the project's
  voice, and nearly all of it is drafted by the delegatee under audit. Three
  nodes already implemented the rule locally and consistently before it had a
  home: tactic-readme-copy-approval (a born-parked gate blocking the README
  rewrite), strategy-services-funnel (an office_hours park whose clearing is the
  author's go-ahead for the copy pass), and strategy-user-onboarding (QA-walked
  surfaces). This strategy generalizes them: any tactic producing in-scope copy
  is blocked_by a human-owned, office_hours-parked approval gate tactic, with
  the draft copy carried in the graph so the author ratifies or revises it
  before implementation runs — implementation wordsmiths only within approved
  copy. The gate is also the audit point the drafting delegations lack: it
  catches imported framing (delegation-anthropic-claude) and re-introduces the
  author as the misarticulation sensor wherever delegated articulation reaches
  public surfaces (delegation-philosophical-articulation)."
reading: null
gap: null
serves:
  - virtue-respect-for-persons
  - virtue-philosophical-mobility
recovers:
  - delegation-anthropic-claude
  - delegation-philosophical-articulation
clarifications:
  - question: What counts as in-scope copy?
    answer: "The narrative surfaces: landing, about page, app heroes and onboarding
      text, README, and blog posts. Deliberately excluded: in-app UI strings
      (high volume, low identity-stakes), practitioner reference docs
      (SCHEMA.md, package READMEs — closer to code than positioning), and GitHub
      issue/PR prose (gating it would gate the whole dispatch chain). A later
      clarification may widen the set; until then exclusion is the recorded
      default. Recorded 2026-07-07 interview."
  - question: What is the standard approval mechanism?
    answer: "The born-parked gate pattern from tactic-readme-copy-approval,
      standardized: any tactic producing in-scope copy is blocked_by a
      human-owned (owner: human, status: delegated) approval tactic parked
      office_hours. The draft copy lives in the gated tactic's body; at
      office-hours the author ratifies or revises it there, records the outcome
      as a dated clarification on the serving strategy, and completes the gate,
      which unblocks the work. Recorded 2026-07-07 interview."
  - question: When must approval happen?
    answer: "Before implementation, not before merge: copy is drafted into the graph
      at planning time and approved before the implementing session runs, so
      delegatee-drafted framing never reaches review unseen. Implementation
      settles remaining wording only within the approved copy. Recorded
      2026-07-07 interview."
  - question: Are any copy changes exempt?
    answer: Mechanical fixes only — typos, broken links, and factual corrections
      that change no framing and add no claims ship ungated. Anything that
      reframes, repositions, or introduces a claim is not mechanical; any doubt
      means gated. Recorded 2026-07-07 interview.
  - question: Does the rule apply retroactively to deployed copy?
    answer: No — existing deployed copy is grandfathered as implicitly approved, and
      the rule applies to changes from now on. No retroactive audit tactic; the
      author declined that option. Recorded 2026-07-07 interview.
  - question: Why does an approval gate carry recovers edges to two delegations?
    answer: Both are partial recoveries through the same mechanism — the author
      re-enters the loop on delegatee-drafted public language.
      delegation-anthropic-claude lists framing risk from agent drafting among
      its divergence imports; the gate is where imported framing gets caught
      before it ships. delegation-philosophical-articulation's named hazard is
      that the misarticulation sensor is the delegated thing itself; copy
      approval partially reintroduces the author as that sensor wherever
      delegated articulation reaches public surfaces. Recorded 2026-07-07
      interview.
tooling_goals: []
success_signal:
  observable: every merged change to in-scope copy traces to a recorded author
    approval — a completed gate tactic or a dated clarification naming the
    approved wording
  sensor: owner audit of merged copy changes at office-hours
  threshold: zero in-scope copy changes deployed without a recorded approval
  is_proxy: false
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
    - the author clears approval gates at office-hours regularly enough that
      parked copy work does not become the queue's bottleneck — if cadence
      lapses, the gate design is revisited rather than bypassed
    - the in-scope boundary holds as recorded — narrative surfaces only; UI
      strings, reference docs, and GitHub prose stay excluded unless a later
      clarification widens it
    - the mechanical-fix exemption stays narrow — no reframing and no new
      claims; any doubt means gated
---
# Author approval gates all outward-facing copy — user-, practitioner-, collaborator-, and prospect-facing narrative surfaces ship only wording the author has ratified
