---
id: tactic-align-family-opus-default
kind: tactic
statement: Split /align-tactics model routing (Sonnet orchestrator + Opus
  decompose/plan subagent); keep /align-strategy whole-session Opus
owner: ai
status: raw
parent: null
rationale: "Surfaced in the 2026-07-06 /align-strategy interview (align-family
  Opus floor) and refined in the 2026-07-16 interview (strategy-token-economy
  clarification 10): the whole-session Opus default is replaced for
  /align-tactics by a Sonnet orchestrator that delegates the decompose-to-signal
  judgment and per-tactic plan authoring to an Opus subagent; /align-strategy
  stays whole-session Opus. This tactic carries the enforcement mechanism, not
  yet fully in place."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 8
  override: null
  rationale: "Author-directed 2026-07-09 (boost tier unchanged 2026-07-16): a
    direct skill-edit tactic — it sets .claude/skills/align-strategy/SKILL.md
    frontmatter to model: opus and rewrites
    .claude/skills/align-tactics/SKILL.md Step 3 so the decompose/plan subagent
    launches on Opus while the orchestrator runs Sonnet — so it belongs at the
    same top tier as the other skill-edit tactics
    (tactic-align-skills-latest-graph-guard,
    tactic-fingerprint-recipe-single-callsite: authored 8). Those sit in
    strategy-graph-native-dispatch subtree and reach 8 as boost 3 + inherited 5;
    this tactic serves strategy-token-economy (unboosted), so it inherits
    nothing and takes the full boost 8 directly to reach the same authored-8
    tier."
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Split /align-tactics model routing (Sonnet orchestrator + Opus decompose/plan subagent); keep /align-strategy whole-session Opus

Retained draft (`phase: null`) — context for a later `/align-tactics
strategy-token-economy` round, not selectable work. Surfaced by the
2026-07-06 `/align-strategy` interview (the align-family Opus floor) and
refined by the 2026-07-16 interview (`strategy-token-economy` clarification
10). The *requirement* lives on the strategy; this node holds the *mechanism*,
not yet fully in place.

## Why this exists

Router-launched `/align-tactics` workers were observed authoring tactic plans
on Sonnet: the worker launches on Sonnet (the Shape B orchestrator default)
and its `Plan` subagent inherits that model, so the definition of the tactic
nodes — the highest-stakes-to-signal act — runs cheap. Clarification 10
resolves this by splitting the model boundary inside `/align-tactics` rather
than pinning the whole session to Opus.

## The split (per strategy-token-economy clarification 10)

- **`/align-tactics` — dispatch and interactive.** The orchestrator session
  runs on **Sonnet** and does only the mechanical bookkeeping of a
  decomposition round: node-id reservation, park-field writes, the
  clause-coverage walk, and the `graph-commit`. It delegates **both**
  high-stakes cognitive acts to an **Opus** subagent — the decompose-to-signal
  judgment (the two-sided drift review and deciding which tactic nodes exist)
  **and** each claude-eligible tactic's full plan-body authoring. The Explore
  reuse-hunt fan-out stays demotable to Sonnet or Haiku.
- **`/align-strategy` — interactive only.** No dispatch launch path; its
  interview dialectic IS the audit and is non-delegable, so it stays
  **whole-session Opus**.

## Open mechanism questions

1. **`/align-tactics` SKILL.md Step 3** — launch the decompose/plan `Plan`
   subagent(s) with an explicit `model: opus` (Agent/Task `model` param),
   independent of the orchestrator session's model. Author the tactic node body
   from the subagent's output; the Sonnet orchestrator must not itself rewrite
   plan substance. Do **not** pin the `/align-tactics` session to Opus in
   frontmatter — the orchestrator is meant to run Sonnet.
2. **Router launch model** — confirm the graph-native launch chain launches
   `/align-tactics` workers on Sonnet (the Shape B orchestrator default),
   `tactic-graph-router-selector` no longer forcing the whole align-family
   session to Opus.
3. **`/align-strategy` SKILL.md** — set `model: opus` in frontmatter. Confirm
   whether a `model:` field on a `user-invocable` main-loop skill actually
   switches the *interactive session* model (confirmed for `context: fork`
   skills such as `commit-merge-push`; unconfirmed for user-invocable main-loop
   skills). If not honored, the interactive path stays an
   intended-not-guaranteed default backed by measurement.
4. **Verify** via the token-audit by-node/by-phase attribution (the strategy's
   `token-economy` sensor) that `/align-tactics` orchestration ran on Sonnet
   while its plan-creation subagent ran on Opus.

## Boundary

The align-family floor is deprecated (clarification 10) — there is no
per-phase demotion exemption here. The audit-driven policy loop is advisory and
author-gated for all routing; that actuator-side mechanism lives on
`tactic-audit-routing-advisory-gate`, not this node.
