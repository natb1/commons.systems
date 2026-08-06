---
id: tactic-readme-graph-guard
kind: tactic
statement: "Guard README–graph alignment: a CI floor (every referenced node/file
  exists at HEAD; retired-construct terms absent) plus enrollment of the README
  in the standing review curriculum"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-08-04 /align README-practitioner round: the
  README tracks the graph's target-state design, and drift between the two
  authorities is a guarded defect (precedent: strategy-graph-self-description's
  code-vs-kind drift guard). The CI floor is the mechanical half; curriculum
  enrollment carries the judgment half no mechanical check can make."
reading: null
gap: null
serves:
  - strategy-data-structure-first
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# README–graph alignment guard

## Context

Recorded 2026-08-04 on strategy-data-structure-first: the README tracks the
graph's target-state design, and drift between README and graph is a guarded
defect. Precedent: strategy-graph-self-description's CI drift guard between
schema.ts and the kind nodes.

## Design (endorsed 2026-08-04 interview)

**Layer 1 — CI floor (mechanical):**

- Every `intentions/*.md` node and repo file the README references must
  exist at HEAD (link-resolution check over README.md's relative links and
  node-id mentions).
- A lint list of retired-construct terms the README must not contain
  (seeded at implementation time with the projection-era vocabulary the
  five-section rewrite retires: e.g. issue-label phase markers, /file-issue,
  /plan-issue as live surfaces, GitHub-projects queue; also "permanent" as a
  descriptor of virtues — corrected 2026-08-04 to "unconditional"). The list
  lives with the check script so additions ride ordinary PRs.
- Runs in CI on every change touching README.md or intentions/ (same
  trigger shape as the kind-drift guard condition on
  strategy-graph-self-description).

**Layer 2 — curriculum enrollment (judgment):**

- The README enrolls as a standing surface in the review curriculum
  (strategy-graph-review-curriculum): re-validated at office-hours when the
  graph areas it describes change. The enrollment mechanism follows the
  curriculum's graph-encoded rule — derived from node status, never a
  hand-maintained side list; design the trigger (e.g. the coverage sensor
  reading the README's referenced-node set against their last-amended dates)
  at plan time.

## Scope

- New check script (home: alongside the existing CI check scripts) + CI
  wiring.
- Curriculum enrollment per the coverage-sensor mechanism.
- Out of scope: the README rewrite itself; the reference-chunk enrollment
  (tactic-readme-reference-curriculum).

## Verification (sketch)

- Red on a README referencing a nonexistent node id; red on a seeded
  retired term; green on the rewritten README.
- Coverage sensor lists the README's enrollment and its reviewed areas.
