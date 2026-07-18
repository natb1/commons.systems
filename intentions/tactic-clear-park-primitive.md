---
id: tactic-clear-park-primitive
kind: tactic
statement: Add a scripted atomic clear-park primitive (inverse of park-node) and
  make it the drain lane's mandatory terminal park disposition
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-07-18 align-strategy interview recording the drain-lane
  terminal-disposition requirement (strategy-graph-native-dispatch clarification
  65). park-node has no scripted inverse; a park is cleared today only by
  clarification 4's incidental side-effect (a commit touching the node) or a
  hand-rolled inline readNode -> office_hours=null -> writeNode -> graph-commit.
  The drain lane's fix commit lands on the PR branch and never touches the node
  frontmatter, so the incidental clear never fires and the separate inline
  clear-park is forgettable (park -> drain -> re-park -> clear on
  tactic-phase-standup-audit-lens). A dedicated primitive makes the terminal
  disposition atomic and unskippable.
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
attributes: {}
---

# Scripted atomic clear-park primitive + mandatory drain-lane terminal disposition

Draft context for `/align-tactics` — retained from the 2026-07-18
`/align-strategy` interview that recorded `strategy-graph-native-dispatch`
clarification 65. Not yet planned into units.

## Why

`park-node` (`packages/intentionsutil/scripts/park-node`) has no scripted
inverse. A parked node's `office_hours` field is cleared today only by:

1. clarification 4's incidental side-effect — *any* interactive commit that
   touches the node's frontmatter — which the self-modification **drain** lane
   never triggers, because the drain's fix commit lands on the **PR branch** and
   never touches the node's `office_hours` field; or
2. a hand-rolled inline `readNode → office_hours=null → writeNode → graph-commit`
   sequence, which is separate from the fix push, not forced by session
   termination, and therefore forgettable.

The live failure: `tactic-phase-standup-audit-lens` went park → drain (fix
pushed, CI green) → **re-park** → clear across multiple sessions, because the
terminal clear was never atomic with the drain.

## What

Add `packages/intentionsutil/scripts/clear-park`, the exact inverse of
`park-node`:

- Usage: `clear-park <node-id> [note]`
- Writes via `store.ts` `readNode → node.office_hours = null → writeNode`
  (authors no markdown itself, same as `park-node`).
- Lands on `main` through the `graph-commit` primitive:
  `graph-commit -m "graph: clear office_hours park on <node-id> (<note>)" <node-id>`.
- Exit codes mirror `park-node`: 0 cleared and landed / 1 write-or-commit
  failed / 2 usage.

This generalizes the one-off manual clear-park sequence noted in
`tactic-tick-scriptable-then-spawn`'s body into a first-class primitive.

## Requirement it satisfies (clarification 65)

The self-modification drain lane must **terminate** with an explicit, mandatory
park disposition executed through the scripted primitive — never leaving a
drained node in an ambiguous still-parked state:

- **green CI** → `clear-park <node-id> <note>` (office_hours → null on main);
- **red / blocked CI** → re-park via `park-node <node-id> <updated-reason>`.

The read-only human office-hours lane is unchanged: it drains nothing and
legitimately never un-parks (clarification 4's side-effect clear still governs
it, per `.claude/skills/office-hours/SKILL.md`).

## Scope pointers

- `packages/intentionsutil/scripts/park-node` — the script to mirror.
- `packages/intentionsutil/scripts/graph-commit` — the only main-landing write path.
- `tactic-office-hours-self-modification-skill` — the drain skill that must call
  `clear-park` as its terminal step once implemented.
- `~/prompt-emulated-office-hours.md` — the emulated drain prompt, updated in the
  same 2026-07-18 round to invoke `clear-park` (emulating it via the inverse
  sequence until the script lands).
