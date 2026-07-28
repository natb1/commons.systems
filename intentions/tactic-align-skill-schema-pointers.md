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
phase: done
execution:
  branch: tactic-align-skill-schema-pointers
  pr: 2968
  attempts: {}
  markers: []
  strategy_fingerprint: null
  fix: null
  completion:
    mergedAt: 2026-07-25T17:28:44Z
    mergeCommitSha: 082bf7a196bf475bb5f521bb340f320678f4907b
    graphCommitSha: null
validates: []
blocked_by: []
office_hours: null
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

**Done.** The author cleared this park on 2026-07-25 (all three references
repointed, PR #2968, merged `082bf7a1`). That commit
(`8c318d1`) nulled `office_hours` but left `phase: null`, which
`blockersComplete` (`packages/intentionsutil/src/router.ts`) does not treat
as complete — `tactic-schema-md-deprecation` stayed blocked, and the
phase-null + office_hours-null combination re-qualified this node as a
router-selectable draft (`frozenTacticSelectable`), which is how this
`/align-tactics` pass reached it. This pass verified the merged state (grep
for `SCHEMA.md` across the three cited files returns nothing; `gh pr view
2968` reports `MERGED`) and lands `phase: done` with the merge-verification
evidence in `execution.completion`, closing the bookkeeping gap and
unblocking the deletion tactic.
