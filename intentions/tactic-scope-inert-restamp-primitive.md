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
attention:
  boost: 62
  override: null
  rationale: "Boosted to top ranking by author direction (2026-07-18
    /align-strategy round on the redundant qa-fix re-run of
    tactic-review-phase-trust-builtin-review): this draft is the tracker of
    record for the false scope-drift demotion class that cycled that node review
    -> implement -> qa on a byte-identical diff. Sized against the composed
    selector rank (childless, empty blocked_by: rank = boost + 5.33; current max
    66.33 on tactic-align-skills-latest-graph-guard and
    tactic-freeze-resurface-stale-children-only), so boost 62 gives 67.33 -
    strictly top of the selector frontier, verified via select-targets. The
    boost flows nowhere else (no blocked_by, no children)."
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

## Second observed incident (2026-07-18, machinery-append variant)

Recorded by the 2026-07-18 /align-strategy round answering "why did dispatch
launch qa-fix when qa was already complete?" on
`tactic-review-phase-trust-builtin-review` (PR #2887):

- 13:30 EDT `d99f84fe` — phase start; scope-custody stamp taken at this sha.
- 13:51 EDT `5be80194` — `transition-node` advanced qa -> review and appended
  the `## needs-main residue` section (a machinery body append). Its
  `refresh_stamp()` ran under the pre-#2882 wrong-root stamp bug, so the
  main-root stamp stayed at `d99f84fe`.
- 16:12 EDT — PR #2882 (`tactic-graph-node-lane-write-hardening`) merged the
  `MAIN_ROOT` stamp-path fix.
- 16:51 EDT `3a72e369` — a transition read the (still-stale) main-root stamp,
  saw `5be80194` as absorbed scope drift, and falsely demoted the node
  review -> implement, discarding qa and review custody.
- 18:35 EDT `72408785` — re-transitioned to qa; a full qa-fix pass then re-ran
  on a byte-identical diff.

Distinct trigger, same defect class as the rationale's PR #2888 incident: a
scope-inert body append (there an align note, here the machinery's own residue
append) trips `tacticScopeFingerprint` and demotes a completed ladder. The
machinery variant's root cause is fixed on main by PR #2882; its regression
protection is tracked by `tactic-transition-node-scope-stale-test-coverage`.
This primitive remains the fix for the align-round variant and the sanctioned
recovery path (re-stamp instead of re-implementing) for any future false
demotion. Cost of this incident: three redundant phase sessions.
