---
id: tactic-dispatch-emulate-owns-merge
kind: tactic
statement: Give /dispatch-emulate a node-scoped merge-and-absorb step so an
  emulated run completes its own node instead of depending on the tick it exists
  to route around
owner: ai
status: raw
parent: null
rationale: null
reading: null
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
blocked_by:
  - tactic-graph-auto-merge-main-health-gate
  - tactic-dispatch-ladder-skill
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Give /dispatch-emulate a node-scoped merge-and-absorb step so an emulated run completes its own node instead of depending on the tick it exists to route around

## SUPERSEDED 2026-08-12 — folded into tactic-dispatch-ladder-skill

Later the same day, a second /align interview replaced `/dispatch-emulate`
outright with `/dispatch-ladder`, a detached shell driver. The merge-and-absorb
step scoped below is **carried forward unchanged** as item 4 of
`tactic-dispatch-ladder-skill`, which now runs the ladder through
merge-and-absorb to phase `done` rather than leaving through `idle` — so the
structural inconsistency this node named is closed by the replacement rather
than patched here. This node is `blocked_by` that one so it is not worked
against a skill the replacement deletes; the scope below is retained as the
reasoning behind item 4, not as separate work.

The retained context that follows is still accurate about the defect and the
ruling. Only its **carrier** moved.

## Draft context (2026-08-12 /align interview)

Author-directed, and the reasoning is recorded on
`strategy-graph-native-dispatch` under "Who merges an emulated run's PR".

`/dispatch-emulate` drives every phase by delegating to the same scripts
dispatch uses, then outsources the terminal step — the merge — to the scheduler
it exists to route around. That is a structural inconsistency, and it fails
exactly when the loop is most needed: the shipped rule text says "the tick's
merge lane runs even while dispatch is paused", which is false, because
`graph-auto-merge` runs only inside `dispatch-select-tick`, past the pause
short-circuit.

Scope, once `tactic-graph-auto-merge-main-health-gate` lands:

- Add a node-scoped merge-and-absorb step to the loop, delegating to
  `graph-auto-merge <node-id>` and then `reconcile-graph-merged <node-id>`.
  Without the absorb half the node sits merged-but-stuck at phase `review` and
  `dispatch-emulate-await` reports no advance.
- Rewrite the first non-negotiable rule. "Never hand-merge" stands; the false
  claim about the paused merge lane goes. An interim wording correction lands
  ahead of this node, so expect to be rewriting corrected text, not the original.
- Re-scope the skill's stated invariant that neither script makes a merge, a
  graph write, or a `gh` call: the honest form is that neither script makes a
  DECISION. The gates stay in `graph-auto-merge`; the loop only calls it.

Accepted consequences, already ruled on and not to be re-litigated: two callers
of one gated script can race when dispatch is unpaused (benign — the second
sense reads a non-`OPEN` PR and skips), and the pause stops meaning "no merges"
(acceptable — the record already names an operator `dispatch-tick --manual` and
an author hand-merge as legitimate escapes, so this formalizes an existing one).

Not yet planned — this is retained interview context, not a clean-session plan.
