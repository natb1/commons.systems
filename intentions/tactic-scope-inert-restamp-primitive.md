---
id: tactic-scope-inert-restamp-primitive
kind: tactic
statement: "Scope-inert re-stamp primitive: a sanctioned script plus align-skill
  step letting an author-present align round re-stamp a tactic's worktree-local
  scope-custody stamp after a classified scope-inert body edit"
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-18 /align-strategy interview on the false
  demotion of tactic-graph-selector-reviewed-exclusion (PR #2888): a
  doctrine-mandated scope-inert reconciliation note tripped
  tacticScopeFingerprint and demoted a fully-reviewed node review -> implement,
  discarding qa and review custody. The scope-inert-restamp clarification on
  strategy-graph-native-dispatch (2026-07-18) is the authoritative doctrine;
  this carrier implements its sanctioned re-stamp mechanism."
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
# Scope-inert re-stamp primitive: a sanctioned script plus align-skill step letting an author-present align round re-stamp a tactic's worktree-local scope-custody stamp after a classified scope-inert body edit

Draft context (retained by /align-strategy 2026-07-18; not yet planned).
Authoritative doctrine: the scope-inert-restamp clarification on
`strategy-graph-native-dispatch` (2026-07-18), which scopes the
chain-of-custody clarification's "only author and re-evaluation edits
able to demote" clause.

## Target design

- A re-stamp script (natural home: beside `transition-node` in
  `.claude/skills/dispatch-propagate/scripts/`) taking a tactic id:
  recompute `tacticScopeFingerprint(statement, body)` from the node at
  `origin/main` (`store.js` `readNode`/`readNodeBody` + `router.js`
  `tacticScopeFingerprint`) and write
  `<fingerprint> <origin/main sha>` as the single line of
  `.claude/worktrees/<id>.scope-fingerprint` (the `parseScopeStamp`
  format, `transitions.ts`). No-op with a notice when no stamp file
  exists (no phase in flight — nothing to preserve).
- Invoker rule: author-present align rounds only (`/align-strategy`,
  `/align-tactics`), after a confident scope-inert classification of the
  round's own body edit; any doubt or a material edit leaves the stamp
  untouched (fail-closed — demotion fires as recorded). Phase workers,
  qa/review sessions, and the tick never invoke it. The transition
  writer's own machinery refresh is separate and unchanged.
- Skill-text step in `.claude/skills/align-strategy/SKILL.md` and
  `.claude/skills/align-tactics/SKILL.md`: when a round appends a
  scope-inert annotation to an in-flight (phase implement/fix/qa/review)
  tactic's body, classify and re-stamp in the same round, recording the
  classification in the round's record.

## Reference-site census

- `packages/intentionsutil/src/transitions.ts` — `parseScopeStamp` /
  `isScopeStale` (stamp format consumer; unchanged).
- `packages/intentionsutil/scripts/compute-freshness.ts` — the gate that
  reads the stamp (unchanged; the re-stamp makes `scopeStale` false).
- `.claude/skills/dispatch-propagate/scripts/transition-node` — the
  demote path this primitive pre-empts for scope-inert edits.

## Bootstrap (until the script lands)

The round refreshes the stamp by hand — the 2026-07-18 remediation's
proven recipe:

```
SHA=$(git rev-parse origin/main)
FP=$(node --import tsx/esm -e '...tacticScopeFingerprint(readNode(...).statement, readNodeBody(...))...' <id>)
echo "$FP $SHA" > .claude/worktrees/<id>.scope-fingerprint
```
