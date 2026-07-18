---
id: tactic-office-hours-graph-freshness-guard
kind: tactic
statement: "office-hours-graph launcher authoritatively cross-checks each
  selector candidate's park against origin/main before launching, skipping
  stale-worktree false positives (an already-cleared park a stale PR-branch
  checkout still ranks #1) and advancing to the next genuinely-parked node;
  office-hours-select.ts stays a pure offline oracle"
owner: ai
status: raw
parent: null
rationale: "Surfaced 2026-07-18 during an emulated office-hours tick:
  office-hours-select.ts (a deliberately offline oracle over the LOCAL
  intentions/ store) ranked tactic-nontactic-body-durability #1 though its park
  was already cleared on origin/main, because the tick ran from that node's
  stale PR-branch worktree whose committed file predated the clear. Implemented
  out-of-band as PR #2891 (freshness guard in the scripted office-hours-graph
  launcher, not the skill) and adopted into the graph at review."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: office-hours-graph-freshness-guard
  pr: 2891
  attempts: {}
  markers:
    - reviewed
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# tactic-office-hours-graph-freshness-guard

## Context

`office-hours-select.ts` is a deliberately offline oracle — it reads only the
local `intentions/` store (no gh, no daemon, no network), resolving the store
relative to the script file. Run from a stale PR-branch worktree (behind
origin/main), it ranks an already-drained-and-cleared park as the #1 head,
because that checkout's committed node file predates the clear. The
`office-hours-graph` launcher then boots an `/office-hours` session for a park
that no longer exists on main. Observed 2026-07-18 on
`tactic-nontactic-body-durability` (cleared on main: `office_hours: null`, phase
review, PR #2890) while an emulated office-hours tick ran from that node's own
stale worktree.

## Scope

`packages/intentionsutil/scripts/office-hours-graph` only. Add a freshness guard
in the scripted launcher — not the skill, since the check is purely mechanical:

- `git fetch origin main` before selecting.
- `park_live_on_main <node-id>` confirms a non-null `office_hours:` field on
  `git show origin/main:intentions/<id>.md` before launching.
- Queue-head mode walks the ranked `--list` top-down and launches the first node
  still parked on main, skipping already-cleared false positives (each logged to
  stderr).
- A new `cleared <node-id>` disposition reports an explicit target already
  cleared on main.

`office-hours-select.ts` is unchanged — it stays a pure offline oracle; the guard
lives once in bash rather than being re-derived per session in `SKILL.md`. Out of
scope: adding network to the selector; the clear-park primitive
([[tactic-clear-park-primitive]]) and the self-modification drain skill
([[tactic-office-hours-self-modification-skill]]).

## Verification

`bash -n` clean. `park_live_on_main` exercised against real origin/main state:
`tactic-nontactic-body-durability` (`office_hours: null`) → not-live (skipped);
block-scalar parks (`tactic-align-tactics-mechanical-floor`,
`tactic-review-sitting-skill-generalization`) → live; absent node → not-live. So
the launcher now skips this cycle's false-positive head and advances to the next
genuinely-parked node. Implemented and shipped as PR #2891.
