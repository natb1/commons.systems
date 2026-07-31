---
id: tactic-standdown-instruction-not-wired
kind: tactic
statement: "dispatch-standdown has no producer in production: no worker phase
  skill tells a duplicate-detecting session to call it, so only the sweep's
  weaker origin=observed detection path is ever exercised and the
  winner-attributed declared path stays unreachable"
owner: ai
status: raw
parent: null
rationale: "Filed 2026-07-31 by /review-fix on PR #2996
  (tactic-standdown-winner-liveness), classified Deferred (out of scope for that
  PR, needs an author ruling): dispatch-standdown (added by
  tactic-standdown-winner-liveness) is referenced only by
  .claude/skills/dispatch-propagate/reference.md and a comment in
  dispatch-self-close, and dispatch-propagate/SKILL.md is marked Retired -- no
  live session loads it. No worker skill (/implement, /fix-checks, /qa-fix,
  /align-tactics) tells a session that detects it is the duplicate to run the
  command. Consequence: only origin=observed markers are ever written in
  practice, so the winner-attributed path -- dispatch-standdown's
  at-the-moment-of-decision liveness re-check and its winner-absent exit-3
  refusal -- is unreachable, and coverage falls back entirely to the sweep's own
  duplicate detection with its weaker idle/status heuristic (rule (e)) instead
  of the age-independent rule (b). Needs an author decision on which lanes carry
  the instruction (all node-worker phases vs. a shared rule), which is why it
  was not applied inline."
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
# dispatch-standdown has no producer in production: no worker phase skill tells a duplicate-detecting session to call it, so only the sweep's weaker origin=observed detection path is ever exercised and the winner-attributed declared path stays unreachable

## Provenance

- **Source**: `/review-fix` on PR #2996 (`tactic-standdown-winner-liveness`), 2026-07-31.
- **Location**: `.claude/skills/dispatch-propagate/scripts/reference.md:215` (the referencing doc; `dispatch-standdown` itself is the unreferenced producer).
- **Disposition**: classified `Deferred` (code-review residue phase) — a valid finding, out of scope for PR #2996, needing an author ruling on where the instruction belongs.

## Failure scenario

`dispatch-standdown` (added by `tactic-standdown-winner-liveness`) has no
producer in production. It is referenced only by
`.claude/skills/dispatch-propagate/reference.md` and a comment in
`dispatch-self-close`, and `dispatch-propagate/SKILL.md` is marked Retired —
no live session loads it. No worker skill (`/implement`, `/fix-checks`,
`/qa-fix`, `/align-tactics`) tells a session that detects it is the duplicate
to run the command.

Consequence: only `origin=observed` markers are ever written in practice, so
the winner-attributed path — `dispatch-standdown`'s at-the-moment-of-decision
liveness re-check and its `winner-absent` exit-3 refusal — is unreachable,
and coverage falls back entirely to the sweep's own duplicate detection with
its weaker idle/status heuristic (rule (e)) instead of the age-independent
rule (b).

## Proposed change

Add the stand-down instruction to a document a worker session actually
loads — the node-worker phase skills' `SKILL.md`, or a shared rule under
`.claude/rules/` — stating: on detecting a duplicate for your node, run
`dispatch-standdown <node-id> --winner <sid>`; yield the turn only on exit 0;
on exit 3 (`winner-absent`) become the worker instead of yielding; on exit 4
(`ledger-unwritable`) do not yield either, since nothing will re-check an
unrecorded stand-down. Keep `reference.md` as the long-form explanation.

Needs an author decision on which lanes carry the instruction (all
node-worker phases vs. a shared rule), which is why it was not applied
inline.
