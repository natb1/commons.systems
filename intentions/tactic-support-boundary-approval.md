---
id: tactic-support-boundary-approval
kind: tactic
statement: Approve the practitioner support-boundary copy at office-hours —
  ratify or revise the draft SUPPORT.md text before it lands on the public repo
owner: human
status: delegated
parent: null
rationale: "Born-parked copy gate (the tactic-readme-copy-approval pattern): the
  support boundary is public repo copy stating what the author does and does not
  stand behind — the wording is the author's, not claude-decidable.
  tactic-practitioner-support-boundary is blocked_by this tactic, so the router
  cannot select the SUPPORT.md implementation until the author records approval
  here. Approving this copy also completes the first tier-entry-test
  prerequisite recorded on strategy-progressive-validation."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Author sign-off on public-facing copy: review the draft SUPPORT.md text
    and the README pointer sentence carried in
    tactic-practitioner-support-boundary's body; ratify or revise. The boundary
    states what is supported (nothing on a committed timeline — tier 3 is not
    entered), what is best-effort, and what is not supported. Honest no-SLA
    scope-setting, the gift-consistent form of support."
  since: 2026-07-11
  recommendation: Ratify or revise at office-hours; record the outcome as a dated
    clarification on strategy-distribute-workflow; then complete this tactic,
    which unblocks tactic-practitioner-support-boundary. ~15 author-minutes.
pace_exempt: false
rounds: null
attributes: {}
---
# Approve the practitioner support-boundary copy at office-hours — ratify or revise the draft SUPPORT.md text before it lands on the public repo

Born-parked human gate (the tactic-readme-copy-approval pattern), minted by
the 2026-07-11 /align-tactics round. tactic-practitioner-support-boundary is
blocked_by this tactic, so the SUPPORT.md implementation cannot run until
the author records approval here.

## What to review

All draft copy lives in tactic-practitioner-support-boundary's body, under
"Draft copy":

- The proposed `SUPPORT.md` text — supported (nothing on a committed
  timeline), best-effort (issues read; docs accurate because the author's
  workflow depends on them), not supported (no SLA, no compatibility
  guarantees, no roadmap requests, no monitored channel;
  fork-and-adapt is the intended consumption).
- The README pointer sentence for "## Usage and Contributing".
- Placement: root `SUPPORT.md` (GitHub's new-issue support surface) — veto
  or relocate if the author prefers a different home.

## What approval means

Ratify the copy as-is or revise it. Record the outcome as a dated
clarification on strategy-distribute-workflow (the approved wording, or the
revision and why). Then complete this tactic, which unblocks
tactic-practitioner-support-boundary; the implementing session settles
remaining wording only within the approved copy. Approving this also
completes the first tier-entry-test prerequisite consumed by
tactic-tier3-entry-declaration.
