---
id: tactic-main-qa-triage-before-provision
kind: tactic
statement: main-qa triage before provision — run the browser-verifiability
  triage in the selection chain so unverifiable follow-ups never cost a worktree
  and session boot
owner: ai
status: codified
parent: null
rationale: "Split from the hygiene draft by /align-tactics round 1: the audit's
  'qa-verify polling loop' n-gram (405 occurrences / 39 sessions) is per-issue
  worktree and session boots for sibling main-qa follow-ups, with triage running
  only after the expensive boot."
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
    strategy_fingerprint: 67ffd1e5febd2bdebb7a659e6324e8a703667c75c473111cea2808357a295124
    branch: tactic-main-qa-triage-before-provision
    pr: 2784
    attempts:
      qa: 1
    markers:
      - qa-done
---
# main-qa triage before provision — run the browser-verifiability triage in the selection chain so unverifiable follow-ups never cost a worktree and session boot

## Context

qa-main's cheap pre-filter — Step 4·0 "is this follow-up
browser-verifiable?" (`.claude/skills/qa-main/SKILL.md:113-122`) — runs
inside the worker session, after `dispatch-provision-worktree` and a full
session boot have already been paid. Nine live
`<N>-qa-verify-against-main-qa-n` worktrees exist right now; example
issue #2650 (a NixOS/WSL on-box outcome, not browser-verifiable) still
cost a worktree + boot to reach its immediate Step 4·0 rejection. The
audit measured the resulting `cd`-per-boot n-gram at 405 occurrences in
39 sessions.

Greenfield shape: the triage criteria live in one script consulted by
both the tick (pre-provision) and qa-main (in-session, as today's Step
4·0 fallback for directly-invoked runs), so the two can never drift.

Scope note (2026-07-04): this covers the **legacy issue lane only** —
the gh main-qa follow-up queue that persists until the legacy router
drains. Graph-native tactics never produce these follow-ups: the qa
phase triages verifiability at residue-record time, so unverifiable
items never reach a `main-qa` phase at all
(`strategy-graph-native-dispatch` clarification 22;
`tactic-phase-skill-node-targets` Unit 3, `tactic-main-qa-phase`). This
tactic's surface retires with the legacy drain; the shared-script
criteria remain the reference the graph-native record-time triage
mirrors.

## Unit 1 — shared triage script + pre-provision gate

**Recommended model:** opus

Scope:
- New script
  `.claude/skills/dispatch-propagate/scripts/dispatch-main-qa-triage`
  taking an issue number: evaluates the Step 4·0 criteria
  (browser-verifiable outcome, `URL_PATH` present, deploy-ready state)
  from one `gh`/`dispatch-context-pack --issue` read; exits 0
  (verifiable), 3 (not browser-verifiable), or nonzero on error — clear
  errors, no fallback routing (`.claude/rules/code-style.md`).
- Selection chain: where the tick's selected target resolves to the
  main-qa lane (`dispatch-phase:89-90` → `dispatch-route:272` `INVOKE
  /qa-main`), call the triage before `dispatch-provision-worktree`
  (provision entry: `dispatch-provision-worktree:5`; launch cd at
  `dispatch-launch-worker:79-90`). A not-verifiable result applies
  qa-main's existing cannot-verify disposition path (label/park exactly
  as the in-session Step 4·0 outcome would) without provisioning or
  spawning.
- `.claude/skills/qa-main/SKILL.md:113-122`: Step 4·0 delegates its
  criteria to the shared script (kept for directly-invoked/interactive
  runs), so the logic is single-sourced.
- Tests: a triage-script unit section plus tick-integration cases in
  `.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh`
  (verifiable → provision proceeds; not-verifiable → no provision, park
  disposition applied).

## Dependencies

None. Independent of the routing-defaults tactic (which fixes what model
a provisioned qa-main session gets; this tactic decides whether one is
provisioned at all).

## Reuse

- `dispatch-context-pack --issue` for the single-read issue slice.
- qa-main's cannot-verify disposition path (SKILL.md Step 4·0 outcome
  handling) — reuse its labels/markers verbatim.
- Test stub patterns for tick/launch in `test-dispatch-scripts.sh`.

## Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-scripts.sh
```

Manual: seed a known non-browser-verifiable main-qa issue in a test
selection pass — the tick logs the triage rejection and no
`<N>-qa-verify-*` worktree appears; a browser-verifiable one provisions
as before.

## Implementation notes

Single unit; implement in a subagent with `model: opus` (selection-chain
change with disposition semantics); supply this Context and Scope;
constrain to working-tree edits. SKILL.md edits can hit the auto-mode
agent-behavior commit gate — expect a grant prompt. `strategy_fingerprint`
recipe (interim until tactic-graph-dispatch-schema lands): sha256 hex of
`JSON.stringify({statement, clarifications, conditions, serves,
success_signal, tooling_goals})` as loaded by intentionsutil `listNodes`.

## main-qa residue (qa 2026-07-06)

- Next real (non-synthetic) main-qa follow-up issue filed by the legacy lane that is NOT browser-verifiable: confirm dispatch-route's pre-provision gate fires end-to-end in production - no new <N>-qa-verify-* worktree is created, and the issue lands directly on dispatch:office-hours with a '/qa-main: ... parked pre-provision by dispatch-main-qa-triage' comment, with no Claude session spawned for it.
