---
id: tactic-review-domain-lens-consolidation
kind: tactic
statement: Fold the secrets, auth, and data-exposure review lenses into one Opus
  sweep agent carrying all three briefs as sections
owner: ai
status: raw
parent: null
rationale: Surfaced by the 2026-07-31 review-fix token audit interview. Measured
  $41.55 across three separate Opus agents for 2 confirmed findings, each
  re-reading the same diff. Author approved the fold and explicitly retained
  Opus, declining an unevidenced Sonnet demotion (condition 3 routing approval).
  See clarification 16 on strategy-token-economy.
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
# Fold the secrets, auth, and data-exposure review lenses into one Opus sweep agent carrying all three briefs as sections

## Context

Measured over 18 review-fix runs, 2026-07-27 to 2026-07-31:

| lens | agents | draw | findings | upheld | avg peak ctx |
|---|---|---|---|---|---|
| `secrets` | 16 | $22.60 | 5 | 2 | 63,542 |
| `auth` | 5 | $10.19 | 5 | 0 | 73,613 |
| `data-exposure` | 5 | $8.76 | 4 | 0 reached verify | 67,089 |

$41.55 across three separate Opus agents for 2 confirmed findings. Each agent
independently re-reads the same diff — that repeated context derivation, not
the lens content, is the waste.

These lenses DO surface findings `/security-review` misses, but that test is
nearly vacuous: `/security-review` produced **1 finding across all 18 runs**.

## Scope

- `.claude/workflows/review-fix.js`, `finderPrompt` lines 513-517 and the
  `DOMAIN_PROMPTS` map. Replace three `agent()` launches with one whose
  prompt carries all three domain briefs as labelled sections.
- Each finding must still set its own `Source` (`secrets`, `auth`, or
  `data-exposure`) so per-lens yield stays measurable in the audit — do NOT
  collapse them to a single source name, or this decision becomes
  unauditable next window.
- Preserve every brief verbatim. The saving is one diff read instead of
  three, not a shorter checklist.
- `red-team` and `input-validation` are NOT part of this fold — they carry
  the security signal (27 confirmed findings between them) and stay as
  separate lenses.

## Model tier — author ruling

Author approved the fold and explicitly RETAINED Opus on 2026-07-31,
declining a Sonnet demotion. Rationale recorded: there is no evidence on
Sonnet's detection quality for these lenses — no Sonnet arm has ever run —
and a lens that quietly stops finding things is indistinguishable from a
clean diff. Condition 3 of strategy-token-economy requires routing changes be
grounded in verified yield metrics and explicitly approved; an unevidenced
demotion meets neither bar. If a tier change is wanted later, it needs a
measured A/B on the same diffs, not an assumption.

## Verification

- Per-lens `Source` attribution still resolves in the audit's per-lens yield
  join after the fold.
- Combined confirmed-finding count does not fall below the 2-per-window
  baseline.
