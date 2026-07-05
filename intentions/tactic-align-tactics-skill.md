---
id: tactic-align-tactics-skill
kind: tactic
statement: "/align-tactics SKILL.md: break a strategy into PR-sized tactic
  subtrees with clean-session plans — supersedes /plan-issue and /file-issue
  epic structuring"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: Codifies the 2026-07-03 trial run — this subtree is its worked
  example. Autonomous; parks to office_hours under /plan-issue's conditions;
  consumes draft tactics (finalize, split, merge, prune).
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
  branch: tactic-align-tactics-skill
  pr: 2764
  attempts: {}
  markers: []
  strategy_fingerprint: null
validates: []
blocked_by:
  - tactic-graph-commit
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# /align-tactics SKILL.md: break a strategy into PR-sized tactic subtrees with clean-session plans — supersedes /plan-issue and /file-issue epic structuring

## Context

Supersedes `/plan-issue` and `/file-issue`'s epic structuring. This subtree
is the worked example — the 2026-07-03 trial run produced it from the
strategy's retained draft. Full skill spec:
`intentions/tactic-graph-native-dispatch.md` §2.3; the `/plan-issue`
coverage rows are in §4 of the same body.

## Unit 1 — author `.claude/skills/align-tactics/SKILL.md`

**Recommended model:** opus

Scope — codify the five steps:
1. **Scope + drift review.** Read the strategy node, clarifications,
   conditions, signal, round history, draft child tactics. Drift review is
   two-sided (strategy clarification 8): a failed recorded condition parks
   instead of planning against a dead premise; AND sweep for unrecorded
   conditions the round's plans newly depend on — a material discovery is
   proposed as a dated clarification and parks the strategy for author
   ratification (conditions stay human-decided); immaterial observations
   land as clarifications without interrupting.
2. **Decompose to the signal.** Minimum round to validate
   `success_signal`; when `reading` is null the round must include an
   instrument tactic; consume draft tactics (finalize, split, merge,
   prune); PR-sized leaves (leaf tactic = exactly one PR); larger shapes
   become subtrees via `parent` edges; order with `blocked_by`. Stamp the
   factual `validates: [strategy-id]` edge on the tactics that validate
   the signal (produce its reading, meet its threshold) — the
   calculated-attention signal term's terminals. Work worth recording but
   off the minimum path lands as an ordinary tactic with **no flag**:
   off-path status derives at read time from the absence of a chain to a
   validates-terminal, demoting it via calculated attention — never
   deferred by omission (strategy clarifications 9, 11).
3. **Plan each claude-eligible tactic.** Explore/Plan subagent fan-out as
   `/plan-issue` does today; write the full clean-session plan into the
   tactic node body — plan-comment schema (Context / units with Scope
   `path:line` anchors / Dependencies / Reuse / Verification with fenced
   ```verify blocks), per-unit **Recommended model** per the heuristic at
   `.claude/skills/implement-unit/SKILL.md:31`. Tactic lands
   `phase: implement`.
4. **Park non-claude-eligible tactics** born-parked, chunked to ≤30
   author-minutes.
5. **Record.** One graph-commit per tactic (or small batch); stamp the
   strategy's `rounds` accounting and each tactic's
   `execution.strategy_fingerprint` (hash of the strategy's substance
   fields — the router's soft-freeze trigger, strategy clarification 10).

Re-evaluation mode (strategy clarification 10): when invoked by the router
after a mid-flight strategy edit (fingerprint mismatch), the session does
not decompose fresh — it amends, prunes, or confirms the open tactics
against the edited strategy, re-stamps their fingerprints, and the subtree
unfreezes. The 2026-07-03 second interview round executed this mode
inline on this very subtree.

Autonomy contract: parks to `office_hours` under `/plan-issue`'s conditions
(requirement ambiguity, major scope deviation, unverifiable blockers);
never AskUserQuestion mid-run.

Out of scope: router consumption of `phase` (router tactics).

## Dependencies

- `tactic-graph-commit` — step 5's write path.

## Reuse

- `/plan-issue`'s Explore/Plan fan-out and plan-quality bar
  (`.claude/skills/plan-issue/SKILL.md`) — reuse the fan-out; replace the
  plan-comment landing with the node-body landing.

## Verification

Prose: re-run the skill against a small strategy with a null reading —
round 1 includes an instrument tactic, leaves are PR-sized, plans carry
model tags, no gh artifacts are created, and the strategy's rounds stamp
lands atomically with the tactics.

## Implementation notes

Single unit; implement in a subagent with `model: opus`; supply this
Context and Scope; constrain to working-tree edits.
