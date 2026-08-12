---
id: tactic-dispatch-ladder-exit-code-space
kind: tactic
statement: Widen dispatch-ladder-advance/-await to one shared exit-code space —
  carving refused, idle-wait, idle-requeue and complete out of today's
  overloaded 2, 10 and 0 — so dispatch-ladder-run branches on codes instead of
  parsing their stdout strings
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
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Widen dispatch-ladder-advance/-await to one shared exit-code space — carving refused, idle-wait, idle-requeue and complete out of today's overloaded 2, 10 and 0 — so dispatch-ladder-run branches on codes instead of parsing their stdout strings

Deferred design proposal from the implementation of `tactic-dispatch-ladder-skill`
(PR #3072). **Proposed, not implemented** — see "Why this was deferred" below.

**Location**: `.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance`,
`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-await`, and their caller
`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-run`.

## The problem

The driver cannot branch on exit codes alone, because three codes are overloaded
and one meaning has no code at all:

- `advance` exit **10** carries four dispositions — `not-selectable`,
  `ci-waiting`, `stale-selection`, `scope-stale-demoted` — each needing a
  different driver action (halt, sleep-and-retry, retry-now, retry-now).
- `await` exit **0** carries two — `advanced` (loop) and `pruned` (terminal).
- `advance` exit **2** carries two — usage error vs. strategy refusal.
- Terminus has **no code**: "node reached phase `done`" is unexpressible, so the
  driver must re-read the graph via `verify-landed` to tell "done" from "stuck".

So `dispatch-ladder-run` parses the documented one-line stdout protocol
(`idle <id> <reason>`, `pruned <id>`) to recover what the exit code dropped.
That is legitimate — the protocol is a documented contract, and `dispatch-tick`
parses subprocess stdout the same way — but it puts control flow in string
matching, one rename away from silent breakage.

## Greenfield: one code space shared by both primitives and the driver

Stdout becomes purely informational.

| code | name | driver action |
|---|---|---|
| 0 | `progress` (launched / advanced) | continue |
| 2 | `usage` | halt — caller bug |
| 3 | `refused` (kind ineligible) | halt |
| 10 | `idle-halt` (`not-selectable`) | merge-and-absorb, then halt |
| 15 | `idle-wait` (`ci-waiting`) | sleep, retry |
| 16 | `idle-requeue` (`stale-selection` / `scope-stale-demoted`) | retry now |
| 11 | `throw` | halt, escalate |
| 12 | `stalled` | halt, escalate |
| 13 | `claimed` | halt |
| 14 | `unknown` | halt, escalate |
| 20 | `running` | call again |
| 21 | `complete` (phase `done`, or pruned) | halt, run complete |

The widening is **additive and backwards-compatible**: 0, 2, 10, 11, 12, 13, 14
and 20 keep their current meanings; 3, 15, 16 and 21 are carved out of today's
undifferentiated 2, 10 and 0. A caller that ignores the new codes still works if
it treats 10-or-15-or-16 as idle — which is the argument for grouping them
numerically as above.

## Migration

1. #3072 landed with the driver parsing stdout. (Done.)
2. Add the four new codes to `dispatch-ladder-advance` / `-await` **behind**
   their existing stdout lines, so both signals agree.
3. Switch the driver to exit codes and delete the string matching.
4. Delete the driver's `verify-landed` terminal check, which code 21 subsumes.

Steps 2-4 are one small PR against a suite that already covers every branch.

## Why this was deferred

The author's `/align` interview for `tactic-dispatch-ladder-skill` ruled
"rename, don't reinvent — their internals are not changed by this node".
Widening the primitives' contracts is a doctrine change that ruling deliberately
deferred, so the proposal is recorded here rather than smuggled into #3072.

**Source PR**: #3072
