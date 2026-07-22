---
id: tactic-thin-oversized-skill-bodies
kind: tactic
statement: Thin phase-orchestrator SKILL bodies to Claude Code's 500-line cap
  plus on-demand references (qa-fix 1,523 and review-fix 1,088 first)
owner: ai
status: codified
parent: null
rationale: "SKILL-body facet of the standup-cost lever (strategy-token-economy
  clarification 12). The harness loads the full SKILL.md on invocation and it
  persists all session; Claude Code's own guidance caps SKILL.md at 500 lines
  with detail in on-demand reference files, and seven repo skills exceed it —
  qa-fix 1,523 (1,023 over) and review-fix 1,088 (588 over) worst. Move fixed
  procedure that the orchestrator does not need up front into references/*.md
  loaded only when read, keeping args-computation and mechanical bookends in the
  body. Parity-gated: measured by tactic-phase-standup-audit-lens, and thinning
  must hold phase-success parity (dropped instruction regresses the phase
  invisibly), with references linked from SKILL.md so the model loads them on
  demand. Per-skill cut depth is gated on the lens's findings, so this is a raw
  draft, not committed work."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 15
  override: null
  rationale: "Author-directed 2026-07-16: top-rank the three token-economy
    standup-cost tactics above the working frontier (below the main-health
    sentinel at 100, which the write-path guard reserves).
    strategy-token-economy carries no strategy-level boost, so the tactic
    carries the full weight itself; boost 15 clears the current working max
    (~14.5)."
phase: qa
execution:
  branch: tactic-thin-oversized-skill-bodies
  pr: 2927
  attempts: {}
  markers:
    - planned
  strategy_fingerprint: null
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---

# Thin phase-orchestrator SKILL bodies to Claude Code's 500-line cap plus on-demand references (qa-fix 1,523 and review-fix 1,088 first)

## Context

`strategy-token-economy` clarification 12 (2026-07-16), SKILL-body facet of the
standup-cost lever. The harness loads a skill's full `SKILL.md` on invocation and
holds it for the whole session. Claude Code's own guidance caps `SKILL.md` at
500 lines with detail moved to on-demand `references/*.md` files loaded only when
the model Reads them — the standard, available-today pattern, not a harness
change (confirmed against the Claude Code skills docs in the clarification-12
round). Over-cap phase-orchestrator skills, worst first: `qa-fix` **1,523**
(1,023 over), `review-fix` **1,088** (588 over); then `align-init` 749,
`plan-issue` 691, `file-issue` 616, `align-tactics` 557, `align-strategy` 548.

Moving fixed procedure the orchestrator does not need up front into
`references/*.md` cuts the per-invocation body-token cost every session pays.
This is a throughput lever (off the success-signal path — no `validates`;
priority is the author's boost 15).

**Two binding guardrails from clarification 12:**
- **Parity gate.** Thinning must hold phase-success parity — a dropped
  instruction regresses the phase invisibly. Every reference file must be
  **linked from `SKILL.md`** so the model loads it on demand; nothing is deleted,
  only relocated behind an explicit in-body pointer.
- **Measure-first.** Per-skill cut depth is gated on
  `tactic-phase-standup-audit-lens`'s per-phase body-token findings — hence
  `blocked_by: [tactic-phase-standup-audit-lens]`. Read the lens's before-figure
  for each skill, cut, then confirm the after-figure dropped.

Scope boundary: this tactic thins **only** `qa-fix` and `review-fix` (the two
worst over-cap orchestrators). The remaining five over-cap skills are out of
scope for this round — record them as follow-up if the pattern proves out; do
not sweep them here.

## Unit 1 — thin qa-fix/SKILL.md to under 500 lines

**Recommended model:** opus

`qa-fix` is judgment-heavy to thin safely: its body carries the disposition
triage, the machine-verifiable-check procedure, the bounded auto-fix lane, and
the office-hours escalation contract — relocating the wrong section silently
regresses QA.

Scope:
- `.claude/skills/qa-fix/SKILL.md`: identify the fixed procedure the orchestrator
  does **not** need in-context up front (detailed step-by-step subroutines,
  reference tables, worked examples) and move it into
  `.claude/skills/qa-fix/references/*.md` (new dir — none exists today). Keep in
  the body: args-computation, the phase's decision structure, the mechanical
  bookends, and an explicit linked pointer to each reference file
  (`See references/<name>.md`) at the point the orchestrator would need it.
- Target: body under 500 lines. Do not cut instruction content — relocate it
  behind a linked pointer so the model Reads it on demand.
- Preserve every behavioral contract: the disposition classes, the
  attempt-capped auto-fix loop, the `dispatch:qa-done` gate, and the
  office-hours escalation path must remain reachable (in body or via a linked
  reference the body points to).

Dependencies: gated on the audit lens (frontmatter `blocked_by`). Read the
lens's `qa-fix` body-token baseline before cutting.

Reuse:
- The `references/*.md` on-demand pattern is Claude Code standard; mirror any
  existing repo skill that already splits body/references if one lands by
  implementation time.

## Unit 2 — thin review-fix/SKILL.md to under 500 lines

**Recommended model:** opus

Scope:
- `.claude/skills/review-fix/SKILL.md`: same relocation — move fixed
  finder/classifier/verify/fix-fan-out reference detail into
  `.claude/skills/review-fix/references/*.md`, keeping the orchestration
  structure, args-computation, and linked pointers in the body. Target under 500
  lines.
- Preserve the full `/review-fix` fan-out contract (surface-conditional finders,
  dedup, classify, adversarial-verify, Opus fix fan-out, follow-up filing) —
  relocate detail, never drop a stage.

Dependencies: gated on the audit lens (frontmatter `blocked_by`); independent of
Unit 1 (different file).

## Verification

Auto-runnable line-count check (each body under the 500-line cap):

```verify
awk 'END{exit (NR<=500)?0:1}' .claude/skills/qa-fix/SKILL.md
```

```verify
awk 'END{exit (NR<=500)?0:1}' .claude/skills/review-fix/SKILL.md
```

Parity (manual, the binding guardrail): confirm no instruction content was
deleted — every relocated section lives in a `references/*.md` file that the
body links with an explicit `See references/<name>.md` pointer at its point of
need. Re-run `/dispatch-token-audit` and confirm the standup-cost lens shows the
`qa-fix` and `review-fix` per-invocation body-token figures dropped versus the
pre-thinning baseline. Phase-success parity is observed in production: the next
`qa`/`review` phase runs on a real PR must complete their full contracts with no
regression — a dropped instruction regresses the phase invisibly, so watch the
first post-thinning runs.
