---
id: tactic-rsi-round-trips-lens-carrier
kind: tactic
statement: Re-tag the phase_standup lens any-scope and make
  lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips the named
  carrier for /rsi's unnecessary-round-trips lens, so the per-phase evaluator
  reads the field the instrument already computes
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-08-14 /align round on lens carriers. This is
  the small, immediately-shippable half of that round's finding and must not
  wait on the catalog decomposition: aggregate-usage.sh already computes the
  number that would have caught an 830-second orchestration overhead, and only a
  mis-scoped tag plus a missing carrier reference keep the per-phase evaluator
  from reading it. Serves both strategies honestly — the evaluator surface is
  strategy-recursive-self-improvement's, while the phase_standup lens itself is
  strategy-token-economy clarification 12's artifact."
reading: null
serves:
  - strategy-recursive-self-improvement
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
# Re-tag the phase_standup lens any-scope and make lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips the named carrier for /rsi's unnecessary-round-trips lens, so the per-phase evaluator reads the field the instrument already computes

## What is wrong

`aggregate-usage.sh` already computes the figure that detects orchestration
overhead at phase boot:

```
lenses.phase_standup.<phase>.boot_preamble.scriptable_round_trips
```

Computed at `.claude/skills/rsi-audit/scripts/aggregate-usage.sh:1254-1345`
as the median leading consecutive run of "scriptable" (mechanical) tool calls
per qualifying worker session. Its own docstring states the expected values:
**qa ~6-7, review ~3-4**.

Two edits keep the per-phase evaluator from reading it:

1. `.claude/skills/rsi-audit/SKILL.md:131` tags lens 10 (per-phase standup
   cost) **`[fleet-only]`**.
2. `.claude/skills/rsi/SKILL.md:88-146` (Step 2) instructs the scoped caller to
   skip fleet-only figures and explicitly not to re-litigate the tagging; and
   `.claude/skills/rsi/SKILL.md:184-186` (lens 2, unnecessary round trips)
   names no carrier field at all.

## Why the fleet-only tag is wrong for this field

The carve-out on `strategy-recursive-self-improvement`'s `/rsi-audit`
condition reads "pooled outcome rates, medians, cross-session recurrence" —
tagging every median fleet-only. `scriptable_round_trips` is a median of **raw
per-session counts**, not of rates. At n=1 it degenerates to that single
worker's own leading mechanical-call run, which is exactly the meaningful
number. Contrast `lenses.baseline_context.median_boot_tokens`, which is
genuinely a fleet distribution figure.

It is also computed over the **whole scoped document**, not the
`started_at`-filtered subset `/rsi` Step 2 builds — so reading it sidesteps
`eval-since-bound-excludes-worker` (recurrence 5, the ledger's highest), which
otherwise drops the orchestrator session row where this overhead lives.

## Evidence it would have fired

Review phase of `tactic-attention-namespaced-rank`, 2026-08-13, PR #3075,
`elapsed_s=1026`. Step 1 opened with 15 Bash calls and invoked
`dispatch-derive-node-target` three times (sandbox-denied, override, then again
merely to re-extract `PR_NUM`). Against a documented expectation of ~3-4, that
is a visibly wrong number available without reading a single transcript.

## Scope

- `.claude/skills/rsi-audit/SKILL.md:131` — retag lens 10 `[any-scope]`, with a
  one-line note on the discriminator (median *of what*, not the word "median").
  Lens 9 (`baseline_context`) stays `[fleet-only]` — check each remaining
  median-bearing lens against the same test rather than retagging in bulk.
- `.claude/skills/rsi/SKILL.md:184-186` — lens 2 names the carrier field and
  the expected values, so a reader can tell a normal boot from a bloated one.
- `.claude/skills/rsi/SKILL.md:88-146` — Step 2's "skip fleet-only" instruction
  stays, but must not read as forbidding a lens whose own entry names a field.

**Out of scope:** the `--since` bound defect itself (own ledger entry,
recurrence 5) and the per-lens skill decomposition
(`tactic-rsi-lens-catalog-decomposition`). This tactic is deliberately the
small half and must not be blocked on the large one.

## Verification

`scriptable_round_trips` is populated and non-degenerate at `--node` scope:

```
.claude/skills/rsi-audit/scripts/aggregate-usage.sh \
  --node tactic-attention-namespaced-rank --json-out /tmp/claude/rt/probe.json
jq '.lenses.phase_standup.review.boot_preamble
    | {sessions, scriptable_round_trips, judgment_calls}' /tmp/claude/rt/probe.json
```

Expect a non-null `scriptable_round_trips` well above the documented ~3-4 for
this node's review sessions. A `sessions: 0` result means the phase→skill
`by_skill` filter did not match and the retag alone is not sufficient — record
that rather than working around it.
