---
id: tactic-align-family-opus-default
kind: tactic
statement: Pin the align-strategy/align-tactics session default to Opus across
  both invocation paths
owner: ai
status: raw
parent: null
rationale: Surfaced in the 2026-07-06 /align-strategy interview recording the
  align-family Opus floor on strategy-token-economy. The requirement is recorded
  there; this tactic carries the enforcement mechanism, which is not yet fully
  in place.
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
attributes: {}
---
# Pin the align-strategy/align-tactics session default to Opus across both invocation paths

Retained draft (`phase: null`) — context for a later `/align-tactics
strategy-token-economy` round, not selectable work. Surfaced by the
2026-07-06 `/align-strategy` interview that recorded the align-family Opus
floor as clarifications on `strategy-token-economy`; the *requirement* lives
there, this node holds the *mechanism* that is not yet fully in place.

## Why this exists

The Opus default is recorded but only partly enforced. Two invocation paths
must land on Opus:

- **Router-launched** `/align-tactics` worker — the graph-native launch chain
  pins the model per `strategy-graph-native-dispatch` clarification 17 and
  `tactic-graph-router-selector` (align-family interview/decomposition on Opus,
  Explore/Plan fan-out on Sonnet or Haiku). Confirm this actually fires on the
  first live graph tick that routes an align-family node.
- **Human-invoked interactive** `/align-strategy` and `/align-tactics` — no
  router sets the model; today it is whatever the human's session is set to.

## Open mechanism questions

1. Set `model: opus` in the frontmatter of
   `.claude/skills/align-strategy/SKILL.md` and
   `.claude/skills/align-tactics/SKILL.md`.
2. Confirm whether a `model:` field on a `user-invocable` main-loop skill
   actually switches the *interactive session* model. It is confirmed to work
   for `context: fork` skills (e.g. `commit-merge-push` uses `model: sonnet`),
   but a main-loop skill runs in the human's existing session — the harness may
   not honor a per-skill model there. If it does not, a launcher/config lever
   is needed instead, or the interactive path stays an intended-not-guaranteed
   default backed only by measurement.
3. Verify via the token-audit by-node/by-phase attribution (the strategy's
   `token-economy` sensor) that align-family sessions actually ran on Opus —
   the after-the-fact check that the default held.

## Boundary

Floor-exempt from the routing actuator's fail-closed demotable allowlist: the
audit policy loop must not demote align-family below Opus. Only the Explore/Plan
fan-out spawned *under* these sessions stays demotable to Sonnet or Haiku.
