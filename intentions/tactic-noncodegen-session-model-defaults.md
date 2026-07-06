---
id: tactic-noncodegen-session-model-defaults
kind: tactic
statement: Sonnet-by-default initialization for non-codegen sessions — fix the
  /qa-main routing gap and pass --model on the aux background-job spawns
owner: ai
status: codified
parent: null
rationale: Finalized from the 2026-07-04 interview draft by /align-tactics round
  1. The round's recon found the qa-main half is a live routing bug, not just an
  optimization.
reading: null
gap: null
serves:
  - strategy-token-economy
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
attributes:
  phase: review
  execution:
    strategy_fingerprint: 10f0314e331696714d42b26313b80c5a289d68ab0e3ce4d614bf2c97a94d4a67
    branch: tactic-noncodegen-session-model-defaults
    pr: 2776
    attempts:
      qa: 1
    markers:
      - qa-done
---
# Sonnet-by-default initialization for non-codegen sessions — fix the /qa-main routing gap and pass --model on the aux background-job spawns

## Context

The `<none>`+Opus row measured $3,600 proxy / ~$1,200 real for
2026-06-26→07-03, dominated by sessions that never enter a codegen skill.
Two concrete holes:

1. **qa-main inherits Opus despite a Sonnet default.**
   `dispatch-phase-model:66-73` maps `main-qa → claude-sonnet-4-6`, but
   `dispatch-launch-worker`'s SKILL→PHASE case map
   (`dispatch-launch-worker:146-154`) has no `/qa-main` arm — `PHASE=""`,
   so `dispatch-phase-model` is never called (guard at line 156) and the
   spawn omits `--model`. Untested: the launch-worker test section has no
   `INVOKE /qa-main` case.
2. **Aux background jobs pass no model.** `dispatch-tick`'s three direct
   `dispatch-spawn-job` sites — `sync-repair` (tick:513-515),
   `diagnose-main` (tick:524-526), `jit-reminder-<num>` (tick:535-537) —
   all omit `--model`, inheriting Opus. Digest rides the jit-reminder
   session (invoked in-session via the Skill tool), so it is covered by
   the jit-reminder spawn.

`file-issue` needs no change: it has no independent launch point — it is
invoked in-session from qa-fix/review-fix (both Sonnet-routed), and its
requirements-definition role is superseded by the align family, whose
routing is the routing-parity clarification on
strategy-graph-native-dispatch. The `force-opus.json` chokepoint
(`dispatch-spawn-job:232-259`) continues to override everything here —
the kill-switch is untouched.

## Unit 1 — /qa-main phase mapping in dispatch-launch-worker

**Recommended model:** sonnet

Scope:
- `dispatch-launch-worker:146-154`: add `/qa-main) PHASE=main-qa ;;` and
  update the routing comment at line 136.
- Tests: add an `INVOKE /qa-main` case to the launch-worker section of
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`
  (section starts ~line 37282; the section copies the real
  `dispatch-phase-model`, so assert the spawned argv carries
  `--model claude-sonnet-4-6` and no `--effort`).
- Close the adjacent unit-test gap:
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-phase-model.sh`
  covers only `qa/review/plan/implement` — add default-map cases for
  `fix-checks`, `fix-conflicts`, `main-qa`.

## Unit 2 — --model on the aux spawn sites

**Recommended model:** sonnet

Scope:
- `dispatch-tick:513-515, 524-526, 535-537`: pass
  `--model claude-sonnet-4-6` on the `sync-repair`, `diagnose-main`, and
  `jit-reminder-<num>` spawns. None of these author product code:
  sync-repair runs `/commit-merge-push` (whose conflict recovery already
  escalates to an Opus subagent internally), diagnose-main diagnoses,
  jit-reminder runs reminder skills including digest.
- Tests: extend the dispatch-tick spawn assertions in
  `test-dispatch-scripts.sh` to assert the forwarded `--model` on each of
  the three sites.

## Dependencies

None between units; one PR.

## Reuse

- `dispatch-spawn-job`'s existing `--model` forwarding and validation
  (`dispatch-spawn-job:284-298`) — no spawn-side change needed.
- Existing launch-worker test stubs (`test-dispatch-scripts.sh:37282+`).

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-phase-model.sh
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Manual: after merge, the next tick's aux spawns and any main-qa launch
show `--model claude-sonnet-4-6` in the spawn log; a following
/dispatch-token-audit window shows the `<none>`+Opus row shrinking.

## Implementation notes

Two units, one PR; implement each in a subagent with `model: sonnet`;
supply this Context and the unit's Scope; constrain to working-tree edits.
`strategy_fingerprint` recipe (interim until tactic-graph-dispatch-schema
lands): sha256 hex of `JSON.stringify({statement, clarifications,
conditions, serves, success_signal, tooling_goals})` as loaded by
intentionsutil `listNodes`.

## main-qa residue (qa 2026-07-06)

- After the next dispatch tick fires an aux job (sync-repair / diagnose-main / jit-reminder), check the tick's dispatch-spawn-job argv log shows --model claude-sonnet-4-6 for that spawn.
- After the next /qa-main launch, check the dispatch-spawn-job argv carries --model claude-sonnet-4-6 and no --effort flag.
- Run /dispatch-token-audit over a following window and confirm the <none>+Opus row has shrunk versus the 2026-06-26->07-03 baseline ($3,600 proxy / ~$1,200 real).
