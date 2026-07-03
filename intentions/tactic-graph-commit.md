---
id: tactic-graph-commit
kind: tactic
statement: "graph-commit primitive: validated single-node writes direct-pushed
  to main with rebase-retry, restricted to intentions/; CI fast path for
  intentions/-only pushes"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "The strategy's write path (clarification 2): one primitive for every
  graph write — skills, router, reconciler, sensors. The interview is the audit;
  the push makes records schedulable."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes:
  phase: implement
  blocked_by:
    - tactic-graph-dispatch-schema
    - tactic-intentions-branch-protection
---
# graph-commit primitive: validated single-node writes direct-pushed to main with rebase-retry, restricted to intentions/; CI fast path for intentions/-only pushes

## Context

Clarification 2 on `strategy-graph-native-dispatch`: one write path for
every graph edit — a single-node commit direct-pushed to main with
rebase-retry, restricted to `intentions/` paths. Every later writer
(skills, router, reconciler, sensors) calls this primitive. Recipe:
`intentions/tactic-graph-native-dispatch.md` §1.2.

## Unit 1 — the graph-commit script

**Recommended model:** opus

Scope: new `packages/intentionsutil/scripts/graph-commit` (bash):
- Args: one or more node ids whose content was already written via
  `packages/intentionsutil/scripts/write-node.ts` (the single validation
  gate); graph-commit stages only `intentions/<id>.md` for those ids.
- Guard: fail loudly if the commit set would include any path outside
  `intentions/`.
- Loop: commit → `git pull --rebase origin main` → `git push origin
  HEAD:main`; on push reject, retry bounded (5); on rebase conflict —
  same-node concurrent edit — re-read, re-apply once, retry; if the
  semantic conflict survives, park the writer's target node
  (`office_hours: {reason, since}`) and exit non-zero.
- Follow `.claude/rules/shell-json.md`: never `echo "$VAR" | jq`.

Out of scope: converting callers (sibling tactics adopt the primitive).

## Unit 2 — CI fast path for intentions/-only pushes

**Recommended model:** sonnet

Independent of Unit 1 (parallel-safe).

Scope: `.github/workflows/pr-checks.yml` plus the push-triggered workflows
that run on main: when the diff touches only `intentions/**`, run graph
validation only (`listNodes` + `validateGraph`; import pattern as in
`packages/intentionsutil/scripts/write-node.ts`) and skip app pipelines.

## Dependencies

- `tactic-graph-dispatch-schema` — parking writes the first-class
  `office_hours` field.
- `tactic-intentions-branch-protection` — main must accept the push.

## Reuse

- `write-node.ts` remains the only content writer; graph-commit never edits
  markdown itself.
- Bounded-retry shape mirrors `gh_retry` in
  `.claude/skills/dispatch-propagate/scripts/lib.sh`.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: in a scratch clone with a local bare remote, run two concurrent
graph-commits — different nodes (both land) and the same node (second
rebases cleanly or parks). Live: one `intentions/`-only push to origin main
lands and CI runs only the fast path.

## Implementation notes

Implement each unit in a subagent with `model` per the unit tag; supply this
Context and the unit's Scope; constrain to working-tree edits.
