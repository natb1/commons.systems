---
id: tactic-review-code-review-invocation-contract
kind: tactic
statement: Correct the /code-review invocation — drop --fix, adopt --comment,
  and remove the dead outcome-mapping prose from the finder prompt
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-07-31 review-fix token audit interview.
  Measured: 18/18 invocations of `max --fix` produced zero working-tree edits
  and an empty fixed[]; cause unresolved. Author supplied the documented usage
  and directed dropping --fix for now, adopting --comment, and having the owned
  review augment rather than duplicate the built-in. See clarification 22 on
  strategy-token-economy."
reading: null
gap: null
serves:
  - strategy-token-economy
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
# Correct the /code-review invocation — drop --fix, adopt --comment, and remove the dead outcome-mapping prose from the finder prompt

## Context

Documented usage, supplied by the author 2026-07-31:

```
/code-review [low|medium|high|xhigh|max|ultra] [--fix] [--comment] [<target>]
```

Both `max` and `--fix` are valid documented arguments. What was measured over
18 runs (2026-07-27 to 07-31) is narrower and stranger than "the flag is
ignored":

- 18 of 18 finder agents invoked `Skill(code-review, args: "max --fix")`.
- All 18 made **zero** Edit/Write/NotebookEdit calls.
- All 18 returned an empty `fixed[]` array.
- Lane A produced 103 residue items across the window and 0 self-applied
  fixes.

The CAUSE IS UNRESOLVED. Do not record or act on "the flag is ignored" — that
inference goes beyond the evidence. It could equally be that no finding met
the built-in's own bar to auto-apply.

## Scope

- `.claude/workflows/review-fix.js`, `finderPrompt` lines 454-470. Drop
  `--fix` from the invocation (author instruction, "for now").
- Remove the now-dead `outcome`-mapping prose that instructs the agent to
  sort findings by a per-finding `outcome` of `fixed` /
  `no_change_needed` / `skipped`. No `fixed[]` item has ever been produced by
  that mapping, and it is a substantial block of an expensive Opus prompt.
- Adopt the built-in's `--comment` output (author instruction).
- Keep the Opus residue phase as the fix path, so every applied fix stays
  behind a judgment step. This is the quality reason `--fix` is not simply
  "made to work": self-applied edits would bypass residue, which is currently
  the only judgment applied to those ~99 findings per window.
- Standing intent to encode: the owned review AUGMENTS and REPLICATES the
  built-in's operations as far as possible WITHOUT duplicating its findings.

## Owed follow-up

The author scoped a separate investigation of the built-in's usage — why
`--fix` applied nothing, and how far the owned review should replicate the
built-in. strategy-token-economy clarification 22 is to be AMENDED with those
findings rather than superseded. That investigation is deliberately NOT in
this tactic's scope.

## Verification

- No `--fix` in the invocation; `--comment` present.
- No `outcome`-mapping prose remains in the code-review finder prompt.
- Lane A residue still reaches the residue phase at the measured ~5-6 items
  per run.
