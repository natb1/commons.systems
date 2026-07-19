---
id: tactic-mainqa-landing-pageshell
kind: tactic
statement: Visual smoke of the landing PageShell refactor in production —
  renders equivalently to the pre-refactor template aside from the documented
  deliberate deviations
owner: human
status: delegated
parent: null
rationale: "Migrated 2026-07-05 from the legacy gh main-qa office-hours queue
  (target-state review): issue 2669. The landing page is the practice's public
  promotion surface; the subjective before/after visual judgment needs a human
  against deployed production."
reading: null
gap: null
serves:
  - strategy-promote-progressive-detachment
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: main-qa
execution: null
validates: []
blocked_by: []
office_hours:
  reason: subjective visual before/after judgment against deployed production —
    human-only (~10 min)
  since: 2026-07-05
  recommendation: null
pace_exempt: false
rounds: null
attributes: {}
---
# Visual smoke of the landing PageShell refactor in production — renders equivalently to the pre-refactor template aside from the documented deliberate deviations

## Context

Migrated from the legacy gh main-qa queue (target-state review); migration
record: tactic-mainqa-first-class-phase. Source issue (closed, content
preserved here): 2669 — needs-main residue from the landing PageShell
refactor (issue 2553, PR 2665). Subjective visual before/after judgment
against deployed production, with named deliberate deviations. Human-only,
~10 minutes in a browser.

## Verification checklist

1. Landing renders equivalently to the pre-refactor template in production
   aside from the documented deliberate deviations: narrow-overlay anchor
   below the hero, sticky offset ~3rem shift, grid `align-items:start` drop,
   footer via PageShell Footer.
2. Narrow-viewport panel collapse still works at narrow breakpoints.
3. The sticky offset shift is visually acceptable; the footer renders
   correctly via the PageShell Footer component.

## Completion

Pass → `phase: done` (prune). Broken → author an implement tactic with the
finding and prune this one. Clear the park by committing the outcome to this
node.
