---
id: tactic-token-audit-whole-session-phase-attribution
kind: tactic
statement: Token-audit phase attribution covers a phase worker's whole session,
  not only its skill-framed turns
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-31 review-fix token audit interview.
  Condition 2 of strategy-token-economy requires every session be attributable
  to a node and phase; measured, 2,241 of 2,992 turns (75%) across 19
  review-worker sessions fell to the <none> bucket, understating review-fix at
  $614 phase-tagged against $754 true. See clarification 23 on
  strategy-token-economy.
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 20
  override: null
  rationale: "Author-directed 2026-08-03: prioritize progression of
    token-efficiency work ahead of bug-fix work and ahead of the undecomposed
    baseline. Matches the boost 20 already carried by the review-phase
    token-cost cluster (tactic-review-skill-body-decomposition and its
    siblings). Simulated over the live store before writing: 0 tier changes,
    0 value drift onto non-target nodes, resolves to 20.00."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Token-audit phase attribution covers a phase worker's whole session, not only its skill-framed turns

## Context

Condition 2 of strategy-token-economy: "the token audit stays runnable and
attributable across the router migration — a session that cannot be attributed
to a node and phase is invisible to every control loop here." Measured
2026-07-31, that condition is breached.

Per-turn phase attribution comes from the harness-supplied `attributionSkill`
field, read at `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh:298`:

```
skill: ((.attributionSkill // "<none>") | gsub("\t"; "_") | .[0:64]),
```

Turns with no `attributionSkill` fall to `<none>`. Across 19 review-worker
sessions in the 2026-07-27 to 07-31 window: **2,241 of 2,992 assistant turns
(75%) carried no value.** The pattern is positional, not random — attribution
covers a session's OPENING turns and then stops. One session measured 26
`review-fix` turns followed by 105 consecutive `<none>` turns; only one short
session (51 turns) was fully tagged.

Consequence: review-fix measured **$614 phase-tagged against $754 true** (the
difference being the untagged skill-body work — the bash preamble, inline
scans, commit-merge-push, follow-up filing, and the PR comment). Pooled across
all phases, `<none>` was the single largest line in the window at $1,319 real
/ $2,214 proxy — larger than any named phase.

## Scope

- `.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`. The
  session-type classifier (lines 308-320) ALREADY identifies these sessions
  correctly as `worker` by matching the first user message against
  `<command-name>/(...|review-fix|...)</command-name>`. That signal is
  reliable and is not the defect.
- The defect is that `by_skill` (lines 328-335) rolls up per-turn
  `attributionSkill` only. For a session the classifier has already typed as
  a single-phase `worker`, attribute the WHOLE session to that phase rather
  than only its skill-framed turns.
- Preserve the existing behavior for genuinely multi-phase sessions and for
  `subagent` transcripts, which are attributed correctly today.
- Out of scope: changing the harness's `attributionSkill` emission — this is
  a consumer-side fix in the audit script.

## Dependency note

Per author ruling 2026-07-31, this does NOT gate the model-routing decisions
recorded the same day (tactic-review-domain-lens-consolidation,
tactic-review-verify-per-file-batching). The per-lens yield metrics that
grounded those decisions came from workflow SUBAGENT transcripts, which are
fully attributed; the blind portion is the parent session only.

## Interaction to watch

tactic-review-skill-body-decomposition moves terminal actions out of the
parent session and into subagents. That changes WHERE this work is measured.
Sequence the two so the attribution fix is evaluated against a known session
shape, or re-baseline after both land.

## Verification

- Re-run `aggregate-usage.sh --days 4`; the `<none>` bucket drops materially
  and `review-fix` rises toward its measured $754 true cost.
- A single-phase worker session's `phases` map contains exactly one key.
