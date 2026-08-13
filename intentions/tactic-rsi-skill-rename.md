---
id: tactic-rsi-skill-rename
kind: tactic
statement: Rename /dispatch-ladder-eval to /rsi and delete the retired /rsi and
  /rsi-plan skills, so the name points at the per-phase evaluator
owner: ai
status: raw
parent: null
rationale: Recorded 2026-08-12 /align round by author instruction. The per-phase
  evaluator landed as /dispatch-ladder-eval; the author's ruling makes it the
  whole of what /rsi means. The old /rsi and /rsi-plan are retired with the
  judgment loop and rsi-plan.md, so the name is free and keeping it on a retired
  skill would leave two /rsi contracts in the tree.
reading: null
serves:
  - strategy-recursive-self-improvement
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
# Rename /dispatch-ladder-eval to /rsi and delete the retired /rsi and /rsi-plan skills, so the name points at the per-phase evaluator

Recorded by the 2026-08-12 `/align` collapse round. Read the "What survives the
2026-08-12 collapse" clarification on `strategy-recursive-self-improvement`
before starting; it is authoritative and this unit is one piece of its mechanism.

## Scope

- Move `.claude/skills/dispatch-ladder-eval/SKILL.md` to
  `.claude/skills/rsi/SKILL.md`, replacing the retired skill, and set
  `name: rsi` in its frontmatter.
- Delete `.claude/skills/rsi-plan/` entirely, and `.claude/skills/rsi/scripts/`
  (`rsi-claim` and `test-rsi-claim.sh`) — the claim primitive serialized an
  attended loop and a single-writer document that both retire.
- Update every executable reference to the old skill name. Measured 2026-08-12,
  the callers are: `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`
  (the spawn `--name` and the skill argument),
  `.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh`,
  `.claude/skills/dispatch-ladder/SKILL.md`, and
  `.claude/skills/dispatch-propagate/scripts/dispatch-phase-model`.

## Out of scope

Historical `intentions/*.md` prose naming `/dispatch-ladder-eval` is a dated
record of what was true when written; do not rewrite it. Only nodes this round
amends carry the new name.

## Watch for

`--name` is `dispatch-spawn-job`'s dedup key. It is keyed on node id AND
phase deliberately — a name keyed on node id alone evaluates only the first
phase of every ladder and silently skips the rest. Preserve that shape through
the rename.

## Verification

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
```

Manual: confirm `/rsi` resolves to the evaluator and that no file still
references `dispatch-ladder-eval` outside `intentions/`.
