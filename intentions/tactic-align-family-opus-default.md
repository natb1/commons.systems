---
id: tactic-align-family-opus-default
kind: tactic
statement: Split /align-tactics model routing (Sonnet orchestrator + Opus
  decompose/plan subagent); keep /align-strategy whole-session Opus
owner: ai
status: codified
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
phase: qa
execution:
  branch: tactic-align-family-opus-default
  pr: 2886
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    /qa-fix: scope-deviation on an opus-fixable QA finding, requiring human
    ratification.


    QA item 7 ("Accuracy of the model:opus-honoring-unconfirmed claim" added to

    align-strategy/SKILL.md by this PR) was disposed opus-fixable by the
    disposition

    classifier (2/2 skeptics refuted the needs-human framing, arguing it reduces
    to

    a mechanical fidelity check against the already-recorded
    strategy-token-economy

    clarification 10). The gated fix-planner then examined it and found NO
    in-scope

    code change resolves it — the prose already matches acceptance-criteria Unit
    2

    verbatim (align-strategy/SKILL.md:10-21) — and raised deviation:true with
    zero

    fix units rather than fabricate a change. This is the qa-fix scope-deviation

    escape path (permanent escalation, not a retry): a human needs to ratify

    whether this PR's added enforcement-note prose is an accurate
    characterization

    of the harness's model:-field honoring behavior.


    Separately, needs-main item 8 (deferred /dispatch-token-audit attribution

    check) was already filed as a needs-main residue section directly in the

    tactic's own body (intentions/tactic-align-family-opus-default.md, commit

    b334d6d2) per the node-lane Step 3.6 override — not part of this escalation,

    it rides toward main-qa on a future completion pass.


    Full QA summary: PR #2886 comment (marker <!-- dispatch:qa-summary -->,

    comment id 5013068750).
  since: 2026-07-18
  recommendation: >-
    Read the PR #2886 diff (align-strategy/SKILL.md:10-21 and
    align-tactics/SKILL.md

    Step 3) alongside strategy-token-economy clarification 10 (2026-07-16).
    Decide

    whether the added align-strategy enforcement note — "model: field honoring
    is

    confirmed for context:fork skills but unconfirmed for user-invocable
    main-loop

    skills, so treated as intended-not-guaranteed, checked after the fact via

    /dispatch-token-audit" — is an accurate characterization to ratify as-is.


    If it holds: mark item 7 resolved (no code change needed) and clear the

    office-hours park so the PR can proceed to a clean qa pass and merge.


    If it needs correction: the fix is a prose edit to

    .claude/skills/align-strategy/SKILL.md's enforcement note (around lines
    10-21)

    — either strengthen/soften the "unconfirmed" hedge or correct the described

    enforcement mechanism, then re-run /qa-fix.


    Item 8 (dispatch-token-audit attribution) needs no action now — it's already

    recorded as needs-main residue on the node body and will surface again at

    main-qa after this PR merges.
pace_exempt: false
rounds: null
attributes: {}
---

# Split /align-tactics model routing (Sonnet orchestrator + Opus decompose/plan subagent); keep /align-strategy whole-session Opus

