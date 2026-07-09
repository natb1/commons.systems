---
id: tactic-align-curriculum-maintenance
kind: tactic
statement: "Encode curriculum maintenance into the /align interview: record-time
  enrollment of every recorded node — a deferral's mode-A re-validation item is
  added to the curriculum frontier, author-owned doctrine enrolls for mode-B
  confirmation reached by the frontier's recursive expansion"
owner: ai
status: codified
parent: null
rationale: "Finalized 2026-07-09 /align-tactics round 1 from the retained
  2026-07-09 /align-strategy draft. The /align interview's record-time
  curriculum enrollment (strategy clarification 5) is not yet in the skill text
  — .claude/skills/align-strategy/SKILL.md carries no enrollment or deferral
  clause today. Encodes the mode-A frontier-entry framing (the deferral typology
  encoding stays with tactic-align-interview-type-doctrine, still a draft —
  coordinate, never duplicate) and mode-B implicit enrollment (author-owned
  records are reached by the frontier's recursive expansion; no per-node
  schedule, no side list). Surface: .claude/skills/align-strategy/SKILL.md;
  tactic-align-entrypoint-consolidation is a draft — if it lands first, the
  clause applies to the consolidated surface."
reading: null
gap: null
serves:
  - strategy-graph-review-curriculum
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Encode curriculum maintenance into the /align interview: record-time enrollment of every recorded node — a deferral's mode-A re-validation item is added to the curriculum frontier, author-owned doctrine enrolls for mode-B confirmation reached by the frontier's recursive expansion

Planned 2026-07-09 /align-tactics round 1. Decision record: the /align-role
clarification (clarification 5) on `strategy-graph-review-curriculum`.

## Context

strategy-graph-review-curriculum makes maintaining the ever-expanding review
curriculum one of /align's roles, with enrollment at record time — but
`.claude/skills/align-strategy/SKILL.md` (330 lines) carries no enrollment or
deferral clause today (zero matches for "defer" at plan time). The mechanics
to encode, per strategy clarifications 3 and 5:

- **Deferrals / held-on-trust recordings (mode A)**: recording content held
  on trust creates its re-validation review item — a born-parked node (a
  reading chunk when a text grounds it, an office-hours sitting otherwise) —
  and that item is a **curriculum frontier entry**. The item lands in the
  same `graph-commit` as the record it enrolls. The fuller deferral
  typology/mechanics encoding is owned by `tactic-align-interview-type-doctrine`
  (still a draft, same SKILL.md surface) — this clause carries only the
  frontier-entry framing and points there; coordinate, never duplicate.
- **Author-owned recordings (mode B)**: enrollment is implicit — being in
  the graph is enrollment; the frontier's recursive scope expansion is the
  recurrence mechanism that reaches the node. The skill must say what NOT to
  do: never create a per-node schedule or a standing review item for
  author-owned doctrine.
- **Graph-encoded** (strategy condition 3): review items are born-parked
  nodes derived from node status; /align never maintains a side list.

## Units of work

### Unit 1 — add a "Curriculum enrollment (record time)" clause to the align-strategy skill

**Recommended model**: opus

**Scope.** One file: `.claude/skills/align-strategy/SKILL.md`. Insert a
subsection at the end of "## Step 5 — Record" (which begins at line 230; the
draft-bundling paragraph is near line 267), before "## Step 6 — Requirements
coverage check" (line 290). The clause must:

1. Name curriculum enrollment as one of /align's roles, citing
   `strategy-graph-review-curriculum` clarification 5.
2. State the mode-A rule: a recording held on trust gets its born-parked
   re-validation review item in the same `graph-commit`; the item is a
   curriculum frontier entry, and its statement or body must name the
   enrolled node's id (the coverage sensor —
   `tactic-review-curriculum-coverage-sensor` — derives frontier-entry
   linkage mechanically by id reference).
3. Point to `tactic-align-interview-type-doctrine` for deferral
   typology/mechanics; do not restate them.
4. State the mode-B rule: author-owned recordings are enrolled implicitly;
   never a per-node schedule, never a standing review item, never a side
   list (review items are born-parked nodes derived from node status).

Follow `ref-write-instructions` when editing; match the skill's existing
register and section conventions. Out of scope: the sitting machinery
(`tactic-review-sitting-skill-generalization`), the coverage table, any edit
to `.claude/skills/align-tactics/SKILL.md`, and type-doctrine's typology.

**Landing caveats.** `.claude/skills/**` edits are agent-behavior config —
a dispatch auto-mode session can be denied the commit; if hit, surface it
rather than retrying (the human grants and the session retries). If
`tactic-align-entrypoint-consolidation` (a draft at plan time) has landed by
implement time, apply the clause to the consolidated skill surface instead
(`.claude/skills/align/SKILL.md`).

## Reuse

- The Step 4 draft-tactic recipe (`.claude/skills/align-strategy/SKILL.md`
  lines 200–207) — the write-node/`--file` convention the clause's review-item
  instruction should echo.
- Born-parked precedent: the `tactic-reading-chunk-*` nodes (`office_hours`
  set at creation, `attributes.curriculum.priority`).
- `OfficeHours` shape: `packages/intentionsutil/src/schema.ts:338`
  (`reason`, `since`, `recommendation`).

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Prose: re-read the inserted clause against strategy-graph-review-curriculum
clarifications 3 and 5 and condition 3 (graph-encoded, no side lists);
confirm the deferral typology is pointed at, not restated (the clause should
be the skill's only enrollment home); confirm no `gh`/issue instructions were
introduced (the skill never touches GitHub).
