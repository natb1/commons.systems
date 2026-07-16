---
id: tactic-thin-oversized-skill-bodies
kind: tactic
statement: Thin phase-orchestrator SKILL bodies to Claude Code's 500-line cap
  plus on-demand references (qa-fix 1,523 and review-fix 1,088 first)
owner: ai
status: raw
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
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Thin phase-orchestrator SKILL bodies to Claude Code's 500-line cap plus on-demand references (qa-fix 1,523 and review-fix 1,088 first)

Surfaced in the /align-strategy standup-cost round ([[strategy-token-economy]]
clarification 12, 2026-07-16 interview). SKILL-body facet of the standup-cost
lever; gated on [[tactic-phase-standup-audit-lens]] (measure the per-skill body
contribution before choosing cut depth).

Confirmed against the Claude Code skills docs this round: the full SKILL.md
loads on invocation and persists all session, and the official guidance is
"Keep SKILL.md under 500 lines — move detailed reference material to separate
files"; moving prose into `references/*.md` (loaded only when the model Reads
them) genuinely cuts per-invocation cost. This is the standard pattern available
today, not a harness change. Over-cap skills: qa-fix 1,523 (1,023 over),
review-fix 1,088 (588 over), then align-init 749, plan-issue 691, file-issue
616, align-tactics 557, align-strategy 548. **Parity gate:** thinning must hold
phase-success parity (dropped instruction regresses the phase invisibly), and
references must be linked from SKILL.md so the model loads them on demand.
