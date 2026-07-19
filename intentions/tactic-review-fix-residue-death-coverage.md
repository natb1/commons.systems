---
id: tactic-review-fix-residue-death-coverage
kind: tactic
statement: "review-fix residue phase: surface/file Lane-A residue when the
  disposition agent dies"
owner: ai
status: raw
parent: null
rationale: null
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
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
attributes:
  bug_fix: true
---
# review-fix residue phase: surface/file Lane-A residue when the disposition agent dies

## Provenance

- **Location**: `.claude/workflows/review-fix.js:1355`
- **Finding id**: `residue-0` (source: `code-review`, disposition bucket: `Deferred`)
- **Adversarial verdict**: not routed through adversarial-verify — code-review/Deferred
  findings are classified directly by the review-fix Workflow's classify step, not
  the Required-only skeptic pipeline. No skeptic vote exists for this item.
- **Source PR**: #2887 (`tactic-review-phase-trust-builtin-review`)

## Failure scenario

When the residue-disposition subagent returns null/empty (`agent()` exhausts its
internal retries) while `laneAResidue` is non-empty, the high-severity
security-review escalation path already fails closed: the deviation gate reads
`laneAResidue` + `residueResolvedByIdx`, so any unresolved high-severity
security-review residue forces `deviation=true` → `escalated`
(`.claude/workflows/review-fix.js:1447-1460`). However, the rest of the residue is
silently dropped:

- code-review residue and sub-high (medium/low) security residue are not
  surfaced in `dispositions[]` (`laneADispositions` stays empty), so they never
  appear in the Step-6 PR comment.
- No items are filed as follow-ups (`laneADeferred` stays empty).
- `coverage_incomplete` is not set, so the partial-coverage comment line gives
  no signal that residue disposition was degraded.

This mirrors Lane-B's fail-safes for analogous agent-death cases
(`coverage_incomplete` on quality-finder death; Unverified→deferred filing on
fix/verify death). Proposed remediation: in the residue phase, when `items` is
empty but `laneAResidue` is non-empty, surface every undispositioned residue
item in `dispositions[]` (e.g. as a Required/Informational audit entry) and/or
file them as follow-ups so they are not lost, and set a coverage/degraded-residue
flag with a note. Decide deliberately whether to reuse `coverage_incomplete`
(currently a launch-efficiency back-off signal) or add a distinct
residue-coverage flag so its semantics stay clean.