> **Migration note (2026-07-18, `strategy-token-economy` clarification 14):** this
> is **increment 1** of a two-step brownfield migration, not the greenfield end
> state. It adds `model: opus` to `/align-tactics`' existing caller-thread
> Explore/Plan subagents — a correct but interim subset. The greenfield target is
> `/align-tactics` executing as a deterministic Workflow
> (`.claude/workflows/align-tactics.js`, /review-fix-shaped: Sonnet orchestrator,
> Opus decision subagents, Sonnet gathering subagents), carried by **increment 2**,
> `tactic-align-tactics-workflow` (which is `blocked_by` this node so it sequences
> after #2886 merges). Keep this PR's scope as-is — the Workflow rearchitecture is
> increment 2's job, not this one's.

## Context

`strategy-token-economy` clarification 10 (2026-07-16) resolves the align-family
model routing: `/align-tactics` no longer runs whole-session on Opus. Its
orchestration — node-id reservation, park-field writes, the clause-coverage walk,
`graph-commit` — runs on a **Sonnet** orchestrator; both high-stakes cognitive
acts (the decompose-to-signal judgment and each claude-eligible tactic's
plan-body authoring) are delegated to an **Opus** subagent. This conforms
`/align-tactics` to the Shape B standing default (clarification 9: Sonnet
orchestrator, Opus subagents where the work calls for it) and matches the
`dispatch-phase-model` design invariant (#2872: the phase orchestrator is always
Sonnet, Opus tiering lives at the subagent layer). `/align-strategy` is
unchanged — interactive-only, its interview dialectic IS the audit and is
non-delegable, so it stays whole-session Opus.

**Motivating bug:** router-launched `/align-tactics` workers were authoring tactic
plans on Sonnet — the worker launches on Sonnet and its `Plan` subagent inherits
that model, so the highest-stakes-to-signal act (defining the tactic nodes) ran
cheap.

**Already in place (confirm-only, do not re-implement):** the graph-native launch
chain already launches the `/align-tactics` worker on Sonnet —
`dispatch-graph-execute:98` hardcodes `ORCH_MODEL="sonnet"` and the strategy lane
spawns with `--model "$ORCH_MODEL"` (`dispatch-graph-execute:148-151`). So the
orchestrator-Sonnet half is done. The residual is the **Opus decompose/plan
subagent** inside the skill plus the `/align-strategy` frontmatter.

Off the success-signal path (no `validates`; priority is the author's boost 8, at
the skill-edit tier).

## Unit 1 — make align-tactics Step 3's decompose/plan subagent explicitly Opus

**Recommended model:** opus

Scope:
- `.claude/skills/align-tactics/SKILL.md` Step 3 (the Explore/Plan fan-out,
  around lines 294–345): the `Plan`/decompose subagent(s) are launched today with
  **no explicit model**, so they inherit the Sonnet orchestrator session — the
  exact bug. Change Step 3 to launch the decompose-to-signal / plan-authoring
  subagent with an explicit `model: opus` (Agent/Task `model` param), independent
  of the orchestrator session's model. The `Explore` reuse-hunt fan-out stays
  demotable to Sonnet or Haiku (clarification 10 / clarification 4).
- Also make explicit in Step 3 (and, if needed, Step 1's two-sided drift review)
  that the **decompose-to-signal judgment itself** — deciding which tactic nodes
  exist — is the Opus subagent's work, and the Sonnet orchestrator does not
  itself rewrite plan substance; it authors the node body from the subagent's
  output. Do **not** pin the `/align-tactics` session to Opus in frontmatter — the
  orchestrator is meant to run Sonnet.

Reuse:
- The existing Step 3 Explore/Plan fan-out structure — this is a targeted `model`
  addition to the `Plan`/decompose launch, not a rewrite.
- `dispatch-graph-execute:98,148-151` (`ORCH_MODEL="sonnet"`) — confirm the
  worker launch already runs Sonnet; this unit only needs the in-skill subagent
  to opt up to Opus.

## Unit 2 — set /align-strategy to model: opus in frontmatter

**Recommended model:** sonnet

Scope:
- `.claude/skills/align-strategy/SKILL.md` frontmatter: add `model: opus`.
  `/align-strategy` is interactive-only (no dispatch launch path) and its
  interview dialectic is non-delegable, so it stays whole-session Opus.
- Enforcement is intended-default-plus-measurement, not a hard guarantee: a
  `model:` field is confirmed honored for `context: fork` skills but unconfirmed
  for `user-invocable` main-loop skills (`align-strategy` is
  `user-invocable: true`). Record in the change that if the harness does not honor
  it on the interactive path, the default stays intended-not-guaranteed, backed by
  the token audit's by-node/by-phase attribution (this strategy's `token-economy`
  sensor) reading whether the session actually ran on Opus after the fact.

Dependencies: none (independent of Unit 1; different file).

## Verification

Auto-runnable static check that the skill frontmatter/Step-3 edits landed:

```verify
grep -q '^model: opus' .claude/skills/align-strategy/SKILL.md && echo align-strategy-opus-OK
```

```verify
grep -qiE 'model:\s*opus' .claude/skills/align-tactics/SKILL.md && echo align-tactics-step3-opus-OK
```

Manual / observe-in-production (the real verification is behavioral, per the
strategy's after-the-fact-attribution model): after a router-launched
`/align-tactics` round runs, use the `/dispatch-token-audit` by-node/by-phase
attribution to confirm the `/align-tactics` orchestration ran on **Sonnet** while
its plan-creation subagent ran on **Opus**, and that `/align-strategy` sessions
ran on Opus. Confirm `dispatch-graph-execute` still launches `/align-tactics` on
Sonnet (`ORCH_MODEL`), i.e. the router is not forcing the whole align-family
session to Opus.

## needs-main residue

- **8. Deferred behavioral verification via `/dispatch-token-audit` attribution**
  - URL path: current
  - Expected outcome: post-run token attribution shows the intended
    Sonnet-orchestrator / Opus-subagent split; `dispatch-graph-execute` does not
    force the whole align-family session onto Opus.
  - Finding: this node's own "Manual / observe-in-production" section explicitly
    defers this check to after-the-fact `/dispatch-token-audit` by-node/by-phase
    attribution, measured after a real router-launched `/align-tactics` round
    runs post-merge — not assertable at QA time on a skill-markdown-only diff.
    (`qa-fix` disposition: `needs-main`, `planned_deferral: true`; route: human —
    the token-audit read is not a public-prod Chrome-observable check, so it
    does not qualify for the autonomous `/qa-main` lane.)
