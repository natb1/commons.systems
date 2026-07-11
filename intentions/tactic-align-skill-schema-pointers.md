---
id: tactic-align-skill-schema-pointers
kind: tactic
statement: Author repoints the three .claude/skills references to SCHEMA.md at
  intentions/kind-kind.md — the self-modification office-hours lane, gating
  SCHEMA.md deletion
owner: human
status: delegated
parent: null
rationale: "Born-parked gate minted by the 2026-07-11 /align-tactics round on
  strategy-graph-self-description: auto-mode blocks commits to .claude/skills,
  so an autonomous implement worker cannot land these repoints.
  tactic-schema-md-deprecation is blocked_by this gate so no skill file ever
  references a deleted SCHEMA.md."
reading: null
gap: null
serves:
  - strategy-graph-self-description
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
  reason: "Self-modification lane: auto-mode blocks agent commits to
    .claude/skills, so three SCHEMA.md references there need an author commit —
    .claude/skills/align-init/SKILL.md:88 (points readers at
    packages/intentionsutil/SCHEMA.md for depth),
    .claude/skills/align-tactics/SKILL.md:242 (names SCHEMA.md as a
    practitioner-doc example in the copy-gate exclusion list), and
    .claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh:65 (a
    comment mirroring that exclusion list). Repoint all three to
    intentions/kind-kind.md. tactic-schema-md-deprecation (SCHEMA.md content
    move + deletion) is blocked_by this gate."
  since: 2026-07-11
  recommendation: "Edit the three lines to reference intentions/kind-kind.md
    (align-init: point depth-seekers at intentions/kind-kind.md; the two
    exclusion lists: 'practitioner reference docs (intentions/kind-kind.md,
    package READMEs)'), commit — that completes this tactic and unblocks the
    deletion tactic. About 10 author-minutes."
pace_exempt: false
rounds: null
attributes: {}
---
# Author repoints the three .claude/skills references to SCHEMA.md at intentions/kind-kind.md

Born-parked human gate, minted by the 2026-07-11 /align-tactics round on
strategy-graph-self-description. Auto-mode blocks agent commits to
`.claude/skills`, so the three SCHEMA.md references there need an author
commit (the self-modification office-hours lane):

- `.claude/skills/align-init/SKILL.md:88` — points readers at
  `packages/intentionsutil/SCHEMA.md` for depth; repoint to
  `intentions/kind-kind.md`.
- `.claude/skills/align-tactics/SKILL.md:242` — names SCHEMA.md as a
  practitioner-doc example in the copy-gate exclusion list; substitute
  `intentions/kind-kind.md`.
- `.claude/skills/dispatch-propagate/scripts/audit-copy-changes.sh:65` — a
  comment mirroring that exclusion list; same substitution.

`tactic-schema-md-deprecation` (content move + SCHEMA.md deletion) is
`blocked_by` this gate, so no skill file ever points at a deleted file.
Completing the edits and letting a commit touch this node clears the park and
unblocks the deletion tactic. About 10 author-minutes.
