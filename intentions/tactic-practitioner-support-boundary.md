---
id: tactic-practitioner-support-boundary
kind: tactic
statement: Write the practitioner support boundary — what /align-init and the
  entry point tell forkers is supported, best-effort, and not supported
owner: ai
status: codified
parent: null
rationale: "Retained from gh #2452 during the 2026-07-06 tier-gate interview.
  This is the first step of tier-3 entry: per strategy-progressive-validation's
  tier-entry test, the support boundary is written before any invitation ships.
  Honest scope-setting is the gift-consistent form of support
  (strategy-open-source-as-gift: transfer capability, not dependency)."
reading: null
gap: null
serves:
  - strategy-distribute-workflow
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-practitioner-support-boundary
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: eba54509bcf50288fd06dd7b30c182cfbf2fb51a12cccdb42b230c0a53b3f2d0
validates: []
blocked_by:
  - tactic-support-boundary-approval
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Write the practitioner support boundary — what /align-init and the entry point tell forkers is supported, best-effort, and not supported

## Context

Retained from gh #2452 (2026-07-06 tier-gate interview) and planned by the
2026-07-11 /align-tactics round. This is the first tier-entry-test
prerequisite on strategy-progressive-validation: the support boundary is
written before any invitation ships. Honest scope-setting is the
gift-consistent form of support (strategy-open-source-as-gift: transfer
capability, not dependency). Writing the boundary creates no obligation —
it records the absence of one — so it is preparation work, not gated on the
tier-3 declaration; it is a prerequisite OF that declaration.

This tactic is `blocked_by` tactic-support-boundary-approval: the author
ratifies or revises the draft copy below at office-hours before this runs.
The implementing session lands the **ratified** wording (check the gate's
outcome, recorded as a dated clarification on strategy-distribute-workflow)
and settles only remaining mechanics within it.

Implement the unit in a subagent launched with its recommended model
(Agent/Task tool, `model: sonnet`), passing this context and scope;
constrain it to working-tree edits.

## Units of work

### Unit 1 — SUPPORT.md and the README pointer

Recommended model: sonnet

Scope:
- Create `SUPPORT.md` at the repo root with the ratified copy (GitHub
  surfaces a root `SUPPORT.md` in the new-issue flow and repo sidebar).
- `README.md:319` ("## Usage and Contributing", whose text already says
  "forking is encouraged") — add the ratified pointer sentence linking to
  `SUPPORT.md`.
- Out of scope: `/align-init` output wiring and the practitioner entry point
  (both land later, gated on tactic-tier3-entry-declaration); any expansion
  of commitments (that is tier-3 work).

## Draft copy (for tactic-support-boundary-approval to ratify or revise)

Proposed `SUPPORT.md`:

> # Support
>
> commons.systems is a working repository the author runs daily. It is
> public as a gift — the point is capability transfer, not a supported
> product.
>
> ## What is supported
>
> Nothing on a committed timeline. Tier-3 (practitioner) entry has not been
> declared, so no support commitment exists yet. If that changes, this file
> is where expanded commitments will be recorded.
>
> ## What is best-effort
>
> - Issues are read. There is no response-time promise.
> - The README, the schema documentation, and package docs are kept accurate
>   because the author's own workflow depends on them.
> - Documented fork paths are kept buildable on a best-effort basis.
>
> ## What is not supported
>
> - No SLA, and no security-response commitment beyond GitHub's advisory
>   tooling.
> - No compatibility guarantees between commits; the design is still in
>   flux.
> - No roadmap requests: the intention graph in `intentions/` is the real
>   backlog, and it prioritizes the author's own use.
> - No monitored support channel.
>
> Fork-and-adapt is the intended consumption. If you build something on
> this, you own your fork.

Proposed README pointer sentence (in "## Usage and Contributing"):

> Support boundary: see [SUPPORT.md](SUPPORT.md) — this repo is a gift, not
> a product; nothing is on a committed timeline.

## Reuse

None (new documentation file); follow the register of `README.md` and
`.claude/rules/writing-style.md`.

## Verification

Prose only (docs-only change, no runtime surface): the landed `SUPPORT.md`
and README sentence byte-match the ratified copy recorded by
tactic-support-boundary-approval; the README link resolves on GitHub; GitHub
shows the support link on the new-issue page once merged (observe on main).
